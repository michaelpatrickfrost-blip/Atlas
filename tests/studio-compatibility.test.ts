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
describe("Studio release dependency scan",()=>{
  it("scans only active definitions in bounded batches and detects missing and changed contracts",async()=>{
    const registered=registry(),m=registered.describe("sales.order.get",1);
    const row={id:"row-1",definitionId:"definition-a",contractId:m.id,contractVersion:1,schemaHash:m.schemaHash,contractHash:m.contractHash};
    const findMany=vi.fn().mockResolvedValueOnce([row,{...row,id:"row-2",contractId:"sales.removed.get"},{...row,id:"row-3",schemaHash:"0".repeat(64)}]).mockResolvedValueOnce([]);
    const client={studioDependency:{findMany}} as unknown as PrismaClient;
    const issues=await scanActiveStudioDependencies(client,registered);
    expect(issues).toHaveLength(2);expect(issues.every(issue=>issue.startsWith("definition-a:"))).toBe(true);
    expect(findMany.mock.calls[0][0]).toMatchObject({take:200,where:{version:{activeFor:{some:{retiredAt:null}}}}});
    expect(findMany.mock.calls[1][0]).toMatchObject({cursor:{id:"row-3"},skip:1});
  });
  it("passes compatible references without reading business record payloads",async()=>{
    const value=registry(),m=value.describe("sales.order.get",1);
    const findMany=vi.fn().mockResolvedValueOnce([{id:"r",definitionId:"d",contractId:m.id,contractVersion:m.version,schemaHash:m.schemaHash,contractHash:m.contractHash}]).mockResolvedValueOnce([]);
    expect(await scanActiveStudioDependencies({studioDependency:{findMany}} as unknown as PrismaClient,value)).toEqual([]);
  });
});
