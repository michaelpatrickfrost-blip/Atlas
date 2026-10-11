import { beforeEach, expect, it, vi } from "vitest";
import type { Session } from "@/core/auth/session";
import type { Prisma } from "@/generated/prisma/client";
import { buildRegistry } from "@/core/studio/registry/runtime";
import { checksum } from "@/core/studio/registry/contracts";
import { compileCustomField } from "@/core/studio/compiler/fields";
import { customFieldPayloadSchema } from "@/core/studio/fields/schema";
import { compileRecordProfile } from "@/core/studio/record-types/compiler";
import type { ConfigurationReference } from "@/core/studio/record-types";

const uuid = (n: number) => `20000000-0000-4000-8000-${String(n).padStart(12, "0")}`;
const session: Session = { userId: "actor", userName: "Actor", userEmail: "actor@example.test", organisationId: "business-a",
  organisationName: "Business A", membershipId: "member", capabilities: new Set(["tickets.ticket.read", "tickets.ticket.manage", "tickets.field.read", "tickets.field.write"]) };
const registry = buildRegistry(async () => true);
const metadata = registry.describe("tickets.ticket", 9);
const entity = { id: metadata.id, version: metadata.version, schemaHash: metadata.schemaHash, contractHash: metadata.contractHash };
const findVersion = vi.fn(), findDefinition = vi.fn(), generation = vi.fn();
const tx = { studioDefinitionVersion: { findFirst: findVersion }, studioDefinition: { findFirst: findDefinition },
  studioFieldGeneration: { findFirst: generation } } as unknown as Prisma.TransactionClient;
const context = { session, transaction: tx, registry, definitionId: uuid(1) };
function row(definitionId: string, versionId: string, compiled: { payload: object; plan: object; checksum: string }, kind: string) {
  const plan = compiled.plan as { configurationDependencies?: ConfigurationReference[] };
  return { id: versionId, organisationId: session.organisationId, definitionId, schemaVersion: 1,
    payload: compiled.payload, compiledPlan: compiled.plan, checksum: compiled.checksum,
    definition: { kind, retiredAt: null as Date | null }, configurationDependencies: (plan.configurationDependencies ?? []).map(ref => ({
      organisationId: session.organisationId, definitionId, versionId,
      targetDefinitionId: ref.definitionId, targetVersionId: ref.versionId, targetKind: ref.kind,
      targetSchemaVersion: ref.schemaVersion, targetChecksum: ref.checksum })) };
}
let fieldRow: ReturnType<typeof row>, fieldPin: ConfigurationReference;
beforeEach(async () => {
  vi.clearAllMocks();
  const payload = customFieldPayloadSchema.parse({ schemaVersion: 1, entity, storageGeneration: uuid(200),
    field: { key: "case_count", label: "Case count", classification: "confidential", readCapability: "tickets.field.read",
      writeCapability: "tickets.field.write", storage: { type: "integer" } } });
  const field = await compileCustomField(session, payload, registry);
  fieldRow = row(uuid(2), uuid(102), field, "customField");
  fieldPin = { kind: "customField", definitionId: fieldRow.definitionId, versionId: fieldRow.id, schemaVersion: 1, checksum: fieldRow.checksum };
  findVersion.mockImplementation(async ({ where }) => where.id === fieldRow.id && where.organisationId === session.organisationId ? fieldRow : null);
  findDefinition.mockResolvedValue({ activeVersion: fieldRow }); generation.mockResolvedValue({ id: uuid(200) });
});
const base = () => ({ schemaVersion: 1, entity, profile: { requiredFields: [fieldPin] } });

