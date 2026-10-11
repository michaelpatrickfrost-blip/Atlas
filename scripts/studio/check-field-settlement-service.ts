import assert from "node:assert/strict";
import { db } from "../../src/core/db/client";
import { sessionForUser, type Session } from "../../src/core/auth/session";
import type { FieldMigrationPrincipal } from "../../src/core/studio/fields/principal-contract";
import { captureCustomerFieldMigrationPrincipal } from "../../src/core/studio/fields/principal";
import { studioRegistry } from "../../src/core/studio/registry/runtime";
import { customFieldPayloadSchema } from "../../src/core/studio/fields/schema";
import { sealFieldMigrationIntent } from "../../src/core/studio/fields/migrations/contracts";
import { fieldMigrationCutoverPinSchema } from "../../src/core/studio/fields/migrations/cutover-contract";
import { rollbackReviewedFieldMigration, finalizeReviewedFieldMigration } from "../../src/core/studio/fields/migrations/settlement";
import { withFieldMigrationAuthority } from "../../src/core/studio/fields/migrations/authority";
import { publishDraft, activateVersion, updateDraft } from "../../src/core/studio/definitions/service";
import { startFieldMigrationPreparation } from "../../src/core/studio/fields/migrations/preparation";
import { collectFieldMigrationBatch } from "../../src/core/studio/fields/migrations/collection";
import { sealFieldMigrationPreparation } from "../../src/core/studio/fields/migrations/sealing";
import { publishReviewedFieldMigration } from "../../src/core/studio/fields/migrations/publication";
import { startFieldMigrationExecution } from "../../src/core/studio/fields/migrations/execution-start";
import { executeFieldMigrationBatch } from "../../src/core/studio/fields/migrations/execution-batch";
import { cutoverReviewedFieldMigration } from "../../src/core/studio/fields/migrations/cutover";
import { checkFieldGenerationContinuation } from "./check-field-generation-continuation";

/** Real current-customer settlement of this run's staff-prepared migration. Exact
 * Test company/account guards, no native mutations; temporary grants and new queue
 * affiliations are restored. Immutable history/Audit is deliberately retained. */
