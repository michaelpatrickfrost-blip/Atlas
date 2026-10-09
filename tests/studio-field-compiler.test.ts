import { describe, expect, it } from "vitest";
import { buildRegistry } from "@/core/studio/registry/runtime";
import { compileCustomField } from "@/core/studio/compiler/fields";
import type { Session } from "@/core/auth/session";
const session: Session = { userId: "actor", userName: "Actor", userEmail: "a@example.test", organisationId: "tenant-a", organisationName: "A", membershipId: "m", capabilities: new Set(["tickets.ticket.read", "tickets.ticket.manage"]) };
const registry = buildRegistry(async () => true);
const payload = () => ({ schemaVersion: 1, entity: registry.describe("tickets.ticket", 2), storageGeneration: "0168ac73-bfb6-4e4f-91a0-d3d7dcf7286b", field: { key: "contact_email", label: "Contact email", classification: "confidential", storage: { type: "email" } } });
const input = () => { const p = payload(); const { id, version, schemaHash, contractHash } = p.entity; return { ...p, entity: { id, version, schemaHash, contractHash } }; };
describe("Studio field compilation", () => {
  it("pins a normalised owner-approved field and dependencies without executing a domain operation", async () => {
    const compiled = await compileCustomField(session, input(), registry);
    expect(compiled.payload.field).toMatchObject({ key: "contact_email", required: false, unique: false, indexed: false });
    expect(compiled.plan.dependencies).toEqual([expect.objectContaining({ id: "tickets.ticket", version: 2, ownerModuleId: "tickets", kind: "entity" })]);
    expect((await compileCustomField(session, input(), registry)).checksum).toBe(compiled.checksum);
  });
  it("rejects protected native/reserved keys, owner/classification/permission bypass and client scope", async () => {
    for (const key of ["status", "resolution", "queue_id", "context", "version"]) await expect(compileCustomField(session, { ...input(), field: { ...input().field, key } }, registry)).rejects.toThrow("Native fields");
    await expect(compileCustomField(session, { ...input(), field: { ...input().field, classification: "public_internal" } }, registry)).rejects.toThrow("classification");
    await expect(compileCustomField(session, { ...input(), field: { ...input().field, readCapability: "finance.document.read" } }, registry)).rejects.toThrow("FORBIDDEN");
    await expect(compileCustomField(session, { ...input(), organisationId: "other" }, registry)).rejects.toThrow();
    await expect(compileCustomField({ ...session, capabilities: new Set(["studio.definition.edit"]) }, input(), registry)).rejects.toThrow("FORBIDDEN");
    await expect(compileCustomField(session, input(), buildRegistry(async () => false))).rejects.toThrow("unavailable");
  });
  it("requires the new typed policy while preserving the published version 1 contract", async () => {
    const old = registry.describe("tickets.ticket", 1);
    const { id, version, schemaHash, contractHash } = old;
    await expect(compileCustomField(session, { ...input(), entity: { id, version, schemaHash, contractHash } }, registry)).rejects.toThrow("typed additional fields");
    expect(old.details.record).not.toHaveProperty("fieldPolicy");
    expect(registry.checkCompatibility([old])).toEqual([]);
    // Captured from sealed 6775044; protect real references, not a self-derived hash.
    expect(["tickets.ticket", "tickets.ticket.get", "tickets.ticket.list"].map(id => {
      const m = registry.describe(id, 1); return [m.schemaHash, m.contractHash];
    })).toEqual([
      ["e563b6536de3ffc03d3e3fc63fc7f9211dc158ce7ee517c944e9efc0ccce2ca6", "7c36b9ab5005060a1310d28cf8e9745b9529aa6c6968e373e27575e4cdc8df27"],
      ["8f6a7681319e7bc84e8e40e08d3861ff9c3361d300635fd5b4cfcf49aa9a68a5", "bf8cc0f397bcda846dd6e0bbfc42035e845114358189d13d367397ee3bde6c97"],
      ["f4d402fed780a80d1bd1d6f14d20d4ae44b3c07453d25b668b5ddf9538296596", "2449c18e95353ac92dff1d5579ed5943a8f52df27196a95a872f9834aaae9646"],
    ]);
  });
  it("pins only approved independently accessible reference targets", async () => {
    const current = input();
    const compiled = await compileCustomField(session, { ...current, field: { ...current.field, storage: { type: "reference", entity: current.entity } } }, registry);
    expect(compiled.plan.dependencies).toHaveLength(1);
    await expect(compileCustomField(session, { ...current, field: { ...current.field, storage: { type: "reference", entity: { ...current.entity, id: "finance.document" } } } }, registry)).rejects.toThrow("not approved");
  });
});
