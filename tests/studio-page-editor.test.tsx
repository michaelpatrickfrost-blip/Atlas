// @vitest-environment jsdom
import { useState } from 'react';
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { StudioPageEditor, type PageEditorCanvasProps, type PageEditorProps } from '@/components/studio/page-editor';
import { applyPagePreset, duplicatePageNode, removePageNode } from '@/components/studio/page-editor-model';
import type { PagePayload } from '@/core/studio/pages/schema';

// DOM/editor evidence only. Approved palette, server review/save and shared renderer
// are explicit fixture collaborators. No registry/data permission, publication,
// responsive browser pixels or live rendering/persistence is proven by these tests.
afterEach(cleanup);
const forms: PagePayload['formFactors'] = ['desktop', 'tablet', 'phone'];
const entity = { id: 'sales.order', version: 1, schemaHash: 'a'.repeat(64), contractHash: 'b'.repeat(64) };
const page = (): PagePayload => ({ schemaVersion: 1, entity, formFactors: forms, variants: [], sections: [
  { id: 'summary', label: 'Order summary', help: 'The key details', formFactors: forms, columns: { desktop: 2, tablet: 2, phone: 1 }, components: [
    { id: 'details', type: 'fields', label: 'Order details', formFactors: forms, fields: [{ source: 'native', fieldId: 'customer', mode: 'read' }, { source: 'native', fieldId: 'reference', mode: 'read' }] },
    { id: 'guidance', type: 'instructions', label: 'Next steps', text: 'Review the order before confirming.', formFactors: forms },
  ] },
  { id: 'delivery', label: 'Delivery', help: '', formFactors: forms, columns: { desktop: 1, tablet: 1, phone: 1 }, components: [
    { id: 'delivery_note', type: 'callout', label: 'Delivery note', text: 'Check the delivery address.', tone: 'info', formFactors: forms },
  ] },
] });
const operation = { id: 'sales.order.confirm', version: 1, schemaHash: 'c'.repeat(64), contractHash: 'd'.repeat(64) };
const palette: PageEditorProps['palette'] = [
  { key: 'guide', label: 'Instructions', description: 'Guide your team through the next step', component: { type: 'instructions', label: 'Helpful instructions', text: 'Describe the next step.', formFactors: forms } },
  { key: 'confirm', label: 'Confirm order', description: 'An approved Sales operation', component: { type: 'action', label: 'Confirm order', command: operation, collectInput: 'owner_schema', confirm: true, preview: true, icon: 'check', formFactors: forms }, sourceHref: '/sales/orders', whereUsedHref: '/studio/usage' },
];
const choices: PageEditorProps['fields'] = [
  { key: 'customer', label: 'Customer', field: { source: 'native', fieldId: 'customer', mode: 'read' }, editable: false, required: true },
  { key: 'reference', label: 'Order reference', field: { source: 'native', fieldId: 'reference', mode: 'read' }, editable: false, required: false },
  { key: 'priority', label: 'Priority', field: { source: 'native', fieldId: 'priority', mode: 'read' }, editable: true, required: false },
];
function mount(overrides: Partial<PageEditorProps> = {}) {
  let observed = overrides.page || page(), sequence = 0;
  const canvas = vi.fn((input: PageEditorCanvasProps) => <div data-testid="shared-canvas" data-mode={input.mode}>
    {input.page.sections.map(section => <section key={section.id}><button type="button" onClick={() => input.onSelect({ kind: 'section', id: section.id })}>Canvas {section.label}</button>{section.components.map(component => <button type="button" key={component.id} onClick={() => input.onSelect({ kind: 'component', id: component.id })}>Canvas {component.label}</button>)}</section>)}
  </div>);
  const save = vi.fn(async (submitted: PagePayload) => { void submitted; return { status: 'saved' as const }; });
  const publish = vi.fn(async (submitted: PagePayload) => { void submitted; });
  function Harness() {
    const [value, change] = useState(observed), [reviewed, setReviewed] = useState(observed);
    const externalSave = overrides.saveDraft || save;
    return <StudioPageEditor businessName="Northbridge" screenName="Sales order" workspaceHref="/sales" liveVersionLabel="Live design · Yesterday"
      palette={palette} fields={choices} presets={[{ key: 'simple', label: 'Simple order', description: 'A focused summary', sections: page().sections.slice(0, 1) }]}
      newSection={{ ...page().sections[1], label: 'New section' }} createNodeId={() => `node_${++sequence}`} renderCanvas={canvas}
      requestPublishReview={publish} {...overrides} page={value} onChange={next => { observed = next; change(next); overrides.onChange?.(next); }}
      saveDraft={async submitted => { const result = await externalSave(submitted); if (result.status === 'saved') setReviewed(submitted); return result; }}
      review={overrides.review || { page: reviewed, status: 'valid', messages: [] }}/>
  }
  const rendered = render(<Harness/>);
  return { ...rendered, canvas, save, publish, value: () => observed };
}
const chooseCanvas = (label: string) => fireEvent.click(screen.getByRole('button', { name: `Canvas ${label}` }));
const change = (label: string, value: string) => fireEvent.change(screen.getByLabelText(label), { target: { value } });

