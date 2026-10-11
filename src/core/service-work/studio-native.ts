import { z } from "zod";
import type { Prisma, ServiceWorkItem } from "@/generated/prisma/client";
import { sessionAuthorityStamp, type Session, type SessionAuthorityStamp } from "@/core/auth/session";
import { assertCapability } from "@/core/permissions/check";
import type { RecordAnchor, RecordContext } from "@/core/studio/registry/types";
import type { FieldRuntimeAuthority } from "@/core/studio/fields/runtime-authority";
import { lockFieldEntitiesInTransaction } from "@/core/studio/fields/entity-lock";

export const ticketFieldOperations = ["tickets.ticket.create", "tickets.ticket.manage", "tickets.ticket.reply", "tickets.ticket.watch",
  "service.ticket.create", "service.ticket.update", "service.case.assign"] as const;
export type TicketFieldOperation = typeof ticketFieldOperations[number];
const operationSchema = z.enum(ticketFieldOperations);
const requestSchema = z.strictObject({ recordId: z.string().min(1).max(100).regex(/^[a-zA-Z0-9_-]+$/), expectedRevision: z.number().int().positive() });
type Scope = { transaction: Prisma.TransactionClient; stamp: SessionAuthorityStamp; operation: TicketFieldOperation;
  configured: boolean; phase: "writing" | "validating"; anchors: Map<string, RecordAnchor> };
const scopes = new WeakMap<Prisma.TransactionClient, Scope>();
const proofs = new WeakMap<object, Scope>();
function denied(): never { throw new Error("FORBIDDEN: current owning mutation proof is required."); }
function samePrincipal(session: Session, stamp: SessionAuthorityStamp) {
  const actual = sessionAuthorityStamp(session);
  if (!actual || session.userId !== stamp.userId || session.organisationId !== stamp.organisationId || session.membershipId !== stamp.membershipId
    || actual.userId !== stamp.userId || actual.organisationId !== stamp.organisationId || actual.membershipId !== stamp.membershipId
    || actual.authVersion !== stamp.authVersion || actual.sessionVersion !== stamp.sessionVersion) denied();
}
function writingScope(transaction: Prisma.TransactionClient, session: Session) {
  const scope = scopes.get(transaction);
  if (scope) { samePrincipal(session, scope.stamp); if (scope.phase !== "writing") denied(); }
  return scope;
}

/** Owning operation only. The callback retains its actual domain/private guards;
 * receipts are collected by the SQL helpers below, never supplied record IDs.
 * Validation receives a token only after the whole domain callback succeeds.
 * Any failure propagates to the caller's existing Serializable transaction. */
