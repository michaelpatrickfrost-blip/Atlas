// @vitest-environment jsdom
import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { ReportsWorkspace } from '@/modules/reports/workspace';
import type { ReportResult, ReportSpec } from '@/core/reports/types';
const spec:ReportSpec={id:'customers.records',name:'Customer directory',source:'Customers',description:'Directory',columns:[{key:'name',label:'Name',path:'name',searchable:true}]};
const result:ReportResult={spec,columns:spec.columns,rows:[{name:'QA Customer'}],total:1,page:1};
afterEach(()=>{cleanup();vi.unstubAllGlobals();});
describe('Report workspace filter state',()=>{
 it('restores and locks the currency column when a money column is selected again',()=>{const financial={...spec,columns:[{key:'name',label:'Name'},{key:'net',label:'Net',type:'money' as const,currencyKey:'currency'},{key:'currency',label:'Currency'}]};render(<ReportsWorkspace datasets={[financial]} company="QA Company" initialResult={{...result,spec:financial,columns:financial.columns,rows:[]}} initialError=""/>);const net=screen.getByLabelText('Net'),currency=screen.getByLabelText('Currency') as HTMLInputElement;fireEvent.click(net);fireEvent.click(currency);expect(currency.checked).toBe(false);fireEvent.click(net);expect(currency.checked).toBe(true);expect(currency.disabled).toBe(true);});
 it('keeps new edits made during a pending preview and disables downloading until applied',async()=>{
 let finish!:(value:unknown)=>void;const fetch=vi.fn().mockReturnValue(new Promise(resolve=>{finish=resolve;}));vi.stubGlobal('fetch',fetch);
 render(<ReportsWorkspace datasets={[spec]} company="QA Company" initialResult={result} initialError=""/>);
 const search=screen.getByRole('textbox',{name:'Search records'});fireEvent.change(search,{target:{value:'first'}});expect((screen.getByRole('button',{name:'Download Excel'}) as HTMLButtonElement).disabled).toBe(true);
 fireEvent.submit(screen.getByRole('form',{name:'Report filters'}));fireEvent.change(search,{target:{value:'second'}});
 await act(async()=>{finish({ok:true,json:async()=>result});});
 expect((search as HTMLInputElement).value).toBe('second');expect((screen.getByRole('button',{name:'Download Excel'}) as HTMLButtonElement).disabled).toBe(true);expect(fetch.mock.calls[0][0]).toContain('search=first');
 });
});
