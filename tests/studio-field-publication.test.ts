import { beforeEach, expect, it, vi } from "vitest";
import type { Session } from "@/core/auth/session";
import type { FieldMigrationPublicationPin } from "@/core/studio/fields/migrations/publication-contract";
const m = vi.hoisted(() => ({ initial: vi.fn(), transaction: vi.fn(), resolve: vi.fn(), enabled: vi.fn(), raw: vi.fn(), member: vi.fn(), module: vi.fn(), company: vi.fn(),
  preparation: vi.fn(), publication: vi.fn(), createPublication: vi.fn(), draft: vi.fn(), updateDraft: vi.fn(), updateDefinition: vi.fn(), countModules: vi.fn(),
  createVersion: vi.fn(), version: vi.fn(), binding: vi.fn(), generation: vi.fn(), createGeneration: vi.fn(), audit: vi.fn(), inspect: vi.fn(), execution: vi.fn(), executionInspection: vi.fn() }));
vi.mock("@/core/db/client", () => ({ db: { $transaction: m.transaction, studioFieldMigrationPreparation: { findFirst: m.initial } } }));
vi.mock("@/core/studio/fields/principal", () => ({ resolveFieldMigrationPrincipal: m.resolve }));
vi.mock("@/core/modules/access", () => ({ assertModuleEnabled: m.enabled }));
vi.mock("@/core/studio/registry/runtime", () => ({ studioRegistry: () => registry }));
vi.mock("@/core/studio/fields/migrations/inspection", () => ({ inspectFieldMigrationReview: m.inspect }));
vi.mock("@/core/studio/fields/migrations/execution-inspection", () => ({ inspectFieldMigrationExecution: m.executionInspection }));
import { CapabilityRegistry } from "@/core/studio/registry/registry";
import { ticketStudioContract } from "@/core/service-work/studio";
import { compileCustomField } from "@/core/studio/compiler/fields";
import { customFieldPayloadSchema } from "@/core/studio/fields/schema";
import { sealFieldMigrationIntent, sealFieldMigrationReview } from "@/core/studio/fields/migrations/contracts";
import { publishReviewedFieldMigration } from "@/core/studio/fields/migrations/publication";
const uuid = (value: number) => `00000000-0000-4000-8000-${value.toString().padStart(12, "0")}`;
const registry = new CapabilityRegistry(async () => true); registry.register("tickets", ticketStudioContract);
const ref = (id: string, version: number) => { const meta = registry.describe(id, version); return { id, version, schemaHash: meta.schemaHash, contractHash: meta.contractHash }; };
const session: Session = { userId: "user", userName: "User", userEmail: "user@example.invalid", membershipId: "member", organisationId: "company", organisationName: "Company",
  capabilities: new Set(["studio.definition.publish", "tickets.ticket.read", "tickets.ticket.manage"]) };
const principal = { organisationId: "company", userId: "user", membershipId: "member", sessionVersion: 2, authVersion: 3, authority: "customer" as const };
const source = customFieldPayloadSchema.parse({ schemaVersion: 1, entity: ref("tickets.ticket", 2), storageGeneration: uuid(1),
  field: { key: "extra", label: "Extra", classification: "confidential", storage: { type: "integer" } } });
const target = customFieldPayloadSchema.parse({ ...source, entity: ref("tickets.ticket", 3), storageGeneration: uuid(2), field: { ...source.field, storage: { type: "decimal" } } });
let sealed: ReturnType<typeof sealFieldMigrationReview>, prepared: { id: string; organisationId: string; state: string; revision: number; intent: unknown; intentChecksum: string; review: { review: unknown; checksum: string } };
let draft: { id: string; organisationId: string; definitionId: string; revision: number; payload: unknown; baseVersion: { version: number };
  definition: { id: string; organisationId: string; kind: string; key: string; revision: number; latestVersion: number; activeVersionId: string } };
let publication: (FieldMigrationPublicationPin & { state: string; revision: number }) | null;
let generations: string[], versions: Array<{ id: string; organisationId: string; definitionId: string; version: number; payload: unknown; compiledPlan: unknown; checksum: string }>;
const tx = { $queryRaw: m.raw, membership: { findFirst: m.member }, moduleState: { findFirst: m.module, count: m.countModules }, organisation: { findFirst: m.company },
  studioFieldMigrationPreparation: { findFirst: m.preparation }, studioFieldMigrationPublication: { findFirst: m.publication, create: m.createPublication },
  studioFieldMigrationExecution: { findFirst: m.execution }, studioDraft: { findFirst: m.draft, updateMany: m.updateDraft }, studioDefinition: { updateMany: m.updateDefinition },
  studioDefinitionVersion: { create: m.createVersion, findFirst: m.version }, studioFieldBinding: { findFirst: m.binding },
  studioFieldGeneration: { findFirst: m.generation, create: m.createGeneration }, auditEntry: { create: m.audit } };
