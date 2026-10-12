// @vitest-environment jsdom
import { useState } from 'react';
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { StudioPageEditor, type PageEditorCanvasProps } from '@/components/studio/page-editor';
import { addConditionalVariant, editableRules, factRule, recordTypeRule, moveConditionalVariant, patchVariantNode, variantDesignPage, type PageEditorConditions } from '@/components/studio/page-conditions-model';
import { PageConditionControls } from '@/components/studio/page-conditions';
import { pagePayloadSchema, type PagePayload, type VisibilityPredicate } from '@/core/studio/pages/schema';
import { applyPagePatches } from '@/core/studio/pages/patches';

// Actual editor, schema and shared patch engine. Approved metadata/server save
// are explicit collaborators; no owning facts, SQL or live publication evidence.
afterEach(cleanup);
const forms: PagePayload['formFactors'] = ['desktop', 'tablet', 'phone'];
const catalog: PageEditorConditions = { variantsAllowed: true, facts: [
  { id: 'status', label: 'Ticket status', choices: [{ label: 'New', value: 'NEW' }, { label: 'Closed', value: 'CLOSED' }] },
  { id: 'urgent', label: 'Urgent', choices: [{ label: 'No', value: false }, { label: 'Yes', value: true }] },
  { id: 'score', label: 'Service score', choices: [{ label: 'Zero', value: 0 }, { label: 'Not set', value: null }] },
] };
const page = (): PagePayload => ({ schemaVersion: 1, entity: { id: 'tickets.ticket', version: 9, schemaHash: 'a'.repeat(64), contractHash: 'b'.repeat(64) }, formFactors: forms, variants: [], sections: [{ id: 'main', label: 'Ticket overview', help: '', formFactors: forms, columns: { desktop: 2, tablet: 2, phone: 1 }, components: [{ id: 'guide', type: 'instructions', label: 'Next steps', text: 'Review the ticket.', formFactors: forms }] }, { id: 'details', label: 'More details', help: '', formFactors: forms, columns: { desktop: 1, tablet: 1, phone: 1 }, components: [{ id: 'note', type: 'instructions', label: 'Helpful note', text: 'Keep the owner informed.', formFactors: forms }] }] });
function mount(initial = page(), conditions = catalog) {
  let observed = initial, sequence = 0;
  const save = vi.fn(async (input: PagePayload) => { observed = input; return { status: 'saved' as const }; });
  const canvas = vi.fn((input: PageEditorCanvasProps) => <div data-testid="canvas" data-variant={input.designVariantId ?? ''}>{input.page.sections.map(section => <div key={section.id}><button onClick={() => input.onSelect({ kind: 'section', id: section.id })}>{section.label}</button>{section.components.map(component => <button key={component.id} onClick={() => input.onSelect({ kind: 'component', id: component.id })}>{component.label}</button>)}</div>)}</div>);
  function Harness() { const [value, change] = useState(initial); return <StudioPageEditor businessName="Example" screenName="Tickets" workspaceHref="/tickets" page={value} onChange={next => { observed = next; change(next); }} createNodeId={() => `variant_${++sequence}`} fields={[]} palette={[]} presets={[]} conditions={conditions} newSection={page().sections[1]} renderCanvas={canvas} saveDraft={save} review={{ page: initial, status: 'valid', messages: [] }}/>; }
  const view = render(<Harness/>); return { ...view, value: () => observed, canvas, save };
}
const choose = (label: string, value: string) => fireEvent.change(screen.getByLabelText(label), { target: { value } });
const button = (name: string) => screen.getByRole('button', { name }) as HTMLButtonElement;

