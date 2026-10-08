import Link from "next/link";
import { getEnabledModuleIds } from "@/core/modules/runtime";
import { getModule } from "@/core/modules/registry";
import { can } from "@/core/permissions/check";
import { requireSession } from "@/core/auth/session";
import { readOrderChain } from "@/modules/stock/services/availability";

export async function OrderFulfilment({ organisationId, orderId }: { organisationId: string; orderId: string }) {
  const session = await requireSession();
  const logistics = (await getEnabledModuleIds(organisationId)).has("logistics");
  const projection = logistics ? await getModule("logistics")?.fulfilmentProjectionProvider?.({ organisationId, orderId }) : null;
  return (
    <section className="mb-6 rounded-2xl border border-slate-200 bg-slate-50 p-5 sm:col-span-2">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold">From sale to invoice</h3>
          {projection ? <>
            <p className="mt-2 text-sm text-slate-600">{projection.lineCount} lines · {projection.shippedLineCount} shipped · {projection.readyLineCount} ready · {projection.awaitingLineCount} awaiting stock</p>
            <p className="mt-1 text-sm text-slate-500">{projection.totalUnitsShipped} of {projection.totalUnitsOrdered} units shipped{projection.nextDeliveryDate ? ` · Next shipment ${projection.nextDeliveryDate.toLocaleDateString("en-GB")}` : ""}{projection.expectedCompletion ? ` · Expected completion ${projection.expectedCompletion.toLocaleDateString("en-GB")}` : ""}</p>
            {projection.holdLabel && <p className="mt-2 text-sm text-amber-700">Blocked · {projection.holdLabel}</p>}
          </> : <p className="mt-2 text-sm text-slate-500">{logistics ? "Confirming this order creates its fulfilment requirement." : "Logistics is off. The sale still shows what has been invoiced."}</p>}
        </div>
        {projection?.reference && can(session, "logistics.fulfilment.read") && <Link href={projection.requirementId ? `/logistics/fulfil/${projection.requirementId}` : "/logistics/fulfil"} className="text-sm text-blue-600">{projection.reference} →</Link>}
      </div>
      <OrderChain orderId={orderId} />
    </section>
  );
}

async function OrderChain({ orderId }: { orderId: string }) {
  const chain = await readOrderChain(orderId);
  if (!chain) return null;
  const session = await requireSession();
  const seeFinance = can(session, "finance.receivables.read");
  const date = (value: string) => new Date(value).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
  return (
    <div className="mt-5 space-y-3">
      <p className="text-sm text-slate-600">Sold, allocated, shipped, delivered, then invoiced. The invoice date is the delivery date. Projected stock includes expected supply and open demand; it is not stock available to promise today.</p>
      {chain.lines.some((line) => line.ordered > line.delivered && line.allocated < line.ordered) && <p className="text-sm text-amber-800">This order is short of stock. The balance stays open. When the product is back in stock, Atlas raises the delivery and then the invoice.</p>}
      {chain.invoices.map((invoice) => seeFinance ? <Link key={invoice.id} href={`/finance/documents/${invoice.id}`} className="block text-sm text-emerald-700">{invoice.reference} · {date(invoice.documentDate)} · {invoice.status}</Link> : <p key={invoice.id} className="text-sm text-slate-600">{invoice.reference} · {date(invoice.documentDate)} · {invoice.status}</p>)}
      {chain.financeVisible && !chain.invoices.length && <p className="text-sm text-slate-500">Nothing is invoiced yet. The delivery raises the draft. A short order waits until the product is back in stock.</p>}
      <div className="overflow-x-auto"><table className="w-full text-sm">
        <thead className="text-left text-xs text-slate-500"><tr>{["Product", "Ordered", "Balance", "Allocated", "Shipped", "Delivered", "Invoiced", "Projected stock"].map((heading) => <th key={heading} className="py-2 pr-3 font-medium">{heading}</th>)}</tr></thead>
        <tbody>
          {chain.lines.map((line) => <tr key={line.id} className="border-t border-slate-200"><td className="py-2 pr-3">{line.description}</td><td className="py-2 pr-3 tabular-nums">{line.ordered} {line.unit}</td><td className="py-2 pr-3 tabular-nums">{Math.max(0, line.ordered - line.delivered)}</td><td className="py-2 pr-3 tabular-nums">{line.allocated}</td><td className="py-2 pr-3 tabular-nums">{line.shipped}</td><td className="py-2 pr-3 tabular-nums">{line.delivered}</td><td className="py-2 pr-3 tabular-nums">{line.invoiced ?? "—"}</td><td className="py-2 pr-3 tabular-nums">{line.available ?? "—"}</td></tr>)}
        </tbody>
      </table></div>
    </div>
  );
}
