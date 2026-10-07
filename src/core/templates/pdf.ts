import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import type { TemplateBlock } from './types';
/** A4 document layout with wrapped paragraphs, tables and explicit section/page breaks. */
export async function documentPdf(title:string,blocks:TemplateBlock[],company:string){
 const pdf=await PDFDocument.create(),regular=await pdf.embedFont(StandardFonts.Helvetica),bold=await pdf.embedFont(StandardFonts.HelveticaBold);
 let page=pdf.addPage([595.28,841.89]),y=785;const ink=rgb(.12,.16,.22),border=rgb(.8,.83,.87);
 const newPage=()=>{page=pdf.addPage([595.28,841.89]);y=785;};
 const wrap=(text:string,size:number,strong=false,width=480)=>{
  const font=strong?bold:regular;try{font.encodeText(text);}catch{throw new Error('This text contains characters the PDF font cannot display. Upload a PDF with embedded fonts instead.');}
  const lines:string[]=[];let current='';
  for(const word of text.split(/(\s+)/)){
   if(font.widthOfTextAtSize(current+word,size)<=width){current+=word;continue;}
   if(current.trim()){lines.push(current.trimEnd());current='';}
   for(const char of word.trimStart()){if(font.widthOfTextAtSize(current+char,size)>width){lines.push(current);current='';}current+=char;}
  }
  if(current||!lines.length)lines.push(current.trimEnd());return lines;
 };
 const line=(text:string,size=11,strong=false)=>{for(const row of wrap(text,size,strong)){if(y-size*1.5<64)newPage();page.drawText(row,{x:56,y,size,font:strong?bold:regular,color:ink});y-=size*1.5;}};
 line(company.toUpperCase(),9,true);y-=16;line(title,22,true);y-=14;
 for(const b of blocks){
  if(b.type==='pageBreak'){newPage();continue;}
  if(b.type==='divider'){if(y<80)newPage();page.drawLine({start:{x:56,y},end:{x:539,y},thickness:.5,color:border});y-=18;continue;}
  if(b.type==='table'){
   const rows=b.text.split('\n').filter(r=>r.trim()).map(r=>r.split('|').map(c=>c.trim())),columns=Math.max(...rows.map(r=>r.length),1),width=480/columns;
   if(columns>6)throw new Error('Tables support up to six columns.');
   for(let i=0;i<rows.length;i++){
    const cells=Array.from({length:columns},(_,j)=>wrap(rows[i][j]??'',10,i===0,width-16));let offset=0;const total=Math.max(...cells.map(c=>c.length));
    while(offset<total){if(y<100)newPage();const available=Math.max(1,Math.floor((y-72)/15)),count=Math.min(total-offset,available),height=count*15+16;
     for(let j=0;j<columns;j++){page.drawRectangle({x:56+j*width,y:y-height,width,height,borderColor:border,borderWidth:.5,...(i===0?{color:rgb(.96,.97,.98)}:{})});for(let k=0;k<count;k++){const text=cells[j][offset+k];if(text)page.drawText(text,{x:64+j*width,y:y-20-k*15,size:10,font:i===0?bold:regular,color:ink});}}
     y-=height;offset+=count;if(offset<total)newPage();
    }
   }y-=16;continue;
  }
  if(b.type==='heading'&&y<120)newPage();if(b.type==='signature'&&y<175)newPage();
  const text=b.type==='signature'?`${b.text||'Signed by'}\n\nName: ____________________    Date: __________\n\nSignature: _________________________________`:b.text;
  for(const row of text.split('\n'))line(b.type==='bullets'&&row?`• ${row}`:row,b.type==='heading'?15:11,b.type==='heading');y-=12;
 }
 pdf.getPages().forEach((p,i)=>p.drawText(`${company}  |  ${i+1} / ${pdf.getPageCount()}`,{x:56,y:30,size:8,font:regular,color:rgb(.4,.45,.5)}));
 pdf.setTitle(title);pdf.setAuthor(company);return Buffer.from(await pdf.save());
}
