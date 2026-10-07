import Link from "next/link";
import { requireSession } from "@/core/auth/session";
import { assertCapability, can } from "@/core/permissions/check";
import { CORE_CAPABILITIES } from "@/core/permissions/capabilities";
import { db } from "@/core/db/client";
import type { Prisma } from "@/generated/prisma/client";
import { DataTable } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { SALES_CURRENCIES } from "@/core/pricing/rules";

const field = "mt-1 block w-full rounded-xl border border-[var(--color-border)] bg-white px-3 py-2 text-sm";
export default async function PriceListsPage({ searchParams }: { searchParams: Promise<{ q?: string; currency?: string; usage?: string; page?: string }> }) {
  const session = await requireSession();
  assertCapability(session, CORE_CAPABILITIES.pricingRead);
  const filters = await searchParams;
  const q = String(filters.q ?? "").trim().slice(0, 150);
  const currency = SALES_CURRENCIES.includes(filters.currency as typeof SALES_CURRENCIES[number]) ? filters.currency : "";
  const usage = ["assigned", "unused"].includes(filters.usage ?? "") ? filters.usage : "";
  const where: Prisma.PriceListWhereInput = { organisationId: session.organisationId,
    ...(q ? { OR: [{ name: { contains: q, mode: "insensitive" } }, { customerDefaults: { some: { party: { OR: [{ name: { contains: q, mode: "insensitive" } }, { customerCode: { contains: q, mode: "insensitive" } }] } } } }] } : {}),
    ...(currency ? { currency } : {}),
    ...(usage === "assigned" ? { AND: [{ OR: [{ customerDefaults: { some: {} } }, { agreements: { some: {} } }] }] } : usage === "unused" ? { customerDefaults: { none: {} }, agreements: { none: {} } } : {}),
  };
  const total = await db.priceList.count({ where });
  const pages = Math.max(1, Math.ceil(total / 30));
  const page = Math.min(pages, Math.max(1, Number.parseInt(filters.page ?? "1") || 1));
  const lists = await db.priceList.findMany({ where, orderBy: [{ name: "asc" }, { id: "asc" }], skip: (page - 1) * 30, take: 30,
    include: { _count: { select: { customerDefaults: true, agreements: true, entries: { where: { active: true } } } } },
  });
  const href = (next: number) => `/sales/price-lists?${new URLSearchParams({ q, currency: currency ?? "", usage: usage ?? "", page: String(next) })}`;
  return <div className="space-y-5">
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div><h2 className="text-2xl font-semibold tracking-tight">Price lists</h2><p className="mt-1 text-sm text-[var(--color-ink-muted)]">Set prices once, assign customers, and use them in quotations and orders.</p></div>
      {can(session, CORE_CAPABILITIES.pricingManage) && <Link href="/sales/price-lists/new"><Button variant="primary">New price list</Button></Link>}
    </div>
    <form className="flex flex-wrap items-end gap-3">
      <label className="min-w-56 flex-1 text-xs text-[var(--color-ink-muted)]">Search price lists<input name="q" defaultValue={q} placeholder="List name, customer or account code" className={field} /></label>
      <label className="text-xs text-[var(--color-ink-muted)]">Currency<select name="currency" defaultValue={currency} className={field}><option value="">All currencies</option>{SALES_CURRENCIES.map(c => <option key={c}>{c}</option>)}</select></label>
      <label className="text-xs text-[var(--color-ink-muted)]">Customers & agreements<select name="usage" defaultValue={usage} className={field}><option value="">All lists</option><option value="assigned">In use</option><option value="unused">Unassigned</option></select></label>
      <Button type="submit" variant="secondary">Search</Button>{(q || currency || usage) && <Link href="/sales/price-lists" className="py-2 text-sm text-[var(--color-ink-muted)]">Reset</Link>}
    </form>
    <DataTable rows={lists} getHref={row => `/sales/price-lists/${row.id}`} emptyLabel={q || currency || usage ? "No price lists match these filters." : "No price lists yet. Create a list from scratch, copy another list or start with catalogue prices."} columns={[
      { header: "Price list", render: row => <span className="font-semibold text-[var(--color-atlas-blue)]">{row.name}</span> },
      { header: "Sales currency", render: row => row.currency },
      { header: "Price rules", align: "right", render: row => row._count.entries },
      { header: "Customers", align: "right", render: row => row._count.customerDefaults },
      { header: "CRM agreements", align: "right", render: row => row._count.agreements },
    ]} />
    <div className="flex items-center justify-between text-xs text-[var(--color-ink-muted)]"><span>{total} {total === 1 ? "price list" : "price lists"} · page {page} of {pages}</span><div className="flex gap-4">{page > 1 && <Link href={href(page - 1)}>Previous</Link>}{page < pages && <Link href={href(page + 1)}>Next</Link>}</div></div>
  </div>;
}
