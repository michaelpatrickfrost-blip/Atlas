import Link from "next/link";
import { CustomerAssignments } from "@/app/(app)/pricing/customer-assignments";
import { PriceChecker } from "@/app/(app)/pricing/price-checker";
import { notFound } from "next/navigation";
import { requireSession } from "@/core/auth/session";
import { assertCapability, can } from "@/core/permissions/check";
import { CORE_CAPABILITIES } from "@/core/permissions/capabilities";
import { db } from "@/core/db/client";
import { ruleExplanation } from "@/core/pricing/rules";

import { CreateDialog } from "@/components/ui/create-dialog";
import { ActionForm } from "@/components/ui/action-form";
import { Button } from "@/components/ui/button";

import { RuleEditor } from "@/app/(app)/pricing/rule-editor";
import { PriceCsv, PriceFilter } from "@/app/(app)/pricing/price-sheet";
import { SetPriceForm } from "@/app/(app)/pricing/product-search";
import { CategoryDiscountForm } from "@/app/(app)/pricing/category-discount";
import { applyPriceCsv, renamePriceList, previewPriceCsv, setRuleActive, updatePriceBasis } from "@/app/(app)/pricing/actions";

const field = "mt-2 block w-full rounded-xl border border-[var(--color-border)] bg-white px-3 py-2.5 text-sm";

