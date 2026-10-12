import { z } from "zod";
import type { Prisma } from "@/generated/prisma/client";
import { assertCapability } from "@/core/permissions/check";
import { serviceCaseScope } from "@/core/permissions/service-access";
import { query, declarative } from "@/core/studio/registry/contracts";
import type { Context, StudioModuleContract } from "@/core/studio/registry/types";
import { workScope } from "./access";
import { FINAL_WORK } from "./config";
import { slaState } from "./sla";
import { ticketPanelKinds, ticketPanelColumns, ticketPanelLabels, ticketPanelQuery, ticketPanelSurface, ticketPanelOutput, parseTicketPanel, type TicketPanelKind } from "./page-panel-contract";

const recordId = z.string().regex(/^[a-zA-Z0-9_-]{1,100}$/);
export const ticketPanelInputSchema = z.strictObject({ recordId, expectedRevision: z.number().int().positive(), expectedUpdatedAt: z.iso.datetime(), pageSize: z.number().int().min(1).max(50) });
const headSelect = { id: true, organisationId: true, kind: true, version: true, updatedAt: true, queueId: true,
  queue: { select: { organisationId: true, restricted: true } } } satisfies Prisma.ServiceWorkItemSelect;
function unavailable(): never { throw new Error("NOT_FOUND: the ticket panel is unavailable."); }
function changed(): never { throw new Error("CONFLICT: the ticket changed. Refresh this page."); }
/** Every query refreshes the actual owning authority in the same transaction,
 * scopes the canonical Ticket and checks the native anchor before panel columns.
 * Studio and configuration grants never replace native Read/receiving-team policy. */
