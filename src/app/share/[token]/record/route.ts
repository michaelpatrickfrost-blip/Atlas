import { db } from '@/core/db/client';
import { hashToken } from '@/core/security/secrets';
import { completionPdf } from '@/core/contracts/completion-pdf';
export async function GET(_r:Request,{params}:{params:Promise<{token:string}>}){
 const c=await db.contractDocument.findFirst({where:{tokenHash:hashToken((await params).token),status:'SIGNED'}});if(!c)return new Response('Completed document unavailable.',{status:404});
 return new Response(new Uint8Array(await completionPdf(c)),{headers:{'Content-Type':'application/pdf','Content-Disposition':`attachment; filename="${c.reference.replace(/[^\w-]/g,'_')}-completed.pdf"`,'Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff','X-Robots-Tag':'noindex','Referrer-Policy':'no-referrer'}});
}
