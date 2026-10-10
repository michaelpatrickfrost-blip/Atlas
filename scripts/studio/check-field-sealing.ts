import assert from "node:assert/strict";
import { db } from "../../src/core/db/client";
import type { Session } from "../../src/core/auth/session";
import { checksum } from "../../src/core/studio/registry/contracts";
import { fieldMigrationObservationDigest, fieldMigrationObservationSchema, sealFieldMigrationIntent } from "../../src/core/studio/fields/migrations/contracts";
import { withFieldMigrationAuthority } from "../../src/core/studio/fields/migrations/authority";
import { digestFieldMigrationArchive } from "../../src/core/studio/fields/migrations/archive-digest";
import { sealScalarFieldMigrationPreparation } from "../../src/core/studio/fields/migrations/sealing";
import { collectFieldMigrationBatch } from "../../src/core/studio/fields/migrations/collection";
import { startFieldMigrationPreparation } from "../../src/core/studio/fields/migrations/preparation";

/** Actual scalar seal plus separately labelled privileged formatter fixtures;
 * no target/native/value mutations or executable operation are exercised here.
 */
export async function checkFieldSealing(session: Session, preparationId: string, otherOrganisationId: string) {
  assert(process.platform === "linux" && process.env.ATLAS_STUDIO_LIVE_TEST === "1");
  assert(await db.organisation.findFirst({ where: { id: session.organisationId, isTest: true, slug: { startsWith: "studio-check-" }, status: "ACTIVE" } }));
  const saved = await db.studioFieldMigrationPreparation.findFirstOrThrow({ where: { id: preparationId, organisationId: session.organisationId } });
  const intent = sealFieldMigrationIntent(saved.intent).intent;
  const originalRows = await db.studioFieldMigrationObservation.findMany({ where: { preparationId, organisationId: session.organisationId }, orderBy: { recordId: "asc" } });
  const node = fieldMigrationObservationDigest(); originalRows.forEach(row => node.append(row.observation)); const expected = node.finish();
  const aggregate = await withFieldMigrationAuthority(session, intent.principal, ({ transaction }) => digestFieldMigrationArchive(transaction, intent));
  assert.deepEqual(aggregate, { ...expected, duplicateTarget: false });
  const request = { preparationId, revision: saved.revision };
  await assert.rejects(() => sealScalarFieldMigrationPreparation({ ...session, organisationId: otherOrganisationId }, request), /stale|changed/i);
  await assert.rejects(() => sealScalarFieldMigrationPreparation(session, { ...request, summary: expected.summary }));
  if (saved.revision > 0) await assert.rejects(() => sealScalarFieldMigrationPreparation(session, { ...request, revision: saved.revision - 1 }), /stale|changed/i);
  const trigger = `studio_sealing_audit_${crypto.randomUUID().replaceAll("-", "")}`;
  assert(/^[a-z0-9_]+$/.test(trigger) && /^[a-zA-Z0-9_-]+$/.test(session.organisationId) && /^[a-zA-Z0-9_-]+$/.test(session.userId) && /^[a-f0-9-]+$/.test(preparationId));
  await db.$executeRawUnsafe(`CREATE FUNCTION ${trigger}() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN IF NEW."organisationId"='${session.organisationId}' AND NEW."actorUserId"='${session.userId}' AND NEW."entityId"='${preparationId}' AND NEW.action='studio.field.migration.reviewed' THEN RAISE EXCEPTION 'Exact Test sealing Audit failure'; END IF; RETURN NEW; END $$;`);
  try {
    await db.$executeRawUnsafe(`CREATE TRIGGER ${trigger} BEFORE INSERT ON audit_entries FOR EACH ROW EXECUTE FUNCTION ${trigger}();`);
    await assert.rejects(() => sealScalarFieldMigrationPreparation(session, request), /Exact Test sealing Audit failure/);
    assert.equal(await db.studioFieldMigrationReview.count({ where: { id: preparationId } }), 0);
    assert.equal((await db.studioFieldMigrationPreparation.findFirstOrThrow({ where: { id: preparationId, organisationId: session.organisationId } })).revision, saved.revision);
  } finally {
    await db.$executeRawUnsafe(`DROP TRIGGER IF EXISTS ${trigger} ON audit_entries;`);
    await db.$executeRawUnsafe(`DROP FUNCTION IF EXISTS ${trigger}();`);
  }
  const result = await sealScalarFieldMigrationPreparation(session, request);
  assert.deepEqual(result.cohort, { recordCount: expected.recordCount, observationDigest: expected.observationDigest }); assert.deepEqual(result.summary, expected.summary);
  assert.equal(result.revision, saved.revision + 1); assert.equal(result.state, "REVIEWED"); assert.equal(result.replayed, false);
  assert.deepEqual(await sealScalarFieldMigrationPreparation(session, request), { ...result, replayed: true });
  assert.equal(await db.auditEntry.count({ where: { organisationId: session.organisationId, entityId: preparationId, action: "studio.field.migration.reviewed" } }), 1);
  await assert.rejects(() => collectFieldMigrationBatch(session, { preparationId, revision: result.revision, limit: 1 }), /stale|changed/i);
  assert.equal(await db.studioFieldGeneration.count({ where: { id: intent.target.payload.storageGeneration } }), 0);

  // Formatter-only archive fixture. Invented anchors and result classes have no
  // canonical coverage, so this operation cannot seal or authorise conversion.
  const fixture = await startFieldMigrationPreparation(session, intent.principal, { operationId: crypto.randomUUID(), definitionId: intent.definitionId,
    definitionRevision: intent.definitionRevision, draftRevision: intent.target.draftRevision, conversion: intent.conversion });
  const fixtureSaved = await db.studioFieldMigrationPreparation.findFirstOrThrow({ where: { id: fixture.id, organisationId: session.organisationId } });
  const fixtureIntent = sealFieldMigrationIntent(fixtureSaved.intent).intent;
  const empty = fieldMigrationObservationDigest().finish();
  assert.deepEqual(await withFieldMigrationAuthority(session, intent.principal, ({ transaction }) => digestFieldMigrationArchive(transaction, fixtureIntent)), { ...empty, duplicateTarget: false });
  const hash = checksum({ type: "decimal", value: "0" });
  const frames = [
    { recordId: `digest_${fixture.id.replaceAll("-", "")}_a`, nativeRevision: 1, extension: null, result: { kind: "invalid", code: "INVALID_TARGET" } },
    { recordId: `digest_${fixture.id.replaceAll("-", "")}_b`, nativeRevision: 1, extension: null, result: { kind: "valid", targetFingerprint: hash, isNull: false, lossy: true } },
    { recordId: `digest_${fixture.id.replaceAll("-", "")}_c`, nativeRevision: 1, extension: null, result: { kind: "valid", targetFingerprint: hash, isNull: false, lossy: false } },
  ].map(row => fieldMigrationObservationSchema.parse(row));
  await withFieldMigrationAuthority(session, intent.principal, async ({ transaction }) => {
    for (const observation of frames) await transaction.studioFieldMigrationObservation.create({ data: { preparationId: fixture.id, organisationId: session.organisationId,
      definitionId: intent.definitionId, entityId: intent.source.payload.entity.id, sourceGenerationId: intent.source.payload.storageGeneration,
      recordId: observation.recordId, nativeRevision: observation.nativeRevision, observation } });
  });
  const fixtureNode = fieldMigrationObservationDigest(); frames.sort((a, b) => a.recordId.localeCompare(b.recordId)).forEach(row => fixtureNode.append(row));
  assert.deepEqual(await withFieldMigrationAuthority(session, intent.principal, ({ transaction }) => digestFieldMigrationArchive(transaction, fixtureIntent)), { ...fixtureNode.finish(), duplicateTarget: true });
  await assert.rejects(() => sealScalarFieldMigrationPreparation(session, { preparationId: fixture.id, revision: 0 }), /MIGRATION_COHORT_CHANGED/);
  console.log("PASS actual scalar seal: exact source/written/owner coverage, SQL–Node v1 digest parity, immutable review/summary/CAS, actual Audit rollback, fresh replay and sealed append denial; no target/native/value mutation. Separate privileged formatter fixtures cover empty/invalid/lossy/duplicates and cannot seal.");
  return result;
}
