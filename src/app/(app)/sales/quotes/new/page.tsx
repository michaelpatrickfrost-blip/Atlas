import { requireSession } from "@/core/auth/session";
import { assertCapability } from "@/core/permissions/check";
import { getDocumentData } from "@/modules/sales/services/document-data";
import {resumeWorkingDraft} from "@/modules/sales/services/working-drafts";
import { DocumentComposer } from "@/modules/sales/components/document-composer";
export default async function NewQuote({searchParams}:{searchParams:Promise<{customer?:string;opportunity?:string;draft?:string}>}) {const session=await requireSession();assertCapability(session,'sales.quote.create');const params=await searchParams;return <DocumentComposer key={params.draft??'new'} workingDraftId={params.draft??crypto.randomUUID()} draft={params.draft?await resumeWorkingDraft(session,params.draft):undefined} mode="quote" initialCustomer={params.customer} initialOpportunity={params.opportunity} data={await getDocumentData(session)}/>;}
