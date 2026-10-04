import { ActionForm } from "@/components/ui/action-form";
import Link from "next/link";
import { requireSession } from "@/core/auth/session";
import { assertCapability, can } from "@/core/permissions/check";
import { LOGISTICS_CAPABILITIES as C } from "@/core/permissions/capabilities";
import { dispatchBoard } from "@/modules/logistics/services/queries";
import { CourierExport } from "@/modules/logistics/components/courier-export";
import { loadCreateAction } from "../actions";
import { LivePulse } from "@/modules/logistics/components/live";

export default async function DispatchPage() {
  const session = await requireSession();
  assertCapability(session, C.shipmentRead);
  const board = await dispatchBoard(session.organisationId);
  return (
    <div className="space-y-8">
      <LivePulse />
      <header><h1 className="text-3xl font-semibold tracking-tight">Dispatch</h1><p className="mt-2 text-sm text-[var(--color-ink-muted)]">What must leave, and what is blocked.</p></header>
      <div className="grid gap-3 sm:grid-cols-4">
        {board.groups.map((group) => <div key={group.carrier} className="rounded-2xl border border-[var(--color-border)] bg-white px-4 py-4"><p className="text-3xl font-semibold">{group.count}</p><p className="text-sm text-[var(--color-ink-muted)]">{group.carrier.replaceAll("_", " ")}</p></div>)}
        <div className="rounded-2xl border border-[var(--color-border)] bg-white px-4 py-4"><p className="text-3xl font-semibold">{board.missed}</p><p className="text-sm text-[var(--color-ink-muted)]">Exceptions</p></div>
      </div>
      <ActionForm action={loadCreateAction} className="space-y-3">
        {can(session, C.routeManage) && <div className="flex flex-wrap gap-2"><input name="vehicle" placeholder="Vehicle" className="rounded-full border px-4 py-2 text-sm" /><input name="driver" placeholder="Driver" className="rounded-full border px-4 py-2 text-sm" /><input name="route" placeholder="Route" className="rounded-full border px-4 py-2 text-sm" /><button className="rounded-full border px-4 py-2 text-sm" type="submit">Create load</button></div>}
        <div className="overflow-hidden rounded-3xl border border-[var(--color-border)] bg-white">
          <table className="w-full text-sm"><thead className="text-left text-xs text-[var(--color-ink-muted)]"><tr><th className="px-4 py-3"></th><th>Shipment</th><th>Customer</th><th>Carrier</th><th>Status</th></tr></thead>
            <tbody>{board.shipments.map((row) => <tr key={row.id} className="border-t border-[var(--color-border)]"><td className="px-4 py-3">{can(session, C.routeManage) && <input type="checkbox" name="shipment" value={row.id} aria-label={row.reference} />}</td><td className="font-medium"><Link href={`/logistics/shipments/${row.id}`}>{row.reference}</Link></td><td>{row.party.name}</td><td>{row.carrierCode}</td><td>{row.status}</td></tr>)}
            {board.shipments.length === 0 && <tr><td colSpan={5} className="px-4 py-8 text-[var(--color-ink-muted)]">Nothing is waiting to leave.</td></tr>}</tbody>
          </table>
        </div>
      </ActionForm>
      <CourierExport shipments={board.shipments.map((row) => ({ id: row.id, reference: row.reference }))} />
    </div>
  );
}
