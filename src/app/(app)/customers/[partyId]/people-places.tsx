import { Card } from "@/components/ui/card";
import { StatusPill } from "@/components/ui/status-pill";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { can } from "@/core/permissions/check";
import { CUSTOMER_CAPABILITIES } from "@/core/permissions/capabilities";
import type { Session } from "@/core/auth/session";
import type { getCustomer } from "@/core/customers/queries";
import { createAddressFormAction } from "@/app/(app)/customers/[partyId]/actions";
import { ActionForm } from "@/components/ui/action-form";
import { CreateDialog } from "@/components/ui/create-dialog";
import { archiveAddress, updateAddress } from "@/core/customers/commands";

type Customer = NonNullable<Awaited<ReturnType<typeof getCustomer>>>;

const ADDRESS_TYPES = ["BILLING", "DELIVERY", "REGISTERED", "SITE", "SERVICE", "OFFICE", "OTHER"] as const;

export function Addresses({ customer, session }: { customer: Customer; session: Session }) {
  const canManageAddresses = can(session, CUSTOMER_CAPABILITIES.addressesManage);
  const addresses = customer.addresses.filter((address) => address.active);

  return (
    <div className="flex flex-col gap-8">
      <section>
        <h2 className="mb-3 text-sm font-medium text-[var(--color-ink-muted)]">Addresses</h2>
        {addresses.length === 0 ? (
          <EmptyState title="No addresses yet." />
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {addresses.map((address) => (
              <Card key={address.id} className="p-4">
                <div className="flex items-center justify-between">
                  <StatusPill label={address.label ? `${address.label} · ${address.type}` : address.type} tone="neutral" />
                  <div className="flex gap-1">
                    {address.isDefaultBilling && <StatusPill label="Default billing" tone="success" />}
                    {address.isDefaultDelivery && <StatusPill label="Default delivery" tone="success" />}
                  </div>
                </div>
                <p className="mt-2 text-sm text-[var(--color-ink)]">{[address.line1, address.line2, address.city, address.region, address.postcode, address.country].filter(Boolean).join(", ")}</p>
                {(address.telephone || address.deliveryInstructions) && <p className="mt-1 text-xs text-[var(--color-ink-muted)]">{[address.telephone, address.deliveryInstructions].filter(Boolean).join(" · ")}</p>}
                {canManageAddresses && <div className="mt-3 flex items-center gap-2">
                  <CreateDialog label="Edit" title="Edit address" variant="secondary"><ActionForm action={updateAddress.bind(null, address.id, customer.id)}><div className="flex flex-col gap-3"><AddressFields address={address} /><Button type="submit" variant="primary" className="self-start">Save address</Button></div></ActionForm></CreateDialog>
                  <ActionForm action={archiveAddress.bind(null, address.id, customer.id)}><button className="rounded-lg px-2 py-1 text-xs font-medium text-[var(--color-ink-muted)] hover:bg-slate-100">Remove</button></ActionForm>
                </div>}
              </Card>
            ))}
          </div>
        )}

        {canManageAddresses && (
          <details className="mt-3 rounded-[var(--radius-atlas-md)] border border-dashed border-[var(--color-border)] p-4">
            <summary className="cursor-pointer text-sm font-medium text-[var(--color-atlas-blue)]">Add address</summary>
            <form action={createAddressFormAction.bind(null, customer.id)} className="mt-3 flex flex-col gap-3">
              <AddressFields />
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

function AddressFields({ address }: { address?: Customer["addresses"][number] }) {
  return <>
    <div className="grid grid-cols-2 gap-3">
      <select name="type" aria-label="Kind of address" className={inputClass} defaultValue={address?.type ?? "BILLING"}>{ADDRESS_TYPES.map((type) => <option key={type} value={type}>{type.charAt(0) + type.slice(1).toLowerCase()}</option>)}</select>
      <input name="label" placeholder="Name for this address (optional)" defaultValue={address?.label ?? ""} className={inputClass} />
    </div>
    <input name="line1" placeholder="Address line 1" required defaultValue={address?.line1 ?? ""} className={inputClass} />
    <input name="line2" placeholder="Address line 2" defaultValue={address?.line2 ?? ""} className={inputClass} />
    <div className="grid grid-cols-2 gap-3">
      <input name="city" placeholder="Town or city" defaultValue={address?.city ?? ""} className={inputClass} />
      <input name="region" placeholder="County or region" defaultValue={address?.region ?? ""} className={inputClass} />
      <input name="postcode" placeholder="Postcode" defaultValue={address?.postcode ?? ""} className={inputClass} />
      <input name="country" placeholder="Country" defaultValue={address?.country ?? ""} className={inputClass} />
    </div>
    <input name="telephone" placeholder="Site telephone (optional)" defaultValue={address?.telephone ?? ""} className={inputClass} />
    <input name="deliveryInstructions" placeholder="Delivery instructions (optional)" defaultValue={address?.deliveryInstructions ?? ""} className={inputClass} />
    <div className="flex gap-4">
      <label className="flex items-center gap-1.5 text-sm text-[var(--color-ink-muted)]"><input type="checkbox" name="isDefaultBilling" defaultChecked={address?.isDefaultBilling} /> Default billing</label>
      <label className="flex items-center gap-1.5 text-sm text-[var(--color-ink-muted)]"><input type="checkbox" name="isDefaultDelivery" defaultChecked={address?.isDefaultDelivery} /> Default delivery</label>
    </div>
  </>;
}
