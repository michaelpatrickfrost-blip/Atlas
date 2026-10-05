import Link from "next/link";
import { requireSession } from "@/core/auth/session";
import { assertCapability } from "@/core/permissions/check";
import { MANUFACTURING_CAPABILITIES as C } from "@/core/permissions/capabilities";
import { listOrders } from "@/modules/manufacturing/services/queries";
import { StatusPill } from "@/components/ui/status-pill";
import { MakeOrderDialog } from "@/modules/manufacturing/components/make-order";

export default async function ProduceWorkspace({ searchParams }: { searchParams: Promise<{ view?: string }> }) {
  const session = await requireSession();
  assertCapability(session, C.orderRead);
  const { view } = await searchParams;
  const orders = await listOrders(session.organisationId, view);
  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Produce</h1>
          <p className="mt-2 text-sm text-[var(--color-ink-muted)]">Every production order, its material readiness and progress.</p>
        </div>
        <MakeOrderDialog />
      </header>
      <div className="overflow-hidden rounded-3xl border border-[var(--color-border)] bg-white">
        <table className="w-full text-sm">
          <thead className="bg-[var(--color-surface-sunken)] text-left text-xs uppercase tracking-wide text-[var(--color-ink-faint)]">
            <tr>
              <th className="px-5 py-3">MO</th>
              <th className="px-5 py-3">Product</th>
              <th className="px-5 py-3">Quantity</th>
              <th className="px-5 py-3">Required</th>
              <th className="px-5 py-3">Progress</th>
              <th className="px-5 py-3">Source order</th>
              <th className="px-5 py-3">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--color-border)]">
            {orders.map((order) => (
              <tr key={order.id} className="hover:bg-[var(--color-surface-sunken)]">
                <td className="px-5 py-3"><Link href={`/manufacturing/produce/${order.id}`} className="font-medium text-[var(--color-atlas-blue)]">{order.orderNumber}</Link></td>
                <td className="px-5 py-3"><Link href={`/products/${order.productId}`} className="text-[var(--color-atlas-blue)] hover:underline">{order.product}</Link> <span className="text-[var(--color-ink-faint)]">{order.productCode}</span></td>
                <td className="px-5 py-3 tabular-nums">{order.quantity} {order.unitOfMeasure}</td>
                <td className="px-5 py-3">{order.requiredDate?.toLocaleDateString("en-GB") ?? "—"}</td>
                <td className="px-5 py-3 tabular-nums">{order.progress}%</td>
                <td className="px-5 py-3">{order.sourceOrderId ? <Link href={`/sales/orders/${order.sourceOrderId}`} className="text-[var(--color-atlas-blue)] hover:underline">{order.sourceOrderReference}</Link> : "—"}</td>
                <td className="px-5 py-3"><StatusPill label={order.status} tone={order.status === "RUNNING" ? "warning" : order.status === "COMPLETE" || order.status === "CLOSED" ? "success" : "neutral"} /></td>
              </tr>
            ))}
            {orders.length === 0 && (
              <tr><td colSpan={7} className="px-5 py-10 text-center text-sm text-[var(--color-ink-muted)]">No production orders yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
