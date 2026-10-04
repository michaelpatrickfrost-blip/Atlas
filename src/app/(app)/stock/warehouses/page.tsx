import Link from "next/link";
import { readInventory } from "@/modules/stock/services/queries";
import { can } from "@/core/permissions/check";
import { CreateDialog } from "@/components/ui/create-dialog";
import { ActionForm } from "@/components/ui/action-form";
import { Button } from "@/components/ui/button";
import { assignSiteAction, createPlaceAction, createSiteAction } from "../actions";

const field = "mt-2 block w-full rounded-xl border border-slate-200 p-3 text-sm";

export default async function WarehousesPage() {
  const { session, ...snapshot } = await readInventory();
  const sites = snapshot.sites ?? [];
  const manage = can(session, "stock.manage");
  const groups = [
    ...sites.map((site) => ({ id: site.id, title: site.name, code: site.code, places: snapshot.warehouses.filter((place) => place.siteId === site.id) })),
    { id: "none", title: "No site yet", code: "", places: snapshot.warehouses.filter((place) => !place.siteId) },
  ].filter((group) => group.id !== "none" || group.places.length);
  return <div className="space-y-6">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">Warehouses and yards</h2>
        <p className="mt-1 max-w-2xl text-sm text-slate-500">A site can hold warehouses and yards. Open a place to manage the locations products sit in, and to move stock between them.</p>
      </div>
      {manage && <div className="flex flex-wrap gap-2">
        <CreateDialog label="New site" title="New site" variant="secondary"><ActionForm action={createSiteAction} className="space-y-4"><label className="block text-xs">Site name<input name="name" required maxLength={80} className={field} /></label><label className="block text-xs">Code<input name="code" required maxLength={20} placeholder="NORTH" className={field} /></label><Button type="submit" variant="primary">Create site</Button></ActionForm></CreateDialog>
        <CreateDialog label="New place" title="New warehouse or yard"><ActionForm action={createPlaceAction} className="space-y-4"><label className="block text-xs">Kind<select name="kind" className={field}><option value="WAREHOUSE">Warehouse</option><option value="YARD">Yard</option></select></label><label className="block text-xs">Site<select name="siteId" className={field}><option value="">No site yet</option>{sites.map((site) => <option key={site.id} value={site.id}>{site.name}</option>)}</select></label><label className="block text-xs">Name<input name="name" required maxLength={150} className={field} /></label><label className="block text-xs">Code<input name="code" required maxLength={20} className={field} /></label><Button type="submit" variant="primary">Create place</Button></ActionForm></CreateDialog>
      </div>}
    </div>
    {groups.map((group) => <section key={group.id} className="space-y-3">
      <h3 className="text-sm font-semibold">{group.title}{group.code ? <span className="ml-2 text-xs font-medium text-slate-400">{group.code}</span> : null}</h3>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{group.places.map((place) => {
        const balances = snapshot.balances.filter((balance) => balance.warehouseId === place.id && balance.quantity > 0);
        return <div key={place.id} className="rounded-2xl border border-slate-200 bg-white p-6">
          <p className="text-xs font-medium uppercase tracking-wider text-slate-400">{place.kind === "YARD" ? "Yard" : "Warehouse"} · {place.code}</p>
          <h3 className="mt-2 text-lg font-semibold">{place.name}</h3>
          <p className="mt-6 text-3xl font-semibold">{balances.length}</p>
          <p className="mt-1 text-xs text-slate-500">products with stock</p>
          {manage && <ActionForm action={assignSiteAction} className="mt-4 flex items-end gap-2"><input type="hidden" name="placeId" value={place.id} /><label className="min-w-0 flex-1 text-xs text-slate-500">Site<select name="siteId" defaultValue={place.siteId ?? ""} className="mt-1 block w-full rounded-xl border border-slate-200 px-2 py-2 text-sm"><option value="">No site</option>{sites.map((site) => <option key={site.id} value={site.id}>{site.name}</option>)}</select></label><Button type="submit" variant="secondary">Save</Button></ActionForm>}
          <Link href={`/stock/places/${place.id}`} className="mt-4 inline-block text-xs font-medium text-blue-600">Locations →</Link>
        </div>;
      })}</div>
      {!group.places.length && <p className="text-sm text-slate-500">No warehouse or yard on this site yet.</p>}
    </section>)}
    {!snapshot.warehouses.length && <div className="rounded-2xl border border-dashed border-slate-200 p-12 text-center text-sm text-slate-500">Create a site, then a warehouse or a yard, to begin.</div>}
  </div>;
}
