import { db } from "@/core/db/client";
import type { Session } from "@/core/auth/session";
import { assertCapability } from "@/core/permissions/check";
import { assertModuleEnabled } from "@/core/modules/access";
import { loadGoalWorkspace } from "./workspace";
import { weightedAttainment } from "../domain/scorecards";
import type { KpiScorecard,KpiScorecardItem } from "@/generated/prisma/client";
import type { GoalCard } from "./workspace";
export type ScorecardResult=KpiScorecard & {items:(KpiScorecardItem & {goal?:GoalCard})[];value:number|null;missing:number};

export async function loadScorecards(session: Session):Promise<ScorecardResult[]> {
  if(process.env.ATLAS_RUNTIME==="desktop")return (await import("@/app/(app)/kpis/scorecards/actions")).getScorecards();
  assertCapability(session, "kpis.read");
  await assertModuleEnabled(session, "kpis");
  const [rows, workspace] = await Promise.all([db.kpiScorecard.findMany({ where: { organisationId: session.organisationId }, include: { items: true }, orderBy: { createdAt: "desc" }, take: 100 }), loadGoalWorkspace(session)]);
  const goals = new Map(workspace.goals.filter(goal => goal.visibility === "COMPANY").map(goal => [goal.id, goal]));
  return rows.map(row => { const items = row.items.map(item => ({ ...item, goal: goals.get(item.goalId) })); return { ...row, items, ...weightedAttainment(items.map(item => ({ actual: item.goal?.actual ?? null, target: item.goal?.target ?? 0, direction: item.goal?.direction ?? "AT_LEAST", weight: item.weight }))) }; });
}
