// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { AdditionalFieldSetup } from '@/components/studio/additional-field-setup';
import { additionalFieldTypeCatalogue } from '@/core/studio/authoring/field-setup-contract';
import { readAdditionalFieldSetup } from '@/core/studio/authoring/field-form-input';

// Actual controls, FormData codec and closed schema. Owner permission/pin/value
// constraints, publication/migration and SQL remain separately enforced server-side.
afterEach(cleanup);
const targets = [{ id: 'tickets.ticket', name: 'Tickets' }];
function form(values: Record<string, string | readonly string[] | undefined> = {}) {
  const data = new FormData(); data.set('label', 'Our detail'); data.set('help', 'Useful to our team');
  for (const [key, value] of Object.entries(values)) if (value !== undefined) for (const item of typeof value === 'string' ? [value] : value) data.append(key, item);
  return data;
}
function choose(type: string) { fireEvent.change(screen.getByRole('combobox', { name: 'What kind of detail?' }), { target: { value: type } }); }
function defaultOn() { fireEvent.click(screen.getByRole('checkbox', { name: 'Start new records with a value' })); }
function submitted(container: HTMLElement) { const node = container.querySelector('form'); if (!node) throw new Error('Missing form'); return new FormData(node); }

describe('typed friendly field form input', () => {
  it.each([
    ['string', { initialValue: '' }, ''], ['integer', { initialValue: '0' }, 0], ['decimal', { initialValue: '0.00' }, '0.00'],
    ['money', { 'setting.currencies': 'gbp,eur', 'initialValue.amount': '0.00', 'initialValue.currency': 'gbp' }, { amount: '0.00', currency: 'GBP' }],
    ['boolean', { initialValue: 'false' }, false], ['date', { initialValue: '2026-10-11' }, '2026-10-11'],
    ['datetime', { initialValue: '2026-10-11T13:45' }, '2026-10-11T13:45:00.000Z'], ['duration', { initialValue: '0' }, 0],
    ['email', { initialValue: 'team@example.test' }, 'team@example.test'], ['url', { initialValue: 'https://example.test' }, 'https://example.test'],
    ['phone', { initialValue: '+441234567890' }, '+441234567890'],
    ['enum', { 'setting.choices': 'Repair\nDelivery', initialValue: '0' }, 0],
    ['multi_enum', { 'setting.choices': 'Repair\nDelivery', initialValue: ['0', '1'] }, [0, 1]],
    ['address', { 'setting.countries': 'gb,ie', 'initialValue.line1': '1 Main Street', 'initialValue.city': 'London', 'initialValue.country': 'gb' }, { line1: '1 Main Street', line2: '', city: 'London', region: '', postalCode: '', country: 'GB' }],
  ] as const)('decodes literal %s defaults without truthiness or hidden JSON conversion', (type, values, expected) => {
    const result = readAdditionalFieldSetup(form({ type, initialValueEnabled: 'on', ...values }));
    expect(result).toMatchObject({ label: 'Our detail', help: 'Useful to our team', type, initialValue: expected });
  });
  it('omits unchecked defaults even if stale scalar values remain and independently decodes linked target metadata without record identifiers', () => {
    expect(readAdditionalFieldSetup(form({ type: 'boolean', initialValue: 'false' }))).not.toHaveProperty('initialValue');
    expect(readAdditionalFieldSetup(form({ type: 'reference', 'setting.entityId': 'tickets.ticket' }))).toMatchObject({ type: 'reference', settings: { entityId: 'tickets.ticket' } });
    expect(() => readAdditionalFieldSetup(form({ type: 'reference', 'setting.entityId': 'tickets.ticket', initialValueEnabled: 'on', initialValue: 'private-record' }))).toThrow('approved record picker');
  });
  it('preserves zero bounds, explicit boolean flags and decimal strings, rejecting coerced or repeated values', () => {
    expect(readAdditionalFieldSetup(form({ type: 'integer', 'setting.min': '0', 'setting.max': '25' }))).toMatchObject({ settings: { min: 0, max: 25 } });
    expect(readAdditionalFieldSetup(form({ type: 'decimal', 'setting.min': '-0.001', 'setting.scale': '3' }))).toMatchObject({ settings: { min: '-0.001', scale: 3 } });
    for (const value of ['', '0x10', '1e3', 'Infinity', '1.5', '9007199254740992']) expect(() => readAdditionalFieldSetup(form({ type: 'integer', initialValueEnabled: 'on', initialValue: value }))).toThrow();
    expect(() => readAdditionalFieldSetup(form({ type: 'boolean', initialValueEnabled: 'on', initialValue: '0' }))).toThrow('Yes or No');
    expect(() => readAdditionalFieldSetup(form({ type: 'integer', 'setting.min': ['0', '1'] }))).toThrow('once');
    expect(() => readAdditionalFieldSetup(form({ type: 'integer', 'setting.entityId': 'tickets.ticket' }))).toThrow('does not belong');
  });
  it('rejects invalid dates, choice ambiguity, duplicates and unsupported arbitrary types through the exact closed schema', () => {
    for (const values of [
      { type: 'date', initialValueEnabled: 'on', initialValue: '2026-02-30' },
      { type: 'enum', 'setting.choices': 'Repair\nrepair' },
      { type: 'multi_enum', 'setting.choices': 'Repair', initialValueEnabled: 'on', initialValue: ['0', '0'] },
      { type: 'money', 'setting.currencies': 'GBP,GBP' }, { type: 'expression' },
    ]) expect(() => readAdditionalFieldSetup(form(values))).toThrow();
  });
});

