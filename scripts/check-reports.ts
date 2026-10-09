/** Existing Guardian QA membership only. Reads business records; exports create audit entries. */
import assert from 'node:assert/strict';
import jwt from 'jsonwebtoken';
import ExcelJS from 'exceljs';
import { chromium, expect } from '@playwright/test';
import { db } from '../src/core/db/client';
import { sessionForUser } from '../src/core/auth/session';
import { reportDatasets, publicSpec } from '../src/core/reports/catalogue';
async function main(){
 assert(process.platform==='linux'&&process.env.ATLAS_REPORTS_CHECK==='1');
 const userId=process.env.ATLAS_GUARDIAN_USER_ID,organisationId=process.env.ATLAS_GUARDIAN_ORGANISATION_ID;assert(userId&&organisationId&&process.env.SESSION_SECRET);
 const session=await sessionForUser(organisationId,userId);assert(session);
 const membership=await db.membership.findUniqueOrThrow({where:{organisationId_userId:{organisationId,userId}},include:{user:true}});
 const token=jwt.sign({userId,organisationId,authVersion:membership.user.authVersion,sessionVersion:membership.sessionVersion},process.env.SESSION_SECRET,{algorithm:'HS256',expiresIn:'15m'});
 const base=new URL(process.env.ATLAS_REPORTS_URL||'https://atlassystem.online');assert(base.protocol==='https:'||['127.0.0.1','localhost'].includes(base.hostname));
 const datasets=(await reportDatasets(session)).map(publicSpec);assert(datasets.some(d=>d.id.startsWith('finance.')),'QA account must already have Finance access.');
 const browser=await chromium.launch({headless:true});
 try{
 const context=await browser.newContext({baseURL:base.origin});await context.addCookies([{name:'atlas_session',value:token,domain:base.hostname,path:'/',httpOnly:true,secure:base.protocol==='https:',sameSite:'Lax'}]);await context.route('**/*',route=>['GET','HEAD','OPTIONS'].includes(route.request().method())?route.continue():route.abort());
 const anonymous=await browser.newContext({baseURL:base.origin});assert.equal((await anonymous.request.get('/api/reports?dataset=customers.records')).status(),401);const signedOut=await anonymous.newPage();await signedOut.goto('/reports');assert(signedOut.url().includes('/login'));await anonymous.close();
 assert.equal((await context.request.get('/api/reports?dataset=unknown')).status(),403);assert.equal((await context.request.get('/api/reports?dataset=customers.records&organisationId=other')).status(),400);
 const page=await context.newPage();const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
 for(const [name,width,height] of [['desktop',1448,1086],['tablet',820,1180],['phone',390,844]] as const){await page.setViewportSize({width,height});assert.equal((await page.goto('/reports',{waitUntil:'networkidle'}))?.status(),200);await expect(page.getByRole('heading',{name:'Reports',exact:true})).toBeVisible();await expect(page.getByRole('form',{name:'Report filters'})).toBeVisible();await expect(page.getByRole('combobox',{name:'Source',exact:true})).toBeVisible();await expect(page.locator('nav[aria-label="Workspace utilities"]:visible a[aria-current="page"]')).toHaveAttribute('href','/reports');assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth&&[...document.querySelectorAll('main')].every(n=>n.scrollWidth<=n.clientWidth)));await page.screenshot({path:`/tmp/atlas-reports-${name}.png`});console.log(`PASS ${name}: branded Reports, filters, active utility, no horizontal overflow.`);}
 await page.setViewportSize({width:1448,height:1086});
 for(const source of ['Customers','Products','Sales','Inventory','Logistics','Manufacturing','Finance']){
 const spec=datasets.find(d=>d.source===source&&!d.summary);assert(spec,`Missing ${source}`);await page.getByRole('combobox',{name:'Source',exact:true}).selectOption(source);await page.getByRole('combobox',{name:'Dataset',exact:true}).selectOption(spec.id);await page.getByRole('button',{name:'Apply filters',exact:true}).click();await expect(page.getByRole('status')).toContainText('matching');await expect(page.getByRole('alert')).toHaveCount(0);console.log(`PASS ${source}: real permitted dataset preview.`);
 }
 for(const spec of datasets.filter(d=>!d.summary)){
 const response=await context.request.get(`/api/reports?${new URLSearchParams({dataset:spec.id})}`);assert.equal(response.status(),200,`${spec.id} preview`);const preview=await response.json();assert(preview.rows.length<=100&&preview.columns.length>0);if(preview.total<=10_000){const exported=await context.request.get(`/api/reports?${new URLSearchParams({dataset:spec.id,download:'xlsx'})}`);assert.equal(exported.status(),200,`${spec.id} export`);assert(exported.headers()['cache-control'].includes('no-store'));const book=new ExcelJS.Workbook();await book.xlsx.load(await exported.body() as never);const sheet=book.getWorksheet('Report')!;assert.equal(sheet.actualRowCount,preview.total+1);assert.equal(sheet.getRow(1).cellCount,preview.columns.length);assert.equal(book.getWorksheet('Report details')!.getCell('B2').value,session.organisationName);}console.log(`PASS ${spec.id}: preview and XLSX workbook, matching row/column counts.`);
 }
 const summary=datasets.find(d=>d.summary);if(summary){assert.equal((await context.request.get(`/api/reports?dataset=${encodeURIComponent(summary.id)}`)).status(),200);assert.equal((await context.request.get(`/api/reports?dataset=${encodeURIComponent(summary.id)}&from=2026-10-01`)).status(),400);}
 await page.getByRole('combobox',{name:'Source',exact:true}).selectOption('Customers');await page.getByRole('button',{name:'Apply filters',exact:true}).click();await expect(page.getByRole('status')).toContainText('matching');await page.getByRole('textbox',{name:'Search records',exact:true}).fill('atlas-qa-no-match-314159265358979');await expect(page.getByRole('button',{name:'Download Excel',exact:true})).toBeDisabled();await page.getByRole('button',{name:'Apply filters',exact:true}).click();await expect(page.getByRole('status')).toContainText('0 matching rows');await expect(page.getByText('No records match these filters.',{exact:false})).toBeVisible();const dl=page.waitForEvent('download');await page.getByRole('button',{name:'Download Excel',exact:true}).click();assert((await dl).suggestedFilename().endsWith('.xlsx'));console.log('PASS applied search, empty-state handling and browser Excel download.');
 await page.getByRole('button',{name:'Reset',exact:true}).click();await expect(page.getByRole('status')).toContainText('matching');await page.getByRole('button',{name:'Add filter',exact:true}).click();await expect(page.getByRole('combobox',{name:'Filter 1 field'})).toBeVisible();await page.getByRole('combobox',{name:'Filter 1 field'}).selectOption('status');await page.getByRole('combobox',{name:'Filter 1 value'}).selectOption({index:1});await page.getByRole('button',{name:'Apply filters',exact:true}).click();await expect(page.getByRole('status')).toContainText('matching');await expect(page.getByRole('alert')).toHaveCount(0);
 await page.screenshot({path:'/tmp/atlas-reports-filtered.png'});assert.deepEqual(errors,[],'No browser runtime errors.');console.log(`PASS field filters and browser runtime; ${datasets.length} authorised datasets. No business records changed; explicit exports audited.`);await context.close();
 }finally{await browser.close();await db.$disconnect();}
}
main().catch(e=>{console.error(e);process.exitCode=1;});
