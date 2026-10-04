import Link from "next/link";
import { notFound } from "next/navigation";
import { requireSession } from "@/core/auth/session";
import { assertCapability, can } from "@/core/permissions/check";
import { assertModuleEnabled } from "@/core/modules/access";
import { db } from "@/core/db/client";
import { ActionForm } from "@/components/ui/action-form";
import { Button } from "@/components/ui/button";
import { placeLabel } from "@/modules/stock/domain/places";
import { readPlace } from "@/modules/stock/services/places";
import { PlaceBoard } from "@/modules/stock/components/place-board";
import { addLocationAction, ensureLocationsAction, retireLocationAction } from "../../actions";

const field = "mt-1.5 block w-full rounded-xl border border-slate-200 px-3 py-2 text-sm";

export default async function PlacePage({ params }: { params: Promise<{ placeId: string }> }) {
  const { placeId } = await params;
  const session = await requireSession();
  assertCapability(session, "stock.read");
  await assertModuleEnabled(session, "stock");
  const data = await readPlace(session, placeId);
  if (!data) notFound();
  const manage = can(session, "stock.manage");
  const others = manage ? await db.stockLocation.findMany({ where: { organisationId: session.organisationId, warehouseId: { not: data.place.id }, active: true }, include: { warehouse: { include: { site: true } } }, orderBy: { code: "asc" }, take: 200 }) : [];
  const held = new Map<string, number>();
  for (const row of data.positions) held.set(row.locationId, (held.get(row.locationId) ?? 0) + row.quantity);
  return <div className="space-y-6">
    <div>
      <Link href="/stock/warehouses" className="text-xs text-slate-500">← Warehouses and yards</Link>
      <h2 className="mt-3 text-2xl font-semibold tracking-tight">{placeLabel({ code: data.place.code, name: data.place.name, kind: data.place.kind, siteName: data.place.site?.name })}</h2>
      <p className="mt-1 max-w-2xl text-sm text-slate-500">Locations are the bays, aisles and areas inside this {data.place.kind === "YARD" ? "yard" : "warehouse"}. Products sit in a location. Retire a location only after its stock has moved.</p>
    </div>
    {manage && !data.place.locations.length && <ActionForm action={ensureLocationsAction} className="flex items-center gap-3"><input type="hidden" name="placeId" value={data.place.id} /><Button type="submit" variant="primary">{data.place.kind === "YARD" ? "Add the yard location" : "Add the usual warehouse locations"}</Button></ActionForm>}
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {data.place.locations.map((location) => <div key={location.id} className={`rounded-2xl border bg-white p-5 ${location.active ? "border-slate-200" : "border-dashed border-slate-200 opacity-60"}`}>
        <p className="text-xs font-medium uppercase tracking-wider text-slate-400">{location.code}</p>
        <h3 className="mt-1 font-semibold">{location.name}</h3>
        <p className="mt-4 text-2xl font-semibold">{held.get(location.id) ?? 0}</p>
        <p className="text-xs text-slate-500">{location.active ? "on hand here" : "Retired"}</p>
        {manage && location.active && <ActionForm action={retireLocationAction} className="mt-3"><input type="hidden" name="locationId" value={location.id} /><button type="submit" className="text-xs text-slate-500">Retire</button></ActionForm>}
      </div>)}
    </div>
    {manage && <ActionForm action={addLocationAction} className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-5 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
      <input type="hidden" name="placeId" value={data.place.id} />
      <label className="text-xs text-slate-500">New location<input name="name" required placeholder="Bay 4" className={field} /></label>
      <label className="text-xs text-slate-500">Code<input name="code" required placeholder="BAY-4" className={field} /></label>
      <Button type="submit" variant="secondary">Add location</Button>
    </ActionForm>}
    <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
      <table className="w-full text-sm"><thead className="bg-slate-50 text-left text-xs text-slate-500"><tr><th className="px-4 py-3">Product</th><th className="px-4 py-3">Location</th><th className="px-4 py-3 text-right">Quantity</th></tr></thead>
        <tbody>
          {data.positions.map((row) => <tr key={row.id} className="border-t border-slate-100"><td className="px-4 py-3"><Link href={`/stock/items/${row.product.id}`} className="font-medium">{row.product.name}</Link><span className="mt-1 block text-xs text-slate-400">{row.product.code}</span></td><td className="px-4 py-3">{data.place.locations.find((location) => location.id === row.locationId)?.name ?? "Location"}</td><td className="px-4 py-3 text-right">{row.quantity.toLocaleString("en-GB")} {row.product.unitOfMeasure}</td></tr>)}
          {data.unlocated.map((row) => { const product = data.products.find((item) => item.id === row.productId); return <tr key={row.productId} className="border-t border-slate-100"><td className="px-4 py-3">{product?.name ?? "Product"}<span className="mt-1 block text-xs text-slate-400">{product?.code}</span></td><td className="px-4 py-3 text-slate-500">Not in a location yet</td><td className="px-4 py-3 text-right">{row.quantity.toLocaleString("en-GB")}</td></tr>; })}
          {!data.positions.length && !data.unlocated.length && <tr><td colSpan={3} className="px-4 py-6 text-slate-500">No stock is recorded in this place.</td></tr>}
        </tbody>
      </table>
    </div>
    {manage && <PlaceBoard locations={data.place.locations.map((location) => ({ id: location.id, code: location.code, name: location.name, active: location.active }))} products={data.products} otherLocations={others.map((location) => ({ id: location.id, label: `${placeLabel({ code: location.warehouse.code, name: location.warehouse.name, kind: location.warehouse.kind, siteName: location.warehouse.site?.name })} · ${location.name}` }))} />}
  </div>;
}
