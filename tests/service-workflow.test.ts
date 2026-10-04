import {describe,it,expect} from 'vitest';
import {validateTransition,nextAction} from '@/modules/service/domain/workflow';
import {serviceCaseScope,serviceTicketScope} from '@/core/permissions/service-access';
import {planRead,executeReadQuery} from '@/server/data-api/read-query';
import type {Session} from '@/core/auth/session';
const session=(caps:string[])=>({organisationId:'org-a',userId:'agent-a',capabilities:new Set(caps)}) as Session;
const valid={openTickets:0,resolution:'Pricing correction validated by Finance.',code:'INVOICE_CORRECTED',complaint:false};
describe('Customer Service workflow',()=>{
 it('does not resolve with any unfinished department dependency',()=>{expect(()=>validateTransition('WAITING_INTERNAL','RESOLVED',{...valid,openTickets:1})).toThrow('dependencies');});
 it('keeps resolved and closed separate',()=>{expect(()=>validateTransition('OPEN','CLOSED',{...valid,reason:'Accepted'})).toThrow('Resolve');expect(()=>validateTransition('OPEN','RESOLVED',valid)).not.toThrow();});
 it('requires a resolution summary and code',()=>{expect(()=>validateTransition('OPEN','RESOLVED',{...valid,resolution:''})).toThrow('required');});
 it('requires complaint root cause and closure acceptance',()=>{expect(()=>validateTransition('RESOLVED','CLOSED',{...valid,complaint:true,reason:'Accepted'})).toThrow('root cause');expect(()=>validateTransition('RESOLVED','CLOSED',{...valid,complaint:true,rootCause:'Superseded price',reason:'Accepted'})).not.toThrow();});
 it('requires a reopening reason',()=>{expect(()=>validateTransition('CLOSED','OPEN',valid)).toThrow('reason');expect(()=>validateTransition('CLOSED','OPEN',{...valid,reason:'Customer says correction incomplete'})).not.toThrow();});
 it('does not silently abandon open tickets on cancellation',()=>{expect(()=>validateTransition('OPEN','CANCELLED',{...valid,openTickets:2,reason:'No longer required'})).toThrow('explicitly');});
 it('calls for customer update after department completion',()=>{const now=new Date('2026-10-03T12:00:00Z');expect(nextAction({status:'WAITING_INTERNAL',customerUpdateDueAt:null},[{status:'COMPLETE',dueAt:now,completedAt:now}],null,now)).toContain('response ready');});
 it('tracks overdue promises separately from internal due dates',()=>{const now=new Date('2026-10-03T12:00:00Z');expect(nextAction({status:'OPEN',customerUpdateDueAt:new Date('2026-10-03T11:00:00Z')},[],null,now)).toContain('Promised');});
 it('warns on internal deadline without changing customer case status',()=>{const now=new Date('2026-10-03T12:00:00Z'),c={status:'WAITING_INTERNAL',customerUpdateDueAt:null};expect(nextAction(c,[{status:'IN_PROGRESS',dueAt:new Date('2026-10-03T11:00:00Z'),completedAt:null}],null,now)).toContain('dependency');expect(c.status).toBe('WAITING_INTERNAL');});
});
describe('Customer Service secured data reads',()=>{
 it('restricts ordinary agents to standard cases in their company',()=>{expect(serviceCaseScope(session(['service.case.read']))).toMatchObject({organisationId:'org-a',security:'STANDARD',organisation:{moduleStates:{some:{moduleId:'service',enabled:true,entitled:true}}}});});
 it('denies department responders the case conversation even if they own a ticket',()=>{const s=session(['service.ticket.read']);expect(()=>planRead(s,'ServiceCase',{})).toThrow('capability');expect(()=>planRead(s,'ServiceEntry',{})).toThrow('capability');});
 it('scopes departmental work by ownership or queue membership',()=>{const s=serviceTicketScope(session(['service.ticket.read']));expect(s).toMatchObject({organisationId:'org-a',case:{security:'STANDARD'},OR:[{ownerUserId:'agent-a'},{queue:{members:{some:{userId:'agent-a',organisationId:'org-a'}}}}]});});
 it('does not let department membership bypass restricted cases',()=>{expect(serviceTicketScope(session(['service.ticket.read']))).toMatchObject({case:{security:'STANDARD'}});});
 it('ignores a caller-supplied foreign tenant in favour of an AND scope',()=>{const plan=planRead(session(['service.case.read']),'ServiceCase',{where:{organisationId:'org-b'}});expect(plan.args.where).toMatchObject({AND:[{organisationId:'org-a'},{organisationId:'org-b'}]});});
 it('drops nested case internals for departmental readers',()=>{const plan=planRead(session(['service.ticket.read']),'ServiceTicket',{include:{case:{include:{entries:true}}}});expect(plan.children).not.toHaveProperty('case');});
 it('denies arbitrary history deletion through the query API',async()=>{await expect(executeReadQuery(session(['service.case.read']),'serviceEntry','deleteMany',{})).rejects.toThrow('only read');});
});