export async function withTicketFieldMutation<T>(context: RecordContext, operationInput: TicketFieldOperation,
  callback: (currentSession: Session) => Promise<T>,
  validate: (authority: FieldRuntimeAuthority, records: readonly RecordAnchor[], operation: TicketFieldOperation, proof: object) => Promise<void>): Promise<T> {
  const tx = context.transaction, operation = operationSchema.parse(operationInput);
  if (!tx) throw new Error("Native field validation requires the owning transaction.");
  if (scopes.has(tx)) throw new Error("Nested native field mutation scopes are unavailable.");
  // Lazy loading avoids the registered owner/Studio catalogue wiring cycle.
  const { nativeFieldMutationSessionInTransaction, fieldRuntimeAuthorityInTransaction } = await import("@/core/studio/fields/runtime-authority");
  const { session, stamp } = await nativeFieldMutationSessionInTransaction(context.session, tx);
  assertCapability(session, operation);
  const moduleId = operation.startsWith("tickets.") ? "tickets" : "service";
  if (!session.capabilities.has("atlas.staff.manage") && !await tx.moduleState.findFirst({ where: { organisationId: session.organisationId,
    moduleId, enabled: true, entitled: true }, select: { id: true } })) throw new Error("DEPENDENCY_BROKEN: the owning service application is unavailable.");
  await lockFieldEntitiesInTransaction(tx, session.organisationId, ["tickets.ticket"]);
  // Metadata only. No configuration preserves the existing native/internal staff
  // path without imposing customer-only field authority or reading field values.
  const field = await tx.studioDefinition.findFirst({ where: { organisationId: session.organisationId, kind: "customField", retiredAt: null,
    activeVersionId: { not: null }, fieldBinding: { entityId: "tickets.ticket" } }, select: { id: true } });
  const window = !field && await tx.studioFieldMigrationPublication.findFirst({ where: { organisationId: session.organisationId,
    state: { in: ["PUBLISHED", "CUTOVER"] }, OR: [{ sourceGeneration: { entityId: "tickets.ticket" } }, { targetGeneration: { entityId: "tickets.ticket" } }] }, select: { preparationId: true } });
  const scope: Scope = { transaction: tx, stamp, operation, configured: Boolean(field || window), phase: "writing", anchors: new Map() };
  scopes.set(tx, scope);
  let proof: object | undefined;
  try {
    const result = await callback(session);
    if (!scope.anchors.size) return result; // includes genuine QUERY-only effects
    scope.phase = "validating";
    const authority = await fieldRuntimeAuthorityInTransaction(session, tx);
    samePrincipal(authority.session, stamp);
    assertCapability(authority.session, operation);
    proof = Object.freeze({}); proofs.set(proof, scope);
    const records = [...scope.anchors.values()].sort((a, b) => a.recordId.localeCompare(b.recordId)).map(anchor => Object.freeze({ ...anchor }));
    await validate(authority, Object.freeze(records), operation, proof);
    return result;
  } finally {
    if (proof) proofs.delete(proof);
    scopes.delete(tx);
  }
}

/** Metadata-only query preflight. Token scope is actual owning SQL effects, not
 * today's post-unwatch visibility or a creation proof. It grants no writes,
 * ordinary UI reads, field permissions or reference-target access. */
export async function authoriseTicketNativeValidation(context: RecordContext, input: unknown, operationInput: TicketFieldOperation, proof: object): Promise<RecordAnchor> {
  const scope = proofs.get(proof), operation = operationSchema.parse(operationInput), request = requestSchema.parse(input);
  if (!scope || scope.phase !== "validating" || scope.transaction !== context.transaction || scopes.get(scope.transaction) !== scope || scope.operation !== operation) denied();
  samePrincipal(context.session, scope.stamp); assertCapability(context.session, operation);
  const anchor = scope.anchors.get(request.recordId);
  if (!anchor || anchor.organisationId !== context.session.organisationId || anchor.revision !== request.expectedRevision) denied();
  return { ...anchor };
}

async function captureActualWork(tx: Prisma.TransactionClient, session: Session, id: string, expectedRevision?: number) {
  const scope = writingScope(tx, session);
  if (!scope?.configured) return;
  const row = await tx.serviceWorkItem.findFirst({ where: { id, organisationId: session.organisationId }, select: { id: true, organisationId: true, kind: true, version: true } });
  if (!row || row.id !== id || row.organisationId !== session.organisationId || !Number.isSafeInteger(row.version) || row.version < 1
    || (expectedRevision !== undefined && row.version !== expectedRevision)) throw new Error("CONFLICT: the owning work record changed. Refresh before saving.");
  if (row.kind === "TICKET") scope.anchors.set(row.id, { recordId: row.id, organisationId: row.organisationId, revision: row.version });
}

/** Own the actual INSERT; caller constructs data through existing domain rules.
 * The ordinary creation proof still performs its separate NEW/requester checks. */
