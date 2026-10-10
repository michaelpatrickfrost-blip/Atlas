import assert from "node:assert/strict";
import { db } from "../../src/core/db/client";
import { Prisma } from "../../src/generated/prisma/client";
import type { Session } from "../../src/core/auth/session";
import type { FieldMigrationPrincipal } from "../../src/core/studio/fields/principal-contract";
import { customFieldPayloadSchema, type CustomFieldPayload } from "../../src/core/studio/fields/schema";
import { assertFieldAccess } from "../../src/core/studio/fields/validation";
import { encodeFieldValue } from "../../src/core/studio/fields/codec";
import { studioRegistry } from "../../src/core/studio/registry/runtime";
import { writeAudit } from "../../src/core/audit/log";
import { withFieldMigrationAuthority } from "../../src/core/studio/fields/migrations/authority";
import { inspectFieldMigrationCutoverIdentity } from "../../src/core/studio/fields/migrations/cutover-inspection";
import { inspectFieldMigrationReview } from "../../src/core/studio/fields/migrations/inspection";
import { sealFieldMigrationIntent } from "../../src/core/studio/fields/migrations/contracts";
import { createFieldMigrationSettlementPin, fieldMigrationSettlementTransition } from "../../src/core/studio/fields/migrations/settlement-contract";
import { publishDraft, activateVersion, updateDraft } from "../../src/core/studio/definitions/service";
import { startFieldMigrationPreparation } from "../../src/core/studio/fields/migrations/preparation";
import { collectFieldMigrationBatch } from "../../src/core/studio/fields/migrations/collection";
import { sealFieldMigrationPreparation } from "../../src/core/studio/fields/migrations/sealing";
import { publishReviewedFieldMigration } from "../../src/core/studio/fields/migrations/publication";
import { cancelFieldMigrationPublication } from "../../src/core/studio/fields/migrations/cancellation";

/** Explicit exact Test fixture writer only, behind refreshed owner/private/field
 * rights. Tests SQL eligibility; not a production value API or native mutation. */
export async function writeGenerationFixture(tx: Prisma.TransactionClient, session: Session,
  definitionId: string, payload: CustomFieldPayload, versionId: string, recordId: string, raw: unknown) {
  assert(process.platform === "linux" && process.env.ATLAS_STUDIO_LIVE_TEST === "1");
  assert(await tx.organisation.findFirst({ where: { id: session.organisationId, isTest: true, kind: "CUSTOMER",
    slug: { startsWith: "studio-check-" }, status: "ACTIVE", archivedAt: null } }));
  assertFieldAccess(session, payload.field, "write");
  const context = { session, transaction: tx }, registry = studioRegistry();
  const anchor = await registry.authoriseRecord(context, payload.entity, { recordId, intent: "read" });
  await registry.authoriseRecord(context, payload.entity, { recordId, intent: "extend", expectedRevision: anchor.revision });
  const extension = await tx.studioExtensionRecord.findFirstOrThrow({ where: { organisationId: session.organisationId, entityId: payload.entity.id, recordId } });
  const slot = await tx.studioFieldSlot.findFirstOrThrow({ where: { organisationId: session.organisationId, definitionId, generationId: payload.storageGeneration, extensionId: extension.id } });
  const encoded = encodeFieldValue(payload.field, raw), revision = slot.revision + 1;
  const value = await tx.studioFieldValue.create({ data: { ...encoded, jsonValue: encoded.jsonValue === null ? Prisma.DbNull : encoded.jsonValue as Prisma.InputJsonValue,
    organisationId: session.organisationId, definitionId, generationId: payload.storageGeneration, slotId: slot.id, versionId, revision, createdBy: session.userId } });
  assert.equal((await tx.studioExtensionRecord.updateMany({ where: { id: extension.id, organisationId: session.organisationId, revision: extension.revision },
    data: { revision: extension.revision + 1 } })).count, 1);
  assert.equal((await tx.studioFieldSlot.updateMany({ where: { id: slot.id, organisationId: session.organisationId, revision: slot.revision },
    data: { revision, activeValueId: value.id, uniqueToken: payload.field.unique && !encoded.isNull ? encoded.fingerprint : null } })).count, 1);
  return value;
}

/** Reuses the real reviewed-publication pipeline after an explicitly guarded Test
 * finalization. It does not implement the later production settlement workstream. */
