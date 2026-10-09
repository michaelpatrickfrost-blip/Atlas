import { describe, expect, it } from "vitest";
import { z } from "zod";
import type { Session } from "@/core/auth/session";
import { compileKernel } from "@/core/studio/compiler/kernel";
import { query, command } from "@/core/studio/registry/contracts";
import { CapabilityRegistry } from "@/core/studio/registry/registry";
const session: Session = { organisationId: "a", organisationName: "A", userId: "u", userName: "U", userEmail: "u@example.invalid", membershipId: "m", capabilities: new Set(["sales.order.read"]) };
function setup() {
  const registry = new CapabilityRegistry(async () => true);
  const shared = { version: 1, label: "Order", capability: "sales.order.read", lifecycle: "active" as const, classification: "confidential" as const };
  registry.register("sales", { contributions: [query({ ...shared, id: "sales.order.get", kind: "query", input: z.strictObject({}), output: z.string(), pagination: "none", maxCardinality: 1, costClass: "low", async execute() { return "canonical"; } }), query({ ...shared, id: "sales.order.list", kind: "query", input: z.strictObject({}), output: z.array(z.string()), pagination: "page", maxCardinality: 200, costClass: "low", async execute() { return []; } }), command({ ...shared, id: "sales.order.confirm", kind: "command", input: z.strictObject({}), output: z.string(), execution: "transactional", idempotency: "required", sideEffect: "internal", async invoke() { return "confirmed"; } })] });
  const ref = (id: string) => { const d = registry.describe(id,1); return { id, version: d.version, schemaHash: d.schemaHash, contractHash: d.contractHash }; };
  return { registry, ref };
}
describe("Studio metadata kernel compiler", () => {
  it("compiles a closed deterministic plan independent of reference order", async () => {
    const { registry, ref } = setup();
    const refs = [ref("sales.order.list"), ref("sales.order.get")];
    const a = await compileKernel(session,"capabilitySet",{ schemaVersion:1, description:"Sources",references:refs },registry);
    const b = await compileKernel(session,"capabilitySet",{ schemaVersion:1, description:"Sources",references:[...refs].reverse() },registry);
    expect(a.checksum).toBe(b.checksum);
    expect(a.plan.dependencies.every(d=>d.ownerModuleId === "sales")).toBe(true);
  });
  it("refuses unregistered later artefacts, executable configuration and forged compiled plans", async () => {
    const { registry, ref } = setup();
    await expect(compileKernel(session,"flow",{},registry)).rejects.toThrow("No Studio compiler");
    await expect(compileKernel(session,"capabilitySet",{schemaVersion:1,description:"",references:[ref("sales.order.confirm")]},registry)).rejects.toThrow("later Studio compiler");
    await expect(compileKernel(session,"capabilitySet",{schemaVersion:1,description:"",references:[],compiledPlan:{}},registry)).rejects.toThrow();
  });
  it("denies duplicate dependencies, missing permissions and client tenant IDs", async () => {
    const { registry, ref } = setup(), r = ref("sales.order.get");
    await expect(compileKernel(session,"capabilitySet",{schemaVersion:1,description:"",references:[r,r]},registry)).rejects.toThrow("Duplicate");
    await expect(compileKernel({...session,capabilities:new Set()},"capabilitySet",{schemaVersion:1,description:"",references:[r]},registry)).rejects.toThrow("FORBIDDEN");
    await expect(compileKernel(session,"capabilitySet",{schemaVersion:1,description:"",references:[],organisationId:"b"},registry)).rejects.toThrow();
  });
});

import { compareDraftPayloads } from "@/core/studio/definitions/diff";
it("shows structural draft conflicts without overwriting either payload", () => {
 const saved={schemaVersion:1,description:"Saved by another editor",references:[]};
 const submitted={schemaVersion:1,description:"My unsaved work",references:[]};
 expect(compareDraftPayloads(saved,submitted)).toEqual([{path:"Description",saved:saved.description,submitted:submitted.description}]);
 expect(saved.description).toBe("Saved by another editor");
});
