import { beforeEach, expect, it, vi } from "vitest";
import type { Prisma } from "@/generated/prisma/client";
import type { Session } from "@/core/auth/session";
import { CapabilityRegistry } from "@/core/studio/registry/registry";
import { ticketStudioContract } from "@/core/service-work/studio";
import { compileCustomField } from "@/core/studio/compiler/fields";
import { customFieldPayloadSchema } from "@/core/studio/fields/schema";
import { sealFieldMigrationIntent, type FieldMigrationIntent } from "@/core/studio/fields/migrations/contracts";
import { validateFieldMigrationSourceCoverage } from "@/core/studio/fields/migrations/coverage";

const uuid = (value: number) => `00000000-0000-4000-8000-${value.toString().padStart(12, "0")}`;
const registry = new CapabilityRegistry(async () => true); registry.register("tickets", ticketStudioContract);
const ref = (id: string, version: number) => { const meta = registry.describe(id, version); return { id, version, schemaHash: meta.schemaHash, contractHash: meta.contractHash }; };
const session: Session = { userId: "user", userName: "User", userEmail: "user@example.invalid", membershipId: "member", organisationId: "company", organisationName: "Company",
  capabilities: new Set(["studio.definition.publish", "tickets.ticket.read", "tickets.ticket.manage"]) };
const source = customFieldPayloadSchema.parse({ schemaVersion: 1, entity: ref("tickets.ticket", 2), storageGeneration: uuid(1),
  field: { key: "extra", label: "Extra", classification: "confidential", storage: { type: "integer" } } });
const target = customFieldPayloadSchema.parse({ ...source, entity: ref("tickets.ticket", 3), storageGeneration: uuid(2), field: { ...source.field, storage: { type: "decimal" } } });
const company = { id: "company", kind: "CUSTOMER" as const, status: "ACTIVE" as const, archivedAt: null, isTest: true };
const raw = vi.fn(), schemas = vi.fn(), unavailable = vi.fn(), preparation = vi.fn();
const tx = { $queryRaw: raw, studioDefinitionVersion: { findMany: schemas }, studioFieldMigrationPreparation: { findFirst: preparation },
  moduleState: { findFirst: vi.fn(async () => ({ id: "module" })) }, membership: { findFirst: vi.fn(async () => ({ id: "member" })) },
  serviceWorkItem: { findFirst: unavailable, count: vi.fn(async () => 3) } } as unknown as Prisma.TransactionClient;
const context = { session, transaction: tx };
let intent: FieldMigrationIntent, written: { id: string; payload: unknown; compiledPlan: unknown; checksum: string };
let fresh: boolean, publicationFresh: boolean, nativeChanged: boolean, sourceChanged: boolean, executionFresh: boolean, executionSourceChanged: boolean;
let approvalReference: unknown;
beforeEach(async () => {
  vi.clearAllMocks(); fresh = true; publicationFresh = true; nativeChanged = false; sourceChanged = false; executionFresh = true; executionSourceChanged = false;
  approvalReference = ref("tickets.ticket.field_representation", 1);
  const compiled = await compileCustomField(session, source, registry), next = await compileCustomField(session, target, registry);
  intent = sealFieldMigrationIntent({ schemaVersion: 1, id: uuid(3), organisationId: "company", definitionId: uuid(4), definitionRevision: 7,
    principal: { organisationId: "company", userId: "user", membershipId: "member", sessionVersion: 2, authVersion: 3, authority: "customer" },
    source: { versionId: uuid(6), versionChecksum: compiled.checksum, payload: source }, target: { draftId: uuid(5), draftRevision: 9, compiledChecksum: next.checksum, payload: target },
    conversion: { kind: "integer_to_decimal" }, ownerQuery: ref("tickets.ticket.field_migration", 1) }).intent;
  written = { id: uuid(6), payload: structuredClone(source), compiledPlan: compiled.plan, checksum: compiled.checksum };
  schemas.mockImplementation(async () => [written]); unavailable.mockResolvedValue(null); preparation.mockResolvedValue({ id: intent.id });
  raw.mockImplementation(async (strings: TemplateStringsArray) => {
    const sql = strings.join("?");
    if (sql.includes("SHOW transaction_isolation")) return [{ transaction_isolation: "serializable" }];
    if (sql.includes("atlas_studio_migration_fresh")) return [{ fresh }];
    if (sql.includes("atlas_studio_publication_fresh")) return [{ fresh: publicationFresh }];
    if (sql.includes("atlas_studio_execution_fresh")) return [{ fresh: executionFresh, ownerApproval: approvalReference }];
    if (sql.includes("atlas_studio_execution_source_fresh")) return [{ changed: executionSourceChanged }];
    if (sql.includes("SELECT DISTINCT")) return [{ versionId: uuid(6) }];
    if (sql.includes("SELECT EXISTS")) return [{ changed: sql.includes("FROM service_work_items") ? nativeChanged : sourceChanged }];
    return [];
  });
});

