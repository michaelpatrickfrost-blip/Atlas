"use client";

import { useMemo, useState } from "react";
import { ActionForm } from "@/components/ui/action-form";
import { Button } from "@/components/ui/button";
import { openCallOffOrder } from "@/modules/sales/services/commercial";

type Customer = { id: string; name: string; code: string };
type Product = { id: string; code: string; name: string; unit: string };

export function CallOffOrderForm({ customers, products, initialCustomer }: { customers: Customer[]; products: Product[]; initialCustomer?: string }) {
  const [customerId, setCustomerId] = useState(customers.some((customer) => customer.id === initialCustomer) ? initialCustomer! : customers[0]?.id ?? "");
  const [search, setSearch] = useState("");
  const [lines, setLines] = useState<Array<{ key: string; productId: string; quantity: number }>>([{ key: "1", productId: "", quantity: 1 }]);
  const matches = useMemo(() => {
    const query = search.trim().toLowerCase();
    const rows = query ? products.filter((product) => `${product.code} ${product.name}`.toLowerCase().includes(query)) : products;
    return rows.slice(0, 40);
  }, [products, search]);
  return (
    <ActionForm action={openCallOffOrder} className="space-y-5 rounded-2xl border border-slate-200 bg-white p-6">
      <input type="hidden" name="lines" value={JSON.stringify(lines.filter((line) => line.productId && line.quantity > 0).map(({ productId, quantity }) => ({ productId, quantity })))} />
      <label className="block text-sm">Customer
        <select name="partyId" value={customerId} onChange={(event) => setCustomerId(event.target.value)} required className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2">
          {customers.map((customer) => <option key={customer.id} value={customer.id}>{customer.name} · {customer.code}</option>)}
        </select>
      </label>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block text-sm">Order runs until
          <input type="date" name="endsAt" required className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2" />
        </label>
        <label className="block text-sm">Customer PO
          <input name="customerPoReference" maxLength={150} className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2" />
        </label>
      </div>
      <div className="space-y-3">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <h3 className="text-sm font-semibold">Items on the order</h3>
          <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search SKU or name" className="rounded-xl border border-slate-200 px-3 py-2 text-sm" />
        </div>
        {lines.map((line) => (
          <div key={line.key} className="grid gap-2 sm:grid-cols-[1fr_8rem_auto] sm:items-center">
            <select value={line.productId} onChange={(event) => setLines(lines.map((item) => item.key === line.key ? { ...item, productId: event.target.value } : item))} className="rounded-xl border border-slate-200 px-3 py-2 text-sm">
              <option value="">Choose a product</option>
              {(line.productId && !matches.some((product) => product.id === line.productId) ? products.filter((product) => product.id === line.productId) : []).concat(matches).map((product) => <option key={product.id} value={product.id}>{product.code} · {product.name}</option>)}
            </select>
            <input type="number" min={1} step={1} value={line.quantity} onChange={(event) => setLines(lines.map((item) => item.key === line.key ? { ...item, quantity: Number(event.target.value) } : item))} aria-label="Quantity" className="rounded-xl border border-slate-200 px-3 py-2 text-sm" />
            <button type="button" className="text-sm text-slate-500" onClick={() => setLines(lines.length === 1 ? lines : lines.filter((item) => item.key !== line.key))}>Remove</button>
          </div>
        ))}
        <button type="button" className="text-sm text-blue-600" onClick={() => setLines([...lines, { key: crypto.randomUUID(), productId: "", quantity: 1 }])}>Add another item</button>
        <p className="text-xs text-slate-500">The quantity is the whole order. The price is the customer’s current price. You deliver and invoice part of it afterwards.</p>
      </div>
      <Button type="submit" variant="primary">Save call-off order</Button>
    </ActionForm>
  );
}
