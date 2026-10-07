"use client";

import { useMemo, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { CreateDialog } from "@/components/ui/create-dialog";
import { formatMoney } from "@/core/shared/money";
import { SetPriceForm, type PricingProduct } from "./product-search";

export type SheetPreview = {
  skipped: number;
  issues: { line: number; productCode: string; message: string }[];
  rows: { line: number; productCode: string; productName: string; minimumQuantity: number; unitPrice: number; discountPercent: number; validFrom: string; validTo: string; action: "add" | "update" | "error"; message: string }[];
};

export function PriceCsv({ preview, apply, templateHref, sheetHref }: {
  preview: (csv: string) => Promise<SheetPreview>;
  apply: (csv: string) => Promise<{ saved: number }>;
  templateHref: string;
  sheetHref: string;
}) {
  const [pending, start] = useTransition();
  const [fileText, setFileText] = useState("");
  const [fileName, setFileName] = useState("");
  const [result, setResult] = useState<SheetPreview | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState(false);
  const problems = (result?.issues.length ?? 0) + (result?.rows.filter((row) => row.action === "error").length ?? 0);
  const ready = !!result && problems === 0 && result.rows.length > 0;

  return (
    <section className="rounded-[22px] border border-[var(--color-border)] bg-white p-5 shadow-[var(--shadow-atlas)]">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="max-w-xl">
          <h3 className="text-sm font-semibold">Spreadsheet</h3>
          <p className="mt-1 text-sm leading-relaxed text-[var(--color-ink-muted)]">Download the products, type the set prices and any discount, then upload the same file. Empty price cells stay as they are. A product left out of the file is not removed.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <a href={sheetHref} className="rounded-full border border-[var(--color-border)] bg-white px-4 py-2 text-sm font-semibold text-[var(--color-atlas-blue)]">Download spreadsheet</a>
          <a href={templateHref} className="rounded-full px-4 py-2 text-sm text-[var(--color-ink-muted)]">Blank template</a>
        </div>
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <label className="inline-flex cursor-pointer items-center rounded-full bg-[var(--color-atlas-blue)] px-4 py-2.5 text-sm font-semibold text-white">
          {fileName ? "Choose another file" : "Choose CSV"}
          <input
            type="file"
            accept=".csv,text/csv"
            className="sr-only"
            onChange={(event) => {
              const file = event.target.files?.[0];
              event.currentTarget.value = "";
              if (!file) return;
              setFileName(file.name);
              setMessage("");
              start(async () => {
                try {
                  const text = await file.text();
                  setFileText(text);
                  setResult(await preview(text));
                  setError(false);
                } catch (caught) {
                  setResult(null);
                  setFileText("");
                  setError(true);
                  setMessage(caught instanceof Error ? caught.message : "Could not read that file.");
                }
              });
            }}
          />
        </label>
        {fileName && <span className="text-sm text-[var(--color-ink-muted)]">{fileName}</span>}
        <Button type="button" variant="primary" disabled={!ready || pending} onClick={() => start(async () => {
          try {
            const saved = await apply(fileText);
            setMessage(`Updated ${saved.saved} ${saved.saved === 1 ? "price" : "prices"}.`);
            setError(false);
            setResult(null);
            setFileName("");
            setFileText("");
          } catch (caught) {
            setError(true);
            setMessage(caught instanceof Error ? caught.message : "Upload failed. Nothing was changed.");
          }
        })}>
          Upload prices
        </Button>
      </div>
      {message && <p role={error ? "alert" : "status"} className={`mt-3 text-sm ${error ? "text-[var(--color-status-danger)]" : "text-[var(--color-ink-muted)]"}`}>{pending ? "Checking the file…" : message}</p>}
      {result && (
        <div className="mt-4 overflow-x-auto">
          <p className="mb-2 text-xs text-[var(--color-ink-muted)]">{result.rows.length} priced {result.rows.length === 1 ? "row" : "rows"}{result.skipped ? ` · ${result.skipped} blank ${result.skipped === 1 ? "row" : "rows"} skipped` : ""}{problems ? ` · ${problems} to fix` : ""}</p>
          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr className="border-b border-[var(--color-border)] text-left text-xs uppercase tracking-wide text-[var(--color-ink-faint)]">
                <th className="py-2 pr-3 font-medium">Product</th>
                <th className="py-2 pr-3 font-medium">From qty</th>
                <th className="py-2 pr-3 font-medium">Set price</th>
                <th className="py-2 pr-3 font-medium">Discount</th>
                <th className="py-2 font-medium">Result</th>
              </tr>
            </thead>
            <tbody>
              {result.rows.slice(0, 12).map((row) => (
                <tr key={`${row.line}-${row.productCode}`} className="border-b border-[var(--color-border)] last:border-0">
                  <td className="py-2 pr-3">{row.productCode}{row.productName ? ` · ${row.productName}` : ""}</td>
                  <td className="py-2 pr-3">{row.minimumQuantity}</td>
                  <td className="py-2 pr-3">{row.unitPrice.toFixed(2)}</td>
                  <td className="py-2 pr-3">{row.discountPercent ? `${row.discountPercent}%` : "—"}</td>
                  <td className={`py-2 ${row.action === "error" ? "text-[var(--color-status-danger)]" : "text-[var(--color-ink-muted)]"}`}>{row.action === "error" ? row.message : row.action === "update" ? "Updates the current price" : "Adds a price"}</td>
                </tr>
              ))}
              {result.issues.slice(0, 8).map((issue) => (
                <tr key={`issue-${issue.line}-${issue.message}`} className="border-b border-[var(--color-border)] last:border-0">
                  <td className="py-2 pr-3">{issue.productCode || `Row ${issue.line}`}</td>
                  <td className="py-2 pr-3" colSpan={4}>{issue.message}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {result.rows.length > 12 && <p className="mt-2 text-xs text-[var(--color-ink-muted)]">Showing the first 12 rows. Upload applies the whole file.</p>}
        </div>
      )}
    </section>
  );
}

export function PriceFilter({ rows, currency, remove, products, listId }: { currency: string; products?: PricingProduct[]; listId?: string; rows: { id: string; active?: boolean; productId: string; code: string; name: string; quantity: number; price: string; discount: number; from: string; until: string; validFrom: string; validTo: string }[]; remove?: (id: string, form: FormData) => Promise<void> }) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("active");
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState("code");
  const today = new Date().toISOString().slice(0, 10);
  const rowStatus = (row: typeof rows[number]) => row.active === false ? "inactive" : row.validFrom && row.validFrom > today ? "scheduled" : row.validTo && row.validTo < today ? "expired" : "current";
  const shown = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return rows.filter(row => (!needle || `${row.code} ${row.name}`.toLowerCase().includes(needle)) && (status === "all" || (status === "active" ? row.active !== false : rowStatus(row) === status))).sort((a, b) => sort === "price" ? Number(a.price) - Number(b.price) : a.code.localeCompare(b.code) || a.quantity - b.quantity);
    // rowStatus only depends on the date and row values.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, rows, status, sort, today]);
  const pages = Math.max(1, Math.ceil(shown.length / 30));
  const currentPage = Math.min(page, pages);
  const visible = shown.slice((currentPage - 1) * 30, currentPage * 30);
  return (
    <div>
      <div className="flex flex-wrap items-end gap-3 border-b border-[var(--color-border)] p-4">
        <label className="min-w-48 flex-1 text-xs text-[var(--color-ink-muted)]">Search prices<input value={query} onChange={event => { setQuery(event.target.value); setPage(1); }} placeholder="Product code or name" className="mt-1 block w-full rounded-xl border border-[var(--color-border)] bg-white px-3 py-2 text-sm" /></label>
        <label className="text-xs text-[var(--color-ink-muted)]">Validity<select value={status} onChange={e => { setStatus(e.target.value); setPage(1); }} className="mt-1 block rounded-xl border border-[var(--color-border)] bg-white px-3 py-2 text-sm"><option value="active">Active rows</option><option value="current">In effect today</option><option value="scheduled">Scheduled</option><option value="expired">Expired</option><option value="inactive">Inactive</option><option value="all">All rows</option></select></label>
        <label className="text-xs text-[var(--color-ink-muted)]">Sort<select value={sort} onChange={e => { setSort(e.target.value); setPage(1); }} className="mt-1 block rounded-xl border border-[var(--color-border)] bg-white px-3 py-2 text-sm"><option value="code">Product code</option><option value="price">Set price: low to high</option></select></label>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[680px] text-sm">
          <thead>
            <tr className="border-b border-[var(--color-border)] text-left text-xs uppercase tracking-wide text-[var(--color-ink-faint)]">
              <th className="px-5 py-3 font-medium">Product</th>
              <th className="px-3 py-3 font-medium">From qty</th>
              <th className="px-3 py-3 text-right font-medium">Set price</th>
              <th className="px-3 py-3 text-right font-medium">Discount</th>
              <th className="px-3 py-3 text-right font-medium">You charge</th>
              <th className="px-5 py-3 font-medium">Dates</th>
              {remove && <th className="px-5 py-3 font-medium" />}
            </tr>
          </thead>
          <tbody>
            {visible.map((row) => (
              <tr key={row.id} className="border-b border-[var(--color-border)] last:border-0">
                <td className="px-5 py-3"><span className="font-medium">{row.code}</span><span className="mt-0.5 block text-xs text-[var(--color-ink-muted)]">{row.name}</span>{rowStatus(row) !== "current" && <span className="mt-1 block text-xs text-[var(--color-ink-muted)]">{rowStatus(row)}</span>}</td>
                <td className="px-3 py-3">{row.quantity}</td>
                <td className="px-3 py-3 text-right font-medium">{formatMoney(Number(row.price), currency)}</td>
                <td className="px-3 py-3 text-right">{row.discount ? `${row.discount}%` : "—"}</td>
                <td className="px-3 py-3 text-right font-medium">{formatMoney(Math.round(Number(row.price) * (1 - row.discount / 100)), currency)}</td>
                <td className="px-5 py-3 text-[var(--color-ink-muted)]">{row.from || "Any start"} → {row.until || "No end"}</td>
                {remove && (
                  <td className="px-5 py-3 text-right">
                    <div className="flex items-center justify-end gap-3">
                      {products && listId && (
                        <CreateDialog label="Edit" title={`Edit ${row.code}`} variant="secondary">
                          <SetPriceForm listId={listId} currency={currency} products={products} entry={{ id: row.id, productId: row.productId, price: (Number(row.price) / 100).toFixed(2), quantity: row.quantity, discount: row.discount, validFrom: row.validFrom, validTo: row.validTo }} />
                        </CreateDialog>
                      )}
                      <form action={(form) => { form.set("active", String(row.active === false)); return remove(row.id, form); }}>
                        <button type="submit" className="text-xs text-[var(--color-ink-muted)] hover:text-[var(--color-ink)]">{row.active === false ? "Restore" : "Deactivate"}</button>
                      </form>
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
        {!shown.length && <p className="px-5 py-8 text-sm text-[var(--color-ink-muted)]">{rows.length ? "No product matches that search." : "No product prices yet. Use “Add product price” above, or import a spreadsheet."}</p>}
      </div>
      <div className="flex items-center justify-between border-t border-[var(--color-border)] px-5 py-3 text-xs text-[var(--color-ink-muted)]"><span>{shown.length} matching prices · page {currentPage} of {pages}</span><div className="flex gap-3"><button type="button" disabled={currentPage === 1} onClick={() => setPage(currentPage - 1)} className="disabled:opacity-30">Previous</button><button type="button" disabled={currentPage === pages} onClick={() => setPage(currentPage + 1)} className="disabled:opacity-30">Next</button></div></div>
    </div>
  );
}
