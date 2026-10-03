import { describe,it,expect } from 'vitest';
import { parseCsv,csvText } from '@/core/shared/csv';
describe('CSV imports',()=>{
 it('reads commas, escaped quotes, CRLF, BOM and multiline fields',()=>{expect(parseCsv('\uFEFFcode,name\r\nP1,"A, B"\r\nP2,"Two ""quotes""\nand a line"')).toEqual([{code:'P1',name:'A, B'},{code:'P2',name:'Two "quotes"\nand a line'}]);});
 it('rejects duplicate headers and malformed rows',()=>{expect(()=>parseCsv('code,code\n1,2')).toThrow('unique');expect(()=>parseCsv('code,name\n1,2,3')).toThrow('Row 2');expect(()=>parseCsv('code,name\n1,"unfinished')).toThrow('unclosed');});
 it('round trips quoted template values',()=>{const text=csvText([['code','name'],['X','A, "B"']]);expect(parseCsv(text)).toEqual([{code:'X',name:'A, "B"'}]);});
 it('limits import size and row count',()=>{expect(()=>parseCsv('c\n'+Array.from({length:501},(_,i)=>String(i)).join('\n'))).toThrow('500');});
});
