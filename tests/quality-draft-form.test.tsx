// @vitest-environment jsdom
import { cleanup,fireEvent,render,screen,waitFor } from '@testing-library/react';
import { afterEach,expect,it,vi } from 'vitest';
vi.mock('next/navigation',()=>({useRouter:()=>({refresh:vi.fn()})}));
import { QualityForm } from '@/modules/quality/components/action-form';
afterEach(cleanup);
it('captures actual fields before disabling the form and retains rejected draft',async()=>{const action=vi.fn().mockResolvedValue({error:'Issue changed in another window'});render(<QualityForm action={action}><label>Review evidence<textarea name="evidence"/></label><button type="submit">Save review</button></QualityForm>);fireEvent.change(screen.getByLabelText('Review evidence'),{target:{value:'Retain my review findings'}});fireEvent.submit(screen.getByRole('button',{name:'Save review'}).closest('form')!);await waitFor(()=>expect(screen.getByRole('alert').textContent).toContain('changed'));expect((screen.getByLabelText('Review evidence') as HTMLTextAreaElement).value).toBe('Retain my review findings');expect((action.mock.calls[0][0] as FormData).get('evidence')).toBe('Retain my review findings');expect(screen.getByRole('status').textContent).not.toContain('Saved');});
