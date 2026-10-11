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
function fixture() {
  let saved = page();
  const callbacks = {
    save: vi.fn<SavedPageEditorProps['callbacks']['save']>(async input => { saved = input.payload; return { revision: input.revision + 1, warnings: [] }; }),
    review: vi.fn<SavedPageEditorProps['callbacks']['review']>(async input => ({ revision: input.revision, payload: saved, warnings: [], changes: ['Order overview is easier to scan.'] })),
    publish: vi.fn<SavedPageEditorProps['callbacks']['publish']>(async input => ({ revision: input.revision, definitionRevision: 4, versionId: 'new', versionLabel: 'Version 3' })),
    restore: vi.fn<SavedPageEditorProps['callbacks']['restore']>(async input => ({ revision: 1, definitionRevision: 4, payload: saved, warnings: [], activeVersionId: input.versionId })),
    chooseSample: vi.fn<SavedPageEditorProps['callbacks']['chooseSample']>(async () => [{ id: 'record_1', label: 'SO-0001' }]),
    preview: vi.fn<SavedPageEditorProps['callbacks']['preview']>(async input => { const model = createDesignPageDisplayModel(input.payload, catalog, input.formFactor); model.sections[0].components[0] = { id: 'guide', label: 'Actual order', help: '', type: 'instructions', text: 'Approved record content', tone: 'info' }; return model; }),
  };
  const props: SavedPageEditorProps = { business: { id: 'company', name: 'Example business', workspaceHref: '/atlas/studio/company' }, draft: { id: 'draft', name: 'Sales order', revision: 1, definitionRevision: 3, activeVersionId: 'current', versions: [{ id: 'old', label: 'Version 1' }, { id: 'current', label: 'Version 2' }], payload: saved, warnings: [] }, catalog, palette: [], fields: [], presets: [], scope: 'record', callbacks };
  return { props, callbacks, ...render(<SavedPageEditor {...props} />) };
}
const edit = (name: string) => fireEvent.change(screen.getByLabelText('Display name'), { target: { value: name } });
const button = (name: string) => screen.getByRole('button', { name }) as HTMLButtonElement;
const ready = async () => { await waitFor(() => expect(button('Review & publish').disabled).toBe(false)); };
const openReview = async () => { await ready(); fireEvent.click(button('Review & publish')); return screen.findByRole('dialog'); };

describe('saved business visual design adapter', () => {
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
