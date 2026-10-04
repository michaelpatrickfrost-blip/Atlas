import Link from "next/link";
import { notFound } from "next/navigation";
import { requireSession } from "@/core/auth/session";
import { assertCapability } from "@/core/permissions/check";
import { MANUFACTURING_CAPABILITIES as C } from "@/core/permissions/capabilities";
import { orderDetail } from "@/modules/manufacturing/services/queries";
import { StatusPill } from "@/components/ui/status-pill";

export default async function ProductionOrderPage({ params }: { params: Promise<{ orderId: string }> }) {
  const session = await requireSession();
  assertCapability(session, C.orderRead);
  const { orderId } = await params;
  const order = await orderDetail(session.organisationId, orderId);
  if (!order) notFound();

  const complete = order.workOrders.filter((w) => w.status === "COMPLETE").length;
  const progress = order.workOrders.length ? Math.round((complete / order.workOrders.length) * 100) : 0;

  return (
    <div className="space-y-8">
      <header className="flex items-start justify-between gap-6">
        <div>
          <p className="text-sm text-[var(--color-ink-muted)]">{order.orderNumber}</p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight">
            <Link href={`/products/${order.productId}`} className="hover:underline">{order.product.name}</Link>
          </h1>
          <p className="mt-2 text-sm text-[var(--color-ink-muted)]">{Number(order.quantity)} {order.unitOfMeasure}</p>
        </div>
        <StatusPill label={order.status} tone={order.status === "RUNNING" ? "warning" : order.status === "COMPLETE" || order.status === "CLOSED" ? "success" : "neutral"} />
      </header>

      <div className="grid gap-6 lg:grid-cols-[1.4fr_0.8fr]">
        <section>
          <h2 className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--color-ink-faint)]">Operations</h2>
          <p className="mt-1 text-sm text-[var(--color-ink-muted)]">{complete} / {order.workOrders.length} complete · {progress}%</p>
          <div className="mt-3 divide-y divide-[var(--color-border)] rounded-3xl border border-[var(--color-border)] bg-white">
            {order.workOrders.length === 0 && <p className="px-5 py-6 text-sm text-[var(--color-ink-muted)]">No operations have been generated for this order yet.</p>}
            {order.workOrders.map((wo) => (
              <div key={wo.id} className="flex items-center justify-between gap-4 px-5 py-4 text-sm">
                <div>
                  <p className="font-medium">{wo.operationName}</p>
                  <p className="text-[var(--color-ink-muted)]">{wo.workCentre?.name ?? "No work centre assigned"}{wo.resource ? ` · ${wo.resource.name}` : ""}</p>
                </div>
                <StatusPill label={wo.status} tone={wo.status === "RUNNING" ? "warning" : wo.status === "COMPLETE" ? "success" : wo.status === "BLOCKED" ? "danger" : "neutral"} />
              </div>
            ))}
          </div>
        </section>

        <section>
          <h2 className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--color-ink-faint)]">Customer demand</h2>
          <div className="mt-3 rounded-3xl border border-[var(--color-border)] bg-white px-5 py-6 text-sm">
            {order.sourceSalesOrderLine ? (
              <>
                <p className="font-medium"><Link href={`/sales/orders/${order.sourceSalesOrderLine.orderId}`} className="text-[var(--color-atlas-blue)] hover:underline">{order.sourceSalesOrderLine.order.reference}</Link></p>
                <p className="mt-1 text-[var(--color-ink-muted)]">{order.sourceSalesOrderLine.order.party.name}</p>
                {order.sourceSalesOrderLine.promisedDeliveryDate && (
                  <p className="mt-1 text-[var(--color-ink-muted)]">Promised {order.sourceSalesOrderLine.promisedDeliveryDate.toLocaleDateString("en-GB")}</p>
                )}
              </>
            ) : (
              <p className="text-[var(--color-ink-muted)]">Not linked to a sales order — make-to-stock.</p>
            )}
          </div>

          <h2 className="mt-6 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--color-ink-faint)]">Materials</h2>
          <div className="mt-3 divide-y divide-[var(--color-border)] rounded-3xl border border-[var(--color-border)] bg-white">
            {!order.definition && <p className="px-5 py-6 text-sm text-[var(--color-ink-muted)]">No BOM snapshot on this order.</p>}
            {order.definition?.lines.map((line) => (
              <div key={line.id} className="flex items-center justify-between gap-4 px-5 py-3 text-sm">
                <span><Link href={`/products/${line.component.id}`} className="text-[var(--color-atlas-blue)] hover:underline">{line.component.name}</Link> <span className="text-[var(--color-ink-faint)]">{line.component.code}</span></span>
                <span className="tabular-nums text-[var(--color-ink-muted)]">{Number(line.quantityPerUnit)} × {Number(order.quantity)}</span>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
