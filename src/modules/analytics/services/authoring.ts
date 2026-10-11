import { z } from "zod";
import { Prisma } from "@/generated/prisma/client";
import { db } from "@/core/db/client";
import { sessionAuthorityStamp, type Session } from "@/core/auth/session";
import { ATLAS_CAPABILITIES } from "@/core/admin/access";
import { assertCapability } from "@/core/permissions/check";
import { writeAudit } from "@/core/audit/log";
import { nativeFieldMutationSessionInTransaction } from "@/core/studio/fields/runtime-authority";
import { getAnalyticsMetrics } from "@/core/analytics/catalogue";
import { reportDatasets } from "@/core/reports/catalogue";
import { boardMetaSchema, dashboardSchema, DASHBOARD_PREFIX } from "../definition";
import { dataViewInput, validateBoardFilters } from "../data-views";

const sqlFailure = z.object({ code: z.string().optional(), driverAdapterError: z.object({ cause: z.object({ originalCode: z.string().optional() }).optional() }).optional() });
function conflict(): never { throw new Error("CONFLICT: this board or your access changed. Reload before saving; your edits are kept."); }

/** Original personal Dashboard authoring, reused by native and selected-business
 * Studio adapters. No business-shared publication or result cache. Caller supplies
 * a genuine authenticated server Session; owner/tenant identity is never input. */
export async function saveAnalyticsDashboardForSession(authenticated: Session, input: unknown): Promise<string> {
  if (!sessionAuthorityStamp(authenticated)) throw new Error("FORBIDDEN: current authenticated company access is required.");
  assertCapability(authenticated, "analytics.dashboard.manage");
  try {
    return await db.$transaction(tx => saveAnalyticsDashboardInTransaction(authenticated, tx, input), { isolationLevel: "Serializable" });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      const metadata = sqlFailure.safeParse(error.meta), state = metadata.success ? metadata.data.code ?? metadata.data.driverAdapterError?.cause?.originalCode : undefined;
      if (error.code === "P2034" || (error.code === "P2010" && state !== undefined && ["40001", "40P01"].includes(state))) conflict();
    }
    throw error;
  }
}

/** Existing Serializable Tx entry. Fresh identity/capabilities/modules stay under
 * original shared locks through validation, owner timestamp CAS and Audit. Only
 * source metadata is inspected; no business row, chart query or formula executes.
 * Existing genuine Atlas staff module-availability exception is preserved. */
export async function saveAnalyticsDashboardInTransaction(authenticated: Session, transaction: Prisma.TransactionClient, input: unknown): Promise<string> {
  const { session } = await nativeFieldMutationSessionInTransaction(authenticated, transaction);
  assertCapability(session, "analytics.dashboard.manage");
  if (!session.capabilities.has(ATLAS_CAPABILITIES.staff) && !await transaction.moduleState.findFirst({ where: {
    organisationId: session.organisationId, moduleId: "analytics", enabled: true, entitled: true }, select: { id: true } }))
    throw new Error("This app is disabled in your workspace.");
  const definition = dashboardSchema.parse(input);
  validateBoardFilters(definition.filters);
  const allowedMetrics = await getAnalyticsMetrics(session, transaction);
  const allowed = new Set(allowedMetrics.map((metric) => metric.id));
  if (
    definition.widgets.some(
      (widget) => !widget.data && !allowed.has(widget.metricId),
    )
  )
    throw new Error("A measure is no longer available to your account.");
  const sources = await reportDatasets(session, transaction);
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
    const saved = await transaction.dashboard.updateMany({
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
    const saved = await transaction.dashboard.create({
      data: {
        organisationId: session.organisationId,
        userId: session.userId,
        name,
        widgets,
      },
    });
    id = saved.id;
  }
  await writeAudit({ organisationId: session.organisationId, actorUserId: session.userId,
    action: "analytics.dashboard.saved", entityType: "Dashboard", entityId: id,
    after: { name: definition.name, widgetCount: definition.widgets.length } }, transaction);
  return id;
}
