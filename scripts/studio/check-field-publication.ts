import assert from "node:assert/strict";
import { db } from "../../src/core/db/client";
import type { Session } from "../../src/core/auth/session";
import type { FieldMigrationPrincipal } from "../../src/core/studio/fields/principal-contract";
import { studioRegistry } from "../../src/core/studio/registry/runtime";
import { checksum } from "../../src/core/studio/registry/contracts";
import { customFieldPayloadSchema } from "../../src/core/studio/fields/schema";
import { createDraft, publishDraft, activateVersion, updateDraft, activeDefinition } from "../../src/core/studio/definitions/service";
import { retireFieldDefinition } from "../../src/core/studio/fields/retirement";
import { withFieldMigrationAuthority } from "../../src/core/studio/fields/migrations/authority";
import { startFieldMigrationPreparation } from "../../src/core/studio/fields/migrations/preparation";
import { collectFieldMigrationBatch } from "../../src/core/studio/fields/migrations/collection";
import { sealFieldMigrationPreparation } from "../../src/core/studio/fields/migrations/sealing";
import { publishReviewedFieldMigration } from "../../src/core/studio/fields/migrations/publication";
import { cancelFieldMigrationPublication } from "../../src/core/studio/fields/migrations/cancellation";
import { readSealedFieldMigrationReview } from "../../src/core/studio/fields/migrations/contracts";
import { reviewedFieldPublicationPin } from "../../src/core/studio/fields/migrations/publication-contract";

/** Actual reviewed publication/freeze/cancellation, privileged source-only Test
 * fixtures behind normal owner extend. No target values, native mutation/cutover.
 */
