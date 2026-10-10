import assert from "node:assert/strict";
import { db } from "../../src/core/db/client";
import { sessionForUser, type Session } from "../../src/core/auth/session";
import type { Prisma } from "../../src/generated/prisma/client";
import { createTicketWithFieldInitialisation, authoriseNewTicketFields } from "../../src/core/service-work/studio-create";
import { withFieldRuntimeAuthority } from "../../src/core/studio/fields/runtime-authority";
import { registeredRequiredFactMetadata } from "../../src/core/studio/fields/required-owner";

/** Exact synthetic Test identities only. Native INSERT/Audit probes run in an
 * intentionally rolled-back transaction; no live customer record is changed. */
export async function checkFieldNativeContracts(customerUserId: string, organisationId: string, otherOrganisationId: string, parentId: string) {
  assert(process.platform === "linux" && process.env.ATLAS_STUDIO_LIVE_TEST === "1");
  for (const id of [organisationId, otherOrganisationId]) assert(await db.organisation.findFirst({ where: { id, isTest: true, kind: "CUSTOMER", status: "ACTIVE", archivedAt: null, slug: { startsWith: "studio-check-" } } }));
  assert(await db.user.findFirst({ where: { id: customerUserId, email: { startsWith: "studio-check-", endsWith: "@example.test" }, platformAdmin: null } }));
  const member = await db.membership.findFirstOrThrow({ where: { organisationId, userId: customerUserId, active: true } });
  const parent = await db.serviceWorkItem.findFirstOrThrow({ where: { id: parentId, organisationId, kind: "TICKET" } });
  const foreign = await db.serviceWorkItem.findFirstOrThrow({ where: { organisationId: otherOrganisationId, kind: "TICKET" } });
  const nativeWhere = { organisationId: { in: [organisationId, otherOrganisationId] } };
  const snapshot = async () => ({ records: await db.serviceWorkItem.findMany({ where: nativeWhere, orderBy: { id: "asc" } }),
    audits: await db.auditEntry.findMany({ where: nativeWhere, orderBy: { id: "asc" } }),
    extensions: await db.studioExtensionRecord.findMany({ where: nativeWhere, orderBy: { id: "asc" } }) });
  const before = await snapshot(), blocked = ["studio.definition.read", "studio.definition.edit", "studio.definition.publish", "studio.definition.live_test", "tickets.ticket.manage"];
  let addedQueueMemberId: string | undefined;
  try {
    await db.membership.update({ where: { id: member.id, organisationId }, data: { grantedCapabilities: ["tickets.ticket.read"], deniedCapabilities: [...new Set([...member.deniedCapabilities.filter(cap => cap !== "tickets.ticket.read"), ...blocked])] } });
    const reader = await sessionForUser(organisationId, customerUserId); assert(reader);
    if (!await db.serviceQueueMember.findFirst({ where: { organisationId, queueId: parent.queueId, userId: customerUserId } })) {
      await assert.rejects(() => withFieldRuntimeAuthority(reader, async ({ session, registry, transaction }) =>
        registry.invokeQueryInTransaction({ session, transaction }, registry.describe("tickets.ticket.required_facts", 1), { recordId: parentId, expectedRevision: parent.version })), /unavailable/);
      addedQueueMemberId = (await db.serviceQueueMember.create({ data: { organisationId, queueId: parent.queueId, userId: customerUserId } })).id;
    }
    await withFieldRuntimeAuthority(reader, async ({ session, registry, transaction }) => {
      for (const cap of blocked) assert(!session.capabilities.has(cap));
      const entity = registry.describe("tickets.ticket", 6), metadata = await registeredRequiredFactMetadata(session, registry, entity, "status");
      assert.equal(metadata.organisationId, organisationId); assert.equal(metadata.kind, "native");
      await assert.rejects(() => registeredRequiredFactMetadata(session, registry, entity, "description"), /not approved/);
      const query = registry.describe("tickets.ticket.required_facts", 1);
      const facts = await registry.invokeQueryInTransaction({ session, transaction }, query, { recordId: parentId, expectedRevision: parent.version });
      assert.deepEqual(facts, { recordId: parent.id, organisationId, revision: parent.version, fields: { status: parent.status, priority: parent.priority } });
      await assert.rejects(() => registry.invokeQueryInTransaction({ session, transaction }, query, { recordId: foreign.id, expectedRevision: foreign.version }), /unavailable/);
      await assert.rejects(() => registry.invokeQueryInTransaction({ session, transaction }, query, { recordId: parent.id, expectedRevision: parent.version + 1 }), /changed/);
    });
    await db.membership.update({ where: { id: member.id, organisationId }, data: { grantedCapabilities: ["tickets.ticket.create"], deniedCapabilities: [...new Set([...member.deniedCapabilities.filter(cap => cap !== "tickets.ticket.create"), ...blocked, "tickets.ticket.read"])] } });
    const creator = await sessionForUser(organisationId, customerUserId); assert(creator);
    const data = { organisationId, kind: "TICKET", requesterUserId: customerUserId, queueId: parent.queueId, number: `CHECK-${crypto.randomUUID()}`, subject: "Studio creation contract rollback probe" };
    const rollback = new Error("STUDIO_CREATION_PROBE_ROLLBACK");
    let retained: { session: Session; transaction: Prisma.TransactionClient; proof: object } | undefined;
    await assert.rejects(() => db.$transaction(async transaction => {
      await createTicketWithFieldInitialisation({ session: creator, transaction }, data, async (authority, work, proof) => {
        retained = { session: authority.session, transaction, proof };
        assert(!authority.session.capabilities.has("tickets.ticket.read")); assert(!authority.session.capabilities.has("tickets.ticket.manage"));
        const entity = authority.registry.describe("tickets.ticket", 6);
        await assert.rejects(() => authority.registry.authoriseRecord({ session: authority.session, transaction }, entity, { recordId: parentId, intent: "extend", expectedRevision: parent.version }), /FORBIDDEN/);
        assert.deepEqual(await authority.registry.authoriseRecordInitialisation({ session: authority.session, transaction }, entity, proof), { recordId: work.id, organisationId, revision: 1 });
        await assert.rejects(() => authority.registry.authoriseRecordInitialisation({ session: authority.session, transaction }, entity, {}), /FORBIDDEN/);
        await transaction.auditEntry.create({ data: { organisationId, actorUserId: customerUserId, action: "studio.field.creation_contract_probe", entityType: "ServiceWorkItem", entityId: work.id, after: { probe: true } } });
        throw rollback;
      });
    }, { isolationLevel: "Serializable" }), error => error === rollback);
    assert(retained); const expired = retained;
    await assert.rejects(() => authoriseNewTicketFields({ session: expired.session, transaction: expired.transaction }, expired.proof), /FORBIDDEN/);
    await db.$transaction(async transaction => {
      await assert.rejects(() => createTicketWithFieldInitialisation({ session: creator, transaction }, data, async () => assert.fail("Unsafe transaction callback ran")), /serializable/);
    }, { isolationLevel: "ReadCommitted" });
    assert.deepEqual(await snapshot(), before);
  } finally {
    await db.membership.update({ where: { id: member.id, organisationId }, data: { grantedCapabilities: member.grantedCapabilities, deniedCapabilities: member.deniedCapabilities } });
    if (addedQueueMemberId) await db.serviceQueueMember.deleteMany({ where: { id: addedQueueMemberId, organisationId, queueId: parent.queueId, userId: customerUserId } });
  }
  console.log("STUDIO NATIVE FIELD CONTRACTS PASS: actual canonical facts/foreign/stale denial; genuine create-only proof, no existing access, expired/unsafe denial and native/Audit rollback");
}
