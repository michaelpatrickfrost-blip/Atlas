import { beforeEach, expect, it, vi } from "vitest";
import type { Session, SessionAuthorityStamp } from "@/core/auth/session";
import type { Prisma } from "@/generated/prisma/client";
import type { FieldRuntimeAuthority } from "@/core/studio/fields/runtime-authority";
import { CapabilityRegistry } from "@/core/studio/registry/registry";
import { checksum, entity, query, declarative } from "@/core/studio/registry/contracts";
import { pageSource } from "@/core/studio/registry/page-contracts";
import { compileRegisteredView } from "@/core/studio/views/definition-compiler";
import { analyticsBusinessViewContract } from "@/modules/analytics/services/studio-view";
import { salesAnalyticsStudioContract } from "@/modules/sales/services/studio-analytics";
import { productsAnalyticsStudioContract } from "@/modules/products/services/studio-analytics";
import { businessViewCreateSchema } from "@/modules/analytics/services/business-view-contract";
import { reconstructPageApprovalsInTransaction } from "@/core/studio/pages/server-approvals";
import { compilePage } from "@/core/studio/pages/compiler";
import { readPublishedPageInTransaction } from "@/core/studio/pages/runtime";
import type { PageComponent } from "@/core/studio/pages/schema";
import * as compiledCache from "@/core/studio/pages/compiled-cache";
import { z } from "zod";
import { pageProjectionSchema, pageQueryOutputSchema } from "@/core/studio/pages/owner-contract";
import type { PageSourcePolicy } from "@/core/studio/pages/owner-contract";
const m=vi.hoisted(()=>({stamp:vi.fn(),bridge:vi.fn(),version:vi.fn(),provider:vi.fn(),native:vi.fn(),pageQuery:vi.fn()}));
vi.mock("@/core/auth/session",()=>({sessionAuthorityStamp:m.stamp,sessionForUser:vi.fn()}));
vi.mock("@/core/db/client",()=>({db:{}}));
vi.mock("@/core/modules/runtime",()=>({getEnabledModuleIds:vi.fn(),enabledModulesForSession:vi.fn()}));
vi.mock("@/core/studio/fields/runtime-authority",()=>({fieldRuntimeAuthorityInTransaction:m.bridge,withFieldRuntimeAuthority:vi.fn()}));
// Real registry, owner compiler/seal/approval reconstruction/runtime. Principal
// issuance/current refresh, owning canonical anchor and SQL/provider rows are
// explicit bounded fixtures, not real transactions/private records/SSI evidence.
const id=(n:number)=>`90000000-0000-4000-8000-${String(n).padStart(12,"0")}`;
const stamp:SessionAuthorityStamp={organisationId:"a",userId:"actor",membershipId:"member",authVersion:1,sessionVersion:1};
const tx={studioDefinitionVersion:{findFirst:m.version}} as unknown as Prisma.TransactionClient;
const exact=({id,version,schemaHash,contractHash}:{id:string;version:number;schemaHash:string;contractHash:string})=>({id,version,schemaHash,contractHash});
let registry:CapabilityRegistry,authority:FieldRuntimeAuthority,fresh:Session,enabled:Set<string>,issued:WeakMap<Session,SessionAuthorityStamp>;
let viewRow:ReturnType<typeof row>,pageRow:ReturnType<typeof row>,request:object;
function row(def:number,ver:number,kind:"page"|"view",payload:unknown,plan:object){return{id:id(ver),definitionId:id(def),organisationId:"a",schemaVersion:1,payload,compiledPlan:plan,checksum:checksum(plan),definition:{kind,retiredAt:null as Date|null},configurationDependencies:[] as {organisationId:string;definitionId:string;versionId:string;targetDefinitionId:string;targetVersionId:string;targetKind:string;targetSchemaVersion:number;targetChecksum:string}[]};}
async function configure(hidden=false,mixed=false,includeEmbed=true){
 const owner=registry.describe("analytics.dashboard.view",1),sourceView=exact(owner),content=businessViewCreateSchema.parse({name:"Business overview",widgets:[{id:"orders",metricId:"sales.orders",visual:"bar",wide:false},{id:"products",metricId:"products.catalogue",visual:"kpi",wide:false}]});
 const saved=await compileRegisteredView(authority,{schemaVersion:1,sourceView,content});viewRow=row(1,2,"view",saved.payload,saved.plan);
 const pin={kind:"view" as const,definitionId:id(1),versionId:id(2),schemaVersion:1 as const,checksum:viewRow.checksum};
 m.version.mockImplementation(async({where})=>where.id===viewRow.id?viewRow:where.id===pageRow?.id?pageRow:null);
 const pageRef=exact(registry.describe("example.order.page",1));
 const approvals=await reconstructPageApprovalsInTransaction(authority,{sourcePage:pageRef,embeddedViews:[pin]});
 const components:PageComponent[]=[{id:"guide",type:"instructions",text:"Your business",formFactors:["desktop","tablet","phone"]}];
 if(mixed)components.unshift({id:"native_total",type:"metric",metric:exact(registry.describe("example.order.total",1)),formFactors:["desktop","tablet","phone"]});
 if(includeEmbed)components.push({id:"overview",type:"analyticsView",view:pin,formFactors:["desktop","tablet","phone"],...(hidden?{visibleWhen:{kind:"capabilities"as const,mode:"all"as const,capabilities:["example.private.read"]}}:mixed?{visibleWhen:{kind:"fact"as const,factId:"show_overview",operator:"equals"as const,values:[true]}}:{})});
 const plan=compilePage({schemaVersion:1,entity:exact(registry.describe("example.order",1)),formFactors:["desktop","tablet","phone"],sections:[{id:"main",label:"Business",help:"",columns:{desktop:2,tablet:2,phone:1},formFactors:["desktop","tablet","phone"],components}],variants:[]},approvals);
 pageRow=row(3,4,"page",plan.payload,plan);pageRow.configurationDependencies=includeEmbed?[{organisationId:"a",definitionId:pageRow.definitionId,versionId:pageRow.id,targetDefinitionId:pin.definitionId,targetVersionId:pin.versionId,targetKind:pin.kind,targetSchemaVersion:1,targetChecksum:pin.checksum}]:[];
 request={page:{kind:"page",definitionId:id(3),versionId:id(4),schemaVersion:1,checksum:pageRow.checksum},request:{kind:"record",recordId:"actual-order"},formFactor:"phone",cursors:{}};
}
beforeEach(async()=>{
 vi.clearAllMocks();const session:Session={userId:"actor",membershipId:"member",organisationId:"a",userName:"Actor",userEmail:"actor@example.test",organisationName:"A",capabilities:new Set(["example.order.read","analytics.dashboard.read","analytics.dashboard.manage","sales.order.read","core.products.read"])};
 fresh={...session,capabilities:new Set(session.capabilities)};issued=new WeakMap([[session,stamp],[fresh,stamp]]);m.stamp.mockImplementation(value=>issued.get(value));enabled=new Set(["example","analytics","sales","products"]);
 registry=new CapabilityRegistry(async(session,module)=>session.organisationId==="a"&&enabled.has(module));registry.register("analytics",analyticsBusinessViewContract);
 for(const[owner,bundle]of [["sales",salesAnalyticsStudioContract],["products",productsAnalyticsStudioContract]]as const)registry.register(owner,{contributions:bundle.contributions.map(item=>item.metadata.kind==="query"?{...item,run:async()=>{m.provider(item.metadata.id);return[{label:owner==="sales"?"DRAFT":"PRODUCT",value:0}];}}:item)});
 const base={version:1,label:"Order",capability:"example.order.read",lifecycle:"active"as const,classification:"confidential"as const};
 const flagColumns=[{id:"show_overview",valueType:"boolean"as const,nullable:false,classification:"confidential"as const}],amountColumns=[{id:"amount",valueType:"number"as const,nullable:false,classification:"confidential"as const}];
 const flagQuery={id:"example.order.flags",version:1},amountQuery={id:"example.order.amount",version:1};
 const policy:PageSourcePolicy={schemaVersion:1,entity:{id:"example.order",version:1},accessMode:"ordinary_read",variants:false,fieldSourceVersions:[],nativeFields:[],queries:[{query:flagQuery,scope:"record",purpose:"fact",columns:flagColumns},{query:amountQuery,scope:"record",purpose:"metric",columns:amountColumns}],facts:[{id:"show_overview",contract:{id:"example.order",version:1},query:flagQuery,columnId:"show_overview",valueType:"boolean",nullable:false,classification:"confidential",provenance:"owner_projection"}],commands:[],metrics:[{metric:{id:"example.order.total",version:1},query:amountQuery,formFactors:["desktop","tablet","phone"]}],surfaces:[],embeddedViewSources:[{id:"analytics.dashboard.view",version:1}],maxQueryCost:64};
 registry.register("example",{contributions:[entity({...base,id:"example.order",kind:"entity",key:"string",fields:[],extensionPolicy:{customFields:false,recordTypes:false,pageVariants:false}}),...[{ref:flagQuery,columns:flagColumns,cost:"low"as const},{ref:amountQuery,columns:amountColumns,cost:"medium"as const}].map(({ref,columns,cost})=>query({...base,...ref,kind:"query",transaction:"required",pagination:"none",maxCardinality:1,costClass:cost,input:z.strictObject({recordId:z.string()}),output:pageProjectionSchema(columns,1),async execute(_ctx,input){m.pageQuery(ref.id,input);const values:Record<string,number|boolean>=ref.id===flagQuery.id?{show_overview:true}:{amount:0};return{rows:[{id:input.recordId,values}],nextCursor:null};}})),declarative({...base,id:"example.order.total",kind:"metric",schema:z.strictObject({}),references:[]}),pageSource({...base,id:"example.order.page",policy,callbacks:{async authoriseRead(ctx,input){m.native();if(input.kind!=="record")throw Error("record only");return{kind:"record",organisationId:ctx.session.organisationId,recordId:input.recordId,revision:"actual:4"};},async bindQueryInput(_ctx,anchor){if(anchor.kind!=="record")throw Error("record only");return{recordId:anchor.recordId};},async projectQueryOutput(_ctx,_anchor,_request,output){return pageQueryOutputSchema.parse(output);}}})]});
 authority={session,stamp,transaction:tx,registry};m.bridge.mockImplementation(async(value,transaction)=>{if(!issued.has(value)||!issued.has(fresh)||stamp.userId!==fresh.userId||stamp.organisationId!==fresh.organisationId)throw Error("FORBIDDEN: genuine current authority");return{session:fresh,stamp,transaction,registry};});
 await configure();fresh.capabilities.delete("analytics.dashboard.manage");
});
it("reads the actual immutable View and zero points with no authoring grant, active-head lookup or writes",async()=>{
 const model=await readPublishedPageInTransaction(authority,request);expect(model.sections[0].columns).toBe(1);expect(model.sections[0].components[1]).toMatchObject({type:"analyticsView",output:{view:{versionId:id(2)},sourceView:{id:"analytics.dashboard.view"},dataByWidget:{orders:[{value:0}],products:[{value:0}]}}});
 expect(m.provider).toHaveBeenCalledTimes(2);expect(m.version.mock.calls.every(([arg])=>arg.where.organisationId==="a"&&arg.where.definitionId&&arg.where.id)).toBe(true);
 expect(JSON.stringify(model)).not.toContain("capability");expect(JSON.stringify(model)).not.toContain("condition");
});
it.each(["analytics.dashboard.read","sales.order.read","core.products.read"])("revoked current %s prevents EVERY visible provider",async grant=>{
 fresh.capabilities.delete(grant);await expect(readPublishedPageInTransaction(authority,request)).rejects.toThrow("FORBIDDEN");expect(m.provider).not.toHaveBeenCalled();
});
it.each(["analytics","sales","products"])("disabled current %s module fails before providers",async module=>{
 enabled.delete(module);await expect(readPublishedPageInTransaction(authority,request)).rejects.toThrow("DEPENDENCY_BROKEN");expect(m.provider).not.toHaveBeenCalled();
});
it("hidden view reconstruction requires valid immutable metadata but no unused native data rights/providers",async()=>{
 fresh.capabilities.add("analytics.dashboard.manage");await configure(true);fresh.capabilities.delete("sales.order.read");fresh.capabilities.delete("core.products.read");
 expect((await readPublishedPageInTransaction(authority,request)).sections[0].components.map(value=>value.type)).toEqual(["instructions"]);expect(m.provider).not.toHaveBeenCalled();
 viewRow.checksum="f".repeat(64);await expect(readPublishedPageInTransaction(authority,request)).rejects.toThrow("DEPENDENCY_BROKEN");
});
it.each(["forged","revoked","foreign","payload","checksum","retired","edge","stale"])("denies %s before providers",async mode=>{
 if(mode==="forged")authority.session={...authority.session};if(mode==="revoked")issued.delete(fresh);if(mode==="foreign")viewRow.organisationId="other";
 if(mode==="payload")viewRow.payload={bad:true};if(mode==="checksum")viewRow.checksum="f".repeat(64);if(mode==="retired")viewRow.definition.retiredAt=new Date();if(mode==="edge")pageRow.configurationDependencies[0].targetChecksum="f".repeat(64);if(mode==="stale")fresh.userId="other";
 await expect(readPublishedPageInTransaction(authority,request)).rejects.toThrow();expect(m.provider).not.toHaveBeenCalled();
});
it("unapproved cross-owner source fails metadata compilation before native data",async()=>{
 const policy=registry.describe("example.order.page",1).details.pageSource as PageSourcePolicy;expect(policy.embeddedViewSources).toHaveLength(1);
 const {reconstructEmbeddedViewApproval}=await import("@/core/studio/pages/embedded-views");
 await expect(reconstructEmbeddedViewApproval(authority,{kind:"view",definitionId:id(1),versionId:id(2),schemaVersion:1,checksum:viewRow.checksum},{...policy,embeddedViewSources:[]})).rejects.toThrow("DEPENDENCY_BROKEN");expect(m.provider).not.toHaveBeenCalled();
});
it("preflights the complete visible set before the first provider and refuses frozen cost drift",async()=>{
 const {prepareVisibleEmbeddedViews,readPreparedEmbeddedViews}=await import("@/core/studio/pages/embedded-views");
 const plan=pageRow.compiledPlan as ReturnType<typeof compilePage>,component=plan.payload.sections[0].components[1];
 const saved=plan.approvals.embeddedViews![0];
 await expect(prepareVisibleEmbeddedViews(authority,[component],{...plan.approvals,embeddedViews:[{...saved,queryCost:saved.queryCost-1}]})).rejects.toThrow("DEPENDENCY_BROKEN");
 expect(m.provider).not.toHaveBeenCalled();m.bridge.mockImplementationOnce(async()=>({session:fresh,stamp,transaction:tx,registry})).mockRejectedValueOnce(Error("FORBIDDEN: second view current grant"));
 await expect(prepareVisibleEmbeddedViews(authority,[component,{...component,id:"second"}],plan.approvals)).rejects.toThrow("FORBIDDEN");expect(m.provider).not.toHaveBeenCalled();
 // A provider failure propagates; this API cannot fall back to an active head,
 // unauthorised source or fabricated value.
 m.bridge.mockImplementation(async()=>({session:fresh,stamp,transaction:tx,registry}));
 const prepared=await prepareVisibleEmbeddedViews(authority,[component],plan.approvals);m.provider.mockImplementationOnce(()=>{throw Error("native source failed");});
 await expect(readPreparedEmbeddedViews(authority,prepared.prepared)).rejects.toThrow("native source failed");
});
it.each(["missing","query","future"])("rejects %s cross-owner View opt-in at registration",mode=>{
 const policy=registry.describe("example.order.page",1).details.pageSource as PageSourcePolicy;
 const source=mode==="missing"?{id:"analytics.missing.view",version:1}:mode==="query"?{id:"sales.orders.metric.read",version:1}:{id:"analytics.dashboard.view",version:2};
 const contribution=pageSource({id:"example.order.other_page",version:1,label:"Order",capability:"example.order.read",lifecycle:"active",classification:"confidential",policy:{...policy,embeddedViewSources:[source]},callbacks:{authoriseRead:m.native,bindQueryInput:m.native,projectQueryOutput:m.native}});
 expect(()=>registry.register("example",{contributions:[contribution]})).toThrow("registered owning View source");expect(m.provider).not.toHaveBeenCalled();
});
it("staged Page facts select an embed; reserve remaining native metric plus visible View BEFORE nested providers",async()=>{
 fresh.capabilities.add("analytics.dashboard.manage");await configure(false,true);fresh.capabilities.delete("analytics.dashboard.manage");
 const model=await readPublishedPageInTransaction(authority,request);
 expect(m.pageQuery.mock.calls.map(([id])=>id)).toEqual(["example.order.flags","example.order.amount"]);
 expect(m.pageQuery.mock.invocationCallOrder[0]).toBeLessThan(m.provider.mock.invocationCallOrder[0]);
 expect(m.provider.mock.invocationCallOrder[1]).toBeLessThan(m.pageQuery.mock.invocationCallOrder[1]);
 expect(model.sections[0].components.find(value=>value.id==="native_total")).toMatchObject({type:"metric",cells:[{text:"0"}]});
 expect(model.sections[0].components.find(value=>value.id==="overview")).toMatchObject({type:"analyticsView",output:{dataByWidget:{orders:[{value:0}]}}});
 // Explicit invalid cached-plan collaborator tests the runtime defense. A normal
 // immutable compiler refuses this under-budget shape before publication.
 const plan=structuredClone(pageRow.compiledPlan)as ReturnType<typeof compilePage>;
 expect(plan.base.queryCost).toBe(20);plan.approvals.maxQueryCost=19;
 const cache=vi.spyOn(compiledCache,"getCompiledPage").mockReturnValue(plan);
 m.pageQuery.mockClear();m.provider.mockClear();try{
  await expect(readPublishedPageInTransaction(authority,request)).rejects.toThrow("Page read budget exceeded");
  expect(m.pageQuery.mock.calls.map(([id])=>id)).toEqual(["example.order.flags"]);expect(m.provider).not.toHaveBeenCalled();
 }finally{cache.mockRestore();}
});
it("owner opt-in alone imposes NO unused Analytics Read/module on a native-only layout",async()=>{
 fresh.capabilities.add("analytics.dashboard.manage");await configure(false,true,false);
 for(const grant of ["analytics.dashboard.manage","analytics.dashboard.read","sales.order.read","core.products.read"]){fresh.capabilities.delete(grant);authority.session.capabilities.delete(grant);}
 for(const moduleId of ["analytics","sales","products"])enabled.delete(moduleId);
 const plan=pageRow.compiledPlan as ReturnType<typeof compilePage>;expect(plan.approvals).not.toHaveProperty("embeddedViews");expect(plan.configurationDependencies).toEqual([]);
 m.version.mockClear();const model=await readPublishedPageInTransaction(authority,request);
 expect(model.sections[0].components.map(value=>value.type)).toEqual(["metric","instructions"]);
 expect(m.version.mock.calls.every(([arg])=>arg.where.id===pageRow.id)).toBe(true);expect(m.provider).not.toHaveBeenCalled();expect(m.pageQuery.mock.calls.map(([id])=>id)).toEqual(["example.order.amount"]);
});
