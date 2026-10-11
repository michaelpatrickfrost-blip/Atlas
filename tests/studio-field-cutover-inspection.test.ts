import { beforeEach, expect, it, vi } from "vitest";
import type { Prisma } from "@/generated/prisma/client";
import type { Session } from "@/core/auth/session";
import { CapabilityRegistry } from "@/core/studio/registry/registry";
import { ticketStudioContract } from "@/core/service-work/studio";
import { compileCustomField } from "@/core/studio/compiler/fields";
import { customFieldPayloadSchema } from "@/core/studio/fields/schema";
import { sealFieldMigrationIntent, sealFieldMigrationReview } from "@/core/studio/fields/migrations/contracts";
import { reviewedFieldPublicationPin } from "@/core/studio/fields/migrations/publication-contract";
import { createFieldMigrationExecutionPin } from "@/core/studio/fields/migrations/execution-contract";
import { createFieldMigrationCutoverPin } from "@/core/studio/fields/migrations/cutover-contract";
import { inspectFieldMigrationCutoverIdentity } from "@/core/studio/fields/migrations/cutover-inspection";

const uuid = (n: number) => `00000000-0000-4000-8000-${n.toString().padStart(12, "0")}`;
const registry = new CapabilityRegistry(async () => true); registry.register("tickets", ticketStudioContract);
const ref = (id: string, version: number) => { const m = registry.describe(id, version); return { id, version, schemaHash: m.schemaHash, contractHash: m.contractHash }; };
const session: Session = { userId: "actor", userName: "Actor", userEmail: "actor@example.invalid", membershipId: "member", organisationId: "company", organisationName: "Company",
  capabilities: new Set(["studio.definition.publish", "tickets.ticket.read", "tickets.ticket.manage"]) };
const sourcePayload = customFieldPayloadSchema.parse({ schemaVersion: 1, entity: ref("tickets.ticket", 2), storageGeneration: uuid(1),
  field: { key: "extra", label: "Extra", classification: "confidential", storage: { type: "integer" } } });
const targetPayload = customFieldPayloadSchema.parse({ ...sourcePayload, entity: ref("tickets.ticket", 5), storageGeneration: uuid(2), field: { ...sourcePayload.field, storage: { type: "decimal" } } });
async function fixture() {
  const a = await compileCustomField(session, sourcePayload, registry), b = await compileCustomField(session, targetPayload, registry);
  const sealedIntent = sealFieldMigrationIntent({ schemaVersion: 1, id: uuid(3), organisationId: "company", definitionId: uuid(4), definitionRevision: 7,
    principal: { organisationId: "company", userId: "actor", membershipId: "member", sessionVersion: 2, authVersion: 3, authority: "customer" },
    source: { versionId: uuid(5), versionChecksum: a.checksum, payload: sourcePayload }, target: { draftId: uuid(6), draftRevision: 9, compiledChecksum: b.checksum, payload: targetPayload },
    conversion: { kind: "integer_to_decimal" }, ownerQuery: ref("tickets.ticket.field_migration", 3) });
  const stored = sealFieldMigrationReview({ ...sealedIntent.intent, cohort: { recordCount: 2, observationDigest: "e".repeat(64) }, summary: { validCount: 2, invalidCount: 0, lossyCount: 0 } });
  const source = { id: uuid(5), organisationId: "company", definitionId: uuid(4), version: 1, payload: sourcePayload, compiledPlan: a.plan, checksum: a.checksum };
  const target = { id: uuid(8), organisationId: "company", definitionId: uuid(4), version: 2, payload: targetPayload, compiledPlan: b.plan, checksum: b.checksum };
  const publication = { ...reviewedFieldPublicationPin(stored, target, "actor", false), state: "PUBLISHED", revision: 0 };
  const owner = await registry.resolve(session, targetPayload.entity), approval = await registry.resolve(session, ref("tickets.ticket.field_representation", 1));
  const pinned = createFieldMigrationExecutionPin(stored, target, publicationIdentity(publication), owner, approval);
  const execution = { preparationId: uuid(3), organisationId: "company", definitionId: uuid(4), entityId: "tickets.ticket", pin: pinned.pin, pinChecksum: pinned.checksum,
    state: "READY", revision: 2, cursor: "ticket_b", processedCount: 2, failureCode: null };
  const definition = { id: uuid(4), organisationId: "company", kind: "customField", activeVersionId: uuid(5), revision: 8, latestVersion: 2, retiredAt: null };
  const cutover = createFieldMigrationCutoverPin(stored, execution, publication, definition);
  return { intent: sealedIntent.intent, preparation: { id: uuid(3), organisationId: "company", definitionId: uuid(4), state: "REVIEWED", intent: sealedIntent.intent, intentChecksum: sealedIntent.checksum,
    review: { review: stored.review, checksum: stored.checksum } }, source, target, publication: { ...publication, state: "CUTOVER", revision: 1 }, execution,
    definition: { ...definition, activeVersionId: target.id, revision: 9 }, draft: { revision: 10, baseVersionId: target.id, payload: targetPayload },
    receipt: { preparationId: uuid(3), organisationId: "company", definitionId: uuid(4), sourceVersionId: source.id, targetVersionId: target.id,
      pin: cutover.pin, pinChecksum: cutover.checksum, state: "ACTIVATED", revision: 0, createdBy: "actor" } };
}
function publicationIdentity<T extends { state: string; revision: number }>(publication: T) {
  return Object.fromEntries(Object.entries(publication).filter(([key]) => key !== "state" && key !== "revision"));
}
let f: Awaited<ReturnType<typeof fixture>>, representationFresh: boolean;
const m = { raw: vi.fn(), preparation: vi.fn(), publication: vi.fn(), execution: vi.fn(), receipt: vi.fn(), definition: vi.fn(), draft: vi.fn(), version: vi.fn() };
const tx = { $queryRaw: m.raw, studioFieldMigrationPreparation: { findFirst: m.preparation }, studioFieldMigrationPublication: { findFirst: m.publication },
  studioFieldMigrationExecution: { findFirst: m.execution }, studioFieldMigrationCutover: { findFirst: m.receipt }, studioDefinition: { findFirst: m.definition },
  studioDraft: { findFirst: m.draft }, studioDefinitionVersion: { findFirst: m.version } } as unknown as Prisma.TransactionClient;
