import type { Prisma, ServiceWorkItem } from "@/generated/prisma/client";
import { sessionAuthorityStamp, type SessionAuthorityStamp } from "@/core/auth/session";
import { assertCapability } from "@/core/permissions/check";
import type { RecordAnchor, RecordContext } from "@/core/studio/registry/types";
import type { FieldRuntimeAuthority } from "@/core/studio/fields/runtime-authority";

type Creation = { transaction: Prisma.TransactionClient; stamp: SessionAuthorityStamp; anchor: RecordAnchor };
const creations = new WeakMap<object, Creation>();

/** Trusted owning create path only. Existing domain validation builds `data`
 * before entering this bridge. It owns the actual native INSERT, not a caller's
 * claim that an existing record is new. No server action or client endpoint. */
export async function createTicketWithFieldInitialisation<T>(context: RecordContext, data: Prisma.ServiceWorkItemUncheckedCreateInput,
  initialise: (authority: FieldRuntimeAuthority, work: ServiceWorkItem, proof: object) => Promise<T>): Promise<{ work: ServiceWorkItem; result: T }> {
  if (!context.transaction) throw new Error("New-ticket initialisation requires the owning transaction.");
  // Lazy import avoids a registry/owning-contract/module-catalogue wiring cycle.
  const { fieldRuntimeAuthorityInTransaction } = await import("@/core/studio/fields/runtime-authority");
  const authority = await fieldRuntimeAuthorityInTransaction(context.session, context.transaction);
  assertCapability(authority.session, "tickets.ticket.create");
  if (data.organisationId !== authority.session.organisationId || data.kind !== "TICKET" || data.requesterUserId !== authority.session.userId
    || (data.version !== undefined && data.version !== 1) || (data.status !== undefined && data.status !== "NEW") || data.mergedIntoId)
    throw new Error("Invalid new-ticket creation scope.");
  if (!await context.transaction.moduleState.findFirst({ where: { organisationId: authority.session.organisationId, moduleId: "tickets", enabled: true, entitled: true }, select: { id: true } }))
    throw new Error("DEPENDENCY_BROKEN: Tickets is unavailable.");
  const work = await context.transaction.serviceWorkItem.create({ data });
  if (work.organisationId !== authority.session.organisationId || work.kind !== "TICKET" || work.requesterUserId !== authority.session.userId || work.version !== 1 || work.status !== "NEW" || work.mergedIntoId)
    throw new Error("Invalid created ticket scope.");
  const proof = Object.freeze({});
  creations.set(proof, { transaction: context.transaction, stamp: authority.stamp, anchor: { recordId: work.id, organisationId: work.organisationId, revision: work.version } });
  try { return { work, result: await initialise(authority, work, proof) }; }
  finally { creations.delete(proof); }
}

/** Proof exists only during the owning INSERT callback, bound to this exact
 * transaction and authenticated principal. Copies/JSON/stale/sibling contexts
 * cannot initialise an existing record or borrow broad read/manage permission. */
export async function authoriseNewTicketFields(context: RecordContext, proof: object): Promise<RecordAnchor> {
  const creation = creations.get(proof), stamp = sessionAuthorityStamp(context.session);
  if (!creation || !stamp || creation.transaction !== context.transaction || stamp.userId !== creation.stamp.userId
    || stamp.organisationId !== creation.stamp.organisationId || stamp.membershipId !== creation.stamp.membershipId
    || stamp.authVersion !== creation.stamp.authVersion || stamp.sessionVersion !== creation.stamp.sessionVersion
    || context.session.userId !== stamp.userId || context.session.organisationId !== stamp.organisationId || context.session.membershipId !== stamp.membershipId)
    throw new Error("FORBIDDEN: current owning ticket creation proof is required.");
  assertCapability(context.session, "tickets.ticket.create");
  return { ...creation.anchor };
}
