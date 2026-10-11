import { beforeEach, expect, it, vi } from "vitest";
import type { Prisma } from "@/generated/prisma/client";
import type { Session } from "@/core/auth/session";
const m = vi.hoisted(() => ({ enabled: vi.fn(), member: vi.fn(), native: vi.fn(), count: vi.fn(), records: vi.fn(), preparation: vi.fn(), publication: vi.fn(),
  observation: vi.fn(), queueMember: vi.fn(), cutover: vi.fn(), raw: vi.fn() }));
vi.mock("@/core/db/client", () => ({ db: {} }));
import { ticketStudioContract } from "@/core/service-work/studio";
import { CapabilityRegistry } from "@/core/studio/registry/registry";
import { customFieldPayloadSchema } from "@/core/studio/fields/schema";
import { conditionalFieldPayloadSchema } from "@/core/studio/fields/required-contract";
import { sealFieldMigrationIntent, sealFieldMigrationReview } from "@/core/studio/fields/migrations/contracts";
import { sealRequiredFieldMigrationIntent, sealRequiredFieldMigrationReview } from "@/core/studio/fields/migrations/required-contracts";
import { entityDetailsSchema } from "@/core/studio/registry/entities";
const id = (n: number) => `00000000-0000-4000-8000-${n.toString().padStart(12, "0")}`;
const session: Session = { userId: "actor", userName: "Actor", userEmail: "actor@example.invalid", membershipId: "member", organisationId: "company", organisationName: "Company",
  capabilities: new Set(["tickets.ticket.read", "tickets.ticket.manage"]) };
const tx = { $queryRaw: m.raw, moduleState: { findFirst: m.enabled }, membership: { findFirst: m.member },
  serviceWorkItem: { findFirst: m.native, count: m.count, findMany: m.records }, studioFieldMigrationPreparation: { findFirst: m.preparation },
  studioFieldMigrationPublication: { findFirst: m.publication }, studioFieldMigrationObservation: { findFirst: m.observation },
  serviceQueueMember: { findFirst: m.queueMember }, studioFieldMigrationCutover: { findFirst: m.cutover } } as unknown as Prisma.TransactionClient;