export async function checkFieldPublication(session: Session, principal: FieldMigrationPrincipal, parentId: string, otherOrganisationId: string) {
  assert(process.platform === "linux" && process.env.ATLAS_STUDIO_LIVE_TEST === "1");
  for (const id of [session.organisationId, otherOrganisationId])
    assert(await db.organisation.findFirst({ where: { id, isTest: true, slug: { startsWith: "studio-check-" }, status: "ACTIVE" } }));
  const nativeBefore = await db.serviceWorkItem.findMany({ where: { organisationId: { in: [session.organisationId, otherOrganisationId] } }, orderBy: { id: "asc" } });
  const registry = studioRegistry();
  const ref = (version: number) => { const meta = registry.describe("tickets.ticket", version); return { id: meta.id, version, schemaHash: meta.schemaHash, contractHash: meta.contractHash }; };
  const payload = customFieldPayloadSchema.parse({ schemaVersion: 1, entity: ref(2), storageGeneration: crypto.randomUUID(),
    field: { key: "publication_service", label: "Exact Test reviewed publication", classification: "confidential", storage: { type: "integer" } } });
  const definition = await createDraft(session, { key: "tickets.ticket.publication_service", name: "Exact Test reviewed publication", kind: "customField", payload });
  const source = await publishDraft(session, { definitionId: definition.id, revision: 0, acknowledgeWarnings: true });
  const sourceState = await db.studioDefinition.findFirstOrThrow({ where: { id: definition.id, organisationId: session.organisationId }, include: { draft: true } }); assert(sourceState.draft);
  await activateVersion(session, { definitionId: definition.id, versionId: source.versionId, revision: sourceState.revision });
  const target = customFieldPayloadSchema.parse({ ...payload, entity: ref(3), storageGeneration: crypto.randomUUID(), field: { ...payload.field, storage: { type: "decimal" } } });
  await updateDraft(session, { definitionId: definition.id, revision: sourceState.draft.revision, payload: target });
  const writeSourceFixture = (number: number) => withFieldMigrationAuthority(session, principal, async ({ session: fresh, transaction: tx }) => {
    const context = { session: fresh, transaction: tx }, anchor = await registry.authoriseRecord(context, payload.entity, { recordId: parentId, intent: "read" });
    await registry.authoriseRecord(context, payload.entity, { recordId: parentId, intent: "extend", expectedRevision: anchor.revision });
    const scope = { organisationId: fresh.organisationId, entityId: payload.entity.id, recordId: parentId };
    const extension = await tx.studioExtensionRecord.findFirst({ where: scope }) ?? await tx.studioExtensionRecord.create({ data: scope });
    const slotScope = { organisationId: fresh.organisationId, definitionId: definition.id, generationId: payload.storageGeneration, extensionId: extension.id };
    const slot = await tx.studioFieldSlot.findFirst({ where: slotScope }) ?? await tx.studioFieldSlot.create({ data: { ...slotScope, entityId: payload.entity.id } });
    const revision = slot.revision + 1;
    const value = await tx.studioFieldValue.create({ data: { organisationId: fresh.organisationId, definitionId: definition.id, generationId: payload.storageGeneration,
      slotId: slot.id, versionId: source.versionId, revision, valueType: "integer", integerValue: BigInt(number), fingerprint: checksum({ type: "integer", value: number }), createdBy: fresh.userId } });
    await tx.studioFieldSlot.update({ where: { id: slot.id }, data: { revision, activeValueId: value.id } });
    assert.equal((await tx.studioExtensionRecord.updateMany({ where: { id: extension.id, organisationId: fresh.organisationId, revision: extension.revision },
      data: { revision: extension.revision + 1 } })).count, 1);
    return { extension, slot, value };
  });
  const storedSource = await writeSourceFixture(42);
  const snapshot = () => db.studioDefinition.findFirstOrThrow({ where: { id: definition.id, organisationId: session.organisationId }, include: { draft: true } });
  const before = await snapshot(); assert(before.draft);
  await assert.rejects(() => publishDraft(session, { definitionId: definition.id, revision: before.draft!.revision, acknowledgeWarnings: true }), /MIGRATION_REQUIRED|tenant-owned storage generation/);
  assert.deepEqual(await snapshot(), before);
  const preparation = await startFieldMigrationPreparation(session, principal, { operationId: crypto.randomUUID(), definitionId: definition.id,
    definitionRevision: before.revision, draftRevision: before.draft.revision, conversion: { kind: "integer_to_decimal" } });
  let batch = await collectFieldMigrationBatch(session, { preparationId: preparation.id, revision: preparation.revision, limit: 2 });
  for (let n = 0; !batch.cursorExhausted; n++) { assert(n < 10); batch = await collectFieldMigrationBatch(session, { preparationId: preparation.id, revision: batch.revision, limit: 2 }); }
  const review = await sealFieldMigrationPreparation(session, { preparationId: preparation.id, revision: batch.revision });
  const request = { preparationId: preparation.id, revision: review.revision, reviewChecksum: review.checksum, acknowledgeWarnings: true, acknowledgeLoss: false };
  await assert.rejects(() => publishReviewedFieldMigration({ ...session, organisationId: otherOrganisationId }, request), /stale|changed/i);
  await assert.rejects(() => publishReviewedFieldMigration(session, { ...request, organisationId: otherOrganisationId }));
  await assert.rejects(() => publishReviewedFieldMigration(session, { ...request, reviewChecksum: "f".repeat(64) }), /stale|changed/i);
  const trigger = `studio_publication_audit_${crypto.randomUUID().replaceAll("-", "")}`;
  assert(/^[a-z0-9_]+$/.test(trigger) && /^[a-zA-Z0-9_-]+$/.test(session.organisationId) && /^[a-zA-Z0-9_-]+$/.test(session.userId) && /^[a-f0-9-]+$/.test(preparation.id));
  await db.$executeRawUnsafe(`CREATE FUNCTION ${trigger}() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN IF NEW."organisationId"='${session.organisationId}' AND NEW."actorUserId"='${session.userId}' AND NEW."entityId"='${preparation.id}' AND NEW.action='studio.field.migration.published' THEN RAISE EXCEPTION 'Exact Test publication Audit failure'; END IF; RETURN NEW; END $$;`);
  try {
    await db.$executeRawUnsafe(`CREATE TRIGGER ${trigger} BEFORE INSERT ON audit_entries FOR EACH ROW EXECUTE FUNCTION ${trigger}();`);
    await assert.rejects(() => publishReviewedFieldMigration(session, request), /Exact Test publication Audit failure/);
    assert.deepEqual(await snapshot(), before);
    assert.equal(await db.studioFieldGeneration.count({ where: { id: target.storageGeneration } }), 0);
    assert.equal(await db.studioFieldMigrationPublication.count({ where: { preparationId: preparation.id } }), 0);
    assert.equal(await db.studioDefinitionVersion.count({ where: { definitionId: definition.id, organisationId: session.organisationId } }), 1);
  } finally {
    await db.$executeRawUnsafe(`DROP TRIGGER IF EXISTS ${trigger} ON audit_entries;`);
    await db.$executeRawUnsafe(`DROP FUNCTION IF EXISTS ${trigger}();`);
  }
  const published = await publishReviewedFieldMigration(session, request);
  assert.deepEqual(await publishReviewedFieldMigration(session, request), { ...published, replayed: true });
  const current = await snapshot(); assert(current.draft);
  assert.equal(current.activeVersionId, source.versionId); assert.equal(current.revision, before.revision + 1); assert.equal(current.draft.revision, before.draft.revision + 1);
  assert.equal((await activeDefinition(session, definition.id))?.versionId, source.versionId);
  const actualTarget = await db.studioDefinitionVersion.findFirstOrThrow({ where: { id: published.targetVersionId, definitionId: definition.id, organisationId: session.organisationId },
    select: { id: true, organisationId: true, definitionId: true, version: true, checksum: true, payload: true, compiledPlan: true } });
  const sealedReview = await db.studioFieldMigrationReview.findFirstOrThrow({ where: { id: preparation.id, organisationId: session.organisationId } });
  const pin = reviewedFieldPublicationPin(readSealedFieldMigrationReview({ review: sealedReview.review, checksum: sealedReview.checksum }), actualTarget, session.userId, false);
  const receipt = await db.studioFieldMigrationPublication.findFirstOrThrow({ where: { preparationId: preparation.id, organisationId: session.organisationId } });
  for (const [key, value] of Object.entries(pin)) assert.equal(receipt[key as keyof typeof pin], value);
  assert.equal(await db.auditEntry.count({ where: { organisationId: session.organisationId, entityId: preparation.id, action: "studio.field.migration.published" } }), 1);
  assert.equal(await db.studioFieldSlot.count({ where: { organisationId: session.organisationId, definitionId: definition.id, generationId: target.storageGeneration } }), 0);
  await assert.rejects(() => db.studioFieldMigrationPublication.create({ data: { ...pin, organisationId: otherOrganisationId } }), /exact source-active|foreign key/i);
  await assert.rejects(() => db.studioFieldMigrationPublication.update({ where: { preparationId: preparation.id }, data: { reviewChecksum: "f".repeat(64) } }), /immutable|CAS/i);
  await assert.rejects(() => db.studioFieldMigrationPublication.delete({ where: { preparationId: preparation.id } }), /immutable|retained|history/i);
  await assert.rejects(() => db.studioFieldMigrationPublication.update({ where: { preparationId: preparation.id }, data: { state: "CANCELLED", revision: 0 } }), /CAS/i);
  await assert.rejects(() => activateVersion(session, { definitionId: definition.id, versionId: published.targetVersionId, revision: current.revision }), /completed conversion|explicit cutover/i);
  await assert.rejects(() => updateDraft(session, { definitionId: definition.id, revision: current.draft!.revision, payload: { ...target, field: { ...target.field, label: "Unreviewed" } } }), /freezes its reviewed draft/);
  await assert.rejects(() => publishDraft(session, { definitionId: definition.id, revision: current.draft!.revision, acknowledgeWarnings: true }), /freezes publication/);
  await assert.rejects(() => retireFieldDefinition(session, { definitionId: definition.id, revision: current.revision }), /freezes publication/);
  await assert.rejects(() => writeSourceFixture(43), /freezes normal source saves/);
  const tryTargetSlot = () => withFieldMigrationAuthority(session, principal, async ({ session: fresh, transaction: tx }) => {
    const context = { session: fresh, transaction: tx }, anchor = await registry.authoriseRecord(context, target.entity, { recordId: parentId, intent: "read" });
    await registry.authoriseRecord(context, target.entity, { recordId: parentId, intent: "extend", expectedRevision: anchor.revision });
    return tx.studioFieldSlot.create({ data: { organisationId: fresh.organisationId, entityId: target.entity.id, extensionId: storedSource.extension.id,
      definitionId: definition.id, generationId: target.storageGeneration } });
  });
  await assert.rejects(tryTargetSlot, /target writes require reviewed execution/);
  const parent = await db.serviceWorkItem.findFirstOrThrow({ where: { id: parentId, organisationId: session.organisationId } });
  const queueMember = await db.serviceQueueMember.findFirstOrThrow({ where: { queueId: parent.queueId, organisationId: session.organisationId, userId: session.userId } });
  await db.serviceQueueMember.delete({ where: { id: queueMember.id, organisationId: session.organisationId } });
  try { await assert.rejects(() => publishReviewedFieldMigration(session, request), /MIGRATION_ACCESS_REQUIRED/); }
  finally { await db.serviceQueueMember.create({ data: queueMember }); }
  assert.deepEqual(await publishReviewedFieldMigration(session, request), { ...published, replayed: true });
  const cancellationRequest = { preparationId: preparation.id, revision: receipt.revision };
  const cancelled = await cancelFieldMigrationPublication(session, principal, cancellationRequest);
  assert.deepEqual(await cancelFieldMigrationPublication(session, principal, cancellationRequest), { ...cancelled, replayed: true });
  const cancelledReceipt = await db.studioFieldMigrationPublication.findFirstOrThrow({ where: { preparationId: preparation.id, organisationId: session.organisationId } });
  assert.equal(await db.auditEntry.count({ where: { organisationId: session.organisationId, entityId: preparation.id, action: "studio.field.migration.cancelled" } }), 1);
  await assert.rejects(() => publishReviewedFieldMigration(session, request), /stale|changed/i);
  await assert.rejects(tryTargetSlot, /target writes require reviewed execution/);
  const changed = await writeSourceFixture(43); assert.equal(changed.value.integerValue, 43n);
  assert.equal(await db.studioFieldValue.count({ where: { slotId: storedSource.slot.id, organisationId: session.organisationId } }), 2);
  const edited = await updateDraft(session, { definitionId: definition.id, revision: current.draft.revision, payload: { ...target, field: { ...target.field, label: "Cancelled target cosmetic descendant" } } });
  const cancelledBefore = await snapshot();
  await assert.rejects(() => publishDraft(session, { definitionId: definition.id, revision: edited.revision, acknowledgeWarnings: true }), /MIGRATION_REQUIRED/);
  assert.deepEqual(await snapshot(), cancelledBefore);
  const sourceEdited = await updateDraft(session, { definitionId: definition.id, revision: edited.revision,
    payload: { ...payload, field: { ...payload.field, label: "Approved source after cancellation", help: "Retained source representation" } } });
  const cosmetic = await publishDraft(session, { definitionId: definition.id, revision: sourceEdited.revision, acknowledgeWarnings: true });
  const cosmeticBefore = await snapshot();
  await activateVersion(session, { definitionId: definition.id, versionId: cosmetic.versionId, revision: cosmeticBefore.revision });
  const final = await snapshot();
  await assert.rejects(() => activateVersion(session, { definitionId: definition.id, versionId: published.targetVersionId, revision: final.revision }), /completed conversion|explicit cutover/i);
  assert.equal(final.activeVersionId, cosmetic.versionId);
  assert.equal((await activeDefinition(session, definition.id))?.versionId, cosmetic.versionId);
  assert.deepEqual(await db.studioFieldMigrationPublication.findFirstOrThrow({ where: { preparationId: preparation.id, organisationId: session.organisationId } }), cancelledReceipt);
  assert.equal(await db.studioFieldValue.count({ where: { definitionId: definition.id, organisationId: session.organisationId, generationId: target.storageGeneration } }), 0);
  assert.deepEqual(await db.serviceWorkItem.findMany({ where: { organisationId: { in: [session.organisationId, otherOrganisationId] } }, orderBy: { id: "asc" } }), nativeBefore);
  console.log("PASS actual reviewed publication: ordinary structural denial, exact source-active version/generation/receipt, real paired Audit rollback and fresh permission-aware replay; tenant/history/CAS/freeze/draft/retirement/target-save/activation SQL guards; cancellation retains target/history, rejects target descendant publication and permits actual active-source cosmetic publication/activation. Privileged source-only owner fixtures; native unchanged, no target values/cutover.");
}
