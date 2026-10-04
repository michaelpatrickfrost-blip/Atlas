import Link from "next/link";
import { requireSession } from "@/core/auth/session";
import { assertCapability } from "@/core/permissions/check";
import { MANUFACTURING_CAPABILITIES as C } from "@/core/permissions/capabilities";
import { customerOrdersAtRisk } from "@/modules/manufacturing/services/queries";

export default async function ManufacturingReports() {
  const session = await requireSession();
  assertCapability(session, C.orderRead);
  const atRisk = await customerOrdersAtRisk(session.organisationId);

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-3xl font-semibold tracking-tight">Reports</h1>
      </header>
      <section>
        <h2 className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--color-ink-faint)]">Customer orders at risk</h2>
        <p className="mt-1 text-sm text-[var(--color-ink-muted)]">Production required within 2 days or already overdue, still open.</p>
        <div className="mt-3 overflow-hidden rounded-3xl border border-[var(--color-border)] bg-white">
          <table className="w-full text-sm">
            <thead className="bg-[var(--color-surface-sunken)] text-left text-xs uppercase tracking-wide text-[var(--color-ink-faint)]">
              <tr>
                <th className="px-5 py-3">Customer</th>
                <th className="px-5 py-3">Sales order</th>
                <th className="px-5 py-3">Production order</th>
                <th className="px-5 py-3">Product</th>
                <th className="px-5 py-3">Required</th>
                <th className="px-5 py-3">Progress</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-border)]">
              {atRisk.map((row) => (
                <tr key={row.orderId} className={row.overdue ? "bg-rose-50" : ""}>
                  <td className="px-5 py-3 font-medium">{row.customer}</td>
                  <td className="px-5 py-3">{row.salesOrderReference}</td>
                  <td className="px-5 py-3"><Link href={`/manufacturing/produce/${row.orderId}`} className="text-[var(--color-atlas-blue)]">{row.orderNumber}</Link></td>
                  <td className="px-5 py-3"><Link href={`/products/${row.productId}`} className="text-[var(--color-atlas-blue)] hover:underline">{row.product}</Link></td>
                  <td className="px-5 py-3">{row.requiredDate?.toLocaleDateString("en-GB") ?? "—"}</td>
                  <td className="px-5 py-3 tabular-nums">{row.progress}%</td>
                </tr>
              ))}
              {atRisk.length === 0 && (
                <tr><td colSpan={6} className="px-5 py-10 text-center text-[var(--color-ink-muted)]">No customer orders are currently at risk.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
