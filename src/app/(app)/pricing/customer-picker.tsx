"use client";
import { useId, useState } from "react";
export type PricingCustomer = { id: string; name: string; customerCode: string };
export function CustomerPicker({ customers, defaultId = "", required = true, label = "Customer" }: { customers: PricingCustomer[]; defaultId?: string; required?: boolean; label?: string }) {
  const id = useId();
  const initial = customers.find(c => c.id === defaultId);
  const [value, setValue] = useState(initial ? `${initial.customerCode} · ${initial.name}` : "");
  const selected = customers.find(c => `${c.customerCode} · ${c.name}` === value);
  return <label className="block text-sm">{label}<input type="hidden" name="partyId" value={selected?.id ?? ""} /><input list={id} required={required} value={value} onChange={e => { setValue(e.target.value); e.currentTarget.setCustomValidity(""); }} onBlur={e => e.currentTarget.setCustomValidity(value && !selected ? "Select a customer from the search results." : "")} placeholder="Search customer name or account code" className="mt-2 block w-full rounded-xl border border-[var(--color-border)] bg-white px-3 py-2.5 text-sm" /><datalist id={id}>{customers.map(c => <option key={c.id} value={`${c.customerCode} · ${c.name}`} />)}</datalist></label>;
}
