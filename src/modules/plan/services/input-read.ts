import { db } from '@/core/db/client';
import { planWhere } from '../domain/access';
import { readBusinessPlanning } from '@/core/planning/business-read';
import type { BusinessPlanningProvider } from '@/core/planning/business';
export const planBusinessPlanning:BusinessPlanningProvider=async(session,request)=>{
 if(request.purpose==='picker'||!request.planIds?.length||!session.capabilities.has('plan.read'))return {requiredCapabilities:[]};
 const plans=await db.businessPlan.findMany({where:{id:{in:request.planIds},...planWhere(session)},select:{id:true,name:true,currency:true,revision:true,versions:{where:{OR:[{kind:'baseline',status:'approved'},{kind:'forecast'}]},select:{id:true,kind:true,status:true}}}});
 if(plans.length!==new Set(request.planIds).size)throw Error('One of the linked plans is no longer available.');
 const rows=await db.planInput.findMany({where:{organisationId:session.organisationId,planId:{in:plans.map(p=>p.id)},included:true,...(request.productIds?{productId:{in:request.productIds}}:{})},take:5001});
 if(rows.length>5000)throw Error('Select fewer plan inputs.');
 const targetVersions=plans.flatMap(p=>{const version=p.versions.find(v=>v.kind==='baseline'&&v.status==='approved')??p.versions.find(v=>v.kind==='forecast');return version?[{plan:p,versionId:version.id}]:[];});
 const cells=await db.planCell.findMany({where:{organisationId:session.organisationId,planId:{in:plans.map(p=>p.id)},versionId:{in:targetVersions.map(v=>v.versionId)},metricKey:'revenue',kind:'plan',dimensionKey:''},take:5001});if(cells.length>5000)throw Error('Too many selected target periods.');
 const targets=cells.map(c=>{const plan=plans.find(p=>p.id===c.planId)!;return {planId:plan.id,planName:plan.name,periodKey:c.periodKey,metricKey:c.metricKey,value:Number(c.value),currency:plan.currency,versionId:c.versionId};});
 const linked=rows.filter(r=>r.sourceType!=='manual');
 const data=await readBusinessPlanning(session,{...request,modules:[...new Set(linked.map(r=>r.sourceModule))],purpose:'picker',sourceIds:[...new Set(linked.map(r=>r.sourceId))]});
 const sources=new Map(data.sources.map(s=>[`${s.module}|${s.type}|${s.id}`,s]));
 const caps=new Set(['plan.read']);
 for(const row of linked){const source=sources.get(`${row.sourceModule}|${row.sourceType}|${row.sourceId}`);if(!source)throw Error('A linked plan contains a source you cannot currently read. Ask its owner to remove that input or use an authorised plan.');caps.add(source.capability);}
 return {warnings:linked.filter(r=>sources.get(`${r.sourceModule}|${r.sourceType}|${r.sourceId}`)?.active===false).map(r=>`${r.label}: linked commercial source is lost or inactive and is excluded from fresh demand.`),targets,planRevisions:plans.map(p=>({id:p.id,revision:p.revision})),inputs:rows.map(r=>({id:r.id,planId:r.planId,label:r.label,sourceModule:r.sourceModule,sourceType:r.sourceType,sourceId:r.sourceId,productId:r.productId,metricKey:r.metricKey,periodKey:r.periodKey,value:Number(r.value),probability:r.probabilityOverride?Number(r.probability):sources.get(`${r.sourceModule}|${r.sourceType}|${r.sourceId}`)?.probability??Number(r.probability),sourceInactive:sources.get(`${r.sourceModule}|${r.sourceType}|${r.sourceId}`)?.active===false,sourceProbability:sources.get(`${r.sourceModule}|${r.sourceType}|${r.sourceId}`)?.probability,unitPriceMinor:r.unitPriceMinor,note:r.note})),requiredCapabilities:[...caps]};
};
