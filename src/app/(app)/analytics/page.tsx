import { requireSession } from "@/core/auth/session";
import { assertCapability, can } from "@/core/permissions/check";
import { assertModuleEnabled } from "@/core/modules/access";
import { loadAnalyticsResults } from "@/core/analytics/load";
import { db } from "@/core/db/client";
import { DASHBOARD_PREFIX, readBoardSettings, readWidgets } from "@/modules/analytics/definition";
import { Studio } from "@/modules/analytics/components/studio";
import { loadGoalMarkers } from "@/modules/kpis/services/workspace";

export default async function Page({ searchParams }: { searchParams: Promise<{ period?: string; dashboard?: string; new?: string; template?: string; edit?: string; menu?: string }> }) {
  const session = await requireSession();
  assertCapability(session, "analytics.dashboard.read");
  await assertModuleEnabled(session, "analytics");
  const params = await searchParams;
  const period = ["30", "90", "365", "all"].includes(params.period ?? "") ? params.period! : "90";
  const [results, saved, goals] = await Promise.all([
    loadAnalyticsResults(session, period),
    db.dashboard.findMany({ where: { organisationId: session.organisationId, userId: session.userId, name: { startsWith: DASHBOARD_PREFIX } }, orderBy: { updatedAt: "desc" }, select: { id: true, name: true, widgets: true, updatedAt: true } }),
    loadGoalMarkers(session),
  ]);
  const dashboards = saved.map((board) => ({ id: board.id, name: board.name.slice(DASHBOARD_PREFIX.length), widgets: readWidgets(board.widgets), refreshSeconds: readBoardSettings(board.widgets).refreshSeconds, updatedAt: board.updatedAt.toISOString(), updatedLabel: board.updatedAt.toLocaleDateString("en-GB", { day: "numeric", month: "short" }) }));
  return <Studio key={`${period}:${params.dashboard ?? ""}:${params.new ?? ""}:${params.template ?? ""}:${params.edit ?? ""}:${params.menu ?? ""}`} metrics={results} dashboards={dashboards} selectedId={params.dashboard} period={period} canManage={can(session, "analytics.dashboard.manage")} company={session.organisationName} createNew={params.new === "1"} templateId={params.template} startEditing={params.edit === "1" || params.new === "1"} openMenuMetric={params.menu} goals={goals} />;
}
