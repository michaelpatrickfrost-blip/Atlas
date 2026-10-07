import { describe,it,expect } from 'vitest';
import { parseBlocks, merge, blocksHtml } from '@/core/templates/domain';
import { documentPdf } from '@/core/templates/pdf';
import { PDFDocument } from 'pdf-lib';
describe('business document templates',()=>{
 it('rejects unknown and incomplete merge fields',()=>{expect(()=>merge('{{customer.secret}}',{})).toThrow('Unknown');expect(()=>merge('{{customer.name}',{})).toThrow('incomplete');});
 it('blocks generation with missing values and keeps sample previews usable',()=>{expect(()=>merge('Hello {{customer.name}}',{})).toThrow('Fill in');expect(merge('Hello {{customer.name}}',{},false)).toBe('Hello [customer.name]');expect(merge('{{custom.scope}}',{'custom.scope':'Delivery'})).toBe('Delivery');});
 it('escapes customer data and content in every HTML block type',()=>{const blocks=parseBlocks([{id:'1',type:'text',text:'<script>alert(1)</script>'},{id:'2',type:'table',text:'<img src=x>|&customer'}]);const html=blocksHtml(blocks);expect(html).not.toContain('<script>');expect(html).not.toContain('<img');expect(html).toContain('&lt;script&gt;');expect(html).toContain('&amp;customer');});
 it('rejects duplicate sections and empty documents',()=>{expect(()=>parseBlocks([{id:'1',type:'text',text:'a'},{id:'1',type:'heading',text:'b'}])).toThrow('unique');expect(()=>parseBlocks([{id:'1',type:'divider',text:''}])).toThrow('content');});
 it('paginates long content and explicit page breaks into readable PDFs',async()=>{const bytes=await documentPdf('Agreement',[{id:'1',type:'text',text:'A long contract clause. '.repeat(1500)},{id:'2',type:'pageBreak',text:''},{id:'3',type:'signature',text:'Customer signature'}],'Atlas');const pdf=await PDFDocument.load(bytes);expect(pdf.getPageCount()).toBeGreaterThan(5);expect(pdf.getTitle()).toBe('Agreement');expect(pdf.getPages().every(p=>p.getWidth()>590&&p.getHeight()>840)).toBe(true);});
});
