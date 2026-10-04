"use server";
import { requireSession } from "@/core/auth/session";
import { can } from "@/core/permissions/check";
import { HR_CAPABILITIES as HR } from "@/core/permissions/capabilities";
import { assertModuleEnabled } from "@/core/modules/access";
import { db } from "@/core/db/client";
import { writeAudit } from "@/core/audit/log";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { canEditConduct, canViewConduct, conductEmployeeChoices, conductListWhere, employeeInConductScope } from "@/modules/people/services/conduct-access";
import { leadsForEmployee } from "@/modules/kpis/services/leads";
import { syncPlanGoals } from "@/modules/kpis/services/sync";
import { readCaseForm, readEventForm, readPlanForm } from "@/modules/people/domain/conduct";

async function conductSession() {
  const session = await requireSession();
  await assertModuleEnabled(session, "people");
  return session;
}

const planSelect = {
  id: true, title: true, reason: true, support: true, status: true, startOn: true, reviewOn: true, endOn: true, objectives: true, employeeComment: true, outcome: true, employeeId: true, ownerUserId: true,
  employee: { select: { id: true, firstName: true, lastName: true, jobTitle: true, userId: true } },
  reviews: { select: { id: true, heldOn: true, progress: true, managerNotes: true, employeeNotes: true, authorUserId: true }, orderBy: { heldOn: "desc" as const } },
};

export async function getConductDesk(employeeId?: string) {
  const session = await conductSession();
  const where = await conductListWhere(session);
  const employeeFilter = employeeId ? { employeeId } : {};
  const [plans, cases, employees] = await Promise.all([
    db.performancePlan.findMany({ where: { ...where, ...employeeFilter }, select: { id: true, title: true, status: true, reviewOn: true, endOn: true, employee: { select: { id: true, firstName: true, lastName: true } } }, orderBy: { reviewOn: "asc" } }),
    db.disciplinaryCase.findMany({ where: { ...where, ...employeeFilter }, select: { id: true, reference: true, stage: true, status: true, hearingOn: true, employee: { select: { id: true, firstName: true, lastName: true } } }, orderBy: { updatedAt: "desc" } }),
    conductEmployeeChoices(session),
  ]);
  return { plans, cases, employees, canEdit: canEditConduct(session), canView: canViewConduct(session) };
}

export async function getMyConduct() {
  const session = await conductSession();
  const employee = await db.employee.findFirst({ where: { organisationId: session.organisationId, userId: session.userId }, select: { id: true } });
  if (!employee) return { plans: [], cases: [] };
  const [plans, cases] = await Promise.all([
    db.performancePlan.findMany({ where: { organisationId: session.organisationId, employeeId: employee.id, status: { not: "DRAFT" } }, select: { id: true, title: true, status: true, reviewOn: true }, orderBy: { reviewOn: "asc" } }),
    db.disciplinaryCase.findMany({ where: { organisationId: session.organisationId, employeeId: employee.id }, select: { id: true, reference: true, stage: true, status: true }, orderBy: { updatedAt: "desc" } }),
  ]);
  return { plans, cases };
}

export async function getPlan(id: string) {
  const session = await conductSession();
  const plan = await db.performancePlan.findFirst({ where: { id, organisationId: session.organisationId }, select: planSelect });
  if (!plan) throw new Error("Performance plan not found.");
  const access = await employeeInConductScope(session, plan.employeeId, "view");
  if (access.own && !canViewConduct(session) && plan.status === "DRAFT") throw new Error("This plan is not available yet.");
  return { plan, canEdit: !access.own && canEditConduct(session), own: access.own, confidential: can(session, HR.employeeManage) };
}

export async function getCase(id: string) {
  const session = await conductSession();
  const record = await db.disciplinaryCase.findFirst({
    where: { id, organisationId: session.organisationId },
    select: {
      id: true, reference: true, employeeId: true, planId: true, stage: true, status: true, allegation: true, facts: true, employeeResponse: true, hearingOn: true, outcome: true, sanction: true, appealBy: true, confidentialNotes: true,
      employee: { select: { firstName: true, lastName: true, jobTitle: true, userId: true } },
      plan: { select: { id: true, title: true } },
      events: { select: { id: true, kind: true, occurredOn: true, summary: true, detail: true, shared: true, authorUserId: true }, orderBy: { occurredOn: "desc" } },
    },
  });
  if (!record) throw new Error("Disciplinary case not found.");
  const access = await employeeInConductScope(session, record.employeeId, "view");
  const canEdit = !access.own && canEditConduct(session);
  const events = access.own && !canViewConduct(session) ? record.events.filter((event) => event.shared) : record.events;
  return {
    record: { ...record, facts: access.own && !canViewConduct(session) ? null : record.facts, confidentialNotes: can(session, HR.employeeManage) ? record.confidentialNotes : null, events },
    canEdit,
    own: access.own,
    confidential: can(session, HR.employeeManage),
  };
}

