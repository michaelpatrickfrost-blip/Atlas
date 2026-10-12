import { analyticsBusinessViewContract } from "@/modules/analytics/services/studio-view";
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import type { Prisma } from '@/generated/prisma/client';
const mocks = vi.hoisted(() => ({ membership: vi.fn(), refresh: vi.fn(), oldModule: vi.fn() }));
vi.mock('@/core/db/client', () => ({ db: { membership: { findUnique: mocks.membership } } }));
vi.mock('@/core/modules/access', () => ({ assertModuleEnabled: mocks.oldModule }));
vi.mock('@/core/studio/fields/runtime-authority', () => ({ nativeFieldMutationSessionInTransaction: mocks.refresh }));
import { sessionForUser, sessionAuthorityStamp, type Session } from '@/core/auth/session';
import { CapabilityRegistry } from '@/core/studio/registry/registry';
import { salesStudioContract } from '@/modules/sales/services/studio';
import { salesOrderPageContract, salesOrderPagePolicy, salesOrderMetricPagePolicy } from '@/modules/sales/services/studio-pages';
import { pageSource } from '@/core/studio/registry/page-contracts';
import { formatMoney } from '@/core/shared/money';
import { checksum } from '@/core/studio/registry/contracts';
import { reconstructPageApprovalsInTransaction } from '@/core/studio/pages/server-approvals';
import { compilePage } from '@/core/studio/pages/compiler';
import { resolvePageVariant } from '@/core/studio/pages/selection';
import { createPageDisplayModel, pageQueryKey } from '@/core/studio/pages/render-model';
import { PageRenderer } from '@/components/studio/page-renderer';

// Real opaque Session issuance, contract factories and registry/gateway. Current
// authority refresh and Prisma reads are explicit unit collaborators: this suite
// proves projection/ordering/scoping contracts, not SQL, SSI, live or PDF behavior.
const date = new Date('2026-10-11T01:02:03Z'), cap = 'sales.order.read';
const membership = (grants = [cap]) => ({ id: 'member', userId: 'actor', organisationId: 'company', sessionVersion: 2, active: true,
  grantedCapabilities: grants, deniedCapabilities: [] as string[], roles: [],
  user: { name: 'Actor', email: 'actor@example.invalid', authVersion: 3, platformAdmin: null },
  organisation: { id: 'company', name: 'Company', kind: 'CUSTOMER', status: 'ACTIVE', archivedAt: null, auditAccess: null, restrictedAccessAreas: [] } });
async function actor(grants = [cap]) { mocks.membership.mockResolvedValueOnce(membership(grants)); const result = await sessionForUser('company', 'actor'); if (!result) throw new Error('Missing actor'); return result; }
const header = (id = 'order') => ({ id, reference: 'SO-0001', commercialStatus: 'DRAFT', orderType: 'STANDARD', revision: 3, updatedAt: date,
  partyId: 'customer', party: { name: 'Example business', privateNotes: 'private' }, customerPoReference: null, externalReference: null,
  currency: 'GBP', netAmount: 0, taxAmount: 0, grossAmount: 0, orderDate: date, requestedDeliveryDate: null, promisedDeliveryDate: null,
  customerNotes: 'private', tags: ['private'] });
const line = (id = 'line', lineNumber = 1) => ({ id, lineNumber, type: 'NOTE', descriptionSnapshot: 'Item', unitOfMeasure: 'each',
  orderedQuantity: { toString: () => '0.125000' }, cancelledQuantity: { toString: () => '0' }, unitPriceAmount: 0, discountPercent: null,
  netAmount: 0, taxAmount: 0, invoiceWhenInStock: false, notes: 'private', product: { cost: 'private' } });
