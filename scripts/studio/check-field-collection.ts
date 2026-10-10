import assert from "node:assert/strict";
import { db } from "../../src/core/db/client";
import type { Session } from "../../src/core/auth/session";
import { collectFieldMigrationBatch } from "../../src/core/studio/fields/migrations/collection";
import { sealFieldMigrationIntent, fieldMigrationObservationDigest } from "../../src/core/studio/fields/migrations/contracts";

/** Actual bounded service and PostgreSQL rollback proof. Exact Test only;
 * no target values, native writes, final review or execution authority.
 */
export async function checkFieldCollection(session: Session, preparationId: string, otherOrganisationId: string) {
  assert(process.platform === "linux" && process.env.ATLAS_STUDIO_LIVE_TEST === "1");
  assert(await db.organisation.findFirst({ where: { id: session.organisationId, isTest: true, slug: { startsWith: "studio-check-" }, status: "ACTIVE" } }));
  const scope = { preparationId, organisationId: session.organisationId };
  const original = await db.studioFieldMigrationPreparation.findFirstOrThrow({ where: { id: preparationId, organisationId: session.organisationId } });
  const intent = sealFieldMigrationIntent(original.intent).intent;
  assert.equal(original.revision, 0); assert.equal(await db.studioFieldMigrationObservation.count({ where: scope }), 0);
  const request = { preparationId, revision: 0, limit: 1 };
  await assert.rejects(() => collectFieldMigrationBatch({ ...session, organisationId: otherOrganisationId }, request), /stale|changed/i);
  await assert.rejects(() => collectFieldMigrationBatch(session, { ...request, cursor: "forged" }));
  const denied = { ...session, capabilities: new Set([...session.capabilities].filter(cap => cap !== "studio.definition.publish")) };
  await assert.rejects(() => collectFieldMigrationBatch(denied, request), /FORBIDDEN/);
  const trigger = `studio_collection_audit_${crypto.randomUUID().replaceAll("-", "")}`;
  assert(/^[a-z0-9_]+$/.test(trigger) && /^[a-zA-Z0-9_-]+$/.test(session.organisationId) && /^[a-zA-Z0-9_-]+$/.test(session.userId) && /^[a-f0-9-]+$/.test(preparationId));
  await db.$executeRawUnsafe(`CREATE FUNCTION ${trigger}() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN IF NEW."organisationId"='${session.organisationId}' AND NEW."actorUserId"='${session.userId}' AND NEW."entityId"='${preparationId}' AND NEW.action='studio.field.migration.collection_batched' THEN RAISE EXCEPTION 'Exact Test collection Audit failure'; END IF; RETURN NEW; END $$;`);
  try {
    await db.$executeRawUnsafe(`CREATE TRIGGER ${trigger} BEFORE INSERT ON audit_entries FOR EACH ROW EXECUTE FUNCTION ${trigger}();`);
    await assert.rejects(() => collectFieldMigrationBatch(session, request), /Exact Test collection Audit failure/);
    assert.equal(await db.studioFieldMigrationObservation.count({ where: scope }), 0);
    assert.equal((await db.studioFieldMigrationPreparation.findFirstOrThrow({ where: { id: preparationId, organisationId: session.organisationId } })).revision, 0);
  } finally {
    await db.$executeRawUnsafe(`DROP TRIGGER IF EXISTS ${trigger} ON audit_entries;`);
    await db.$executeRawUnsafe(`DROP FUNCTION IF EXISTS ${trigger}();`);
  }
  const first = await collectFieldMigrationBatch(session, request);
  assert.equal(first.appended, 1); assert.equal(first.revision, 1);
  assert.deepEqual(await collectFieldMigrationBatch(session, request), { id: preparationId, revision: 1, state: "PREPARING", replayed: true, appended: 0, cursorExhausted: null });
  assert.equal(await db.auditEntry.count({ where: { organisationId: session.organisationId, entityId: preparationId, action: "studio.field.migration.collection_batched" } }), 1);
  let batch = first;
  for (let n = 0; !batch.cursorExhausted; n++) {
    assert(n < 100, "Exact Test cohort exceeded bounded fixture expectation");
    batch = await collectFieldMigrationBatch(session, { preparationId, revision: batch.revision, limit: 1 });
  }
  const native = await db.serviceWorkItem.findMany({ where: { organisationId: session.organisationId, kind: "TICKET" }, orderBy: { id: "asc" }, select: { id: true, version: true } });
  const observations = await db.studioFieldMigrationObservation.findMany({ where: scope, orderBy: { recordId: "asc" } });
  assert.deepEqual(observations.map(row => [row.recordId, row.nativeRevision]), native.map(row => [row.id, row.version]));
  const digest = fieldMigrationObservationDigest(); for (const row of observations) digest.append(row.observation);
  assert.equal(digest.finish().recordCount, native.length);
  assert.equal(await db.studioFieldMigrationReview.count({ where: { id: preparationId } }), 0);
  assert.equal(await db.studioFieldGeneration.count({ where: { id: intent.target.payload.storageGeneration } }), 0);
  assert.equal((await db.studioFieldMigrationPreparation.findFirstOrThrow({ where: { id: preparationId, organisationId: session.organisationId } })).state, "PREPARING");
  console.log("PASS actual bounded collection: interrupted/resumed stored cursor, no-write lost-response replay, exact canonical native anchors including final/unanchored, actual Audit rollback, tenant/input/publish denial; immutable observations only, no sealed review/target/native mutation.");
  return observations.length;
}
