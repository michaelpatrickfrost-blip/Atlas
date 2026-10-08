import {beforeEach,describe,it,expect,vi} from "vitest";
const mocks=vi.hoisted(()=>({session:{userId:"worker",organisationId:"org",capabilities:new Set(["core.profile.self","kpis.manage"])},enabled:vi.fn(),find:vi.fn(),update:vi.fn(),audit:vi.fn(),metrics:vi.fn(),tx:vi.fn()}));
vi.mock("@/core/auth/session",()=>({requireSession:async()=>mocks.session}));
vi.mock("@/core/modules/access",()=>({assertModuleEnabled:mocks.enabled}));
vi.mock("@/core/analytics/catalogue",()=>({getAnalyticsMetrics:mocks.metrics}));
vi.mock("@/core/db/client",()=>({db:{$transaction:mocks.tx,kpi:{findFirst:mocks.find}}}));
vi.mock("next/cache",()=>({revalidatePath:vi.fn()}));
vi.mock("next/navigation",()=>({redirect:vi.fn()}));
import {connectGoal} from "@/app/(app)/kpis/actions";
const goal={id:"goal",organisationId:"org",metricId:"",sliceLabel:"",target:100,unit:"count",status:"ACTIVE"};
function form(values:Record<string,string>={}){const f=new FormData();Object.entries({expectedConnection:JSON.stringify(["","",100,"count"]),metricId:"finance.posted.profit",sliceLabel:"GBP",target:"500",...values}).forEach(([k,v])=>f.set(k,v));return f;}
beforeEach(()=>{vi.resetAllMocks();mocks.session.capabilities=new Set(["core.profile.self","kpis.manage"]);mocks.enabled.mockResolvedValue(undefined);mocks.find.mockResolvedValue(goal);mocks.update.mockResolvedValue({count:1});mocks.metrics.mockResolvedValue([{id:"finance.posted.profit",unit:"money",goalQuery:vi.fn()}]);mocks.tx.mockImplementation(async fn=>fn({kpi:{updateMany:mocks.update},auditEntry:{create:mocks.audit}}));});
describe("connect existing goal",()=>{
 it("converts target, locks existing connection and writes audit in transaction",async()=>{expect(await connectGoal("goal",form())).toEqual({saved:true});expect(mocks.find).toHaveBeenCalledWith({where:{id:"goal",organisationId:"org",visibility:"COMPANY",status:"ACTIVE"}});expect(mocks.update.mock.calls[0][0]).toEqual({where:{id:"goal",organisationId:"org",metricId:"",sliceLabel:"",target:100,unit:"count",status:"ACTIVE"},data:{metricId:"finance.posted.profit",sliceLabel:"GBP",unit:"money",target:50000}});expect(mocks.audit.mock.calls[0][0].data).toMatchObject({organisationId:"org",entityId:"goal",action:"kpi.source.connected"});});
 it("blocks stale connections including same-source target changes",async()=>{expect(await connectGoal("goal",form({expectedConnection:JSON.stringify(["","",101,"count"])}))).toMatchObject({error:expect.stringContaining("another window")});expect(mocks.update).not.toHaveBeenCalled();});
 it("raced write cannot create an audit success",async()=>{mocks.update.mockResolvedValue({count:0});expect(await connectGoal("goal",form())).toMatchObject({error:expect.stringContaining("changed")});expect(mocks.audit).not.toHaveBeenCalled();});
 it("KPI permission cannot grant Finance access",async()=>{mocks.metrics.mockResolvedValue([]);expect(await connectGoal("goal",form())).toMatchObject({error:expect.stringContaining("allowed")});expect(mocks.update).not.toHaveBeenCalled();});
 it("rejects malformed currency before writing",async()=>{expect(await connectGoal("goal",form({sliceLabel:"all"}))).toMatchObject({error:expect.stringContaining("currency")});expect(mocks.update).not.toHaveBeenCalled();});
 it("allows rate targets without responses but rejects percentages over 100",async()=>{mocks.metrics.mockResolvedValue([{id:"csat",unit:"percent",goalQuery:vi.fn()}]);expect(await connectGoal("goal",form({metricId:"csat",sliceLabel:"",target:"90"}))).toMatchObject({saved:true});mocks.update.mockClear();expect(await connectGoal("goal",form({metricId:"csat",sliceLabel:"",target:"101"}))).toMatchObject({error:expect.stringContaining("percentage")});expect(mocks.update).not.toHaveBeenCalled();});
 it("rejects amounts that exceed safe numeric precision",async()=>{expect(await connectGoal("goal",form({target:"1e308"}))).toMatchObject({error:expect.stringContaining("numeric range")});expect(mocks.update).not.toHaveBeenCalled();});
 it("read-only callers cannot connect even with direct action",async()=>{mocks.session.capabilities=new Set(["kpis.read"]);await expect(connectGoal("goal",form())).rejects.toThrow("FORBIDDEN");expect(mocks.find).not.toHaveBeenCalled();});
 it("disabled goals app cannot write",async()=>{mocks.enabled.mockRejectedValue(Error("disabled"));await expect(connectGoal("goal",form())).rejects.toThrow("disabled");expect(mocks.find).not.toHaveBeenCalled();});
 it("foreign/unavailable goal cannot be connected",async()=>{mocks.find.mockResolvedValue(null);await expect(connectGoal("foreign",form())).rejects.toThrow("unavailable");expect(mocks.update).not.toHaveBeenCalled();});
 it("database errors remain protected",async()=>{mocks.tx.mockRejectedValue(Error("private DB error"));await expect(connectGoal("goal",form())).rejects.toThrow("private DB error");});
});
