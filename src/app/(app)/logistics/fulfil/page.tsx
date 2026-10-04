import { ActionForm } from "@/components/ui/action-form";
import Link from "next/link";
import { requireSession } from "@/core/auth/session";
import { assertCapability, can } from "@/core/permissions/check";
import { LOGISTICS_CAPABILITIES as C } from "@/core/permissions/capabilities";
import { fulfilBoard } from "@/modules/logistics/services/queries";
import { groupAction } from "../actions";
import { LivePulse } from "@/modules/logistics/components/live";

export default async function FulfilPage({ searchParams }: { searchParams: Promise<{ view?: string }> }) {
  const session = await requireSession();
  assertCapability(session, C.fulfilmentRead);
  const { view } = await searchParams;
  const board = await fulfilBoard(session.organisationId, view);
  return (
    <div className="space-y-8">
      <LivePulse />
      <header><h1 className="text-3xl font-semibold tracking-tight">Fulfil</h1><p className="mt-2 text-sm text-[var(--color-ink-muted)]">Demand the warehouse can act on. Release when it should be picked, not merely because Sales confirmed it.</p></header>
      <div className="grid gap-3 sm:grid-cols-5">
        {board.buckets.map((bucket) => (
          <Link key={bucket.label} href={bucket.view ? `/logistics/fulfil?view=${bucket.view}` : "/logistics/fulfil"} className="rounded-2xl border border-[var(--color-border)] bg-white px-4 py-4">
            <p className="text-2xl font-semibold tabular-nums">{bucket.value}</p>
            <p className="mt-1 text-xs text-[var(--color-ink-muted)]">{bucket.label}</p>
          </Link>
        ))}
      </div>
      <ActionForm action={groupAction} className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          {can(session, C.fulfilmentRelease) && <>
            <select name="method" className="rounded-full border border-[var(--color-border)] bg-white px-3 py-2 text-sm"><option value="BATCH">Batch</option><option value="WAVE">Wave</option><option value="CLUSTER">Cluster</option><option value="ZONE">Zone</option></select>
            <button className="rounded-full bg-[var(--color-atlas-blue)] px-4 py-2 text-sm font-semibold text-white" type="submit">Create pick</button>
          </>}
          <div className="ml-auto flex gap-3 text-xs text-[var(--color-ink-muted)]">
            {[["Due today", ""], ["At risk", "risk"], ["Awaiting stock", "stock"], ["Credit hold", "hold"], ["Ready to pick", "ready"], ["Short picks", "short"]].map(([label, key]) => <Link key={label} href={key ? `/logistics/fulfil?view=${key}` : "/logistics/fulfil"} className={view === key || (!view && !key) ? "text-[var(--color-ink)]" : ""}>{label}</Link>)}
          </div>
        </div>
        <div className="overflow-hidden rounded-3xl border border-[var(--color-border)] bg-white">
          <table className="w-full text-left text-sm">
            <thead className="bg-[var(--color-surface-sunken)] text-xs text-[var(--color-ink-muted)]"><tr><th className="px-4 py-3"></th><th className="px-4 py-3">Order</th><th>Customer PO</th><th>Customer</th><th>Requested</th><th>Promise</th><th>Progress</th><th>Status</th></tr></thead>
            <tbody>
              {board.rows.map((row) => {
                const required = row.lines.reduce((sum, line) => sum + Math.max(0, line.orderedQuantity - line.cancelledQuantity), 0);
                const allocated = row.lines.reduce((sum, line) => sum + line.allocatedQuantity, 0);
                return (
                  <tr key={row.id} className="border-t border-[var(--color-border)]">
                    <td className="px-4 py-3">{can(session, C.fulfilmentRelease) && <input type="checkbox" disabled={required === 0 || Boolean(row.holdSummary) || row.fulfilmentMode !== "WAREHOUSE"} name="id" value={row.id} aria-label={`Select ${row.reference}`} />}</td>
                    <td className="px-4 py-3 font-medium"><Link href={`/logistics/fulfil/${row.id}`}>{row.reference}</Link><p className="text-xs text-[var(--color-ink-muted)]">{row.salesOrder.reference}</p></td>
                    <td>{row.salesOrder.customerPoReference ?? "—"}</td>
                    <td>{row.party.name}</td>
                    <td>{row.salesOrder.requestedDeliveryDate?.toLocaleDateString("en-GB") ?? row.requestedOn?.toLocaleDateString("en-GB") ?? "—"}</td>
                    <td>{row.promisedOn?.toLocaleDateString("en-GB") ?? "—"}</td>
                    <td>{allocated}/{required} allocated</td>
                    <td className={row.holdSummary || row.lines.some((line) => line.allocationStatus === "SHORT") ? "text-amber-700" : ""}>{row.holdSummary ?? row.status.replaceAll("_", " ")}</td>
                  </tr>
                );
              })}
              {board.rows.length === 0 && <tr><td colSpan={8} className="px-4 py-8 text-[var(--color-ink-muted)]">Confirmed sales orders will appear here. Nothing is waiting.</td></tr>}
            </tbody>
          </table>
        </div>
      </ActionForm>
    </div>
  );
}