export async function checkFieldSettlementService(staff: Session, staffPrincipal: FieldMigrationPrincipal, preparationId: string, parentId: string, otherOrganisationId: string, customerUserId: string) {
  assert(process.platform === "linux" && process.env.ATLAS_STUDIO_LIVE_TEST === "1");
  for (const id of [staff.organisationId, otherOrganisationId]) assert(await db.organisation.findFirst({ where: { id, isTest: true, kind: "CUSTOMER",
    slug: { startsWith: "studio-check-" }, status: "ACTIVE", archivedAt: null } }));
  assert(await db.user.findFirst({ where: { id: customerUserId, email: { startsWith: "studio-check-", endsWith: "@example.test" }, platformAdmin: null } }));
  assert.notEqual(customerUserId, staff.userId);
  const member = await db.membership.findFirstOrThrow({ where: { organisationId: staff.organisationId, userId: customerUserId, active: true } });
  const preparation = await db.studioFieldMigrationPreparation.findFirstOrThrow({ where: { id: preparationId, organisationId: staff.organisationId } });
  const intent = sealFieldMigrationIntent(preparation.intent).intent, definitionId = preparation.definitionId;
  const fieldCapability = intent.source.payload.field.writeCapability; assert(fieldCapability);
  const grants = [...new Set([...member.grantedCapabilities, fieldCapability, "tickets.ticket.read", "tickets.ticket.manage", "studio.definition.publish"])];
  const addedQueues: string[] = [];
  const nativeWhere = { organisationId: { in: [staff.organisationId, otherOrganisationId] } }, nativeBefore = await db.serviceWorkItem.findMany({ where: nativeWhere, orderBy: { id: "asc" } });
  await db.membership.update({ where: { id: member.id, organisationId: staff.organisationId }, data: { grantedCapabilities: grants } });
  try {
    for (const queue of await db.serviceQueue.findMany({ where: { organisationId: staff.organisationId, restricted: true }, select: { id: true } })) {
      if (!await db.serviceQueueMember.findFirst({ where: { organisationId: staff.organisationId, queueId: queue.id, userId: customerUserId } })) {
        const row = await db.serviceQueueMember.create({ data: { organisationId: staff.organisationId, queueId: queue.id, userId: customerUserId } }); addedQueues.push(row.id);
      }
    }
    const customer = await sessionForUser(staff.organisationId, customerUserId); assert(customer);
    let principal = await captureCustomerFieldMigrationPrincipal(customer);
    const scope = { definitionId, organisationId: staff.organisationId }, snapshot = () => db.studioDefinition.findFirstOrThrow({ where: { id: definitionId, organisationId: staff.organisationId }, include: { draft: true } });
    async function confirmation(id: string) {
      const receipt = await db.studioFieldMigrationCutover.findFirstOrThrow({ where: { ...scope, preparationId: id } }), pin = fieldMigrationCutoverPinSchema.parse(receipt.pin);
      return { preparationId: id, cutoverChecksum: receipt.pinChecksum, cutoverRevision: 0, definitionRevision: pin.definitionRevision + 1, publicationRevision: pin.publication.revision + 1 };
    }
    const request = await confirmation(preparationId);
    const invoke = (input: unknown = request, rollback = true) => (rollback ? rollbackReviewedFieldMigration : finalizeReviewedFieldMigration)(customer, principal, input);
    async function state(id: string) {
      return { definition: await snapshot(), receipt: await db.studioFieldMigrationCutover.findFirstOrThrow({ where: { ...scope, preparationId: id } }),
        publication: await db.studioFieldMigrationPublication.findFirstOrThrow({ where: { ...scope, preparationId: id } }),
        audits: await db.auditEntry.findMany({ where: { organisationId: staff.organisationId, entityId: { in: [definitionId, id] } }, orderBy: { id: "asc" } }) };
    }
    const before = await state(preparationId);
    async function denials(input: typeof request, rollback: boolean) {
      await db.membership.update({ where: { id: member.id, organisationId: staff.organisationId }, data: { active: false } });
      try { await assert.rejects(() => invoke(input, rollback), /FORBIDDEN/); } finally { await db.membership.update({ where: { id: member.id }, data: { active: true } }); }
      await db.membership.update({ where: { id: member.id }, data: { grantedCapabilities: grants.filter(cap => cap !== fieldCapability) } });
      try { await assert.rejects(() => invoke(input, rollback), /FORBIDDEN/); } finally { await db.membership.update({ where: { id: member.id }, data: { grantedCapabilities: grants } }); }
      const row = await db.serviceQueueMember.findFirstOrThrow({ where: { organisationId: staff.organisationId, userId: customerUserId, queue: { restricted: true } } });
      await db.serviceQueueMember.delete({ where: { id: row.id, organisationId: staff.organisationId } });
      try { await assert.rejects(() => invoke(input, rollback), /MIGRATION_ACCESS_REQUIRED/); } finally { await db.serviceQueueMember.create({ data: row }); }
      const sourceModule = await db.moduleState.findFirstOrThrow({ where: { organisationId: staff.organisationId, moduleId: "tickets" } });
      await db.moduleState.update({ where: { id: sourceModule.id }, data: { enabled: false } });
      try { await assert.rejects(() => invoke(input, rollback), /unavailable|DEPENDENCY_BROKEN/); } finally { await db.moduleState.update({ where: { id: sourceModule.id }, data: { enabled: sourceModule.enabled } }); }
    }
    for (const patch of [{ definitionRevision: request.definitionRevision + 1 }, { publicationRevision: request.publicationRevision + 1 }, { cutoverChecksum: "f".repeat(64) },
      { organisationId: otherOrganisationId }, { disposition: "FINALIZED" }, { principal: staffPrincipal }]) await assert.rejects(() => invoke({ ...request, ...patch }));
    await assert.rejects(() => rollbackReviewedFieldMigration({ ...customer, organisationId: otherOrganisationId }, principal, request), /stale|changed|FORBIDDEN/);
    await denials(request, true); assert.deepEqual(await state(preparationId), before);
    async function failAudit(input: typeof request, rollback: boolean, action: string, entityId: string) {
      const trigger = `studio_settlement_test_${crypto.randomUUID().replaceAll("-", "")}`;
      for (const value of [trigger, staff.organisationId, entityId]) assert(/^[a-zA-Z0-9_-]+$/.test(value));
      assert(/^[a-z_.]+$/.test(action));
      const saved = await state(input.preparationId);
      await db.$executeRawUnsafe(`CREATE FUNCTION ${trigger}() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN IF NEW."organisationId"='${staff.organisationId}' AND NEW."entityId"='${entityId}' AND NEW.action='${action}' THEN RAISE EXCEPTION 'Exact Test settlement Audit failure'; END IF; RETURN NEW; END $$;`);
      try {
        await db.$executeRawUnsafe(`CREATE TRIGGER ${trigger} BEFORE INSERT ON audit_entries FOR EACH ROW EXECUTE FUNCTION ${trigger}();`);
        await assert.rejects(() => invoke(input, rollback), /Exact Test settlement Audit failure/); assert.deepEqual(await state(input.preparationId), saved);
      } finally { await db.$executeRawUnsafe(`DROP TRIGGER IF EXISTS ${trigger} ON audit_entries;`); await db.$executeRawUnsafe(`DROP FUNCTION IF EXISTS ${trigger}();`); }
    }
    await failAudit(request, true, "studio.definition.activated", definitionId);
    await failAudit(request, true, "studio.field.migration.rolled_back", preparationId);
    const results = await Promise.allSettled([invoke(), invoke()]);
    assert.equal(results.filter(result => result.status === "fulfilled" && !result.value.replayed).length, 1);
    for (const result of results) if (result.status === "rejected") assert.match(String(result.reason), /stale|changed/i);
    const rolledBack = await invoke(); assert(rolledBack.replayed); assert.equal(rolledBack.settledBy, customerUserId);
    const rollbackState = await state(preparationId); assert.equal(rollbackState.definition.activeVersionId, intent.source.versionId);
    assert.equal(rollbackState.receipt.state, "ROLLED_BACK"); assert.equal(rollbackState.publication.state, "ROLLED_BACK");
    assert.equal(rollbackState.audits.filter(row => row.action === "studio.field.migration.rolled_back").length, 1);
    await assert.rejects(() => invoke(request, false), /stale|changed/i);
    await denials(request, true); assert.deepEqual(await invoke(), rolledBack);
    const oldPrincipal = principal;
    await db.membership.update({ where: { id: member.id }, data: { sessionVersion: { increment: 1 } } });
    await assert.rejects(() => rollbackReviewedFieldMigration(customer, oldPrincipal, request), /FORBIDDEN/);
    principal = await captureCustomerFieldMigrationPrincipal(customer);
    assert.deepEqual(await invoke(), rolledBack);
    // Resume the real retained source, publish presentation only, then prepare
    // another real migration. Old receipts remain independent of the new pointer.
    const cosmetic = customFieldPayloadSchema.parse({ ...intent.source.payload, field: { ...intent.source.payload.field, label: "Continued retained source", help: "Original migration retained" } });
    const current = await snapshot(); assert(current.draft);
    const edited = await updateDraft(staff, { definitionId, revision: current.draft.revision, payload: cosmetic });
    const source = await publishDraft(staff, { definitionId, revision: edited.revision, acknowledgeWarnings: true });
    await activateVersion(staff, { definitionId, versionId: source.versionId, revision: (await snapshot()).revision });
    assert.deepEqual(await invoke(), rolledBack);
    const target = customFieldPayloadSchema.parse({ ...intent.target.payload, storageGeneration: crypto.randomUUID() });
    const draft = (await snapshot()).draft; assert(draft);
    const nextDraft = await updateDraft(staff, { definitionId, revision: draft.revision, payload: target });
    const prepared = await startFieldMigrationPreparation(staff, staffPrincipal, { operationId: crypto.randomUUID(), definitionId, definitionRevision: (await snapshot()).revision,
      draftRevision: nextDraft.revision, conversion: { kind: "integer_to_decimal" } });
    let collected = await collectFieldMigrationBatch(staff, { preparationId: prepared.id, revision: prepared.revision, limit: 2 });
    for (let n = 0; !collected.cursorExhausted; n++) { assert(n < 20); collected = await collectFieldMigrationBatch(staff, { preparationId: prepared.id, revision: collected.revision, limit: 2 }); }
    const review = await sealFieldMigrationPreparation(staff, { preparationId: prepared.id, revision: collected.revision });
    const publication = await publishReviewedFieldMigration(staff, { preparationId: prepared.id, revision: review.revision, reviewChecksum: review.checksum, acknowledgeWarnings: true, acknowledgeLoss: false });
    let execution = await startFieldMigrationExecution(staff, { preparationId: prepared.id, publicationRevision: publication.publicationRevision, reviewChecksum: review.checksum });
    for (let n = 0; execution.state !== "READY"; n++) { assert(n < 20); execution = await executeFieldMigrationBatch(staff, { preparationId: prepared.id, revision: execution.revision, limit: 2 }); }
    await cutoverReviewedFieldMigration(staff, { preparationId: prepared.id, reviewChecksum: review.checksum, definitionRevision: (await snapshot()).revision,
      publicationRevision: publication.publicationRevision, executionRevision: execution.revision });
    assert.deepEqual(await invoke(), rolledBack);
    const nextRequest = await confirmation(prepared.id);
    const valuesBefore = await db.studioFieldValue.findMany({ where: scope, orderBy: { id: "asc" } });
    // Owner-authorised Test-only unrelated extension revision drift; native rows
    // and stored field values are untouched. Rollback cannot reverse this safely.
    await withFieldMigrationAuthority(customer, principal, async ({ session, transaction: tx }) => {
      const registry = studioRegistry(), context = { session, transaction: tx };
      const anchor = await registry.authoriseRecord(context, target.entity, { recordId: parentId, intent: "read" });
      await registry.authoriseRecord(context, target.entity, { recordId: parentId, intent: "extend", expectedRevision: anchor.revision });
      const extension = await tx.studioExtensionRecord.findFirstOrThrow({ where: { organisationId: session.organisationId, entityId: target.entity.id, recordId: parentId } });
      await tx.studioExtensionRecord.updateMany({ where: { id: extension.id, organisationId: session.organisationId, revision: extension.revision }, data: { revision: extension.revision + 1 } });
    });
    await assert.rejects(() => invoke(nextRequest, true), /stale|changed/i);
    await denials(nextRequest, false);
    await failAudit(nextRequest, false, "studio.field.migration.finalized", prepared.id);
    const finalizations = await Promise.allSettled([invoke(nextRequest, false), invoke(nextRequest, false)]);
    assert.equal(finalizations.filter(result => result.status === "fulfilled" && !result.value.replayed).length, 1);
    for (const result of finalizations) if (result.status === "rejected") assert.match(String(result.reason), /stale|changed/i);
    const finalized = await invoke(nextRequest, false); assert(finalized.replayed); assert.equal(finalized.settledBy, customerUserId);
    assert.equal((await snapshot()).activeVersionId, publication.targetVersionId);
    assert.deepEqual(await db.studioFieldValue.findMany({ where: scope, orderBy: { id: "asc" } }), valuesBefore);
    assert.equal(await db.auditEntry.count({ where: { organisationId: staff.organisationId, entityId: prepared.id, action: "studio.field.migration.finalized" } }), 1);
    await checkFieldGenerationContinuation(staff, staffPrincipal, prepared.id, parentId, otherOrganisationId);
    assert.deepEqual(await invoke(nextRequest, false), finalized); assert.deepEqual(await invoke(), rolledBack);
    await denials(nextRequest, false);
    assert.deepEqual(await db.serviceWorkItem.findMany({ where: nativeWhere, orderBy: { id: "asc" } }), nativeBefore);
    console.log("PASS actual settlement service: independent current customer settles staff-reviewed operation; original source/target/native history retained; both rollback Audit failures and finalization Audit failure atomic, concurrent CAS exactly once, lost-response and post-cosmetic/new-migration replay, current field/private/module/membership/session and tenant denials; changed extension blocks rollback but finalization succeeds; native snapshots unchanged.");
  } finally {
    await db.serviceQueueMember.deleteMany({ where: { id: { in: addedQueues }, organisationId: staff.organisationId, userId: customerUserId } });
    await db.membership.update({ where: { id: member.id, organisationId: staff.organisationId }, data: { active: member.active, grantedCapabilities: member.grantedCapabilities } });
  }
}
