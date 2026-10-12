// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { projectAdditionalFieldSetup } from '@/core/studio/authoring/field-setup-projection';
import { AdditionalFieldSetup } from '@/components/studio/additional-field-setup';
import { additionalFieldTypeCatalogue } from '@/core/studio/authoring/field-setup-contract';
import { readAdditionalFieldSetup } from '@/core/studio/authoring/field-form-input';
import type { CustomFieldPayload, FieldStorage } from '@/core/studio/fields/schema';
import type { FieldValue } from '@/core/studio/fields/value-contract';

// Actual projection/UI/form codec. Metadata fixtures are not owner permission,
// version/CAS/publication/SQL proof; owning guard checks remain independent.
const entity = { id: 'tickets.ticket', version: 9, schemaHash: 'a'.repeat(64), contractHash: 'b'.repeat(64) };
const targets = [{ id: entity.id, name: 'Tickets' }];
const field = (storage: FieldStorage, defaultValue?: FieldValue): CustomFieldPayload => ({ schemaVersion: 1, entity,
  storageGeneration: '10000000-0000-4000-8000-000000000001', field: { key: 'original_key', label: 'Our detail', help: 'Our saved instructions',
    classification: 'restricted', readCapability: 'tickets.extra.read', writeCapability: 'tickets.extra.write', required: true, indexed: false, unique: false, storage,
    ...(defaultValue ? { defaultValue } : {}) } });
const options = [{ id: 'original_repair', label: 'Repair', retired: false }, { id: 'original_delivery', label: 'Delivery', retired: false }];
afterEach(cleanup);
function submit(container: HTMLElement) { const form = container.querySelector('form'); if (!form) throw new Error('No form'); return readAdditionalFieldSetup(new FormData(form)); }

describe('safe friendly saved field setup projection', () => {
  it.each([
    [field({ type: 'integer', min: 0, max: 10 }, { type: 'integer', value: 0 }), { type: 'integer', settings: { min: 0, max: 10 }, initialValue: 0 }],
    [field({ type: 'boolean' }, { type: 'boolean', value: false }), { type: 'boolean', initialValue: false }],
    [field({ type: 'decimal', precision: 12, scale: 4, min: '-0.001' }, { type: 'decimal', value: '0.0000' }), { type: 'decimal', settings: { precision: 12, scale: 4, min: '-0.001' }, initialValue: '0.0000' }],
    [field({ type: 'enum', valueSetVersion: 3, options }, { type: 'enum', value: 'original_repair' }), { type: 'enum', settings: { choices: ['Repair', 'Delivery'] }, initialValue: 0 }],
    [field({ type: 'multi_enum', valueSetVersion: 3, options, maxSelections: 2 }, { type: 'multi_enum', value: ['original_delivery', 'original_repair'] }), { type: 'multi_enum', settings: { choices: ['Repair', 'Delivery'], maxSelections: 2 }, initialValue: [0, 1] }],
    [field({ type: 'string', minLength: 1, maxLength: 20, multiline: true, pattern: '^[A-Za-z0-9 _-]{1,20}$' }, { type: 'string', value: 'Our value' }), { type: 'string', settings: { minLength: 1, maxLength: 20, multiline: true, characters: 'letters_numbers_spaces_dashes' }, initialValue: 'Our value' }],
    [field({ type: 'money', precision: 12, scale: 2, currencies: ['GBP', 'EUR'] }, { type: 'money', value: { amount: '0.00', currency: 'EUR' } }), { type: 'money', settings: { currencies: ['GBP', 'EUR'] }, initialValue: { amount: '0.00', currency: 'EUR' } }],
  ])('preserves typed saved settings/default literals while stripping IDs/security from friendly output', (payload, expected) => {
    const before = structuredClone(payload), projected = projectAdditionalFieldSetup(payload, targets);
    expect(projected).toMatchObject({ kind: 'editable', initial: { label: 'Our detail', help: 'Our saved instructions', ...expected } }); expect(payload).toEqual(before);
    expect(JSON.stringify(projected)).not.toMatch(/original_key|original_repair|original_delivery|storageGeneration|classification|tickets.extra|schemaHash|contractHash/);
  });
  it('explicitly refuses conditional/custom pattern/retired or ambiguous choices and saved reference defaults instead of dropping policy', () => {
    for (const input of [
      { ...field({ type: 'boolean' }), schemaVersion: 2, requiredIf: { match: 'all', predicates: [{ operator: 'present', source: { kind: 'native', fieldId: 'status' } }] } },
      field({ type: 'string', minLength: 0, maxLength: 200, multiline: false, pattern: '^[A-Z]{1,10}$' }),
      field({ type: 'enum', valueSetVersion: 1, options: [{ ...options[0], retired: true }] }),
      field({ type: 'enum', valueSetVersion: 1, options: [options[0], { ...options[1], label: 'repair' }] }),
      field({ type: 'enum', valueSetVersion: 1, options }, { type: 'enum', value: 'missing' }),
      field({ type: 'url', protocols: ['http'] }),
      field({ type: 'reference', entity }, { type: 'reference', value: 'private-saved-target' }),
    ]) { const result = projectAdditionalFieldSetup(input, targets); expect(result.kind).toBe('read_only'); expect(result).toHaveProperty('reason'); expect(result).not.toHaveProperty('initial'); }
    expect(projectAdditionalFieldSetup(field({ type: 'reference', entity }), [])).toMatchObject({ kind: 'read_only' });
    expect(projectAdditionalFieldSetup(field({ type: 'reference', entity: { ...entity, version: 8 } }), targets)).toMatchObject({ kind: 'read_only' });
    expect(projectAdditionalFieldSetup(field({ type: 'reference', entity }), targets)).toMatchObject({ kind: 'editable', initial: { settings: { entityId: entity.id } } });
  });
});

