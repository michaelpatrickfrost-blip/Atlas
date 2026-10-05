"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/core/db/client";
import { requireSession } from "@/core/auth/session";
import { assertCapability, can } from "@/core/permissions/check";
import { SALES_CAPABILITIES } from "@/core/permissions/capabilities";
import { writeAudit } from "@/core/audit/log";
import { SalesProjectStage, SalesProjectOrganisationRole, SalesProjectStakeholderRole } from "@/generated/prisma/client";
import { generateSalesProjectReference } from "./sales-projects-queries";
import { refreshSalesProjectValues } from "./sales-project-values";

const text = (form: FormData, name: string, max = 2000) => String(form.get(name) ?? "").trim().slice(0, max);
const date = (form: FormData, name: string) => { const value = text(form, name, 10); if (!value) return null; const parsed = new Date(`${value}T00:00:00Z`); if (Number.isNaN(parsed.getTime())) throw new Error("Enter a valid date."); return parsed; };
const pounds = (form: FormData, name: string) => { const value = text(form, name, 20); if (!value) return null; const amount = Math.round(Number(value) * 100); if (!Number.isSafeInteger(amount) || amount < 0 || amount > 2_000_000_000) throw new Error("Enter a value of zero or more."); return amount; };

async function manage() {
  const session = await requireSession();
  assertCapability(session, SALES_CAPABILITIES.opportunityManage);
  return session;
}
async function owned(organisationId: string, id: string) {
  const project = await db.salesProject.findFirst({ where: { id, organisationId } });
  if (!project) throw new Error("This project no longer exists.");
  return project;
}
function done(id: string) {
  revalidatePath("/crm/projects");
  revalidatePath(`/crm/projects/${id}`);
}

export async function createSalesProject(input: { name: string; description?: string; ownerUserId: string; teamId?: string; potentialValueAmount?: number; industryId?: string; stage?: SalesProjectStage; targetAwardDate?: Date; primaryOrganisationId?: string }) {
  const session = await manage();
  const name = input.name.trim();
  if (!name) throw new Error("Enter a project name.");
  if (input.primaryOrganisationId && !(await db.party.findFirst({ where: { id: input.primaryOrganisationId, organisationId: session.organisationId }, select: { id: true } }))) throw new Error("Choose a customer from your records.");
  const reference = await generateSalesProjectReference(session.organisationId);
  const project = await db.salesProject.create({
    data: {
      organisationId: session.organisationId, reference, name, description: input.description, ownerUserId: session.userId, potentialValueAmount: input.potentialValueAmount, remainingValueAmount: input.potentialValueAmount, industryId: input.industryId,
      stage: input.stage || SalesProjectStage.IDENTIFIED, targetAwardDate: input.targetAwardDate,
      ...(input.primaryOrganisationId && { organisations: { create: { partyId: input.primaryOrganisationId, isPrimary: true, roles: ["END_CLIENT"] } } }),
    },
  });
  await writeAudit({ organisationId: session.organisationId, actorUserId: session.userId, action: "sales_project.created", entityType: "SalesProject", entityId: project.id, after: { reference, name } });
  revalidatePath("/crm/projects");
  return project;
}

export async function createSalesProjectFormAction(form: FormData) {
  const stage = text(form, "stage", 40);
  const project = await createSalesProject({ name: text(form, "name", 200), description: text(form, "description") || undefined, ownerUserId: "", potentialValueAmount: pounds(form, "potentialValue") ?? undefined, stage: stage in SalesProjectStage ? (stage as SalesProjectStage) : undefined, targetAwardDate: date(form, "targetAwardDate") ?? undefined, primaryOrganisationId: text(form, "partyId", 60) || undefined });
  const { redirect } = await import("next/navigation");
  redirect(`/crm/projects/${project.id}`);
}

