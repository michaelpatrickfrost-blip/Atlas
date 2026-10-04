import Link from "next/link";
import { requireSession } from "@/core/auth/session";
import { assertCapability } from "@/core/permissions/check";
import { assertModuleEnabled } from "@/core/modules/access";
import { placeLabel } from "@/modules/stock/domain/places";
import { productLocations } from "@/modules/stock/services/places";

export async function ProductLocations({ productId }: { productId: string }) {
  const session = await requireSession();
  assertCapability(session, "stock.read");
  await assertModuleEnabled(session, "stock");
  const data = await productLocations(session, productId);
  if (!data.positions.length && !data.loose.length && !data.moves.length) return null;
  return <section className="rounded-2xl border border-slate-200 bg-white p-5">
    <h3 className="text-sm font-semibold">Where this product sits</h3>
    <div className="mt-3 space-y-2">
      {data.positions.map((row) => <div key={row.id} className="flex items-center justify-between gap-3 text-sm"><Link href={`/stock/places/${row.warehouseId}`} className="text-blue-700">{placeLabel({ code: row.warehouse.code, name: row.warehouse.name, kind: row.warehouse.kind, siteName: row.warehouse.site?.name })} · {row.location.name}</Link><span>{row.quantity.toLocaleString("en-GB")}</span></div>)}
      {data.loose.map((row) => <div key={row.warehouse.id} className="flex items-center justify-between gap-3 text-sm text-slate-600"><Link href={`/stock/places/${row.warehouse.id}`}>{placeLabel({ code: row.warehouse.code, name: row.warehouse.name, kind: row.warehouse.kind, siteName: row.warehouse.site?.name })} · not in a location yet</Link><span>{row.quantity.toLocaleString("en-GB")}</span></div>)}
      {data.moves.map((move) => <p key={move.id} className="text-sm text-amber-800">{move.quantity.toLocaleString("en-GB")} in transit from {move.fromWarehouse.name} to {placeLabel({ code: move.toWarehouse.code, name: move.toWarehouse.name, kind: move.toWarehouse.kind, siteName: move.toWarehouse.site?.name })} · {move.reference}</p>)}
    </div>
  </section>;
}