describe('existing never-published field form hydration', () => {
  it('preserves an existing search setting and lets an unpublished field explicitly turn it off', () => {
    const payload = field({ type: 'integer' }); payload.field.indexed = true;
    const projection = projectAdditionalFieldSetup(payload, targets); if (projection.kind !== 'editable') throw new Error(projection.reason);
    const { container } = render(<form><AdditionalFieldSetup fieldTypes={additionalFieldTypeCatalogue} referenceTargets={targets} initial={projection.initial}/></form>);
    expect(submit(container).indexed).toBe(true);
    fireEvent.click(screen.getByRole('checkbox', { name: 'Make this detail available in search' }));
    expect(submit(container).indexed).toBe(false);
    expect(payload.field.indexed).toBe(true);
  });
  it('keeps a published index setting when a structural target type changes', () => {
    const initial = { label: 'Count', help: '', type: 'integer' as const, settings: {}, indexed: true, unique: true };
    const { container } = render(<form><AdditionalFieldSetup fieldTypes={additionalFieldTypeCatalogue} referenceTargets={targets} initial={initial} storageRulesEditable={false}/></form>);
    fireEvent.change(screen.getByRole('combobox', { name: 'What kind of detail?' }), { target: { value: 'decimal' } });
    expect(submit(container).indexed).toBe(true);
    expect(submit(container).unique).toBe(true);
    expect(screen.queryByRole('checkbox', { name: 'Make this detail available in search' })).toBeNull();
    expect(screen.queryByRole('checkbox', { name: 'Prevent duplicate values' })).toBeNull();
  });
  it.each([
    field({ type: 'integer', min: 0, max: 12 }, { type: 'integer', value: 0 }),
    field({ type: 'boolean' }, { type: 'boolean', value: false }),
    field({ type: 'money', precision: 12, scale: 2, currencies: ['EUR', 'GBP'] }, { type: 'money', value: { amount: '0.00', currency: 'GBP' } }),
    field({ type: 'datetime', timezone: 'UTC' }, { type: 'datetime', value: '2026-10-11T12:13:14.123Z' }),
    field({ type: 'address', countries: ['GB', 'IE'] }, { type: 'address', value: { line1: '1 Main Street', line2: 'Unit 2', city: 'London', region: '', postalCode: 'AB12', country: 'GB' } }),
  ])('submits unchanged complete saved settings/defaults from the actual hydrated controls', payload => {
    const projection = projectAdditionalFieldSetup(payload, targets); if (projection.kind !== 'editable') throw new Error(projection.reason);
    const { container } = render(<form><AdditionalFieldSetup fieldTypes={additionalFieldTypeCatalogue} referenceTargets={targets} initial={projection.initial}/></form>);
    expect(submit(container)).toEqual(projection.initial);
  });
  it('keeps saved multi-choice labels/selections and optional absence; type switches clear incompatible defaults', () => {
    const projection = projectAdditionalFieldSetup(field({ type: 'multi_enum', valueSetVersion: 3, options, maxSelections: 2 }, { type: 'multi_enum', value: ['original_repair', 'original_delivery'] }), targets);
    if (projection.kind !== 'editable') throw new Error(projection.reason);
    const { container } = render(<form><AdditionalFieldSetup fieldTypes={additionalFieldTypeCatalogue} referenceTargets={targets} initial={projection.initial}/></form>);
    expect(submit(container)).toEqual(projection.initial);
    fireEvent.change(screen.getByRole('combobox', { name: 'What kind of detail?' }), { target: { value: 'integer' } });
    expect(submit(container)).toMatchObject({ label: 'Our detail', help: 'Our saved instructions', type: 'integer', settings: {} });
    expect(submit(container)).not.toHaveProperty('initialValue'); expect(new FormData(container.querySelector('form')!).has('setting.choices')).toBe(false);
  });
});
