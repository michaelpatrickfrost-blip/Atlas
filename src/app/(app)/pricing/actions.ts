"use server";
import { requireSession } from "@/core/auth/session";
import { assertCapability } from "@/core/permissions/check";
import { CORE_CAPABILITIES } from "@/core/permissions/capabilities";
import { assertModuleEnabled } from "@/core/modules/access";
import { db } from "@/core/db/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { writeAudit } from "@/core/audit/log";
import { readPriceCsv, priceDates } from "@/core/pricing/csv";
import { SALES_CURRENCIES } from "@/core/pricing/rules";
import { resolvePrice } from "@/core/pricing/resolve-price";

function discountOf(value: FormDataEntryValue | null) {
  const text = String(value ?? "").trim();
  const discount = text ? Number(text) : 0;
  if (!Number.isFinite(discount) || discount < 0 || discount > 100 || (text && !/^\d+(\.\d{1,2})?$/.test(text))) throw new Error("Enter a discount from 0 to 100.");
  return discount;
}
import { parseDay, parseHours } from "@/core/pricing/agreements";
export async function createPriceList(form: FormData) {
  const session = await requireSession();
  assertCapability(session, CORE_CAPABILITIES.pricingManage);
  await assertModuleEnabled(session, "pricing");
  const name = String(form.get("name") ?? "").trim();
  const currency = String(form.get("currency") ?? "GBP").toUpperCase();
  const mode = String(form.get("startMode") ?? "blank");
  const partyId = String(form.get("partyId") ?? "");
  if (!name || name.length > 150 || !SALES_CURRENCIES.includes(currency as typeof SALES_CURRENCIES[number]) || !["blank", "copy", "catalogue"].includes(mode)) throw new Error("Enter a name, sales currency and starting point.");
  const id = await db.$transaction(async tx => {
    if (partyId) await tx.party.findFirstOrThrow({ where: { id: partyId, organisationId: session.organisationId, archived: false, identityScrubbed: false } });
    const source = mode === "copy" ? await tx.priceList.findFirstOrThrow({ where: { id: String(form.get("sourceListId") ?? ""), organisationId: session.organisationId }, include: { entries: true } }) : null;
    if (source && source.currency !== currency) throw new Error("Copy a list in the same currency. Saved prices are not currency converted.");
    const list = await tx.priceList.create({ data: { organisationId: session.organisationId, key: crypto.randomUUID(), name, currency, baseCurrency: source?.baseCurrency ?? currency, exchangeRate: source?.exchangeRate ?? 1 } });
    if (source?.entries.length) await tx.priceListEntry.createMany({ data: source.entries.map(entry => ({ priceListId: list.id, productId: entry.productId, categoryCode: entry.categoryCode, scope: entry.scope, method: entry.method, minimumQuantity: entry.minimumQuantity, unitPriceAmount: entry.unitPriceAmount, percentage: entry.percentage, adjustmentAmount: entry.adjustmentAmount, priority: entry.priority, validFrom: entry.validFrom, validTo: entry.validTo, active: entry.active })) });
    if (mode === "catalogue") {
      const percentage = discountOf(form.get("catalogueDiscount"));
      const categoryCode = String(form.get("categoryCode") ?? "").trim();
      if (categoryCode) await tx.productCategory.findFirstOrThrow({ where: { organisationId: session.organisationId, code: categoryCode, active: true } });
      const products = await tx.product.findMany({ where: { organisationId: session.organisationId, active: true, baseCurrency: currency, ...(categoryCode ? { categoryCode } : {}) }, select: { id: true, basePriceAmount: true } });
      if (!products.length) throw new Error("No active catalogue products match this currency and category. Choose another starting point.");
      await tx.priceListEntry.createMany({ data: products.map(product => ({ priceListId: list.id, productId: product.id, minimumQuantity: 1, unitPriceAmount: product.basePriceAmount, percentage, scope: "PRODUCT", method: "FIXED" })) });
    }
    if (partyId) await tx.customerCommercialSettings.upsert({ where: { partyId }, create: { partyId, priceList: list.id }, update: { priceList: list.id } });
    await tx.auditEntry.create({ data: { organisationId: session.organisationId, actorUserId: session.userId, action: "pricelist.created", entityType: "PriceList", entityId: list.id, after: { name, currency, mode, sourceListId: source?.id ?? null, partyId: partyId || null } } });
    return list.id;
  }, { timeout: 30000 });
  revalidatePath("/sales/price-lists", "layout");
  if (partyId) revalidatePath(`/customers/${partyId}`);
  redirect(`/sales/price-lists/${id}`);
}
export async function savePriceEntry(priceListId:string,form:FormData) {
 const session=await requireSession();
 assertCapability(session,CORE_CAPABILITIES.pricingManage);
 await assertModuleEnabled(session,'pricing');
 await db.priceList.findFirstOrThrow({where:{id:priceListId,organisationId:session.organisationId}});
 const productId=String(form.get('productId'));
 await db.product.findFirstOrThrow({where:{id:productId,organisationId:session.organisationId,active:true}});
 if (!String(form.get('price') ?? '').trim()) throw new Error('Enter a price.');
 const minimumQuantity=Number(form.get('quantity')),unitPriceAmount=Math.round(Number(form.get('price'))*100),discountPercent=discountOf(form.get('discount'));
 const from=String(form.get('validFrom')??''),to=String(form.get('validTo')??''),validFrom=from?new Date(from):null,validTo=to?new Date(`${to}T23:59:59.999Z`):null;
 if(!Number.isInteger(minimumQuantity)||minimumQuantity<1||!Number.isSafeInteger(unitPriceAmount)||unitPriceAmount<0||unitPriceAmount>2147483647|| (validFrom&&isNaN(validFrom.getTime())) || (validTo&&isNaN(validTo.getTime())) ||(validFrom&&validTo&&validFrom>validTo))throw new Error('Enter valid quantity, price and dates.');
 const entryId = String(form.get("entryId") ?? "");
 await db.$transaction(async tx => {
   if (entryId) await tx.priceListEntry.findFirstOrThrow({ where: { id: entryId, priceListId, scope: "PRODUCT", method: "FIXED" } });
   const duplicate = await tx.priceListEntry.findFirst({ where: { priceListId, productId, minimumQuantity } });
   if (entryId && duplicate && duplicate.id !== entryId) throw new Error("This product already has a price at that quantity. Edit that row instead.");
   const data = { productId, minimumQuantity, unitPriceAmount, percentage: discountPercent, validFrom, validTo, scope: "PRODUCT", method: "FIXED", categoryCode: null, adjustmentAmount: 0, active: true };
   const entry = entryId ? await tx.priceListEntry.update({ where: { id: entryId }, data }) : await tx.priceListEntry.upsert({ where: { priceListId_productId_minimumQuantity: { priceListId, productId, minimumQuantity } }, create: { priceListId, ...data }, update: data });
   await tx.auditEntry.create({ data: { organisationId: session.organisationId, actorUserId: session.userId, action: "pricelist.entry.saved", entityType: "PriceListEntry", entityId: entry.id, after: { productId, minimumQuantity, unitPriceAmount, discountPercent } } });
 });
 revalidatePath('/sales/price-lists', 'layout');
}
export async function saveRule(priceListId:string,form:FormData) {
 const session=await requireSession();
 assertCapability(session,CORE_CAPABILITIES.pricingManage);
 await assertModuleEnabled(session,'pricing');
 await db.priceList.findFirstOrThrow({where:{id:priceListId,organisationId:session.organisationId}});
 const scope=String(form.get('scope')),method=String(form.get('method')),productId=scope==='PRODUCT'?String(form.get('productId')):null,categoryCode=scope==='CATEGORY'?String(form.get('categoryCode')??'').trim():null;
 const minimumQuantity=Number(form.get('quantity')),value=Number(form.get('value')),priority=Number(form.get('priority')??0),from=String(form.get('validFrom')??''),to=String(form.get('validTo')??''),validFrom=from?new Date(from):null,validTo=to?new Date(`${to}T23:59:59.999Z`):null;
 if(!['PRODUCT','CATEGORY','ALL'].includes(scope)||!['FIXED','PERCENT','AMOUNT'].includes(method)||!Number.isInteger(minimumQuantity)||minimumQuantity<1||minimumQuantity>1000000||!Number.isFinite(value)||!Number.isInteger(priority)||priority<0||priority>1000||(method==='PERCENT'&&(value>100||value< -1000))||(method==='FIXED'&&value<0)||Math.abs(value*100)>2147483647||(validFrom&&isNaN(validFrom.getTime()))||(validTo&&isNaN(validTo.getTime()))||(validFrom&&validTo&&validFrom>validTo))throw new Error('Enter a valid rule, amount, quantity and date range.');
 if(productId)await db.product.findFirstOrThrow({where:{id:productId,organisationId:session.organisationId,active:true}});
 if(scope==='CATEGORY'){if(!categoryCode)throw new Error('Choose a category.');const [category,categorised]=await Promise.all([db.productCategory.findFirst({where:{code:categoryCode,organisationId:session.organisationId,active:true}}),db.product.findFirst({where:{categoryCode,organisationId:session.organisationId,active:true}})]);if(!category&&!categorised)throw new Error('Choose a category from the catalogue.');}
 let id=String(form.get('ruleId')??'');
 if(!id&&scope==='CATEGORY'&&method==='PERCENT'&&categoryCode){const existing=await db.priceListEntry.findFirst({where:{priceListId,scope:'CATEGORY',method:'PERCENT',categoryCode,minimumQuantity}});if(existing)id=existing.id;}
 if(id)await db.priceListEntry.findFirstOrThrow({where:{id,priceListId}});
 const data={scope,method,productId,categoryCode,minimumQuantity,priority,validFrom,validTo,unitPriceAmount:method==='FIXED'?Math.round(value*100):0,percentage:method==='PERCENT'?value:0,adjustmentAmount:method==='AMOUNT'?Math.round(value*100):0,...(scope==='CATEGORY'&&method==='PERCENT'?{active:true}:{})};
 await db.$transaction(async tx=>{const entry=id?await tx.priceListEntry.update({where:{id},data}):await tx.priceListEntry.create({data:{priceListId,...data}});await tx.auditEntry.create({data:{organisationId:session.organisationId,actorUserId:session.userId,action:'pricelist.rule.saved',entityType:'PriceListEntry',entityId:entry.id,after:data}});});
 revalidatePath('/sales/price-lists', 'layout');revalidatePath(`/sales/price-lists/${priceListId}`);
}
export async function setRuleActive(priceListId:string,id:string,form:FormData) {
 const session=await requireSession();
 assertCapability(session,CORE_CAPABILITIES.pricingManage);
 await assertModuleEnabled(session,'pricing');
 await db.priceListEntry.findFirstOrThrow({where:{id,priceListId,priceList:{organisationId:session.organisationId}}});
 const active=form.get('active')==='true';
 await db.$transaction(async tx=>{await tx.priceListEntry.update({where:{id},data:{active}});await tx.auditEntry.create({data:{organisationId:session.organisationId,actorUserId:session.userId,action:'pricelist.rule.status',entityType:'PriceListEntry',entityId:id,after:{active}}});});
 revalidatePath(`/sales/price-lists/${priceListId}`);
}
export async function updatePriceBasis(priceListId: string, form: FormData) {
  const session = await requireSession();
  assertCapability(session, CORE_CAPABILITIES.pricingManage);
  await assertModuleEnabled(session, "pricing");
  const currency = String(form.get("currency") ?? "").trim().toUpperCase();
  const baseCurrency = String(form.get("baseCurrency") ?? "").trim().toUpperCase();
  const exchangeRate = Number(form.get("exchangeRate"));
  if ((currency && !SALES_CURRENCIES.includes(currency as typeof SALES_CURRENCIES[number])) || !/^[A-Z]{3}$/.test(baseCurrency) || !Number.isFinite(exchangeRate) || exchangeRate <= 0 || exchangeRate > 1000000) throw new Error("Enter a valid sales currency and exchange rate.");
  await db.$transaction(async tx => {
    const existing = await tx.priceList.findFirstOrThrow({ where: { id: priceListId, organisationId: session.organisationId }, include: { _count: { select: { entries: true, agreements: true, customerDefaults: true } } } });
    if (currency && currency !== existing.currency && (existing._count.entries || existing._count.agreements || existing._count.customerDefaults)) throw new Error("Create a new list for another currency. This list already has prices, customers or agreements.");
    if (baseCurrency === (currency || existing.currency) && exchangeRate !== 1) throw new Error("The exchange rate must be 1 when both currencies are the same.");
    await tx.priceList.update({ where: { id: priceListId }, data: { ...(currency ? { currency } : {}), baseCurrency, exchangeRate } });
    await tx.auditEntry.create({ data: { organisationId: session.organisationId, actorUserId: session.userId, action: "pricelist.exchange_rate.updated", entityType: "PriceList", entityId: priceListId, after: { currency: currency || existing.currency, baseCurrency, exchangeRate } } });
  }, { isolationLevel: "Serializable" });
  revalidatePath("/sales/price-lists", "layout");
}

