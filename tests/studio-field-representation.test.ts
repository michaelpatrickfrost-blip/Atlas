import { beforeEach, expect, it, vi } from "vitest";
import type { Prisma } from "@/generated/prisma/client";
import { Prisma as PrismaValues } from "@/generated/prisma/client";
import type { Session } from "@/core/auth/session";
const m = vi.hoisted(() => ({ observation: vi.fn(), inspect: vi.fn(), requiredInspect: vi.fn(), outcome: vi.fn(), extend: vi.fn(), createExtension: vi.fn(), slot: vi.fn(), value: vi.fn(), point: vi.fn() }));
vi.mock("@/core/db/client", () => ({ db: {} }));
vi.mock("@/core/studio/fields/migrations/observation", () => ({ inspectFieldMigrationRecord: m.inspect, inspectExecutingRequiredFieldMigrationRecord: m.requiredInspect }));
import { conditionalFieldPayloadSchema } from "@/core/studio/fields/required-contract";
import { compileConditionalCustomField } from "@/core/studio/fields/conditional-compiler";
import { registeredRequiredFactMetadata } from "@/core/studio/fields/required-owner";
import { sealRequiredFieldMigrationIntent, sealRequiredFieldMigrationReview, type RequiredFieldMigrationObservation } from "@/core/studio/fields/migrations/required-contracts";
import { reviewedRequiredFieldPublicationPin } from "@/core/studio/fields/migrations/publication-contract";
import { createRequiredFieldMigrationExecutionPin } from "@/core/studio/fields/migrations/execution-contract";
import { CapabilityRegistry } from "@/core/studio/registry/registry";
import { ticketStudioContract } from "@/core/service-work/studio";
import { compileCustomField } from "@/core/studio/compiler/fields";
import { customFieldPayloadSchema } from "@/core/studio/fields/schema";
import { sealFieldMigrationIntent, sealFieldMigrationReview, type FieldMigrationObservation } from "@/core/studio/fields/migrations/contracts";
import { createFieldMigrationExecutionPin } from "@/core/studio/fields/migrations/execution-contract";
import { reviewedFieldPublicationPin } from "@/core/studio/fields/migrations/publication-contract";
import { checksum } from "@/core/studio/registry/contracts";
import type { inspectFieldMigrationExecution, inspectRequiredFieldMigrationExecution } from "@/core/studio/fields/migrations/execution-inspection";
import { writeFieldMigrationRepresentation } from "@/core/studio/fields/migrations/representation";
const uuid = (n: number) => `00000000-0000-4000-8000-${n.toString().padStart(12, "0")}`;
const registry = new CapabilityRegistry(async () => true); registry.register("tickets", ticketStudioContract);
const ref = (id: string, version: number) => { const meta = registry.describe(id, version); return { id, version, schemaHash: meta.schemaHash, contractHash: meta.contractHash }; };
const session: Session = { userId: "user", userName: "User", userEmail: "user@example.invalid", membershipId: "member", organisationId: "company", organisationName: "Company",
  capabilities: new Set(["studio.definition.publish", "tickets.ticket.read", "tickets.ticket.manage"]) };
const principal = { organisationId: "company", userId: "user", membershipId: "member", sessionVersion: 2, authVersion: 3, authority: "customer" as const };
const company = { id: "company", kind: "CUSTOMER" as const, status: "ACTIVE" as const, archivedAt: null, isTest: true };
const source = customFieldPayloadSchema.parse({ schemaVersion: 1, entity: ref("tickets.ticket", 2), storageGeneration: uuid(1),
  field: { key: "extra", label: "Extra", classification: "confidential", storage: { type: "integer" } } });
const targetPayload = customFieldPayloadSchema.parse({ ...source, entity: ref("tickets.ticket", 5), storageGeneration: uuid(2), field: { ...source.field, storage: { type: "decimal" }, unique: true } });
const tx = { studioFieldMigrationObservation: { findFirst: m.observation }, studioFieldMigrationOutcome: { create: m.outcome },
  studioExtensionRecord: { updateMany: m.extend, create: m.createExtension }, studioFieldSlot: { create: m.slot, updateMany: m.point }, studioFieldValue: { create: m.value } } as unknown as Prisma.TransactionClient;