export async function conductChoices() {
  const session = await conductSession();
  const [employees, plans] = await Promise.all([
    conductEmployeeChoices(session),
    db.performancePlan.findMany({ where: await conductListWhere(session), select: { id: true, title: true, employee: { select: { firstName: true, lastName: true } } }, orderBy: { title: "asc" } }),
  ]);
  return { employees, plans, canEdit: canEditConduct(session) };
}

export async function savePlan(id: string | null, form: FormData) {
  const session = await conductSession();
  const input = readPlanForm(form);
  let kind = "PIP";
  if (id) {
    const existing = await db.performancePlan.findFirstOrThrow({ where: { id, organisationId: session.organisationId }, select: { employeeId: true, kind: true } });
    await employeeInConductScope(session, existing.employeeId, "edit");
    if (input.employeeId !== existing.employeeId) throw new Error("Open a new plan to move it to another employee.");
    if (existing.kind === "DEVELOPMENT" || existing.kind === "PERSONAL") kind = existing.kind;
  } else await employeeInConductScope(session, input.employeeId, "edit");
  const { personName, leadUserIds: leads } = await leadsForEmployee(session.organisationId, input.employeeId, session.userId);
  const data = { title: input.title, reason: input.reason, support: input.support, startOn: input.startOn, reviewOn: input.reviewOn, endOn: input.endOn, status: input.status, objectives: input.objectives, outcome: input.outcome, personName, leadUserIds: leads, kind };
  const plan = id
    ? await db.performancePlan.update({ where: { id }, data })
    : await db.performancePlan.create({ data: { ...data, organisationId: session.organisationId, employeeId: input.employeeId, ownerUserId: session.userId } });
  await syncPlanGoals({ organisationId: session.organisationId, ownerUserId: session.userId, planId: plan.id, employeeId: input.employeeId, personName, title: input.title, kind, support: input.support ?? "", startOn: input.startOn, endOn: input.endOn, reviewOn: input.reviewOn, leadUserIds: leads, objectives: input.objectives });
  await writeAudit({ organisationId: session.organisationId, actorUserId: session.userId, action: id ? "performance_plan.updated" : "performance_plan.opened", entityType: "PerformancePlan", entityId: plan.id, after: { status: input.status } });
  revalidatePath("/people/conduct");
  revalidatePath(`/people/conduct/plans/${plan.id}`);
  revalidatePath("/people/me");
  revalidatePath("/kpis");
  revalidatePath("/profile");
  redirect(`/people/conduct/plans/${plan.id}`);
}

export async function addPlanReview(planId: string, form: FormData) {
  const session = await conductSession();
  const plan = await db.performancePlan.findFirstOrThrow({ where: { id: planId, organisationId: session.organisationId }, select: { employeeId: true } });
  const access = await employeeInConductScope(session, plan.employeeId, "view");
  const progress = String(form.get("progress") ?? "").trim();
  if (!progress || progress.length > 2000) throw new Error("Describe progress in 2,000 characters or fewer.");
  const managerNotes = String(form.get("managerNotes") ?? "").trim();
  const employeeNotes = String(form.get("employeeNotes") ?? "").trim();
  if (managerNotes.length > 4000 || employeeNotes.length > 4000) throw new Error("Review notes must be 4,000 characters or fewer.");
  if (!access.own && !canEditConduct(session)) throw new Error("FORBIDDEN: you cannot add a review to this plan.");
  if (access.own && managerNotes) throw new Error("Add your comments in the employee notes.");
  const heldOn = new Date(`${String(form.get("heldOn") ?? "")}T00:00:00Z`);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(form.get("heldOn") ?? ""))) throw new Error("Enter the review date.");
  await db.performanceReview.create({ data: { organisationId: session.organisationId, planId, heldOn, progress, managerNotes: access.own ? null : managerNotes || null, employeeNotes: employeeNotes || null, authorUserId: session.userId } });
  await writeAudit({ organisationId: session.organisationId, actorUserId: session.userId, action: "performance_plan.reviewed", entityType: "PerformancePlan", entityId: planId });
  revalidatePath(`/people/conduct/plans/${planId}`);
}

