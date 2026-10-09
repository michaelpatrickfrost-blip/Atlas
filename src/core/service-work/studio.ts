import { z } from "zod";
import { db } from "@/core/db/client";
import type { Prisma } from "@/generated/prisma/client";
import { assertCapability } from "@/core/permissions/check";
import { entity, query } from "@/core/studio/registry/contracts";
import type { EntityDescriptor, RecordContext, RecordRequest, StudioModuleContract } from "@/core/studio/registry/types";
import { workScope } from "./access";
import { FINAL_WORK, WORK_STATUSES } from "./config";

const recordId = z.string().min(1).max(100).regex(/^[a-zA-Z0-9_-]+$/);
const listInput = z.strictObject({
  search: z.string().max(200).optional(), status: z.enum(WORK_STATUSES).optional(),
  cursor: z.strictObject({ updated_at: z.iso.datetime(), id: recordId }).optional(),
  limit: z.number().int().min(1).max(50).default(25),
});
const projection = z.strictObject({
  id: recordId, revision: z.number().int().positive(),
  fields: z.strictObject({ number: z.string(), subject: z.string(), status: z.string(), type: z.string(),
    priority: z.string(), created_at: z.iso.datetime(), updated_at: z.iso.datetime() }),
  href: z.string().regex(/^\/tickets\/[a-zA-Z0-9_-]+$/),
});
const select = { id: true, version: true, number: true, subject: true, status: true, type: true,
  priority: true, createdAt: true, updatedAt: true } satisfies Prisma.ServiceWorkItemSelect;
type Row = Prisma.ServiceWorkItemGetPayload<{ select: typeof select }>;
const project = (row: Row) => ({ id: row.id, revision: row.version, href: `/tickets/${row.id}`,
  fields: { number: row.number, subject: row.subject, status: row.status, type: row.type, priority: row.priority,
    created_at: row.createdAt.toISOString(), updated_at: row.updatedAt.toISOString() } });

/** Studio composition requires real tenant entitlement, including staff setup. */
async function requireSource(ctx: RecordContext) {
  assertCapability(ctx.session, "tickets.ticket.read");
  const client = ctx.transaction ?? db;
  if (ctx.transaction) {
    // Keep enablement stable until the same extension transaction completes.
    await ctx.transaction.$queryRaw`SELECT "id" FROM "module_states" WHERE "organisationId" = ${ctx.session.organisationId} AND "moduleId" = 'tickets' FOR SHARE`;
  }
  if (!await client.moduleState.findFirst({ where: { organisationId: ctx.session.organisationId, moduleId: "tickets", enabled: true, entitled: true }, select: { id: true } })) throw new Error("DEPENDENCY_BROKEN: Tickets is unavailable.");
  return client;
}

/** No native mutation: this locks and authorises the owning record for added data. */
export async function authoriseTicketRecord(ctx: RecordContext, request: RecordRequest) {
  const client = await requireSource(ctx);
  if (request.intent === "extend") {
    assertCapability(ctx.session, "tickets.ticket.manage");
    if (!ctx.transaction) throw new Error("Extension writes require an atomic transaction.");
    if (!Number.isSafeInteger(request.expectedRevision) || request.expectedRevision! < 1) throw new Error("Refresh the record before saving.");
  }
  const where = { AND: [workScope(ctx.session), { id: request.recordId, kind: "TICKET" }] } satisfies Prisma.ServiceWorkItemWhereInput;
  const policySelect = { id: true, organisationId: true, version: true, status: true, mergedIntoId: true, queueId: true,
    queue: { select: { restricted: true } } } satisfies Prisma.ServiceWorkItemSelect;
  let row = await client.serviceWorkItem.findFirst({ where, select: policySelect });
  if (!row) throw new Error("Ticket unavailable.");
  if (request.intent === "extend") {
    await ctx.transaction!.$queryRaw`SELECT "id" FROM "service_work_items" WHERE "id" = ${request.recordId} AND "organisationId" = ${ctx.session.organisationId} AND "kind" = 'TICKET' FOR UPDATE`;
    // A concurrent native transition or queue change must be checked after locking.
    row = await client.serviceWorkItem.findFirst({ where, select: policySelect });
    if (!row) throw new Error("Ticket unavailable.");
    if (row.version !== request.expectedRevision) throw new Error("This record changed. Refresh before saving.");
    if (row.mergedIntoId || FINAL_WORK.includes(row.status)) throw new Error("Reopen active ticket work before changing extension values.");
    if (row.queue.restricted && !await client.serviceQueueMember.findFirst({ where: { organisationId: ctx.session.organisationId, queueId: row.queueId, userId: ctx.session.userId }, select: { id: true } })) throw new Error("Only this restricted queue’s members can change ticket extensions.");
  }
  return { recordId: row.id, organisationId: row.organisationId, revision: row.version };
}

