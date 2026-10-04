import Link from "next/link";
import { requireSession } from "@/core/auth/session";
import { QUALITY_CAPABILITIES } from "@/core/permissions/capabilities";
import { specificationList } from "@/modules/quality/services/queries";
import { DataTable } from "@/components/ui/table";
import { StatusPill } from "@/components/ui/status-pill";
import { label } from "@/modules/quality/domain/workflow";

export default async function Specifications() {
  const session = await requireSession();
  const specs = await specificationList();
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div><h2 className="text-2xl font-semibold">Specifications</h2><p className="text-sm text-slate-500">Version-controlled quality requirements.</p></div>
        {session.capabilities.has(QUALITY_CAPABILITIES.specManage) && <Link className="atlas-primary-button" href="/quality/specifications/new">New specification</Link>}
      </div>
      <DataTable rows={specs} getHref={(s) => `/quality/specifications/${s.id}`} emptyLabel="No specifications yet."
        columns={[
          { header: "Specification", render: (s) => <div><span className="font-medium">{s.code} / {s.revision}</span><p className="text-slate-500">{s.title}</p></div> },
          { header: "Product", render: (s) => s.product.name },
          { header: "Characteristics", render: (s) => s.characteristics.length },
          { header: "Status", render: (s) => <StatusPill label={label(s.status)} tone={s.status === "EFFECTIVE" ? "success" : s.status === "SUPERSEDED" ? "neutral" : "warning"} /> },
        ]} />
    </div>
  );
}
