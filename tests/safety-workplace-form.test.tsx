// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
const m=vi.hoisted(()=>({save:vi.fn()}));
vi.mock('@/modules/safety/services/commands',()=>({saveWorkplaceRecord:m.save}));
import { WorkplaceForm } from '@/modules/safety/components/workplace-form';
afterEach(cleanup);
it('keeps rejected draft and captures fields before disabling them',async()=>{m.save.mockResolvedValue({error:'Record changed in another window.'});render(<WorkplaceForm/>);fireEvent.change(screen.getByLabelText('Title'),{target:{value:'Keep my workstation review'}});fireEvent.change(screen.getByLabelText('Workstation and equipment'),{target:{value:'Two monitors and adjustable desk'}});fireEvent.submit(screen.getByRole('button',{name:'Create workplace record'}).closest('form')!);await waitFor(()=>expect(screen.getByRole('alert').textContent).toContain('another window'));expect((screen.getByLabelText('Title') as HTMLInputElement).value).toBe('Keep my workstation review');expect((m.save.mock.calls[0][0] as FormData).get('finding1')).toBe('Two monitors and adjustable desk');});
it('hides restricted types unless sensitive access is granted',()=>{const view=render(<WorkplaceForm/>);expect(screen.queryByRole('option',{name:'PEEP'})).toBeNull();view.rerender(<WorkplaceForm sensitiveAllowed/>);expect(screen.getByRole('option',{name:'PEEP'})).toBeTruthy();});
it('changes guided labels without clearing entered findings',()=>{render(<WorkplaceForm/>);fireEvent.change(screen.getByLabelText('Workstation and equipment'),{target:{value:'Existing finding'}});fireEvent.change(screen.getByLabelText('Record type'),{target:{value:'FIRE_DRILL'}});expect((screen.getByLabelText('Scenario and alarm raised') as HTMLTextAreaElement).value).toBe('Existing finding');});
