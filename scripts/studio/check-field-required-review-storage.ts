import assert from "node:assert/strict";
import type { Prisma } from "../../src/generated/prisma/client";
import { db } from "../../src/core/db/client";
import type { Session } from "../../src/core/auth/session";
import type { FieldMigrationPrincipal } from "../../src/core/studio/fields/principal-contract";
import { studioRegistry } from "../../src/core/studio/registry/runtime";
import { checksum } from "../../src/core/studio/registry/contracts";
import { customFieldPayloadSchema } from "../../src/core/studio/fields/schema";
import { conditionalFieldPayloadSchema } from "../../src/core/studio/fields/required-contract";
import { compileFieldMigrationMetadata } from "../../src/core/studio/fields/migrations/metadata";
import { requiredFieldMigrationObservationDigest, sealRequiredFieldMigrationIntent, sealRequiredFieldMigrationReview,
  type RequiredFieldMigrationObservation } from "../../src/core/studio/fields/migrations/required-contracts";
import { digestRequiredFieldMigrationArchive } from "../../src/core/studio/fields/migrations/archive-digest";
import { observeRequiredFieldMigrationRecord } from "../../src/core/studio/fields/migrations/observation";
import { inspectRequiredFieldMigrationReview } from "../../src/core/studio/fields/migrations/inspection";
import { startFieldMigrationPreparation } from "../../src/core/studio/fields/migrations/preparation";
import { collectFieldMigrationBatch } from "../../src/core/studio/fields/migrations/collection";
import { sealFieldMigrationPreparation } from "../../src/core/studio/fields/migrations/sealing";
import { readStoredFieldMigrationIntent, readStoredFieldMigrationReview } from "../../src/core/studio/fields/migrations/stored-protocol";
import { Prisma as PrismaRuntime } from "../../src/generated/prisma/client";

/** Exact Test review checks. Archive fixtures roll back completely; their rows
 * use actual authorised inputs and negative packets prove SQL shape only.
 * A separate canonical draft seed then exercises actual prepare/collect/seal
 * services, retaining their immutable history and restoring the saved draft.
 * Native/typed values and active metadata must remain unchanged. No customer
 * conditional authoring, publication/execution, new company, permission or dump. */
