import {requireSession} from '@/core/auth/session';
import {assertCapability} from '@/core/permissions/check';
import {financeChoices} from '@/modules/finance/services/queries';
import {documentCapability} from '@/modules/finance/services/access';
import {DOCUMENT_KINDS} from '@/modules/finance/domain/controls';
import {DocumentEditor} from '@/modules/finance/components/document-editor';
export default async function New(){const session=await requireSession();assertCapability(session,'finance.overview.read');const choices=await financeChoices(),kinds=DOCUMENT_KINDS.filter(k=>k!=='RECEIPT'&&session.capabilities.has(documentCapability(k,true)));return <div className="mx-auto max-w-5xl space-y-6"><div><p className="text-xs uppercase tracking-wider text-emerald-700">Finance</p><h1 className="mt-2 text-2xl font-semibold">Create a financial document</h1><p className="mt-2 text-sm text-slate-500">Start with a draft. Approval and posting remain separate steps.</p></div>{!choices.entities.length?<p>Configure a legal entity from Finance Overview first.</p>:!kinds.length?<p>Your profile does not have document creation permission.</p>:<DocumentEditor choices={choices} allowedKinds={kinds}/>}</div>;}
