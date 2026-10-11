import { describe, expect, it, vi } from 'vitest';
const mocked = vi.hoisted(() => ({ current: vi.fn() }));
vi.mock('@/core/db/client', () => ({ db: {} }));
vi.mock('@/core/modules/access', () => ({ assertModuleEnabled: mocked.current }));
vi.mock('@/core/studio/fields/runtime-authority', () => ({ nativeFieldMutationSessionInTransaction: mocked.current }));
import type { ContractMetadata } from '@/core/studio/registry/types';
import { CapabilityRegistry } from '@/core/studio/registry/registry';
import { pageApprovalsSchema } from '@/core/studio/pages/approvals';
import { compilePage } from '@/core/studio/pages/compiler';
import { salesStudioContract } from '@/modules/sales/services/studio';
import { salesOrderPageContract, salesOrderPagePolicy } from '@/modules/sales/services/studio-pages';
import { createSalesOrderPagePresets } from '@/modules/sales/services/studio-page-presets';

// Actual registered owner/query metadata produces labelled unit approvals here.
// They are NOT authenticated publication approvals or runtime preview data.
const reference = ({ id, version, schemaHash, contractHash }: ContractMetadata) => ({ id, version, schemaHash, contractHash });
const approval = (metadata: ContractMetadata) => ({ ...reference(metadata), ownerModuleId: metadata.ownerModuleId, kind: metadata.kind,
  classification: metadata.classification, capability: metadata.capability });
