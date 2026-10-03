"use server";
import {assertRecordCreationAllowed} from "@/core/policies/record-creation";
import { requireSession } from "@/core/auth/session";
import { assertCapability } from "@/core/permissions/check";
import { db } from "@/core/db/client";
import { parseCsv } from "@/core/shared/csv";
import { revalidatePath } from "next/cache";
export type ImportResult={error:string;message:string;preview:Record<string,string>[]};
function capability(form:FormData) {const entity=String(form.get('entity'));const caps:Record<string,string>={customers:'customers.create',products:'core.products.manage',prices:'core.pricing.manage'};if(!caps[entity])throw new Error('Choose a supported import.');return caps[entity];}
export async function importCsv(_state:ImportResult,form:FormData):Promise<ImportResult> {
 const session=await requireSession();
 assertCapability(session,capability(form));
 try {
 const entity=String(form.get('entity')),file=form.get('file');
 if(!(file instanceof File)||file.size>2_000_000)throw new Error('Choose a CSV file smaller than 2 MB.');
 const rows=parseCsv(await file.text());
 const keys=new Set<string>();
 for(const [index,row]of rows.entries()) {
  const key=entity==='customers'?row.customerCode:entity==='products'?row.code:`${row.productCode}:${row.minimumQuantity}`;
  if(!key||keys.has(key))throw new Error(`Row ${index+2}: missing or duplicate record code.`);keys.add(key);
  if(entity==='customers'&&(!row.name||row.name.length>200||!['GROUP','CUSTOMER','BRANCH'].includes(row.hierarchyRole||'CUSTOMER')||!/^[A-Z]{3}$/.test(row.currency||'GBP')))throw new Error(`Row ${index+2}: invalid customer name, hierarchy level or currency.`);
  if(entity==='products'&&(!row.name||!['PRODUCT','SERVICE','CHARGE'].includes(row.kind)||!Number.isFinite(Number(row.price))||Number(row.price)<0||!/^[A-Z]{3}$/.test(row.currency)||!['STANDARD','ZERO_RATED','EXEMPT'].includes(row.taxCategory)))throw new Error(`Row ${index+2}: invalid product fields.`);
  if(entity==='prices'&&(!row.productCode||!Number.isInteger(Number(row.minimumQuantity))||Number(row.minimumQuantity)<1||!Number.isFinite(Number(row.unitPrice))||Number(row.unitPrice)<0))throw new Error(`Row ${index+2}: invalid quantity or price.`);
 }
 const priceListId=String(form.get('priceListId')??'');
 if(entity==='prices')await db.priceList.findFirstOrThrow({where:{id:priceListId,organisationId:session.organisationId}});
 // Preview validates references using the same transaction as commit. Preview rolls back by doing no writes.
 const applying=form.get('mode')==='apply';
 if(entity==='customers')await assertRecordCreationAllowed(session.organisationId,'customers');
 if(entity==='products'){const codes=await db.product.findMany({where:{organisationId:session.organisationId,code:{in:rows.map(r=>r.code)}},select:{code:true}});if(rows.some(r=>!codes.some(c=>c.code===r.code)))await assertRecordCreationAllowed(session.organisationId,'products');}
 await db.$transaction(async tx=>{
  if(entity==='customers') {
   const existing=await tx.party.findMany({where:{organisationId:session.organisationId},select:{id:true,customerCode:true,parentPartyId:true}});
   const byCode=new Map(existing.map(c=>[c.customerCode,c.id]));
   for(const r of rows)if(byCode.has(r.customerCode))throw new Error(`Customer ${r.customerCode} already exists. Customer import creates records and does not overwrite them.`);
   const parentCodes=new Map(rows.map(r=>[r.customerCode,r.parentCustomerCode]));
   for(const r of rows){const seen=new Set<string>([r.customerCode]);let parent=r.parentCustomerCode;while(parent){if(seen.has(parent))throw new Error(`Circular hierarchy involving ${r.customerCode}.`);seen.add(parent);if(!parentCodes.has(parent)&&!byCode.has(parent))throw new Error(`Parent ${parent} is missing.`);parent=parentCodes.get(parent)??'';}}
   if(applying){for(const r of rows){const c=await tx.party.create({data:{organisationId:session.organisationId,kind:'COMPANY',name:r.name,customerCode:r.customerCode,hierarchyRole:r.hierarchyRole||'CUSTOMER',customerGroup:r.customerGroup||null,preferredCurrency:r.currency||'GBP',tags:[],addresses:{create:[...(r.billingLine1?[{type:'BILLING' as const,line1:r.billingLine1,city:r.billingCity,postcode:r.billingPostcode,country:r.country,isDefaultBilling:true}]:[]),...(r.deliveryLine1?[{type:'DELIVERY' as const,line1:r.deliveryLine1,city:r.deliveryCity,postcode:r.deliveryPostcode,country:r.country,isDefaultDelivery:true}]:[])]}}});byCode.set(r.customerCode,c.id);}for(const r of rows)if(r.parentCustomerCode)await tx.party.update({where:{id:byCode.get(r.customerCode)!,organisationId:session.organisationId},data:{parentPartyId:byCode.get(r.parentCustomerCode)!}});}
  } else if(entity==='products') {
   if(applying)for(const r of rows){const price=Math.round(Number(r.price)*100);if(price>2147483647)throw new Error(`Price too large for ${r.code}.`);const data={name:r.name,kind:r.kind as 'PRODUCT'|'SERVICE'|'CHARGE',unitOfMeasure:r.unit||'each',basePriceAmount:price,baseCurrency:r.currency,taxCategory:r.taxCategory};await tx.product.upsert({where:{organisationId_code:{organisationId:session.organisationId,code:r.code}},create:{organisationId:session.organisationId,code:r.code,...data},update:data});}
  } else {
   const products=await tx.product.findMany({where:{organisationId:session.organisationId,code:{in:rows.map(r=>r.productCode)}}});
   for(const r of rows){const product=products.find(p=>p.code===r.productCode);if(!product)throw new Error(`Unknown product ${r.productCode}. Import products first.`);const validFrom=r.validFrom?new Date(r.validFrom):null,validTo=r.validTo?new Date(`${r.validTo}T23:59:59.999Z`):null;if((validFrom&&isNaN(validFrom.getTime()))||(validTo&&isNaN(validTo.getTime()))||(validFrom&&validTo&&validFrom>validTo))throw new Error(`Invalid dates for ${r.productCode}.`);if(applying){const minimumQuantity=Number(r.minimumQuantity),unitPriceAmount=Math.round(Number(r.unitPrice)*100);if(unitPriceAmount>2147483647)throw new Error('Price too large.');await tx.priceListEntry.upsert({where:{priceListId_productId_minimumQuantity:{priceListId,productId:product.id,minimumQuantity}},create:{priceListId,productId:product.id,minimumQuantity,unitPriceAmount,validFrom,validTo},update:{unitPriceAmount,validFrom,validTo,scope:"PRODUCT",method:"FIXED",categoryCode:null,percentage:0,adjustmentAmount:0,active:true}});}}
  }
  if(applying)await tx.auditEntry.create({data:{organisationId:session.organisationId,actorUserId:session.userId,action:`import.${entity}`,entityType:'Import',entityId:crypto.randomUUID(),after:{rows:rows.length,fileName:file.name}}});
 },{isolationLevel:'Serializable',timeout:30000});
 if(applying){revalidatePath('/', 'layout');return {error:'',message:`Imported ${rows.length} records.`,preview:[]};}
 return {error:'',message:`${rows.length} valid rows. Review the first 10 below, then import.`,preview:rows.slice(0,10)};
 }catch(e){return {error:e instanceof Error?e.message:'Import failed.',message:'',preview:[]};}
}
