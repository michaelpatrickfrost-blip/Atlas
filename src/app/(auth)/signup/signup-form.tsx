"use client";
import { useActionState } from "react";
import { signup } from "./actions";
import { Button } from "@/components/ui/button";
export function SignupForm() {
 const [state,action,pending]=useActionState(signup,{error:""});
 return <form action={action} className="space-y-4"><fieldset disabled={pending} className="space-y-4">{[['name','Your name','text'],['company','Company name','text'],['email','Work email','email'],['password','Password','password']].map(([name,label,type])=><label key={name} className="block text-sm font-medium">{label}<input required name={name} type={type} autoComplete={name==='password'?'new-password':name==='email'?'email':name==='name'?'name':'organization'} minLength={name==='password'?12:undefined} maxLength={name==='password'?128:150} className="mt-2 block w-full rounded-xl border border-[var(--color-border)] bg-white p-3"/></label>)}<p className="text-xs text-[var(--color-ink-muted)]">At least 12 characters. Your company gets its own private workspace.</p><Button type="submit" variant="primary" className="w-full">{pending?'Creating workspace…':'Create your workspace'}</Button></fieldset>{state.error && <p role="alert" className="text-sm text-[var(--color-status-danger)]">{state.error}</p>}</form>;
}
