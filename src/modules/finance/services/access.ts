import type {Session} from '@/core/auth/session';
import type {Prisma} from '@/generated/prisma/client';
import {assertCapability} from '@/core/permissions/check';
import {assertModuleEnabled} from '@/core/modules/access';
import {projectScope} from '@/core/permissions/work-access';
export async function requireFinance(session:Session,capability:string){assertCapability(session,capability);await assertModuleEnabled(session,'finance');}
export function documentCapability(kind:string,write=false){return kind==='REQUEST'?(write?'finance.request.create':'finance.spend.read'):kind==='EXPENSE'?(write?'finance.expense.create':'finance.spend.read'):['PO','RECEIPT'].includes(kind)?`finance.purchase.${write?'manage':'read'}`:kind.startsWith('AP_')?`finance.payables.${write?'manage':'read'}`:`finance.receivables.${write?'manage':'read'}`;}
export function documentScope(session:Session):Prisma.FinanceDocumentWhereInput{
 const kinds:string[]=[];if(session.capabilities.has('finance.purchase.read'))kinds.push('PO','RECEIPT');if(session.capabilities.has('finance.payables.read'))kinds.push('AP_INVOICE','AP_CREDIT','AP_DEBIT');if(session.capabilities.has('finance.receivables.read'))kinds.push('AR_INVOICE','AR_CREDIT','AR_DEBIT');if(session.capabilities.has('finance.spend.read'))kinds.push('REQUEST','EXPENSE');
 const project=session.capabilities.has('projects.read')?{project:projectScope(session)}:{projectId:null};
 const serviceCredit=session.capabilities.has('finance.overview.read')||session.capabilities.has('finance.receivables.read')||session.capabilities.has('finance.approval.decide');
 return {organisationId:session.organisationId,AND:[{OR:[{projectId:null},project]},{OR:[{kind:{in:kinds}},{kind:'REQUEST',creatorUserId:session.userId,...(!session.capabilities.has('finance.request.create')?{id:'__denied__'}:{})},{kind:'EXPENSE',creatorUserId:session.userId,...(!session.capabilities.has('finance.expense.create')?{id:'__denied__'}:{})},...(serviceCredit?[{kind:'AR_CREDIT',category:'SERVICE_CREDIT'}]:[])]}]};
}
