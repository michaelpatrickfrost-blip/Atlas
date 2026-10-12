import { describe, expect, it } from "vitest";
import { checksum } from "@/core/studio/registry/contracts";
import { compilePage } from "@/core/studio/pages/compiler";
import { pagePayloadSchema, type PagePayload, type PageComponent } from "@/core/studio/pages/schema";
import type { PageApprovals } from "@/core/studio/pages/approvals";
import { pageSourcePolicySchema } from "@/core/studio/pages/owner-contract";
import { createPageDisplayModel } from "@/core/studio/pages/render-model";
import { createDesignPageDisplayModel } from "@/core/studio/pages/design-model";
import { resolvePageVariant } from "@/core/studio/pages/selection";
import { authoredPageViewPins } from "@/core/studio/pages/definition-compiler";
import { isAppendOnlyPageSourceExtension } from "@/core/studio/pages/source-compatibility";
import { configurationReferenceSchema } from "@/core/studio/record-types/schema";
import { normaliseConfigurationDependencyReferences } from "@/core/studio/configuration/dependency-reference";

// Pure trusted approval fixtures establish no user/storage/SQL/runtime authority.
const id = (n: number) => `10000000-0000-4000-8000-${String(n).padStart(12,"0")}`;
const hash = "a".repeat(64), ref = (id:string) => ({id,version:1,schemaHash:hash,contractHash:"b".repeat(64)});
const entity = {...ref("sales.order"),ownerModuleId:"sales",kind:"entity" as const,classification:"confidential" as const,capability:"sales.order.read"};
const page = {...entity,...ref("sales.order.page"),kind:"surface" as const};
const source = {...ref("analytics.dashboard.view"),ownerModuleId:"analytics",kind:"surface" as const,classification:"confidential" as const,capability:"analytics.dashboard.read"};
const pin = {kind:"view" as const,definitionId:id(1),versionId:id(2),schemaVersion:1 as const,checksum:hash};
const forms:PagePayload["formFactors"] = ["desktop","tablet","phone"];
const embed:PageComponent={id:"dashboard",type:"analyticsView",view:pin,formFactors:forms};
const guidance:PageComponent={id:"guide",type:"instructions",text:"Your business",formFactors:forms};
const payload=(components:PageComponent[]=[guidance,embed]):PagePayload=>({schemaVersion:1,entity:ref(entity.id),formFactors:forms,variants:[],sections:[{id:"main",label:"Sales order",help:"",formFactors:forms,columns:{desktop:2,tablet:2,phone:1},components}]});
const dependency={...ref(source.id),ownerModuleId:source.ownerModuleId,kind:source.kind,classification:source.classification};
const approvals=():PageApprovals=>({entity,sourcePage:page,variants:true,fieldSourceVersions:[],nativeFields:[],customFields:[],facts:[],contracts:[],queries:[],commands:[],metrics:[],surfaces:[],maxQueryCost:64,
 embeddedViews:[{reference:pin,sourceView:source,dependencies:[dependency],queryCost:16,queryCount:2}]});
const context=(grants=[entity.capability,source.capability])=>({capabilities:new Set(grants),recordTypeDefinitionId:null,facts:new Map()});
const policy=()=>pageSourcePolicySchema.parse({schemaVersion:1,entity:{id:entity.id,version:1},accessMode:"ordinary_read",variants:true,nativeFields:[],queries:[],facts:[],commands:[],metrics:[],surfaces:[],maxQueryCost:64});

