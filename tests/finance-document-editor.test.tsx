// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import type { ComponentProps } from 'react';
const state = vi.hoisted(() => ({ save: vi.fn(), push: vi.fn(), refresh: vi.fn() }));
vi.mock('@/modules/finance/services/save-draft', () => ({ saveFinanceDraft: state.save }));
vi.mock('next/navigation', () => ({ useRouter: () => ({ push: state.push, refresh: state.refresh }) }));
import { DocumentEditor } from '@/modules/finance/components/document-editor';
const choices = { entities: [{ id: 'entity', name: 'Books', currency: 'GBP' }], parties: [{ id: 'supplier', name: 'Supplier' }], products: [], accounts: [], documents: [] } as unknown as ComponentProps<typeof DocumentEditor>['choices'];
afterEach(cleanup);
beforeEach(() => vi.clearAllMocks());
function enter() {
  render(<DocumentEditor choices={choices} allowedKinds={['PO']} />);
  fireEvent.change(screen.getByLabelText('Customer / supplier'), { target: { value: 'supplier' } });
  fireEvent.change(screen.getByLabelText('Description'), { target: { value: 'Material requirement' } });
  fireEvent.change(screen.getByPlaceholderText('costCentre'), { target: { value: 'Plant A' } });
  fireEvent.change(screen.getByLabelText('Line 1 description'), { target: { value: 'Internal material' } });
  return screen.getByRole('button', { name: 'Save draft' }).closest('form')!;
}
it('retains supplier, title, allocation and line entries after validation; retry uses the same entries', async () => {
  state.save.mockResolvedValueOnce({ ok: false, error: 'Document must have a positive total.' }).mockResolvedValueOnce({ ok: true, id: 'purchase' });
  const form = enter(); expect(form.method).toBe('post'); fireEvent.submit(form);
  await waitFor(() => expect(screen.getByRole('alert').textContent).toContain('positive total'));
  expect((screen.getByLabelText('Customer / supplier') as HTMLSelectElement).value).toBe('supplier');
  expect((screen.getByLabelText('Description') as HTMLInputElement).value).toBe('Material requirement');
  expect((screen.getByPlaceholderText('costCentre') as HTMLInputElement).value).toBe('Plant A');
  expect((screen.getByLabelText('Line 1 description') as HTMLInputElement).value).toBe('Internal material');
  fireEvent.change(screen.getByLabelText('Unit price'), { target: { value: '2.50' } }); fireEvent.submit(form);
  await waitFor(() => expect(state.push).toHaveBeenCalledWith('/finance/documents/purchase'));
  expect(state.save.mock.calls[1][0]).toMatchObject({ partyId: 'supplier', title: 'Material requirement', costCentre: 'Plant A', lines: [expect.objectContaining({ description: 'Internal material', unitPrice: '2.50' })] });
});
it('retains the draft and gives reload guidance when an older tab has an expired action', async () => {
  state.save.mockRejectedValue(Object.assign(new Error('private action key'), { name: 'UnrecognizedActionError' }));
  const form = enter(); fireEvent.submit(form);
  await waitFor(() => expect(screen.getByRole('alert').textContent).toContain('Reload this page'));
  expect((screen.getByLabelText('Customer / supplier') as HTMLSelectElement).value).toBe('supplier');
  expect(screen.getByRole('alert').textContent).not.toContain('private'); expect(state.save).toHaveBeenCalledOnce();
});
