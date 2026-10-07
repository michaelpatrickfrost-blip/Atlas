import {redirect} from 'next/navigation';
import {requireSession} from '@/core/auth/session';
import {can} from '@/core/permissions/check';
export default async function CRMHome() {
 const session=await requireSession();
 redirect(can(session,'sales.opportunity.read')?'/crm/today':can(session,'core.contract.manage')?'/crm/contracts':'/crm/agreements');
}