describe('controlled business page design workspace', () => {
  it('shows business context, draft/live distinction and friendly names without technical identifiers', () => {
    const view = mount();
    expect(screen.getByRole('heading', { name: 'Sales order' })).toBeTruthy();
    expect(screen.getByText('Editing draft')).toBeTruthy();
    expect(screen.getByText('Live design · Yesterday')).toBeTruthy();
    expect(view.container.textContent).not.toMatch(/sales\.order|schemaHash|stable key|node_|definitionId/);
    expect(view.canvas.mock.calls.at(-1)?.[0].interaction).toBe('design_only');
  });
  it('edits section labels/help and real column metadata through the controlled draft', () => {
    const view = mount();
    change('Display name', 'Order overview'); change('Helpful description', 'Check these details first.'); change('Desktop columns', '3');
    expect(view.value().sections[0]).toMatchObject({ label: 'Order overview', help: 'Check these details first.', columns: { desktop: 3, tablet: 2, phone: 1 } });
    expect(view.value().entity).toEqual(entity);
    expect(screen.getByText('Unsaved changes')).toBeTruthy();
    expect((screen.getByRole('button', { name: 'Review & publish' }) as HTMLButtonElement).disabled).toBe(true);
  });
  it('edits component device visibility without removing the last representation or changing the business field', () => {
    const view = mount(); chooseCanvas('Next steps');
    fireEvent.click(screen.getByRole('checkbox', { name: 'Phone' }));
    expect(view.value().sections[0].components[1].formFactors).toEqual(['desktop', 'tablet']);
    expect(view.value().sections[0].components[0].formFactors).toEqual(forms);
    fireEvent.click(screen.getByRole('checkbox', { name: 'Tablet' }));
    expect(screen.getByRole('checkbox', { name: 'Desktop' }).hasAttribute('disabled')).toBe(true);
    fireEvent.click(screen.getByRole('checkbox', { name: 'Phone' }));
    expect(view.value().sections[0].components[1].formFactors).toEqual(['desktop', 'phone']);
    expect(view.value().sections[0].components[1]).toMatchObject({ text: 'Review the order before confirming.' });
  });
  it('adds only a supplied library item to the selected section and edits its text', () => {
    const view = mount(); chooseCanvas('Delivery');
    fireEvent.click(screen.getByRole('button', { name: 'Add Instructions' }));
    change('Instructions', 'Arrange a delivery time.');
    const item = view.value().sections[1].components.at(-1);
    expect(item).toMatchObject({ type: 'instructions', text: 'Arrange a delivery time.', id: 'node_1' });
    expect(view.value().sections[0].components).toHaveLength(2);
    expect(screen.queryByRole('button', { name: /Arbitrary script/ })).toBeNull();
  });
  it('reorders and duplicates selected components with unique generated node identities', () => {
    const view = mount(); chooseCanvas('Next steps');
    fireEvent.click(screen.getByRole('button', { name: 'Move selected item up' }));
    expect(view.value().sections[0].components[0].id).toBe('guidance');
    fireEvent.click(screen.getByRole('button', { name: 'Duplicate selected item' }));
    expect(view.value().sections[0].components.map(item => item.id)).toEqual(['guidance', 'node_1', 'details']);
    expect(view.value().sections[0].components[1]).toMatchObject({ type: 'instructions', text: 'Review the order before confirming.' });
  });
  it('shows removal impact, traps keyboard focus and allows Escape to keep the design', () => {
    const view = mount(); chooseCanvas('Next steps');
    fireEvent.click(screen.getByRole('button', { name: 'Remove selected item' }));
    const dialog = screen.getByRole('dialog');
    expect(within(dialog).getByText(/Stored business information is kept/)).toBeTruthy();
    const keep = within(dialog).getByRole('button', { name: 'Keep my design' });
    const confirm = within(dialog).getByRole('button', { name: 'Confirm change' });
    expect(document.activeElement).toBe(keep);
    fireEvent.keyDown(keep, { key: 'Tab', shiftKey: true }); expect(document.activeElement).toBe(confirm);
    fireEvent.keyDown(confirm, { key: 'Tab' }); expect(document.activeElement).toBe(keep);
    fireEvent.keyDown(dialog, { key: 'Escape' }); expect(screen.queryByRole('dialog')).toBeNull();
    expect(view.value().sections[0].components).toHaveLength(2);
    fireEvent.click(screen.getByRole('button', { name: 'Remove selected item' }));
    fireEvent.click(screen.getByRole('button', { name: 'Confirm change' }));
    expect(view.value().sections[0].components).toHaveLength(1);
  });
  it('uses confirmable supplied presets and preserves entity/form-factor settings', () => {
    const view = mount(); fireEvent.click(screen.getByRole('button', { name: 'Use Simple order' }));
    expect(view.value().sections).toHaveLength(2);
    expect(screen.getByText(/replaces 2 existing sections/)).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Confirm change' }));
    expect(view.value().sections).toHaveLength(1); expect(view.value().entity).toEqual(entity);
    expect(view.value().formFactors).toEqual(forms); expect(view.value().sections[0].id).toBe('node_1');
  });
  it('keeps required native fields read-only while customising labels/help/order and approved additions', () => {
    const view = mount(); chooseCanvas('Order details');
    change('Customer label', 'Bill to'); change('Customer help', 'Your invoiced customer.');
    expect((screen.getByRole('button', { name: 'Remove Bill to from group' }) as HTMLButtonElement).disabled).toBe(true);
    expect(screen.queryByLabelText('Allow editing')).toBeNull();
    change('Add a detail', 'priority');
    const editable = screen.getByLabelText('Allow editing'); fireEvent.click(editable);
    const group = view.value().sections[0].components[0];
    if (group.type !== 'fields') throw new Error('Wrong fixture component');
    expect(group.fields[0]).toMatchObject({ source: 'native', fieldId: 'customer', label: 'Bill to', help: 'Your invoiced customer.', mode: 'read' });
    expect(group.fields[2]).toEqual({ source: 'native', fieldId: 'priority', mode: 'edit' });
    fireEvent.click(screen.getByRole('button', { name: 'Move Priority up' }));
    expect(view.value().sections[0].components[0]).toMatchObject({ fields: [{ fieldId: 'customer' }, { fieldId: 'priority' }, { fieldId: 'reference' }] });
  });
  it('passes actual selected device and disabled-interaction preview to the single shared renderer seam', () => {
    const view = mount(); fireEvent.click(screen.getByRole('button', { name: 'Tablet preview' }));
    expect(view.container.querySelector('[data-form-factor="tablet"]')).toBeTruthy();
    expect(view.canvas.mock.calls.at(-1)?.[0].formFactor).toBe('tablet');
    fireEvent.click(screen.getByRole('button', { name: 'Phone preview' }));
    fireEvent.click(screen.getByRole('button', { name: 'Preview' }));
    const input = view.canvas.mock.calls.at(-1)![0];
    expect(input).toMatchObject({ formFactor: 'phone', mode: 'preview', selection: null, interaction: 'design_only' });
    input.onSelect({ kind: 'section', id: 'delivery' });
    expect((screen.getByLabelText('Display name') as HTMLInputElement).value).toBe('Order summary');
    expect(view.publish).not.toHaveBeenCalled(); expect(view.save).not.toHaveBeenCalled();
  });
  it('preserves typed approved button operation and never invokes it in preview', () => {
    const view = mount(); fireEvent.click(screen.getByRole('button', { name: 'Add Confirm order' }));
    change('Display name', 'Send for confirmation');
    const button = view.value().sections[0].components.at(-1);
    expect(button).toMatchObject({ type: 'action', label: 'Send for confirmation', command: operation, confirm: true, collectInput: 'owner_schema' });
    expect(screen.getByRole('link', { name: 'Go to source' }).getAttribute('href')).toBe('/sales/orders');
    fireEvent.click(screen.getByRole('button', { name: 'Preview' })); expect(view.publish).not.toHaveBeenCalled();
  });
  it.each(['conflict', 'invalid'] as const)('retains unsaved design on %s and does not enable publication', async status => {
    const saveDraft = vi.fn(async () => ({ status }));
    const view = mount({ saveDraft }); change('Display name', 'My order screen');
    fireEvent.click(screen.getByRole('button', { name: 'Save draft' }));
    await waitFor(() => expect(screen.getByRole('status').textContent).toMatch(/changes are kept|design is kept/));
    expect(view.value().sections[0].label).toBe('My order screen');
    expect(screen.getByText('Unsaved changes')).toBeTruthy();
    expect((screen.getByRole('button', { name: 'Review & publish' }) as HTMLButtonElement).disabled).toBe(true);
  });
  it('keeps edits made during a pending save unsaved after that earlier snapshot succeeds', async () => {
    let complete!: (result: { status: 'saved' }) => void;
    const saveDraft = vi.fn((submitted: PagePayload) => { void submitted; return new Promise<{ status: 'saved' }>(resolve => { complete = resolve; }); });
    const view = mount({ saveDraft }); change('Display name', 'First design');
    fireEvent.click(screen.getByRole('button', { name: 'Save draft' })); change('Display name', 'Later changes');
    expect(saveDraft.mock.calls[0][0].sections[0].label).toBe('First design');
    complete({ status: 'saved' }); await waitFor(() => expect(screen.getByText('Unsaved changes')).toBeTruthy());
    expect(view.value().sections[0].label).toBe('Later changes');
    expect((screen.getByRole('button', { name: 'Review & publish' }) as HTMLButtonElement).disabled).toBe(true);
  });
  it('enables only saved designs with matching current review and requests external review rather than activation', async () => {
    const view = mount(); change('Display name', 'Ready order');
    fireEvent.click(screen.getByRole('button', { name: 'Save draft' }));
    await waitFor(() => expect((screen.getByRole('button', { name: 'Review & publish' }) as HTMLButtonElement).disabled).toBe(false));
    fireEvent.click(screen.getByRole('button', { name: 'Review & publish' }));
    await waitFor(() => expect(view.publish).toHaveBeenCalledOnce());
    expect(view.save.mock.calls[0][0].sections[0].label).toBe('Ready order');
  });
  it('blocks publication when review is stale or invalid and displays plain-language issues', () => {
    const reviewed = page(), supplied = page(); supplied.sections[0].label = 'Another draft';
    mount({ page: supplied, review: { page: reviewed, status: 'valid', messages: [{ severity: 'error', message: 'Keep Customer visible on phone screens.' }] } });
    expect((screen.getByRole('button', { name: 'Review & publish' }) as HTMLButtonElement).disabled).toBe(true);
    expect(screen.getByText(/Keep Customer visible on phone screens/)).toBeTruthy();
  });
});

