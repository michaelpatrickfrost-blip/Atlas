import { describe, it, expect, vi } from "vitest";
import type { Session } from "@/core/auth/session";
vi.mock("@/core/modules/runtime",()=>({enabledModulesForSession:vi.fn(async()=>new Set(["people","sales"]))}));
vi.mock("@/core/modules/registry",()=>({getImplementedModules:()=>[
 {id:"people",analyticsProvider:[{id:"hr.directory",capability:"people.employee.read"},{id:"hr.pay",capability:"payroll.run.read"}]},
 {id:"sales",analyticsProvider:[{id:"sales.orders",capability:"sales.order.read"}]},
 {id:"stock",analyticsProvider:[{id:"stock.positions",capability:"stock.read"}]}
]}));
import { getAnalyticsMetrics } from "@/core/analytics/catalogue";
function session(caps:string[]){return {organisationId:"org-a",userId:"viewer",capabilities:new Set(caps)} as Session;}
describe("profile-aware metric catalogue",()=>{
 it("analytics-only viewers cannot see source metrics",async()=>{expect(await getAnalyticsMetrics(session(["analytics.dashboard.read"]))).toEqual([]);});
 it("employee read does not reveal payroll metrics",async()=>{expect((await getAnalyticsMetrics(session(["people.employee.read"]))).map(m=>m.id)).toEqual(["hr.directory"]);});
 it("disabled source modules cannot contribute even with source permission",async()=>{expect(await getAnalyticsMetrics(session(["stock.read"]))).toEqual([]);});
 it("Customer Master remains available through its own capability",async()=>{expect((await getAnalyticsMetrics(session(["customers.read"]))).map(m=>m.id)).toEqual(["customers.lifecycle","customers.territories"]);});
});
