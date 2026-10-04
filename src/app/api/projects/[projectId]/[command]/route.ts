import {requireSession} from '@/core/auth/session';
import {assertCapability} from '@/core/permissions/check';
import {changeProjectStatus} from '@/app/(app)/projects/actions';
export async function POST(request:Request,{params}:{params:Promise<{projectId:string;command:string}>}){
 const session=await requireSession();
 assertCapability(session,'projects.manage');
 const origin=request.headers.get('origin');if(origin&&origin!==new URL(request.url).origin)return Response.json({error:'Unexpected origin.'},{status:403});
 const {projectId,command}=await params;if(!['start','complete'].includes(command))return Response.json({error:'Unknown project command.'},{status:404});
 try{const data=await request.json(),form=new FormData();form.set('version',String(data.version));form.set('status',command==='start'?'ACTIVE':'COMPLETED');await changeProjectStatus(projectId,form);return Response.json({ok:true},{headers:{'Cache-Control':'private, no-store'}});}catch(error){return Response.json({error:error instanceof Error?error.message:'Project command failed.'},{status:409,headers:{'Cache-Control':'private, no-store'}});}
}
