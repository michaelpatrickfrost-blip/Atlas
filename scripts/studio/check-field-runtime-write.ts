import assert from "node:assert/strict";
import { db } from "../../src/core/db/client";
import { sessionForUser, type Session } from "../../src/core/auth/session";
import type { FieldMigrationPrincipal } from "../../src/core/studio/fields/principal-contract";
import { studioRegistry } from "../../src/core/studio/registry/runtime";
import { customFieldPayloadSchema, type CustomFieldPayload } from "../../src/core/studio/fields/schema";
import { createDraft, publishDraft, activateVersion, updateDraft } from "../../src/core/studio/definitions/service";
import { readCurrentFieldValue, readFieldValueHistory } from "../../src/core/studio/fields/runtime-read";
import { writeFieldValue } from "../../src/core/studio/fields/runtime-write";
import { startFieldMigrationPreparation } from "../../src/core/studio/fields/migrations/preparation";
import { collectFieldMigrationBatch } from "../../src/core/studio/fields/migrations/collection";
import { sealFieldMigrationPreparation } from "../../src/core/studio/fields/migrations/sealing";
import { publishReviewedFieldMigration } from "../../src/core/studio/fields/migrations/publication";
import { startFieldMigrationExecution } from "../../src/core/studio/fields/migrations/execution-start";
import { executeFieldMigrationBatch } from "../../src/core/studio/fields/migrations/execution-batch";
import { cutoverReviewedFieldMigration } from "../../src/core/studio/fields/migrations/cutover";
import { retireFieldDefinition } from "../../src/core/studio/fields/retirement";

/** Actual ordinary value service, exact synthetic Test accounts/company only.
 * Native rows are read-only. Required native-create/save hooks remain2B4d. */
