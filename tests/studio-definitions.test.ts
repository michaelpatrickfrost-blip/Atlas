import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Session } from "@/core/auth/session";
const mocks = vi.hoisted(() => ({ findFirst: vi.fn(), findMany: vi.fn(), updateMany: vi.fn(), transaction: vi.fn(), moduleGate: vi.fn() }));
vi.mock("@/core/db/client", () => ({ db: { studioDefinition: { findFirst:mocks.findFirst, findMany:mocks.findMany }, studioDraft: { findFirst:mocks.findFirst, updateMany:mocks.updateMany }, studioDefinitionVersion: { findFirst:mocks.findFirst, findMany:mocks.findMany }, $transaction:mocks.transaction } }));
vi.mock("@/core/modules/access", () => ({ assertModuleEnabled:mocks.moduleGate }));
vi.mock("@/core/studio/registry/runtime", () => ({ studioRegistry: () => ({ resolve:vi.fn() }) }));
import { activeDefinition, createDraft, getDefinition, listDefinitions, publishDraft, updateDraft, activateVersion, validateDraft } from "@/core/studio/definitions/service";
const id = "cb95de8f-3183-46d5-9e01-f101e0ead6f7";
const s: Session = { organisationId:"tenant-a",organisationName:"A",userId:"u",userName:"U",userEmail:"u@example.invalid",membershipId:"m",capabilities:new Set(["studio.definition.read","studio.definition.edit","studio.definition.publish"]) };
beforeEach(()=>{vi.clearAllMocks();mocks.moduleGate.mockResolvedValue(undefined);mocks.findFirst.mockResolvedValue(null);mocks.findMany.mockResolvedValue([]);});
describe("Studio metadata security and draft concurrency",()=>{
  it("denies each operation before touching records when its capability is missing",async()=>{
    const denied={...s,capabilities:new Set<string>()};
    for(const operation of [()=>createDraft(denied,{}),()=>updateDraft(denied,{}),()=>publishDraft(denied,{}),()=>activateVersion(denied,{}),()=>getDefinition(denied,id),()=>listDefinitions(denied),()=>validateDraft(denied,id,0),()=>activeDefinition(denied,id)]) await expect(operation()).rejects.toThrow("FORBIDDEN");
    expect(mocks.findFirst).not.toHaveBeenCalled();expect(mocks.transaction).not.toHaveBeenCalled();
  });
  it("queries only the resolved tenant and blocks foreign definition IDs",async()=>{
    expect(await getDefinition(s,id)).toBeNull();
    expect(mocks.findFirst.mock.calls[0][0].where).toEqual({id,organisationId:"tenant-a"});
    await expect(createDraft(s,{key:"x",name:"X",kind:"capabilitySet",organisationId:"tenant-b",payload:{schemaVersion:1,description:"",references:[]}})).rejects.toThrow();
    expect(mocks.transaction).not.toHaveBeenCalled();
  });
  it("does not grant publication merely from draft edit permission",async()=>{
    await expect(publishDraft({...s,capabilities:new Set(["studio.definition.edit"])},{definitionId:id,revision:0,acknowledgeWarnings:false})).rejects.toThrow("FORBIDDEN");
  });
  it("reports optimistic conflict before audit when the submitted draft revision lost",async()=>{
    const updateMany=vi.fn().mockResolvedValue({count:0});
    const audit=vi.fn();mocks.transaction.mockImplementation(async cb=>cb({studioDraft:{updateMany},auditEntry:{create:audit}}));
    await expect(updateDraft(s,{definitionId:id,revision:3,payload:{schemaVersion:1,description:"",references:[]}})).rejects.toThrow("CONFLICT");
    expect(updateMany.mock.calls[0][0].where).toMatchObject({organisationId:"tenant-a",revision:3});
    expect(audit).not.toHaveBeenCalled();
  });
  it("requires module access independently of permission strings",async()=>{
    mocks.moduleGate.mockRejectedValue(new Error("disabled"));
    await expect(listDefinitions(s)).rejects.toThrow("disabled");expect(mocks.findMany).not.toHaveBeenCalled();
  });
});
