import {db} from '@/core/db/client';
import {requireSession} from '@/core/auth/session';
import {assertCapability} from '@/core/permissions/check';
import {getDocumentData} from '@/modules/sales/services/document-data';
import {resumeWorkingDraft} from '@/modules/sales/services/working-drafts';
import {DocumentComposer} from '@/modules/sales/components/document-composer';
export default async function NewOrder({searchParams}:{searchParams:Promise<{draft?:string;customer?:string;opportunity?:string;agreement?:string;type?:string;salesProject?:string;projectId?:string}>}){const session=await requireSession();assertCapability(session,'sales.order.create');const params=await searchParams;const site=params.projectId?await db.project.findFirst({where:{id:params.projectId,organisationId:session.organisationId},select:{id:true,partyId:true}}):null;return <DocumentComposer key={params.draft??params.agreement??'new'} mode="order" workingDraftId={params.draft??crypto.randomUUID()} draft={params.draft?await resumeWorkingDraft(session,params.draft):undefined} initialCustomer={params.customer??site?.partyId??undefined} initialProject={site?.id} initialOpportunity={params.opportunity} initialSalesProject={params.salesProject} initialOrderType={params.type==='calloff'?'CALL_OFF':params.type==='project'?'PROJECT':'STANDARD'} data={await getDocumentData(session)}/>;}
