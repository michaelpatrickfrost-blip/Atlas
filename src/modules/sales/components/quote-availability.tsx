"use client";

import { stockPromiseLabel, type SupplyArrival } from "@/core/availability/stock-promise";

export function QuoteAvailability({ stock, quantity, arrivals, invoiceWhenInStock, onInvoiceWhenInStock }: {
  stock: number | null;
  quantity: number;
  arrivals: SupplyArrival[];
  invoiceWhenInStock: boolean;
  onInvoiceWhenInStock: (value: boolean) => void;
}) {
  if (stock == null) return <span>—</span>;
  const short = quantity > stock;
  const label = stockPromiseLabel(stock, quantity, arrivals);
  return (
    <div className="min-w-36">
      <p className="tabular-nums">{stock} in stock</p>
      {short && (
        <p className="group relative mt-1">
          <span title={label} className="cursor-help rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-medium text-amber-800">Out of stock</span>
          <span role="tooltip" className="pointer-events-none absolute left-0 top-full z-20 mt-1 hidden w-56 rounded-lg border border-slate-200 bg-white p-2 text-[11px] leading-relaxed text-slate-700 shadow-lg group-hover:block">{label}</span>
        </p>
      )}
      {short && (
        <label className="mt-2 flex items-start gap-2 text-[11px] leading-snug text-slate-600">
          <input type="checkbox" className="mt-0.5" checked={invoiceWhenInStock} onChange={(event) => onInvoiceWhenInStock(event.target.checked)} aria-label="Add to confirmation. Deliver and invoice when back in stock" />
          <span>Add to confirmation. Deliver and invoice when back in stock.</span>
        </label>
      )}
    </div>
  );
}
