import assert from "node:assert/strict";
import { db } from "../../src/core/db/client";
import type { Session } from "../../src/core/auth/session";
import type { FieldMigrationPrincipal } from "../../src/core/studio/fields/principal-contract";
import { studioRegistry } from "../../src/core/studio/registry/runtime";
import { checksum } from "../../src/core/studio/registry/contracts";
import { customFieldPayloadSchema } from "../../src/core/studio/fields/schema";
import { fieldMigrationObservationSchema } from "../../src/core/studio/fields/migrations/contracts";
import { createDraft, publishDraft, activateVersion, updateDraft } from "../../src/core/studio/definitions/service";
import { withFieldMigrationAuthority } from "../../src/core/studio/fields/migrations/authority";
import { startFieldMigrationPreparation } from "../../src/core/studio/fields/migrations/preparation";
import { collectFieldMigrationBatch } from "../../src/core/studio/fields/migrations/collection";
import { sealFieldMigrationPreparation } from "../../src/core/studio/fields/migrations/sealing";
import { checkFieldSealing } from "./check-field-sealing";

/** Exact isolated central Test data only. Good references use ordinary owner
 * read/extend. Missing/foreign source values and their single invalid archive
 * frame are privileged negative storage fixtures, never authorised failure rows.
 */
export async function checkFieldReferenceSealing(session: Session, principal: FieldMigrationPrincipal,
  parentId: string, finalTargetId: string, foreignTargetId: string, otherOrganisationId: string) {
  assert(process.platform === "linux" && process.env.ATLAS_STUDIO_LIVE_TEST === "1");
  for (const id of [session.organisationId, otherOrganisationId])
    assert(await db.organisation.findFirst({ where: { id, isTest: true, slug: { startsWith: "studio-check-" }, status: "ACTIVE" } }));
  assert(await db.serviceWorkItem.findFirst({ where: { id: finalTargetId, organisationId: session.organisationId, kind: "TICKET", status: "CLOSED" } }));
  assert(await db.serviceWorkItem.findFirst({ where: { id: foreignTargetId, organisationId: otherOrganisationId, kind: "TICKET" } }));
  const nativeBefore = await db.serviceWorkItem.findMany({ where: { organisationId: { in: [session.organisationId, otherOrganisationId] } }, orderBy: { id: "asc" } });
  const registry = studioRegistry();
  const ref = (version: number) => { const meta = registry.describe("tickets.ticket", version); return { id: meta.id, version, schemaHash: meta.schemaHash, contractHash: meta.contractHash }; };
  for (const fixture of [
    { key: "review_reference", targetId: finalTargetId, authorised: true },
    { key: "review_missing_reference", targetId: `missing_${crypto.randomUUID().replaceAll("-", "")}`, authorised: false },
    { key: "review_foreign_reference", targetId: foreignTargetId, authorised: false },
  ]) {
    const payload = customFieldPayloadSchema.parse({ schemaVersion: 1, entity: ref(2), storageGeneration: crypto.randomUUID(),
      field: { key: fixture.key, label: "Exact Test reference review", classification: "confidential", storage: { type: "reference", entity: ref(1) } } });
    const definition = await createDraft(session, { key: `tickets.ticket.${fixture.key}`, name: "Exact Test reference review", kind: "customField", payload });
    const source = await publishDraft(session, { definitionId: definition.id, revision: 0, acknowledgeWarnings: true });
    const state = await db.studioDefinition.findFirstOrThrow({ where: { id: definition.id, organisationId: session.organisationId }, include: { draft: true } }); assert(state.draft);
    await activateVersion(session, { definitionId: definition.id, versionId: source.versionId, revision: state.revision });
    const target = customFieldPayloadSchema.parse({ ...payload, entity: ref(4), storageGeneration: crypto.randomUUID(), field: { ...payload.field, indexed: true } });
    await updateDraft(session, { definitionId: definition.id, revision: state.draft.revision, payload: target });
    const stored = await withFieldMigrationAuthority(session, principal, async ({ session: fresh, transaction: tx }) => {
      const context = { session: fresh, transaction: tx }, anchor = await registry.authoriseRecord(context, payload.entity, { recordId: parentId, intent: "read" });
      await registry.authoriseRecord(context, payload.entity, { recordId: parentId, intent: "extend", expectedRevision: anchor.revision });
      if (fixture.authorised) await registry.authoriseRecord(context, ref(1), { recordId: fixture.targetId, intent: "read" });
      // Negative cases deliberately simulate invalid stored references under a
      // privileged Test fixture path. They must never pass the real collector.
      const scope = { organisationId: fresh.organisationId, entityId: payload.entity.id, recordId: parentId };
      const extension = await tx.studioExtensionRecord.findFirst({ where: scope }) ?? await tx.studioExtensionRecord.create({ data: scope });
      const slot = await tx.studioFieldSlot.create({ data: { organisationId: fresh.organisationId, entityId: payload.entity.id, extensionId: extension.id,
        definitionId: definition.id, generationId: payload.storageGeneration } });
      const value = await tx.studioFieldValue.create({ data: { organisationId: fresh.organisationId, definitionId: definition.id, generationId: payload.storageGeneration,
        slotId: slot.id, versionId: source.versionId, revision: 1, valueType: "reference", referenceValue: fixture.targetId,
        fingerprint: checksum({ type: "reference", value: fixture.targetId }), createdBy: fresh.userId } });
      await tx.studioFieldSlot.update({ where: { id: slot.id }, data: { revision: 1, activeValueId: value.id } });
      assert.equal((await tx.studioExtensionRecord.updateMany({ where: { id: extension.id, organisationId: fresh.organisationId, revision: extension.revision },
        data: { revision: extension.revision + 1 } })).count, 1);
      return { anchor, extension, slot, value };
    });
    const current = await db.studioDefinition.findFirstOrThrow({ where: { id: definition.id, organisationId: session.organisationId }, include: { draft: true } }); assert(current.draft);
    const preparation = await startFieldMigrationPreparation(session, principal, { operationId: crypto.randomUUID(), definitionId: definition.id,
      definitionRevision: current.revision, draftRevision: current.draft.revision, conversion: { kind: "same_type" } });
    const saved = await db.studioFieldMigrationPreparation.findFirstOrThrow({ where: { id: preparation.id, organisationId: session.organisationId } });
    assert.equal((saved.intent as { ownerQuery: { version: number } }).ownerQuery.version, 2);
    if (fixture.authorised) {
      let batch = await collectFieldMigrationBatch(session, { preparationId: preparation.id, revision: preparation.revision, limit: 25 });
      for (let n = 0; !batch.cursorExhausted; n++) { assert(n < 10); batch = await collectFieldMigrationBatch(session, { preparationId: preparation.id, revision: batch.revision, limit: 25 }); }
      const review = await checkFieldSealing(session, preparation.id, otherOrganisationId);
      assert.deepEqual(review.summary, { validCount: nativeBefore.filter(row => row.organisationId === session.organisationId).length, invalidCount: 0, lossyCount: 0 });
      const row = await db.serviceWorkItem.findFirstOrThrow({ where: { id: parentId, organisationId: session.organisationId } });
      const queueMember = await db.serviceQueueMember.findFirstOrThrow({ where: { queueId: row.queueId, organisationId: session.organisationId, userId: session.userId } });
      assert(await db.serviceQueue.findFirst({ where: { id: row.queueId, organisationId: session.organisationId, restricted: true } }));
      await db.serviceQueueMember.delete({ where: { id: queueMember.id, organisationId: session.organisationId } });
      try {
        await assert.rejects(() => sealFieldMigrationPreparation(session, { preparationId: preparation.id, revision: review.revision }), /MIGRATION_ACCESS_REQUIRED/);
      } finally { await db.serviceQueueMember.create({ data: queueMember }); }
      assert.equal((await sealFieldMigrationPreparation(session, { preparationId: preparation.id, revision: review.revision })).replayed, true);
    } else {
      await assert.rejects(() => collectFieldMigrationBatch(session, { preparationId: preparation.id, revision: preparation.revision, limit: 50 }), /unavailable/i);
      assert.equal(await db.studioFieldMigrationObservation.count({ where: { preparationId: preparation.id } }), 0);
      // This invalid archive frame exercises the owner's actual SQL guard only.
      // It cannot pass canonical coverage or count as an authorised failure.
      const observation = fieldMigrationObservationSchema.parse({ recordId: parentId, nativeRevision: stored.anchor.revision,
        extension: { id: stored.extension.id, revision: stored.extension.revision + 1, slot: { id: stored.slot.id, revision: 1,
          value: { id: stored.value.id, revision: 1, versionId: source.versionId, fingerprint: stored.value.fingerprint } } },
        result: { kind: "invalid", code: "FIELD_STORAGE_INVALID" } });
      await withFieldMigrationAuthority(session, principal, async ({ transaction: tx }) => {
        await tx.studioFieldMigrationObservation.create({ data: { preparationId: preparation.id, organisationId: session.organisationId,
          definitionId: definition.id, entityId: payload.entity.id, sourceGenerationId: payload.storageGeneration,
          recordId: parentId, nativeRevision: observation.nativeRevision, extensionId: stored.extension.id, extensionRevision: observation.extension!.revision,
          slotId: stored.slot.id, slotRevision: 1, valueId: stored.value.id, observation } });
      });
      await assert.rejects(() => db.$transaction(tx => registry.invokeQueryInTransaction({ session, transaction: tx }, registry.describe("tickets.ticket.field_migration", 2),
        { mode: "reference_coverage", preparationId: preparation.id }), { isolationLevel: "Serializable" }), /MIGRATION_REFERENCE_COVERAGE_CHANGED/);
      await assert.rejects(() => sealFieldMigrationPreparation(session, { preparationId: preparation.id, revision: preparation.revision }), /MIGRATION_COHORT_CHANGED/);
      assert.equal(await db.studioFieldMigrationReview.count({ where: { id: preparation.id } }), 0);
      assert.equal((await db.studioFieldMigrationPreparation.findFirstOrThrow({ where: { id: preparation.id } })).state, "PREPARING");
    }
    assert.equal(await db.studioFieldGeneration.count({ where: { id: target.storageGeneration } }), 0);
  }
  assert.deepEqual(await db.serviceWorkItem.findMany({ where: { organisationId: { in: [session.organisationId, otherOrganisationId] } }, orderBy: { id: "asc" } }), nativeBefore);
  console.log("PASS actual reference review: approved final target native read, active-parent owner extend, real collection/shared seal/digest/Audit rollback/replay/private revocation; missing/foreign targets abort collection and privileged negative archive cannot gain owner coverage or seal; no target/native writes.");
}
