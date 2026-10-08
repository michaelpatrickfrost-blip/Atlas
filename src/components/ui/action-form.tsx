"use client";
import { useState, useTransition } from "react";
import { Button } from "./button";
export function ActionForm({action,children,className="",label}:{action:(data:FormData)=>Promise<void>;children:React.ReactNode;className?:string;label?:string}) {
 const [pending,startTransition]=useTransition(),[message,setMessage]=useState(""),[error,setError]=useState(false);
 return <form method="post" className={label?`space-y-3 ${className}`:className} onSubmit={event=>{
  event.preventDefault();
  if(pending)return;
  const form=event.currentTarget;
  const data=new FormData(form,(event.nativeEvent as SubmitEvent).submitter);
  setMessage("");setError(false);
  startTransition(async()=>{
   try{
    await action(data);
    if(form.isConnected)form.reset();
    setMessage("Saved.");
   }catch(e){
    if(typeof e==="object"&&e&&"digest" in e&&String((e as {digest?:unknown}).digest).startsWith("NEXT_REDIRECT"))throw e;
    setError(true);setMessage(e instanceof Error ? e.message : "Could not save. Try again.");
   }
  });
 }}><fieldset disabled={pending} className="contents">{children}{label&&<Button type="submit" variant="primary">{pending?"Saving…":label}</Button>}</fieldset><p role={error?"alert":"status"} aria-live="polite" className={`basis-full text-xs ${error?"text-[var(--color-status-danger)]":"text-[var(--color-ink-muted)]"}`}>{pending?"Saving…":message}</p></form>;
}