export default async function PriceListPage({ params, searchParams }: { params: Promise<{ priceListId: string }>; searchParams: Promise<{ tab?: string }> }) {
  const session = await requireSession();
  assertCapability(session, CORE_CAPABILITIES.pricingRead);
  const { priceListId } = await params;
  const list = await db.priceList.findFirst({
    where: { id: priceListId, organisationId: session.organisationId },
    include: {
      entries: { include: { product: true }, orderBy: [{ minimumQuantity: "asc" }] },
      customerDefaults: { include: { party: { select: { id: true, name: true, customerCode: true } } }, orderBy: { party: { name: "asc" } } },
      agreements: { select: { id: true, number: true, name: true, status: true }, orderBy: { name: "asc" } },
    },
  });
  if (!list) notFound();
  const [products, customers, categoryRows] = await Promise.all([
    db.product.findMany({ where: { organisationId: session.organisationId, active: true }, select: { id: true, name: true, code: true, categoryCode: true, description: true, basePriceAmount: true, baseCurrency: true }, orderBy: { code: "asc" } }),
    db.party.findMany({ where: { organisationId: session.organisationId, archived: false, identityScrubbed: false }, select: { id: true, name: true, customerCode: true, commercialSettings: { select: { defaultPriceList: { select: { name: true } } } } }, orderBy: { name: "asc" } }),
    db.productCategory.findMany({ where: { organisationId: session.organisationId, active: true }, select: { code: true, name: true }, orderBy: { name: "asc" } }),
  ]);
  const categoryNames = new Map(categoryRows.map((category) => [category.code, category.name]));
  for (const product of products) if (product.categoryCode && !categoryNames.has(product.categoryCode)) categoryNames.set(product.categoryCode, product.categoryCode);
  const pricedProducts = products.map((product) => ({ id: product.id, code: product.code, name: product.name, categoryCode: product.categoryCode, description: product.description, price: product.baseCurrency === list.currency ? product.basePriceAmount / 100 : product.baseCurrency === list.baseCurrency ? Math.round(product.basePriceAmount * list.exchangeRate) / 100 : undefined }));
  const namedCategories = [...categoryNames.entries()].map(([code, name]) => ({ code, name })).sort((a, b) => a.name.localeCompare(b.name));
  const categories = namedCategories.map((category) => category.code);
  const manage = can(session, CORE_CAPABILITIES.pricingManage);
  const prices = list.entries.filter((entry) => entry.active && entry.scope === "PRODUCT" && entry.method === "FIXED" && entry.product);
  const categoryDiscounts = list.entries.filter((entry) => entry.scope === "CATEGORY" && entry.method === "PERCENT" && entry.categoryCode);
  const advanced = list.entries.filter((entry) => !(entry.scope === "PRODUCT" && entry.method === "FIXED") && !(entry.scope === "CATEGORY" && entry.method === "PERCENT"));


  const { tab: requested } = await searchParams;
  const tab = ["prices", "rules", "customers", "check", "settings"].includes(requested ?? "") ? requested : "prices";
  const tabs = [["prices", "Product prices"], ["rules", "Discount rules"], ["customers", "Customers"], ["check", "Check sales price"], ["settings", "Settings"]];
  return <div className="space-y-5">
    <Link href="/sales/price-lists" className="text-sm text-blue-600">← All price lists</Link>
    <div className="flex flex-wrap items-start justify-between gap-3"><div><h2 className="text-2xl font-semibold tracking-tight">{list.name}</h2><p className="mt-1 text-sm text-[var(--color-ink-muted)]">{list.currency} · {prices.length} active product prices · {list.customerDefaults.length} customers · {list.agreements.length} CRM agreements</p></div><div className="flex gap-2">{manage && <Link href={`/sales/price-lists/new?copy=${list.id}`}><Button variant="secondary">Copy list</Button></Link>}{manage && tab === "prices" && <CreateDialog label="Add product price" title={`Add a ${list.currency} price`}><SetPriceForm listId={list.id} currency={list.currency} products={pricedProducts} /></CreateDialog>}</div></div>
    <nav aria-label="Price list sections" className="flex flex-wrap gap-1 border-b border-[var(--color-border)]">{tabs.map(([value, label]) => <Link key={value} href={`/sales/price-lists/${list.id}?tab=${value}`} aria-current={tab === value ? "page" : undefined} className={`border-b-2 px-3 py-3 text-sm ${tab === value ? "border-blue-600 font-semibold text-blue-600" : "border-transparent text-[var(--color-ink-muted)] hover:text-[var(--color-ink)]"}`}>{label}</Link>)}</nav>
    {tab === "prices" && <>
      <section className="overflow-hidden rounded-2xl border border-[var(--color-border)] bg-white">
        <PriceFilter currency={list.currency} listId={manage ? list.id : undefined} products={manage ? pricedProducts : undefined} remove={manage ? setRuleActive.bind(null, list.id) : undefined} rows={list.entries.filter(entry => entry.scope === "PRODUCT" && entry.method === "FIXED" && entry.product).map(entry => ({ id: entry.id, active: entry.active, productId: entry.productId ?? "", code: entry.product?.code ?? "", name: entry.product?.name ?? "", quantity: entry.minimumQuantity, price: String(entry.unitPriceAmount), discount: entry.percentage, from: entry.validFrom?.toLocaleDateString("en-GB") ?? "", until: entry.validTo?.toLocaleDateString("en-GB") ?? "", validFrom: entry.validFrom?.toISOString().slice(0, 10) ?? "", validTo: entry.validTo?.toISOString().slice(0, 10) ?? "" }))} />
      </section>
      {manage && <details className="rounded-2xl border border-[var(--color-border)] bg-white p-5"><summary className="cursor-pointer text-sm font-semibold">Import or export prices</summary><div className="mt-4"><PriceCsv preview={previewPriceCsv.bind(null, list.id)} apply={applyPriceCsv.bind(null, list.id)} templateHref="/api/import-template?entity=prices" sheetHref={`/api/pricing-sheet?priceListId=${list.id}`} /></div></details>}
    </>}
    {tab === "rules" && <>
      <section className="rounded-2xl border border-[var(--color-border)] bg-white p-5"><div className="flex flex-wrap items-start justify-between gap-3"><div><h3 className="font-semibold">Category discounts</h3><p className="mt-1 max-w-2xl text-sm text-[var(--color-ink-muted)]">One discount for a category. A product with a set price uses that price instead. Discounts do not stack.</p></div>{manage && namedCategories.length > 0 && <CreateDialog label="Add category discount" title="Category discount"><CategoryDiscountForm listId={list.id} categories={namedCategories} /></CreateDialog>}</div>
        <ul className="mt-4 divide-y divide-[var(--color-border)]">{categoryDiscounts.map(entry => <li key={entry.id} className={`flex flex-wrap items-center justify-between gap-3 py-3 text-sm ${entry.active ? "" : "opacity-50"}`}><div><p className="font-medium">{categoryNames.get(entry.categoryCode ?? "") ?? entry.categoryCode}</p><p className="text-xs text-[var(--color-ink-muted)]">{entry.percentage}% from quantity {entry.minimumQuantity}{!entry.active ? " · Inactive" : ""}</p></div>{manage && <div className="flex gap-3"><CreateDialog label="Edit" title="Edit category discount" variant="secondary"><CategoryDiscountForm listId={list.id} categories={namedCategories} entry={{ id: entry.id, categoryCode: entry.categoryCode ?? "", discount: entry.percentage, quantity: entry.minimumQuantity }} /></CreateDialog><ActionForm action={setRuleActive.bind(null, list.id, entry.id)}><input type="hidden" name="active" value={String(!entry.active)} /><button type="submit" className="text-xs text-[var(--color-ink-muted)]">{entry.active ? "Deactivate" : "Restore"}</button></ActionForm></div>}</li>)}</ul>{!categoryDiscounts.length && <p className="mt-4 text-sm text-[var(--color-ink-muted)]">No category discounts. Add one above or create categories in Products.</p>}
      </section>
      <section className="rounded-2xl border border-[var(--color-border)] bg-white p-5"><div className="flex flex-wrap items-start justify-between gap-3"><div><h3 className="font-semibold">Whole-list and advanced rules</h3><p className="mt-1 max-w-2xl text-sm text-[var(--color-ink-muted)]">Catalogue discounts and amount adjustments with quantity thresholds and date ranges. A whole-list rule is the fallback after product and category rules.</p></div>{manage && <CreateDialog label="Add rule" title="New price rule"><RuleEditor listId={list.id} products={products} categories={categories} currency={list.currency} /></CreateDialog>}</div><div className="mt-4 divide-y divide-[var(--color-border)]">{advanced.map(entry => { const rule = { ...entry, validFrom: entry.validFrom?.toISOString() ?? null, validTo: entry.validTo?.toISOString() ?? null }; return <div key={entry.id} className="py-3"><p className="text-sm font-medium">{entry.scope === "ALL" ? "All products" : entry.product?.code ?? entry.categoryCode} · {ruleExplanation(rule, list.currency)} · from {entry.minimumQuantity}{!entry.active ? " · Inactive" : ""}</p>{manage && <details className="mt-2 text-xs"><summary className="cursor-pointer text-blue-600">Edit rule</summary><div className="mt-3"><RuleEditor listId={list.id} products={products} categories={categories} currency={list.currency} rule={rule} /></div><ActionForm action={setRuleActive.bind(null, list.id, entry.id)}><input type="hidden" name="active" value={String(!entry.active)} /><button type="submit" className="mt-2 text-xs">{entry.active ? "Deactivate rule" : "Restore rule"}</button></ActionForm></details>}</div>; })}</div>{!advanced.length && <p className="mt-4 text-sm text-[var(--color-ink-muted)]">No whole-list or advanced rules.</p>}</section>
    </>}
    {tab === "customers" && <><CustomerAssignments listId={list.id} manage={manage} assigned={list.customerDefaults.map(row => row.party)} customers={customers.map(customer => ({ ...customer, currentList: customer.commercialSettings?.defaultPriceList?.name ?? null }))} /><section className="rounded-2xl border border-[var(--color-border)] bg-white p-5"><h3 className="font-semibold">CRM agreements using this list</h3><ul className="mt-3 divide-y divide-[var(--color-border)]">{list.agreements.map(agreement => <li key={agreement.id} className="flex justify-between gap-3 py-3 text-sm"><Link href={`/crm/agreements/${agreement.id}`} className="text-blue-600">{agreement.number} · {agreement.name}</Link><span className="text-xs text-[var(--color-ink-muted)]">{agreement.status.toLowerCase()}</span></li>)}</ul>{!list.agreements.length && <p className="mt-3 text-sm text-[var(--color-ink-muted)]">No agreements use this list.</p>}<Link href="/crm/agreements" className="mt-4 inline-block text-sm text-blue-600">Open agreements in CRM →</Link></section></>}
    {tab === "check" && <PriceChecker listId={list.id} products={pricedProducts} customers={customers} today={new Date().toISOString().slice(0, 10)} />}
    {tab === "settings" && <section className="max-w-2xl space-y-6 rounded-2xl border border-[var(--color-border)] bg-white p-5"><h3 className="font-semibold">List settings</h3>{manage && <ActionForm action={renamePriceList.bind(null, list.id)} className="flex flex-wrap items-end gap-3"><label className="flex-1 text-sm">Name<input name="name" required maxLength={150} defaultValue={list.name} className={field} /></label><Button type="submit" variant="secondary">Save name</Button></ActionForm>}<p className="text-sm">Sales currency: <strong>{list.currency}</strong></p><p className="text-xs text-[var(--color-ink-muted)]">Create a separate list for another currency. Copying and catalogue setup never silently convert saved prices.</p><div className="border-t border-[var(--color-border)] pt-5"><h4 className="text-sm font-semibold">Catalogue exchange rate</h4><p className="mt-2 text-sm text-[var(--color-ink-muted)]">1 {list.baseCurrency} = {list.exchangeRate} {list.currency}. This rate is used for rules based on catalogue prices; it does not change fixed prices.</p>{manage && <ActionForm action={updatePriceBasis.bind(null, list.id)} className="mt-3 grid gap-3 sm:grid-cols-2"><label className="text-sm">Catalogue base currency<input name="baseCurrency" required maxLength={3} defaultValue={list.baseCurrency} className={field} /></label><label className="text-sm">Rate to {list.currency}<input name="exchangeRate" type="number" min="0.000001" max="1000000" step="any" defaultValue={list.exchangeRate} required className={field} /></label><Button type="submit" variant="secondary" className="justify-self-start">Save rate</Button></ActionForm>}</div></section>}
  </div>;
}
