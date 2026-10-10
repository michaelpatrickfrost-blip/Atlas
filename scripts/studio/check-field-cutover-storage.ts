import assert from "node:assert/strict";
import type { Session } from "../../src/core/auth/session";
import type { FieldMigrationPrincipal } from "../../src/core/studio/fields/principal-contract";
import type { FieldMigrationIntent } from "../../src/core/studio/fields/migrations/contracts";
import { db } from "../../src/core/db/client";
import { withFieldMigrationAuthority, type FieldMigrationAuthority } from "../../src/core/studio/fields/migrations/authority";
import { inspectFieldMigrationExecution } from "../../src/core/studio/fields/migrations/execution-inspection";
import { createFieldMigrationCutoverPin } from "../../src/core/studio/fields/migrations/cutover-contract";
import { checkFieldSettlementStorage } from "./check-field-settlement-storage";
import { checksum } from "../../src/core/studio/registry/contracts";

/** Exact Test, rollback-only storage proof. Not a production activation service,
 * endpoint or permission bypass. Current owner/private/field authority first. */
export async function checkFieldCutoverStorage(session: Session, principal: FieldMigrationPrincipal, intent: FieldMigrationIntent, otherOrganisationId: string, parentId: string) {
  assert(process.platform === "linux" && process.env.ATLAS_STUDIO_LIVE_TEST === "1");
  for (const id of [session.organisationId, otherOrganisationId]) assert(await db.organisation.findFirst({ where: { id, isTest: true, kind: "CUSTOMER",
    slug: { startsWith: "studio-check-" }, status: "ACTIVE", archivedAt: null } }));
  const scope = { preparationId: intent.id, organisationId: session.organisationId, definitionId: intent.definitionId };
  const definitionScope = { id: intent.definitionId, organisationId: session.organisationId };
  const before = await db.studioDefinition.findFirstOrThrow({ where: definitionScope });
  const publicationBefore = await db.studioFieldMigrationPublication.findFirstOrThrow({ where: scope });
  const executionBefore = await db.studioFieldMigrationExecution.findFirstOrThrow({ where: scope });
  const nativeWhere = { organisationId: { in: [session.organisationId, otherOrganisationId] } };
  const nativeBefore = await db.serviceWorkItem.findMany({ where: nativeWhere, orderBy: { id: "asc" } });
  async function inspect(authority: FieldMigrationAuthority) {
    const { transaction: tx } = authority, inspected = await inspectFieldMigrationExecution(authority, intent), x = inspected.existing; assert(x);
    const definition = await tx.studioDefinition.findFirstOrThrow({ where: definitionScope,
      select: { id: true, organisationId: true, kind: true, activeVersionId: true, revision: true, latestVersion: true, retiredAt: true } });
    const pinned = createFieldMigrationCutoverPin(inspected.stored, { preparationId: x.preparationId, organisationId: x.organisationId, definitionId: x.definitionId,
      entityId: x.entityId, pin: x.pin, pinChecksum: x.pinChecksum, state: x.state, revision: x.revision, cursor: x.cursor, processedCount: x.processedCount, failureCode: x.failureCode },
    { ...inspected.pin.publication, state: inspected.publication.state, revision: inspected.publication.revision }, definition);
    return { ...pinned, definition, data: { ...scope, sourceVersionId: pinned.pin.source.versionId, targetVersionId: pinned.pin.publication.targetVersionId,
      pin: pinned.pin, pinChecksum: pinned.checksum, createdBy: authority.session.userId } };
  }
  async function unchanged() {
    assert.equal(await db.studioFieldMigrationCutover.count({ where: scope }), 0);
    assert.deepEqual(await db.studioDefinition.findFirstOrThrow({ where: definitionScope }), before);
    assert.deepEqual(await db.studioFieldMigrationPublication.findFirstOrThrow({ where: scope }), publicationBefore);
    assert.deepEqual(await db.studioFieldMigrationExecution.findFirstOrThrow({ where: scope }), executionBefore);
  }
  await assert.rejects(() => withFieldMigrationAuthority(session, principal, async authority => {
    const { data } = await inspect(authority); await authority.transaction.studioFieldMigrationCutover.create({ data });
  }), /receipt publication and exact active pointer must commit together/i);
  await unchanged();
  await assert.rejects(() => withFieldMigrationAuthority(session, principal, async authority => {
    await inspect(authority);
    await authority.transaction.studioFieldMigrationPublication.updateMany({ where: { ...scope, state: "PUBLISHED", revision: publicationBefore.revision },
      data: { state: "CUTOVER", revision: publicationBefore.revision + 1 } });
  }), /exact retained receipt/i);
  await unchanged();
  for (const kind of ["foreign", "stale-execution", "wrong-version", "extra-grant"] as const) {
    await assert.rejects(() => withFieldMigrationAuthority(session, principal, async authority => {
      const { data, pin } = await inspect(authority);
      if (kind === "foreign") data.organisationId = otherOrganisationId;
      if (kind === "wrong-version") data.targetVersionId = data.sourceVersionId;
      if (kind === "stale-execution") { data.pin = { ...pin, execution: { ...pin.execution, revision: pin.execution.revision + 1 } }; data.pinChecksum = checksum(data.pin); }
      if (kind === "extra-grant") { const forged = { ...pin, canRollback: true }; data.pin = forged; data.pinChecksum = checksum(forged); }
      await authority.transaction.studioFieldMigrationCutover.create({ data });
    }), /unchanged published|identity|tenant|foreign key|check constraint/i);
    await unchanged();
  }
  const rolledBack = new Error("Exact Test complete cutover rolled back deliberately");
  let completeChecked = false;
  await assert.rejects(() => withFieldMigrationAuthority(session, principal, async authority => {
    const { transaction: tx } = authority, { data, pin, definition } = await inspect(authority);
    await tx.studioFieldMigrationCutover.create({ data });
    assert.equal((await tx.studioFieldMigrationPublication.updateMany({ where: { ...scope, state: "PUBLISHED", revision: pin.publication.revision },
      data: { state: "CUTOVER", revision: pin.publication.revision + 1 } })).count, 1);
    assert.equal((await tx.studioDefinition.updateMany({ where: { ...definitionScope, activeVersionId: pin.source.versionId, revision: definition.revision, retiredAt: null },
      data: { activeVersionId: pin.publication.targetVersionId, revision: definition.revision + 1 } })).count, 1);
    await tx.$executeRaw`SET CONSTRAINTS ALL IMMEDIATE`;
    const switched = await tx.studioDefinition.findFirstOrThrow({ where: definitionScope });
    assert.equal(switched.activeVersionId, pin.publication.targetVersionId); assert.equal(switched.revision, definition.revision + 1);
    // A stored receipt cannot mutate or be cancelled to escape history rules.
    // These rejections use savepoints so the subsequent checks can still run.
    await tx.$executeRaw`SAVEPOINT cutover_test_denial`;
    await assert.rejects(() => tx.studioFieldMigrationCutover.update({ where: { preparationId: intent.id }, data: { pinChecksum: "f".repeat(64) } }), /immutable|history|retained/i);
    await tx.$executeRaw`ROLLBACK TO SAVEPOINT cutover_test_denial`;
    await assert.rejects(() => tx.studioFieldMigrationPublication.updateMany({ where: { ...scope, state: "CUTOVER", revision: pin.publication.revision + 1 }, data: { state: "CANCELLED", revision: pin.publication.revision + 2 } }), /immutable|transition|CAS|Settled publication requires its exact one-time retained settlement/i);
    await tx.$executeRaw`ROLLBACK TO SAVEPOINT cutover_test_denial`;
    await assert.rejects(() => tx.studioDefinition.updateMany({ where: { ...definitionScope, revision: switched.revision }, data: { activeVersionId: pin.source.versionId, revision: switched.revision + 1 } }), /freezes|explicit cutover/i);
    await tx.$executeRaw`ROLLBACK TO SAVEPOINT cutover_test_denial`;
    await assert.rejects(() => tx.studioDraft.updateMany({ where: { definitionId: intent.definitionId, organisationId: session.organisationId }, data: { revision: { increment: 1 } } }), /freezes its reviewed draft/i);
    await tx.$executeRaw`ROLLBACK TO SAVEPOINT cutover_test_denial`;
    const sourceSlot = await tx.studioFieldSlot.findFirstOrThrow({ where: { organisationId: session.organisationId, definitionId: intent.definitionId, generationId: pin.publication.sourceGenerationId } });
    await assert.rejects(() => tx.studioFieldSlot.update({ where: { id: sourceSlot.id }, data: { revision: sourceSlot.revision + 1 } }), /retained history/i);
    await tx.$executeRaw`ROLLBACK TO SAVEPOINT cutover_test_denial`;
    await checkFieldSettlementStorage(tx, { pin, checksum: checksum(pin) }, principal, authority.session, parentId);
    completeChecked = true;
    throw rolledBack;
  }), error => error === rolledBack);
  assert(completeChecked); await unchanged();
  assert.deepEqual(await db.serviceWorkItem.findMany({ where: nativeWhere, orderBy: { id: "asc" } }), nativeBefore);
  console.log("PASS actual cutover storage: exact tenant/READY/closed pin and immutable history; standalone receipt/publication denied, exact receipt+publication+pointer passes deferred proof then deliberate rollback; cancellation/old-source activation/draft/source saves denied, source and both native snapshots unchanged. No production cutover service or permanent activation.");
}
