import {describe,it,expect} from 'vitest';
import {applyCompanyAccessRestrictions} from '@/core/permissions/company-access';
describe('company access overrides',()=>{
 it('removes every grant in disabled areas without changing roles or other areas',()=>{const grants=new Set(['customers.read','customers.commercial.manage','core.pricing.read','core.pricing.manage','core.audit.read','sales.order.read','core.roles.manage']);expect([...applyCompanyAccessRestrictions(grants,['customers','pricing','audit'])]).toEqual(['sales.order.read','core.roles.manage']);expect(grants.size).toBe(7);});
 it('retains individual role grants and ignores unknown restrictions',()=>{const grants=new Set(['customers.read','core.audit.read']);expect([...applyCompanyAccessRestrictions(grants,['pricing','unknown'])]).toEqual([...grants]);expect([...applyCompanyAccessRestrictions(grants)]).toEqual([...grants]);});
});
