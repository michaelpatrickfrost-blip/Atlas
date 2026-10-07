"use server";
import { z } from "zod";
import { db } from "@/core/db/client";
import { requireSession } from "@/core/auth/session";
import { assertCapability } from "@/core/permissions/check";
import { serviceCaseScope } from "@/core/permissions/service-access";
import { createApproval, decideApproval } from "@/core/approvals/service";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { workScope, requireWork } from "./access";
import { workNumber, workEvent, lockWork } from "./engine";
import { queueConfig, queueConfigSchema, validateAnswers, WORK_STATUSES, FINAL_WORK, suggestedPriority } from "./config";
import { addBusinessMinutes, businessMinutesBetween, slaSchema } from "./sla";

const text = (form: FormData, key: string, max = 4000) => z.string().max(max).parse(String(form.get(key) ?? "").trim());
const need = (form: FormData, key: string, max = 4000) => z.string().min(1, `${key} is required.`).max(max).parse(text(form, key, max));
const ref = (form: FormData) => Number(form.get("version"));
const refresh = () => { revalidatePath("/tickets", "layout"); revalidatePath("/service", "layout"); };

export async function createWork(form: FormData) {
  const session = await requireSession();
  assertCapability(session, text(form, "kind") === "QUERY" ? "service.ticket.create" : "tickets.ticket.create");
  const kind = z.enum(["TICKET", "QUERY"]).parse(text(form, "kind"));
  await requireWork(session, kind, true);
  const id = await db.$transaction(async tx => {
    const queue = await tx.serviceQueue.findFirst({ where: { id: need(form, "queueId", 100), organisationId: session.organisationId, active: true } });
    if (!queue) throw new Error("Choose an available queue.");
    const configuration = queueConfig(queue.configuration);
    const serviceId = text(form, "serviceId", 60);
    const service = configuration.services.find(value => value.id === serviceId);
    if (serviceId && !service) throw new Error("This request type changed. Refresh and choose again.");
    const answers = validateAnswers(service?.fields ?? [], JSON.parse(text(form, "answers", 100000) || "{}"));
    const parentCaseId = text(form, "parentCaseId", 100) || null;
    const parentId = text(form, "parentId", 100) || null;
    if (parentCaseId && parentId) throw new Error("Choose one originating case or work item.");
    const originCase = parentCaseId ? await tx.serviceCase.findFirst({ where: { AND: [serviceCaseScope(session), { id: parentCaseId, status: { notIn: ["RESOLVED", "CLOSED", "CANCELLED"] } }] } }) : null;
    const originWork = parentId ? await tx.serviceWorkItem.findFirst({ where: { AND: [workScope(session), { id: parentId, status: { notIn: FINAL_WORK }, mergedIntoId: null }] } }) : null;
    if (parentCaseId && !originCase) throw new Error("Reopen an accessible case before adding work.");
    if (parentId && !originWork) throw new Error("Reopen an accessible parent before adding work.");
    if (kind === "QUERY" && !parentCaseId && !parentId) throw new Error("Create the query from its case or ticket so its context stays linked.");
    // Share only purchase identifiers and affected quantity with the receiving team.
    // Customer messages, investigation notes and contact details stay on the case.
    const sourceContext = (originCase?.context ?? {}) as Record<string, unknown>;
    const origin = originCase ? { caseNumber: originCase.number, ...Object.fromEntries(["salesOrderId", "salesOrderLineId", "productId", "shipmentId", "affectedQuantity", "batchLot"].filter(key => sourceContext[key] != null).map(key => [key, sourceContext[key]])) } : ((originWork?.context as Record<string, unknown> | undefined)?.origin ?? {});
    const requestedForUserId = text(form, "requestedForUserId", 100) || null;
    if (requestedForUserId && !await tx.membership.findFirst({ where: { organisationId: session.organisationId, userId: requestedForUserId, active: true } })) throw new Error("Choose an active colleague.");
    const priority = z.enum(["LOW", "NORMAL", "HIGH", "URGENT"]).parse(text(form, "priority") || "NORMAL");
    const impact=text(form,"impact")||"INDIVIDUAL",urgency=text(form,"urgency")||"NORMAL";
    if(priority!==suggestedPriority(impact,urgency)){assertCapability(session,kind==="TICKET"?"tickets.ticket.manage":"service.ticket.update");if(!text(form,"priorityReason"))throw new Error("Record the reason for overriding the suggested priority.");}
    const now = new Date(), sla = configuration.sla;
    const work = await tx.serviceWorkItem.create({ data: {
      organisationId: session.organisationId, kind, number: await workNumber(tx, session.organisationId, kind === "QUERY" ? "QRY" : "TKT"), queueId: queue.id,
      subject: need(form, "subject", 250), description: need(form, "description", 20000), requesterUserId: session.userId, requestedForUserId,
      parentCaseId, parentId, type: service?.type ?? (text(form, "type", 60) || "SERVICE_REQUEST"), priority,
      impact: z.enum(["INDIVIDUAL", "TEAM", "DEPARTMENT", "BUSINESS"]).parse(text(form, "impact") || "INDIVIDUAL"),
      urgency: z.enum(["LOW", "NORMAL", "HIGH", "IMMEDIATE"]).parse(text(form, "urgency") || "NORMAL"),
      context: { answers, serviceId, origin: origin as import("@/generated/prisma/client").Prisma.InputJsonValue, priorityReason: text(form, "priorityReason"), ...Object.fromEntries(["asset", "service", "workaround", "problem", "rootCause", "risk", "implementationPlan", "rollbackPlan", "testingPlan", "schedule"].map(key => [key, text(form, key)])) },
      definition: service ?? {}, sla, firstResponseDueAt: addBusinessMinutes(now, sla.responseMinutes, sla.calendar), resolutionDueAt: addBusinessMinutes(now, sla.resolutionMinutes, sla.calendar),
    } });
    await workEvent(tx, session, work, "CREATED", `${kind === "QUERY" ? "Cross-team query" : "Internal ticket"} received by ${queue.name}.`, "REQUESTER");
    if (parentCaseId) await tx.serviceCase.updateMany({ where: { id: parentCaseId, organisationId: session.organisationId }, data: { status: "WAITING_INTERNAL" } });
    return work.id;
  }, { isolationLevel: "Serializable" });
  refresh(); redirect(`/${kind === "QUERY" ? "service/queries" : "tickets"}/${id}`);
}