const request = () => ({ preparationId: uuid(3), revision: 5, reviewChecksum: sealed.checksum, acknowledgeWarnings: false, acknowledgeLoss: false });
beforeEach(async () => {
  vi.clearAllMocks(); m.resolve.mockResolvedValue(session); m.enabled.mockResolvedValue(undefined); m.raw.mockResolvedValue([]);
  m.member.mockResolvedValue({ id: "member", sessionVersion: 2, user: { authVersion: 3 } }); m.module.mockResolvedValue({ id: "enabled" }); m.countModules.mockResolvedValue(1);
  m.company.mockResolvedValue({ id: "company", kind: "CUSTOMER", status: "ACTIVE", archivedAt: null, isTest: true });
  const compiled = await compileCustomField(session, source, registry), next = await compileCustomField(session, target, registry);
  const pinned = sealFieldMigrationIntent({ schemaVersion: 1, id: uuid(3), organisationId: "company", definitionId: uuid(4), definitionRevision: 7, principal,
    source: { versionId: uuid(6), versionChecksum: compiled.checksum, payload: source }, target: { draftId: uuid(5), draftRevision: 9, compiledChecksum: next.checksum, payload: target },
    conversion: { kind: "integer_to_decimal" }, ownerQuery: ref("tickets.ticket.field_migration", 1) });
  sealed = sealFieldMigrationReview({ ...pinned.intent, cohort: { recordCount: 3, observationDigest: "a".repeat(64) }, summary: { validCount: 3, invalidCount: 0, lossyCount: 0 } });
  prepared = { id: uuid(3), organisationId: "company", state: "REVIEWED", revision: 5, intent: pinned.intent, intentChecksum: pinned.checksum, review: { review: sealed.review, checksum: sealed.checksum } };
  draft = { id: uuid(5), organisationId: "company", definitionId: uuid(4), revision: 9, payload: structuredClone(target), baseVersion: { version: 1 },
    definition: { id: uuid(4), organisationId: "company", kind: "customField", key: "tickets.ticket.extra", revision: 7, latestVersion: 1, activeVersionId: uuid(6) } };
  publication = null; versions = []; generations = [source.storageGeneration];
  m.initial.mockImplementation(async ({ where }) => where.id === prepared.id && where.organisationId === prepared.organisationId ? structuredClone(prepared) : null);
  m.preparation.mockImplementation(async () => structuredClone(prepared)); m.publication.mockImplementation(async () => structuredClone(publication));
  m.inspect.mockImplementation(async () => structuredClone(sealed)); m.execution.mockResolvedValue(null); m.executionInspection.mockImplementation(async () => ({ stored: structuredClone(sealed) })); m.draft.mockImplementation(async () => structuredClone(draft));
  m.updateDefinition.mockImplementation(async ({ where }) => {
    if (where.revision !== draft.definition.revision) return { count: 0 };
    draft.definition.revision++; draft.definition.latestVersion++; return { count: 1 };
  });
  m.updateDraft.mockImplementation(async ({ where }) => { if (where.revision !== draft.revision) return { count: 0 }; draft.revision++; draft.baseVersion = { version: draft.definition.latestVersion }; return { count: 1 }; });
  m.createVersion.mockImplementation(async ({ data }) => { const row = { id: uuid(8), organisationId: data.organisationId, definitionId: data.definitionId, version: data.version,
    payload: data.payload, compiledPlan: data.compiledPlan, checksum: data.checksum }; versions.push(row); return row; });
  m.version.mockImplementation(async () => structuredClone(versions[0])); m.binding.mockResolvedValue({ id: uuid(4) });
  m.generation.mockImplementation(async ({ where }) => generations.includes(where.id) ? { id: where.id } : null);
  m.createGeneration.mockImplementation(async ({ data }) => { generations.push(data.id); return data; });
  m.createPublication.mockImplementation(async ({ data }) => { publication = { ...data, state: "PUBLISHED", revision: 0 }; return { revision: 0 }; }); m.audit.mockResolvedValue({ id: "audit" });
  m.transaction.mockImplementation(async (run: (client: typeof tx) => Promise<unknown>) => {
    const before = structuredClone({ draft, publication, versions, generations });
    try { return await run(tx); } catch (error) { ({ draft, publication, versions, generations } = before); throw error; }
  });
});

