import {requireSession} from '@/core/auth/session';
import {assertCapability} from '@/core/permissions/check';
import {getDocumentData} from '@/modules/sales/services/document-data';
import {getEditableDraft} from '@/modules/sales/services/draft-data';
import {DocumentComposer} from '@/modules/sales/components/document-composer';
export default async function EditOrder({params}:{params:Promise<{orderId:string}>}){const session=await requireSession();assertCapability(session,'sales.order.edit_draft');const {orderId}=await params;return <DocumentComposer workingDraftId={crypto.randomUUID()} mode="order" data={await getDocumentData(session)} draft={await getEditableDraft(session.organisationId,orderId,'order')}/>;}
