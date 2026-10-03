import {requireSession} from '@/core/auth/session';
import {assertCapability} from '@/core/permissions/check';
import {SalesAuditTrail} from '@/modules/sales/components/audit-trail';
export default async function SalesAudit(){const session=await requireSession();assertCapability(session,'core.audit.read');return <div className="space-y-5"><h2 className="text-2xl font-semibold">Sales audit trail</h2><p className="text-sm text-slate-500">Read-only history of commercial documents and sales changes.</p><section className="rounded-2xl border border-slate-200 bg-white p-6"><SalesAuditTrail organisationId={session.organisationId}/></section></div>;}
