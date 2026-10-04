import { requireSession } from "@/core/auth/session";
import { assertCapability } from "@/core/permissions/check";
import { SALES_CAPABILITIES } from "@/core/permissions/capabilities";
import { assertModuleEnabled } from "@/core/modules/access";
import { db } from "@/core/db/client";
import { csvResponse } from "@/core/shared/csv-export";
import { loadCrmReport, type ReportPeriod, type ReportStatus } from "@/modules/crm/services/report-pack";

export const runtime = "nodejs";

const PERIODS = new Set(["30", "90", "365", "all"]);
const STATUSES = new Set(["OPEN", "WON", "LOST"]);

export async function GET(request: Request) {
  const session = await requireSession();
  assertCapability(session, SALES_CAPABILITIES.reportRead);
  await assertModuleEnabled(session, "crm");
  const params = new URL(request.url).searchParams;
  const period = PERIODS.has(params.get("period") ?? "") ? (params.get("period") as ReportPeriod) : "90";
  const status = STATUSES.has(params.get("status") ?? "") ? (params.get("status") as ReportStatus) : undefined;
  const [members, industries, pipeline] = await Promise.all([
    db.membership.findMany({ where: { organisationId: session.organisationId }, include: { user: { select: { name: true } } } }),
    db.crmIndustry.findMany({ where: { organisationId: session.organisationId }, select: { id: true } }),
    db.pipelineStage.findMany({ where: { pipeline: { organisationId: session.organisationId } }, select: { id: true } }),
  ]);
  const ownerId = members.some((member) => member.userId === params.get("owner")) ? params.get("owner") ?? undefined : undefined;
  const industryId = industries.some((industry) => industry.id === params.get("industry")) ? params.get("industry") ?? undefined : undefined;
  const stageId = pipeline.some((stage) => stage.id === params.get("stage")) ? params.get("stage") ?? undefined : undefined;
  const report = await loadCrmReport(session.organisationId, { period, ownerId, status, stageId, industryId });
  const names = new Map(members.map((member) => [member.userId, member.user.name]));
  const rows: Array<Array<string | number>> = [
    ["Opportunity", "Customer", "Industry", "Tags", "Stage", "Status", "Owner", "Currency", "Value", "Expected close", "Actual close", "Loss reason"],
    ...report.opportunities.map((row) => [
      row.name,
      row.party.name,
      row.industry?.name ?? "",
      row.tags.join(", "),
      row.stage.name,
      row.status,
      names.get(row.ownerUserId) ?? "",
      row.valueCurrency,
      row.valueAmount / 100,
      row.expectedCloseDate ? row.expectedCloseDate.toISOString().slice(0, 10) : "",
      row.actualCloseDate ? row.actualCloseDate.toISOString().slice(0, 10) : "",
      row.lossReason?.label ?? "",
    ]),
  ];
  return csvResponse(`atlas-crm-report-${new Date().toISOString().slice(0, 10)}.csv`, rows);
}
