import {requireSession} from '@/core/auth/session';
import {assertCapability} from '@/core/permissions/check';
import {assertModuleEnabled} from '@/core/modules/access';
import {db} from '@/core/db/client';
import {buildQuotePdf} from '@/modules/sales/services/quote-pdf';
export async function GET(request:Request,{params}:{params:Promise<{quoteId:string}>}){
 const session=await requireSession();
 assertCapability(session,'sales.quote.read');
 await assertModuleEnabled(session,'sales');
 const {quoteId}=await params;
 const q=await db.quote.findFirst({where:{id:quoteId,organisationId:session.organisationId},include:{party:true,organisation:true,paymentTerm:true,lines:{include:{product:{select:{code:true}}},orderBy:{lineNumber:'asc'}}}});
 if(!q)return new Response('Quotation not found',{status:404});
 const bytes=await buildQuotePdf({notes:q.customerNotes,reference:q.reference,organisationName:q.organisation.name,customerName:q.party.name,customerCode:q.party.customerCode,status:q.status,createdAt:q.createdAt,expiryDate:q.expiryDate,customerPoReference:q.customerPoReference,paymentTerms:q.paymentTerm?.name??null,currency:q.totalCurrency,invoiceAddress:q.invoiceAddressSnapshot,deliveryAddress:q.deliveryAddressSnapshot,netAmount:q.netAmount,taxAmount:q.taxAmount,totalAmount:q.totalAmount,lines:q.lines.map(l=>({...l,code:l.product?.code??null}))});
 const name=q.reference.replace(/[^a-zA-Z0-9_-]/g,'_');
 return new Response(Buffer.from(bytes),{headers:{'Content-Type':'application/pdf','Content-Disposition':`${new URL(request.url).searchParams.get('preview')==='1'?'inline':'attachment'}; filename="${name}.pdf"`,'Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff'}});
}
