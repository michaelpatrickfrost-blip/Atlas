import {db} from '@/core/db/client';
import { requireSession } from "@/core/auth/session";
import { assertCapability } from "@/core/permissions/check";
import { getDocumentData } from "@/modules/sales/services/document-data";
import {resumeWorkingDraft} from "@/modules/sales/services/working-drafts";
import { DocumentComposer } from "@/modules/sales/components/document-composer";
export default async function NewQuote({searchParams}:{searchParams:Promise<{customer?:string;opportunity?:string;draft?:string;kind?:string;projectId?:string;salesProject?:string}>}) {const session=await requireSession();assertCapability(session,'sales.quote.create');const params=await searchParams;const site=params.projectId?await db.project.findFirst({where:{id:params.projectId,organisationId:session.organisationId},select:{id:true,partyId:true}}):null;return <DocumentComposer key={params.draft??'new'} workingDraftId={params.draft??crypto.randomUUID()} draft={params.draft?await resumeWorkingDraft(session,params.draft):undefined} mode="quote" initialCustomer={params.customer??site?.partyId??undefined} initialProject={site?.id} initialOpportunity={params.opportunity} initialSalesProject={params.salesProject} initialKind={params.kind==='blanket'?'BLANKET':'STANDARD'} data={await getDocumentData(session)}/>;}
