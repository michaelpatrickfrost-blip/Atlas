"use server";
import { db } from "@/core/db/client";
import { requireSession, type Session } from "@/core/auth/session";
import { assertCapability } from "@/core/permissions/check";
import { assertModuleEnabled } from "@/core/modules/access";
import { QUALITY_CAPABILITIES as C } from "@/core/permissions/capabilities";
import { writeAudit } from "@/core/audit/log";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { QualityInputError, ncrInput, actionInput, actionTransition, qualityText as text, requiredText, choice } from "../domain/workspace";
import { ACTION_STATUSES, canClose } from "../domain/workflow";
import type { Prisma } from "@/generated/prisma/client";
type Operation="create"|"save"|"add"|"editAction"|"action"|"close"|"reopen";
async function member(tx:Prisma.TransactionClient,org:string,user:string|null){if(user&&!await tx.membership.findFirst({where:{organisationId:org,userId:user,active:true}}))throw new QualityInputError("Choose an active owner from this company.");}
async function mutate(session:Session,form:FormData,operation:Operation){
 await assertModuleEnabled(session,"quality");
 let id="";
 try{
  id=await db.$transaction(async tx=>{
   if(operation==="create"){
    const input=ncrInput(form);await member(tx,session.organisationId,input.ownerUserId);
    if(input.productId&&!await tx.product.findFirst({where:{id:input.productId,organisationId:session.organisationId}}))throw new QualityInputError("Choose a product from this company.");
    if(input.rootCauseConfirmed&&(!input.rootCause||!input.workspace.causeEvidence))throw new QualityInputError("Describe the root cause and supporting evidence before confirming it.");
    const seq=await tx.qualitySequence.upsert({where:{organisationId_prefix:{organisationId:session.organisationId,prefix:"NCR"}},create:{organisationId:session.organisationId,prefix:"NCR",value:1},update:{value:{increment:1}}});
    const created=await tx.nonConformance.create({data:{...input,organisationId:session.organisationId,number:`NCR-${String(seq.value).padStart(6,"0")}`,status:input.containment?"CONTAINED":"OPEN",reportedByUserId:session.userId}});
    await writeAudit({organisationId:session.organisationId,actorUserId:session.userId,action:"quality.ncr.reported",entityType:"NonConformance",entityId:created.id,after:{number:created.number}},tx);return created.id;
   }
   const ncrId=requiredText(form,"ncrId",100);
   const ncr=await tx.nonConformance.findFirst({where:{id:ncrId,organisationId:session.organisationId},include:{actions:{where:{organisationId:session.organisationId}}}});
   if(!ncr)throw new Error("NCR unavailable.");
   const version=Number(requiredText(form,"version",20));if(!Number.isSafeInteger(version)||version!==ncr.version)throw new QualityInputError("This issue changed in another window. Reload before saving; your draft is still here.");
   if(ncr.status==="CLOSED"&&operation!=="reopen")throw new QualityInputError("This issue is closed. Reopen it with a reason before making changes.");
   const lock=await tx.nonConformance.updateMany({where:{id:ncr.id,organisationId:session.organisationId,version},data:{version:{increment:1}}});if(!lock.count)throw new QualityInputError("This issue changed in another window. Reload before saving; your draft is still here.");
   let actionAudit: Record<string,unknown>|null=null;
   if(operation==="save"){
    const input=ncrInput(form);await member(tx,session.organisationId,input.ownerUserId);
    if(input.productId&&!await tx.product.findFirst({where:{id:input.productId,organisationId:session.organisationId}}))throw new QualityInputError("Choose a product from this company.");
    if(input.rootCauseConfirmed&&(!input.rootCause||!input.workspace.causeEvidence))throw new QualityInputError("Describe the root cause and supporting evidence before confirming it.");
    const previous=ncr.workspace&&typeof ncr.workspace==="object"&&!Array.isArray(ncr.workspace)?ncr.workspace:{};
    const status=input.disposition!=="PENDING"?"DISPOSITIONED":input.rootCause?"INVESTIGATING":input.containment?"CONTAINED":"OPEN";
    await tx.nonConformance.updateMany({where:{id:ncr.id,organisationId:session.organisationId},data:{...input,workspace:{...previous,...input.workspace},status}});
   }else if(operation==="add"){
    const input=actionInput(form);await member(tx,session.organisationId,input.ownerUserId);
    const action=await tx.nonConformanceAction.create({data:{...input,organisationId:session.organisationId,ncrId:ncr.id}});
    actionAudit={id:action.id,ownerUserId:input.ownerUserId,dueDate:input.dueDate?.toISOString()??null,status:"OPEN"};
   }else if(operation==="editAction"){
    const action=ncr.actions.find(item=>item.id===requiredText(form,"actionId",100));if(!action)throw new Error("Action unavailable.");if(action.status==="VERIFIED")throw new QualityInputError("Verified action evidence is preserved. Add a new follow-up action instead.");const input=actionInput(form);await member(tx,session.organisationId,input.ownerUserId);await tx.nonConformanceAction.updateMany({where:{id:action.id,ncrId:ncr.id,organisationId:session.organisationId},data:input});actionAudit={id:action.id,ownerUserId:input.ownerUserId,dueDate:input.dueDate?.toISOString()??null,status:action.status};
   }else if(operation==="action"){
    const action=ncr.actions.find(item=>item.id===requiredText(form,"actionId",100));if(!action)throw new Error("Action unavailable.");
    const status=choice(form,"status",ACTION_STATUSES),result=text(form,"effectivenessResult",2000);
    actionTransition(action.status,status,result,action.effectivenessCriterion);
    await tx.nonConformanceAction.updateMany({where:{id:action.id,ncrId:ncr.id,organisationId:session.organisationId},data:{status,effectivenessResult:result||action.effectivenessResult}});actionAudit={id:action.id,before:action.status,after:status};
   }else if(operation==="close"){
    const gate=canClose(ncr);if(!gate.ok)throw new QualityInputError(gate.reason!);
    const evidence=requiredText(form,"closureEvidence");if(evidence.length<10)throw new QualityInputError("Record the closure review and evidence (at least 10 characters).");
    const previous=ncr.workspace&&typeof ncr.workspace==="object"&&!Array.isArray(ncr.workspace)?ncr.workspace:{};
    await tx.nonConformance.updateMany({where:{id:ncr.id,organisationId:session.organisationId},data:{status:"CLOSED",closedByUserId:session.userId,closedAt:new Date(),workspace:{...previous,closureEvidence:evidence}}});
   }else if(operation==="reopen"){
    if(ncr.status!=="CLOSED")throw new QualityInputError("Only a closed issue can be reopened.");const reason=requiredText(form,"reason");if(reason.length<10)throw new QualityInputError("Explain why this issue needs to be reopened.");
    const previous=ncr.workspace&&typeof ncr.workspace==="object"&&!Array.isArray(ncr.workspace)?ncr.workspace:{};
    await tx.nonConformance.updateMany({where:{id:ncr.id,organisationId:session.organisationId},data:{status:"INVESTIGATING",closedByUserId:null,closedAt:null,workspace:{...previous,reopenReason:reason}}});
   }
   await writeAudit({organisationId:session.organisationId,actorUserId:session.userId,action:`quality.ncr.${operation}`,entityType:"NonConformance",entityId:ncr.id,before:{version:ncr.version,status:ncr.status},after:{version:ncr.version+1,operation,action:actionAudit,...(operation==="reopen"?{reason:text(form,"reason")}:{})}},tx);
   return ncr.id;
  });
 }catch(error){if(error instanceof QualityInputError)return {error:error.message};throw error;}
 revalidatePath("/quality","layout");
 if(operation==="create")redirect(`/quality/ncr/${id}`);
 return {saved:true};
}
export async function reportNcr(form:FormData){const session=await requireSession();assertCapability(session,C.ncrReport);return mutate(session,form,"create");}
export async function updateNcrInvestigation(form:FormData){const session=await requireSession();assertCapability(session,C.ncrManage);return mutate(session,form,"save");}
export async function addNcrAction(form:FormData){const session=await requireSession();assertCapability(session,C.ncrManage);return mutate(session,form,"add");}
export async function updateNcrAction(form:FormData){const session=await requireSession();assertCapability(session,C.ncrManage);return mutate(session,form,"action");}
export async function closeNcr(form:FormData){const session=await requireSession();assertCapability(session,C.ncrClose);return mutate(session,form,"close");}
export async function reopenNcr(form:FormData){const session=await requireSession();assertCapability(session,C.ncrManage);return mutate(session,form,"reopen");}

export async function saveNcrAction(form:FormData){const session=await requireSession();assertCapability(session,C.ncrManage);return mutate(session,form,"editAction");}
