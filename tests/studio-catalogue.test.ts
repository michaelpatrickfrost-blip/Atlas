import { describe, expect, it } from "vitest";
import { buildRegistry } from "@/core/studio/registry/runtime";
import type { Session } from "@/core/auth/session";
const actor: Session = { userId: "test", userName: "Test", userEmail: "test@example.invalid", organisationId: "tenant-a", organisationName: "A", membershipId: "test", capabilities: new Set(["sales.quote.read", "sales.order.read", "sales.pipeline.read", "sales.opportunity.read", "projects.read", "service.case.read"]) };
describe("Studio catalogue compatibility baseline", () => {
  it("adapts existing source owners with valid stable hashes and permissions", async () => {
    const registry = buildRegistry(async () => true);
    const catalogue = await registry.discover(actor);
    expect([...new Set(catalogue.map(d => d.ownerModuleId))].sort()).toEqual(["crm", "projects", "sales", "service"]);
    expect(catalogue.length).toBeGreaterThanOrEqual(15);
    for (const descriptor of catalogue) {
      expect(descriptor.schemaHash).toMatch(/^[a-f0-9]{64}$/);
      expect(descriptor.contractHash).toMatch(/^[a-f0-9]{64}$/);
      expect(descriptor.classification).toBe("confidential");
      expect(registry.checkCompatibility([descriptor])).toEqual([]);
    }
    expect(catalogue.map(({ id, version, schemaHash, contractHash }) => ({ id, version, schemaHash, contractHash })).sort((a,b) => a.id.localeCompare(b.id))).toMatchSnapshot();
  });
});