it("materialises a tenant-owned exact required-field pin without business-value queries or mutations", async () => {
  const result = await compileRecordProfile(context, "entityProfile", base());
  expect(result.plan.resolvedProfile.requiredFields).toEqual([fieldPin]);
  expect(result.plan.configurationDependencies).toEqual([fieldPin]);
  expect(result.plan.dependencies).toEqual([expect.objectContaining({ ...entity, ownerModuleId: "tickets", kind: "entity" })]);
  expect(result.checksum).toBe(checksum(result.plan));
  expect(findVersion.mock.calls.every(([query]) => query.where.organisationId === session.organisationId)).toBe(true);
  expect(generation).toHaveBeenCalledWith(expect.objectContaining({ where: expect.objectContaining({ organisationId: session.organisationId, entityId: "tickets.ticket" }) }));
});
it("reconstructs the exact sealed base and one materialised overlay", async () => {
  const compiledBase = await compileRecordProfile(context, "entityProfile", base());
  const baseRow = row(uuid(1), uuid(101), compiledBase, "entityProfile");
  const pin = { kind: "entityProfile" as const, definitionId: baseRow.definitionId, versionId: baseRow.id, schemaVersion: 1 as const, checksum: baseRow.checksum };
  findVersion.mockImplementation(async ({ where }) => [fieldRow, baseRow].find(value => value.id === where.id && value.organisationId === where.organisationId) ?? null);
  const result = await compileRecordProfile({ ...context, definitionId: uuid(3) }, "recordType", { schemaVersion: 1, entity,
    baseProfile: pin, label: "Complaint", overlay: { requiredFields: [] } });
  expect(result.plan.resolvedProfile.requiredFields).toEqual([fieldPin]);
  expect(result.plan.configurationDependencies).toEqual([pin, fieldPin]);
  const alteredPlan = { ...compiledBase.plan, resolvedProfile: { ...compiledBase.plan.resolvedProfile, requiredFields: [] } };
  baseRow.compiledPlan = alteredPlan; baseRow.checksum = checksum(alteredPlan);
  await expect(compileRecordProfile({ ...context, definitionId: uuid(3) }, "recordType", { schemaVersion: 1, entity,
    baseProfile: { ...pin, checksum: baseRow.checksum }, label: "Complaint", overlay: {} })).rejects.toThrow("DEPENDENCY_BROKEN");
});
it.each(["foreign", "retired", "missing", "changed"])("fails closed for %s pinned field metadata", async mode => {
  if (mode === "foreign") fieldRow.organisationId = "business-b";
  if (mode === "retired") fieldRow.definition.retiredAt = new Date();
  if (mode === "missing") findVersion.mockResolvedValue(null);
  if (mode === "changed") fieldRow.checksum = "f".repeat(64);
  await expect(compileRecordProfile(context, "entityProfile", base())).rejects.toThrow("DEPENDENCY_BROKEN");
});
it("rejects missing current field activation/generation and changed storage/security semantics", async () => {
  findDefinition.mockResolvedValue(null);
  await expect(compileRecordProfile(context, "entityProfile", base())).rejects.toThrow("DEPENDENCY_BROKEN");
  findDefinition.mockResolvedValue({ activeVersion: fieldRow }); generation.mockResolvedValue(null);
  await expect(compileRecordProfile(context, "entityProfile", base())).rejects.toThrow("storage generation");
  generation.mockResolvedValue({ id: uuid(200) });
  const field = customFieldPayloadSchema.parse(fieldRow.payload);
  const changed = await compileCustomField(session, { ...field, storageGeneration: uuid(201) }, registry);
  findDefinition.mockResolvedValue({ activeVersion: row(uuid(2), uuid(103), changed, "customField") });
  await expect(compileRecordProfile(context, "entityProfile", base())).rejects.toThrow("DEPENDENCY_BROKEN");
});
it("permits a current cosmetic field publication without silently replacing the exact required pin", async () => {
  const field = customFieldPayloadSchema.parse(fieldRow.payload);
  const cosmetic = await compileCustomField(session, { ...field, field: { ...field.field, label: "Packages", help: "Packaged cases" } }, registry);
  findDefinition.mockResolvedValue({ activeVersion: row(uuid(2), uuid(103), cosmetic, "customField") });
  const result = await compileRecordProfile(context, "entityProfile", base());
  expect(result.plan.configurationDependencies).toEqual([fieldPin]);
});
it.each(["tickets.ticket.read", "tickets.field.read", "tickets.field.write"])("preserves independent %s authoring policy", async capability => {
  const denied = { ...session, capabilities: new Set([...session.capabilities].filter(value => value !== capability)) };
  await expect(compileRecordProfile({ ...context, session: denied }, "entityProfile", base())).rejects.toThrow();
});
it("rejects disabled source modules and owners without record-type opt-in", async () => {
  const disabled = buildRegistry(async () => false);
  await expect(compileRecordProfile({ ...context, registry: disabled }, "entityProfile", base())).rejects.toThrow();
  const original = registry.resolve.bind(registry);
  const source = vi.spyOn(registry, "resolve").mockImplementation(async (actor, reference) => {
    const value = await original(actor, reference);
    return { ...value, details: { ...value.details, extensionPolicy: { customFields: true, recordTypes: false, pageVariants: true } } };
  });
  await expect(compileRecordProfile(context, "recordType", { schemaVersion: 1, entity, label: "Complaint", overlay: {},
    baseProfile: { kind: "entityProfile", definitionId: uuid(9), versionId: uuid(109), schemaVersion: 1, checksum: "a".repeat(64) } })).rejects.toThrow("DEPENDENCY_BROKEN");
  source.mockRestore();
});
it("keeps page/process/decision selectors unavailable until their actual compiler is wired", async () => {
  const pin = { definitionId: uuid(9), versionId: uuid(109), schemaVersion: 1, checksum: "a".repeat(64) };
  for (const profile of [{ page: { ...pin, kind: "page" } }, { allowedProcesses: [{ ...pin, kind: "process" }] },
    { defaultDecisions: [{ key: "routing", decision: { ...pin, kind: "decision" } }] }])
    await expect(compileRecordProfile(context, "entityProfile", { ...base(), profile })).rejects.toThrow(/compiler/);
});
