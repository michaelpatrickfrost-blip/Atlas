// @vitest-environment jsdom
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
const m=vi.hoisted(()=>({native:vi.fn()}));
vi.mock("@/app/(app)/templates/actions",()=>({saveTemplate:m.native}));
import { TemplateEditor } from "@/modules/templates/components/editor";
import type { TemplateDraftInspection } from "@/core/templates/inspection-contract";
import type { TemplateAuthoringInput } from "@/core/templates/authoring-input";

const initial={id:'template',version:4,name:'Our terms',description:'Our description',category:'Sales',titleTemplate:'For {{customer.name}}',blocks:[{id:'body',type:'text' as const,text:'Hello {{customer.name}}'}],targetModules:['sales'],status:'DRAFT'};
const saved:TemplateAuthoringInput={id:'template',version:5,data:{name:'Saved terms',description:'Saved description',category:'Service',titleTemplate:'Saved for {{customer.name}}',blocks:[{id:'saved-body',type:'text',text:'Saved wording {{customer.name}}'}],targetModules:['service'],status:'PUBLISHED'}};
function inspection(overrides:Partial<TemplateDraftInspection>={}):TemplateDraftInspection{
 return {valid:true,errors:[],local:{id:initial.id,version:initial.version,data:{...initial,status:'DRAFT'}},saved,currentVersion:5,changedSinceOpened:true,changes:[{kind:'setting',label:'Template name changed'},{kind:'section_changed',label:'Section wording changed',sectionId:'body'}],details:[{key:'customer.name',label:'Customer name',source:{kind:'customer',label:'Customer Master',description:'Supplied by the selected customer.'},uses:[{location:'title',label:'Document title'},{location:'section',label:'Section 1 · Paragraph',sectionId:'body'}]}],contexts:[],...overrides};
}
function form(){return new FormData(screen.getByRole('button',{name:'Save template'}).closest('form')!);}
function formObject(data:FormData){return [...data.entries()].sort((a,b)=>`${a[0]}:${a[1]}`.localeCompare(`${b[0]}:${b[1]}`));}
async function openCompare(){fireEvent.click(screen.getByRole('button',{name:'Compare with saved template'}));return await screen.findByRole('dialog',{name:'Compare with saved template'});}
afterEach(()=>{cleanup();vi.useRealTimers();});
beforeEach(()=>{vi.clearAllMocks();m.native.mockResolvedValue({error:'Kept for review'});});

it('checks the whole current form after a debounce and never calls native preview or save',async()=>{
 vi.useFakeTimers();const inspect=vi.fn().mockResolvedValue(inspection()),list=vi.fn(),preview=vi.fn();
 render(<TemplateEditor initial={initial} inspectDraft={inspect} listPreviewRecords={list} previewRecord={preview}/>);
 fireEvent.change(screen.getByLabelText('Template name'),{target:{value:'Edited terms'}});
 fireEvent.change(screen.getByLabelText('Description'),{target:{value:'Edited description'}});
 fireEvent.change(screen.getByLabelText('Status'),{target:{value:'PUBLISHED'}});
 fireEvent.change(screen.getByLabelText('Category'),{target:{value:'Contracts'}});
 fireEvent.click(screen.getByRole('checkbox',{name:'projects'}));
 await act(async()=>{await vi.advanceTimersByTimeAsync(449);});expect(inspect).not.toHaveBeenCalled();
 await act(async()=>{await vi.advanceTimersByTimeAsync(1);});expect(inspect).toHaveBeenCalledOnce();
 expect(formObject(inspect.mock.calls[0][0])).toEqual(formObject(form()));
 expect(screen.getByLabelText('Template checks').textContent).toContain('A newer saved version needs review');
 expect(list).not.toHaveBeenCalled();expect(preview).not.toHaveBeenCalled();expect(m.native).not.toHaveBeenCalled();
});

