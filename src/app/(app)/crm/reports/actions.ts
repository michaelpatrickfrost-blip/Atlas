"use server";

import { redirect } from "next/navigation";
import { requireSession } from "@/core/auth/session";
import { assertCapability } from "@/core/permissions/check";
import { SALES_CAPABILITIES } from "@/core/permissions/capabilities";
import { assertModuleEnabled } from "@/core/modules/access";
import { saveAnalyticsDashboard } from "@/app/(app)/analytics/actions";

const PERIODS = new Set(["30", "90", "365", "all"]);

export async function pinReportToDashboard(formData: FormData) {
  const session = await requireSession();
  assertCapability(session, SALES_CAPABILITIES.reportRead);
  await assertModuleEnabled(session, "crm");
  const name = String(formData.get("name") ?? "").trim();
  const period = String(formData.get("period") ?? "90");
  if (!PERIODS.has(period)) throw new Error("Choose a report period first.");
  const id = await saveAnalyticsDashboard({
    name,
    refreshSeconds: 30,
    widgets: [
      { id: "crm-pipeline-value", metricId: "crm.pipeline.value", visual: "column", wide: false, span: 4 },
      { id: "crm-winrate", metricId: "crm.winrate", visual: "gauge", wide: false, span: 4 },
      { id: "crm-stages", metricId: "crm.pipeline.stages", visual: "funnel", wide: false, span: 4 },
      { id: "crm-prospects", metricId: "crm.prospects.trend", visual: "line", wide: true, span: 8 },
    ],
  });
  redirect(`/analytics?dashboard=${id}&period=${period}`);
}