describe('additional field setup controls', () => {
  it('renders only server catalogue types and labelled supported controls; changing type drops incompatible settings/defaults', () => {
    const { container } = render(<form><AdditionalFieldSetup fieldTypes={additionalFieldTypeCatalogue} referenceTargets={targets}/></form>);
    expect(screen.getAllByRole('option').filter(option => option.parentElement?.getAttribute('name') === 'type')).toHaveLength(15);
    defaultOn(); fireEvent.change(screen.getByRole('textbox', { name: 'Starting value' }), { target: { value: 'Old text' } });
    choose('integer'); expect(screen.queryByRole('checkbox', { name: /Allow more/ })).toBeNull();
    expect(screen.queryByRole('textbox', { name: 'Starting value' })).toBeNull();
    expect(submitted(container).has('setting.characters')).toBe(false); expect(submitted(container).has('initialValue')).toBe(false);
    fireEvent.change(screen.getByRole('textbox', { name: 'Display name' }), { target: { value: 'Count' } });
    defaultOn(); fireEvent.change(screen.getByRole('spinbutton', { name: 'Starting value' }), { target: { value: '0' } });
    expect(readAdditionalFieldSetup(submitted(container))).toMatchObject({ type: 'integer', initialValue: 0 });
    expect(container.textContent).not.toMatch(/schemaVersion|checksum|storageGeneration|stable key|capability|JSON/);
  });
  it('keeps No as a real selected default and removes the submitted default when switched off', () => {
    const { container } = render(<form><AdditionalFieldSetup fieldTypes={additionalFieldTypeCatalogue.filter(type => type.id === 'boolean')} referenceTargets={[]}/></form>);
    fireEvent.change(screen.getByRole('textbox', { name: 'Display name' }), { target: { value: 'Approved' } });
    defaultOn(); expect(readAdditionalFieldSetup(submitted(container))).toMatchObject({ initialValue: false });
    defaultOn(); expect(readAdditionalFieldSetup(submitted(container))).not.toHaveProperty('initialValue');
  });
  it('creates labelled choice arrays and zero-based default selections without exposing generated IDs', () => {
    const { container } = render(<form><AdditionalFieldSetup fieldTypes={additionalFieldTypeCatalogue.filter(type => type.id === 'enum')} referenceTargets={[]}/></form>);
    fireEvent.change(screen.getByRole('textbox', { name: 'Display name' }), { target: { value: 'Work type' } });
    fireEvent.change(screen.getByRole('textbox', { name: 'Available choices' }), { target: { value: 'Repair\nDelivery' } }); defaultOn();
    expect(screen.getByRole('option', { name: 'Repair' })).not.toBeNull();
    expect(readAdditionalFieldSetup(submitted(container))).toMatchObject({ settings: { choices: ['Repair', 'Delivery'] }, initialValue: 0 });
  });
  it('lets people select several labelled starting choices with simple checkboxes', () => {
    const { container } = render(<form><AdditionalFieldSetup fieldTypes={additionalFieldTypeCatalogue.filter(type => type.id === 'multi_enum')} referenceTargets={[]}/></form>);
    fireEvent.change(screen.getByRole('textbox', { name: 'Display name' }), { target: { value: 'Services' } });
    fireEvent.change(screen.getByRole('textbox', { name: 'Available choices' }), { target: { value: 'Repair\nDelivery' } }); defaultOn();
    fireEvent.click(screen.getByRole('checkbox', { name: 'Repair' })); fireEvent.click(screen.getByRole('checkbox', { name: 'Delivery' }));
    expect(readAdditionalFieldSetup(submitted(container))).toMatchObject({ settings: { choices: ['Repair', 'Delivery'] }, initialValue: [0, 1] });
  });
  it('shows approved linked target labels, offers no free record default, and hides unsupported/no-target reference types', () => {
    const { container, rerender } = render(<form><AdditionalFieldSetup fieldTypes={additionalFieldTypeCatalogue.filter(type => type.id === 'reference')} referenceTargets={targets}/></form>);
    expect(screen.getByRole('option', { name: 'Tickets' })).not.toBeNull(); expect(screen.queryByRole('checkbox', { name: /Start new/ })).toBeNull();
    expect(container.textContent).not.toContain('tickets.ticket'); expect(submitted(container).get('setting.entityId')).toBe('tickets.ticket');
    rerender(<form key="none"><AdditionalFieldSetup fieldTypes={[{ id: 'expression', name: 'Code', settings: [], initialValue: 'code' }, ...additionalFieldTypeCatalogue.filter(type => type.id === 'reference')]} referenceTargets={[]}/></form>);
    expect(screen.queryByRole('option', { name: 'Code' })).toBeNull(); expect(screen.queryByRole('option', { name: 'Linked record' })).toBeNull();
    expect(screen.getByRole('option', { name: 'No field types are available' })).not.toBeNull();
  });
});
