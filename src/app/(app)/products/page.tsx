import { enabledModulesForSession } from "@/core/modules/runtime";
import { db } from "@/core/db/client";
import { CreateDialog } from "@/components/ui/create-dialog";
import Link from "next/link";
import { requireSession } from "@/core/auth/session";
import { assertCapability, can } from "@/core/permissions/check";
import { CORE_CAPABILITIES } from "@/core/permissions/capabilities";
import { CATEGORY_CLASSES, categoryLabel } from "@/core/products/categories";
import { DataTable } from "@/components/ui/table";
import { formatMoney } from "@/core/shared/money";
import { ActionForm } from "@/components/ui/action-form";
import { Button } from "@/components/ui/button";
import { CategoryDesk } from "@/modules/products/components/category-desk";
import { unitsPerPallet } from "@/core/products/physical";
import { saveProduct } from "./actions";

export default async function ProductsPage({ searchParams }: { searchParams: Promise<{ q?: string; kind?: string; category?: string; class?: string; archived?: string }> }) {
  const session = await requireSession();
  assertCapability(session, CORE_CAPABILITIES.productsRead);
  const filters = await searchParams;
  const q = (filters.q ?? "").trim();
  const kind = ["PRODUCT", "SERVICE", "CHARGE"].includes(filters.kind ?? "") ? filters.kind : undefined;
  const category = (filters.category ?? "").trim();
  const itemClass = CATEGORY_CLASSES.some((item) => item.id === filters.class) ? filters.class : undefined;
  const archived = filters.archived === "1";
  const enabled = await enabledModulesForSession(session);
  const [products, categories, policy] = await Promise.all([
    db.product.findMany({ where: { organisationId: session.organisationId, ...(archived ? {} : { active: true }) }, orderBy: { name: "asc" } }),
    db.productCategory.findMany({ where: { organisationId: session.organisationId }, orderBy: [{ position: "asc" }, { name: "asc" }] }),
    db.organisation.findUniqueOrThrow({ where: { id: session.organisationId }, select: { allowProductCreation: true } }),
  ]);
  const categoryName = new Map(categories.map((item) => [item.code, item]));
  const visible = products.filter((product) => (!kind || product.kind === kind) && (!itemClass || product.itemClass === itemClass) && (!category || product.categoryCode === category) && (!q || [product.code, product.name, product.itemClass, categoryLabel(product.itemClass), product.categoryCode ?? "", categoryName.get(product.categoryCode ?? "")?.name ?? ""].some((value) => value.toLowerCase().includes(q.toLowerCase()))));
  const counts = Object.fromEntries(categories.map((item) => [item.code, products.filter((product) => product.categoryCode === item.code).length]));
  const manage = (enabled.has("products") || enabled.has("stock")) && can(session, CORE_CAPABILITIES.productsManage);
  return <div className="space-y-6">
    <div>
      <h2 className="text-2xl font-semibold tracking-tight">Products & services</h2>
      <p className="mt-2 max-w-3xl text-sm text-[var(--color-ink-muted)]">The shared catalogue. Open a product to set its class and category, the bill of materials, work in progress, and the machines it runs on. Inventory holds the quantities. Manufacturing runs the steps.</p>
    </div>
    {manage && <CreateDialog title="Add or update a product" label={policy.allowProductCreation ? "New product" : "Update existing product"}>
      <ActionForm action={saveProduct} className="mt-5 grid gap-4 sm:grid-cols-2">
        <label className="text-xs">Product code / SKU<input name="code" required className="mt-2 block w-full border border-[var(--color-border)] p-3 text-sm" /></label>
        <label className="text-xs">Product name<input name="name" required className="mt-2 block w-full border border-[var(--color-border)] p-3 text-sm" /></label>
        <label className="text-xs sm:col-span-2">Description<textarea name="description" rows={2} className="mt-2 block w-full border border-[var(--color-border)] p-3 text-sm" /></label>
        <label className="text-xs">Class<select name="itemClass" className="mt-2 block w-full border border-[var(--color-border)] bg-white p-3 text-sm"><option value="">Same as the category</option>{CATEGORY_CLASSES.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}</select></label>
        <label className="text-xs">Category<select name="categoryCode" className="mt-2 block w-full border border-[var(--color-border)] bg-white p-3 text-sm"><option value="">No category</option>{categories.filter((item) => item.active).map((item) => <option key={item.id} value={item.code}>{item.name}</option>)}</select></label>
        <label className="text-xs">Or a new category code<input name="newCategoryCode" className="mt-2 block w-full border border-[var(--color-border)] p-3 text-sm" /></label>
        <label className="text-xs">Standard price<input name="price" required type="number" min={0} step="0.01" defaultValue="0" className="mt-2 block w-full border border-[var(--color-border)] p-3 text-sm" /></label>
        <label className="text-xs">Currency<input name="currency" required defaultValue="GBP" className="mt-2 block w-full border border-[var(--color-border)] p-3 text-sm" /></label>
        <label className="text-xs">Unit of measure<input name="unit" required defaultValue="each" className="mt-2 block w-full border border-[var(--color-border)] p-3 text-sm" /></label>
        <label className="text-xs">Items on a pallet<input name="itemsPerPallet" type="number" min={1} className="mt-2 block w-full border border-[var(--color-border)] p-3 text-sm" placeholder="Optional" /></label>
        <label className="text-xs">Units per pack<input name="unitsPerPack" type="number" min={1} className="mt-2 block w-full border border-[var(--color-border)] p-3 text-sm" placeholder="Optional" /></label>
        <label className="text-xs">Type<select name="kind" className="mt-2 block w-full border border-[var(--color-border)] bg-white p-3 text-sm"><option value="PRODUCT">Product</option><option value="SERVICE">Service</option><option value="CHARGE">Charge</option></select></label>
        <label className="text-xs">Tax category<select name="taxCategory" className="mt-2 block w-full border border-[var(--color-border)] bg-white p-3 text-sm"><option>STANDARD</option><option>ZERO_RATED</option><option>EXEMPT</option></select></label>
        <p className="text-xs text-[var(--color-ink-muted)] sm:col-span-2">{policy.allowProductCreation ? "Using an existing code updates that product." : "New products are disabled by company policy. Enter an existing SKU to update it."} A new category code is added to the catalogue. Open the product afterwards for its bill and machines.</p>
        <Button type="submit" variant="primary" className="justify-self-start">Save product</Button>
      </ActionForm>
    </CreateDialog>}
    <form className="flex flex-wrap items-center gap-3 rounded-2xl border border-slate-200 bg-white p-3">
      <input name="q" defaultValue={q} placeholder="Search name, SKU, class or category…" aria-label="Search products" className="min-w-48 flex-1 rounded-xl bg-slate-50 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-200" />
      <select name="class" defaultValue={itemClass ?? ""} aria-label="Class" className="rounded-xl border border-slate-200 bg-white px-3 py-3 text-xs"><option value="">All classes</option>{CATEGORY_CLASSES.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}</select>
      <select name="category" defaultValue={category} aria-label="Category" className="rounded-xl border border-slate-200 bg-white px-3 py-3 text-xs"><option value="">All categories</option>{categories.filter((item) => item.active).map((item) => <option key={item.id} value={item.code}>{item.name}</option>)}</select>
      <select name="kind" defaultValue={kind ?? ""} aria-label="Product type" className="rounded-xl border border-slate-200 bg-white px-3 py-3 text-xs"><option value="">All types</option><option value="PRODUCT">Products</option><option value="SERVICE">Services</option><option value="CHARGE">Charges</option></select>
      {archived && <input type="hidden" name="archived" value="1" />}
      <button className="rounded-xl bg-blue-600 px-4 py-3 text-xs font-medium text-white">Search</button>
      <Link href={archived ? "/products" : "/products?archived=1"} className="px-2 text-xs text-slate-500">{archived ? "Hide archived" : "Show archived"}</Link>
      <Link href="/settings/imports" className="px-2 text-xs text-slate-500">Import catalogue</Link>
    </form>
    <DataTable rows={visible} getHref={(product) => `/products/${product.id}`} emptyLabel="Add your first product or service." columns={[
      { header: "SKU", render: (product) => product.code },
      { header: "Class", render: (product) => categoryLabel(product.itemClass) },
      { header: "Category", render: (product) => product.categoryCode ? `${categoryName.get(product.categoryCode)?.name ?? product.categoryCode}` : "—" },
      { header: "Product", render: (product) => product.name },
      { header: "Type", render: (product) => product.kind },
      { header: "Unit", render: (product) => product.unitOfMeasure },
      { header: "Per pallet", align: "right", render: (product) => { const count = product.kind === "PRODUCT" ? unitsPerPallet(product) : null; return count ? count.toLocaleString("en-GB") : "—"; } },
      { header: "Standard price", render: (product) => formatMoney(product.basePriceAmount, product.baseCurrency), align: "right" },
    ]} />
    {manage && <CategoryDesk categories={categories} counts={counts} />}
  </div>;
}
