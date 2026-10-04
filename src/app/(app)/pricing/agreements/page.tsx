import Link from "next/link";
import { requireSession } from "@/core/auth/session";
import { assertCapability, can } from "@/core/permissions/check";
import { CORE_CAPABILITIES } from "@/core/permissions/capabilities";
import { db } from "@/core/db/client";
import { agreementLabel, formatHours } from "@/core/pricing/agreements";
import { StatusPill } from "@/components/ui/status-pill";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";

export default async function AgreementsPage() {
  const session = await requireSession();
  assertCapability(session, CORE_CAPABILITIES.pricingRead);
  const agreements = await db.commercialAgreement.findMany({
    where: { organisationId: session.organisationId },
    include: { party: { select: { name: true, customerCode: true } }, priceList: { select: { name: true } } },
    orderBy: [{ status: "asc" }, { startsOn: "desc" }],
  });
  const manage = can(session, CORE_CAPABILITIES.pricingManage);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <p className="max-w-2xl text-sm leading-relaxed text-[var(--color-ink-muted)]">An agreement is the contract for one customer: the dates, the price list, any special prices, and the service promise. A draft does not change what you charge. Quantity call-offs from a blanket quotation stay in <Link href="/sales/agreements" className="text-[var(--color-atlas-blue)]">Sales</Link>.</p>
        {manage && <Link href="/pricing/agreements/new"><Button variant="primary">New agreement</Button></Link>}
      </div>
      {agreements.length ? (
        <div className="overflow-hidden rounded-[22px] border border-[var(--color-border)] bg-white shadow-[var(--shadow-atlas)]">
          <table className="w-full min-w-[760px] text-sm">
            <thead>
              <tr className="border-b border-[var(--color-border)] bg-[var(--color-surface-sunken)] text-left text-xs uppercase tracking-wide text-[var(--color-ink-faint)]">
                <th className="px-5 py-3 font-medium">Agreement</th>
                <th className="px-3 py-3 font-medium">Customer</th>
                <th className="px-3 py-3 font-medium">Prices</th>
                <th className="px-3 py-3 font-medium">Service</th>
                <th className="px-5 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {agreements.map((agreement) => {
                const status = agreementLabel(agreement.status, agreement.endsOn);
                const service = [agreement.slaName, agreement.responseMinutes ? `respond ${formatHours(agreement.responseMinutes)}` : "", agreement.resolutionMinutes ? `resolve ${formatHours(agreement.resolutionMinutes)}` : ""].filter(Boolean).join(" · ");
                return (
                  <tr key={agreement.id} className="border-b border-[var(--color-border)] last:border-0 hover:bg-[#f4f7ff]">
                    <td className="px-5 py-3"><Link href={`/pricing/agreements/${agreement.id}`} className="font-medium text-[var(--color-atlas-blue)]">{agreement.number}</Link><span className="mt-0.5 block text-[var(--color-ink)]">{agreement.name}</span></td>
                    <td className="px-3 py-3">{agreement.party.customerCode}<span className="mt-0.5 block text-xs text-[var(--color-ink-muted)]">{agreement.party.name}</span></td>
                    <td className="px-3 py-3 text-[var(--color-ink-muted)]">{agreement.priceList?.name ?? "Usual customer prices"}</td>
                    <td className="px-3 py-3 text-[var(--color-ink-muted)]">{service || "No service promise"}</td>
                    <td className="px-5 py-3"><StatusPill label={status.label} tone={status.tone} /></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <EmptyState title="No agreements yet" description="Create one when a customer has agreed prices, payment terms or a service promise." action={manage ? <Link href="/pricing/agreements/new"><Button variant="primary">New agreement</Button></Link> : undefined} />
      )}
    </div>
  );
}