export async function checkRequiredFieldReviewStorage(session: Session, principal: FieldMigrationPrincipal, definitionId: string) {
  assert(process.platform === "linux" && process.env.ATLAS_STUDIO_LIVE_TEST === "1");
  const organisationId = session.organisationId, scope = { organisationId };
  const company = await db.organisation.findFirstOrThrow({ where: { id: organisationId, kind: "CUSTOMER", status: "ACTIVE", isTest: true, slug: { startsWith: "studio-check-" } },
    select: { id: true, kind: true, status: true, archivedAt: true, isTest: true } });
  async function snapshot() {
    const counts = [await db.studioDefinition.count({ where: scope }), await db.studioDefinitionVersion.count({ where: scope }),
      await db.studioDraft.count({ where: scope }), await db.studioFieldGeneration.count({ where: scope }), await db.studioExtensionRecord.count({ where: scope }),
      await db.studioFieldSlot.count({ where: scope }), await db.studioFieldValue.count({ where: scope }), await db.studioFieldMigrationPreparation.count({ where: scope }),
      await db.studioFieldMigrationObservation.count({ where: scope }), await db.studioFieldMigrationReview.count({ where: scope }), await db.auditEntry.count({ where: scope })];
    return { counts, definition: await db.studioDefinition.findFirstOrThrow({ where: { id: definitionId, organisationId } }),
      draft: await db.studioDraft.findFirstOrThrow({ where: { definitionId, organisationId } }),
      native: await db.serviceWorkItem.findMany({ where: { organisationId, kind: "TICKET" }, orderBy: { id: "asc" } }),
      slots: await db.studioFieldSlot.findMany({ where: scope, orderBy: { id: "asc" } }),
      values: await db.studioFieldValue.findMany({ where: scope, orderBy: { id: "asc" } }) };
  }
  const before = await snapshot(), rolledBack = new Error("Exact conditional archive fixture rollback");
  async function setup(tx: Prisma.TransactionClient) {
    const definition = await tx.studioDefinition.findFirstOrThrow({ where: { id: definitionId, organisationId }, include: { activeVersion: true, draft: true } });
    assert(definition.activeVersion && definition.draft);
    const source = customFieldPayloadSchema.parse(definition.activeVersion.payload), draft = customFieldPayloadSchema.parse(definition.draft.payload);
    const registry = studioRegistry(), entity = registry.describe("tickets.ticket", 9), ownerQuery = registry.describe("tickets.ticket.field_migration", 4);
    // Existing owner preflight guards canonical/private access before IDs/counts.
    await registry.invokeQueryInTransaction({ session, transaction: tx }, ownerQuery, { mode: "preflight" });
    const proposed = conditionalFieldPayloadSchema.parse({ ...draft, schemaVersion: 2,
      entity: { id: entity.id, version: entity.version, schemaHash: entity.schemaHash, contractHash: entity.contractHash }, storageGeneration: crypto.randomUUID(),
      requiredIf: { match: "all", predicates: [{ source: { kind: "native", fieldId: "status" }, operator: "present" }] } });
    const compiled = await compileFieldMigrationMetadata({ session, transaction: tx }, registry, company, definitionId, proposed);
    // Exact saved canonical draft pin. Privileged Test fixture, rollback-only;
    // production preparation must use edit-authorised CAS/Audit or a saved draft.
    const updated = await tx.studioDraft.update({ where: { id: definition.draft.id }, data: { revision: definition.draft.revision + 1, payload: compiled.payload } });
    const sealed = sealRequiredFieldMigrationIntent({ schemaVersion: 2, id: crypto.randomUUID(), organisationId, definitionId,
      definitionRevision: definition.revision, principal, source: { versionId: definition.activeVersion.id, versionChecksum: definition.activeVersion.checksum, payload: source },
      target: { draftId: updated.id, draftRevision: updated.revision, compiledChecksum: compiled.checksum, payload: compiled.payload }, conversion: { kind: "integer_to_decimal" },
      ownerQuery: { id: ownerQuery.id, version: ownerQuery.version, schemaHash: ownerQuery.schemaHash, contractHash: ownerQuery.contractHash } });
    return { intent: sealed.intent, data: { id: sealed.intent.id, organisationId, definitionId, entityId: entity.id, sourceVersionId: definition.activeVersion.id,
      sourceGenerationId: source.storageGeneration, draftId: updated.id, targetGenerationId: proposed.storageGeneration, intent: sealed.intent, intentChecksum: sealed.checksum } };
  }
  async function records(tx: Prisma.TransactionClient, intent: Awaited<ReturnType<typeof setup>>["intent"], evaluate = false) {
    const native = await tx.serviceWorkItem.findMany({ where: { organisationId, kind: "TICKET" }, select: { id: true, version: true }, orderBy: { id: "asc" } });
    assert(native.length > 1);
    const rows: RequiredFieldMigrationObservation[] = [];
    for (const record of native) {
      if (evaluate) {
        rows.push(await observeRequiredFieldMigrationRecord({ session, transaction: tx }, intent,
          { recordId: record.id, organisationId, revision: record.version }));
        continue;
      }
      const extension = await tx.studioExtensionRecord.findFirst({ where: { organisationId, entityId: "tickets.ticket", recordId: record.id },
        include: { slots: { where: { definitionId, generationId: intent.source.payload.storageGeneration }, include: { activeValue: true } } } });
      const slot = extension?.slots[0], value = slot?.activeValue;
      if (value && !value.isNull) {
        assert.equal(value.valueType, "integer"); assert.equal(value.integerValue, 0n);
        assert.equal(value.fingerprint, checksum({ type: "integer", value: 0 }));
      }
      rows.push({ recordId: record.id, nativeRevision: record.version, extension: extension ? { id: extension.id, revision: extension.revision,
        slot: slot ? { id: slot.id, revision: slot.revision, value: value ? { id: value.id, revision: value.revision, versionId: value.versionId, fingerprint: value.fingerprint } : null } : null } : null,
        requirement: { sourceEvaluationChecksum: checksum("SQL source integrity fixture"), targetEvaluationChecksum: checksum("SQL target integrity fixture"), targetRequired: true },
        result: value && !value.isNull ? { kind: "valid", targetFingerprint: checksum({ type: "decimal", value: "0" }), isNull: false, lossy: false }
          : { kind: "invalid", code: "FIELD_REQUIRED" } });
    }
    return rows;
  }
  function rowData(id: string, intent: Awaited<ReturnType<typeof setup>>["intent"], observation: RequiredFieldMigrationObservation) {
    const extension = observation.extension, slot = extension?.slot;
    return { preparationId: id, organisationId, definitionId, entityId: "tickets.ticket", sourceGenerationId: intent.source.payload.storageGeneration,
      recordId: observation.recordId, nativeRevision: observation.nativeRevision, extensionId: extension?.id ?? null, extensionRevision: extension?.revision ?? null,
      slotId: slot?.id ?? null, slotRevision: slot?.revision ?? null, valueId: slot?.value?.id ?? null, observation };
  }
  await assert.rejects(db.$transaction(async tx => {
    const fixture = await setup(tx), job = await tx.studioFieldMigrationPreparation.create({ data: fixture.data });
    const stream = requiredFieldMigrationObservationDigest(), rows = await records(tx, fixture.intent, true);
    assert(rows.some(row => row.result.kind === "valid" && !row.result.isNull && row.result.targetFingerprint === checksum({ type: "decimal", value: "0" })));
    assert(rows.some(row => row.result.kind === "invalid" && row.result.code === "FIELD_REQUIRED"));
    for (const row of rows) { stream.append(row); await tx.studioFieldMigrationObservation.create({ data: rowData(job.id, fixture.intent, row) }); }
    const expected = stream.finish(), actual = await digestRequiredFieldMigrationArchive(tx, fixture.intent);
    assert.deepEqual(actual, { ...expected, duplicateTarget: false });
    const review = sealRequiredFieldMigrationReview({ ...fixture.intent, cohort: { recordCount: actual.recordCount, observationDigest: actual.observationDigest }, summary: actual.summary });
    const inspected = await inspectRequiredFieldMigrationReview({ session, transaction: tx }, fixture.intent);
    assert.deepEqual(inspected, review);
    await assert.rejects(() => observeRequiredFieldMigrationRecord({ session: { ...session }, transaction: tx }, fixture.intent,
      { organisationId, recordId: rows[0].recordId, revision: rows[0].nativeRevision }), /authenticated company access/);
    await tx.studioFieldMigrationReview.create({ data: { id: job.id, organisationId, definitionId, review: review.review, checksum: review.checksum } });
    await tx.studioFieldMigrationPreparation.update({ where: { id: job.id }, data: { state: "REVIEWED", revision: 1 } });
    await tx.auditEntry.create({ data: { organisationId, actorUserId: session.userId, action: "studio.required_archive.rollback_fixture", entityType: "StudioFieldMigrationPreparation", entityId: job.id } });
    await tx.$executeRaw`SET CONSTRAINTS ALL IMMEDIATE`;
    throw rolledBack;
  }, { isolationLevel: "Serializable", timeout: 30_000 }), error => error === rolledBack);
  assert.deepEqual(await snapshot(), before);
  for (const change of ["unknown", "coerced", "extra"] as const) {
    await assert.rejects(db.$transaction(async tx => {
      const { data } = await setup(tx);
      const intent = change === "unknown" ? { ...data.intent, schemaVersion: 3 } : change === "coerced" ? { ...data.intent, schemaVersion: "2" }
        : { ...data.intent, suppliedFacts: { status: "private" } };
      await tx.studioFieldMigrationPreparation.create({ data: { ...data, intent } });
    }, { isolationLevel: "Serializable", timeout: 30_000 }), /intent format|intent metadata/i);
  }
  for (const change of ["missing", "raw", "checksum", "optional_required", "required_null", "references", "sealed"] as const) {
    await assert.rejects(db.$transaction(async tx => {
      const fixture = await setup(tx), job = await tx.studioFieldMigrationPreparation.create({ data: fixture.data });
      const row = (await records(tx, fixture.intent))[0];
      let observation: object = row;
      if (change === "missing") { const { requirement, ...without } = row; void requirement; observation = without; }
      if (change === "raw") observation = { ...row, requirement: { ...row.requirement, actualValue: "private" } };
      if (change === "checksum") observation = { ...row, requirement: { ...row.requirement, targetEvaluationChecksum: "bad" } };
      if (change === "optional_required") observation = { ...row, requirement: { ...row.requirement, targetRequired: false }, result: { kind: "invalid", code: "FIELD_REQUIRED" } };
      if (change === "required_null") observation = { ...row, result: { kind: "valid", isNull: true, lossy: false, targetFingerprint: checksum(null) } };
      if (change === "references") observation = { ...row, nativeRevision: row.nativeRevision + 1 };
      if (change === "sealed") {
        const review = sealRequiredFieldMigrationReview({ ...fixture.intent, cohort: { recordCount: 0, observationDigest: requiredFieldMigrationObservationDigest().finish().observationDigest }, summary: { validCount: 0, invalidCount: 0, lossyCount: 0 } });
        await tx.studioFieldMigrationReview.create({ data: { id: job.id, organisationId, definitionId, review: review.review, checksum: review.checksum } });
      }
      await tx.studioFieldMigrationObservation.create({ data: { ...rowData(job.id, fixture.intent, row), observation: observation as Prisma.InputJsonValue } });
    }, { isolationLevel: "Serializable", timeout: 30_000 }), /requirement evidence|preview result|immutable source|unsealed/i);
  }
  assert.deepEqual(await snapshot(), before);
  console.log("PASS conditional archive SQL integrity and actual native9/query4 row review: real authorised source/target conditions, present zero and required unanchored failures, canonical owner coverage before IDs/counts, copied-session denial, bounded actual review inspection, exact source refs/closed2 shape, malformed and sealed denials, SQL/pure ordered digest equality and complete native/typed/draft/metadata/Audit rollback; privileged preparation/sealing fixture, not normal v2 API/publication/execution acceptance.");
  // Authoring stays gated. Seed a canonical draft only in this exact Test company,
  // then prove real service transactions rather than direct archive inserts.
  // Preserve immutable evidence and restore the draft without rewinding revisions.
  const fixture = await db.$transaction(async tx => {
    const result = await setup(tx);
    await tx.auditEntry.create({ data: { organisationId, actorUserId: session.userId,
      action: "studio.required_review.test_draft_seeded", entityType: "StudioDefinition", entityId: definitionId } });
    return result;
  }, { isolationLevel: "Serializable", timeout: 30_000 });
  const operationId = fixture.intent.id;
  async function archive() {
    return { preparation: await db.studioFieldMigrationPreparation.findFirst({ where: { id: operationId, organisationId } }),
      rows: await db.studioFieldMigrationObservation.findMany({ where: { preparationId: operationId, organisationId }, orderBy: { recordId: "asc" } }),
      review: await db.studioFieldMigrationReview.findFirst({ where: { id: operationId, organisationId } }),
      audits: await db.auditEntry.findMany({ where: { organisationId, entityId: operationId }, orderBy: { id: "asc" } }) };
  }
  async function auditFailure(action: "prepared" | "collection_batched" | "reviewed", run: () => Promise<unknown>) {
    const trigger = `studio_required_api_${crypto.randomUUID().replaceAll("-", "")}`, initial = await archive();
    assert(/^[a-z0-9_]+$/.test(trigger) && /^[a-zA-Z0-9_-]+$/.test(organisationId)
      && /^[a-zA-Z0-9_-]+$/.test(session.userId) && /^[a-f0-9-]+$/.test(operationId));
    try {
      await db.$executeRawUnsafe(`CREATE FUNCTION ${trigger}() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN IF NEW."organisationId"='${organisationId}' AND NEW."actorUserId"='${session.userId}' AND NEW."entityId"='${operationId}' AND NEW.action='studio.field.migration.${action}' THEN RAISE EXCEPTION 'Exact Test required review API Audit failure'; END IF; RETURN NEW; END $$;`);
      await db.$executeRawUnsafe(`CREATE TRIGGER ${trigger} BEFORE INSERT ON audit_entries FOR EACH ROW EXECUTE FUNCTION ${trigger}();`);
      await assert.rejects(run, /Exact Test required review API Audit failure/);
      assert.deepEqual(await archive(), initial);
    } finally {
      await db.$executeRawUnsafe(`DROP TRIGGER IF EXISTS ${trigger} ON audit_entries;`);
      await db.$executeRawUnsafe(`DROP FUNCTION IF EXISTS ${trigger}();`);
    }
  }
  try {
    const request = { operationId, definitionId, definitionRevision: fixture.intent.definitionRevision,
      draftRevision: fixture.intent.target.draftRevision, conversion: { kind: "integer_to_decimal" } };
    await auditFailure("prepared", () => startFieldMigrationPreparation(session, principal, request));
    const prepared = await startFieldMigrationPreparation(session, principal, request);
    assert.deepEqual(await startFieldMigrationPreparation(session, principal, request), prepared);
    const saved = (await archive()).preparation!;
    const sealed = readStoredFieldMigrationIntent(saved, organisationId);
    assert.equal(sealed.intent.schemaVersion, 2); assert.equal(sealed.checksum, fixture.data.intentChecksum);
    await assert.rejects(() => startFieldMigrationPreparation(session, principal, { ...request, schemaVersion: 1 }));
    await assert.rejects(() => startFieldMigrationPreparation(session, principal, { ...request, organisationId: "foreign" }));
    const firstRequest = { preparationId: operationId, revision: prepared.revision, limit: 1 };
    await auditFailure("collection_batched", () => collectFieldMigrationBatch(session, firstRequest));
    let batch = await collectFieldMigrationBatch(session, firstRequest);
    const firstArchive = await archive();
    assert.equal((await collectFieldMigrationBatch(session, firstRequest)).replayed, true);
    assert.deepEqual(await archive(), firstArchive);
    for (let page = 0; !batch.cursorExhausted; page++) {
      assert(page < 100, "Conditional collection must be bounded and eventually exhausted.");
      batch = await collectFieldMigrationBatch(session, { preparationId: operationId, revision: batch.revision, limit: 2 });
    }
    const collected = await archive(), stream = requiredFieldMigrationObservationDigest();
    collected.rows.forEach(row => stream.append(row.observation));
    const expected = stream.finish();
    assert.equal(expected.recordCount, before.native.length);
    assert(expected.summary.validCount > 0 && expected.summary.invalidCount > 0);
    assert(collected.rows.some(row => (row.observation as RequiredFieldMigrationObservation).result.kind === "invalid" && row.extensionId === null));
    const sealRequest = { preparationId: operationId, revision: batch.revision };
    await auditFailure("reviewed", () => sealFieldMigrationPreparation(session, sealRequest));
    const reviewed = await sealFieldMigrationPreparation(session, sealRequest);
    assert.deepEqual(reviewed.cohort, { recordCount: expected.recordCount, observationDigest: expected.observationDigest });
    assert.deepEqual(reviewed.summary, expected.summary);
    assert.deepEqual(await sealFieldMigrationPreparation(session, sealRequest), { ...reviewed, replayed: true });
    const final = await archive();
    assert.equal(readStoredFieldMigrationReview(final.review!, organisationId).review.schemaVersion, 2);
    for (const action of ["prepared", "reviewed"])
      assert.equal(final.audits.filter(row => row.action === `studio.field.migration.${action}`).length, 1);
    await assert.rejects(() => collectFieldMigrationBatch(session, { ...firstRequest, revision: reviewed.revision }), /stale|changed/i);
    assert.equal(await db.studioFieldGeneration.count({ where: { id: fixture.intent.target.payload.storageGeneration } }), 0);
  } finally {
    await db.$transaction(async tx => {
      const draft = await tx.studioDraft.findFirstOrThrow({ where: { id: before.draft.id, organisationId, definitionId } });
      assert.equal(checksum(draft.payload), checksum(fixture.intent.target.payload));
      assert.equal(draft.revision, fixture.intent.target.draftRevision);
      assert.equal((await tx.studioDraft.updateMany({ where: { id: draft.id, organisationId, revision: draft.revision },
        data: { payload: before.draft.payload!, revision: { increment: 1 }, validation: PrismaRuntime.DbNull } })).count, 1);
      await tx.auditEntry.create({ data: { organisationId, actorUserId: session.userId,
        action: "studio.required_review.test_draft_restored", entityType: "StudioDefinition", entityId: definitionId } });
    }, { isolationLevel: "Serializable" });
    const after = await snapshot();
    assert.deepEqual(after.native, before.native); assert.deepEqual(after.slots, before.slots); assert.deepEqual(after.values, before.values);
    assert.deepEqual(after.definition, before.definition); assert.deepEqual(after.counts.slice(0, 7), before.counts.slice(0, 7));
    assert.deepEqual(after.draft.payload, before.draft.payload); assert.equal(after.draft.revision, before.draft.revision + 2);
  }
  console.log("PASS actual conditional preparation/collection/sealing APIs: server-derived2, exact current-owner pins, bounded actual condition rows including unanchored failures, response replay without duplicate evidence, SQL/pure seal, all three Audit-failure atomic rollbacks and restored draft with retained review history; privileged Test draft seed only, no conditional authoring/publication/execution/native writes.");
}
