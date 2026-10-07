/** Run on the deployed server with its environment loaded; creates only disposable Test workspaces. */
import { db } from '../src/core/db/client';
import bcrypt from 'bcryptjs';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createRequire } from 'node:module';
import { PDFDocument } from 'pdf-lib';
import { encodeWire, decodeWire } from '../src/core/desktop/wire';
const base=process.env.ATLAS_CHECK_BASE_URL??'http://127.0.0.1:3000',qaPath='/tmp/atlas-contract-workflow-qa.json';
const require=createRequire(import.meta.url),{encodeReply}=require('next/dist/compiled/react-server-dom-webpack/client.node');
const manifest=JSON.parse(fs.readFileSync('.next/server/server-reference-manifest.json','utf8'));
const form=(values:Record<string,string>)=>{const f=new FormData();for(const [k,v]of Object.entries(values))f.set(k,v);return f;};
let checks=0;
function ok(condition:unknown,label:string){assert(condition,label);checks++;console.log(`PASS ${label}`);}
async function cleanup(orgIds:string[],userIds:string[]){
 for(const id of orgIds){const o=await db.organisation.findUnique({where:{id},select:{isTest:true,name:true}});assert(o?.isTest&&o.name.startsWith('Contract workflow Test '),'Cleanup is limited to this script\'s Test workspaces.');}
 const where={organisationId:{in:orgIds}};
 await db.contractReturn.deleteMany({where});await db.contractDocument.deleteMany({where});await db.documentTemplate.deleteMany({where});await db.automationEvent.deleteMany({where});await db.auditEntry.deleteMany({where});
 await db.serviceCase.deleteMany({where});await db.salesOrder.deleteMany({where});await db.quote.deleteMany({where});await db.project.deleteMany({where});await db.opportunity.deleteMany({where});await db.party.deleteMany({where});await db.pipeline.deleteMany({where});await db.membership.deleteMany({where});await db.moduleState.deleteMany({where});await db.organisation.deleteMany({where:{id:{in:orgIds}}});await db.user.deleteMany({where:{id:{in:userIds}}});
 console.log('Temporary contract Test workspaces and users removed.');
}
async function main(){
 if(!process.env.DATABASE_URL||process.env.ATLAS_RUNTIME==='desktop')throw new Error('Run on the live application server with its database environment loaded.');
 if(process.argv.includes('--cleanup')){const ids=JSON.parse(fs.readFileSync(qaPath,'utf8'));await cleanup(ids.orgIds,ids.userIds);fs.unlinkSync(qaPath);return;}
 const orgIds:string[]=[],userIds:string[]=[],stamp=crypto.randomUUID(),password=crypto.randomUUID()+crypto.randomUUID();let keep=false;
 try{
 const org=await db.organisation.create({data:{name:'Contract workflow Test '+stamp,slug:'contract-test-'+stamp,isTest:true}});orgIds.push(org.id);
 const other=await db.organisation.create({data:{name:'Contract workflow Test other '+stamp,slug:'contract-other-'+stamp,isTest:true}});orgIds.push(other.id);
 const caps=['core.contract.manage','sales.opportunity.read','sales.order.read','sales.quote.read','customers.read','projects.read','service.case.read'];
 async function user(orgId:string,label:string){const u=await db.user.create({data:{name:'Contract Test '+label,email:`contract-${label}-${stamp}@example.invalid`,passwordHash:await bcrypt.hash(password,10)}});userIds.push(u.id);await db.membership.create({data:{organisationId:orgId,userId:u.id,grantedCapabilities:caps}});return u;}
 const actor=await user(org.id,'owner'),rival=await user(org.id,'rival'),outsider=await user(other.id,'other');
 for(const organisationId of orgIds)for(const moduleId of ['crm','templates','sales','projects','service'])await db.moduleState.create({data:{organisationId,moduleId,enabled:true,entitled:true}});
 const party=await db.party.create({data:{organisationId:org.id,kind:'COMPANY',name:'Example Customer Ltd',customerCode:'TEST-1',tags:[]}});
 const pipeline=await db.pipeline.create({data:{organisationId:org.id,key:'contract-test',name:'Test pipeline',stages:{create:{key:'review',name:'Review',order:1}}},include:{stages:true}});
 const deal=await db.opportunity.create({data:{organisationId:org.id,partyId:party.id,name:'Example supply deal',pipelineId:pipeline.id,stageId:pipeline.stages[0].id,ownerUserId:actor.id,valueAmount:1200000}});
 const project=await db.project.create({data:{organisationId:org.id,partyId:party.id,name:'Private test project',reference:'TEST-PROJ',visibility:'PRIVATE',ownerUserId:actor.id}});
 const serviceCase=await db.serviceCase.create({data:{organisationId:org.id,partyId:party.id,number:'TEST-CASE',subject:'Restricted test case',description:'Synthetic test only',type:'QUERY',security:'RESTRICTED',ownerUserId:actor.id,createdByUserId:actor.id}});
 async function call(name:string,args:unknown[],cookie?:string){const r=await fetch(base+'/api/desktop/action',{method:'POST',headers:{'Content-Type':'application/json','X-Atlas-Client':'desktop',...(cookie?{Cookie:cookie}:{})},body:JSON.stringify({action:name,args:await encodeWire(args)})});const json=await r.json();return {status:r.status,...json,cookie:r.headers.get('set-cookie')?.split(';')[0]};}
 async function login(u:{email:string}){const r=await call('src/core/auth/actions:loginAction',[form({email:u.email,password})]);assert.equal(r.status,200);assert(r.cookie);return r.cookie as string;}
 const cookie=await login(actor),rivalCookie=await login(rival),otherCookie=await login(outsider);
 async function action(path:string,args:unknown[],withCookie=cookie){const r=await call(path,args,withCookie);assert.equal(r.status,200,`${path}: ${r.error??''}`);return decodeWire(r.value??null) as Record<string,unknown>;}
 async function page(path:string,withCookie?:string){const r=await fetch(base+path,{headers:withCookie?{Cookie:withCookie}:{},redirect:'manual'});return {status:r.status,text:await r.text()};}
 async function publicAction(name:string,token:string,args:unknown[]){const found=Object.entries(manifest.node).find(([,v])=>(v as {exportedName?:string}).exportedName===name);assert(found,`Missing ${name} action`);const r=await fetch(base+'/share/'+token,{method:'POST',headers:{'Next-Action':found[0],Accept:'text/x-component'},body:await encodeReply(args)});return {status:r.status,text:await r.text()};}
 const templateForm=form({name:'Test supply agreement',titleTemplate:'Agreement · {{record.name}}',category:'Contract',status:'PUBLISHED',description:'Synthetic verification template',blocks:JSON.stringify([{id:'h',type:'heading',text:'Supply agreement'},{id:'p',type:'text',text:'{{company.name}} supplies {{customer.name}}. {{custom.scope}}'},{id:'s',type:'signature',text:'Customer acceptance'}])});for(const m of ['crm','sales','projects','service'])templateForm.append('targetModules',m);
 const saved=await call('src/app/(app)/templates/actions:saveTemplate',[templateForm],cookie);ok(saved.status===200&&saved.redirect?.startsWith('/templates/'),'published template through authorised action');const templateId=saved.redirect.split('/').pop();
 const library=await page('/templates',cookie);ok(library.status===200&&library.text.includes('Test supply agreement'),'template library renders');
 const builder=await page('/templates/'+templateId,cookie);ok(builder.status===200&&builder.text.includes('Live preview'),'section builder and sample preview render');
 async function create(extra:Record<string,string>={}){return await action('src/core/contracts/actions:createContract',[form({templateId,opportunityId:deal.id,partyId:party.id,signingMode:'BOTH',values:JSON.stringify({'custom.scope':'Supply the items agreed in this document.'}),...extra})]);}
 const first=await create(),id=String(first.id);let c=await db.contractDocument.findUniqueOrThrow({where:{id}});ok(c.opportunityId===deal.id&&c.templateVersion===1&&!!c.templateSnapshot,'generated PDF is attached to deal with template snapshot');
 const dealPage=await page('/crm/opportunities/'+deal.id,cookie);ok(dealPage.status===200&&dealPage.text.includes('/crm/contracts/'+id),'deal displays its attached contract');
 const draft=form({id,updatedAt:c.updatedAt.toISOString(),title:c.title,message:'Please review this example agreement.',signingMode:'BOTH'});await action('src/core/contracts/actions:updateDraftContract',[draft]);ok((await db.contractDocument.findUniqueOrThrow({where:{id}})).message.includes('Please review'),'draft can be revised before sharing');
 const shared=await action('src/core/contracts/actions:shareContractLink',[id,30]),token=String(shared.link).split('/').pop()!;ok(String(shared.link).startsWith('https://atlassystem.online/share/'),'customer link uses Atlas public domain and share route');
 const publicPage=await page('/share/'+token);ok(publicPage.status===200&&publicPage.text.includes('Private document invitation')&&publicPage.text.includes('Complete your document'),'customer review page opens without a login');
 const file=await fetch(base+'/share/'+token+'/file');const original=Buffer.from(await file.arrayBuffer());ok(file.status===200&&file.headers.get('cache-control')?.includes('no-store')&&crypto.createHash('sha256').update(original).digest('hex')===c.contentHash,'customer sees the exact issued PDF with private caching');
 const forbiddenDraft=await call('src/core/contracts/actions:updateDraftContract',[draft],cookie);ok(forbiddenDraft.status===400,'shared terms are frozen');
 await publicAction('signContract',token,[token,'Alex Customer',null,false]);ok((await db.contractDocument.findUniqueOrThrow({where:{id}})).status!=='SIGNED','server rejects signing without consent');
 await publicAction('signContract',token,[token,'Alex Customer',null,true]);c=await db.contractDocument.findUniqueOrThrow({where:{id}});ok(c.status==='SIGNED'&&c.completionMethod==='ONLINE'&&c.signerName==='Alex Customer','public online signature records consent and completes');
 await publicAction('signContract',token,[token,'Another Name',null,true]);ok((await db.contractDocument.findUniqueOrThrow({where:{id}})).signerName==='Alex Customer','repeat signing cannot overwrite completion');
 const completed=await fetch(base+'/share/'+token+'/record');ok(completed.status===200&&(await PDFDocument.load(await completed.arrayBuffer())).getPageCount()>=2,'customer can download completed PDF with completion record');
 const second=await create(),id2=String(second.id),link2=await action('src/core/contracts/actions:shareContractLink',[id2]),token2=String(link2.link).split('/').pop()!;
 async function returnFile(){const f=form({signerName:'Alex Returning',consent:'yes'});f.set('file',new File([original],'signed-copy.pdf',{type:'application/pdf'}));return publicAction('returnSignedContract',token2,[token2,f]);}
 await returnFile();ok((await db.contractDocument.findUniqueOrThrow({where:{id:id2}})).status==='RETURNED','PDF return waits for staff review');
 let submission=await db.contractReturn.findFirstOrThrow({where:{contractId:id2,organisationId:org.id,status:'PENDING'}});
 await action('src/core/contracts/actions:reviewContractReturn',[form({id:id2,returnId:submission.id,decision:'REJECT',reviewNote:'Please include the full signed agreement.'})]);const rejected=await page('/share/'+token2);ok(rejected.text.includes('Please include the full signed agreement.'),'review rejection is visible to customer');
 await returnFile();submission=await db.contractReturn.findFirstOrThrow({where:{contractId:id2,organisationId:org.id,status:'PENDING'}});
 const returnedFile=await fetch(base+`/api/contracts/${id2}/returns/${submission.id}`,{headers:{Cookie:cookie}});ok(returnedFile.status===200,'staff can inspect returned PDF');
 await action('src/core/contracts/actions:reviewContractReturn',[form({id:id2,returnId:submission.id,decision:'ACCEPT',reviewNote:'Complete signed copy checked.'})]);ok((await db.contractDocument.findUniqueOrThrow({where:{id:id2}})).completionMethod==='UPLOAD'&&await db.contractReturn.count({where:{contractId:id2}})===2,'accepted return completes while rejected history remains');
 const returnedRecord=await fetch(base+'/share/'+token2+'/record');ok(returnedRecord.status===200&&(await PDFDocument.load(await returnedRecord.arrayBuffer())).getPageCount()>=2,'accepted PDF return has a downloadable completion record');
 ok((await fetch(base+`/api/contracts/${id}/file`,{headers:{Cookie:otherCookie}})).status===404,'another company cannot read contract PDF');
 ok((await fetch(base+`/api/contracts/${id}/file`,{headers:{Cookie:rivalCookie}})).status===403,'another representative cannot read a different owner\'s deal contract');
 ok((await call('src/core/contracts/actions:shareContractLink',[id2],rivalCookie)).status===400,'record visibility is enforced when sharing');
 ok((await call('src/core/contracts/actions:createContract',[form({templateId,opportunityId:deal.id,values:'{}'})],otherCookie)).status===400,'another company cannot generate against this deal');
 const third=await create(),id3=String(third.id),old=await action('src/core/contracts/actions:shareContractLink',[id3]),oldToken=String(old.link).split('/').pop()!,fresh=await action('src/core/contracts/actions:shareContractLink',[id3]),freshToken=String(fresh.link).split('/').pop()!;
 ok((await page('/share/'+oldToken)).text.includes('unavailable')&&(await fetch(base+'/share/'+oldToken+'/file')).status===404,'reissuing invalidates old page and file link');
 await db.organisation.update({where:{id:org.id},data:{status:'SUSPENDED'}});await publicAction('declineContract',freshToken,[freshToken,'No']);ok((await page('/share/'+freshToken)).text.includes('unavailable')&&(await fetch(base+'/share/'+freshToken+'/file')).status===404&&(await db.contractDocument.findUniqueOrThrow({where:{id:id3}})).status!=='DECLINED','suspended company blocks customer links, files and responses');await db.organisation.update({where:{id:org.id},data:{status:'ACTIVE'}});
 await db.contractDocument.update({where:{id:id3},data:{expiresAt:new Date(Date.now()-60000)}});const expired=await page('/share/'+freshToken);await publicAction('declineContract',freshToken,[freshToken,'No']);ok(expired.text.includes('invitation has expired')&&(await db.contractDocument.findUniqueOrThrow({where:{id:id3}})).status!=='DECLINED'&&(await fetch(base+'/share/'+freshToken+'/file')).status===404,'expiry blocks content and customer responses');
 await action('src/core/contracts/actions:revokeContract',[form({id:id3})]);ok((await page('/share/'+freshToken)).text.includes('unavailable'),'revocation invalidates customer link while retaining document');
 const revised=form(Object.fromEntries([...templateForm].filter(([k])=>k!=='targetModules').map(([k,v])=>[k,String(v)])));revised.set('id',templateId);revised.set('version','1');revised.set('name','Revised test template');for(const m of ['crm','sales','projects','service'])revised.append('targetModules',m);await call('src/app/(app)/templates/actions:saveTemplate',[revised],cookie);ok((await db.documentTemplate.findUniqueOrThrow({where:{id:templateId}})).version===2&&(await db.contractDocument.findUniqueOrThrow({where:{id}})).templateVersion===1,'template edits preserve existing document snapshots');
 const order=await db.salesOrder.create({data:{organisationId:org.id,partyId:party.id,reference:'TEST-ORDER',ownerUserId:actor.id}});const quotation=await db.quote.create({data:{organisationId:org.id,partyId:party.id,reference:'TEST-QUOTE',totalAmount:120000}});
 for(const [type,sourceId]of [['order',order.id],['quote',quotation.id]]){const generated=await action('src/core/contracts/actions:createContract',[form({templateId,sourceModule:'sales',sourceType:type,sourceId,values:JSON.stringify({'custom.scope':'Synthetic sales document.'})})]);ok((await db.contractDocument.findUniqueOrThrow({where:{id:String(generated.id)}})).sourceId===sourceId,`template document attaches to Sales ${type}`);}
 const pdoc=await action('src/core/contracts/actions:createContract',[form({templateId,sourceModule:'projects',sourceType:'project',sourceId:project.id,values:JSON.stringify({'custom.scope':'Private project brief.'})})]);ok((await db.contractDocument.findUniqueOrThrow({where:{id:String(pdoc.id)}})).sourceId===project.id,'template generation attaches to a Project');
 ok((await fetch(base+`/api/contracts/${pdoc.id}/file`,{headers:{Cookie:rivalCookie}})).status===403,'project privacy applies to generated document files');
 const denied=await call('src/core/contracts/actions:createContract',[form({templateId,sourceModule:'service',sourceType:'case',sourceId:serviceCase.id,values:JSON.stringify({'custom.scope':'Case summary.'})})],cookie);ok(denied.status===400,'restricted Service case cannot be used without restricted capability');
 await db.serviceCase.update({where:{id:serviceCase.id},data:{security:'STANDARD'}});const caseDoc=await action('src/core/contracts/actions:createContract',[form({templateId,sourceModule:'service',sourceType:'case',sourceId:serviceCase.id,values:JSON.stringify({'custom.scope':'Customer case document.'})})]);ok((await db.contractDocument.findUniqueOrThrow({where:{id:String(caseDoc.id)}})).sourceId===serviceCase.id,'authorised Service case accepts a generated document');
 console.log(`LIVE CONTRACT CHECKS: ${checks} passed; no emails sent; only synthetic Test records used.`);
 if(process.argv.includes('--keep-qa')){const qa=await create(),qid=String(qa.id),qlink=await action('src/core/contracts/actions:shareContractLink',[qid]);fs.writeFileSync(qaPath,JSON.stringify({orgIds,userIds,url:qlink.link}),{mode:0o600});console.log('QA_URL '+qlink.link);keep=true;}
 }finally{if(!keep)await cleanup(orgIds,userIds);}
}
main().catch(e=>{console.error(e instanceof Error?e.message:e);process.exitCode=1;}).finally(()=>db.$disconnect());
