'use server';
import {requireSession} from '@/core/auth/session';
import {assertCapability} from '@/core/permissions/check';
import {assertModuleEnabled} from '@/core/modules/access';
import {getModule} from '@/core/modules/registry';
import {redirect} from 'next/navigation';
export async function requestSalesInvoice(orderId:string,form:FormData){
 const session=await requireSession();
 assertCapability(session,'finance.receivables.manage');
 assertCapability(session,'sales.order.read');await assertModuleEnabled(session,'finance');await assertModuleEnabled(session,'sales');const provider=getModule('finance')?.salesInvoiceGenerator;if(!provider)throw new Error('Finance invoice generation is unavailable.');const invoice=await provider(orderId,form);redirect(`/finance/documents/${invoice.id}`);
}
