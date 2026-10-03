import { Card } from "@/components/ui/card";
import { StatusPill } from "@/components/ui/status-pill";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { can } from "@/core/permissions/check";
import { CUSTOMER_CAPABILITIES } from "@/core/permissions/capabilities";
import type { Session } from "@/core/auth/session";
import type { getCustomer } from "@/core/customers/queries";
import { createContactFormAction, createAddressFormAction } from "@/app/(app)/customers/[partyId]/actions";

type Customer = NonNullable<Awaited<ReturnType<typeof getCustomer>>>;

const ADDRESS_TYPES = ["BILLING", "DELIVERY", "REGISTERED", "SITE", "SERVICE", "OFFICE", "OTHER"] as const;
const CONTACT_ROLES = ["PRIMARY", "SALES", "ACCOUNTS_PAYABLE", "PURCHASING", "OPERATIONS", "DELIVERY", "TECHNICAL", "EXECUTIVE", "OTHER"] as const;

export function PeopleAndPlaces({ customer, session }: { customer: Customer; session: Session }) {
  const canManageContacts = can(session, CUSTOMER_CAPABILITIES.contactsManage);
  const canManageAddresses = can(session, CUSTOMER_CAPABILITIES.addressesManage);

  return (
    <div className="flex flex-col gap-8">
      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-medium text-[var(--color-ink-muted)]">Contacts</h2>
        </div>
        {customer.contacts.length === 0 ? (
          <EmptyState title="No contacts yet." />
        ) : (
          <div className="flex flex-col gap-2">
            {customer.contacts.map((contact) => (
              <Card key={contact.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-[var(--color-ink)]">
                      {contact.firstName} {contact.surname}
                    </p>
                    {contact.isPrimary && <StatusPill label="Primary" tone="neutral" />}
                  </div>
                  <p className="text-sm text-[var(--color-ink-muted)]">{contact.jobTitle ?? "—"}</p>
                </div>
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-[var(--color-ink-muted)]">
                  {contact.email && <span>{contact.email}</span>}
                  {contact.phone && <span>{contact.phone}</span>}
                </div>
                <div className="flex flex-wrap gap-1">
                  {contact.roles.map((role) => (
                    <StatusPill key={role} label={role.replace("_", " ")} tone="neutral" />
                  ))}
                </div>
              </Card>
            ))}
          </div>
        )}

        {canManageContacts && (
          <details className="mt-3 rounded-[var(--radius-atlas-md)] border border-dashed border-[var(--color-border)] p-4">
            <summary className="cursor-pointer text-sm font-medium text-[var(--color-atlas-blue)]">Add contact</summary>
            <form action={createContactFormAction.bind(null, customer.id)} className="mt-3 flex flex-col gap-3">
              <div className="grid grid-cols-2 gap-3">
                <input name="firstName" placeholder="First name" required className={inputClass} />
                <input name="surname" placeholder="Surname" required className={inputClass} />
              </div>
              <input name="jobTitle" placeholder="Job title" className={inputClass} />
              <div className="grid grid-cols-2 gap-3">
                <input name="email" type="email" placeholder="Email" className={inputClass} />
                <input name="phone" type="tel" placeholder="Phone" className={inputClass} />
              </div>
              <div className="flex flex-wrap gap-3">
                {CONTACT_ROLES.map((role) => (
                  <label key={role} className="flex items-center gap-1.5 text-xs text-[var(--color-ink-muted)]">
                    <input type="checkbox" name="roles" value={role} />
                    {role.replace("_", " ")}
                  </label>
                ))}
              </div>
              <label className="flex items-center gap-1.5 text-sm text-[var(--color-ink-muted)]">
                <input type="checkbox" name="isPrimary" /> Primary contact
              </label>
              <Button type="submit" variant="primary" className="self-start">
                Add contact
              </Button>
            </form>
          </details>
        )}
      </section>

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