function textLimit(value: string, max: number, label: string) {
  if (value.length > max) throw new Error(`${label} must be ${max} characters or fewer.`);
  return value;
}

export async function renamePriceList(priceListId: string, form: FormData) {
  const session = await requireSession();
  assertCapability(session, CORE_CAPABILITIES.pricingManage);
  await assertModuleEnabled(session, "pricing");
  const name = textLimit(String(form.get("name") ?? "").trim(), 150, "Name");
  if (!name) throw new Error("Enter a price-list name.");
  await db.priceList.findFirstOrThrow({ where: { id: priceListId, organisationId: session.organisationId } });
  await db.$transaction(async tx => {
    await tx.priceList.update({ where: { id: priceListId }, data: { name } });
    await tx.auditEntry.create({ data: { organisationId: session.organisationId, actorUserId: session.userId, action: "pricelist.renamed", entityType: "PriceList", entityId: priceListId, after: { name } } });
  });
  revalidatePath("/sales/price-lists", "layout");
}

export async function assignPriceListCustomers(priceListId: string, form: FormData) {
  const session = await requireSession();
  assertCapability(session, CORE_CAPABILITIES.pricingManage);
  await assertModuleEnabled(session, "pricing");
  const ids = [...new Set(form.getAll("partyIds").map(String))];
  if (!ids.length || ids.length > 500) throw new Error("Select between 1 and 500 customers.");
  await db.priceList.findFirstOrThrow({ where: { id: priceListId, organisationId: session.organisationId } });
  await db.$transaction(async tx => {
    const count = await tx.party.count({ where: { id: { in: ids }, organisationId: session.organisationId, archived: false, identityScrubbed: false } });
    if (count !== ids.length) throw new Error("One or more customers are unavailable. Refresh the list and try again.");
    for (const partyId of ids) await tx.customerCommercialSettings.upsert({ where: { partyId }, create: { partyId, priceList: priceListId }, update: { priceList: priceListId } });
    await tx.auditEntry.create({ data: { organisationId: session.organisationId, actorUserId: session.userId, action: "pricelist.customers.assigned", entityType: "PriceList", entityId: priceListId, after: { partyIds: ids } } });
  }, { timeout: 30000 });
  revalidatePath("/sales/price-lists", "layout");
  revalidatePath("/customers", "layout");
}

