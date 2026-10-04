import { describe, it, expect } from "vitest";
import { dashboardSchema, readBoardSettings, readWidgets } from "@/modules/analytics/definition";
import { timeSeries } from "@/core/analytics/buckets";
import { modelScope, canReadModel } from "@/server/data-api/read-policy";
import type { Session } from "@/core/auth/session";
const widget={id:"one",metricId:"people.headcount",visual:"bar",wide:true};
const session={organisationId:"tenant-a",userId:"viewer",capabilities:new Set(["analytics.dashboard.read"])} as Session;
describe("analytics boundaries",()=>{
 it("scopes dashboard reads to the current tenant and owner",()=>{expect(modelScope(session,"Dashboard")).toEqual({organisationId:"tenant-a",userId:"viewer"});});
 it("analytics access does not grant access to HR, inventory or sales",()=>{expect(canReadModel(session,"Dashboard")).toBe(true);for(const model of ["Employee","InventoryBalance","SalesOrder"] as const)expect(canReadModel(session,model)).toBe(false);});
 it("rejects duplicate identities, oversized dashboards and invalid visuals",()=>{expect(dashboardSchema.safeParse({name:"My view",widgets:[widget,widget]}).success).toBe(false);expect(dashboardSchema.safeParse({name:"My view",widgets:Array.from({length:25},(_,i)=>({...widget,id:String(i)}))}).success).toBe(false);expect(dashboardSchema.safeParse({name:"My view",widgets:Array.from({length:24},(_,i)=>({...widget,id:String(i)}))}).success).toBe(true);expect(dashboardSchema.safeParse({name:"My view",widgets:[{...widget,visual:"sql"}]}).success).toBe(false);});
  it("supports chart types and validates visual styling",()=>{for(const visual of ["kpi","bar","stacked","column","line","area","donut","pie","gauge","funnel","table"])expect(dashboardSchema.safeParse({name:"Styled view",widgets:[{...widget,visual,color:"teal",tone:"blue",category:"Operations",maxCategories:5,span:8,breakdown:"product"}]}).success).toBe(true);expect(dashboardSchema.safeParse({name:"Invalid colour",widgets:[{...widget,color:"javascript:alert(1)"}]}).success).toBe(false);expect(dashboardSchema.safeParse({name:"Bad width",widgets:[{...widget,span:5}]}).success).toBe(false);expect(dashboardSchema.safeParse({name:"Bad breakdown",widgets:[{...widget,breakdown:"x".repeat(41)}]}).success).toBe(false);});
 it("ignores legacy CRM widgets and malformed definitions",()=>{expect(readWidgets(["pipeline","not json",JSON.stringify(widget)])).toEqual([widget]);});
 it("reads a board refresh setting without treating it as a chart",()=>{const meta=JSON.stringify({kind:"atlas-board",refreshSeconds:15});expect(readWidgets([meta,JSON.stringify(widget)])).toEqual([widget]);expect(readBoardSettings([meta]).refreshSeconds).toBe(15);expect(readBoardSettings([JSON.stringify(widget)]).refreshSeconds).toBe(30);});
 it("keeps short ranges in weekly order",()=>{const now=new Date(2026,9,3);const since=new Date(2026,8,14);const points=timeSeries([new Date(2026,8,16),new Date(2026,8,18),new Date(2026,9,2)],since,now);expect(points.at(-1)?.value).toBe(1);expect(points.reduce((sum,point)=>sum+point.value,0)).toBe(3);expect(points.length).toBeGreaterThan(2);});
});
