/** Explicit server-only acceptance. Writes only disposable isTest tenants; revokes them in finally. */
import assert from 'node:assert/strict';
import {randomBytes} from 'node:crypto';
import {readFile} from 'node:fs/promises';
import bcrypt from 'bcryptjs';
import {db} from '../src/core/db/client';
import {monthOffset} from '../src/modules/sop/domain/engine';
import type {SopPayload} from '../src/modules/sop/services/workspace';

async function main(){
 if(process.env.ATLAS_SOP_LIVE_TEST!=='1'||process.env.ATLAS_RUNTIME==='desktop')throw Error('Run on the deployed server with ATLAS_SOP_LIVE_TEST=1.');
 const base=process.env.ATLAS_SOP_TEST_URL??'https://atlassystem.online';
 const suffix=randomBytes(8).toString('hex'),password=randomBytes(24).toString('base64url');
 const manifest=JSON.parse(await readFile('.next/server/server-reference-manifest.json','utf8'));
 let checks=0;
 const check=(value:unknown,label:string)=>{assert(value,label);checks++;console.log(`PASS ${label}`);};
 const errorResult=(r:{response:Response;body:string})=>r.response.status>=400||/(?:^|\n)\w+:E\{/.test(r.body);
 const post=async(name:string,args:unknown[],cookie='',fields?:Record<string,string|string[]>)=>{
  const action=Object.entries(manifest.node as Record<string,{exportedName?:string}>).find(([,value])=>value.exportedName===name);assert(action,`Deployed action ${name}`);
  const headers:Record<string,string>={Origin:base,'Next-Action':action[0],Accept:'text/x-component',...(cookie?{Cookie:cookie}:{})};
  let body:FormData|string;
  if(fields){const data=new FormData();for(const [key,values]of Object.entries(fields))for(const value of Array.isArray(values)?values:[values])data.append(`_1_${key}`,value);data.set('0',JSON.stringify([...args,'$K1']));body=data;}else{body=JSON.stringify(args);headers['Content-Type']='text/plain;charset=UTF-8';}
  const path=name==='loginAction'?'/login':name==='runMrp'?'/manufacturing/plan':name.includes('Plan')&&!name.includes('Sop')?'/plan':'/sop';
  const response=await fetch(base+path,{method:'POST',redirect:'manual',headers,body});return {response,body:await response.text()};
 };
 const call=async(name:string,args:unknown[],cookie:string,fields?:Record<string,string|string[]>)=>{const result=await post(name,args,cookie,fields);assert(!errorResult(result),`${name}: HTTP ${result.response.status}, action error ${errorResult(result)}`);return result;};
 const denied=async(name:string,args:unknown[],cookie:string,fields?:Record<string,string|string[]>)=>check(errorResult(await post(name,args,cookie,fields)),`${name} rejects unauthorised/stale operation`);
 const login=async(email:string)=>{const result=await post('loginAction',[],'',{email,password});const cookie=result.response.headers.get('set-cookie')?.match(/atlas_session=[^;]+/)?.[0];assert(cookie,'Normal password sign-in');return cookie;};
 const companies:string[]=[],users:string[]=[];
 try{
  const company=await db.organisation.create({data:{name:`Disposable S&OP ${suffix}`,slug:`sop-check-${suffix}`,isTest:true}});companies.push(company.id);const organisationId=company.id;
  const outside=await db.organisation.create({data:{name:`Disposable S&OP outside ${suffix}`,slug:`sop-outside-${suffix}`,isTest:true}});companies.push(outside.id);
  for(const org of companies)await db.moduleState.createMany({data:['plan','sop','products','sales','crm','stock','logistics','manufacturing','planning'].map(moduleId=>({organisationId:org,moduleId,enabled:true,entitled:true}))});
  const capabilities=['plan.read','plan.create','plan.edit','plan.approve','sop.read','sop.manage','sop.approve','sop.publish','sop.share','sales.order.read','sales.quote.read','sales.opportunity.read','sales.pipeline.manage','customers.read','core.products.read','stock.read','logistics.shipment.read','logistics.receipt.execute','manufacturing.order.read','manufacturing.plan.read','manufacturing.plan.manage','planning.read'];
  const makeUser=async(name:string,caps:string[],org=organisationId)=>{const user=await db.user.create({data:{name:`S&OP check ${name}`,email:`sop-${name}-${suffix}@example.test`,passwordHash:await bcrypt.hash(password,10)}});users.push(user.id);await db.membership.create({data:{organisationId:org,userId:user.id,grantedCapabilities:caps}});return user;};
  const maker=await makeUser('maker',capabilities),reviewer=await makeUser('reviewer',capabilities),reader=await makeUser('reader',['sop.read','plan.read']),foreigner=await makeUser('outside',capabilities,outside.id);
  const makerCookie=await login(maker.email),reviewCookie=await login(reviewer.email),readCookie=await login(reader.email),outsideCookie=await login(foreigner.email);
  const first=new Date().toISOString().slice(0,7),start=first+'-01',end=new Date(monthOffset(first,12)+'-01T00:00:00Z');end.setUTCDate(0);
  const product=await db.product.create({data:{organisationId,code:'SOP-CHECK',name:'Synthetic S&OP product',basePriceAmount:1000,baseCurrency:'GBP',unitOfMeasure:'each'}});
  await db.productDefinition.create({data:{organisationId,productId:product.id,version:1,status:'ACTIVE',supply:'MAKE',batchQuantity:1,yieldPercent:100,createdByUserId:maker.id}});
  const party=await db.party.create({data:{organisationId,kind:'COMPANY',name:'Synthetic S&OP customer',customerCode:'SOP-CHECK',tags:[]}});
  const project=await db.salesProject.create({data:{organisationId,reference:'SP-CHECK',name:'Synthetic growth project',ownerUserId:maker.id,probability:50,potentialValueAmount:1000000}});
  const order=async(reference:string,month:string,quantity:number,status:'CLOSED'|'CONFIRMED',projectId?:string)=>db.salesOrder.create({data:{organisationId,reference,partyId:party.id,ownerUserId:maker.id,commercialStatus:status,orderDate:new Date(month+'-01T00:00:00Z'),requestedDeliveryDate:new Date(month+'-05T00:00:00Z'),promisedDeliveryDate:new Date(month+'-05T00:00:00Z'),salesProjectId:projectId,netAmount:quantity*1000,lines:{create:{lineNumber:1,productId:product.id,descriptionSnapshot:product.name,orderedQuantity:quantity,unitPriceAmount:1000,netAmount:quantity*1000}}},include:{lines:true}});
  for(let lag=12;lag>0;lag--)await order(`SO-HISTORY-${lag}`,monthOffset(first,-lag),100,'CLOSED');
  const historical=await db.salesOrder.findFirstOrThrow({where:{organisationId,reference:'SO-HISTORY-1'},include:{lines:true}});
  const fulfilment=await db.fulfilmentRequirement.create({data:{organisationId,reference:'FF-HISTORY',salesOrderId:historical.id,partyId:party.id,shipTo:{},sourceEventKey:`sop-check-${suffix}`,status:'DELIVERED'}});
  const fulfilmentLine=await db.fulfilmentLine.create({data:{organisationId,requirementId:fulfilment.id,salesOrderLineId:historical.lines[0].id,productId:product.id,description:product.name,orderedQuantity:100,shippedQuantity:100,deliveredQuantity:100}});
  for(const [index,day]of ['04','05'].entries()){const shipment=await db.shipment.create({data:{organisationId,reference:`SH-HISTORY-${index}`,partyId:party.id,shipTo:{},status:'DELIVERED',inFull:true,plannedDispatchAt:new Date(monthOffset(first,-1)+'-03'),dispatchedAt:new Date(monthOffset(first,-1)+'-03'),deliveredAt:new Date(monthOffset(first,-1)+'-'+day)}});await db.shipmentSource.create({data:{organisationId,salesOrderId:historical.id,shipmentId:shipment.id,requirementId:fulfilment.id,fulfilmentLineId:fulfilmentLine.id,quantity:50}});}
  const partialOrder=await db.salesOrder.findFirstOrThrow({where:{organisationId,reference:'SO-HISTORY-2'},include:{lines:true}});
  const partialRequirement=await db.fulfilmentRequirement.create({data:{organisationId,reference:'FF-PARTIAL',salesOrderId:partialOrder.id,partyId:party.id,shipTo:{},sourceEventKey:`sop-partial-${suffix}`,status:'DELIVERED'}});
  const partialLine=await db.fulfilmentLine.create({data:{organisationId,requirementId:partialRequirement.id,salesOrderLineId:partialOrder.lines[0].id,productId:product.id,description:product.name,orderedQuantity:100,shippedQuantity:100,deliveredQuantity:100}});
  const partialShipment=await db.shipment.create({data:{organisationId,reference:'SH-PARTIAL',partyId:party.id,shipTo:{},status:'DELIVERED',inFull:false,dispatchedAt:new Date(monthOffset(first,-2)+'-03'),deliveredAt:new Date(monthOffset(first,-2)+'-05')}});
  await db.shipmentSource.create({data:{organisationId,salesOrderId:partialOrder.id,shipmentId:partialShipment.id,requirementId:partialRequirement.id,fulfilmentLineId:partialLine.id,quantity:100}});
  const firm=await order('SO-FIRM',first,200,'CONFIRMED',project.id);
  await call('createPlan',[],makerCookie,{name:'Synthetic Sales operating plan',type:'sales',mode:'custom',start,end:end.toISOString().slice(0,10),measuresChosen:'1',metric:['sales_volume','revenue']});
  const plan=await db.businessPlan.findFirstOrThrow({where:{organisationId,name:'Synthetic Sales operating plan'}});
  check(plan.audience==='private','New departmental Plan is private');
  const input=async(revision:number,value='1000')=>call('savePlanInput',[],makerCookie,{planId:plan.id,revision:String(revision),metricKey:'sales_volume',value,label:'Growth project volume',note:'Synthetic monthly project assumption',source:`crm|sales-project|${project.id}`,productId:product.id,period:first,unitPrice:'10'});
  await input(plan.revision);
  const saved=await db.planInput.findFirstOrThrow({where:{planId:plan.id,organisationId}});
  check(!saved.probabilityOverride&&Number(saved.probability)===50&&saved.sourceId===project.id,'Plan retains canonical project, live probability and product/month');
  await denied('savePlanInput',[],makerCookie,{planId:plan.id,revision:String(plan.revision),metricKey:'sales_volume',value:'50',label:'Stale',note:'Stale revision',productId:product.id,period:first});
  await call('applyPlanInputs',[],makerCookie,{planId:plan.id,revision:String((await db.businessPlan.findUniqueOrThrow({where:{id:plan.id}})).revision)});
  const volume=await db.planCell.findFirstOrThrow({where:{planId:plan.id,metricKey:'sales_volume',periodKey:first,kind:'forecast'}});
  check(Number(volume.value)===500,'Plan working forecast uses probability-weighted project volume');
  await denied('savePlanInput',[],outsideCookie,{planId:plan.id,revision:'3'});
  await call('createSopCycle',[],makerCookie,{name:'Synthetic S&OP cycle',start:first,horizon:'12',currency:'GBP'});
  let cycle=await db.sopCycle.findFirstOrThrow({where:{organisationId,name:'Synthetic S&OP cycle'}});
  await denied('configureSopCycle',[],outsideCookie,{cycleId:cycle.id,revision:String(cycle.revision)});
  await denied('configureSopCycle',[],readCookie,{cycleId:cycle.id,revision:String(cycle.revision)});
  await call('configureSopCycle',[],makerCookie,{cycleId:cycle.id,revision:String(cycle.revision),planId:plan.id,targetPlanId:plan.id,productCodes:product.code,historyMonths:'12',signal:'requested',method:'auto',consumption:'consume',priceChange:'0',unitCost:'4',lateToleranceDays:'0',inFullPercent:'100'});
  cycle=await db.sopCycle.findUniqueOrThrow({where:{id:cycle.id}});
  await call('generateSopForecast',[],makerCookie,{cycleId:cycle.id,revision:String(cycle.revision),name:'Synthetic consensus'});
  let version=await db.sopVersion.findFirstOrThrow({where:{cycleId:cycle.id,name:'Synthetic consensus'}});
  const payload=version.payload as unknown as SopPayload,month=payload.rows.find(row=>row.period===first)!;
  check(payload.rows.length===12&&payload.models[0].history.every(n=>n===100),'Twelve closed historical months produce the twelve-month forecast');
  check(month.baseline===100&&month.confirmedOrders===200&&month.projectWeighted===500&&month.projectConsumed===200&&month.consensus===500,'Firm orders consume baseline and linked project once; consensus is 500');
  check(month.revenueMinor===500000&&month.marginMinor===300000,'Financial projection preserves committed price and explicit assumed cost');
  await denied('publishSopVersion',[],makerCookie,{cycleId:cycle.id,versionId:version.id});
  check(await db.manufacturingDemandForecast.count({where:{organisationId}})===0,'Draft demand cannot enter Manufacturing');
  await denied('approveSopVersion',[],makerCookie,{cycleId:cycle.id,versionId:version.id});
  await call('setPlanAudience',[],makerCookie,{planId:plan.id,audience:'company'});
  cycle=await db.sopCycle.findUniqueOrThrow({where:{id:cycle.id}});
  await call('updateSopWorkflow',[],makerCookie,{cycleId:cycle.id,revision:String(cycle.revision),kind:'share'});
  await call('createSopScenario',[],makerCookie,{cycleId:cycle.id,versionId:version.id,name:'Synthetic growth scenario',percent:'20',pricePercent:'10',productionPercent:'0',receiptDelayMonths:'0',unitCostPercent:'0',reason:'Synthetic scenario review'});
  const scenario=await db.sopVersion.findFirstOrThrow({where:{cycleId:cycle.id,kind:'scenario'}});
  check((scenario.payload as unknown as SopPayload).rows[0].consensus===600&&JSON.stringify(version.payload)===JSON.stringify((await db.sopVersion.findUniqueOrThrow({where:{id:version.id}})).payload),'Scenario changes retain the original consensus evidence');
  await denied('publishSopVersion',[],makerCookie,{cycleId:cycle.id,versionId:scenario.id});
  const review=async()=>{for(let index=0;index<7;index++){cycle=await db.sopCycle.findUniqueOrThrow({where:{id:cycle.id}});await call('updateSopWorkflow',[],reviewCookie,{cycleId:cycle.id,versionId:version.id,revision:String(cycle.revision),kind:'stage',index:String(index),status:'approved',owner:reviewer.name,dueOn:new Date().toISOString().slice(0,10)});}await call('approveSopVersion',[],reviewCookie,{cycleId:cycle.id,versionId:version.id});};
  await review();
  check((await db.sopVersion.findUniqueOrThrow({where:{id:version.id}})).status==='approved','Seven exact-version reviews allow consensus approval');
  await db.salesProject.update({where:{id:project.id},data:{probability:60}});
  await denied('publishSopVersion',[],makerCookie,{cycleId:cycle.id,versionId:version.id});
  check(await db.manufacturingDemandForecast.count({where:{organisationId}})===0,'Live project probability change invalidates approved publication');
  cycle=await db.sopCycle.findUniqueOrThrow({where:{id:cycle.id}});
  await call('generateSopForecast',[],makerCookie,{cycleId:cycle.id,revision:String(cycle.revision),name:'Synthetic refreshed consensus'});
  version=await db.sopVersion.findFirstOrThrow({where:{cycleId:cycle.id,name:'Synthetic refreshed consensus'}});
  await review();
  await call('publishSopVersion',[],makerCookie,{cycleId:cycle.id,versionId:version.id});await call('publishSopVersion',[],makerCookie,{cycleId:cycle.id,versionId:version.id});
  const forecasts=await db.manufacturingDemandForecast.findMany({where:{organisationId}});
  check(forecasts.length===12&&forecasts.every(row=>row.sourceSopVersionId===version.id),'Publication/replay creates twelve total-demand rows with immutable lineage');
  const oldId=`old-version-${suffix}`;
  const oldCycle=await db.sopCycle.create({data:{organisationId,name:'Synthetic older overlapping cycle',startsOn:cycle.startsOn,endsOn:cycle.endsOn,currency:'GBP',ownerUserId:maker.id,inputRevision:version.sourceRevision,sourcePlanIds:[plan.id],settings:JSON.parse(JSON.stringify(cycle.settings)),workflow:Array.from({length:7},(_,index)=>({title:String(index),status:'approved',versionId:oldId}))}});
  await db.sopVersion.create({data:{id:oldId,organisationId,cycleId:oldCycle.id,name:'Older overlapping evidence',status:'approved',sourceRevision:version.sourceRevision,payload:JSON.parse(JSON.stringify(version.payload)),requiredCapabilities:version.requiredCapabilities,requiredModules:version.requiredModules,createdByUserId:maker.id,createdAt:new Date(version.createdAt.getTime()-1000)}});
  await denied('publishSopVersion',[],makerCookie,{cycleId:oldCycle.id,versionId:oldId});
  check((await db.manufacturingDemandForecast.findMany({where:{organisationId}})).every(row=>row.sourceSopVersionId===version.id)&&(await db.sopVersion.findUniqueOrThrow({where:{id:oldId}})).status==='approved','Older overlapping cycle publication rolls back and preserves newer approved demand');
  await call('runMrp',[],makerCookie);
  const run=await db.manufacturingPlanningRun.findFirstOrThrow({where:{organisationId},orderBy:{startedAt:'desc'}});
  const suggestions=await db.manufacturingSupplySuggestion.findMany({where:{organisationId,runId:run.id}});
  check(suggestions.length===1&&Number(suggestions[0].quantity)===forecasts.reduce((sum,row)=>sum+Number(row.quantity),0),'Actual Manufacturing screen MRP consumes approved totals and firm orders once, including current month');
  let immutable=false;try{await db.sopVersion.update({where:{id:version.id},data:{payload:{tampered:true}}});}catch{immutable=true;}
  check(immutable,'Database rejects rewriting calculated S&OP evidence');
  await db.membership.updateMany({where:{organisationId,userId:reviewer.id},data:{grantedCapabilities:capabilities.filter(c=>c!=='sales.opportunity.read')}});
  const deniedPage=await fetch(`${base}/sop?cycle=${cycle.id}&version=${version.id}`,{headers:{Cookie:reviewCookie}});check(!(await deniedPage.text()).includes('Synthetic refreshed consensus</option>'),'Snapshot payload is unavailable after source permission loss');
  for(const view of ['overview','demand','service','supply','finance','products','customers','projects','scenarios','cycle','history']){
   const response=await fetch(`${base}/sop?cycle=${cycle.id}&version=${version.id}&view=${view}`,{headers:{Cookie:makerCookie},redirect:'manual'}),html=await response.text();check(response.status===200&&html.includes('Synthetic S&amp;OP cycle')&&!html.includes('This page could not be loaded'),`Authenticated S&OP ${view} screen`);
  }
  const planPage=await fetch(`${base}/plan/plans/${plan.id}?tab=inputs`,{headers:{Cookie:makerCookie}});check(planPage.status===200&&(await planPage.text()).includes('Build the plan'),'Authenticated connected Plan builder');
  const launcher=await fetch(base+'/home',{headers:{Cookie:makerCookie}});check((await launcher.text()).includes('S&amp;OP'),'Authorised Apps navigation includes S&OP');
  const {chromium}=await import('@playwright/test');
  const browser=await chromium.launch({headless:true,...(process.env.ATLAS_CHROMIUM_PATH?{executablePath:process.env.ATLAS_CHROMIUM_PATH}:{}),args:['--no-sandbox']});
  try{const context=await browser.newContext({viewport:{width:1280,height:900}});await context.addCookies([{name:'atlas_session',value:makerCookie.slice('atlas_session='.length),url:base,httpOnly:true,secure:true}]);const page=await context.newPage();let runtimeErrors=0;page.on('pageerror',()=>runtimeErrors++);
   await page.goto(`${base}/sop?cycle=${cycle.id}&version=${version.id}&view=demand`,{waitUntil:'networkidle'});await page.getByText('Synthetic refreshed consensus',{exact:true}).first().waitFor({state:'attached'});check(await page.locator('body').innerText().then(t=>t.includes('SOP-CHECK'))&&runtimeErrors===0,'Real Chromium renders live demand with no runtime errors');
   await page.goto(`${base}/sop?cycle=${cycle.id}&view=service&filter=all`,{waitUntil:'networkidle'});const serviceRow=page.getByRole('link',{name:'SO-HISTORY-1 ↗',exact:true}).locator('xpath=ancestor::tr');check((await serviceRow.innerText()).includes('100 / 100')&&await serviceRow.getByText('pass',{exact:true}).count()===2,'Live service aggregates two deliveries into Customer and Promise OTIF passes');
   const partialRow=page.getByRole('link',{name:'SO-HISTORY-2 ↗',exact:true}).locator('xpath=ancestor::tr');check(await partialRow.getByText('unavailable',{exact:true}).count()===2,'Unverified partial receipts stay unavailable for OTIF and do not reopen closed demand');
   await page.setViewportSize({width:657,height:758});await page.goto(`${base}/sop?cycle=${cycle.id}&version=${version.id}&view=cycle`,{waitUntil:'networkidle'});check(await page.locator('body').innerText().then(t=>t.includes('Executive review'))&&runtimeErrors===0,'Narrow live review screen renders its controls');await context.close();
  }finally{await browser.close();}
  check(firm.lines.length===1,'Canonical Sales source remains intact');
  console.log(`LIVE S&OP ACCEPTANCE PASSED: ${checks} assertions`);
 }finally{
  for(const id of companies){assert((await db.organisation.findUnique({where:{id}}))?.isTest,'Cleanup only synthetic company');await db.organisation.update({where:{id},data:{status:'SUSPENDED'}});}
  await db.membership.updateMany({where:{userId:{in:users}},data:{active:false,grantedCapabilities:[],sessionVersion:{increment:1}}});await db.user.updateMany({where:{id:{in:users}},data:{passwordHash:await bcrypt.hash(randomBytes(32).toString('base64url'),10),authVersion:{increment:1}}});await db.$disconnect();console.log('Synthetic tenants suspended; temporary credentials revoked; central evidence retained.');
 }
}
main().catch(error=>{console.error(error instanceof Error?error.message:'S&OP acceptance failed');process.exitCode=1;});