export async function checkFieldRuntimeWrite(staff: Session, principal: FieldMigrationPrincipal, customerUserId: string, parentId: string, peerId: string, otherOrganisationId: string) {
  assert(process.platform === "linux" && process.env.ATLAS_STUDIO_LIVE_TEST === "1");
  const organisationId = staff.organisationId;
  for (const id of [organisationId, otherOrganisationId]) assert(await db.organisation.findFirst({ where: { id, isTest: true, kind: "CUSTOMER", status: "ACTIVE", archivedAt: null, slug: { startsWith: "studio-check-" } } }));
  assert(await db.user.findFirst({ where: { id: customerUserId, email: { startsWith: "studio-check-", endsWith: "@example.test" }, platformAdmin: null } }));
  const customerMember = await db.membership.findFirstOrThrow({ where: { organisationId, userId: customerUserId, active: true } });
  const staffMember = await db.membership.findFirstOrThrow({ where: { id: staff.membershipId, organisationId, userId: staff.userId, active: true } });
  const caps = { sourceRead: "tickets.field.runtime_source_read", targetRead: "tickets.field.runtime_target_read", write: "tickets.field.runtime_write" };
  const grants = [...new Set([...customerMember.grantedCapabilities, "tickets.ticket.read", "tickets.ticket.manage", ...Object.values(caps)])];
  const denied = [...new Set([...customerMember.deniedCapabilities.filter(cap => !grants.includes(cap)), "studio.definition.read", "studio.definition.edit", "studio.definition.publish", "studio.definition.live_test"])];
  const addedQueues: string[] = [];
  const moduleState = await db.moduleState.findFirstOrThrow({ where: { organisationId, moduleId: "studio" } });
  const nativeWhere = { organisationId: { in: [organisationId, otherOrganisationId] } }, nativeBefore = await db.serviceWorkItem.findMany({ where: nativeWhere, orderBy: { id: "asc" } });
  try {
    await db.membership.update({ where: { id: staffMember.id, organisationId }, data: { grantedCapabilities: [...new Set([...staffMember.grantedCapabilities, ...Object.values(caps)])] } });
    await db.membership.update({ where: { id: customerMember.id, organisationId }, data: { grantedCapabilities: grants, deniedCapabilities: denied } });
    for (const queue of await db.serviceQueue.findMany({ where: { organisationId }, select: { id: true } })) {
      if (!await db.serviceQueueMember.findFirst({ where: { organisationId, queueId: queue.id, userId: customerUserId } }))
        addedQueues.push((await db.serviceQueueMember.create({ data: { organisationId, queueId: queue.id, userId: customerUserId } })).id);
    }
    const currentSession = async (userId: string): Promise<Session> => { const session = await sessionForUser(organisationId, userId); assert(session); return session; };
    const author = await currentSession(staff.userId), customer = await currentSession(customerUserId);
    for (const cap of ["studio.definition.read", "studio.definition.edit", "studio.definition.publish"]) assert(!customer.capabilities.has(cap));
    const registry = studioRegistry(), meta = registry.describe("tickets.ticket", 2), targetMeta = registry.describe("tickets.ticket", 5);
    const ref = { id: meta.id, version: meta.version, schemaHash: meta.schemaHash, contractHash: meta.contractHash };
    const targetRef = { id: targetMeta.id, version: targetMeta.version, schemaHash: targetMeta.schemaHash, contractHash: targetMeta.contractHash };
    const payload = customFieldPayloadSchema.parse({ schemaVersion: 1, entity: ref, storageGeneration: crypto.randomUUID(), field: { key: "runtime_write", label: "Exact Test ordinary values", classification: "confidential",
      readCapability: caps.sourceRead, writeCapability: caps.write, unique: true, indexed: true, storage: { type: "integer" } } });
    const definition = await createDraft(author, { key: "tickets.ticket.runtime_write", kind: "customField", name: "Exact Test ordinary values", payload });
    const published = await publishDraft(author, { definitionId: definition.id, revision: 0, acknowledgeWarnings: true });
    const state = () => db.studioDefinition.findFirstOrThrow({ where: { id: definition.id, organisationId }, include: { draft: true, activeVersion: true } });
    await activateVersion(author, { definitionId: definition.id, versionId: published.versionId, revision: (await state()).revision });
    const request = async (actor: Session, recordId: string, value: unknown) => {
      const read = await readCurrentFieldValue(actor, { definitionId: definition.id, recordId });
      return { operationId: crypto.randomUUID(), definitionId: definition.id, versionId: read.versionId, generationId: read.generationId,
        definitionRevision: read.definitionRevision, recordId, recordRevision: read.recordRevision, extensionRevision: read.extensionRevision,
        slotRevision: read.slotRevision, valueRevision: read.valueRevision, value };
    };
    const snapshot = async () => ({ definition: await state(), values: await db.studioFieldValue.findMany({ where: { organisationId, definitionId: definition.id }, orderBy: { id: "asc" } }),
      slots: await db.studioFieldSlot.findMany({ where: { organisationId, definitionId: definition.id }, orderBy: { id: "asc" } }),
      extensions: await db.studioExtensionRecord.findMany({ where: { organisationId, entityId: payload.entity.id }, orderBy: { id: "asc" } }),
      receipts: await db.studioFieldMigrationCutover.findMany({ where: { organisationId, definitionId: definition.id }, orderBy: { preparationId: "asc" } }),
      publications: await db.studioFieldMigrationPublication.findMany({ where: { organisationId, definitionId: definition.id }, orderBy: { preparationId: "asc" } }),
      audits: await db.auditEntry.findMany({ where: { organisationId, OR: [{ entityId: definition.id }, { action: { in: ["studio.field.value.saved", "studio.field.migration.finalized", "studio.field.migration.support_opened"] } }] }, orderBy: { id: "asc" } }) });
    const referenceDefinition = await db.studioDefinition.findFirstOrThrow({ where: { organisationId, key: "tickets.ticket.review_reference", kind: "customField", retiredAt: null } });
    const referenceRead = await readCurrentFieldValue(customer, { definitionId: referenceDefinition.id, recordId: parentId });
    const referenceRequest = { operationId: crypto.randomUUID(), definitionId: referenceDefinition.id, versionId: referenceRead.versionId, generationId: referenceRead.generationId,
      definitionRevision: referenceRead.definitionRevision, recordId: parentId, recordRevision: referenceRead.recordRevision, extensionRevision: referenceRead.extensionRevision,
      slotRevision: referenceRead.slotRevision, valueRevision: referenceRead.valueRevision, value: peerId };
    const foreignTarget = await db.serviceWorkItem.findFirstOrThrow({ where: { organisationId: otherOrganisationId, kind: "TICKET" } });
    const referenceValues = await db.studioFieldValue.findMany({ where: { organisationId, definitionId: referenceDefinition.id }, orderBy: { id: "asc" } }), beforeReferences = await snapshot();
    for (const value of [foreignTarget.id, `missing_${crypto.randomUUID().replaceAll("-", "")}`])
      await assert.rejects(() => writeFieldValue(customer, { ...referenceRequest, value }), /unavailable/i);
    assert.deepEqual(await snapshot(), beforeReferences);
    assert.deepEqual(await db.studioFieldValue.findMany({ where: { organisationId, definitionId: referenceDefinition.id }, orderBy: { id: "asc" } }), referenceValues);
    await writeFieldValue(customer, referenceRequest);
    assert.deepEqual((await readCurrentFieldValue(customer, { definitionId: referenceDefinition.id, recordId: parentId })).value, { type: "reference", value: peerId });
    const first = await request(customer, parentId, 41), firstResult = await writeFieldValue(customer, first); assert(!firstResult.replayed);
    assert.deepEqual(await writeFieldValue(customer, first), { ...firstResult, replayed: true });
    assert.deepEqual((await readCurrentFieldValue(customer, { definitionId: definition.id, recordId: parentId })).value, { type: "integer", value: 41 });
    const stable = await snapshot();
    for (const patch of [{ recordRevision: first.recordRevision + 1 }, { definitionRevision: first.definitionRevision + 1 }, { extensionRevision: first.extensionRevision }, { generationId: crypto.randomUUID() }, { organisationId: otherOrganisationId }])
      await assert.rejects(() => writeFieldValue(customer, { ...first, operationId: crypto.randomUUID(), ...patch }));
    await assert.rejects(() => writeFieldValue(customer, { ...first, value: 99 }), /CONFLICT/);
    assert.deepEqual(await snapshot(), stable);
    const duplicate = await request(customer, peerId, 41); await assert.rejects(() => writeFieldValue(customer, duplicate), /CONFLICT/); assert.deepEqual(await snapshot(), stable);
    const pending = await request(customer, parentId, 42);
    for (const cap of ["tickets.ticket.manage", caps.write, caps.sourceRead]) {
      await db.membership.update({ where: { id: customerMember.id, organisationId }, data: { deniedCapabilities: [...denied, cap] } });
      await assert.rejects(() => writeFieldValue(customer, pending), /FORBIDDEN/);
    }
    await db.membership.update({ where: { id: customerMember.id, organisationId }, data: { deniedCapabilities: denied } });
    assert.deepEqual(await snapshot(), stable);
    async function migrate(target: CustomFieldPayload, conversion: "integer_to_decimal" | "same_type") {
      const before = await state(); assert(before.draft);
      const edited = await updateDraft(author, { definitionId: definition.id, revision: before.draft.revision, payload: target });
      const prepared = await startFieldMigrationPreparation(author, principal, { operationId: crypto.randomUUID(), definitionId: definition.id, definitionRevision: (await state()).revision, draftRevision: edited.revision, conversion: { kind: conversion } });
      let batch = await collectFieldMigrationBatch(author, { preparationId: prepared.id, revision: prepared.revision, limit: 2 });
      for (let n = 0; !batch.cursorExhausted; n++) { assert(n < 30); batch = await collectFieldMigrationBatch(author, { preparationId: prepared.id, revision: batch.revision, limit: 2 }); }
      const review = await sealFieldMigrationPreparation(author, { preparationId: prepared.id, revision: batch.revision });
      const publication = await publishReviewedFieldMigration(author, { preparationId: prepared.id, revision: review.revision, reviewChecksum: review.checksum, acknowledgeWarnings: true, acknowledgeLoss: false });
      const frozen = await request(customer, parentId, conversion === "integer_to_decimal" ? 42 : "43");
      await assert.rejects(() => writeFieldValue(customer, frozen), /FIELD_MIGRATION_IN_PROGRESS/);
      let execution = await startFieldMigrationExecution(author, { preparationId: prepared.id, publicationRevision: publication.publicationRevision, reviewChecksum: review.checksum });
      for (let n = 0; execution.state !== "READY"; n++) { assert(n < 30); execution = await executeFieldMigrationBatch(author, { preparationId: prepared.id, revision: execution.revision, limit: 2 }); }
      await cutoverReviewedFieldMigration(author, { preparationId: prepared.id, reviewChecksum: review.checksum, definitionRevision: (await state()).revision, publicationRevision: publication.publicationRevision, executionRevision: execution.revision });
      return prepared.id;
    }
    const target = customFieldPayloadSchema.parse({ ...payload, entity: targetRef, storageGeneration: crypto.randomUUID(), field: { ...payload.field, readCapability: caps.targetRead, storage: { type: "decimal" } } });
    const preparationId = await migrate(target, "integer_to_decimal");
    await db.membership.update({ where: { id: customerMember.id, organisationId }, data: { deniedCapabilities: [...denied, caps.sourceRead] } });
    await assert.rejects(() => readFieldValueHistory(customer, { definitionId: definition.id, recordId: parentId, generationId: payload.storageGeneration }), /FORBIDDEN/);
    const targetRequest = await request(customer, parentId, "42.50");
    async function failAudit(action: string, entityId: string, actor: Session = customer, input = targetRequest) {
      const trigger = `studio_runtime_test_${crypto.randomUUID().replaceAll("-", "")}`;
      for (const value of [trigger, organisationId, entityId]) assert(/^[a-zA-Z0-9_-]+$/.test(value)); assert(/^[a-z_.]+$/.test(action));
      const before = await snapshot();
      await db.$executeRawUnsafe(`CREATE FUNCTION ${trigger}() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN IF NEW."organisationId"='${organisationId}' AND NEW."entityId"='${entityId}' AND NEW.action='${action}' THEN RAISE EXCEPTION 'Exact Test ordinary Audit failure'; END IF; RETURN NEW; END $$;`);
      try {
        await db.$executeRawUnsafe(`CREATE TRIGGER ${trigger} BEFORE INSERT ON audit_entries FOR EACH ROW EXECUTE FUNCTION ${trigger}();`);
        await assert.rejects(() => writeFieldValue(actor, input), /Exact Test ordinary Audit failure/); assert.deepEqual(await snapshot(), before);
      } finally { await db.$executeRawUnsafe(`DROP TRIGGER IF EXISTS ${trigger} ON audit_entries;`); await db.$executeRawUnsafe(`DROP FUNCTION IF EXISTS ${trigger}();`); }
    }
    await failAudit("studio.field.migration.finalized", preparationId); await failAudit("studio.field.value.saved", targetRequest.operationId);
    const results = await Promise.allSettled([writeFieldValue(customer, targetRequest), writeFieldValue(customer, targetRequest)]);
    assert.equal(results.filter(result => result.status === "fulfilled" && !result.value.replayed).length, 1);
    for (const result of results) if (result.status === "rejected") assert.match(String(result.reason), /CONFLICT|changed/i);
    const targetResult = await writeFieldValue(customer, targetRequest); assert(targetResult.replayed);
    const receipt = await db.studioFieldMigrationCutover.findFirstOrThrow({ where: { organisationId, definitionId: definition.id, preparationId } });
    assert.equal(receipt.state, "FINALIZED"); assert.equal(receipt.settledBy, customerUserId);
    assert.equal(await db.auditEntry.count({ where: { organisationId, entityId: preparationId, action: "studio.field.migration.finalized" } }), 1);
    assert.equal(await db.auditEntry.count({ where: { organisationId, entityId: targetRequest.operationId, action: "studio.field.value.saved" } }), 1);
    assert.deepEqual((await readCurrentFieldValue(customer, { definitionId: definition.id, recordId: parentId })).value, { type: "decimal", value: "42.5" });
    await assert.rejects(() => writeFieldValue(customer, first), /FORBIDDEN/);
    await db.membership.update({ where: { id: customerMember.id, organisationId }, data: { deniedCapabilities: denied } });
    assert.deepEqual(await writeFieldValue(customer, first), { ...firstResult, replayed: true });
    const later = await request(customer, parentId, "43"); await writeFieldValue(customer, later);
    assert.deepEqual(await writeFieldValue(customer, targetRequest), targetResult);
    const staffTarget = customFieldPayloadSchema.parse({ ...target, storageGeneration: crypto.randomUUID() });
    const staffPreparation = await migrate(staffTarget, "same_type"), staffRequest = await request(author, parentId, "44");
    await db.moduleState.update({ where: { id: moduleState.id, organisationId }, data: { enabled: false } });
    await failAudit("studio.field.value.saved", staffRequest.operationId, author, staffRequest);
    await writeFieldValue(author, staffRequest);
    const staffReceipt = await db.studioFieldMigrationCutover.findFirstOrThrow({ where: { organisationId, definitionId: definition.id, preparationId: staffPreparation } });
    assert.equal(staffReceipt.state, "FINALIZED"); assert.equal(staffReceipt.settledBy, staff.userId);
    const supportPin = staffReceipt.settlementPin as { principal: { authority: string; auditId: string } }; assert.equal(supportPin.principal.authority, "staff_support");
    assert.equal(await db.auditEntry.count({ where: { id: supportPin.principal.auditId, organisationId, actorUserId: staff.userId, entityId: staffMember.id, action: "studio.field.migration.support_opened" } }), 1);
    await db.moduleState.update({ where: { id: moduleState.id, organisationId }, data: { enabled: moduleState.enabled } });
    await retireFieldDefinition(author, { definitionId: definition.id, revision: (await state()).revision });
    await assert.rejects(() => readCurrentFieldValue(customer, { definitionId: definition.id, recordId: parentId }), /FIELD_UNAVAILABLE/);
    assert((await readFieldValueHistory(customer, { definitionId: definition.id, recordId: parentId, generationId: payload.storageGeneration })).retired);
    assert.deepEqual(await db.serviceWorkItem.findMany({ where: nativeWhere, orderBy: { id: "asc" } }), nativeBefore);
    console.log("PASS actual ordinary value service: customer without authoring saves/reloads/replays typed values; uniqueness and stale native/config/slot/extension/tenant/current+written denials; real reviewed source freeze; first target save closes rollback eligibility atomically with both Audits, both Audit failures unchanged, concurrent exactly once and historical replay; source history permission retained; genuine staff support closure with authoring disabled; retirement/history and unchanged native records.");
  } finally {
    await db.serviceQueueMember.deleteMany({ where: { id: { in: addedQueues }, organisationId, userId: customerUserId } });
    await db.moduleState.update({ where: { id: moduleState.id, organisationId }, data: { enabled: moduleState.enabled } });
    await db.membership.update({ where: { id: customerMember.id, organisationId }, data: { grantedCapabilities: customerMember.grantedCapabilities, deniedCapabilities: customerMember.deniedCapabilities } });
    await db.membership.update({ where: { id: staffMember.id, organisationId }, data: { grantedCapabilities: staffMember.grantedCapabilities } });
  }
}
