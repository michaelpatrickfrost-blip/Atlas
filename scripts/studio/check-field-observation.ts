import assert from "node:assert/strict";
import { db } from "../../src/core/db/client";
import type { Session } from "../../src/core/auth/session";
import type { FieldMigrationPrincipal } from "../../src/core/studio/fields/principal-contract";
import { resolveFieldMigrationPrincipal } from "../../src/core/studio/fields/principal";
import { studioRegistry } from "../../src/core/studio/registry/runtime";
import { sealFieldMigrationIntent } from "../../src/core/studio/fields/migrations/contracts";
import { observeFieldMigrationRecord } from "../../src/core/studio/fields/migrations/observation";
import { checksum } from "../../src/core/studio/registry/contracts";

/** Read observation contract proof plus one privileged synthetic source fixture;
 * no collector, target values or native mutations are exercised by this helper.
 */
export async function checkFieldObservation(session: Session, principal: FieldMigrationPrincipal, preparationId: string, ticketId: string) {
  assert(process.platform === "linux" && process.env.ATLAS_STUDIO_LIVE_TEST === "1");
  assert(await db.organisation.findFirst({ where: { id: session.organisationId, isTest: true, slug: { startsWith: "studio-check-" }, status: "ACTIVE" } }));
  const registry = studioRegistry(), actor = await resolveFieldMigrationPrincipal(principal);
  assert.equal(actor.membershipId, session.membershipId);
  const saved = await db.studioFieldMigrationPreparation.findFirstOrThrow({ where: { id: preparationId, organisationId: actor.organisationId, state: "PREPARING" } });
  const sealed = sealFieldMigrationIntent(saved.intent); assert.equal(saved.intentChecksum, sealed.checksum);
  const intent = sealed.intent;
  const inspect = () => db.$transaction(async tx => {
    const company = await tx.organisation.findFirstOrThrow({ where: { id: actor.organisationId }, select: { id: true, kind: true, status: true, archivedAt: true, isTest: true } });
    await registry.invokeQueryInTransaction({ session: actor, transaction: tx }, intent.ownerQuery, { mode: "preflight" });
    const anchor = await registry.authoriseRecord({ session: actor, transaction: tx }, intent.source.payload.entity, { recordId: ticketId, intent: "read" });
    return observeFieldMigrationRecord({ session: actor, transaction: tx }, registry, company, intent, anchor);
  }, { isolationLevel: "Serializable" });
  const absent = await inspect(); assert.equal(absent.extension?.slot ?? null, null);
  assert.deepEqual(absent.result, { kind: "valid", targetFingerprint: checksum(null), isNull: true, lossy: false });
  const stored = await db.$transaction(async tx => {
    const anchor = await registry.authoriseRecord({ session: actor, transaction: tx }, intent.source.payload.entity, { recordId: ticketId, intent: "read" });
    await registry.authoriseRecord({ session: actor, transaction: tx }, intent.source.payload.entity, { recordId: ticketId, intent: "extend", expectedRevision: anchor.revision });
    const scope = { organisationId: actor.organisationId, entityId: intent.source.payload.entity.id, recordId: ticketId };
    const extension = await tx.studioExtensionRecord.findFirst({ where: scope }) ?? await tx.studioExtensionRecord.create({ data: scope });
    const slot = await tx.studioFieldSlot.create({ data: { organisationId: actor.organisationId, entityId: intent.source.payload.entity.id, extensionId: extension.id,
      definitionId: intent.definitionId, generationId: intent.source.payload.storageGeneration } });
    const value = await tx.studioFieldValue.create({ data: { organisationId: actor.organisationId, definitionId: intent.definitionId, generationId: intent.source.payload.storageGeneration,
      slotId: slot.id, versionId: intent.source.versionId, revision: 1, valueType: "integer", integerValue: 42n, fingerprint: checksum({ type: "integer", value: 42 }), createdBy: actor.userId } });
    await tx.studioFieldSlot.update({ where: { id: slot.id }, data: { revision: 1, activeValueId: value.id } });
    assert.equal((await tx.studioExtensionRecord.updateMany({ where: { id: extension.id, organisationId: actor.organisationId, revision: extension.revision }, data: { revision: extension.revision + 1 } })).count, 1);
    return { extension, slot, value };
  }, { isolationLevel: "Serializable" });
  const actual = await inspect();
  assert.deepEqual(actual.extension, { id: stored.extension.id, revision: stored.extension.revision + 1, slot: { id: stored.slot.id, revision: 1,
    value: { id: stored.value.id, revision: 1, versionId: intent.source.versionId, fingerprint: stored.value.fingerprint } } });
  assert.deepEqual(actual.result, { kind: "valid", targetFingerprint: checksum({ type: "decimal", value: "42" }), isNull: false, lossy: false });
  assert.equal(await db.studioFieldMigrationObservation.count({ where: { preparationId } }), 0);
  assert.equal(await db.studioFieldGeneration.count({ where: { id: intent.target.payload.storageGeneration } }), 0);
  console.log("PASS actual source observation: absent slot, owner-checked exact integer-to-decimal decode, immutable schema/slot/value refs and result fingerprint only; privileged synthetic source fixture, no collector/target/native writes.");
}