describe('pure layout operations preserve structure and variant references', () => {
  it('duplicates sections with distinct node identities while retaining field/source contracts', () => {
    let id = 0; const original = page(); const result = duplicatePageNode(original, { kind: 'section', id: 'summary' }, () => `copy_${++id}`);
    expect(result.page.sections[1]).toMatchObject({ id: 'copy_1', label: 'Order summary (copy)', components: [{ id: 'copy_2' }, { id: 'copy_3' }] });
    expect(result.page.sections[1].components[0]).toMatchObject({ fields: original.sections[0].components[0].type === 'fields' ? original.sections[0].components[0].fields : [] });
    expect(original.sections).toHaveLength(2);
  });
  it('prevents deleting referenced items or replacing the base of retained variants', () => {
    const original = page(); original.variants = [{ id: 'variant', label: 'Priority orders', priority: 1, when: { kind: 'capabilities', mode: 'all', capabilities: ['sales.order.read'] }, patches: [{ operation: 'setComponent', componentId: 'guidance', properties: { label: 'Priority guidance' } }] }];
    expect(() => removePageNode(original, { kind: 'component', id: 'guidance' })).toThrow('Another layout uses this item');
    expect(() => removePageNode(original, { kind: 'section', id: 'summary' })).toThrow('Another layout uses this item');
    expect(() => applyPagePreset(original, page().sections, () => 'copy')).toThrow('other layouts');
  });
  it('rejects duplicate generated identities and protects the last usable section/item', () => {
    expect(() => duplicatePageNode(page(), { kind: 'component', id: 'guidance' }, () => 'details')).toThrow('could not be added');
    const one = { ...page(), sections: page().sections.slice(1) };
    expect(() => removePageNode(one, { kind: 'section', id: 'delivery' })).toThrow('at least one section');
    expect(() => removePageNode(one, { kind: 'component', id: 'delivery_note' })).toThrow('at least one item');
  });
});

