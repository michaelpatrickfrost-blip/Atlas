"use server";
import { loadGoalMarkers } from "@/modules/kpis/services/workspace";
import { requireSession } from "@/core/auth/session";
import { assertCapability } from "@/core/permissions/check";
import { assertModuleEnabled } from "@/core/modules/access";
import { getAnalyticsMetrics } from "@/core/analytics/catalogue";
import { loadAnalyticsResults } from "@/core/analytics/load";
import {
  widgetSchema,
  boardFiltersSchema,
  DASHBOARD_PREFIX,
} from "@/modules/analytics/definition";
import {
  loadDataWidgets,
  loadBoardWidgets,
} from "@/modules/analytics/data-views";
import { db } from "@/core/db/client";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { saveAnalyticsDashboardForSession } from "@/modules/analytics/services/authoring";

async function authorised(manage: boolean) {
  const session = await requireSession();
  assertCapability(
    session,
    manage ? "analytics.dashboard.manage" : "analytics.dashboard.read",
  );
  await assertModuleEnabled(session, "analytics");
  return session;
}

export async function loadLiveMetrics(period: unknown) {
  const session = await authorised(false);
  const value = z.enum(["30", "90", "365", "all"]).parse(period);
  return loadAnalyticsResults(session, value);
}

export async function loadMetricSlice(input: unknown) {
  const session = await authorised(false);
  const request = z
    .object({
      metricId: z.string().min(1).max(80),
      period: z.enum(["30", "90", "365", "all"]),
      breakdown: z.string().trim().min(1).max(40),
    })
    .parse(input);
  const metric = (await getAnalyticsMetrics(session)).find(
    (item) => item.id === request.metricId,
  );
  if (!metric)
    throw new Error("That measure is no longer available to your account.");
  if (
    metric.breakdowns &&
    !metric.breakdowns.some((item) => item.id === request.breakdown)
  )
    throw new Error("That view is not available.");
  const since =
    request.period === "all"
      ? undefined
      : new Date(Date.now() - Number(request.period) * 86400000);
  const points = await metric.query(session, since, request.breakdown);
  const chosen = metric.breakdowns?.find(
    (item) => item.id === request.breakdown,
  );
  return {
    points,
    shape: chosen?.shape ?? metric.shape ?? ("breakdown" as const),
  };
}

export async function saveAnalyticsDashboard(input: unknown) {
  const session = await requireSession();
  assertCapability(session, "analytics.dashboard.manage");
  const id = await saveAnalyticsDashboardForSession(session, input);
  revalidatePath("/analytics");
  revalidatePath("/board");
  return id;
}

export async function deleteAnalyticsDashboard(id: unknown) {
  const session = await requireSession();
  assertCapability(session, "analytics.dashboard.manage");
  await assertModuleEnabled(session, "analytics");
  const dashboardId = z.string().min(1).max(40).parse(id);
  await db.dashboard.deleteMany({
    where: {
      id: dashboardId,
      organisationId: session.organisationId,
      userId: session.userId,
      name: { startsWith: DASHBOARD_PREFIX },
    },
  });
  revalidatePath("/analytics");
  revalidatePath("/board");
}

export async function loadLiveGoalMarkers() {
  const session = await authorised(false);
  return loadGoalMarkers(session);
}

export async function loadDashboardData(input: unknown) {
  const session = await authorised(false);
  const request = z
    .object({
      widgets: z.array(widgetSchema).max(24),
      filters: boardFiltersSchema,
    })
    .parse(input);
  return loadDataWidgets(session, request.widgets, request.filters);
}

export async function loadDashboardSnapshot(input: unknown) {
  const session = await authorised(false);
  const request = z
    .object({
      widgets: z.array(widgetSchema).max(24),
      filters: boardFiltersSchema,
      period: z.enum(["30", "90", "365", "all"]),
    })
    .parse(input);
  return loadBoardWidgets(
    session,
    request.widgets,
    request.filters,
    request.period,
  );
}