it('ignores inspection replies for an older complete local form and displays only current feedback',async()=>{
 vi.useFakeTimers();let release!:(value:TemplateDraftInspection)=>void;
 const inspect=vi.fn().mockImplementationOnce(()=>new Promise<TemplateDraftInspection>(resolve=>{release=resolve;})).mockResolvedValue(inspection({valid:false,errors:['Choose an app for this template.']}));
 render(<TemplateEditor initial={initial} inspectDraft={inspect}/>);
 await act(async()=>{await vi.advanceTimersByTimeAsync(450);});
 fireEvent.change(screen.getByLabelText('Template name'),{target:{value:'Latest local'}});
 await act(async()=>{release(inspection());});
 expect(screen.getByLabelText('Template checks').textContent).toContain('Checking your template');
 expect(screen.getByLabelText('Template checks').textContent).not.toContain('ready to save');
 await act(async()=>{await vi.advanceTimersByTimeAsync(450);});
 expect(screen.getByLabelText('Template checks').textContent).toContain('Choose an app for this template.');
 expect((screen.getByLabelText('Template name') as HTMLInputElement).value).toBe('Latest local');
});

it('Back leaves every local input and expected saved version untouched',async()=>{
 const compare=vi.fn().mockResolvedValue(inspection());render(<TemplateEditor initial={initial} compareSaved={compare}/>);
 fireEvent.change(screen.getByLabelText('Template name'),{target:{value:'My unsaved terms'}});const before=formObject(form());
 const modal=await openCompare();expect(within(modal).getByLabelText('Your unsaved document preview').textContent).toContain('Example customer');
 expect(within(modal).getByLabelText('Saved document preview').textContent).toContain('Saved wording Example customer');
 expect(modal.textContent).not.toContain('{{');expect(modal.textContent).toContain('Template name changed');
 fireEvent.click(within(modal).getByRole('button',{name:'Back'}));expect(formObject(form())).toEqual(before);expect(m.native).not.toHaveBeenCalled();
});

it('Keep adopts only the reviewed saved version and preserves complete local edits until explicit original save',async()=>{
 const compare=vi.fn().mockResolvedValue(inspection());render(<TemplateEditor initial={initial} compareSaved={compare}/>);
 fireEvent.change(screen.getByLabelText('Template name'),{target:{value:'My wording'}});
 fireEvent.change(screen.getByLabelText('Description'),{target:{value:'My description'}});
 fireEvent.change(screen.getByLabelText('Category'),{target:{value:'My category'}});
 fireEvent.change(screen.getByLabelText('Status'),{target:{value:'PUBLISHED'}});
 fireEvent.click(screen.getByRole('checkbox',{name:'CRM'}));
 const before=form();before.set('version','5');const modal=await openCompare();fireEvent.click(within(modal).getByRole('button',{name:'Keep my changes'}));
 expect(formObject(form())).toEqual(formObject(before));expect(m.native).not.toHaveBeenCalled();
 expect(screen.getByLabelText('Saved template context').textContent).toContain('Version 5 · Currently published');
 fireEvent.submit(screen.getByRole('button',{name:'Save template'}).closest('form')!);await waitFor(()=>expect(m.native).toHaveBeenCalledOnce());
 expect(formObject(m.native.mock.calls[0][0])).toEqual(formObject(before));
});

it('Use saved template adopts every saved native input but does not save or publish',async()=>{
 render(<TemplateEditor initial={initial} compareSaved={vi.fn().mockResolvedValue(inspection())}/>);
 fireEvent.change(screen.getByLabelText('Template name'),{target:{value:'Discard only by explicit choice'}});
 const modal=await openCompare();fireEvent.click(within(modal).getByRole('button',{name:'Use saved template'}));
 const data=form();expect(data.get('version')).toBe('5');expect(data.get('name')).toBe(saved.data.name);expect(data.get('category')).toBe(saved.data.category);
 expect(data.get('description')).toBe(saved.data.description);expect(data.get('titleTemplate')).toBe(saved.data.titleTemplate);
 expect(data.get('status')).toBe('PUBLISHED');expect(data.getAll('targetModules')).toEqual(['service']);expect(JSON.parse(String(data.get('blocks')))).toEqual(saved.data.blocks);
 expect(m.native).not.toHaveBeenCalled();
});

