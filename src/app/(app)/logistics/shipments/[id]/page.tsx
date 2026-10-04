import { ActionForm } from "@/components/ui/action-form";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireSession } from "@/core/auth/session";
import { assertCapability, can } from "@/core/permissions/check";
import { LOGISTICS_CAPABILITIES as C } from "@/core/permissions/capabilities";
import { shipmentDetail } from "@/modules/logistics/services/queries";
import { policyFor } from "@/modules/logistics/services/numbers";
import { CourierExport } from "@/modules/logistics/components/courier-export";
import { deliverAction, dispatchAction, stageAction, trackingAction } from "../../actions";
import { SalesPointerPanel } from "@/modules/sales/components/sales-pointer-panel";

export default async function ShipmentPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await requireSession();
  assertCapability(session, C.shipmentRead);
  const row = await shipmentDetail(session.organisationId, (await params).id);
  if (!row) notFound();
  const policy = await policyFor(session.organisationId);
  const showCost = can(session, C.costRead);
  return (
    <div className="space-y-8">
      <Link href="/logistics/dispatch" className="text-sm text-[var(--color-ink-muted)]">Dispatch</Link>
      <SalesPointerPanel surface="delivery" />
      <header>
        <p className="text-sm text-[var(--color-ink-muted)]">{row.party.name}</p>
        <h1 className="text-4xl font-semibold tracking-tight">{row.reference}</h1>
        <p className="mt-2 text-sm">{row.status} · {row.carrierCode} · {row.carrierReason}</p>
        {row.trackingNumber && <p className="mt-1 text-sm">Tracking {row.trackingNumber}</p>}
      </header>
      {showCost && <p className="text-sm text-[var(--color-ink-muted)]">Estimated {row.estimatedCostMinor ?? "—"} · Actual {row.actualCostMinor ?? "—"} {row.currency}. Finance owns the accounting.</p>}
      <section className="space-y-3">
        {row.packages.map((box) => (
          <article key={box.id} className="rounded-2xl border border-[var(--color-border)] bg-white p-4">
            <h2 className="font-medium">{box.reference} · {box.typeCode ?? box.packageType} · {box.status}</h2>
            <p className="mt-1 text-sm text-[var(--color-ink-muted)]">{[box.lengthMm, box.widthMm, box.heightMm].filter(Boolean).join(" × ")}{box.lengthMm ? " mm" : ""}{box.weightGrams ? ` · ${(box.weightGrams / 1000).toFixed(1)} kg` : ""}{box.parentId ? " · nested" : ""}</p>
            <ul className="mt-2 text-sm text-[var(--color-ink-muted)]">{box.contents.map((content) => <li key={content.id}>{content.description} · {content.quantity}</li>)}</ul>
            {box.children.length > 0 && <p className="mt-2 text-xs">Contains {box.children.map((child) => child.reference).join(", ")}</p>}
          </article>
        ))}
        {row.packages.length === 0 && <p className="text-sm text-[var(--color-ink-muted)]">No packages yet.</p>}
      </section>
      <CourierExport shipments={[{ id: row.id, reference: row.reference }]} />
      <div className="flex flex-wrap gap-2">
        {can(session, C.dispatchManage) && <ActionForm action={stageAction.bind(null, row.id)} className="flex gap-2"><input name="lane" placeholder="Lane" defaultValue={row.stageLane ?? "Lane 1"} className="rounded-full border px-3 py-2 text-sm" /><button className="rounded-full border px-4 py-2 text-sm" type="submit">Stage</button></ActionForm>}
        {can(session, C.shipmentDispatch) && <ActionForm action={dispatchAction.bind(null, row.id, `dispatch:${row.id}`)}><button className="rounded-full bg-[var(--color-atlas-blue)] px-4 py-2 text-sm font-semibold text-white" type="submit">Dispatch</button></ActionForm>}
      </div>
      <p className="text-sm text-[var(--color-ink-muted)]">{policy.dispatchConfirmsDelivery ? "Dispatching this order marks it delivered. Company administration → Logistics controls that." : "Dispatch leaves this order dispatched until delivery is confirmed below."}</p>
      <ActionForm action={trackingAction.bind(null, row.id)} className="flex gap-2"><input name="status" placeholder="Carrier update" className="rounded-full border px-3 py-2 text-sm" /><button className="rounded-full border px-4 py-2 text-sm" type="submit">Record tracking</button></ActionForm>
      <ul className="space-y-2 text-sm">{row.events.map((event) => <li key={event.id}>{event.status}{event.rawStatus ? ` · ${event.rawStatus}` : ""} · {event.occurredAt.toLocaleString("en-GB")}</li>)}</ul>
      {can(session, C.shipmentDispatch) && <ActionForm action={deliverAction.bind(null, row.id)} className="grid max-w-md gap-2 rounded-3xl border border-[var(--color-border)] bg-white p-5"><p className="text-sm font-medium">Delivery</p><select name="outcome" className="rounded-xl border px-3 py-2 text-sm"><option value="DELIVERED">Delivered</option><option value="PARTIAL">Partial</option><option value="FAILED">Failed</option></select><input name="receiver" placeholder="Receiver" className="rounded-xl border px-3 py-2 text-sm" /><input name="note" placeholder="Note" className="rounded-xl border px-3 py-2 text-sm" /><input name="reason" placeholder="Failure reason, if any" className="rounded-xl border px-3 py-2 text-sm" /><button className="rounded-full bg-[var(--color-atlas-blue)] px-4 py-2 text-sm font-semibold text-white" type="submit">Confirm</button></ActionForm>}
    </div>
  );
}