it("validates exact owner and source coverage under locks and fetches only distinct written schema metadata", async () => {
  expect(await validateFieldMigrationSourceCoverage(context, registry, company, intent)).toBeUndefined();
  expect(schemas).toHaveBeenCalledWith({ where: { id: { in: [uuid(6)] }, organisationId: "company", definitionId: uuid(4) }, select: { id: true, payload: true, checksum: true, compiledPlan: true } });
  const sql = raw.mock.calls.map(([strings]) => strings.join("?"));
  expect(sql.some(text => text.includes("FOR UPDATE"))).toBe(true); expect(sql.filter(text => text.includes("FOR SHARE OF e") || text.includes("FOR SHARE OF s"))).toHaveLength(2);
  expect(sql.every(text => !/textValue|referenceValue|integerValue|decimalValue|jsonValue/.test(text))).toBe(true);
});

it("rejects foreign actors/companies, missing transaction and live-data permission before archive reads", async () => {
  await expect(validateFieldMigrationSourceCoverage({ ...context, transaction: undefined as unknown as Prisma.TransactionClient }, registry, company, intent)).rejects.toThrow("stale or has changed");
  await expect(validateFieldMigrationSourceCoverage({ ...context, session: { ...session, userId: "other" } }, registry, company, intent)).rejects.toThrow("stale or has changed");
  await expect(validateFieldMigrationSourceCoverage(context, registry, { ...company, id: "other" }, intent)).rejects.toThrow("FORBIDDEN");
  await expect(validateFieldMigrationSourceCoverage(context, registry, { ...company, isTest: false }, intent)).rejects.toThrow("studio.test.live_data");
  expect(raw).not.toHaveBeenCalled(); expect(schemas).not.toHaveBeenCalled();
});

it("requires exact frozen fresh source/draft/compiled pins and correct owner opt-in", async () => {
  fresh = false; await expect(validateFieldMigrationSourceCoverage(context, registry, company, intent)).rejects.toThrow("stale or has changed"); fresh = true;
  await expect(validateFieldMigrationSourceCoverage(context, registry, company, { ...intent, target: { ...intent.target, compiledChecksum: "f".repeat(64) } })).rejects.toThrow("stale or has changed");
  await expect(validateFieldMigrationSourceCoverage(context, registry, company, { ...intent, ownerQuery: ref("tickets.ticket.migration_cohort", 1) })).rejects.toThrow("stale or has changed");
  expect(schemas).not.toHaveBeenCalled();
});

it("owner private or exact native coverage denial occurs before local source or written schema details", async () => {
  unavailable.mockResolvedValue({ id: "private" }); await expect(validateFieldMigrationSourceCoverage(context, registry, company, intent)).rejects.toThrow("MIGRATION_ACCESS_REQUIRED");
  expect(raw.mock.calls.some(([strings]) => strings.join("?").includes("FOR SHARE OF e"))).toBe(false);
  unavailable.mockResolvedValue(null); nativeChanged = true;
  await expect(validateFieldMigrationSourceCoverage(context, registry, company, intent)).rejects.toThrow("MIGRATION_COHORT_CHANGED"); expect(schemas).not.toHaveBeenCalled();
});

it("changed/added/removed source pointers fail even with unchanged owner count/revisions", async () => {
  sourceChanged = true; await expect(validateFieldMigrationSourceCoverage(context, registry, company, intent)).rejects.toThrow("stale or has changed");
  expect(schemas).not.toHaveBeenCalled();
});

it("checks historical field policy and schema integrity without value decoding", async () => {
  written.payload = customFieldPayloadSchema.parse({ ...source, field: { ...source.field, writeCapability: "tickets.field.secret" } });
  await expect(validateFieldMigrationSourceCoverage(context, registry, company, intent)).rejects.toThrow("tickets.field.secret");
  written.payload = source; written.checksum = "f".repeat(64);
  await expect(validateFieldMigrationSourceCoverage(context, registry, company, intent)).rejects.toThrow("stale or has changed");
  written.payload = { ...source, storageGeneration: uuid(9) };
  await expect(validateFieldMigrationSourceCoverage(context, registry, company, intent)).rejects.toThrow("stale or has changed");
  schemas.mockResolvedValue([]); await expect(validateFieldMigrationSourceCoverage(context, registry, company, intent)).rejects.toThrow("stale or has changed");
});

it("publication replay requires a scoped exact receipt; default preparation cannot fall back to it", async () => {
  fresh = false;
  await expect(validateFieldMigrationSourceCoverage(context, registry, company, intent)).rejects.toThrow("stale or has changed");
  expect(raw.mock.calls.some(([strings]) => strings.join("?").includes("atlas_studio_publication_fresh"))).toBe(false);
  raw.mockClear();
  await validateFieldMigrationSourceCoverage(context, registry, company, intent, "publication");
  const receipt = raw.mock.calls.find(([strings]) => strings.join("?").includes("atlas_studio_publication_fresh"));
  expect(receipt?.slice(1)).toEqual([intent.id, session.organisationId, sealFieldMigrationIntent(intent).checksum]);
  expect(receipt?.[0].join("?")).toContain("p.state='REVIEWED' AND pub.state='PUBLISHED'");
  expect(raw.mock.calls.some(([strings]) => strings.join("?").includes("atlas_studio_migration_fresh"))).toBe(false);
});