it('does not open stale comparison after editing while the saved design loads',async()=>{
 let release!:(value:TemplateDraftInspection)=>void;const compare=vi.fn(()=>new Promise<TemplateDraftInspection>(resolve=>{release=resolve;}));
 render(<TemplateEditor initial={initial} compareSaved={compare}/>);
 fireEvent.click(screen.getByRole('button',{name:'Compare with saved template'}));fireEvent.change(screen.getByLabelText('Category'),{target:{value:'Newest category'}});
 await act(async()=>{release(inspection());});expect(screen.queryByRole('dialog')).toBeNull();expect(screen.getByText(/Your draft changed while/)).toBeTruthy();expect(form().get('version')).toBe('4');
});

it('traps keyboard focus, closes with Escape and returns focus to the opening comparison button',async()=>{
 render(<TemplateEditor initial={initial} compareSaved={vi.fn().mockResolvedValue(inspection())}/>);
 const opener=screen.getByRole('button',{name:'Compare with saved template'});opener.focus();const modal=await openCompare();
 const first=within(modal).getByRole('button',{name:'Back to editing'}),last=within(modal).getByRole('button',{name:'Keep my changes'});
 expect(document.activeElement).toBe(first);fireEvent.keyDown(first,{key:'Tab',shiftKey:true});expect(document.activeElement).toBe(last);fireEvent.keyDown(last,{key:'Tab'});expect(document.activeElement).toBe(first);
 fireEvent.keyDown(modal,{key:'Escape'});expect(screen.queryByRole('dialog')).toBeNull();expect(document.activeElement).toBe(opener);expect(form().get('version')).toBe('4');
});

it('shows genuine detail metadata and navigates exact local title use without record or write callbacks',async()=>{
 const inspect=vi.fn().mockResolvedValue(inspection()),list=vi.fn(),preview=vi.fn();
 render(<TemplateEditor initial={initial} inspectDraft={inspect} listPreviewRecords={list} previewRecord={preview}/>);
 fireEvent.click(await screen.findByRole('button',{name:'Go to source'}));const modal=screen.getByRole('dialog',{name:'Customer name'});
 expect(within(modal).getByRole('heading',{name:'Customer Master'})).toBeTruthy();expect(modal.textContent).toContain('Supplied by the selected customer.');
 fireEvent.click(within(modal).getByRole('button',{name:'Where used in this template'}));fireEvent.click(within(modal).getByRole('button',{name:'Document title'}));
 await waitFor(()=>expect(document.activeElement).toBe(screen.getByLabelText('Document title')));expect(screen.queryByRole('dialog')).toBeNull();expect(list).not.toHaveBeenCalled();expect(preview).not.toHaveBeenCalled();expect(m.native).not.toHaveBeenCalled();
});

it('clears authorised record values when an explicitly reviewed saved baseline is adopted',async()=>{
 const list=vi.fn().mockResolvedValue([{module:'sales',type:'order',id:'order',label:'Order'}]);const preview=vi.fn().mockResolvedValue({fields:{'customer.name':'Private customer'},sourceLabel:'Order',companyName:'Business'});
 render(<TemplateEditor initial={initial} compareSaved={vi.fn().mockResolvedValue(inspection())} listPreviewRecords={list} previewRecord={preview}/>);
 fireEvent.change(screen.getByLabelText('Preview content'),{target:{value:'record'}});await screen.findByRole('option',{name:'Order'});
 fireEvent.change(screen.getByLabelText('Preview record'),{target:{value:'sales/order/order'}});await waitFor(()=>expect(screen.getByLabelText('Document preview').textContent).toContain('Private customer'));
 const modal=await openCompare();expect(modal.textContent).not.toContain('Private customer');fireEvent.click(within(modal).getByRole('button',{name:'Keep my changes'}));
 expect(screen.getByLabelText('Document preview').textContent).toContain('Example customer');expect(screen.getByLabelText('Document preview').textContent).not.toContain('Private customer');
 expect(list).toHaveBeenCalledOnce();expect(preview).toHaveBeenCalledOnce();expect(m.native).not.toHaveBeenCalled();
});

