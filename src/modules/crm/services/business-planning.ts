import { db } from '@/core/db/client';
import type { BusinessPlanningProvider,PlanningSource } from '@/core/planning/business';
import { ownerRestriction } from './visibility';
export const crmBusinessPlanning:BusinessPlanningProvider=async(session,request)=>{
 if(!session.capabilities.has('sales.opportunity.read'))return {requiredCapabilities:[]};
 const ownerUserId=ownerRestriction(session),organisationId=session.organisationId;
 const where={organisationId,...(ownerUserId?{ownerUserId}:{}),...(request.sourceIds?{id:{in:request.sourceIds}}:{}),...(request.search?{name:{contains:request.search,mode:'insensitive' as const}}:{})};
 const [projects,opportunities]=await Promise.all([
  db.salesProject.findMany({where:{...where,...(request.sourceIds?{}:{stage:{notIn:['LOST','CANCELLED','COMPLETED'] as const}})},select:{id:true,reference:true,name:true,stage:true,probability:true,potentialValueAmount:true,potentialValueCurrency:true,expectedStartDate:true,expectedCompletionDate:true},orderBy:{name:'asc'},take:501}),
  db.opportunity.findMany({where:{...where,...(request.sourceIds?{}:{status:'OPEN' as const})},select:{id:true,name:true,status:true,probability:true,valueAmount:true,valueCurrency:true,expectedCloseDate:true,stage:{select:{defaultProbability:true}}},orderBy:{name:'asc'},take:501})
 ]);
 const sources:PlanningSource[]=[...projects.slice(0,500).map(p=>({module:'crm',type:'sales-project',id:p.id,label:`${p.reference} · ${p.name}`,href:`/sales/projects/${p.id}`,capability:'sales.opportunity.read',active:!['LOST','CANCELLED','COMPLETED'].includes(p.stage),probability:p.probability??0,currency:p.potentialValueCurrency,valueMinor:p.potentialValueAmount??undefined,startsOn:p.expectedStartDate?.toISOString().slice(0,10),endsOn:p.expectedCompletionDate?.toISOString().slice(0,10)})),...opportunities.slice(0,500).map(o=>({module:'crm',type:'opportunity',id:o.id,label:o.name,href:`/crm/opportunities/${o.id}`,capability:'sales.opportunity.read',active:o.status!=='LOST',probability:o.probability??o.stage.defaultProbability,currency:o.valueCurrency,valueMinor:o.valueAmount,startsOn:o.expectedCloseDate?.toISOString().slice(0,10)}))];
 return {sources,requiredCapabilities:['sales.opportunity.read'],warnings:projects.length>500||opportunities.length>500?['Commercial source picker: search to narrow more than 500 matches.']:[]};
};
