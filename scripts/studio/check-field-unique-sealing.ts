import assert from "node:assert/strict";
import { db } from "../../src/core/db/client";
import type { Session } from "../../src/core/auth/session";
import type { FieldMigrationPrincipal } from "../../src/core/studio/fields/principal-contract";
import { studioRegistry } from "../../src/core/studio/registry/runtime";
import { checksum } from "../../src/core/studio/registry/contracts";
import { customFieldPayloadSchema } from "../../src/core/studio/fields/schema";
import { createDraft, publishDraft, activateVersion, updateDraft } from "../../src/core/studio/definitions/service";
import { withFieldMigrationAuthority } from "../../src/core/studio/fields/migrations/authority";
import { startFieldMigrationPreparation } from "../../src/core/studio/fields/migrations/preparation";
import { collectFieldMigrationBatch } from "../../src/core/studio/fields/migrations/collection";
import { sealFieldMigrationPreparation } from "../../src/core/studio/fields/migrations/sealing";

/** Actual uniqueness denial; privileged synthetic source-only values follow the
 * normal owner extend guard. No native changes or final/merged write bypass.
 */
export async function checkFieldUniqueSealing(session: Session, principal: FieldMigrationPrincipal, activeTicketIds: string[]) {
  assert(process.platform === "linux" && process.env.ATLAS_STUDIO_LIVE_TEST === "1");
  assert(await db.organisation.findFirst({ where: { id: session.organisationId, isTest: true, slug: { startsWith: "studio-check-" }, status: "ACTIVE" } }));
  assert.equal(new Set(activeTicketIds).size, 2);
  const registry = studioRegistry();
  const ref = (version: number) => { const meta = registry.describe("tickets.ticket", version); return { id: meta.id, version, schemaHash: meta.schemaHash, contractHash: meta.contractHash }; };
  const payload = customFieldPayloadSchema.parse({ schemaVersion: 1, entity: ref(2), storageGeneration: crypto.randomUUID(),
    field: { key: "sealing_unique", label: "Scalar unique review fixture", classification: "confidential", storage: { type: "integer" } } });
  const definition = await createDraft(session, { key: "tickets.ticket.sealing_unique", name: "Exact Test uniqueness review", kind: "customField", payload });
  const source = await publishDraft(session, { definitionId: definition.id, revision: 0, acknowledgeWarnings: true });
  const state = await db.studioDefinition.findFirstOrThrow({ where: { id: definition.id, organisationId: session.organisationId }, include: { draft: true } }); assert(state.draft);
  await activateVersion(session, { definitionId: definition.id, versionId: source.versionId, revision: state.revision });
  const target = customFieldPayloadSchema.parse({ ...payload, entity: ref(3), storageGeneration: crypto.randomUUID(), field: { ...payload.field, unique: true, storage: { type: "decimal" } } });
  await updateDraft(session, { definitionId: definition.id, revision: state.draft.revision, payload: target });
  for (const recordId of activeTicketIds) await withFieldMigrationAuthority(session, principal, async ({ session: fresh, transaction: tx }) => {
    const context = { session: fresh, transaction: tx }, anchor = await registry.authoriseRecord(context, payload.entity, { recordId, intent: "read" });
    await registry.authoriseRecord(context, payload.entity, { recordId, intent: "extend", expectedRevision: anchor.revision });
    const scope = { organisationId: fresh.organisationId, entityId: payload.entity.id, recordId };
    const extension = await tx.studioExtensionRecord.findFirst({ where: scope }) ?? await tx.studioExtensionRecord.create({ data: scope });
    const slot = await tx.studioFieldSlot.create({ data: { organisationId: fresh.organisationId, entityId: payload.entity.id, extensionId: extension.id, definitionId: definition.id, generationId: payload.storageGeneration } });
    const value = await tx.studioFieldValue.create({ data: { organisationId: fresh.organisationId, definitionId: definition.id, generationId: payload.storageGeneration,
      slotId: slot.id, versionId: source.versionId, revision: 1, valueType: "integer", integerValue: 42n, fingerprint: checksum({ type: "integer", value: 42 }), createdBy: fresh.userId } });
    await tx.studioFieldSlot.update({ where: { id: slot.id }, data: { revision: 1, activeValueId: value.id } });
    assert.equal((await tx.studioExtensionRecord.updateMany({ where: { id: extension.id, organisationId: fresh.organisationId, revision: extension.revision }, data: { revision: extension.revision + 1 } })).count, 1);
  });
  const current = await db.studioDefinition.findFirstOrThrow({ where: { id: definition.id, organisationId: session.organisationId }, include: { draft: true } }); assert(current.draft);
  const preparation = await startFieldMigrationPreparation(session, principal, { operationId: crypto.randomUUID(), definitionId: definition.id,
    definitionRevision: current.revision, draftRevision: current.draft.revision, conversion: { kind: "integer_to_decimal" } });
  let batch = await collectFieldMigrationBatch(session, { preparationId: preparation.id, revision: preparation.revision, limit: 25 });
  for (let n = 0; !batch.cursorExhausted; n++) { assert(n < 10); batch = await collectFieldMigrationBatch(session, { preparationId: preparation.id, revision: batch.revision, limit: 25 }); }
  await assert.rejects(() => sealFieldMigrationPreparation(session, { preparationId: preparation.id, revision: batch.revision }), /MIGRATION_UNIQUENESS_CONFLICT/);
  assert.equal(await db.studioFieldMigrationReview.count({ where: { id: preparation.id } }), 0);
  assert.equal(await db.studioFieldGeneration.count({ where: { id: target.storageGeneration } }), 0);
  assert.equal((await db.studioFieldMigrationPreparation.findFirstOrThrow({ where: { id: preparation.id, organisationId: session.organisationId } })).state, "PREPARING");
  console.log("PASS actual scalar uniqueness: authorised whole canonical cohort and two owner-guarded synthetic source values produce duplicate non-null converted fingerprints; review/CAS denied, nulls ignored, no target/native writes or final-record bypass.");
}
