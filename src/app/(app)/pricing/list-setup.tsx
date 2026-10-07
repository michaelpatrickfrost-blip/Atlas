"use client";
import { useState } from "react";
import { ActionForm } from "@/components/ui/action-form";
import { Button } from "@/components/ui/button";
import { SALES_CURRENCIES } from "@/core/pricing/rules";
import { createPriceList } from "./actions";
import { CustomerPicker, type PricingCustomer } from "./customer-picker";
const field = "mt-2 block w-full rounded-xl border border-[var(--color-border)] bg-white px-3 py-2.5 text-sm";
export function ListSetup({ lists, categories, customers, copyId = "" }: { lists: { id: string; name: string; currency: string }[]; categories: { code: string; name: string }[]; customers: PricingCustomer[]; copyId?: string }) {
  const source = lists.find(l => l.id === copyId);
  const [mode, setMode] = useState(source ? "copy" : "blank");
  const [currency, setCurrency] = useState(source?.currency ?? "GBP");
  return <ActionForm action={createPriceList} className="space-y-7">
    <section className="grid gap-4 sm:grid-cols-2"><h3 className="font-semibold sm:col-span-2">1. Name and sales currency</h3>
      <label className="text-sm">Price-list name<input name="name" required maxLength={150} defaultValue={source ? `${source.name} copy` : ""} placeholder="Trade 2027, retail, export…" className={field} /></label>
      <label className="text-sm">Sales currency<select name="currency" value={currency} onChange={e => setCurrency(e.target.value)} className={field}>{SALES_CURRENCIES.map(c => <option key={c}>{c}</option>)}</select></label>
      <p className="text-xs text-[var(--color-ink-muted)] sm:col-span-2">New quotes and orders using this list use its currency. Existing sales documents keep their saved prices.</p>
    </section>
    <section className="space-y-4"><h3 className="font-semibold">2. Choose your starting prices</h3><div className="grid gap-3 sm:grid-cols-3">{[["blank", "Start blank", "Add products or import a spreadsheet."], ["copy", "Copy a price list", "Keep prices, breaks, dates and discount rules."], ["catalogue", "Use catalogue prices", "Load products in this currency, with an optional discount."]].map(([value, title, help]) => <label key={value} className={`cursor-pointer rounded-xl border p-4 text-sm ${mode === value ? "border-blue-500 bg-blue-50/50" : "border-[var(--color-border)]"}`}><input type="radio" name="startMode" value={value} checked={mode === value} onChange={() => setMode(value)} className="mr-2 accent-blue-600" /><span className="font-medium">{title}</span><span className="mt-2 block text-xs leading-relaxed text-[var(--color-ink-muted)]">{help}</span></label>)}</div>
      {mode === "copy" && <label className="block text-sm">Copy from<select name="sourceListId" required defaultValue={copyId} className={field}><option value="">Choose a list in {currency}</option>{lists.filter(l => l.currency === currency).map(l => <option key={l.id} value={l.id}>{l.name} · {l.currency}</option>)}</select><span className="mt-2 block text-xs text-[var(--color-ink-muted)]">Customer assignments and agreements stay on the original list.</span></label>}
      {mode === "catalogue" && <div className="grid gap-4 sm:grid-cols-2"><label className="text-sm">Products<select name="categoryCode" className={field}><option value="">All categories</option>{categories.map(c => <option key={c.code} value={c.code}>{c.name}</option>)}</select></label><label className="text-sm">Discount from catalogue %<input name="catalogueDiscount" type="number" min="0" max="100" step="0.01" defaultValue="0" className={field} /></label><p className="text-xs text-[var(--color-ink-muted)] sm:col-span-2">Only active products priced in {currency} are loaded. You can edit each price and add quantity breaks afterwards.</p></div>}
    </section>
    <section className="space-y-3"><h3 className="font-semibold">3. Assign a customer (optional)</h3><CustomerPicker customers={customers} required={false} label="Initial customer" /><p className="text-xs text-[var(--color-ink-muted)]">Their new sales use this list unless an active agreement overrides it. Branches without their own pricing inherit the parent account. Add more customers after creating the list.</p></section>
    <Button type="submit" variant="primary">Create price list and open prices</Button>
  </ActionForm>;
}
