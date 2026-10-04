'use server';
import { requireSession } from '@/core/auth/session';
import { assertCapability } from '@/core/permissions/check';
import { assertModuleEnabled } from '@/core/modules/access';
import { db } from '@/core/db/client';
import { revalidatePath } from 'next/cache';
import { plannedQuantity,planWindow } from '../domain/plans';
export async function listProductionPlans() {
 const session=await requireSession();
 assertCapability(session,'planning.demand.read');await assertModuleEnabled(session,'planning');
 const plans=await db.productionPlan.findMany({where:{organisationId:session.organisationId},orderBy:{startsOn:'desc'},include:{_count:{select:{lines:true}}}});
 return plans.map(p=>({id:p.id,name:p.name,startsOn:p.startsOn.toISOString().slice(0,10),endsOn:p.endsOn.toISOString().slice(0,10),bucket:p.bucket,version:p.version,lineCount:p._count.lines}));
}
export async function getPlanOptions() {
 const session=await requireSession();
 assertCapability(session,'planning.demand.read');await assertModuleEnabled(session,'planning');assertCapability(session,'stock.read');
 const [products,teams,memberships]=await Promise.all([
  db.product.findMany({where:{organisationId:session.organisationId,kind:'PRODUCT',active:true},select:{id:true,code:true,name:true,unitOfMeasure:true},orderBy:{name:'asc'}}),
  db.workTeam.findMany({where:{organisationId:session.organisationId},select:{id:true,name:true,code:true,members:{select:{membershipId:true}}},orderBy:{name:'asc'}}),
  db.membership.findMany({where:{organisationId:session.organisationId,active:true},select:{id:true,user:{select:{name:true}}}}),
 ]);
 return {products,teams,memberships:memberships.map(m=>({id:m.id,name:m.user.name}))};
}
export async function getProductionPlan(planId:string) {
 const session=await requireSession();
 assertCapability(session,'planning.demand.read');await assertModuleEnabled(session,'planning');assertCapability(session,'stock.read');
 const plan=await db.productionPlan.findFirst({where:{id:planId,organisationId:session.organisationId},include:{lines:{where:{organisationId:session.organisationId},include:{product:{select:{id:true,name:true,code:true}},team:{select:{name:true}},assignedMembership:{select:{user:{select:{name:true}}}}},orderBy:{startsOn:'asc'}}}});
 if(!plan)return null;
 return {id:plan.id,name:plan.name,startsOn:plan.startsOn.toISOString().slice(0,10),endsOn:plan.endsOn.toISOString().slice(0,10),bucket:plan.bucket,version:plan.version,lines:plan.lines.map(l=>({id:l.id,productId:l.productId,name:l.product.name,code:l.product.code,quantity:l.quantity.toString(),unitOfMeasure:l.unitOfMeasure,startsOn:l.startsOn.toISOString().slice(0,10),endsOn:l.endsOn.toISOString().slice(0,10),teamId:l.teamId,teamName:l.team?.name??null,assignedMembershipId:l.assignedMembershipId,assignedName:l.assignedMembership?.user.name??null,notes:l.notes,version:l.version}))};
}
export async function createProductionPlan(form:FormData) {
 const session=await requireSession();
 assertCapability(session,'planning.plan.manage');await assertModuleEnabled(session,'planning');
 const name=String(form.get('name')??'').trim(),requestKey=String(form.get('requestKey')??'');
 if(!name||name.length>150||!requestKey||requestKey.length>100)throw new Error('Enter a plan name and retry with a valid request.');
 const window=planWindow(form);
 await db.$transaction(async tx=>{
  const existing=await tx.productionPlan.findUnique({where:{organisationId_requestKey:{organisationId:session.organisationId,requestKey}}});
  if(existing){if(existing.name!==name||existing.startsOn.getTime()!==window.startsOn.getTime()||existing.endsOn.getTime()!==window.endsOn.getTime()||existing.bucket!==window.bucket)throw new Error('This request already created a different plan.');return;}
  const plan=await tx.productionPlan.create({data:{organisationId:session.organisationId,name,requestKey,...window,createdByUserId:session.userId}});
  await tx.auditEntry.create({data:{organisationId:session.organisationId,actorUserId:session.userId,action:'planning.plan_created',entityType:'ProductionPlan',entityId:plan.id,after:{name,bucket:window.bucket,startsOn:window.startsOn.toISOString(),endsOn:window.endsOn.toISOString()}}});
 });
 revalidatePath('/planning/plans');
}
export async function addProductionPlanLine(form:FormData) {
 const session=await requireSession();
 assertCapability(session,'planning.plan.manage');await assertModuleEnabled(session,'planning');
 const organisationId=session.organisationId,planId=String(form.get('planId')??''),productId=String(form.get('productId')??''),teamId=String(form.get('teamId')??'')||null,assignedMembershipId=String(form.get('assignedMembershipId')??'')||null;
 const quantity=plannedQuantity(form.get('quantity')),window=planWindow(form),version=Number(form.get('version')),requestKey=String(form.get('requestKey')??''),notes=String(form.get('notes')??'').trim();
 if(!Number.isSafeInteger(version)||version<1||!requestKey||requestKey.length>100||notes.length>2000)throw new Error('Reload the plan and enter valid line details.');
 await db.$transaction(async tx=>{
  const existing=await tx.productionPlanLine.findUnique({where:{organisationId_requestKey:{organisationId,requestKey}}});
  if(existing){if(existing.planId!==planId||existing.productId!==productId||existing.quantity.toString()!==quantity||existing.startsOn.getTime()!==window.startsOn.getTime()||existing.endsOn.getTime()!==window.endsOn.getTime()||existing.teamId!==teamId||existing.assignedMembershipId!==assignedMembershipId||existing.notes!==(notes||null))throw new Error('This request already created different planned work.');return;}
  const plan=await tx.productionPlan.findFirstOrThrow({where:{id:planId,organisationId}});
  if(window.startsOn<plan.startsOn||window.endsOn>plan.endsOn)throw new Error('Planned work must fit inside the plan’s dates.');
  const product=await tx.product.findFirstOrThrow({where:{id:productId,organisationId,kind:'PRODUCT',active:true}});
  if(teamId)await tx.workTeam.findFirstOrThrow({where:{id:teamId,organisationId}});
  if(assignedMembershipId){await tx.membership.findFirstOrThrow({where:{id:assignedMembershipId,organisationId,active:true}});if(teamId&&!await tx.workTeamMember.findUnique({where:{teamId_membershipId:{teamId,membershipId:assignedMembershipId}}}))throw new Error('The responsible person must belong to the selected team.');}
  const updated=await tx.productionPlan.updateMany({where:{id:planId,organisationId,version},data:{version:{increment:1}}});if(updated.count!==1)throw new Error('Another planner changed this plan. Reload it before saving.');
  const line=await tx.productionPlanLine.create({data:{organisationId,planId,productId,quantity,unitOfMeasure:product.unitOfMeasure,startsOn:window.startsOn,endsOn:window.endsOn,teamId,assignedMembershipId,notes:notes||null,requestKey}});
  await tx.auditEntry.create({data:{organisationId,actorUserId:session.userId,action:'planning.work_added',entityType:'ProductionPlanLine',entityId:line.id,after:{planId,productId,quantity,unitOfMeasure:product.unitOfMeasure,teamId,assignedMembershipId}}});
 },{isolationLevel:'Serializable'});
 revalidatePath('/planning/plans','layout');
}
export async function getAssignedPlanningWork(teamId?:string) {
 const session=await requireSession();
 assertCapability(session,'planning.demand.read');await assertModuleEnabled(session,'planning');assertCapability(session,'stock.read');
 const lines=await db.productionPlanLine.findMany({where:{organisationId:session.organisationId,...(teamId?{teamId}:{})},include:{plan:{select:{id:true,name:true}},product:{select:{name:true,code:true}},team:{select:{name:true}},assignedMembership:{select:{user:{select:{name:true}}}}},orderBy:[{endsOn:'asc'},{id:'asc'}],take:10001});
 if(lines.length>10000)throw new Error('Select a team to narrow the assigned-work view.');
 return lines.map(l=>({id:l.id,planId:l.plan.id,planName:l.plan.name,name:l.product.name,code:l.product.code,quantity:l.quantity.toString(),unitOfMeasure:l.unitOfMeasure,startsOn:l.startsOn.toISOString().slice(0,10),endsOn:l.endsOn.toISOString().slice(0,10),teamId:l.teamId,teamName:l.team?.name??'Unassigned',assignedName:l.assignedMembership?.user.name??'Unassigned'}));
}