it('rechecks metadata after keeping a comparison whose saved version is unchanged',async()=>{
 const result=inspection({currentVersion:4,changedSinceOpened:false,saved:{...saved,version:4}}),inspect=vi.fn().mockResolvedValue(result);
 render(<TemplateEditor initial={initial} inspectDraft={inspect} compareSaved={vi.fn().mockResolvedValue(result)}/>);
 await screen.findByText('Your template is ready to save');expect(inspect).toHaveBeenCalledOnce();
 const modal=await openCompare();fireEvent.click(within(modal).getByRole('button',{name:'Keep my changes'}));
 await waitFor(()=>expect(inspect).toHaveBeenCalledTimes(2));expect(screen.getByLabelText('Template checks').textContent).toContain('Your template is ready to save');
});

it('rejects old component identity rather than inspecting an old draft under a different template id',async()=>{
 vi.useFakeTimers();const inspect=vi.fn().mockResolvedValue(inspection());const view=render(<TemplateEditor initial={initial} inspectDraft={inspect}/>);
 fireEvent.change(screen.getByLabelText('Template name'),{target:{value:'Private local wording'}});
 view.rerender(<TemplateEditor initial={{...initial,id:'other-template'}} inspectDraft={inspect}/>);
 await act(async()=>{await vi.advanceTimersByTimeAsync(450);});expect(inspect).not.toHaveBeenCalled();expect(screen.queryByRole('button',{name:'Save template'})).toBeNull();expect(screen.getByRole('alert').textContent).toContain('This template has changed');
});

it('explains section, row and column removals and applies them only after an explicit choice',async()=>{
 render(<TemplateEditor initial={{...initial,blocks:[{id:'table',type:'table',text:'Name|Terms\nItem|Monday'},{id:'other',type:'text',text:'Keep this wording'}]}}/>);
 const before=formObject(form());fireEvent.click(screen.getAllByRole('button',{name:'Remove'})[1]);
 let modal=screen.getByRole('dialog',{name:'Remove this section?'});expect(modal.textContent).toContain('Section 2 and all its wording');fireEvent.click(within(modal).getByRole('button',{name:'Keep it'}));expect(formObject(form())).toEqual(before);
 fireEvent.click(screen.getByRole('button',{name:'Remove table row 2'}));modal=screen.getByRole('dialog',{name:'Remove this table row?'});expect(modal.textContent).toContain('Row 2 and its 2 cells');fireEvent.click(within(modal).getByRole('button',{name:'Remove row'}));
 expect(screen.queryByLabelText('Section 1 row 2 column 1')).toBeNull();expect(screen.getByLabelText('Section 2 text')).toBeTruthy();
 fireEvent.click(screen.getByRole('button',{name:'Remove last column'}));modal=screen.getByRole('dialog',{name:'Remove the last table column?'});expect(modal.textContent).toContain('wording in 1 row');fireEvent.click(within(modal).getByRole('button',{name:'Remove column'}));expect(screen.queryByLabelText('Section 1 row 1 column 2')).toBeNull();
 fireEvent.click(screen.getAllByRole('button',{name:'Remove'})[1]);modal=screen.getByRole('dialog',{name:'Remove this section?'});fireEvent.click(within(modal).getByRole('button',{name:'Remove section'}));expect(screen.queryByLabelText('Section 2 text')).toBeNull();expect(m.native).not.toHaveBeenCalled();
});
