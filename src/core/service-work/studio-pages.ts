import { z } from "zod";
import type { Prisma } from "@/generated/prisma/client";
import { assertCapability } from "@/core/permissions/check";
import { query, declarative } from "@/core/studio/registry/contracts";
import { pageSource } from "@/core/studio/registry/page-contracts";
import type { Context, RecordContext, StudioModuleContract } from "@/core/studio/registry/types";
import { pageProjectionSchema, pageReadRequestSchema, pageReadAnchorSchema, pageQueryRequestSchema, type PageReadAnchor, type PageSourcePolicy } from "@/core/studio/pages/owner-contract";
import { workScope } from "./access";

const identity = { version: 1, capability: "tickets.ticket.read", lifecycle: "active" as const, classification: "confidential" as const };
const headerRef = { id: "tickets.ticket.page.header", version: 1 }, listRef = { id: "tickets.ticket.page.list", version: 1 };
const fields = [{ id: "number", label: "Ticket number" }, { id: "subject", label: "Subject" }, { id: "status", label: "Status" },
  { id: "type", label: "Request type" }, { id: "priority", label: "Priority" }, { id: "created_at", label: "Created" }, { id: "updated_at", label: "Last updated" }];
const columns = fields.map(field => ({ ...field, valueType: "string" as const, nullable: false, classification: "confidential" as const }));
const headerOutput = pageProjectionSchema(columns, 1), listOutput = pageProjectionSchema(columns, 50);
const recordId = z.string().min(1).max(100).regex(/^[a-zA-Z0-9_-]+$/), timestamp = z.iso.datetime();
const cursor = z.strictObject({ id: recordId, updatedAt: timestamp });
const headerInput = z.strictObject({ recordId, expectedRevision: z.number().int().positive(), expectedUpdatedAt: timestamp });
const listInput = z.strictObject({ pageSize: z.number().int().min(1).max(50), cursor: cursor.nullable() });
const scopeSelect = { id: true, organisationId: true, version: true, updatedAt: true } satisfies Prisma.ServiceWorkItemSelect;
const projectionSelect = { ...scopeSelect, number: true, subject: true, status: true, type: true, priority: true, createdAt: true } satisfies Prisma.ServiceWorkItemSelect;
type Scope = Prisma.ServiceWorkItemGetPayload<{ select: typeof scopeSelect }>;
type Row = Prisma.ServiceWorkItemGetPayload<{ select: typeof projectionSelect }>;
const revisionOf = (row: Scope) => `${row.version}@${row.updatedAt.toISOString()}`;
const projection = (row: Row) => ({ id: row.id, values: { number: row.number, subject: row.subject, status: row.status, type: row.type,
  priority: row.priority, created_at: row.createdAt.toISOString(), updated_at: row.updatedAt.toISOString() } });
/** Page-only ordinary Read. Refresh genuine current session inside the owner's
 * shared Serializable transaction, preserve canonical private workScope and
 * actual tenant/module checks before any protected projection. No Write/Manage,
 * Studio authoring or creation authority is inferred. */
