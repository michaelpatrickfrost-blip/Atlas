import { describe, expect, it, vi } from "vitest";
import { z } from "zod";
import type { PrismaClient } from "@/generated/prisma/client";
import { query } from "@/core/studio/registry/contracts";
import { CapabilityRegistry } from "@/core/studio/registry/registry";
import { scanActiveStudioDependencies } from "@/core/studio/registry/compatibility";
function registry() {
  const value=new CapabilityRegistry(async()=>true);
  value.register("sales",{contributions:[query({id:"sales.order.get",version:1,label:"Order",capability:"sales.order.read",lifecycle:"active",classification:"confidential",kind:"query",input:z.strictObject({}),output:z.string(),pagination:"none",maxCardinality:1,costClass:"low",async execute(){return "order";}})]});
  return value;
}
const tenant = (isTest = false, status = "ACTIVE") => ({ definition: { organisation: { isTest, status } } });
describe("Studio release dependency scan",()=>{
  it("scans only active definitions in bounded batches and detects missing and changed contracts",async()=>{
    const registered=registry(),m=registered.describe("sales.order.get",1);
    const row={id:"row-1",definitionId:"definition-a",contractId:m.id,contractVersion:1,schemaHash:m.schemaHash,contractHash:m.contractHash,version:tenant()};
    const findMany=vi.fn().mockResolvedValueOnce([row,{...row,id:"row-2",contractId:"sales.removed.get"},{...row,id:"row-3",schemaHash:"0".repeat(64)}]).mockResolvedValueOnce([]);
    const client={studioDependency:{findMany}} as unknown as PrismaClient;
    const issues=await scanActiveStudioDependencies(client,registered);
    expect(issues).toHaveLength(2);expect(issues.every(issue=>issue.startsWith("definition-a:"))).toBe(true);
    expect(findMany.mock.calls[0][0]).toMatchObject({take:200,where:{version:{activeFor:{some:{retiredAt:null}}}}});
    expect(findMany.mock.calls[1][0]).toMatchObject({cursor:{id:"row-3"},skip:1});
  });
  it("passes compatible references without reading business record payloads",async()=>{
    const value=registry(),m=value.describe("sales.order.get",1);
    const findMany=vi.fn().mockResolvedValueOnce([{id:"r",definitionId:"d",contractId:m.id,contractVersion:m.version,schemaHash:m.schemaHash,contractHash:m.contractHash,version:tenant()}]).mockResolvedValueOnce([]);
    expect(await scanActiveStudioDependencies({studioDependency:{findMany}} as unknown as PrismaClient,value)).toEqual([]);
    expect(findMany.mock.calls[0][0].select.version).toEqual({select:{definition:{select:{organisation:{select:{isTest:true,status:true}}}}}});
    expect(findMany.mock.calls[0][0].select).not.toHaveProperty("payload");
  });
  it("ignores only suspended Test history, retaining active Test, suspended real and unknown-status release blockers",async()=>{
    const value=registry(),m=value.describe("sales.order.get",1);
    const row={contractId:"sales.removed.get",contractVersion:1,schemaHash:m.schemaHash,contractHash:m.contractHash};
    const findMany=vi.fn().mockResolvedValueOnce([
      {...row,id:"retired-test",definitionId:"retired-test",version:tenant(true,"SUSPENDED")},
      {...row,id:"active-test",definitionId:"active-test",version:tenant(true)},
      {...row,id:"suspended-real",definitionId:"suspended-real",version:tenant(false,"SUSPENDED")},
      {...row,id:"unknown-test",definitionId:"unknown-test",version:tenant(true,"UNKNOWN")},
    ]).mockResolvedValueOnce([]);
    const issues=await scanActiveStudioDependencies({studioDependency:{findMany}} as unknown as PrismaClient,value);
    expect(issues).toEqual([
      "active-test: Missing contract sales.removed.get@1",
      "suspended-real: Missing contract sales.removed.get@1",
      "unknown-test: Missing contract sales.removed.get@1",
    ]);
    expect(findMany.mock.calls[1][0]).toMatchObject({cursor:{id:"unknown-test"},skip:1});
  });
  it("still rejects expired supported contracts for real companies",async()=>{
    const value=registry();
    value.register("sales",{contributions:[query({id:"sales.old.get",version:1,label:"Old",capability:"sales.order.read",lifecycle:"deprecated",supportedUntil:"2000-01-01T00:00:00Z",classification:"confidential",kind:"query",input:z.strictObject({}),output:z.string(),pagination:"none",maxCardinality:1,costClass:"low",async execute(){return "order";}})]});
    const m=value.describe("sales.old.get",1);
    const row={contractId:m.id,contractVersion:m.version,schemaHash:m.schemaHash,contractHash:m.contractHash};
    const findMany=vi.fn().mockResolvedValueOnce([
      {...row,id:"a",definitionId:"retired-test",version:tenant(true,"SUSPENDED")},
      {...row,id:"b",definitionId:"real",version:tenant(false,"SUSPENDED")},
    ]).mockResolvedValueOnce([]);
    expect(await scanActiveStudioDependencies({studioDependency:{findMany}} as unknown as PrismaClient,value)).toEqual(["real: expired contract sales.old.get"]);
  });
});