export async function updateWork(form: FormData) {
  const session = await requireSession();
  assertCapability(session, "core.profile.self");
  const id = need(form, "workId", 100);
  await db.$transaction(async tx => {
    const work = await tx.serviceWorkItem.findFirst({ where: { AND: [workScope(session), { id, mergedIntoId: null }] } });
    if (!work) throw new Error("Work item unavailable.");
    assertCapability(session, work.kind === "TICKET" ? "tickets.ticket.manage" : "service.ticket.update");
    const member = await tx.serviceQueueMember.findFirst({ where: { organisationId: session.organisationId, queueId: work.queueId, userId: session.userId } });
    const queue=await tx.serviceQueue.findFirstOrThrow({where:{id:work.queueId,organisationId:session.organisationId}});
    if (queue.restricted && !member) throw new Error("Only this restricted queue’s members can progress work.");
    if (!member && !session.capabilities.has("tickets.ticket.manage")) throw new Error("Only the receiving team can progress this query.");
    const status = z.enum(WORK_STATUSES).parse(need(form, "status"));
    const reason = text(form, "reason", 10000);
    const reopening = FINAL_WORK.includes(work.status) && status === "IN_PROGRESS";
    if (FINAL_WORK.includes(work.status) && !reopening && !(work.status === "RESOLVED" && status === "CLOSED")) throw new Error("Reopen resolved work before making changes.");
    if ((reopening || ["RESOLVED", "CLOSED", "CANCELLED", "ANSWERED"].includes(status)) && !reason) throw new Error("Record the resolution or reason.");
    if (status === "CLOSED" && work.status !== "RESOLVED") throw new Error("Resolve this work before closing it.");
    if (FINAL_WORK.includes(status) && await tx.serviceWorkItem.count({ where: { organisationId: session.organisationId, parentId: id, status: { notIn: FINAL_WORK }, mergedIntoId: null } })) throw new Error("Complete or explicitly cancel child work first.");
    const definition = work.definition as { approval?: boolean; requiredEvidence?: boolean };
    if (status === "RESOLVED" && definition.requiredEvidence && !await tx.serviceFile.count({ where: { organisationId: session.organisationId, workId: id } })) throw new Error("Attach the required evidence before resolving.");
    if (status === "RESOLVED" && definition.approval && (!work.approvalId || !await tx.approvalInstance.findFirst({ where: { id: work.approvalId, organisationId: session.organisationId, subjectId: id, status: "APPROVED" } }))) throw new Error("Final approval is required before resolution.");
    const ownerUserId = text(form, "ownerUserId", 100) || work.ownerUserId;
    if (ownerUserId && !await tx.serviceQueueMember.findFirst({ where: { organisationId: session.organisationId, queueId: work.queueId, userId: ownerUserId } })) throw new Error("Assign to a member of this queue.");
    const sla = slaSchema.parse(work.sla), now = new Date(), pause = sla.pauseStates.includes(status);
    let due = work.resolutionDueAt;
    if (work.pausedAt && !pause && due) due = addBusinessMinutes(due, businessMinutesBetween(work.pausedAt, now, sla.calendar), sla.calendar);
    await lockWork(tx, session, id, ref(form), { status, ownerUserId,
      pausedAt: pause ? (work.pausedAt ?? now) : null, resolutionDueAt: due,
      ...(status === "RESOLVED" ? { resolution: reason, resolvedAt: now } : {}),
      ...(reopening ? { resolvedAt: null, reopenCount: { increment: 1 } } : {}),
    });
    await workEvent(tx, session, work, reopening ? "REOPENED" : status === "RESOLVED" ? "RESOLVED" : "STATUS_CHANGED", `${work.status} → ${status}. ${reason}${ownerUserId !== work.ownerUserId ? ` Owner: ${work.ownerUserId ?? "unassigned"} → ${ownerUserId}.` : ""}`, "REQUESTER");
    if (pause !== !!work.pausedAt) await workEvent(tx, session, work, pause ? "SLA_PAUSED" : "SLA_RESUMED", `Resolution deadline: ${work.resolutionDueAt?.toISOString() ?? "none"} → ${due?.toISOString() ?? "none"}. ${reason}`);
  }, { isolationLevel: "Serializable" }); refresh();
}

