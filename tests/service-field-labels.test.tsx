// @vitest-environment jsdom
import { afterEach, expect, it } from 'vitest';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { Select } from '@/components/ui/service-fields';
import { WORK_STATUSES } from '@/core/service-work/config';
afterEach(cleanup);
it('the actual native work Status control has an exact stable name despite all option text', () => {
  render(<form aria-label="Update work"><Select title="Status" name="status" defaultValue="NEW" options={WORK_STATUSES}/><button>Update work</button></form>);
  const form = screen.getByRole('form', { name: 'Update work' });
  const status = within(form).getByLabelText('Status', { exact: true }) as HTMLSelectElement;
  expect(status).toBe(within(form).getByRole('combobox', { name: 'Status' }));
  expect(status.name).toBe('status'); expect(status.value).toBe('NEW');
  expect([...status.options].map(option => option.value)).toEqual([...WORK_STATUSES]);
  for (const value of ['IN_PROGRESS', 'RESOLVED', 'IN_PROGRESS']) {
    fireEvent.change(status, { target: { value } });
    expect(status.value).toBe(value); expect(new FormData(form as HTMLFormElement).get('status')).toBe(value);
    expect(within(form).getByLabelText('Status', { exact: true })).toBe(status);
  }
});
it('Select retains intentional explicit accessible labels and its exact owning submitted value', () => {
  render(<Select title="Status" aria-label="Work status" name="status" defaultValue="RESOLVED" options={WORK_STATUSES}/>);
  const select = screen.getByRole('combobox', { name: 'Work status' }) as HTMLSelectElement;
  expect(select.value).toBe('RESOLVED'); expect(select.name).toBe('status');
});
