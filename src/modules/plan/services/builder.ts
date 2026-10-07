'use server';
import { requireSession,type Session } from '@/core/auth/session';
import { assertCapability } from '@/core/permissions/check';
import { assertModuleEnabled } from '@/core/modules/access';
import { db } from '@/core/db/client';
import { readBusinessPlanning } from '@/core/planning/business-read';
import { canEditPlan,planWhere } from '../domain/access';
import { metricByKey,METRICS } from '../domain/catalogue';
import { parsePlanningNumber,periodKeys } from '../domain/engine';
import { monthlyPhasing,inputContributions } from '../domain/inputs';
import { revalidatePath } from 'next/cache';
const text=(f:FormData,k:string)=>String(f.get(k)??'').trim();
async function opened(session:Session,id:string,edit=false){
 await assertModuleEnabled(session,'plan');
 const plan=await db.businessPlan.findFirst({where:{id,...planWhere(session)},include:{shares:true,versions:true,measures:true}});
 if(!plan)throw Error('This plan is unavailable.');
 if(edit&&(!canEditPlan(plan,session.userId)||plan.locked))throw Error('This plan is locked or shared with you to view.');
 return plan;
}
function request(plan:{periodStart:Date;periodEnd:Date},search?:string){return {startsOn:plan.periodStart.toISOString().slice(0,10),endsOn:plan.periodEnd.toISOString().slice(0,10),historyStartsOn:plan.periodStart.toISOString().slice(0,10),purpose:'picker' as const,search};}
export async function getPlanBuilder(planId:string,search=''){
 const session=await requireSession();
 assertCapability(session,'plan.read');
 const plan=await opened(session,planId);
 const data=await readBusinessPlanning(session,request(plan,search.slice(0,100)));
 const inputs=await db.planInput.findMany({where:{organisationId:session.organisationId,planId},orderBy:[{periodKey:'asc'},{createdAt:'asc'}],take:5001});
 if(inputs.length>5000)throw Error('This plan exceeds 5,000 input rows.');
 // Resolve exact IDs separately so a picker search cannot hide an existing link.
 const selected=await readBusinessPlanning(session,{...request(plan),sourceIds:[...new Set(inputs.map(i=>i.sourceId).filter(Boolean))]});
 const allowed=new Map(selected.sources.map(s=>[`${s.module}|${s.type}|${s.id}`,s]));
 const visible=inputs.filter(i=>i.sourceType==='manual'||allowed.has(`${i.sourceModule}|${i.sourceType}|${i.sourceId}`));
 return {revision:plan.revision,canEdit:session.capabilities.has('plan.edit')&&canEditPlan(plan,session.userId)&&!plan.locked,periods:periodKeys(request(plan).startsOn,request(plan).endsOn),sources:data.sources,products:data.products,inputs:visible.map(i=>({...i,value:Number(i.value),probability:i.probabilityOverride?Number(i.probability):allowed.get(`${i.sourceModule}|${i.sourceType}|${i.sourceId}`)?.probability??Number(i.probability),source:allowed.get(`${i.sourceModule}|${i.sourceType}|${i.sourceId}`)??null})),hiddenInputs:inputs.length-visible.length,warnings:data.warnings,metrics:METRICS.filter(m=>!m.sensitive||plan.sensitive&&session.capabilities.has('plan.sensitive.read'))};
}
export async function savePlanInput(form:FormData){
 const session=await requireSession();
 assertCapability(session,'plan.edit');
 const plan=await opened(session,text(form,'planId'),true);
 const metric=metricByKey(text(form,'metricKey'));
 if(!metric||metric.sensitive&&(!plan.sensitive||!session.capabilities.has('plan.sensitive.read')))throw Error('Choose an authorised measure.');
 const value=parsePlanningNumber(text(form,'value'),metric.unit);
 let probability=Number(text(form,'probability')||100);
 const note=text(form,'note'),label=text(form,'label');
 if(value==null||!Number.isFinite(value)||Math.abs(value)>1e14||!Number.isFinite(probability)||probability<0||probability>100||!note||note.length>2000||!label||label.length>200)throw Error('Enter a name, valid value, probability (0–100) and planning reason.');
 const data=await readBusinessPlanning(session,request(plan));
 const sourceKey=text(form,'source');
 let source=sourceKey?data.sources.find(s=>`${s.module}|${s.type}|${s.id}`===sourceKey):undefined;
 if(sourceKey&&!source){const [module,type,id]=sourceKey.split('|');const exact=await readBusinessPlanning(session,{...request(plan),sourceIds:[id]});source=exact.sources.find(s=>s.module===module&&s.type===type&&s.id===id);}
 if(sourceKey&&!source)throw Error('That source is no longer available to you.');
 if(!text(form,'probability'))probability=source?.probability??100;
 if(!Number.isFinite(probability)||probability<0||probability>100)throw Error('Enter a probability from 0 to 100.');
 if(source&&['sales-project','opportunity'].includes(source.type)&&value<0)throw Error('Commercial demand cannot be negative. Use a manual adjustment with a reason.');
 if(source?.currency&&source.currency!==plan.currency)throw Error(`This source uses ${source.currency}; this plan uses ${plan.currency}. Currency conversion is not configured.`);
 const productId=text(form,'productId')||null;
 if(productId&&!data.products.some(p=>p.id===productId&&p.currency===plan.currency))throw Error('Choose a product in the plan currency.');
 if(metric.key==='sales_volume'&&!productId)throw Error('Select the product for this demand.');
 const unitPriceText=text(form,'unitPrice');
 const unitPriceMinor=unitPriceText?parsePlanningNumber(unitPriceText,'money'):null;
 if(unitPriceMinor!=null&&(!Number.isSafeInteger(unitPriceMinor)||unitPriceMinor<0||unitPriceMinor>2147483647))throw Error('Enter a valid selling price.');
 const phases=monthlyPhasing(text(form,'period'),text(form,'endPeriod')||text(form,'period'),value);
 const allowedPeriods=new Set(periodKeys(request(plan).startsOn,request(plan).endsOn));
 if(phases.some(p=>!allowedPeriods.has(p.period)||plan.lockedPeriods.includes(p.period)))throw Error('All periods must be unlocked and inside this plan.');
 const id=text(form,'inputId');
 if(id&&phases.length!==1)throw Error('Edit one input month at a time.');
 await db.$transaction(async tx=>{
  const changed=await tx.businessPlan.updateMany({where:{id:plan.id,organisationId:session.organisationId,revision:Number(form.get('revision'))},data:{revision:{increment:1}}});
  if(changed.count!==1)throw Error('Another person changed this plan. Refresh it before saving.');
  const before=id?await tx.planInput.findFirst({where:{id,planId:plan.id,organisationId:session.organisationId}}):null;
  if(id&&!before)throw Error('That input is no longer on this plan.');
  for(const phase of phases){const values={sourceModule:source?.module??'plan',sourceType:source?.type??'manual',sourceId:source?.id??'',label,productId,metricKey:metric.key,periodKey:phase.period,value:phase.value,probability,probabilityOverride:!!text(form,'probability'),unitPriceMinor,note,included:form.get('included')!=='off'};
   if(before)await tx.planInput.update({where:{id:before.id},data:{...values,revision:{increment:1}}});else await tx.planInput.create({data:{organisationId:session.organisationId,planId:plan.id,createdByUserId:session.userId,...values}});
  }
  await tx.planMeasure.upsert({where:{planId_metricKey:{planId:plan.id,metricKey:metric.key}},create:{organisationId:session.organisationId,planId:plan.id,metricKey:metric.key,sortOrder:plan.measures.length},update:{}});
  await tx.auditEntry.create({data:{organisationId:session.organisationId,actorUserId:session.userId,action:before?'plan.input.changed':'plan.input.added',entityType:'BusinessPlan',entityId:plan.id,before:before?{value:String(before.value),probability:String(before.probability),note:before.note}:undefined,after:{label,metric:metric.key,periods:phases.map(p=>p.period),value,probability,note}}});
 },{isolationLevel:'Serializable'});
 revalidatePath('/plan','layout');
}
export async function setPlanInputIncluded(form:FormData){
 const session=await requireSession();
 assertCapability(session,'plan.edit');
 const plan=await opened(session,text(form,'planId'),true);
 await db.$transaction(async tx=>{
  const changed=await tx.businessPlan.updateMany({where:{id:plan.id,organisationId:session.organisationId,revision:Number(form.get('revision'))},data:{revision:{increment:1}}});
  if(changed.count!==1)throw Error('Another person changed this plan. Refresh before saving.');
  const input=await tx.planInput.findFirstOrThrow({where:{id:text(form,'inputId'),planId:plan.id,organisationId:session.organisationId}});
  if(plan.lockedPeriods.includes(input.periodKey))throw Error('This period is locked.');
  await tx.planInput.update({where:{id:input.id},data:{included:!input.included,revision:{increment:1}}});
  await tx.auditEntry.create({data:{organisationId:session.organisationId,actorUserId:session.userId,action:'plan.input.inclusion_changed',entityType:'PlanInput',entityId:input.id,before:{included:input.included},after:{included:!input.included}}});
 });
 revalidatePath('/plan','layout');
}
export async function applyPlanInputs(form:FormData){
 const session=await requireSession();
 assertCapability(session,'plan.edit');
 const plan=await opened(session,text(form,'planId'),true);
 const data=await readBusinessPlanning(session,{...request(plan),purpose:'forecast',planIds:[plan.id]});
 const forecast=plan.versions.find(v=>v.kind==='forecast'&&['draft','active'].includes(v.status));
 if(!forecast)throw Error('No editable forecast is available.');
 const rows=inputContributions(data.inputs,data.orders);
 const totals=new Map<string,{metricKey:string;periodKey:string;value:number}>();
 const affected=await db.planInput.findMany({where:{organisationId:session.organisationId,planId:plan.id},select:{metricKey:true,periodKey:true,unitPriceMinor:true}});
 for(const input of affected){totals.set(input.metricKey+'|'+input.periodKey,{metricKey:input.metricKey,periodKey:input.periodKey,value:0});if(input.metricKey==='sales_volume'&&input.unitPriceMinor!=null)totals.set('revenue|'+input.periodKey,{metricKey:'revenue',periodKey:input.periodKey,value:0});}
 if(affected.some(i=>plan.lockedPeriods.includes(i.periodKey)))throw Error('Unlock the affected periods first.');
 const add=(metricKey:string,periodKey:string,value:number)=>{const key=metricKey+'|'+periodKey;const previous=totals.get(key);totals.set(key,{metricKey,periodKey,value:(previous?.value??0)+value});};
 for(const row of rows){if(plan.lockedPeriods.includes(row.periodKey))throw Error('Unlock the affected periods first.');add(row.metricKey,row.periodKey,row.weighted);if(row.metricKey==='sales_volume'&&row.unitPriceMinor!=null)add('revenue',row.periodKey,row.weighted*row.unitPriceMinor);}
 if(!totals.size)throw Error('Add included planning inputs first.');
 await db.$transaction(async tx=>{
  const changed=await tx.businessPlan.updateMany({where:{id:plan.id,organisationId:session.organisationId,revision:Number(form.get('revision'))},data:{revision:{increment:1}}});
  if(changed.count!==1)throw Error('The plan changed. Refresh before applying inputs.');
  for(const cell of totals.values()){
   const key={versionId:forecast.id,metricKey:cell.metricKey,periodKey:cell.periodKey,dimensionKey:'',kind:'forecast'};
   await tx.planCell.upsert({where:{versionId_metricKey_periodKey_dimensionKey_kind:key},create:{organisationId:session.organisationId,planId:plan.id,...key,value:cell.value,updatedByName:session.userName},update:{value:cell.value,updatedByName:session.userName}});
   await tx.planMeasure.upsert({where:{planId_metricKey:{planId:plan.id,metricKey:cell.metricKey}},create:{organisationId:session.organisationId,planId:plan.id,metricKey:cell.metricKey},update:{}});
  }
  await tx.auditEntry.create({data:{organisationId:session.organisationId,actorUserId:session.userId,action:'plan.inputs.applied',entityType:'BusinessPlan',entityId:plan.id,after:{versionId:forecast.id,inputs:rows.map(r=>({id:r.id,weighted:r.weighted,consumed:r.consumed,contribution:r.contribution})),cells:[...totals.values()]}}});
 },{isolationLevel:'Serializable'});
 revalidatePath('/plan','layout');
}
export async function savePlanGrid(form:FormData){
 const session=await requireSession();
 assertCapability(session,'plan.edit');
 const plan=await opened(session,text(form,'planId'),true);
 const metric=metricByKey(text(form,'metricKey'));
 if(!metric||!plan.measures.some(m=>m.metricKey===metric.key))throw Error('Choose a measure on this plan.');
 const version=plan.versions.find(v=>v.kind==='forecast'&&['draft','active'].includes(v.status));
 if(!version)throw Error('No working forecast is available.');
 const periods=periodKeys(request(plan).startsOn,request(plan).endsOn);
 const approved=plan.versions.some(v=>v.kind==='baseline'&&v.status==='approved');
 await db.$transaction(async tx=>{
  const updated=await tx.businessPlan.updateMany({where:{id:plan.id,organisationId:session.organisationId,revision:Number(form.get('revision'))},data:{revision:{increment:1}}});
  if(updated.count!==1)throw Error('This plan has changed. Refresh before saving.');
  for(const period of periods){if(plan.lockedPeriods.includes(period))continue;for(const kind of ['plan','forecast']){
   if(kind==='plan'&&approved)continue;
   const raw=text(form,`${kind}:${period}`),value=parsePlanningNumber(raw,metric.unit);
   if(raw&&value==null)throw Error(`Enter a valid number for ${period}.`);
   const key={versionId:version.id,metricKey:metric.key,periodKey:period,dimensionKey:'',kind};
   if(value==null)await tx.planCell.deleteMany({where:{...key,organisationId:session.organisationId,planId:plan.id}});
   else await tx.planCell.upsert({where:{versionId_metricKey_periodKey_dimensionKey_kind:key},create:{organisationId:session.organisationId,planId:plan.id,...key,value,updatedByName:session.userName},update:{value,updatedByName:session.userName}});
  }}
  await tx.auditEntry.create({data:{organisationId:session.organisationId,actorUserId:session.userId,action:'plan.grid.saved',entityType:'BusinessPlan',entityId:plan.id,after:{metric:metric.key,periods}}});
 });
 revalidatePath('/plan','layout');
}
export async function removePlanMeasure(form:FormData){
 const session=await requireSession();
 assertCapability(session,'plan.edit');
 const plan=await opened(session,text(form,'planId'),true),metricKey=text(form,'metricKey');
 await db.$transaction(async tx=>{const changed=await tx.businessPlan.updateMany({where:{id:plan.id,organisationId:session.organisationId,revision:Number(form.get('revision'))},data:{revision:{increment:1}}});if(!changed.count)throw Error('Plan changed. Refresh first.');await tx.planMeasure.deleteMany({where:{planId:plan.id,organisationId:session.organisationId,metricKey}});await tx.auditEntry.create({data:{organisationId:session.organisationId,actorUserId:session.userId,action:'plan.measure.hidden',entityType:'BusinessPlan',entityId:plan.id,after:{metricKey}}});});
 revalidatePath('/plan','layout');
}