describe('approved visual conditions and alternate layouts', () => {
  it('authors section and component visibility with friendly choices and exact false/zero/null values', () => {
    const f = mount(); choose('Show this item', 'when'); choose('Business detail 1', 'urgent');
    expect(f.value().sections[0].visibleWhen).toEqual({ kind: 'fact', factId: 'urgent', operator: 'equals', values: [false] });
    choose('Business detail 1', 'score'); expect(f.value().sections[0].visibleWhen).toMatchObject({ values: [0] });
    choose('Is equal to 1', '1'); expect(f.value().sections[0].visibleWhen).toMatchObject({ values: [null] });
    fireEvent.click(within(screen.getByTestId('canvas')).getByRole('button', { name: 'Helpful note' })); choose('Show this item', 'when');
    expect(f.value().sections[1].components[0].visibleWhen).toMatchObject({ factId: 'status', values: ['NEW'] });
    expect(f.container.textContent).not.toMatch(/schemaHash|factId|stable key|tickets\.ticket|definitionId/);
  });
  it('offers All/Any, bounded rows and explicit Always without weakening required rules', () => {
    const f = mount(); choose('Show this item', 'when'); fireEvent.click(button('Add condition')); choose('Match conditions', 'any');
    expect(f.value().sections[0].visibleWhen).toMatchObject({ kind: 'any', predicates: [{ kind: 'fact' }, { kind: 'fact' }] });
    for (let i = 2; i < 8; i++) fireEvent.click(button('Add condition'));
    expect(button('Add condition').disabled).toBe(true); choose('Show this item', 'always'); expect(f.value().sections[0].visibleWhen).toBeUndefined();
    expect(screen.getByText(/Required details and business permissions still apply/)).toBeTruthy();
  });
  it('preserves unsupported saved conditions until explicitly replaced', () => {
    const initial = page(); initial.sections[1].visibleWhen = { kind: 'capabilities', mode: 'all', capabilities: ['tickets.ticket.manage'] };
    const f = mount(initial); fireEvent.click(within(screen.getByTestId('canvas')).getByRole('button', { name: 'More details' }));
    expect(screen.getByText(/advanced conditions/)).toBeTruthy(); expect(f.value().sections[1].visibleWhen).toEqual(initial.sections[1].visibleWhen);
    fireEvent.click(button('Replace with a simple condition')); expect(f.value().sections[1].visibleWhen).toEqual(factRule(catalog));
  });
  it('creates a labelled conditional layout, edits it via shared presentation patches and saves the whole base envelope', async () => {
    const f = mount(); fireEvent.click(button('Add conditional layout')); expect((screen.getByLabelText('Screen layout') as HTMLSelectElement).value).toBe('variant_1');
    choose('Layout name', 'Closed ticket summary'); choose('Display name', 'Closure overview'); choose('Desktop columns', '3');
    expect(f.value().sections[0].label).toBe('Ticket overview');
    expect(variantDesignPage(f.value(), 'variant_1').sections[0]).toMatchObject({ label: 'Closure overview', columns: { desktop: 3, phone: 1 } });
    expect(f.value().variants[0].patches).toHaveLength(1); expect(button('Add section').disabled).toBe(true); expect(screen.queryByLabelText('Instructions')).toBeNull();
    expect(f.canvas.mock.calls.at(-1)?.[0].designVariantId).toBe('variant_1');
    fireEvent.click(button('Save draft')); await waitFor(() => expect(f.save).toHaveBeenCalled());
    expect(f.save.mock.calls[0][0].sections[0].label).toBe('Ticket overview'); expect(f.save.mock.calls[0][0].variants[0].label).toBe('Closed ticket summary');
    choose('Screen layout', ''); expect((screen.getByLabelText('Display name') as HTMLInputElement).value).toBe('Ticket overview');
  });
  it('keeps device changes in an alternate component presentation patch, preserving the base layout', () => {
    const f = mount(); fireEvent.click(button('Add conditional layout'));
    fireEvent.click(within(screen.getByTestId('canvas')).getByRole('button', { name: 'Next steps' }));
    fireEvent.click(screen.getByRole('checkbox', { name: 'Phone' }));
    expect(f.value().sections[0].components[0].formFactors).toEqual(forms);
    expect(variantDesignPage(f.value(), 'variant_1').sections[0].components[0].formFactors).toEqual(['desktop', 'tablet']);
    expect(f.value().variants[0].patches).toContainEqual({ operation: 'setComponent', componentId: 'guide', properties: { formFactors: ['desktop', 'tablet'] } });
  });
  it('reorders unique priorities and confirms removing an alternate layout while retaining the default', () => {
    const f = mount(); fireEvent.click(button('Add conditional layout')); choose('Layout name', 'First'); fireEvent.click(button('Add conditional layout')); choose('Layout name', 'Second');
    fireEvent.click(button('Use after other layouts')); expect([...f.value().variants].sort((a, b) => b.priority - a.priority).map(value => value.label)).toEqual(['First', 'Second']);
    expect(new Set(f.value().variants.map(value => value.priority)).size).toBe(2);
    fireEvent.click(button('Remove this layout')); expect(f.value().variants).toHaveLength(2); fireEvent.click(button('Confirm change'));
    expect(f.value().variants).toHaveLength(1); expect(f.value().sections).toEqual(page().sections);
  });
  it('preserves advanced structural variants read-only and never offers variants for a closed owner', () => {
    const initial = page(); initial.variants = [{ id: 'advanced', label: 'Advanced existing', priority: 4, when: factRule(catalog), patches: [{ operation: 'removeSection', sectionId: 'details' }] }];
    const f = mount(initial); choose('Screen layout', 'advanced'); expect(screen.getByText(/advanced changes and is read-only/)).toBeTruthy();
    expect(screen.getByLabelText('Display name').matches(':disabled')).toBe(true); expect(f.value()).toEqual(initial);
    cleanup(); mount(page(), { ...catalog, variantsAllowed: false }); expect(button('Add conditional layout').disabled).toBe(true);
  });
  it('keeps a mandatory layout selector condition present and denies unapproved comparisons', () => {
    const changes = vi.fn(); render(<PageConditionControls value={factRule(catalog)} catalog={catalog} change={changes} required/>);
    expect(button('Remove condition 1').disabled).toBe(true); expect(screen.queryByLabelText('Show this item')).toBeNull();
    expect(() => factRule(catalog, 'private_queue')).toThrow(/approved business condition/);
    expect(editableRules({ kind: 'fact', factId: 'urgent', operator: 'equals', values: ['false'] }, catalog)).toBeNull();
  });
  it('merges retained disjoint presentation patches rather than creating compiler property collisions', () => {
    const base = page(), variant = addConditionalVariant(base, catalog, 'first');
    variant.variants[0].patches.push({ operation: 'setSection', sectionId: 'main', properties: { help: 'Retained help' } });
    const next = patchVariantNode(variant, 'first', { kind: 'section', id: 'main' }, node => ({ ...node, help: 'Updated help' }));
    expect(next.variants[0].patches).toHaveLength(1); expect(variantDesignPage(next, 'first').sections[0]).toMatchObject({ help: 'Updated help', label: 'Ticket overview · Alternative layout' });
    expect(base.sections).toEqual(page().sections); expect(() => patchVariantNode(next, 'first', { kind: 'component', id: 'guide' }, node => ({ ...node, text: 'Unsafe broad mutation' }))).toThrow(/default layout/);
  });
  it('retains the single shared patch engine conflict rules and complete schema bounds', () => {
    const base = page(), first = addConditionalVariant(base, catalog, 'first'), next = addConditionalVariant(first, catalog, 'second');
    expect(pagePayloadSchema.parse(moveConditionalVariant(next, 'first', -1)).variants).toHaveLength(2);
    expect(() => addConditionalVariant(first, catalog, 'first')).toThrow();
    expect(() => applyPagePatches(base.sections, [{ operation: 'setSection', sectionId: 'main', properties: { label: 'One' } }, { operation: 'setSection', sectionId: 'main', properties: { label: 'Two' } }])).toThrow(/Conflicting/);
    const absent: VisibilityPredicate = { kind: 'fact', factId: 'unknown', operator: 'equals', values: [false] }; expect(editableRules(absent, catalog)).toBeNull();
  });
});