export async function readTicketPanel(context: Context, kind: TicketPanelKind, supplied: unknown) {
  const input = ticketPanelInputSchema.parse(supplied), tx = context.transaction;
  if (!tx) throw new Error("Ticket panels require the owning transaction.");
  const { nativeFieldMutationSessionInTransaction } = await import("@/core/studio/fields/runtime-authority");
  const { session } = await nativeFieldMutationSessionInTransaction(context.session, tx);
  assertCapability(session, "tickets.ticket.read");
  if (kind === "approval") assertCapability(session, "tickets.ticket.manage");
  if (!await tx.moduleState.findFirst({ where: { organisationId: session.organisationId, moduleId: "tickets", enabled: true, entitled: true }, select: { id: true } }))
    throw new Error("DEPENDENCY_BROKEN: Tickets is unavailable.");
  const scoped = { AND: [workScope(session), { id: input.recordId, kind: "TICKET" as const, queue: { organisationId: session.organisationId } }] };
  const head = await tx.serviceWorkItem.findFirst({ where: scoped, select: headSelect });
  if (!head || head.id !== input.recordId || head.organisationId !== session.organisationId || head.queue.organisationId !== session.organisationId || head.kind !== "TICKET") unavailable();
  if (head.version !== input.expectedRevision || head.updatedAt.toISOString() !== input.expectedUpdatedAt) changed();
  const agent = !!await tx.serviceQueueMember.findFirst({ where: { organisationId: session.organisationId, queueId: head.queueId, userId: session.userId }, select: { id: true } });
  if (kind === "approval" && head.queue.restricted && !agent) throw new Error("FORBIDDEN: current receiving-team access is required.");
  const organisationId = session.organisationId, client = tx;
  async function names(userIds: readonly string[]) {
    const unique = [...new Set(userIds)];
    const members = unique.length ? await client.membership.findMany({ where: { organisationId, active: true, userId: { in: unique } },
      select: { organisationId: true, userId: true, user: { select: { name: true } } }, take: unique.length + 1 }) : [];
    if (members.some(member => member.organisationId !== organisationId || !unique.includes(member.userId)) || new Set(members.map(member => member.userId)).size !== members.length) unavailable();
    return new Map(members.map(member => [member.userId, member.user.name]));
  }
  const pinned = { AND: [scoped, { version: head.version, updatedAt: head.updatedAt }] };
  let rows: { id: string; values: Record<string, string | number | null> }[];
  if (kind === "activity") {
    const entries = await tx.serviceWorkEntry.findMany({ where: { organisationId, workId: head.id, ...(agent ? { visibility: { in: ["REQUESTER", "INTERNAL"] } } : { visibility: "REQUESTER" }) },
      select: { id: true, organisationId: true, workId: true, kind: true, visibility: true, body: true, actorUserId: true, createdAt: true }, orderBy: [{ createdAt: "desc" }, { id: "desc" }], take: input.pageSize });
    if (entries.length > input.pageSize || entries.some(entry => entry.organisationId !== organisationId || entry.workId !== head.id || (entry.visibility !== "REQUESTER" && (!agent || entry.visibility !== "INTERNAL")))) unavailable();
    const actors = await names(entries.map(entry => entry.actorUserId));
    rows = entries.map(entry => ({ id: entry.id, values: { kind: entry.kind, created_at: entry.createdAt.toISOString(), actor: actors.get(entry.actorUserId) ?? "Colleague", visibility: entry.visibility, body: entry.body } }));
  } else if (kind === "documents") {
    const files = await tx.serviceFile.findMany({ where: { organisationId, workId: head.id, ...(agent ? { visibility: { in: ["REQUESTER", "INTERNAL"] } } : { visibility: "REQUESTER" }) },
      select: { id: true, organisationId: true, workId: true, visibility: true, name: true, size: true, mime: true, createdAt: true }, orderBy: [{ createdAt: "desc" }, { id: "desc" }], take: input.pageSize });
    if (files.length > input.pageSize || files.some(file => file.organisationId !== organisationId || file.workId !== head.id || (file.visibility !== "REQUESTER" && (!agent || file.visibility !== "INTERNAL")))) unavailable();
    rows = files.map(file => ({ id: file.id, values: { name: file.name, size: file.size, mime: file.mime, created_at: file.createdAt.toISOString() } }));
  } else if (kind === "relationships" || kind === "outstanding_work") {
    const work = await tx.serviceWorkItem.findFirst({ where: pinned, select: { id: true, organisationId: true, parentId: true, parentCaseId: true, mergedIntoId: true } });
    if (!work || work.id !== head.id || work.organisationId !== organisationId) changed();
    const queryEnabled = session.capabilities.has("service.ticket.read") && !!await tx.moduleState.findFirst({ where: { organisationId, moduleId: "service", enabled: true, entitled: true }, select: { id: true } });
    const permittedKinds = queryEnabled ? ["TICKET", "QUERY"] : ["TICKET"];
    const links = await tx.serviceWorkItem.findMany({ where: { AND: [workScope(session), { queue: { organisationId }, kind: { in: permittedKinds }, ...(kind === "outstanding_work"
      ? { parentId: head.id, status: { notIn: FINAL_WORK } }
      : { OR: [{ parentId: head.id }, { mergedIntoId: head.id }, { id: { in: [work.parentId, work.mergedIntoId].filter((id): id is string => id !== null) } }] }) }] },
      select: { id: true, organisationId: true, kind: true, number: true, subject: true, status: true, parentId: true, mergedIntoId: true }, orderBy: { id: "asc" }, take: input.pageSize });
    if (links.length > input.pageSize || links.some(link => link.organisationId !== organisationId || !permittedKinds.includes(link.kind)
      || (kind === "outstanding_work" ? link.parentId !== head.id || FINAL_WORK.includes(link.status)
        : !(link.parentId === head.id || link.mergedIntoId === head.id || link.id === work.parentId || link.id === work.mergedIntoId)))) unavailable();
    rows = links.map(link => ({ id: link.id, values: { number: link.number, subject: link.subject, status: link.status, destination: link.kind === "TICKET" ? "ticket" : "query",
      relationship: link.id === work.parentId ? "Originating work" : link.id === work.mergedIntoId ? "Continuing record" : link.mergedIntoId === head.id ? "Merged history" : "Child work" } }));
    // Case identity/title is queried only through its independent actual module,
    // Read/restricted/private policy. No origin snapshot text or guessed link.
    if (kind === "relationships" && work.parentCaseId && rows.length < input.pageSize && session.capabilities.has("service.case.read")
      && await tx.moduleState.findFirst({ where: { organisationId, moduleId: "service", enabled: true, entitled: true }, select: { id: true } })) {
      const parent = await tx.serviceCase.findFirst({ where: { AND: [serviceCaseScope(session), { id: work.parentCaseId }] }, select: { id: true, organisationId: true, number: true, subject: true, status: true } });
      if (parent) { if (parent.organisationId !== organisationId || parent.id !== work.parentCaseId) unavailable();
        rows.push({ id: parent.id, values: { number: parent.number, subject: parent.subject, status: parent.status, destination: "case", relationship: "Originating customer case" } }); }
    }
  } else if (kind === "approval") {
    const work = await tx.serviceWorkItem.findFirst({ where: pinned, select: { id: true, organisationId: true, approvalId: true } });
    if (!work || work.id !== head.id || work.organisationId !== organisationId) changed();
    const approval = work.approvalId ? await tx.approvalInstance.findFirst({ where: { id: work.approvalId, organisationId, subjectType: "SERVICE_TICKET", subjectId: head.id }, select: { id: true, organisationId: true, subjectType: true, subjectId: true, status: true } }) : null;
    if (work.approvalId && (!approval || approval.id !== work.approvalId || approval.organisationId !== organisationId || approval.subjectType !== "SERVICE_TICKET" || approval.subjectId !== head.id)) unavailable();
    rows = [];
    if (approval) {
      const steps = await tx.approvalStep.findMany({ where: { organisationId, instanceId: approval.id }, select: { id: true, organisationId: true, instanceId: true, stage: true, approverUserId: true, status: true, reason: true, dueAt: true }, orderBy: [{ stage: "asc" }, { id: "asc" }], take: 50 });
      if (steps.length >= 50 || steps.some(step => step.organisationId !== organisationId || step.instanceId !== approval.id)) unavailable();
      const approvers = await names(steps.map(step => step.approverUserId));
      rows = [{ id: approval.id, values: { approval_status: approval.status, stage: null, approver: null, status: approval.status, reason: null, due_at: null } }, ...steps.map(step => ({ id: step.id,
        values: { approval_status: approval.status, stage: step.stage, approver: approvers.get(step.approverUserId) ?? "Approver", status: step.status, reason: step.reason, due_at: step.dueAt.toISOString() } }))];
    }
  } else {
    const work = await tx.serviceWorkItem.findFirst({ where: pinned, select: { id: true, organisationId: true, status: true, ownerUserId: true, reopenCount: true, firstResponseDueAt: true, firstResponseAt: true, resolutionDueAt: true, pausedAt: true, resolvedAt: true } });
    if (!work || work.id !== head.id || work.organisationId !== organisationId) changed();
    const owners = await names(work.ownerUserId ? [work.ownerUserId] : []);
    rows = [{ id: work.id, values: { status: work.status, owner: work.ownerUserId ? owners.get(work.ownerUserId) ?? "Colleague" : "Unassigned", reopen_count: work.reopenCount,
      first_response_state: slaState(work.firstResponseDueAt, null, work.firstResponseAt), first_response_due: work.firstResponseDueAt?.toISOString() ?? null,
      resolution_state: slaState(work.resolutionDueAt, work.pausedAt, work.resolvedAt), resolution_due: work.resolutionDueAt?.toISOString() ?? null } }];
  }
  const output = { rows, nextCursor: null }; parseTicketPanel(kind, output); return output;
}
export const ticketPanelContract: StudioModuleContract = { contributions: ticketPanelKinds.flatMap(kind => [
  declarative({ id: ticketPanelSurface(kind).id, version: 1, kind: "surface", label: ticketPanelLabels[kind], lifecycle: "active", classification: "confidential",
    capability: kind === "approval" ? "tickets.ticket.manage" : "tickets.ticket.read", schema: z.strictObject({ recordId }), references: ["tickets.ticket", ticketPanelQuery(kind).id] }),
  query({ ...ticketPanelQuery(kind), kind: "query", label: ticketPanelLabels[kind], lifecycle: "active", classification: "confidential",
    capability: kind === "approval" ? "tickets.ticket.manage" : "tickets.ticket.read", transaction: "required", pagination: kind === "status" ? "none" : "page", maxCardinality: kind === "status" ? 1 : 50, costClass: kind === "status" ? "low" : "medium",
    input: ticketPanelInputSchema, output: ticketPanelOutput(kind), async execute(context, input) { return readTicketPanel(context, kind, input); } }),
]) };
export const ticketPanelPolicies = ticketPanelKinds.map(kind => ({ query: ticketPanelQuery(kind), scope: "record" as const, purpose: "surface" as const, columns: ticketPanelColumns[kind] }));
export const ticketPanelSurfaces = ticketPanelKinds.map(kind => ({ surface: ticketPanelSurface(kind), family: (kind === "status" ? "process_stage" : kind === "activity" ? "activity" : kind === "outstanding_work" ? "tasks" : kind === "approval" ? "approvals" : kind) as "process_stage" | "activity" | "documents" | "relationships" | "tasks" | "approvals", queries: [ticketPanelQuery(kind)], formFactors: ["desktop", "tablet", "phone"] as ("desktop" | "tablet" | "phone")[] }));
