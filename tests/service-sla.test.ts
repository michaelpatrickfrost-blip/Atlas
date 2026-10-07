import { describe, it, expect } from 'vitest';
import { slaSchema, addBusinessMinutes, businessMinutesBetween, slaState } from '@/core/service-work/sla';
import { validateAnswers, queueConfig, suggestedPriority } from '@/core/service-work/config';
const policy=slaSchema.parse({}),calendar=policy.calendar;
describe('shared service clocks',()=>{
 it('calculates a response within working hours',()=>expect(addBusinessMinutes(new Date('2026-10-07T08:00Z'),60,calendar).toISOString()).toBe('2026-10-07T09:00:00.000Z'));
 it('skips a weekend across the autumn clock change',()=>expect(addBusinessMinutes(new Date('2026-10-23T15:30Z'),120,calendar).toISOString()).toBe('2026-10-26T10:30:00.000Z'));
 it('honours holidays',()=>expect(addBusinessMinutes(new Date('2026-12-24T16:00Z'),120,{...calendar,holidays:['2026-12-25','2026-12-28']}).toISOString()).toBe('2026-12-29T10:00:00.000Z'));
 it('starts an after-hours request on the next working day',()=>expect(addBusinessMinutes(new Date('2026-10-07T20:00Z'),30,calendar).toISOString()).toBe('2026-10-08T08:30:00.000Z'));
 it('measures only business time during a pause',()=>expect(businessMinutesBetween(new Date('2026-10-23T15:30Z'),new Date('2026-10-26T10:00Z'),calendar)).toBe(90));
 it('does not charge weekends to a paused clock',()=>expect(businessMinutesBetween(new Date('2026-10-24T10:00Z'),new Date('2026-10-25T10:00Z'),calendar)).toBe(0));
 it('recognises warning and breach thresholds',()=>{const now=new Date('2026-10-07T10:00Z');expect(slaState(new Date('2026-10-07T10:30Z'),null,null,60,now)).toBe('AT_RISK');expect(slaState(now,null,null,60,now)).toBe('BREACHED');});
 it('keeps paused and completed milestones distinct',()=>{expect(slaState(new Date(0),new Date(),null)).toBe('PAUSED');expect(slaState(new Date(Date.now()+10000),null,new Date())).toBe('MET');expect(slaState(null,null,null)).toBe('UNSET');});
 it('retains a breach after a late completion',()=>expect(slaState(new Date('2026-10-07T10:00Z'),null,new Date('2026-10-07T11:00Z'))).toBe('BREACHED'));
 it('rejects invalid calendars',()=>{expect(()=>slaSchema.parse({calendar:{timezone:'Not/AZone'}})).toThrow();expect(()=>slaSchema.parse({calendar:{start:1000,end:500}})).toThrow();});
});
describe('configurable request contracts',()=>{
 it('calculates priority from separate impact and urgency',()=>{expect(suggestedPriority('BUSINESS','IMMEDIATE')).toBe('URGENT');expect(suggestedPriority('INDIVIDUAL','LOW')).toBe('LOW');});
 it('validates required custom fields without accepting undeclared fields',()=>{const fields=queueConfig({services:[{id:'access',name:'Access',fields:[{key:'system',label:'System',type:'text',required:true}]}]}).services[0].fields;expect(()=>validateAnswers(fields,{})).toThrow('System');expect(validateAnswers(fields,{system:'ERP',secret:'ignored'})).toEqual({system:'ERP'});});
 it('rejects choices outside the saved form definition',()=>expect(()=>validateAnswers([{key:'choice',label:'Choice',type:'select',required:true,options:['A']}],{choice:'B'})).toThrow());
});
