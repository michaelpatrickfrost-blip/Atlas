/** Opt-in central Test acceptance. Existing QA identity; no new account or permission grants. */
import assert from 'node:assert/strict';
import { randomBytes } from 'node:crypto';
import fs from 'node:fs';
import jwt from 'jsonwebtoken';
import { chromium, expect, type Page } from '@playwright/test';
import { db } from '../src/core/db/client';
import { sessionForUser } from '../src/core/auth/session';
import { getModule } from '../src/core/modules/registry';
import { getNavigableModules } from '../src/core/modules/runtime';
import { supplySpendProvider } from '../src/modules/finance/services/supply-spend';
import { supplyPurchaseProvider } from '../src/modules/manufacturing/services/purchase-proposals';
import { assertProductsSellable } from '../src/core/products/sales-eligibility';
import { openBooks } from '../src/modules/finance/services/books';
import { postLedger } from '../src/modules/finance/services/ledger';

let phase='configuration';
async function main(){
 assert(process.platform==='linux' && process.env.ATLAS_SUPPLY_CHECK==='1' && process.env.ATLAS_RUNTIME!=='desktop');
 const base=new URL(process.env.ATLAS_SUPPLY_URL??'https://atlassystem.online');
 assert(base.origin==='https://atlassystem.online'||base.protocol==='http:'&&base.hostname==='127.0.0.1');
 assert(process.env.SESSION_SECRET);
 const qa=await sessionForUser(process.env.ATLAS_GUARDIAN_ORGANISATION_ID!,process.env.ATLAS_GUARDIAN_USER_ID!);
 assert(qa,'Active existing QA membership required');
 assert(qa.capabilities.has('atlas.staff.manage')&&qa.capabilities.has('atlas.companies.manage'),'Use existing authorised staff only.');
 const original=await db.membership.findUniqueOrThrow({where:{id:qa.membershipId}});
 const user=await db.user.findUniqueOrThrow({where:{id:qa.userId}});
 const slug=`supply-check-${randomBytes(10).toString('hex')}`;
 let fixtureId:string|undefined;let currentPage:Page|undefined;
 const out=process.env.ATLAS_SUPPLY_OUTPUT??'/tmp/atlas-supply-evidence';fs.mkdirSync(out,{recursive:true,mode:0o700});
 const browser=await chromium.launch({headless:true});
 try{
  phase='Test fixture';
  const org=await db.organisation.create({data:{name:'Manufacturing verification · Test',slug,isTest:true,moduleStates:{create:['manufacturing','planning','stock','products','sales','finance'].map(moduleId=>({moduleId,enabled:true,entitled:true}))}}});fixtureId=org.id;
  // Staff already have full company rights. This new affiliation has no roles/grants.
  const membership=await db.membership.create({data:{organisationId:org.id,userId:qa.userId}});
  const session=await sessionForUser(org.id,qa.userId);assert(session);
  const token=jwt.sign({userId:qa.userId,organisationId:org.id,authVersion:user.authVersion,sessionVersion:membership.sessionVersion},process.env.SESSION_SECRET,{algorithm:'HS256',expiresIn:'20m'});
  const warehouse=await db.warehouse.create({data:{organisationId:org.id,name:'Main warehouse',code:'MAIN'}});
  const raw=await db.product.create({data:{organisationId:org.id,code:'RAW-01',name:'Internal material',itemClass:'RAW',sellable:false,basePriceAmount:250}});
  const finished=await db.product.create({data:{organisationId:org.id,code:'FIN-01',name:'Finished assembly',itemClass:'FINISHED',sellable:true,basePriceAmount:1500}});
  const recipe=await db.productDefinition.create({data:{organisationId:org.id,productId:finished.id,version:1,status:'ACTIVE',supply:'MAKE',batchQuantity:1,yieldPercent:100,createdByUserId:qa.userId}});
  await db.productBomLine.create({data:{organisationId:org.id,definitionId:recipe.id,componentProductId:raw.id,quantityPerUnit:2}});
  await db.productOperation.create({data:{organisationId:org.id,definitionId:recipe.id,position:1,name:'Assemble',setupMinutes:10,runMinutesPerUnit:2}});
  const stock=getModule('stock')?.stockProvider;assert(stock);
  await stock.receiveStock(session,{requestKey:`${slug}-opening`,productId:raw.id,warehouseId:warehouse.id,quantity:5,reason:'Test fixture opening quantity',reference:slug,status:'AVAILABLE'});
  const forecastDate=new Date(Date.UTC(new Date().getUTCFullYear(),new Date().getUTCMonth()+1,1));
  await db.manufacturingDemandForecast.create({data:{organisationId:org.id,productId:finished.id,periodStart:forecastDate,quantity:10,createdByUserId:qa.userId}});
  const supplier=await db.party.create({data:{organisationId:org.id,kind:'COMPANY',name:'Fixture supplier',customerCode:'SUP-01',status:'ACTIVE'}});
  const entity=await db.$transaction(tx=>openBooks(tx,{organisationId:org.id,name:'Fixture books',code:'MAIN',currency:'GBP',startAt:new Date('2026-01-01'),endAt:new Date('2027-12-31'),actorUserId:qa.userId,reason:'Isolated acceptance fixture'}));
  const context=await browser.newContext({baseURL:base.origin});
  await context.addCookies([{name:'atlas_session',value:token,url:base.origin,httpOnly:true,secure:base.protocol==='https:',sameSite:'Lax'}]);
  let writes=0;const errors:string[]=[];
  await context.route('**/*',route=>{const request=route.request(),url=new URL(request.url());if(url.origin!==base.origin)return route.abort();if(url.pathname==='/api/guardian/telemetry')return route.fulfill({status:204});if(['GET','HEAD','OPTIONS'].includes(request.method()))return route.continue();if(request.method()==='POST'&&['/manufacturing','/manufacturing/planning/planned-orders','/finance/documents/new'].includes(url.pathname)){writes++;return route.continue();}return route.abort();});
  const page=await context.newPage();currentPage=page;page.on('pageerror',error=>errors.push(error.name));
  const noOverflow=async()=>assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'No root horizontal overflow');
  phase='responsive console';
  for(const [name,width,height]of [['desktop',1448,1086],['tablet',820,1180],['phone',390,844]]as const){
   await page.setViewportSize({width,height});assert.equal((await page.goto('/manufacturing',{waitUntil:'networkidle'}))?.status(),200);
   await expect(page.getByRole('heading',{name:'Plan it. Make it. Deliver it.'})).toBeVisible();await noOverflow();
   await page.screenshot({path:`${out}/console-${name}.png`,fullPage:false});console.log(`PASS ${name} console and overflow.`);
  }
  await page.setViewportSize({width:1448,height:1086});
  const modules=await getNavigableModules(session);assert(modules.some(m=>m.id==='manufacturing'));assert(!modules.some(m=>['planning','stock','products'].includes(m.id)));
  phase='single app navigation';
  await page.goto('/home',{waitUntil:'networkidle'});
  const apps=page.getByRole('navigation',{name:'Apps',exact:true});
  await expect(apps.locator('a[href="/manufacturing"]')).toHaveCount(1);
  for(const href of ['/planning','/stock','/products'])await expect(apps.locator(`a[href="${href}"]`)).toHaveCount(0);
  for(const href of ['/planning/plans','/stock','/stock/forecast','/stock/movements','/stock/warehouses','/products',`/products/${raw.id}`,`/stock/items/${raw.id}`]){
   assert.equal((await page.goto(href,{waitUntil:'networkidle'}))?.status(),200);
   await expect(page.getByRole('heading',{name:'Manufacturing & Supply',exact:true})).toHaveCount(1);
   await expect(page.getByRole('heading',{name:'Inventory',exact:true})).toHaveCount(0);
   await noOverflow();
  }
  await page.screenshot({path:`${out}/inventory-console-desktop.png`,fullPage:false});
  for(const width of [820,390]){
   await page.setViewportSize({width,height:844});
   for(const href of ['/stock','/products']){
    await page.goto(href,{waitUntil:'networkidle'});
    await expect(page.getByRole('heading',{name:'Manufacturing & Supply',exact:true})).toHaveCount(1);await noOverflow();
   }
  }
  await page.setViewportSize({width:1448,height:1086});
  await page.goto('/manufacturing',{waitUntil:'networkidle'});
  await page.getByRole('button',{name:'Apps',exact:true}).click();
  const menu=page.getByRole('navigation',{name:'Apps',exact:true});
  await expect(menu.locator('a[href="/manufacturing"]')).toHaveCount(1);
  for(const href of ['/planning','/stock','/products'])await expect(menu.locator(`a[href="${href}"]`)).toHaveCount(0);
  await page.getByRole('button',{name:'Apps',exact:true}).click();
  await page.goto('/apps',{waitUntil:'networkidle'});
  await expect(page.getByRole('link',{name:'Open Manufacturing & Supply',exact:true})).toHaveCount(1);
  for(const name of ['Open Inventory','Open Production Planning','Open Products'])await expect(page.getByRole('link',{name,exact:true})).toHaveCount(0);
  const features=page.getByRole('region',{name:'Manufacturing & Supply features',exact:true});
  for(const name of ['Inventory','Production Planning','Products'])await expect(features.getByText(name,{exact:true})).toBeVisible();
  console.log('PASS one app on Home, Apps switcher and Manage apps; Products/Inventory/Planning retain unified console navigation and existing routes.');
  await page.goto('/manufacturing',{waitUntil:'networkidle'});
  await page.getByRole('navigation',{name:'Console views'}).getByRole('link',{name:'Finance',exact:true}).click();await expect(page.getByRole('link',{name:/Supply spend report/}).last()).toBeVisible();
  await page.getByRole('button',{name:'Customise shortcuts'}).click();await page.getByLabel('Product targets',{exact:true}).click();await page.waitForURL(/pins=/);assert(new URL(page.url()).searchParams.get('pins')?.includes('targets'));
  await page.goto('/manufacturing',{waitUntil:'networkidle'});
  phase='real MRP calculation';await page.getByRole('button',{name:'Run material plan'}).click();
  await expect.poll(()=>db.manufacturingPlanningRun.count({where:{organisationId:org.id,finishedAt:{not:null}}})).toBe(1);
  const proposals=await db.manufacturingSupplySuggestion.findMany({where:{organisationId:org.id,status:'PENDING'}});
  const buy=proposals.find(p=>p.kind==='BUY'&&p.productId===raw.id),make=proposals.find(p=>p.kind==='MAKE'&&p.productId===finished.id);assert(buy&&make);assert.equal(buy.quantity.toString(),'15');assert.equal(make.quantity.toString(),'10');
  console.log('PASS actual MRP: 10 assemblies require 20 internal components, net of 5 stocked = 15 Buy.');
  phase='real Make conversion';await page.goto('/manufacturing/planning/planned-orders',{waitUntil:'networkidle'});await page.getByRole('button',{name:'Firm to production order'}).click();
  await expect.poll(()=>db.manufacturingOrder.count({where:{organisationId:org.id,productId:finished.id}})).toBe(1);
  await page.reload({waitUntil:'networkidle'});await expect(page.getByRole('link',{name:'View production order'})).toBeVisible();
  console.log('PASS rich saved proposal converts to one production order with source audit.');
  phase='real Buy conversion';await page.getByRole('link',{name:/Review purchase draft/}).click();
  await expect(page.getByRole('textbox',{name:'Quantity',exact:true})).toHaveValue('15');await expect(page.getByRole('combobox',{name:'Shared product'})).toHaveValue(raw.id);
  await page.locator('select[name="partyId"]').selectOption(supplier.id);await page.getByRole('button',{name:'Save draft',exact:true}).click();await expect(page.getByRole('alert').filter({hasText:'positive total'})).toContainText('positive total');assert.equal(await db.financeDocument.count({where:{organisationId:org.id,duplicateKey:`mrp-buy:${buy.id}`}}),0);await expect(page.getByRole('textbox',{name:'Quantity',exact:true})).toHaveValue('15');await expect(page.locator('select[name="partyId"]')).toHaveValue(supplier.id);
  await page.getByRole('textbox',{name:'Unit price',exact:true}).fill('2.50');await page.getByRole('button',{name:'Save draft',exact:true}).click();
  await page.waitForURL(/\/finance\/documents\/[^/?]+$/);const converted=await db.financeDocument.findFirstOrThrow({where:{organisationId:org.id,duplicateKey:`mrp-buy:${buy.id}`},include:{lines:true}});
  assert.equal(converted.status,'DRAFT');assert.equal(converted.net,3750n);assert.equal(converted.lines[0].productId,raw.id);assert.equal(converted.lines[0].quantity.toString(),'15');
  const savedBuy=await db.manufacturingSupplySuggestion.findUniqueOrThrow({where:{id:buy.id}});assert.equal(savedBuy.resultingPurchaseDocumentId,converted.id);assert.equal(savedBuy.resultingOrderId,null);
  assert.equal(await db.financeTimeline.count({where:{organisationId:org.id,documentId:converted.id,action:'MRP_SOURCE'}}),1);
  await assert.rejects(()=>supplyPurchaseProvider.read(session,buy.id),/actioned/);
  assert.equal(await db.financeDocument.count({where:{organisationId:org.id,duplicateKey:`mrp-buy:${buy.id}`}}),1);
  await page.goto('/manufacturing/planning/planned-orders',{waitUntil:'networkidle'});await expect(page.getByRole('link',{name:'View purchase draft'})).toHaveAttribute('href',`/finance/documents/${converted.id}`);
  await page.goto(`/finance/documents/new?suggestion=${buy.id}`,{waitUntil:'networkidle'});await expect(page.getByRole('alert').filter({hasText:'already been actioned'})).toContainText('already been actioned');assert.equal(await db.financeDocument.count({where:{organisationId:org.id,duplicateKey:`mrp-buy:${buy.id}`}}),1);
  console.log('PASS real source-linked purchase draft, exact values, timeline and repeat refusal.');
  await assert.rejects(()=>assertProductsSellable(db,org.id,[raw.id]),/internal|inactive/);await assertProductsSellable(db,org.id,[finished.id]);
  await page.goto(`/products/${raw.id}`,{waitUntil:'networkidle'});await expect(page.getByText(/Internal \/ not sellable/)).toBeVisible();
  console.log('PASS internal material stays purchasable/stocked and Sales eligibility rejects it.');
  phase='synthetic balanced Finance report inputs';
  // Report source fixtures use real ledger guards. Approval/payment workflows are not claimed here.
  await db.$transaction(async tx=>{
   const organisationId=org.id,accounts=await tx.financeAccount.findMany({where:{organisationId,entityId:entity.id}}),account=(control:string)=>{const found=accounts.find(a=>a.control===control);assert(found);return found.id;};
   const po=await tx.financeDocument.create({data:{organisationId,entityId:entity.id,kind:'PO',reference:'FIX-PO',title:'Synthetic reporting commitment',creatorUserId:qa.userId,partyId:supplier.id,currency:'GBP',documentDate:new Date('2026-10-01'),net:20000n,gross:20000n,status:'APPROVED',category:'Materials'}});
   for(const [kind,net,tax,settled,currency]of [['AP_INVOICE',10000n,2000n,2000n,'GBP'],['AP_CREDIT',2000n,400n,0n,'GBP'],['AP_DEBIT',500n,100n,0n,'GBP'],['AP_INVOICE',3000n,0n,0n,'EUR'],['RECEIPT',12000n,0n,0n,'GBP']]as const){
    const doc=await tx.financeDocument.create({data:{organisationId,entityId:entity.id,kind,reference:`FIX-${kind}-${currency}`,title:'Synthetic report input',reason:'Isolated report fixture; approval/payment acceptance is separate.',creatorUserId:qa.userId,partyId:supplier.id,currency,exchangeRate:currency==='EUR'?'0.85':'1',documentDate:new Date('2026-09-30'),accountingDate:new Date('2026-10-05'),net,tax,gross:net+tax,settled,category:'Materials',costCentre:'Plant',...(currency==='GBP'&&['AP_INVOICE','RECEIPT'].includes(kind)?{sourceId:po.id}:{}),...(kind==='RECEIPT'?{documentDate:new Date('2026-10-05')}: {})}});
    const credit=kind==='AP_CREDIT',receipt=kind==='RECEIPT';const lines=[{accountId:account(receipt?'INVENTORY':'EXPENSE'),description:'Fixture net',debit:credit?0n:net,credit:credit?net:0n},...(tax?[{accountId:account('VAT_INPUT'),description:'Fixture tax',debit:credit?0n:tax,credit:credit?tax:0n}]:[]),{accountId:account(receipt?'GRNI':'AP'),description:'Fixture control',debit:credit?net+tax:0n,credit:credit?0n:net+tax}];
    const journal=await postLedger(tx,session,{entityId:entity.id,date:new Date('2026-10-05'),description:'Isolated report fixture',sourceKey:`${slug}:${doc.id}`,sourceType:kind,sourceId:doc.id,currency,rate:currency==='EUR'?'0.85':'1',lines});
    await tx.financeDocument.update({where:{id:doc.id},data:{status:'POSTED',journalId:journal.id}});
   }
  },{timeout:30000});
  const report=await supplySpendProvider(session,{entity:entity.id,start:'2026-10-01',end:'2026-10-31',group:'supplier'});
  assert.deepEqual(report.totals.find(r=>r.currency==='GBP'),{currency:'GBP',postedNet:'8500',committedNet:'10000',receivedNet:'12000',openPayables:'8200'});
  assert.equal(report.totals.find(r=>r.currency==='EUR')?.postedNet,'3000');
  const restricted={...session,capabilities:new Set(['finance.report.read','atlas.staff.manage'])};const hidden=await supplySpendProvider(restricted,{entity:entity.id,start:'2026-10-01',end:'2026-10-31',group:'supplier'});assert(hidden.totals.every(r=>r.postedNet===null&&r.committedNet===null&&r.receivedNet===null&&r.openPayables===null));
  console.log('PASS GBP spend 85, commitment 100, receipts 120, open gross 82; EUR 30 kept separate; restricted values unavailable.');
  phase='report and guide browser';
  await page.goto(`/manufacturing/spend?entity=${entity.id}&start=2026-10-01&end=2026-10-31`,{waitUntil:'networkidle'});await expect(page.getByRole('heading',{name:'Supply spend report',exact:true})).toBeVisible();await noOverflow();await page.screenshot({path:`${out}/spend-desktop.png`,fullPage:false});
  await expect(page.getByText('£85.00',{exact:true}).first()).toBeVisible();await page.getByRole('link',{name:'FIX-AP_INVOICE-GBP',exact:true}).click();await expect(page.getByRole('heading',{name:'FIX-AP_INVOICE-GBP'})).toBeVisible();
  for(const [name,width,height]of [['desktop',1448,1086],['phone',390,844]]as const){await page.setViewportSize({width,height});assert.equal((await page.goto('/manufacturing/help/products-stock',{waitUntil:'networkidle'}))?.status(),200);await expect(page.getByRole('heading',{name:'Set up products, materials and stock',exact:true})).toBeVisible();assert(await page.locator('img').evaluateAll(images=>images.every(image=>(image as HTMLImageElement).complete&&(image as HTMLImageElement).naturalWidth>0)));await noOverflow();await page.screenshot({path:`${out}/guide-${name}.png`,fullPage:false});}
  for(const guide of ['start','demand','mrp','procurement','receiving','schedule','production','spend'])assert.equal((await page.goto(`/manufacturing/help/${guide}`,{waitUntil:'networkidle'}))?.status(),200);
  assert.equal(errors.length,0);assert(writes>=3);console.log('PASS report drill-through, nine illustrated guides, responsive pictures and zero browser exceptions.');
  await context.close();
 }finally{
  if(currentPage&&!currentPage.isClosed()){await currentPage.screenshot({path:`${out}/final-state.png`,fullPage:false}).catch(()=>{});fs.writeFileSync(`${out}/alerts.txt`,JSON.stringify(await currentPage.getByRole("alert").allTextContents().catch(()=>[])),{mode:0o600});}
  await browser.close();
  if(fixtureId)await db.$transaction(async tx=>{await tx.organisation.findFirstOrThrow({where:{id:fixtureId,slug,isTest:true}});await tx.organisation.update({where:{id:fixtureId},data:{status:'SUSPENDED',name:'Retired manufacturing verification · Test'}});await tx.membership.updateMany({where:{organisationId:fixtureId,userId:qa.userId},data:{active:false,sessionVersion:{increment:1}}});});
  assert.deepEqual(await db.membership.findUniqueOrThrow({where:{id:original.id}}),original,'Existing QA membership unchanged');assert.equal((await db.user.findUniqueOrThrow({where:{id:user.id}})).authVersion,user.authVersion);
  await db.$disconnect();console.log('PASS exact Test company retired and fixture session revoked; history retained; existing QA account/permissions unchanged.');
 }
}
main().catch(error=>{const out=process.env.ATLAS_SUPPLY_OUTPUT??'/tmp/atlas-supply-evidence';fs.mkdirSync(out,{recursive:true,mode:0o700});fs.writeFileSync(`${out}/failure.txt`,error instanceof Error?error.stack??error.message:'UnknownError',{mode:0o600});console.error(`Supply acceptance failed at ${phase}: ${error instanceof Error?error.name:'UnknownError'}. Inspect private evidence; no credentials or customer data logged.`);process.exitCode=1;});
