import {describe,it,expect} from 'vitest';
import {PDFDocument} from 'pdf-lib';
import {documentBrandFrom} from '@/core/documents/company-brand';
import {buildQuotePdf,type QuotePdfData} from '@/modules/sales/services/quote-pdf';
const png='iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';
export const sampleQuote:QuotePdfData={reference:'Q-TEST-001',organisationName:'Northbridge Group',customerName:'Example Customer Ltd',customerCode:'C001',status:'DRAFT',createdAt:new Date('2026-10-03'),expiryDate:new Date('2026-11-03'),customerPoReference:'PO-1234',paymentTerms:'30 days',currency:'GBP',invoiceAddress:{line1:'12 High Street',city:'London',postcode:'SW1A 1AA',country:'United Kingdom'},deliveryAddress:{line1:'Warehouse One',city:'Manchester',postcode:'M1 1AA',country:'United Kingdom'},netAmount:18000,taxAmount:3600,totalAmount:21600,lines:[{description:'Premium industrial acoustic panel with a long description that wraps cleanly inside its product column.',code:'PANEL-01',quantity:10,unitAmount:2000,discountPercent:10,netAmount:18000,taxAmount:3600}]};
describe('quotation PDF',()=>{
 it('produces a valid A4 document using saved totals',async()=>{const bytes=await buildQuotePdf(sampleQuote);expect(Buffer.from(bytes).subarray(0,4).toString()).toBe('%PDF');const pdf=await PDFDocument.load(bytes);expect(pdf.getPageCount()).toBe(1);expect(pdf.getTitle()).toBe('Quotation Q-TEST-001');expect(pdf.getPage(0).getWidth()).toBeCloseTo(595.28,1);});
 it('labels order acknowledgements distinctly with saved delivery dates',async()=>{const pdf=await PDFDocument.load(await buildQuotePdf({...sampleQuote,documentType:'Order acknowledgement',requestedDeliveryDate:new Date('2026-11-01'),promisedDeliveryDate:new Date('2026-11-02')}));expect(pdf.getTitle()).toBe('Order acknowledgement Q-TEST-001');expect(pdf.getPageCount()).toBe(1);});
 it('paginates long quotations without dropping lines',async()=>{const bytes=await buildQuotePdf({...sampleQuote,lines:Array.from({length:60},(_,i)=>({...sampleQuote.lines[0],description:`Line ${i+1} ${sampleQuote.lines[0].description}`}))});const pdf=await PDFDocument.load(bytes);expect(pdf.getPageCount()).toBeGreaterThan(2);});
 it('prints the company name, logo colour and terms on a tax invoice',async()=>{
  const brand=documentBrandFrom({name:'Workspace',logoDataUrl:`data:image/png;base64,${png}`,companyProfile:{tradingName:'Northbridge Trading',legalName:'Northbridge Group Ltd',vatNumber:'GB123456789',accentColour:'#0b3d2e',terms:'Title passes on payment.',paymentDetails:'Sort code 00-00-00. Account 12345678.',addressLine1:'1 Mill Lane',city:'Leeds',postcode:'LS1 1AA',country:'GB'}});
  const pdf=await PDFDocument.load(await buildQuotePdf({...sampleQuote,documentType:'Tax invoice',dueDate:new Date('2026-11-01'),brand}));
  expect(pdf.getTitle()).toBe('Tax invoice Q-TEST-001');
  expect(pdf.getAuthor()).toBe('Northbridge Trading');
  expect(pdf.getCreator()).toBe('Northbridge Trading');
  expect(brand.logo?.type).toBe('png');
  expect(brand.letterhead.join(' ')).toContain('VAT GB123456789');
 });
 it('gives long terms their own pages',async()=>{
  const brand=documentBrandFrom({name:'Northbridge Group',companyProfile:{terms:`Goods remain our property until paid. ${'Payment is due on the agreed date. '.repeat(180)}`}});
  expect(brand.terms.length).toBeGreaterThan(4000);
  const pdf=await PDFDocument.load(await buildQuotePdf({...sampleQuote,brand}));
  expect(pdf.getPageCount()).toBeGreaterThan(1);
 });
});
