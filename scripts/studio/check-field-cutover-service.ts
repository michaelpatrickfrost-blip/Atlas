import assert from "node:assert/strict";
import { checkFieldGenerationContinuation } from "./check-field-generation-continuation";
import { db } from "../../src/core/db/client";
import type { Session } from "../../src/core/auth/session";
import type { FieldMigrationPrincipal } from "../../src/core/studio/fields/principal-contract";
import { resolveFieldMigrationPrincipal } from "../../src/core/studio/fields/principal";
import { customFieldPayloadSchema } from "../../src/core/studio/fields/schema";
import { studioRegistry } from "../../src/core/studio/registry/runtime";
import { checksum } from "../../src/core/studio/registry/contracts";
import { createDraft, publishDraft, activateVersion, updateDraft, activeDefinition } from "../../src/core/studio/definitions/service";
import { withFieldMigrationAuthority } from "../../src/core/studio/fields/migrations/authority";
import { startFieldMigrationPreparation } from "../../src/core/studio/fields/migrations/preparation";
import { collectFieldMigrationBatch } from "../../src/core/studio/fields/migrations/collection";
import { sealFieldMigrationPreparation } from "../../src/core/studio/fields/migrations/sealing";
import { publishReviewedFieldMigration } from "../../src/core/studio/fields/migrations/publication";
import { startFieldMigrationExecution } from "../../src/core/studio/fields/migrations/execution-start";
import { executeFieldMigrationBatch } from "../../src/core/studio/fields/migrations/execution-batch";
import { cutoverReviewedFieldMigration } from "../../src/core/studio/fields/migrations/cutover";
import { cancelFieldMigrationPublication } from "../../src/core/studio/fields/migrations/cancellation";

/** Real service/SQL proof on this run's exact Test affiliation/company only.
 * Preserve native rows, old execution cancellation tests and immutable history.
 * Temporary grants/queue membership and scoped failure triggers restored finally. */
