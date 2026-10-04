import Link from "next/link";
import { db } from "@/core/db/client";
import { ActionForm } from "@/components/ui/action-form";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { can } from "@/core/permissions/check";
import { CUSTOMER_CAPABILITIES } from "@/core/permissions/capabilities";
import type { Session } from "@/core/auth/session";
import type { getCustomer } from "@/core/customers/queries";
import { attachCustomerInvoiceTemplate, detachCustomerInvoiceTemplate } from "@/modules/sales/services/invoice-template-actions";

type Customer = NonNullable<Awaited<ReturnType<typeof getCustomer>>>;
const input = "mt-2 w-full rounded-xl border border-[var(--color-border)] bg-white p-3 text-sm";

export async function CustomerInvoiceTemplates({ customer, session }: { customer: Customer; session: Session }) {
  const [templates, attached] = await Promise.all([
    db.invoiceDocumentTemplate.findMany({ where: { organisationId: session.organisationId, active: true }, orderBy: { name: "asc" } }),
    db.customerInvoiceTemplate.findMany({ where: { organisationId: session.organisationId, partyId: customer.id }, include: { template: true }, orderBy: { createdAt: "asc" } }),
  ]);
  const manage = can(session, CUSTOMER_CAPABILITIES.commercialManage);
  const addresses = customer.addresses.filter((address) => address.active);
  const label = (id: string | null) => addresses.find((address) => address.id === id);
  const addressText = (id: string | null) => {
    const address = label(id);
    return address ? [address.label, address.line1, address.city, address.postcode, address.country].filter(Boolean).join(", ") : "Not chosen";
  };
  return <section>
    <div className="mb-3 flex items-center justify-between gap-3"><h2 className="text-sm font-medium text-[var(--color-ink-muted)]">Invoice templates</h2><Link href="/sales/templates" className="text-sm text-[var(--color-atlas-blue)]">Template menu</Link></div>
    <p className="mb-4 text-xs text-[var(--color-ink-muted)]">Attach the paperwork this account expects. The address, and for exports the weight, volume and customs details, follow the template onto the sale. An export sale raises a proforma. That is not a tax invoice.</p>
    <div className="flex flex-col gap-3">{attached.map((row) => <Card key={row.id} className="p-4 text-sm"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="font-medium">{row.template.name}</p><p className="mt-1 text-xs text-[var(--color-ink-muted)]">{row.template.kind === "EXPORT" ? "Export proforma" : "Domestic invoice"}{row.isDefault ? " · Default for new sales" : ""}</p></div>{manage && <ActionForm action={detachCustomerInvoiceTemplate}><input type="hidden" name="partyId" value={customer.id} /><input type="hidden" name="id" value={row.id} /><Button type="submit" variant="ghost">Remove</Button></ActionForm>}</div><dl className="mt-4 grid gap-3 text-xs sm:grid-cols-2"><div><dt className="text-[var(--color-ink-muted)]">Invoice address</dt><dd>{addressText(row.invoiceAddressId)}</dd></div><div><dt className="text-[var(--color-ink-muted)]">Consignee</dt><dd>{addressText(row.deliveryAddressId)}</dd></div>{row.notifyAddressId && <div><dt className="text-[var(--color-ink-muted)]">Notify party</dt><dd>{addressText(row.notifyAddressId)}</dd></div>}{(row.buyerEori || row.buyerVat) && <div><dt className="text-[var(--color-ink-muted)]">Buyer identity</dt><dd>{[row.buyerEori && `EORI ${row.buyerEori}`, row.buyerVat && `VAT ${row.buyerVat}`].filter(Boolean).join(" · ")}</dd></div>}</dl></Card>)}{!attached.length && <Card className="p-4 text-sm text-[var(--color-ink-muted)]">No invoice template is attached to this account yet.</Card>}</div>
    {manage && <details className="mt-3 rounded-[var(--radius-atlas-md)] border border-dashed border-[var(--color-border)] p-4"><summary className="cursor-pointer text-sm font-medium text-[var(--color-atlas-blue)]">Attach a template</summary>{templates.length === 0 ? <p className="mt-4 text-sm text-[var(--color-ink-muted)]">Create a domestic invoice or an export proforma in the template menu first.</p> : <ActionForm action={attachCustomerInvoiceTemplate} className="mt-4 grid gap-4 sm:grid-cols-2"><input type="hidden" name="partyId" value={customer.id} /><label className="text-xs sm:col-span-2">Template<select name="templateId" required className={input}>{templates.map((template) => <option key={template.id} value={template.id}>{template.name} · {template.kind === "EXPORT" ? "Export proforma" : "Domestic invoice"}</option>)}</select></label><label className="text-xs">Invoice address<select name="invoiceAddressId" className={input}><option value="">Choose later on the sale</option>{addresses.map((address) => <option key={address.id} value={address.id}>{address.label ?? address.type} · {address.line1}</option>)}</select></label><label className="text-xs">Delivery / consignee<select name="deliveryAddressId" className={input}><option value="">Choose later on the sale</option>{addresses.map((address) => <option key={address.id} value={address.id}>{address.label ?? address.type} · {address.line1}</option>)}</select></label><label className="text-xs">Notify party<select name="notifyAddressId" className={input}><option value="">None</option>{addresses.map((address) => <option key={address.id} value={address.id}>{address.label ?? address.type} · {address.line1}</option>)}</select></label><label className="text-xs">Buyer EORI<input name="buyerEori" className={input} /></label><label className="text-xs">Buyer VAT<input name="buyerVat" className={input} /></label><label className="text-xs sm:col-span-2">Shipping marks<textarea name="marks" className={`${input} min-h-16`} /></label><label className="flex items-center gap-2 text-sm sm:col-span-2"><input type="checkbox" name="isDefault" defaultChecked={!attached.some((row) => row.isDefault)} />Use this template on new sales</label><Button type="submit" variant="primary" className="justify-self-start">Attach to this account</Button></ActionForm>}</details>}
  </section>;
}