export async function commentWork(form: FormData) {
  const session = await requireSession();
  assertCapability(session, "core.profile.self");
  const id = need(form, "workId", 100);
  await db.$transaction(async tx => {
    const work = await tx.serviceWorkItem.findFirst({ where: { AND: [workScope(session), { id, mergedIntoId: null, status: { notIn: ["CLOSED", "CANCELLED"] } }] } });
    if (!work) throw new Error("Reopen accessible work before commenting.");
    assertCapability(session, work.kind === "TICKET" ? "tickets.ticket.reply" : "service.ticket.update");
    const agent = !!await tx.serviceQueueMember.findFirst({ where: { organisationId: session.organisationId, queueId: work.queueId, userId: session.userId } });
    const internal = text(form, "visibility") === "INTERNAL";
    if (internal && !agent) throw new Error("Internal notes are restricted to the receiving team.");
    await lockWork(tx, session, id, ref(form), { ...(!internal && agent && !work.firstResponseAt ? { firstResponseAt: new Date() } : {}) });
    await workEvent(tx, session, work, internal ? "INTERNAL_NOTE" : "COMMENT", need(form, "body", 20000), internal ? "INTERNAL" : "REQUESTER");
  }); refresh();
}

export async function watchWork(form: FormData) {
  const session = await requireSession();
  assertCapability(session, "tickets.ticket.watch");
  await db.$transaction(async tx => {
    const work = await tx.serviceWorkItem.findFirst({ where: { AND: [workScope(session), { id: need(form, "workId", 100) }] } });
    if (!work) throw new Error("Work item unavailable.");
    const watching = work.watcherIds.includes(session.userId);
    await lockWork(tx, session, work.id, ref(form), { watcherIds: watching ? work.watcherIds.filter(id => id !== session.userId) : [...work.watcherIds, session.userId] });
    await workEvent(tx, session, work, "WATCH_CHANGED", watching ? "Stopped following." : "Following updates.");
  }); refresh();
}

