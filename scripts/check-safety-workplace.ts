/** Explicit server-only browser acceptance; fixture access revoked, central audit retained. */
import assert from 'node:assert/strict';
import { randomBytes } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import bcrypt from 'bcryptjs';
import { chromium } from '@playwright/test';
import { db } from '../src/core/db/client';
async function main(){
 assert(process.platform==='linux'&&process.env.ATLAS_SAFETY_TEST==='1'&&process.env.ATLAS_RUNTIME!=='desktop','Explicit server acceptance required');
 const base='https://atlassystem.online',suffix=randomBytes(8).toString('hex'),password=randomBytes(24).toString('base64url'),companies:string[]=[],users:string[]=[];
 let checks=0;const check=(condition:unknown,label:string)=>{assert(condition,label);checks++;console.log(`PASS ${label}`);};
 const manifest=JSON.parse(await readFile('.next/server/server-reference-manifest.json','utf8'));
 const post=async(name:string,values:Record<string,string>,cookie='')=>{
  const candidates=Object.entries(manifest.node as Record<string,{exportedName?:string;workers?:Record<string,unknown>}>).filter(([,value])=>value.exportedName===name);
  const action=candidates.find(([,value])=>Object.keys(value.workers??{}).some(key=>key.includes('safety/workplace')) )??candidates[0];assert(action,`Action ${name}`);
  const form=new FormData();for(const [key,value]of Object.entries(values))form.set(`_1_${key}`,value);form.set('0','["$K1"]');
  const response=await fetch(base+(name==='loginAction'?'/login':'/safety/workplace'),{method:'POST',headers:{Origin:base,'Next-Action':action[0],Accept:'text/x-component',...(cookie?{Cookie:cookie}:{})},body:form,redirect:'manual'});
  return {response,body:await response.text()};
 };
 const login=async(email:string)=>{const result=await post('loginAction',{email,password});const cookie=result.response.headers.get('set-cookie')?.match(/atlas_session=[^;]+/)?.[0];assert(cookie,'Normal login');return cookie;};
 try{
  for(const kind of ['inside','outside']){const org=await db.organisation.create({data:{name:`Synthetic safety ${kind}`,slug:`safety-${kind}-${suffix}`,isTest:true}});companies.push(org.id);await db.moduleState.create({data:{organisationId:org.id,moduleId:'safety',enabled:true,entitled:true}});}
  const caps=['safety.today.read','safety.risk.read','safety.risk.create','safety.health_surveillance.read'];
  const makeUser=async(name:string,grants:string[],organisationId=companies[0])=>{const user=await db.user.create({data:{name:`Synthetic ${name}`,email:`safety-${name}-${suffix}@example.test`,passwordHash:await bcrypt.hash(password,10)}});users.push(user.id);await db.membership.create({data:{organisationId,userId:user.id,grantedCapabilities:grants}});return user;};
  const worker=await makeUser('manager',caps),observer=await makeUser('reader',['safety.today.read','safety.risk.read']),foreign=await makeUser('outside',caps,companies[1]);
  const workerCookie=await login(worker.email),observerCookie=await login(observer.email),foreignCookie=await login(foreign.email);
  const browser=await chromium.launch({args:['--no-sandbox'],...(process.env.ATLAS_CHROMIUM_PATH?{executablePath:process.env.ATLAS_CHROMIUM_PATH}:{})});
  try{
   const context=await browser.newContext({viewport:{width:1440,height:1000}});await context.addCookies([{name:'atlas_session',value:workerCookie.slice(14),url:base,httpOnly:true,secure:true}]);const page=await context.newPage();let errors=0;page.on('pageerror',error=>{errors++;console.log(`Browser runtime: ${error.message}`);});
   await page.goto(base+'/safety/workplace',{waitUntil:'domcontentloaded'});
   await page.getByLabel('Record type',{exact:true}).last().selectOption('FIRE_DRILL');
   await page.getByLabel('Title',{exact:true}).fill('Synthetic fire drill');await page.getByLabel('Location / work area',{exact:true}).fill('Synthetic warehouse');await page.getByLabel('Responsible person / team',{exact:true}).fill('Synthetic shift team');await page.getByLabel('Review / follow-up date',{exact:true}).fill('2026-10-07');await page.getByLabel('Scenario and alarm raised',{exact:true}).fill('Synthetic alarm test and evacuation review');await page.getByLabel('Follow-up work and who will do it',{exact:true}).fill('Review assembly instructions with shift team');
   await page.getByRole('button',{name:'Create workplace record',exact:true}).click();await page.waitForURL(/\/safety\/records\/[^/]+$/);
   const record=await db.safetyRecord.findFirstOrThrow({where:{organisationId:companies[0],title:'Synthetic fire drill'}});const detailUrl=page.url();
   check((record.payload as {finding1:string}).finding1.includes('alarm test')&&record.dueAt?.toISOString().slice(0,10)==='2026-10-07','Guided findings and review date save centrally');
   check(await db.auditEntry.count({where:{organisationId:companies[0],entityId:record.id,action:'safety.record.created'}})===1,'Creation records audit together with workplace record');
   await page.goto(base+'/safety/workplace?due=overdue',{waitUntil:'domcontentloaded'});check(await page.getByRole('link',{name:/Synthetic fire drill/}).count()===1,'Overdue filter finds the saved workplace record');
   await page.goto(detailUrl,{waitUntil:'domcontentloaded'});await page.getByText('Edit record and follow-up',{exact:true}).click();check(await page.getByLabel('Responsible person / team',{exact:true}).inputValue()==='Synthetic shift team','Saved responsibility is available when editing');
   await page.getByLabel('Status',{exact:true}).selectOption('COMPLETE');await page.getByRole('button',{name:'Save record',exact:true}).click();await page.getByRole('alert').filter({hasText:'completed or checked'}).waitFor();check((await db.safetyRecord.findUniqueOrThrow({where:{id:record.id}})).status==='OPEN'&&await page.getByLabel('Status',{exact:true}).inputValue()==='COMPLETE','Missing completion evidence is rejected with draft retained');
   const second=await context.newPage();await second.goto(detailUrl,{waitUntil:'domcontentloaded'});await second.getByText('Edit record and follow-up',{exact:true}).click();await second.getByLabel('Title',{exact:true}).fill('Stale draft retained');
   await page.getByLabel('Completion / review evidence (required to mark complete)',{exact:true}).fill('Assembly instructions reviewed with the synthetic team.');await page.getByRole('button',{name:'Save record',exact:true}).click();await page.waitForFunction(()=>!document.querySelector('details[open]'));check((await db.safetyRecord.findUniqueOrThrow({where:{id:record.id}})).status==='COMPLETE','Completion with evidence saves successfully');
   await second.getByRole('button',{name:'Save record',exact:true}).click();await second.getByRole('alert').filter({hasText:'changed'}).waitFor();check(await second.getByLabel('Title',{exact:true}).inputValue()==='Stale draft retained'&&(await db.safetyRecord.findUniqueOrThrow({where:{id:record.id}})).title==='Synthetic fire drill','Concurrent edit cannot overwrite newer work and retains draft');await second.close();
   await page.goto(base+'/safety/workplace?due=overdue',{waitUntil:'domcontentloaded'});check(await page.getByRole('link',{name:/Synthetic fire drill/}).count()===0,'Completed record leaves overdue work');
   await page.getByLabel('Record type',{exact:true}).last().selectOption('PEEP');await page.getByLabel('Title',{exact:true}).fill('Synthetic restricted evacuation plan');await page.getByLabel('Operational evacuation assistance',{exact:true}).fill('Synthetic operational assistance only');await page.getByRole('button',{name:'Create workplace record',exact:true}).click();await page.waitForURL(/\/safety\/records\/[^/]+$/);const privateUrl=page.url();
   await page.setViewportSize({width:390,height:844});check(await page.locator('main').evaluate(element=>element.scrollWidth<=element.clientWidth),'Workplace record fits a phone viewport');check(errors===0,'Workplace journey has no browser runtime errors');
   for(const [cookie,visible]of [[observerCookie,true],[foreignCookie,false]] as const){const other=await browser.newContext();await other.addCookies([{name:'atlas_session',value:cookie.slice(14),url:base,httpOnly:true,secure:true}]);const view=await other.newPage();await view.goto(detailUrl,{waitUntil:'domcontentloaded'});check((await view.locator('body').innerText()).includes('Synthetic fire drill')===visible&&await view.getByText('Edit record and follow-up',{exact:true}).count()===0,'Read-only and other-company access preserves permissions');await view.goto(privateUrl,{waitUntil:'domcontentloaded'});check(!(await view.locator('body').innerText()).includes('Synthetic restricted evacuation plan'),'Restricted record is hidden from ordinary and foreign readers');await view.goto(base+'/safety/workplace',{waitUntil:'domcontentloaded'});check(await view.getByRole('link',{name:/Synthetic restricted evacuation plan/}).count()===0,'Restricted record never appears in an ordinary or foreign register');await other.close();}
   const denied=await post('saveWorkplaceRecord',{recordId:record.id,version:record.updatedAt.toISOString(),kind:'FIRE_DRILL',title:'Bypass'},observerCookie);check(/(?:^|\n)\w+:E\{/.test(denied.body)||denied.response.status>=400,'Read-only profile cannot bypass mutation capability');
   await context.close();console.log(`LIVE SAFETY ACCEPTANCE PASSED: ${checks} assertions`);
  }finally{await browser.close();}
 }finally{
  for(const id of companies)await db.organisation.update({where:{id},data:{status:'SUSPENDED'}});
  await db.membership.updateMany({where:{userId:{in:users}},data:{active:false,grantedCapabilities:[],sessionVersion:{increment:1}}});await db.user.updateMany({where:{id:{in:users}},data:{authVersion:{increment:1},passwordHash:await bcrypt.hash(randomBytes(32).toString('hex'),10)}});await db.$disconnect();console.log('Synthetic tenants suspended and credentials revoked; central history retained.');
 }
}
main().catch(error=>{console.error(error instanceof Error?error.message:'Acceptance failed');process.exitCode=1;});
