import { OrderSplit } from "@/modules/manufacturing/components/order-split";
import { money as formatMoney } from "@/modules/finance/domain/money";
import { ActionForm } from "@/components/ui/action-form";
import { issueProductionMaterial } from "@/modules/manufacturing/services/materials";
import { productionCostProjection } from "@/core/finance/manufacturing";
import { RecordRelationships } from "@/components/records/relationships";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireSession } from "@/core/auth/session";
import { assertCapability } from "@/core/permissions/check";
import { MANUFACTURING_CAPABILITIES as C } from "@/core/permissions/capabilities";
import { orderDetail } from "@/modules/manufacturing/services/queries";
import { StatusPill } from "@/components/ui/status-pill";

const asHours = (minutes: number) => `${(minutes / 60).toFixed(2)} h`;
const whole = (value: number) => value.toLocaleString("en-GB", { maximumFractionDigits: 6 });

export default async function ProductionOrderPage({ params }: { params: Promise<{ orderId: string }> }) {
  const session = await requireSession();
  assertCapability(session, C.orderRead);
  const { orderId } = await params;
  const order = await orderDetail(session.organisationId, orderId);
  if (!order) notFound();

  const costs = await productionCostProjection(session, orderId);
  const money = (value: string) => formatMoney(BigInt(value), costs?.currency ?? "GBP");
  const complete = order.workOrders.filter((w) => w.status === "COMPLETE").length;
  const progress = order.workOrders.length ? Math.round((complete / order.workOrders.length) * 100) : 0;
  const plannedMinutes = order.workOrders.reduce((sum, wo) => sum + wo.plannedMinutes, 0);
  const actualMinutes = order.workOrders.reduce((sum, wo) => sum + wo.actualMinutes, 0);
  const variance = actualMinutes - plannedMinutes;
  const consumedByProduct = new Map(order.consumption.map((row) => [row.productId, row.quantity]));

  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-start justify-between gap-6">
        <div>
          <p className="text-sm text-[var(--color-ink-muted)]">{order.orderNumber}</p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight">
            <Link href={`/products/${order.productId}`} className="hover:underline">{order.product.name}</Link>
          </h1>
          <p className="mt-2 text-sm text-[var(--color-ink-muted)]">{Number(order.quantity)} {order.unitOfMeasure}</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">{session.capabilities.has(C.workOrderExecute)&&<Link href="/manufacturing/shop-floor" className="inline-flex min-h-11 items-center rounded-xl border border-blue-100 bg-white px-4 text-sm font-semibold text-blue-600">Open shop floor →</Link>}<StatusPill label={order.status} tone={order.status === "RUNNING" ? "warning" : order.status === "COMPLETE" || order.status === "CLOSED" ? "success" : "neutral"} /></div>
      </header>
      {order.originOrder && <p className="text-sm text-slate-600">Linked from <Link href={`/manufacturing/produce/${order.originOrder.id}`} className="font-semibold text-blue-600">{order.originOrder.orderNumber}</Link></p>}
      {order.followOnOrders.length>0 && <div className="flex flex-wrap gap-3 text-sm">{order.followOnOrders.map(child=><Link key={child.id} href={`/manufacturing/produce/${child.id}`} className="rounded-full bg-blue-50 px-4 py-2 text-blue-700">{child.orderNumber} · {whole(Number(child.quantity))} {order.unitOfMeasure} · {child.status.toLowerCase()}</Link>)}</div>}
      {["PLANNED","READY","RELEASED"].includes(order.status) && session.capabilities.has("manufacturing.order.create") && session.capabilities.has("manufacturing.order.release") && <OrderSplit id={order.id} quantity={Number(order.quantity)} unit={order.unitOfMeasure}/>}


      {order.stockBatches.length>0 && session.capabilities.has("stock.read") && <section className="rounded-3xl border border-blue-100 bg-blue-50 p-5"><h2 className="font-semibold">Production → Warehouse handoff</h2><p className="mt-2 text-sm text-slate-600">{order.stockBatches.length} output batches retain their separate reporting and collection histories. Warehouse collects the actual accepted quantity before it becomes available stock.</p><Link href={`/stock/handoffs?q=${encodeURIComponent(order.orderNumber)}`} className="mt-3 inline-block text-sm font-semibold text-blue-700">Follow these batches →</Link></section>}
      <section className="rounded-3xl border border-slate-200 bg-white p-5"><h2 className="text-lg font-semibold">Production reporting history</h2><div className="mt-3 divide-y divide-slate-100">{order.workOrders.flatMap(w => w.reports.map(report => <div key={report.id} className="flex flex-wrap justify-between gap-3 py-3 text-sm"><div><p className="font-semibold">{w.operationName} · {report.final ? "Step finished" : "Partial output"}</p><p className="mt-1 text-xs text-slate-500">{report.createdAt.toLocaleString("en-GB")} · {report.lotCode}{report.shortCloseReason ? ` · ${report.shortCloseReason}` : ""}</p></div><p className="tabular-nums">{whole(Number(report.enteredGoodQuantity))} good · {whole(Number(report.enteredScrapQuantity))} scrap · {report.enteredUnit}</p></div>))}{!order.workOrders.some(w => w.reports.length) && <p className="py-3 text-sm text-slate-500">No new output reports. Earlier completed steps retain their original totals below.</p>}</div></section>
      <div className="grid gap-6 lg:grid-cols-[1.4fr_0.8fr]">
        <section>
          <div className="flex flex-wrap items-baseline justify-between gap-3">
            <h2 className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--color-ink-faint)]">Operations</h2>
            <p className="text-sm text-[var(--color-ink-muted)]">
              Plan {asHours(plannedMinutes)}{actualMinutes > 0 && <> · Actual {asHours(actualMinutes)} <span className={variance > 0 ? "font-semibold text-rose-700" : "font-semibold text-emerald-700"}>({variance > 0 ? "+" : ""}{asHours(variance)})</span></>}
            </p>
          </div>
          <p className="mt-1 text-sm text-[var(--color-ink-muted)]">{complete} / {order.workOrders.length} complete · {progress}%</p>
          <div className="mt-3 divide-y divide-[var(--color-border)] rounded-3xl border border-[var(--color-border)] bg-white">
            {order.workOrders.length === 0 && <p className="px-5 py-6 text-sm text-[var(--color-ink-muted)]">No operations have been generated for this order yet.</p>}
            {order.workOrders.map((wo) => (
              <div key={wo.id} className="flex items-center justify-between gap-4 px-5 py-4 text-sm">
                <div>
                  <p className="font-medium">{wo.operationName}</p>
                  <p className="text-[var(--color-ink-muted)]">{wo.workCentre?.name ?? "No work centre assigned"}{wo.resource ? ` · ${wo.resource.name}` : ""}</p>
                </div>
                <div className="text-right">
                  <p className="tabular-nums text-[var(--color-ink-muted)]">Plan {asHours(wo.plannedMinutes)}</p>
                  {wo.actualMinutes > 0 && (
                    <p className={wo.actualMinutes > wo.plannedMinutes ? "tabular-nums font-semibold text-rose-700" : "tabular-nums font-semibold text-emerald-700"}>
                      Actual {asHours(wo.actualMinutes)}
                    </p>
                  )}
                </div>
                <StatusPill label={wo.status} tone={wo.status === "RUNNING" ? "warning" : wo.status === "COMPLETE" ? "success" : wo.status === "BLOCKED" ? "danger" : "neutral"} />
              </div>
            ))}
          </div>
        </section>

        <section>
      {costs && <div className="mb-6 rounded-3xl border border-blue-100 bg-blue-50 p-5"><h2 className="font-semibold">Actual production costs</h2>{costs.configured ? <dl className="mt-4 space-y-2 text-sm">{[{label:"Materials issued",value:costs.materials},{label:"Time and energy",value:costs.usage},{label:"Finished stock",value:costs.finished},{label:"Scrap expense",value:costs.scrap},{label:"Still in WIP",value:costs.wip}].map(row=><div key={row.label} className="flex justify-between gap-3"><dt className="text-slate-500">{row.label}</dt><dd className="font-semibold tabular-nums">{money(row.value)}</dd></div>)}</dl> : <p className="mt-2 text-sm text-blue-800">Costing is not configured for this warehouse. Physical production history is retained; actual financial values require Finance setup.</p>}<Link href="/finance/manufacturing" className="mt-4 inline-flex text-xs font-semibold text-blue-700">Open manufacturing costs →</Link></div>}
          <RecordRelationships session={session} record={{ moduleId: "manufacturing", type: "order", id: order.id }} />

          {session.capabilities.has("manufacturing.material.issue") && order.workOrders.some(w=>["READY","RUNNING","PAUSED"].includes(w.status)) && <div className="mt-5 rounded-3xl border border-slate-200 bg-white p-5"><h2 className="font-semibold">Issue materials to production</h2><p className="mt-2 text-xs leading-5 text-slate-500">Record materials when they leave stock. Output reports consume only any remaining recipe requirement, so an earlier issue is counted once. Batch references select stock; leave blank to use the earliest eligible expiry.</p><ActionForm action={issueProductionMaterial} label="Issue materials"><input type="hidden" name="requestKey" value={crypto.randomUUID()}/><div className="mt-3 space-y-3"><label className="block text-xs">Operation<select name="workOrderId" className="mt-1 w-full rounded-xl border border-slate-200 p-2" required>{order.workOrders.filter(w=>["READY","RUNNING","PAUSED"].includes(w.status)).map(w=><option key={w.id} value={w.id}>{w.operationName}</option>)}</select></label><label className="block text-xs">Component<select name="productId" className="mt-1 w-full rounded-xl border border-slate-200 p-2" required>{order.definition?.lines.map(line=><option key={line.id} value={line.componentProductId}>{line.component.code} · {line.component.name} ({line.component.unitOfMeasure})</option>)}</select></label><label className="block text-xs">Quantity in the component’s stock unit<input name="quantity" type="number" min="0.000001" step="0.000001" required className="mt-1 w-full rounded-xl border border-slate-200 p-2"/></label><input name="lotCode" placeholder="Batch reference (optional)" aria-label="Material batch reference" className="w-full rounded-xl border border-slate-200 p-2 text-sm"/><input name="serials" placeholder="Serials if tracked, comma separated" aria-label="Material serials" className="w-full rounded-xl border border-slate-200 p-2 text-sm"/><input name="reason" placeholder="Reason, required above recipe allowance" aria-label="Material issue reason" maxLength={500} className="w-full rounded-xl border border-slate-200 p-2 text-sm"/></div></ActionForm></div>}
          <h2 className="mt-6 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--color-ink-faint)]">Materials</h2>
          <div className="mt-3 divide-y divide-[var(--color-border)] rounded-3xl border border-[var(--color-border)] bg-white">
            {!order.definition && <p className="px-5 py-6 text-sm text-[var(--color-ink-muted)]">No BOM snapshot on this order.</p>}
            {order.definition?.lines.map((line) => {
              const planned = Number(line.quantityPerUnit) * Number(order.quantity);
              const used = consumedByProduct.get(line.componentProductId);
              const over = used !== undefined && used > planned;
              return (
                <div key={line.id} className="flex items-center justify-between gap-4 px-5 py-3 text-sm">
                  <span>
                    <Link href={`/products/${line.component.id}`} className="text-[var(--color-atlas-blue)] hover:underline">{line.component.name}</Link>{" "}
                    <span className="text-[var(--color-ink-faint)]">{line.component.code}</span>
                  </span>
                  <span className="text-right tabular-nums">
                    <span className="text-[var(--color-ink-muted)]">Plan {whole(planned)}</span>
                    {used !== undefined && (
                      <span className={over ? " ml-3 font-semibold text-rose-700" : " ml-3 font-semibold text-emerald-700"}>Used {whole(used)}</span>
                    )}
                  </span>
                </div>
              );
            })}
            {order.consumption.length === 0 && order.definition && (
              <p className="px-5 py-3 text-xs text-[var(--color-ink-faint)]">Nothing has been issued from stock yet — components are consumed when the last operation completes.</p>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
