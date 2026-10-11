import assert from "node:assert/strict";
import { db } from "../../src/core/db/client";
import { Prisma } from "../../src/generated/prisma/client";
import { sessionForUser, type Session } from "../../src/core/auth/session";
import type { FieldMigrationPrincipal } from "../../src/core/studio/fields/principal-contract";
import { captureCustomerFieldMigrationPrincipal, resolveFieldMigrationPrincipal } from "../../src/core/studio/fields/principal";
import { checksum } from "../../src/core/studio/registry/contracts";
import { studioRegistry } from "../../src/core/studio/registry/runtime";
import { customFieldPayloadSchema } from "../../src/core/studio/fields/schema";
import { conditionalFieldPayloadSchema } from "../../src/core/studio/fields/required-contract";
import { compileFieldMigrationMetadata } from "../../src/core/studio/fields/migrations/metadata";
import { withFieldMigrationAuthority } from "../../src/core/studio/fields/migrations/authority";
import { startFieldMigrationPreparation } from "../../src/core/studio/fields/migrations/preparation";
import { collectFieldMigrationBatch } from "../../src/core/studio/fields/migrations/collection";
import { sealFieldMigrationPreparation } from "../../src/core/studio/fields/migrations/sealing";
import { publishReviewedFieldMigration } from "../../src/core/studio/fields/migrations/publication";
import { startFieldMigrationExecution } from "../../src/core/studio/fields/migrations/execution-start";
import { executeFieldMigrationBatch } from "../../src/core/studio/fields/migrations/execution-batch";
import { cutoverReviewedFieldMigration } from "../../src/core/studio/fields/migrations/cutover";
import { rollbackReviewedFieldMigration, finalizeReviewedFieldMigration } from "../../src/core/studio/fields/migrations/settlement";
import { fieldMigrationCutoverPinSchema } from "../../src/core/studio/fields/migrations/cutover-contract";
import { FINAL_WORK } from "../../src/core/service-work/config";

/** Existing driver's fresh isolated Test definition/account only. Saved conditional
 * draft seed is privileged Test metadata; all review, conversion, cutover and
 * settlement operations use normal services and genuine current principals.
 * No native records, users, companies, permanent grants or dumps are created. */
