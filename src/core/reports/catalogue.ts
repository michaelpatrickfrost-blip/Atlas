import type { Session } from '@/core/auth/session';
import { getImplementedModules } from '@/core/modules/registry';
import { enabledModulesForSession } from '@/core/modules/runtime';
import { canAny } from '@/core/permissions/check';
import { getAnalyticsMetrics } from '@/core/analytics/catalogue';
import { customerReports } from './customers';
import { ReportError, selectedReportColumns } from './filters';
import { REPORT_PAGE_SIZE, type ReportDataset, type ReportInput, type ReportSpec } from './types';
export async function reportDatasets(session:Session):Promise<ReportDataset[]> {
 const enabled=await enabledModulesForSession(session);
 const records=[...customerReports,...getImplementedModules().filter(m=>enabled.has(m.id)).flatMap(m=>m.reportProvider??[])].filter(d=>canAny(session,d.anyOf));
 const metrics=await getAnalyticsMetrics(session);
 // Finance exposes scoped posted-ledger metrics; broad overview counts are not export sources.
 const summaries:ReportDataset[]=metrics.filter(m=>!m.id.startsWith('finance.')||m.id.startsWith('finance.posted.')).map(m=>({id:`summary.${m.id}`,name:m.name,source:m.subject,description:`${m.definition} ${m.snapshot?'Current snapshot.':'Period runs from the selected start to now.'} ${m.grain}.`,anyOf:[m.capability],summary:true,snapshot:m.snapshot,columns:[{key:'label',label:m.unit==='money'?'Currency':'Group',type:'text'},{key:'value',label:m.unit==='money'?'Amount':m.unit==='hours'?'Hours':m.unit==='percent'?'Percent':'Value',type:m.unit==='money'?'money':'number'}],async read(s,input,exporting){
 selectedReportColumns(this,input);if(input.from||input.to||input.filters.length)throw new ReportError('Summary measures use a period and label search; field and date-range filters apply to record datasets.');if(m.snapshot && input.period!=='all')throw new ReportError('This measure is a current snapshot.');
 const since=input.period==='all'?undefined:new Date(Date.now()-Number(input.period)*86_400_000);
 const points=await m.query(s,since);const rows=points.filter(p=>p.label.toLowerCase().includes(input.search.toLowerCase())).map(p=>({label:p.label,value:m.unit==='money'?p.value/100:p.value}));if(rows.length>10_000&&exporting)throw new ReportError('Narrow this summary to 10,000 rows.',422);return {rows:exporting?rows:rows.slice((input.page-1)*REPORT_PAGE_SIZE,input.page*REPORT_PAGE_SIZE),total:rows.length};}}));
 return [...records,...summaries];
}
export function publicSpec(d:ReportDataset):ReportSpec {return {id:d.id,name:d.name,source:d.source,description:d.description,columns:d.columns,dateField:d.dateField,summary:d.summary,snapshot:d.snapshot};}
export async function loadReport(session:Session,input:ReportInput,exporting=false){
 const dataset=(await reportDatasets(session)).find(d=>d.id===input.dataset);if(!dataset)throw new ReportError('This dataset is unavailable for your account.',403);
 const columns=selectedReportColumns(dataset,input);const result=await dataset.read(session,input,exporting);
 // Do not return unselected columns to the browser or workbook.
 return {spec:publicSpec(dataset),columns,rows:result.rows.map(row=>Object.fromEntries(columns.map(c=>[c.key,row[c.key]??null]))),total:result.total,page:input.page};
}
