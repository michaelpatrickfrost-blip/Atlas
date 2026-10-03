import Link from "next/link";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { StatusPill } from "@/components/ui/status-pill";
import { formatMoney } from "@/core/shared/money";
import { can } from "@/core/permissions/check";
import { CUSTOMER_CAPABILITIES } from "@/core/permissions/capabilities";
import type { Session } from "@/core/auth/session";
import type { CustomerOverviewContribution } from "@/core/modules/types";
import type { getCustomer, getSetupChecklist } from "@/core/customers/queries";

type Customer = NonNullable<Awaited<ReturnType<typeof getCustomer>>>;

export function CustomerOverview({
  customer,
  contributions,
  checklist,
  session,
}: {
  customer: Customer;
  contributions: CustomerOverviewContribution[];
  checklist: ReturnType<typeof getSetupChecklist>;
  session: Session;
}) {
  const incomplete = checklist.filter((item) => !item.done);
  const primaryContact = customer.contacts.find((contact) => contact.isPrimary) ?? customer.contacts[0];
  const billingAddress = customer.addresses.find((address) => address.isDefaultBilling);
  const deliveryAddress = customer.addresses.find((address) => address.isDefaultDelivery);

  const allMetrics = contributions.flatMap((contribution) => contribution.metrics);
  const totalExposure = contributions.reduce((sum, contribution) => sum + (contribution.creditExposure?.amountMinorUnits ?? 0), 0);
  const exposureCurrency = contributions.find((contribution) => contribution.creditExposure)?.creditExposure?.currency ?? "GBP";

  const showCredit = can(session, CUSTOMER_CAPABILITIES.creditRead) && customer.creditProfile;

  return (
    <div className="flex flex-col gap-6">
      {incomplete.length > 0 && (
        <Card className="flex flex-col gap-2 border-[var(--color-atlas-blue)]/30 bg-[var(--color-atlas-blue-soft)] p-4">
          <p className="text-sm font-medium text-[var(--color-ink)]">Complete customer setup</p>
          <div className="flex flex-wrap gap-2">
            {incomplete.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className="rounded-full border border-[var(--color-atlas-blue)]/40 bg-[var(--color-surface)] px-3 py-1 text-xs text-[var(--color-atlas-blue)] hover:bg-[var(--color-atlas-blue-soft)]"
              >
                {item.label}
              </Link>
            ))}
          </div>
        </Card>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="flex flex-col gap-6 lg:col-span-2">
          {allMetrics.length > 0 && (
            <section>
              <h2 className="mb-3 text-sm font-medium text-[var(--color-ink-muted)]">Commercial summary</h2>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {allMetrics.map((metric) => (
                  <Card key={metric.label} className="p-4">
                    <p className="truncate text-lg font-semibold text-[var(--color-ink)]">{metric.value}</p>
                    <p className="truncate text-xs text-[var(--color-ink-muted)]">{metric.label}</p>
                  </Card>
                ))}
              </div>
            </section>
          )}

          <section>
            <h2 className="mb-3 text-sm font-medium text-[var(--color-ink-muted)]">Primary contact</h2>
            {primaryContact ? (
              <Card className="p-4">
                <p className="font-medium text-[var(--color-ink)]">
                  {primaryContact.firstName} {primaryContact.surname}
                </p>
                <p className="text-sm text-[var(--color-ink-muted)]">{primaryContact.jobTitle ?? "—"}</p>
                <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-[var(--color-ink-muted)]">
                  {primaryContact.phone && <span>{primaryContact.phone}</span>}
                  {primaryContact.email && <span>{primaryContact.email}</span>}
                </div>
              </Card>
            ) : (
              <EmptyState title="No contacts yet." />
            )}
          </section>

          <section>
            <h2 className="mb-3 text-sm font-medium text-[var(--color-ink-muted)]">Addresses</h2>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <AddressCard label="Billing" address={billingAddress} />
              <AddressCard label="Delivery" address={deliveryAddress} />
            </div>
          </section>
        </div>

        <div className="flex flex-col gap-6">
          {showCredit && customer.creditProfile && (
            <section>
              <h2 className="mb-3 text-sm font-medium text-[var(--color-ink-muted)]">Credit</h2>
              <CreditCard
                limit={customer.creditProfile.creditLimitAmount}
                currency={customer.creditProfile.creditLimitCurrency}
                exposure={totalExposure}
                exposureCurrency={exposureCurrency}
                onHold={customer.creditProfile.onHold}
              />
            </section>
          )}
        </div>
      </div>
    </div>
  );
}

function AddressCard({ label, address }: { label: string; address: { line1: string; city: string | null; postcode: string | null; country: string | null } | undefined }) {
  return (
    <Card className="p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-[var(--color-ink-faint)]">{label}</p>
      {address ? (
        <p className="mt-1 text-sm text-[var(--color-ink)]">
          {address.line1}
          {address.city && `, ${address.city}`}
          {address.postcode && `, ${address.postcode}`}
          {address.country && `, ${address.country}`}
        </p>
      ) : (
        <p className="mt-1 text-sm text-[var(--color-ink-faint)]">Not set</p>
      )}
    </Card>
  );
}

function CreditCard({
  limit,
  currency,
  exposure,
  exposureCurrency,
  onHold,
}: {
  limit: number;
  currency: string;
  exposure: number;
  exposureCurrency: string;
  onHold: boolean;
}) {
  const available = limit - exposure;
  const utilisation = limit > 0 ? Math.round((exposure / limit) * 100) : 0;
  const exceeded = exposure > limit && limit > 0;

  return (
    <Card className={`p-4 ${exceeded ? "border-[var(--color-status-danger)]/40" : ""}`}>
      {exceeded && <StatusPill label="Limit exceeded" tone="danger" />}
      <div className="mt-2 grid grid-cols-3 gap-2 text-sm">
        <div>
          <p className="font-semibold text-[var(--color-ink)]">{formatMoney(limit, currency)}</p>
          <p className="text-xs text-[var(--color-ink-muted)]">Limit</p>
        </div>
        <div>
          <p className={`font-semibold ${exceeded ? "text-[var(--color-status-danger)]" : "text-[var(--color-ink)]"}`}>{formatMoney(exposure, exposureCurrency)}</p>
          <p className="text-xs text-[var(--color-ink-muted)]">Exposure</p>
        </div>
        <div>
          <p className="font-semibold text-[var(--color-ink)]">{formatMoney(Math.max(available, 0), currency)}</p>
          <p className="text-xs text-[var(--color-ink-muted)]">Available</p>
        </div>
      </div>
      <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-[var(--color-surface-sunken)]">
        <div
          className="h-full rounded-full"
          style={{ width: `${Math.min(utilisation, 100)}%`, background: exceeded ? "var(--color-status-danger)" : "var(--color-atlas-blue)" }}
        />
      </div>
      <p className="mt-1 text-xs text-[var(--color-ink-faint)]">{utilisation}% utilised{onHold ? " · on hold" : ""}</p>
    </Card>
  );
}
