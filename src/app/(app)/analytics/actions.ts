"use server";
import { loadGoalMarkers } from "@/modules/kpis/services/workspace";
import { requireSession } from "@/core/auth/session";
import { assertCapability } from "@/core/permissions/check";
import { assertModuleEnabled } from "@/core/modules/access";
import { getAnalyticsMetrics } from "@/core/analytics/catalogue";
import { loadAnalyticsResults } from "@/core/analytics/load";
import {
  boardMetaSchema,
  dashboardSchema,
  widgetSchema,
  boardFiltersSchema,
  DASHBOARD_PREFIX,
} from "@/modules/analytics/definition";
import { reportDatasets } from "@/core/reports/catalogue";
import {
  dataViewInput,
  loadDataWidgets,
  loadBoardWidgets,
  validateBoardFilters,
} from "@/modules/analytics/data-views";
import { db } from "@/core/db/client";
import { revalidatePath } from "next/cache";
import { z } from "zod";

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
  await assertModuleEnabled(session, "analytics");
  const definition = dashboardSchema.parse(input);
  validateBoardFilters(definition.filters);
  const allowedMetrics = await getAnalyticsMetrics(session);
  const allowed = new Set(allowedMetrics.map((metric) => metric.id));
  if (
    definition.widgets.some(
      (widget) => !widget.data && !allowed.has(widget.metricId),
    )
  )
    throw new Error("A measure is no longer available to your account.");
  const sources = await reportDatasets(session);
  for (const widget of definition.widgets) {
    if (widget.data) {
      const dataset = sources.find((d) => d.id === widget.data!.dataset);
      if (!dataset)
        throw new Error("A dataset is no longer available to your account.");
      dataViewInput(dataset, widget.data, definition.filters);
    } else {
      const metric = allowedMetrics.find((m) => m.id === widget.metricId);
      if (
        widget.breakdown &&
        !metric?.breakdowns?.some((b) => b.id === widget.breakdown)
      )
        throw new Error("Choose an available measure breakdown.");
    }
  }
  const name = DASHBOARD_PREFIX + definition.name;
  const refreshSeconds = boardMetaSchema.parse({
    kind: "atlas-board",
    refreshSeconds: definition.refreshSeconds,
  }).refreshSeconds;
  const widgets = [
    JSON.stringify({
      kind: "atlas-board",
      period: definition.period,
      refreshSeconds,
      filters: definition.filters,
    }),
    ...definition.widgets.map((widget) => JSON.stringify(widget)),
  ];
  let id: string;
  if (definition.id) {
    if (!definition.expectedUpdatedAt)
      throw new Error("Reload this board before saving.");
    const saved = await db.dashboard.updateMany({
      where: {
        id: definition.id,
        organisationId: session.organisationId,
        userId: session.userId,
        name: { startsWith: DASHBOARD_PREFIX },
        updatedAt: new Date(definition.expectedUpdatedAt),
      },
      data: { name, widgets },
    });
    if (saved.count !== 1)
      throw new Error(
        "This board changed elsewhere. Reload it before saving your changes.",
      );
    id = definition.id;
  } else {
    const saved = await db.dashboard.create({
      data: {
        organisationId: session.organisationId,
        userId: session.userId,
        name,
        widgets,
      },
    });
    id = saved.id;
  }
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