function setup() {
  const storage = { moduleState: { findFirst: vi.fn().mockResolvedValue({ id: 'sales' }) }, salesOrder: { findFirst: vi.fn().mockResolvedValue(header()), findMany: vi.fn().mockResolvedValue([header()]) },
    salesOrderLine: { findFirst: vi.fn().mockResolvedValue({ id: 'line', lineNumber: 1 }), findMany: vi.fn().mockResolvedValue([line()]) } };
  const transaction = storage as unknown as Prisma.TransactionClient, availability = vi.fn(async () => true), registry = new CapabilityRegistry(availability);
  registry.register('analytics', analyticsBusinessViewContract);
  registry.register('sales', { contributions: [...salesStudioContract.contributions, ...salesOrderPageContract.contributions] });
  const source = registry.describe('sales.order.page', 1), callbacks = salesOrderPageContract.contributions.at(-1)!.pageSource!;
  return { storage, transaction, availability, registry, source, callbacks };
}
const record = { kind: 'record' as const, recordId: 'order' };
const request = (kind: 'header' | 'list' | 'lines', pageSize = 50, cursor: Record<string, string | number> | null = null) => ({ query: { id: `sales.order.page.${kind}`, version: 1 }, pageSize, cursor });
beforeEach(() => { vi.resetAllMocks(); mocks.refresh.mockImplementation(async (session: Session) => ({ session })); });

