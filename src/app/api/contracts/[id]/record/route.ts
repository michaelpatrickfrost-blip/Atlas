import { requireSession } from '@/core/auth/session';
import { can } from '@/core/permissions/check';
import { staffContract } from '@/core/contracts/access';
import { completionPdf } from '@/core/contracts/completion-pdf';
export async function GET(_r:Request,{params}:{params:Promise<{id:string}>}){
 let s;try{s=await requireSession();}catch{return new Response('Sign in required.',{status:401});}if(!can(s,'core.contract.manage'))return new Response('Forbidden.',{status:403});
 let c;try{c=await staffContract(s,(await params).id);}catch{return new Response('Document unavailable.',{status:404});}if(c.status!=='SIGNED')return new Response('This document is not complete.',{status:409});
 return new Response(new Uint8Array(await completionPdf(c)),{headers:{'Content-Type':'application/pdf','Content-Disposition':`attachment; filename="${c.reference.replace(/[^\w-]/g,'_')}-completed.pdf"`,'Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer'}});
}
