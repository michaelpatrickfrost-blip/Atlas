import Link from "next/link";
import { db } from "@/core/db/client";
import { ActionForm } from "@/components/ui/action-form";
import { Button } from "@/components/ui/button";
import { saveOrderingPreferences } from "@/core/customers/commercial-actions";
import { Card } from "@/components/ui/card";
import { StatusPill } from "@/components/ui/status-pill";
import { can } from "@/core/permissions/check";
import { CORE_CAPABILITIES, CUSTOMER_CAPABILITIES } from "@/core/permissions/capabilities";
import { agreementLabel, formatHours } from "@/core/pricing/agreements";
import { resolveAccountPricing } from "@/core/pricing/resolve-price";
import { CustomerInvoiceTemplates } from "./invoice-templates";
import type { Session } from "@/core/auth/session";
import type { getCustomer } from "@/core/customers/queries";

type Customer = NonNullable<Awaited<ReturnType<typeof getCustomer>>>;

/** Commercial section editing follows §35 — a compact read view with "Edit"
 *  disclosures per group, never one giant form. Only two groups (Ownership,
 *  Ordering) are wired to a command in this vertical slice; Pricing/Delivery/
 *  Documents fields exist on the schema (CustomerCommercialSettings) for a
 *  future module to populate and are shown read-only when present. */
