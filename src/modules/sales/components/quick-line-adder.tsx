"use client";
import { useState, useRef, useId } from "react";
import { createPortal } from "react-dom";
import { Plus, X } from "lucide-react";
import { formatMoney } from "@/core/shared/money";
import type { DocumentData } from "./document-types";

/**
 * Quick-line adder: search a product, pick it, set quantity, Enter to add
 * the next one. Streamlined for rapid order/quote building.
 */
export function QuickLineAdder({
  products,
  currency,
  price,
  onAdd,
  disabled,
}: {
  products: DocumentData["products"];
  currency: string;
  price: (id: string) => number;
  onAdd: (productId: string, quantity: number) => void;
  disabled?: boolean;
}) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const [selectedProduct, setSelectedProduct] = useState<string | null>(null);
  const [quantity, setQuantity] = useState("1");
  const wrapper = useRef<HTMLDivElement>(null);
  const searchInput = useRef<HTMLInputElement>(null);
  const qtyInput = useRef<HTMLInputElement>(null);
  const id = useId();

  const matches = query
    ? products
        .filter((p) => `${p.code} ${p.name} ${p.categoryCode ?? ""}`.toLowerCase().includes(query.toLowerCase()))
        .slice(0, 10)
    : [];
  const chosen = products.find((p) => p.id === selectedProduct);

  function chooseProduct(productId: string) {
    setSelectedProduct(productId);
    setQuantity("1");
    setOpen(false);
    setQuery("");
    setTimeout(() => qtyInput.current?.focus(), 0);
  }

  function confirmAdd() {
    if (!selectedProduct) return;
    const qty = Math.max(1, parseInt(quantity) || 1);
    onAdd(selectedProduct, qty);
    setSelectedProduct(null);
    setQuantity("1");
    setQuery("");
    searchInput.current?.focus();
  }

  function cancel() {
    setSelectedProduct(null);
    setQuantity("1");
    setQuery("");
    searchInput.current?.focus();
  }

  // Keyboard handlers
  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Escape") {
      if (selectedProduct) cancel();
      else if (open) setOpen(false);
    }
    if (e.key === "Enter") {
      e.preventDefault();
      if (open && matches[active]) {
        chooseProduct(matches[active].id);
      } else if (selectedProduct) {
        confirmAdd();
      } else if (matches[0]) {
        chooseProduct(matches[0].id);
      }
    }
    if (open && e.key === "ArrowDown") {
      e.preventDefault();
      setActive((i) => (i + 1) % matches.length);
    }
    if (open && e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => (i - 1 + matches.length) % matches.length);
    }
    if (e.key === "Tab" && selectedProduct && !e.shiftKey) {
      e.preventDefault();
      qtyInput.current?.focus();
    }
  }

  if (disabled) return null;

  return (
    <div ref={wrapper} className="relative" onKeyDown={handleKeyDown}>
      <div className="flex gap-2">
        <div className="relative flex-1">
          <input
            ref={searchInput}
            type="text"
            placeholder="Search SKU, product or category..."
            value={open || selectedProduct ? query : chosen ? `[${chosen.code}] ${chosen.name}` : ""}
            onChange={(e) => {
              const val = e.target.value;
              setQuery(val);
              setActive(0);
              setOpen(true);
            }}
            onFocus={() => setOpen(true)}
            onBlur={() => setTimeout(() => setOpen(false), 150)}
            disabled={!!selectedProduct}
            className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-9 pr-3 text-sm"
          />
        </div>
        {selectedProduct && (
          <div className="flex items-center gap-2">
            <input
              ref={qtyInput}
              type="number"
              min="1"
              step="1"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") confirmAdd();
                if (e.key === "Escape") cancel();
              }}
              className="w-20 rounded-xl border border-slate-200 py-2.5 px-3 text-sm text-right"
              autoFocus
            />
            <button
              type="button"
              onClick={confirmAdd}
              className="rounded-xl bg-blue-600 p-2.5 text-white hover:bg-blue-700"
              aria-label="Add line"
            >
              <Plus size={18} />
            </button>
            <button
              type="button"
              onClick={cancel}
              className="rounded-xl border border-slate-200 p-2.5 text-slate-500 hover:bg-slate-50"
              aria-label="Cancel"
            >
              <X size={18} />
            </button>
          </div>
        )}
      </div>

      {open && query && matches.length > 0 && (
        <div
          style={{ position: "fixed", left: 0, top: 0, pointerEvents: "none" }}
          className="z-[80]"
        >
          <div className="pointer-events-auto max-h-60 overflow-y-auto rounded-xl border border-slate-200 bg-white p-1 shadow-xl w-96">
            {matches.map((p, i) => (
              <button
                key={p.id}
                type="button"
                role="option"
                aria-selected={i === active}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => chooseProduct(p.id)}
                className={`block w-full rounded-lg p-3 text-left ${i === active ? "bg-blue-50" : "hover:bg-slate-50"}`}
              >
                <div className="flex justify-between gap-3">
                  <span className="text-xs font-semibold">{p.code}</span>
                  <span className="text-xs font-medium text-blue-600">{formatMoney(price(p.id), currency)}</span>
                </div>
                <p className="mt-1 text-xs text-slate-600">{p.name}</p>
                <p className="mt-2 text-[10px] text-slate-400">
                  {p.categoryCode ? `${p.categoryCode} · ` : ""}{p.unit}
                  {p.stock != null ? ` · ${p.stock > 0 ? `${p.stock} in stock` : "Out of stock"}` : ""}
                </p>
              </button>
            ))}
          </div>
        </div>
      )}

      {open && query && matches.length === 0 && (
        <div
          style={{ position: "fixed", left: 0, top: 0, pointerEvents: "none" }}
          className="z-[80]"
        >
          <div className="pointer-events-auto rounded-xl border border-slate-200 bg-white p-4 shadow-xl w-96 text-center text-sm text-slate-500">
            No products match "{query}"
          </div>
        </div>
      )}
    </div>
  );
}
