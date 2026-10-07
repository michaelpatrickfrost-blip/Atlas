import { describe,it,expect } from 'vitest';
import { accuracy,baseline,buildDemand,serviceAt,serviceRows,DEFAULT_SETTINGS,months } from '@/modules/sop/domain/engine';
import { monthlyPhasing } from '@/modules/plan/domain/inputs';
import type { PlanningOrder,PlanningInput,PlanningProduct } from '@/core/planning/business';
const product:PlanningProduct={id:'p',code:'A',name:'Product A',unit:'each',priceMinor:200,currency:'GBP',safetyStock:0,weightGrams:null};
const order=(changes:Partial<PlanningOrder>={}):PlanningOrder=>({id:'so',lineId:'line',reference:'SO-1',partyId:'customer',customer:'Customer',productId:'p',projectId:null,opportunityId:null,quantity:40000,valueMinor:8000000,currency:'GBP',bookedOn:'2026-06-01',requestedOn:'2026-06-10',promisedOn:'2026-06-10',...changes});
const input=(changes:Partial<PlanningInput>={}):PlanningInput=>({id:'input',planId:'plan',label:'Project',sourceModule:'crm',sourceType:'sales-project',sourceId:'project',productId:'p',metricKey:'sales_volume',periodKey:'2026-06',value:50000,probability:60,unitPriceMinor:null,note:'Customer intelligence',...changes});
const build=(changes:Partial<Parameters<typeof buildDemand>[0]>={})=>buildDemand({products:[product],orders:[],deliveries:[],inputs:[],stock:[{productId:'p',quantity:720000}],supply:[],startsOn:'2026-06-01',endsOn:'2026-06-30',asOf:'2026-06-30',currency:'GBP',settings:{...DEFAULT_SETTINGS,method:'moving-average',historyMonths:12},supplyAvailable:true,...changes});
describe('S&OP acceptance calculations',()=>{
 it('keeps the late final split delivery from rewriting historical OTIF',()=>{
  const result=serviceAt(1000,'2026-06-10',[{quantity:600,deliveredOn:'2026-06-08'},{quantity:300,deliveredOn:'2026-06-10'},{quantity:100,deliveredOn:'2026-06-12'}],'2026-06-30',DEFAULT_SETTINGS);
  expect(result.deliveredByDue).toBe(900);expect(result.otif).toBe(false);
 });
 it('separates requested and promised dates',()=>{
  const events=[{quantity:1000,deliveredOn:'2026-06-12'}];
  expect(serviceAt(1000,'2026-06-10',events,'2026-06-30',DEFAULT_SETTINGS).otif).toBe(false);
  expect(serviceAt(1000,'2026-06-12',events,'2026-06-30',DEFAULT_SETTINGS).otif).toBe(true);
 });
 it('refuses to label dispatch-only evidence as customer OTIF',()=>{
  expect(serviceAt(1000,'2026-06-10',[{quantity:1000,deliveredOn:null}],'2026-06-30',DEFAULT_SETTINGS).otif).toBeNull();
 });
 it('100k forecast plus 40k confirmed demand remains 100k',()=>{
  const orders=['03','04','05'].map(m=>order({id:m,lineId:m,quantity:100000,requestedOn:`2026-${m}-10`,bookedOn:`2026-${m}-01`,closed:true}));
  const row=build({orders:[...orders,order()]}).rows[0];expect(row.baseline).toBe(100000);expect(row.consumed).toBe(40000);expect(row.consensus).toBe(100000);
 });
 it('retains 100k requested demand when only 85k shipped',()=>{
  const result=build({orders:['03','04','05'].map(m=>order({id:m,lineId:m,quantity:100000,requestedOn:`2026-${m}-10`,closed:true})),deliveries:[{id:'d',orderId:'03',lineId:'03',productId:'p',quantity:85000,dispatchedOn:'2026-03-10',deliveredOn:null,plannedDispatchOn:null,eta:null,status:'DISPATCHED',href:'/delivery'}]});
  expect(result.rows[0].baseline).toBe(100000);
 });
 it('preserves unconstrained 800k against 720k supply',()=>{
  const row=build({inputs:[input({sourceType:'manual',value:800000,probability:100})]}).rows[0];expect(row.consensus).toBe(800000);expect(row.constrained).toBe(720000);expect(row.atRisk).toBe(80000);
 });
 it('weights projects separately and consumes the attributed order once',()=>{
  const row=build({inputs:[input()],orders:[order({projectId:'project',quantity:20000})]}).rows[0];expect(row.projectRaw).toBe(50000);expect(row.projectWeighted).toBe(30000);expect(row.projectConsumed).toBe(20000);expect(row.projectRemaining).toBe(10000);expect(row.consensus).toBe(30000);
 });
 it('does not multiply order consumption across duplicate project contributions',()=>{
  const row=build({inputs:[input({value:25000}),input({id:'2',value:25000})],orders:[order({projectId:'project',quantity:20000})]}).rows[0];expect(row.projectConsumed).toBe(20000);expect(row.consensus).toBe(30000);
 });
 it('takes the larger of production orders and saved production plan',()=>{
  const row=build({stock:[],inputs:[input({sourceType:'manual',value:100,probability:100})],supply:[{productId:'p',quantity:80,on:'2026-06-20',type:'production',href:'/'},{productId:'p',quantity:70,on:'2026-06-20',type:'plan',href:'/'}]}).rows[0];expect(row.production).toBe(80);expect(row.atRisk).toBe(20);
 });
 it('does not treat unavailable supply as zero supply',()=>{const row=build({supplyAvailable:false,inputs:[input()]}).rows[0];expect(row.constrained).toBeNull();expect(row.atRisk).toBeNull();});
 it('does not invent margin when cost is unavailable',()=>{expect(build({inputs:[input()]}).rows[0].marginMinor).toBeNull();});
 it('keeps confirmed demand as the floor when a negative override exceeds baseline',()=>{expect(build({orders:[order()],inputs:[input({sourceType:'manual',value:-100000,probability:100})]}).rows[0].consensus).toBe(40000);});
 it('does not treat closed historical orders without POD as open backlog',()=>{expect(serviceRows([order({closed:true})],[],'2026-07-01',DEFAULT_SETTINGS)[0].open).toBe(0);});
 it('reports meaningful zero-denominator accuracy',()=>{expect(accuracy([0,0],[0,0])?.wape).toBeNull();expect(accuracy([100,200],[110,180])?.wape).toBe(10);});
 it('backtests only preceding observations and handles intermittent history',()=>{const result=baseline([0,0,500,0,0,0,600,0,0,0,700,0],3,'auto');expect(result.validation.length).toBeGreaterThan(0);expect(result.classification).toBe('intermittent');expect(result.values.every(v=>Number.isFinite(v)&&v>=0)).toBe(true);});
 it('phases without losing rounding residue',()=>{const values=monthlyPhasing('2026-06','2026-08',100);expect(values.reduce((s,v)=>s+v.value,0)).toBeCloseTo(100,4);expect(months('2026-06-01','2027-11-30')).toHaveLength(18);});
});
it('retains three lag forecasts against the same later actual',async()=>{
 const {forecastLagAccuracy}=await import('@/modules/sop/domain/engine');
 const versions=[['2025-12-01',81000],['2026-01-01',87000],['2026-02-01',91200]].map(([createdOn,consensus])=>({createdOn:String(createdOn),rows:[{productId:'p',period:'2026-03',baseline:80000,consensus:Number(consensus)}]}));
 const result=forecastLagAccuracy(versions,new Map([['p|2026-03',90500]]),'2026-04');
 expect(result.map(r=>r.lag)).toEqual([1,2,3]);expect(result.map(r=>r.consensus.mae)).toEqual([700,3500,9500]);
});
it('does not present a partial-delivery allocation as a verified received quantity',()=>{
 const result=serviceAt(1000,'2026-06-10',[{quantity:1000,deliveredOn:'2026-06-10',deliveryQuantityVerified:false}],'2026-06-30',DEFAULT_SETTINGS);
 expect(result.otif).toBeNull();expect(result.deliveredByDue).toBe(0);expect(result.basis).toContain('no verified');
});