export async function checkFieldGenerationContinuation(session: Session, principal: FieldMigrationPrincipal, preparationId: string, parentId: string, otherOrganisationId: string) {
  assert(process.platform === "linux" && process.env.ATLAS_STUDIO_LIVE_TEST === "1");
  for (const id of [session.organisationId, otherOrganisationId]) assert(await db.organisation.findFirst({ where: { id, isTest: true, kind: "CUSTOMER",
    slug: { startsWith: "studio-check-" }, status: "ACTIVE", archivedAt: null } }));
  const preparation = await db.studioFieldMigrationPreparation.findFirstOrThrow({ where: { id: preparationId, organisationId: session.organisationId } });
  const intent = sealFieldMigrationIntent(preparation.intent).intent, definitionId = preparation.definitionId;
  assert.equal(intent.id, preparationId); assert.equal(intent.organisationId, session.organisationId);
  const scope = { definitionId, organisationId: session.organisationId }, publicationScope = { ...scope, preparationId };
  const nativeWhere = { organisationId: { in: [session.organisationId, otherOrganisationId] } };
  const nativeBefore = await db.serviceWorkItem.findMany({ where: nativeWhere, orderBy: { id: "asc" } });
  const oldValues = await db.studioFieldValue.findMany({ where: scope, orderBy: { id: "asc" } });
  const generations = await db.studioFieldGeneration.findMany({ where: scope, orderBy: { id: "asc" } });
  await withFieldMigrationAuthority(session, principal, async authority => {
    const { transaction: tx, session: fresh, company } = authority;
    const inspected = await inspectFieldMigrationCutoverIdentity(tx, intent);
    assert.equal((await inspectFieldMigrationReview({ session: fresh, transaction: tx }, studioRegistry(), company, intent, "cutover")).checksum, inspected.stored.checksum);
    const settlement = createFieldMigrationSettlementPin({ pin: inspected.pin, checksum: inspected.checksum }, authority.principal, "FINALIZED");
    const transition = fieldMigrationSettlementTransition(settlement.pin);
    assert.equal((await tx.studioFieldMigrationCutover.updateMany({ where: { ...publicationScope, state: "ACTIVATED", revision: 0 },
      data: { state: "FINALIZED", revision: 1, settlementPin: settlement.pin, settlementChecksum: settlement.checksum, settledBy: fresh.userId, settledAt: new Date() } })).count, 1);
    assert.equal((await tx.studioFieldMigrationPublication.updateMany({ where: { ...publicationScope, state: "CUTOVER", revision: inspected.publication.revision }, data: transition.publication })).count, 1);
    await writeAudit({ organisationId: fresh.organisationId, actorUserId: fresh.userId, action: "studio.test.field.finalized",
      entityType: "StudioFieldMigrationCutover", entityId: preparationId, after: { settlementChecksum: settlement.checksum, testFixture: true } }, tx);
  });
  const receipt = await db.studioFieldMigrationCutover.findFirstOrThrow({ where: publicationScope });
  const completed = await db.studioFieldMigrationPublication.findFirstOrThrow({ where: publicationScope }); assert.equal(completed.state, "COMPLETED");
  const snapshot = () => db.studioDefinition.findFirstOrThrow({ where: { id: definitionId, organisationId: session.organisationId }, include: { draft: true } });
  const current = await snapshot(); assert(current.draft);
  const payload = customFieldPayloadSchema.parse(intent.target.payload);
  const cosmetic = customFieldPayloadSchema.parse({ ...payload, field: { ...payload.field, label: "Continued approved target", help: "Retained history" } });
  const edited = await updateDraft(session, { definitionId, revision: current.draft.revision, payload: cosmetic });
  const published = await publishDraft(session, { definitionId, revision: edited.revision, acknowledgeWarnings: true });
  await activateVersion(session, { definitionId, versionId: published.versionId, revision: (await snapshot()).revision });
  const write = (number: string) => withFieldMigrationAuthority(session, principal, ({ session: fresh, transaction: tx }) =>
    writeGenerationFixture(tx, fresh, definitionId, cosmetic, published.versionId, parentId, number));
  const continued = await write("26"); assert.equal(continued.decimalValue?.toFixed(), "26");
  await assert.rejects(() => withFieldMigrationAuthority(session, principal, ({ session: fresh, transaction: tx }) =>
    writeGenerationFixture(tx, fresh, definitionId, intent.source.payload, intent.source.versionId, parentId, 27)), /retained history/i);
  await assert.rejects(async () => activateVersion(session, { definitionId, versionId: intent.source.versionId, revision: (await snapshot()).revision }), /retained history|explicit cutover/i);
  const active = await snapshot(); assert(active.draft);
  // A same-type constraint evolution still needs a distinct reviewed generation.
  const nextPayload = customFieldPayloadSchema.parse({ ...cosmetic, storageGeneration: crypto.randomUUID(), field: { ...cosmetic.field, storage: { ...cosmetic.field.storage, min: "0" } } });
  const nextDraft = await updateDraft(session, { definitionId, revision: active.draft.revision, payload: nextPayload });
  await assert.rejects(() => publishDraft(session, { definitionId, revision: nextDraft.revision, acknowledgeWarnings: true }), /MIGRATION_REQUIRED|tenant-owned storage generation/i);
  const next = await startFieldMigrationPreparation(session, principal, { operationId: crypto.randomUUID(), definitionId,
    definitionRevision: (await snapshot()).revision, draftRevision: nextDraft.revision, conversion: { kind: "same_type" } });
  let collected = await collectFieldMigrationBatch(session, { preparationId: next.id, revision: next.revision, limit: 2 });
  for (let n = 0; !collected.cursorExhausted; n++) { assert(n < 20); collected = await collectFieldMigrationBatch(session, { preparationId: next.id, revision: collected.revision, limit: 2 }); }
  const review = await sealFieldMigrationPreparation(session, { preparationId: next.id, revision: collected.revision });
  const nextPublication = await publishReviewedFieldMigration(session, { preparationId: next.id, revision: review.revision, reviewChecksum: review.checksum, acknowledgeWarnings: true, acknowledgeLoss: false });
  assert.equal((await db.studioFieldMigrationPublication.findFirstOrThrow({ where: { ...scope, preparationId: next.id } })).sourceGenerationId, payload.storageGeneration);
  // This generation is simultaneously an earlier COMPLETED target and the new
  // PUBLISHED source. Every new source freeze must win, regardless of row order.
  const beforeDenial = await db.studioFieldValue.findMany({ where: scope, orderBy: { id: "asc" } });
  await assert.rejects(() => write("27"), /freezes normal source saves/i);
  assert.deepEqual(await db.studioFieldValue.findMany({ where: scope, orderBy: { id: "asc" } }), beforeDenial);
  await cancelFieldMigrationPublication(session, principal, { preparationId: next.id, revision: nextPublication.publicationRevision });
  assert.equal((await write("28")).decimalValue?.toFixed(), "28");
  const final = await snapshot();
  await assert.rejects(() => activateVersion(session, { definitionId, versionId: nextPublication.targetVersionId, revision: final.revision }), /completed conversion|explicit cutover/i);
  await assert.rejects(() => withFieldMigrationAuthority(session, principal, async ({ session: fresh, transaction: tx }) => {
    const context = { session: fresh, transaction: tx }, registry = studioRegistry();
    assertFieldAccess(fresh, nextPayload.field, "write");
    const anchor = await registry.authoriseRecord(context, nextPayload.entity, { recordId: parentId, intent: "read" });
    await registry.authoriseRecord(context, nextPayload.entity, { recordId: parentId, intent: "extend", expectedRevision: anchor.revision });
    const extension = await tx.studioExtensionRecord.findFirstOrThrow({ where: { organisationId: fresh.organisationId, entityId: nextPayload.entity.id, recordId: parentId } });
    await tx.studioFieldSlot.create({ data: { ...scope, entityId: nextPayload.entity.id, extensionId: extension.id, generationId: nextPayload.storageGeneration } });
  }), /target writes require reviewed execution/i);
  await assert.rejects(() => withFieldMigrationAuthority(session, principal, ({ session: fresh, transaction: tx }) =>
    writeGenerationFixture(tx, fresh, definitionId, cosmetic, intent.source.versionId, parentId, "29")), /schema|generation|foreign key/i);
  assert.equal(await db.studioFieldSlot.count({ where: { ...scope, generationId: nextPayload.storageGeneration } }), 0);
  assert.deepEqual(await db.studioFieldMigrationCutover.findFirstOrThrow({ where: publicationScope }), receipt);
  assert.deepEqual(await db.studioFieldMigrationPublication.findFirstOrThrow({ where: publicationScope }), completed);
  assert.deepEqual(await db.studioFieldGeneration.findMany({ where: { ...scope, id: { in: generations.map(g => g.id) } }, orderBy: { id: "asc" } }), generations);
  assert.deepEqual(await db.studioFieldValue.findMany({ where: { ...scope, id: { in: oldValues.map(v => v.id) } }, orderBy: { id: "asc" } }), oldValues);
  assert.deepEqual(await db.serviceWorkItem.findMany({ where: nativeWhere, orderBy: { id: "asc" } }), nativeBefore);
  console.log("PASS actual generation continuation: guarded exact Test finalization, approved target cosmetics and owner-authorised fixture save; completed source remains closed, real later reviewed publication freezes its earlier COMPLETED target, cancellation resumes only approved active generation, new target activation denied; receipts/values/generations/native retained. No production settlement/value API.");
}
