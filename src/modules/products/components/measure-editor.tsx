"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { saveMeasures } from "@/app/(app)/products/actions";

const field = "mt-1.5 block w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm";
export function MeasureEditor(props: {
  productId: string;
  netWeightGrams: number | null;
  grossWeightGrams: number | null;
  lengthMm: number | null;
  widthMm: number | null;
  heightMm: number | null;
  volumeMl: number | null;
  unitsPerPack: number | null;
  packsPerLayer: number | null;
  layersPerPallet: number | null;
  stackable: boolean | null;
  originCountry: string | null;
  commodityCode: string | null;
  customsDescription: string | null;
  hazardClass: string | null;
  unNumber: string | null;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [netKg, setNetKg] = useState(props.netWeightGrams == null ? "" : String(props.netWeightGrams / 1000));
  const [grossKg, setGrossKg] = useState(props.grossWeightGrams == null ? "" : String(props.grossWeightGrams / 1000));
  const [lengthMm, setLength] = useState(props.lengthMm == null ? "" : String(props.lengthMm));
  const [widthMm, setWidth] = useState(props.widthMm == null ? "" : String(props.widthMm));
  const [heightMm, setHeight] = useState(props.heightMm == null ? "" : String(props.heightMm));
  const [volumeLitres, setVolume] = useState(props.volumeMl == null ? "" : String(props.volumeMl / 1000));
  const [itemsPerPallet, setItemsPerPallet] = useState("");
  const [stackable, setStackable] = useState(props.stackable == null ? "" : props.stackable ? "yes" : "no");
  const [originCountry, setOrigin] = useState(props.originCountry ?? "");
  const [commodityCode, setCommodity] = useState(props.commodityCode ?? "");
  const [customsDescription, setCustoms] = useState(props.customsDescription ?? "");
  const [hazardClass, setHazard] = useState(props.hazardClass ?? "");
  const [unNumber, setUn] = useState(props.unNumber ?? "");
  const [pending, start] = useTransition();
  const [message, setMessage] = useState("");
  const [failed, setFailed] = useState(false);
  if (!open) return <Button type="button" onClick={() => setOpen(true)}>Edit size and weight</Button>;
  const save = () => start(async () => {
    setMessage("");
    try {
      await saveMeasures(props.productId, { netKg, grossKg, lengthMm, widthMm, heightMm, volumeLitres, unitsPerPack: props.unitsPerPack == null ? "" : String(props.unitsPerPack), packsPerLayer: props.packsPerLayer == null ? "" : String(props.packsPerLayer), layersPerPallet: props.layersPerPallet == null ? "" : String(props.layersPerPallet), itemsPerPallet, stackable, originCountry, commodityCode, customsDescription, hazardClass, unNumber });
      setFailed(false);
      setMessage("Size and weight saved.");
      router.refresh();
    } catch (error) {
      setFailed(true);
      setMessage(error instanceof Error ? error.message : "Could not save.");
    }
  });
  return <section className="rounded-2xl border border-slate-200 bg-white p-5">
    <div className="flex items-start justify-between gap-4"><div><h3 className="text-sm font-semibold">SKU pack, size and weight</h3><p className="mt-1 text-xs leading-5 text-slate-500">The SKU is the product code. Enter how many of this SKU go on a pallet, or fill units per pack, packs per layer and layers per pallet. Leave a box empty when you do not know it.</p></div><button type="button" className="text-xs text-slate-500" onClick={() => setOpen(false)}>Close</button></div>
    <div className="mt-4 grid gap-3 sm:grid-cols-3">
      <label className="text-xs text-slate-500">Net kg<input className={field} inputMode="decimal" value={netKg} onChange={(event) => setNetKg(event.target.value)} /></label>
      <label className="text-xs text-slate-500">Gross kg<input className={field} inputMode="decimal" value={grossKg} onChange={(event) => setGrossKg(event.target.value)} /></label>
      <label className="text-xs text-slate-500">Volume, litres<input className={field} inputMode="decimal" value={volumeLitres} onChange={(event) => setVolume(event.target.value)} /></label>
      <label className="text-xs text-slate-500">Length mm<input className={field} inputMode="decimal" value={lengthMm} onChange={(event) => setLength(event.target.value)} /></label>
      <label className="text-xs text-slate-500">Width mm<input className={field} inputMode="decimal" value={widthMm} onChange={(event) => setWidth(event.target.value)} /></label>
      <label className="text-xs text-slate-500">Height mm<input className={field} inputMode="decimal" value={heightMm} onChange={(event) => setHeight(event.target.value)} /></label>
      <label className="text-xs text-slate-500">Items on a pallet<input className={field} inputMode="numeric" value={itemsPerPallet} onChange={(event) => setItemsPerPallet(event.target.value)} placeholder="Use this if you only know the pallet quantity" /></label>
      <p className="text-xs leading-5 text-slate-500 sm:col-span-3">How many go in a box or pack, and which products this one contains or needs, are saved with the pack links on this product.</p>
      <label className="text-xs text-slate-500">Stackable<select className={field} value={stackable} onChange={(event) => setStackable(event.target.value)}><option value="">Not set</option><option value="yes">Yes</option><option value="no">No</option></select></label>
      <label className="text-xs text-slate-500">Origin<input className={field} value={originCountry} maxLength={2} onChange={(event) => setOrigin(event.target.value)} /></label>
      <label className="text-xs text-slate-500">Commodity code<input className={field} value={commodityCode} onChange={(event) => setCommodity(event.target.value)} /></label>
      <label className="text-xs text-slate-500 sm:col-span-2">Customs description<input className={field} value={customsDescription} onChange={(event) => setCustoms(event.target.value)} /></label>
      <label className="text-xs text-slate-500">Hazard class<input className={field} value={hazardClass} onChange={(event) => setHazard(event.target.value)} /></label>
      <label className="text-xs text-slate-500">UN number<input className={field} value={unNumber} onChange={(event) => setUn(event.target.value)} /></label>
    </div>
    <div className="mt-4 flex flex-wrap items-center gap-3"><Button type="button" variant="primary" disabled={pending} onClick={save}>{pending ? "Saving…" : "Save size and weight"}</Button><p role={failed ? "alert" : "status"} className={`text-xs ${failed ? "text-red-600" : "text-slate-500"}`}>{message}</p></div>
  </section>;
}
