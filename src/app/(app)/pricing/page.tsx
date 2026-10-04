import Link from "next/link";
import { ArrowUpRight, FileText, Tags } from "lucide-react";
import { requireSession } from "@/core/auth/session";
import { assertCapability, can } from "@/core/permissions/check";
import { CORE_CAPABILITIES } from "@/core/permissions/capabilities";
import { db } from "@/core/db/client";
import { ActionForm } from "@/components/ui/action-form";
import { Button } from "@/components/ui/button";
import { CreateDialog } from "@/components/ui/create-dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { SALES_CURRENCIES } from "@/core/pricing/rules";
import { createPriceList } from "./actions";

const field = "mt-2 block w-full rounded-xl border border-[var(--color-border)] bg-white px-3 py-2.5 text-sm";

export default async function PricingPage() {
  const session = await requireSession();
  assertCapability(session, CORE_CAPABILITIES.pricingRead);
  const lists = await db.priceList.findMany({
    where: { organisationId: session.organisationId },
    include: { _count: { select: { customerDefaults: true, agreements: true, entries: { where: { active: true, scope: "PRODUCT", method: "FIXED" } } } } },
    orderBy: { name: "asc" },
  });
  const manage = can(session, CORE_CAPABILITIES.pricingManage);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <p className="max-w-2xl text-sm leading-relaxed text-[var(--color-ink-muted)]">A price list is what you charge. Assign it to customers. An agreement is that customer’s contract, prices and service promise.</p>
        {manage && (
          <CreateDialog title="New price list" label="New price list">
            <ActionForm action={createPriceList} className="grid gap-4 sm:grid-cols-2">
              <label className="text-sm sm:col-span-2">Name<input name="name" required maxLength={150} placeholder="Trade, retail, export…" className={field} /></label>
              <label className="text-sm">Sales currency
                <select name="currency" defaultValue="GBP" className={field}>
                  {SALES_CURRENCIES.map((currency) => <option key={currency}>{currency}</option>)}
                </select>
              </label>
              <p className="self-end text-xs leading-relaxed text-[var(--color-ink-muted)]">Quotes and orders that use this list are raised in this currency. Set prices and their discounts are entered in it.</p>
              <Button type="submit" variant="primary" className="justify-self-start">Create price list</Button>
            </ActionForm>
          </CreateDialog>
        )}
      </div>

      {lists.length ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {lists.map((list) => (
            <Link key={list.id} href={`/pricing/${list.id}`} className="group rounded-[22px] border border-[var(--color-border)] bg-white p-5 shadow-[var(--shadow-atlas)] transition hover:-translate-y-0.5 hover:border-[var(--color-atlas-blue)]">
              <div className="mb-8 flex items-start justify-between">
                <span className="rounded-2xl bg-[var(--color-atlas-blue-soft)] p-3 text-[var(--color-atlas-blue)]"><Tags size={18} /></span>
                <ArrowUpRight size={18} className="text-[var(--color-ink-faint)] group-hover:text-[var(--color-atlas-blue)]" />
              </div>
              <h2 className="text-lg font-semibold tracking-tight">{list.name}</h2>
              <p className="mt-1 text-sm text-[var(--color-ink-muted)]">Sales currency {list.currency}</p>
              <p className="mt-5 border-t border-[var(--color-border)] pt-4 text-xs text-[var(--color-ink-muted)]">{list._count.entries} {list._count.entries === 1 ? "price" : "prices"} · {list._count.customerDefaults} {list._count.customerDefaults === 1 ? "customer" : "customers"} · {list._count.agreements} {list._count.agreements === 1 ? "agreement" : "agreements"}</p>
            </Link>
          ))}
        </div>
      ) : (
        <EmptyState title="No price lists yet" description="Create Trade or Retail, then download a spreadsheet of your products and fill in the prices." />
      )}

      <Link href="/pricing/agreements" className="flex items-center justify-between rounded-[22px] border border-[var(--color-border)] bg-white px-5 py-4 text-sm shadow-[var(--shadow-atlas)]">
        <span className="flex items-center gap-3"><FileText size={18} className="text-[var(--color-atlas-blue)]" />Contracts and service promises live with Agreements.</span>
        <span className="text-[var(--color-atlas-blue)]">Open agreements</span>
      </Link>
    </div>
  );
}
