'use client';
import { useState } from 'react';
import { ActionForm } from '@/components/ui/action-form';
import { Button } from '@/components/ui/button';
import { generateTemplateDocument } from '@/app/(app)/templates/actions';
import { mergeKeys } from '@/core/templates/domain';
import type { TemplateBlock } from '@/core/templates/types';
import { field } from './editor';
export function GenerateDocument({template,records,parties,initialSource=""}:{template:{id:string;titleTemplate:string;blocks:TemplateBlock[]};records:{module:string;type:string;id:string;label:string}[];parties:{id:string;name:string}[];initialSource?:string}){
 const [source,setSource]=useState(initialSource),[values,setValues]=useState<Record<string,string>>({}),r=records.find(r=>`${r.module}/${r.type}/${r.id}`===source);
 const keys=mergeKeys(template.titleTemplate+'\n'+template.blocks.map(b=>b.text).join('\n')).filter(k=>k.startsWith('custom.'));
 return <ActionForm action={generateTemplateDocument} className="space-y-4 rounded-2xl border border-blue-200 bg-blue-50/40 p-5"><h3 className="font-semibold">Create a document from this template</h3><input type="hidden" name="templateId" value={template.id}/><input type="hidden" name="sourceModule" value={r?.module??''}/><input type="hidden" name="sourceType" value={r?.type??''}/><input type="hidden" name="sourceId" value={r?.id??''}/><input type="hidden" name="values" value={JSON.stringify(values)}/>
 <div className="grid gap-4 sm:grid-cols-2"><label className="text-xs font-medium">Attach to a record<select value={source} onChange={e=>setSource(e.target.value)} className={field}><option value="">Customer document</option>{records.map(r=><option key={`${r.module}/${r.type}/${r.id}`} value={`${r.module}/${r.type}/${r.id}`}>{r.module.toUpperCase()} · {r.label}</option>)}</select></label>{!r&&<label className="text-xs font-medium">Customer<select name="partyId" required className={field}><option value="">Choose a customer</option>{parties.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}</select></label>}</div>
 {keys.map(k=><label key={k} className="block text-xs font-medium capitalize">{k.slice(7).replaceAll('_',' ')}<textarea required maxLength={4000} rows={3} value={values[k]??''} onChange={e=>setValues({...values,[k]:e.target.value})} className={field}/></label>)}
 <label className="block text-xs font-medium">Customer can<select name="signingMode" className={field}><option value="BOTH">Sign online or return a signed PDF</option><option value="ONLINE">Sign online</option><option value="UPLOAD">Return a signed PDF</option></select></label>
 <p className="text-xs text-slate-500">Atlas fills the source fields and saves a PDF. Review it in Contracts & approvals before sharing with the customer.</p><Button type="submit" variant="primary">Create draft document</Button></ActionForm>;
}
