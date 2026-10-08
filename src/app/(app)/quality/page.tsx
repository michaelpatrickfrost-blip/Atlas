import { requireSession } from "@/core/auth/session";
import { QUALITY_CAPABILITIES as C } from "@/core/permissions/capabilities";
import Link from "next/link";
import { qualityToday } from "@/modules/quality/services/queries";
import { StatusPill } from "@/components/ui/status-pill";
import { label } from "@/modules/quality/domain/workflow";

export default async function QualityToday() {
  const session=await requireSession();const allow=(cap:string)=>session.capabilities.has(cap);
  const { activeHolds, openNcr, criticalNcr, overdueActions, recentInspections } = await qualityToday();
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold">Quality</h2>
        <p className="text-sm text-slate-500">Contain problems, investigate causes and check that corrective actions worked.</p><div className="mt-4 flex flex-wrap gap-3 text-sm">{allow(C.ncrReport)&&<Link href="/quality/ncr/new" className="atlas-primary-button">Report quality issue</Link>}{allow(C.ncrRead)&&<><Link href="/quality/ncr" className="rounded-xl border px-4 py-2">Issue register</Link><Link href="/quality/actions" className="rounded-xl border px-4 py-2">Corrective actions</Link></>}{allow(C.checkExecute)&&<Link href="/quality/checks" className="rounded-xl border px-4 py-2">Run inspection</Link>}</div>
      </div>

      {criticalNcr > 0 && (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {criticalNcr} critical NCR{criticalNcr === 1 ? "" : "s"} open.{" "}
          <Link className="underline" href="/quality/ncr?severity=CRITICAL">Review now</Link>
        </div>
      )}

      {allow(C.holdRead)&&<section className="space-y-3">
        <h3 className="text-sm font-semibold text-slate-600">Active quality holds ({activeHolds.length})</h3>
        {activeHolds.length === 0 ? <p className="text-sm text-slate-500">Nothing on hold.</p> : (
          <div className="divide-y rounded-2xl border bg-white">
            {activeHolds.map((hold) => (
              <Link key={hold.id} href="/quality/holds" className="flex items-center justify-between px-4 py-3 text-sm hover:bg-slate-50">
                <span><span className="font-medium">{hold.number}</span> · {hold.product.name} · {hold.quantity} units</span>
                <span className="text-slate-500">{hold.reason}</span>
              </Link>
            ))}
          </div>
        )}
      </section>}

      {allow(C.ncrRead)&&<section className="space-y-3">
        <h3 className="text-sm font-semibold text-slate-600">Open NCRs ({openNcr.length})</h3>
        {openNcr.length === 0 ? <p className="text-sm text-slate-500">No open nonconformances.</p> : (
          <div className="divide-y rounded-2xl border bg-white">
            {openNcr.map((ncr) => (
              <Link key={ncr.id} href={`/quality/ncr/${ncr.id}`} className="flex items-center justify-between px-4 py-3 text-sm hover:bg-slate-50">
                <span><span className="font-medium">{ncr.number}</span> {ncr.title}</span>
                <StatusPill label={label(ncr.status)} tone={ncr.severity === "CRITICAL" ? "danger" : ncr.status === "OPEN" ? "warning" : "neutral"} />
              </Link>
            ))}
          </div>
        )}
      </section>}

      {allow(C.ncrRead)&&<section className="space-y-3">
        <h3 className="text-sm font-semibold text-slate-600">Actions and reviews due ({overdueActions.length})</h3>
        {overdueActions.length === 0 ? <p className="text-sm text-slate-500">Nothing due.</p> : (
          <div className="divide-y rounded-2xl border bg-white">
            {overdueActions.map((action) => (
              <Link key={action.id} href={`/quality/ncr/${action.ncrId}`} className="flex items-center justify-between px-4 py-3 text-sm hover:bg-slate-50">
                <span>{action.ncr.number} · {action.description}</span>
                <span className="text-slate-500">{action.effectivenessReviewDate?.toLocaleDateString("en-GB")}</span>
              </Link>
            ))}
          </div>
        )}
      </section>}

      {allow(C.checkExecute)&&<section className="space-y-3">
        <h3 className="text-sm font-semibold text-slate-600">Recent inspections</h3>
        {recentInspections.length === 0 ? <p className="text-sm text-slate-500">No inspections recorded yet.</p> : (
          <div className="divide-y rounded-2xl border bg-white">
            {recentInspections.map((i) => (
              <Link href={`/quality/checks/${i.id}`} key={i.id} className="flex items-center justify-between px-4 py-3 text-sm">
                <span>{i.number} · {i.product.name}</span>
                <StatusPill label={label(i.result)} tone={i.result === "FAIL" ? "danger" : i.result === "PASS" ? "success" : "neutral"} />
              </Link>
            ))}
          </div>
        )}
      </section>}
    </div>
  );
}
