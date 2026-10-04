import { notFound } from "next/navigation";
import { can } from "@/core/permissions/check";
import { loadProductWorkspace } from "@/modules/products/services/workspace";
import { ProductView } from "@/modules/products/components/product-view";
import { readInventory } from "@/modules/stock/services/queries";
import { StockToolbar } from "@/modules/stock/components/toolbar";
import { ProductLocations } from "@/modules/stock/components/product-locations";

export default async function StockItemPage({ params }: { params: Promise<{ productId: string }> }) {
  const { productId } = await params;
  const data = await loadProductWorkspace(productId);
  if (!data) notFound();
  const loaded = can(data.session, "stock.manage") ? await readInventory() : null;
  const actions = loaded ? <StockToolbar snapshot={{ products: loaded.products, warehouses: loaded.warehouses, balances: loaded.balances }} productId={productId} /> : null;
  return <div className="space-y-6"><ProductLocations productId={productId} /><ProductView data={data} back={{ href: "/stock", label: "← All stock" }} itemHref={(id) => `/stock/items/${id}`} actions={actions} /></div>;
}