describe("immutable Page analytics composition",()=>{
 it("retains exact absent legacy payload/approvals/layout shape and deterministic seal",()=>{
  const a=approvals();delete a.embeddedViews;const plan=compilePage(payload([guidance]),a);
  expect(plan.base).not.toHaveProperty("queryCount");expect(plan.approvals).not.toHaveProperty("embeddedViews");
  expect(plan.configurationDependencies).toEqual([]);expect(checksum(plan)).toBe("3cbe1daf01cf9e1e5acf8014c22cea6761bfe3fa72cd1b63653eb9291f6ab1c1");
  expect(pageSourcePolicySchema.parse(policy())).not.toHaveProperty("embeddedViewSources");
 });
 it("pins exact immutable View, current source descriptor and descriptor-based cost without native query input",()=>{
  const plan=compilePage(payload(),approvals());expect(plan.configurationDependencies).toEqual([pin]);
  expect(plan.base).toMatchObject({queryCost:16,queryCount:2});expect(plan.base.reads[1]).toEqual({componentId:"dashboard",queries:[]});
  expect(plan.dependencies.find(value=>value.id===source.id)).toEqual(dependency);
  expect(plan.approvals.embeddedViews?.[0].reference).toEqual(pin);
  expect(()=>pagePayloadSchema.parse(payload([{...embed,query:ref("sales.private.read")} as unknown as PageComponent]))).toThrow();
  expect(configurationReferenceSchema.safeParse(pin).success).toBe(false);
 });
 it.each(["pin","source","owner","unknown","cost","count"])("rejects forged %s metadata",mode=>{
  const a=approvals();const view=a.embeddedViews![0];
  if(mode==="pin")view.reference={...pin,checksum:"c".repeat(64)};
  if(mode==="source")view.dependencies=[];
  if(mode==="owner")view.dependencies=[{...dependency,ownerModuleId:"sales"}];
  if(mode==="unknown")a.embeddedViews=[];
  if(mode==="cost")view.queryCost=0;
  if(mode==="count")view.queryCount=9;
  expect(()=>compilePage(payload(),a)).toThrow();
 });
 it("budgets each materialised layout, including repeats and hidden views, without changing legacy request limits",()=>{
  const a=approvals();a.embeddedViews![0].queryCount=8;a.embeddedViews![0].queryCost=64;
  expect(compilePage(payload(),a).base.queryCost).toBe(64);
  expect(()=>compilePage(payload([guidance,embed,{...embed,id:"another"}]),a)).toThrow(/budget/);
  a.embeddedViews![0].queryCost=8;
  const four=Array.from({length:4},(_,i)=>({...embed,id:`view_${i}`}));expect(compilePage(payload(four),a).base.queryCount).toBe(32);
  expect(()=>compilePage(payload([...four,{...embed,id:"fifth"}]),a)).toThrow(/request budget/);
  const input=payload();input.variants=[{id:"extra",label:"Extra",priority:1,when:{kind:"capabilities",mode:"all",capabilities:["sales.order.read"]},patches:[{operation:"addComponent",sectionId:"main",afterComponentId:"dashboard",component:{...embed,id:"second"}}]}];
  a.embeddedViews![0].queryCost=64;expect(()=>compilePage(input,a)).toThrow(/budget/);
 });
 it("loads no hidden/unpermitted/form-factor view and yields no author permissions to the display",()=>{
  const plan=compilePage(payload([{...embed,visibleWhen:{kind:"capabilities",mode:"all",capabilities:["sales.private.read"]}},guidance]),approvals());
  const selected=resolvePageVariant(plan,context(),"phone");expect(selected.sections[0].components.map(value=>value.id)).toEqual(["guide"]);
  const open=compilePage(payload(),approvals());expect(resolvePageVariant(open,context([entity.capability]),"phone").sections[0].components.map(value=>value.id)).toEqual(["guide"]);
  const output={view:pin,sourceView:ref(source.id),content:{name:"Saved overview"},dataByWidget:{orders:[{label:"DRAFT",value:0}]}};
  const model=createPageDisplayModel(open,resolvePageVariant(open,context(),"phone"),"phone",new Map(),new Map(),new Map(),new Map(),new Map(),new Map([[embed.id,output]]));
  expect(model.sections[0].columns).toBe(1);expect(model.sections[0].components[1]).toMatchObject({type:"analyticsView",output});expect(JSON.stringify(model)).not.toContain("capability");
  const sample=createDesignPageDisplayModel(payload(),{nativeFields:[],customFields:[],facts:[],queries:[],actions:[],metrics:[],surfaces:[]},"phone");
  expect(sample.sections[0].components[1]).toMatchObject({type:"analyticsView",output:null});
 });
 it("collects shallow variant pins, exact repeats share one dependency, competing versions/UUID reuse/cycles fail",()=>{
  const input=payload();input.variants=[{id:"special",label:"Special",priority:1,when:{kind:"capabilities",mode:"all",capabilities:[entity.capability]},patches:[{operation:"addComponent",sectionId:"main",afterComponentId:"dashboard",component:{...embed,id:"another"}}]}];
  expect(authoredPageViewPins(input)).toEqual([pin]);expect(normaliseConfigurationDependencyReferences([pin,pin])).toEqual([pin]);
  expect(()=>normaliseConfigurationDependencyReferences([pin,{...pin,versionId:id(4)}])).toThrow("Conflicting");
  expect(()=>normaliseConfigurationDependencyReferences([pin,{...pin,definitionId:id(4)}])).toThrow("Conflicting");
  expect(()=>normaliseConfigurationDependencyReferences([pin],pin.definitionId)).toThrow("cycle");
  input.variants[0].patches=[{operation:"addComponent",sectionId:"main",afterComponentId:"dashboard",component:{...embed,id:"another",view:{...pin,versionId:id(4)}}}];
  expect(()=>authoredPageViewPins(input)).toThrow("competing");
 });
 it("allows only appended owner View opt-ins and retains exact old policy hash/absence",()=>{
  const old=policy(),next={...old,embeddedViewSources:[{id:source.id,version:1}]};expect(isAppendOnlyPageSourceExtension(old,next)).toBe(true);
  expect(checksum(old)).toBe(checksum(pageSourcePolicySchema.parse(old)));expect(isAppendOnlyPageSourceExtension(next,old)).toBe(false);
  expect(isAppendOnlyPageSourceExtension(next,{...next,embeddedViewSources:[{id:source.id,version:2}]})).toBe(false);
  expect(isAppendOnlyPageSourceExtension({...old,embeddedViewSources:[]},old)).toBe(false);
  expect(isAppendOnlyPageSourceExtension(next,{...next,entity:{id:"other.entity",version:1}})).toBe(false);
 });
});