export async function Commercial({ customer, session }: { customer: Customer; session: Session }) {
  if (!can(session, CUSTOMER_CAPABILITIES.commercialRead)) {
    return <p className="text-sm text-[var(--color-ink-muted)]">You don&apos;t have permission to view commercial settings.</p>;
  }

  const canManage = can(session, CUSTOMER_CAPABILITIES.commercialManage);
  const settings = customer.commercialSettings;
  const [lists, agreements, pricing] = await Promise.all([
    db.priceList.findMany({ where: { organisationId: session.organisationId }, orderBy: { name: "asc" }, select: { id: true, name: true, currency: true } }),
    db.commercialAgreement.findMany({ where: { organisationId: session.organisationId, partyId: customer.id }, include: { priceList: { select: { name: true } } }, orderBy: { startsOn: "desc" } }),
    resolveAccountPricing(session.organisationId, customer.id),
  ]);
  const assignedList = lists.find((list) => list.id === pricing.priceListId);
  const canPrice = can(session, CORE_CAPABILITIES.pricingRead);
  const canPriceManage = can(session, CORE_CAPABILITIES.pricingManage);

  return (
    <div className="flex flex-col gap-6">
      <section>
        <h2 className="mb-3 text-sm font-medium text-[var(--color-ink-muted)]">Ownership</h2>
        <Card className="grid grid-cols-2 gap-4 p-4 text-sm sm:grid-cols-3">
          <Field label="Account manager" value={customer.accountManagerUserId ?? "—"} />
          <Field label="Territory" value={customer.territory ?? "—"} />
          <Field label="Customer group" value={customer.customerGroup ?? "—"} />
        </Card>
      </section>

      <section>
        <h2 className="mb-3 text-sm font-medium text-[var(--color-ink-muted)]">Ordering</h2>
        <Card className="grid grid-cols-2 gap-4 p-4 text-sm sm:grid-cols-3">
          <Field label="Customer PO required" value={settings?.customerPoRequired ? "Yes" : "No"} />
          <Field label="Order reference required" value={settings?.orderReferenceRequired ? "Yes" : "No"} />
          <Field label="Partial shipment allowed" value={settings?.partialShipmentAllowed === false ? "No" : "Yes"} />
        </Card>
        {canManage && (
          <details className="mt-3 rounded-[var(--radius-atlas-md)] border border-dashed border-[var(--color-border)] p-4">
            <summary className="cursor-pointer text-sm font-medium text-[var(--color-atlas-blue)]">Edit ordering settings</summary>
            <ActionForm action={saveOrderingPreferences} className="mt-4 grid gap-4 sm:grid-cols-2">
              <input type="hidden" name="partyId" value={customer.id}/>
              <label className="text-sm sm:col-span-2">Default pricelist<select name="priceList" defaultValue={settings?.priceList??""} className="mt-2 block w-full rounded-xl border border-[var(--color-border)] bg-white p-3"><option value="">Standard product prices</option>{lists.map(l=><option key={l.id} value={l.id}>{l.name} · {l.currency}</option>)}</select></label>
              <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="customerPoRequired" defaultChecked={settings?.customerPoRequired??false}/>Customer PO required</label>
              <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="orderReferenceRequired" defaultChecked={settings?.orderReferenceRequired??false}/>Order reference required</label>
              <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="partialShipmentAllowed" defaultChecked={settings?.partialShipmentAllowed??true}/>Allow partial shipments</label>
              <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="backordersAllowed" defaultChecked={settings?.backordersAllowed??true}/>Allow backorders</label>
              <Button type="submit" variant="primary" className="justify-self-start">Save preferences</Button>
            </ActionForm>
          </details>
        )}
      </section>

      <Card className="p-4 text-sm">
        <Field label={pricing.inheritedFrom ? `Price list in effect (inherited from ${pricing.inheritedFrom})` : "Price list in effect"} value={assignedList?.name ?? "Catalogue prices"} />
        <p className="mt-3 text-xs text-[var(--color-ink-muted)]">
          {pricing.inheritedFrom
            ? `This account has no agreement or usual price list of its own, so it is held to ${pricing.inheritedFrom}'s. Add an agreement or set a usual price list below to override it.`
            : "New quotations and orders use this list. An active agreement can replace it, and a special price on that agreement replaces the list. Prices already saved on a document stay as they were."}
        </p>
      </Card>

      <CustomerInvoiceTemplates customer={customer} session={session} />

      <section>
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 className="text-sm font-medium text-[var(--color-ink-muted)]">Agreements</h2>
          {canPriceManage && <Link href={`/pricing/agreements/new?party=${customer.id}`} className="text-sm font-medium text-[var(--color-atlas-blue)]">New agreement</Link>}
        </div>
        {agreements.length ? (
          <div className="flex flex-col gap-3">
            {agreements.map((agreement) => {
              const status = agreementLabel(agreement.status, agreement.endsOn);
              const service = [agreement.slaName, agreement.coverage, agreement.responseMinutes ? `respond ${formatHours(agreement.responseMinutes)}` : ""].filter(Boolean).join(" · ");
              return (
                <Card key={agreement.id} className="flex flex-wrap items-start justify-between gap-3 p-4 text-sm">
                  <div>
                    <p className="font-medium">{agreement.name}</p>
                    <p className="mt-1 text-xs text-[var(--color-ink-muted)]">{agreement.number} · {agreement.startsOn.toLocaleDateString("en-GB")}{agreement.endsOn ? ` – ${agreement.endsOn.toLocaleDateString("en-GB")}` : ""} · {agreement.priceList?.name ?? "Usual price list"}</p>
                    {service && <p className="mt-2 text-xs text-[var(--color-ink-muted)]">{service}</p>}
                  </div>
                  <div className="flex items-center gap-3">
                    <StatusPill label={status.label} tone={status.tone} />
                    {canPrice && <Link href={`/pricing/agreements/${agreement.id}`} className="text-sm text-[var(--color-atlas-blue)]">Open</Link>}
                  </div>
                </Card>
              );
            })}
          </div>
        ) : pricing.inheritedFrom && pricing.agreement ? (
          <Card className="flex flex-wrap items-start justify-between gap-3 p-4 text-sm">
            <div>
              <p className="font-medium">{pricing.agreement.name} <span className="font-normal text-[var(--color-ink-muted)]">— inherited from {pricing.inheritedFrom}</span></p>
              <p className="mt-1 text-xs text-[var(--color-ink-muted)]">This account has no agreement of its own, so {pricing.inheritedFrom}&rsquo;s contract applies here too.</p>
            </div>
            {canPrice && <Link href={`/pricing/agreements/${pricing.agreement.id}`} className="text-sm text-[var(--color-atlas-blue)]">Open parent&rsquo;s agreement</Link>}
          </Card>
        ) : (
          <Card className="p-4 text-sm text-[var(--color-ink-muted)]">No contract or service promise is recorded for this customer.</Card>
        )}
      </section>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[var(--color-ink)]">{value}</p>
      <p className="text-xs text-[var(--color-ink-muted)]">{label}</p>
    </div>
  );
}
