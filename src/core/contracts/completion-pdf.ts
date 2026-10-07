import { db } from '@/core/db/client';
import { PDFDocument } from 'pdf-lib';
import { documentPdf } from '@/core/templates/pdf';
import type { ContractDocument } from '@/generated/prisma/client';
/** Preserve the original bytes in storage; this is a separate combined completion copy. */
export async function completionPdf(c:ContractDocument){
 if(c.status!=='SIGNED')throw new Error('This document is not complete.');
 const returned=c.completionMethod==='UPLOAD'?await db.contractReturn.findFirst({where:{contractId:c.id,organisationId:c.organisationId,status:'ACCEPTED'},orderBy:{submittedAt:'desc'}}):null;
 const source=returned?.fileContent??c.fileContent??await documentPdf(c.title,[{id:'legacy',type:'text',text:c.bodyHtml.replace(/<br\s*\/?\s*>/gi,'\n').replace(/<\/p>/gi,'\n\n').replace(/<[^>]+>/g,'').replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&amp;/g,'&')}],'Atlas');
 const pdf=await PDFDocument.load(source),certificate=await documentPdf('Completion record',[
 {id:'ref',type:'text',text:`Document: ${c.title}\nReference: ${c.reference}\nCompleted by: ${c.signerName??'Not recorded'}\nCompletion time (UTC): ${c.signedAt?.toISOString()??'Not recorded'}\nMethod: ${returned?'Signed PDF returned by customer and accepted by staff':'Electronic signature with recorded consent'}\nRecipient email: ${c.signerEmail??'Private share link'}\nNetwork address: ${c.signerIp??'Not recorded'}`},
 {id:'hash',type:'text',text:`Original document SHA-256:\n${c.contentHash}${returned?`\n\nReturned PDF SHA-256:\n${returned.contentHash}\n\nSubmitted (UTC): ${returned.submittedAt.toISOString()}\nAccepted (UTC): ${returned.reviewedAt?.toISOString()??''}`:''}`},
 {id:'note',type:'text',text:'This completion record documents the response recorded by Atlas. Keep it with the document. The original document and any returned PDF are preserved separately in the sender\'s workspace.'}
 ],'Atlas');
 const cert=await PDFDocument.load(certificate);for(const p of await pdf.copyPages(cert,cert.getPageIndices()))pdf.addPage(p);
 if(c.signatureImage&&c.completionMethod!=='UPLOAD'){const png=await pdf.embedPng(c.signatureImage);const p=pdf.getPages()[pdf.getPageCount()-1];const scale=Math.min(240/png.width,65/png.height);p.drawImage(png,{x:56,y:64,width:png.width*scale,height:png.height*scale});}
 return Buffer.from(await pdf.save());
}
