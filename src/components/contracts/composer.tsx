'use client';
import Link from 'next/link';
import { useState } from 'react';
import { ActionForm } from '@/components/ui/action-form';
import { Button } from '@/components/ui/button';
import { createDealContract } from '@/app/(app)/crm/contracts/actions';
import { mergeKeys } from '@/core/templates/domain';
import type { TemplateBlock } from '@/core/templates/types';
const field='mt-1.5 block w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm';
export type ComposerTemplate={id:string;name:string;titleTemplate:string;blocks:TemplateBlock[]};
export function ContractComposer({parties,templates,deals=[],dealId='',partyId='',accounts=[]}:{parties:{id:string;name:string}[];templates:ComposerTemplate[];deals?:{id:string;name:string;partyId:string}[];dealId?:string;partyId?:string;accounts?:{id:string;label:string}[]}){
 const [mode,setMode]=useState<'pdf'|'terms'|'template'>('pdf'),[chosen,setChosen]=useState(templates[0]?.id??''),[deal,setDeal]=useState(dealId),[values,setValues]=useState<Record<string,string>>({});const d=deals.find(d=>d.id===deal),t=templates.find(t=>t.id===chosen),keys=t?mergeKeys(t.titleTemplate+'\n'+t.blocks.map(b=>b.text).join('\n')).filter(k=>k.startsWith('custom.')):[];
 return <ActionForm action={createDealContract}><div className="space-y-4"><input type="hidden" name="opportunityId" value={deal}/><input type="hidden" name="values" value={JSON.stringify(values)}/>
 {!dealId&&deals.length>0&&<label className="block text-xs font-medium">Attach to deal (optional)<select value={deal} onChange={e=>setDeal(e.target.value)} className={field}><option value="">Customer contract</option>{deals.map(d=><option key={d.id} value={d.id}>{d.name}</option>)}</select></label>}
 {dealId||d?<><input name="partyId" type="hidden" value={partyId||d?.partyId||''}/><p className="text-sm text-slate-500">Attached to this deal and its customer.</p></>:<label className="block text-xs font-medium">Customer<select name="partyId" required defaultValue={partyId} className={field}><option value="">Choose a customer</option>{parties.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}</select></label>}
 <div className="grid grid-cols-3 gap-2">{([['pdf','Upload PDF'],['terms','Write contract'],['template','Use template']] as const).map(([id,label])=><button type="button" key={id} onClick={()=>setMode(id)} className={`rounded-xl border px-2 py-3 text-xs font-medium ${mode===id?'border-blue-500 bg-blue-50 text-blue-700':'border-slate-200'}`}>{label}</button>)}</div>
 {mode!=='template'&&<label className="block text-xs font-medium">Document title<input name="title" required maxLength={300} placeholder="Supply agreement" className={field}/></label>}
 {mode==='pdf'&&<label className="block text-xs font-medium">Contract PDF · up to 10 MB<input name="file" type="file" required accept="application/pdf,.pdf" className={field}/></label>}
 {mode==='terms'&&<label className="block text-xs font-medium">Contract terms<textarea name="body" required rows={9} maxLength={50000} className={field}/><span className="mt-1 block text-xs font-normal text-slate-500">Atlas creates a PDF of these exact terms.</span></label>}
 {mode==='template'&&(templates.length?<><label className="block text-xs font-medium">Published template<select name="templateId" value={chosen} onChange={e=>{setChosen(e.target.value);setValues({});}} required className={field}>{templates.map(t=><option key={t.id} value={t.id}>{t.name}</option>)}</select></label>{keys.map(k=><label className="block text-xs font-medium capitalize" key={k}>{k.slice(7).replaceAll('_',' ')}<textarea required maxLength={4000} rows={3} value={values[k]??''} onChange={e=>setValues({...values,[k]:e.target.value})} className={field}/></label>)}</>:<p className="rounded-xl bg-slate-50 p-4 text-sm text-slate-500">No published templates for CRM yet. <Link href="/templates/new" className="text-blue-700">Build a template</Link>, publish it for CRM, then return here.</p>)}
 <label className="block text-xs font-medium">Customer can<select name="signingMode" className={field}><option value="BOTH">Sign online or return a signed PDF</option><option value="ONLINE">Sign online</option><option value="UPLOAD">Return a signed PDF</option></select></label>
 <label className="block text-xs font-medium">Message to customer (optional)<textarea name="message" rows={2} maxLength={2000} className={field}/></label>
 {!!accounts.length&&<div className="grid gap-4 sm:grid-cols-2"><label className="text-xs font-medium">Email to (optional)<input name="to" type="email" maxLength={200} placeholder="Leave blank to review first" className={field}/></label><label className="text-xs font-medium">Send from<select name="accountId" className={field}>{accounts.map(a=><option key={a.id} value={a.id}>{a.label}</option>)}</select></label></div>}
 <p className="text-xs text-slate-500">Save, review the PDF and create a private customer link. Shared documents are frozen; create a new contract if the terms change.</p><Button type="submit" variant="primary" disabled={mode==='template'&&!templates.length}>Save contract</Button>
 </div></ActionForm>;
}
