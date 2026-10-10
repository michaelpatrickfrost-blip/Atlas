import type { Session } from "@/core/auth/session";
import { CapabilityRegistry } from "@/core/studio/registry/registry";
import { ticketStudioContract } from "@/core/service-work/studio";
import { compileCustomField } from "@/core/studio/compiler/fields";
import { customFieldPayloadSchema } from "@/core/studio/fields/schema";
import { sealFieldMigrationIntent, sealFieldMigrationReview } from "@/core/studio/fields/migrations/contracts";
import { reviewedFieldPublicationPin } from "@/core/studio/fields/migrations/publication-contract";
import { createFieldMigrationExecutionPin } from "@/core/studio/fields/migrations/execution-contract";
import { createFieldMigrationCutoverPin } from "@/core/studio/fields/migrations/cutover-contract";
import { createFieldMigrationSettlementPin, fieldMigrationSettlementTransition } from "@/core/studio/fields/migrations/settlement-contract";

export const cutoverUuid = (n: number) => `00000000-0000-4000-8000-${n.toString().padStart(12, "0")}`;
export async function retainedCutoverFixture() {
  const registry = new CapabilityRegistry(async () => true); registry.register("tickets", ticketStudioContract);
  const ref = (id: string, version: number) => { const m = registry.describe(id, version); return { id, version, schemaHash: m.schemaHash, contractHash: m.contractHash }; };
  const session: Session = { userId: "actor", userName: "Actor", userEmail: "actor@example.invalid", membershipId: "member", organisationId: "company", organisationName: "Company",
    capabilities: new Set(["studio.definition.publish", "tickets.ticket.read", "tickets.ticket.manage"]) };
  const sourcePayload = customFieldPayloadSchema.parse({ schemaVersion: 1, entity: ref("tickets.ticket", 2), storageGeneration: cutoverUuid(1),
    field: { key: "extra", label: "Extra", classification: "confidential", storage: { type: "integer" } } });
  const targetPayload = customFieldPayloadSchema.parse({ ...sourcePayload, entity: ref("tickets.ticket", 5), storageGeneration: cutoverUuid(2), field: { ...sourcePayload.field, storage: { type: "decimal" } } });
  const a = await compileCustomField(session, sourcePayload, registry), b = await compileCustomField(session, targetPayload, registry);
  const sealed = sealFieldMigrationIntent({ schemaVersion: 1, id: cutoverUuid(3), organisationId: "company", definitionId: cutoverUuid(4), definitionRevision: 7,
    principal: { organisationId: "company", userId: "actor", membershipId: "member", sessionVersion: 2, authVersion: 3, authority: "customer" },
    source: { versionId: cutoverUuid(5), versionChecksum: a.checksum, payload: sourcePayload }, target: { draftId: cutoverUuid(6), draftRevision: 9, compiledChecksum: b.checksum, payload: targetPayload },
    conversion: { kind: "integer_to_decimal" }, ownerQuery: ref("tickets.ticket.field_migration", 3) });
  const stored = sealFieldMigrationReview({ ...sealed.intent, cohort: { recordCount: 2, observationDigest: "e".repeat(64) }, summary: { validCount: 2, invalidCount: 0, lossyCount: 0 } });
  const source = { id: cutoverUuid(5), organisationId: "company", definitionId: cutoverUuid(4), version: 1, payload: sourcePayload, compiledPlan: a.plan, checksum: a.checksum };
  const target = { id: cutoverUuid(8), organisationId: "company", definitionId: cutoverUuid(4), version: 2, payload: targetPayload, compiledPlan: b.plan, checksum: b.checksum };
  const publication = { ...reviewedFieldPublicationPin(stored, target, "actor", false), state: "PUBLISHED", revision: 0 };
  const identity = Object.fromEntries(Object.entries(publication).filter(([key]) => key !== "state" && key !== "revision"));
  const pinned = createFieldMigrationExecutionPin(stored, target, identity, await registry.resolve(session, targetPayload.entity), await registry.resolve(session, ref("tickets.ticket.field_representation", 1)));
  const execution = { preparationId: cutoverUuid(3), organisationId: "company", definitionId: cutoverUuid(4), entityId: "tickets.ticket", pin: pinned.pin, pinChecksum: pinned.checksum,
    state: "READY", revision: 2, cursor: "ticket_b", processedCount: 2, failureCode: null };
  const definition = { id: cutoverUuid(4), organisationId: "company", kind: "customField", activeVersionId: source.id, revision: 8, latestVersion: 2, retiredAt: null as Date | null };
  const retained = createFieldMigrationCutoverPin(stored, execution, publication, definition);
  const receipt = { preparationId: cutoverUuid(3), organisationId: "company", definitionId: cutoverUuid(4), sourceVersionId: source.id, targetVersionId: target.id,
    pin: retained.pin, pinChecksum: retained.checksum, state: "ACTIVATED", revision: 0, createdBy: "actor", settlementPin: null as unknown,
    settlementChecksum: null as string | null, settledBy: null as string | null, settledAt: null as Date | null };
  return { registry, session, intent: sealed.intent, stored, retained, source, target, execution, receipt,
    preparation: { id: cutoverUuid(3), organisationId: "company", definitionId: cutoverUuid(4), state: "REVIEWED", intent: sealed.intent, intentChecksum: sealed.checksum, review: stored },
    publication: { ...publication, state: "CUTOVER", revision: 1 }, definition: { ...definition, activeVersionId: target.id, revision: 9 }, draft: { revision: 10, baseVersionId: target.id, payload: targetPayload } };
}
export function settleCutoverFixture(f: Awaited<ReturnType<typeof retainedCutoverFixture>>, disposition: "ROLLED_BACK" | "FINALIZED") {
  const settlement = createFieldMigrationSettlementPin(f.retained, { ...f.intent.principal, userId: "current-actor", membershipId: "current-member" }, disposition);
  const transition = fieldMigrationSettlementTransition(settlement.pin);
  Object.assign(f.receipt, { state: disposition, revision: 1, settlementPin: settlement.pin, settlementChecksum: settlement.checksum,
    settledBy: settlement.pin.principal.userId, settledAt: new Date("2026-10-10T10:00:00.000Z") });
  Object.assign(f.publication, transition.publication);
  Object.assign(f.definition, { activeVersionId: transition.definition.versionId, revision: transition.definition.revision });
  return settlement;
}
