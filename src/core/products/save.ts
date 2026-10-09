import type {Session} from '@/core/auth/session';
import {assertCapability} from '@/core/permissions/check';
import {assertRecordCreationAllowed} from '@/core/policies/record-creation';
import {enabledModulesForSession} from '@/core/modules/runtime';
import {db} from '@/core/db/client';
import {measuresFromInput} from '@/core/products/physical';
import {productClassChoice} from '@/core/products/categories';
export async function persistBusinessProduct(session:Session,form:FormData){
 assertCapability(session,'core.products.manage');const enabled=await enabledModulesForSession(session);if(!enabled.has('products')&&!enabled.has('stock'))throw new Error('Enable Inventory before maintaining products.');
 const code=String(form.get('code')??'').trim(),name=String(form.get('name')??'').trim(),basePriceAmount=Math.round(Number(form.get('price'))*100),baseCurrency=String(form.get('currency')??'GBP'),kind=String(form.get('kind')??'PRODUCT'),unitOfMeasure=String(form.get('unit')??'each').trim(),taxCategory=String(form.get('taxCategory')??'STANDARD');
 if(!code||code.length>60||!name||name.length>200||!unitOfMeasure||unitOfMeasure.length>30||!Number.isSafeInteger(basePriceAmount)||basePriceAmount<0||basePriceAmount>2147483647||!/^[A-Z]{3}$/.test(baseCurrency)||!['PRODUCT','SERVICE','CHARGE'].includes(kind)||!['STANDARD','ZERO_RATED','EXEMPT'].includes(taxCategory))throw new Error('Enter a SKU, name, unit, valid price, currency and tax category.');
 const categoryCode=(String(form.get('newCategoryCode')??'').trim()||String(form.get('categoryCode')??'').trim()).slice(0,60)||null;
 const description=form.has('description')?String(form.get('description')??'').trim().slice(0,2000)||null:undefined;
 const existing=await db.product.findUnique({where:{organisationId_code:{organisationId:session.organisationId,code}}});if(!existing)await assertRecordCreationAllowed(session.organisationId,'products');
 return db.$transaction(async tx=>{
  const category=categoryCode?await tx.productCategory.upsert({where:{organisationId_code:{organisationId:session.organisationId,code:categoryCode}},create:{organisationId:session.organisationId,code:categoryCode,name:categoryCode,itemClass:'OTHER',description:''},update:{}}):null;
  const itemClass=form.has('itemClass')||!existing?productClassChoice(String(form.get('itemClass')??''),category?.itemClass):undefined;
  const values={name,basePriceAmount,baseCurrency,kind:kind as 'PRODUCT'|'SERVICE'|'CHARGE',unitOfMeasure,taxCategory,categoryCode,...(itemClass?{itemClass}:{}),...(description!==undefined?{description}:{})};
  const product=await tx.product.upsert({where:{organisationId_code:{organisationId:session.organisationId,code}},create:{organisationId:session.organisationId,code,...values},update:values});
  if (String(form.get('itemsPerPallet')??'').trim() && product.kind==='PRODUCT') {
    const packed=measuresFromInput({itemsPerPallet:form.get('itemsPerPallet'),unitsPerPack:form.get('unitsPerPack')});
    await tx.product.update({where:{id:product.id},data:{unitsPerPack:packed.unitsPerPack,packsPerLayer:packed.packsPerLayer,layersPerPallet:packed.layersPerPallet}});
  }
  await tx.auditEntry.create({data:{organisationId:session.organisationId,actorUserId:session.userId,action:existing?'product.updated':'product.created',entityType:'Product',entityId:product.id,before:existing?{code:existing.code,name:existing.name,itemClass:existing.itemClass,basePriceAmount:existing.basePriceAmount}:undefined,after:{code,...values}}});
  return product;
 });
}
export async function saveProductMeasures(session:Session,productId:string,input:Parameters<typeof measuresFromInput>[0]){
 assertCapability(session,'core.products.manage');
 const product=await db.product.findFirst({where:{id:productId,organisationId:session.organisationId}});
 if(!product)throw new Error('Choose a product in this company.');
 if(product.kind!=='PRODUCT')throw new Error('Services and charges are not shipped as goods.');
 const measures=measuresFromInput(input);
 await db.$transaction(async tx=>{await tx.product.update({where:{id:product.id},data:measures});await tx.auditEntry.create({data:{organisationId:session.organisationId,actorUserId:session.userId,action:'product.measures',entityType:'Product',entityId:product.id,before:{netWeightGrams:product.netWeightGrams,grossWeightGrams:product.grossWeightGrams,volumeMl:product.volumeMl},after:measures}});});
}
