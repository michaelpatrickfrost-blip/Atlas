import {requireSession} from '@/core/auth/session';
import {assertCapability} from '@/core/permissions/check';
import {assertModuleEnabled} from '@/core/modules/access';
import {db} from '@/core/db/client';
import {documentBrandFrom} from '@/core/documents/company-brand';
import {buildQuotePdf} from '@/modules/sales/services/quote-pdf';
import {presentationTotals} from '@/modules/sales/domain/uk-sale';
import {supplyNotesForLines} from '@/modules/sales/services/supply-notes';
export async function GET(request:Request,{params}:{params:Promise<{orderId:string}>}){
 const session=await requireSession();
 assertCapability(session,'sales.order.read');
 await assertModuleEnabled(session,'sales');
 const {orderId}=await params;
 const o=await db.salesOrder.findFirst({where:{id:orderId,organisationId:session.organisationId},include:{party:true,organisation:true,paymentTerm:true,lines:{include:{product:{select:{code:true,kind:true}}},orderBy:{lineNumber:'asc'}}}});
 if(!o)return new Response('Order not found',{status:404});
 const presentation=presentationTotals({lines:o.lines.map(l=>({type:l.type,unitAmount:l.unitPriceAmount,quantity:l.orderedQuantity-l.cancelledQuantity,discountPercent:l.discountPercent??0})),netAmount:o.netAmount,headerDiscountPercent:o.headerDiscountPercent,deliveryCountry:(o.deliveryAddressSnapshot as {country?:string}|null)?.country??null});
 const supplyNotes=await supplyNotesForLines(o.lines.map(l=>({id:l.id,productId:l.productId,quantity:l.orderedQuantity-l.cancelledQuantity,invoiceWhenInStock:l.invoiceWhenInStock,kind:l.product?.kind??null})));
 const bytes=await buildQuotePdf({brand:documentBrandFrom(o.organisation),documentType:'Order acknowledgement',requestedDeliveryDate:o.requestedDeliveryDate,promisedDeliveryDate:o.promisedDeliveryDate,notes:o.customerNotes,reference:o.reference,organisationName:o.organisation.name,customerName:o.party.name,customerCode:o.party.customerCode,status:o.commercialStatus,createdAt:o.orderDate,expiryDate:null,customerPoReference:o.customerPoReference,paymentTerms:o.paymentTerm?.name??null,currency:o.currency,invoiceAddress:o.invoiceAddressSnapshot,deliveryAddress:o.deliveryAddressSnapshot,netAmount:o.netAmount,taxAmount:o.taxAmount,totalAmount:o.grossAmount,overallDiscount:presentation.overallDiscount,vatLabel:presentation.vatLabel,lines:o.lines.map(l=>({type:l.type,description:l.descriptionSnapshot,code:l.product?.code??null,quantity:l.orderedQuantity-l.cancelledQuantity,unitAmount:l.unitPriceAmount,discountPercent:l.discountPercent??0,netAmount:l.netAmount,taxAmount:l.taxAmount,supplyNote:supplyNotes.get(l.id)??null}))});
 const name=o.reference.replace(/[^a-zA-Z0-9_-]/g,'_');
 return new Response(Buffer.from(bytes),{headers:{'Content-Type':'application/pdf','Content-Disposition':`${new URL(request.url).searchParams.get('preview')==='1'?'inline':'attachment'}; filename="${name}.pdf"`,'Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff'}});
}
