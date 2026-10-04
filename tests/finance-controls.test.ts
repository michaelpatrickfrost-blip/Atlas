import {describe,it,expect} from 'vitest';
import {minor,money,lineAmounts,roundRatio,convert,assertBalanced,allocate} from '@/modules/finance/domain/money';
import {matchLine,budgetPosition,ageBucket,checkActorSeparation,periodAllows,normaliseInvoiceNumber,suggestMatches} from '@/modules/finance/domain/controls';
import {routePolicy,stagesSchema} from '@/core/approvals/policy';
describe('Finance monetary invariants',()=>{
 it('retains large exact minor units and currency exponents',()=>{expect(minor('90071992547409.93')).toBe(9007199254740993n);expect(minor('12','JPY')).toBe(12n);expect(minor('12.345','KWD')).toBe(12345n);expect(money(-12345n)).toBe('-£123.45');});
 it('rejects extra precision, scientific notation and unknown currency',()=>{for(const v of ['1.001','1e3','NaN','1,000'])expect(()=>minor(v)).toThrow();expect(()=>minor('1','XYZ')).toThrow();});
 it('rounds fractional quantities and taxes exactly',()=>{expect(lineAmounts('2.5',199n,2000)).toEqual({net:498n,tax:100n,gross:598n});expect(roundRatio(-5n,2n)).toBe(-3n);});
 it('converts using explicit decimal rates and exponent changes',()=>{expect(convert(10000n,'0.85','USD','GBP')).toBe(8500n);expect(convert(100n,'150','USD','JPY')).toBe(150n);});
 it('rejects unbalanced, mixed-sided and empty journals',()=>{expect(assertBalanced([{debit:12n,credit:0n},{debit:0n,credit:12n}])).toBe(12n);expect(()=>assertBalanced([{debit:12n,credit:0n},{debit:0n,credit:11n}])).toThrow();expect(()=>assertBalanced([{debit:1n,credit:1n},{debit:0n,credit:0n}])).toThrow();});
 it('allocates landed cost exactly with stable remainder assignment',()=>{expect(allocate(9050000n,[1n,1n,1n])).toEqual([3016667n,3016667n,3016666n]);expect(allocate(2n,[1n,2n,3n]).reduce((s,n)=>s+n,0n)).toBe(2n);});
});
describe('Finance matching and controls',()=>{
 const match={ordered:'1000',accepted:'1000',alreadyInvoiced:'0',invoiceQuantity:'1000',expectedPrice:250n,invoicePrice:250n,toleranceBps:200};
 it('passes exact three-way match',()=>expect(matchLine(match).matched).toBe(true));
 it('explains the brief price variance',()=>{const r=matchLine({...match,invoicePrice:272n});expect(r.matched).toBe(false);expect(r.variance).toBe(22000n);expect(r.varianceBps).toBe(880n);});
 it('uses accepted receipts and cumulative invoice quantities',()=>{expect(matchLine({...match,accepted:'928',invoiceQuantity:'940'}).issues).toContain('Invoiced quantity exceeds accepted receipts.');expect(matchLine({...match,alreadyInvoiced:'600',invoiceQuantity:'500'}).matched).toBe(false);});
 it('compares tolerance exactly rather than rounded percentages',()=>expect(matchLine({...match,expectedPrice:100001n,invoicePrice:102002n}).matched).toBe(false));
 it('does not treat a zero expected price as infinite allowance',()=>expect(matchLine({...match,expectedPrice:0n,invoicePrice:1n}).matched).toBe(false));
 it('computes operational budget availability',()=>expect(budgetPosition(5000000n,3100000n,1400000n,900000n)).toMatchObject({available:500000n,afterRequest:-400000n,overage:400000n}));
 it('separates actors and period source rules',()=>{expect(()=>checkActorSeparation('a','a')).toThrow();expect(periodAllows('SOFT_CLOSED','AP_INVOICE')).toBe(true);expect(periodAllows('SOFT_CLOSED','MANUAL')).toBe(false);expect(periodAllows('LOCKED','AP_INVOICE')).toBe(false);});
 it('groups receivables by due date',()=>{const now=new Date('2026-10-03T12:00Z');expect(ageBucket(new Date('2026-09-02T12:00Z'),now)).toBe('31–60');expect(ageBucket(null,now)).toBe('Current');});
 it('normalises supplier invoice numbers for exact duplicate protection',()=>expect(normaliseInvoiceNumber(' inv-19/384 ')).toBe('INV19384'));
 it('finds split receipts without inventing confidence from reference',()=>expect(suggestMatches(1482000n,[{id:'1',outstanding:920000n,reference:'INV-4192'},{id:'2',outstanding:562000n,reference:'INV-4203'}])).toEqual([{ids:['1','2'],confidence:70,reason:'Combined amount; confirm customer and references.'}]));
});
describe('Core approval routing',()=>{
 const p={minAmount:0n,maxAmount:10000n,currency:'GBP',conditions:{department:'Sales'}};
 it('routes exact context and boundaries',()=>expect(routePolicy([p],10000n,'GBP',{department:'Sales'})).toBe(p));
 it('rejects absent and overlapping policy',()=>{expect(()=>routePolicy([p],10001n,'GBP',{department:'Sales'})).toThrow('No approval');expect(()=>routePolicy([p,p],1n,'GBP',{department:'Sales'})).toThrow('overlap');});
 it('does not route across currency or department',()=>{expect(()=>routePolicy([p],1n,'USD',{department:'Sales'})).toThrow();expect(()=>routePolicy([p],1n,'GBP',{department:'Operations'})).toThrow();});
 it('supports parallel stages while rejecting empty routes',()=>{expect(stagesSchema.parse([['a','b'],['c']])).toHaveLength(2);expect(()=>stagesSchema.parse([[]])).toThrow();});
});