beforeEach(async () => {
  vi.clearAllMocks(); f = await fixture(); representationFresh = true;
  m.raw.mockImplementation(async (strings: TemplateStringsArray) => strings.join("?").includes("AS fresh") ? [{ fresh: representationFresh }] : []);
  for (const key of ["preparation", "publication", "execution", "receipt", "definition", "draft"] as const) m[key].mockImplementation(async () => structuredClone(f[key]));
  m.version.mockImplementation(async ({ where }) => structuredClone(where.id === f.source.id ? f.source : f.target));
});
it("loads only actual tenant receipt and locked reviewed state, retaining old strict predicates", async () => {
  const result = await inspectFieldMigrationCutoverIdentity(tx, f.intent);
  expect(result.pin).toEqual(f.receipt.pin); expect(result.target).toEqual(f.target); expect(result.definition.activeVersionId).toBe(f.target.id);
  expect(m.receipt).toHaveBeenCalledWith(expect.objectContaining({ where: { preparationId: f.intent.id, organisationId: "company", definitionId: f.intent.definitionId } }));
  for (const [strings, ...values] of m.raw.mock.calls) {
    const sql = strings.join("?"); expect(sql).not.toMatch(/atlas_studio_(execution|publication|migration)_fresh\(/);
    expect(values).toContain("company");
  }
  expect(m.raw.mock.calls.at(-1)?.[0].join("?")).toContain("pub.state='CUTOVER'");
  expect(m.version.mock.calls.every(([arg]) => arg.where.organisationId === "company" && arg.where.definitionId === f.intent.definitionId)).toBe(true);
});
it("missing/stale actual receipt or source-active definition never falls back to simulated state", async () => {
  m.receipt.mockResolvedValue(null); await expect(inspectFieldMigrationCutoverIdentity(tx, f.intent)).rejects.toThrow("stale or has changed");
  expect(m.version).not.toHaveBeenCalled(); m.receipt.mockImplementation(async () => structuredClone(f.receipt));
  f.definition.activeVersionId = f.source.id;
  await expect(inspectFieldMigrationCutoverIdentity(tx, f.intent)).rejects.toThrow("stale or has changed");
});
it("checks actual publication identity rather than reconstructing it from the stored execution pin", async () => {
  f.publication.targetChecksum = "f".repeat(64);
  await expect(inspectFieldMigrationCutoverIdentity(tx, f.intent)).rejects.toThrow("stale or has changed"); expect(m.version).not.toHaveBeenCalled();
});
it("rejects stale source/target/draft even when receipt and target pointer are intact", async () => {
  f.draft.revision++;
  await expect(inspectFieldMigrationCutoverIdentity(tx, f.intent)).rejects.toThrow("stale or has changed"); f.draft.revision--;
  f.target.checksum = "f".repeat(64);
  await expect(inspectFieldMigrationCutoverIdentity(tx, f.intent)).rejects.toThrow("stale or has changed");
  f = await fixture(); f.source.compiledPlan = f.target.compiledPlan;
  await expect(inspectFieldMigrationCutoverIdentity(tx, f.intent)).rejects.toThrow("stale or has changed");
});
it("denies changed representations, sealed review or preparation intent without claiming native or value authority", async () => {
  representationFresh = false; await expect(inspectFieldMigrationCutoverIdentity(tx, f.intent)).rejects.toThrow("stale or has changed");
  representationFresh = true; f.preparation.review.checksum = "f".repeat(64);
  await expect(inspectFieldMigrationCutoverIdentity(tx, f.intent)).rejects.toThrow();
  f = await fixture(); f.preparation.intentChecksum = "f".repeat(64);
  await expect(inspectFieldMigrationCutoverIdentity(tx, f.intent)).rejects.toThrow("stale or has changed");
  expect(Object.keys(tx)).not.toContain("serviceWorkItem");
});