export async function saveSalesProjectAction(form: FormData) {
  const session = await manage(), id = text(form, "projectId", 60), before = await owned(session.organisationId, id);
  const name = text(form, "name", 200), stage = text(form, "stage", 40), probabilityText = text(form, "probability", 5);
  if (!name) throw new Error("Enter a project name.");
  if (!(stage in SalesProjectStage)) throw new Error("Choose a stage.");
  const probability = probabilityText ? Number(probabilityText) : null;
  if (probability != null && (!Number.isInteger(probability) || probability < 0 || probability > 100)) throw new Error("Probability is a whole number from 0 to 100.");
  const industryId = text(form, "industryId", 60) || null;
  if (industryId && !(await db.crmIndustry.findFirst({ where: { id: industryId, organisationId: session.organisationId }, select: { id: true } }))) throw new Error("Choose an industry from your list.");
  const data = {
    name, stage: stage as SalesProjectStage, description: text(form, "description") || null, notes: text(form, "notes", 5000) || null, potentialValueAmount: pounds(form, "potentialValue"), awardedValueAmount: pounds(form, "awardedValue"), probability, industryId,
    targetAwardDate: date(form, "targetAwardDate"), expectedStartDate: date(form, "expectedStartDate"), expectedCompletionDate: date(form, "expectedCompletionDate"),
    ...(stage !== before.stage ? { stageEnteredAt: new Date() } : {}),
  };
  await db.salesProject.update({ where: { id }, data });
  await refreshSalesProjectValues(session.organisationId, id);
  await writeAudit({ organisationId: session.organisationId, actorUserId: session.userId, action: "sales_project.updated", entityType: "SalesProject", entityId: id, before: { name: before.name, stage: before.stage, potentialValueAmount: before.potentialValueAmount }, after: { name, stage, potentialValueAmount: data.potentialValueAmount } });
  done(id);
}

export async function saveNextActionAction(form: FormData) {
  const session = await manage(), id = text(form, "projectId", 60);
  await owned(session.organisationId, id);
  await db.salesProject.update({ where: { id }, data: { nextActionNote: text(form, "nextActionNote", 500) || null, nextActionAt: date(form, "nextActionAt"), lastActivityAt: new Date() } });
  done(id);
}

export async function addProjectOrganisationAction(form: FormData) {
  const session = await manage(), id = text(form, "projectId", 60), partyId = text(form, "partyId", 60);
  await owned(session.organisationId, id);
  if (!(await db.party.findFirst({ where: { id: partyId, organisationId: session.organisationId }, select: { id: true } }))) throw new Error("Choose an organisation from your customer records.");
  const roles = form.getAll("roles").map(String).filter((role): role is SalesProjectOrganisationRole => role in SalesProjectOrganisationRole);
  const primary = form.get("isPrimary") === "on";
  await db.$transaction(async (tx) => {
    if (primary) await tx.salesProjectOrganisation.updateMany({ where: { salesProjectId: id }, data: { isPrimary: false } });
    const first = !(await tx.salesProjectOrganisation.count({ where: { salesProjectId: id } }));
    await tx.salesProjectOrganisation.upsert({ where: { salesProjectId_partyId: { salesProjectId: id, partyId } }, create: { salesProjectId: id, partyId, roles, isPrimary: primary || first, notes: text(form, "notes", 500) || null }, update: { roles, ...(primary ? { isPrimary: true } : {}), notes: text(form, "notes", 500) || null } });
  });
  done(id);
}

export async function removeProjectOrganisationAction(form: FormData) {
  const session = await manage(), id = text(form, "projectId", 60);
  await owned(session.organisationId, id);
  await db.salesProjectOrganisation.deleteMany({ where: { id: text(form, "linkId", 60), salesProjectId: id } });
  done(id);
}

export async function makePrimaryOrganisationAction(form: FormData) {
  const session = await manage(), id = text(form, "projectId", 60), linkId = text(form, "linkId", 60);
  await owned(session.organisationId, id);
  await db.$transaction([db.salesProjectOrganisation.updateMany({ where: { salesProjectId: id }, data: { isPrimary: false } }), db.salesProjectOrganisation.updateMany({ where: { id: linkId, salesProjectId: id }, data: { isPrimary: true } })]);
  done(id);
}

export async function addProjectStakeholderAction(form: FormData) {
  const session = await manage(), id = text(form, "projectId", 60), contactId = text(form, "contactId", 60);
  await owned(session.organisationId, id);
  if (!(await db.contact.findFirst({ where: { id: contactId, party: { organisationId: session.organisationId } }, select: { id: true } }))) throw new Error("Choose a contact from your customer records.");
  const roles = form.getAll("roles").map(String).filter((role): role is SalesProjectStakeholderRole => role in SalesProjectStakeholderRole);
  const level = (name: string) => { const value = text(form, name, 10); return ["STRONG", "MODERATE", "WEAK"].includes(value) ? value : null; };
  const sentiment = text(form, "sentiment", 10);
  const data = { roles, influence: level("influence"), relationshipStrength: level("relationshipStrength"), sentiment: ["POSITIVE", "NEUTRAL", "NEGATIVE"].includes(sentiment) ? sentiment : null, notes: text(form, "notes", 500) || null };
  await db.salesProjectStakeholder.upsert({ where: { salesProjectId_contactId: { salesProjectId: id, contactId } }, create: { salesProjectId: id, contactId, ...data }, update: data });
  done(id);
}

