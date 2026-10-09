"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { CATEGORY_CLASSES, categoryLabel } from "@/core/products/categories";
import { saveProductRecord } from "@/app/(app)/products/actions";

const field = "mt-1.5 block w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm";

export function ProductDetails(props: {
  product: { id: string; code: string; name: string; description: string | null; categoryCode: string | null; itemClass: string; kind: string; unitOfMeasure: string; basePriceAmount: number; baseCurrency: string; taxCategory: string | null; barcode: string | null; trackingMode: string; active: boolean; sellable?: boolean };
  categories: Array<{ code: string; name: string; itemClass: string; active: boolean }>;
}) {
  const router = useRouter();
  const { product } = props;
  const [code, setCode] = useState(product.code);
  const [name, setName] = useState(product.name);
  const [description, setDescription] = useState(product.description ?? "");
  const [categoryCode, setCategory] = useState(product.categoryCode ?? "");
  const [itemClass, setClass] = useState(product.itemClass || "OTHER");
  const [unit, setUnit] = useState(product.unitOfMeasure);
  const [price, setPrice] = useState(String(product.basePriceAmount / 100));
  const [currency, setCurrency] = useState(product.baseCurrency);
  const [taxCategory, setTax] = useState(product.taxCategory ?? "STANDARD");
  const [kind, setKind] = useState(product.kind);
  const [barcode, setBarcode] = useState(product.barcode ?? "");
  const [trackingMode, setTracking] = useState(product.trackingMode || "NONE");
  const [sellable, setSellable] = useState(product.sellable !== false);
  const [active, setActive] = useState(product.active);
  const [pending, start] = useTransition();
  const [message, setMessage] = useState("");
  const [failed, setFailed] = useState(false);
  const save = () => start(async () => {
    setMessage("");
    try {
      await saveProductRecord(product.id, { code, name, description, categoryCode, itemClass, unit, price: Number(price), currency, taxCategory, kind, barcode, trackingMode, active, sellable });
      setFailed(false);
      setMessage("Product saved.");
      router.refresh();
    } catch (error) {
      setFailed(true);
      setMessage(error instanceof Error ? error.message : "Could not save the product.");
    }
  });
  return <section className="rounded-2xl border border-slate-200 bg-white p-5">
    <h3 className="text-sm font-semibold">Product</h3>
    <p className="mt-1 text-xs leading-5 text-slate-500">The same product is used by Inventory, Sales and Manufacturing. Class says what it is. Category is the group price rules match. Choosing a category fills the class; you can change it.</p>
    <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      <label className="text-xs text-slate-500">SKU<input className={field} value={code} onChange={(event) => setCode(event.target.value)} /></label>
      <label className="text-xs text-slate-500 sm:col-span-2">Name<input className={field} value={name} onChange={(event) => setName(event.target.value)} /></label>
      <label className="text-xs text-slate-500 sm:col-span-2 lg:col-span-3">Description<textarea className={field} rows={2} value={description} onChange={(event) => setDescription(event.target.value)} /></label>
      <label className="text-xs text-slate-500">Class<select className={field} value={itemClass} onChange={(event) => setClass(event.target.value)}>{CATEGORY_CLASSES.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}</select></label>
      <label className="text-xs text-slate-500">Category<select className={field} value={categoryCode} onChange={(event) => { const code = event.target.value; setCategory(code); const category = props.categories.find((item) => item.code === code); if (category) setClass(category.itemClass); }}><option value="">No category</option>{props.categories.map((category) => <option key={category.code} value={category.code}>{category.name} · {categoryLabel(category.itemClass)}{category.active ? "" : " · retired"}</option>)}</select></label>
      <label className="text-xs text-slate-500">Type<select className={field} value={kind} onChange={(event) => setKind(event.target.value)}><option value="PRODUCT">Product</option><option value="SERVICE">Service</option><option value="CHARGE">Charge</option></select></label>
      <label className="text-xs text-slate-500">Unit<input className={field} value={unit} onChange={(event) => setUnit(event.target.value)} /></label>
      <label className="text-xs text-slate-500">Standard price<input className={field} inputMode="decimal" value={price} onChange={(event) => setPrice(event.target.value)} /></label>
      <label className="text-xs text-slate-500">Currency<input className={field} value={currency} onChange={(event) => setCurrency(event.target.value)} /></label>
      <label className="text-xs text-slate-500">Tax<select className={field} value={taxCategory} onChange={(event) => setTax(event.target.value)}><option value="STANDARD">Standard</option><option value="ZERO_RATED">Zero rated</option><option value="EXEMPT">Exempt</option></select></label>
      <label className="text-xs text-slate-500">Barcode<input className={field} value={barcode} onChange={(event) => setBarcode(event.target.value)} /></label>
      <label className="text-xs text-slate-500">Stock tracking<select className={field} value={trackingMode} onChange={(event) => setTracking(event.target.value)}><option value="NONE">Quantity only</option><option value="LOT">Lot or batch</option><option value="SERIAL">Serial number</option></select></label>
      <label className="flex items-end gap-2 pb-2 text-xs text-slate-600"><input type="checkbox" checked={sellable} onChange={(event) => setSellable(event.target.checked)} />Sellable in Sales</label>
      <p className="text-xs leading-5 text-slate-500 sm:col-span-2 lg:col-span-3">Internal materials, packaging and intermediate items can stay active for stock, purchasing and recipes with Sellable turned off.</p>
      <label className="flex items-end gap-2 pb-2 text-xs text-slate-600"><input type="checkbox" checked={active} onChange={(event) => setActive(event.target.checked)} />Active in the catalogue</label>
    </div>
    <div className="mt-4 flex flex-wrap items-center gap-3"><Button type="button" variant="primary" disabled={pending} onClick={save}>{pending ? "Saving…" : "Save product"}</Button><p role={failed ? "alert" : "status"} className={`text-xs ${failed ? "text-red-600" : "text-slate-500"}`}>{message}</p></div>
  </section>;
}
