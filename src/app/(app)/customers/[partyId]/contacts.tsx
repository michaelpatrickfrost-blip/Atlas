import { Card } from "@/components/ui/card";
import { StatusPill } from "@/components/ui/status-pill";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { can } from "@/core/permissions/check";
import { CUSTOMER_CAPABILITIES } from "@/core/permissions/capabilities";
import type { Session } from "@/core/auth/session";
import type { getCustomer } from "@/core/customers/queries";
import { createContactFormAction, updateContactFormAction } from "@/app/(app)/customers/[partyId]/actions";
import { DeleteContactButton } from "@/app/(app)/customers/[partyId]/delete-contact-button";

type Customer = NonNullable<Awaited<ReturnType<typeof getCustomer>>>;
type Contact = Customer["contacts"][number];

const CONTACT_ROLES = ["PRIMARY", "SALES", "ACCOUNTS_PAYABLE", "PURCHASING", "OPERATIONS", "DELIVERY", "TECHNICAL", "EXECUTIVE", "OTHER"] as const;
const PREFERRED_METHODS = ["EMAIL", "PHONE", "MOBILE"] as const;

export function Contacts({ customer, session }: { customer: Customer; session: Session }) {
  const canManageContacts = can(session, CUSTOMER_CAPABILITIES.contactsManage);
  const contactsById = new Map(customer.contacts.map((contact) => [contact.id, contact]));

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-medium text-[var(--color-ink-muted)]">
          {customer.contacts.length} contact{customer.contacts.length === 1 ? "" : "s"}
        </h2>
      </div>

      {customer.contacts.length === 0 ? (
        <EmptyState title="No contacts yet." description="Add the people at this account so your team knows who to call." />
      ) : (
        <div className="flex flex-col gap-3">
          {customer.contacts.map((contact) => (
            <ContactCard
              key={contact.id}
              contact={contact}
              partyId={customer.id}
              canManage={canManageContacts}
              reportsToName={contact.reportsToContactId ? contactName(contactsById.get(contact.reportsToContactId)) : null}
              directReportCount={customer.contacts.filter((c) => c.reportsToContactId === contact.id).length}
            />
          ))}
        </div>
      )}

      {canManageContacts && (
        <details className="rounded-[var(--radius-atlas-md)] border border-dashed border-[var(--color-border)] p-4">
          <summary className="cursor-pointer text-sm font-medium text-[var(--color-atlas-blue)]">Add contact</summary>
          <form action={createContactFormAction.bind(null, customer.id)} className="mt-3 flex flex-col gap-3">
            <div className="grid grid-cols-2 gap-3">
              <input name="firstName" placeholder="First name" required className={inputClass} />
              <input name="surname" placeholder="Surname" required className={inputClass} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <input name="jobTitle" placeholder="Job title" className={inputClass} />
              <input name="department" placeholder="Department" className={inputClass} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <input name="email" type="email" placeholder="Email" className={inputClass} />
              <input name="phone" type="tel" placeholder="Phone" className={inputClass} />
            </div>
            <input name="mobile" type="tel" placeholder="Mobile" className={inputClass} />
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
    </div>
  );
}

function contactName(contact: Contact | undefined) {
  if (!contact) return null;
  return `${contact.firstName} ${contact.surname}`;
}

function ContactCard({
  contact,
  partyId,
  canManage,
  reportsToName,
  directReportCount,
}: {
  contact: Contact;
  partyId: string;
  canManage: boolean;
  reportsToName: string | null;
  directReportCount: number;
}) {
  return (
    <Card className="p-0">
      <details className="group">
        <summary className="flex cursor-pointer list-none flex-wrap items-center justify-between gap-3 p-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <p className="font-medium text-[var(--color-ink)]">
                {contact.title ? `${contact.title} ` : ""}
                {contact.firstName} {contact.surname}
              </p>
              {contact.isPrimary && <StatusPill label="Primary" tone="neutral" />}
              {contact.status === "INACTIVE" && <StatusPill label="Inactive" tone="warning" />}
            </div>
            <p className="text-sm text-[var(--color-ink-muted)]">
              {[contact.jobTitle, contact.department].filter(Boolean).join(" · ") || "—"}
            </p>
          </div>
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-[var(--color-ink-muted)]">
            {contact.email && <span>{contact.email}</span>}
            {(contact.phone || contact.mobile) && <span>{contact.mobile ?? contact.phone}</span>}
          </div>
          <div className="flex flex-wrap gap-1">
            {contact.roles.map((role) => (
              <StatusPill key={role} label={role.replace("_", " ")} tone="neutral" />
            ))}
          </div>
        </summary>

        <div className="flex flex-col gap-4 border-t border-[var(--color-border)] p-4">
          {canManage ? (
            <form action={updateContactFormAction.bind(null, contact.id, partyId)} className="flex flex-col gap-3">
              <div className="grid grid-cols-3 gap-3">
                <input name="title" placeholder="Title" defaultValue={contact.title ?? ""} className={inputClass} />
                <input name="firstName" placeholder="First name" defaultValue={contact.firstName} required className={inputClass} />
                <input name="surname" placeholder="Surname" defaultValue={contact.surname} required className={inputClass} />
              </div>
              <input name="preferredName" placeholder="Preferred name" defaultValue={contact.preferredName ?? ""} className={inputClass} />
              <div className="grid grid-cols-2 gap-3">
                <input name="jobTitle" placeholder="Job title" defaultValue={contact.jobTitle ?? ""} className={inputClass} />
                <input name="department" placeholder="Department" defaultValue={contact.department ?? ""} className={inputClass} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <input name="email" type="email" placeholder="Email" defaultValue={contact.email ?? ""} className={inputClass} />
                <input
                  name="alternativeEmail"
                  type="email"
                  placeholder="Alternative email"
                  defaultValue={contact.alternativeEmail ?? ""}
                  className={inputClass}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <input name="phone" type="tel" placeholder="Phone" defaultValue={contact.phone ?? ""} className={inputClass} />
                <input name="mobile" type="tel" placeholder="Mobile" defaultValue={contact.mobile ?? ""} className={inputClass} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <select name="preferredContactMethod" defaultValue={contact.preferredContactMethod ?? ""} className={inputClass}>
                  <option value="">Preferred contact method</option>
                  {PREFERRED_METHODS.map((method) => (
                    <option key={method} value={method}>
                      {method}
                    </option>
                  ))}
                </select>
                <select name="status" defaultValue={contact.status} className={inputClass}>
                  <option value="ACTIVE">Active</option>
                  <option value="INACTIVE">Inactive</option>
                </select>
              </div>
              <input name="language" placeholder="Language" defaultValue={contact.language ?? ""} className={inputClass} />
              {(reportsToName || directReportCount > 0) && (
                <div className="grid grid-cols-2 gap-3 text-sm text-[var(--color-ink-muted)]">
                  {reportsToName && <span>Reports to {reportsToName}</span>}
                  {directReportCount > 0 && <span>{directReportCount} direct report{directReportCount === 1 ? "" : "s"}</span>}
                </div>
              )}
              <textarea name="notes" placeholder="Notes" defaultValue={contact.notes ?? ""} className={`${inputClass} min-h-20`} />
              <div className="flex flex-wrap gap-3">
                {CONTACT_ROLES.map((role) => (
                  <label key={role} className="flex items-center gap-1.5 text-xs text-[var(--color-ink-muted)]">
                    <input type="checkbox" name="roles" value={role} defaultChecked={contact.roles.includes(role)} />
                    {role.replace("_", " ")}
                  </label>
                ))}
              </div>
              <label className="flex items-center gap-1.5 text-sm text-[var(--color-ink-muted)]">
                <input type="checkbox" name="isPrimary" defaultChecked={contact.isPrimary} /> Primary contact
              </label>
              <div className="flex items-center gap-2 border-t border-[var(--color-border)] pt-3">
                <Button type="submit" variant="primary">
                  Save changes
                </Button>
                <DeleteContactButton contactId={contact.id} partyId={partyId} contactName={`${contact.firstName} ${contact.surname}`} />
              </div>
            </form>
          ) : (
            <>
              <div className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
                <DetailField label="Preferred name" value={contact.preferredName} />
                <DetailField label="Preferred contact method" value={contact.preferredContactMethod} />
                <DetailField label="Email" value={contact.email} />
                <DetailField label="Alternative email" value={contact.alternativeEmail} />
                <DetailField label="Phone" value={contact.phone} />
                <DetailField label="Mobile" value={contact.mobile} />
                <DetailField label="Language" value={contact.language} />
                <DetailField label="Reports to" value={reportsToName} />
                <DetailField label="Direct reports" value={directReportCount > 0 ? String(directReportCount) : null} />
              </div>
              {contact.notes && (
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-[var(--color-ink-muted)]">Notes</p>
                  <p className="mt-1 whitespace-pre-wrap text-sm text-[var(--color-ink)]">{contact.notes}</p>
                </div>
              )}
            </>
          )}
        </div>
      </details>
    </Card>
  );
}

function DetailField({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-[var(--color-ink-muted)]">{label}</p>
      <p className="text-[var(--color-ink)]">{value ?? "—"}</p>
    </div>
  );
}

const inputClass =
  "rounded-[var(--radius-atlas-sm)] border border-[var(--color-border-strong)] px-3 py-2 text-sm outline-none focus:border-[var(--color-atlas-blue)]";
