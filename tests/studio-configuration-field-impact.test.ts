import { beforeEach, expect, it, vi } from "vitest";
import type { Prisma } from "@/generated/prisma/client";
import type { Session } from "@/core/auth/session";
import { checksum } from "@/core/studio/registry/contracts";
import { versionedFieldPayloadSchema } from "@/core/studio/fields/required-contract";
const m = vi.hoisted(() => ({ usage: vi.fn(), definition: vi.fn() }));
vi.mock("@/core/studio/configuration/usage", () => ({ whereUsedConfigurationInTransaction: m.usage }));
import { assertFieldConfigurationCompatibilityInTransaction } from "@/core/studio/configuration/impact";
const id = "00000000-0000-4000-8000-000000000001", session = { organisationId: "business-a" } as Session;
const tx = { studioDefinition: { findFirst: m.definition } } as unknown as Prisma.TransactionClient;
const payload = versionedFieldPayloadSchema.parse({ schemaVersion: 1, entity: { id: "tickets.ticket", version: 9,
  schemaHash: "a".repeat(64), contractHash: "b".repeat(64) }, storageGeneration: id,
  field: { key: "count", label: "Count", classification: "confidential", storage: { type: "integer" } } });
beforeEach(() => {
  vi.clearAllMocks(); m.usage.mockResolvedValue({ usages: [{ active: true }], next: null });
  const plan = { payload };
  m.definition.mockResolvedValue({ activeVersionId: id, activeVersion: { id, definitionId: id, organisationId: "business-a",
    payload, compiledPlan: plan, checksum: checksum(plan) } });
});
it("permits a field without active retained dependants without querying business values or an active version", async () => {
  m.usage.mockResolvedValue({ usages: [], next: null });
  await assertFieldConfigurationCompatibilityInTransaction(session, tx, id, payload);
  expect(m.definition).not.toHaveBeenCalled();
});
it("permits only cosmetic label/help evolution for active screen/type references", async () => {
  await assertFieldConfigurationCompatibilityInTransaction(session, tx, id, { ...payload, field: { ...payload.field, label: "Cases", help: "Packaged cases" } });
  expect(m.definition.mock.calls[0][0].where).toMatchObject({ id, organisationId: "business-a", kind: "customField" });
});
it.each(["generation", "constraint", "permission", "required"])("blocks %s drift before pointer changes", async change => {
  const candidate = change === "generation" ? { ...payload, storageGeneration: "00000000-0000-4000-8000-000000000002" }
    : { ...payload, field: { ...payload.field, ...(change === "constraint" ? { storage: { type: "integer" as const, min: 0 } }
      : change === "permission" ? { readCapability: "tickets.secret.read" } : { required: true }) } };
  await expect(assertFieldConfigurationCompatibilityInTransaction(session, tx, id, candidate)).rejects.toThrow("CONFIGURATION_IN_USE");
});
it("does not hide an active dependant behind a later usage page", async () => {
  const cursor = { after: `${id}@${id}`, checksum: "c".repeat(64) };
  m.usage.mockResolvedValueOnce({ usages: [{ active: false }], next: cursor }).mockResolvedValueOnce({ usages: [{ active: true }], next: null });
  await expect(assertFieldConfigurationCompatibilityInTransaction(session, tx, id, { ...payload, field: { ...payload.field, required: true } })).rejects.toThrow("CONFIGURATION_IN_USE");
  expect(m.usage.mock.calls[1][2]).toEqual({ definitionId: id, limit: 50, cursor });
});
it("rejects changed/foreign current metadata rather than blessing an active design's pin", async () => {
  m.definition.mockResolvedValue(null);
  await expect(assertFieldConfigurationCompatibilityInTransaction(session, tx, id, payload)).rejects.toThrow("DEPENDENCY_BROKEN");
});
