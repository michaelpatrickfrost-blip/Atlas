// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { SavedPageEditor, type SavedPageEditorProps } from '@/components/studio/saved-page-editor';
import { createDesignPageDisplayModel } from '@/core/studio/pages/design-model';
import type { PagePayload } from '@/core/studio/pages/schema';

// Real controlled editor and shared renderer; server callbacks are explicit
// collaborators. These DOM cases do not prove SQL authority/atomicity or live UI.
afterEach(cleanup);
const forms: PagePayload['formFactors'] = ['desktop', 'tablet', 'phone'];
const page = (): PagePayload => ({ schemaVersion: 1, entity: { id: 'sales.order', version: 1, schemaHash: 'a'.repeat(64), contractHash: 'b'.repeat(64) }, formFactors: forms, variants: [], sections: [{ id: 'main', label: 'Order overview', help: '', formFactors: forms, columns: { desktop: 2, tablet: 2, phone: 1 }, components: [{ id: 'guide', type: 'instructions', label: 'Next steps', text: 'Check the order.', formFactors: forms }] }] });
const catalog = { nativeFields: [], customFields: [], facts: [], queries: [], actions: [], metrics: [], surfaces: [] };
function deferred<T>() { let resolve!: (value: T) => void; let reject!: (error: Error) => void; const promise = new Promise<T>((yes, no) => { resolve = yes; reject = no; }); return { promise, resolve, reject }; }
function fixture(initial = page()) {
  let saved = initial;
  const callbacks = {
    save: vi.fn<SavedPageEditorProps['callbacks']['save']>(async input => { saved = input.payload; return { revision: input.revision + 1, warnings: [] }; }),
    review: vi.fn<SavedPageEditorProps['callbacks']['review']>(async input => ({ revision: input.revision, payload: saved, warnings: [], changes: ['Order overview is easier to scan.'] })),
    inspect: vi.fn<NonNullable<SavedPageEditorProps['callbacks']['inspect']>>(async input => ({ ...input, warnings: [] })),
    publish: vi.fn<SavedPageEditorProps['callbacks']['publish']>(async input => ({ revision: input.revision, definitionRevision: 4, versionId: 'new', versionLabel: 'Version 3' })),
    restore: vi.fn<SavedPageEditorProps['callbacks']['restore']>(async input => ({ revision: 1, definitionRevision: 4, payload: saved, warnings: [], activeVersionId: input.versionId })),
    chooseSample: vi.fn<SavedPageEditorProps['callbacks']['chooseSample']>(async () => [{ id: 'record_1', label: 'SO-0001' }]),
    preview: vi.fn<SavedPageEditorProps['callbacks']['preview']>(async input => { const model = createDesignPageDisplayModel(input.payload, catalog, input.formFactor); model.sections[0].components[0] = { id: 'guide', label: 'Actual order', help: '', type: 'instructions', text: 'Approved record content', tone: 'info' }; return model; }),
    compareSavedDraft: vi.fn<NonNullable<SavedPageEditorProps['callbacks']['compareSavedDraft']>>(async input => {
      const remote = page(); remote.sections[0].label = 'Latest saved layout';
      return { revision: 2, definitionRevision: 4, activeVersionId: 'current', payload: remote,
        presentation: { saved: { catalog, fields: [], palette: [], conditions: { variantsAllowed: false, facts: [], recordTypes: [] } }, local: { catalog, fields: [], palette: [], conditions: { variantsAllowed: false, facts: [], recordTypes: [] } } },
        model: createDesignPageDisplayModel(remote, catalog, input.formFactor), changes: ['Order overview has a different label.'], warnings: [] };
    }),
    compare: vi.fn<NonNullable<SavedPageEditorProps['callbacks']['compare']>>(async input => {
      const previous = page(); previous.sections[0].label = 'Previous order overview';
      return { versionId: input.versionId, definitionRevision: input.definitionRevision, label: 'Version 1',
        model: createDesignPageDisplayModel(previous, catalog, input.formFactor) };
    }),
  };
  const props: SavedPageEditorProps = { business: { id: 'company', name: 'Example business', workspaceHref: '/atlas/studio/company' }, draft: { id: 'draft', name: 'Sales order', revision: 1, definitionRevision: 3, activeVersionId: 'current', versions: [{ id: 'old', label: 'Version 1' }, { id: 'current', label: 'Version 2' }], payload: saved, warnings: [] }, catalog, palette: [], fields: [], presets: [], scope: 'record', callbacks };
  return { props, callbacks, ...render(<SavedPageEditor {...props} />) };
}
const edit = (name: string) => fireEvent.change(screen.getByLabelText('Display name'), { target: { value: name } });
const button = (name: string) => screen.getByRole('button', { name }) as HTMLButtonElement;
const ready = async () => { await waitFor(() => expect(button('Review & publish').disabled).toBe(false)); };
const openReview = async () => { await ready(); fireEvent.click(button('Review & publish')); return screen.findByRole('dialog'); };

