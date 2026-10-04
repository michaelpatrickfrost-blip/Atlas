import { requireSession } from "@/core/auth/session";
import { metricByKey } from "@/modules/plan/domain/catalogue";
import { planRecord } from "@/modules/plan/services/queries";

export async function GET(_request: Request, context: { params: Promise<{ planId: string }> }) {
  const session = await requireSession();
  const { planId } = await context.params;
  const plan = await planRecord(session, planId);
  const lines = ["metric,period,dimension,kind,value,version"];
  for (const cell of plan.cells) {
    const metric = metricByKey(cell.metricKey);
    const shown = metric?.unit === "money" ? Number(cell.value) / 100 : Number(cell.value);
    lines.push([cell.metricKey, cell.periodKey, cell.dimensionLabel, cell.kind, shown, plan.versions.find((version) => version.id === cell.versionId)?.name ?? ""].map((value) => `"${String(value).replaceAll('"', '""')}"`).join(","));
  }
  return new Response(lines.join("\n"), { headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="${plan.name.replaceAll(/[^a-z0-9]+/gi, "-").toLowerCase()}.csv"` } });
}
