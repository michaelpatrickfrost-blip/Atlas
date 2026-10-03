"use server";
import { requireSession } from "@/core/auth/session";
import { assertCapability } from "@/core/permissions/check";
import { CORE_CAPABILITIES } from "@/core/permissions/capabilities";
import { assertModuleEnabled } from "@/core/modules/access";
import { db } from "@/core/db/client";
import { revalidatePath } from "next/cache";
import { writeAudit } from "@/core/audit/log";
export async function createPriceList(form:FormData) {
 const session=await requireSession();
 assertCapability(session,CORE_CAPABILITIES.pricingManage);
 await assertModuleEnabled(session,'pricing');
 const name=String(form.get('name')??'').trim(),currency=String(form.get('currency')??'GBP'),baseCurrency=String(form.get('baseCurrency')??currency),exchangeRate=Number(form.get('exchangeRate')??1);
 if(!name||name.length>150||!/^[A-Z]{3}$/.test(currency)||!/^[A-Z]{3}$/.test(baseCurrency)||!Number.isFinite(exchangeRate)||exchangeRate<=0||exchangeRate>1000000)throw new Error('Enter a name and valid currency.');
 const list=await db.priceList.create({data:{organisationId:session.organisationId,key:crypto.randomUUID(),name,currency,baseCurrency,exchangeRate}});
 await writeAudit({organisationId:session.organisationId,actorUserId:session.userId,action:'pricelist.created',entityType:'PriceList',entityId:list.id});
 revalidatePath('/pricing');
}
export async function savePriceEntry(priceListId:string,form:FormData) {
 const session=await requireSession();
 assertCapability(session,CORE_CAPABILITIES.pricingManage);
 await assertModuleEnabled(session,'pricing');
 await db.priceList.findFirstOrThrow({where:{id:priceListId,organisationId:session.organisationId}});
 const productId=String(form.get('productId'));
 await db.product.findFirstOrThrow({where:{id:productId,organisationId:session.organisationId}});
 const minimumQuantity=Number(form.get('quantity')),unitPriceAmount=Math.round(Number(form.get('price'))*100);
 const from=String(form.get('validFrom')??''),to=String(form.get('validTo')??''),validFrom=from?new Date(from):null,validTo=to?new Date(`${to}T23:59:59.999Z`):null;
 if(!Number.isInteger(minimumQuantity)||minimumQuantity<1||!Number.isSafeInteger(unitPriceAmount)||unitPriceAmount<0||unitPriceAmount>2147483647|| (validFrom&&isNaN(validFrom.getTime())) || (validTo&&isNaN(validTo.getTime())) ||(validFrom&&validTo&&validFrom>validTo))throw new Error('Enter valid quantity, price and dates.');
 const entry=await db.priceListEntry.upsert({where:{priceListId_productId_minimumQuantity:{priceListId,productId,minimumQuantity}},create:{priceListId,productId,minimumQuantity,unitPriceAmount,validFrom,validTo},update:{unitPriceAmount,validFrom,validTo,scope:"PRODUCT",method:"FIXED",categoryCode:null,percentage:0,adjustmentAmount:0,active:true}});
 await writeAudit({organisationId:session.organisationId,actorUserId:session.userId,action:'pricelist.entry.saved',entityType:'PriceListEntry',entityId:entry.id,after:{productId,minimumQuantity,unitPriceAmount}});
 revalidatePath('/pricing');
}
export async function saveRule(priceListId:string,form:FormData) {
 const session=await requireSession();
 assertCapability(session,CORE_CAPABILITIES.pricingManage);
 await assertModuleEnabled(session,'pricing');
 await db.priceList.findFirstOrThrow({where:{id:priceListId,organisationId:session.organisationId}});
 const scope=String(form.get('scope')),method=String(form.get('method')),id=String(form.get('ruleId')??''),productId=scope==='PRODUCT'?String(form.get('productId')):null,categoryCode=scope==='CATEGORY'?String(form.get('categoryCode')??'').trim():null;
 const minimumQuantity=Number(form.get('quantity')),value=Number(form.get('value')),priority=Number(form.get('priority')??0),from=String(form.get('validFrom')??''),to=String(form.get('validTo')??''),validFrom=from?new Date(from):null,validTo=to?new Date(`${to}T23:59:59.999Z`):null;
 if(!['PRODUCT','CATEGORY','ALL'].includes(scope)||!['FIXED','PERCENT','AMOUNT'].includes(method)||!Number.isInteger(minimumQuantity)||minimumQuantity<1||minimumQuantity>1000000||!Number.isFinite(value)||!Number.isInteger(priority)||priority<0||priority>1000||(method==='PERCENT'&&(value>100||value< -1000))||(method==='FIXED'&&value<0)||Math.abs(value*100)>2147483647||(validFrom&&isNaN(validFrom.getTime()))||(validTo&&isNaN(validTo.getTime()))||(validFrom&&validTo&&validFrom>validTo))throw new Error('Enter a valid rule, amount, quantity and date range.');
 if(productId)await db.product.findFirstOrThrow({where:{id:productId,organisationId:session.organisationId,active:true}});
 if(scope==='CATEGORY'){if(!categoryCode)throw new Error('Choose a category code.');await db.product.findFirstOrThrow({where:{categoryCode,organisationId:session.organisationId,active:true}});}
 if(id)await db.priceListEntry.findFirstOrThrow({where:{id,priceListId}});
 const data={scope,method,productId,categoryCode,minimumQuantity,priority,validFrom,validTo,unitPriceAmount:method==='FIXED'?Math.round(value*100):0,percentage:method==='PERCENT'?value:0,adjustmentAmount:method==='AMOUNT'?Math.round(value*100):0};
 await db.$transaction(async tx=>{const entry=id?await tx.priceListEntry.update({where:{id},data}):await tx.priceListEntry.create({data:{priceListId,...data}});await tx.auditEntry.create({data:{organisationId:session.organisationId,actorUserId:session.userId,action:'pricelist.rule.saved',entityType:'PriceListEntry',entityId:entry.id,after:data}});});
 revalidatePath('/pricing');revalidatePath(`/pricing/${priceListId}`);
}
export async function setRuleActive(priceListId:string,id:string,form:FormData) {
 const session=await requireSession();
 assertCapability(session,CORE_CAPABILITIES.pricingManage);
 await assertModuleEnabled(session,'pricing');
 await db.priceListEntry.findFirstOrThrow({where:{id,priceListId,priceList:{organisationId:session.organisationId}}});
 const active=form.get('active')==='true';
 await db.$transaction(async tx=>{await tx.priceListEntry.update({where:{id},data:{active}});await tx.auditEntry.create({data:{organisationId:session.organisationId,actorUserId:session.userId,action:'pricelist.rule.status',entityType:'PriceListEntry',entityId:id,after:{active}}});});
 revalidatePath(`/pricing/${priceListId}`);
}
export async function updatePriceBasis(priceListId:string,form:FormData) {
 const session=await requireSession();
 assertCapability(session,CORE_CAPABILITIES.pricingManage);
 await assertModuleEnabled(session,'pricing');
 await db.priceList.findFirstOrThrow({where:{id:priceListId,organisationId:session.organisationId}});
 const baseCurrency=String(form.get('baseCurrency')),exchangeRate=Number(form.get('exchangeRate'));
 if(!/^[A-Z]{3}$/.test(baseCurrency)||!Number.isFinite(exchangeRate)||exchangeRate<=0||exchangeRate>1000000)throw new Error('Enter a valid base currency and exchange rate.');
 await db.$transaction(async tx=>{await tx.priceList.update({where:{id:priceListId},data:{baseCurrency,exchangeRate}});await tx.auditEntry.create({data:{organisationId:session.organisationId,actorUserId:session.userId,action:'pricelist.exchange_rate.updated',entityType:'PriceList',entityId:priceListId,after:{baseCurrency,exchangeRate}}});});
 revalidatePath(`/pricing/${priceListId}`);
}
