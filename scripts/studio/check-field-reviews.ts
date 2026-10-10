import assert from "node:assert/strict";
import { db } from "../../src/core/db/client";
import type { Session } from "../../src/core/auth/session";
import type { FieldMigrationPrincipal } from "../../src/core/studio/fields/principal-contract";
import { createDraft, publishDraft, activateVersion, updateDraft } from "../../src/core/studio/definitions/service";
import { compileCustomField } from "../../src/core/studio/compiler/fields";
import { customFieldPayloadSchema } from "../../src/core/studio/fields/schema";
import { studioRegistry } from "../../src/core/studio/registry/runtime";
import { checksum } from "../../src/core/studio/registry/contracts";
import { fieldMigrationObservationDigest, sealFieldMigrationIntent, sealFieldMigrationReview,
  readSealedFieldMigrationReview, type FieldMigrationObservation } from "../../src/core/studio/fields/migrations/contracts";

/** Exact synthetic schema fixtures; not the unfinished migration preview API. */
export async function checkFieldReviews(session: Session, principal: FieldMigrationPrincipal, ticketId: string, otherOrganisationId: string) {
  assert(process.platform === "linux" && process.env.ATLAS_STUDIO_LIVE_TEST === "1");
  for (const id of [session.organisationId, otherOrganisationId])
    assert(await db.organisation.findFirst({ where: { id, isTest: true, slug: { startsWith: "studio-check-" } } }));
  const registry = studioRegistry(), entity = registry.describe("tickets.ticket", 2);
  const anchor = await registry.authoriseRecord({ session }, entity, { recordId: ticketId, intent: "read" });
  const payload = customFieldPayloadSchema.parse({ schemaVersion: 1,
    entity: { id: entity.id, version: entity.version, schemaHash: entity.schemaHash, contractHash: entity.contractHash },
    storageGeneration: crypto.randomUUID(), field: { key: "schema_review", label: "Schema review", classification: "confidential", storage: { type: "integer" } } });
  const definition = await createDraft(session, { key: "tickets.ticket.schema_review", name: "Review schema acceptance", kind: "customField", payload });
  const published = await publishDraft(session, { definitionId: definition.id, revision: 0, acknowledgeWarnings: true });
  let current = await db.studioDefinition.findFirstOrThrow({ where: { id: definition.id, organisationId: session.organisationId }, include: { draft: true } });
  await activateVersion(session, { definitionId: definition.id, versionId: published.versionId, revision: current.revision });
  assert(current.draft);
  const target = customFieldPayloadSchema.parse({ ...payload, storageGeneration: crypto.randomUUID(), field: { ...payload.field, storage: { type: "decimal", precision: 28, scale: 10 } } });
  await updateDraft(session, { definitionId: definition.id, revision: current.draft.revision, payload: target });
  current = await db.studioDefinition.findFirstOrThrow({ where: { id: definition.id, organisationId: session.organisationId }, include: { draft: true } });
  assert(current.draft);
  const source = await db.studioDefinitionVersion.findFirstOrThrow({ where: { id: published.versionId, definitionId: definition.id, organisationId: session.organisationId } });
  const compiled = await compileCustomField(session, target, registry), ownerQuery = registry.describe("tickets.ticket.migration_cohort", 1);
  const base = { schemaVersion: 1, organisationId: session.organisationId, definitionId: definition.id, definitionRevision: current.revision,
    principal, source: { versionId: source.id, versionChecksum: source.checksum, payload },
    target: { draftId: current.draft.id, draftRevision: current.draft.revision, compiledChecksum: compiled.checksum, payload: target },
    conversion: { kind: "integer_to_decimal" },
    ownerQuery: { id: ownerQuery.id, version: ownerQuery.version, schemaHash: ownerQuery.schemaHash, contractHash: ownerQuery.contractHash } };
  function preparation(id = crypto.randomUUID()) {
    const sealed = sealFieldMigrationIntent({ ...base, id });
    return { id, organisationId: session.organisationId, definitionId: definition.id, entityId: entity.id,
      sourceVersionId: source.id, sourceGenerationId: payload.storageGeneration, draftId: current.draft!.id,
      targetGenerationId: target.storageGeneration, intent: sealed.intent, intentChecksum: sealed.checksum };
  }
  const data = preparation(), job = await db.studioFieldMigrationPreparation.create({ data });
  await assert.rejects(() => db.studioFieldMigrationPreparation.create({ data: { ...preparation(), organisationId: otherOrganisationId } }), /tenant-owned|foreign key/i);
  await assert.rejects(() => db.studioFieldMigrationPreparation.create({ data: { ...preparation(), sourceGenerationId: target.storageGeneration } }), /tenant-owned|shape|foreign key/i);
  await assert.rejects(() => db.studioFieldMigrationPreparation.update({ where: { id: job.id }, data: { intentChecksum: "f".repeat(64), revision: 1 } }), /immutable/);
  await assert.rejects(() => db.studioFieldMigrationPreparation.update({ where: { id: job.id }, data: { state: "REVIEWED", revision: 1 } }), /sealed review/);
  const absent: FieldMigrationObservation = { recordId: ticketId, nativeRevision: anchor.revision, extension: null,
    result: { kind: "valid", targetFingerprint: checksum(null), isNull: true, lossy: false } };
  const rowData = { preparationId: job.id, organisationId: session.organisationId, definitionId: definition.id,
    entityId: entity.id, sourceGenerationId: payload.storageGeneration, recordId: ticketId, nativeRevision: anchor.revision, observation: absent };
  await assert.rejects(() => db.studioFieldMigrationObservation.create({ data: { ...rowData, organisationId: otherOrganisationId } }), /tenant-owned|foreign key/i);
  const row = await db.studioFieldMigrationObservation.create({ data: rowData });
  await assert.rejects(() => db.studioFieldMigrationObservation.create({ data: rowData }), /unique constraint/i);
  await assert.rejects(() => db.studioFieldMigrationObservation.update({ where: { id: row.id }, data: { nativeRevision: anchor.revision + 1 } }), /immutable/);
  const digest = fieldMigrationObservationDigest(); digest.append(absent); const coverage = digest.finish();
  const sealed = sealFieldMigrationReview({ ...data.intent, cohort: { recordCount: coverage.recordCount, observationDigest: coverage.observationDigest }, summary: coverage.summary });
  await assert.rejects(() => db.studioFieldMigrationReview.create({ data: { id: job.id, organisationId: otherOrganisationId, definitionId: definition.id, review: sealed.review, checksum: sealed.checksum } }), /tenant-owned|foreign key/i);
  await assert.rejects(() => db.studioFieldMigrationReview.create({ data: { id: job.id, organisationId: session.organisationId, definitionId: definition.id,
    review: { ...sealed.review, cohort: { ...sealed.review.cohort, recordCount: 2 } }, checksum: sealed.checksum } }), /all stored observations/);
  const saved = await db.studioFieldMigrationReview.create({ data: { id: job.id, organisationId: session.organisationId, definitionId: definition.id, review: sealed.review, checksum: sealed.checksum } });
  assert.deepEqual(readSealedFieldMigrationReview({ review: saved.review, checksum: saved.checksum }), sealed);
  await assert.rejects(() => db.studioFieldMigrationReview.update({ where: { id: job.id }, data: { checksum: "f".repeat(64) } }), /immutable/);
  await assert.rejects(() => db.studioFieldMigrationObservation.create({ data: { ...rowData, recordId: "another-record", observation: { ...absent, recordId: "another-record" } } }), /unsealed/);
  await assert.rejects(() => db.studioFieldMigrationPreparation.update({ where: { id: job.id }, data: { state: "REVIEWED", revision: 0 } }), /CAS/);
  assert.equal((await db.studioFieldMigrationPreparation.updateMany({ where: { id: job.id, organisationId: session.organisationId, revision: 0, state: "PREPARING" }, data: { state: "REVIEWED", revision: 1 } })).count, 1);
  assert.equal((await db.studioFieldMigrationPreparation.updateMany({ where: { id: job.id, organisationId: session.organisationId, revision: 0 }, data: { state: "CANCELLED", revision: 1 } })).count, 0);
  await assert.rejects(() => db.studioFieldMigrationPreparation.update({ where: { id: job.id }, data: { state: "PREPARING", revision: 2 } }), /transition/);
  await assert.rejects(() => db.$transaction(async tx => {
    await tx.studioFieldMigrationPreparation.update({ where: { id: job.id }, data: { state: "CANCELLED", revision: 2 } });
    await tx.auditEntry.create({ data: { organisationId: session.organisationId, actorUserId: `${session.userId}${String.fromCharCode(0)}`, action: "studio.schema.review.fixture", entityType: "StudioFieldMigrationPreparation", entityId: job.id } });
  }), /UTF8|0x00|invalid byte|zero byte|NUL/i);
  assert.equal((await db.studioFieldMigrationPreparation.findUniqueOrThrow({ where: { id: job.id } })).state, "REVIEWED");
  assert.equal(await db.studioExtensionRecord.count({ where: { organisationId: session.organisationId, entityId: entity.id, recordId: ticketId } }), 0);
  // Privileged SQL fixture only: source storage references must match the exact
  // tenant, extension, generation, slot pointer, schema and immutable fingerprint.
  const storedJob = await db.studioFieldMigrationPreparation.create({ data: preparation() });
  const stored = await db.$transaction(async tx => {
    const extension = await tx.studioExtensionRecord.create({ data: { organisationId: session.organisationId, entityId: entity.id, recordId: ticketId, revision: 1 } });
    const slot = await tx.studioFieldSlot.create({ data: { organisationId: session.organisationId, entityId: entity.id, extensionId: extension.id, definitionId: definition.id, generationId: payload.storageGeneration } });
    const value = await tx.studioFieldValue.create({ data: { organisationId: session.organisationId, definitionId: definition.id, generationId: payload.storageGeneration, slotId: slot.id,
      versionId: source.id, revision: 1, valueType: "integer", integerValue: 0n, fingerprint: checksum({ type: "integer", value: 0 }), createdBy: session.userId } });
    await tx.studioFieldSlot.update({ where: { id: slot.id }, data: { revision: 1, activeValueId: value.id } });
    return { extension, slot, value };
  });
  const linked: FieldMigrationObservation = { recordId: ticketId, nativeRevision: anchor.revision,
    extension: { id: stored.extension.id, revision: 1, slot: { id: stored.slot.id, revision: 1,
      value: { id: stored.value.id, revision: 1, versionId: source.id, fingerprint: stored.value.fingerprint } } },
    result: { kind: "valid", targetFingerprint: checksum({ type: "decimal", value: "0" }), isNull: false, lossy: false } };
  const linkedData = { ...rowData, preparationId: storedJob.id, extensionId: stored.extension.id, extensionRevision: 1,
    slotId: stored.slot.id, slotRevision: 1, valueId: stored.value.id, observation: linked };
  await assert.rejects(() => db.studioFieldMigrationObservation.create({ data: { ...rowData, preparationId: storedJob.id } }), /observation changed/);
  await assert.rejects(() => db.studioFieldMigrationObservation.create({ data: { ...linkedData, extensionRevision: 2 } }), /observation changed/);
  await assert.rejects(() => db.studioFieldMigrationObservation.create({ data: { ...linkedData, valueId: crypto.randomUUID() } }), /observation changed/);
  await assert.rejects(() => db.studioFieldMigrationObservation.create({ data: { ...linkedData, observation: { ...linked, privateValue: "Must not be copied" } } }), /exact immutable source/);
  const wrongFingerprint = structuredClone(linked); wrongFingerprint.extension!.slot!.value!.fingerprint = "f".repeat(64);
  await assert.rejects(() => db.studioFieldMigrationObservation.create({ data: { ...linkedData, observation: wrongFingerprint } }), /exact immutable source/);
  await db.studioFieldMigrationObservation.create({ data: linkedData });
  const storedDigest = fieldMigrationObservationDigest(); storedDigest.append(linked); const storedCoverage = storedDigest.finish();
  const linkedReview = sealFieldMigrationReview({ ...storedJob.intent as object, cohort: { recordCount: storedCoverage.recordCount, observationDigest: storedCoverage.observationDigest }, summary: storedCoverage.summary });
  await db.studioFieldMigrationReview.create({ data: { id: storedJob.id, organisationId: session.organisationId, definitionId: definition.id, review: linkedReview.review, checksum: linkedReview.checksum } });
  // SQL fixtures establish the owning query's exact-set proof independently of
  // the future preview service. Never change canonical native records to test it.
  const snapshot = registry.describe("tickets.ticket.field_migration", 1);
  const invokeCoverage = (id: string, actor = session) => db.$transaction(tx => registry.invokeQueryInTransaction({ session: actor, transaction: tx }, snapshot,
    { mode: "coverage", preparationId: id }), { isolationLevel: "Serializable" });
  await assert.rejects(() => invokeCoverage(job.id), /MIGRATION_COHORT_CHANGED/);
  await assert.rejects(() => invokeCoverage(crypto.randomUUID()), /MIGRATION_REVIEW_UNAVAILABLE/);
  await assert.rejects(() => invokeCoverage(job.id, { ...session, organisationId: otherOrganisationId }), /MIGRATION_ACCESS_REQUIRED|FORBIDDEN|unavailable/i);
  const native = await db.serviceWorkItem.findMany({ where: { organisationId: session.organisationId, kind: "TICKET" }, orderBy: { id: "asc" }, select: { id: true, version: true } });
  assert(native.length > 1);
  async function coverageFixture(change: "none" | "missing" | "substitute" | "revision") {
    const prepared = preparation();
    const sealedIntent = sealFieldMigrationIntent({ ...prepared.intent, ownerQuery: { id: snapshot.id, version: snapshot.version, schemaHash: snapshot.schemaHash, contractHash: snapshot.contractHash } });
    const coverageJob = await db.studioFieldMigrationPreparation.create({ data: { ...prepared, intent: sealedIntent.intent, intentChecksum: sealedIntent.checksum } });
    for (let index = 0; index < native.length; index++) {
      const record = native[index]; if (change === "missing" && index === 0) continue;
      const recordId = change === "substitute" && index === 0 ? `missing-native-${crypto.randomUUID()}` : record.id;
      const nativeRevision = record.version + (change === "revision" && index === 0 ? 1 : 0);
      const extension = await db.studioExtensionRecord.findFirst({ where: { organisationId: session.organisationId, entityId: entity.id, recordId },
        include: { slots: { where: { definitionId: definition.id, generationId: payload.storageGeneration }, include: { activeValue: true } } } });
      const slot = extension?.slots[0], value = slot?.activeValue;
      const observation: FieldMigrationObservation = { recordId, nativeRevision, extension: extension ? { id: extension.id, revision: extension.revision,
        slot: slot ? { id: slot.id, revision: slot.revision, value: value ? { id: value.id, revision: value.revision, versionId: value.versionId, fingerprint: value.fingerprint } : null } : null } : null,
        result: recordId === ticketId ? linked.result : absent.result };
      await db.studioFieldMigrationObservation.create({ data: { preparationId: coverageJob.id, organisationId: session.organisationId, definitionId: definition.id,
        entityId: entity.id, sourceGenerationId: payload.storageGeneration, recordId, nativeRevision,
        ...(extension ? { extensionId: extension.id, extensionRevision: extension.revision } : {}),
        ...(slot ? { slotId: slot.id, slotRevision: slot.revision } : {}), ...(value ? { valueId: value.id } : {}), observation } });
    }
    return coverageJob;
  }
  const completeJob = await coverageFixture("none");
  assert.deepEqual(await invokeCoverage(completeJob.id), { mode: "coverage", organisationId: session.organisationId, entityId: entity.id, count: native.length, nativeCoverageComplete: true });
  for (const change of ["missing", "substitute", "revision"] as const) {
    const changed = await coverageFixture(change);
    if (change !== "missing") assert.equal(await db.studioFieldMigrationObservation.count({ where: { preparationId: changed.id } }), native.length);
    await assert.rejects(() => invokeCoverage(changed.id), /MIGRATION_COHORT_CHANGED/);
  }
  await db.studioFieldMigrationPreparation.update({ where: { id: completeJob.id }, data: { state: "CANCELLED", revision: 1 } });
  await assert.rejects(() => invokeCoverage(completeJob.id), /MIGRATION_REVIEW_UNAVAILABLE/);
  console.log("PASS actual owner coverage: exact canonical set and native revisions; incomplete, equal-count substituted, stale revision, foreign/missing/cancelled preparation denied; read-only native authority, no preview executor.");
  const stale = await db.studioFieldMigrationPreparation.create({ data: preparation() });
  await updateDraft(session, { definitionId: definition.id, revision: current.draft.revision, payload: { ...target, field: { ...target.field, label: "Changed after preparation" } } });
  await assert.rejects(() => db.studioFieldMigrationReview.create({ data: { id: stale.id, organisationId: session.organisationId, definitionId: definition.id,
    review: { ...sealed.review, id: stale.id }, checksum: sealed.checksum } }), /fresh tenant-owned intent/);
  assert.equal(await db.studioFieldMigrationReview.count({ where: { id: stale.id } }), 0);
  assert.equal(await db.studioFieldGeneration.count({ where: { id: target.storageGeneration } }), 0);
  console.log("PASS preparation/review SQL archive: tenant/source/draft FKs, missing-anchor and exact stored value observations, immutable pins/history, sealed append denial, state/revision CAS, stale draft and audit-failure rollback; privileged synthetic source fixture only, no native mutation or migration executor.");
}