describe('approved fact panels and table properties', () => {
  const query = { id: 'sales.order.page_lines', version: 1, schemaHash: 'e'.repeat(64), contractHash: 'f'.repeat(64) };
  const factItems: PageEditorProps['palette'] = [
    { key: 'urgent', label: 'Urgent', description: 'Read-only priority detail', component: { type: 'facts', factIds: ['urgent'], formFactors: forms } },
    { key: 'score', label: 'Score', description: 'Read-only score', component: { type: 'facts', factIds: ['score'], formFactors: forms } },
  ];
  const tableItem: PageEditorProps['palette'][number] = { key: 'lines', label: 'Order lines', description: 'Approved related records', component: { type: 'queryList',
    query, pageSize: 5, columns: ['reference', 'amount'], formFactors: forms }, table: {
      columns: [{ id: 'reference', label: 'Reference' }, { id: 'amount', label: 'Amount' }, { id: 'priority', label: 'Priority' }], maxPageSize: 7,
    } };
  const designed = (): PagePayload => { const next = page(); next.sections[0].components.push(
    { id: 'facts', type: 'facts', label: 'At a glance', factIds: ['urgent'], formFactors: forms },
    { id: 'lines', type: 'queryList', label: 'Order lines', query, pageSize: 3, columns: ['amount', 'reference'], formFactors: forms }); return next; };
  it('edits approved fact details/order without evaluating rule inputs', () => {
    const view = mount({ page: designed(), palette: [...palette, ...factItems, tableItem] }); chooseCanvas('At a glance');
    expect((screen.getByRole('button', { name: 'Remove Urgent from panel' }) as HTMLButtonElement).disabled).toBe(true);
    change('Add a summary detail', 'score');
    fireEvent.click(screen.getByRole('button', { name: 'Move Score up' }));
    expect(view.value().sections[0].components.find(item => item.id === 'facts')).toMatchObject({ factIds: ['score', 'urgent'] });
    fireEvent.click(screen.getByRole('button', { name: 'Remove Urgent from panel' }));
    expect(view.value().sections[0].components.find(item => item.id === 'facts')).toMatchObject({ factIds: ['score'] });
    change('Add a summary detail', 'unapproved');
    expect(view.value().sections[0].components.find(item => item.id === 'facts')).toMatchObject({ factIds: ['score'] });
    expect(view.container.textContent).not.toMatch(/schemaHash|sales\.order\.page_lines/);
  });
  it('preserves saved table column order and lets approved columns move, leave and return without changing its query', () => {
    const view = mount({ page: designed(), palette: [...palette, ...factItems, tableItem] }); chooseCanvas('Order lines');
    expect(view.value().sections[0].components.find(item => item.id === 'lines')).toMatchObject({ columns: ['amount', 'reference'], pageSize: 3 });
    fireEvent.click(screen.getByRole('button', { name: 'Move Reference column up' }));
    fireEvent.click(screen.getByRole('button', { name: 'Remove Amount column' })); change('Add a column', 'priority');
    expect(view.value().sections[0].components.find(item => item.id === 'lines')).toMatchObject({ query, columns: ['reference', 'priority'], pageSize: 3 });
    change('Add a column', 'arbitrary');
    expect(view.value().sections[0].components.find(item => item.id === 'lines')).toMatchObject({ columns: ['reference', 'priority'] });
    expect(screen.getByText('Unsaved changes')).toBeTruthy();
    expect((screen.getByRole('button', { name: 'Review & publish' }) as HTMLButtonElement).disabled).toBe(true);
  });
  it('bounds rows by this actual approved query and prevents removing the final column', () => {
    const view = mount({ page: designed(), palette: [...palette, ...factItems, tableItem] }); chooseCanvas('Order lines');
    expect(within(screen.getByLabelText('Rows per page')).getAllByRole('option')).toHaveLength(7);
    change('Rows per page', '7'); change('Rows per page', '50');
    expect(view.value().sections[0].components.find(item => item.id === 'lines')).toMatchObject({ pageSize: 7 });
    fireEvent.click(screen.getByRole('button', { name: 'Remove Amount column' }));
    expect((screen.getByRole('button', { name: 'Remove Reference column' }) as HTMLButtonElement).disabled).toBe(true);
  });
  it.each(['missing-source', 'unknown-column', 'over-bound'])('keeps unsupported saved table %s explicit/read-only without rewriting it', mode => {
    const initial = designed(), table = initial.sections[0].components.find(item => item.id === 'lines'); if (!table || table.type !== 'queryList') throw new Error('Missing fixture');
    if (mode === 'unknown-column') table.columns = ['retained_private_column'];
    if (mode === 'over-bound') table.pageSize = 8;
    const view = mount({ page: initial, palette: mode === 'missing-source' ? palette : [...palette, tableItem] }); chooseCanvas('Order lines');
    expect(screen.getByText(/This table's saved choices are currently unavailable/)).toBeTruthy();
    expect(screen.queryByLabelText('Rows per page')).toBeNull(); expect(screen.queryByLabelText('Add a column')).toBeNull(); expect(view.value()).toEqual(initial);
  });
  it('keeps a retained unavailable fact panel unchanged and offers no guessed choices', () => {
    const initial = designed(), facts = initial.sections[0].components.find(item => item.id === 'facts'); if (!facts || facts.type !== 'facts') throw new Error('Missing fixture');
    facts.factIds.push('unavailable'); const view = mount({ page: initial, palette: [...palette, ...factItems] }); chooseCanvas('At a glance');
    expect(screen.getByText(/This panel includes a detail that is currently unavailable/)).toBeTruthy();
    expect(screen.queryByLabelText('Add a summary detail')).toBeNull(); expect(view.value()).toEqual(initial);
  });
});
