import { db } from '@/core/db/client';
import { requireSession } from '@/core/auth/session';
import { can } from '@/core/permissions/check';
import { canAccessContractSource } from '@/core/contracts/access';
export async function GET(_request:Request,{params}:{params:Promise<{id:string}>}){
 let s;try{s=await requireSession();}catch{return new Response('Sign in to open this document.',{status:401});}
 const c=await db.contractDocument.findFirst({where:{id:(await params).id,organisationId:s.organisationId}});
 if(!c)return new Response('Document unavailable.',{status:404});
 if((!can(s,'core.contract.manage')&&!(c.kind==='QUOTE'&&can(s,'sales.quote.read')))||!await canAccessContractSource(s,c))return new Response('Document unavailable.',{status:403});
 if(!c.fileContent)return new Response('No PDF is available.',{status:404});
 return new Response(new Uint8Array(c.fileContent),{headers:{'Content-Type':'application/pdf','Content-Disposition':`inline; filename="${(c.fileName??'document.pdf').replace(/[^\w .()-]/g,'_')}"`,'Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer'}});
}
