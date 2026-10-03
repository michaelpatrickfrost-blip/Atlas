"use client";
import {useRouter,usePathname} from 'next/navigation';
import {ArrowLeft} from 'lucide-react';
export function WorkspaceBack(){const router=useRouter(),path=usePathname();if(path==='/home')return null;return <button type="button" aria-label="Back to previous screen" title="Back to previous screen" onClick={()=>window.history.length>1?router.back():router.push('/home')} className="flex shrink-0 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs font-medium text-slate-600 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"><ArrowLeft size={16}/><span className="hidden sm:inline">Back</span></button>;}