export async function checkSalesPrice(priceListId: string, form: FormData) {
  const session = await requireSession();
  assertCapability(session, CORE_CAPABILITIES.pricingRead);
  await assertModuleEnabled(session, "pricing");
  await db.priceList.findFirstOrThrow({ where: { id: priceListId, organisationId: session.organisationId } });
  const partyId = String(form.get("partyId") ?? ""), productId = String(form.get("productId") ?? "");
  const quantity = Number(form.get("quantity"));
  const asOf = parseDay(String(form.get("asOf") ?? ""), false);
  if (!partyId || !productId || !Number.isSafeInteger(quantity) || quantity < 1 || quantity > 1000000 || !asOf) throw new Error("Choose a customer, product, quantity and valid date.");
  const mode = String(form.get("mode") ?? "auto");
  if (!["auto", "list"].includes(mode)) throw new Error("Choose how to check the price.");
  const result = await resolvePrice({ organisationId: session.organisationId, partyId, productId, quantity, asOf, ...(mode === "list" ? { priceListId } : {}) });
  return { ...result, validUntil: result.validUntil?.toISOString() ?? null, quantity, netUnitAmount: Math.round(result.unitPriceAmount * (1 - result.discountPercent / 100)) };
}

export async function assignPriceList(priceListId: string, form: FormData) {
  const session = await requireSession();
  assertCapability(session, CORE_CAPABILITIES.pricingManage);
  await assertModuleEnabled(session, "pricing");
  await db.priceList.findFirstOrThrow({ where: { id: priceListId, organisationId: session.organisationId } });
  const partyId = String(form.get("partyId") ?? "");
  const remove = form.get("remove") === "yes";
  const party = await db.party.findFirstOrThrow({ where: { id: partyId, organisationId: session.organisationId, ...(remove ? {} : { archived: false, identityScrubbed: false }) } });
  await db.$transaction(async (tx) => {
    if (remove) await tx.customerCommercialSettings.updateMany({ where: { partyId, priceList: priceListId }, data: { priceList: null } });
    else await tx.customerCommercialSettings.upsert({ where: { partyId }, create: { partyId, priceList: priceListId }, update: { priceList: priceListId } });
    await tx.auditEntry.create({ data: { organisationId: session.organisationId, actorUserId: session.userId, action: remove ? "pricelist.customer.removed" : "pricelist.customer.assigned", entityType: "Party", entityId: party.id, after: { priceListId: remove ? null : priceListId } } });
  });
  revalidatePath("/sales/price-lists", "layout");
  revalidatePath(`/sales/price-lists/${priceListId}`);
  revalidatePath(`/customers/${partyId}`);
}

