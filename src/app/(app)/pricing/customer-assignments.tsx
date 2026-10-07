"use client";
import Link from "next/link";
import { useState } from "react";
import { ActionForm } from "@/components/ui/action-form";
import { Button } from "@/components/ui/button";
import { assignPriceList, assignPriceListCustomers } from "./actions";
import type { PricingCustomer } from "./customer-picker";
export function CustomerAssignments({ listId, assigned, customers, manage }: { listId: string; assigned: PricingCustomer[]; customers: (PricingCustomer & { currentList: string | null })[]; manage: boolean }) {
  const [query, setQuery] = useState("");
  const [selection, setSelection] = useState<string[]>([]);
  const [adding, setAdding] = useState(false);
  const matches = (customer: PricingCustomer) => `${customer.customerCode} ${customer.name}`.toLowerCase().includes(query.toLowerCase().trim());
  const shown = assigned.filter(matches);
  const candidates = customers.filter(c => !assigned.some(a => a.id === c.id) && matches(c));
  return <section className="space-y-4">
    <div className="flex flex-wrap items-end justify-between gap-3"><div><h3 className="font-semibold">Customer assignments</h3><p className="mt-1 max-w-2xl text-sm text-[var(--color-ink-muted)]">New sales use this list. An active CRM agreement can override it. Branches without their own pricing inherit their parent account.</p></div>{manage && <Button type="button" variant="secondary" onClick={() => { setAdding(!adding); setSelection([]); }}>{adding ? "Close assignment" : "Assign customers"}</Button>}</div>
    <label className="block max-w-md text-xs text-[var(--color-ink-muted)]">Search customers<input value={query} onChange={e => setQuery(e.target.value)} placeholder="Customer name or account code" className="mt-1 w-full rounded-xl border border-[var(--color-border)] bg-white px-3 py-2.5 text-sm" /></label>
    {adding && <ActionForm action={assignPriceListCustomers.bind(null, listId)} className="space-y-3 rounded-xl border border-blue-200 bg-blue-50/30 p-4">
      {selection.map(id => <input key={id} type="hidden" name="partyIds" value={id} />)}
      <p className="text-sm font-medium">Select customers to use this list</p><div className="max-h-72 divide-y divide-[var(--color-border)] overflow-y-auto">{candidates.map(c => <label key={c.id} className="flex cursor-pointer items-center gap-3 py-2.5 text-sm"><input type="checkbox" checked={selection.includes(c.id)} onChange={e => setSelection(e.target.checked ? [...selection, c.id] : selection.filter(id => id !== c.id))} /><span className="flex-1">{c.customerCode} · {c.name}</span><span className="text-xs text-[var(--color-ink-muted)]">{c.currentList ? `Replaces ${c.currentList}` : "Catalogue / inherited pricing"}</span></label>)}{!candidates.length && <p className="py-4 text-sm text-[var(--color-ink-muted)]">No unassigned customers match.</p>}</div>
      <p className="text-xs text-[var(--color-ink-muted)]">Assigning replaces the customer’s usual list. Active agreements keep their own prices.</p><Button type="submit" variant="primary" disabled={!selection.length}>Assign {selection.length || "selected"} customers</Button>
    </ActionForm>}
    <div className="overflow-x-auto rounded-xl border border-[var(--color-border)] bg-white"><table className="w-full text-sm"><thead className="bg-[var(--color-surface-sunken)] text-left text-xs text-[var(--color-ink-muted)]"><tr><th className="px-4 py-3 font-medium">Account</th><th className="px-4 py-3 font-medium">Customer</th>{manage && <th className="px-4 py-3"><span className="sr-only">Actions</span></th>}</tr></thead><tbody>{shown.map(c => <tr key={c.id} className="border-t border-[var(--color-border)]"><td className="px-4 py-3">{c.customerCode}</td><td className="px-4 py-3"><Link href={`/customers/${c.id}?tab=commercial`} className="text-blue-600">{c.name}</Link></td>{manage && <td className="px-4 py-3 text-right"><ActionForm action={assignPriceList.bind(null, listId)}><input type="hidden" name="partyId" value={c.id} /><input type="hidden" name="remove" value="yes" /><button type="submit" className="text-xs text-[var(--color-ink-muted)]">Remove assignment</button></ActionForm></td>}</tr>)}</tbody></table>{!shown.length && <p className="px-4 py-8 text-sm text-[var(--color-ink-muted)]">{assigned.length ? "No customers match this search." : "No direct assignments yet. Agreements and inherited assignments are managed on the customer record."}</p>}</div>
  </section>;
}
