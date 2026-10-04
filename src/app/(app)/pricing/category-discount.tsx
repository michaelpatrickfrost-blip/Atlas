"use client";

import { useId, useMemo, useState } from "react";
import { Search } from "lucide-react";
import { ActionForm } from "@/components/ui/action-form";
import { Button } from "@/components/ui/button";
import { saveRule } from "./actions";

export type PricingCategory = { code: string; name: string };

const field = "mt-2 block w-full rounded-xl border border-[var(--color-border)] bg-white px-3 py-2.5 text-sm";

export function CategorySearch({ categories, defaultCode = "" }: { categories: PricingCategory[]; defaultCode?: string }) {
  const listId = useId();
  const initial = categories.find((category) => category.code === defaultCode);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState(initial ?? null);
  const [open, setOpen] = useState(false);
  const matches = useMemo(() => {
    const needle = query.trim().toLowerCase();
    const source = needle ? categories.filter((category) => `${category.code} ${category.name}`.toLowerCase().includes(needle)) : categories;
    return source.slice(0, 12);
  }, [categories, query]);

  return (
    <div className="text-sm sm:col-span-2">
      <span className="font-medium">Category</span>
      <input type="hidden" name="categoryCode" value={selected?.code ?? ""} required />
      <div className="relative mt-2">
        <Search size={15} className="pointer-events-none absolute left-3 top-3 text-[var(--color-ink-faint)]" />
        <input
          role="combobox"
          aria-expanded={open}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-label="Search categories"
          value={open ? query : selected ? `${selected.name} · ${selected.code}` : ""}
          placeholder="Search category name or code"
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
          <div id={listId} role="listbox" aria-label="Category results" className="mt-1 max-h-60 overflow-y-auto rounded-xl border border-[var(--color-border)] bg-white p-1 shadow-lg">
            {matches.map((category) => (
              <button key={category.code} type="button" role="option" aria-selected={selected?.code === category.code} onMouseDown={(event) => event.preventDefault()} onClick={() => { setSelected(category); setOpen(false); }} className="block w-full rounded-lg px-3 py-2 text-left hover:bg-[var(--color-surface-sunken)]">
                <span className="text-xs font-semibold">{category.name}</span>
                <span className="mt-0.5 block text-xs text-[var(--color-ink-muted)]">{category.code}</span>
              </button>
            ))}
            {!matches.length && <p className="px-3 py-3 text-xs text-[var(--color-ink-muted)]">No category matches that search.</p>}
          </div>
        )}
      </div>
    </div>
  );
}

export function CategoryDiscountForm({ listId, categories, entry }: {
  listId: string;
  categories: PricingCategory[];
  entry?: { id: string; categoryCode: string; discount: number; quantity: number };
}) {
  return (
    <ActionForm action={saveRule.bind(null, listId)} className="grid gap-4 sm:grid-cols-2">
      <input type="hidden" name="ruleId" value={entry?.id ?? ""} />
      <input type="hidden" name="scope" value="CATEGORY" />
      <input type="hidden" name="method" value="PERCENT" />
      <input type="hidden" name="priority" value="0" />
      <CategorySearch categories={categories} defaultCode={entry?.categoryCode} />
      <label className="text-sm">Overall discount %<input name="value" required type="number" min="0" max="100" step="0.01" defaultValue={entry?.discount ?? ""} className={field} /></label>
      <label className="text-sm">From quantity<input name="quantity" required type="number" min="1" step="1" defaultValue={entry?.quantity ?? 1} className={field} /></label>
      <p className="text-xs leading-relaxed text-[var(--color-ink-muted)] sm:col-span-2">Every product in this category uses this discount, unless that product has its own set price. Quotes and orders show the catalogue price and take this percent off it, in the list’s sales currency.</p>
      <Button type="submit" variant="primary" className="justify-self-start">{entry ? "Save discount" : "Add category discount"}</Button>
    </ActionForm>
  );
}
