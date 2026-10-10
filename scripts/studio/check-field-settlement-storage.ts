import assert from "node:assert/strict";
import type { Prisma } from "../../src/generated/prisma/client";
import type { FieldMigrationPrincipal } from "../../src/core/studio/fields/principal-contract";
import type { FieldMigrationCutoverPin } from "../../src/core/studio/fields/migrations/cutover-contract";
import { createFieldMigrationSettlementPin, fieldMigrationSettlementTransition } from "../../src/core/studio/fields/migrations/settlement-contract";
import { checksum } from "../../src/core/studio/registry/contracts";

/** Nested rollback-only SQL acceptance on the already owner-authorised exact
 * Test cutover. Never a production settlement endpoint or permission waiver. */
export async function checkFieldSettlementStorage(tx: Prisma.TransactionClient, retained: { pin: FieldMigrationCutoverPin; checksum: string }, principal: FieldMigrationPrincipal) {
  assert(process.platform === "linux" && process.env.ATLAS_STUDIO_LIVE_TEST === "1");
  const { pin } = retained, scope = { preparationId: pin.publication.preparationId, organisationId: principal.organisationId, definitionId: pin.publication.definitionId };
  assert.equal(principal.organisationId, pin.publication.organisationId);
  const definitionScope = { id: scope.definitionId, organisationId: scope.organisationId };
  const before = await tx.studioFieldMigrationCutover.findFirstOrThrow({ where: scope });
  const sourceBefore = await tx.studioFieldValue.findMany({ where: { organisationId: scope.organisationId, definitionId: scope.definitionId }, orderBy: { id: "asc" } });
  async function settle(disposition: "ROLLED_BACK" | "FINALIZED", patch: Record<string, unknown> = {}) {
    const result = createFieldMigrationSettlementPin(retained, principal, disposition), forged = { ...result.pin, ...patch };
    const changed = await tx.studioFieldMigrationCutover.updateMany({ where: { ...scope, state: "ACTIVATED", revision: 0 },
      data: { state: disposition, revision: 1, settlementPin: forged, settlementChecksum: checksum(forged), settledBy: principal.userId, settledAt: new Date() } });
    assert.equal(changed.count, 1);
    return fieldMigrationSettlementTransition(result.pin);
  }
  async function savepoint() { await tx.$executeRaw`SAVEPOINT settlement_test`; await tx.$executeRaw`SET CONSTRAINTS ALL DEFERRED`; }
  async function restore() { await tx.$executeRaw`ROLLBACK TO SAVEPOINT settlement_test`; await tx.$executeRaw`RELEASE SAVEPOINT settlement_test`; }
  for (const patch of [{ organisationId: "foreign" }, { definitionRevision: pin.definitionRevision }, { sourceVersionId: pin.publication.targetVersionId },
    { canRollback: true }, { principal: { ...principal, capabilities: ["*"] } }, { principal: { ...principal, sessionVersion: "1" } }]) {
    await savepoint();
    await assert.rejects(() => settle("ROLLED_BACK", patch), /exact unchanged|closed current actor|constraint|invalid input/i);
    await restore();
  }
  for (const disposition of ["ROLLED_BACK", "FINALIZED"] as const) {
    await savepoint();
    await settle(disposition);
    await assert.rejects(() => tx.$executeRaw`SET CONSTRAINTS ALL IMMEDIATE`, /receipt publication and exact settled pointer/i);
    await restore();
    await savepoint();
    const transition = await settle(disposition);
    assert.equal((await tx.studioFieldMigrationPublication.updateMany({ where: { ...scope, state: "CUTOVER", revision: pin.publication.revision + 1 }, data: transition.publication })).count, 1);
    if (disposition === "ROLLED_BACK") assert.equal((await tx.studioDefinition.updateMany({ where: { ...definitionScope, activeVersionId: pin.publication.targetVersionId, revision: pin.definitionRevision + 1 },
      data: { activeVersionId: transition.definition.versionId, revision: transition.definition.revision } })).count, 1);
    await tx.$executeRaw`SET CONSTRAINTS ALL IMMEDIATE`;
    const settled = await tx.studioFieldMigrationCutover.findFirstOrThrow({ where: scope });
    assert.equal(settled.state, disposition); assert.equal(settled.revision, 1);
    assert.deepEqual(settled.pin, before.pin); assert.equal(settled.pinChecksum, before.pinChecksum); assert.equal(settled.createdBy, before.createdBy);
    assert.equal((await tx.studioDefinition.findFirstOrThrow({ where: definitionScope })).activeVersionId, transition.definition.versionId);
    assert.deepEqual(await tx.studioFieldValue.findMany({ where: { organisationId: scope.organisationId, definitionId: scope.definitionId }, orderBy: { id: "asc" } }), sourceBefore);
    await tx.$executeRaw`SAVEPOINT settlement_retained_denial`;
    await assert.rejects(() => tx.studioFieldMigrationCutover.updateMany({ where: scope, data: { state: "ACTIVATED", revision: 0 } }), /immutable|one-time CAS/i);
    await tx.$executeRaw`ROLLBACK TO SAVEPOINT settlement_retained_denial`;
    await assert.rejects(() => tx.studioFieldMigrationCutover.deleteMany({ where: scope }), /immutable|history|retained/i);
    await tx.$executeRaw`ROLLBACK TO SAVEPOINT settlement_retained_denial`;
    await assert.rejects(() => tx.studioFieldMigrationPublication.updateMany({ where: scope, data: { state: "CUTOVER", revision: { increment: 1 } } }), /immutable|transition|CAS/i);
    await tx.$executeRaw`ROLLBACK TO SAVEPOINT settlement_retained_denial`;
    await tx.$executeRaw`RELEASE SAVEPOINT settlement_retained_denial`;
    await restore();
  }
  const outcome = await tx.studioFieldMigrationOutcome.findFirstOrThrow({ where: scope });
  await savepoint();
  await tx.studioExtensionRecord.updateMany({ where: { id: outcome.extensionId, organisationId: scope.organisationId }, data: { revision: { increment: 1 } } });
  await tx.$executeRaw`SAVEPOINT settlement_changed_denial`;
  await assert.rejects(() => settle("ROLLED_BACK"), /exact unchanged/i);
  await tx.$executeRaw`ROLLBACK TO SAVEPOINT settlement_changed_denial`;
  await tx.$executeRaw`RELEASE SAVEPOINT settlement_changed_denial`;
  const finalization = await settle("FINALIZED");
  await tx.studioFieldMigrationPublication.updateMany({ where: { ...scope, state: "CUTOVER", revision: pin.publication.revision + 1 }, data: finalization.publication });
  await tx.$executeRaw`SET CONSTRAINTS ALL IMMEDIATE`;
  await restore();
  assert.deepEqual(await tx.studioFieldMigrationCutover.findFirstOrThrow({ where: scope }), before);
  console.log("PASS rollback-only settlement storage: closed pin/CAS/actor and retained original identity; standalone receipt denied, both atomic terminal outcomes pass; terminal mutation/delete/publication reversal denied; changed extension denies rollback but can finalize, all values and original ACT window restored. No production rollback or ordinary value authority.");
}

