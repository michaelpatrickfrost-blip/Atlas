// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
const mocks=vi.hoisted(()=>({refresh:vi.fn(),create:vi.fn()}));
vi.mock('next/navigation',()=>({useRouter:()=>({refresh:mocks.refresh})}));
vi.mock('@/modules/marketing/services/campaign-actions',()=>({createCampaignAction:mocks.create}));
import { ActionForm } from '@/modules/marketing/components/action-form';
import { CampaignBuilder } from '@/modules/marketing/components/campaign-builder';
afterEach(cleanup);
it('keeps the marketing draft after a rejected save and submits its actual values',async()=>{
 const save=vi.fn().mockRejectedValue(new Error('Campaign changed.'));
 render(<ActionForm action={save} label="Save brief"><label>Team notes<textarea name="notes"/></label></ActionForm>);
 fireEvent.change(screen.getByLabelText('Team notes'),{target:{value:'Keep the agency brief'}});
 fireEvent.submit(screen.getByRole('button',{name:'Save brief'}).closest('form')!);
 await waitFor(()=>expect(screen.getByRole('alert').textContent).toContain('changed'));
 expect((screen.getByLabelText('Team notes') as HTMLTextAreaElement).value).toBe('Keep the agency brief');
 expect((save.mock.calls[0][0] as FormData).get('notes')).toBe('Keep the agency brief');
});
it('keeps a campaign builder draft after a validation rejection',async()=>{
 mocks.create.mockRejectedValue(new Error('Channel allocations exceed budget.'));
 render(<CampaignBuilder options={{audiences:[],products:[],members:[],programmes:[]}}/>);
 fireEvent.click(screen.getByRole('button',{name:/Blank campaign/i}));
 fireEvent.change(screen.getByLabelText('Campaign name'),{target:{value:'Autumn campaign'}});
 fireEvent.click(within(screen.getByRole('navigation')).getByRole('button',{name:/Channels and budget/}));
 fireEvent.change(screen.getByLabelText('Total budget'),{target:{value:'99.25'}});
 fireEvent.submit(screen.getByRole('button',{name:'Create now'}).closest('form')!);
 await waitFor(()=>expect(screen.getByRole('alert').textContent).toContain('exceed'));
 expect((screen.getByLabelText('Total budget') as HTMLInputElement).value).toBe('99.25');
 expect((mocks.create.mock.calls[0][0] as FormData).get('name')).toBe('Autumn campaign');
});
