import { beforeEach, expect, it, vi } from "vitest";
import type { Prisma } from "@/generated/prisma/client";
import type { Session } from "@/core/auth/session";
const m = vi.hoisted(() => ({ module: vi.fn(), member: vi.fn(), native: vi.fn(), publication: vi.fn(), observation: vi.fn(), queueMember: vi.fn(), raw: vi.fn() }));
vi.mock("@/core/db/client", () => ({ db: {} }));
import { ticketStudioContract } from "@/core/service-work/studio";
import { CapabilityRegistry } from "@/core/studio/registry/registry";
import { customFieldPayloadSchema } from "@/core/studio/fields/schema";
import { sealFieldMigrationReview } from "@/core/studio/fields/migrations/contracts";
import { entityDetailsSchema } from "@/core/studio/registry/entities";
const registry = new CapabilityRegistry(async () => true); registry.register("tickets", ticketStudioContract);
const actor: Session = { userId: "actor", userName: "Actor", userEmail: "actor@example.invalid", membershipId: "member", organisationId: "company", organisationName: "Company", capabilities: new Set(["tickets.ticket.read", "tickets.ticket.manage"]) };
const uuid = (n: number) => `00000000-0000-4000-8000-${n.toString().padStart(12, "0")}`;
const ref = (id: string, version: number) => { const meta = registry.describe(id, version); return { id: meta.id, version, schemaHash: meta.schemaHash, contractHash: meta.contractHash }; };
const source = customFieldPayloadSchema.parse({ schemaVersion: 1, entity: ref("tickets.ticket", 2), storageGeneration: uuid(1), field: { key: "extra", label: "Extra", classification: "confidential", storage: { type: "integer" } } });
const target = customFieldPayloadSchema.parse({ ...source, entity: ref("tickets.ticket", 5), storageGeneration: uuid(2), field: { ...source.field, storage: { type: "decimal" } } });
const review = () => sealFieldMigrationReview({ schemaVersion: 1, id: uuid(3), organisationId: "company", definitionId: uuid(4), definitionRevision: 7,
  principal: { organisationId: "company", userId: "actor", membershipId: "member", sessionVersion: 2, authVersion: 3, authority: "customer" },
  source: { versionId: uuid(5), versionChecksum: "c".repeat(64), payload: source }, target: { draftId: uuid(6), draftRevision: 9, compiledChecksum: "d".repeat(64), payload: target },
  conversion: { kind: "integer_to_decimal" }, ownerQuery: ref("tickets.ticket.field_migration", 3),
  cohort: { recordCount: 2, observationDigest: "f".repeat(64) }, summary: { validCount: 2, invalidCount: 0, lossyCount: 0 } });
const tx = { $queryRaw: m.raw, moduleState: { findFirst: m.module }, membership: { findFirst: m.member },
  serviceWorkItem: { findFirst: m.native }, serviceQueueMember: { findFirst: m.queueMember }, studioFieldMigrationPublication: { findFirst: m.publication }, studioFieldMigrationObservation: { findFirst: m.observation } } as unknown as Prisma.TransactionClient;