function approved() {
  const registry = new CapabilityRegistry(async () => true);
  registry.register('sales', { contributions: [...salesStudioContract.contributions, ...salesOrderPageContract.contributions] });
  const entity = registry.describe('sales.order', 1), sourcePage = registry.describe('sales.order.page', 1), header = registry.describe('sales.order.page.header', 1);
  const fields = entity.details.fields as Array<{ id: string; label: string; classification: string }>;
  const columns = salesOrderPagePolicy.queries.find(q => q.query.id === header.id)!.columns;
  const approvals = pageApprovalsSchema.parse({ entity: approval(entity), sourcePage: approval(sourcePage), variants: false, fieldSourceVersions: [],
    nativeFields: fields.map(field => ({ id: field.id, label: field.label, classification: field.classification, editable: false, query: reference(header),
      ...(columns.find(column => column.id === field.id)?.format ? { format: columns.find(column => column.id === field.id)!.format } : {}) })),
    customFields: [], facts: [], contracts: [],
    queries: salesOrderPagePolicy.queries.map(q => ({ ...approval(registry.describe(q.query.id, 1)), sourceEntityId: entity.id, purpose: q.purpose,
      pagination: q.purpose === 'fact' ? 'none' : 'cursor', maxCardinality: q.purpose === 'fact' ? 1 : 50, costClass: q.purpose === 'fact' ? 'low' : 'medium', columns: q.columns.map(({ id, label, classification, capability, format }) => ({ id, label, classification, ...(capability ? { capability } : {}), ...(format ? { format } : {}) })) })),
    commands: salesOrderPagePolicy.commands.map(command => ({ ...approval(registry.describe(command.command.id, 1)), sourceEntityId: entity.id,
      confirmation: command.confirmation, previewQuery: null, formFactors: command.formFactors })), metrics: [], surfaces: [], maxQueryCost: 12 });
  return { registry, approvals };
}
describe('pure approved Sales editor presets', () => {
  it('creates friendly full-screen layouts and compiles every preset against exact actual owner metadata without reads/actions', () => {
    const { approvals } = approved(), original = structuredClone(approvals), presets = createSalesOrderPagePresets(approvals);
    expect(presets.map(preset => preset.name)).toEqual(['Sales order', 'Delivery focus', 'Sales orders']);
    expect(presets.map(preset => preset.scope)).toEqual(['record', 'record', 'list']);
    expect(approvals).toEqual(original); expect(mocked.current).not.toHaveBeenCalled();
    for (const preset of presets) {
      const compiled = compilePage(preset.page, approvals);
      expect(compiled.accessMode).toBe('ordinary_read'); expect(compiled.variants).toEqual([]);
      expect(preset.page.entity).toEqual({ id: approvals.entity.id, version: 1, schemaHash: approvals.entity.schemaHash, contractHash: approvals.entity.contractHash });
      expect(compiled.dependencies.some(dependency => dependency.id === 'sales.order.page')).toBe(true);
      expect(compiled.base.queryCost).toBeLessThanOrEqual(12);
      expect(preset.page.sections.every(section => section.columns.phone === 1 && section.formFactors.includes('phone'))).toBe(true);
    }
  });
  it('uses customer names, approved read-only fields and narrow exact line columns; no ID entry or invented variants', () => {
    const { approvals } = approved();
    for (const preset of createSalesOrderPagePresets(approvals)) for (const section of preset.page.sections) for (const component of section.components) {
      if (component.type === 'fields') for (const field of component.fields) {
        expect(field.source).toBe('native'); expect(field.mode).toBe('read');
        if (field.source === 'native') expect(field.fieldId).not.toBe('customer_id');
      }
      if (component.type === 'queryList') {
        expect(component.query.id).toMatch(/^sales\.order\.page\.(lines|list)$/);
        const owner = salesOrderPagePolicy.queries.find(query => query.query.id === component.query.id)!;
        expect(component.columns.every(id => owner.columns.some(column => column.id === id))).toBe(true);
        expect(component.pageSize).toBeLessThanOrEqual(50); expect(component.columns.length).toBeLessThanOrEqual(12);
      }
    }
    const delivery = createSalesOrderPagePresets(approvals)[1];
    expect(JSON.stringify(delivery.page)).toContain('promised_delivery_date'); expect(JSON.stringify(delivery.page)).toContain('cancelled_quantity');
  });
  it('keeps money currency in the owning complete projection and uses current exact query/command hashes', () => {
    const { registry, approvals } = approved();
    for (const preset of createSalesOrderPagePresets(approvals)) for (const component of preset.page.sections.flatMap(section => section.components)) {
      if (component.type !== 'queryList' && component.type !== 'action') continue;
      const reference = component.type === 'queryList' ? component.query : component.command, metadata = registry.describe(reference.id, reference.version);
      expect(reference).toMatchObject({ schemaHash: metadata.schemaHash, contractHash: metadata.contractHash });
      if (component.type === 'queryList') for (const id of component.columns) {
        const query = salesOrderPagePolicy.queries.find(query => query.query.id === component.query.id)!, column = query.columns.find(column => column.id === id)!;
        if (column.format) expect(query.columns.find(value => value.id === column.format!.currencyColumnId)).toMatchObject({ id: 'currency', valueType: 'string', nullable: false });
      }
      else expect(component).toMatchObject({ label: 'Preview acknowledgement', collectInput: 'owner_schema', preview: false, icon: 'document' });
    }
  });
  it('omits unsupported optional acknowledgement rather than offering a dead or unapproved action', () => {
    const { approvals } = approved(); approvals.commands = [];
    const presets = createSalesOrderPagePresets(approvals);
    expect(presets.every(preset => preset.page.sections.every(section => section.components.every(component => component.type !== 'action')))).toBe(true);
  });
  it('fails closed for wrong owner/entity/version, variants and missing native/query approvals without trimming the layout', () => {
    const original = approved().approvals;
    for (const mutate of [
      (value: typeof original) => { value.entity.id = 'tickets.ticket'; },
      (value: typeof original) => { value.sourcePage.version = 2; },
      (value: typeof original) => { value.sourcePage.ownerModuleId = 'other'; },
      (value: typeof original) => { value.variants = true; },
      (value: typeof original) => { value.nativeFields = value.nativeFields.filter(field => field.id !== 'customer_name'); },
      (value: typeof original) => { value.queries = value.queries.filter(query => query.id !== 'sales.order.page.lines'); },
      (value: typeof original) => { value.queries.find(query => query.id === 'sales.order.page.list')!.columns = []; },
    ]) { const value = structuredClone(original); mutate(value); expect(() => createSalesOrderPagePresets(value)).toThrow(); }
  });
  it('current compiler rejects stale preset hashes and attempted native editing instead of treating a preset as authority', () => {
    const { approvals } = approved(), preset = createSalesOrderPagePresets(approvals)[0];
    const drift = structuredClone(approvals); drift.queries.find(query => query.id === 'sales.order.page.lines')!.contractHash = 'f'.repeat(64);
    expect(() => compilePage(preset.page, drift)).toThrow();
    const edited = structuredClone(preset.page), component = edited.sections[0].components[0];
    if (component.type !== 'fields') throw new Error('Missing fields'); component.fields[0].mode = 'edit';
    expect(() => compilePage(edited, approvals)).toThrow();
  });
});
