// @vitest-environment jsdom
import {afterEach,describe,it,expect,vi} from 'vitest';
import {cleanup,fireEvent,render,screen,waitFor} from '@testing-library/react';
vi.mock('next/navigation',()=>({useRouter:()=>({refresh:vi.fn()})}));
import {HRForm} from '@/modules/people/components/hr-form';
afterEach(cleanup);
describe('HR save recovery',()=>{
 it('retains entered data after expected validation rejection',async()=>{const action=vi.fn(async()=>({error:'A newer record exists'}));render(<HRForm action={action}><label>Notes<input name="notes"/></label><button type="submit">Save</button></HRForm>);fireEvent.change(screen.getByLabelText('Notes'),{target:{value:'My entered evidence'}});fireEvent.click(screen.getByText('Save'));await screen.findByRole('alert');expect((screen.getByLabelText('Notes') as HTMLInputElement).value).toBe('My entered evidence');expect((action.mock.calls[0] as unknown as [FormData])[0].get('notes')).toBe('My entered evidence');});
 it('captures form values before pending disables them and protects unexpected errors',async()=>{const action=vi.fn(async()=>{throw Error('private DB details');});render(<HRForm action={action}><label>Name<input name="name" defaultValue="Applicant"/></label><button type="submit">Save</button></HRForm>);fireEvent.click(screen.getByText('Save'));await waitFor(()=>expect(screen.getByRole('alert').textContent).toContain('Your entered work'));expect(screen.getByRole('alert').textContent).not.toContain('private DB');expect((screen.getByLabelText('Name') as HTMLInputElement).value).toBe('Applicant');});
});
