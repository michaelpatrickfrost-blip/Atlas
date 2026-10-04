"use server";
import {requireSession} from '@/core/auth/session';
import {assertCapability} from '@/core/permissions/check';
import {assertModuleEnabled} from '@/core/modules/access';
import {db} from '@/core/db/client';
export async function getApprovedExpenseSource(claimId:string){
 const session=await requireSession();
 assertCapability(session,'people.expense.read');
 await assertModuleEnabled(session,'people');const claim=await db.expenseClaim.findFirstOrThrow({where:{id:claimId,organisationId:session.organisationId,status:'APPROVED'},include:{employee:{select:{userId:true,department:true}}}});if(!claim.approverUserId||claim.approverUserId===claim.employee.userId)throw new Error('Expense lacks independent approval evidence.');return {id:claim.id,amountMinorUnits:claim.amountMinorUnits,currency:claim.currency,category:claim.category,description:claim.description,incurredOn:claim.incurredOn,approverUserId:claim.approverUserId,employeeUserId:claim.employee.userId,department:claim.employee.department};
}