export async function mergeWork(form: FormData) {
  const session = await requireSession();
  assertCapability(session, "tickets.ticket.manage");
  await db.$transaction(async tx => {
    const source = await tx.serviceWorkItem.findFirst({ where: { AND: [workScope(session), { id: need(form, "workId", 100), mergedIntoId: null }] } });
    const target = await tx.serviceWorkItem.findFirst({ where: { AND: [workScope(session), { number: need(form, "targetNumber", 40), mergedIntoId: null, status: { notIn: FINAL_WORK } }] } });
    if (!source || !target || source.id === target.id || source.kind !== target.kind || source.queueId !== target.queueId || source.parentCaseId !== target.parentCaseId || source.parentId !== target.parentId) throw new Error("Merge work of the same kind, queue and origin only.");
    if (await tx.serviceWorkItem.count({ where: { organisationId: session.organisationId, parentId: source.id, status: { notIn: FINAL_WORK } } })) throw new Error("Complete child work before merging.");
    await lockWork(tx, session, source.id, ref(form), { mergedIntoId: target.id, status: "CANCELLED" });
    await workEvent(tx, session, source, "MERGED", `Merged into ${target.number}. ${need(form, "reason")}`, "REQUESTER");
    await workEvent(tx, session, target, "MERGE_RECEIVED", `Merged ${source.number}. Original history and attachments remain accessible.`, "REQUESTER");
  }, { isolationLevel: "Serializable" }); refresh();
}

export async function requestWorkApproval(form: FormData) {
  const session = await requireSession();
  assertCapability(session, "tickets.ticket.manage");
  await db.$transaction(async tx => {
    const work = await tx.serviceWorkItem.findFirst({ where: { AND: [workScope(session), { id: need(form, "workId", 100), kind: "TICKET", status: { notIn: FINAL_WORK } }] } });
    if (!work) throw new Error("Ticket unavailable.");
    if (work.approvalId && await tx.approvalInstance.findFirst({ where: { id: work.approvalId, organisationId: session.organisationId, status: { in: ["PENDING", "APPROVED"] } } })) throw new Error("This ticket already has an active approval.");
    const approval = await createApproval(tx, session, { subjectType: "SERVICE_TICKET", subjectId: work.id, subjectVersion: work.version, amount: 0n, currency: "GBP", context: { department: (await tx.serviceQueue.findUniqueOrThrow({ where: { id: work.queueId } })).department, category: work.type } });
    await lockWork(tx, session, work.id, ref(form), { approvalId: approval.id });
    await workEvent(tx, session, work, "APPROVAL_REQUESTED", "Approval requested using the configured company route.");
  }); refresh();
}
export async function decideWorkApproval(form: FormData) {
  const session = await requireSession();
  assertCapability(session, "tickets.ticket.manage");
  await db.$transaction(async tx => {
    const work = await tx.serviceWorkItem.findFirst({ where: { AND: [workScope(session), { id: need(form, "workId", 100) }] } });
    if (!work?.approvalId) throw new Error("No approval is pending.");
    const approval = await decideApproval(tx, session, work.approvalId, z.enum(["APPROVED", "REJECTED", "INFORMATION"]).parse(need(form, "decision")), need(form, "reason"));
    await lockWork(tx, session, work.id, ref(form), {});
    await workEvent(tx, session, work, "APPROVAL_DECIDED", `${approval.status}: ${text(form, "reason")}`);
  }, { isolationLevel: "Serializable" }); refresh();
}

