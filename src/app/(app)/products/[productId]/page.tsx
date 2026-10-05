import { notFound } from "next/navigation";
import { can } from "@/core/permissions/check";
import { loadProductWorkspace } from "@/modules/products/services/workspace";
import { ProductView } from "@/modules/products/components/product-view";
import { readInventory } from "@/modules/stock/services/queries";
import { StockToolbar } from "@/modules/stock/components/toolbar";
import { ProductProduction } from "@/modules/manufacturing/components/make-order";

export default async function ProductPage({ params }: { params: Promise<{ productId: string }> }) {
  const { productId } = await params;
  const data = await loadProductWorkspace(productId);
  if (!data) notFound();
  const loaded = can(data.session, "stock.manage") ? await readInventory() : null;
  const actions = loaded ? <StockToolbar snapshot={{ products: loaded.products, warehouses: loaded.warehouses, balances: loaded.balances }} productId={productId} /> : null;
  return <div className="space-y-5">{data.product.kind === "PRODUCT" && <ProductProduction productId={productId} />}<ProductView data={data} back={{ href: "/products", label: "← Catalogue" }} itemHref={(id) => `/products/${id}`} actions={actions} /></div>;
}