const query = registry.describe("tickets.ticket.field_representation", 1), request = { preparationId: uuid(3), observationId: uuid(7) };
const run = (session = actor, input: unknown = request) => registry.invokeQueryInTransaction({ session, transaction: tx }, query, input);
let pub: { preparationId: string; definitionId: string; reviewChecksum: string; sourceGenerationId: string; targetGenerationId: string; review: ReturnType<typeof review> };
let native: { id: string; organisationId: string; version: number; queueId: string; queue: { restricted: boolean }; status: string; mergedIntoId: string | null };
beforeEach(() => {
  vi.clearAllMocks(); const sealed = review(); pub = { preparationId: uuid(3), definitionId: uuid(4), reviewChecksum: sealed.checksum, sourceGenerationId: uuid(1), targetGenerationId: uuid(2), review: sealed };
  native = { id: "ticket_1", organisationId: "company", version: 5, queueId: "private", queue: { restricted: true }, status: "CLOSED", mergedIntoId: "ticket_2" };
  m.module.mockResolvedValue({ id: "module" }); m.member.mockResolvedValue({ id: "member", sessionVersion: 2, user: { authVersion: 3 } });
  m.native.mockImplementation(async (args) => "OR" in args.where ? null : native);
  m.publication.mockImplementation(async () => pub); m.observation.mockResolvedValue({ id: uuid(7), recordId: "ticket_1", nativeRevision: 5 }); m.queueMember.mockResolvedValue({ id: "member" });
  m.raw.mockImplementation(async (strings: TemplateStringsArray) => strings.join("?").includes("SHOW transaction_isolation") ? [{ transaction_isolation: "serializable" }]
    : strings.join("?").includes("AS fresh") ? [{ fresh: true }] : []);
});
it("only new v5 explicitly opts into persisted representation approval; old entities remain read/extend only", () => {
  for (const version of [1, 2, 3, 4]) expect(entityDetailsSchema.parse(registry.describe("tickets.ticket", version).details).record?.migrationRepresentation).toBeUndefined();
  expect(entityDetailsSchema.parse(registry.describe("tickets.ticket", 5).details).record?.migrationRepresentation).toEqual({ query: { id: query.id, version: 1 }, sourceVersions: [2, 3, 4, 5] });
  expect(entityDetailsSchema.parse(registry.describe("tickets.ticket", 5).details).record?.migrationSnapshot).toMatchObject({ query: { id: "tickets.ticket.field_migration", version: 3 }, sourceVersions: [2, 3, 4, 5], referenceVersions: [1, 2, 3, 4, 5] });
});
it("approves only the locked observed canonical representation, even for final/merged work, with no native mutation or values", async () => {
  expect(await run()).toEqual({ recordId: "ticket_1", organisationId: "company", revision: 5, preparationId: uuid(3), observationId: uuid(7), representationOnly: true });
  expect(m.publication).toHaveBeenCalledWith(expect.objectContaining({ where: { preparationId: uuid(3), organisationId: "company", state: "PUBLISHED" } }));
  expect(m.observation).toHaveBeenCalledWith(expect.objectContaining({ where: expect.objectContaining({ organisationId: "company", definitionId: uuid(4), sourceGenerationId: uuid(1) }) }));
  expect(m.raw.mock.calls.some(([strings]) => strings.join("?").includes("service_work_items") && strings.join("?").includes("FOR UPDATE"))).toBe(true);
  await expect(registry.authoriseRecord({ session: actor, transaction: tx }, registry.describe("tickets.ticket", 5), { recordId: "ticket_1", intent: "extend", expectedRevision: 5 })).rejects.toThrow("Reopen active ticket");
});
it("transaction/native permissions, enabled source, actual membership and complete private access precede publication details", async () => {
  await expect(registry.invoke(actor, query, request)).rejects.toThrow("shared server transaction");
  await expect(run({ ...actor, capabilities: new Set(["tickets.ticket.read"]) })).rejects.toThrow("tickets.ticket.manage");
  m.module.mockResolvedValue(null); await expect(run()).rejects.toThrow("unavailable"); m.module.mockResolvedValue({ id: "module" });
  m.member.mockResolvedValue(null); await expect(run()).rejects.toThrow("MIGRATION_ACCESS_REQUIRED"); m.member.mockResolvedValue({ id: "member" });
  m.native.mockResolvedValue({ id: "hidden" }); await expect(run()).rejects.toThrow("MIGRATION_ACCESS_REQUIRED");
  expect(m.publication).not.toHaveBeenCalled(); expect(m.observation).not.toHaveBeenCalled();
});
it("rejects client scope/native patches, missing or cancelled publication and substituted actor/generation/checksum before record lookup", async () => {
  for (const input of [{ ...request, organisationId: "other" }, { ...request, recordId: "other" }, { ...request, reviewed: true }, { ...request, status: "OPEN" }]) await expect(run(actor, input)).rejects.toThrow();
  m.publication.mockResolvedValueOnce(null); await expect(run()).rejects.toThrow("MIGRATION_REPRESENTATION_UNAVAILABLE");
  const baseline = structuredClone(pub);
  for (const change of [() => { pub.reviewChecksum = "0".repeat(64); }, () => { pub.sourceGenerationId = uuid(99); }, () => {
    pub.review = sealFieldMigrationReview({ ...pub.review.review, principal: { ...pub.review.review.principal, userId: "other" } }); pub.reviewChecksum = pub.review.checksum;
  }, () => {
    pub.review = sealFieldMigrationReview({ ...pub.review.review, target: { ...pub.review.review.target, payload: { ...target, entity: ref("tickets.ticket", 4) } } }); pub.reviewChecksum = pub.review.checksum;
  }]) { pub = structuredClone(baseline); change(); await expect(run()).rejects.toThrow(); }
  expect(m.observation).not.toHaveBeenCalled();
});
it("current auth/session versions and exact metadata transition are required on every replay", async () => {
  for (const bad of [{ sessionVersion: 3, user: { authVersion: 3 } }, { sessionVersion: 2, user: { authVersion: 4 } }]) {
    m.member.mockResolvedValue(bad); await expect(run()).rejects.toThrow("MIGRATION_REPRESENTATION_UNAVAILABLE");
  }
  m.member.mockResolvedValue({ sessionVersion: 2, user: { authVersion: 3 } });
  m.raw.mockImplementation(async (strings: TemplateStringsArray) => strings.join("?").includes("SHOW transaction_isolation") ? [{ transaction_isolation: "serializable" }] : [{ fresh: false }]);
  await expect(run()).rejects.toThrow("MIGRATION_REPRESENTATION_UNAVAILABLE"); expect(m.observation).not.toHaveBeenCalled();
});
it("missing/foreign observation, changed native revision and restricted membership revoke approval generically", async () => {
  m.observation.mockResolvedValueOnce(null); await expect(run()).rejects.toThrow("MIGRATION_REPRESENTATION_UNAVAILABLE");
  native.version = 6; await expect(run()).rejects.toThrow("MIGRATION_REPRESENTATION_UNAVAILABLE"); native.version = 5;
  native.organisationId = "other"; await expect(run()).rejects.toThrow("MIGRATION_REPRESENTATION_UNAVAILABLE"); native.organisationId = "company";
  native.id = "substituted"; await expect(run()).rejects.toThrow("MIGRATION_REPRESENTATION_UNAVAILABLE"); native.id = "ticket_1";
  m.queueMember.mockResolvedValue(null); await expect(run()).rejects.toThrow("MIGRATION_REPRESENTATION_UNAVAILABLE");
});
