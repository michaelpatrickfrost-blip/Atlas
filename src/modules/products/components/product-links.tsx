"use client";
import Link from "next/link";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { saveLinks, savePack } from "@/app/(app)/products/actions";

const field = "mt-1.5 block w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm";
type Row = { relatedProductId: string; quantity: string; notes: string };
type Choice = { id: string; code: string; name: string; unit: string };
const blank = (): Row => ({ relatedProductId: "", quantity: "1", notes: "" });
function ReadRows({ rows, choices, itemPrefix, empty }: { rows: Row[]; choices: Choice[]; itemPrefix: string; empty: string }) {
  const itemHref = (id: string) => `${itemPrefix}${id}`;
  const named = rows.filter((row) => row.relatedProductId);
  if (!named.length) return <p className="text-xs text-slate-500">{empty}</p>;
  return <div className="flex flex-wrap gap-2">{named.map((row) => { const choice = choices.find((item) => item.id === row.relatedProductId); return <Link key={row.relatedProductId} href={itemHref(row.relatedProductId)} className="rounded-xl border border-slate-200 px-3 py-2 text-sm hover:bg-slate-50">{choice?.name ?? "Product"}<span className="ml-2 text-xs text-slate-400">{row.quantity}{choice ? ` ${choice.unit}` : ""}{row.notes ? ` · ${row.notes}` : ""}</span></Link>; })}</div>;
}

