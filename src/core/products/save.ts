import type {Session} from '@/core/auth/session';
import {assertCapability} from '@/core/permissions/check';
import {assertRecordCreationAllowed} from '@/core/policies/record-creation';
import {getEnabledModuleIds} from '@/core/modules/runtime';
import {db} from '@/core/db/client';
export async function persistBusinessProduct(session:Session,form:FormData){
 assertCapability(session,'core.products.manage');const enabled=await getEnabledModuleIds(session.organisationId);if(!enabled.has('products')&&!enabled.has('stock'))throw new Error('Enable Inventory before maintaining products.');
 const code=String(form.get('code')??'').trim(),name=String(form.get('name')??'').trim(),basePriceAmount=Math.round(Number(form.get('price'))*100),baseCurrency=String(form.get('currency')??'GBP'),kind=String(form.get('kind')??'PRODUCT'),unitOfMeasure=String(form.get('unit')??'each').trim(),taxCategory=String(form.get('taxCategory')??'STANDARD');
 if(!code||code.length>60||!name||name.length>200||!unitOfMeasure||unitOfMeasure.length>30||!Number.isSafeInteger(basePriceAmount)||basePriceAmount<0||basePriceAmount>2147483647||!/^[A-Z]{3}$/.test(baseCurrency)||!['PRODUCT','SERVICE','CHARGE'].includes(kind)||!['STANDARD','ZERO_RATED','EXEMPT'].includes(taxCategory))throw new Error('Enter a SKU, name, unit, valid price, currency and tax category.');
 const existing=await db.product.findUnique({where:{organisationId_code:{organisationId:session.organisationId,code}}});if(!existing)await assertRecordCreationAllowed(session.organisationId,'products');
 return db.$transaction(async tx=>{const values={name,basePriceAmount,baseCurrency,kind:kind as 'PRODUCT'|'SERVICE'|'CHARGE',unitOfMeasure,taxCategory,categoryCode:String(form.get('categoryCode')??'').trim().slice(0,60)||null};const product=await tx.product.upsert({where:{organisationId_code:{organisationId:session.organisationId,code}},create:{organisationId:session.organisationId,code,...values},update:values});await tx.auditEntry.create({data:{organisationId:session.organisationId,actorUserId:session.userId,action:existing?'product.updated':'product.created',entityType:'Product',entityId:product.id,before:existing?{code:existing.code,name:existing.name,basePriceAmount:existing.basePriceAmount}:undefined,after:{code,...values}}});return product;});
}
