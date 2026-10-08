import { beforeEach, expect, it, vi } from 'vitest';
const mocks=vi.hoisted(()=>({list:vi.fn(),record:vi.fn(),caseRecord:vi.fn(),enabled:vi.fn()}));
vi.mock('@/core/db/client',()=>({db:{moduleState:{findFirst:mocks.enabled},serviceTicket:{findMany:mocks.list,findFirst:mocks.record},serviceCase:{findFirst:mocks.caseRecord}}}));
import { ticketList, ticketRecord } from '@/modules/service/services/queries';
import type { Session } from '@/core/auth/session';
const session={organisationId:'company',userId:'worker',capabilities:new Set(['service.ticket.read'])} as Session;
beforeEach(()=>{vi.clearAllMocks();mocks.enabled.mockResolvedValue({id:'enabled'});});
it('combines filters with signed tenant and restricted case scope',async()=>{
 await ticketList(session,{q:'FIN',status:'COMPLETE',mine:true,caseId:'parent'});
 expect(mocks.list.mock.calls[0][0].where.AND).toEqual(expect.arrayContaining([
 expect.objectContaining({organisationId:'company',case:expect.objectContaining({security:'STANDARD'})}),
 expect.objectContaining({status:'COMPLETE',ownerUserId:'worker',caseId:'parent',OR:expect.any(Array)})]));
 expect(mocks.list.mock.calls[0][0].select.case).toEqual({select:{number:true}});
});
it('never loads parent conversation for a departmental reader',async()=>{
 mocks.record.mockResolvedValue({id:'ticket',caseId:'parent'});
 expect(await ticketRecord(session,'ticket')).toMatchObject({canOpenCase:false});
 expect(mocks.caseRecord).not.toHaveBeenCalled();
 const query=mocks.record.mock.calls[0][0];
 expect(query.where.AND[0]).toMatchObject({organisationId:'company'});
 expect(query.select.case).toEqual({select:{number:true}});expect(query.select.entries).toBeUndefined();
});
it('only exposes a case link when its independent case scope admits the record',async()=>{
 mocks.record.mockResolvedValue({id:'ticket',caseId:'parent'});mocks.caseRecord.mockResolvedValue(null);
 const reader={...session,capabilities:new Set(['service.ticket.read','service.case.read'])};
 expect(await ticketRecord(reader,'ticket')).toMatchObject({canOpenCase:false});
 expect(mocks.caseRecord.mock.calls[0][0].where.AND[0]).toMatchObject({organisationId:'company'});
});
it('denies historical reads without the capability or an enabled service module',async()=>{
 await expect(ticketList({...session,capabilities:new Set()})).rejects.toThrow();expect(mocks.list).not.toHaveBeenCalled();
 mocks.enabled.mockResolvedValue(null);await expect(ticketRecord(session,'ticket')).rejects.toThrow('not enabled');expect(mocks.record).not.toHaveBeenCalled();
});
