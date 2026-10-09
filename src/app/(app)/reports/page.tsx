import { requireSession } from '@/core/auth/session';
import { assertCapability } from '@/core/permissions/check';
import { reportDatasets, publicSpec, loadReport } from '@/core/reports/catalogue';
import { ReportsWorkspace } from '@/modules/reports/workspace';
export default async function ReportsPage(){
 const session=await requireSession();assertCapability(session,'core.profile.self');
 const datasets=(await reportDatasets(session)).map(publicSpec);
 let result=null,error='';
 if(datasets[0])try{result=await loadReport(session,{dataset:datasets[0].id,search:'',from:'',to:'',period:'all',filters:[],columns:datasets[0].columns.map(c=>c.key),page:1});}catch{error='The report could not be loaded. Try applying your filters again.';}
 return <ReportsWorkspace datasets={datasets} company={session.organisationName} initialResult={result} initialError={error}/>;
}
