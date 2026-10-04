'use client';
import { useState, useTransition } from 'react';
import { Button } from '@/components/ui/button';
export function ActionForm({action,children,label='Save',className=''}:{action:(data:FormData)=>Promise<void>;children:React.ReactNode;label?:string;className?:string}) {
 const [pending,start]=useTransition(),[error,setError]=useState(''),[saved,setSaved]=useState(false);
 return <form className={`space-y-3 ${className}`} action={data=>{setError('');setSaved(false);start(async()=>{try{await action(data);setSaved(true);}catch(e){if(e && typeof e==='object' && 'digest' in e && String(e.digest).startsWith('NEXT_REDIRECT'))throw e;setError(e instanceof Error?e.message:'Could not save. Try again.');}});}}>
 {children}<div className="flex items-center gap-3"><Button variant="primary" disabled={pending}>{pending?'Saving…':label}</Button>{saved&&<span role="status" className="text-xs text-green-700">Saved</span>}</div>{error&&<p role="alert" className="text-sm text-red-700">{error}</p>}
 </form>;
}
