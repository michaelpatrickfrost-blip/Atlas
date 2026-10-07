import Link from "next/link";
import { requireSession } from "@/core/auth/session";
import { assertCapability } from "@/core/permissions/check";
import { CORE_CAPABILITIES } from "@/core/permissions/capabilities";
import { db } from "@/core/db/client";
import { AgreementForm } from "@/app/(app)/pricing/agreement-form";

export default async function NewAgreementPage({ searchParams }: { searchParams: Promise<{ party?: string }> }) {
  const session = await requireSession();
  assertCapability(session, CORE_CAPABILITIES.pricingManage);
  const { party } = await searchParams;
  const [customers, lists] = await Promise.all([
    db.party.findMany({ where: { organisationId: session.organisationId, identityScrubbed: false }, select: { id: true, name: true, customerCode: true }, orderBy: { name: "asc" } }),
    db.priceList.findMany({ where: { organisationId: session.organisationId }, select: { id: true, name: true, currency: true }, orderBy: { name: "asc" } }),
  ]);
  const selected = customers.some((customer) => customer.id === party) ? party : undefined;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Link href="/crm/agreements" className="text-sm text-[var(--color-atlas-blue)]">All agreements</Link>
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">New agreement</h2>
        <p className="mt-2 text-sm leading-relaxed text-[var(--color-ink-muted)]">Keep it as a draft until the customer has agreed. Active agreements set the price on new quotes and orders.</p>
      </div>
      <div className="rounded-[22px] border border-[var(--color-border)] bg-white p-6 shadow-[var(--shadow-atlas)]">
        <AgreementForm customers={customers} lists={lists} agreement={selected ? { id: "new", partyId: selected, name: "", status: "DRAFT", startsOn: new Date(), endsOn: null, priceListId: null, paymentTerms: "", notes: "", slaName: "", coverage: "", responseMinutes: null, resolutionMinutes: null, slaNotes: "" } : undefined} />
      </div>
    </div>
  );
}
