import { getSession } from '@/core/auth/session';
import { assertCapability } from '@/core/permissions/check';
import { loadReport } from '@/core/reports/catalogue';
import { parseReportInput, ReportError } from '@/core/reports/filters';
import { reportWorkbook } from '@/core/reports/workbook';
import { writeAudit } from '@/core/audit/log';
export const runtime='nodejs';
export async function GET(request:Request){
 const session=await getSession();const headers={'Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff'};
 if(!session)return Response.json({error:'Sign in to view reports.'},{status:401,headers});
 try{
 assertCapability(session,'core.profile.self');const params=new URL(request.url).searchParams;const input=parseReportInput(params);const exporting=params.get('download')==='xlsx';
 if(params.has('download')&&!exporting)throw new ReportError('Choose an Excel download.');
 const result=await loadReport(session,input,exporting);
 if(!exporting)return Response.json(result,{headers});
 const workbook=await reportWorkbook(result,input,session.organisationName);
 await writeAudit({organisationId:session.organisationId,actorUserId:session.userId,action:'reports.exported',entityType:'ReportDataset',entityId:result.spec.id,after:{rows:result.total,columns:result.columns.map(c=>c.key),filterCount:input.filters.length,hasSearch:!!input.search,from:input.from||null,to:input.to||null,period:input.period}});
 return new Response(workbook,{headers:{...headers,'Content-Type':'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet','Content-Disposition':`attachment; filename="atlas-${result.spec.id.replace(/[^a-z0-9.-]/gi,'-')}-${new Date().toISOString().slice(0,10)}.xlsx"`}});
 }catch(error){if(error instanceof ReportError)return Response.json({error:error.message},{status:error.status,headers});if(error instanceof Error&&error.message.startsWith('FORBIDDEN'))return Response.json({error:'You do not have access to these reports.'},{status:403,headers});console.error('Reports request failed',error instanceof Error?error.name:'Unknown');return Response.json({error:'The report could not be loaded. Please try again.'},{status:500,headers});}
}
