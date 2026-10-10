import assert from "node:assert/strict";
import { db } from "../../src/core/db/client";
import { sessionForUser } from "../../src/core/auth/session";
import { withFieldRuntimeAuthority } from "../../src/core/studio/fields/runtime-authority";
import { compileCustomField, compileCustomFieldForRead } from "../../src/core/studio/compiler/fields";
import { customFieldPayloadSchema } from "../../src/core/studio/fields/schema";
import { checksum } from "../../src/core/studio/registry/contracts";

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
  let addedQueue: string | undefined;
  const nativeWhere = { organisationId: { in: [organisationId, otherOrganisationId] } }, nativeBefore = await db.serviceWorkItem.findMany({ where: nativeWhere, orderBy: { id: "asc" } });
  try {
    await db.membership.update({ where: { id: member.id, organisationId }, data: { grantedCapabilities: grants, deniedCapabilities: denied } });
    if (!await db.serviceQueueMember.findFirst({ where: { organisationId, queueId: parent.queueId, userId: customerUserId } })) {
      addedQueue = (await db.serviceQueueMember.create({ data: { organisationId, queueId: parent.queueId, userId: customerUserId } })).id;
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
    await db.moduleState.update({ where: { id: authoring.id, organisationId }, data: { enabled: false } }); await read();
    await db.moduleState.update({ where: { id: source.id, organisationId }, data: { enabled: false } });
    await assert.rejects(read, /unavailable|DEPENDENCY_BROKEN/);
    await db.moduleState.update({ where: { id: source.id, organisationId }, data: { enabled: source.enabled } });
    await db.membership.update({ where: { id: member.id, organisationId }, data: { deniedCapabilities: [...denied, "tickets.ticket.read"] } });
    await assert.rejects(read, /FORBIDDEN/);
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
    console.log("PASS ordinary field runtime authority: real customer without Studio/write grants validates identical published plan; disabled authoring allowed, disabled owner and fresh native/private/capability/membership/session/auth/tenant denials; native rows unchanged.");
  } finally {
    if (addedQueue) await db.serviceQueueMember.deleteMany({ where: { id: addedQueue, organisationId, userId: customerUserId } });
    await db.moduleState.update({ where: { id: source.id, organisationId }, data: { enabled: source.enabled } });
    await db.moduleState.update({ where: { id: authoring.id, organisationId }, data: { enabled: authoring.enabled } });
    await db.membership.update({ where: { id: member.id, organisationId }, data: { active: member.active, grantedCapabilities: member.grantedCapabilities, deniedCapabilities: member.deniedCapabilities } });
    // Retain increased versions to revoke only this synthetic account's old cookie.
  }
}