export async function insertWorkWithFieldReceipt(tx: Prisma.TransactionClient, session: Session, data: Prisma.ServiceWorkItemUncheckedCreateInput): Promise<ServiceWorkItem> {
  writingScope(tx, session);
  if (data.organisationId !== session.organisationId) denied();
  const work = await tx.serviceWorkItem.create({ data });
  if (work.organisationId !== session.organisationId || work.kind !== data.kind || work.version !== (data.version ?? 1))
    throw new Error("CONFLICT: the created work scope is unavailable.");
  const scope = scopes.get(tx);
  if (scope?.configured && work.kind === "TICKET") scope.anchors.set(work.id, { recordId: work.id, organisationId: work.organisationId, revision: work.version });
  return work;
}

/** Existing owning CAS with a receipt of its actual resulting row. */
export async function updateWorkWithFieldReceipt(tx: Prisma.TransactionClient, session: Session, id: string, version: number, data: Prisma.ServiceWorkItemUncheckedUpdateManyInput) {
  writingScope(tx, session);
  if (!Number.isSafeInteger(version) || version < 1) throw new Error("Refresh the record before saving.");
  const changed = await tx.serviceWorkItem.updateMany({ where: { id, organisationId: session.organisationId, version }, data: { ...data, version: { increment: 1 } } });
  if (changed.count !== 1) throw new Error("This record changed. Refresh before saving.");
  await captureActualWork(tx, session, id, version + 1);
}

/** Own the existing linked-parent UPDATE. Configured receipts additionally pair
 * the parent's identity with the actual source relation in this transaction. */
export async function incrementWorkParentWithFieldReceipt(tx: Prisma.TransactionClient, session: Session, work: ServiceWorkItem) {
  const scope = writingScope(tx, session);
  if (!work.parentId) return;
  if (scope?.configured) {
    const source = await tx.serviceWorkItem.findFirst({ where: { id: work.id, organisationId: session.organisationId }, select: { id: true, parentId: true } });
    if (!source || source.id !== work.id || source.parentId !== work.parentId) throw new Error("CONFLICT: the linked work changed. Refresh before saving.");
  }
  const changed = await tx.serviceWorkItem.updateMany({ where: { id: work.parentId, organisationId: session.organisationId }, data: { version: { increment: 1 } } });
  if (scope?.configured) {
    if (changed.count !== 1) throw new Error("CONFLICT: the linked work changed. Refresh before saving.");
    await captureActualWork(tx, session, work.parentId);
  }
}

/** Service owns source/target case eligibility and private access. This helper
 * owns the exact existing child reparent operation; configured capture walks all
 * actual original children in bounded pages in the SAME atomic transaction. */
export async function reparentCaseWorkWithFieldReceipts(tx: Prisma.TransactionClient, session: Session, sourceCaseId: string, targetCaseId: string) {
  const scope = writingScope(tx, session);
  const where = { organisationId: session.organisationId, parentCaseId: sourceCaseId, status: { notIn: ["RESOLVED", "CLOSED", "CANCELLED"] } };
  const data = { parentCaseId: targetCaseId, version: { increment: 1 } };
  if (!scope?.configured) { await tx.serviceWorkItem.updateMany({ where, data }); return; }
  if (scope.operation !== "service.case.assign" || sourceCaseId === targetCaseId) denied();
  let cursor: string | undefined;
  for (;;) {
    const rows = await tx.serviceWorkItem.findMany({ where: { ...where, ...(cursor ? { id: { gt: cursor } } : {}) },
      orderBy: { id: "asc" }, take: 50, select: { id: true, organisationId: true, kind: true, version: true } });
    if (!rows.length) return;
    if (rows.length > 50 || rows.some((row, index) => row.organisationId !== session.organisationId || !Number.isSafeInteger(row.version) || row.version < 1
      || (cursor !== undefined && row.id <= cursor) || (index > 0 && row.id <= rows[index - 1].id))) denied();
    const changed = await tx.serviceWorkItem.updateMany({ where: { ...where, id: { in: rows.map(row => row.id) } }, data });
    if (changed.count !== rows.length) throw new Error("CONFLICT: the linked work changed. Refresh before merging.");
    for (const row of rows) await captureActualWork(tx, session, row.id, row.version + 1);
    cursor = rows[rows.length - 1].id;
  }
}