describe('saved business visual design adapter', () => {
  it('compares the actual saved head after a save conflict and keeps local edits until an explicit choice', async () => {
    const f = fixture(); await ready(); edit('My preserved design');
    f.callbacks.save.mockRejectedValueOnce(new Error('CONFLICT: another editor saved')); fireEvent.click(button('Save draft'));
    await screen.findByText(/Saving could not be confirmed/); fireEvent.click(button('Compare saved draft'));
    const dialog = await screen.findByRole('dialog', { name: 'Compare the saved draft' });
    expect(f.callbacks.compareSavedDraft).toHaveBeenCalledWith({ revision: 1, definitionRevision: 3, payload: expect.objectContaining({ sections: [expect.objectContaining({ label: 'My preserved design' })] }), formFactor: 'desktop' });
    expect(within(dialog).getByRole('region', { name: 'Saved draft preview' }).textContent).toContain('Latest saved layout');
    expect(within(dialog).getByRole('region', { name: 'Unsaved draft preview' }).textContent).toContain('My preserved design');
    expect(within(dialog).getByText('Order overview has a different label.')).toBeTruthy();
    fireEvent.click(within(dialog).getByRole('button', { name: 'Back to editing' }));
    expect((screen.getByLabelText('Display name') as HTMLInputElement).value).toBe('My preserved design');
    fireEvent.click(button('Save draft')); await waitFor(() => expect(f.callbacks.save).toHaveBeenCalledTimes(2));
    expect(f.callbacks.save.mock.calls[1][0].revision).toBe(1); expect(f.callbacks.publish).not.toHaveBeenCalled();
  });
  it('uses an explicitly compared current head for the next save while keeping unsaved work and publication disabled', async () => {
    const f = fixture(); await ready(); edit('My deliberate replacement'); fireEvent.click(button('Compare saved draft'));
    const dialog = await screen.findByRole('dialog'); fireEvent.click(within(dialog).getByRole('button', { name: 'Keep my changes' }));
    expect((screen.getByLabelText('Display name') as HTMLInputElement).value).toBe('My deliberate replacement');
    expect(f.callbacks.save).not.toHaveBeenCalled(); expect(f.callbacks.publish).not.toHaveBeenCalled(); expect(button('Review & publish').disabled).toBe(true);
    await waitFor(() => expect(f.callbacks.review).toHaveBeenCalledWith({ revision: 2 }));
    f.callbacks.save.mockRejectedValueOnce(new Error('CONFLICT: somebody saved again'));
    fireEvent.click(button('Save draft')); await waitFor(() => expect(f.callbacks.save).toHaveBeenCalledTimes(1));
    expect(f.callbacks.save.mock.calls[0][0]).toMatchObject({ revision: 2, payload: { sections: [{ label: 'My deliberate replacement' }] } });
    await screen.findByText(/Saving could not be confirmed/);
    expect((screen.getByLabelText('Display name') as HTMLInputElement).value).toBe('My deliberate replacement');
    expect(f.callbacks.publish).not.toHaveBeenCalled();
  });
  it('clears the prior passed check after Keep my changes until the rebased saved head has been inspected', async () => {
    const f = fixture(); await ready();
    f.callbacks.inspect.mockImplementationOnce(async input => ({ ...input, warnings: ['Earlier saved head warning'] }));
    edit('Keep this checked local design');
    await waitFor(() => expect(screen.getByRole('region', { name: 'Draft check' }).textContent).toContain('Draft checks passed'));
    expect(screen.getByText('Earlier saved head warning')).toBeTruthy();
    const pending = deferred<Awaited<ReturnType<NonNullable<SavedPageEditorProps['callbacks']['inspect']>>>>();
    f.callbacks.inspect.mockReturnValueOnce(pending.promise);
    fireEvent.click(button('Compare saved draft'));
    const dialog = await screen.findByRole('dialog', { name: 'Compare the saved draft' });
    fireEvent.click(within(dialog).getByRole('button', { name: 'Keep my changes' }));
    const check = screen.getByRole('region', { name: 'Draft check' });
    expect(check.textContent).toContain('Checking your latest draft');
    expect(check.textContent).not.toContain('Draft checks passed');
    expect(screen.queryByText('Earlier saved head warning')).toBeNull();
    await waitFor(() => expect(f.callbacks.inspect).toHaveBeenCalledTimes(2));
    const submitted = f.callbacks.inspect.mock.calls[1][0];
    expect(submitted).toMatchObject({ revision: 2, definitionRevision: 4, payload: { sections: [{ label: 'Keep this checked local design' }] } });
    expect(check.textContent).not.toContain('Draft checks passed');
    pending.resolve({ ...submitted, warnings: ['Current saved head warning'] });
    await waitFor(() => expect(check.textContent).toContain('Draft checks passed'));
    expect(screen.getByText('Current saved head warning')).toBeTruthy();
    expect(button('Review & publish').disabled).toBe(true);
    expect(f.callbacks.save).not.toHaveBeenCalled(); expect(f.callbacks.publish).not.toHaveBeenCalled();
  });
  it('adopts freshly authorised saved fields, library and conditions when opening the current saved draft', async () => {
    const f = fixture(); await ready(); edit('My old catalogue design');
    const response = await f.callbacks.compareSavedDraft.getMockImplementation()!({ revision: 1, definitionRevision: 3, payload: page(), formFactor: 'desktop' });
    response.payload.sections[0].components = [{ id: 'new_details', type: 'fields', label: 'Fresh details', fields: [{ source: 'native', fieldId: 'new_note', mode: 'read' }], formFactors: forms }];
    response.presentation.saved = {
      catalog: { ...catalog, nativeFields: [{ id: 'new_note', label: 'New approved detail' }] },
      fields: [{ key: 'native:new_note', label: 'New approved detail', field: { source: 'native', fieldId: 'new_note', mode: 'read' }, editable: false, required: false }],
      palette: [{ key: 'fresh_guidance', label: 'Fresh guidance', description: 'Current approved choice.', component: { type: 'instructions', text: 'Approved guidance', formFactors: forms } }],
      conditions: { variantsAllowed: true, facts: [{ id: 'ready', label: 'Ready', choices: [{ label: 'Yes', value: true }] }], recordTypes: [] },
    };
    response.model = createDesignPageDisplayModel(response.payload, response.presentation.saved.catalog, 'desktop');
    f.callbacks.compareSavedDraft.mockResolvedValueOnce(response); fireEvent.click(button('Compare saved draft'));
    const dialog = await screen.findByRole('dialog'); fireEvent.click(within(dialog).getByRole('button', { name: 'Use saved draft' }));
    expect(screen.queryByText('Unavailable')).toBeNull(); expect(screen.getByText('New approved detail')).toBeTruthy();
    fireEvent.click(button('Screen outline')); fireEvent.click(button('Fresh details')); expect(screen.getByLabelText('New approved detail label')).toBeTruthy();
    fireEvent.click(button('Add to screen')); expect(button('Add Fresh guidance')).toBeTruthy();
    expect(button('Add conditional layout').disabled).toBe(false);
    expect(f.callbacks.save).not.toHaveBeenCalled(); expect(f.callbacks.publish).not.toHaveBeenCalled();
  });
  it('adopts the separately authorised local catalogue on Keep without replacing exact retained local field selections', async () => {
    const initial = page(); initial.sections[0].components = [{ id: 'local_details', type: 'fields', label: 'Local details', fields: [{ source: 'native', fieldId: 'retained_note', mode: 'read' }], formFactors: forms }];
    const f = fixture(initial); await ready(); edit('Keep retained design');
    expect(screen.getByText('Unavailable')).toBeTruthy();
    const response = await f.callbacks.compareSavedDraft.getMockImplementation()!({ revision: 1, definitionRevision: 3, payload: initial, formFactor: 'desktop' });
    response.presentation.local = { catalog: { ...catalog, nativeFields: [{ id: 'retained_note', label: 'Current retained detail' }] },
      fields: [{ key: 'native:retained_note', label: 'Current retained detail', field: { source: 'native', fieldId: 'retained_note', mode: 'read' }, editable: false, required: false }],
      palette: [{ key: 'local_guidance', label: 'Local approved guidance', description: 'Current local choice.', component: { type: 'instructions', text: 'Approved local guidance', formFactors: forms } }],
      conditions: { variantsAllowed: false, facts: [], recordTypes: [] } };
    response.presentation.saved.catalog = { ...catalog, nativeFields: [{ id: 'retained_note', label: 'Different saved detail' }] };
    f.callbacks.compareSavedDraft.mockResolvedValueOnce(response); fireEvent.click(button('Compare saved draft'));
    const dialog = await screen.findByRole('dialog'); expect(within(dialog).getByRole('region', { name: 'Unsaved draft preview' }).textContent).toContain('Current retained detail');
    fireEvent.click(within(dialog).getByRole('button', { name: 'Keep my changes' }));
    expect(screen.queryByText('Unavailable')).toBeNull(); expect(screen.getByText('Current retained detail')).toBeTruthy();
    expect(screen.queryByText('Different saved detail')).toBeNull();
    expect((screen.getByLabelText('Display name') as HTMLInputElement).value).toBe('Keep retained design');
    fireEvent.click(button('Screen outline')); fireEvent.click(button('Local details')); expect(screen.getByLabelText('Current retained detail label')).toBeTruthy();
    fireEvent.click(button('Add to screen')); expect(button('Add Local approved guidance')).toBeTruthy();
    expect(button('Review & publish').disabled).toBe(true); expect(f.callbacks.save).not.toHaveBeenCalled(); expect(f.callbacks.publish).not.toHaveBeenCalled();
  });
  it('replaces the local design only when Use saved draft is chosen, without saving or publishing', async () => {
    const f = fixture(); await ready(); edit('Unsaved layout'); fireEvent.click(button('Compare saved draft'));
    const dialog = await screen.findByRole('dialog'); fireEvent.click(within(dialog).getByRole('button', { name: 'Use saved draft' }));
    expect((screen.getByLabelText('Display name') as HTMLInputElement).value).toBe('Latest saved layout');
    expect(screen.queryByText('Unsaved changes')).toBeNull(); expect(f.callbacks.save).not.toHaveBeenCalled(); expect(f.callbacks.publish).not.toHaveBeenCalled();
    expect(f.callbacks.restore).not.toHaveBeenCalled();
  });
  it('discards delayed saved comparisons after local edits or tenant selection and discloses no rejected metadata', async () => {
    const f = fixture(); await ready(); edit('Older local draft');
    const pending = deferred<Awaited<ReturnType<NonNullable<SavedPageEditorProps['callbacks']['compareSavedDraft']>>>>();
    f.callbacks.compareSavedDraft.mockReturnValueOnce(pending.promise); fireEvent.click(button('Compare saved draft')); edit('Newer local draft');
    pending.resolve(await f.callbacks.compareSavedDraft.getMockImplementation()!({ revision: 1, definitionRevision: 3, payload: page(), formFactor: 'desktop' }));
    await waitFor(() => expect(button('Compare saved draft').disabled).toBe(false));
    expect(screen.queryByRole('dialog')).toBeNull(); expect(screen.queryByText('Latest saved layout')).toBeNull();
    f.callbacks.compareSavedDraft.mockRejectedValueOnce(new Error('FORBIDDEN: hidden saved title'));
    fireEvent.click(button('Compare saved draft')); await screen.findByText(/current saved draft could not be compared/);
    expect(screen.queryByText('hidden saved title')).toBeNull(); expect((screen.getByLabelText('Display name') as HTMLInputElement).value).toBe('Newer local draft');
    const other = deferred<Awaited<ReturnType<NonNullable<SavedPageEditorProps['callbacks']['compareSavedDraft']>>>>();
    f.callbacks.compareSavedDraft.mockReturnValueOnce(other.promise); fireEvent.click(button('Compare saved draft'));
    f.rerender(<SavedPageEditor {...f.props} business={{ ...f.props.business, id: 'foreign' }} />);
    other.resolve(await f.callbacks.compareSavedDraft.getMockImplementation()!({ revision: 1, definitionRevision: 3, payload: page(), formFactor: 'desktop' }));
    await screen.findByText(/belongs to another draft/); expect(screen.queryByRole('dialog')).toBeNull();
  });
  it('refuses a comparison acknowledgement with a changed owner or older saved head', async () => {
    const f = fixture(); await ready(); edit('Still mine');
    const response = await f.callbacks.compareSavedDraft.getMockImplementation()!({ revision: 1, definitionRevision: 3, payload: page(), formFactor: 'desktop' });
    response.payload.entity.id = 'tickets.ticket'; f.callbacks.compareSavedDraft.mockResolvedValueOnce(response);
    fireEvent.click(button('Compare saved draft')); await screen.findByText(/current saved draft could not be compared/);
    expect(screen.queryByRole('dialog')).toBeNull(); expect(f.callbacks.save).not.toHaveBeenCalled();
    f.callbacks.compareSavedDraft.mockResolvedValueOnce({ ...response, payload: page(), revision: 0 });
    fireEvent.click(button('Compare saved draft')); await waitFor(() => expect(f.callbacks.compareSavedDraft).toHaveBeenCalledTimes(2));
    expect(screen.queryByRole('dialog')).toBeNull(); expect((screen.getByLabelText('Display name') as HTMLInputElement).value).toBe('Still mine');
  });

  it('checks edited metadata after a finite debounce without saving or approving publication', async () => {
    const f = fixture(); await ready(); edit('My checked draft');
    expect(f.callbacks.inspect).not.toHaveBeenCalled();
    expect(screen.getByRole('region', { name: 'Draft check' }).textContent).toContain('Checking your latest draft');
    await waitFor(() => expect(f.callbacks.inspect).toHaveBeenCalledTimes(1));
    expect(f.callbacks.inspect.mock.calls[0][0]).toMatchObject({ revision: 1, definitionRevision: 3, payload: { sections: [{ label: 'My checked draft' }] } });
    await waitFor(() => expect(screen.getByRole('region', { name: 'Draft check' }).textContent).toContain('Draft checks passed'));
    expect(button('Review & publish').disabled).toBe(true); expect(f.callbacks.save).not.toHaveBeenCalled(); expect(f.callbacks.publish).not.toHaveBeenCalled();
    expect(f.callbacks.preview).not.toHaveBeenCalled();
  });
  it('shows immediate pure shape feedback and keeps the canvas/editor usable while input is incomplete', async () => {
    const f = fixture(); await ready(); edit('');
    expect(screen.getByRole('region', { name: 'Draft check' }).textContent).toContain('Check the highlighted design settings');
    expect(screen.getByText(/Complete the design settings to preview/)).toBeTruthy();
    expect(f.callbacks.inspect).not.toHaveBeenCalled(); expect(button('Review & publish').disabled).toBe(true);
    edit('Completed label'); await waitFor(() => expect(f.callbacks.inspect).toHaveBeenCalledTimes(1));
  });
  it('discards delayed edited-payload checks and preserves local changes when current access fails', async () => {
    const f = fixture(); await ready(); const pending = deferred<Awaited<ReturnType<NonNullable<SavedPageEditorProps['callbacks']['inspect']>>>>();
    f.callbacks.inspect.mockReturnValueOnce(pending.promise); edit('Older checked draft');
    await waitFor(() => expect(f.callbacks.inspect).toHaveBeenCalledTimes(1));
    f.callbacks.inspect.mockRejectedValueOnce(new Error('FORBIDDEN: current field Read')); edit('Keep my newer draft');
    pending.resolve({ revision: 1, definitionRevision: 3, payload: f.callbacks.inspect.mock.calls[0][0].payload, warnings: ['Old warning must not return'] });
    await waitFor(() => expect(screen.getByRole('region', { name: 'Draft check' }).textContent).toContain('current saved screen and access'));
    expect(screen.queryByText('Old warning must not return')).toBeNull();
    expect((screen.getByLabelText('Display name') as HTMLInputElement).value).toBe('Keep my newer draft');
    expect(button('Review & publish').disabled).toBe(true); expect(f.callbacks.publish).not.toHaveBeenCalled();
  });
  it('rejects mismatched inspection acknowledgements and discards checks made against a previous saved head', async () => {
    const f = fixture(); await ready();
    f.callbacks.inspect.mockImplementationOnce(async input => ({ ...input, definitionRevision: 99, warnings: [] }));
    edit('Wrong check acknowledgement'); await waitFor(() => expect(screen.getByRole('region', { name: 'Draft check' }).textContent).toContain('Changed draft check'));
    const pending = deferred<Awaited<ReturnType<NonNullable<SavedPageEditorProps['callbacks']['inspect']>>>>();
    f.callbacks.inspect.mockReturnValueOnce(pending.promise); edit('Submitted checked design');
    await waitFor(() => expect(f.callbacks.inspect).toHaveBeenCalledTimes(2));
    const captured = f.callbacks.inspect.mock.calls[1][0];
    fireEvent.click(button('Save draft')); await ready();
    pending.resolve({ ...captured, warnings: ['Old head warning'] });
    await waitFor(() => expect(screen.queryByRole('region', { name: 'Draft check' })).toBeNull());
    expect(screen.queryByText('Old head warning')).toBeNull(); expect(f.callbacks.publish).not.toHaveBeenCalled();
  });
  it('compares previous and unsaved current designs visually without publishing or replacing the draft', async () => {
    const f = fixture(); await ready(); edit('My unsaved layout');
    fireEvent.change(screen.getByLabelText('Previous published design'), { target: { value: 'old' } });
    fireEvent.click(button('Compare designs'));
    const dialog = await screen.findByRole('dialog', { name: 'Compare your designs' });
    expect(within(dialog).getByRole('region', { name: 'Previous design preview' }).textContent).toContain('Previous order overview');
    expect(within(dialog).getByRole('region', { name: 'Current draft preview' }).textContent).toContain('My unsaved layout');
    expect(f.callbacks.compare).toHaveBeenCalledWith({ versionId: 'old', definitionRevision: 3, formFactor: 'desktop' });
    expect(f.callbacks.save).not.toHaveBeenCalled(); expect(f.callbacks.publish).not.toHaveBeenCalled(); expect(f.callbacks.restore).not.toHaveBeenCalled();
    fireEvent.click(within(dialog).getByRole('button', { name: 'Back to editing' }));
    expect((screen.getByLabelText('Display name') as HTMLInputElement).value).toBe('My unsaved layout');
  });
  it('keeps local changes when current access rejects an older design comparison', async () => {
    const f = fixture(); await ready(); edit('Keep this local layout'); f.callbacks.compare.mockRejectedValueOnce(new Error('FORBIDDEN'));
    fireEvent.change(screen.getByLabelText('Previous published design'), { target: { value: 'old' } }); fireEvent.click(button('Compare designs'));
    await waitFor(() => expect(screen.getByRole('status').textContent).toContain('Your current changes are kept'));
    expect(screen.queryByRole('dialog')).toBeNull(); expect((screen.getByLabelText('Display name') as HTMLInputElement).value).toBe('Keep this local layout');
    expect(f.callbacks.restore).not.toHaveBeenCalled();
  });
  it('reviews the exact saved draft and uses the shared labelled design canvas without business reads', async () => {
    const f = fixture(); await ready();
    expect(f.callbacks.review).toHaveBeenCalledWith({ revision: 1 });
    expect(screen.getByText('Design canvas · labelled samples')).toBeTruthy();
    expect(f.callbacks.chooseSample).not.toHaveBeenCalled(); expect(f.callbacks.preview).not.toHaveBeenCalled(); expect(f.callbacks.publish).not.toHaveBeenCalled();
  });
  it('saves the submitted revision while retaining newer edits and refusing publication of the older acknowledgement', async () => {
    const f = fixture(); await ready(); const pending = deferred<{ revision: number; warnings: string[] }>();
    f.callbacks.save.mockReturnValueOnce(pending.promise); edit('First submitted design'); fireEvent.click(button('Save draft')); edit('Newer unsaved design');
    expect(f.callbacks.save.mock.calls[0][0]).toMatchObject({ revision: 1, payload: { sections: [{ label: 'First submitted design' }] } });
    pending.resolve({ revision: 2, warnings: [] });
    await waitFor(() => expect(button('Save draft').textContent).toBe('Save draft'));
    expect((screen.getByLabelText('Display name') as HTMLInputElement).value).toBe('Newer unsaved design');
    expect(button('Review & publish').disabled).toBe(true); expect(f.callbacks.publish).not.toHaveBeenCalled();
  });
  it('requires human warning acknowledgement and explicit Go live, traps focus and permits Escape cancellation', async () => {
    const f = fixture(); f.callbacks.review.mockImplementation(async input => ({ revision: input.revision, payload: f.props.draft.payload, warnings: ['Phone layout should be checked.'], changes: ['A clearer order summary.'] }));
    let dialog = await openReview(); expect(within(dialog).getByText('A clearer order summary.')).toBeTruthy();
    expect(button('Go live').disabled).toBe(true); expect(f.callbacks.publish).not.toHaveBeenCalled();
    const notes = within(dialog).getByRole('checkbox'); const keep = within(dialog).getByRole('button', { name: 'Keep editing' });
    notes.focus(); expect(document.activeElement).toBe(notes); fireEvent.keyDown(notes, { key: 'Tab', shiftKey: true }); expect(document.activeElement).toBe(keep);
    fireEvent.keyDown(keep, { key: 'Escape' }); expect(screen.queryByRole('dialog')).toBeNull();
    dialog = await openReview(); fireEvent.click(within(dialog).getByRole('checkbox'));
    const go = button('Go live'); go.focus(); fireEvent.keyDown(go, { key: 'Tab' }); expect(document.activeElement).toBe(within(dialog).getByRole('checkbox'));
    fireEvent.click(go); await waitFor(() => expect(f.callbacks.publish).toHaveBeenCalledWith({ revision: 1, acknowledgeWarnings: true }));
    expect(await screen.findByText('Your reviewed design is now live for this business.')).toBeTruthy();
  });
  it('discards stale review responses when a newer edit happens and retains the design after publication failure', async () => {
    const f = fixture(); await ready(); const pending = deferred<Awaited<ReturnType<SavedPageEditorProps['callbacks']['review']>>>();
    f.callbacks.review.mockReturnValueOnce(pending.promise); fireEvent.click(button('Review & publish')); edit('Still editing');
    pending.resolve({ revision: 1, payload: f.props.draft.payload, warnings: [] });
    await waitFor(() => expect(button('Review & publish').disabled).toBe(true)); expect(screen.queryByRole('dialog')).toBeNull();
    fireEvent.click(button('Save draft')); await ready(); f.callbacks.publish.mockRejectedValueOnce(new Error('Opaque server failure'));
    await openReview(); fireEvent.click(button('Go live'));
    expect(await screen.findByText(/Publishing could not be confirmed/)).toBeTruthy(); expect((screen.getByLabelText('Display name') as HTMLInputElement).value).toBe('Still editing');
  });
  it('denies a server review for another revision or payload without publishing', async () => {
    const f = fixture(); await ready(); f.callbacks.review.mockResolvedValueOnce({ revision: 2, payload: page(), warnings: [] });
    fireEvent.click(button('Review & publish')); expect(await screen.findByText(/needs a fresh review/)).toBeTruthy();
    expect(screen.queryByRole('dialog')).toBeNull(); expect(f.callbacks.publish).not.toHaveBeenCalled();
  });
  it('loads only server-listed actual samples and ignores a delayed preview after further edits', async () => {
    const f = fixture(); await ready(); fireEvent.click(button('Choose preview record')); await waitFor(() => expect((screen.getByLabelText('Preview record') as HTMLSelectElement).value).toBe('record_1'));
    fireEvent.click(button('Load actual preview')); expect(await screen.findByText('Approved record content')).toBeTruthy();
    expect(f.callbacks.preview.mock.calls[0][0]).toMatchObject({ recordId: 'record_1', formFactor: 'desktop', payload: f.props.draft.payload });
    fireEvent.click(button('Use samples')); const pending = deferred<Awaited<ReturnType<SavedPageEditorProps['callbacks']['preview']>>>(); f.callbacks.preview.mockReturnValueOnce(pending.promise);
    fireEvent.click(button('Load actual preview')); edit('Edited after preview request'); pending.resolve(createDesignPageDisplayModel(page(), catalog, 'desktop'));
    await waitFor(() => expect(button('Load actual preview').disabled).toBe(false)); expect(screen.getByText('Design canvas · labelled samples')).toBeTruthy();
  });
  it('restores only the live pointer with the exact definition revision and keeps the saved draft design', async () => {
    const f = fixture(); await ready(); fireEvent.change(screen.getByLabelText('Previous published design'), { target: { value: 'old' } });
    fireEvent.click(button('Restore live design')); const dialog = await screen.findByRole('dialog'); expect(within(dialog).getByText(/current draft is kept/)).toBeTruthy();
    expect(f.callbacks.restore).not.toHaveBeenCalled(); fireEvent.click(button('Restore this live design'));
    await waitFor(() => expect(f.callbacks.restore).toHaveBeenCalledWith({ versionId: 'old', definitionRevision: 3 }));
    expect(await screen.findByText(/Live screen restored to Version 1/)).toBeTruthy(); expect((screen.getByLabelText('Display name') as HTMLInputElement).value).toBe('Order overview');
    edit('Unsaved draft'); expect(button('Restore live design').disabled).toBe(true);
  });
  it('keeps a failed save and rejects stale acknowledgement when another business is selected', async () => {
    const f = fixture(); await ready(); edit('Preserved draft'); f.callbacks.save.mockRejectedValueOnce(new Error('Conflict')); fireEvent.click(button('Save draft'));
    expect(await screen.findByText(/Saving could not be confirmed/)).toBeTruthy(); expect((screen.getByLabelText('Display name') as HTMLInputElement).value).toBe('Preserved draft');
    const pending = deferred<{ revision: number; warnings: string[] }>(); f.callbacks.save.mockReturnValueOnce(pending.promise); fireEvent.click(button('Save draft'));
    f.rerender(<SavedPageEditor {...f.props} business={{ ...f.props.business, id: 'another_company' }} />); pending.resolve({ revision: 2, warnings: [] });
    expect(await screen.findByText(/belongs to another draft/)).toBeTruthy(); expect(f.callbacks.publish).not.toHaveBeenCalled();
  });
  it('keeps a local design dirty when pointer restore reports a different saved draft head', async () => {
    const f = fixture(); await ready(); const remote = page(); remote.sections[0].label = 'Another editor saved this';
    f.callbacks.restore.mockResolvedValueOnce({ revision: 2, definitionRevision: 4, payload: remote, warnings: [], activeVersionId: 'old' });
    fireEvent.change(screen.getByLabelText('Previous published design'), { target: { value: 'old' } }); fireEvent.click(button('Restore live design')); fireEvent.click(await screen.findByRole('button', { name: 'Restore this live design' }));
    await screen.findByText(/Live screen restored to Version 1/);
    expect((screen.getByLabelText('Display name') as HTMLInputElement).value).toBe('Order overview');
    expect(screen.getByText('Unsaved changes')).toBeTruthy(); expect(button('Review & publish').disabled).toBe(true);
  });
  it('keeps actual preview command, navigation and pagination inert through the shared renderer', async () => {
    const f = fixture(); await ready();
    f.callbacks.preview.mockImplementationOnce(async input => ({ formFactor: input.formFactor, variantId: null, sections: [{ id: 'main', label: 'Actual order', help: '', columns: 1, components: [
      { id: 'command', type: 'action', label: 'Confirm order', help: '', command: { id: 'sales.order.confirm', version: 1, schemaHash: 'c'.repeat(64), contractHash: 'd'.repeat(64) }, confirm: true, preview: true },
      { id: 'list', type: 'queryList', label: 'Related orders', help: '', columns: ['Order'], rows: [{ id: 'private_order', cells: [{ label: 'Order', text: 'SO-0002', unavailable: false }] }], nextCursor: { id: 'next_order' } },
    ] }] }));
    fireEvent.click(button('Choose preview record')); await waitFor(() => expect(button('Load actual preview').disabled).toBe(false)); fireEvent.click(button('Load actual preview'));
    await screen.findByText('SO-0002'); expect(button('Confirm order').disabled).toBe(true); expect(button('Next page').disabled).toBe(true);
    expect(screen.queryByRole('button', { name: 'SO-0002' })).toBeNull(); expect(f.callbacks.publish).not.toHaveBeenCalled();
  });
  it('rejects a same-revision review of another design and invalid bounded sample choices', async () => {
    const f = fixture(); await ready(); const other = page(); other.sections[0].label = 'Not the saved design';
    f.callbacks.review.mockResolvedValueOnce({ revision: 1, payload: other, warnings: [] }); fireEvent.click(button('Review & publish')); await screen.findByText(/needs a fresh review/);
    expect(screen.queryByRole('dialog')).toBeNull();
    f.callbacks.chooseSample.mockResolvedValueOnce([{ id: 'record_1', label: 'One' }, { id: 'record_1', label: 'Duplicate' }]); fireEvent.click(button('Choose preview record'));
    await screen.findByText(/Records could not be loaded/); expect(button('Load actual preview').disabled).toBe(true); expect(f.callbacks.preview).not.toHaveBeenCalled();
  });

});
