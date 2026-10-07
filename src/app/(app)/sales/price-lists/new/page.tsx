import Link from "next/link";
import { requireSession } from "@/core/auth/session";
import { assertCapability } from "@/core/permissions/check";
import { CORE_CAPABILITIES } from "@/core/permissions/capabilities";
import { db } from "@/core/db/client";
import { ListSetup } from "@/app/(app)/pricing/list-setup";
export default async function NewPriceList({ searchParams }: { searchParams: Promise<{ copy?: string }> }) {
  const session = await requireSession();
  assertCapability(session, CORE_CAPABILITIES.pricingManage);
  const { copy } = await searchParams;
  const [lists, categories, customers] = await Promise.all([
    db.priceList.findMany({ where: { organisationId: session.organisationId }, select: { id: true, name: true, currency: true }, orderBy: { name: "asc" } }),
    db.productCategory.findMany({ where: { organisationId: session.organisationId, active: true }, select: { code: true, name: true }, orderBy: { name: "asc" } }),
    db.party.findMany({ where: { organisationId: session.organisationId, archived: false, identityScrubbed: false }, select: { id: true, name: true, customerCode: true }, orderBy: { name: "asc" } }),
  ]);
  return <div className="mx-auto w-full max-w-3xl space-y-5"><Link href="/sales/price-lists" className="text-sm text-blue-600">← All price lists</Link><div><h2 className="text-2xl font-semibold tracking-tight">New price list</h2><p className="mt-1 text-sm text-[var(--color-ink-muted)]">Choose a starting point, then refine your prices and customer assignments.</p></div><div className="rounded-2xl border border-[var(--color-border)] bg-white p-6"><ListSetup lists={lists} categories={categories} customers={customers} copyId={copy} /></div></div>;
}