it("a publication receipt cannot replace current source/written/native or private access, and cancelled/stale receipts fail", async () => {
  publicationFresh = false;
  await expect(validateFieldMigrationSourceCoverage(context, registry, company, intent, "publication")).rejects.toThrow("stale or has changed");
  expect(unavailable).not.toHaveBeenCalled(); expect(schemas).not.toHaveBeenCalled();
  publicationFresh = true; unavailable.mockResolvedValue({ id: "private" });
  await expect(validateFieldMigrationSourceCoverage(context, registry, company, intent, "publication")).rejects.toThrow("MIGRATION_ACCESS_REQUIRED");
  unavailable.mockResolvedValue(null); sourceChanged = true;
  await expect(validateFieldMigrationSourceCoverage(context, registry, company, intent, "publication")).rejects.toThrow("stale or has changed");
  expect(schemas).not.toHaveBeenCalled();
});


async function useExecutableTarget() {
  const payload = customFieldPayloadSchema.parse({ ...target, entity: ref("tickets.ticket", 5) });
  const compiled = await compileCustomField(session, payload, registry);
  intent = sealFieldMigrationIntent({ ...intent, target: { ...intent.target, payload, compiledChecksum: compiled.checksum },
    ownerQuery: ref("tickets.ticket.field_migration", 3) }).intent;
}
it("execution uses only exact actual operation/source lineage; old freshness cannot silently fall back to completed outcomes", async () => {
  await expect(validateFieldMigrationSourceCoverage(context, registry, company, intent, "execution")).rejects.toThrow("stale or has changed");
  expect(raw).not.toHaveBeenCalled();
  await useExecutableTarget(); fresh = false; publicationFresh = false; sourceChanged = true;
  await validateFieldMigrationSourceCoverage(context, registry, company, intent, "execution");
  const sql = raw.mock.calls.map(([strings]) => strings.join("?"));
  expect(sql.some(text => text.includes("atlas_studio_execution_fresh"))).toBe(true);
  expect(sql.some(text => text.includes("atlas_studio_execution_source_fresh"))).toBe(true);
  expect(sql.some(text => text.includes("atlas_studio_publication_fresh") || text.includes("atlas_studio_migration_fresh"))).toBe(false);
  await expect(validateFieldMigrationSourceCoverage(context, registry, company, intent)).rejects.toThrow("stale or has changed");
  await expect(validateFieldMigrationSourceCoverage(context, registry, company, intent, "publication")).rejects.toThrow("stale or has changed");
});
it("execution receipt/approval hashes cannot replace native private/source/written rights or approve unrelated revisions", async () => {
  await useExecutableTarget(); executionFresh = false;
  await expect(validateFieldMigrationSourceCoverage(context, registry, company, intent, "execution")).rejects.toThrow("stale or has changed");
  executionFresh = true; approvalReference = ref("tickets.ticket.field_migration", 3);
  await expect(validateFieldMigrationSourceCoverage(context, registry, company, intent, "execution")).rejects.toThrow("stale or has changed");
  approvalReference = { ...ref("tickets.ticket.field_representation", 1), schemaHash: "0".repeat(64) };
  await expect(validateFieldMigrationSourceCoverage(context, registry, company, intent, "execution")).rejects.toThrow("Studio contract changed");
  expect(schemas).not.toHaveBeenCalled(); approvalReference = ref("tickets.ticket.field_representation", 1);
  unavailable.mockResolvedValue({ id: "hidden" });
  await expect(validateFieldMigrationSourceCoverage(context, registry, company, intent, "execution")).rejects.toThrow("MIGRATION_ACCESS_REQUIRED");
  unavailable.mockResolvedValue(null); nativeChanged = true;
  await expect(validateFieldMigrationSourceCoverage(context, registry, company, intent, "execution")).rejects.toThrow("MIGRATION_COHORT_CHANGED");
  nativeChanged = false; executionSourceChanged = true;
  await expect(validateFieldMigrationSourceCoverage(context, registry, company, intent, "execution")).rejects.toThrow("stale or has changed");
  expect(schemas).not.toHaveBeenCalled(); executionSourceChanged = false;
  written.payload = customFieldPayloadSchema.parse({ ...source, field: { ...source.field, writeCapability: "tickets.field.secret" } });
  await expect(validateFieldMigrationSourceCoverage(context, registry, company, intent, "execution")).rejects.toThrow("tickets.field.secret");
});

it("execution also requires current source/native write and production data permissions before archive access", async () => {
  await useExecutableTarget();
  await expect(validateFieldMigrationSourceCoverage({ ...context, session: { ...session, capabilities: new Set(["studio.definition.publish", "tickets.ticket.read"]) } }, registry, company, intent, "execution")).rejects.toThrow("tickets.ticket.manage");
  await expect(validateFieldMigrationSourceCoverage(context, registry, { ...company, isTest: false }, intent, "execution")).rejects.toThrow("studio.test.live_data");
  expect(raw).not.toHaveBeenCalled(); expect(schemas).not.toHaveBeenCalled();
});
