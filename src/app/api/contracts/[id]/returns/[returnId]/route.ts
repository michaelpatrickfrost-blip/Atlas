import { requireSession } from '@/core/auth/session';
import { can } from '@/core/permissions/check';
import { staffContract } from '@/core/contracts/access';
import { db } from '@/core/db/client';
export async function GET(_r:Request,{params}:{params:Promise<{id:string;returnId:string}>}){
 let s;try{s=await requireSession();}catch{return new Response('Sign in required.',{status:401});}if(!can(s,'core.contract.manage'))return new Response('Forbidden.',{status:403});const p=await params;
 try{await staffContract(s,p.id);}catch{return new Response('Document unavailable.',{status:404});}
 const file=await db.contractReturn.findFirst({where:{id:p.returnId,contractId:p.id,organisationId:s.organisationId},select:{fileContent:true,fileName:true}});if(!file)return new Response('File unavailable.',{status:404});
 return new Response(new Uint8Array(file.fileContent),{headers:{'Content-Type':'application/pdf','Content-Disposition':`inline; filename="${file.fileName.replace(/[^\w .()-]/g,'_')}"`,'Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer'}});
}
