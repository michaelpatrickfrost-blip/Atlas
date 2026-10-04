"use client";

import {useState, useTransition} from "react";
import {useRouter} from "next/navigation";
import {CreateDialog} from "@/components/ui/create-dialog";
import {Button} from "@/components/ui/button";
import {setCustomerParent} from "@/core/customers/hierarchy-actions";
import {descendantAccountIds} from "@/core/customers/hierarchy";

type Account = {id:string;name:string;customerCode:string;parentPartyId:string|null;hierarchyRole:string;customerGroup:string|null};
type Mode = "child" | "parent" | "independent";
const field = "block w-full rounded-xl border border-slate-200 bg-white p-3 text-sm";

export function HierarchyBuilder({accounts,accountId}:{accounts:Account[];accountId:string}) {
  const account=accounts.find(a=>a.id===accountId)!;
  const router=useRouter();
  const [mode,setMode]=useState<Mode>("child"),[query,setQuery]=useState(""),[selectedId,setSelectedId]=useState(""),[message,setMessage]=useState(""),[error,setError]=useState(false);
  const [pending,startTransition]=useTransition();
  const selected=accounts.find(a=>a.id===selectedId);
  const excluded=new Set(mode==="parent"?descendantAccountIds(accounts,[accountId]):[]);
  if(mode==="child"){
    const byId=new Map(accounts.map(a=>[a.id,a]));
    let next:string|null=accountId;
    while(next&&!excluded.has(next)){excluded.add(next);next=byId.get(next)?.parentPartyId??null;}
  }
  const candidates=accounts.filter(a=>a.id!==accountId&&!excluded.has(a.id)&&(mode!=="child"||a.parentPartyId!==accountId));
  const matches=candidates.filter(a=>`${a.name} ${a.customerCode} ${a.customerGroup??""}`.toLowerCase().includes(query.trim().toLowerCase()));
  const target=mode==="child"?selected:account;
  const parent=mode==="child"?account:mode==="parent"?selected:undefined;
  const oldParent=accounts.find(a=>a.id===target?.parentPartyId);
  function reset(){setMode("child");setQuery("");setSelectedId("");setMessage("");setError(false);}
  function save(){
    if(!target||(mode!=="independent"&&!selected))return;
    startTransition(async()=>{
      setMessage("");setError(false);
      try{
        const data=new FormData();
        data.set("parentPartyId",parent?.id??"");
        data.set("hierarchyRole",target.hierarchyRole);
        data.set("customerGroup",target.customerGroup??"");
        await setCustomerParent(target.id,data);
        setMessage(mode==="independent"?`${target.name} is now independent.`:`${target.name} is now linked under ${parent!.name}.`);
        setSelectedId("");router.refresh();
      }catch(e){setError(true);setMessage(e instanceof Error?e.message:"Could not save the hierarchy. Try again.");}
    });
  }
  return <CreateDialog title={`Build hierarchy · ${account.name}`} label="Build hierarchy" variant="secondary" onOpen={reset}>
    <div className="space-y-5">
      <p className="text-sm text-slate-500">Link accounts already in Atlas. Each account keeps its contacts, pricing and history; its child accounts move with it.</p>
      <fieldset disabled={pending} className="space-y-5">
        <legend className="sr-only">Choose how to connect this account</legend>
        <div className="grid gap-2 sm:grid-cols-3">{([
          ["child","Link existing child","Add a business or branch below this account"],
          ["parent","Choose parent","Place this account beneath another account"],
          ["independent","Make independent","Remove this account’s parent link"],
        ] as const).map(([value,label,description])=><button key={value} type="button" aria-pressed={mode===value} onClick={()=>{setMode(value);setSelectedId("");setQuery("");setMessage("");}} className={`rounded-xl border p-3 text-left ${mode===value?"border-blue-500 bg-blue-50":"border-slate-200"}`}><span className="block text-sm font-semibold">{label}</span><span className="mt-1 block text-xs text-slate-500">{description}</span></button>)}</div>
        {mode!=="independent"&&<div className="space-y-3">
          <label className="block space-y-2 text-xs font-medium"><span>{mode==="child"?"Find an account to add below":"Find a parent for"} {account.name}</span><input type="search" value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search by name, account code or customer type…" className={field}/></label>
          <div className="max-h-56 space-y-1 overflow-y-auto rounded-xl border border-slate-200 p-2" role="group" aria-label="Matching accounts">
            {matches.map(a=><label key={a.id} className={`flex cursor-pointer items-center gap-3 rounded-lg p-3 ${selectedId===a.id?"bg-blue-50":"hover:bg-slate-50"}`}><input type="radio" name="hierarchy-account" value={a.id} checked={selectedId===a.id} onChange={()=>{setSelectedId(a.id);setMessage("");}}/><span className="min-w-0"><span className="block text-sm font-semibold">{a.name}</span><span className="block text-xs text-slate-500">{a.customerCode} · {a.hierarchyRole==="GROUP"?"Group":a.hierarchyRole==="BRANCH"?"Branch":"Business"}{a.parentPartyId?` · Under ${accounts.find(p=>p.id===a.parentPartyId)?.name??"another account"}`:" · Independent"}</span></span></label>)}
            {!matches.length&&<p className="p-3 text-sm text-slate-500">No eligible accounts found. Try another search or create a new child account.</p>}
          </div>
        </div>}
        {target&&(mode==="independent"||selected)&&<div className="rounded-xl border border-blue-100 bg-blue-50 p-4" aria-live="polite"><p className="text-xs font-semibold text-blue-700">Hierarchy after saving</p>{parent&&<p className="mt-2 text-sm font-semibold">{parent.name}</p>}<p className={`mt-2 text-sm ${parent?"ml-3 border-l-2 border-blue-200 pl-3":"font-semibold"}`}>{target.name}{!parent&&" · Independent account"}</p>{oldParent&&oldParent.id!==parent?.id&&<p className="mt-3 text-xs text-amber-800">This replaces the current parent link to {oldParent.name}.</p>}</div>}
        <Button type="button" variant="primary" disabled={pending||(!selected&&mode!=="independent")||(mode==="independent"&&!account.parentPartyId)} onClick={save}>{pending?"Saving…":mode==="independent"?"Make independent":"Save link"}</Button>
      </fieldset>
      <p role={error?"alert":"status"} className={`text-sm ${error?"text-rose-600":"text-emerald-700"}`}>{message}</p>
    </div>
  </CreateDialog>;
}
