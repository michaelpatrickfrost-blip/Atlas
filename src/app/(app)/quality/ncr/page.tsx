import Link from "next/link";
import { requireSession } from "@/core/auth/session";
import { QUALITY_CAPABILITIES } from "@/core/permissions/capabilities";
import { ncrList } from "@/modules/quality/services/queries";
import { DataTable } from "@/components/ui/table";
import { StatusPill } from "@/components/ui/status-pill";
import { NCR_STATUSES, NCR_SEVERITIES, label } from "@/modules/quality/domain/workflow";

export default async function NcrList({ searchParams }: { searchParams: Promise<{ status?: string; severity?: string; q?:string; mine?:string; due?:string }> }) {
  const session = await requireSession();
  const params = await searchParams;
  const result = await ncrList(params);
  const rows=result.slice(0,200);
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div><h2 className="text-2xl font-semibold">Nonconformances</h2><p className="text-sm text-slate-500">Requirement not met: containment, root cause, corrective action.</p></div>
        {session.capabilities.has(QUALITY_CAPABILITIES.ncrReport) && <Link className="atlas-primary-button" href="/quality/ncr/new">Report NCR</Link>}
      </div>
      <form method="get" className="grid gap-3 rounded-2xl border bg-white p-4 md:grid-cols-5"><label className="text-sm">Search<input aria-label="Search quality issues" name="q" defaultValue={params.q} className="w-full rounded-xl border p-2"/></label><label className="text-sm">Status<select aria-label="Status filter" name="status" defaultValue={params.status??""} className="w-full rounded-xl border p-2"><option value="">All</option>{NCR_STATUSES.map(item=><option key={item} value={item}>{label(item)}</option>)}</select></label><label className="text-sm">Severity<select aria-label="Severity filter" name="severity" defaultValue={params.severity??""} className="w-full rounded-xl border p-2"><option value="">All</option>{NCR_SEVERITIES.map(item=><option key={item} value={item}>{label(item)}</option>)}</select></label><div className="space-y-2 text-sm"><label className="flex gap-2"><input type="checkbox" name="mine" value="1" defaultChecked={params.mine==="1"}/>Assigned to me</label><label className="flex gap-2"><input type="checkbox" name="due" value="overdue" defaultChecked={params.due==="overdue"}/>Overdue</label></div><button type="submit" className="self-end rounded-xl border p-2 text-sm">Filter issues</button></form>
      {result.length>200&&<p className="text-sm text-slate-500">Showing 200 records. Narrow the filters to find older work.</p>}
      <DataTable rows={rows} getHref={(n) => `/quality/ncr/${n.id}`} emptyLabel="No nonconformances match these filters."
        columns={[
          { header: "NCR", render: (n) => <div><span className="font-medium">{n.number}</span><p className="text-slate-500">{n.title}</p></div> },
          { header: "Product", render: (n) => n.product?.name ?? "—" },
          { header: "Severity", render: (n) => <StatusPill label={label(n.severity)} tone={n.severity === "CRITICAL" ? "danger" : n.severity === "MAJOR" ? "warning" : "neutral"} /> },
          { header: "Status", render: (n) => <StatusPill label={label(n.status)} tone={n.status === "CLOSED" ? "success" : n.status === "OPEN" ? "warning" : "neutral"} /> },
          { header: "Target / actions", render: n => <span>{n.dueAt?.toLocaleDateString("en-GB",{timeZone:"UTC"})??"No target date"} · {n._count.actions} actions</span> },
          { header: "Hold", render: (n) => n.hold ? `${n.hold.number} (${label(n.hold.status)})` : "—" },
        ]} />
    </div>
  );
}
