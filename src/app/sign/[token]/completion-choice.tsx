'use client';
import { useState } from 'react';
import { SignForm } from './form';
import { ReturnForm } from './return-form';
export function CompletionChoice({token,accent,quote,company,mode}:{token:string;accent:string;quote:boolean;company:string;mode:string}){
 const [choice,setChoice]=useState(mode==='UPLOAD'&&!quote?'upload':'online');
 return <div>{!quote&&mode==='BOTH'&&<div className="mb-6 grid grid-cols-2 gap-2 rounded-2xl bg-slate-100 p-1.5">{[['online','Sign online'],['upload','Return a signed PDF']].map(([id,label])=><button type="button" key={id} onClick={()=>setChoice(id)} className={`rounded-xl px-3 py-3 text-sm font-semibold ${choice===id?'bg-white text-slate-900 shadow-sm':'text-slate-500'}`}>{label}</button>)}</div>}{choice==='upload'?<ReturnForm token={token} accent={accent}/>:<SignForm token={token} accent={accent} quote={quote} company={company}/>}</div>;
}
