"use client";
import { useRef,useState,useTransition } from "react";
import { postMessage } from "./actions";
import { Button } from "@/components/ui/button";
export function ChatCompose() {
 const ref=useRef<HTMLFormElement>(null),[error,setError]=useState(""); const [pending,start]=useTransition();
 return <form ref={ref} action={data=>start(async()=>{try{await postMessage(data);ref.current?.reset();setError("");}catch(e){setError(e instanceof Error?e.message:"Message could not be sent.");}})} className="space-y-3 rounded-2xl border border-[var(--color-border)] bg-white p-4"><label className="block text-sm font-medium">Message your team<textarea required name="body" maxLength={4000} placeholder="Share an update…" className="mt-3 min-h-24 w-full rounded-xl border border-[var(--color-border)] p-3 text-sm"/></label><div className="flex items-center justify-between"><p className="text-xs text-[var(--color-ink-faint)]">Visible to this company’s chat members.</p><Button type="submit" disabled={pending} variant="primary">{pending?'Sending…':'Send message'}</Button></div>{error && <p role="alert" className="text-xs text-[var(--color-status-danger)]">{error}</p>}</form>;
}
