import {db} from '@/core/db/client';
import {validateConfirmation} from './confirmation-check';
import {checkOrderCredit} from './credit-check';
import {requiresApproval} from './order-approval-rules';
import {resolveStandardUkVat} from './tax-check';
export type OrderCheck={label:string;detail:string;level:'pass'|'warning'|'approval'|'block'|'info'};
export async function getOrderChecks(organisationId:string,orderId:string,showCreditDetails:boolean){
 const order=await db.salesOrder.findFirstOrThrow({where:{id:orderId,organisationId},include:{party:{include:{commercialSettings:true}},lines:true,approvals:true}}),checks:OrderCheck[]=[];
 try{validateConfirmation({...order,commercialSettings:order.party.commercialSettings});checks.push({label:'Customer references & addresses',detail:'Required references and transaction addresses are complete.',level:'pass'});}catch(error){checks.push({label:'Customer references & addresses',detail:error instanceof Error?error.message:'Review required details.',level:'block'});}
 checks.push({label:'Customer account',detail:order.party.status==='ACTIVE'?'Active customer account.':order.party.status==='PROSPECT'?'First-order customer: review the commercial account setup.':'Customer account is unavailable for new sales.',level:order.party.status==='ACTIVE'?'pass':order.party.status==='PROSPECT'?'warning':'block'});
 let taxIssue=false;for(const l of order.lines.filter(l=>!['SECTION','NOTE'].includes(l.type))){const result=await resolveStandardUkVat({sellingOrganisationId:organisationId,partyId:order.partyId,deliveryCountry:(order.deliveryAddressSnapshot as {country?:string}|null)?.country??null,productTaxCategory:l.taxCategory,transactionDate:new Date(),netAmount:l.netAmount});if(result.treatment==='UNDETERMINED'||result.amount!==l.taxAmount)taxIssue=true;}
 checks.push({label:'Tax',detail:taxIssue?'Tax treatment or saved totals require review.':'Saved tax totals match the supported tax treatment.',level:taxIssue?'block':'pass'});
 const credit=showCreditDetails?await checkOrderCredit(orderId):{status:'OK',explanation:'Credit is checked securely on the data service when confirming.'};checks.push({label:'Credit',detail:credit.explanation,level:credit.status==='HOLD'?'block':credit.status==='WARNING'?'warning':'pass'});
 const policy=await db.organisation.findUniqueOrThrow({where:{id:organisationId},select:{salesPolicy:true}}),approval=requiresApproval(order,order.lines,policy.salesPolicy);checks.push({label:'Commercial approval',detail:approval??'Within the configured value and discount authority.',level:approval&&!order.approvals.some(a=>a.status==='APPROVED'&&a.revision===order.revision)?'approval':'pass'});
 if(order.customerPoReference){const duplicate=await db.salesOrder.findFirst({where:{organisationId,partyId:order.partyId,id:{not:orderId},customerPoReference:{equals:order.customerPoReference,mode:'insensitive'}},select:{reference:true}});if(duplicate)checks.push({label:'Duplicate customer PO',detail:`This PO also appears on ${duplicate.reference}. Check that this is intentional.`,level:'warning'});}
 const waiting=order.lines.filter(l=>l.invoiceWhenInStock).length;checks.push({label:'Supply & fulfilment',detail:waiting?`${waiting} line${waiting===1?'':'s'} out of stock on this confirmation. The balance stays open. A delivery is raised when stock is back, and the invoice follows it.`:'Supply verification pending. Check stock and dispatch availability before promising delivery.',level:waiting?'warning':'info'});
 return checks;
}
