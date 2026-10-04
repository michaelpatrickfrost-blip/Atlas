import Link from "next/link";
import { notFound } from "next/navigation";
import { requireSession } from "@/core/auth/session";
import { assertCapability, can } from "@/core/permissions/check";
import { CORE_CAPABILITIES } from "@/core/permissions/capabilities";
import { db } from "@/core/db/client";
import { ruleExplanation } from "@/core/pricing/rules";
import { formatMoney } from "@/core/shared/money";
import { CreateDialog } from "@/components/ui/create-dialog";
import { ActionForm } from "@/components/ui/action-form";
import { Button } from "@/components/ui/button";
import { SALES_CURRENCIES } from "@/core/pricing/rules";
import { RuleEditor } from "../rule-editor";
import { PriceCsv, PriceFilter } from "../price-sheet";
import { SetPriceForm } from "../product-search";
import { CategoryDiscountForm } from "../category-discount";
import { applyPriceCsv, assignPriceList, previewPriceCsv, setRuleActive, updatePriceBasis } from "../actions";

const field = "mt-2 block w-full rounded-xl border border-[var(--color-border)] bg-white px-3 py-2.5 text-sm";

export default async function PriceListPage({ params }: { params: Promise<{ priceListId: string }> }) {
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
    db.product.findMany({ where: { organisationId: session.organisationId, active: true }, select: { id: true, name: true, code: true, categoryCode: true, description: true }, orderBy: { code: "asc" } }),
    db.party.findMany({ where: { organisationId: session.organisationId }, select: { id: true, name: true, customerCode: true }, orderBy: { name: "asc" }, take: 500 }),
    db.productCategory.findMany({ where: { organisationId: session.organisationId, active: true }, select: { code: true, name: true }, orderBy: { name: "asc" } }),
  ]);
  const categoryNames = new Map(categoryRows.map((category) => [category.code, category.name]));
  for (const product of products) if (product.categoryCode && !categoryNames.has(product.categoryCode)) categoryNames.set(product.categoryCode, product.categoryCode);
  const namedCategories = [...categoryNames.entries()].map(([code, name]) => ({ code, name })).sort((a, b) => a.name.localeCompare(b.name));
  const categories = namedCategories.map((category) => category.code);
  const manage = can(session, CORE_CAPABILITIES.pricingManage);
  const prices = list.entries.filter((entry) => entry.active && entry.scope === "PRODUCT" && entry.method === "FIXED" && entry.product);
  const categoryDiscounts = list.entries.filter((entry) => entry.scope === "CATEGORY" && entry.method === "PERCENT" && entry.categoryCode);
  const advanced = list.entries.filter((entry) => !(entry.scope === "PRODUCT" && entry.method === "FIXED") && !(entry.scope === "CATEGORY" && entry.method === "PERCENT"));
  const assigned = new Set(list.customerDefaults.map((row) => row.partyId));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">{list.name}</h2>
          <p className="mt-1 text-sm text-[var(--color-ink-muted)]">{prices.length} {prices.length === 1 ? "product price" : "product prices"} · {list.customerDefaults.length} {list.customerDefaults.length === 1 ? "customer" : "customers"}</p>
          {manage ? (
            <ActionForm action={updatePriceBasis.bind(null, list.id)} className="mt-3 flex flex-wrap items-end gap-3">
              <label className="text-sm">Sales currency
                <select name="currency" defaultValue={list.currency} className={field}>
                  {SALES_CURRENCIES.map((currency) => <option key={currency}>{currency}</option>)}
                </select>
              </label>
              <input type="hidden" name="baseCurrency" value={list.baseCurrency} />
              <input type="hidden" name="exchangeRate" value={list.exchangeRate} />
              <Button type="submit" variant="primary">Save currency</Button>
            </ActionForm>
          ) : <p className="mt-2 text-sm text-[var(--color-ink-muted)]">Sales currency {list.currency}</p>}
          <p className="mt-2 max-w-xl text-xs leading-relaxed text-[var(--color-ink-muted)]">Quotes and orders that use this list are raised in {list.currency}.</p>
        </div>
        {manage && (
          <CreateDialog label="Add a price" title={`Add a ${list.currency} price`}>
            <SetPriceForm listId={list.id} currency={list.currency} products={products} />
          </CreateDialog>
        )}
      </div>

      {manage && (
        <PriceCsv
          preview={previewPriceCsv.bind(null, list.id)}
          apply={applyPriceCsv.bind(null, list.id)}
          templateHref="/api/import-template?entity=prices"
          sheetHref={`/api/pricing-sheet?priceListId=${list.id}`}
        />
      )}

      <section className="overflow-hidden rounded-[22px] border border-[var(--color-border)] bg-white shadow-[var(--shadow-atlas)]">
        <div className="border-b border-[var(--color-border)] px-5 py-4">
          <h3 className="text-sm font-semibold">Prices</h3>
        </div>
        <PriceFilter
          currency={list.currency}
          listId={manage ? list.id : undefined}
          products={manage ? products : undefined}
          remove={manage ? setRuleActive.bind(null, list.id) : undefined}
          rows={prices.map((entry) => ({
            id: entry.id,
            productId: entry.productId ?? "",
            code: entry.product?.code ?? "",
            name: entry.product?.name ?? "",
            quantity: entry.minimumQuantity,
            price: String(entry.unitPriceAmount),
            discount: entry.percentage,
            from: entry.validFrom ? entry.validFrom.toLocaleDateString("en-GB") : "",
            until: entry.validTo ? entry.validTo.toLocaleDateString("en-GB") : "",
            validFrom: entry.validFrom ? entry.validFrom.toISOString().slice(0, 10) : "",
            validTo: entry.validTo ? entry.validTo.toISOString().slice(0, 10) : "",
          }))}
        />
      </section>

      <section className="rounded-[22px] border border-[var(--color-border)] bg-white p-5 shadow-[var(--shadow-atlas)]">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h3 className="text-sm font-semibold">Category discounts</h3>
            <p className="mt-1 max-w-2xl text-sm text-[var(--color-ink-muted)]">Select a product category and give it one overall discount. A product with its own set price keeps that price instead.</p>
          </div>
          {manage && namedCategories.length > 0 && (
            <CreateDialog label="Add a category discount" title="Category discount">
              <CategoryDiscountForm listId={list.id} categories={namedCategories} />
            </CreateDialog>
          )}
        </div>
        <ul className="mt-4 divide-y divide-[var(--color-border)]">
          {categoryDiscounts.map((entry) => {
            const name = namedCategories.find((category) => category.code === entry.categoryCode)?.name ?? entry.categoryCode;
            return (
              <li key={entry.id} className={`flex flex-wrap items-center justify-between gap-3 py-3 text-sm ${entry.active ? "" : "opacity-50"}`}>
                <div>
                  <p className="font-medium">{name}</p>
                  <p className="text-xs text-[var(--color-ink-muted)]">{entry.categoryCode} · {entry.percentage}% from quantity {entry.minimumQuantity}</p>
                </div>
                {manage && (
                  <div className="flex items-center gap-3">
                    <CreateDialog label="Edit" title={`Edit ${name}`} variant="secondary">
                      <CategoryDiscountForm listId={list.id} categories={namedCategories} entry={{ id: entry.id, categoryCode: entry.categoryCode ?? "", discount: entry.percentage, quantity: entry.minimumQuantity }} />
                    </CreateDialog>
                    <ActionForm action={setRuleActive.bind(null, list.id, entry.id)}>
                      <input type="hidden" name="active" value={String(!entry.active)} />
                      <button className="text-xs text-[var(--color-ink-muted)]" type="submit">{entry.active ? "Remove" : "Restore"}</button>
                    </ActionForm>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
        {!categoryDiscounts.length && <p className="mt-4 text-sm text-[var(--color-ink-muted)]">{namedCategories.length ? "No category discount yet." : "Add categories in Products, then select one here."}</p>}
      </section>

      <div className="grid gap-5 lg:grid-cols-[1.4fr_0.8fr]">
        <section className="rounded-[22px] border border-[var(--color-border)] bg-white p-5 shadow-[var(--shadow-atlas)]">
          <h3 className="text-sm font-semibold">Customers on this list</h3>
          <p className="mt-1 text-sm text-[var(--color-ink-muted)]">New quotes and orders use this list unless a live agreement names another one.</p>
          <ul className="mt-4 divide-y divide-[var(--color-border)]">
            {list.customerDefaults.map((row) => (
              <li key={row.partyId} className="flex items-center justify-between gap-3 py-3 text-sm">
                <Link href={`/customers/${row.partyId}?tab=commercial`} className="text-[var(--color-atlas-blue)]">{row.party.customerCode} · {row.party.name}</Link>
                {manage && (
                  <ActionForm action={assignPriceList.bind(null, list.id)}>
                    <input type="hidden" name="partyId" value={row.partyId} />
                    <input type="hidden" name="remove" value="yes" />
                    <button type="submit" className="text-xs text-[var(--color-ink-muted)]">Remove</button>
                  </ActionForm>
                )}
              </li>
            ))}
          </ul>
          {!list.customerDefaults.length && <p className="mt-4 text-sm text-[var(--color-ink-muted)]">No customers use this list yet.</p>}
          {manage && (
            <ActionForm action={assignPriceList.bind(null, list.id)} className="mt-4 flex flex-wrap items-end gap-3">
              <label className="min-w-64 flex-1 text-sm">Assign a customer
                <select name="partyId" required className={field}>
                  <option value="">Choose a customer</option>
                  {customers.filter((customer) => !assigned.has(customer.id)).map((customer) => <option key={customer.id} value={customer.id}>{customer.customerCode} · {customer.name}</option>)}
                </select>
              </label>
              <Button type="submit" variant="primary">Assign</Button>
            </ActionForm>
          )}
        </section>

        <section className="rounded-[22px] border border-[var(--color-border)] bg-white p-5 shadow-[var(--shadow-atlas)]">
          <h3 className="text-sm font-semibold">Agreements using this list</h3>
          <ul className="mt-4 space-y-2 text-sm">
            {list.agreements.map((agreement) => <li key={agreement.id}><Link href={`/pricing/agreements/${agreement.id}`} className="text-[var(--color-atlas-blue)]">{agreement.number} · {agreement.name}</Link></li>)}
          </ul>
          {!list.agreements.length && <p className="mt-3 text-sm text-[var(--color-ink-muted)]">No contract points here yet.</p>}
          <Link href="/pricing/agreements/new" className="mt-4 inline-block text-sm font-semibold text-[var(--color-atlas-blue)]">New agreement</Link>
        </section>
      </div>

      <details className="rounded-[22px] border border-[var(--color-border)] bg-white p-5 shadow-[var(--shadow-atlas)]">
        <summary className="cursor-pointer text-sm font-semibold">Catalogue discounts and exchange rate</summary>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-[var(--color-ink-muted)]">A discount typed on a set price is taken off that price. Category discounts are chosen above. A whole-list discount applies only when the product has neither a set price nor a category discount. The exchange rate is only for percentage and amount rules that start from the catalogue price.</p>
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-[var(--color-surface-sunken)] px-4 py-3 text-sm">
          <span>1 {list.baseCurrency} = {list.exchangeRate} {list.currency}</span>
          {manage && (
            <CreateDialog label="Update rate" title="Exchange rate" variant="secondary">
              <ActionForm action={updatePriceBasis.bind(null, list.id)} className="space-y-4">
                <label className="block text-sm">Base currency<input name="baseCurrency" required defaultValue={list.baseCurrency} maxLength={3} className={field} /></label>
                <label className="block text-sm">Rate to {list.currency}<input name="exchangeRate" required type="number" step="any" min="0.000001" defaultValue={list.exchangeRate} className={field} /></label>
                <Button type="submit" variant="primary">Save rate</Button>
              </ActionForm>
            </CreateDialog>
          )}
        </div>
        <div className="mt-4 divide-y divide-[var(--color-border)]">
          {advanced.map((entry) => {
            const rule = { ...entry, validFrom: entry.validFrom?.toISOString() ?? null, validTo: entry.validTo?.toISOString() ?? null };
            return (
              <div key={entry.id} className={`py-4 ${entry.active ? "" : "opacity-50"}`}>
                <div className="flex flex-wrap items-baseline justify-between gap-3">
                  <p className="text-sm"><span className="mr-2 text-xs font-semibold uppercase tracking-wide text-[var(--color-atlas-blue)]">{entry.scope === "CATEGORY" ? entry.categoryCode : entry.scope === "ALL" ? "All products" : entry.product?.code}</span>{ruleExplanation(rule, list.currency)} from {entry.minimumQuantity}</p>
                  <span className="text-sm font-medium">{entry.method === "FIXED" ? formatMoney(entry.unitPriceAmount, list.currency) : ruleExplanation(rule, list.currency)}</span>
                </div>
                {manage && (
                  <div className="mt-2 flex gap-3">
                    <CreateDialog label="Edit" title="Edit discount" variant="secondary"><RuleEditor listId={list.id} currency={list.currency} products={products} categories={categories} rule={rule} /></CreateDialog>
                    <ActionForm action={setRuleActive.bind(null, list.id, entry.id)}><input type="hidden" name="active" value={String(!entry.active)} /><button className="text-xs text-[var(--color-ink-muted)]" type="submit">{entry.active ? "Archive" : "Restore"}</button></ActionForm>
                  </div>
                )}
              </div>
            );
          })}
        </div>
        {manage && <div className="mt-4"><CreateDialog label="Add a discount" title="Discount" variant="secondary"><RuleEditor listId={list.id} currency={list.currency} products={products} categories={categories} /></CreateDialog></div>}
      </details>
    </div>
  );
}
