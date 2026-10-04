'use client';
import {useState} from 'react';
import {ActionForm} from '@/components/ui/action-form';
import {Button} from '@/components/ui/button';
import {createTaskFromDocument} from '@/app/(app)/projects/actions';
import {input} from './forms';
export function DocumentContent({id,body,version,editable}:{id:string;body:string;version:number;editable:boolean}){
 const [selected,setSelected]=useState('');
 return <div><article onMouseUp={()=>{if(editable){const selection=window.getSelection();const value=selection?.toString().trim()??'';if(value&&body.includes(value))setSelected(value);}}} className="min-h-64 whitespace-pre-wrap rounded-2xl border border-[var(--color-border)] bg-white p-8 text-sm leading-7">{body}</article>{selected&&editable&&<ActionForm action={createTaskFromDocument.bind(null,id)} className="mt-4 space-y-3 rounded-xl border border-[var(--color-border)] bg-white p-5"><input type="hidden" name="version" value={version}/><input type="hidden" name="selectedText" value={selected}/><p className="text-xs text-[var(--color-ink-muted)]">Create an action from the highlighted text. It will appear in this document’s project.</p><blockquote className="border-l-2 border-slate-200 pl-3 text-sm">{selected}</blockquote><input aria-label="Task title" name="title" required defaultValue={selected.slice(0,300)} className={input}/><Button type="submit">Create linked task</Button><button type="button" onClick={()=>setSelected('')} className="ml-4 text-xs">Cancel</button></ActionForm>}</div>;
}