export async function commentOnPlan(planId: string, form: FormData) {
  const session = await conductSession();
  const plan = await db.performancePlan.findFirstOrThrow({ where: { id: planId, organisationId: session.organisationId }, select: { employeeId: true } });
  const access = await employeeInConductScope(session, plan.employeeId, "view");
  if (!access.own && !canEditConduct(session)) throw new Error("FORBIDDEN: you cannot comment on this plan.");
  const employeeComment = String(form.get("employeeComment") ?? "").trim();
  if (employeeComment.length > 4000) throw new Error("Comments must be 4,000 characters or fewer.");
  await db.performancePlan.update({ where: { id: planId }, data: { employeeComment: employeeComment || null } });
  revalidatePath(`/people/conduct/plans/${planId}`);
  revalidatePath("/people/me");
}

export async function saveCase(id: string | null, form: FormData) {
  const session = await conductSession();
  const input = readCaseForm(form);
  if (input.hearingOn && Number.isNaN(input.hearingOn.getTime())) throw new Error("Enter a valid hearing date.");
  if (id) {
    const existing = await db.disciplinaryCase.findFirstOrThrow({ where: { id, organisationId: session.organisationId }, select: { employeeId: true } });
    await employeeInConductScope(session, existing.employeeId, "edit");
    if (input.employeeId !== existing.employeeId) throw new Error("Open a new case to move it to another employee.");
  } else await employeeInConductScope(session, input.employeeId, "edit");
  if (input.planId) {
    const plan = await db.performancePlan.findFirst({ where: { id: input.planId, organisationId: session.organisationId, employeeId: input.employeeId }, select: { id: true } });
    if (!plan) throw new Error("Link a performance plan for the same employee, or leave it blank.");
  }
  const data = {
    stage: input.stage, status: input.status, allegation: input.allegation, facts: input.facts, outcome: input.outcome, sanction: input.sanction, hearingOn: input.hearingOn, appealBy: input.appealBy, planId: input.planId,
    ...(can(session, HR.employeeManage) ? { confidentialNotes: input.confidentialNotes } : {}),
  };
  const record = id
    ? await db.disciplinaryCase.update({ where: { id }, data })
    : await db.$transaction(async (tx) => {
        const count = await tx.disciplinaryCase.count({ where: { organisationId: session.organisationId } });
        return tx.disciplinaryCase.create({ data: { ...data, organisationId: session.organisationId, employeeId: input.employeeId, ownerUserId: session.userId, reference: `DC-${String(count + 1).padStart(5, "0")}` } });
      });
  await writeAudit({ organisationId: session.organisationId, actorUserId: session.userId, action: id ? "disciplinary.updated" : "disciplinary.opened", entityType: "DisciplinaryCase", entityId: record.id, after: { stage: input.stage, status: input.status, reference: record.reference } });
  revalidatePath("/people/conduct");
  revalidatePath(`/people/conduct/cases/${record.id}`);
  revalidatePath("/people/me");
  redirect(`/people/conduct/cases/${record.id}`);
}

export async function respondToCase(id: string, form: FormData) {
  const session = await conductSession();
  const record = await db.disciplinaryCase.findFirstOrThrow({ where: { id, organisationId: session.organisationId }, select: { employeeId: true } });
  const access = await employeeInConductScope(session, record.employeeId, "view");
  if (!access.own && !canEditConduct(session)) throw new Error("FORBIDDEN: you cannot respond to this case.");
  const employeeResponse = String(form.get("employeeResponse") ?? "").trim();
  if (employeeResponse.length > 8000) throw new Error("The response must be 8,000 characters or fewer.");
  await db.disciplinaryCase.update({ where: { id }, data: { employeeResponse: employeeResponse || null } });
  await writeAudit({ organisationId: session.organisationId, actorUserId: session.userId, action: "disciplinary.responded", entityType: "DisciplinaryCase", entityId: id });
  revalidatePath(`/people/conduct/cases/${id}`);
}

export async function addCaseEvent(id: string, form: FormData) {
  const session = await conductSession();
  const record = await db.disciplinaryCase.findFirstOrThrow({ where: { id, organisationId: session.organisationId }, select: { employeeId: true } });
  await employeeInConductScope(session, record.employeeId, "edit");
  const input = readEventForm(form);
  await db.disciplinaryEvent.create({ data: { organisationId: session.organisationId, caseId: id, ...input, authorUserId: session.userId } });
  await writeAudit({ organisationId: session.organisationId, actorUserId: session.userId, action: "disciplinary.event", entityType: "DisciplinaryCase", entityId: id, after: { kind: input.kind, shared: input.shared } });
  revalidatePath(`/people/conduct/cases/${id}`);
}
