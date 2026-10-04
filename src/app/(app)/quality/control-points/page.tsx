import Link from "next/link";
import { requireSession } from "@/core/auth/session";
import { QUALITY_CAPABILITIES } from "@/core/permissions/capabilities";
import { controlPointList } from "@/modules/quality/services/queries";
import { DataTable } from "@/components/ui/table";
import { StatusPill } from "@/components/ui/status-pill";
import { label } from "@/modules/quality/domain/workflow";

export default async function ControlPoints() {
  const session = await requireSession();
  const points = await controlPointList();
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div><h2 className="text-2xl font-semibold">Control Points</h2><p className="text-sm text-slate-500">Where and when checks trigger.</p></div>
        {session.capabilities.has(QUALITY_CAPABILITIES.controlPointManage) && <Link className="atlas-primary-button" href="/quality/control-points/new">New control point</Link>}
      </div>
      <DataTable rows={points} emptyLabel="No control points configured."
        columns={[
          { header: "Control point", render: (p) => <div><span className="font-medium">{p.code}</span><p className="text-slate-500">{p.name}</p></div> },
          { header: "Product", render: (p) => p.product?.name ?? "Any" },
          { header: "Trigger", render: (p) => label(p.trigger) },
          { header: "Specification", render: (p) => p.specification ? `${p.specification.code} / ${p.specification.revision}` : "—" },
          { header: "Status", render: (p) => <StatusPill label={p.active ? "Active" : "Inactive"} tone={p.active ? "success" : "neutral"} /> },
        ]} />
    </div>
  );
}
