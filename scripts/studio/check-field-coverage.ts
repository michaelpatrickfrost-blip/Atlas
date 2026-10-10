import assert from "node:assert/strict";
import { db } from "../../src/core/db/client";
import type { Session } from "../../src/core/auth/session";
import { studioRegistry } from "../../src/core/studio/registry/runtime";
import { sealFieldMigrationIntent } from "../../src/core/studio/fields/migrations/contracts";
import { withFieldMigrationAuthority } from "../../src/core/studio/fields/migrations/authority";
import { validateFieldMigrationSourceCoverage } from "../../src/core/studio/fields/migrations/coverage";

/** Exact Test metadata-only coverage proof; no target/native/value mutation. */
export async function checkFieldCoverage(session: Session, preparationId: string, activeTicketId: string) {
  assert(process.platform === "linux" && process.env.ATLAS_STUDIO_LIVE_TEST === "1");
  assert(await db.organisation.findFirst({ where: { id: session.organisationId, isTest: true, slug: { startsWith: "studio-check-" }, status: "ACTIVE" } }));
  const saved = await db.studioFieldMigrationPreparation.findFirstOrThrow({ where: { id: preparationId, organisationId: session.organisationId } });
  const sealed = sealFieldMigrationIntent(saved.intent); assert.equal(sealed.checksum, saved.intentChecksum);
  const intent = sealed.intent, registry = studioRegistry();
  const check = () => withFieldMigrationAuthority(session, intent.principal, async ({ session: fresh, transaction, company }) => {
    await validateFieldMigrationSourceCoverage({ session: fresh, transaction }, registry, company, intent);
  });
  await check();
  const nativeBefore = await db.serviceWorkItem.findMany({ where: { organisationId: session.organisationId, kind: "TICKET" }, orderBy: { id: "asc" }, select: { id: true, version: true } });
  // Privileged synthetic metadata fixture through the normal owner guard. A
  // new extension revision must invalidate coverage even if native anchors and
  // the source value pointer are otherwise unchanged. Never decrement history.
  await withFieldMigrationAuthority(session, intent.principal, async ({ session: fresh, transaction }) => {
    const context = { session: fresh, transaction };
    const anchor = await registry.authoriseRecord(context, intent.source.payload.entity, { recordId: activeTicketId, intent: "read" });
    await registry.authoriseRecord(context, intent.source.payload.entity, { recordId: activeTicketId, intent: "extend", expectedRevision: anchor.revision });
    const extension = await transaction.studioExtensionRecord.findFirstOrThrow({ where: { organisationId: fresh.organisationId, entityId: intent.source.payload.entity.id, recordId: activeTicketId } });
    assert.equal((await transaction.studioExtensionRecord.updateMany({ where: { id: extension.id, organisationId: fresh.organisationId, revision: extension.revision }, data: { revision: extension.revision + 1 } })).count, 1);
  });
  await assert.rejects(check, /stale|changed/i);
  assert.deepEqual(await db.serviceWorkItem.findMany({ where: { organisationId: session.organisationId, kind: "TICKET" }, orderBy: { id: "asc" }, select: { id: true, version: true } }), nativeBefore);
  assert.equal(await db.studioFieldMigrationReview.count({ where: { id: preparationId } }), 0);
  assert.equal(await db.studioFieldGeneration.count({ where: { id: intent.target.payload.storageGeneration } }), 0);
  console.log("PASS actual source coverage: exact owner/native cohort plus current extension/slot/value refs and written schema policy; changed extension revision rejected with unchanged native anchors/count; metadata-only Test fixture, no review/target/native/value mutation.");
}
