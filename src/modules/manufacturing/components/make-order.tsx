import Link from "next/link";
import { db } from "@/core/db/client";
import { requireSession } from "@/core/auth/session";
import { can } from "@/core/permissions/check";
import { ActionForm } from "@/components/ui/action-form";
import { Button } from "@/components/ui/button";
import { CreateDialog } from "@/components/ui/create-dialog";
import { StatusPill } from "@/components/ui/status-pill";
import { raiseProductionOrderAction } from "@/app/(app)/manufacturing/produce/actions";

const field = "mt-1.5 block w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm";
const OPEN = ["PLANNED", "READY", "RELEASED", "RUNNING"] as const;
const word = (value: string) => value.charAt(0) + value.slice(1).toLowerCase();

/** The New production order dialog. With a product it is fixed to that product. */
export async function MakeOrderDialog({ productId, label = "New production order", variant }: { productId?: string; label?: string; variant?: "primary" | "secondary" }) {
  const session = await requireSession();
  if (!can(session, "manufacturing.order.create")) return null;
  const made = await db.productDefinition.findMany({ where: { organisationId: session.organisationId, status: "ACTIVE", supply: { not: "BUY" }, product: { active: true, ...(productId ? { id: productId } : {}) } }, select: { batchQuantity: true, product: { select: { id: true, code: true, name: true, unitOfMeasure: true } } }, orderBy: { product: { name: "asc" } } });
  if (productId && !made.length) return null;
  return <CreateDialog label={label} title={productId ? `Make ${made[0].product.name}` : "New production order"} variant={variant}><ActionForm action={raiseProductionOrderAction}><div className="space-y-4">
    {productId ? <input type="hidden" name="productId" value={productId} /> : <label className="block text-xs font-medium">Product to make<select name="productId" required className={field}><option value="">{made.length ? "Choose a product" : "No products have a bill or routing yet"}</option>{made.map((row) => <option key={row.product.id} value={row.product.id}>{row.product.code} · {row.product.name} ({row.product.unitOfMeasure})</option>)}</select></label>}
    <div className="grid gap-4 sm:grid-cols-2">
      <label className="block text-xs font-medium">Quantity{productId ? ` (${made[0].product.unitOfMeasure})` : ""}<input name="quantity" type="number" min={1} step="any" required defaultValue={productId ? Number(made[0].batchQuantity) || 1 : undefined} className={field} /></label>
      <label className="block text-xs font-medium">Needed by<input name="requiredDate" type="date" className={field} /></label>
    </div>
    <label className="block text-xs font-medium">Note (optional)<input name="notes" maxLength={1000} className={field} /></label>
    <p className="text-xs text-slate-500">Creates a planned order from the product&apos;s current bill and routing. Releasing it creates a work order for each step; completing the last step uses the components and puts the finished goods into stock.</p>
    {!productId && !made.length ? <Link href="/products" className="text-sm font-medium text-blue-600">Open Products to add a bill →</Link> : <Button type="submit" variant="primary">Create production order</Button>}
  </div></ActionForm></CreateDialog>;
}

/** Open production orders for one product, with a Make button. Shown on the product record. */
export async function ProductProduction({ productId }: { productId: string }) {
  const session = await requireSession();
  if (!can(session, "manufacturing.order.read")) return null;
  const [orders, recipe] = await Promise.all([
    db.manufacturingOrder.findMany({ where: { organisationId: session.organisationId, productId, status: { in: [...OPEN] } }, select: { id: true, orderNumber: true, quantity: true, unitOfMeasure: true, status: true, requiredDate: true }, orderBy: { createdAt: "desc" }, take: 10 }),
    db.productDefinition.findFirst({ where: { organisationId: session.organisationId, productId, status: "ACTIVE", supply: { not: "BUY" } }, select: { id: true } }),
  ]);
  if (!recipe && !orders.length) return null;
  return <section className="rounded-2xl border border-slate-200 bg-white p-5">
    <div className="flex flex-wrap items-start justify-between gap-3"><div><h3 className="text-sm font-semibold">Production <span className="ml-1 font-normal text-slate-400">{orders.length} open</span></h3><p className="mt-1 text-xs text-slate-500">Production orders for this product. Each uses the bill and routing on this record.</p></div><MakeOrderDialog productId={productId} label="Make this product" /></div>
    {!!orders.length && <ul className="mt-3 divide-y divide-slate-100">{orders.map((order) => <li key={order.id} className="flex flex-wrap items-center justify-between gap-3 py-2.5 text-sm"><Link href={`/manufacturing/produce/${order.id}`} className="font-medium text-blue-700">{order.orderNumber}</Link><span className="flex items-center gap-3"><span className="tabular-nums">{Number(order.quantity).toLocaleString("en-GB")} {order.unitOfMeasure}</span>{order.requiredDate && <span className="text-xs text-slate-500">needed {order.requiredDate.toLocaleDateString("en-GB", { day: "numeric", month: "short" })}</span>}<StatusPill label={word(order.status)} tone={order.status === "RUNNING" ? "success" : order.status === "PLANNED" ? "neutral" : "warning"} /></span></li>)}</ul>}
  </section>;
}
