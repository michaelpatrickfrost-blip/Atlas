"use client";
import { useState, useTransition } from "react";
export function ActionForm({action,children,className=""}:{action:(data:FormData)=>Promise<void>;children:React.ReactNode;className?:string}) {
 const [pending,startTransition]=useTransition(),[message,setMessage]=useState(""),[error,setError]=useState(false);
 return <form className={className} action={data=>startTransition(async()=>{setMessage("");try{await action(data);setError(false);setMessage("Saved.");}catch(e){if(typeof e==="object"&&e&&"digest" in e&&String((e as {digest?:unknown}).digest).startsWith("NEXT_REDIRECT"))throw e;setError(true);setMessage(e instanceof Error ? e.message : "Could not save. Try again.");}})}><fieldset disabled={pending} className="contents">{children}</fieldset><p role={error?"alert":"status"} aria-live="polite" className={`basis-full text-xs ${error?"text-[var(--color-status-danger)]":"text-[var(--color-ink-muted)]"}`}>{pending?"Saving…":message}</p></form>;
}