const authority = { session, principal, company, transaction: tx };
let inspection: Awaited<ReturnType<typeof inspectFieldMigrationExecution>> | Awaited<ReturnType<typeof inspectRequiredFieldMigrationExecution>>, observation: FieldMigrationObservation | RequiredFieldMigrationObservation;
let approve: ReturnType<typeof vi.spyOn>;
let bodyChanged: boolean;
beforeEach(async () => {
  vi.restoreAllMocks(); vi.clearAllMocks(); bodyChanged = false;
  const a = await compileCustomField(session, source, registry), b = await compileCustomField(session, targetPayload, registry);
  const intent = sealFieldMigrationIntent({ schemaVersion: 1, id: uuid(3), organisationId: "company", definitionId: uuid(4), definitionRevision: 7, principal,
    source: { versionId: uuid(6), versionChecksum: a.checksum, payload: source }, target: { draftId: uuid(5), draftRevision: 9, compiledChecksum: b.checksum, payload: targetPayload },
    conversion: { kind: "integer_to_decimal" }, ownerQuery: ref("tickets.ticket.field_migration", 3) }).intent;
  const stored = sealFieldMigrationReview({ ...intent, cohort: { recordCount: 3, observationDigest: "a".repeat(64) }, summary: { validCount: 3, invalidCount: 0, lossyCount: 0 } });
  const target = { id: uuid(8), organisationId: "company", definitionId: uuid(4), version: 2, payload: targetPayload, compiledPlan: b.plan, checksum: b.checksum };
  const publication = { ...reviewedFieldPublicationPin(stored, target, "user", false), state: "PUBLISHED", revision: 0 };
  const pinned = createFieldMigrationExecutionPin(stored, target, reviewedFieldPublicationPin(stored, target, "user", false), registry.describe("tickets.ticket", 5), registry.describe("tickets.ticket.field_representation", 1));
  const progress = { state: "RUNNING" as const, revision: 0, cursor: null, processedCount: 0, failureCode: null };
  inspection = { intent, stored, publication: { ...publication, createdAt: new Date(), updatedAt: new Date() }, target, registry,
    pin: pinned.pin, pinChecksum: pinned.checksum, progress,
    existing: { preparationId: intent.id, organisationId: "company", definitionId: uuid(4), entityId: "tickets.ticket", pin: pinned.pin, pinChecksum: pinned.checksum,
      ...progress, createdAt: new Date(), updatedAt: new Date() } };
  observation = { recordId: "ticket_a", nativeRevision: 4, extension: { id: uuid(10), revision: 3, slot: { id: uuid(11), revision: 2,
    value: { id: uuid(12), revision: 2, versionId: uuid(6), fingerprint: checksum({ type: "integer", value: 9007199254740991 }) } } },
    result: { kind: "valid", targetFingerprint: checksum({ type: "decimal", value: "9007199254740991" }), isNull: false, lossy: false } };
  m.observation.mockImplementation(async ({ where }) => ({ ...where, recordId: observation.recordId, nativeRevision: observation.nativeRevision, observation: structuredClone(observation) }));
  m.inspect.mockImplementation(async () => ({ observation: bodyChanged ? { ...structuredClone(observation), nativeRevision: 5 } : structuredClone(observation), convertedValue: { type: "decimal", value: "9007199254740991" } }));
  approve = vi.spyOn(registry, "invokeQueryInTransaction").mockImplementation(async () => ({ organisationId: "company", recordId: "ticket_a", revision: 4,
    preparationId: uuid(3), observationId: uuid(9), representationOnly: true }));
  m.extend.mockResolvedValue({ count: 1 }); m.point.mockResolvedValue({ count: 1 });
});
it("approves before decoding, claims before target writes, retains source generation and persists exact typed precision plus scoped unique pointer", async () => {
  expect(await writeFieldMigrationRepresentation(authority, inspection, uuid(9))).toEqual({ observationId: uuid(9), recordId: "ticket_a" });
  expect(approve).toHaveBeenCalledWith({ session, transaction: tx }, ref("tickets.ticket.field_representation", 1), { preparationId: uuid(3), observationId: uuid(9) });
  expect(approve.mock.invocationCallOrder[0]).toBeLessThan(m.inspect.mock.invocationCallOrder[0]);
  expect(m.outcome.mock.invocationCallOrder[0]).toBeLessThan(m.extend.mock.invocationCallOrder[0]); expect(m.extend.mock.invocationCallOrder[0]).toBeLessThan(m.slot.mock.invocationCallOrder[0]);
  expect(m.slot.mock.invocationCallOrder[0]).toBeLessThan(m.value.mock.invocationCallOrder[0]); expect(m.value.mock.invocationCallOrder[0]).toBeLessThan(m.point.mock.invocationCallOrder[0]);
  expect(m.extend.mock.calls[0][0]).toEqual({ where: { id: uuid(10), organisationId: "company", entityId: "tickets.ticket", recordId: "ticket_a", revision: 3 }, data: { revision: 4 } });
  const value = m.value.mock.calls[0][0].data, outcome = m.outcome.mock.calls[0][0].data;
  expect(value.decimalValue.toFixed()).toBe("9007199254740991"); expect(value).toMatchObject({ generationId: uuid(2), versionId: uuid(8), revision: 1, integerValue: null, jsonValue: PrismaValues.DbNull, createdBy: "user" });
  expect(outcome).toMatchObject({ sourceGenerationId: uuid(1), targetGenerationId: uuid(2), observationChecksum: checksum(observation), extensionRevision: 4, targetValueId: value.id });
  expect(m.point.mock.calls[0][0].data).toEqual({ revision: 1, activeValueId: value.id, uniqueToken: value.fingerprint }); expect(m.createExtension).not.toHaveBeenCalled();
});
it("unanchored null conversion creates only its target anchor/slot/null value with DB NULL and no uniqueness reservation", async () => {
  observation.extension = null; observation.result = { kind: "valid", targetFingerprint: checksum(null), isNull: true, lossy: false };
  m.inspect.mockImplementation(async () => ({ observation: structuredClone(observation), convertedValue: null }));
  await writeFieldMigrationRepresentation(authority, inspection, uuid(9));
  expect(m.extend).not.toHaveBeenCalled(); expect(m.createExtension.mock.calls[0][0].data).toMatchObject({ recordId: "ticket_a", revision: 1, organisationId: "company" });
  expect(m.value.mock.calls[0][0].data).toMatchObject({ isNull: true, decimalValue: null, jsonValue: PrismaValues.DbNull, fingerprint: checksum(null) });
  expect(m.point.mock.calls[0][0].data.uniqueToken).toBeNull();
});
it("rejects missing/foreign/invalid observations and nonrunning context before owner or source columns", async () => {
  m.observation.mockResolvedValueOnce(null); await expect(writeFieldMigrationRepresentation(authority, inspection, uuid(9))).rejects.toThrow("stale or has changed");
  observation.result = { kind: "invalid", code: "INVALID_TARGET" }; await expect(writeFieldMigrationRepresentation(authority, inspection, uuid(9))).rejects.toThrow("stale or has changed");
  await expect(writeFieldMigrationRepresentation({ ...authority, session: { ...session, organisationId: "other" } }, inspection, uuid(9))).rejects.toThrow("stale or has changed");
  inspection.progress!.state = "FAILED"; await expect(writeFieldMigrationRepresentation(authority, inspection, uuid(9))).rejects.toThrow("stale or has changed");
  expect(approve).not.toHaveBeenCalled(); expect(m.inspect).not.toHaveBeenCalled(); expect(m.outcome).not.toHaveBeenCalled();
});
it("owner denial or forged native approval cannot decode or claim a representation", async () => {
  approve.mockRejectedValueOnce(new Error("FORBIDDEN: native private permission revoked")); await expect(writeFieldMigrationRepresentation(authority, inspection, uuid(9))).rejects.toThrow("private permission revoked");
  approve.mockResolvedValueOnce({ organisationId: "other", recordId: "ticket_a", revision: 4, preparationId: uuid(3), observationId: uuid(9), representationOnly: true });
  await expect(writeFieldMigrationRepresentation(authority, inspection, uuid(9))).rejects.toThrow("stale or has changed"); expect(m.inspect).not.toHaveBeenCalled(); expect(m.outcome).not.toHaveBeenCalled();
});
it("written/reference access failure, changed source and different converted fingerprint deny before outcome", async () => {
  m.inspect.mockRejectedValueOnce(new Error("FORBIDDEN: written/reference access removed")); await expect(writeFieldMigrationRepresentation(authority, inspection, uuid(9))).rejects.toThrow("written/reference");
  bodyChanged = true; await expect(writeFieldMigrationRepresentation(authority, inspection, uuid(9))).rejects.toThrow("stale or has changed"); bodyChanged = false;
  m.inspect.mockResolvedValueOnce({ observation: structuredClone(observation), convertedValue: { type: "decimal", value: "42" } });
  await expect(writeFieldMigrationRepresentation(authority, inspection, uuid(9))).rejects.toThrow("stale or has changed"); expect(m.outcome).not.toHaveBeenCalled();
});
it("lost extension or slot CAS stops before any subsequent writes; caller's batch transaction must roll back the claim", async () => {
  m.extend.mockResolvedValueOnce({ count: 0 }); await expect(writeFieldMigrationRepresentation(authority, inspection, uuid(9))).rejects.toThrow("stale or has changed");
  expect(m.slot).not.toHaveBeenCalled(); expect(m.value).not.toHaveBeenCalled();
  m.point.mockResolvedValueOnce({ count: 0 }); await expect(writeFieldMigrationRepresentation(authority, inspection, uuid(9))).rejects.toThrow("stale or has changed");
});

