import type {Session} from '@/core/auth/session';
import type {Prisma} from '@/generated/prisma/client';
import type {SalesFinanceSource} from '@/core/finance/connections';
import {assertCapability} from '@/core/permissions/check';
export async function financeSource(session:Session,tx:Prisma.TransactionClient,id:string):Promise<SalesFinanceSource>{
 assertCapability(session,'sales.order.read');
 const order=await tx.salesOrder.findFirstOrThrow({where:{id,organisationId:session.organisationId,commercialStatus:'CONFIRMED'},include:{lines:{orderBy:{lineNumber:'asc'}},paymentTerm:true,holds:{where:{releasedAt:null}}}});
 if(['BLANKET','INTERNAL'].includes(order.orderType))throw new Error('Blanket/internal orders cannot create customer invoices; invoice the confirmed commercial call-off instead.');if(order.holds.length)throw new Error('Resolve Sales holds before invoicing.');
 if(!await tx.salesOrderRevision.findUnique({where:{orderId_revision:{orderId:id,revision:order.revision}}}))throw new Error('The confirmed commercial revision is missing.');
 const lines=order.lines.filter(l=>['PRODUCT','SERVICE','CHARGE','DISCOUNT'].includes(l.type)&&l.orderedQuantity>l.cancelledQuantity).map(l=>({id:l.id,productId:l.productId,description:l.descriptionSnapshot,quantity:l.orderedQuantity-l.cancelledQuantity,unitPrice:BigInt(l.unitPriceAmount),net:BigInt(l.netAmount),tax:BigInt(l.taxAmount),taxCategory:l.taxCategory}));
 if(lines.some(l=>l.net<0n||l.tax<0n))throw new Error('Allocate separate discount lines to sale lines before invoicing.');const net=lines.reduce((s,l)=>s+l.net,0n),tax=lines.reduce((s,l)=>s+l.tax,0n);if(net!==BigInt(order.netAmount)||tax!==BigInt(order.taxAmount)||net+tax!==BigInt(order.grossAmount)||net+tax<=0n)throw new Error('Sales line totals do not reconcile to the confirmed order.');
 return {id,revision:order.revision,reference:order.reference,partyId:order.partyId,currency:order.currency,paymentDays:order.paymentTerm?.days??0,net,tax,gross:net+tax,instructions:order.financeInstructions,lines};
}