it('preserves whole-period consensus while projecting only the unsupplied balance',()=>{
 const history=['03','04','05'].map(month=>order({id:month,lineId:month,quantity:100000,requestedOn:`2026-${month}-10`,closed:true}));
 const row=build({orders:[...history,order({dispatchedQuantity:20000})]}).rows[0];
 expect(row.consensus).toBe(100000);expect(row.confirmedOrders).toBe(40000);expect(row.fulfilled).toBe(20000);expect(row.remainingDemand).toBe(80000);
});
it('rejects ambiguous project and opportunity demand for the same converted deal',()=>{
 expect(()=>build({inputs:[input(),input({id:'op',sourceType:'opportunity',sourceId:'opportunity'})],orders:[order({projectId:'project',opportunityId:'opportunity'})]})).toThrow('Keep one commercial demand source');
});
it('protects the explicit safety-stock reserve',()=>{
 const row=build({products:[{...product,safetyStock:10}],stock:[{productId:'p',quantity:100}],inputs:[input({sourceType:'manual',value:100,probability:100})]}).rows[0];
 expect(row.constrained).toBe(90);expect(row.atRisk).toBe(10);expect(row.closing).toBe(0);
});
it('excludes future delivery timestamps from present service evidence',()=>{
 expect(serviceAt(1000,'2026-06-10',[{quantity:1000,deliveredOn:'2026-06-20'}],'2026-06-15',DEFAULT_SETTINGS).otif).toBeNull();
});
it('keeps order-level and value-weighted service separate from line rates',async()=>{
 const {serviceSummary}=await import('@/modules/sop/domain/engine');
 const rows=serviceRows([order({lineId:'one',quantity:10,valueMinor:9000}),order({lineId:'two',quantity:10,valueMinor:1000})],[{id:'d1',orderId:'so',lineId:'one',productId:'p',quantity:10,deliveredOn:'2026-06-09',dispatchedOn:null,plannedDispatchOn:null,eta:null,status:'DELIVERED',href:'/'},{id:'d2',orderId:'so',lineId:'two',productId:'p',quantity:10,deliveredOn:'2026-06-12',dispatchedOn:null,plannedDispatchOn:null,eta:null,status:'DELIVERED',href:'/'}],'2026-06-30',DEFAULT_SETTINGS);
 const summary=serviceSummary(rows,'requested','GBP');expect(summary.lineRate).toBe(50);expect(summary.orderRate).toBe(0);expect(summary.valueRate).toBe(90);
});
it('uses the latest retained forecast within each lag month rather than duplicating actuals',async()=>{
 const {forecastLagAccuracy}=await import('@/modules/sop/domain/engine');
 const row={productId:'p',unit:'each',period:'2026-06',baseline:100,consensus:100};
 const result=forecastLagAccuracy([{createdOn:'2026-05-01',rows:[row]},{createdOn:'2026-05-20',rows:[{...row,consensus:90}]}],new Map([['p|2026-06',90]]),'2026-07');
 expect(result[0].count).toBe(1);expect(result[0].consensus.mae).toBe(0);
});
it('recalculates supply scenarios without changing retained source rows',async()=>{
 const {scenarioRows,forecastBridge}=await import('@/modules/sop/domain/scenario');
 const source=build({stock:[],inputs:[input({sourceType:'manual',value:100,probability:100})],supply:[{productId:'p',quantity:100,on:'2026-06-20',type:'receipt',href:'/'}]}).rows;
 const result=scenarioRows(source,{demandPercent:10,pricePercent:20,productionPercent:0,receiptDelayMonths:1,unitCostPercent:0},null);
 expect(result[0].consensus).toBeCloseTo(110);expect(result[0].atRisk).toBeCloseTo(110);expect(source[0].receipts).toBe(100);expect(source[0].consensus).toBe(100);
 const bridge=forecastBridge(source,result);expect(bridge.opening+bridge.volume+bridge.price+bridge.interaction+bridge.rounding).toBeCloseTo(bridge.closing);
});
it('excludes lost commercial demand from a fresh forecast without changing saved input history',()=>{
 const row=build({inputs:[input({sourceInactive:true})],orders:[order({projectId:'project',quantity:20})]}).rows[0];expect(row.projectWeighted).toBe(0);expect(row.consensus).toBe(20);
});
it('preserves confirmed order prices when scenario assumptions change',async()=>{
 const {scenarioRows}=await import('@/modules/sop/domain/scenario');
 const source=build({orders:[order({quantity:20,valueMinor:6000})],inputs:[input({sourceType:'manual',value:80,probability:100})]}).rows;
 const result=scenarioRows(source,{demandPercent:0,pricePercent:50,productionPercent:0,receiptDelayMonths:0,unitCostPercent:0},null);
 expect(source[0].revenueMinor).toBe(22000);expect(result[0].revenueMinor).toBe(30000);expect(result[0].committedRevenueMinor).toBe(6000);
});

