import { describe,it,expect } from 'vitest';
import { operationTime } from '@/modules/products/domain/operation-time';
import { finiteSchedule,finiteSlot,finiteCapacity,plantTimeline,moveToPlantDay,type FiniteResource } from '@/modules/manufacturing/domain/finite-scheduling';
import { MrpEngine } from '@/modules/manufacturing/domain/mrp-engine';
import { DemandSource,DemandType,type RecipeOperation } from '@/modules/manufacturing/domain/mrp-types';
import { rolledCost,type MakeDefinition } from '@/modules/products/domain/make';
import { demandForecast,monthlyDemand,adjustedForecast } from '@/modules/manufacturing/domain/demand-forecast';
const date=(s:string)=>new Date(s);
const resource=(id='kiln'):FiniteResource=>({id,workCentreId:'fire',name:id,active:true,calendarMode:'CONTINUOUS',timezone:'Europe/London',shifts:[],bookings:[],downtime:[]});
const op={id:'fire',name:'Fire',durationMinutes:120,waitMinutes:30,timingMode:'BATCH',workCentreId:'fire',resourceId:'kiln',eligibleResourceIds:['kiln']};
describe('kiln planning and demand',()=>{
 it('charges full loads including cooling even for a partial final batch',()=>{
  const timing={setupMinutes:20,runMinutesPerUnit:99,timingMode:'BATCH',batchCapacity:100,cycleMinutes:600,coolingMinutes:180,waitMinutes:30};
  expect(operationTime(timing,101,500)).toMatchObject({batches:2,setupMinutes:40,runMinutes:1560,durationMinutes:1600,waitMinutes:30});
  const recipe:MakeDefinition={productId:'pipe',supply:'MAKE',batchQuantity:500,yieldPercent:100,purchaseMinor:0,lines:[],operations:[{...timing,name:'Fire',crewSize:0,machineMinorPerHour:6000,labourMinorPerHour:1000,logisticsMinorPerBatch:0,machineIncludesLabour:false}]};
  const cost=rolledCost('pipe',101,new Map([['pipe',recipe]]));expect(cost.buckets.machine).toBe(160000);expect(cost.buckets.labour).toBe(0);expect(cost.hours.run).toBe(26);
 });
 it('never allocates an incompatible faster kiln and chooses an eligible free alternative',()=>{
  const a=resource(),b=resource('alternative'),wrong=resource('incompatible');a.bookings=[{id:'occupied',start:date('2026-10-12T08:00Z'),end:date('2026-10-12T18:00Z')}];
  const slots=finiteSchedule([{...op,eligibleResourceIds:['kiln','alternative']}],date('2026-10-12T08:00Z'),[a,b,wrong]);expect(slots[0].resourceId).toBe('alternative');expect(slots[0].end.toISOString()).toBe('2026-10-12T10:00:00.000Z');
 });
 it('waits through downtime and keeps cooling capacity exclusive',()=>{
  const r=resource();r.downtime=[{id:'repair',start:date('2026-10-12T08:00Z'),end:date('2026-10-12T10:00Z')}];
  const slots=finiteSchedule([op,{...op,id:'second',waitMinutes:0}],date('2026-10-12T08:00Z'),[r]);expect(slots[0].start.toISOString()).toBe('2026-10-12T10:00:00.000Z');expect(slots[1].start.toISOString()).toBe('2026-10-12T12:30:00.000Z');
 });
 it('splits throughput work across shifts but never interrupts a firing cycle',()=>{
  const r={...resource(),calendarMode:'SHIFTS',shifts:[{daysOfWeek:[1,2,3,4,5],startMinute:480,endMinute:960,crewCount:1}]};
  const slot=finiteSlot(r,120,date('2026-10-16T14:00Z'),false,date('2026-10-23T00:00Z'));expect(slot.start.toISOString()).toBe('2026-10-16T14:00:00.000Z');expect(slot.end.toISOString()).toBe('2026-10-19T08:00:00.000Z');
  const batch=finiteSlot(r,120,date('2026-10-16T14:00Z'),true,date('2026-10-23T00:00Z'));expect(batch.start.toISOString()).toBe('2026-10-19T07:00:00.000Z');expect(batch.end.toISOString()).toBe('2026-10-19T09:00:00.000Z');
 });
 it('uses local plant shifts across the autumn clock change and overnight boundaries',()=>{
  const r={...resource(),calendarMode:'SHIFTS',shifts:[{daysOfWeek:[6],startMinute:1320,endMinute:1800,crewCount:1}]};
  const slot=finiteSlot(r,420,date('2026-10-24T20:00Z'),true,date('2026-10-27T00:00Z'));expect(slot.start.toISOString()).toBe('2026-10-24T21:00:00.000Z');expect(slot.end.toISOString()).toBe('2026-10-25T04:00:00.000Z');
 });
 it('refuses unconfigured shifts, impossible batches and invalid quantities',()=>{
  expect(()=>finiteSchedule([op],date('2026-10-12T08:00Z'),[{...resource(),calendarMode:'SHIFTS'}])).toThrow('needs working shifts');
  const r={...resource(),calendarMode:'SHIFTS',shifts:[{daysOfWeek:[1],startMinute:480,endMinute:960,crewCount:1}]};expect(()=>finiteSlot(r,600,date('2026-10-12T08:00Z'),true,date('2026-10-20T08:00Z'))).toThrow('no feasible slot');
  expect(()=>operationTime({setupMinutes:0,runMinutesPerUnit:0,timingMode:'BATCH',batchCapacity:0,cycleMinutes:120},10)).toThrow('capacity');expect(()=>operationTime({setupMinutes:0,runMinutesPerUnit:1},NaN)).toThrow('finite');
 });
 it('consumes shipped bookings once while retaining outstanding production demand',()=>{expect(monthlyDemand(100,70,30)).toEqual({residualForecast:30,productionDemand:60});expect(monthlyDemand(50,70,30).productionDemand).toBe(30);});
 it('backtests a seasonal model and makes reviewable future estimates',()=>{const history=[10,20,30,40,50,60,70,80,90,100,110,120,10,20,30,40,50,60,70,80,90,100,110,120];const result=demandForecast(history);expect(result.method).toBe('Same month last year');expect(result.wape).toBe(0);expect(result.quantities).toEqual([10,20,30,40,50,60]);expect(demandForecast([1,2]).quantities).toEqual([]);});
 it('flags intermittent demand and rejects non-finite source values',()=>{expect(demandForecast([0,0,0,0,10,0,0,0,0,0,0,20]).warning).toContain('Intermittent');expect(()=>demandForecast([1,NaN,3])).toThrow('finite');});
 it('allows last year plus 10%, additive adjustments and fixed zero without inventing missing history',()=>{expect(adjustedForecast(100,10,0)).toBe(110);expect(adjustedForecast(100,10,5)).toBe(115);expect(adjustedForecast(100,0,-200)).toBe(0);expect(adjustedForecast(0,0,0)).toBe(0);expect(adjustedForecast(null,10,0)).toBeNull();expect(()=>adjustedForecast(100,-101,0)).toThrow();});
 it('uses an overnight shift already running and counts overlapping downtime once',()=>{
  const r={...resource(),calendarMode:'SHIFTS',shifts:[{daysOfWeek:[1],startMinute:1320,endMinute:1800,crewCount:1}]};
  expect(finiteSlot(r,60,date('2026-10-13T01:00Z'),true,date('2026-10-14T00:00Z')).start.toISOString()).toBe('2026-10-13T01:00:00.000Z');
  r.bookings=[{id:'work',start:date('2026-10-12T22:00Z'),end:date('2026-10-13T02:00Z')}];r.downtime=[{id:'repair',start:date('2026-10-13T01:00Z'),end:date('2026-10-13T03:00Z')}];
  expect(finiteCapacity(r,date('2026-10-12T20:00Z'),date('2026-10-13T08:00Z'))).toEqual({calendarHours:8,bookedHours:4,downtimeHours:2,freeHours:3,conflicts:1});
 });
 it('refuses a machine from another work centre even if stale eligibility lists it',()=>{expect(()=>finiteSchedule([op],date('2026-10-12T08:00Z'),[{...resource(),workCentreId:'other'}])).toThrow('eligible');});

 it('uses kiln cycles, transfer wait and correct operation dates in the material proposal',()=>{
  const base:RecipeOperation={position:1,name:'Fire',setupMinutes:10,runMinutesPerUnit:0,crewSize:0,workCentreId:'fire',workCentreCode:'FIRE',workCentreName:'Fire',resourceId:'kiln',resourceName:'kiln',resourceType:'MACHINE',machineMinorPerHour:6000,labourMinorPerHour:1000,overheadMinorPerHour:0,logisticsMinorPerBatch:0,machineIncludesLabour:false,machineIncludesOverhead:false};
  const required=date('2026-11-01T12:00Z');
  const result=new MrpEngine({demand:[{id:'d',demandType:DemandType.FIRM,source:DemandSource.SALES_ORDER,productId:'p',quantity:150,requiredDate:required,sourceId:'sales'}],inventory:new Map(),recipes:new Map([['p',{productId:'p',definitionId:'r',version:1,supply:'MAKE',batchQuantity:100,yieldPercent:100,subcontractMinorPerUnit:0,components:[],operations:[{...base,timingMode:'BATCH',batchCapacity:100,cycleMinutes:60,coolingMinutes:30,waitMinutes:15},{...base,position:2,name:'Pack',setupMinutes:0,runMinutesPerUnit:1,waitMinutes:99}]}]]),prices:new Map(),existingSupply:new Map(),leadTimes:new Map(),safetyStock:new Map(),names:new Map()}).run();
  const plan=result.plannedOrders[0];expect(plan.quantity).toBe(200);expect(plan.operations![0].durationMinutes).toBe(200);expect(plan.operations![0].batches).toBe(2);expect(plan.operations![1].start!.getTime()-plan.operations![0].end!.getTime()).toBe(15*60000);expect(plan.operations![1].end).toEqual(required);
 });

 it('keeps Gantt day boundaries and moved wall time stable across the clock change',()=>{const edges=plantTimeline(date('2026-10-24T12:00Z'),3,'Europe/London');expect(edges[2].getTime()-edges[1].getTime()).toBe(25*3600000);expect(moveToPlantDay(date('2026-10-24T12:30Z'),edges[1],'Europe/London').toISOString()).toBe('2026-10-25T13:30:00.000Z');});

 it('does not promise capacity on an overdue occupied machine and can use an approved alternative',()=>{const held={...resource(),holdReason:'Overdue running work needs review'};expect(()=>finiteSlot(held,60,date('2026-10-12T08:00Z'),false,date('2026-10-13T08:00Z'))).toThrow('Overdue');expect(finiteSchedule([{...op,eligibleResourceIds:['kiln','alternative']}],date('2026-10-12T08:00Z'),[held,resource('alternative')])[0].resourceId).toBe('alternative');});

});