describe('Sales ordinary-read page source', () => {
  it('registers descriptive read-only approvals and leaves every old Sales contract unchanged without reading data', () => {
    const fixture = setup(), baseline = new CapabilityRegistry(async () => true); baseline.register('sales', salesStudioContract);
    for (const contribution of salesStudioContract.contributions) expect(fixture.registry.describe(contribution.metadata.id, 1)).toEqual(baseline.describe(contribution.metadata.id, 1));
    const policy = fixture.registry.describePageSource(fixture.source).policy;
    expect(policy).toMatchObject({ entity: { id: 'sales.order', version: 1 }, accessMode: 'ordinary_read', variants: false, fieldSourceVersions: [], metrics: [], surfaces: [], facts: [] });
    expect(fixture.registry.describe('sales.order', 1).details.extensionPolicy).toEqual({ customFields: false, recordTypes: false, pageVariants: false });
    expect(policy.commands).toEqual([{ command: { id: 'sales.order.preview_acknowledgement', version: 1 }, confirmation: 'optional', previewQuery: null, formFactors: ['desktop', 'tablet', 'phone'] }]);
    expect(policy.queries.every(query => query.columns.every(column => Boolean(column.label)))).toBe(true);
    expect(mocks.refresh).not.toHaveBeenCalled(); expect(fixture.storage.salesOrder.findFirst).not.toHaveBeenCalled(); expect(mocks.oldModule).not.toHaveBeenCalled();
  });
  it('returns only approved labelled header columns using genuine current shared-transaction authority and canonical Party', async () => {
    const session = await actor(), f = setup(), result = await f.registry.invokePageRead({ session, transaction: f.transaction }, f.source, record, request('header'));
    expect(result.anchor).toEqual({ kind: 'record', organisationId: 'company', recordId: 'order', revision: `3@${date.toISOString()}`, nativeRevision: 3 });
    expect(result.output.rows[0].values).toMatchObject({ customer_name: 'Example business', gross_amount: 0, customer_po_reference: null, requested_delivery_date: null });
    expect(JSON.stringify(result)).not.toContain('private'); expect(mocks.oldModule).not.toHaveBeenCalled();
    expect(mocks.refresh).toHaveBeenCalledWith(session, f.transaction);
    expect(mocks.refresh.mock.invocationCallOrder[0]).toBeLessThan(f.storage.moduleState.findFirst.mock.invocationCallOrder[0]);
    expect(f.storage.moduleState.findFirst.mock.invocationCallOrder[0]).toBeLessThan(f.storage.salesOrder.findFirst.mock.invocationCallOrder[0]);
    const selected = f.storage.salesOrder.findFirst.mock.calls.find(([args]) => args.select.reference)?.[0];
    expect(selected).toMatchObject({ where: { AND: [{ AND: [{ organisationId: 'company' }, { party: { organisationId: 'company' } }] }, { id: 'order', revision: 3, updatedAt: date }] }, select: { party: { select: { name: true } } } });
    expect(selected.select.customerNotes).toBeUndefined(); expect(selected.select.tags).toBeUndefined();
  });
  it('declares exact same-projection currency metadata and retains minor units and explicit currency digits', async () => {
    const session = await actor(), f = setup();
    for (const approval of salesOrderPagePolicy.queries) for (const column of approval.columns.filter(c => c.format)) {
      expect(column.format).toEqual({ kind: 'money_minor', currencyColumnId: 'currency' });
      expect(approval.columns.find(c => c.id === 'currency')).toMatchObject({ valueType: 'string', nullable: false });
      expect(column.label).toBeTruthy();
    }
    f.storage.salesOrder.findFirst.mockResolvedValue({ ...header(), currency: 'KWD', grossAmount: 1234 });
    const { output } = await f.registry.invokePageRead({ session, transaction: f.transaction }, f.source, record, request('header'));
    expect(output.rows[0].values.gross_amount).toBe(1234); expect(formatMoney(1234, 'KWD')).toContain('1.234'); expect(formatMoney(1234, 'JPY')).toContain('1,234');
    expect(() => formatMoney(1234, 'ZZZ')).toThrow();
  });
  it('denies missing/copy authority or caller tenant/query overrides before any owning access', async () => {
    const session = await actor(), f = setup();
    for (const context of [{ session }, { session: { ...session } as Session, transaction: f.transaction }])
      await expect(f.registry.invokePageRead(context, f.source, record, request('header'))).rejects.toThrow('genuine');
    await expect(f.registry.invokePageRead({ session, transaction: f.transaction }, f.source, { ...record, organisationId: 'foreign' }, request('header'))).rejects.toThrow();
    await expect(f.registry.invokePageRead({ session, transaction: f.transaction }, f.source, record, { ...request('header'), orderId: 'foreign' })).rejects.toThrow();
    expect(mocks.refresh).not.toHaveBeenCalled(); expect(f.storage.salesOrder.findFirst).not.toHaveBeenCalled();
  });
  it('requires current native Read and current module after refresh, before protected rows', async () => {
    const original = await actor(), revoked = await actor([]), f = setup(); mocks.refresh.mockResolvedValue({ session: revoked });
    await expect(f.registry.invokePageRead({ session: original, transaction: f.transaction }, f.source, record, request('header'))).rejects.toThrow('FORBIDDEN');
    expect(f.storage.moduleState.findFirst).not.toHaveBeenCalled(); expect(f.storage.salesOrder.findFirst).not.toHaveBeenCalled();
    mocks.refresh.mockResolvedValue({ session: original }); f.storage.moduleState.findFirst.mockResolvedValue(null);
    await expect(f.registry.invokePageRead({ session: original, transaction: f.transaction }, f.source, record, request('header'))).rejects.toThrow('unavailable');
    expect(f.storage.salesOrder.findFirst).not.toHaveBeenCalled();
  });
  it('propagates stale/session-version refresh denial and refuses global-client fallback on direct query entry', async () => {
    const session = await actor(), f = setup(); mocks.refresh.mockRejectedValue(new Error('STALE_SESSION'));
    await expect(f.registry.invokePageRead({ session, transaction: f.transaction }, f.source, record, request('header'))).rejects.toThrow('STALE_SESSION');
    expect(f.storage.moduleState.findFirst).not.toHaveBeenCalled(); expect(f.storage.salesOrder.findFirst).not.toHaveBeenCalled();
    const query = salesOrderPageContract.contributions[0]; await expect(query.run!({ session }, { orderId: 'order', expectedRevision: 3, expectedUpdatedAt: date.toISOString() })).rejects.toThrow('transaction');
  });
  it('binds only the actual native anchor and denies foreign or timestamp/revision drift before line data', async () => {
    const session = await actor(), f = setup(), context = { session, transaction: f.transaction };
    const anchor = await f.callbacks.authoriseRead(context, record);
    expect(await f.callbacks.bindQueryInput(context, anchor, request('lines', 2))).toEqual({ orderId: 'order', expectedRevision: 3, expectedUpdatedAt: date.toISOString(), pageSize: 2, cursor: null });
    await expect(f.callbacks.bindQueryInput(context, { ...anchor, organisationId: 'foreign' }, request('lines'))).rejects.toThrow('FORBIDDEN');
    if (anchor.kind !== 'record') throw new Error('Missing record');
    for (const wrong of [{ ...anchor, revision: '3@old' }, { ...anchor, nativeRevision: 4 }]) await expect(f.callbacks.bindQueryInput(context, wrong, request('lines'))).rejects.toThrow('CONFLICT');
    f.storage.salesOrder.findFirst.mockResolvedValue(null);
    await expect(f.registry.invokePageRead(context, f.source, record, request('lines'))).rejects.toThrow('NOT_FOUND');
    expect(f.storage.salesOrderLine.findMany).not.toHaveBeenCalled(); expect(f.storage.salesOrderLine.findFirst).not.toHaveBeenCalled();
  });
  it('bounds list selection and tenant-owned cursor, using server organisation only', async () => {
    const session = await actor(), f = setup(); f.storage.salesOrder.findFirst.mockResolvedValue(header('anchor')); f.storage.salesOrder.findMany.mockResolvedValue([header('a'), header('b'), header('c')]);
    const result = await f.registry.invokePageRead({ session, transaction: f.transaction }, f.source, { kind: 'list' }, request('list', 2, { id: 'anchor', updatedAt: date.toISOString() }));
    expect(result.output).toMatchObject({ rows: [{ id: 'a' }, { id: 'b' }], nextCursor: { id: 'b', updatedAt: date.toISOString() } });
    expect(f.storage.salesOrder.findFirst).toHaveBeenCalledWith({ where: { AND: [{ AND: [{ organisationId: 'company' }, { party: { organisationId: 'company' } }] }, { id: 'anchor', updatedAt: date }] }, select: { id: true, updatedAt: true } });
    expect(f.storage.salesOrder.findMany).toHaveBeenCalledWith(expect.objectContaining({ take: 3, orderBy: [{ updatedAt: 'desc' }, { id: 'desc' }] }));
    f.storage.salesOrder.findFirst.mockResolvedValue(null); f.storage.salesOrder.findMany.mockClear();
    await expect(f.registry.invokePageRead({ session, transaction: f.transaction }, f.source, { kind: 'list' }, request('list', 2, { id: 'foreign', updatedAt: date.toISOString() }))).rejects.toThrow('CONFLICT');
    expect(f.storage.salesOrder.findMany).not.toHaveBeenCalled();
  });
  it('preserves exact decimal quantity strings, zero/false/null and owning currency in bounded lines', async () => {
    const session = await actor(), f = setup(); f.storage.salesOrderLine.findMany.mockResolvedValue([line('a', 1), line('b', 2)]);
    const result = await f.registry.invokePageRead({ session, transaction: f.transaction }, f.source, record, request('lines', 1));
    expect(result.output).toEqual({ rows: [{ id: 'a', values: { line_number: 1, type: 'NOTE', description: 'Item', unit_of_measure: 'each', ordered_quantity: '0.125000', cancelled_quantity: '0', unit_price_amount: 0, discount_percent: null, net_amount: 0, tax_amount: 0, invoice_when_in_stock: false, currency: 'GBP' } }], nextCursor: { id: 'a', lineNumber: 1 } });
    expect(JSON.stringify(result)).not.toContain('private'); expect(f.storage.salesOrderLine.findMany).toHaveBeenCalledWith(expect.objectContaining({ take: 2, where: { AND: [{ orderId: 'order', order: { organisationId: 'company', party: { organisationId: 'company' } } }, {}] } }));
  });
  it('validates line cursor parent/tenant and denies foreign or moved cursors before line selection', async () => {
    const session = await actor(), f = setup(); f.storage.salesOrderLine.findFirst.mockResolvedValue(null);
    await expect(f.registry.invokePageRead({ session, transaction: f.transaction }, f.source, record, request('lines', 2, { id: 'foreign', lineNumber: 1 }))).rejects.toThrow('CONFLICT');
    expect(f.storage.salesOrderLine.findFirst).toHaveBeenCalledWith({ where: { id: 'foreign', orderId: 'order', lineNumber: 1, order: { organisationId: 'company', party: { organisationId: 'company' } } }, select: { id: true, lineNumber: true } });
    expect(f.storage.salesOrderLine.findMany).not.toHaveBeenCalled();
  });
  it('rejects unapproved query versions, malformed cursors, excess cardinality and wrong list/record scope', async () => {
    const session = await actor(), f = setup(), context = { session, transaction: f.transaction };
    for (const invalid of [{ ...request('header'), query: { id: 'sales.order.get', version: 1 } }, { ...request('list'), query: { id: 'sales.order.page.list', version: 2 } }, request('list', 51), request('list', 1, { id: 'x', updatedAt: 'invalid' }), request('lines', 1, { id: 'x', lineNumber: 1, organisationId: 'foreign' })])
      await expect(f.registry.invokePageRead(context, f.source, invalid.query.id.endsWith('list') ? { kind: 'list' } : record, invalid)).rejects.toThrow();
    await expect(f.registry.invokePageRead(context, f.source, record, request('list'))).rejects.toThrow('scope');
    await expect(f.registry.invokePageRead(context, f.source, { kind: 'list' }, request('lines'))).rejects.toThrow('scope');
    expect(f.storage.salesOrder.findMany).not.toHaveBeenCalled(); expect(f.storage.salesOrderLine.findMany).not.toHaveBeenCalled();
  });
  it('rejects extra raw values, wrong record identity, unsafe money and malformed projected continuation', async () => {
    const session = await actor(), f = setup(), context = { session, transaction: f.transaction }, anchor = await f.callbacks.authoriseRead(context, record);
    const valid = (await f.registry.invokePageRead(context, f.source, record, request('header'))).output;
    for (const output of [{ ...valid, rows: [{ ...valid.rows[0], values: { ...valid.rows[0].values, private_notes: 'private' } }] }, { ...valid, rows: [{ ...valid.rows[0], id: 'foreign' }] }, { ...valid, rows: [{ ...valid.rows[0], values: { ...valid.rows[0].values, gross_amount: 1.1 } }] }, { ...valid, rows: [{ ...valid.rows[0], values: { ...valid.rows[0].values, gross_amount: Number.MAX_SAFE_INTEGER + 1 } }] }])
      await expect(f.callbacks.projectQueryOutput(context, anchor, request('header', 1), output)).rejects.toThrow();
    await expect(f.callbacks.projectQueryOutput(context, { kind: 'list', organisationId: 'company' }, request('list'), { ...valid, nextCursor: { id: 'cursor', arbitrary: true } })).rejects.toThrow();
    await expect(f.registry.invoke(session, f.source, {})).rejects.toThrow('descriptive');
    expect(mocks.oldModule).not.toHaveBeenCalled(); // Preview acknowledgement/PDF never executed during page design reads.
  });
});

