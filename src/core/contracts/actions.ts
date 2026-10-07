'use server';
import { db } from '@/core/db/client';
import { requireSession } from '@/core/auth/session';
import { assertCapability } from '@/core/permissions/check';
import { CORE_CAPABILITIES } from '@/core/permissions/capabilities';
import { hashToken, newToken } from '@/core/security/secrets';
import { sendEmail } from '@/core/email/send';
import { emit, DOMAIN_EVENTS } from '@/core/events/bus';
import { writeAudit } from '@/core/audit/log';
import crypto from 'node:crypto';
import { PDFDocument } from 'pdf-lib';
import { renderTemplate, templateRecord } from '@/core/templates/service';
import { blocksHtml } from '@/core/templates/domain';
import { documentPdf } from '@/core/templates/pdf';
import { staffContract } from './access';
import type { Prisma } from '@/generated/prisma/client';
import { revalidatePath } from 'next/cache';
const text=(f:FormData,k:string,max=4000,required=false)=>{const v=String(f.get(k)??'').trim();if(v.length>max||(required&&!v))throw new Error(`Please enter ${k}.`);return v;};
const sha=(value:Buffer|string)=>crypto.createHash('sha256').update(value).digest('hex');
const EMAIL=/^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const editable=['DRAFT','SENT','VIEWED','DECLINED','REVOKED'];
const refresh=()=>{revalidatePath('/crm/contracts');revalidatePath('/crm/opportunities','layout');};
async function readPdf(value:FormDataEntryValue|null){
 if(!(value instanceof File)||!value.size)return null;if(value.size>10*1024*1024)throw new Error('The PDF is larger than 10 MB.');
 const bytes=Buffer.from(await value.arrayBuffer());if(bytes.subarray(0,5).toString('latin1')!=='%PDF-')throw new Error('Upload a PDF file.');
 try{const pdf=await PDFDocument.load(bytes);if(!pdf.getPageCount()||pdf.getPageCount()>1000)throw new Error();}catch{throw new Error('Upload a readable PDF without password protection.');}
 return {bytes,name:value.name.replace(/[^\w .()-]/g,'_').slice(0,150)||'document.pdf'};
}
export async function createContract(f:FormData){
 const session=await requireSession();assertCapability(session,CORE_CAPABILITIES.contractManage);
 const templateId=text(f,'templateId',100),opportunityId=text(f,'opportunityId',100);
 let sourceModule=text(f,'sourceModule',50)||null,sourceType=text(f,'sourceType',50)||null,sourceId=text(f,'sourceId',100)||null;
 if(opportunityId){sourceModule='crm';sourceType='deal';sourceId=opportunityId;}
 if((sourceModule||sourceType||sourceId)&&!(sourceModule&&sourceType&&sourceId))throw new Error('Choose a complete source record.');
 const source=sourceModule&&sourceType&&sourceId?await templateRecord(session,sourceModule,sourceType,sourceId):null;
 const submittedParty=text(f,'partyId',100);if(source?.partyId&&submittedParty&&source.partyId!==submittedParty)throw new Error('The customer must match the source record.');
 let partyId=source?.partyId??(submittedParty||null); // resolved on the server, never trust an organisation ID
 let contactId=text(f,'contactId',100)||source?.contactId||null;
 let title=text(f,'title',300),bodyHtml='',pdf=await readPdf(f.get('file')),templateVersion:number|null=null,templateSnapshot:Prisma.InputJsonValue|undefined;
 if(templateId){
  if(pdf)throw new Error('Choose a template or an uploaded PDF.');
  let values:Record<string,string>={};try{const raw=JSON.parse(text(f,'values',40000)||'{}');if(!raw||Array.isArray(raw)||typeof raw!=='object'||Object.values(raw).some(v=>typeof v!=='string'))throw new Error();values=raw;}catch{throw new Error('The template values are invalid.');}
  const rendered=await renderTemplate(session,templateId,{sourceModule:sourceModule??undefined,sourceType:sourceType??undefined,sourceId:sourceId??undefined,partyId:partyId??undefined,values});
  title=rendered.title;partyId=rendered.partyId;contactId=rendered.contactId;bodyHtml=blocksHtml(rendered.blocks);
  pdf={bytes:await documentPdf(title,rendered.blocks,rendered.brand.name),name:'contract.pdf'};
  templateVersion=rendered.template.version;templateSnapshot={name:rendered.template.name,version:templateVersion,title,blocks:rendered.blocks};
 }else{
  const body=text(f,'body',50000);if(!pdf&&!body)throw new Error('Upload a PDF or write the terms.');if(!title)throw new Error('Enter a document title.');
  if(pdf&&body)throw new Error('Use an uploaded PDF or typed terms, not both.');
  if(body){const blocks=[{id:'terms',type:'text' as const,text:body}];bodyHtml=blocksHtml(blocks);if(!pdf)pdf={bytes:await documentPdf(title,blocks,session.organisationName),name:'contract.pdf'};}
 }
 if(title.length>300)throw new Error('The generated title is too long.');
 if(partyId&&!await db.party.findFirst({where:{id:partyId,organisationId:session.organisationId,identityScrubbed:false},select:{id:true}}))throw new Error('Choose a customer from your records.');
 if(contactId&&(!partyId||!await db.contact.findFirst({where:{id:contactId,partyId,party:{organisationId:session.organisationId},identityScrubbed:false},select:{id:true}})))throw new Error('Choose a contact belonging to this customer.');
 const quoteId=text(f,'quoteId',100)||(sourceModule==='sales'&&sourceType==='quote'?sourceId:null),orderId=text(f,'orderId',100)||(sourceModule==='sales'&&sourceType==='order'?sourceId:null);
 for(const [kind,id] of [['quote',quoteId],['order',orderId]] as const){if(!id)continue;assertCapability(session,`sales.${kind}.read`);const r=kind==='quote'?await db.quote.findFirst({where:{id,organisationId:session.organisationId,partyId:partyId??undefined},select:{id:true}}):await db.salesOrder.findFirst({where:{id,organisationId:session.organisationId,partyId:partyId??undefined},select:{id:true}});if(!r)throw new Error('The linked commercial record does not match this customer.');}
 const signingMode=text(f,'signingMode',20)||'BOTH';if(!['BOTH','ONLINE','UPLOAD'].includes(signingMode))throw new Error('Choose a valid signing option.');
 const reference=`CON-${crypto.randomBytes(5).toString('hex').toUpperCase()}`;
 const contract=await db.contractDocument.create({data:{organisationId:session.organisationId,reference,title,bodyHtml,message:text(f,'message',2000),partyId,contactId,quoteId,orderId,opportunityId:sourceModule==='crm'&&sourceType==='deal'?sourceId:null,sourceModule,sourceType,sourceId,templateId:templateId||null,templateVersion,templateSnapshot,signingMode,signerEmail:text(f,'to',200)||null,tokenHash:hashToken(crypto.randomUUID()),contentHash:sha(pdf!.bytes),fileName:pdf!.name,fileType:'application/pdf',fileSize:pdf!.bytes.length,fileContent:pdf!.bytes,createdBy:session.userId}});
 await writeAudit({organisationId:session.organisationId,actorUserId:session.userId,action:'contract.created',entityType:'ContractDocument',entityId:contract.id,after:{reference,title,contentHash:contract.contentHash,templateId,templateVersion,sourceModule,sourceType,sourceId}});return {id:contract.id};
}
const validFor=(value:unknown)=>[7,14,30,60,90].includes(Number(value))?Number(value):30;
async function issue(contract:Awaited<ReturnType<typeof staffContract>>,email:string|null,days:number){
 const token=newToken(24),changed=await db.contractDocument.updateMany({where:{id:contract.id,organisationId:contract.organisationId,tokenHash:contract.tokenHash,status:{in:editable}},data:{tokenHash:hashToken(token),status:'SENT',sentAt:new Date(),expiresAt:new Date(Date.now()+days*86400000),viewedAt:null,declinedReason:null,...(email?{signerEmail:email}:{})}});
 if(!changed.count)throw new Error('The document changed or is already complete. Reload it.');const {publicBaseUrl}=await import('@/core/email/render');return `${publicBaseUrl()}/share/${token}`;
}
export async function sendContract(f:FormData){
 const session=await requireSession();assertCapability(session,CORE_CAPABILITIES.contractManage);
 assertCapability(session,CORE_CAPABILITIES.emailSend);
 const contract=await staffContract(session,text(f,'id',100,true)),to=(text(f,'to',200)||contract.signerEmail||'').toLowerCase();if(!EMAIL.test(to))throw new Error("Enter the signer's email address.");
 const link=await issue(contract,to,validFor(f.get('validDays'))),quote=contract.kind==='QUOTE';
 const result=await sendEmail({organisationId:session.organisationId,to,subject:`${contract.title} for your ${quote?'approval':'signature'}`,accountId:text(f,'accountId',100)||undefined,actorUserId:session.userId,context:{contract:{title:contract.title,link}},blocks:[{id:'h',type:'heading',text:quote?'Your quotation is ready':'Your document is ready'},{id:'t',type:'text',text:`${session.organisationName} has shared "${contract.title}" with you. Review it in your browser and ${quote?'approve it':'sign online or return a signed PDF, according to the options provided'}. No Atlas account is needed.`},{id:'b',type:'button',label:'Review document',url:link}] as never,partyId:contract.partyId??undefined,contactId:contract.contactId??undefined,entityType:'contract',entityId:contract.id});
 refresh();await writeAudit({organisationId:session.organisationId,actorUserId:session.userId,action:result.status==='SENT'?'contract.sent':'contract.email_failed',entityType:'ContractDocument',entityId:contract.id,after:{to}});
 if(result.status!=='SENT')throw new Error(result.error??'Could not send. The document is saved; use Get share link or try email again.');
 await emit(DOMAIN_EVENTS.contractSent,{organisationId:session.organisationId,contractId:contract.id,partyId:contract.partyId});
}
export async function shareContractLink(contractId:string,validDays=30){
 const session=await requireSession();assertCapability(session,CORE_CAPABILITIES.contractManage);
 const contract=await staffContract(session,contractId),link=await issue(contract,null,validFor(validDays));
 await writeAudit({organisationId:session.organisationId,actorUserId:session.userId,action:'contract.link_issued',entityType:'ContractDocument',entityId:contract.id});refresh();return {link};
}
export async function updateDraftContract(f:FormData){
 const session=await requireSession();assertCapability(session,CORE_CAPABILITIES.contractManage);
 const c=await staffContract(session,text(f,'id',100,true));if(c.status!=='DRAFT')throw new Error('Shared documents are frozen. Create a new contract for changed terms.');
 const expectedAt=new Date(text(f,'updatedAt',100,true));if(Number.isNaN(expectedAt.getTime()))throw new Error('Reload this draft before saving.');
 const title=text(f,'title',300,true),message=text(f,'message',2000),mode=text(f,'signingMode',20);
 if(!['BOTH','ONLINE','UPLOAD'].includes(mode))throw new Error('Choose a valid signing option.');
 const body=text(f,'body',50000);let pdf=await readPdf(f.get('file'));if(pdf&&body)throw new Error('Use a replacement PDF or new terms, not both.');
 let bodyHtml=c.bodyHtml;if(body){const blocks=[{id:'terms',type:'text' as const,text:body}];bodyHtml=blocksHtml(blocks);pdf={bytes:await documentPdf(title,blocks,session.organisationName),name:'contract.pdf'};}else if(pdf)bodyHtml='';
 const changed=await db.contractDocument.updateMany({where:{id:c.id,organisationId:session.organisationId,status:'DRAFT',updatedAt:expectedAt},data:{title,message,signingMode:mode,...(pdf?{bodyHtml,fileName:pdf.name,fileType:'application/pdf',fileSize:pdf.bytes.length,fileContent:pdf.bytes,contentHash:sha(pdf.bytes)}:{})}});
 if(!changed.count)throw new Error('This draft changed. Reload before saving.');
 await writeAudit({organisationId:session.organisationId,actorUserId:session.userId,action:'contract.draft_updated',entityType:'ContractDocument',entityId:c.id,before:{contentHash:c.contentHash},after:{title,contentHash:pdf?sha(pdf.bytes):c.contentHash,templateBasisVersion:c.templateVersion}});refresh();revalidatePath(`/crm/contracts/${c.id}`);
}
export async function revokeContract(f:FormData){
 const session=await requireSession();assertCapability(session,CORE_CAPABILITIES.contractManage);
 const c=await staffContract(session,text(f,'id',100,true));const r=await db.contractDocument.updateMany({where:{id:c.id,organisationId:session.organisationId,status:{in:editable}},data:{status:'REVOKED',tokenHash:hashToken(newToken(24))}});if(!r.count)throw new Error('A completed contract or pending return cannot be revoked.');
 await writeAudit({organisationId:session.organisationId,actorUserId:session.userId,action:'contract.revoked',entityType:'ContractDocument',entityId:c.id});refresh();
}
export async function deleteContract(f:FormData){
 const session=await requireSession();assertCapability(session,CORE_CAPABILITIES.contractManage);
 const c=await staffContract(session,text(f,'id',100,true));if(c.status!=='DRAFT')throw new Error('Only an unsent draft can be deleted. Revoke a shared document to preserve its history.');
 const r=await db.contractDocument.deleteMany({where:{id:c.id,organisationId:session.organisationId,status:'DRAFT',returns:{none:{}}}});if(!r.count)throw new Error('The document changed. Reload it.');await writeAudit({organisationId:session.organisationId,actorUserId:session.userId,action:'contract.deleted',entityType:'ContractDocument',entityId:c.id,before:{reference:c.reference}});refresh();
}
async function caller(){const {headers}=await import('next/headers');const h=await headers();return {ip:(h.get('x-forwarded-for')??'').split(',')[0].trim().slice(0,60)||null,agent:(h.get('user-agent')??'').slice(0,300)||null};}
function publicWhere(token:string):Prisma.ContractDocumentWhereInput {return {tokenHash:hashToken(token),status:{in:['SENT','VIEWED']},expiresAt:{gt:new Date()}};}
async function openContract(token:string){const c=await db.contractDocument.findFirst({where:publicWhere(token)});if(!c)throw new Error('This link has expired, was replaced, or is already complete.');return c;}
async function completeQuote(tx:Prisma.TransactionClient,c:{kind:string;quoteId:string|null;organisationId:string}){if(c.kind==='QUOTE'&&c.quoteId)await tx.quote.updateMany({where:{id:c.quoteId,organisationId:c.organisationId,status:{in:['DRAFT','SENT']}},data:{status:'ACCEPTED'}});}
export async function signContract(token:string,signerName:string,signatureImage?:string,consent=false){
 if(consent!==true)throw new Error('Confirm that you have read and agree to this document.');
 const c=await openContract(token);if(c.signingMode==='UPLOAD'&&c.kind!=='QUOTE')throw new Error('Return a signed PDF for this document.');
 const name=String(signerName??'').trim();if(name.length<2||name.length>200)throw new Error('Enter your full name (2–200 characters).');
 const drawn=signatureImage&&/^data:image\/png;base64,[A-Za-z0-9+/=]+$/.test(signatureImage)&&signatureImage.length<400000?signatureImage:null;
 if(drawn){try{await (await PDFDocument.create()).embedPng(drawn);}catch{throw new Error('The drawn signature is invalid. Clear it and try again.');}}
 const {ip,agent}=await caller(),signedAt=new Date();
 await db.$transaction(async tx=>{const r=await tx.contractDocument.updateMany({where:{id:c.id,...publicWhere(token)},data:{status:'SIGNED',completionMethod:'ONLINE',signedAt,signerName:name,signerIp:ip,signerUserAgent:agent,signatureImage:drawn}});if(!r.count)throw new Error('The document changed. Reload this page.');await completeQuote(tx,c);await tx.auditEntry.create({data:{organisationId:c.organisationId,action:c.kind==='QUOTE'?'quote.approved_by_customer':'contract.signed',entityType:'ContractDocument',entityId:c.id,after:{signerName:name,signedAt:signedAt.toISOString(),ip,userAgent:agent,contentHash:c.contentHash,consent:true,method:'ONLINE'}}});});
 await emit(DOMAIN_EVENTS.contractSigned,{organisationId:c.organisationId,contractId:c.id,partyId:c.partyId});if(c.kind==='QUOTE'&&c.quoteId)await emit(DOMAIN_EVENTS.salesQuoteAccepted,{organisationId:c.organisationId,quoteId:c.quoteId});refresh();return {title:c.title,reference:c.reference,signedAt:signedAt.toISOString()};
}
export async function returnSignedContract(token:string,f:FormData){
 const c=await openContract(token);if(c.kind==='QUOTE'||c.signingMode==='ONLINE')throw new Error('This document requires online approval.');
 const name=text(f,'signerName',200,true);if(name.length<2||f.get('consent')!=='yes')throw new Error('Enter your full name and confirm this is your signed copy.');
 const pdf=await readPdf(f.get('file'));if(!pdf)throw new Error('Choose your signed PDF.');const {ip,agent}=await caller(),hash=sha(pdf.bytes);
 await db.$transaction(async tx=>{const changed=await tx.contractDocument.updateMany({where:{id:c.id,...publicWhere(token)},data:{status:'RETURNED'}});if(!changed.count)throw new Error('This document changed. Reload it.');const submission=await tx.contractReturn.create({data:{organisationId:c.organisationId,contractId:c.id,fileName:pdf.name,fileSize:pdf.bytes.length,fileContent:pdf.bytes,contentHash:hash,signerName:name,signerIp:ip,signerUserAgent:agent}});await tx.auditEntry.create({data:{organisationId:c.organisationId,action:'contract.returned',entityType:'ContractDocument',entityId:c.id,after:{returnId:submission.id,signerName:name,contentHash:hash,originalHash:c.contentHash,ip}}});});refresh();return {reference:c.reference};
}
export async function reviewContractReturn(f:FormData){
 const session=await requireSession();assertCapability(session,CORE_CAPABILITIES.contractManage);
 const c=await staffContract(session,text(f,'id',100,true)),id=text(f,'returnId',100,true),decision=text(f,'decision',20),note=text(f,'reviewNote',2000);
 if(!['ACCEPT','REJECT'].includes(decision))throw new Error('Choose accept or reject.');if(decision==='REJECT'&&!note)throw new Error('Explain what needs changing.');
 const submission=await db.contractReturn.findFirst({where:{id,contractId:c.id,organisationId:session.organisationId,status:'PENDING'},select:{id:true,signerName:true,signerIp:true,signerUserAgent:true,contentHash:true}});if(!submission)throw new Error('This return has already been reviewed.');const now=new Date(),accept=decision==='ACCEPT';
 await db.$transaction(async tx=>{const changed=await tx.contractDocument.updateMany({where:{id:c.id,organisationId:session.organisationId,status:'RETURNED'},data:accept?{status:'SIGNED',completionMethod:'UPLOAD',signedAt:now,signerName:submission.signerName,signerIp:submission.signerIp,signerUserAgent:submission.signerUserAgent}:{status:'VIEWED'}});if(!changed.count)throw new Error('The document changed. Reload it.');const r=await tx.contractReturn.updateMany({where:{id,contractId:c.id,organisationId:session.organisationId,status:'PENDING'},data:{status:accept?'ACCEPTED':'REJECTED',reviewedBy:session.userId,reviewedAt:now,reviewNote:note}});if(!r.count)throw new Error('The return changed. Reload it.');await tx.auditEntry.create({data:{organisationId:session.organisationId,actorUserId:session.userId,action:accept?'contract.signed':'contract.return_rejected',entityType:'ContractDocument',entityId:c.id,after:{returnId:id,method:'UPLOAD',contentHash:submission.contentHash,originalHash:c.contentHash,note}}});});
 if(accept)await emit(DOMAIN_EVENTS.contractSigned,{organisationId:session.organisationId,contractId:c.id,partyId:c.partyId});refresh();
}
export async function declineContract(token:string,reason:string){
 const c=await openContract(token),why=String(reason??'').trim().slice(0,1000)||'No reason given',{ip,agent}=await caller();
 await db.$transaction(async tx=>{const r=await tx.contractDocument.updateMany({where:{id:c.id,...publicWhere(token)},data:{status:'DECLINED',declinedReason:why,signerIp:ip,signerUserAgent:agent}});if(!r.count)throw new Error('The document changed. Reload it.');if(c.kind==='QUOTE'&&c.quoteId)await tx.quote.updateMany({where:{id:c.quoteId,organisationId:c.organisationId,status:{in:['DRAFT','SENT']}},data:{status:'DECLINED'}});await tx.auditEntry.create({data:{organisationId:c.organisationId,action:'contract.declined',entityType:'ContractDocument',entityId:c.id,after:{reason:why,ip}}});});await emit(DOMAIN_EVENTS.contractDeclined,{organisationId:c.organisationId,contractId:c.id,partyId:c.partyId});refresh();
}
export async function loadPublicContract(token:string){
 const c=await db.contractDocument.findFirst({where:{tokenHash:hashToken(token),status:{in:['SENT','VIEWED','SIGNED','DECLINED','RETURNED']}},select:{id:true,organisationId:true,reference:true,title:true,kind:true,message:true,bodyHtml:true,status:true,expiresAt:true,sentAt:true,viewedAt:true,signedAt:true,signerName:true,declinedReason:true,contentHash:true,fileName:true,fileSize:true,quoteId:true,signingMode:true,completionMethod:true,returns:{where:{status:{in:['REJECTED','PENDING','ACCEPTED']}},select:{id:true,status:true,reviewNote:true,submittedAt:true},orderBy:{submittedAt:'desc'},take:1}}});
 if(!c)return null;if(c.status!=='SIGNED'&&c.expiresAt&&c.expiresAt<new Date())return {...c,bodyHtml:'',fileName:null,quoteId:null,returns:[]};
 if(c.status==='SENT'){const {ip}=await caller(),at=new Date();const r=await db.contractDocument.updateMany({where:{id:c.id,...publicWhere(token)},data:{status:'VIEWED',viewedAt:at}});if(r.count){await writeAudit({organisationId:c.organisationId,action:'contract.viewed',entityType:'ContractDocument',entityId:c.id,after:{viewedAt:at,ip}});return {...c,status:'VIEWED',viewedAt:at};}}
 return c;
}
export async function loadPublicContractFile(token:string){
 const c=await db.contractDocument.findFirst({where:{tokenHash:hashToken(token),OR:[{status:'SIGNED'},{status:{in:['SENT','VIEWED','RETURNED','DECLINED']},expiresAt:{gt:new Date()}}]},select:{fileContent:true,fileName:true,fileType:true}});return c?.fileContent?{bytes:Buffer.from(c.fileContent),name:c.fileName??'document.pdf',type:'application/pdf'}:null;
}