it("uses the shared publisher and reviewed binder, retains source active/history, and atomically pins exact receipt plus Audit", async () => {
  const result = await publishReviewedFieldMigration(session, request());
  expect(result).toMatchObject({ id: uuid(3), state: "PUBLISHED", publicationRevision: 0, preparationRevision: 5, targetVersionId: uuid(8), sourceVersionId: uuid(6), replayed: false });
  expect(draft.definition.activeVersionId).toBe(uuid(6)); expect(draft.definition.revision).toBe(8); expect(draft.revision).toBe(10);
  expect(generations).toEqual([source.storageGeneration, target.storageGeneration]); expect(versions[0].payload).toEqual(target);
  expect(publication).toMatchObject({ reviewChecksum: sealed.checksum, sourceGenerationId: uuid(1), targetGenerationId: uuid(2), publisherUserId: session.userId, acknowledgedLoss: false });
  expect(m.inspect.mock.calls[0].at(-1)).toBe("preparation");
  expect(m.audit.mock.calls.map(([args]) => args.data.action)).toEqual(["studio.definition.published", "studio.field.migration.published"]);
  expect(m.transaction).toHaveBeenCalledWith(expect.any(Function), { isolationLevel: "Serializable" });
});

it("lost-response replay refreshes exact publication/source/permission inspection and writes no second version, generation, receipt or Audit", async () => {
  const first = await publishReviewedFieldMigration(session, request()); m.createVersion.mockClear(); m.createGeneration.mockClear(); m.createPublication.mockClear(); m.audit.mockClear();
  expect(await publishReviewedFieldMigration(session, request())).toEqual({ ...first, replayed: true });
  expect(m.inspect.mock.calls.at(-1)?.at(-1)).toBe("publication");
  for (const write of [m.createVersion, m.createGeneration, m.createPublication, m.audit]) expect(write).not.toHaveBeenCalled();
  m.inspect.mockRejectedValue(new Error("FORBIDDEN: current private source access revoked"));
  await expect(publishReviewedFieldMigration(session, request())).rejects.toThrow("private source access revoked");
});

it("foreign/client authority, review revision/checksum, unreviewed state and changed target cannot reach publication", async () => {
  for (const value of [{ ...request(), organisationId: "other" }, { ...request(), principal }, { ...request(), compiledPlan: {} }, { ...request(), targetVersionId: uuid(20) }])
    await expect(publishReviewedFieldMigration(session, value)).rejects.toThrow();
  await expect(publishReviewedFieldMigration({ ...session, organisationId: "other" }, request())).rejects.toThrow("stale or has changed");
  await expect(publishReviewedFieldMigration(session, { ...request(), revision: 4 })).rejects.toThrow("stale or has changed");
  await expect(publishReviewedFieldMigration(session, { ...request(), reviewChecksum: "f".repeat(64) })).rejects.toThrow("stale or has changed");
  prepared.state = "PREPARING"; await expect(publishReviewedFieldMigration(session, request())).rejects.toThrow("stale or has changed"); prepared.state = "REVIEWED";
  draft.payload = { ...target, field: { ...target.field, label: "Changed after review" } };
  await expect(publishReviewedFieldMigration(session, request())).rejects.toThrow("stale or has changed");
  expect(m.createVersion).not.toHaveBeenCalled(); expect(m.createPublication).not.toHaveBeenCalled();
});

it("invalid rows or unacknowledged loss block the shared publisher before any target metadata", async () => {
  sealed = sealFieldMigrationReview({ ...sealed.review, summary: { validCount: 2, invalidCount: 1, lossyCount: 0 } }); prepared.review = { review: sealed.review, checksum: sealed.checksum };
  await expect(publishReviewedFieldMigration(session, request())).rejects.toThrow("MIGRATION_INVALID_VALUES");
  sealed = sealFieldMigrationReview({ ...sealed.review, summary: { validCount: 3, invalidCount: 0, lossyCount: 1 } }); prepared.review = { review: sealed.review, checksum: sealed.checksum };
  await expect(publishReviewedFieldMigration(session, request())).rejects.toThrow("MIGRATION_LOSS_ACKNOWLEDGEMENT_REQUIRED");
  expect(m.createVersion).not.toHaveBeenCalled();
  expect(await publishReviewedFieldMigration(session, { ...request(), acknowledgeLoss: true })).toMatchObject({ state: "PUBLISHED", replayed: false });
  expect(publication?.acknowledgedLoss).toBe(true);
});