type PricePreviewRow = { line: number; productCode: string; productName: string; minimumQuantity: number; unitPrice: number; discountPercent: number; validFrom: string; validTo: string; action: "add" | "update" | "error"; message: string };

async function matchPriceRows(organisationId: string, csv: string, existing: Set<string>) {
  const parsed = readPriceCsv(csv);
  const products = await db.product.findMany({ where: { organisationId, active: true }, select: { id: true, code: true, name: true } });
  const byCode = new Map(products.map((product) => [product.code.toLowerCase(), product]));
  const rows: PricePreviewRow[] = parsed.rows.map((row) => {
    const product = byCode.get(row.productCode.toLowerCase());
    if (!product) return { ...row, productName: "", action: "error" as const, message: "No active product uses this code." };
    const action = existing.has(`${product.id}:${row.minimumQuantity}`) ? "update" as const : "add" as const;
    return { ...row, productCode: product.code, productName: product.name, action, message: "" };
  });
  return { parsed, rows };
}

export async function previewPriceCsv(priceListId: string, csv: string) {
  const session = await requireSession();
  assertCapability(session, CORE_CAPABILITIES.pricingManage);
  await assertModuleEnabled(session, "pricing");
  await db.priceList.findFirstOrThrow({ where: { id: priceListId, organisationId: session.organisationId } });
  const current = await db.priceListEntry.findMany({ where: { priceListId, scope: "PRODUCT", method: "FIXED" }, select: { productId: true, minimumQuantity: true } });
  const { parsed, rows } = await matchPriceRows(session.organisationId, csv, new Set(current.filter((row) => row.productId).map((row) => `${row.productId}:${row.minimumQuantity}`)));
  return { skipped: parsed.skipped, issues: parsed.issues, rows };
}

