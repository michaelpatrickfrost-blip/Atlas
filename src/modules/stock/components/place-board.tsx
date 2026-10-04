"use client";
import { useRef } from "react";
import { ActionForm } from "@/components/ui/action-form";
import { Button } from "@/components/ui/button";
import { moveLocatedAction, putOnLocationAction } from "@/app/(app)/stock/actions";

const field = "mt-1.5 block w-full rounded-xl border border-slate-200 px-3 py-2 text-sm";

export function PlaceBoard(props: {
  locations: Array<{ id: string; code: string; name: string; active: boolean }>;
  products: Array<{ id: string; code: string; name: string }>;
  otherLocations: Array<{ id: string; label: string }>;
}) {
  const placeKey = useRef<string | null>(null);
  const moveKey = useRef<string | null>(null);
  const active = props.locations.filter((location) => location.active);
  return <div className="grid gap-4 lg:grid-cols-2">
    <ActionForm action={async (form) => { placeKey.current ??= crypto.randomUUID(); form.set("requestKey", placeKey.current); await putOnLocationAction(form); placeKey.current = null; }} className="space-y-3 rounded-2xl border border-slate-200 bg-white p-5">
      <h3 className="text-sm font-semibold">Put stock in a location</h3>
      <p className="text-xs leading-5 text-slate-500">Use this when the quantity is already in this warehouse or yard but not sitting in a location yet.</p>
      <label className="block text-xs text-slate-500">Product<select name="productId" required className={field}><option value="">Choose</option>{props.products.map((product) => <option key={product.id} value={product.id}>{product.code} · {product.name}</option>)}</select></label>
      <label className="block text-xs text-slate-500">Location<select name="locationId" required className={field}><option value="">Choose</option>{active.map((location) => <option key={location.id} value={location.id}>{location.code} · {location.name}</option>)}</select></label>
      <label className="block text-xs text-slate-500">Quantity<input name="quantity" type="number" min={1} required className={field} /></label>
      <Button type="submit" variant="primary">Place stock</Button>
    </ActionForm>
    <ActionForm action={async (form) => { moveKey.current ??= crypto.randomUUID(); form.set("requestKey", moveKey.current); await moveLocatedAction(form); moveKey.current = null; }} className="space-y-3 rounded-2xl border border-slate-200 bg-white p-5">
      <h3 className="text-sm font-semibold">Move stock</h3>
      <p className="text-xs leading-5 text-slate-500">Moving inside this place arrives now. Moving to a location at another site stays in transit until it is received.</p>
      <label className="block text-xs text-slate-500">Product<select name="productId" required className={field}><option value="">Choose</option>{props.products.map((product) => <option key={product.id} value={product.id}>{product.code} · {product.name}</option>)}</select></label>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block text-xs text-slate-500">From<select name="fromLocationId" required className={field}><option value="">Choose</option>{active.map((location) => <option key={location.id} value={location.id}>{location.code} · {location.name}</option>)}</select></label>
        <label className="block text-xs text-slate-500">To<select name="toLocationId" required className={field}><option value="">Choose</option>{active.map((location) => <option key={location.id} value={location.id}>{location.code} · {location.name}</option>)}{props.otherLocations.map((location) => <option key={location.id} value={location.id}>{location.label}</option>)}</select></label>
      </div>
      <label className="block text-xs text-slate-500">Quantity<input name="quantity" type="number" min={1} required className={field} /></label>
      <label className="block text-xs text-slate-500">Reason<input name="reason" required className={field} /></label>
      <Button type="submit" variant="primary">Move stock</Button>
    </ActionForm>
  </div>;
}