// The native approval/actual row reader are explicit unit fixtures. These cases
// exercise the real compiler, closed2 observation/outcome and typed writer; they
// do not replace normal SQL/owner/condition or commit-failure acceptance.
async function conditionalRepresentationFixture() {
  const payload = conditionalFieldPayloadSchema.parse({ ...targetPayload, schemaVersion: 2, entity: ref("tickets.ticket", 9),
    requiredIf: { match: "all", predicates: [{ source: { kind: "native", fieldId: "status" }, operator: "present" }] } });
  const compiled = await compileConditionalCustomField({ session, registry, definitionId: uuid(4), resolveMetadata: async fact => fact.kind === "native"
    ? registeredRequiredFactMetadata(session, registry, payload.entity, fact.fieldId) : Promise.reject(new Error("Unexpected field fixture")) }, payload);
  const intent = sealRequiredFieldMigrationIntent({ ...inspection.intent, schemaVersion: 2, ownerQuery: ref("tickets.ticket.field_migration", 4),
    target: { ...inspection.intent.target, payload: compiled.payload, compiledChecksum: compiled.checksum } }).intent;
  const stored = sealRequiredFieldMigrationReview({ ...intent, cohort: { recordCount: 3, observationDigest: "a".repeat(64) },
    summary: { validCount: 3, invalidCount: 0, lossyCount: 0 } });
  const target = { id: uuid(8), organisationId: "company", definitionId: uuid(4), version: 2, payload: compiled.payload, compiledPlan: compiled.plan, checksum: compiled.checksum };
  const identity = reviewedRequiredFieldPublicationPin(stored, target, "user", false);
  const pinned = createRequiredFieldMigrationExecutionPin(stored, target, identity, registry.describe("tickets.ticket", 9), registry.describe("tickets.ticket.field_representation", 2));
  const requiredInspection: Awaited<ReturnType<typeof inspectRequiredFieldMigrationExecution>> = { ...inspection, intent, stored, target, publication: { ...identity, state: "PUBLISHED", revision: 0, createdAt: new Date(), updatedAt: new Date() },
    pin: pinned.pin, pinChecksum: pinned.checksum, existing: { ...inspection.existing!, pin: pinned.pin, pinChecksum: pinned.checksum } };
  inspection = requiredInspection;
  const required: RequiredFieldMigrationObservation = { ...observation, requirement: {
    sourceEvaluationChecksum: "b".repeat(64), targetEvaluationChecksum: "c".repeat(64), targetRequired: true } };
  observation = required;
  m.requiredInspect.mockImplementation(async () => ({ observation: structuredClone(observation), convertedValue: { type: "decimal", value: "9007199254740991" } }));
  return requiredInspection;
}
it("writes conditional representation only through owner2 and row2, binding the complete requirement evidence to receipt1", async () => {
  await conditionalRepresentationFixture(); await writeFieldMigrationRepresentation(authority, inspection, uuid(9));
  expect(approve).toHaveBeenCalledWith({ session, transaction: tx }, ref("tickets.ticket.field_representation", 2), { preparationId: uuid(3), observationId: uuid(9) });
  expect(approve.mock.invocationCallOrder[0]).toBeLessThan(m.requiredInspect.mock.invocationCallOrder[0]);
  expect(m.inspect).not.toHaveBeenCalled(); expect(m.requiredInspect).toHaveBeenCalledOnce();
  expect(m.requiredInspect.mock.invocationCallOrder[0]).toBeLessThan(m.outcome.mock.invocationCallOrder[0]);
  const outcome = m.outcome.mock.calls[0][0].data;
  expect(outcome.outcome.schemaVersion).toBe(1);
  expect(outcome).toMatchObject({ observationChecksum: checksum(observation), executionChecksum: inspection.pinChecksum, extensionRevision: 4,
    sourceGenerationId: uuid(1), targetGenerationId: uuid(2) });
  expect(m.value.mock.calls[0][0].data.decimalValue.toFixed()).toBe("9007199254740991");
  expect(m.outcome.mock.invocationCallOrder[0]).toBeLessThan(m.extend.mock.invocationCallOrder[0]);
});
it("conditional optional absence creates an anchor or increments an anchor without source slot, preserving null uniqueness", async () => {
  await conditionalRepresentationFixture();
  observation = { ...observation, extension: null, requirement: { ...(observation as RequiredFieldMigrationObservation).requirement, targetRequired: false },
    result: { kind: "valid", targetFingerprint: checksum(null), isNull: true, lossy: false } };
  m.requiredInspect.mockImplementation(async () => ({ observation: structuredClone(observation), convertedValue: null }));
  await writeFieldMigrationRepresentation(authority, inspection, uuid(9));
  expect(m.createExtension.mock.calls[0][0].data).toMatchObject({ revision: 1, organisationId: "company", recordId: "ticket_a" });
  expect(m.extend).not.toHaveBeenCalled(); expect(m.point.mock.calls[0][0].data.uniqueToken).toBeNull();
  expect(m.outcome.mock.calls[0][0].data.observationChecksum).toBe(checksum(observation));
  vi.clearAllMocks(); observation.extension = { id: uuid(10), revision: 3, slot: null };
  await writeFieldMigrationRepresentation(authority, inspection, uuid(9));
  expect(m.createExtension).not.toHaveBeenCalled(); expect(m.extend.mock.calls[0][0]).toMatchObject({ where: { id: uuid(10), revision: 3 }, data: { revision: 4 } });
  expect(m.outcome.mock.calls[0][0].data).toMatchObject({ extensionRevision: 4, targetIsNull: true });
  expect(m.value.mock.calls[0][0].data).toMatchObject({ isNull: true, decimalValue: null, fingerprint: checksum(null) });
});
it("conditional value or requirement drift, denied condition input and required absence cannot claim targets", async () => {
  await conditionalRepresentationFixture();
  m.requiredInspect.mockRejectedValueOnce(new Error("FORBIDDEN: condition field Read removed"));
  await expect(writeFieldMigrationRepresentation(authority, inspection, uuid(9))).rejects.toThrow("condition field Read");
  const retained = observation as RequiredFieldMigrationObservation;
  for (const requirement of [{ ...retained.requirement, targetEvaluationChecksum: "d".repeat(64) },
    { ...retained.requirement, sourceEvaluationChecksum: "d".repeat(64) }, { ...retained.requirement, targetRequired: false }]) {
    m.requiredInspect.mockResolvedValueOnce({ observation: { ...retained, requirement }, convertedValue: { type: "decimal", value: "9007199254740991" } });
    await expect(writeFieldMigrationRepresentation(authority, inspection, uuid(9))).rejects.toThrow("stale or has changed");
  }
  m.requiredInspect.mockResolvedValueOnce({ observation: retained, convertedValue: { type: "decimal", value: "42" } });
  await expect(writeFieldMigrationRepresentation(authority, inspection, uuid(9))).rejects.toThrow("stale or has changed");
  observation = { ...retained, extension: null, result: { kind: "valid", targetFingerprint: checksum(null), isNull: true, lossy: false } };
  await expect(writeFieldMigrationRepresentation(authority, inspection, uuid(9))).rejects.toThrow();
  expect(m.inspect).not.toHaveBeenCalled(); expect(m.outcome).not.toHaveBeenCalled(); expect(m.value).not.toHaveBeenCalled();
});
it("conditional representation needs sealed review2 and preserves owner denial and extension CAS before typed writes", async () => {
  const requiredInspection = await conditionalRepresentationFixture(); approve.mockRejectedValueOnce(new Error("FORBIDDEN: conditional owner approval removed"));
  await expect(writeFieldMigrationRepresentation(authority, inspection, uuid(9))).rejects.toThrow("conditional owner approval");
  expect(m.requiredInspect).not.toHaveBeenCalled(); expect(m.outcome).not.toHaveBeenCalled();
  const stored = requiredInspection.stored;
  inspection = { ...requiredInspection, stored: { ...stored, checksum: "d".repeat(64) } };
  await expect(writeFieldMigrationRepresentation(authority, inspection, uuid(9))).rejects.toThrow("stale or has changed");
  expect(m.outcome).not.toHaveBeenCalled(); inspection = requiredInspection;
  m.extend.mockResolvedValueOnce({ count: 0 });
  await expect(writeFieldMigrationRepresentation(authority, inspection, uuid(9))).rejects.toThrow("stale or has changed");
  expect(m.slot).not.toHaveBeenCalled(); expect(m.value).not.toHaveBeenCalled();
});