export async function applyPriceCsv(priceListId: string, csv: string) {
  const session = await requireSession();
  assertCapability(session, CORE_CAPABILITIES.pricingManage);
  await assertModuleEnabled(session, "pricing");
  await db.priceList.findFirstOrThrow({ where: { id: priceListId, organisationId: session.organisationId } });
  const preview = await previewPriceCsv(priceListId, csv);
  if (preview.issues.length || preview.rows.some((row) => row.action === "error")) throw new Error("Fix the spreadsheet before uploading. Nothing was changed.");
  const products = await db.product.findMany({ where: { organisationId: session.organisationId, active: true }, select: { id: true, code: true } });
  const byCode = new Map(products.map((product) => [product.code.toLowerCase(), product]));
  await db.$transaction(async (tx) => {
    for (const row of preview.rows) {
      const product = byCode.get(row.productCode.toLowerCase());
      if (!product) throw new Error(`No active product uses ${row.productCode}.`);
      const { validFrom, validTo } = priceDates(row.validFrom, row.validTo);
      const unitPriceAmount = Math.round(row.unitPrice * 100);
      await tx.priceListEntry.upsert({
        where: { priceListId_productId_minimumQuantity: { priceListId, productId: product.id, minimumQuantity: row.minimumQuantity } },
        create: { priceListId, productId: product.id, minimumQuantity: row.minimumQuantity, unitPriceAmount, percentage: row.discountPercent, validFrom, validTo },
        update: { unitPriceAmount, percentage: row.discountPercent, validFrom, validTo, scope: "PRODUCT", method: "FIXED", categoryCode: null, adjustmentAmount: 0, active: true },
      });
    }
    await tx.auditEntry.create({ data: { organisationId: session.organisationId, actorUserId: session.userId, action: "pricelist.csv.applied", entityType: "PriceList", entityId: priceListId, after: { rows: preview.rows.length } } });
  }, { timeout: 30000 });
  revalidatePath("/sales/price-lists", "layout");
  revalidatePath(`/sales/price-lists/${priceListId}`);
  return { saved: preview.rows.length };
}

