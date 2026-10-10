import { ExportMenu } from '@/components/ui/export-menu';
import { ownerRestriction } from "@/modules/crm/services/visibility";
import type { ReactNode } from "react";
import { requireSession } from "@/core/auth/session";
import { assertCapability, can } from "@/core/permissions/check";
import { enabledModulesForSession } from "@/core/modules/runtime";
import { SALES_CAPABILITIES } from "@/core/permissions/capabilities";
import { db } from "@/core/db/client";
import { formatMoney } from "@/core/shared/money";
import { Button } from "@/components/ui/button";
import { listIndustries } from "@/modules/crm/services/prospects-queries";
import { getDefaultPipeline } from "@/modules/crm/services/pipelines";
import { loadCrmReport, moneyByCurrency, type ReportPeriod, type ReportStatus } from "@/modules/crm/services/report-pack";
import { pinReportToDashboard } from "./actions";

const PERIODS = new Set<ReportPeriod>(["30", "90", "365", "all"]);
const STATUSES = new Set<ReportStatus>(["OPEN", "WON", "LOST"]);

export default async function ReportsPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const session = await requireSession();
  assertCapability(session, SALES_CAPABILITIES.reportRead);
  const enabled = await enabledModulesForSession(session);
  const canPin = enabled.has("analytics") && can(session, "analytics.dashboard.manage");
  const params = await searchParams;
  const [members, industries, pipeline] = await Promise.all([
    db.membership.findMany({ where: { organisationId: session.organisationId }, include: { user: { select: { id: true, name: true } } }, orderBy: { user: { name: "asc" } } }),
    listIndustries(session.organisationId),
    getDefaultPipeline(session.organisationId),
  ]);
  const period: ReportPeriod = PERIODS.has(params.period as ReportPeriod) ? (params.period as ReportPeriod) : "90";
  const status = STATUSES.has(params.status as ReportStatus) ? (params.status as ReportStatus) : undefined;
  const ownerOnly = ownerRestriction(session);
  const ownerId = ownerOnly ?? (members.some((member) => member.userId === params.owner) ? params.owner : undefined);
  const industryId = industries.some((industry) => industry.id === params.industry) ? params.industry : undefined;
  const stageId = pipeline?.stages.some((stage) => stage.id === params.stage) ? params.stage : undefined;
  const report = await loadCrmReport(session.organisationId, { period, ownerId, status, industryId, stageId });
  const names = new Map(members.map((member) => [member.userId, member.user.name]));
  const query = new URLSearchParams();
  query.set("period", period);
  if (ownerId) query.set("owner", ownerId);
  if (status) query.set("status", status);
  if (industryId) query.set("industry", industryId);
  if (stageId) query.set("stage", stageId);
  const wonTotals = moneyByCurrency(report.won);
  const lostTotals = moneyByCurrency(report.lost);
  const openTotals = moneyByCurrency(report.open);
  const winRate = report.closed.length ? Math.round((report.won.length / report.closed.length) * 100) : null;
  const maxStage = Math.max(1, ...report.open.map(() => 1), ... (pipeline?.stages.map((stage) => report.open.filter((row) => row.stageId === stage.id).length) ?? [1]));

  return (
    <div className="mx-auto flex w-full min-w-0 max-w-5xl flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl font-semibold tracking-tight text-[#1d1d1f]">Reports</h1>
          <p className="mt-1 text-sm text-[#6e6e73]">Filter the book and download it. Boards open in Dashboards.</p>
        </div>
        <ExportMenu href={`/api/crm/reports?${query.toString()}`}/>
      </div>

      <form className="grid gap-3 rounded-3xl border border-black/[0.04] bg-white p-4 shadow-[0_12px_32px_-24px_rgba(0,0,0,0.35)] sm:grid-cols-2 lg:grid-cols-6">
        <Field label="Period">
          <select name="period" defaultValue={period} className="crm-field">
            <option value="30">Last 30 days</option>
            <option value="90">Last 90 days</option>
            <option value="365">Last year</option>
            <option value="all">All time</option>
          </select>
        </Field>
        <Field label="Owner">
          <select name="owner" defaultValue={ownerId ?? ""} className="crm-field">
            <option value="">Everyone</option>
            {members.map((member) => <option key={member.userId} value={member.userId}>{member.user.name}</option>)}
          </select>
        </Field>
        <Field label="Status">
          <select name="status" defaultValue={status ?? ""} className="crm-field">
            <option value="">All</option>
            <option value="OPEN">Open</option>
            <option value="WON">Won</option>
            <option value="LOST">Lost</option>
          </select>
        </Field>
        <Field label="Industry">
          <select name="industry" defaultValue={industryId ?? ""} className="crm-field">
            <option value="">All industries</option>
            {industries.map((industry) => <option key={industry.id} value={industry.id}>{industry.name}</option>)}
          </select>
        </Field>
        <Field label="Stage">
          <select name="stage" defaultValue={stageId ?? ""} className="crm-field">
            <option value="">All stages</option>
            {pipeline?.stages.map((stage) => <option key={stage.id} value={stage.id}>{stage.name}</option>)}
          </select>
        </Field>
        <div className="flex items-end">
          <Button type="submit" variant="primary" className="w-full">Apply</Button>
        </div>
      </form>

      <div className="grid gap-3 sm:grid-cols-3">
        <Metric label="Win rate" value={winRate == null ? "—" : `${winRate}%`} detail={`${report.won.length} won of ${report.closed.length} closed`} />
        <Metric label="Won" value={formatTotals(wonTotals)} detail="Closed in the selected period" />
        <Metric label="Open pipeline" value={formatTotals(openTotals)} detail={`${report.open.length} open opportunities`} />
      </div>

      <section className="rounded-3xl border border-black/[0.04] bg-white p-6">
        <h2 className="text-sm font-semibold text-[#1d1d1f]">Funnel</h2>
        <div className="mt-4 space-y-4">
          <Bar label="Prospects" count={report.prospectCount} of={Math.max(report.prospectCount, 1)} />
          <Bar label="Qualified or converted" count={report.qualifiedCount} of={Math.max(report.prospectCount, 1)} />
          <Bar label="Won" count={report.won.length} of={Math.max(report.prospectCount, report.won.length, 1)} />
        </div>
      </section>

      <section className="rounded-3xl border border-black/[0.04] bg-white p-6">
        <h2 className="text-sm font-semibold text-[#1d1d1f]">Pipeline by stage</h2>
        <div className="mt-4 space-y-4">
          {pipeline?.stages.map((stage) => {
            const rows = report.open.filter((row) => row.stageId === stage.id);
            return <Bar key={stage.id} label={stage.name} count={rows.length} of={maxStage} extra={formatTotals(moneyByCurrency(rows))} />;
          })}
          {!pipeline && <p className="text-sm text-[#6e6e73]">No pipeline yet.</p>}
        </div>
      </section>

      <section className="grid gap-3 lg:grid-cols-2">
        <section className="rounded-3xl border border-black/[0.04] bg-white p-6">
          <h2 className="text-sm font-semibold text-[#1d1d1f]">Loss reasons</h2>
          <p className="mt-1 text-xs text-[#6e6e73]">{formatTotals(lostTotals)} lost in this view</p>
          <div className="mt-4 divide-y divide-black/[0.06]">
            {groupCount(report.lost.map((row) => row.lossReason?.label ?? "Unspecified")).map((row) => (
              <div key={row.label} className="flex items-center justify-between py-3 text-sm">
                <span>{row.label}</span>
                <span className="text-[#6e6e73]">{row.count}</span>
              </div>
            ))}
            {!report.lost.length && <p className="py-3 text-sm text-[#6e6e73]">No losses in this view.</p>}
          </div>
        </section>
        <section className="rounded-3xl border border-black/[0.04] bg-white p-6">
          <h2 className="text-sm font-semibold text-[#1d1d1f]">By industry</h2>
          <div className="mt-4 divide-y divide-black/[0.06]">
            {groupCount(report.opportunities.map((row) => row.industry?.name ?? "No industry")).map((row) => (
              <div key={row.label} className="flex items-center justify-between py-3 text-sm">
                <span>{row.label}</span>
                <span className="text-[#6e6e73]">{row.count}</span>
              </div>
            ))}
            {!report.opportunities.length && <p className="py-3 text-sm text-[#6e6e73]">Nothing matches these filters.</p>}
          </div>
        </section>
      </section>

      <section className="overflow-hidden rounded-3xl border border-black/[0.04] bg-white">
        <div className="flex items-center justify-between px-6 py-4">
          <h2 className="text-sm font-semibold text-[#1d1d1f]">Opportunities</h2>
          <span className="text-xs text-[#6e6e73]">{report.opportunities.length}{report.truncated ? "+" : ""}</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="text-xs text-[#6e6e73]">
              <tr>
                <th className="px-6 py-2 font-medium">Opportunity</th>
                <th className="px-3 py-2 font-medium">Industry</th>
                <th className="px-3 py-2 font-medium">Stage</th>
                <th className="px-3 py-2 font-medium">Status</th>
                <th className="px-6 py-2 text-right font-medium">Value</th>
              </tr>
            </thead>
            <tbody>
              {report.opportunities.slice(0, 40).map((row) => (
                <tr key={row.id} className="border-t border-black/[0.06]">
                  <td className="px-6 py-3">
                    <a href={`/crm/opportunities/${row.id}`} className="font-medium text-[#1d1d1f]">{row.name}</a>
                    <p className="text-xs text-[#6e6e73]">{row.party.name} · {names.get(row.ownerUserId) ?? "Owner"}</p>
                  </td>
                  <td className="px-3 py-3 text-[#6e6e73]">{row.industry?.name ?? "—"}</td>
                  <td className="px-3 py-3">{row.stage.name}</td>
                  <td className="px-3 py-3">{row.status}</td>
                  <td className="px-6 py-3 text-right">{formatMoney(row.valueAmount, row.valueCurrency)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {canPin ? (
        <form action={pinReportToDashboard} className="flex flex-wrap items-end gap-3 rounded-3xl border border-black/[0.04] bg-white p-5">
          <input type="hidden" name="period" value={period} />
          <label className="min-w-64 flex-1 text-sm text-[#1d1d1f]">
            Dashboard name
            <input name="name" required maxLength={70} defaultValue="CRM report" className="mt-1.5 w-full" />
          </label>
          <Button type="submit" variant="primary">Open in Dashboards</Button>
          <p className="basis-full text-xs text-[#6e6e73]">Sends the CRM measures to Dashboards for this period. Owner, industry and stage stay on this report.</p>
        </form>
      ) : (
        <p className="text-sm text-[#6e6e73]">This report stays in CRM. Turn on Dashboards to put the same measures on a board.</p>
      )}
    </div>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="min-w-0 text-xs font-medium text-[#6e6e73]">
      {label}
      <span className="mt-1.5 block min-w-0">{children}</span>
    </label>
  );
}

function Metric({ label, value, detail }: { label: string; value: string; detail: string }) {
  return (
    <section className="rounded-3xl border border-black/[0.04] bg-white p-5">
      <p className="text-xs text-[#6e6e73]">{label}</p>
      <p className="mt-2 text-2xl font-semibold tracking-tight text-[#1d1d1f]">{value}</p>
      <p className="mt-1 text-xs text-[#6e6e73]">{detail}</p>
    </section>
  );
}

function Bar({ label, count, of, extra }: { label: string; count: number; of: number; extra?: string }) {
  const width = Math.max(0, Math.min(100, Math.round((count / of) * 100)));
  return (
    <div>
      <div className="mb-1.5 flex items-baseline justify-between gap-3 text-sm">
        <span className="text-[#1d1d1f]">{label}</span>
        <span className="text-[#6e6e73]">{count}{extra ? ` · ${extra}` : ""}</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-[#eef1f6]">
        <div className="h-full rounded-full bg-[#0a3d8f]" style={{ width: `${width}%` }} />
      </div>
    </div>
  );
}

function formatTotals(totals: Record<string, number>) {
  const entries = Object.entries(totals);
  if (!entries.length) return "—";
  return entries.map(([currency, amount]) => formatMoney(amount, currency)).join(" · ");
}

function groupCount(labels: string[]) {
  const counts = new Map<string, number>();
  for (const label of labels) counts.set(label, (counts.get(label) ?? 0) + 1);
  return [...counts.entries()].map(([label, count]) => ({ label, count })).sort((a, b) => b.count - a.count);
}
