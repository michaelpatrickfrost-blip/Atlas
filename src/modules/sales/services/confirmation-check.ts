export function validateConfirmation(order:{customerPoReference:string|null;externalReference:string|null;invoiceAddressSnapshot:unknown;deliveryAddressSnapshot:unknown;commercialSettings?:{customerPoRequired:boolean;orderReferenceRequired:boolean}|null;lines:{type:string;orderedQuantity:number;cancelledQuantity:number}[]}){
 if(!order.lines.some(l=>!['SECTION','NOTE'].includes(l.type)&&l.orderedQuantity>l.cancelledQuantity))throw new Error('Add at least one active order line.');
 if(order.commercialSettings?.customerPoRequired&&!order.customerPoReference?.trim())throw new Error('This customer requires a purchase order number.');
 if(order.commercialSettings?.orderReferenceRequired&&!order.externalReference?.trim())throw new Error('This customer requires an order reference.');
 const invoice=order.invoiceAddressSnapshot as {line1?:string}|null,delivery=order.deliveryAddressSnapshot as {line1?:string;country?:string}|null;
 if(!invoice?.line1||!delivery?.line1||!delivery.country)throw new Error('Choose complete invoice and delivery addresses before confirmation.');
}