const typeId = (n: number) => `40000000-0000-4000-8000-${String(n).padStart(12, '0')}`;
const typedCatalog: PageEditorConditions = { ...catalog, recordTypes: [{ id: typeId(1), label: 'Customer complaint' }, { id: typeId(2), label: 'Equipment issue' }] };
it('visually selects business record types alongside native facts with All/Any and no technical names', () => {
  const f = mount(page(), typedCatalog); choose('Show this item', 'when'); choose('Business detail 1', '__record_type__');
  expect(f.value().sections[0].visibleWhen).toEqual(recordTypeRule(typedCatalog));
  choose('Is equal to 1', '1'); expect(f.value().sections[0].visibleWhen).toEqual(recordTypeRule(typedCatalog, typeId(2)));
  fireEvent.click(button('Add condition')); choose('Business detail 2', 'urgent'); choose('Match conditions', 'any');
  expect(f.value().sections[0].visibleWhen).toEqual({ kind: 'any', predicates: [recordTypeRule(typedCatalog, typeId(2)), factRule(typedCatalog, 'urgent')] });
  expect(f.container.textContent).toContain('Customer complaint'); expect(f.container.textContent).not.toMatch(/definitionId|40000000|schemaHash|stable key/);
  choose('Business detail 1', 'score'); expect(f.value().sections[0].visibleWhen).toMatchObject({ predicates: [{ values: [0] }, { values: [false] }] });
});
it('adds a conditional layout for a type-only owner catalogue using the same shallow patch engine', () => {
  const conditions = { ...typedCatalog, facts: [] }, f = mount(page(), conditions); fireEvent.click(button('Add conditional layout'));
  expect(f.value().variants[0].when).toEqual(recordTypeRule(conditions)); expect(button('Remove condition 1').disabled).toBe(true);
  choose('Is equal to 1', '1'); expect(f.value().variants[0].when).toEqual(recordTypeRule(conditions, typeId(2)));
  choose('Display name', 'Equipment view'); expect(variantDesignPage(f.value(), 'variant_1').sections[0].label).toBe('Equipment view');
  expect(f.value().sections[0].label).toBe('Ticket overview');
});
it('preserves saved unknown, retired or unavailable type conditions until explicit replacement', () => {
  const initial = page(); initial.sections[1].visibleWhen = { kind: 'recordType', definitionId: typeId(90) };
  const f = mount(initial, typedCatalog); fireEvent.click(within(screen.getByTestId('canvas')).getByRole('button', { name: 'More details' }));
  expect(screen.getByText(/advanced conditions/)).toBeTruthy(); expect(f.value().sections[1].visibleWhen).toEqual(initial.sections[1].visibleWhen);
  expect(() => recordTypeRule(typedCatalog, typeId(90))).toThrow(/approved business record type/);
  fireEvent.click(button('Replace with a simple condition')); expect(f.value().sections[1].visibleWhen).toEqual(factRule(typedCatalog));
  expect(editableRules({ kind: 'any', predicates: [recordTypeRule(typedCatalog), { kind: 'capabilities', mode: 'all', capabilities: ['tickets.ticket.manage'] }] }, typedCatalog)).toBeNull();
});
