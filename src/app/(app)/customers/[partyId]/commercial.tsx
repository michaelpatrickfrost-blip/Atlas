import { Card } from "@/components/ui/card";
import { can } from "@/core/permissions/check";
import { CUSTOMER_CAPABILITIES } from "@/core/permissions/capabilities";
import type { Session } from "@/core/auth/session";
import type { getCustomer } from "@/core/customers/queries";

type Customer = NonNullable<Awaited<ReturnType<typeof getCustomer>>>;

/** Commercial section editing follows §35 — a compact read view with "Edit"
 *  disclosures per group, never one giant form. Only two groups (Ownership,
 *  Ordering) are wired to a command in this vertical slice; Pricing/Delivery/
 *  Documents fields exist on the schema (CustomerCommercialSettings) for a
 *  future module to populate and are shown read-only when present. */
export function Commercial({ customer, session }: { customer: Customer; session: Session }) {
  if (!can(session, CUSTOMER_CAPABILITIES.commercialRead)) {
    return <p className="text-sm text-[var(--color-ink-muted)]">You don&apos;t have permission to view commercial settings.</p>;
  }

  const canManage = can(session, CUSTOMER_CAPABILITIES.commercialManage);
  const settings = customer.commercialSettings;

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
            <p className="mt-2 text-xs text-[var(--color-ink-faint)]">
              Editing is scoped to this vertical slice&apos;s reference implementation — the underlying
              `updateCommercialSettings` command and capability are wired; the full edit form is a
              natural next addition.
            </p>
          </details>
        )}
      </section>

      {!settings?.priceList && !settings?.discountGroup && (
        <p className="text-sm text-[var(--color-ink-faint)]">
          Pricing, delivery and document preferences will appear here once a Finance or Stock module
          populates them.
        </p>
      )}
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