export function ProductLinks(props: {
  productId: string;
  itemPrefix: string;
  canEdit: boolean;
  goods: boolean;
  sku: string;
  packUnit: string;
  unitsPerPack: number | null;
  packsPerLayer: number | null;
  layersPerPallet: number | null;
  contains: Row[];
  requires: Row[];
  packedIn: Array<{ id: string; code: string; name: string; quantity: number; packUnit: string }>;
  neededBy: Array<{ id: string; code: string; name: string; quantity: number }>;
  choices: Choice[];
}) {
  const router = useRouter();
  const [packUnit, setPackUnit] = useState(props.packUnit);
  const [unitsPerPack, setUnits] = useState(props.unitsPerPack == null ? "" : String(props.unitsPerPack));
  const [packsPerLayer, setLayers] = useState(props.packsPerLayer == null ? "" : String(props.packsPerLayer));
  const [layersPerPallet, setPallet] = useState(props.layersPerPallet == null ? "" : String(props.layersPerPallet));
  const [itemsPerPallet, setItemsPerPallet] = useState("");
  const [contains, setContains] = useState<Row[]>(props.contains.length ? props.contains : []);
  const [requires, setRequires] = useState<Row[]>(props.requires.length ? props.requires : []);
  const [pending, start] = useTransition();
  const [message, setMessage] = useState("");
  const [failed, setFailed] = useState(false);
  const word = packUnit.trim() || "pack";
  const save = () => start(async () => {
    setMessage("");
    try {
      if (props.goods) await savePack(props.productId, { packUnit, unitsPerPack, packsPerLayer, layersPerPallet, itemsPerPallet });
      const rows = [
        ...contains.filter((row) => row.relatedProductId).map((row) => ({ relatedProductId: row.relatedProductId, kind: "CONTAINS" as const, quantity: Number(row.quantity), notes: row.notes })),
        ...requires.filter((row) => row.relatedProductId).map((row) => ({ relatedProductId: row.relatedProductId, kind: "REQUIRES" as const, quantity: Number(row.quantity), notes: row.notes })),
      ];
      await saveLinks(props.productId, rows);
      setFailed(false);
      setMessage("Packs and linked products saved.");
      router.refresh();
    } catch (error) {
      setFailed(true);
      setMessage(error instanceof Error ? error.message : "Could not save.");
    }
  });
  const editor = (rows: Row[], setRows: (next: Row[]) => void, label: string) => rows.map((row, index) => <div key={index} className="grid gap-2 rounded-xl bg-slate-50 p-3 sm:grid-cols-[1fr_7rem_1fr_auto]">
    <label className="text-xs text-slate-500">{label}<select className={field} value={row.relatedProductId} onChange={(event) => setRows(rows.map((item, i) => i === index ? { ...item, relatedProductId: event.target.value } : item))}><option value="">Choose a product</option>{props.choices.map((choice) => <option key={choice.id} value={choice.id}>{choice.code} · {choice.name}</option>)}</select></label>
    <label className="text-xs text-slate-500">How many<input className={field} inputMode="decimal" value={row.quantity} onChange={(event) => setRows(rows.map((item, i) => i === index ? { ...item, quantity: event.target.value } : item))} /></label>
    <label className="text-xs text-slate-500">Note<input className={field} value={row.notes} onChange={(event) => setRows(rows.map((item, i) => i === index ? { ...item, notes: event.target.value } : item))} /></label>
    <button type="button" className="self-end px-2 py-2 text-xs text-slate-500" onClick={() => setRows(rows.filter((_, i) => i !== index))}>Remove</button>
  </div>);
  return <section className="rounded-2xl border border-slate-200 bg-white p-5">
    <h3 className="text-sm font-semibold">SKU {props.sku} · packs and products it needs</h3>
    <p className="mt-1 max-w-3xl text-xs leading-5 text-slate-500">The SKU is the catalogue code. Say how many of this SKU go in a pack and on a pallet, or which other products this one contains. The bill of materials is what you consume to make it.</p>
    {props.goods && <div className="mt-4 grid gap-3 sm:grid-cols-4">
      <label className="text-xs text-slate-500">Called a<input className={field} value={packUnit} placeholder="box, pack, carton" onChange={(event) => setPackUnit(event.target.value)} disabled={!props.canEdit} /></label>
      <label className="text-xs text-slate-500">How many in one {word}<input className={field} inputMode="numeric" value={unitsPerPack} onChange={(event) => setUnits(event.target.value)} disabled={!props.canEdit} /></label>
      <label className="text-xs text-slate-500">{word}s per layer<input className={field} inputMode="numeric" value={packsPerLayer} onChange={(event) => setLayers(event.target.value)} disabled={!props.canEdit} /></label>
      <label className="text-xs text-slate-500">Layers per pallet<input className={field} inputMode="numeric" value={layersPerPallet} onChange={(event) => setPallet(event.target.value)} disabled={!props.canEdit} /></label>
      <label className="text-xs text-slate-500 sm:col-span-2">Items on a pallet<input className={field} inputMode="numeric" value={itemsPerPallet} placeholder="Fill this if you only know the pallet quantity" onChange={(event) => setItemsPerPallet(event.target.value)} disabled={!props.canEdit} /></label>
    </div>}
    {props.goods && <p className="mt-3 text-sm text-slate-600">{(() => { const each = Number(unitsPerPack), layer = Number(packsPerLayer), high = Number(layersPerPallet), direct = Number(itemsPerPallet); const count = each > 0 && layer > 0 && high > 0 ? each * layer * high : direct > 0 ? direct : props.unitsPerPack && props.packsPerLayer && props.layersPerPallet ? props.unitsPerPack * props.packsPerLayer * props.layersPerPallet : null; return count ? `${count.toLocaleString("en-GB")} of SKU ${props.sku} on a pallet.` : "No pallet quantity yet."; })()}</p>}
    <div className="mt-6 flex items-center justify-between"><h4 className="text-sm font-semibold">This product contains</h4>{props.canEdit && <button type="button" className="text-xs font-medium text-blue-600" onClick={() => setContains([...contains, blank()])}>Add contents</button>}</div>
    <p className="mt-1 text-xs text-slate-500">Use this when the product is itself a box or pack. One of this product holds that many of the other.</p>
    <div className="mt-2 space-y-2">{props.canEdit ? editor(contains, setContains, "Product inside") : <ReadRows rows={contains} choices={props.choices} itemPrefix={props.itemPrefix} empty="Nothing else is packed inside this product." />}{props.canEdit && !contains.length && <p className="text-xs text-slate-500">Nothing else is packed inside this product.</p>}</div>
    {!!props.packedIn.length && <div className="mt-4"><p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Packed inside</p><div className="mt-2 flex flex-wrap gap-2">{props.packedIn.map((pack) => <Link key={pack.id} href={`${props.itemPrefix}${pack.id}`} className="rounded-xl border border-slate-200 px-3 py-2 text-sm hover:bg-slate-50">{pack.quantity.toLocaleString("en-GB")} per {pack.packUnit || "pack"} · {pack.name}<span className="ml-2 text-xs text-slate-400">{pack.code}</span></Link>)}</div></div>}
    <div className="mt-6 flex items-center justify-between"><h4 className="text-sm font-semibold">Needs these products to work</h4>{props.canEdit && <button type="button" className="text-xs font-medium text-blue-600" onClick={() => setRequires([...requires, blank()])}>Add a product it needs</button>}</div>
    <p className="mt-1 text-xs text-slate-500">The other product has to be there for this one to be used. It is not the same as a component you consume while making it.</p>
    <div className="mt-2 space-y-2">{props.canEdit ? editor(requires, setRequires, "Product it needs") : <ReadRows rows={requires} choices={props.choices} itemPrefix={props.itemPrefix} empty="This product does not depend on another product." />}{props.canEdit && !requires.length && <p className="text-xs text-slate-500">This product does not depend on another product.</p>}</div>
    {!!props.neededBy.length && <div className="mt-4"><p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Needed by</p><div className="mt-2 flex flex-wrap gap-2">{props.neededBy.map((item) => <Link key={item.id} href={`${props.itemPrefix}${item.id}`} className="rounded-xl border border-slate-200 px-3 py-2 text-sm hover:bg-slate-50">{item.name}<span className="ml-2 text-xs text-slate-400">{item.quantity.toLocaleString("en-GB")} · {item.code}</span></Link>)}</div></div>}
    {props.canEdit && <div className="mt-5 flex flex-wrap items-center gap-3"><Button type="button" variant="primary" disabled={pending} onClick={save}>{pending ? "Saving…" : "Save packs and links"}</Button><p role={failed ? "alert" : "status"} className={`text-xs ${failed ? "text-red-600" : "text-slate-500"}`}>{message}</p></div>}
  </section>;
}
