import Link from "next/link";
import { requireSession } from "@/core/auth/session";
import { QUALITY_CAPABILITIES } from "@/core/permissions/capabilities";
import { ncrList } from "@/modules/quality/services/queries";
import { DataTable } from "@/components/ui/table";
import { StatusPill } from "@/components/ui/status-pill";
import { label } from "@/modules/quality/domain/workflow";

export default async function NcrList({ searchParams }: { searchParams: Promise<{ status?: string; severity?: string }> }) {
  const session = await requireSession();
  const params = await searchParams;
  const rows = await ncrList(params);
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div><h2 className="text-2xl font-semibold">Nonconformances</h2><p className="text-sm text-slate-500">Requirement not met: containment, root cause, corrective action.</p></div>
        {session.capabilities.has(QUALITY_CAPABILITIES.ncrReport) && <Link className="atlas-primary-button" href="/quality/ncr/new">Report NCR</Link>}
      </div>
      <DataTable rows={rows} getHref={(n) => `/quality/ncr/${n.id}`} emptyLabel="No nonconformances match these filters."
        columns={[
          { header: "NCR", render: (n) => <div><span className="font-medium">{n.number}</span><p className="text-slate-500">{n.title}</p></div> },
          { header: "Product", render: (n) => n.product?.name ?? "—" },
          { header: "Severity", render: (n) => <StatusPill label={label(n.severity)} tone={n.severity === "CRITICAL" ? "danger" : n.severity === "MAJOR" ? "warning" : "neutral"} /> },
          { header: "Status", render: (n) => <StatusPill label={label(n.status)} tone={n.status === "CLOSED" ? "success" : n.status === "OPEN" ? "warning" : "neutral"} /> },
          { header: "Hold", render: (n) => n.hold ? `${n.hold.number} (${label(n.hold.status)})` : "—" },
        ]} />
    </div>
  );
}