export async function saveAgreement(agreementId: string, form: FormData) {
  const session = await requireSession();
  assertCapability(session, CORE_CAPABILITIES.pricingManage);
  await assertModuleEnabled(session, "pricing");
  const partyId = String(form.get("partyId") ?? "");
  const name = textLimit(String(form.get("name") ?? "").trim(), 150, "Name");
  const status = String(form.get("status") ?? "DRAFT");
  const startsOn = parseDay(String(form.get("startsOn") ?? ""), false);
  const endsOn = parseDay(String(form.get("endsOn") ?? ""), true);
  const priceListId = String(form.get("priceListId") ?? "") || null;
  const paymentTerms = textLimit(String(form.get("paymentTerms") ?? "").trim(), 200, "Payment terms");
  const notes = textLimit(String(form.get("notes") ?? "").trim(), 4000, "Notes");
  const slaName = textLimit(String(form.get("slaName") ?? "").trim(), 120, "Service promise");
  const coverage = textLimit(String(form.get("coverage") ?? "").trim(), 200, "Coverage");
  const slaNotes = textLimit(String(form.get("slaNotes") ?? "").trim(), 2000, "Service notes");
  const responseMinutes = parseHours(String(form.get("responseHours") ?? ""), "Response time");
  const resolutionMinutes = parseHours(String(form.get("resolutionHours") ?? ""), "Resolution time");
  if (!name) throw new Error("Enter an agreement name.");
  if (!["DRAFT", "ACTIVE", "ENDED"].includes(status)) throw new Error("Choose a status.");
  if (!startsOn) throw new Error("Enter the day the agreement starts.");
  if (endsOn && endsOn < startsOn) throw new Error("The end date is before the start date.");
  await db.party.findFirstOrThrow({ where: { id: partyId, organisationId: session.organisationId } });
  if (priceListId) await db.priceList.findFirstOrThrow({ where: { id: priceListId, organisationId: session.organisationId } });
  const data = { partyId, name, status: status as "DRAFT" | "ACTIVE" | "ENDED", startsOn, endsOn, priceListId, paymentTerms, notes, slaName, coverage, responseMinutes, resolutionMinutes, slaNotes };
  const id = await db.$transaction(async (tx) => {
    if (agreementId !== "new") {
      const existing = await tx.commercialAgreement.findFirstOrThrow({ where: { id: agreementId, organisationId: session.organisationId } });
      await tx.commercialAgreement.update({ where: { id: existing.id }, data });
      await tx.auditEntry.create({ data: { organisationId: session.organisationId, actorUserId: session.userId, action: "agreement.updated", entityType: "CommercialAgreement", entityId: existing.id, after: { partyId, status } } });
      return existing.id;
    }
    const count = await tx.commercialAgreement.count({ where: { organisationId: session.organisationId } });
    const created = await tx.commercialAgreement.create({ data: { organisationId: session.organisationId, number: `AGR-${String(count + 1).padStart(5, "0")}`, ...data } });
    await tx.auditEntry.create({ data: { organisationId: session.organisationId, actorUserId: session.userId, action: "agreement.created", entityType: "CommercialAgreement", entityId: created.id, after: { number: created.number, partyId, status } } });
    return created.id;
  });
  revalidatePath("/crm/agreements");
  revalidatePath(`/crm/agreements/${id}`);
  revalidatePath(`/customers/${partyId}`);
  if (agreementId === "new") redirect(`/crm/agreements/${id}`);
}

