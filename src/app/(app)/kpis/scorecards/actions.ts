"use server";
import {withFormFeedback} from "@/core/shared/form-feedback";
import { requireSession } from "@/core/auth/session";
import { assertCapability } from "@/core/permissions/check";
import { assertModuleEnabled } from "@/core/modules/access";
import { db } from "@/core/db/client";
import { revalidatePath } from "next/cache";
import { loadScorecards,type ScorecardResult } from "@/modules/kpis/services/scorecards";
export async function getScorecards():Promise<ScorecardResult[]> {const session=await requireSession();assertCapability(session,"kpis.read");return loadScorecards(session);}

export async function saveScorecard(form: FormData) {
  const session = await requireSession();
  assertCapability(session, "kpis.manage");
 return withFormFeedback(async()=> {

  await assertModuleEnabled(session, "kpis");
  const title = String(form.get("title") ?? "").trim();
  const goalIds = [...new Set(form.getAll("goalId").map(String))];
  if (!title || title.length > 100 || !goalIds.length || goalIds.length > 30) throw new Error("Name the scorecard and choose between 1 and 30 company goals.");
  const weights = goalIds.map(goalId => ({ goalId, weight: Number(form.get(`weight:${goalId}`) ?? 1) }));
  if (weights.some(item => !Number.isFinite(item.weight) || item.weight <= 0 || item.weight > 100)) throw new Error("Each weight must be greater than zero and at most 100.");
  await db.$transaction(async tx => {
    if (await tx.kpi.count({ where: { organisationId: session.organisationId, id: { in: goalIds }, visibility: "COMPANY", status: "ACTIVE" } }) !== goalIds.length) throw new Error("Choose active company goals from this company.");
    const id = String(form.get("id") ?? "");
    const data = { title, description: String(form.get("description") ?? "").trim().slice(0, 500) };
    const row = id ? await tx.kpiScorecard.update({ where: { id, organisationId: session.organisationId }, data }) : await tx.kpiScorecard.create({ data: { ...data, organisationId: session.organisationId, ownerUserId: session.userId } });
    await tx.kpiScorecardItem.deleteMany({ where: { organisationId: session.organisationId, scorecardId: row.id } });
    await tx.kpiScorecardItem.createMany({ data: weights.map(item => ({ ...item, scorecardId: row.id, organisationId: session.organisationId })) });
    await tx.auditEntry.create({ data: { organisationId: session.organisationId, actorUserId: session.userId, action: "kpis.scorecard.saved", entityType: "KpiScorecard", entityId: row.id, after: { title, weights } } });
  }, { isolationLevel: "Serializable" });
  revalidatePath("/kpis"); revalidatePath("/kpis/scorecards"); revalidatePath("/analytics");

 });
}

export async function removeScorecard(form: FormData) {
  const session = await requireSession();
  assertCapability(session, "kpis.manage");
 return withFormFeedback(async()=> {

  await assertModuleEnabled(session, "kpis");
  await db.$transaction(async tx => {
    const row = await tx.kpiScorecard.findFirstOrThrow({ where: { id: String(form.get("id")), organisationId: session.organisationId } });
    await tx.kpiScorecard.delete({ where: { id: row.id, organisationId: session.organisationId } });
    await tx.auditEntry.create({ data: { organisationId: session.organisationId, actorUserId: session.userId, action: "kpis.scorecard.removed", entityType: "KpiScorecard", entityId: row.id } });
  });
  revalidatePath("/kpis/scorecards");

 });
}
