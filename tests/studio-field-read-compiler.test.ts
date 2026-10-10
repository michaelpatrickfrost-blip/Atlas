import { expect, it } from "vitest";
import { compileCustomField, compileCustomFieldForRead } from "@/core/studio/compiler/fields";
import { retainedCutoverFixture } from "./fixtures/studio-field-cutover";
import { entityDetailsSchema } from "@/core/studio/registry/entities";
import { checksum } from "@/core/studio/registry/contracts";
import { ticketStudioContract } from "@/core/service-work/studio";
it("produces the identical sealed plan for a reader without authoring or field write permission", async () => {
  const f = await retainedCutoverFixture(), payload = { ...f.source.payload, field: { ...f.source.payload.field, writeCapability: "tickets.field.edit" } };
  const reader = { ...f.session, capabilities: new Set(["tickets.ticket.read"]) }, author = { ...f.session, capabilities: new Set([...f.session.capabilities, "tickets.field.edit"]) };
  const compiled = await compileCustomField(author, payload, f.registry);
  expect(await compileCustomFieldForRead(reader, payload, f.registry)).toEqual(compiled);
  await expect(compileCustomField(reader, payload, f.registry)).rejects.toThrow("FORBIDDEN");
});
it("checks a reference owner's separate read permission even when the source is permitted", async () => {
  const f = await retainedCutoverFixture(), capability = "tickets.reference.read";
  const original = ticketStudioContract.contributions.find(item => item.metadata.id === "tickets.ticket" && item.metadata.version === 1)!;
  const details = entityDetailsSchema.parse(original.metadata.details); expect(details.record).toBeDefined();
  const targetDetails = { ...details, record: { ...details.record!, listQuery: { id: "tickets.ticket.list", version: 7 }, getQuery: { id: "tickets.ticket.get", version: 7 } } };
  f.registry.register("tickets", { contributions: [
    ...["tickets.ticket.list", "tickets.ticket.get"].map(id => {
      const query = ticketStudioContract.contributions.find(item => item.metadata.id === id && item.metadata.version === 1)!;
      return { ...query, metadata: { ...query.metadata, version: 7, capability } };
    }),
    { ...original, metadata: { ...original.metadata, version: 7, capability, details: targetDetails, schemaHash: checksum(targetDetails) } },
  ] });
  const target = f.registry.describe("tickets.ticket", 7), reference = { id: target.id, version: target.version, schemaHash: target.schemaHash, contractHash: target.contractHash };
  const payload = { ...f.source.payload, field: { ...f.source.payload.field, storage: { type: "reference", entity: reference } } };
  await expect(compileCustomFieldForRead(f.session, payload, f.registry)).rejects.toThrow("FORBIDDEN");
  expect((await compileCustomFieldForRead({ ...f.session, capabilities: new Set([...f.session.capabilities, capability]) }, payload, f.registry)).payload.field.storage.type).toBe("reference");
});
it("read permission remains mandatory and does not widen from a field write or Studio grant", async () => {
  const f = await retainedCutoverFixture(), payload = { ...f.source.payload, field: { ...f.source.payload.field, readCapability: "tickets.field.secret" } };
  await expect(compileCustomFieldForRead(f.session, payload, f.registry)).rejects.toThrow("FORBIDDEN");
  await expect(compileCustomFieldForRead({ ...f.session, capabilities: new Set(["studio.definition.publish", "tickets.field.secret"]) }, payload, f.registry)).rejects.toThrow("FORBIDDEN");
});
it("read compilation still rejects changed owner contract, disabled sources, native keys and reference permissions", async () => {
  const f = await retainedCutoverFixture();
  await expect(compileCustomFieldForRead(f.session, { ...f.source.payload, entity: { ...f.source.payload.entity, contractHash: "f".repeat(64) } }, f.registry)).rejects.toThrow("contract changed");
  await expect(compileCustomFieldForRead(f.session, { ...f.source.payload, field: { ...f.source.payload.field, key: "status" } }, f.registry)).rejects.toThrow("Native fields");
  const m = f.registry.describe("tickets.ticket", 1), ref = { id: m.id, version: m.version, schemaHash: m.schemaHash, contractHash: m.contractHash };
  await expect(compileCustomFieldForRead({ ...f.session, capabilities: new Set() }, { ...f.source.payload, field: { ...f.source.payload.field, storage: { type: "reference", entity: ref } } }, f.registry)).rejects.toThrow("FORBIDDEN");
  const { CapabilityRegistry } = await import("@/core/studio/registry/registry");
  const { ticketStudioContract } = await import("@/core/service-work/studio");
  const disabled = new CapabilityRegistry(async () => false); disabled.register("tickets", ticketStudioContract);
  await expect(compileCustomFieldForRead(f.session, f.source.payload, disabled)).rejects.toThrow("unavailable");
});
