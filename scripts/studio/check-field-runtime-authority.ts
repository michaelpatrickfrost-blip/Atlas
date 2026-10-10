import assert from "node:assert/strict";
import { db } from "../../src/core/db/client";
import { sessionForUser } from "../../src/core/auth/session";
import { withFieldRuntimeAuthority } from "../../src/core/studio/fields/runtime-authority";
import { compileCustomField, compileCustomFieldForRead } from "../../src/core/studio/compiler/fields";
import { customFieldPayloadSchema } from "../../src/core/studio/fields/schema";
import { checksum } from "../../src/core/studio/registry/contracts";
import { readCurrentFieldValue, readFieldValueHistory } from "../../src/core/studio/fields/runtime-read";
import { decodeStoredFieldValue } from "../../src/core/studio/fields/codec";

/** Ordinary operator proof, only this run's exact synthetic Test identity. No
 * native/value/config mutations, no authoring grant or extra business database. */
export async function checkFieldRuntimeAuthority(customerUserId: string, organisationId: string, otherOrganisationId: string, parentId: string) {
  assert(process.platform === "linux" && process.env.ATLAS_STUDIO_LIVE_TEST === "1");
  for (const id of [organisationId, otherOrganisationId]) assert(await db.organisation.findFirst({ where: { id, isTest: true, kind: "CUSTOMER", status: "ACTIVE", archivedAt: null, slug: { startsWith: "studio-check-" } } }));
  assert(await db.user.findFirst({ where: { id: customerUserId, email: { startsWith: "studio-check-", endsWith: "@example.test" }, platformAdmin: null } }));
  const member = await db.membership.findFirstOrThrow({ where: { organisationId, userId: customerUserId, active: true } });
  const definition = await db.studioDefinition.findFirstOrThrow({ where: { organisationId, key: "tickets.ticket.cutover_service", kind: "customField", retiredAt: null }, include: { activeVersion: true } });
  const version = definition.activeVersion; assert(version);
  const payload = customFieldPayloadSchema.parse(version.payload), fieldWrite = payload.field.writeCapability; assert(fieldWrite && fieldWrite !== "tickets.ticket.read");
  const forbidden = ["studio.definition.read", "studio.definition.edit", "studio.definition.publish", "studio.definition.live_test", "tickets.ticket.manage", fieldWrite];
  const grants = [...new Set([...member.grantedCapabilities, "tickets.ticket.read"])], denied = [...new Set([...member.deniedCapabilities.filter(cap => cap !== "tickets.ticket.read"), ...forbidden])];
  const source = await db.moduleState.findFirstOrThrow({ where: { organisationId, moduleId: "tickets" } });
  const authoring = await db.moduleState.findFirstOrThrow({ where: { organisationId, moduleId: "studio" } });
  const parent = await db.serviceWorkItem.findFirstOrThrow({ where: { id: parentId, organisationId, kind: "TICKET" } });
  const addedQueues: string[] = [];
  const nativeWhere = { organisationId: { in: [organisationId, otherOrganisationId] } }, nativeBefore = await db.serviceWorkItem.findMany({ where: nativeWhere, orderBy: { id: "asc" } });
  try {
    await db.membership.update({ where: { id: member.id, organisationId }, data: { grantedCapabilities: grants, deniedCapabilities: denied } });
    if (!await db.serviceQueueMember.findFirst({ where: { organisationId, queueId: parent.queueId, userId: customerUserId } })) {
      addedQueues.push((await db.serviceQueueMember.create({ data: { organisationId, queueId: parent.queueId, userId: customerUserId } })).id);
    }
    const authenticated = await sessionForUser(organisationId, customerUserId); assert(authenticated);
    const read = () => withFieldRuntimeAuthority(authenticated, async ({ session, transaction, registry }) => {
      for (const cap of forbidden) assert(!session.capabilities.has(cap));
      const compiled = await compileCustomFieldForRead(session, payload, registry);
      assert.equal(compiled.checksum, version.checksum); assert.equal(checksum(version.compiledPlan), compiled.checksum);
      const anchor = await registry.authoriseRecord({ session, transaction }, payload.entity, { recordId: parentId, intent: "read" });
      assert.equal(anchor.organisationId, organisationId); assert.equal(anchor.recordId, parentId);
      await assert.rejects(() => compileCustomField(session, payload, registry), /FORBIDDEN/);
    });
    await read();
    const extension = await db.studioExtensionRecord.findFirstOrThrow({ where: { organisationId, entityId: payload.entity.id, recordId: parentId } });
    const slot = await db.studioFieldSlot.findFirstOrThrow({ where: { organisationId, extensionId: extension.id, definitionId: definition.id, generationId: payload.storageGeneration }, include: { activeValue: { include: { schemaVersion: true } } } });
    assert(slot.activeValue);
    const current = await readCurrentFieldValue(authenticated, { definitionId: definition.id, recordId: parentId });
    assert.equal(current.state, "set"); assert.equal(current.generationId, payload.storageGeneration); assert.equal(current.valueRevision, slot.activeValue.revision);
    assert.deepEqual(current.value, decodeStoredFieldValue(customFieldPayloadSchema.parse(slot.activeValue.schemaVersion.payload).field, slot.activeValue));
    for (const generation of await db.studioFieldGeneration.findMany({ where: { organisationId, definitionId: definition.id }, orderBy: { createdAt: "asc" } })) {
      const expected = await db.studioFieldValue.findMany({ where: { organisationId, definitionId: definition.id, generationId: generation.id, slot: { extensionId: extension.id } }, orderBy: { revision: "desc" } });
      const ids: string[] = []; let beforeRevision: number | undefined;
      for (let n = 0; ; n++) {
        assert(n < 30);
        const page = await readFieldValueHistory(authenticated, { definitionId: definition.id, recordId: parentId, generationId: generation.id, limit: 2, ...(beforeRevision === undefined ? {} : { beforeRevision }) });
        assert.equal(page.currentGeneration, generation.id === payload.storageGeneration); ids.push(...page.items.map(item => item.id));
        if (page.nextBeforeRevision === null) break; beforeRevision = page.nextBeforeRevision;
      }
      assert.deepEqual(ids, expected.map(value => value.id));
    }
    for (const key of ["review_reference", "review_missing_reference", "review_foreign_reference"]) {
      const referenceDefinition = await db.studioDefinition.findFirstOrThrow({ where: { organisationId, key: `tickets.ticket.${key}`, kind: "customField" }, include: { activeVersion: true } });
      assert(referenceDefinition.activeVersion);
      const referencePayload = customFieldPayloadSchema.parse(referenceDefinition.activeVersion.payload);
      if (key !== "review_reference") {
        await assert.rejects(() => readCurrentFieldValue(authenticated, { definitionId: referenceDefinition.id, recordId: parentId }), /unavailable/i);
        await assert.rejects(() => readFieldValueHistory(authenticated, { definitionId: referenceDefinition.id, recordId: parentId, generationId: referencePayload.storageGeneration }), /unavailable/i);
        continue;
      }
      const referenceSlot = await db.studioFieldSlot.findFirstOrThrow({ where: { organisationId, definitionId: referenceDefinition.id, generationId: referencePayload.storageGeneration, extensionId: extension.id }, include: { activeValue: true } });
      assert(referenceSlot.activeValue?.referenceValue);
      const target = await db.serviceWorkItem.findFirstOrThrow({ where: { id: referenceSlot.activeValue.referenceValue, organisationId, kind: "TICKET" } });
      if (!await db.serviceQueueMember.findFirst({ where: { organisationId, queueId: target.queueId, userId: customerUserId } }))
        addedQueues.push((await db.serviceQueueMember.create({ data: { organisationId, queueId: target.queueId, userId: customerUserId } })).id);
      assert.deepEqual((await readCurrentFieldValue(authenticated, { definitionId: referenceDefinition.id, recordId: parentId })).value, { type: "reference", value: target.id });
    }
    await assert.rejects(() => readCurrentFieldValue(authenticated, { definitionId: definition.id, recordId: parentId, organisationId: otherOrganisationId }));
    const foreign = await sessionForUser(otherOrganisationId, customerUserId); assert.equal(foreign, null);
    const dataBefore = await db.studioFieldValue.findMany({ where: { organisationId, definitionId: definition.id }, orderBy: { id: "asc" } });
    await db.moduleState.update({ where: { id: authoring.id, organisationId }, data: { enabled: false } }); await read();
    assert.deepEqual(await readCurrentFieldValue(authenticated, { definitionId: definition.id, recordId: parentId }), current);
    await db.moduleState.update({ where: { id: source.id, organisationId }, data: { enabled: false } });
    await assert.rejects(read, /unavailable|DEPENDENCY_BROKEN/);
    await assert.rejects(() => readCurrentFieldValue(authenticated, { definitionId: definition.id, recordId: parentId }), /unavailable|DEPENDENCY_BROKEN/);
    await db.moduleState.update({ where: { id: source.id, organisationId }, data: { enabled: source.enabled } });
    await db.membership.update({ where: { id: member.id, organisationId }, data: { deniedCapabilities: [...denied, "tickets.ticket.read"] } });
    await assert.rejects(read, /FORBIDDEN/);
    await assert.rejects(() => readFieldValueHistory(authenticated, { definitionId: definition.id, recordId: parentId, generationId: payload.storageGeneration }), /FORBIDDEN/);
    await db.membership.update({ where: { id: member.id, organisationId }, data: { deniedCapabilities: denied } });
    let called = false;
    for (const forged of [{ ...authenticated }, { ...authenticated, organisationId: otherOrganisationId }])
      await assert.rejects(() => withFieldRuntimeAuthority(forged, async () => { called = true; }), /FORBIDDEN/);
    assert(!called);
    const queueMember = await db.serviceQueueMember.findFirstOrThrow({ where: { organisationId, queueId: parent.queueId, userId: customerUserId } });
    await db.serviceQueueMember.delete({ where: { id: queueMember.id, organisationId } });
    try { await assert.rejects(read, /FORBIDDEN|ACCESS_REQUIRED|unavailable/i); } finally { await db.serviceQueueMember.create({ data: queueMember }); }
    await db.membership.update({ where: { id: member.id, organisationId }, data: { active: false } }); await assert.rejects(read, /FORBIDDEN/);
    await db.membership.update({ where: { id: member.id, organisationId }, data: { active: true, sessionVersion: { increment: 1 } } }); await assert.rejects(read, /FORBIDDEN/);
    const renewed = await sessionForUser(organisationId, customerUserId); assert(renewed);
    await withFieldRuntimeAuthority(renewed, async ({ session, registry }) => { assert.equal((await compileCustomFieldForRead(session, payload, registry)).checksum, version.checksum); });
    await db.user.update({ where: { id: customerUserId }, data: { authVersion: { increment: 1 } } });
    await assert.rejects(() => withFieldRuntimeAuthority(renewed, async () => { throw new Error("must not run"); }), /FORBIDDEN/);
    assert.deepEqual(await db.serviceWorkItem.findMany({ where: nativeWhere, orderBy: { id: "asc" } }), nativeBefore);
    assert.deepEqual(await db.studioFieldValue.findMany({ where: { organisationId, definitionId: definition.id }, orderBy: { id: "asc" } }), dataBefore);
    console.log("PASS ordinary field runtime/read: real customer without Studio/write grants validates identical plan and current typed value; bounded all retained generations, real valid/missing/foreign reference proof; disabled authoring allowed, disabled owner and fresh native/private/capability/membership/session/auth/tenant denials; native/value snapshots unchanged.");
  } finally {
    await db.serviceQueueMember.deleteMany({ where: { id: { in: addedQueues }, organisationId, userId: customerUserId } });
    await db.moduleState.update({ where: { id: source.id, organisationId }, data: { enabled: source.enabled } });
    await db.moduleState.update({ where: { id: authoring.id, organisationId }, data: { enabled: authoring.enabled } });
    await db.membership.update({ where: { id: member.id, organisationId }, data: { active: member.active, grantedCapabilities: member.grantedCapabilities, deniedCapabilities: member.deniedCapabilities } });
    // Retain increased versions to revoke only this synthetic account's old cookie.
  }
}
