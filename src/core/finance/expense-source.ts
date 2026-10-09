import {getModule} from '@/core/modules/registry';
import {isModuleEnabled} from '@/core/modules/runtime';
import type {Session} from '@/core/auth/session';
export type ApprovedExpenseSource={id:string;amountMinorUnits:number;currency:string;category:string;description:string|null;incurredOn:Date;approverUserId:string|null;employeeUserId:string|null;department:string|null};
export async function approvedExpenseSource(session:Session,claimId:string){if(!(await isModuleEnabled(session,'people')))throw new Error('HR expense source is disabled.');const provider=getModule('people')?.expensePostingSourceProvider;if(!provider)throw new Error('HR expense posting source is unavailable.');return provider(claimId);}
