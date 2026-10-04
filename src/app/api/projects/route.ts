import {requireSession} from '@/core/auth/session';
import {assertCapability} from '@/core/permissions/check';
import {assertModuleEnabled} from '@/core/modules/access';
import {projectScope} from '@/core/permissions/work-access';
import {db} from '@/core/db/client';
export async function GET(){
 const session=await requireSession();
 assertCapability(session,'projects.read');await assertModuleEnabled(session,'projects');
 const projects=await db.project.findMany({where:projectScope(session),select:{id:true,name:true,reference:true,status:true,health:true,targetAt:true,version:true},orderBy:{updatedAt:'desc'},take:100});return Response.json({projects},{headers:{'Cache-Control':'private, no-store'}});
}
