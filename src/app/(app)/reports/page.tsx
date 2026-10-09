import { redirect } from 'next/navigation';
import { getSession } from '@/core/auth/session';
import { assertCapability } from '@/core/permissions/check';
import { reportDatasets, publicSpec, loadReport } from '@/core/reports/catalogue';
import { ReportsWorkspace } from '@/modules/reports/workspace';
export default async function ReportsPage({searchParams}:{searchParams:Promise<{dataset?:string}>}){
 const session=await getSession();if(!session)redirect('/login');assertCapability(session,'core.profile.self');
 const datasets=(await reportDatasets(session)).map(publicSpec);
 const params=await searchParams;
 const selected=datasets.find(d=>d.id===params.dataset)??datasets[0];
 let result=null,error='';
 if(selected)try{result=await loadReport(session,{dataset:selected.id,search:'',from:'',to:'',period:'all',filters:[],columns:selected.columns.map(c=>c.key),page:1});}catch{error='The report could not be loaded. Try applying your filters again.';}
 return <ReportsWorkspace datasets={datasets} company={session.organisationName} initialResult={result} initialError={error}/>;
}
