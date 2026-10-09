import assert from "node:assert/strict";
import { db } from "../../src/core/db/client";
import type { Session } from "../../src/core/auth/session";
import { studioRegistry } from "../../src/core/studio/registry/runtime";

/** Isolated central Test fixtures only; no grants or existing business work change. */
export async function checkTicketContract(actor: Session, otherTenant: Session) {
  const test = await db.organisation.findFirst({ where: { id: actor.organisationId, isTest: true, slug: { startsWith: "studio-check-" } } });
  assert(test, "Ticket contract acceptance requires the driver's exact isolated Test company");
  assert(actor.capabilities.has("tickets.ticket.manage") && actor.capabilities.has("tickets.ticket.read"));
  assert(await db.organisation.findFirst({ where: { id: otherTenant.organisationId, isTest: true, slug: { startsWith: "studio-check-" } } }));
  for (const organisationId of [actor.organisationId, otherTenant.organisationId]) {
    await db.moduleState.upsert({ where: { organisationId_moduleId: { organisationId, moduleId: "tickets" } },
      create: { organisationId, moduleId: "tickets", enabled: true, entitled: true }, update: { enabled: true, entitled: true } });
  }
  const queue = await db.serviceQueue.create({ data: { organisationId: actor.organisationId, name: "Studio contract private queue", prefix: "STUDIO", department: "Acceptance", restricted: true } });
  const ticket = await db.serviceWorkItem.create({ data: { organisationId: actor.organisationId, kind: "TICKET", number: "TKT-STUDIO-CHECK", subject: "Owner-scoped Studio contract fixture", queueId: queue.id, requesterUserId: actor.userId } });
  const registry = studioRegistry(), entity = registry.describe("tickets.ticket", 1), get = registry.describe("tickets.ticket.get", 1), list = registry.describe("tickets.ticket.list", 1);
  const projection = await registry.invoke(actor, get, { recordId: ticket.id }) as { fields: Record<string, unknown> };
  assert.equal(projection.fields.subject, ticket.subject); assert(!("context" in projection.fields)); assert(!("description" in projection.fields));
  await assert.rejects(registry.invoke(otherTenant, get, { recordId: ticket.id }));
  const stranger = { ...actor, userId: `unrelated-${crypto.randomUUID()}` };
  await assert.rejects(registry.invoke(stranger, get, { recordId: ticket.id }), /unavailable/);
  assert.deepEqual((await registry.invoke(stranger, list, {}) as { records: unknown[] }).records, []);
  await assert.rejects(db.$transaction(tx => registry.authoriseRecord({ session: actor, transaction: tx }, entity, { recordId: ticket.id, intent: "extend", expectedRevision: 1 })), /restricted queue/);
  await db.serviceQueueMember.create({ data: { organisationId: actor.organisationId, queueId: queue.id, userId: actor.userId } });
  assert.equal((await db.$transaction(tx => registry.authoriseRecord({ session: actor, transaction: tx }, entity, { recordId: ticket.id, intent: "extend", expectedRevision: 1 }))).recordId, ticket.id);
  await assert.rejects(db.$transaction(tx => registry.authoriseRecord({ session: actor, transaction: tx }, entity, { recordId: ticket.id, intent: "extend", expectedRevision: 2 })), /record changed/);
  await assert.rejects(db.$transaction(tx => registry.authoriseRecord({ session: { ...actor, capabilities: new Set(["tickets.ticket.read", "studio.definition.edit"]) }, transaction: tx }, entity, { recordId: ticket.id, intent: "extend", expectedRevision: 1 })), /tickets.ticket.manage/);
  const unchanged = await db.serviceWorkItem.findUniqueOrThrow({ where: { id: ticket.id } });
  assert.equal(unchanged.version, 1); assert.equal(unchanged.status, "NEW"); assert.deepEqual(unchanged.context, {});
  // Change only the exact Test fixture to exercise the owner's final-state guard.
  await db.serviceWorkItem.update({ where: { id: ticket.id, organisationId: actor.organisationId }, data: { status: "CLOSED" } });
  await assert.rejects(db.$transaction(tx => registry.authoriseRecord({ session: actor, transaction: tx }, entity, { recordId: ticket.id, intent: "extend", expectedRevision: 1 })), /Reopen/);
  await db.moduleState.update({ where: { organisationId_moduleId: { organisationId: actor.organisationId, moduleId: "tickets" } }, data: { enabled: false } });
  await assert.rejects(registry.invoke(actor, get, { recordId: ticket.id }), /unavailable/);
  console.log("PASS Tickets owner contract: real private scope, other tenant and non-member denied; native write capability/revision/enablement enforced; canonical business fields unchanged");
}
