import {beforeEach,describe,expect,it,vi} from "vitest";
const state=vi.hoisted(()=>({session:{organisationId:"org",userId:"agent",capabilities:new Set<string>()},tx:{serviceWorkItem:{findFirst:vi.fn(),count:vi.fn(),updateMany:vi.fn()},serviceQueue:{findFirstOrThrow:vi.fn()},serviceQueueMember:{findFirst:vi.fn()},serviceFile:{count:vi.fn()},approvalInstance:{findFirst:vi.fn()},serviceWorkEntry:{create:vi.fn()},auditEntry:{create:vi.fn()},domainOutbox:{create:vi.fn()}},enabled:vi.fn()}));
vi.mock("@/core/auth/session",()=>({requireSession:async()=>state.session}));
vi.mock("@/core/db/client",()=>({db:{$transaction:async(fn:(tx:typeof state.tx)=>unknown)=>fn(state.tx),moduleState:{findFirst:state.enabled}}}));
vi.mock("next/cache",()=>({revalidatePath:vi.fn()}));vi.mock("next/navigation",()=>({redirect:vi.fn()}));
import {updateWork,commentWork} from "@/core/service-work/actions";
const work={id:"work",organisationId:"org",kind:"TICKET",number:"TKT-1",queueId:"queue",requesterUserId:"requester",status:"IN_PROGRESS",version:1,sla:{},definition:{},pausedAt:null,resolutionDueAt:new Date("2026-10-20"),ownerUserId:"agent",parentCaseId:null,parentId:null};
const form=(values:Record<string,string>)=>{const f=new FormData();Object.entries({workId:"work",version:"1",...values}).forEach(([k,v])=>f.set(k,v));return f;};
beforeEach(()=>{vi.resetAllMocks();state.session.capabilities=new Set(["core.profile.self","tickets.ticket.read","tickets.ticket.manage","tickets.ticket.reply"]);state.tx.serviceWorkItem.findFirst.mockResolvedValue(work);state.tx.serviceQueue.findFirstOrThrow.mockResolvedValue({restricted:false});state.tx.serviceQueueMember.findFirst.mockResolvedValue({userId:"agent"});state.tx.serviceWorkItem.count.mockResolvedValue(0);state.tx.serviceWorkItem.updateMany.mockResolvedValue({count:1});state.tx.serviceWorkEntry.create.mockResolvedValue({id:"entry"});});
describe("service-work boundaries",()=>{
 it("blocks resolution while linked child work is unfinished",async()=>{state.tx.serviceWorkItem.count.mockResolvedValue(1);await expect(updateWork(form({status:"RESOLVED",reason:"Complete"}))).rejects.toThrow("child work");expect(state.tx.serviceWorkItem.updateMany).not.toHaveBeenCalled();});
 it("requires evidence for request types that specify it",async()=>{state.tx.serviceWorkItem.findFirst.mockResolvedValue({...work,definition:{requiredEvidence:true}});state.tx.serviceFile.count.mockResolvedValue(0);await expect(updateWork(form({status:"RESOLVED",reason:"Complete"}))).rejects.toThrow("required evidence");});
 it("requires approval independently of the agent's manage capability",async()=>{state.tx.serviceWorkItem.findFirst.mockResolvedValue({...work,definition:{approval:true}});await expect(updateWork(form({status:"RESOLVED",reason:"Complete"}))).rejects.toThrow("approval");});
 it("prevents a manager progressing another restricted queue's work",async()=>{state.tx.serviceQueue.findFirstOrThrow.mockResolvedValue({restricted:true});state.tx.serviceQueueMember.findFirst.mockResolvedValue(null);await expect(updateWork(form({status:"IN_PROGRESS"}))).rejects.toThrow("restricted queue");});
 it("prevents a requester creating receiving-team internal notes",async()=>{state.tx.serviceQueueMember.findFirst.mockResolvedValue(null);await expect(commentWork(form({body:"Private text",visibility:"INTERNAL"}))).rejects.toThrow("receiving team");expect(state.tx.serviceWorkEntry.create).not.toHaveBeenCalled();});
 it("rejects stale writes before appending events",async()=>{state.tx.serviceWorkItem.updateMany.mockResolvedValue({count:0});await expect(commentWork(form({body:"Update",visibility:"REQUESTER"}))).rejects.toThrow("record changed");expect(state.tx.serviceWorkEntry.create).not.toHaveBeenCalled();});
 it("preserves the original first-response timestamp on later replies",async()=>{state.tx.serviceWorkItem.findFirst.mockResolvedValue({...work,firstResponseAt:new Date("2026-10-01")});await commentWork(form({body:"Update",visibility:"REQUESTER"}));expect(state.tx.serviceWorkItem.updateMany).toHaveBeenCalledWith(expect.objectContaining({data:{version:{increment:1}}}));});
});

describe("work assignment", () => {
  it.each(["TICKET", "QUERY"])("clears an explicitly unassigned %s and records its ownership change", async kind => {
    state.session.capabilities.add("service.ticket.read");
    state.session.capabilities.add("service.ticket.update");
    state.tx.serviceWorkItem.findFirst.mockResolvedValue({ ...work, kind });
    await updateWork(form({ status: "IN_PROGRESS", ownerUserId: "" }));
    expect(state.tx.serviceWorkItem.updateMany).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: "work", organisationId: "org", version: 1 },
      data: expect.objectContaining({ ownerUserId: null, version: { increment: 1 } }),
    }));
    expect(state.tx.serviceWorkEntry.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ body: expect.stringContaining("Owner: agent → unassigned.") }),
    }));
    expect(state.tx.auditEntry.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ organisationId: "org", entityId: "work", action: "service.work.status_changed" }),
    }));
  });

  it("preserves the existing owner when the assignment field is omitted", async () => {
    await updateWork(form({ status: "IN_PROGRESS" }));
    expect(state.tx.serviceWorkItem.updateMany).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ ownerUserId: "agent" }),
    }));
  });

  it("rejects assigning a user outside the receiving queue without a write or event", async () => {
    state.tx.serviceQueueMember.findFirst.mockResolvedValueOnce({ userId: "agent" }).mockResolvedValueOnce(null);
    await expect(updateWork(form({ status: "IN_PROGRESS", ownerUserId: "foreign-user" }))).rejects.toThrow("member of this queue");
    expect(state.tx.serviceQueueMember.findFirst).toHaveBeenLastCalledWith({ where: { organisationId: "org", queueId: "queue", userId: "foreign-user" } });
    expect(state.tx.serviceWorkItem.updateMany).not.toHaveBeenCalled();
    expect(state.tx.serviceWorkEntry.create).not.toHaveBeenCalled();
  });

  it("cannot unassign work without mutation permission", async () => {
    state.session.capabilities.delete("tickets.ticket.manage");
    await expect(updateWork(form({ status: "IN_PROGRESS", ownerUserId: "" }))).rejects.toThrow("tickets.ticket.manage");
    expect(state.tx.serviceWorkItem.updateMany).not.toHaveBeenCalled();
    expect(state.tx.serviceWorkEntry.create).not.toHaveBeenCalled();
  });

  it("rejects a stale unassignment before recording a change", async () => {
    state.tx.serviceWorkItem.updateMany.mockResolvedValue({ count: 0 });
    await expect(updateWork(form({ status: "IN_PROGRESS", ownerUserId: "" }))).rejects.toThrow("record changed");
    expect(state.tx.serviceWorkEntry.create).not.toHaveBeenCalled();
    expect(state.tx.auditEntry.create).not.toHaveBeenCalled();
  });
});
