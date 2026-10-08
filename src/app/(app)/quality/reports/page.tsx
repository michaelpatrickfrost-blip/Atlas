import { qualityReports } from "@/modules/quality/services/queries";

export default async function QualityReports() {
  const report = await qualityReports();
  const maxCount = Math.max(1, ...report.pareto.map((p) => p.count));
  return (
    <div className="max-w-3xl space-y-6">
      <div><h2 className="text-2xl font-semibold">Quality Reports</h2><p className="text-sm text-slate-500">Issue and inspection activity: last 90 days. Open issue ageing and unresolved actions: all dates.</p></div>

      <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-2xl border bg-white p-4"><p className="text-xs text-slate-500">Inspection pass rate</p><p className="text-2xl font-semibold">{report.firstPassYield !== null ? `${report.firstPassYield}%` : "—"}</p><p className="text-xs text-slate-500">{report.totalInspections} inspections</p></div>
        <div className="rounded-2xl border bg-white p-4"><p className="text-xs text-slate-500">NCRs reported</p><p className="text-2xl font-semibold">{report.ncrCount}</p></div>
        <div className="rounded-2xl border bg-white p-4"><p className="text-xs text-slate-500">Overdue corrective actions</p><p className="text-2xl font-semibold">{report.overdueActions}</p></div>
      </section>

      <section className="rounded-2xl border bg-white p-5"><h2 className="font-semibold">Sources of quality issues</h2><div className="mt-3 grid gap-3 sm:grid-cols-2">{report.sources.map(([source,count])=><p key={source} className="text-sm">{source.toLowerCase().replaceAll("_"," ")}: {count}</p>)}</div><p className="mt-3 text-sm">Effectiveness reviews due: {report.reviewsDue}</p></section>
      <section className="space-y-2 rounded-2xl border bg-white p-5">
        <p className="text-sm font-semibold">Defect Pareto</p>
        {report.pareto.length === 0 ? <p className="text-sm text-slate-500">No defects recorded in this period.</p> : (
          <div className="space-y-2">
            {report.pareto.map((row) => (
              <div key={row.defect} className="flex items-center gap-3 text-sm">
                <span className="w-40 truncate">{row.defect}</span>
                <div className="h-3 flex-1 rounded-full bg-slate-100">
                  <div className="h-3 rounded-full bg-[var(--color-atlas-blue)]" style={{ width: `${(row.count / maxCount) * 100}%` }} />
                </div>
                <span className="w-8 text-right">{row.count}</span>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="space-y-2 rounded-2xl border bg-white p-5">
        <p className="text-sm font-semibold">Open issue ageing — all dates</p>
        <div className="grid grid-cols-4 gap-3 text-center text-sm">
          {Object.entries(report.ageing).map(([bucket, count]) => (
            <div key={bucket} className="rounded-xl border p-3"><p className="text-xs text-slate-500">{bucket} days</p><p className="text-xl font-semibold">{count}</p></div>
          ))}
        </div>
      </section>
    </div>
  );
}
