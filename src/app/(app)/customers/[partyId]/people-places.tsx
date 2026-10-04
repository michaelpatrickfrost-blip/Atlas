import { Card } from "@/components/ui/card";
import { StatusPill } from "@/components/ui/status-pill";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { can } from "@/core/permissions/check";
import { CUSTOMER_CAPABILITIES } from "@/core/permissions/capabilities";
import type { Session } from "@/core/auth/session";
import type { getCustomer } from "@/core/customers/queries";
import { createAddressFormAction } from "@/app/(app)/customers/[partyId]/actions";

type Customer = NonNullable<Awaited<ReturnType<typeof getCustomer>>>;

const ADDRESS_TYPES = ["BILLING", "DELIVERY", "REGISTERED", "SITE", "SERVICE", "OFFICE", "OTHER"] as const;

export function Addresses({ customer, session }: { customer: Customer; session: Session }) {
  const canManageAddresses = can(session, CUSTOMER_CAPABILITIES.addressesManage);

  return (
    <div className="flex flex-col gap-8">
      <section>
        <h2 className="mb-3 text-sm font-medium text-[var(--color-ink-muted)]">Addresses</h2>
        {customer.addresses.length === 0 ? (
          <EmptyState title="No addresses yet." />
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {customer.addresses.map((address) => (
              <Card key={address.id} className="p-4">
                <div className="flex items-center justify-between">
                  <StatusPill label={address.type} tone="neutral" />
                  <div className="flex gap-1">
                    {address.isDefaultBilling && <StatusPill label="Default billing" tone="success" />}
                    {address.isDefaultDelivery && <StatusPill label="Default delivery" tone="success" />}
                  </div>
                </div>
                <p className="mt-2 text-sm text-[var(--color-ink)]">
                  {address.line1}
                  {address.city && `, ${address.city}`}
                  {address.postcode && `, ${address.postcode}`}
                  {address.country && `, ${address.country}`}
                </p>
              </Card>
            ))}
          </div>
        )}

        {canManageAddresses && (
          <details className="mt-3 rounded-[var(--radius-atlas-md)] border border-dashed border-[var(--color-border)] p-4">
            <summary className="cursor-pointer text-sm font-medium text-[var(--color-atlas-blue)]">Add address</summary>
            <form action={createAddressFormAction.bind(null, customer.id)} className="mt-3 flex flex-col gap-3">
              <select name="type" className={inputClass} defaultValue="BILLING">
                {ADDRESS_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
              <input name="line1" placeholder="Address line 1" required className={inputClass} />
              <div className="grid grid-cols-2 gap-3">
                <input name="city" placeholder="City" className={inputClass} />
                <input name="postcode" placeholder="Postcode" className={inputClass} />
              </div>
              <input name="country" placeholder="Country" className={inputClass} />
              <div className="flex gap-4">
                <label className="flex items-center gap-1.5 text-sm text-[var(--color-ink-muted)]">
                  <input type="checkbox" name="isDefaultBilling" /> Default billing
                </label>
                <label className="flex items-center gap-1.5 text-sm text-[var(--color-ink-muted)]">
                  <input type="checkbox" name="isDefaultDelivery" /> Default delivery
                </label>
              </div>
              <Button type="submit" variant="primary" className="self-start">
                Add address
              </Button>
            </form>
          </details>
        )}
      </section>
    </div>
  );
}

const inputClass =
  "rounded-[var(--radius-atlas-sm)] border border-[var(--color-border-strong)] px-3 py-2 text-sm outline-none focus:border-[var(--color-atlas-blue)]";
