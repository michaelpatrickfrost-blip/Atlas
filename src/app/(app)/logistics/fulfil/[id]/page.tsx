import { ActionForm } from "@/components/ui/action-form";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireSession } from "@/core/auth/session";
import { assertCapability, can } from "@/core/permissions/check";
import { LOGISTICS_CAPABILITIES as C } from "@/core/permissions/capabilities";
import { fulfilmentDetail } from "@/modules/logistics/services/queries";
import { shortageText, warehouseSteps } from "@/modules/logistics/domain/operations";
import { policyFor } from "@/modules/logistics/services/numbers";
import { allocateAction, directShipAction, releaseAction, restoreDeliveryAction } from "../../actions";
import { SalesPointerPanel } from "@/modules/sales/components/sales-pointer-panel";
import type { ShortageView } from "@/modules/logistics/domain/operations";

export default async function FulfilmentPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await requireSession();
  assertCapability(session, C.fulfilmentRead);
  const { id } = await params;
  const row = await fulfilmentDetail(session.organisationId, id);
  if (!row) notFound();
  const policy = await policyFor(session.organisationId);
  const required = row.lines.reduce((sum, line) => sum + Math.max(0, line.orderedQuantity - line.cancelledQuantity), 0);
  const allocated = row.lines.reduce((sum, line) => sum + line.allocatedQuantity, 0);
  return (
    <div className="space-y-8">
      <Link href="/logistics/fulfil" className="text-sm text-[var(--color-ink-muted)]">Fulfil</Link>
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm text-[var(--color-ink-muted)]">{row.party.name}</p>
          <h1 className="mt-1 text-4xl font-semibold tracking-tight">{row.reference}</h1>
          <p className="mt-2 text-sm text-[var(--color-ink-muted)]">{row.salesOrder.reference}{row.salesOrder.customerPoReference ? ` · PO ${row.salesOrder.customerPoReference}` : " · No customer PO"}</p>
          <p className="mt-1 text-sm text-[var(--color-ink-muted)]">{row.salesOrder.requestedDeliveryDate ? `Requested ${row.salesOrder.requestedDeliveryDate.toLocaleDateString("en-GB")}` : "No requested date"}{row.salesOrder.promisedDeliveryDate ? ` · promised ${row.salesOrder.promisedDeliveryDate.toLocaleDateString("en-GB")}` : ""} · {warehouseSteps(policy.mode).join(" → ")}</p>
        </div>
        <div className="flex gap-2">
          {can(session, C.fulfilmentRelease) && row.fulfilmentMode === "WAREHOUSE" && <ActionForm action={allocateAction.bind(null, row.id)}><button disabled={required === 0 || row.status === "CANCELLED"} className="rounded-full border px-4 py-2 text-sm disabled:opacity-40" type="submit">Allocate</button></ActionForm>}
          {can(session, C.fulfilmentRelease) && row.fulfilmentMode === "WAREHOUSE" && <ActionForm action={releaseAction.bind(null, row.id)}><button disabled={required === 0 || Boolean(row.holdSummary) || row.status === "CANCELLED"} className="rounded-full bg-[var(--color-atlas-blue)] px-4 py-2 text-sm font-semibold text-white disabled:opacity-40" type="submit">Release</button></ActionForm>}
        </div>
      </header>
      <SalesPointerPanel surface="delivery" />
      {required === 0 && <p role="status" className="rounded-2xl bg-amber-50 px-5 py-4 text-sm">This delivery has no items to fulfil. Add the items to the sales order and confirm it before releasing warehouse work.</p>}
      {row.status === "CANCELLED" && can(session, C.fulfilmentRelease) && <ActionForm action={restoreDeliveryAction.bind(null, row.id)}><button className="rounded-full border px-4 py-2 text-sm" type="submit">Put this delivery back</button></ActionForm>}
      {row.holdSummary && <p className="rounded-2xl bg-amber-50 px-5 py-4 text-sm">Blocked<br /><span className="font-medium">{row.holdSummary}</span></p>}
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-2xl bg-white px-5 py-4 border border-[var(--color-border)]"><p className="text-xs text-[var(--color-ink-faint)]">Required</p><p className="text-3xl font-semibold">{required}</p></div>
        <div className="rounded-2xl bg-white px-5 py-4 border border-[var(--color-border)]"><p className="text-xs text-[var(--color-ink-faint)]">Allocated</p><p className="text-3xl font-semibold">{allocated}</p></div>
        <div className="rounded-2xl bg-white px-5 py-4 border border-[var(--color-border)]"><p className="text-xs text-[var(--color-ink-faint)]">Balance</p><p className="text-3xl font-semibold">{Math.max(0, required - allocated)}</p>{required > allocated && <p className="mt-2 text-xs text-[var(--color-ink-muted)]">Waiting for stock. A delivery is raised when it arrives, and the invoice follows.</p>}</div>
      </div>
      <div className="space-y-3">
        {row.lines.map((line) => {
          const shortage = line.shortage as ShortageView | null;
          return (
            <article key={line.id} className="rounded-3xl border border-[var(--color-border)] bg-white p-5">
              <div className="flex flex-wrap items-baseline justify-between gap-3">
                <h2 className="font-medium">{line.description}</h2>
                <span className="text-sm text-[var(--color-ink-muted)]">{line.allocationStatus.replaceAll("_", " ")}</span>
              </div>
              <p className="mt-2 text-sm text-[var(--color-ink-muted)]">{line.pickedQuantity} picked · {line.packedQuantity} packed · {line.shippedQuantity} shipped</p>
              {shortage && shortage.short > 0 && <div className="mt-4 whitespace-pre-line text-sm leading-6">{shortageText(shortage).join("\n\n")}<p className="mt-3 text-[var(--color-ink-muted)]">{shortage.actions.join(" · ")}</p></div>}
            </article>
          );
        })}
      </div>
      <div className="flex flex-wrap gap-4">{row.tasks.filter((task) => task.status !== "COMPLETE").map((task) => <Link key={task.id} className="text-sm text-[var(--color-atlas-blue)]" href={`/logistics/work/${task.id}`}>Open {task.kind.toLowerCase()} {task.reference}</Link>)}</div>
      {row.packages.length > 0 && <section className="space-y-2">{row.packages.map((unit) => <p key={unit.id} className="text-sm">{unit.reference} · {unit.typeCode ?? unit.packageType}{unit.parent?.reference ? ` inside ${unit.parent.reference}` : ""} · {unit.contents.map((content) => `${content.description} × ${content.quantity}`).join(", ")}</p>)}</section>}
      {row.fulfilmentMode !== "WAREHOUSE" && can(session, C.shipmentCreate) && <ActionForm action={directShipAction.bind(null, row.id)} className="flex gap-2"><input name="tracking" placeholder="Supplier tracking" className="rounded-full border px-4 py-2 text-sm" /><button className="rounded-full border px-4 py-2 text-sm" type="submit">Record direct shipment</button></ActionForm>}
    </div>
  );
}
