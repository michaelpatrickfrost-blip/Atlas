/** Explicit server-only browser acceptance; fixture access revoked, central audit retained. */
import assert from 'node:assert/strict';
import { randomBytes } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import bcrypt from 'bcryptjs';
import { chromium } from '@playwright/test';
import { db } from '../src/core/db/client';
async function main(){
 assert(process.platform==='linux'&&process.env.ATLAS_MARKETING_TEST==='1'&&process.env.ATLAS_RUNTIME!=='desktop','Explicit server acceptance required');
 const base='https://atlassystem.online',suffix=randomBytes(8).toString('hex'),password=randomBytes(24).toString('base64url'),companies:string[]=[],users:string[]=[];
 let checks=0;const check=(condition:unknown,label:string)=>{assert(condition,label);checks++;console.log(`PASS ${label}`);};
 const manifest=JSON.parse(await readFile('.next/server/server-reference-manifest.json','utf8'));
 const post=async(name:string,values:Record<string,string>,cookie='')=>{
  const candidates=Object.entries(manifest.node as Record<string,{exportedName?:string;workers?:Record<string,unknown>}>).filter(([,value])=>value.exportedName===name);
  const action=candidates.find(([,value])=>Object.keys(value.workers??{}).some(key=>key.includes('marketing/campaigns/')) )??candidates[0];assert(action,`Action ${name}`);
  const form=new FormData();for(const [key,value]of Object.entries(values))form.set(`_1_${key}`,value);form.set('0','["$K1"]');
  const response=await fetch(base+(name==='loginAction'?'/login':'/marketing/campaigns/new'),{method:'POST',headers:{Origin:base,'Next-Action':action[0],Accept:'text/x-component',...(cookie?{Cookie:cookie}:{})},body:form,redirect:'manual'});
  return {response,body:await response.text()};
 };
 const login=async(email:string)=>{const result=await post('loginAction',{email,password});const cookie=result.response.headers.get('set-cookie')?.match(/atlas_session=[^;]+/)?.[0];assert(cookie,'Normal login');return cookie;};
 try{
  for(const kind of ['inside','outside']){const org=await db.organisation.create({data:{name:`Synthetic marketing ${kind}`,slug:`marketing-${kind}-${suffix}`,isTest:true}});companies.push(org.id);await db.moduleState.create({data:{organisationId:org.id,moduleId:'marketing',enabled:true,entitled:true}});}
  const caps=['marketing.campaign.read','marketing.campaign.create','marketing.campaign.manage','marketing.content.read','marketing.content.create','marketing.audience.read','marketing.email.read','marketing.profile.read','marketing.consent.view','marketing.report.read'];
  const makeUser=async(name:string,grants:string[],organisationId=companies[0])=>{const user=await db.user.create({data:{name:`Synthetic ${name}`,email:`marketing-${name}-${suffix}@example.test`,passwordHash:await bcrypt.hash(password,10)}});users.push(user.id);await db.membership.create({data:{organisationId,userId:user.id,grantedCapabilities:grants}});return user;};
  const worker=await makeUser('manager',caps),observer=await makeUser('reader',['marketing.campaign.read']),foreign=await makeUser('outside',caps,companies[1]);
  const workerCookie=await login(worker.email),observerCookie=await login(observer.email),foreignCookie=await login(foreign.email);
  const browser=await chromium.launch({args:['--no-sandbox'],...(process.env.ATLAS_CHROMIUM_PATH?{executablePath:process.env.ATLAS_CHROMIUM_PATH}:{})});
  try{
   const context=await browser.newContext({viewport:{width:1440,height:1000}});await context.addCookies([{name:'atlas_session',value:workerCookie.slice(14),url:base,httpOnly:true,secure:true}]);const page=await context.newPage();let errors=0;page.on('pageerror',()=>errors++);
   await page.goto(base+'/marketing/campaigns/new',{waitUntil:'domcontentloaded'});
   await page.getByRole('button',{name:/Blank campaign/}).click();
   await page.getByLabel('Campaign name',{exact:true}).fill('Synthetic expanded campaign');await page.getByLabel('Code (optional)',{exact:true}).fill('MK-TEST');await page.getByLabel('Brand',{exact:true}).fill('TEST-BRAND');
   await page.locator('form nav').getByRole('button',{name:/Message and offer$/}).click();
   await page.getByText('Detailed brief, custom information and resources',{exact:true}).click();await page.getByText('Audience and insight',{exact:true}).click();
   await page.getByLabel('Customer problem',{exact:true}).fill('Slow response to trade enquiries.');
   await page.getByRole('button',{name:'Add custom field',exact:true}).click();await page.getByLabel('Field name 1',{exact:true}).fill('Agency contact');await page.getByLabel('Field value 1',{exact:true}).fill('Synthetic creative team');
   await page.getByRole('button',{name:'Add resource link',exact:true}).click();await page.getByLabel('Resource name 1',{exact:true}).fill('Creative pack');await page.getByLabel('Resource URL 1',{exact:true}).fill('https://example.com/creative');
   await page.locator('form nav').getByRole('button',{name:/Channels and budget$/}).click();await page.getByLabel('Email',{exact:true}).check();await page.getByLabel('Total budget',{exact:true}).fill('120.50');await page.locator('input[name="split:Email"]').fill('121');
   await page.getByRole('button',{name:'Create now',exact:true}).click();await page.getByRole('alert').filter({hasText:'exceed'}).waitFor();
   check(await page.getByLabel('Total budget',{exact:true}).inputValue()==='120.50'&&await db.marketingCampaign.count({where:{organisationId:companies[0]}})===0,'Rejected allocation preserves draft and creates no partial campaign');
   await page.locator('input[name="split:Email"]').fill('120.50');await page.getByRole('button',{name:'Create now',exact:true}).click();await page.waitForURL(/\/marketing\/campaigns\/(?!new)[^/]+$/);
   const campaign=await db.marketingCampaign.findFirstOrThrow({where:{organisationId:companies[0],code:'MK-TEST'}});
   const brief=campaign.brief as {workspace:{fields:Record<string,string>;custom:{label:string;value:string}[];resources:{url:string}[]}};
   check(campaign.brand==='TEST-BRAND'&&brief.workspace.fields.customerProblem.includes('Slow response')&&brief.workspace.custom[0].value==='Synthetic creative team'&&brief.workspace.resources[0].url==='https://example.com/creative','Created campaign retains brand, extended brief, custom fields and links centrally');
   check(await db.marketingBudgetLine.count({where:{organisationId:companies[0],campaignId:campaign.id,plannedMinor:12050}})===1&&await db.marketingActivity.count({where:{organisationId:companies[0],campaignId:campaign.id}})>0,'Campaign budget and generated launch plan created together');
   await page.getByRole('tab',{name:/Content and links/}).click();check(await page.getByRole('link',{name:'Creative pack',exact:true}).getAttribute('href')==='https://example.com/creative','Campaign resource is accessible from Content and links');
   await page.getByText('Add campaign content',{exact:true}).click();await page.getByLabel('Content name',{exact:true}).fill('Synthetic creative brief');await page.getByLabel('Copy / creative brief',{exact:true}).fill('Draft trade campaign copy.\nUse approved photography and a clear quote request.');await page.getByLabel('Usage rights',{exact:true}).fill('Synthetic internal review only');await page.getByRole('button',{name:'Save campaign content',exact:true}).click();await page.getByRole('status').filter({hasText:'Saved.'}).waitFor();
   check(await db.marketingContent.count({where:{organisationId:companies[0],campaignId:campaign.id,name:'Synthetic creative brief',brand:'TEST-BRAND',status:'DRAFT'}})===1,'Campaign content saves with correct campaign and brand without granting approval');
   await page.reload({waitUntil:'domcontentloaded'});await page.getByRole('tab',{name:'Brief',exact:true}).click();
   check(await page.getByLabel('Brand',{exact:true}).inputValue()==='TEST-BRAND'&&await page.getByLabel('Field value 1',{exact:true}).inputValue()==='Synthetic creative team','Saved brief and custom information reappear when editing');
   const second=await context.newPage();await second.goto(`${base}/marketing/campaigns/${campaign.id}#brief`,{waitUntil:'domcontentloaded'});await second.getByRole('tab',{name:'Brief',exact:true}).click();await second.getByLabel('Campaign name',{exact:true}).fill('Stale draft must remain');
   await page.getByLabel('Campaign name',{exact:true}).fill('Updated marketing campaign');await page.getByRole('button',{name:'Save brief',exact:true}).click();await page.getByRole('status').filter({hasText:'Saved.'}).waitFor();
   await second.getByRole('button',{name:'Save brief',exact:true}).click();await second.getByRole('alert').filter({hasText:'changed'}).waitFor();
   check(await second.getByLabel('Campaign name',{exact:true}).inputValue()==='Stale draft must remain'&&(await db.marketingCampaign.findUniqueOrThrow({where:{id:campaign.id}})).name==='Updated marketing campaign','Two-tab stale save retains entered work and protects the newer campaign');await second.close();
   await page.setViewportSize({width:390,height:844});check(await page.locator('main').evaluate(element=>element.scrollWidth<=element.clientWidth),'Campaign brief fits a phone viewport');check(errors===0,'Marketing journey has no browser runtime errors');
   for(const [cookie,visible]of [[observerCookie,true],[foreignCookie,false]] as const){const other=await browser.newContext();await other.addCookies([{name:'atlas_session',value:cookie.slice(14),url:base,httpOnly:true,secure:true}]);const view=await other.newPage();await view.goto(`${base}/marketing/campaigns/${campaign.id}`,{waitUntil:'domcontentloaded'});check((await view.locator('body').innerText()).includes('Updated marketing campaign')===visible&&await view.getByRole('button',{name:'Save brief',exact:true}).count()===0,'Read-only and other-company campaign access preserves permissions');await other.close();}
   const denied=await post('saveCampaignBriefAction',{campaignId:campaign.id,version:'2',name:'Bypass'},observerCookie);check(/(?:^|\n)\w+:E\{/.test(denied.body)||denied.response.status>=400,'Read-only profile cannot bypass campaign manage permission');
   await context.close();console.log(`LIVE MARKETING ACCEPTANCE PASSED: ${checks} assertions`);
  }finally{await browser.close();}
 }finally{
  for(const id of companies)await db.organisation.update({where:{id},data:{status:'SUSPENDED'}});
  await db.membership.updateMany({where:{userId:{in:users}},data:{active:false,grantedCapabilities:[],sessionVersion:{increment:1}}});await db.user.updateMany({where:{id:{in:users}},data:{authVersion:{increment:1},passwordHash:await bcrypt.hash(randomBytes(32).toString('hex'),10)}});await db.$disconnect();console.log('Synthetic tenants suspended and credentials revoked; central history retained.');
 }
}
main().catch(error=>{console.error(error instanceof Error?error.message:'Acceptance failed');process.exitCode=1;});
