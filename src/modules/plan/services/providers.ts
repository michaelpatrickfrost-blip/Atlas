import type { AttentionItem, SearchResult } from "@/core/modules/types";
import type { Session } from "@/core/auth/session";
import { db } from "@/core/db/client";
import { PLAN_CAPABILITIES } from "@/core/permissions/capabilities";
import { planWhere } from "../domain/access";

async function open(session: Session) {
  if (!session.capabilities.has(PLAN_CAPABILITIES.read)) return false;
  return Boolean(await db.moduleState.findFirst({ where: { organisationId: session.organisationId, moduleId: "plan", enabled: true, entitled: true } }));
}

export async function planAttention({ organisationId, session }: { organisationId: string; session: Session }): Promise<AttentionItem[]> {
  if (!await open(session)) return [];
  const where = planWhere(session);
  const [waiting, actions, reviews] = await Promise.all([
    db.businessPlan.count({ where: { ...where, status: "submitted" } }),
    db.planAction.count({ where: { organisationId, status: "open", dueOn: { lt: new Date() }, plan: where } }),
    db.planReview.count({ where: { organisationId, status: { not: "completed" }, scheduledFor: { lte: new Date(Date.now() + 7 * 86400000) }, plan: where } }),
  ]);
  const items: AttentionItem[] = [];
  if (waiting) items.push({ id: "plan-approve", label: `${waiting} plan${waiting === 1 ? "" : "s"} waiting for approval`, href: "/plan/plans", severity: "warning" });
  if (actions) items.push({ id: "plan-actions", label: `${actions} planning action${actions === 1 ? "" : "s"} overdue`, href: "/plan", severity: "warning" });
  if (reviews) items.push({ id: "plan-reviews", label: `${reviews} plan review${reviews === 1 ? "" : "s"} due this week`, href: "/plan/reviews", severity: "info" });
  return items;
}

export async function planSearch({ session, query }: { organisationId: string; session: Session; query: string }): Promise<SearchResult[]> {
  if (!await open(session) || query.trim().length < 2) return [];
  const plans = await db.businessPlan.findMany({ where: { AND: [planWhere(session), { OR: [{ name: { contains: query, mode: "insensitive" } }, { purpose: { contains: query, mode: "insensitive" } }, { planType: { contains: query, mode: "insensitive" } }] }] }, take: 6 });
  const results: SearchResult[] = plans.map((plan) => ({ id: plan.id, title: plan.name, subtitle: plan.periodLabel, href: `/plan/plans/${plan.id}`, group: "Plan" }));
  if (/below plan|off track|gap/i.test(query)) results.unshift({ id: "plan-gaps", title: "Where the forecast is off the plan", href: "/plan/insights", group: "Plan" });
  if (/production|capacity|kiln/i.test(query)) results.push({ id: "plan-production", title: "Production plans", subtitle: "Demand, capacity and live output", href: "/plan/plans?type=manufacturing", group: "Plan" });
  return results;
}