export async function checkRequiredFieldCutoverService(actor: Session, staffPrincipal: FieldMigrationPrincipal,
  definitionId: string, customerUserId: string) {
  assert(process.platform === "linux" && process.env.ATLAS_STUDIO_LIVE_TEST === "1");
  const organisationId = actor.organisationId, scope = { organisationId, definitionId };
  const company = await db.organisation.findFirstOrThrow({ where: { id: organisationId, kind: "CUSTOMER", status: "ACTIVE",
    archivedAt: null, isTest: true, slug: { startsWith: "studio-check-" } }, select: { id: true, kind: true, status: true, archivedAt: true, isTest: true } });
  assert(await db.user.findFirst({ where: { id: customerUserId, email: { startsWith: "studio-check-", endsWith: "@example.test" }, platformAdmin: null } }));
  assert.notEqual(customerUserId, actor.userId);
  const staffMember = await db.membership.findFirstOrThrow({ where: { id: actor.membershipId, organisationId, userId: actor.userId, active: true } });
  const member = await db.membership.findFirstOrThrow({ where: { organisationId, userId: customerUserId, active: true } });
  const initial = await db.studioDefinition.findFirstOrThrow({ where: { id: definitionId, organisationId, createdBy: actor.userId,
    key: "tickets.ticket.schema_review", kind: "customField", retiredAt: null }, include: { activeVersion: true, draft: true } });
  assert(initial.activeVersion && initial.draft);
  const source = customFieldPayloadSchema.parse(initial.activeVersion.payload);
  assert.equal(source.field.storage.type, "integer");
  const sourceValues = await db.studioFieldValue.findMany({ where: { ...scope, generationId: source.storageGeneration }, orderBy: { id: "asc" } });
  const native = () => db.serviceWorkItem.findMany({ where: { organisationId, kind: "TICKET" }, orderBy: { id: "asc" } });
  const nativeBefore = await native(), addedQueues: string[] = [], fieldCapability = "tickets.field.required_cutover_check";
  const grants = [...new Set([...member.grantedCapabilities, fieldCapability, "tickets.ticket.read", "tickets.ticket.manage", "studio.definition.publish"])];
  await db.membership.update({ where: { id: staffMember.id, organisationId }, data: { grantedCapabilities: [...new Set([...staffMember.grantedCapabilities, fieldCapability])] } });
  try {
    await db.membership.update({ where: { id: member.id, organisationId }, data: { grantedCapabilities: grants } });
    for (const queue of await db.serviceQueue.findMany({ where: { organisationId, restricted: true }, select: { id: true } })) {
      if (!await db.serviceQueueMember.findFirst({ where: { organisationId, queueId: queue.id, userId: customerUserId } })) {
        const row = await db.serviceQueueMember.create({ data: { organisationId, queueId: queue.id, userId: customerUserId } }); addedQueues.push(row.id);
      }
    }
    const staff = await resolveFieldMigrationPrincipal(staffPrincipal), customer = await sessionForUser(organisationId, customerUserId); assert(customer);
    let principal = await captureCustomerFieldMigrationPrincipal(customer);
    const definition = () => db.studioDefinition.findFirstOrThrow({ where: { id: definitionId, organisationId }, include: { draft: true } });
    async function snapshot(id: string) {
      return { definition: await definition(), receipt: await db.studioFieldMigrationCutover.findFirst({ where: { ...scope, preparationId: id } }),
        publication: await db.studioFieldMigrationPublication.findFirstOrThrow({ where: { ...scope, preparationId: id } }),
        execution: await db.studioFieldMigrationExecution.findFirstOrThrow({ where: { ...scope, preparationId: id } }),
        extensions: await db.studioExtensionRecord.findMany({ where: { organisationId }, orderBy: { id: "asc" } }),
        slots: await db.studioFieldSlot.findMany({ where: scope, orderBy: { id: "asc" } }),
        values: await db.studioFieldValue.findMany({ where: scope, orderBy: { id: "asc" } }),
        outcomes: await db.studioFieldMigrationOutcome.findMany({ where: { ...scope, preparationId: id }, orderBy: { recordId: "asc" } }),
        audits: await db.auditEntry.findMany({ where: { organisationId, entityId: { in: [definitionId, id] } }, orderBy: { id: "asc" } }) };
    }
    async function prepareReady() {
      const saved = await withFieldMigrationAuthority(staff, staffPrincipal, async ({ session, transaction: tx }) => {
        const current = await tx.studioDefinition.findFirstOrThrow({ where: { id: definitionId, organisationId }, include: { draft: true } }); assert(current.draft);
        assert.equal(current.activeVersionId, initial.activeVersion!.id);
        const entity = studioRegistry().describe("tickets.ticket", 9);
        const payload = conditionalFieldPayloadSchema.parse({ ...source, schemaVersion: 2,
          entity: { id: entity.id, version: entity.version, schemaHash: entity.schemaHash, contractHash: entity.contractHash },
          storageGeneration: crypto.randomUUID(), field: { ...source.field, writeCapability: fieldCapability, storage: { type: "decimal", precision: 28, scale: 10 } },
          requiredIf: { match: "all", predicates: [{ source: { kind: "native", fieldId: "status" }, operator: "absent" }] } });
        const compiled = await compileFieldMigrationMetadata({ session, transaction: tx }, studioRegistry(), company, definitionId, payload);
        assert.equal((await tx.studioDraft.updateMany({ where: { id: current.draft.id, organisationId, revision: current.draft.revision },
          data: { payload: compiled.payload, revision: { increment: 1 }, validation: Prisma.DbNull } })).count, 1);
        await tx.auditEntry.create({ data: { organisationId, actorUserId: session.userId, action: "studio.required_cutover.test_draft_seeded", entityType: "StudioDefinition", entityId: definitionId } });
        return { revision: current.revision, draftRevision: current.draft.revision + 1, payload: compiled.payload };
      });
      const prepared = await startFieldMigrationPreparation(staff, staffPrincipal, { operationId: crypto.randomUUID(), definitionId,
        definitionRevision: saved.revision, draftRevision: saved.draftRevision, conversion: { kind: "integer_to_decimal" } });
      let batch = await collectFieldMigrationBatch(staff, { preparationId: prepared.id, revision: prepared.revision, limit: 2 });
      for (let page = 0; !batch.cursorExhausted; page++) { assert(page < 100); batch = await collectFieldMigrationBatch(staff, { preparationId: prepared.id, revision: batch.revision, limit: 2 }); }
      const review = await sealFieldMigrationPreparation(staff, { preparationId: prepared.id, revision: batch.revision }); assert.equal(review.summary.invalidCount, 0);
      const publication = await publishReviewedFieldMigration(staff, { preparationId: prepared.id, revision: review.revision,
        reviewChecksum: review.checksum, acknowledgeWarnings: true, acknowledgeLoss: false });
      let execution = await startFieldMigrationExecution(staff, { preparationId: prepared.id, publicationRevision: publication.publicationRevision, reviewChecksum: review.checksum });
      for (let page = 0; execution.state !== "READY"; page++) { assert(page < 100); execution = await executeFieldMigrationBatch(staff, { preparationId: prepared.id, revision: execution.revision, limit: 2 }); }
      assert.equal(execution.processedCount, nativeBefore.length);
      return { id: prepared.id, payload: saved.payload, request: { preparationId: prepared.id, reviewChecksum: review.checksum,
        definitionRevision: (await definition()).revision, publicationRevision: publication.publicationRevision, executionRevision: execution.revision } };
    }
    async function auditFailure(id: string, action: string, entityId: string, operation: () => Promise<unknown>) {
      const trigger = `studio_required_cut_${crypto.randomUUID().replaceAll("-", "")}`;
      for (const value of [trigger, organisationId, entityId]) assert(/^[a-zA-Z0-9_-]+$/.test(value)); assert(/^[a-z_.]+$/.test(action));
      const before = await snapshot(id);
      try {
        await db.$executeRawUnsafe(`CREATE FUNCTION ${trigger}() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN IF NEW."organisationId"='${organisationId}' AND NEW."entityId"='${entityId}' AND NEW.action='${action}' THEN RAISE EXCEPTION 'Exact Test conditional cutover Audit failure'; END IF; RETURN NEW; END $$;`);
        await db.$executeRawUnsafe(`CREATE TRIGGER ${trigger} BEFORE INSERT ON audit_entries FOR EACH ROW EXECUTE FUNCTION ${trigger}();`);
        await assert.rejects(operation, /Exact Test conditional cutover Audit failure/); assert.deepEqual(await snapshot(id), before);
      } finally { await db.$executeRawUnsafe(`DROP TRIGGER IF EXISTS ${trigger} ON audit_entries;`); await db.$executeRawUnsafe(`DROP FUNCTION IF EXISTS ${trigger}();`); }
    }
    async function confirmation(id: string) {
      const receipt = await db.studioFieldMigrationCutover.findFirstOrThrow({ where: { ...scope, preparationId: id } }), pin = fieldMigrationCutoverPinSchema.parse(receipt.pin);
      return { preparationId: id, cutoverChecksum: receipt.pinChecksum, cutoverRevision: 0, definitionRevision: pin.definitionRevision + 1, publicationRevision: pin.publication.revision + 1 };
    }
    const first = await prepareReady(), ready = await snapshot(first.id);
    for (const patch of [{ schemaVersion: 1 }, { organisationId: "foreign" }, { definitionRevision: first.request.definitionRevision + 1 }, { reviewChecksum: "f".repeat(64) }])
      await assert.rejects(() => cutoverReviewedFieldMigration(staff, { ...first.request, ...patch }));
    assert.deepEqual(await snapshot(first.id), ready);
    for (const [action, entityId] of [["studio.definition.activated", definitionId], ["studio.field.migration.cutover", first.id]] as const)
      await auditFailure(first.id, action, entityId, () => cutoverReviewedFieldMigration(staff, first.request));
    const activated = await cutoverReviewedFieldMigration(staff, first.request), active = await snapshot(first.id);
    assert.equal(activated.replayed, false); assert.equal(active.definition.activeVersionId, activated.targetVersionId);
    assert.equal(active.receipt?.state, "ACTIVATED"); assert.equal(active.publication.state, "CUTOVER");
    assert.deepEqual(active.values, ready.values); assert.deepEqual(active.extensions, ready.extensions); assert.deepEqual(active.outcomes, ready.outcomes);
    assert.deepEqual(await cutoverReviewedFieldMigration(staff, first.request), { ...activated, replayed: true }); assert.deepEqual(await snapshot(first.id), active);
    const request = await confirmation(first.id), rollback = (input: unknown = request) => rollbackReviewedFieldMigration(customer, principal, input);
    for (const patch of [{ principal: staffPrincipal }, { organisationId: "foreign" }, { cutoverChecksum: "f".repeat(64) }, { definitionRevision: request.definitionRevision + 1 }]) await assert.rejects(() => rollback({ ...request, ...patch }));
    await db.membership.update({ where: { id: member.id, organisationId }, data: { deniedCapabilities: [...member.deniedCapabilities, fieldCapability] } });
    try { await assert.rejects(() => rollback(), /FORBIDDEN/); } finally { await db.membership.update({ where: { id: member.id }, data: { deniedCapabilities: member.deniedCapabilities } }); }
    const queueMember = await db.serviceQueueMember.findFirstOrThrow({ where: { organisationId, userId: customerUserId, queue: { restricted: true } } });
    await db.serviceQueueMember.delete({ where: { id: queueMember.id, organisationId } });
    try { await assert.rejects(() => rollback(), /MIGRATION_ACCESS_REQUIRED/); } finally { await db.serviceQueueMember.create({ data: queueMember }); }
    assert.deepEqual(await snapshot(first.id), active);
    for (const [action, entityId] of [["studio.definition.activated", definitionId], ["studio.field.migration.rolled_back", first.id]] as const)
      await auditFailure(first.id, action, entityId, () => rollback());
    // Revoke only this Test-company support affiliation; a fresh independent
    // customer's current authority must work without resolving the creator.
    await db.membership.update({ where: { id: staffMember.id, organisationId }, data: { active: false } });
    let rolledBack: Awaited<ReturnType<typeof rollbackReviewedFieldMigration>>;
    try {
      await assert.rejects(() => resolveFieldMigrationPrincipal(staffPrincipal), /FORBIDDEN/);
      const results = await Promise.allSettled([rollback(), rollback()]);
      assert.equal(results.filter(result => result.status === "fulfilled" && !result.value.replayed).length, 1);
      for (const result of results) if (result.status === "rejected") assert.match(String(result.reason), /stale|changed/i);
      const committed = results.find(result => result.status === "fulfilled" && !result.value.replayed);
      assert(committed?.status === "fulfilled"); rolledBack = committed.value;
      assert.equal(rolledBack.settledBy, customerUserId); assert.equal(rolledBack.replayed, false);
      assert.deepEqual(await rollback(), { ...rolledBack, replayed: true });
    } finally { await db.membership.update({ where: { id: staffMember.id, organisationId }, data: { active: staffMember.active } }); }
    const restored = await snapshot(first.id); assert.equal(restored.definition.activeVersionId, initial.activeVersion.id);
    assert.equal(restored.receipt?.state, "ROLLED_BACK"); assert.deepEqual(restored.values, ready.values); assert.deepEqual(restored.outcomes, ready.outcomes);
    assert.equal(restored.audits.filter(row => row.action === "studio.field.migration.rolled_back").length, 1);
    const oldPrincipal = principal;
    await db.membership.update({ where: { id: member.id, organisationId }, data: { sessionVersion: { increment: 1 } } });
    await assert.rejects(() => rollbackReviewedFieldMigration(customer, oldPrincipal, request), /FORBIDDEN/);
    principal = await captureCustomerFieldMigrationPrincipal(customer); assert.deepEqual(await rollback(), { ...rolledBack, replayed: true });

    const second = await prepareReady(); await cutoverReviewedFieldMigration(staff, second.request);
    const nextRequest = await confirmation(second.id), beforeDrift = await snapshot(second.id);
    await withFieldMigrationAuthority(customer, principal, async ({ session, transaction: tx }) => {
      const row = nativeBefore.find(record => !FINAL_WORK.includes(record.status) && !record.mergedIntoId); assert(row);
      const registry = studioRegistry(), context = { session, transaction: tx };
      const anchor = await registry.authoriseRecord(context, second.payload.entity, { recordId: row.id, intent: "read" });
      await registry.authoriseRecord(context, second.payload.entity, { recordId: row.id, intent: "extend", expectedRevision: anchor.revision });
      const extension = await tx.studioExtensionRecord.findFirstOrThrow({ where: { organisationId, entityId: "tickets.ticket", recordId: row.id } });
      assert.equal((await tx.studioExtensionRecord.updateMany({ where: { id: extension.id, organisationId, revision: extension.revision }, data: { revision: { increment: 1 } } })).count, 1);
      await tx.auditEntry.create({ data: { organisationId, actorUserId: session.userId, action: "studio.required_cutover.test_extension_changed", entityType: "StudioExtensionRecord", entityId: extension.id } });
    });
    await assert.rejects(() => rollbackReviewedFieldMigration(customer, principal, nextRequest), /stale|changed/i);
    await auditFailure(second.id, "studio.field.migration.finalized", second.id, () => finalizeReviewedFieldMigration(customer, principal, nextRequest));
    const finalized = await finalizeReviewedFieldMigration(customer, principal, nextRequest); assert.equal(finalized.settledBy, customerUserId); assert.equal(finalized.replayed, false);
    assert.deepEqual(await finalizeReviewedFieldMigration(customer, principal, nextRequest), { ...finalized, replayed: true });
    const afterFinalization = await snapshot(second.id); assert.equal(afterFinalization.receipt?.state, "FINALIZED"); assert.equal(afterFinalization.publication.state, "COMPLETED");
    assert.deepEqual(afterFinalization.values, beforeDrift.values); assert.deepEqual(afterFinalization.outcomes, beforeDrift.outcomes);
    // This definition was created by this acceptance run, never a business's
    // preexisting field. Retire it after finalization so later owner/native checks
    // cannot consume unfinished ordinary conditional authoring. Retain all rows.
    await withFieldMigrationAuthority(staff, staffPrincipal, async ({ session, transaction: tx }) => {
      const current = await tx.studioDefinition.findFirstOrThrow({ where: { id: definitionId, organisationId, createdBy: actor.userId,
        key: "tickets.ticket.schema_review", retiredAt: null } });
      assert.equal(current.activeVersionId, afterFinalization.definition.activeVersionId);
      assert.equal((await tx.studioDefinition.updateMany({ where: { id: definitionId, organisationId, revision: current.revision, retiredAt: null },
        data: { retiredAt: new Date(), revision: { increment: 1 } } })).count, 1);
      const draft = await tx.studioDraft.findFirstOrThrow({ where: scope });
      assert.equal((await tx.studioDraft.updateMany({ where: { id: draft.id, organisationId, revision: draft.revision },
        data: { payload: initial.draft!.payload!, revision: { increment: 1 }, validation: Prisma.DbNull } })).count, 1);
      await tx.auditEntry.create({ data: { organisationId, actorUserId: session.userId, action: "studio.required_cutover.test_definition_retired", entityType: "StudioDefinition", entityId: definitionId } });
    });
    assert.deepEqual(await finalizeReviewedFieldMigration(customer, principal, nextRequest), { ...finalized, replayed: true });
    assert.deepEqual(await rollback(), { ...rolledBack, replayed: true }); assert.deepEqual(await native(), nativeBefore);
    const historical = await snapshot(second.id);
    await db.membership.update({ where: { id: member.id, organisationId }, data: { deniedCapabilities: [...member.deniedCapabilities, fieldCapability] } });
    try { await assert.rejects(() => finalizeReviewedFieldMigration(customer, principal, nextRequest), /FORBIDDEN/); }
    finally { await db.membership.update({ where: { id: member.id }, data: { deniedCapabilities: member.deniedCapabilities } }); }
    const moduleState = await db.moduleState.findFirstOrThrow({ where: { organisationId, moduleId: "tickets" } });
    await db.moduleState.update({ where: { id: moduleState.id, organisationId }, data: { enabled: false } });
    try { await assert.rejects(() => finalizeReviewedFieldMigration(customer, principal, nextRequest), /unavailable|DEPENDENCY_BROKEN/); }
    finally { await db.moduleState.update({ where: { id: moduleState.id }, data: { enabled: moduleState.enabled } }); }
    assert.deepEqual(await snapshot(second.id), historical);
    assert.deepEqual(await db.studioFieldValue.findMany({ where: { ...scope, generationId: source.storageGeneration }, orderBy: { id: "asc" } }), sourceValues);
    assert.equal(checksum((await definition()).draft?.payload), checksum(initial.draft.payload));
    console.log("PASS actual conditional cutover/settlement services: READY target activation and strict replay, both paired cutover and rollback Audit atomic failures, genuine independent customer/current rights/private denial, revoked original creator still permits rollback, stale current principal denied, exact retained source restored; second actual cutover with legitimate global drift blocks rollback but finalizes/replays, old histories survive later active pointer and exact checker-only retirement; native/source values and immutable target/outcomes retained. Customer authoring/native hooks remain gated.");
  } finally {
    await db.serviceQueueMember.deleteMany({ where: { id: { in: addedQueues }, organisationId, userId: customerUserId } });
    await db.membership.update({ where: { id: member.id, organisationId }, data: { active: member.active, grantedCapabilities: member.grantedCapabilities, deniedCapabilities: member.deniedCapabilities } });
    await db.membership.update({ where: { id: staffMember.id, organisationId }, data: { active: staffMember.active, grantedCapabilities: staffMember.grantedCapabilities } });
  }
}
