import { db } from "@/core/db/client";
import { ActionForm } from "@/components/ui/action-form";
import { Button } from "@/components/ui/button";
import { CreateDialog } from "@/components/ui/create-dialog";
import { updateCustomerDetails } from "@/core/customers/commands";
import type { getCustomer } from "@/core/customers/queries";

type Customer = NonNullable<Awaited<ReturnType<typeof getCustomer>>>;
const field = "mt-1.5 block w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm";

/** Edit the customer's own details. The customer code never changes. */
export async function EditCustomerDetails({ customer }: { customer: Customer }) {
  const members = await db.membership.findMany({ where: { organisationId: customer.organisationId }, select: { userId: true, user: { select: { name: true } } }, orderBy: { user: { name: "asc" } } });
  const input = (name: string, label: string, value: string | null, extra: Record<string, string | number | boolean> = {}) => <label className="block text-xs font-medium">{label}<input name={name} defaultValue={value ?? ""} className={field} {...extra} /></label>;
  return <CreateDialog label="Edit details" title={`Edit ${customer.name}`} variant="secondary"><ActionForm action={updateCustomerDetails.bind(null, customer.id)}><div className="space-y-4">
    <div className="grid gap-4 sm:grid-cols-2">
      {input("name", "Legal name", customer.name, { required: true, maxLength: 200 })}
      {input("tradingName", "Trading name", customer.tradingName, { maxLength: 200 })}
      <label className="block text-xs font-medium">Kind<select name="kind" defaultValue={customer.kind} className={field}><option value="COMPANY">Company</option><option value="PERSON">Person</option></select></label>
      <label className="block text-xs font-medium">Account manager<select name="accountManagerUserId" defaultValue={customer.accountManagerUserId ?? ""} className={field}><option value="">Not assigned</option>{members.map((member) => <option key={member.userId} value={member.userId}>{member.user.name}</option>)}</select></label>
      {input("customerGroup", "Customer type", customer.customerGroup, { maxLength: 100 })}
      {input("industry", "Industry", customer.industry, { maxLength: 100 })}
      {input("registrationNumber", "Company number", customer.registrationNumber, { maxLength: 60 })}
      {input("countryOfRegistration", "Country of registration", customer.countryOfRegistration, { maxLength: 60 })}
      {input("website", "Website", customer.website, { maxLength: 300, placeholder: "https://" })}
      {input("territory", "Territory", customer.territory, { maxLength: 100 })}
      {input("preferredCurrency", "Currency", customer.preferredCurrency, { maxLength: 3, required: true })}
      {input("preferredLanguage", "Language", customer.preferredLanguage, { maxLength: 40 })}
      <label className="block text-xs font-medium">Customer since<input name="relationshipStartDate" type="date" defaultValue={customer.relationshipStartDate?.toISOString().slice(0, 10) ?? ""} className={field} /></label>
    </div>
    <p className="text-xs text-slate-500">Customer code {customer.customerCode} stays the same. Status, credit and tax are on their own tabs.</p>
    <Button type="submit" variant="primary">Save details</Button>
  </div></ActionForm></CreateDialog>;
}
