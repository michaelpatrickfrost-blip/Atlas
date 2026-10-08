import {beforeEach,it,expect,vi} from "vitest";
const mocks=vi.hoisted(()=>({goals:vi.fn(),plans:vi.fn(),members:vi.fn(),metrics:vi.fn()}));
vi.mock("@/core/db/client",()=>({db:{kpi:{findMany:mocks.goals},performancePlan:{findMany:mocks.plans},membership:{findMany:mocks.members}}}));
vi.mock("@/core/analytics/catalogue",()=>({getAnalyticsMetrics:mocks.metrics}));
import {loadGoalWorkspace} from "@/modules/kpis/services/workspace";
import type {Session} from "@/core/auth/session";
beforeEach(()=>{vi.resetAllMocks();mocks.plans.mockResolvedValue([]);mocks.members.mockResolvedValue([]);mocks.metrics.mockResolvedValue([]);});
it("source access removal masks live readings and captured history instead of using manual progress",async()=>{
 mocks.goals.mockResolvedValue([{id:"goal",name:"Profit",ownerUserId:"owner",visibility:"COMPANY",metricId:"finance.posted.profit",unit:"money",sliceLabel:"GBP",target:100000,current:90000,startsAt:new Date("2026-01-01"),endsAt:new Date("2026-01-31"),status:"ACTIVE",updates:[{id:"history",value:90000,note:"Review",createdAt:new Date("2026-01-15"),actorUserId:"owner"}]}]);
 const result=await loadGoalWorkspace({organisationId:"org",userId:"reader",capabilities:new Set(["kpis.read"])} as Session);
 expect(result.goals[0]).toMatchObject({actual:null,verdict:"no_reading",updates:[{value:null}]});expect(result.goals[0].summary).toContain("Source access");
});
