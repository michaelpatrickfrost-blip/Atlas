// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { useState } from 'react';
import { FieldRequirementEditor, type FieldRequirementEditorProps } from '@/components/studio/field-requirement-editor';
import { additionalFieldRequirementSchema, type AdditionalFieldRequirement, type FieldRequirementChoice } from '@/core/studio/authoring/field-requirement-input';
// Real controlled UI/pure strict input schemas; labelled catalogue supplied by a
// server collaborator. These DOM cases are not metadata authority or SQL proof.
afterEach(cleanup);
const id = '84000000-0000-4000-8000-000000000002';
const choices: FieldRequirementChoice[] = [
  { id: 'native:status', label: 'Status', type: 'enum', operators: ['present', 'absent', 'equals', 'not_equals'], options: [{ value: 'NEW', label: 'New' }, { value: 'IN_PROGRESS', label: 'In progress' }] },
  { id: `field:${id}`, label: 'Number of packages', type: 'integer', operators: ['present', 'absent', 'equals', 'not_equals'] },
  { id: 'native:confirmed', label: 'Confirmed', type: 'boolean', operators: ['present', 'absent', 'equals', 'not_equals'] },
  { id: 'native:linked', label: 'Related record', type: 'reference', operators: ['present', 'absent'] },
  { id: 'native:tags', label: 'Request labels', type: 'multi_enum', operators: ['present', 'absent', 'contains'], options: [{ value: 'f_red', label: 'Urgent customer' }, { value: 'f_blue', label: 'Site visit' }] },
  { id: 'native:amount', label: 'Amount', type: 'money', operators: ['present', 'absent', 'equals'], currencies: ['GBP', 'EUR'] },
];
function fixture(initial: AdditionalFieldRequirement = { always: false, when: null }, extra: Partial<FieldRequirementEditorProps> = {}) {
  const changed = vi.fn(); let latest = initial;
  function Controlled() { const [value, setValue] = useState(initial); return <FieldRequirementEditor value={value} choices={choices} onChange={next => { latest = next; changed(next); setValue(next); }} {...extra}/>; }
  return { changed, current: () => latest, ...render(<Controlled/>) };
}
const condition = (n = 1) => screen.getByRole('group', { name: `Condition ${n}` });
const enable = () => fireEvent.click(screen.getByLabelText('Also require it when a rule matches'));
const select = (label: string, value: string, n = 1) => fireEvent.change(within(condition(n)).getByLabelText(label), { target: { value } });
it('starts optional with plain labels, no expressions/technical keys or hidden writes', () => {
  const f = fixture(); expect(screen.queryByRole('group', { name: 'Condition 1' })).toBeNull(); expect(f.changed).not.toHaveBeenCalled();
  expect(document.body.textContent).not.toMatch(/schema|JSON|stable key|checksum|source code/); expect(document.body.textContent).not.toContain(id);
  enable(); expect(f.current().when).toEqual({ match: 'all', conditions: [{ choiceId: 'native:status', operator: 'present' }] });
  expect(within(condition()).getByRole('option', { name: 'Status' })).toBeTruthy(); expect(document.body.textContent).not.toContain('native:status');
});
it('authors all/any matched conditions using only friendly approved options, with bounded add/remove', () => {
  const f = fixture(); enable(); fireEvent.change(screen.getByLabelText('Rule matching'), { target: { value: 'any' } }); select('Condition', 'equals'); select('Value', 'IN_PROGRESS');
  expect(f.current().when).toEqual({ match: 'any', conditions: [{ choiceId: 'native:status', operator: 'equals', value: { type: 'enum', value: 'IN_PROGRESS' } }] });
  fireEvent.click(screen.getByRole('button', { name: 'Add condition' })); select('Which detail?', `field:${id}`, 2); select('Condition', 'absent', 2);
  expect(f.current().when!.conditions[1]).toEqual({ choiceId: `field:${id}`, operator: 'absent' });
  fireEvent.click(screen.getByRole('button', { name: 'Remove condition 1' })); expect(f.current().when!.conditions).toHaveLength(1);
  expect((screen.getByRole('button', { name: 'Remove condition 1' }) as HTMLButtonElement).disabled).toBe(true);
});
it('always required remains independent of any conditional rule and cannot be relaxed by hiding it', () => {
  const f = fixture(); fireEvent.click(screen.getByLabelText('Always require this detail')); enable();
  expect(f.current().always).toBe(true); expect(screen.getByText(/never makes an always-required detail optional/)).toBeTruthy();
  enable(); expect(f.current()).toEqual({ always: true, when: null }); expect(screen.getByText(/even if this detail is hidden/)).toBeTruthy();
});
it('preserves zero and false as explicit typed comparisons and clears incompatible literal when source changes', () => {
  const f = fixture(); enable(); select('Which detail?', `field:${id}`); select('Condition', 'equals');
  expect(f.current().when!.conditions[0]).toMatchObject({ value: { type: 'integer', value: 0 } });
  select('Which detail?', 'native:confirmed'); expect(f.current().when!.conditions[0]).toEqual({ choiceId: 'native:confirmed', operator: 'present' });
  select('Condition', 'equals'); select('Value', 'false'); expect(f.current().when!.conditions[0]).toMatchObject({ value: { type: 'boolean', value: false } });
  select('Value', 'true'); expect(f.current().when!.conditions[0]).toMatchObject({ value: { type: 'boolean', value: true } });
});
it('clearing a numeric comparison makes the request invalid instead of silently retaining the previous number', () => {
  const f = fixture(); enable(); select('Which detail?', `field:${id}`); select('Condition', 'equals');
  fireEvent.change(within(condition()).getByLabelText('Value'), { target: { value: '' } });
  expect(additionalFieldRequirementSchema.safeParse(f.current()).success).toBe(false);
  fireEvent.change(within(condition()).getByLabelText('Value'), { target: { value: '0' } }); expect(additionalFieldRequirementSchema.safeParse(f.current()).success).toBe(true);
});
it('reference/address-style inputs expose only presence checks, never arbitrary linked record identities', () => {
  const f = fixture(); enable(); select('Which detail?', 'native:linked');
  expect(within(condition()).queryByRole('option', { name: 'Is' })).toBeNull(); expect(within(condition()).queryByLabelText('Value')).toBeNull();
  select('Condition', 'absent'); expect(f.current().when!.conditions[0]).toEqual({ choiceId: 'native:linked', operator: 'absent' });
});
it('multi-choice rules use actual approved option labels and contains semantics', () => {
  const f = fixture(); enable(); select('Which detail?', 'native:tags'); select('Condition', 'contains'); select('Choice', 'f_blue');
  expect(f.current().when!.conditions[0]).toEqual({ choiceId: 'native:tags', operator: 'contains', optionId: 'f_blue' });
  expect(document.body.textContent).toContain('Site visit'); expect(document.body.textContent).not.toContain('f_blue');
});
it('money comparisons keep exact typed amount/currency and supported currencies only', () => {
  const f = fixture(); enable(); select('Which detail?', 'native:amount'); select('Condition', 'equals');
  fireEvent.change(within(condition()).getByLabelText('Amount'), { target: { value: '0.00' } }); select('Currency', 'EUR');
  expect(f.current().when!.conditions[0]).toMatchObject({ value: { type: 'money', value: { amount: '0.00', currency: 'EUR' } } });
});
it('retains existing rule/match until an explicit edit; removing when does not alter other required policy', () => {
  const initial = additionalFieldRequirementSchema.parse({ always: true, when: { match: 'any', conditions: [{ choiceId: 'native:status', operator: 'not_equals', value: { type: 'enum', value: 'NEW' } }] } });
  const f = fixture(initial); expect(f.changed).not.toHaveBeenCalled(); expect((screen.getByLabelText('Rule matching') as HTMLSelectElement).value).toBe('any');
  expect((within(condition()).getByLabelText('Value') as HTMLSelectElement).value).toBe('NEW'); enable(); expect(f.current()).toEqual({ always: true, when: null });
});
it('published/unsupported controls remain read-only and explain why existing rules are kept', () => {
  const initial: AdditionalFieldRequirement = { always: true, when: { match: 'all', conditions: [{ choiceId: 'native:missing', operator: 'present' }] } };
  const f = fixture(initial, { readOnlyReason: 'Published rules need a reviewed change.' });
  expect(screen.getByRole('status').textContent).toContain('reviewed change'); expect(screen.getByRole('option', { name: 'Saved condition unavailable' })).toBeTruthy();
  expect((screen.getByLabelText('Always require this detail') as HTMLInputElement).closest('fieldset')!.disabled).toBe(true); expect(f.changed).not.toHaveBeenCalled();
  expect(document.body.textContent).not.toContain('native:missing');
});
it('bounds conditions at twenty and disables the switch when no approved inputs exist', () => {
  const f = fixture({ always: false, when: { match: 'all', conditions: Array.from({ length: 20 }, () => ({ choiceId: 'native:status', operator: 'present' as const })) } });
  expect((screen.getByRole('button', { name: 'Add condition' }) as HTMLButtonElement).disabled).toBe(true); expect(f.changed).not.toHaveBeenCalled();
  cleanup(); const empty = fixture(undefined, { choices: [] }); expect((screen.getByLabelText('Also require it when a rule matches') as HTMLInputElement).disabled).toBe(true); expect(empty.changed).not.toHaveBeenCalled();
});
