'use server';
import { requireSession,type Session } from '@/core/auth/session';
import { assertCapability } from '@/core/permissions/check';
import { assertModuleEnabled } from '@/core/modules/access';
import { enabledModulesForSession } from '@/core/modules/runtime';
import { readBusinessPlanning } from '@/core/planning/business-read';
import { db } from '@/core/db/client';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { buildDemand,DEFAULT_SETTINGS,monthOffset,type SopSettings } from '../domain/engine';
import { z } from 'zod';
import { planningSignature as planSignature } from '../domain/lineage';
import { scenarioRows,forecastBridge,type ScenarioAssumptions } from '../domain/scenario';
const text=(f:FormData,k:string)=>String(f.get(k)??'').trim();
const versionWhere=(s:Session)=>({organisationId:s.organisationId,OR:[{kind:{not:'scenario'}},{createdByUserId:s.userId}]});
const cycleWhere=(s:Session)=>({organisationId:s.organisationId,OR:[{ownerUserId:s.userId},{companyVisible:true}]});
const settingsSchema=z.object({productCodes:z.array(z.string().min(1).max(100)).max(500).optional(),targetPlanId:z.string().max(100).nullable().optional(),historyMonths:z.union([z.literal(12),z.literal(24),z.literal(36),z.literal(60)]),signal:z.enum(['requested','bookings','shipments','deliveries']),method:z.enum(['auto','moving-average','weighted-average','seasonal-naive','exponential','croston-sba','manual']),consumption:z.enum(['consume','additive']),priceChange:z.number().min(-100).max(1000),unitCostMinor:z.number().int().min(0).max(2147483647).nullable(),lateToleranceDays:z.number().int().min(0).max(30),inFullPercent:z.number().min(1).max(100)});
const stages=['Data refresh','Product review','Demand review','Supply review','Financial review','Pre-S&OP','Executive review'];
async function opened(s:Session,id:string){await assertModuleEnabled(s,'sop');const cycle=await db.sopCycle.findFirst({where:{id,...cycleWhere(s)}});if(!cycle)throw Error('This S&OP cycle is unavailable.');return cycle;}
function settings(value:unknown){return settingsSchema.parse({...DEFAULT_SETTINGS,...(value&&typeof value==='object'?value:{})});}
function reviewWorkflow(previous:unknown,owner:string,versionId?:string){const rows=Array.isArray(previous)?previous:[];return stages.map(title=>{const before=rows.find(row=>row&&typeof row==='object'&&row.title===title);return {title,status:'open',owner:typeof before?.owner==='string'?before.owner:owner,dueOn:typeof before?.dueOn==='string'?before.dueOn:'',...(versionId?{versionId}:{})};});}
function reviewsComplete(workflow:unknown,versionId:string){return Array.isArray(workflow)&&workflow.length===stages.length&&workflow.every(row=>row&&typeof row==='object'&&row.status==='approved'&&row.versionId===versionId);}
export async function getSopWorkspace(cycleId?:string,versionId?:string,includeSnapshot=true){
 const session=await requireSession();
 assertCapability(session,'sop.read');
 await assertModuleEnabled(session,'sop');
 const cycles=await db.sopCycle.findMany({where:cycleWhere(session),orderBy:{createdAt:'desc'},take:100});
 const cycle=cycleId?cycles.find(c=>c.id===cycleId):cycles[0];if(cycleId&&!cycle)throw Error('This cycle is unavailable.');
 const plans=session.capabilities.has('plan.read')?await db.businessPlan.findMany({where:{organisationId:session.organisationId,...(!session.capabilities.has('plan.sensitive.read')?{sensitive:false}:{}),OR:[{ownerUserId:session.userId},{audience:'company'},{shares:{some:{organisationId:session.organisationId,userId:session.userId}}}]},select:{id:true,name:true,currency:true},take:100}):[];
 if(!cycle)return {inaccessibleVersions:0,cycles,plans,cycle:null,versions:[],version:null,capabilities:[...session.capabilities]};
 const allVersions=includeSnapshot?await db.sopVersion.findMany({where:{...versionWhere(session),cycleId:cycle.id},select:{id:true,name:true,status:true,kind:true,createdAt:true,approvedAt:true,publishedAt:true,sourceRevision:true,requiredCapabilities:true,requiredModules:true},orderBy:{createdAt:'desc'},take:100}):[];
 const enabledModules=await enabledModulesForSession(session);
 const versions=allVersions.filter(v=>session.capabilities.has('plan.read')&&v.requiredCapabilities.every(c=>session.capabilities.has(c))&&v.requiredModules.every(m=>enabledModules.has(m)));
 const selected=includeSnapshot?(versionId??versions[0]?.id):undefined;
 const version=selected?await db.sopVersion.findFirst({where:{id:selected,cycleId:cycle.id,...versionWhere(session)}}):null;
 if(version){assertCapability(session,'plan.read');const enabled=await enabledModulesForSession(session);if(version.requiredCapabilities.some(c=>!session.capabilities.has(c))||version.requiredModules.some(m=>!enabled.has(m)))throw Error('This snapshot contains source data your current profile cannot read.');
  // Recheck both current plan visibility and the historical snapshot's own source links.
  const payload=version.payload as unknown as SopPayload;
  await readBusinessPlanning(session,{startsOn:cycle.startsOn.toISOString().slice(0,10),endsOn:cycle.endsOn.toISOString().slice(0,10),historyStartsOn:cycle.startsOn.toISOString().slice(0,10),purpose:'forecast',modules:['plan'],productIds:payload.productIds,planIds:payload.sourcePlanIds});
  const linked=payload.inputs.filter(i=>i.sourceType!=='manual');
  if(linked.length){const readable=await readBusinessPlanning(session,{startsOn:cycle.startsOn.toISOString().slice(0,10),endsOn:cycle.endsOn.toISOString().slice(0,10),historyStartsOn:cycle.startsOn.toISOString().slice(0,10),purpose:'picker',modules:[...new Set(linked.map(i=>i.sourceModule))],sourceIds:[...new Set(linked.map(i=>i.sourceId))]});const keys=new Set(readable.sources.map(s=>`${s.module}|${s.type}|${s.id}`));if(linked.some(i=>!keys.has(`${i.sourceModule}|${i.sourceType}|${i.sourceId}`)))throw Error('This snapshot contains a commercial or people source you cannot currently read.');}
 }
 return {inaccessibleVersions:allVersions.length-versions.length,cycles,plans,cycle,versions,version:version?{...version,payload:version.payload as unknown as SopPayload}:null,capabilities:[...session.capabilities]};
}
export async function createSopCycle(form:FormData){
 const session=await requireSession();
 assertCapability(session,'sop.manage');
 await assertModuleEnabled(session,'sop');assertCapability(session,'plan.read');
 const name=text(form,'name'),start=text(form,'start'),horizon=Number(form.get('horizon'));
 if(!name||name.length>160||!/^\d{4}-(0[1-9]|1[0-2])$/.test(start)||![12,18,24,36].includes(horizon))throw Error('Enter a cycle name, first month and a supported horizon.');
 const end=new Date(`${monthOffset(start,horizon)}-01T00:00:00Z`);end.setUTCDate(0);
 const currency=text(form,'currency')||'GBP';if(!/^[A-Z]{3}$/.test(currency))throw Error('Choose a currency.');
 const cycle=await db.sopCycle.create({data:{organisationId:session.organisationId,name,startsOn:new Date(`${start}-01T00:00:00Z`),endsOn:end,currency,ownerUserId:session.userId,settings:DEFAULT_SETTINGS,workflow:reviewWorkflow([],session.userName)}});
 await db.auditEntry.create({data:{organisationId:session.organisationId,actorUserId:session.userId,action:'sop.cycle.created',entityType:'SopCycle',entityId:cycle.id,after:{name,horizon}}});
 revalidatePath('/sop');redirect(`/sop?cycle=${cycle.id}&view=setup`);
}
export async function configureSopCycle(form:FormData){
 const session=await requireSession();
 assertCapability(session,'sop.manage');
 const cycle=await opened(session,text(form,'cycleId'));
 const sourcePlanIds=[...new Set(form.getAll('planId').map(String))];
 const config:SopSettings=settings({...DEFAULT_SETTINGS,productCodes:[...new Set(text(form,'productCodes').split(/[\n,]+/).map(s=>s.trim()).filter(Boolean))],targetPlanId:text(form,'targetPlanId')||null,historyMonths:Number(form.get('historyMonths')),signal:text(form,'signal'),method:text(form,'method'),consumption:text(form,'consumption'),priceChange:Number(form.get('priceChange')),unitCostMinor:text(form,'unitCost')?Math.round(Number(form.get('unitCost'))*100):null,lateToleranceDays:Number(form.get('lateToleranceDays')),inFullPercent:Number(form.get('inFullPercent'))});
 await readBusinessPlanning(session,{startsOn:cycle.startsOn.toISOString().slice(0,10),endsOn:cycle.endsOn.toISOString().slice(0,10),historyStartsOn:cycle.startsOn.toISOString().slice(0,10),purpose:'forecast',modules:['plan'],planIds:sourcePlanIds});
 
 if(config.targetPlanId&&!sourcePlanIds.includes(config.targetPlanId))throw Error('The revenue target plan must also be one of the connected plans.');
 const plans=await db.businessPlan.findMany({where:{id:{in:sourcePlanIds},organisationId:session.organisationId},select:{currency:true}});
 if(plans.some(p=>p.currency!==cycle.currency))throw Error('All connected plans must use the cycle currency.');
 await db.$transaction(async tx=>{const result=await tx.sopCycle.updateMany({where:{id:cycle.id,organisationId:session.organisationId,revision:Number(form.get('revision'))},data:{settings:config,sourcePlanIds,workflow:reviewWorkflow(cycle.workflow,session.userName),revision:{increment:1},inputRevision:{increment:1}}});if(result.count!==1)throw Error('Another planner changed this cycle. Refresh first.');await tx.auditEntry.create({data:{organisationId:session.organisationId,actorUserId:session.userId,action:'sop.settings.changed',entityType:'SopCycle',entityId:cycle.id,before:{settings:cycle.settings,sourcePlanIds:cycle.sourcePlanIds},after:{settings:config,sourcePlanIds}}});});
 revalidatePath('/sop');
}
export type SopPayload=ReturnType<typeof buildDemand>&{settings:SopSettings;sourcePlanIds:string[];asOf:string;currency:string;warnings:string[];budgets:Array<{id:string;name:string;amountMinor:number;currency:string;startsOn:string;endsOn:string}>;productIds:string[];supplySources:import('@/core/planning/business').PlanningSupply[];targets:NonNullable<import('@/core/planning/business').BusinessPlanningData['targets']>;scenarioAssumptions?:ScenarioAssumptions;overrides?:Array<{productId:string;period:string;before:number;after:number;reason:string;by:string;at:string}>;planRevisions:Array<{id:string;revision:number}>;inputs:import('@/core/planning/business').PlanningInput[]};
export async function generateSopForecast(form:FormData){
 const session=await requireSession();
 assertCapability(session,'sop.manage');
 const cycle=await opened(session,text(form,'cycleId')),config=settings(cycle.settings);
 assertCapability(session,'sales.order.read');assertCapability(session,'customers.read');assertCapability(session,'core.products.read');
 await assertModuleEnabled(session,'sales');await assertModuleEnabled(session,'products');
 if(['shipments','deliveries'].includes(config.signal)){assertCapability(session,'logistics.shipment.read');await assertModuleEnabled(session,'logistics');}
 const startsOn=cycle.startsOn.toISOString().slice(0,10),endsOn=cycle.endsOn.toISOString().slice(0,10),asOf=new Date().toISOString().slice(0,10);
 const catalogue=await readBusinessPlanning(session,{startsOn,endsOn,historyStartsOn:startsOn,purpose:'forecast',modules:['products'],productCodes:config.productCodes});
 if(config.productCodes?.some(code=>!catalogue.products.some(p=>p.code===code)))throw Error('A product code in the cycle scope is unavailable. Check the codes and product access.');
 const productIds=catalogue.products.filter(p=>p.currency===cycle.currency).map(p=>p.id);
 const data=await readBusinessPlanning(session,{startsOn,endsOn,historyStartsOn:monthOffset([startsOn.slice(0,7),asOf.slice(0,7)].sort()[0],-config.historyMonths)+'-01',purpose:'forecast',productIds,planIds:cycle.sourcePlanIds});
 const payload:SopPayload={...buildDemand({products:data.products.filter(p=>p.currency===cycle.currency),orders:data.orders,deliveries:data.deliveries,inputs:data.inputs,stock:data.stock,supply:data.supply,startsOn,endsOn,asOf,currency:cycle.currency,settings:config,supplyAvailable:data.requiredCapabilities.includes('stock.read')}),settings:config,sourcePlanIds:cycle.sourcePlanIds,asOf,currency:cycle.currency,productIds,supplySources:data.supply,targets:data.targets,planRevisions:data.planRevisions,inputs:data.inputs,budgets:data.budgets,warnings:[...data.warnings,...(!data.requiredCapabilities.includes('logistics.shipment.read')?['Delivery evidence is unavailable. Open balances and service measures require Logistics access; closed orders are excluded from open demand.']:[]),'Supply is dated stock, receipts and planned production; detailed material, machine and labour feasibility is not yet certified.','Revenue uses product list price or input selling-price assumptions. Budget records are spending authorisations, not a sales revenue budget.']};
 if(payload.rows.length>5000)throw Error(`This forecast has ${payload.rows.length} product periods. Narrow the product-code scope or horizon to at most 5,000 product periods before generating and publishing.`);
 const versionId=crypto.randomUUID();
 const name=text(form,'name')||`Consensus ${new Date().toISOString().slice(0,16).replace('T',' ')}`;
 await db.$transaction(async tx=>{for(const plan of data.planRevisions){const unchanged=await tx.businessPlan.findFirst({where:{id:plan.id,organisationId:session.organisationId,revision:plan.revision},select:{id:true}});if(!unchanged)throw Error('A connected plan changed while the forecast was calculating. Refresh and generate again.');}const changed=await tx.sopCycle.updateMany({where:{id:cycle.id,organisationId:session.organisationId,revision:Number(form.get('revision'))},data:{revision:{increment:1},workflow:reviewWorkflow(cycle.workflow,session.userName,versionId)}});if(changed.count!==1)throw Error('Cycle inputs changed. Refresh before generating.');const version=await tx.sopVersion.create({data:{id:versionId,organisationId:session.organisationId,cycleId:cycle.id,name,sourceRevision:cycle.inputRevision,payload:JSON.parse(JSON.stringify(payload)),requiredCapabilities:[...new Set([...data.requiredCapabilities,...(session.capabilities.has('sales.pipeline.manage')?['sales.pipeline.manage']:[])])],requiredModules:data.requiredModules,createdByUserId:session.userId}});await tx.auditEntry.create({data:{organisationId:session.organisationId,actorUserId:session.userId,action:'sop.forecast.generated',entityType:'SopVersion',entityId:version.id,after:{name,rows:payload.rows.length,settings:config}}});});
 revalidatePath('/sop');redirect(`/sop?cycle=${cycle.id}&version=${versionId}`);
}
export async function approveSopVersion(form:FormData){
 const session=await requireSession();
 assertCapability(session,'sop.approve');
 const cycle=await opened(session,text(form,'cycleId'));
 // Use the same source checks as the reader before approval.
 const workspace=await getSopWorkspace(cycle.id,text(form,'versionId'));
 const version=workspace.version;if(!version||version.status!=='draft'||version.kind!=='consensus')throw Error('Choose a draft consensus version.');
 const current=await readBusinessPlanning(session,{startsOn:cycle.startsOn.toISOString().slice(0,10),endsOn:cycle.endsOn.toISOString().slice(0,10),historyStartsOn:cycle.startsOn.toISOString().slice(0,10),purpose:'forecast',modules:['plan'],productIds:version.payload.productIds,planIds:version.payload.sourcePlanIds});
 if(planSignature(current)!==planSignature(version.payload))throw Error('Connected plan inputs changed. Generate a fresh consensus before approval.');
 if(version.sourceRevision!==cycle.inputRevision)throw Error('Cycle settings or inputs changed after this version was generated. Generate a fresh version before approving.');
 if(!reviewsComplete(cycle.workflow,version.id))throw Error('Complete the planning review stages before approval.');
 await db.$transaction(async tx=>{
  const unchanged=await tx.sopCycle.updateMany({where:{id:cycle.id,organisationId:session.organisationId,revision:cycle.revision,inputRevision:version.sourceRevision},data:{revision:{increment:1}}});
  if(unchanged.count!==1)throw Error('The review cycle changed during approval. Refresh and review again.');
  for(const plan of current.planRevisions??[]){const exists=await tx.businessPlan.findFirst({where:{id:plan.id,organisationId:session.organisationId,revision:plan.revision},select:{id:true}});if(!exists)throw Error('A connected plan changed during approval. Generate a fresh consensus.');}
  const result=await tx.sopVersion.updateMany({where:{id:version.id,organisationId:session.organisationId,status:'draft'},data:{status:'approved',approvedAt:new Date(),approvedByUserId:session.userId}});
  if(result.count!==1)throw Error('Version status changed. Refresh before approving.');
  await tx.auditEntry.create({data:{organisationId:session.organisationId,actorUserId:session.userId,action:'sop.version.approved',entityType:'SopVersion',entityId:version.id,after:{name:version.name}}});
 },{isolationLevel:'Serializable'});
 revalidatePath('/sop');
}
export async function updateSopWorkflow(form:FormData){
 const session=await requireSession();
 assertCapability(session,text(form,'kind')==='stage'?'sop.approve':text(form,'kind')==='share'?'sop.share':'sop.manage');
 const cycle=await opened(session,text(form,'cycleId')),kind=text(form,'kind'),title=text(form,'title');
 const revision=Number(form.get('revision'));
 const changes:Record<string,unknown>={};
 if(kind==='stage'){
  assertCapability(session,'sop.approve');
  const workflow=Array.isArray(cycle.workflow)?cycle.workflow:[],index=Number(form.get('index'));
  if(!Number.isInteger(index)||index<0||index>=workflow.length)throw Error('Choose a review stage.');
  const before=workflow[index];if(!before||typeof before!=='object'||Array.isArray(before))throw Error('Invalid stage.');
  const versionId=text(form,'versionId');
  if(!versionId||before.versionId!==versionId)throw Error('This review belongs to another forecast version. Refresh before reviewing.');
  const {version}=await getSopWorkspace(cycle.id,versionId);
  if(!version||version.kind!=='consensus'||version.status==='published'||version.sourceRevision!==cycle.inputRevision)throw Error('Review the current unpublished consensus version.');
  if(text(form,'owner').length>160||text(form,'dueOn')&&!/^\d{4}-\d{2}-\d{2}$/.test(text(form,'dueOn')))throw Error('Enter a valid owner and due date.');
  workflow[index]={...before,status:text(form,'status')==='open'?'open':'approved',owner:text(form,'owner')||session.userName,dueOn:text(form,'dueOn'),approvedBy:session.userName,approvedAt:new Date().toISOString()};changes.workflow=workflow;
 }else if(['risks','actions','decisions'].includes(kind)){
  if(!title||title.length>300||!text(form,'detail'))throw Error('Enter a title and the reason / impact.');
  const previous=Array.isArray(cycle[kind as 'risks'|'actions'|'decisions'])?cycle[kind as 'risks'|'actions'|'decisions'] as unknown[]:[];
  if(previous.length>=200)throw Error('This cycle already has 200 entries.');
  changes[kind]=[...previous,{id:crypto.randomUUID(),title,detail:text(form,'detail').slice(0,2000),owner:text(form,'owner')||session.userName,dueOn:text(form,'dueOn'),status:'open',createdAt:new Date().toISOString()}];
 }else if(kind==='complete-action'){const actions=Array.isArray(cycle.actions)?cycle.actions:[];let found=false;changes.actions=actions.map(a=>{if(a&&typeof a==='object'&&!Array.isArray(a)&&'id' in a&&a.id===text(form,'actionId')){found=true;return {...a,status:'completed',completedAt:new Date().toISOString(),completedBy:session.userName};}return a;});if(!found)throw Error('That action is unavailable.');
 }else if(kind==='share'){assertCapability(session,'sop.share');if(cycle.ownerUserId!==session.userId)throw Error('Only the cycle owner can change sharing.');changes.companyVisible=!cycle.companyVisible;
 }else throw Error('Choose an S&OP action.');
 await db.$transaction(async tx=>{const result=await tx.sopCycle.updateMany({where:{id:cycle.id,organisationId:session.organisationId,revision},data:{...changes,revision:{increment:1}}});if(result.count!==1)throw Error('Cycle changed. Refresh first.');await tx.auditEntry.create({data:{organisationId:session.organisationId,actorUserId:session.userId,action:'sop.workflow.changed',entityType:'SopCycle',entityId:cycle.id,after:JSON.parse(JSON.stringify({kind,...changes}))}});});revalidatePath('/sop');
}
export async function publishSopVersion(form:FormData){
 const session=await requireSession();
 assertCapability(session,'sop.publish');
 assertCapability(session,'manufacturing.plan.manage');await assertModuleEnabled(session,'manufacturing');
 const cycle=await opened(session,text(form,'cycleId'));
 const workspace=await getSopWorkspace(cycle.id,text(form,'versionId')),version=workspace.version;
 if(!version||version.kind!=='consensus'||!['approved','published'].includes(version.status))throw Error('Approve the consensus before publishing to MRP.');
 if(version.status==='published')return;
 if(!version.payload.rows.length)throw Error('This version has no product demand to publish. Check the source scope and generate a populated consensus.');
 if(!reviewsComplete(cycle.workflow,version.id))throw Error('A review stage was reopened or belongs to another version. Review and approve a fresh consensus before publication.');
 if(version.sourceRevision!==cycle.inputRevision)throw Error('Cycle inputs changed after approval. Generate and approve a fresh consensus before publishing.');
 const current=await readBusinessPlanning(session,{startsOn:cycle.startsOn.toISOString().slice(0,10),endsOn:cycle.endsOn.toISOString().slice(0,10),historyStartsOn:cycle.startsOn.toISOString().slice(0,10),purpose:'forecast',modules:['plan'],productIds:version.payload.productIds,planIds:version.payload.sourcePlanIds});
 if(planSignature(current)!==planSignature(version.payload))throw Error('Connected plan inputs changed after approval. Generate and approve a fresh consensus before publishing.');
 const {getModule}=await import('@/core/modules/registry');
 const consumer=getModule('manufacturing')?.planningPublicationConsumer;if(!consumer)throw Error('Manufacturing demand publication is unavailable.');
 await db.$transaction(async tx=>{
  const unchanged=await tx.sopCycle.updateMany({where:{id:cycle.id,organisationId:session.organisationId,revision:cycle.revision,inputRevision:version.sourceRevision},data:{revision:{increment:1}}});
  if(unchanged.count!==1)throw Error('Cycle changed during publication. Refresh first.');
  for(const plan of current.planRevisions){const unchanged=await tx.businessPlan.findFirst({where:{id:plan.id,organisationId:session.organisationId,revision:plan.revision},select:{id:true}});if(!unchanged)throw Error('A connected plan changed during publication. Generate a fresh consensus.');}
  const newer=await tx.sopVersion.findFirst({where:{organisationId:session.organisationId,cycleId:cycle.id,status:'published',createdAt:{gt:version.createdAt}},select:{id:true}});if(newer)throw Error('A newer version has already been published. Create a new version instead of overwriting it with an older one.');
  const changed=await tx.sopVersion.updateMany({where:{id:version.id,organisationId:session.organisationId,status:'approved'},data:{status:'published',publishedAt:new Date(),publicationId:version.id}});
  if(changed.count!==1)throw Error('This version was already published or its status changed.');
  await consumer(session,tx,{versionId:version.id,currency:cycle.currency,rows:version.payload.rows.map(r=>({productId:r.productId,period:r.period,quantity:r.consensus}))});
  await tx.auditEntry.create({data:{organisationId:session.organisationId,actorUserId:session.userId,action:'sop.demand.published',entityType:'SopVersion',entityId:version.id,after:{products:[...new Set(version.payload.rows.map(r=>r.productId))].length,rows:version.payload.rows.length}}});
 },{isolationLevel:'Serializable'});
 revalidatePath('/sop');revalidatePath('/manufacturing/plan');revalidatePath('/planning');
}
export async function createSopScenario(form:FormData){
 const session=await requireSession();
 assertCapability(session,'sop.manage');
 const cycle=await opened(session,text(form,'cycleId')),workspace=await getSopWorkspace(cycle.id,text(form,'versionId'));
 const version=workspace.version;if(!version)throw Error('Generate a base version first.');
 const name=text(form,'name'),percent=Number(form.get('percent')),pricePercent=Number(form.get('pricePercent'));
 if(!name||name.length>160||!Number.isFinite(percent)||percent< -100||percent>1000||!Number.isFinite(pricePercent)||pricePercent< -100||pricePercent>1000||!text(form,'reason'))throw Error('Enter a scenario name, valid changes and a reason.');
 const payload: SopPayload=JSON.parse(JSON.stringify(version.payload));
 const assumptions:ScenarioAssumptions={demandPercent:percent,pricePercent,productionPercent:Number(form.get('productionPercent')??0),receiptDelayMonths:Number(form.get('receiptDelayMonths')??0),unitCostPercent:Number(form.get('unitCostPercent')??0)};
 if(!Number.isFinite(assumptions.productionPercent)||assumptions.productionPercent< -100||assumptions.productionPercent>1000||!Number.isInteger(assumptions.receiptDelayMonths)||assumptions.receiptDelayMonths<0||assumptions.receiptDelayMonths>12||!Number.isFinite(assumptions.unitCostPercent)||assumptions.unitCostPercent< -100||assumptions.unitCostPercent>1000)throw Error('Enter valid supply, receipt delay and cost assumptions.');
 payload.rows=scenarioRows(payload.rows,assumptions,payload.settings.unitCostMinor).map(row=>({...row,why:row.why+` Scenario ${name}: ${text(form,'reason')}`}));
 payload.scenarioAssumptions=assumptions;
 const scenarioId=await db.$transaction(async tx=>{
 const scenario=await tx.sopVersion.create({data:{organisationId:session.organisationId,cycleId:cycle.id,name,kind:'scenario',sourceRevision:version.sourceRevision,basedOnId:version.id,payload:JSON.parse(JSON.stringify(payload)),requiredCapabilities:version.requiredCapabilities,requiredModules:version.requiredModules,createdByUserId:session.userId}});
 await tx.auditEntry.create({data:{organisationId:session.organisationId,actorUserId:session.userId,action:'sop.scenario.created',entityType:'SopCycle',entityId:cycle.id,after:{name,percent,pricePercent,reason:text(form,'reason'),basedOn:version.id}}});return scenario.id;
 });revalidatePath('/sop');redirect(`/sop?cycle=${cycle.id}&version=${scenarioId}&view=scenarios`);
}
export async function promoteSopScenario(form:FormData){
 const session=await requireSession();
 assertCapability(session,'sop.manage');
 const cycle=await opened(session,text(form,'cycleId')),workspace=await getSopWorkspace(cycle.id,text(form,'versionId')),version=workspace.version;
 if(!version||version.kind!=='scenario')throw Error('Choose a private scenario to propose.');
 const reason=text(form,'reason');if(!reason||reason.length>2000)throw Error('Explain why this scenario should become the proposed consensus.');
 const proposedId=await saveDerivedConsensus(session,cycle,version,JSON.parse(JSON.stringify(version.payload)),text(form,'name')||`Proposed ${version.name}`,reason,Number(form.get('revision')));
 revalidatePath('/sop');redirect(`/sop?cycle=${cycle.id}&version=${proposedId}`);
}
export async function overrideSopDemand(form:FormData){
 const session=await requireSession();
 assertCapability(session,'sop.manage');
 const cycle=await opened(session,text(form,'cycleId')),workspace=await getSopWorkspace(cycle.id,text(form,'versionId')),version=workspace.version;
 if(!version||version.kind!=='consensus')throw Error('Choose a consensus version to revise.');
 const payload:SopPayload=JSON.parse(JSON.stringify(version.payload)),row=payload.rows.find(r=>r.productId===text(form,'productId')&&r.period===text(form,'period'));
 const quantity=Number(text(form,'quantity')),reason=text(form,'reason');
 if(!row||!text(form,'quantity')||!Number.isFinite(quantity)||quantity<row.confirmedOrders||quantity>1e12||!reason||reason.length>2000)throw Error('Choose a product month, demand at least as large as confirmed orders, and a reason.');
 const before=row.consensus;row.consensus=quantity;row.adjustment+=quantity-before;
 payload.overrides=[...(payload.overrides??[]),{productId:row.productId,period:row.period,before,after:quantity,reason,by:session.userName,at:new Date().toISOString()}];
 payload.rows=scenarioRows(payload.rows,{demandPercent:0,pricePercent:0,productionPercent:0,receiptDelayMonths:0,unitCostPercent:0},payload.settings.unitCostMinor==null?null:payload.settings.unitCostMinor*(1+(payload.scenarioAssumptions?.unitCostPercent??0)/100));
 row.why+=` Override: ${before} to ${quantity}. ${reason}`;
 const changed=payload.rows.find(r=>r.productId===row.productId&&r.period===row.period)!;changed.why=row.why;
 const proposedId=await saveDerivedConsensus(session,cycle,version,payload,text(form,'name')||`Revised ${version.name}`,reason,Number(form.get('revision')));
 revalidatePath('/sop');redirect(`/sop?cycle=${cycle.id}&version=${proposedId}&view=demand`);
}
async function saveDerivedConsensus(session:Session,cycle:Awaited<ReturnType<typeof opened>>,version:NonNullable<Awaited<ReturnType<typeof getSopWorkspace>>['version']>,payload:SopPayload,name:string,reason:string,revision:number){
 if(name.length>160)throw Error('Use a version name of at most 160 characters.');
 if(version.sourceRevision!==cycle.inputRevision)throw Error('Cycle inputs changed. Generate a fresh consensus first.');
 const current=await readBusinessPlanning(session,{startsOn:cycle.startsOn.toISOString().slice(0,10),endsOn:cycle.endsOn.toISOString().slice(0,10),historyStartsOn:cycle.startsOn.toISOString().slice(0,10),purpose:'forecast',modules:['plan'],productIds:payload.productIds,planIds:payload.sourcePlanIds});
 if(planSignature(current)!==planSignature(payload))throw Error('Connected plan inputs changed. Generate a fresh consensus first.');
 const id=crypto.randomUUID();payload.planRevisions=current.planRevisions;
 await db.$transaction(async tx=>{
  const changed=await tx.sopCycle.updateMany({where:{id:cycle.id,organisationId:session.organisationId,revision},data:{revision:{increment:1},workflow:reviewWorkflow(cycle.workflow,session.userName,id)}});if(changed.count!==1)throw Error('Another planner changed the cycle. Refresh first.');
  for(const plan of current.planRevisions){const unchanged=await tx.businessPlan.findFirst({where:{id:plan.id,organisationId:session.organisationId,revision:plan.revision},select:{id:true}});if(!unchanged)throw Error('A connected plan changed. Refresh first.');}
  await tx.sopVersion.create({data:{id,organisationId:session.organisationId,cycleId:cycle.id,name,sourceRevision:version.sourceRevision,basedOnId:version.id,payload:JSON.parse(JSON.stringify(payload)),requiredCapabilities:version.requiredCapabilities,requiredModules:version.requiredModules,createdByUserId:session.userId}});
  await tx.auditEntry.create({data:{organisationId:session.organisationId,actorUserId:session.userId,action:'sop.consensus.proposed',entityType:'SopVersion',entityId:id,after:{basedOnId:version.id,reason,name}}});
 },{isolationLevel:'Serializable'});
 return id;
}
export async function getLiveSopService(cycleId:string){
 const session=await requireSession();
 assertCapability(session,'sop.read');
 const cycle=await opened(session,cycleId);assertCapability(session,'sales.order.read');assertCapability(session,'customers.read');assertCapability(session,'logistics.shipment.read');await assertModuleEnabled(session,'logistics');
 const startsOn=cycle.startsOn.toISOString().slice(0,10),asOf=new Date().toISOString().slice(0,10),endsOn=[cycle.endsOn.toISOString().slice(0,10),monthOffset(asOf,1)+'-01'].sort().at(-1)!;
 const config=settings(cycle.settings),catalogue=config.productCodes?.length?await readBusinessPlanning(session,{startsOn,endsOn,historyStartsOn:startsOn,purpose:'forecast',modules:['products'],productCodes:config.productCodes}):null;
 const data=await readBusinessPlanning(session,{startsOn,endsOn,historyStartsOn:monthOffset(asOf,-12)+'-01',purpose:'forecast',modules:['sales','logistics','products'],productIds:catalogue?.products.map(p=>p.id),planIds:[]});
 const {serviceRows}=await import('../domain/engine');return {asOf,currency:cycle.currency,products:data.products,rows:serviceRows(data.orders,data.deliveries,asOf,settings(cycle.settings))};
}
export async function getSopComparison(cycleId:string,versionId?:string){
 const session=await requireSession();
 assertCapability(session,'sop.read');
 const workspace=await getSopWorkspace(cycleId,versionId);
 return Promise.all(workspace.versions.slice(0,8).map(async v=>{const {version}=await getSopWorkspace(cycleId,v.id);const rows=version!.payload.rows;return {id:v.id,name:v.name,kind:v.kind,revenue:rows.reduce((s,r)=>s+r.revenueMinor,0),bridge:forecastBridge(workspace.version?.payload.rows??[],rows),volume:rows.reduce((s,r)=>s+r.consensus,0),atRiskValueMinor:rows.every(r=>r.atRisk!=null)?Math.round(rows.reduce((s,r)=>s+(r.atRisk??0)*r.priceMinor,0)):null,margin:rows.every(r=>r.marginMinor!=null)?rows.reduce((s,r)=>s+(r.marginMinor??0),0):null};}));
}
export async function getSopAccuracy(cycleId:string){
 const session=await requireSession();
 assertCapability(session,'sop.read');
 assertCapability(session,'sales.order.read');assertCapability(session,'customers.read');
 const workspace=await getSopWorkspace(cycleId),cycle=workspace.cycle!;
 const asOf=new Date().toISOString().slice(0,7),data=await readBusinessPlanning(session,{startsOn:cycle.startsOn.toISOString().slice(0,10),endsOn:cycle.endsOn.toISOString().slice(0,10),historyStartsOn:cycle.startsOn.toISOString().slice(0,10),purpose:'forecast',modules:['sales'],productIds:workspace.version?.payload.productIds,planIds:[]});
 const actuals=new Map<string,number>();
 for(const o of data.orders){if(o.currency!==cycle.currency||!o.requestedOn)continue;const key=o.productId+'|'+o.requestedOn.slice(0,7);actuals.set(key,(actuals.get(key)??0)+o.quantity);}
 const versions=[];
 for(const v of workspace.versions.filter(v=>v.kind==='consensus').slice(0,24)){const {version}=await getSopWorkspace(cycleId,v.id);if(version?.payload.settings.signal==='requested')versions.push({createdOn:version.createdAt.toISOString(),rows:version.payload.rows});}
 const {forecastLagAccuracy}=await import('../domain/engine');return forecastLagAccuracy(versions,actuals,asOf);
}
