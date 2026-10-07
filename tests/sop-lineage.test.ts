import {describe,expect,it} from 'vitest';
import {planningSignature} from '@/modules/sop/domain/lineage';
describe('retained PostgreSQL JSONB planning evidence',()=>{
 it('accepts identical projections after PostgreSQL reorders object keys',()=>{
  const projected={inputs:[{id:'input',value:1000,probability:50,sourceProbability:50,sourceModule:'crm',note:'Plan'}],planRevisions:[{id:'plan',revision:3}],targets:[{planId:'plan',periodKey:'2026-10',value:100000,currency:'GBP'}]};
  const stored={inputs:[{note:'Plan',probability:50,id:'input',sourceModule:'crm',sourceProbability:50,value:1000}],planRevisions:[{revision:3,id:'plan'}],targets:[{currency:'GBP',value:100000,periodKey:'2026-10',planId:'plan'}]};
  expect(planningSignature(stored)).toBe(planningSignature(projected));
 });
 it('still rejects live probability, input and target revision changes',()=>{
  const before={inputs:[{id:'i',probability:50}],planRevisions:[{id:'p',revision:2}],targets:[{value:10}]};
  expect(planningSignature({...before,inputs:[{id:'i',probability:60}]})).not.toBe(planningSignature(before));
  expect(planningSignature({...before,planRevisions:[{id:'p',revision:3}]})).not.toBe(planningSignature(before));
  expect(planningSignature({...before,targets:[{value:11}]})).not.toBe(planningSignature(before));
 });
});