async function owner(context: RecordContext | Context) {
  if (!context.transaction) throw new Error("Ticket page reads require the owning transaction.");
  const { nativeFieldMutationSessionInTransaction } = await import("@/core/studio/fields/runtime-authority");
  const { session } = await nativeFieldMutationSessionInTransaction(context.session, context.transaction);
  assertCapability(session, identity.capability);
  const enabled = await context.transaction.moduleState.findFirst({ where: { organisationId: session.organisationId,
    moduleId: "tickets", enabled: true, entitled: true }, select: { id: true } });
  if (!enabled) throw new Error("DEPENDENCY_BROKEN: Tickets is unavailable for this page.");
  const scope = { AND: [workScope(session), { kind: "TICKET" as const, queue: { organisationId: session.organisationId } }] } satisfies Prisma.ServiceWorkItemWhereInput;
  return { session, client: context.transaction, scope };
}
async function checkedAnchor(context: RecordContext, supplied: PageReadAnchor) {
  const current = await owner(context), anchor = pageReadAnchorSchema.parse(supplied);
  if (anchor.organisationId !== current.session.organisationId) throw new Error("FORBIDDEN: ticket page scope changed.");
  if (anchor.kind === "list") return { ...current, anchor, record: null };
  const record = await current.client.serviceWorkItem.findFirst({ where: { AND: [current.scope, { id: anchor.recordId }] }, select: scopeSelect });
  if (!record || record.organisationId !== current.session.organisationId) throw new Error("NOT_FOUND: ticket is unavailable.");
  if (anchor.nativeRevision !== record.version || anchor.revision !== revisionOf(record)) throw new Error("CONFLICT: the ticket changed. Refresh this page.");
  return { ...current, anchor, record };
}
export const ticketPagePolicy: PageSourcePolicy = {
  schemaVersion: 1, entity: { id: "tickets.ticket", version: 9 }, accessMode: "ordinary_read", variants: true,
  // Version1 deliberately lacks a typed field policy. Each listed2–9 descriptor
  // retains the same approved canonical field policy; registration checks every
  // exact retained version independently, without a numeric-range assumption.
  fieldSourceVersions: [2, 3, 4, 5, 6, 7, 8, 9],
  nativeFields: fields.map(field => ({ id: field.id, query: headerRef, columnId: field.id })),
  queries: [{ query: headerRef, scope: "record", purpose: "fact", columns }, { query: listRef, scope: "list", purpose: "list", columns }],
  facts: ["status", "priority"].map(id => ({ id, contract: { id: "tickets.ticket", version: 9 }, query: headerRef, columnId: id,
    valueType: "string" as const, nullable: false, classification: "confidential" as const, provenance: "owner_native" as const })),
  commands: [], metrics: [], surfaces: [{ surface: { id: "tickets.ticket.progress_form", version: 1 }, family: "module", queries: [],
    formFactors: ["desktop", "tablet", "phone"] }], maxQueryCost: 12,
};
export const ticketPageContract: StudioModuleContract = { contributions: [
  declarative({ ...identity, id: "tickets.ticket.progress_form", label: "Edit ticket", kind: "surface", capability: "tickets.ticket.manage",
    schema: z.strictObject({ recordId }), references: ["tickets.ticket"] }),
  query({ ...identity, ...headerRef, kind: "query", label: "Ticket screen details", transaction: "required", pagination: "none", maxCardinality: 1,
    costClass: "low", input: headerInput, output: headerOutput, async execute(context, input) {
      const { session, client, scope } = await owner(context);
      const record = await client.serviceWorkItem.findFirst({ where: { AND: [scope, { id: input.recordId,
        version: input.expectedRevision, updatedAt: new Date(input.expectedUpdatedAt) }] }, select: projectionSelect });
      if (!record || record.organisationId !== session.organisationId) throw new Error("NOT_FOUND: ticket is unavailable or has changed.");
      return { rows: [projection(record)], nextCursor: null };
    } }),
  query({ ...identity, ...listRef, kind: "query", label: "Ticket screen list", transaction: "required", pagination: "cursor", maxCardinality: 50,
    costClass: "medium", input: listInput, output: listOutput, async execute(context, input) {
      const { session, client, scope } = await owner(context);
      let continuation: Prisma.ServiceWorkItemWhereInput = {};
      if (input.cursor) {
        const anchor = await client.serviceWorkItem.findFirst({ where: { AND: [scope, { id: input.cursor.id, updatedAt: new Date(input.cursor.updatedAt) }] }, select: scopeSelect });
        if (!anchor || anchor.organisationId !== session.organisationId) throw new Error("CONFLICT: ticket list cursor changed. Refresh this list.");
        continuation = { OR: [{ updatedAt: { lt: anchor.updatedAt } }, { updatedAt: anchor.updatedAt, id: { lt: anchor.id } }] };
      }
      const records = await client.serviceWorkItem.findMany({ where: { AND: [scope, continuation] }, select: projectionSelect,
        orderBy: [{ updatedAt: "desc" }, { id: "desc" }], take: input.pageSize + 1 });
      if (records.some(record => record.organisationId !== session.organisationId)) throw new Error("FORBIDDEN: ticket list scope changed.");
      const rows = records.slice(0, input.pageSize), last = rows.at(-1);
      return { rows: rows.map(projection), nextCursor: records.length > input.pageSize && last ? { id: last.id, updatedAt: last.updatedAt.toISOString() } : null };
    } }),
  pageSource({ ...identity, id: "tickets.ticket.page", label: "Ticket screen", policy: ticketPagePolicy, callbacks: {
    async authoriseRead(context, supplied) {
      const request = pageReadRequestSchema.parse(supplied), { session, client, scope } = await owner(context);
      if (request.kind === "list") return { kind: "list", organisationId: session.organisationId };
      const record = await client.serviceWorkItem.findFirst({ where: { AND: [scope, { id: request.recordId }] }, select: scopeSelect });
      if (!record || record.organisationId !== session.organisationId) throw new Error("NOT_FOUND: ticket is unavailable.");
      return { kind: "record", organisationId: session.organisationId, recordId: record.id, revision: revisionOf(record), nativeRevision: record.version };
    },
    async bindQueryInput(context, supplied, input) {
      const request = pageQueryRequestSchema.parse(input), { anchor, record } = await checkedAnchor(context, supplied);
      if (request.query.version !== 1) throw new Error("DEPENDENCY_BROKEN: ticket page query is unavailable.");
      if (request.query.id === listRef.id) {
        if (anchor.kind !== "list") throw new Error("FORBIDDEN: ticket list requires its owning list scope.");
        return listInput.parse({ pageSize: request.pageSize, cursor: request.cursor });
      }
      if (request.query.id !== headerRef.id || anchor.kind !== "record" || !record || request.cursor !== null)
        throw new Error("FORBIDDEN: ticket details require their owning record scope.");
      return headerInput.parse({ recordId: record.id, expectedRevision: record.version, expectedUpdatedAt: record.updatedAt.toISOString() });
    },
    async projectQueryOutput(context, supplied, input, output) {
      const request = pageQueryRequestSchema.parse(input), { anchor } = await checkedAnchor(context, supplied);
      if (request.query.version !== 1) throw new Error("DEPENDENCY_BROKEN: ticket page query is unavailable.");
      if (request.query.id === headerRef.id) {
        const projected = headerOutput.parse(output);
        if (anchor.kind !== "record" || projected.rows.length !== 1 || projected.rows[0].id !== anchor.recordId) throw new Error("FORBIDDEN: ticket projection changed.");
        return projected;
      }
      if (request.query.id !== listRef.id || anchor.kind !== "list") throw new Error("FORBIDDEN: ticket list projection requires owning scope.");
      return listOutput.parse(output);
    },
  } }),
] };
