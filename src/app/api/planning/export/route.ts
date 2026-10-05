import { requireSession } from '@/core/auth/session';
import { assertCapability } from '@/core/permissions/check';
import { getPlanningCoverage } from '@/modules/planning/services/queries';
import { listProductionPlans,getProductionPlan,getAssignedPlanningWork } from '@/modules/planning/services/plans';
import { csvResponse } from '@/core/shared/csv-export';
export async function GET(request:Request) {
 try {
  const session=await requireSession();assertCapability(session,'planning.demand.read');
  const params=new URL(request.url).searchParams,type=params.get('type')??'demand';
  if(type==='teams'){const work=await getAssignedPlanningWork(params.get('team')??undefined);return csvResponse('atlas-team-work.csv',[['SKU','Product','Plan','Target quantity','Unit','Starts','Ends','Team','Responsible'],...work.map(l=>[l.code,l.name,l.planName,l.quantity,l.unitOfMeasure,l.startsOn,l.endsOn,l.teamName,l.assignedName])],request);}
  if(type==='plans') {const plans=await listProductionPlans();return csvResponse('atlas-production-plans.csv',[['Plan','Starts','Ends','Interval','Work lines','Version'],...plans.map(p=>[p.name,p.startsOn,p.endsOn,p.bucket,p.lineCount,p.version])],request);}
  if(type==='work') {const plan=await getProductionPlan(params.get('plan')??'');if(!plan)return Response.json({error:'Plan not found.'},{status:404});return csvResponse('atlas-planned-work.csv',[['Plan','SKU','Product','Quantity','Unit','Starts','Ends','Team','Responsible','Work notes'],...plan.lines.map(l=>[plan.name,l.code,l.name,l.quantity,l.unitOfMeasure,l.startsOn,l.endsOn,l.teamName??'',l.assignedName??'',l.notes??''])],request);}
  if(type!=='demand')return Response.json({error:'Unknown export.'},{status:400});
  const q=(params.get('q')??'').toLowerCase(),view=params.get('view');const coverage=(await getPlanningCoverage()).filter(p=>(!q||`${p.name} ${p.code} ${p.orders.map(o=>o.reference).join(' ')}`.toLowerCase().includes(q))&&(view==='shortages'?p.shortage>0:view==='units'?p.unitConflicts>0:true));return csvResponse('atlas-production-demand.csv',[['SKU','Product','Stock unit','On hand','Incoming production','Still to deliver','Forecasted stock','Still short','Unit conflicts'],...coverage.map(p=>[p.code,p.name,p.unitOfMeasure,p.onHand,p.incoming,p.demand,p.forecasted,p.shortage,p.unitConflicts])],request);
 }catch(error){const message=error instanceof Error?error.message:'Export failed.';return Response.json({error:message},{status:message.includes('UNAUTHENTICATED')?401:message.includes('FORBIDDEN')?403:400,headers:{'Cache-Control':'no-store'}});}
}