export async function saveAgreementPrice(agreementId: string, form: FormData) {
  const session = await requireSession();
  assertCapability(session, CORE_CAPABILITIES.pricingManage);
  await assertModuleEnabled(session, "pricing");
  const agreement = await db.commercialAgreement.findFirstOrThrow({ where: { id: agreementId, organisationId: session.organisationId } });
  const productId = String(form.get("productId") ?? "");
  const minimumQuantity = Number(form.get("quantity"));
  if (!String(form.get("price") ?? "").trim()) throw new Error("Enter a price.");
  const unitPriceAmount = Math.round(Number(form.get("price")) * 100);
  if (!Number.isInteger(minimumQuantity) || minimumQuantity < 1 || !Number.isSafeInteger(unitPriceAmount) || unitPriceAmount < 0 || unitPriceAmount > 2147483647) throw new Error("Enter a valid quantity and price.");
  await db.product.findFirstOrThrow({ where: { id: productId, organisationId: session.organisationId, active: true } });
  const price = await db.agreementPrice.upsert({
    where: { agreementId_productId_minimumQuantity: { agreementId, productId, minimumQuantity } },
    create: { agreementId, productId, minimumQuantity, unitPriceAmount },
    update: { unitPriceAmount },
  });
  await writeAudit({ organisationId: session.organisationId, actorUserId: session.userId, action: "agreement.price.saved", entityType: "AgreementPrice", entityId: price.id, after: { agreementId: agreement.id, productId, minimumQuantity, unitPriceAmount } });
  revalidatePath(`/crm/agreements/${agreementId}`);
}

export async function removeAgreementPrice(agreementId: string, priceId: string) {
  const session = await requireSession();
  assertCapability(session, CORE_CAPABILITIES.pricingManage);
  await assertModuleEnabled(session, "pricing");
  const price = await db.agreementPrice.findFirstOrThrow({ where: { id: priceId, agreementId, agreement: { organisationId: session.organisationId } } });
  await db.agreementPrice.delete({ where: { id: price.id } });
  await writeAudit({ organisationId: session.organisationId, actorUserId: session.userId, action: "agreement.price.removed", entityType: "AgreementPrice", entityId: price.id, after: { agreementId } });
  revalidatePath(`/crm/agreements/${agreementId}`);
}

export async function previewAgreementCsv(agreementId: string, csv: string) {
  const session = await requireSession();
  assertCapability(session, CORE_CAPABILITIES.pricingManage);
  await assertModuleEnabled(session, "pricing");
  await db.commercialAgreement.findFirstOrThrow({ where: { id: agreementId, organisationId: session.organisationId } });
  const current = await db.agreementPrice.findMany({ where: { agreementId }, select: { productId: true, minimumQuantity: true } });
  const { parsed, rows } = await matchPriceRows(session.organisationId, csv, new Set(current.map((row) => `${row.productId}:${row.minimumQuantity}`)));
  return { skipped: parsed.skipped, issues: parsed.issues, rows };
}

export async function applyAgreementCsv(agreementId: string, csv: string) {
  const session = await requireSession();
  assertCapability(session, CORE_CAPABILITIES.pricingManage);
  await assertModuleEnabled(session, "pricing");
  await db.commercialAgreement.findFirstOrThrow({ where: { id: agreementId, organisationId: session.organisationId } });
  const preview = await previewAgreementCsv(agreementId, csv);
  if (preview.issues.length || preview.rows.some((row) => row.action === "error")) throw new Error("Fix the spreadsheet before uploading. Nothing was changed.");
  const products = await db.product.findMany({ where: { organisationId: session.organisationId, active: true }, select: { id: true, code: true } });
  const byCode = new Map(products.map((product) => [product.code.toLowerCase(), product]));
  await db.$transaction(async (tx) => {
    for (const row of preview.rows) {
      const product = byCode.get(row.productCode.toLowerCase());
      if (!product) throw new Error(`No active product uses ${row.productCode}.`);
      await tx.agreementPrice.upsert({
        where: { agreementId_productId_minimumQuantity: { agreementId, productId: product.id, minimumQuantity: row.minimumQuantity } },
        create: { agreementId, productId: product.id, minimumQuantity: row.minimumQuantity, unitPriceAmount: Math.round(row.unitPrice * 100) },
        update: { unitPriceAmount: Math.round(row.unitPrice * 100) },
      });
    }
    await tx.auditEntry.create({ data: { organisationId: session.organisationId, actorUserId: session.userId, action: "agreement.csv.applied", entityType: "CommercialAgreement", entityId: agreementId, after: { rows: preview.rows.length } } });
  }, { timeout: 30000 });
  revalidatePath(`/crm/agreements/${agreementId}`);
  return { saved: preview.rows.length };
}