export async function saveDeskQueue(form: FormData) {
  const session = await requireSession();
  assertCapability(session, session.capabilities.has("tickets.queue.manage") ? "tickets.queue.manage" : "service.queue.manage");
  await requireWork(session, session.capabilities.has("tickets.queue.manage") ? "TICKET" : "QUERY");
  const name = need(form, "name", 100), department = need(form, "department", 100);
  const configuration = queueConfigSchema.parse(JSON.parse(text(form, "configuration", 150000) || "{}"));
  const id = text(form, "queueId", 100);
  await db.$transaction(async tx => {
    const queue = id ? await tx.serviceQueue.findFirstOrThrow({ where: { id, organisationId: session.organisationId } }) : null;
    if(queue?.restricted&&!await tx.serviceQueueMember.findFirst({where:{organisationId:session.organisationId,queueId:queue.id,userId:session.userId}}))throw new Error("Restricted queue configuration requires membership.");
    if(queue){const timestamp=new Date(text(form,"updatedAt",50));if(!Number.isFinite(timestamp.getTime())||timestamp.getTime()!==queue.updatedAt.getTime())throw new Error("Queue changed. Refresh before saving.");}
    const saved = queue ? await tx.serviceQueue.update({ where: { id: queue.id, updatedAt:queue.updatedAt }, data: { name, department, restricted: form.get("restricted") === "on", configuration } }) : await tx.serviceQueue.create({ data: { organisationId: session.organisationId, name, department, prefix: `Q${crypto.randomUUID().replaceAll("-", "").slice(0, 6).toUpperCase()}`, restricted: form.get("restricted") === "on", configuration } });
    await tx.serviceQueueMember.upsert({ where: { queueId_userId: { queueId: saved.id, userId: session.userId } }, create: { organisationId: session.organisationId, queueId: saved.id, userId: session.userId }, update: {} });
    await tx.auditEntry.create({ data: { organisationId: session.organisationId, actorUserId: session.userId, action: "service.queue.configured", entityType: "ServiceQueue", entityId: saved.id, before: queue ? { name: queue.name, configuration: queue.configuration, restricted: queue.restricted } : undefined, after: { name, configuration, restricted: saved.restricted } } });
  }); refresh();
}

export async function changeDeskMember(form: FormData) {
  const session = await requireSession();
  assertCapability(session, session.capabilities.has("tickets.queue.manage") ? "tickets.queue.manage" : "service.queue.manage");
  await requireWork(session, session.capabilities.has("tickets.queue.manage") ? "TICKET" : "QUERY");
  const queueId = need(form, "queueId", 100), userId = need(form, "userId", 100);
  await db.$transaction(async tx => {
    const queue = await tx.serviceQueue.findFirstOrThrow({ where: { id: queueId, organisationId: session.organisationId } });
    if (queue.restricted && !await tx.serviceQueueMember.findFirst({ where: { queueId, organisationId: session.organisationId, userId: session.userId } })) throw new Error("Restricted queue membership requires a current queue manager.");
    if (!await tx.membership.findFirst({ where: { userId, organisationId: session.organisationId, active: true } })) throw new Error("Choose an active colleague.");
    const remove = text(form, "operation") === "REMOVE";
    if (remove) {
      if (await tx.serviceWorkItem.count({ where: { organisationId: session.organisationId, queueId, ownerUserId: userId, status: { notIn: FINAL_WORK } } })) throw new Error("Reassign this member’s active work first.");
      if (userId === session.userId && queue.restricted) throw new Error("Ask another queue manager to remove your restricted access.");
      await tx.serviceQueueMember.deleteMany({ where: { organisationId: session.organisationId, queueId, userId } });
    } else await tx.serviceQueueMember.upsert({ where: { queueId_userId: { queueId, userId } }, create: { organisationId: session.organisationId, queueId, userId }, update: {} });
    await tx.auditEntry.create({ data: { organisationId: session.organisationId, actorUserId: session.userId, action: remove ? "service.queue.member_removed" : "service.queue.member_added", entityType: "ServiceQueue", entityId: queueId, after: { userId } } });
  }, { isolationLevel: "Serializable" }); refresh();
}
