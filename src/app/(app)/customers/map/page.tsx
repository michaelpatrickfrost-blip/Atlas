import Link from "next/link";
import { Network } from "lucide-react";
import { requireSession } from "@/core/auth/session";
import { can, assertCapability } from "@/core/permissions/check";
import { CUSTOMER_CAPABILITIES } from "@/core/permissions/capabilities";
import { db } from "@/core/db/client";
import { loadCustomerMap } from "@/core/customers/map-data";
import { AccountMap } from "@/components/customers/account-map";
import { WorkspaceHeading } from "@/components/ui/workspace";

export default async function MapPage({ searchParams }: { searchParams: Promise<{ account?: string; q?: string }> }) {
  const session = await requireSession();
  assertCapability(session, CUSTOMER_CAPABILITIES.read);
  const { account, q } = await searchParams;
  const selected = account ? await db.party.findFirst({ where: { id: account, organisationId: session.organisationId, identityScrubbed: false }, select: { id: true, name: true } }) : null;
  const includeInvoices = can(session, "customers.commercial.read") || can(session, "sales.order.read") || can(session, "sales.quote.read");
  const map = selected ? await loadCustomerMap(session.organisationId, includeInvoices, selected.id) : null;
  const choices = !selected ? await db.party.findMany({ where: { organisationId: session.organisationId, identityScrubbed: false, archived: false, ...(q ? { OR: [{ name: { contains: q.slice(0, 200), mode: "insensitive" } }, { customerCode: { contains: q.slice(0, 200), mode: "insensitive" } }] } : {}) }, select: { id: true, name: true, customerCode: true, hierarchyRole: true }, orderBy: { name: "asc" }, take: 50 }) : [];
  return <div className="min-w-0 space-y-5"><WorkspaceHeading eyebrow="Relationships" title={selected ? `${selected.name} · hierarchy` : "Choose a customer"} description="Explore one customer’s group, branches and people. Select an account to see its relationships and organise the hierarchy." actions={selected && <Link href={`/customers/${selected.id}`} className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-blue-700">Open customer</Link>} />{map && selected ? <><AccountMap accounts={map.accounts} choices={map.choices} people={map.people} focusId={selected.id} canEdit={can(session, CUSTOMER_CAPABILITIES.edit)} canCreate={can(session, CUSTOMER_CAPABILITIES.create)} canInvoice={can(session, "customers.commercial.manage")} canPeople={can(session, CUSTOMER_CAPABILITIES.contactsManage)} />{map.truncated && <p className="text-xs text-slate-500">Showing the first 500 accounts in this customer’s group.</p>}</> : <section className="rounded-2xl border border-slate-200 bg-white p-5"><form className="mb-5 flex flex-wrap gap-3"><input name="q" aria-label="Find a customer for the hierarchy" type="search" defaultValue={q} placeholder="Search customer name or code" className="min-w-0 flex-1 rounded-xl border border-slate-200 px-4 py-3 text-sm" /><button className="rounded-xl bg-blue-600 px-4 py-3 text-sm font-medium text-white">Find customer</button></form><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{choices.map(customer => <Link key={customer.id} href={`/customers/map?account=${customer.id}`} className="flex items-center gap-3 rounded-xl border border-slate-100 p-4 hover:border-blue-300 hover:bg-blue-50"><Network size={20} className="shrink-0 text-blue-600" /><span className="min-w-0"><span className="block truncate text-sm font-semibold">{customer.name}</span><span className="text-xs text-slate-400">{customer.customerCode}</span></span></Link>)}</div>{!choices.length && <p className="py-8 text-center text-sm text-slate-500">No customers match this search.</p>}{choices.length === 50 && <p className="mt-4 text-xs text-slate-400">Showing 50 customers. Search to narrow the list.</p>}</section>}</div>;
}