const ref = ({ id, version, schemaHash, contractHash }: { id: string; version: number; schemaHash: string; contractHash: string }) => ({ id, version, schemaHash, contractHash });
const totalRequest = { query: { id: 'sales.order.page.total', version: 1 }, pageSize: 1, cursor: null };
describe('Sales registered order-total KPI', () => {
  it('retains exact Page1 metadata/hash and appends only its independent query/metric approvals in Page2', () => {
    const f = setup(), source2 = f.registry.describe('sales.order.page', 2);
    expect(f.source.schemaHash).toBe('208c4856bbaec5da38c8d09fb9405466bd0f85ae67429e3600ec0184cd7f5b18');
    const { ownerModuleId, contractHash, ...historical } = f.source; void ownerModuleId; void contractHash;
    expect(checksum(historical)).toBe('360afe1509556d9b9a15b106f479539c8c04de3285ada9e6d9fb41f4c22e7d04');
    expect(f.registry.describePageSource(f.source).policy).toEqual(salesOrderPagePolicy);
    expect(f.registry.describePageSource(source2).policy).toEqual(salesOrderMetricPagePolicy);
    expect(salesOrderMetricPagePolicy.queries.slice(0, -1)).toEqual(salesOrderPagePolicy.queries);
    expect({ ...salesOrderMetricPagePolicy, queries: salesOrderPagePolicy.queries, metrics: [], maxQueryCost: 12 }).toEqual(salesOrderPagePolicy);
    expect(f.registry.describe('sales.order.page.total_metric', 1)).toMatchObject({ kind: 'metric', capability: cap,
      details: { references: ['sales.order.page.total'] } });
    expect(f.registry.describe('sales.order.page.total', 1)).toMatchObject({ kind: 'query', capability: cap,
      details: { transaction: 'required', pagination: 'none', maxCardinality: 1, costClass: 'low' } });
    expect(f.storage.salesOrder.findFirst).not.toHaveBeenCalled();
  });
  it('rejects a future removed/changed retained metric instead of rewriting sealed Page2 approval', () => {
    for (const changed of [[], [{ ...salesOrderMetricPagePolicy.metrics[0], formFactors: ['desktop'] as const }]]) {
      const f = setup(), source2 = f.registry.describe('sales.order.page', 2);
      f.registry.register('sales', { contributions: [pageSource({ id: 'sales.order.page', version: 4, label: 'Sales order screen',
        capability: cap, lifecycle: 'active', classification: 'confidential', policy: { ...salesOrderMetricPagePolicy, metrics: [...changed].map(value => ({ ...value, formFactors: [...value.formFactors] })) }, callbacks: f.callbacks })] });
      expect(() => f.registry.describePageSource(source2)).toThrow('current');
      expect(f.registry.describePageSource(f.source).policy).toEqual(salesOrderPagePolicy);
    }
  });
  it('returns one anchored total with only genuine current native Read, exact minor units and currency', async () => {
    const session = await actor(), f = setup(), source = f.registry.describe('sales.order.page', 2);
    expect([...session.capabilities].filter(value => value !== 'core.profile.self')).toEqual([cap]);
    f.storage.salesOrder.findFirst.mockResolvedValue({ ...header(), grossAmount: 1234, currency: 'KWD' });
    const result = await f.registry.invokePageRead({ session, transaction: f.transaction }, source, record, totalRequest);
    expect(result.output).toEqual({ rows: [{ id: 'order', values: { gross_amount: 1234, currency: 'KWD' } }], nextCursor: null });
    const read = f.storage.salesOrder.findFirst.mock.calls.find(([args]) => args.select.grossAmount && !args.select.reference)?.[0];
    expect(read).toEqual({ where: { AND: [{ AND: [{ organisationId: 'company' }, { party: { organisationId: 'company' } }] },
      { id: 'order', revision: 3, updatedAt: date }] }, select: { id: true, grossAmount: true, currency: true } });
    expect(mocks.refresh.mock.invocationCallOrder[0]).toBeLessThan(f.storage.salesOrder.findFirst.mock.invocationCallOrder[0]);
    expect(f.storage.salesOrder.findMany).not.toHaveBeenCalled(); expect(mocks.oldModule).not.toHaveBeenCalled();
  });
  it('does not expose the new metric through retained Page1 or permit list/foreign/stale/cursor/override input', async () => {
    const session = await actor(), f = setup(), context = { session, transaction: f.transaction }, source = f.registry.describe('sales.order.page', 2);
    await expect(f.registry.invokePageRead(context, f.source, record, totalRequest)).rejects.toThrow();
    expect(mocks.refresh).not.toHaveBeenCalled();
    for (const [nativeRequest, queryRequest] of [[{ kind: 'list' }, totalRequest], [record, { ...totalRequest, cursor: { id: 'x' } }],
      [record, { ...totalRequest, organisationId: 'foreign' }], [record, { ...totalRequest, orderId: 'foreign' }]] as const)
      await expect(f.registry.invokePageRead(context, source, nativeRequest, queryRequest)).rejects.toThrow();
    const anchor = await f.callbacks.authoriseRead(context, record);
    await expect(f.callbacks.bindQueryInput(context, { ...anchor, organisationId: 'foreign' }, totalRequest)).rejects.toThrow('FORBIDDEN');
    if (anchor.kind !== 'record') throw new Error('Missing anchor');
    await expect(f.callbacks.bindQueryInput(context, { ...anchor, nativeRevision: 4 }, totalRequest)).rejects.toThrow('CONFLICT');
    f.storage.salesOrder.findFirst.mockResolvedValue(null);
    await expect(f.registry.invokePageRead(context, source, record, totalRequest)).rejects.toThrow('NOT_FOUND');
    expect(f.storage.salesOrder.findMany).not.toHaveBeenCalled();
  });
  it('checks refreshed Read/module/session before any protected total query and rejects global transaction fallback', async () => {
    const session = await actor(), revoked = await actor([]), f = setup(), context = { session, transaction: f.transaction }, source = f.registry.describe('sales.order.page', 2);
    mocks.refresh.mockResolvedValue({ session: revoked });
    await expect(f.registry.invokePageRead(context, source, record, totalRequest)).rejects.toThrow('FORBIDDEN');
    expect(f.storage.salesOrder.findFirst).not.toHaveBeenCalled();
    mocks.refresh.mockResolvedValue({ session }); f.storage.moduleState.findFirst.mockResolvedValue(null);
    await expect(f.registry.invokePageRead(context, source, record, totalRequest)).rejects.toThrow('unavailable');
    expect(f.storage.salesOrder.findFirst).not.toHaveBeenCalled();
    mocks.refresh.mockRejectedValue(new Error('STALE_SESSION'));
    await expect(f.registry.invokePageRead(context, source, record, totalRequest)).rejects.toThrow('STALE_SESSION');
    const contribution = salesOrderPageContract.contributions.find(c => c.metadata.id === totalRequest.query.id)!;
    await expect(contribution.run!({ session }, { orderId: 'order', expectedRevision: 3, expectedUpdatedAt: date.toISOString() })).rejects.toThrow('transaction');
    expect(f.storage.salesOrder.findFirst).not.toHaveBeenCalled();
  });
  it('rejects fractional/unsafe/null/wider total projection and foreign records instead of coercion', async () => {
    const session = await actor(), f = setup(), context = { session, transaction: f.transaction }, anchor = await f.callbacks.authoriseRead(context, record);
    for (const amount of [null, 1.2, Number.MAX_SAFE_INTEGER + 1, Infinity])
      await expect(f.callbacks.projectQueryOutput(context, anchor, totalRequest, { rows: [{ id: 'order', values: { gross_amount: amount, currency: 'GBP' } }], nextCursor: null })).rejects.toThrow();
    for (const output of [{ rows: [{ id: 'foreign', values: { gross_amount: 0, currency: 'GBP' } }], nextCursor: null },
      { rows: [{ id: 'order', values: { gross_amount: 0, currency: 'GBP', private: 'secret' } }], nextCursor: null },
      { rows: [{ id: 'order', values: { gross_amount: 0, currency: null } }], nextCursor: null }, { rows: [], nextCursor: null }])
      await expect(f.callbacks.projectQueryOutput(context, anchor, totalRequest, output)).rejects.toThrow();
  });
  it.each([[0, 'GBP', '£0.00'], [1234, 'KWD', '1.234'], [1234, 'JPY', '1,234'], [1234, 'ZZZ', 'Unavailable']] as const)
    ('uses the existing compiler/display/renderer for total%s %s without authoring rights', async (amount, currency, expected) => {
      const session = await actor(), f = setup(), source = f.registry.describe('sales.order.page', 2), stamp = sessionAuthorityStamp(session)!;
      const approvals = await reconstructPageApprovalsInTransaction({ session, stamp, registry: f.registry, transaction: f.transaction }, { sourcePage: ref(source) });
      const forms = ['desktop', 'tablet', 'phone'] as const;
      const metric = f.registry.describe('sales.order.page.total_metric', 1);
      const plan = compilePage({ schemaVersion: 1, entity: ref(approvals.entity), formFactors: [...forms], variants: [], sections: [{ id: 'main', label: 'Order summary', help: '', formFactors: [...forms],
        columns: { desktop: 2, tablet: 1, phone: 1 }, components: [{ id: 'total', type: 'metric', metric: ref(metric), formFactors: [...forms] }] }] }, approvals);
      const layout = resolvePageVariant(plan, { capabilities: session.capabilities, facts: new Map(), recordTypeDefinitionId: null }, 'phone');
      const model = createPageDisplayModel(plan, layout, 'phone', new Map([[pageQueryKey(totalRequest.query), { rows: [{ id: 'order', values: { gross_amount: amount, currency } }], nextCursor: null }]]));
      const html = renderToStaticMarkup(createElement(PageRenderer, { model, interaction: 'live' }));
      expect(html).toContain(expected); expect(html).toContain('Order total'); expect(model.sections[0].columns).toBe(1);
      expect(mocks.refresh).not.toHaveBeenCalled(); expect(f.storage.salesOrder.findFirst).not.toHaveBeenCalled();
    });
});
