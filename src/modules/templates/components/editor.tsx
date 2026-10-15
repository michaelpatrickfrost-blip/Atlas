"use client";
import { useEffect, useLayoutEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { ActionForm } from "@/components/ui/action-form";
import { Button } from "@/components/ui/button";
import { saveTemplate } from "@/app/(app)/templates/actions";
import { MERGE_FIELDS, TARGET_MODULES, type TemplateBlock } from "@/core/templates/types";
import { mergeKeys } from "@/core/templates/domain";
import { documentDetailKey, templateDetailLabel, templateTableRows, templateTableText } from "@/core/templates/editor-model";
import type { DocumentPreview, DocumentPreviewChoice } from "@/core/templates/preview";
import type { FormFeedback } from "@/core/shared/form-feedback";
import { TemplateTextEditor } from "./text-editor";
import { TemplateDocumentPreview, TemplateReviewDialog, templateExampleValues } from "./review";
import type { TemplateDraftInspection, TemplateDetailInspection } from "@/core/templates/inspection-contract";
type InspectDraft = (form: FormData) => Promise<TemplateDraftInspection | FormFeedback>;
function draftForm(draft: Initial): FormData {
 const form = new FormData();
 for (const name of ['name','description','category','titleTemplate','status'] as const) form.set(name,draft[name]);
 form.set('id',draft.id??'');form.set('version',String(draft.version??1));form.set('blocks',JSON.stringify(draft.blocks));
 for(const target of draft.targetModules) form.append('targetModules',target);
 return form;
}
export const field = "mt-1 block w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm";
const starters:Record<string,{title:string;blocks:TemplateBlock[]}>= {
 blank:{title:'Document for {{customer.name}}',blocks:[{id:'intro',type:'heading',text:'Agreement'},{id:'terms',type:'text',text:'Between {{company.name}} and {{customer.name}}.\n\nAdd your agreed terms here.'},{id:'sign',type:'signature',text:'Customer acceptance'}]},
 supply:{title:'Supply agreement · {{record.name}}',blocks:[{id:'intro',type:'heading',text:'Supply agreement'},{id:'parties',type:'text',text:'This agreement is between {{company.name}} and {{customer.name}}, dated {{date.today}}.'},{id:'scope',type:'heading',text:'Scope of supply'},{id:'details',type:'text',text:'{{custom.scope}}'},{id:'pricing',type:'heading',text:'Price and payment'},{id:'price',type:'text',text:'{{custom.payment_terms}}'},{id:'delivery',type:'heading',text:'Delivery and responsibilities'},{id:'service',type:'text',text:'{{custom.delivery_terms}}'},{id:'sign',type:'signature',text:'For {{customer.name}}'}]},
 service:{title:'Service agreement · {{record.reference}}',blocks:[{id:'intro',type:'heading',text:'Service agreement'},{id:'body',type:'text',text:'Prepared by {{company.name}} for {{customer.name}}.\nReference: {{record.reference}}\nDate: {{date.today}}'},{id:'scope',type:'text',text:'{{custom.services}}'},{id:'levels',type:'text',text:'{{custom.service_levels}}'},{id:'sign',type:'signature',text:'Customer acceptance'}]},
 project:{title:'Project brief · {{record.name}}',blocks:[{id:'h',type:'heading',text:'Project brief'},{id:'intro',type:'text',text:'{{record.name}} · {{record.reference}}\nPrepared by {{company.name}} on {{date.today}}.'},{id:'scope',type:'text',text:'{{custom.scope}}'},{id:'success',type:'text',text:'{{custom.success_criteria}}'},{id:'sign',type:'signature',text:'Project approval'}]},
};
type Initial = {id?:string;version?:number;name:string;description:string;category:string;titleTemplate:string;blocks:TemplateBlock[];targetModules:string[];status:string};
type PreviewInput = { titleTemplate: string; blocks: TemplateBlock[]; targetModules: string[]; sourceModule: string; sourceType: string; sourceId: string };
type Target = { id: string; start: number; end: number; row?: number; column?: number };
export function TemplateEditor({initial,saveAction=saveTemplate,libraryHref='/templates',listPreviewRecords,previewRecord,inspectDraft,compareSaved}:{
 initial?:Initial;saveAction?:(form:FormData)=>Promise<void|FormFeedback>;libraryHref?:string;
 listPreviewRecords?:(targets: string[])=>Promise<DocumentPreviewChoice[]|FormFeedback>;
 previewRecord?:(input: PreviewInput)=>Promise<DocumentPreview|FormFeedback>;
 inspectDraft?:InspectDraft;compareSaved?:InspectDraft;
}){
 const [blocks,setBlocks]=useState<TemplateBlock[]>(initial?.blocks??starters.blank.blocks),[title,setTitle]=useState(initial?.titleTemplate??starters.blank.title);
 const [selected,setSelected]=useState(blocks[0]?.id),[activeField,setActiveField]=useState('customer.name'),[detailName,setDetailName]=useState(''),[message,setMessage]=useState('');
 const [targets,setTargets]=useState<string[]>(initial?.targetModules??[...TARGET_MODULES]);
 const [mode,setMode]=useState<'example'|'record'>('example'),[choices,setChoices]=useState<DocumentPreviewChoice[]>([]),[source,setSource]=useState('');
 const [actual,setActual]=useState<DocumentPreview|null>(null),[previewError,setPreviewError]=useState(''),[values,setValues]=useState<Record<string,string>>({}),[pending,startTransition]=useTransition();
 const caret=useRef<Target|null>(null),request=useRef(0);
 const [name,setName]=useState(initial?.name??''),[description,setDescription]=useState(initial?.description??''),[category,setCategory]=useState(initial?.category??'Contract'),[status,setStatus]=useState(initial?.status??'DRAFT');
 const [baseline,setBaseline]=useState({version:initial?.version??1,status:initial?.status??'DRAFT'});
 const [inspection,setInspection]=useState<{key:string;value:TemplateDraftInspection}|null>(null),[inspectionError,setInspectionError]=useState<{key:string;message:string}|null>(null);
 const [comparison,setComparison]=useState<{key:string;value:TemplateDraftInspection;local:Initial}|null>(null),[comparing,setComparing]=useState(false),[reviewMessage,setReviewMessage]=useState('');
 const [checkRevision,setCheckRevision]=useState(0);
 const [removal,setRemoval]=useState<{key:string;title:string;message:string;confirmLabel:string;apply:()=>void}|null>(null);
 const [detail,setDetail]=useState<{item:TemplateDetailInspection;tab:'source'|'uses'}|null>(null);
 const compareButton=useRef<HTMLButtonElement>(null),editorRoot=useRef<HTMLDivElement>(null),inspectionEpoch=useRef(0),comparisonEpoch=useRef(0);
 const local:Initial={id:initial?.id,version:baseline.version,name,description,category,status,titleTemplate:title,blocks,targetModules:targets};
 const draftKey=JSON.stringify(local),identity=JSON.stringify([initial?.id??'',initial?.version??1]);
 const [openedIdentity]=useState(identity),sameIdentity=openedIdentity===identity;
 const current=useRef({key:draftKey,identity,local});
 useLayoutEffect(()=>{current.current={key:draftKey,identity,local};});
 useEffect(()=>{
  if(!inspectDraft||!sameIdentity)return;
  const epoch=++inspectionEpoch.current,captured=current.current;let cancelled=false;
  const timer=setTimeout(()=>{void(async()=>{
   try{const result=await inspectDraft(draftForm(captured.local));
    if(cancelled||epoch!==inspectionEpoch.current||current.current.key!==captured.key||current.current.identity!==captured.identity)return;
    if('error'in result){setInspectionError({key:captured.key,message:result.error});setInspection(null);return;}
    setInspection({key:captured.key,value:result});setInspectionError(null);
   }catch{if(!cancelled&&epoch===inspectionEpoch.current&&current.current.key===captured.key&&current.current.identity===captured.identity)setInspectionError({key:captured.key,message:'Checks are unavailable. Your wording is kept; try again before saving.'});}
  })();},450);
  return()=>{clearTimeout(timer);cancelled=true;};
 },[draftKey,identity,inspectDraft,checkRevision,sameIdentity]);
 useEffect(()=>()=>{comparisonEpoch.current++;request.current++;},[]);
 const checked=inspection?.key===draftKey?inspection.value:null,checkError=inspectionError?.key===draftKey?inspectionError.message:null;
 const compare=async()=>{
  if(!sameIdentity||!compareSaved||!initial?.id||comparing)return;
  const captured=current.current,epoch=++comparisonEpoch.current;
  setComparing(true);setReviewMessage('');
  try{const result=await compareSaved(draftForm(captured.local));
   if(epoch!==comparisonEpoch.current||current.current.identity!==captured.identity)return;
   if(current.current.key!==captured.key){setReviewMessage('Your draft changed while the saved template was loading. Compare again to include your latest wording.');return;}
   if('error'in result){setReviewMessage(result.error);return;}
   if(!result.saved||result.saved.id!==captured.local.id||result.currentVersion!==result.saved.version){setReviewMessage('The saved template could not be compared. Your changes are kept.');return;}
   setComparison({key:captured.key,value:result,local:structuredClone(captured.local)});
  }catch{if(epoch===comparisonEpoch.current&&current.current.identity===captured.identity)setReviewMessage('The saved template is unavailable. Your changes are kept; try again.');}
  finally{if(epoch===comparisonEpoch.current)setComparing(false);}
 };
 const adopt=(useSaved:boolean)=>{
  if(!sameIdentity||!comparison||comparison.key!==current.current.key||!comparison.value.saved)return;
  const saved=comparison.value.saved;if(!saved.version||saved.id!==initial?.id)return;
  comparisonEpoch.current++;inspectionEpoch.current++;
  if(useSaved){setName(saved.data.name);setDescription(saved.data.description);setCategory(saved.data.category);setStatus(saved.data.status);setTitle(saved.data.titleTemplate);setBlocks(saved.data.blocks);setTargets(saved.data.targetModules);setSelected(saved.data.blocks[0]?.id);setValues({});}
  setBaseline({version:saved.version,status:saved.data.status});setCheckRevision(value=>value+1);setComparison(null);setInspection(null);setInspectionError(null);setDetail(null);resetPreview();setMode('example');caret.current=null;
  setReviewMessage(useSaved?'The saved template is now in your editor. Nothing was saved or published.':'Your changes are kept against the saved version you reviewed. Save template when you are ready.');
 };
 const openUsage=(use:TemplateDetailInspection['uses'][number])=>{
  setDetail(null);
  requestAnimationFrame(()=>{
   const region=use.location==='title'?editorRoot.current?.querySelector<HTMLElement>('[data-template-title]'):[...(editorRoot.current?.querySelectorAll<HTMLElement>('[data-template-section]')??[])].find(node=>node.dataset.templateSection===use.sectionId);
   region?.scrollIntoView?.({block:'center',behavior:'smooth'});
   const cell=use.location==='table_cell'?[...(region?.querySelectorAll<HTMLElement>('[data-template-cell]')??[])].find(node=>node.dataset.templateCell===`${use.row}:${use.column}`):null;
   (cell??region)?.querySelector<HTMLElement>('textarea,select,button')?.focus();
  });
 };

 const change=(id:string,patch:Partial<TemplateBlock>)=>setBlocks(rows=>rows.map(block=>block.id===id?{...block,...patch}:block));
 const customKeys=mergeKeys(title+'\n'+blocks.map(block=>block.text).join('\n')).filter(key=>key.startsWith('custom.'));
 const selectedTarget=(id:string,start:number,end:number,row?:number,column?:number)=>{caret.current={id,start,end,row,column};if(id!=='title')setSelected(id);};
 const insert=(key:string)=>{
  const token=`{{${key}}}`,target=caret.current,block=blocks.find(item=>item.id===(target?.id??selected));
  if(target?.id==='title'){setTitle(title.slice(0,target.start)+token+title.slice(target.end));caret.current={...target,start:target.start+token.length,end:target.start+token.length};return;}
  if(!block)return;
  if(block.type==='table'&&target?.row!==undefined&&target.column!==undefined){
   const rows=templateTableRows(block.text);if(!rows[target.row]||target.column>=rows[target.row].length){caret.current=null;return;}const text=rows[target.row][target.column];
   rows[target.row][target.column]=text.slice(0,target.start)+token+text.slice(target.end);change(block.id,{text:templateTableText(rows)});
  }else{const start=target?.id===block.id?target.start:block.text.length,end=target?.id===block.id?target.end:block.text.length;change(block.id,{text:block.text.slice(0,start)+token+block.text.slice(end)});}
  caret.current=null;
 };
 const move=(index:number,delta:number)=>{const copy=[...blocks],at=index+delta;if(at<0||at>=copy.length)return;[copy[index],copy[at]]=[copy[at],copy[index]];setBlocks(copy);};
 const resetPreview=()=>{request.current++;setActual(null);setSource('');setChoices([]);setPreviewError('');};
 const loadRecords=()=>{if(!listPreviewRecords)return;const current=++request.current;setActual(null);setSource('');setPreviewError('');setChoices([]);
  startTransition(async()=>{try{const result=await listPreviewRecords(targets);if(current!==request.current)return;if('error'in result){setPreviewError(result.error);return;}setChoices(result);if(!result.length)setPreviewError('No available records in the selected apps.');}catch{if(current===request.current)setPreviewError('Could not load business records. Check your access and try again.');}});
 };
 const refresh=(id=source)=>{if(!previewRecord)return;const choice=choices.find(item=>`${item.module}/${item.type}/${item.id}`===id),current=++request.current;setActual(null);setPreviewError('');if(!choice)return;
  startTransition(async()=>{try{const result=await previewRecord({titleTemplate:title,blocks,targetModules:targets,sourceModule:choice.module,sourceType:choice.type,sourceId:choice.id});if(current!==request.current)return;if('error'in result){setPreviewError(result.error);return;}setActual(result);}catch{if(current===request.current)setPreviewError('This business preview is unavailable. Check your access and refresh.');}});
 };
 const fields={...(mode==='example'?templateExampleValues:actual?.fields??{}),...Object.fromEntries(customKeys.map(key=>[key,values[key]??`[${templateDetailLabel(key)}]`]))};
 const tableEditor=(block:TemplateBlock,index:number)=>{
  const rows=templateTableRows(block.text),columns=Math.max(...rows.map(row=>row.length),1);
  if(columns>6)return <p role="alert" className="text-sm text-red-700">This saved table has more than six columns. Keep its content in the existing template until it has been reviewed for the document format.</p>;
  const setRows=(next:string[][])=>{const text=templateTableText(next);if(text.length>12000){setMessage('Keep this section under 12,000 characters.');return;}setMessage('');caret.current=null;change(block.id,{text});};
  return <div className="space-y-3"><div className="overflow-x-auto"><table className="w-full min-w-72"><tbody>{rows.map((row,r)=><tr key={r}>{Array.from({length:columns},(_,c)=><td key={c} data-template-cell={`${r+1}:${c+1}`} className="min-w-32 align-top p-1"><TemplateTextEditor compact label={`Section ${index+1} row ${r+1} column ${c+1}`} value={row[c]??''}
   onSelection={(start,end)=>selectedTarget(block.id,start,end,r,c)} onChange={text=>{if(/[|\n\r]/.test(text)){setMessage('Use Add table row or Add table column to arrange the table.');return;}const next=rows.map(item=>[...item]);next[r][c]=text;setRows(next);}}/></td>)}<td className="align-middle"><button type="button" disabled={rows.length===1} aria-label={`Remove table row ${r+1}`} onClick={()=>setRemoval({key:draftKey,title:'Remove this table row?',message:`Row ${r+1} and its ${columns} cells will be removed from this unsaved template.`,confirmLabel:'Remove row',apply:()=>setRows(rows.filter((_,i)=>i!==r))})} className="px-2 text-xs text-slate-500 disabled:opacity-20">×</button></td></tr>)}</tbody></table></div>
   <div className="flex flex-wrap gap-3 text-xs"><button type="button" disabled={rows.length>=80} onClick={()=>setRows([...rows,Array.from({length:columns},()=> '')])} className="text-blue-700">Add table row</button><button type="button" disabled={columns>=6} onClick={()=>setRows(rows.map(row=>[...Array.from({length:columns},(_,c)=>row[c]??''),'']))} className="text-blue-700 disabled:opacity-30">Add table column</button>{columns>1&&<button type="button" onClick={()=>setRemoval({key:draftKey,title:'Remove the last table column?',message:`The last column and its wording in ${rows.length} ${rows.length===1?'row':'rows'} will be removed from this unsaved template.`,confirmLabel:'Remove column',apply:()=>setRows(rows.map(row=>row.slice(0,columns-1)))})} className="text-slate-500">Remove last column</button>}</div></div>;
 };
 if(!sameIdentity)return <p role="alert" className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm">This template has changed. <Link href={libraryHref} className="text-blue-700">Return to the template library</Link> to open its current saved design.</p>;
 return <><div ref={editorRoot} inert={comparison!==null||detail!==null||removal!==null}><ActionForm action={saveAction} className="space-y-5">
  <input type="hidden" name="id" value={initial?.id??''}/><input type="hidden" name="version" value={baseline.version}/><input type="hidden" name="blocks" value={JSON.stringify(blocks)}/><input type="hidden" name="titleTemplate" value={title}/>
  <div className="flex flex-wrap items-center justify-between gap-3"><div><Link href={libraryHref} className="text-xs text-blue-700">← Template library</Link><h2 className="mt-2 text-2xl font-semibold">{initial?'Edit template':'Build a template'}</h2><p className="mt-1 text-sm text-slate-500">Arrange sections, insert named details and preview the document your business will use.</p></div><div className="flex flex-wrap items-center gap-2">{initial?.id&&compareSaved&&<Button ref={compareButton} type="button" disabled={comparing} onClick={()=>void compare()}>{comparing?'Loading saved template…':'Compare with saved template'}</Button>}<Button type="submit" variant="primary">Save template</Button></div></div>
  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 rounded-xl bg-slate-50 px-4 py-3 text-xs text-slate-600" aria-label="Saved template context"><strong className="font-medium">{initial?`Version ${baseline.version} · Currently ${baseline.status==='PUBLISHED'?'published':'draft'}`:'New draft'}</strong><span>Edits apply only after Save template.</span></div>
  {!initial&&<div className="flex flex-wrap items-center gap-2"><span className="text-xs text-slate-500">Start with</span>{Object.keys(starters).map(key=><button key={key} type="button" onClick={()=>{setBlocks(starters[key].blocks);setTitle(starters[key].title);setSelected(starters[key].blocks[0].id);caret.current=null;}} className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs capitalize">{key==='blank'?'Blank':key==='supply'?'Supply agreement':key==='service'?'Service agreement':'Project brief'}</button>)}<span className="text-xs text-slate-400">Review starter wording before use.</span></div>}
  <div className="grid gap-4 rounded-2xl border border-slate-200 bg-white p-5 sm:grid-cols-2 xl:grid-cols-4">
   <label className="text-xs font-medium">Template name<input name="name" required maxLength={300} value={name} onChange={event=>setName(event.target.value)} className={field}/></label>
   <div data-template-title className="text-xs font-medium sm:col-span-2">Document title<TemplateTextEditor compact label="Document title" value={title} onChange={setTitle} onSelection={(start,end)=>selectedTarget('title',start,end)}/></div>
   <label className="text-xs font-medium">Status<select aria-label="Status" name="status" value={status} onChange={event=>setStatus(event.target.value)} className={field}><option value="DRAFT">Draft</option><option value="PUBLISHED">Published · available to use</option></select></label>
   <label className="text-xs font-medium">Category<input name="category" maxLength={60} value={category} onChange={event=>setCategory(event.target.value)} className={field}/></label>
   <label className="text-xs font-medium sm:col-span-2">Description<input name="description" maxLength={2000} value={description} onChange={event=>setDescription(event.target.value)} className={field}/></label>
   <div className="text-xs font-medium">Use in apps<div className="mt-2 flex flex-wrap gap-3">{TARGET_MODULES.map(id=><label key={id} className="flex items-center gap-1 capitalize"><input name="targetModules" type="checkbox" value={id} checked={targets.includes(id)} onChange={event=>{setTargets(event.target.checked?[...targets,id]:targets.filter(target=>target!==id));resetPreview();}}/>{id==='crm'?'CRM':id}</label>)}</div></div>
  </div>
  {inspectDraft&&<section aria-label="Template checks" className={`rounded-2xl border p-4 ${checkError||checked&&!checked.valid?'border-amber-200 bg-amber-50':'border-blue-100 bg-blue-50/50'}`}>
   <p role="status" className="text-sm font-medium">{checkError?'Checks unavailable':!checked?'Checking your template…':!checked.valid?'Review these details before saving':checked.changedSinceOpened?'A newer saved version needs review':'Your template is ready to save'}</p>
   {checkError&&<p className="mt-1 text-sm text-amber-900">{checkError}</p>}{checked&&!checked.valid&&<ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-amber-900">{checked.errors.map((error,index)=><li key={index}>{error}</li>)}</ul>}
   {checked?.changedSinceOpened&&<p className="mt-2 text-sm text-amber-900">Someone saved a newer version. Your changes are kept. Compare with the saved template before saving.</p>}
   <p className="mt-1 text-xs text-slate-600">Checks review the template setup. Saving still checks your current access and the latest saved version.</p>
  </section>}
  {reviewMessage&&<p role="status" className="text-sm text-slate-700">{reviewMessage}</p>}
  <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
   <section className="min-w-0 space-y-3"><div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4"><div className="flex flex-wrap items-end gap-2"><label className="flex-1 text-xs font-medium">Choose a detail<select aria-label="Choose a detail" value={activeField} onChange={event=>setActiveField(event.target.value)} className={field}>{[...MERGE_FIELDS,...customKeys].map(key=><option key={key} value={key}>{templateDetailLabel(key)}</option>)}</select></label><button type="button" onClick={()=>insert(activeField)} className="rounded-xl bg-blue-50 px-3 py-2.5 text-xs font-medium text-blue-700">Insert in selected section</button></div>
    <p className="text-xs leading-5 text-slate-500">Click your wording, then insert a business detail at that point. Blue pieces fill themselves in when a document is created.</p>
    {checked?.details.some(item=>item.key===activeField)&&<div className="flex flex-wrap gap-3 text-xs"><button type="button" onClick={()=>{const item=checked.details.find(item=>item.key===activeField);if(item)setDetail({item,tab:'source'});}} className="text-blue-700">Go to source</button><button type="button" onClick={()=>{const item=checked.details.find(item=>item.key===activeField);if(item)setDetail({item,tab:'uses'});}} className="text-blue-700">Where used in this template</button></div>}

    <div className="flex flex-wrap items-end gap-2"><label className="flex-1 text-xs font-medium">Custom detail name<input value={detailName} maxLength={60} onChange={event=>setDetailName(event.target.value)} className={field} placeholder="For example, Delivery note"/></label><button type="button" onClick={()=>{try{const key=documentDetailKey(detailName);insert(key);setActiveField(key);setDetailName('');setMessage('');}catch(error){setMessage(error instanceof Error?error.message:'Choose a detail name.');}}} className="rounded-xl border border-slate-200 px-3 py-2.5 text-xs font-medium">Add document detail</button></div>
    <p className="text-xs leading-5 text-slate-500">Document details are filled in separately for each document, such as its agreed delivery terms.</p>{message&&<p role="alert" className="text-xs text-red-700">{message}</p>}
   </div>
   {blocks.map((block,index)=><div key={block.id} data-template-section={block.id} className={`min-w-0 rounded-2xl border bg-white p-4 ${selected===block.id?'border-blue-400 shadow-sm':'border-slate-200'}`}><div className="mb-3 flex flex-wrap items-center gap-2"><span className="text-xs text-slate-400">{index+1}</span><select aria-label={`Section ${index+1} type`} value={block.type} onChange={event=>{const type=event.target.value as TemplateBlock['type'];change(block.id,{type});setSelected(block.id);caret.current=null;}} className="flex-1 rounded-lg border border-slate-200 px-2 py-1.5 text-sm">{['heading','text','bullets','table','signature','divider','pageBreak'].map(type=><option key={type} value={type}>{type==='pageBreak'?'Page break':type==='text'?'Paragraph':type[0].toUpperCase()+type.slice(1)}</option>)}</select><button type="button" aria-label="Move section up" disabled={index===0} onClick={()=>move(index,-1)} className="px-1 disabled:opacity-20">↑</button><button type="button" aria-label="Move section down" disabled={index===blocks.length-1} onClick={()=>move(index,1)} className="px-1 disabled:opacity-20">↓</button><button type="button" onClick={()=>setBlocks([...blocks.slice(0,index+1),{...block,id:crypto.randomUUID()},...blocks.slice(index+1)])} className="text-xs text-blue-700">Copy</button><button type="button" disabled={blocks.length===1} onClick={()=>setRemoval({key:draftKey,title:'Remove this section?',message:`Section ${index+1} and all its wording will be removed from this unsaved template.`,confirmLabel:'Remove section',apply:()=>{setBlocks(blocks.filter(item=>item.id!==block.id));caret.current=null;}})} className="text-xs text-red-600 disabled:opacity-20">Remove</button></div>
    {block.type==='table'?tableEditor(block,index):!['divider','pageBreak'].includes(block.type)?<TemplateTextEditor label={`Section ${index+1} text`} value={block.text} onChange={text=>change(block.id,{text})} onSelection={(start,end)=>selectedTarget(block.id,start,end)} compact={block.type==='heading'}/>:<p className="text-xs text-slate-500">{block.type==='divider'?'A dividing line between sections.':'The next section begins on a new printed page.'}</p>}
   </div>)}
   <button type="button" disabled={blocks.length>=80} onClick={()=>{const id=crypto.randomUUID();setBlocks([...blocks,{id,type:'text',text:''}]);setSelected(id);caret.current=null;}} className="w-full rounded-2xl border border-dashed border-blue-200 py-3 text-sm text-blue-700">+ Add section</button></section>
   <section className="min-w-0 space-y-3 xl:sticky xl:top-6"><div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4">
    <div className="flex flex-wrap items-end gap-3"><label className="flex-1 text-xs font-medium">Preview content<select aria-label="Preview content" value={mode} onChange={event=>{const next=event.target.value as typeof mode;setMode(next);resetPreview();if(next==='record')loadRecords();}} className={field}><option value="example">Example values</option>{listPreviewRecords&&previewRecord&&<option value="record">Business record</option>}</select></label>{mode==='record'&&<button type="button" disabled={pending} onClick={loadRecords} className="py-2.5 text-xs text-blue-700">Reload available records</button>}</div>
    {mode==='record'&&<div className="space-y-2"><label className="block text-xs font-medium">Preview record<select aria-label="Preview record" value={source} disabled={pending} onChange={event=>{setSource(event.target.value);refresh(event.target.value);}} className={field}><option value="">Choose an available record</option>{choices.map(choice=><option key={`${choice.module}/${choice.type}/${choice.id}`} value={`${choice.module}/${choice.type}/${choice.id}`}>{choice.label}</option>)}</select></label><button type="button" disabled={pending||!source} onClick={()=>refresh()} className="text-xs text-blue-700 disabled:opacity-30">Refresh business preview</button><p className="text-xs text-slate-500">{actual?`Using ${actual.sourceLabel}. Refresh to read the latest authorised details.`:'Choose a record to preview its current details.'}</p></div>}
    {customKeys.map(key=><label key={key} className="block text-xs font-medium">Example {templateDetailLabel(key)}<input aria-label={`Example ${templateDetailLabel(key)}`} value={values[key]??''} maxLength={4000} onChange={event=>setValues({...values,[key]:event.target.value})} className={field} placeholder="Add preview wording…"/></label>)}
    {pending&&<p role="status" className="text-xs text-slate-500">Loading authorised preview…</p>}{previewError&&<p role="alert" className="text-xs text-red-700">{previewError}</p>}
   </div>
   <p className="text-xs text-slate-500">Document preview · {mode==='example'?'example values':'business record'} · changes here do not create a document</p>
   {(mode==='example'||actual)&&<TemplateDocumentPreview title={title} blocks={blocks} fields={fields} company={mode==='example'?'Your company':actual?.companyName}/>}
   <p className="text-xs leading-5 text-slate-500">Published templates appear in their selected apps. Existing documents keep the version and wording used when they were created.</p>
   </section>
  </div>
 </ActionForm></div>
 {removal&&<TemplateReviewDialog title={removal.title} onClose={()=>setRemoval(null)}><p className="text-sm leading-6 text-slate-600">{removal.message} Existing generated documents stay unchanged. Your saved template changes only after Save template.</p><div className="mt-6 flex justify-end gap-3"><Button type="button" onClick={()=>setRemoval(null)}>Keep it</Button><Button type="button" onClick={()=>{if(removal.key===current.current.key)removal.apply();setRemoval(null);}}>{removal.confirmLabel}</Button></div></TemplateReviewDialog>}
 {comparison&&<TemplateReviewDialog title="Compare with saved template" returnFocusRef={compareButton} wide onClose={()=>setComparison(null)}>
  <p className="text-sm leading-6 text-slate-600">Review your unsaved design beside version {comparison.value.currentVersion}. Both previews use the same example values. Comparing does not save, publish or read business records.</p>
  {comparison.value.changedSinceOpened&&<p className="mt-3 rounded-xl bg-amber-50 p-3 text-sm text-amber-900">A newer version was saved after you opened this template.</p>}
  <section aria-label="Template changes" className="mt-4 rounded-2xl bg-slate-50 p-4"><h3 className="font-medium">What changed</h3>{comparison.value.changes.length?<ul className="mt-2 list-disc space-y-1 pl-5 text-sm">{comparison.value.changes.map((change,index)=><li key={index}>{change.label}</li>)}</ul>:<p className="mt-2 text-sm">{comparison.value.valid?'Your design matches the saved template.':'Review the previews and the details marked below.'}</p>}{!comparison.value.valid&&<ul className="mt-2 list-disc pl-5 text-sm text-amber-900">{comparison.value.errors.map((error,index)=><li key={index}>{error}</li>)}</ul>}</section>
  <div className="mt-5 grid gap-5 md:grid-cols-2"><section aria-label="Your unsaved template"><h3 className="mb-2 font-semibold">Your unsaved design</h3><TemplateSettings name={comparison.local.name} category={comparison.local.category} description={comparison.local.description} status={comparison.local.status} targets={comparison.local.targetModules}/><TemplateDocumentPreview compact label="Your unsaved document preview" title={comparison.local.titleTemplate} blocks={comparison.local.blocks}/></section>
  {comparison.value.saved&&<section aria-label="Current saved template"><h3 className="mb-2 font-semibold">Saved design · version {comparison.value.currentVersion}</h3><TemplateSettings name={comparison.value.saved.data.name} category={comparison.value.saved.data.category} description={comparison.value.saved.data.description} status={comparison.value.saved.data.status} targets={comparison.value.saved.data.targetModules}/><TemplateDocumentPreview compact label="Saved document preview" title={comparison.value.saved.data.titleTemplate} blocks={comparison.value.saved.data.blocks}/></section>}</div>
  <div className="mt-6 flex flex-wrap justify-end gap-3"><Button type="button" onClick={()=>setComparison(null)}>Back</Button><Button type="button" onClick={()=>adopt(true)}>Use saved template</Button><Button type="button" variant="primary" onClick={()=>adopt(false)}>Keep my changes</Button></div>
  <p className="mt-3 text-xs leading-5 text-slate-500">Keep my changes keeps every local edit and uses the saved version you reviewed for your next save. Use saved template replaces your local edits. Neither choice saves or publishes.</p>
 </TemplateReviewDialog>}
 {detail&&<TemplateReviewDialog title={detail.item.label} onClose={()=>setDetail(null)}>
  <div className="mb-4 flex flex-wrap gap-2"><button type="button" aria-pressed={detail.tab==='source'} onClick={()=>setDetail({...detail,tab:'source'})} className="rounded-full border border-slate-200 px-3 py-1.5 text-sm">Source</button><button type="button" aria-pressed={detail.tab==='uses'} onClick={()=>setDetail({...detail,tab:'uses'})} className="rounded-full border border-slate-200 px-3 py-1.5 text-sm">Where used in this template</button></div>
  {detail.tab==='source'?<><h3 className="font-semibold">{detail.item.source.label}</h3><p className="mt-2 text-sm leading-6 text-slate-600">{detail.item.source.description}</p>{detail.item.source.kind==='record'&&checked?.contexts.length? <div className="mt-4"><h4 className="text-sm font-medium">Available business sources</h4><ul className="mt-2 list-disc space-y-1 pl-5 text-sm">{checked.contexts.map(context=><li key={`${context.id}:${context.version}`}>{context.label}</li>)}</ul><p className="mt-2 text-xs text-slate-500">The record selected when creating a document supplies these details.</p></div>:null}</>:<><p className="text-sm text-slate-600">These are the places using this detail in your current design.</p>{detail.item.uses.length?<ul className="mt-3 space-y-2">{detail.item.uses.map((use,index)=><li key={index}><button type="button" onClick={()=>openUsage(use)} className="rounded-lg border border-slate-200 px-3 py-2 text-left text-sm text-blue-700">{use.label}</button></li>)}</ul>:<p className="mt-3 text-sm">This detail has not been inserted in this template.</p>}</>}
 </TemplateReviewDialog>}
 </>;
}
function TemplateSettings({name,category,description,status,targets}:{name:string;category:string;description:string;status:string;targets:string[]}){
 return <dl className="mb-3 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 rounded-xl bg-slate-50 p-3 text-xs"><dt className="text-slate-500">Name</dt><dd className="break-words">{name||'Not named yet'}</dd><dt className="text-slate-500">Category</dt><dd>{category||'None'}</dd><dt className="text-slate-500">Description</dt><dd className="break-words">{description||'None'}</dd><dt className="text-slate-500">Availability</dt><dd>{status==='PUBLISHED'?'Published':'Draft'}</dd><dt className="text-slate-500">Use in apps</dt><dd>{targets.map(target=>target==='crm'?'CRM':target[0]?.toUpperCase()+target.slice(1)).join(', ')||'Choose an app'}</dd></dl>;

}
