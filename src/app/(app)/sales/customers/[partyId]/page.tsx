import { notFound } from "next/navigation";
import { requireSession } from "@/core/auth/session";
import { assertCapability } from "@/core/permissions/check";
import { SALES_CAPABILITIES } from "@/core/permissions/capabilities";
import { getCustomer } from "@/modules/sales/services/queries";
import { formatMoney } from "@/core/shared/money";
import { StatusPill } from "@/components/ui/status-pill";

/**
 * The record page standard: a Party viewed through every module that has a
 * relationship with it. Sections render only when the module that owns them
 * contributed data and the viewer has the capability to see it — this page
 * does not special-case "Sales"; it demonstrates the pattern other modules
 * (Finance, Service, ...) will plug into on the same Party record.
 */
export default async function CustomerRecordPage({ params }: { params: Promise<{ partyId: string }> }) {
  const session = await requireSession();
  assertCapability(session, SALES_CAPABILITIES.customerRead);

  const { partyId } = await params;
  const customer = await getCustomer(session.organisationId, partyId);
  if (!customer) notFound();

  const lifetimeSales = customer.salesOrders.reduce((sum, order) => sum + order.totalAmount, 0);
  const openOrders = customer.salesOrders.filter((order) => order.status !== "CANCELLED").length;

  return (
    <div className="flex flex-col gap-8">
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-semibold tracking-tight text-[var(--color-ink)]">{customer.name}</h1>
          <StatusPill label="Active" tone="success" />
        </div>
        <p className="text-sm text-[var(--color-ink-muted)]">Customer · {customer.kind === "COMPANY" ? "Company" : "Person"}</p>
      </div>

      <div className="grid grid-cols-3 gap-6">
        <Metric label="Lifetime sales" value={formatMoney(lifetimeSales, "GBP")} />
        <Metric label="Open orders" value={String(openOrders)} />
        <Metric label="Opportunities" value={String(customer.opportunities.length)} />
      </div>

      <section>
        <h2 className="mb-3 text-sm font-medium text-[var(--color-ink-muted)]">Sales</h2>
        <div className="overflow-hidden rounded-[var(--radius-atlas-md)] border border-[var(--color-border)] bg-[var(--color-surface)]">
          {customer.quotes.length === 0 && customer.salesOrders.length === 0 ? (
            <p className="px-4 py-6 text-center text-sm text-[var(--color-ink-muted)]">No quotes or orders yet.</p>
          ) : (
            <>
              {customer.quotes.map((quote) => (
                <div key={quote.id} className="flex items-center justify-between border-b border-[var(--color-border)] px-4 py-3 text-sm last:border-0">
                  <span className="text-[var(--color-ink)]">Quote {quote.reference}</span>
                  <span className="text-[var(--color-ink-muted)]">{formatMoney(quote.totalAmount, quote.totalCurrency)}</span>
                </div>
              ))}
              {customer.salesOrders.map((order) => (
                <div key={order.id} className="flex items-center justify-between border-b border-[var(--color-border)] px-4 py-3 text-sm last:border-0">
                  <span className="text-[var(--color-ink)]">Order {order.reference}</span>
                  <span className="text-[var(--color-ink-muted)]">{formatMoney(order.totalAmount, order.totalCurrency)}</span>
                </div>
              ))}
            </>
          )}
        </div>
      </section>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xl font-semibold tracking-tight text-[var(--color-ink)]">{value}</p>
      <p className="text-sm text-[var(--color-ink-muted)]">{label}</p>
    </div>
  );
}
