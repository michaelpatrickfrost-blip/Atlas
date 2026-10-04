'use client';
import {useState,useTransition} from 'react';
import {readProjectFile} from '@/app/(app)/projects/actions';
export function FilePreview({id,name}:{id:string;name:string}){
 const [file,setFile]=useState<{mediaType:string;content:string}|null>(null),[error,setError]=useState(''),[pending,start]=useTransition();
 return <div><button type="button" className="text-sm text-[var(--color-atlas-blue)]" onClick={()=>start(async()=>{try{const f=await readProjectFile(id);setFile(f);setError('');}catch(e){setError(e instanceof Error?e.message:'Could not open the file.');}})}>{pending?'Opening…':name}</button>{error&&<p role="alert" className="mt-2 text-xs text-red-700">{error}</p>}{file&&<div role="dialog" aria-modal="true" aria-label={name} className="fixed inset-0 z-50 flex flex-col bg-slate-950/80 p-6"><button type="button" onClick={()=>setFile(null)} className="mb-4 self-end rounded-lg bg-white px-4 py-2 text-sm">Close preview</button><iframe sandbox="" title={name} src={`data:${file.mediaType};base64,${file.content}`} className="min-h-0 w-full flex-1 rounded-xl bg-white"/></div>}</div>;
}
