import {describe,it,expect} from 'vitest';
import {documentLinesSchema,parseTags,isExpired} from '@/modules/sales/services/document-lines';
import {validateConfirmation} from '@/modules/sales/services/confirmation-check';
import {orderWhere,quoteWhere} from '@/modules/sales/services/list-filters';
const product={productId:'sku',quantity:2,discount:12.5};
const order={customerPoReference:'PO123',externalReference:'JOB456',invoiceAddressSnapshot:{line1:'Invoice'},deliveryAddressSnapshot:{line1:'Delivery',country:'GB'},commercialSettings:{customerPoRequired:true,orderReferenceRequired:true},lines:[{type:'PRODUCT',orderedQuantity:1,cancelledQuantity:0}]};
describe('commercial document rules',()=>{
 it('retains decimal discounts alongside sections and optional products',()=>{expect(documentLinesSchema.parse([product,{type:'SECTION',description:'Installation',quantity:1,discount:0},{...product,optional:true}])[0].discount).toBe(12.5);});
 it('rejects a quotation consisting entirely of optional products',()=>{expect(()=>documentLinesSchema.parse([{...product,optional:true}])).toThrow();});
 it('normalises tags and rejects invalid or excessive tags',()=>{expect(parseTags('Priority, priority, New Business')).toEqual(['priority','new business']);expect(()=>parseTags('<script>')).toThrow();});
 it('keeps a quotation valid throughout its expiry day',()=>{expect(isExpired(new Date('2026-10-03'),new Date('2026-10-03T23:59:00Z'))).toBe(false);expect(isExpired(new Date('2026-10-02'),new Date('2026-10-03T00:00:00Z'))).toBe(true);});
 it('requires the customer PO and external reference when configured',()=>{expect(()=>validateConfirmation({...order,customerPoReference:null})).toThrow('purchase order');expect(()=>validateConfirmation({...order,externalReference:null})).toThrow('order reference');expect(()=>validateConfirmation(order)).not.toThrow();});
 it('cannot confirm an addressless or sections-only order',()=>{expect(()=>validateConfirmation({...order,deliveryAddressSnapshot:null})).toThrow('addresses');expect(()=>validateConfirmation({...order,lines:[{type:'SECTION',orderedQuantity:1,cancelledQuantity:0}]})).toThrow('active order line');});
 it('keeps all search and tag/person filters within the authenticated company',()=>{expect(orderWhere('org-a',{q:'PO',owner:'foreign-user',customer:'foreign-company',tag:'Priority'})).toMatchObject({organisationId:'org-a',ownerUserId:'foreign-user',partyId:'foreign-company',tags:{has:'priority'}});expect(quoteWhere('org-a',{q:'Widget'})).toMatchObject({organisationId:'org-a'});});
});
