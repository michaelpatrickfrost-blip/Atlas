import {forwardDesktopRequest} from "@/core/desktop/data-client";
import {requireSession} from '@/core/auth/session';
import {assertCapability} from '@/core/permissions/check';
import {persistWorkingDraft} from '@/modules/sales/services/working-drafts';
export async function POST(request:Request){
 const session=await requireSession();
 const data=await request.json();
 assertCapability(session,data.payload?.mode==='order'?'sales.order.create':'sales.quote.create');
 if(process.env.ATLAS_RUNTIME==='desktop')return forwardDesktopRequest('/api/sales/draft',data);
 if(request.headers.get('origin')!==new URL(request.url).origin)return new Response('Invalid origin',{status:403});
 if(JSON.stringify(data).length>65000)return new Response('Working draft is too large',{status:413});
 try{return Response.json(await persistWorkingDraft(session,String(data.id??''),data.payload,Number(data.version)));}catch(e){return Response.json({error:e instanceof Error?e.message:'Could not save draft.'},{status:400});}
}