const identity = { version: 1, capability: "tickets.ticket.read", lifecycle: "active" as const, classification: "confidential" as const };
const ticketEntity: EntityDescriptor = { ...identity, id: "tickets.ticket", label: "Ticket", kind: "entity", key: "string",
  fields: [
    ["number", "Number", "string"], ["subject", "Subject", "string"], ["status", "Status", "enum"],
    ["type", "Request type", "enum"], ["priority", "Priority", "enum"],
    ["created_at", "Created", "datetime"], ["updated_at", "Updated", "datetime"],
  ].map(([id, label, type]) => ({ id, label, type: type as "string" | "enum" | "datetime", nullable: false, classification: "confidential" as const,
    filterable: ["number", "subject", "status"].includes(id), sortable: id === "updated_at", decision: false, template: false })),
  extensionPolicy: { customFields: true, recordTypes: true, pageVariants: true },
  record: { writeCapability: "tickets.ticket.manage", detailRoute: "/tickets/{recordId}", labelField: "number",
    listQuery: { id: "tickets.ticket.list", version: 1 }, getQuery: { id: "tickets.ticket.get", version: 1 }, authorise: authoriseTicketRecord } };
/** Canonical ServiceWorkItem/TICKET only. Existing intake answers stay native. */
export const ticketStudioContract: StudioModuleContract = { contributions: [
  query({ ...identity, id: "tickets.ticket.list", label: "Tickets", kind: "query", input: listInput,
    output: z.strictObject({ records: z.array(projection).max(50), next: listInput.shape.cursor.nullable() }),
    pagination: "cursor", maxCardinality: 50, costClass: "medium",
    async execute(ctx, input) {
      const client = await requireSource(ctx);
      const cursor = input.cursor;
      const rows = await client.serviceWorkItem.findMany({ where: { AND: [workScope(ctx.session), { kind: "TICKET",
        ...(input.status ? { status: input.status } : {}),
        ...(input.search ? { OR: [{ number: { contains: input.search, mode: "insensitive" } }, { subject: { contains: input.search, mode: "insensitive" } }] } : {}) },
        ...(cursor ? [{ OR: [{ updatedAt: { lt: new Date(cursor.updated_at) } }, { updatedAt: new Date(cursor.updated_at), id: { lt: cursor.id } }] }] : [])] },
        select, orderBy: [{ updatedAt: "desc" }, { id: "desc" }], take: input.limit + 1 });
      const records = rows.slice(0, input.limit).map(project), last = records.at(-1);
      return { records, next: rows.length > input.limit && last ? { updated_at: last.fields.updated_at, id: last.id } : null };
    } }),
  query({ ...identity, id: "tickets.ticket.get", label: "Ticket", kind: "query", input: z.strictObject({ recordId }), output: projection,
    pagination: "none", maxCardinality: 1, costClass: "low",
    async execute(ctx, input) {
      const client = await requireSource(ctx);
      const row = await client.serviceWorkItem.findFirst({ where: { AND: [workScope(ctx.session), { id: input.recordId, kind: "TICKET" }] }, select });
      if (!row) throw new Error("Ticket unavailable.");
      return project(row);
    } }),
  // Version 1 hashes remain unchanged for already saved metadata references.
  entity(ticketEntity),
  entity({ ...ticketEntity, version: 2, record: { ...ticketEntity.record!, fieldPolicy: {
    types: ["string", "integer", "decimal", "money", "boolean", "date", "datetime", "duration", "email", "url", "phone", "enum", "multi_enum", "reference", "address"],
    maxFields: 100, referenceEntities: ["tickets.ticket"],
    reservedKeys: ["id", "organisation_id", "number", "kind", "subject", "description", "type", "category", "priority", "severity", "impact", "urgency", "status", "queue_id", "requester_user_id", "requested_for_user_id", "owner_user_id", "watcher_ids", "parent_case_id", "parent_id", "merged_into_id", "context", "definition", "sla", "first_response_due_at", "resolution_due_at", "first_response_at", "paused_at", "resolved_at", "resolution", "reopen_count", "version", "revision", "approval_id", "created_at", "updated_at", "entries", "files"],
  } } }),
] };
