import {requireSession} from '@/core/auth/session';
import {assertCapability} from '@/core/permissions/check';
import {getDocumentData} from '@/modules/sales/services/document-data';
import {getEditableDraft} from '@/modules/sales/services/draft-data';
import {DocumentComposer} from '@/modules/sales/components/document-composer';
export default async function EditQuote({params}:{params:Promise<{quoteId:string}>}){const session=await requireSession();assertCapability(session,'sales.quote.create');const {quoteId}=await params;return <DocumentComposer workingDraftId={crypto.randomUUID()} mode="quote" data={await getDocumentData(session)} draft={await getEditableDraft(session.organisationId,quoteId,'quote')}/>;}