it("revoked publisher/principal, private source, changed archive and corrupt review deny before target publication", async () => {
  await expect(publishReviewedFieldMigration({ ...session, capabilities: new Set(["tickets.ticket.read"]) }, request())).rejects.toThrow("FORBIDDEN");
  expect(m.initial).not.toHaveBeenCalled();
  m.resolve.mockRejectedValueOnce(new Error("FORBIDDEN: initiating membership revoked"));
  await expect(publishReviewedFieldMigration(session, request())).rejects.toThrow("initiating membership revoked");
  m.inspect.mockRejectedValueOnce(new Error("MIGRATION_ACCESS_REQUIRED: private source"));
  await expect(publishReviewedFieldMigration(session, request())).rejects.toThrow("private source");
  m.inspect.mockResolvedValueOnce(sealFieldMigrationReview({ ...sealed.review, cohort: { ...sealed.review.cohort, observationDigest: "f".repeat(64) } }));
  await expect(publishReviewedFieldMigration(session, request())).rejects.toThrow("stale or has changed");
  prepared.review.checksum = "f".repeat(64);
  await expect(publishReviewedFieldMigration(session, request())).rejects.toThrow("stale or has changed");
  expect(m.createVersion).not.toHaveBeenCalled(); expect(m.createPublication).not.toHaveBeenCalled(); expect(m.audit).not.toHaveBeenCalled();
});

it("missing binding, lost definition/draft CAS or either Audit failure rolls back all target metadata; same request can retry", async () => {
  const before = structuredClone(draft);
  m.binding.mockResolvedValueOnce(null); await expect(publishReviewedFieldMigration(session, request())).rejects.toThrow("stale or has changed");
  m.updateDefinition.mockResolvedValueOnce({ count: 0 }); await expect(publishReviewedFieldMigration(session, request())).rejects.toThrow("CONFLICT");
  m.updateDraft.mockResolvedValueOnce({ count: 0 }); await expect(publishReviewedFieldMigration(session, request())).rejects.toThrow("CONFLICT");
  m.audit.mockRejectedValueOnce(new Error("ordinary Audit unavailable")); await expect(publishReviewedFieldMigration(session, request())).rejects.toThrow("ordinary Audit unavailable");
  m.audit.mockResolvedValueOnce({ id: "ordinary" }).mockRejectedValueOnce(new Error("publication Audit unavailable"));
  await expect(publishReviewedFieldMigration(session, request())).rejects.toThrow("publication Audit unavailable");
  expect(draft).toEqual(before); expect(publication).toBeNull(); expect(versions).toEqual([]); expect(generations).toEqual([source.storageGeneration]);
  expect(await publishReviewedFieldMigration(session, request())).toMatchObject({ state: "PUBLISHED", replayed: false });
});

it("cancelled publication and changed published target are not replay authority", async () => {
  await publishReviewedFieldMigration(session, request()); publication!.state = "CANCELLED"; m.inspect.mockClear();
  await expect(publishReviewedFieldMigration(session, request())).rejects.toThrow("stale or has changed"); expect(m.inspect).not.toHaveBeenCalled();
  publication!.state = "PUBLISHED"; versions[0].checksum = "f".repeat(64); m.audit.mockClear();
  await expect(publishReviewedFieldMigration(session, request())).rejects.toThrow("stale or has changed"); expect(m.audit).not.toHaveBeenCalled();
});

it("publication replay after recorded execution delegates to the single exact execution inspector, and revocation cannot replay", async () => {
  const first = await publishReviewedFieldMigration(session, request()); m.inspect.mockClear(); m.audit.mockClear();
  m.execution.mockResolvedValue({ preparationId: uuid(3) });
  expect(await publishReviewedFieldMigration(session, request())).toEqual({ ...first, replayed: true });
  expect(m.inspect).not.toHaveBeenCalled(); expect(m.executionInspection).toHaveBeenCalledTimes(1); expect(m.audit).not.toHaveBeenCalled();
  m.executionInspection.mockRejectedValueOnce(new Error("FORBIDDEN: current written/private execution access revoked"));
  await expect(publishReviewedFieldMigration(session, request())).rejects.toThrow("written/private execution access revoked"); expect(m.audit).not.toHaveBeenCalled();
});
