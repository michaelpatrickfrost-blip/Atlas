import { db } from "@/core/db/client";
import { getDefaultPipeline } from "@/modules/crm/services/pipelines";

export type ReportPeriod = "30" | "90" | "365" | "all";
export type ReportStatus = "OPEN" | "WON" | "LOST";

export type ReportQuery = {
  period: ReportPeriod;
  ownerId?: string;
  status?: ReportStatus;
  stageId?: string;
  industryId?: string;
};

export function sinceForPeriod(period: ReportPeriod) {
  if (period === "all") return undefined;
  return new Date(Date.now() - Number(period) * 86_400_000);
}

export async function loadCrmReport(organisationId: string, query: ReportQuery) {
  const since = sinceForPeriod(query.period);
  const where = {
    organisationId,
    ownerUserId: query.ownerId,
    status: query.status,
    stageId: query.stageId,
    industryId: query.industryId,
  };
  const [opportunities, prospectCount, qualifiedCount, pipeline] = await Promise.all([
    db.opportunity.findMany({
      where,
      include: {
        party: { select: { name: true } },
        stage: { select: { id: true, name: true, order: true } },
        industry: { select: { id: true, name: true } },
        lossReason: { select: { label: true } },
      },
      orderBy: { updatedAt: "desc" },
      take: 5000,
    }),
    db.prospect.count({
      where: {
        organisationId,
        ownerUserId: query.ownerId,
        industryId: query.industryId,
        lifecycleStage: { not: "CONVERTED" },
        createdAt: since ? { gte: since } : undefined,
      },
    }),
    db.prospect.count({
      where: {
        organisationId,
        ownerUserId: query.ownerId,
        industryId: query.industryId,
        lifecycleStage: { in: ["QUALIFIED", "CONVERTED"] },
        createdAt: since ? { gte: since } : undefined,
      },
    }),
    getDefaultPipeline(organisationId),
  ]);

  const open = opportunities.filter((row) => row.status === "OPEN");
  const closed = opportunities.filter((row) => row.status !== "OPEN" && (!since || (row.actualCloseDate != null && row.actualCloseDate >= since)));
  const won = closed.filter((row) => row.status === "WON");
  const lost = closed.filter((row) => row.status === "LOST");
  return { opportunities, open, won, lost, closed, prospectCount, qualifiedCount, pipeline, truncated: opportunities.length === 5000 };
}

export function moneyByCurrency(rows: { valueCurrency: string; valueAmount: number }[]) {
  return rows.reduce<Record<string, number>>((totals, row) => {
    totals[row.valueCurrency] = (totals[row.valueCurrency] ?? 0) + row.valueAmount;
    return totals;
  }, {});
}
