"use client";

import { useId, useMemo, useState } from "react";
import { Search } from "lucide-react";
import { ActionForm } from "@/components/ui/action-form";
import { Button } from "@/components/ui/button";
import { savePriceEntry } from "./actions";

export type PricingProduct = { id: string; code: string; name: string; categoryCode?: string | null; description?: string | null };

const field = "mt-2 block w-full rounded-xl border border-[var(--color-border)] bg-white px-3 py-2.5 text-sm";

export function ProductSearch({ products, defaultId = "", name = "productId" }: { products: PricingProduct[]; defaultId?: string; name?: string }) {
  const listId = useId();
  const initial = products.find((product) => product.id === defaultId);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState(initial ?? null);
  const [open, setOpen] = useState(false);
  const matches = useMemo(() => {
    const needle = query.trim().toLowerCase();
    const source = needle
      ? products.filter((product) => `${product.code} ${product.name} ${product.categoryCode ?? ""} ${product.description ?? ""}`.toLowerCase().includes(needle))
      : products;
    return source.slice(0, 12);
  }, [products, query]);

  return (
    <div className="text-sm">
      <span className="font-medium">Product</span>
      <input type="hidden" name={name} value={selected?.id ?? ""} required />
      <div className="relative mt-2">
        <Search size={15} className="pointer-events-none absolute left-3 top-3 text-[var(--color-ink-faint)]" />
        <input
          role="combobox"
          aria-expanded={open}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-label="Search products"
          value={open ? query : selected ? `${selected.code} · ${selected.name}` : ""}
          placeholder="Search SKU, name or category"
          onFocus={() => { setOpen(true); setQuery(""); }}
          onChange={(event) => { setQuery(event.target.value); setOpen(true); }}
          onKeyDown={(event) => {
            if (event.key === "Escape") setOpen(false);
            if (event.key === "Enter" && open) {
              event.preventDefault();
              if (matches[0]) { setSelected(matches[0]); setOpen(false); }
            }
          }}
          className="w-full rounded-xl border border-[var(--color-border)] bg-white py-2.5 pl-9 pr-3 text-sm"
        />
        {open && (
          <div id={listId} role="listbox" aria-label="Product results" className="mt-1 max-h-60 overflow-y-auto rounded-xl border border-[var(--color-border)] bg-white p-1 shadow-lg">
            {matches.map((product) => (
              <button
                key={product.id}
                type="button"
                role="option"
                aria-selected={selected?.id === product.id}
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => { setSelected(product); setOpen(false); }}
                className="block w-full rounded-lg px-3 py-2 text-left hover:bg-[var(--color-surface-sunken)]"
              >
                <span className="text-xs font-semibold">{product.code}</span>
                <span className="mt-0.5 block text-xs text-[var(--color-ink-muted)]">{product.name}{product.categoryCode ? ` · ${product.categoryCode}` : ""}</span>
              </button>
            ))}
            {!matches.length && <p className="px-3 py-3 text-xs text-[var(--color-ink-muted)]">No product matches that search.</p>}
          </div>
        )}
      </div>
    </div>
  );
}

export function SetPriceForm({ listId, currency, products, entry }: {
  listId: string;
  currency: string;
  products: PricingProduct[];
  entry?: { productId: string; price: string; quantity: number; discount: number; validFrom: string; validTo: string };
}) {
  return (
    <ActionForm action={savePriceEntry.bind(null, listId)} className="grid gap-4 sm:grid-cols-2">
      <div className="sm:col-span-2"><ProductSearch products={products} defaultId={entry?.productId} /></div>
      <label className="text-sm">Set price ({currency})<input name="price" required type="number" min="0" step="0.01" defaultValue={entry?.price} className={field} /></label>
      <label className="text-sm">Discount %<input name="discount" type="number" min="0" max="100" step="0.01" defaultValue={entry?.discount ?? 0} className={field} /></label>
      <label className="text-sm">From quantity<input name="quantity" required type="number" min="1" step="1" defaultValue={entry?.quantity ?? 1} className={field} /></label>
      <label className="text-sm">Valid from<input name="validFrom" type="date" defaultValue={entry?.validFrom} className={field} /></label>
      <label className="text-sm">Valid until<input name="validTo" type="date" defaultValue={entry?.validTo} className={field} /></label>
      <p className="text-xs leading-relaxed text-[var(--color-ink-muted)] sm:col-span-2">The discount comes off this set price. Quotes and orders that use this list are raised in {currency}, and they show the set price with this discount.</p>
      <Button type="submit" variant="primary" className="justify-self-start">{entry ? "Save price" : "Add price"}</Button>
    </ActionForm>
  );
}
