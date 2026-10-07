"use client";
import { useState, useTransition } from "react";
import { CustomerPicker, type PricingCustomer } from "./customer-picker";
import { ProductSearch, type PricingProduct } from "./product-search";
import { checkSalesPrice } from "./actions";
import { Button } from "@/components/ui/button";
import { formatMoney } from "@/core/shared/money";
type Result = Awaited<ReturnType<typeof checkSalesPrice>>;
const field = "mt-2 block w-full rounded-xl border border-[var(--color-border)] bg-white px-3 py-2.5 text-sm";
export function PriceChecker({ listId, customers, products, today }: { listId: string; customers: PricingCustomer[]; products: PricingProduct[]; today: string }) {
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState("");
  const [pending, start] = useTransition();
  return <section className="max-w-3xl space-y-4"><div><h3 className="font-semibold">Check a sales price</h3><p className="mt-1 text-sm text-[var(--color-ink-muted)]">See the same pricing decision used by Sales, including customer contracts, quantity breaks and validity dates.</p></div>
    <form className="grid gap-4 rounded-2xl border border-[var(--color-border)] bg-white p-5 sm:grid-cols-2" onChange={() => { setResult(null); setError(""); }} action={form => start(async () => { setError(""); setResult(null); try { setResult(await checkSalesPrice(listId, form)); } catch (e) { setError(e instanceof Error ? e.message : "Could not check this price."); } })}>
      <fieldset disabled={pending} className="contents"><CustomerPicker customers={customers} /><ProductSearch products={products} onSelect={() => { setResult(null); setError(""); }} />
        <label className="text-sm">Quantity<input name="quantity" type="number" min="1" max="1000000" step="1" defaultValue="1" required className={field} /></label><label className="text-sm">Pricing date<input name="asOf" type="date" defaultValue={today} required className={field} /></label>
        <label className="text-sm sm:col-span-2">Price-list selection<select name="mode" className={field}><option value="auto">Customer’s automatic pricing</option><option value="list">Explicitly select this price list on the sale</option></select></label>
        <p className="text-xs text-[var(--color-ink-muted)] sm:col-span-2">An agreement special price or saved customer product price can override even an explicitly selected list. Amounts exclude tax.</p><Button type="submit" variant="primary" className="justify-self-start">{pending ? "Checking…" : "Check price"}</Button>
      </fieldset>
    </form>
    {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
    {result && <div role="status" className="rounded-2xl border border-blue-200 bg-blue-50/40 p-5"><p className="text-sm font-semibold">{result.source}</p><dl className="mt-4 grid gap-4 sm:grid-cols-3"><div><dt className="text-xs text-[var(--color-ink-muted)]">Unit price</dt><dd className="mt-1 font-semibold">{formatMoney(result.unitPriceAmount, result.currency)}</dd></div><div><dt className="text-xs text-[var(--color-ink-muted)]">Discount</dt><dd className="mt-1 font-semibold">{result.discountPercent}%</dd></div><div><dt className="text-xs text-[var(--color-ink-muted)]">Net per unit</dt><dd className="mt-1 font-semibold">{formatMoney(result.netUnitAmount, result.currency)}</dd></div></dl>{result.validUntil && <p className="mt-3 text-xs text-[var(--color-ink-muted)]">Valid until {new Date(result.validUntil).toLocaleDateString("en-GB")}</p>}<p className="mt-3 text-xs text-[var(--color-ink-muted)]">Preview only. No quotation, order or price was changed.</p></div>}
  </section>;
}
