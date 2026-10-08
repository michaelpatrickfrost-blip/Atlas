"use server";
import {requireSession} from '@/core/auth/session';
import {assertCapability} from '@/core/permissions/check';
import {assertModuleEnabled} from '@/core/modules/access';
import {db} from '@/core/db/client';
import {required,text,integer,audit,changed} from '@/core/shared/operational-forms';
import {engineeringTransition} from '../domain/rules';
import {saveServiceFile,removeServiceFile} from '@/core/service-work/files';
import {revalidatePath} from 'next/cache';
import {redirect} from 'next/navigation';
export async function saveEngineeringRevision(f:FormData){
 const s=await requireSession();
 assertCapability(s,'engineering.revision.manage');
 await assertModuleEnabled(s,'engineering');assertCapability(s,'core.products.read');await assertModuleEnabled(s,'products');const id=text(f,'id'),productId=required(f,'productId');if(!await db.product.findFirst({where:{id:productId,organisationId:s.organisationId,active:true}}))throw Error('Product unavailable.');const data={productId,revision:required(f,'revision',40),title:required(f,'title'),reason:required(f,'reason',4000),specification:required(f,'specification',12000)};let saved=id;await db.$transaction(async tx=>{if(id)changed((await tx.engineeringRevision.updateMany({where:{id,organisationId:s.organisationId,version:integer(f,'version',1),status:'DRAFT'},data:{...data,lastEditorUserId:s.userId,version:{increment:1}}})).count);else saved=(await tx.engineeringRevision.create({data:{...data,organisationId:s.organisationId,authorUserId:s.userId}})).id;await audit(tx,s,'engineering.revision.saved','EngineeringRevision',saved,{productId,revision:data.revision});});revalidatePath('/engineering','layout');if(!id)redirect('/engineering/'+saved);
}
export async function transitionEngineeringRevision(f:FormData){
 const s=await requireSession();
 assertCapability(s,'engineering.revision.manage');
 await assertModuleEnabled(s,'engineering');const id=required(f,'id'),r=await db.engineeringRevision.findFirst({where:{id,organisationId:s.organisationId}});if(!r)throw Error('Revision unavailable.');const status=required(f,'status');if(status==='APPROVED')assertCapability(s,'engineering.revision.approve');if(status==='RELEASED')assertCapability(s,'engineering.revision.release');engineeringTransition(r.status,status,r.lastEditorUserId??r.authorUserId,s.userId);if(status==='APPROVED'&&r.authorUserId===s.userId)throw Error('Another authorised person must approve the design.');await db.$transaction(async tx=>{if(status==='RELEASED')await tx.engineeringRevision.updateMany({where:{organisationId:s.organisationId,productId:r.productId,status:'RELEASED'},data:{status:'SUPERSEDED',version:{increment:1}}});changed((await tx.engineeringRevision.updateMany({where:{id,organisationId:s.organisationId,version:integer(f,'version',1),status:r.status},data:{status,reviewerUserId:status==='APPROVED'?s.userId:status==='DRAFT'?null:r.reviewerUserId,approvedAt:status==='APPROVED'?new Date():status==='DRAFT'?null:r.approvedAt,releasedAt:status==='RELEASED'?new Date():null,version:{increment:1}}})).count);await audit(tx,s,'engineering.revision.'+status.toLowerCase(),'EngineeringRevision',id,{productId:r.productId,revision:r.revision});},{isolationLevel:'Serializable'});revalidatePath('/engineering','layout');
}
export async function uploadEngineeringDrawing(f:FormData){
 const s=await requireSession();
 assertCapability(s,'engineering.revision.manage');
 await assertModuleEnabled(s,'engineering');const id=required(f,'id'),r=await db.engineeringRevision.findFirst({where:{id,organisationId:s.organisationId,status:'DRAFT'}});if(!r)throw Error('Only a draft revision accepts drawings.');const file=f.get('drawing');if(!(file instanceof File))throw Error('Choose a drawing PDF or image.');const stored=await saveServiceFile(file);try{await db.$transaction(async tx=>{changed((await tx.engineeringRevision.updateMany({where:{id,organisationId:s.organisationId,status:'DRAFT',version:integer(f,'version',1)},data:{version:{increment:1}}})).count);const a=await tx.engineeringAttachment.create({data:{...stored,organisationId:s.organisationId,revisionId:id,authorUserId:s.userId}});await audit(tx,s,'engineering.drawing.added','EngineeringAttachment',a.id,{revisionId:id,sha256:stored.sha256});});}catch(e){await removeServiceFile(stored.storageKey);throw e;}revalidatePath('/engineering','layout');
}