export async function removeProjectStakeholderAction(form: FormData) {
  const session = await manage(), id = text(form, "projectId", 60);
  await owned(session.organisationId, id);
  await db.salesProjectStakeholder.deleteMany({ where: { id: text(form, "linkId", 60), salesProjectId: id } });
  done(id);
}

/** Attach a quotation or sales order to a sales project, or detach it with an empty project. */
export async function setDocumentSalesProjectAction(form: FormData) {
  const session = await requireSession();
  const kind = text(form, "kind", 10), documentId = text(form, "documentId", 60), projectId = text(form, "salesProjectId", 60) || null;
  if (kind !== "quote" && kind !== "order") throw new Error("Choose a quotation or an order.");
  if (!can(session, SALES_CAPABILITIES.opportunityManage) && !can(session, kind === "quote" ? SALES_CAPABILITIES.quoteCreate : SALES_CAPABILITIES.orderEditDraft) && !can(session, SALES_CAPABILITIES.orderAmend)) throw new Error("You do not have permission to link this document.");
  if (!documentId) throw new Error(kind === "quote" ? "Choose a quotation." : "Choose an order.");
  if (projectId) await owned(session.organisationId, projectId);
  const organisationId = session.organisationId;
  const current = kind === "quote" ? await db.quote.findFirst({ where: { id: documentId, organisationId }, select: { salesProjectId: true, partyId: true } }) : await db.salesOrder.findFirst({ where: { id: documentId, organisationId }, select: { salesProjectId: true, partyId: true } });
  if (!current) throw new Error("This document no longer exists.");
  await db.$transaction(async (tx) => {
    if (kind === "quote") await tx.quote.update({ where: { id: documentId }, data: { salesProjectId: projectId } });
    else await tx.salesOrder.update({ where: { id: documentId }, data: { salesProjectId: projectId } });
    if (projectId && !(await tx.salesProjectOrganisation.count({ where: { salesProjectId: projectId, partyId: current.partyId } }))) {
      const first = !(await tx.salesProjectOrganisation.count({ where: { salesProjectId: projectId } }));
      await tx.salesProjectOrganisation.create({ data: { salesProjectId: projectId, partyId: current.partyId, roles: [], isPrimary: first } });
    }
    await refreshSalesProjectValues(organisationId, projectId, tx);
    if (current.salesProjectId && current.salesProjectId !== projectId) await refreshSalesProjectValues(organisationId, current.salesProjectId, tx);
  });
  await writeAudit({ organisationId, actorUserId: session.userId, action: "sales_project.document_linked", entityType: kind === "quote" ? "Quote" : "SalesOrder", entityId: documentId, before: { salesProjectId: current.salesProjectId }, after: { salesProjectId: projectId } });
  for (const id of [projectId, current.salesProjectId]) if (id) done(id);
  revalidatePath(kind === "quote" ? `/sales/quotes/${documentId}` : `/sales/orders/${documentId}`);
}

export async function deleteSalesProjectAction(form: FormData) {
  const session = await manage(), id = text(form, "projectId", 60), project = await owned(session.organisationId, id);
  await db.$transaction([
    db.quote.updateMany({ where: { organisationId: session.organisationId, salesProjectId: id }, data: { salesProjectId: null } }),
    db.salesOrder.updateMany({ where: { organisationId: session.organisationId, salesProjectId: id }, data: { salesProjectId: null } }),
    db.salesProject.delete({ where: { id } }),
  ]);
  await writeAudit({ organisationId: session.organisationId, actorUserId: session.userId, action: "sales_project.deleted", entityType: "SalesProject", entityId: id, before: { reference: project.reference, name: project.name } });
  revalidatePath("/crm/projects");
  const { redirect } = await import("next/navigation");
  redirect("/crm/projects");
}
