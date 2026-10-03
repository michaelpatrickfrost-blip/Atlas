import { beforeEach,describe,expect,it,vi } from "vitest";
const state=vi.hoisted(()=>({
 session:{userId:'user-a',organisationId:'org-a',membershipId:'member-a',capabilities:new Set<string>()},
 db:{opportunity:{findFirst:vi.fn(),findUniqueOrThrow:vi.fn(),update:vi.fn()},pipelineStage:{findFirstOrThrow:vi.fn()},chatMessage:{create:vi.fn()},role:{findFirstOrThrow:vi.fn(),update:vi.fn()},roleOnMembership:{findFirst:vi.fn()},$transaction:vi.fn()},
 enabled:vi.fn(),audit:vi.fn(),emit:vi.fn(),
}));
vi.mock('@/core/auth/session',()=>({requireSession:vi.fn(async()=>state.session)}));
vi.mock('@/core/db/client',()=>({db:state.db}));
vi.mock('@/core/modules/access',()=>({assertModuleEnabled:state.enabled}));
vi.mock('@/core/modules/registry',()=>({MODULE_CATALOGUE:[]}));
vi.mock('@/core/audit/log',()=>({writeAudit:state.audit}));
vi.mock('@/core/events/bus',()=>({emit:state.emit,DOMAIN_EVENTS:{}}));
vi.mock('next/cache',()=>({revalidatePath:vi.fn()}));
vi.mock('@/modules/crm/services/pipelines',()=>({getDefaultPipeline:vi.fn()}));
import { moveOpportunityStage } from '@/modules/crm/services/opportunities';
import { postMessage } from '@/app/(app)/chat/actions';
import { saveRole } from '@/app/(app)/settings/actions';
beforeEach(()=>{vi.clearAllMocks();state.session.capabilities=new Set(['sales.opportunity.manage','core.chat.write','core.roles.manage']);state.enabled.mockResolvedValue(undefined);state.db.$transaction.mockImplementation(async fn=>fn(state.db));});
describe('workspace security boundaries',()=>{
 it('rejects a stage from another pipeline before writing',async()=>{
  state.db.opportunity.findFirst.mockResolvedValue({id:'opp-a'});
  state.db.opportunity.findUniqueOrThrow.mockResolvedValue({id:'opp-a',pipelineId:'pipeline-a',status:'OPEN',stage:{name:'New'}});
  state.db.pipelineStage.findFirstOrThrow.mockRejectedValue(new Error('not found'));
  await expect(moveOpportunityStage('opp-a','foreign-stage')).rejects.toThrow('not found');
  expect(state.db.pipelineStage.findFirstOrThrow).toHaveBeenCalledWith({where:{id:'foreign-stage',pipelineId:'pipeline-a',pipeline:{organisationId:'org-a'}}});
  expect(state.db.opportunity.update).not.toHaveBeenCalled();
 });
 it('rejects CRM mutations when the app is disabled',async()=>{
  state.enabled.mockRejectedValue(new Error('disabled'));
  await expect(moveOpportunityStage('opp-a','stage-a')).rejects.toThrow('disabled');
  expect(state.db.opportunity.findFirst).not.toHaveBeenCalled();
 });
 it('scopes chat messages to the authenticated company and author',async()=>{
  const form=new FormData();form.set('body','Team update');form.set('organisationId','foreign-org');
  await postMessage(form);
  expect(state.db.chatMessage.create).toHaveBeenCalledWith({data:{organisationId:'org-a',authorUserId:'user-a',body:'Team update'}});
 });
 it('rejects missing chat capability and empty messages',async()=>{
  await expect(postMessage(new FormData())).rejects.toThrow('Write a message');
  state.session.capabilities.clear();
  const form=new FormData();form.set('body','hello');
  await expect(postMessage(form)).rejects.toThrow('FORBIDDEN');
  expect(state.db.chatMessage.create).not.toHaveBeenCalled();
 });
 it('does not allow administrators to remove their own administration access',async()=>{
  const form=new FormData();form.set('roleId','role-a');
  state.db.role.findFirstOrThrow.mockResolvedValue({capabilities:['core.roles.manage','core.users.manage']});
  state.db.roleOnMembership.findFirst.mockResolvedValue({roleId:'role-a'});
  await expect(saveRole(form)).rejects.toThrow('own access administration');
  expect(state.db.role.findFirstOrThrow).toHaveBeenCalledWith({where:{id:'role-a',organisationId:'org-a'}});
  expect(state.db.role.update).not.toHaveBeenCalled();
 });
 it('rejects invented capabilities before looking up the role',async()=>{
  const form=new FormData();form.set('roleId','role-a');form.set('capability','everything.superuser');
  await expect(saveRole(form)).rejects.toThrow('Unknown permission');
  expect(state.db.role.update).not.toHaveBeenCalled();
 });
});
