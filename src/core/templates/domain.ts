import { z } from 'zod';
import { MERGE_FIELDS, type TemplateBlock } from './types';
const blockSchema = z.object({ id:z.string().min(1).max(100), type:z.enum(['heading','text','bullets','table','signature','divider','pageBreak']), text:z.string().max(12000) });
export function parseBlocks(value: unknown): TemplateBlock[] {
  const blocks = z.array(blockSchema).min(1).max(80).parse(value);
  if (new Set(blocks.map(b=>b.id)).size !== blocks.length) throw new Error('Sections must have unique IDs.');
  if (JSON.stringify(blocks).length > 70000) throw new Error('Keep the template under 70,000 characters.');
  if (!blocks.some(b=>['heading','text','bullets','table'].includes(b.type) && b.text.trim())) throw new Error('Add some document content.');
  return blocks;
}
export function mergeKeys(text: string): string[] { return [...new Set([...text.matchAll(/\{\{\s*([\w.]+)\s*\}\}/g)].map(m=>m[1]))]; }
export function validateFields(text: string) {
  const unknown=mergeKeys(text).filter(k=>!MERGE_FIELDS.includes(k as typeof MERGE_FIELDS[number])&&!/^custom\.[a-z][a-z0-9_]{0,49}$/.test(k));
  if(unknown.length)throw new Error(`Unknown merge fields: ${unknown.join(', ')}. Use the field picker or custom.your_field.`);
  if(text.replace(/\{\{\s*[\w.]+\s*\}\}/g,'').includes('{{'))throw new Error('A merge field is incomplete. Use {{field.name}}.');
}
export function merge(text:string, fields:Record<string,string>, strict=true) {
  validateFields(text);
  const missing=mergeKeys(text).filter(k=>!fields[k]?.trim());
  if(strict && missing.length)throw new Error(`Fill in these fields before generating: ${missing.join(', ')}.`);
  return text.replace(/\{\{\s*([\w.]+)\s*\}\}/g,(_,key)=>fields[key]??`[${key}]`);
}
export const escapeHtml=(s:string)=>s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
export function blocksHtml(blocks:TemplateBlock[]):string {
 return blocks.map(b=>{const t=escapeHtml(b.text);switch(b.type){
  case 'heading':return `<h2>${t}</h2>`;
  case 'text':return `<p style="white-space:pre-wrap">${t}</p>`;
  case 'bullets':return `<ul>${t.split('\n').filter(Boolean).map(l=>`<li>${l}</li>`).join('')}</ul>`;
  case 'table':return `<table style="width:100%;border-collapse:collapse">${t.split('\n').filter(Boolean).map(l=>`<tr>${l.split('|').map(c=>`<td style="border:1px solid #ddd;padding:8px">${c.trim()}</td>`).join('')}</tr>`).join('')}</table>`;
  case 'signature':return `<p>${t||'Signed by'}<br/><br/>Name: ____________________ &nbsp; Date: __________<br/><br/>Signature: _________________________________</p>`;
  case 'divider':return '<hr/>';
  case 'pageBreak':return '<hr style="break-after:page"/>';
 }}).join('');
}
