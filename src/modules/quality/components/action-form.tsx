"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
export function QualityForm({action,children,className=""}:{action:(data:FormData)=>Promise<unknown>;children:React.ReactNode;className?:string}){
 const [pending,startTransition]=useTransition(),[error,setError]=useState(""),[saved,setSaved]=useState(false);const router=useRouter();
 return <form method="post" className={className} onSubmit={event=>{event.preventDefault();if(pending)return;const data=new FormData(event.currentTarget);setError("");setSaved(false);startTransition(async()=>{try{const result=await action(data);if(result&&typeof result==="object"&&"error" in result){setError(String(result.error));return;}setSaved(true);router.refresh();}catch(e){if(e&&typeof e==="object"&&"digest" in e&&String(e.digest).startsWith("NEXT_REDIRECT"))throw e;setError("Could not save. Your entered work is still here; try again or check your access.");}});}}><fieldset disabled={pending} className="contents">{children}</fieldset>{error&&<p role="alert" className="mt-3 text-sm text-rose-700">{error}</p>}<p role="status" aria-live="polite" className="mt-2 text-xs text-slate-500">{pending?"Saving…":saved?"Saved.":""}</p></form>;
}