export async function checkFieldCutoverService(actor: Session, principal: FieldMigrationPrincipal, parentId: string, otherOrganisationId: string) {
  assert(process.platform === "linux" && process.env.ATLAS_STUDIO_LIVE_TEST === "1");
  for (const id of [actor.organisationId, otherOrganisationId]) assert(await db.organisation.findFirst({ where: { id, isTest: true, kind: "CUSTOMER",
    slug: { startsWith: "studio-check-" }, status: "ACTIVE", archivedAt: null } }));
  const member = await db.membership.findFirstOrThrow({ where: { id: actor.membershipId, organisationId: actor.organisationId, userId: actor.userId, active: true } });
  const nativeWhere = { organisationId: { in: [actor.organisationId, otherOrganisationId] } };
  const nativeBefore = await db.serviceWorkItem.findMany({ where: nativeWhere, orderBy: { id: "asc" } });
  const fieldCapability = "tickets.field.cutover_check";
  await db.membership.update({ where: { id: member.id, organisationId: actor.organisationId }, data: { grantedCapabilities: [...member.grantedCapabilities, fieldCapability] } });
  try {
    const session = await resolveFieldMigrationPrincipal(principal), registry = studioRegistry(); assert(session.capabilities.has(fieldCapability));
    const reference = (version: number) => { const m = registry.describe("tickets.ticket", version); return { id: m.id, version, schemaHash: m.schemaHash, contractHash: m.contractHash }; };
    const payload = customFieldPayloadSchema.parse({ schemaVersion: 1, entity: reference(2), storageGeneration: crypto.randomUUID(),
      field: { key: "cutover_service", label: "Exact Test cutover", classification: "confidential", writeCapability: fieldCapability, storage: { type: "integer" } } });
    const definition = await createDraft(session, { key: "tickets.ticket.cutover_service", name: "Exact Test cutover", kind: "customField", payload });
    const source = await publishDraft(session, { definitionId: definition.id, revision: 0, acknowledgeWarnings: true });
    const sourceState = await db.studioDefinition.findFirstOrThrow({ where: { id: definition.id, organisationId: session.organisationId }, include: { draft: true } }); assert(sourceState.draft);
    await activateVersion(session, { definitionId: definition.id, versionId: source.versionId, revision: sourceState.revision });
    await withFieldMigrationAuthority(session, principal, async ({ session: fresh, transaction: tx }) => {
      const context = { session: fresh, transaction: tx }, anchor = await registry.authoriseRecord(context, payload.entity, { recordId: parentId, intent: "read" });
      await registry.authoriseRecord(context, payload.entity, { recordId: parentId, intent: "extend", expectedRevision: anchor.revision });
      const scope = { organisationId: fresh.organisationId, entityId: payload.entity.id, recordId: parentId };
      const extension = await tx.studioExtensionRecord.findFirst({ where: scope }) ?? await tx.studioExtensionRecord.create({ data: scope });
      const slot = await tx.studioFieldSlot.create({ data: { organisationId: fresh.organisationId, entityId: payload.entity.id, extensionId: extension.id, definitionId: definition.id, generationId: payload.storageGeneration } });
      const value = await tx.studioFieldValue.create({ data: { organisationId: fresh.organisationId, definitionId: definition.id, generationId: payload.storageGeneration,
        slotId: slot.id, versionId: source.versionId, revision: 1, valueType: "integer", integerValue: 25n, fingerprint: checksum({ type: "integer", value: 25 }), createdBy: fresh.userId } });
      await tx.studioExtensionRecord.update({ where: { id: extension.id }, data: { revision: extension.revision + 1 } });
      await tx.studioFieldSlot.update({ where: { id: slot.id }, data: { revision: 1, activeValueId: value.id } });
    });
    const target = customFieldPayloadSchema.parse({ ...payload, entity: reference(5), storageGeneration: crypto.randomUUID(), field: { ...payload.field, storage: { type: "decimal" } } });
    await updateDraft(session, { definitionId: definition.id, revision: sourceState.draft.revision, payload: target });
    const current = await db.studioDefinition.findFirstOrThrow({ where: { id: definition.id, organisationId: session.organisationId }, include: { draft: true } }); assert(current.draft);
    const prepared = await startFieldMigrationPreparation(session, principal, { operationId: crypto.randomUUID(), definitionId: definition.id,
      definitionRevision: current.revision, draftRevision: current.draft.revision, conversion: { kind: "integer_to_decimal" } });
    let collected = await collectFieldMigrationBatch(session, { preparationId: prepared.id, revision: prepared.revision, limit: 2 });
    for (let n = 0; !collected.cursorExhausted; n++) { assert(n < 20); collected = await collectFieldMigrationBatch(session, { preparationId: prepared.id, revision: collected.revision, limit: 2 }); }
    const review = await sealFieldMigrationPreparation(session, { preparationId: prepared.id, revision: collected.revision });
    const published = await publishReviewedFieldMigration(session, { preparationId: prepared.id, revision: review.revision, reviewChecksum: review.checksum, acknowledgeWarnings: true, acknowledgeLoss: false });
    const started = await startFieldMigrationExecution(session, { preparationId: prepared.id, publicationRevision: published.publicationRevision, reviewChecksum: review.checksum });
    const scope = { preparationId: prepared.id, organisationId: session.organisationId }, definitionScope = { id: definition.id, organisationId: session.organisationId };
    const definitionBefore = await db.studioDefinition.findFirstOrThrow({ where: definitionScope });
    const request = { preparationId: prepared.id, reviewChecksum: review.checksum, definitionRevision: definitionBefore.revision,
      publicationRevision: published.publicationRevision, executionRevision: started.revision };
    await assert.rejects(() => cutoverReviewedFieldMigration(session, request), /stale|changed/i);
    let state = await db.studioFieldMigrationExecution.findFirstOrThrow({ where: scope });
    for (let n = 0; state.state !== "READY"; n++) { assert(n < 20); await executeFieldMigrationBatch(session, { preparationId: prepared.id, revision: state.revision, limit: 2 }); state = await db.studioFieldMigrationExecution.findFirstOrThrow({ where: scope }); }
    request.executionRevision = state.revision;
    const publicationBefore = await db.studioFieldMigrationPublication.findFirstOrThrow({ where: scope });
    const values = await db.studioFieldValue.findMany({ where: { definitionId: definition.id, organisationId: session.organisationId }, orderBy: { id: "asc" } });
    const slots = await db.studioFieldSlot.findMany({ where: { definitionId: definition.id, organisationId: session.organisationId }, orderBy: { id: "asc" } });
    const outcomes = await db.studioFieldMigrationOutcome.findMany({ where: scope, orderBy: { recordId: "asc" } });
    const auditScope = { organisationId: session.organisationId, entityId: definition.id, action: "studio.definition.activated" };
    const activationCount = await db.auditEntry.count({ where: auditScope });
    async function unchanged() {
      assert.equal(await db.studioFieldMigrationCutover.count({ where: scope }), 0);
      assert.deepEqual(await db.studioDefinition.findFirstOrThrow({ where: definitionScope }), definitionBefore);
      assert.deepEqual(await db.studioFieldMigrationPublication.findFirstOrThrow({ where: scope }), publicationBefore);
      assert.deepEqual(await db.studioFieldMigrationExecution.findFirstOrThrow({ where: scope }), state);
      assert.equal(await db.auditEntry.count({ where: auditScope }), activationCount);
      assert.equal(await db.auditEntry.count({ where: { organisationId: session.organisationId, entityId: prepared.id, action: "studio.field.migration.cutover" } }), 0);
    }
    for (const patch of [{ definitionRevision: request.definitionRevision + 1 }, { publicationRevision: request.publicationRevision + 1 }, { executionRevision: request.executionRevision - 1 },
      { reviewChecksum: "f".repeat(64) }, { organisationId: otherOrganisationId }, { stage: "cutover" }]) await assert.rejects(() => cutoverReviewedFieldMigration(session, { ...request, ...patch }));
    await assert.rejects(() => cutoverReviewedFieldMigration({ ...session, organisationId: otherOrganisationId }, request), /stale|changed/i); await unchanged();
    async function accessDenials() {
      await db.membership.update({ where: { id: member.id, organisationId: session.organisationId }, data: { active: false } });
      try { await assert.rejects(() => cutoverReviewedFieldMigration(session, request), /FORBIDDEN/); }
      finally { await db.membership.update({ where: { id: member.id, organisationId: session.organisationId }, data: { active: true } }); }
      await db.membership.update({ where: { id: member.id, organisationId: session.organisationId }, data: { grantedCapabilities: member.grantedCapabilities } });
      try { await assert.rejects(() => cutoverReviewedFieldMigration(session, request), /FORBIDDEN.*tickets.field.cutover_check/); }
      finally { await db.membership.update({ where: { id: member.id, organisationId: session.organisationId }, data: { grantedCapabilities: [...member.grantedCapabilities, fieldCapability] } }); }
      const queueMember = await db.serviceQueueMember.findFirstOrThrow({ where: { organisationId: session.organisationId, userId: session.userId, queue: { restricted: true } } });
      await db.serviceQueueMember.delete({ where: { id: queueMember.id, organisationId: session.organisationId } });
      try { await assert.rejects(() => cutoverReviewedFieldMigration(session, request), /MIGRATION_ACCESS_REQUIRED/); }
      finally { await db.serviceQueueMember.create({ data: queueMember }); }
      const sourceModule = await db.moduleState.findFirstOrThrow({ where: { organisationId: session.organisationId, moduleId: "tickets" } });
      await db.moduleState.update({ where: { id: sourceModule.id }, data: { enabled: false } });
      try { await assert.rejects(() => cutoverReviewedFieldMigration(session, request), /unavailable|DEPENDENCY_BROKEN/); }
      finally { await db.moduleState.update({ where: { id: sourceModule.id }, data: { enabled: sourceModule.enabled } }); }
    }
    await accessDenials(); await unchanged();
    const trigger = `studio_cutover_test_${crypto.randomUUID().replaceAll("-", "")}`;
    for (const identifier of [trigger, session.organisationId, prepared.id, definition.id]) assert(/^[a-zA-Z0-9_-]+$/.test(identifier));
    for (const [entityId, action] of [[definition.id, "studio.definition.activated"], [prepared.id, "studio.field.migration.cutover"]]) {
      await db.$executeRawUnsafe(`CREATE FUNCTION ${trigger}() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN IF NEW."organisationId"='${session.organisationId}' AND NEW."entityId"='${entityId}' AND NEW.action='${action}' THEN RAISE EXCEPTION 'Exact Test paired cutover Audit failure'; END IF; RETURN NEW; END $$;`);
      try {
        await db.$executeRawUnsafe(`CREATE TRIGGER ${trigger} BEFORE INSERT ON audit_entries FOR EACH ROW EXECUTE FUNCTION ${trigger}();`);
        await assert.rejects(() => cutoverReviewedFieldMigration(session, request), /Exact Test paired cutover Audit failure/); await unchanged();
      } finally { await db.$executeRawUnsafe(`DROP TRIGGER IF EXISTS ${trigger} ON audit_entries;`); await db.$executeRawUnsafe(`DROP FUNCTION IF EXISTS ${trigger}();`); }
    }
    const concurrent = await Promise.allSettled([cutoverReviewedFieldMigration(session, request), cutoverReviewedFieldMigration(session, request)]);
    assert.equal(concurrent.filter(r => r.status === "fulfilled" && !r.value.replayed).length, 1);
    for (const result of concurrent) if (result.status === "rejected") assert.match(String(result.reason), /stale|changed/i);
    const replay = await cutoverReviewedFieldMigration(session, request); assert(replay.replayed); assert.equal(replay.definitionRevision, request.definitionRevision + 1);
    assert.equal((await activeDefinition(session, definition.id))?.versionId, published.targetVersionId);
    assert.equal(await db.auditEntry.count({ where: auditScope }), activationCount + 1);
    assert.equal(await db.auditEntry.count({ where: { organisationId: session.organisationId, entityId: prepared.id, action: "studio.field.migration.cutover" } }), 1);
    await accessDenials();
    assert.deepEqual(await cutoverReviewedFieldMigration(session, request), replay);
    await assert.rejects(() => activateVersion(session, { definitionId: definition.id, versionId: source.versionId, revision: replay.definitionRevision }), /freezes|explicit cutover/);
    await assert.rejects(() => cancelFieldMigrationPublication(session, principal, { preparationId: prepared.id, revision: replay.publicationRevision }), /stale|changed|transition|immutable/i);
    assert.deepEqual(await db.studioFieldMigrationExecution.findFirstOrThrow({ where: scope }), state);
    assert.deepEqual(await db.studioFieldMigrationOutcome.findMany({ where: scope, orderBy: { recordId: "asc" } }), outcomes);
    assert.deepEqual(await db.studioFieldValue.findMany({ where: { definitionId: definition.id, organisationId: session.organisationId }, orderBy: { id: "asc" } }), values);
    assert.deepEqual(await db.studioFieldSlot.findMany({ where: { definitionId: definition.id, organisationId: session.organisationId }, orderBy: { id: "asc" } }), slots);
    assert.deepEqual(await db.serviceWorkItem.findMany({ where: nativeWhere, orderBy: { id: "asc" } }), nativeBefore);
    await checkFieldGenerationContinuation(session, principal, prepared.id, parentId, otherOrganisationId);
    console.log("PASS actual explicit cutover service: READY/current owner/private/field/module authority, tenant/stale/client denial, both real paired-Audit failures roll back, concurrent CAS/single activation and fresh lost-response replay; exact active target, source/target/row history retained and both native snapshots unchanged. Rollback and normal value saves remain closed pending f4/2B4.");
  } finally {
    await db.membership.update({ where: { id: member.id, organisationId: actor.organisationId }, data: { active: member.active, grantedCapabilities: member.grantedCapabilities } });
  }
}
