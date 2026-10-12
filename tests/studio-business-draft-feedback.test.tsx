// @vitest-environment jsdom
import React from 'react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { BusinessDraftFeedback, type BusinessDraftFeedbackControls } from '@/modules/analytics/components/business-draft-feedback';
import { analyticsBusinessViewContentSchema } from '@/modules/analytics/services/business-view-contract';
import type { BusinessViewInspection, BusinessViewComparison } from '@/modules/analytics/services/business-view-inspection-contract';
const id = '00000000-0000-4000-8000-000000000001';
const content = analyticsBusinessViewContentSchema.parse({ name: 'Local design', refreshSeconds: 0, widgets: [{ id: 'one', metricId: 'sales.orders', visual: 'bar', wide: false }] });
const measures = [{ id: 'sales.orders', name: 'Orders', sourceHref: '/design-studio/capabilities/orders', whereUsedHref: '/design-studio/capabilities/orders?view=usage' }];
let inspect: ReturnType<typeof vi.fn<BusinessDraftFeedbackControls['inspect']>>, compareSavedDraft: ReturnType<typeof vi.fn<BusinessDraftFeedbackControls['compareSavedDraft']>>, onAdopt: ReturnType<typeof vi.fn<React.ComponentProps<typeof BusinessDraftFeedback>['onAdopt']>>, onValidation: ReturnType<typeof vi.fn<React.ComponentProps<typeof BusinessDraftFeedback>['onValidation']>>, onReferences: ReturnType<typeof vi.fn<React.ComponentProps<typeof BusinessDraftFeedback>['onReferences']>>;
const inspected = (): BusinessViewInspection => ({ definitionId: id, revision: 3, definitionRevision: 5, content, warnings: [], measures });
const compared = (): BusinessViewComparison => ({ definitionId: id, revision: 4, definitionRevision: 7, activeVersionId: null,
  saved: { ...content, name: 'Saved design', widgets: [{ ...content.widgets[0], visual: 'donut', wide: true }] }, local: content, warnings: [], changes: ['The dashboard name differs.'], measures });
const props = () => ({ controls: { definitionId: id, revision: 3, definitionRevision: 5, inspect, compareSavedDraft }, content, references: measures, onAdopt, onValidation, onReferences });
beforeEach(() => { inspect = vi.fn().mockResolvedValue(inspected()); compareSavedDraft = vi.fn().mockResolvedValue(compared()); onAdopt = vi.fn(); onValidation = vi.fn(); onReferences = vi.fn(); });
afterEach(() => cleanup());
it('checks pure/current business metadata after debounce without writing, and shows current approved references', async () => {
  render(<BusinessDraftFeedback {...props()}/>);
  await screen.findByText('Design checked against your current business access.');
  expect(inspect).toHaveBeenCalledWith({ revision: 3, definitionRevision: 5, content });
  expect(onValidation).toHaveBeenLastCalledWith(true); expect(onReferences).toHaveBeenLastCalledWith(measures); expect(onAdopt).not.toHaveBeenCalled();
});
it('invalid local schema stops before the server and revoked rights clear retained links', async () => {
  const view = render(<BusinessDraftFeedback {...props()} content={{ ...content, widgets: [] }}/>);
  await waitFor(() => expect(onValidation).toHaveBeenCalledWith(false)); expect(inspect).not.toHaveBeenCalled();
  inspect.mockRejectedValueOnce(new Error('FORBIDDEN: source read revoked'));
  view.rerender(<BusinessDraftFeedback {...props()}/>);
  await screen.findByText('Your current access does not allow this design. Check your business permissions.');
  expect(onReferences).toHaveBeenLastCalledWith([]); expect(onValidation).toHaveBeenLastCalledWith(false);
});
it('shows a genuine saved/local inert visual difference and Back/Escape preserve local input and head', async () => {
  render(<BusinessDraftFeedback {...props()}/>);
  fireEvent.click(screen.getByRole('button', { name: 'Compare saved draft' }));
  await screen.findByRole('dialog', { name: 'Compare dashboard designs' });
  expect(screen.getByRole('region', { name: 'Current saved draft' })).toBeTruthy(); expect(screen.getByRole('region', { name: 'Your local changes' })).toBeTruthy();
  expect(screen.getByText('The dashboard name differs.')).toBeTruthy();
  fireEvent.keyDown(document, { key: 'Escape' });
  expect(screen.queryByRole('dialog')).toBeNull(); expect(onAdopt).not.toHaveBeenCalled(); expect(compareSavedDraft).toHaveBeenCalledOnce();
  fireEvent.click(screen.getByRole('button', { name: 'Compare saved draft' })); await screen.findByRole('dialog');
  fireEvent.click(screen.getByRole('button', { name: 'Back to my design' })); expect(onAdopt).not.toHaveBeenCalled();
});
it.each(['keep', 'saved'] as const)('only explicit %s adopts exact observed current heads and no save/publish', async mode => {
  render(<BusinessDraftFeedback {...props()}/>);
  fireEvent.click(screen.getByRole('button', { name: 'Compare saved draft' })); await screen.findByRole('dialog');
  fireEvent.click(screen.getByRole('button', { name: mode === 'keep' ? 'Keep my changes against this saved draft' : 'Use saved draft' }));
  expect(onAdopt).toHaveBeenCalledWith(compared(), mode); expect(screen.queryByRole('dialog')).toBeNull();
});
it('ignores delayed inspection/comparison for old local content and permits checking after adopted head changes', async () => {
  let resolveInspection!: (value: BusinessViewInspection) => void, resolveComparison!: (value: BusinessViewComparison) => void;
  inspect.mockImplementationOnce(() => new Promise(resolve => { resolveInspection = resolve; }));
  compareSavedDraft.mockImplementationOnce(() => new Promise(resolve => { resolveComparison = resolve; }));
  const view = render(<BusinessDraftFeedback {...props()}/>);
  await waitFor(() => expect(inspect).toHaveBeenCalledOnce());
  // The comparison request can originate while the earlier read is pending.
  view.rerender(<BusinessDraftFeedback {...props()} controls={{ ...props().controls, inspect: async input => ({ ...inspected(), content: input.content }) }}/>);
  fireEvent.click(screen.getByRole('button', { name: 'Compare saved draft' }));
  // Start a changed local design/head before either retained request completes.
  const changed = { ...content, name: 'New local design' };
  view.rerender(<BusinessDraftFeedback {...props()} content={changed} controls={{ ...props().controls, revision: 4, definitionRevision: 7,
    inspect: async input => ({ ...inspected(), revision: input.revision, definitionRevision: input.definitionRevision, content: input.content }) }}/>);
  resolveInspection(inspected()); if (resolveComparison) resolveComparison(compared());
  await screen.findByText('Design checked against your current business access.');
  expect(screen.queryByRole('dialog')).toBeNull(); expect(onAdopt).not.toHaveBeenCalled(); expect(onValidation).toHaveBeenLastCalledWith(true);
});