let registry: CapabilityRegistry, saved: object, pub: object;
function ref(name: string, version: number) { const r = registry.describe(name, version); return { id: r.id, version, schemaHash: r.schemaHash, contractHash: r.contractHash }; }
function fixture(protocol: 1 | 2 = 2, reference = false, legacyTarget = false) {
  const source = customFieldPayloadSchema.parse({ schemaVersion: 1, entity: ref("tickets.ticket", 2), storageGeneration: id(1), field: { key: "extra", label: "Extra", classification: "confidential",
    storage: reference ? { type: "reference", entity: ref("tickets.ticket", 9) } : { type: "integer" } } });
  const base = customFieldPayloadSchema.parse({ ...source, entity: ref("tickets.ticket", legacyTarget ? 5 : 9), storageGeneration: id(2), field: { ...source.field,
    storage: reference ? { type: "reference", entity: ref("tickets.ticket", 9) } : { type: "decimal" } } });
  const target = protocol === 2 ? conditionalFieldPayloadSchema.parse({ ...base, schemaVersion: 2,
    requiredIf: { match: "all", predicates: [{ source: { kind: "native", fieldId: "status" }, operator: "present" }] } }) : base;
  const packet = { schemaVersion: protocol, id: id(3), organisationId: "company", definitionId: id(4), definitionRevision: 7,
    principal: { userId: "actor", membershipId: "member", organisationId: "company", authVersion: 1, sessionVersion: 2, authority: "customer" },
    source: { versionId: id(5), versionChecksum: "c".repeat(64), payload: source }, target: { draftId: id(6), draftRevision: 9, compiledChecksum: "d".repeat(64), payload: target },
    conversion: { kind: reference ? "same_type" : "integer_to_decimal" }, ownerQuery: ref("tickets.ticket.field_migration", legacyTarget ? 3 : 4) };
  const sealed = protocol === 2 ? sealRequiredFieldMigrationIntent(packet) : sealFieldMigrationIntent(packet);
  const review = (protocol === 2 ? sealRequiredFieldMigrationReview : sealFieldMigrationReview)({ ...sealed.intent,
    cohort: { recordCount: 1, observationDigest: "e".repeat(64) }, summary: { validCount: 1, invalidCount: 0, lossyCount: 0 } });
  const storedReview = { id: id(3), organisationId: "company", definitionId: id(4), ...review };
  saved = { id: id(3), organisationId: "company", definitionId: id(4), entityId: "tickets.ticket", sourceVersionId: id(5), sourceGenerationId: id(1), targetGenerationId: id(2), draftId: id(6),
    state: "REVIEWED", intent: sealed.intent, intentChecksum: sealed.checksum, review: storedReview,
    sourceVersion: { id: id(5), organisationId: "company", definitionId: id(4), checksum: "c".repeat(64), payload: source },
    draft: { payload: { editedAfterCutover: true } } };
  pub = { preparationId: id(3), definitionId: id(4), sourceGenerationId: id(1), targetGenerationId: id(2), reviewChecksum: review.checksum, review: storedReview };
  return sealed;
}
const snapshot = (input: unknown) => registry.invokeQueryInTransaction({ session, transaction: tx }, registry.describe("tickets.ticket.field_migration", 4), input);
const representation = () => registry.invokeQueryInTransaction({ session, transaction: tx }, registry.describe("tickets.ticket.field_representation", 2), { preparationId: id(3), observationId: id(7) });
const settlement = (mode: "rollback" | "history") => registry.invokeQueryInTransaction({ session, transaction: tx }, registry.describe("tickets.ticket.field_settlement", 2), { preparationId: id(3), mode });
beforeEach(() => {
  vi.resetAllMocks(); registry = new CapabilityRegistry(async () => true); registry.register("tickets", ticketStudioContract); fixture();
  m.enabled.mockResolvedValue({ id: "module" }); m.member.mockResolvedValue({ id: "member", sessionVersion: 2, user: { authVersion: 1 } });
  m.native.mockImplementation(async ({ where }) => where.OR ? null : { id: "ticket", organisationId: "company", version: 7, queueId: "queue", queue: { restricted: true } });
  m.queueMember.mockResolvedValue({ id: "queue-member" }); m.count.mockResolvedValue(1); m.records.mockResolvedValue([{ id: "ticket", organisationId: "company", version: 7 }]);
  m.preparation.mockImplementation(async () => saved); m.publication.mockImplementation(async () => pub);
  m.observation.mockResolvedValue({ id: id(7), recordId: "ticket", nativeRevision: 7 }); m.cutover.mockResolvedValue({ state: "ACTIVATED" });
  m.raw.mockImplementation(async (strings: TemplateStringsArray) => { const sql = strings.join("?"); return sql.includes("SHOW transaction_isolation") ? [{ transaction_isolation: "serializable" }]
    : sql.includes("AS changed") ? [{ changed: false }] : sql.includes("AS fresh") ? [{ fresh: true }] : []; });
});
it("registers current native9 dual-format snapshot/representation and retains legacy creation/candidate and native5 settlement coverage", async () => {
  const current = registry.describe("tickets.ticket", 9), record = entityDetailsSchema.parse(current.details).record!;
  expect(record.migrationSnapshot).toMatchObject({ query: { version: 4 }, intentVersions: [1, 2], sourceVersions: [2, 3, 4, 5, 6, 7, 8, 9], referenceVersions: [1, 2, 3, 4, 5, 6, 7, 8, 9] });
  expect(record.migrationRepresentation).toMatchObject({ query: { version: 2 }, intentVersions: [1, 2] });
  expect(record.initialisation?.acceptedFieldVersions).toEqual([2, 3, 4, 5, 6, 7, 8, 9]); expect(record.requiredCoverage?.fieldVersions).toEqual(record.initialisation?.acceptedFieldVersions);
  expect(registry.describe("tickets.ticket.field_settlement", 2).details.fieldSettlement).toMatchObject({ intentVersions: [1, 2], targetVersions: [5, 9] });
  expect((await registry.resolveFieldSettlement(session, ref("tickets.ticket", 2), ref("tickets.ticket", 5), 1)).version).toBe(2);
  expect(registry.describe("tickets.ticket", 7).contractHash).toBe("5f69287becebbd7658245afc78b1a1eabf30b297e0613d5a07db7b9ecf9655d8");
});
it("supports actual stored intent1 and2 canonical coverage without interpreting a client format or altering legacy queries", async () => {
  for (const protocol of [1, 2] as const) { fixture(protocol); expect(await snapshot({ mode: "coverage", preparationId: id(3) })).toMatchObject({ count: 1, nativeCoverageComplete: true }); }
  expect(await snapshot({ mode: "snapshot" })).toMatchObject({ records: [{ recordId: "ticket", organisationId: "company", revision: 7 }] });
  await expect(snapshot({ mode: "coverage", preparationId: id(3), schemaVersion: 2 })).rejects.toThrow();
  m.raw.mockImplementation(async strings => strings.join("?").includes("SHOW transaction_isolation") ? [{ transaction_isolation: "serializable" }] : [{ changed: true }]);
  m.count.mockClear(); await expect(snapshot({ mode: "coverage", preparationId: id(3) })).rejects.toThrow("MIGRATION_COHORT_CHANGED"); expect(m.count).not.toHaveBeenCalled();
});
it("rejects unknown/coerced/hash/tenant/source identities before a coverage count", async () => {
  const original = structuredClone(saved) as Record<string, unknown>;
  for (const bad of [{ ...original, intentChecksum: "f".repeat(64) }, { ...original, organisationId: "foreign" },
    { ...original, intent: { ...(original.intent as object), schemaVersion: "2" } }, { ...original, intent: { ...(original.intent as object), schemaVersion: 3 } },
    { ...original, sourceVersionId: id(55) }, { ...original, sourceVersion: { ...(original.sourceVersion as object), payload: {} } }]) {
    saved = bad; m.count.mockClear(); await expect(snapshot({ mode: "coverage", preparationId: id(3) })).rejects.toThrow(); expect(m.count).not.toHaveBeenCalled();
  }
});
it("keeps private/member/module/Serializable checks ahead of stored metadata, IDs and counts", async () => {
  m.native.mockResolvedValue({ id: "private" }); await expect(snapshot({ mode: "coverage", preparationId: id(3) })).rejects.toThrow("MIGRATION_ACCESS_REQUIRED");
  expect(m.preparation).not.toHaveBeenCalled(); expect(m.count).not.toHaveBeenCalled(); expect(m.records).not.toHaveBeenCalled();
  m.native.mockResolvedValue(null); m.member.mockResolvedValue(null); await expect(settlement("history")).rejects.toThrow("current company membership");
  m.member.mockResolvedValue({ id: "member" }); m.raw.mockResolvedValue([{ transaction_isolation: "read committed" }]); await expect(representation()).rejects.toThrow("serializable");
});
it("validates current retained reference coverage from immutable intent without assuming an editable current draft", async () => {
  fixture(2, true); expect(await snapshot({ mode: "reference_coverage", preparationId: id(3) })).toMatchObject({ nativeReferenceCoverageComplete: true });
  m.raw.mockImplementation(async strings => strings.join("?").includes("SHOW transaction_isolation") ? [{ transaction_isolation: "serializable" }] : [{ changed: true }]);
  await expect(snapshot({ mode: "reference_coverage", preparationId: id(3) })).rejects.toThrow("MIGRATION_REFERENCE_COVERAGE_CHANGED");
});
it("approves both reviewed formats only as representation, with exact principal/native/freshness and queue checks", async () => {
  for (const protocol of [1, 2] as const) { fixture(protocol); expect(await representation()).toMatchObject({ recordId: "ticket", revision: 7, representationOnly: true }); }
  m.queueMember.mockResolvedValue(null); await expect(representation()).rejects.toThrow("MIGRATION_REPRESENTATION_UNAVAILABLE"); m.queueMember.mockResolvedValue({ id: "member" });
  m.member.mockResolvedValue({ id: "member", sessionVersion: 3, user: { authVersion: 1 } }); await expect(representation()).rejects.toThrow("MIGRATION_REPRESENTATION_UNAVAILABLE");
});
it("current settlement explicitly serves retained native5 v1 and current native9 formats1/2 without draft assumptions or actor impersonation", async () => {
  for (const [protocol, legacyTarget] of [[1, true], [1, false], [2, false]] as const) {
    fixture(protocol, false, legacyTarget); expect(await settlement("history")).toMatchObject({ nativeCoverageComplete: true }); expect(await settlement("rollback")).toMatchObject({ nativeCoverageComplete: true });
  }
  m.cutover.mockResolvedValue({ state: "FINALIZED" }); await expect(settlement("rollback")).rejects.toThrow("current ticket history coverage");
});
it("denies forged current review hashes or mirrors and preserves the source metadata rather than changing it", async () => {
  const before = structuredClone(saved); pub = { ...(pub as object), reviewChecksum: "f".repeat(64) };
  await expect(representation()).rejects.toThrow("MIGRATION_REPRESENTATION_UNAVAILABLE"); expect(saved).toEqual(before);
  fixture(); const bad = saved as { review: { organisationId: string } }; bad.review.organisationId = "foreign";
  await expect(settlement("history")).rejects.toThrow("stale or has changed");
});
