import {beforeEach,expect,it,vi}from"vitest";
import type{Session}from"@/core/auth/session";
import type{Prisma}from"@/generated/prisma/client";
import{checksum}from"@/core/studio/registry/contracts";
import{inspectConfigurationGraph,inspectConfigurationPin,loadSealedConfigurationVersion,type SealedConfigurationVersion}from"@/core/studio/configuration/pins";
import{whereUsedConfigurationInTransaction,assertNoActiveConfigurationDependantsInTransaction}from"@/core/studio/configuration/usage";
import type{ConfigurationDependencyReference}from"@/core/studio/configuration/dependency-reference";
// Exact generic seals/impact algorithm with bounded metadata rows; no SQL FK,
// trigger/rollback/application or complete owning View compiler proof here.
const id=(n:number)=>`80000000-0000-4000-8000-${String(n).padStart(12,"0")}`;
const session={organisationId:"a"}as Session,find=vi.fn(),definition=vi.fn(),incoming=vi.fn();
const tx={studioDefinitionVersion:{findFirst:find},studioDefinition:{findFirst:definition},studioConfigurationDependency:{findMany:incoming}}as unknown as Prisma.TransactionClient;
function version(n:number,kind:"page"|"view"|"entityProfile",deps:ConfigurationDependencyReference[]=[]){
 const payload={description:`Design${n}`},plan={kind,schemaVersion:1,payload,configurationDependencies:deps};
 const reference={kind,definitionId:id(n),versionId:id(n+100),schemaVersion:1,checksum:checksum(plan)}as ConfigurationDependencyReference;
 const row:SealedConfigurationVersion={id:reference.versionId,definitionId:reference.definitionId,organisationId:"a",schemaVersion:1,checksum:reference.checksum,payload,compiledPlan:plan,definition:{kind,retiredAt:null},configurationDependencies:deps.map(pin=>({organisationId:"a",definitionId:reference.definitionId,versionId:reference.versionId,targetDefinitionId:pin.definitionId,targetVersionId:pin.versionId,targetKind:pin.kind,targetSchemaVersion:pin.schemaVersion,targetChecksum:pin.checksum}))};
 return{reference,row};
}
beforeEach(()=>vi.resetAllMocks());
it("loads an exact tenant immutable View leaf through a Page edge, never a current head",async()=>{
 const leaf=version(1,"view"),page=version(2,"page",[leaf.reference]);find.mockImplementation(async({where})=>[leaf,page].find(item=>item.row.id===where.id)?.row??null);
 expect((await inspectConfigurationGraph(session,tx,[page.reference],id(90))).size).toBe(2);
 expect(find.mock.calls.map(([arg])=>arg.where)).toEqual([{id:page.reference.versionId,definitionId:page.reference.definitionId,organisationId:"a"},{id:leaf.reference.versionId,definitionId:leaf.reference.definitionId,organisationId:"a"}]);
 expect(inspectConfigurationPin("a",page.reference,page.row).configurationDependencies).toEqual([leaf.reference]);
});
it.each(["tenant","version","checksum","kind","missing","duplicate","retired"])("rejects %s View pin/edge drift",async mode=>{
 const leaf=version(1,"view"),page=version(2,"page",[leaf.reference]);find.mockImplementation(async({where})=>[leaf,page].find(item=>item.row.id===where.id)?.row??null);
 if(mode==="tenant")leaf.row.organisationId="b";if(mode==="version")leaf.row.id=id(99);if(mode==="checksum")page.row.configurationDependencies[0].targetChecksum="f".repeat(64);
 if(mode==="kind")page.row.configurationDependencies[0].targetKind="page";if(mode==="missing")page.row.configurationDependencies=[];if(mode==="duplicate")page.row.configurationDependencies.push({...page.row.configurationDependencies[0]});if(mode==="retired")leaf.row.definition.retiredAt=new Date();
 await expect(inspectConfigurationGraph(session,tx,[page.reference],id(90))).rejects.toThrow();
});
it("retained impact follows exact Page→View edge and blocks View retirement while the Page is active",async()=>{
 const view=version(1,"view"),page=version(2,"page",[view.reference]);
 const extended=(item:typeof view)=>({...item.row,definition:{...item.row.definition,id:item.row.definitionId,organisationId:"a",name:`Design${item.reference.definitionId}`,activeVersionId:item.row.id,activeVersion:{id:item.row.id,definitionId:item.row.definitionId,organisationId:"a"}}});
 const v=extended(view),p=extended(page);definition.mockResolvedValue(v.definition);find.mockImplementation(async({where})=>where.id===v.id?v:where.id===p.id?p:null);
 incoming.mockImplementation(async({where})=>where.targetDefinitionId===v.definitionId?p.configurationDependencies:[]);
 expect(await whereUsedConfigurationInTransaction(session,tx,{definitionId:v.definitionId,versionId:v.id})).toMatchObject({usages:[{kind:"page",active:true,definitionId:p.definitionId,depth:1}]});
 await expect(assertNoActiveConfigurationDependantsInTransaction(session,tx,{definitionId:v.definitionId})).rejects.toThrow("CONFIGURATION_IN_USE");
 v.definition.retiredAt=new Date();expect((await whereUsedConfigurationInTransaction(session,tx,{definitionId:v.definitionId,versionId:v.id})).usages).toHaveLength(1);
 await expect(loadSealedConfigurationVersion(session,tx,view.reference)).rejects.toThrow("DEPENDENCY_BROKEN");
});