it('trains future cycles on closed months instead of treating future bookings or partial months as actuals',()=>{
 const history=['03','04','05'].map(month=>order({id:month,lineId:month,quantity:100,requestedOn:`2026-${month}-10`,closed:true}));
 const result=build({startsOn:'2026-09-01',endsOn:'2026-09-30',asOf:'2026-06-15',orders:[...history,order({quantity:10000,requestedOn:'2026-06-20'}),order({id:'future',quantity:10000,requestedOn:'2026-08-10'})]});
 expect(result.models[0].historyPeriods.at(-1)).toBe('2026-05');
 expect(result.rows[0].baseline).toBe(100);
});
it('aligns a seasonal forecast to the future cycle month after the historical cutoff',()=>{
 const history=Array.from({length:12},(_,i)=>order({id:String(i),lineId:String(i),quantity:i+1,requestedOn:`${i<7?'2025':'2026'}-${String((i+5)%12+1).padStart(2,'0')}-10`,closed:true}));
 const result=build({startsOn:'2026-09-01',endsOn:'2026-09-30',asOf:'2026-06-15',settings:{...DEFAULT_SETTINGS,method:'seasonal-naive',historyMonths:12},orders:history});
 expect(result.rows[0].baseline).toBe(4);
});

it('keeps today’s delivery date pending until its calendar-day cutoff has passed',()=>{
 const result=serviceAt(1000,'2026-06-10',[{quantity:900,deliveredOn:'2026-06-10'}],'2026-06-10',DEFAULT_SETTINGS);
 expect(result.state).toBe('pending');expect(result.otif).toBeNull();
});

it('does not reopen historical closed bookings when partial-delivery quantities are unverified',()=>{
 const closed=order({closed:true,quantity:100,requestedOn:'2026-05-10',promisedOn:'2026-05-10'});
 const result=build({orders:[closed],deliveries:[{id:'partial',orderId:closed.id,lineId:closed.lineId,productId:'p',quantity:100,deliveryQuantityVerified:false,dispatchedOn:'2026-05-10',deliveredOn:'2026-05-10',plannedDispatchOn:null,eta:null,status:'DELIVERED',href:'/delivery'}]});
 expect(result.rows[0].confirmedOrders).toBe(0);expect(result.rows[0].openOrders).toBe(0);
 expect(result.service[0].requested.state).toBe('unavailable');
});
