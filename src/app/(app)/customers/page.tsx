import Link from "next/link";
import { Building2, Users, ShieldCheck, UserRound, Network } from "lucide-react";
import { WorkspaceHeading, WorkspaceStats } from "@/components/ui/workspace";
import { requireSession } from "@/core/auth/session";
import { assertCapability, can } from "@/core/permissions/check";
import { CUSTOMER_CAPABILITIES } from "@/core/permissions/capabilities";
import { listCustomers, type CustomerListFilter } from "@/core/customers/queries";
import { CustomerCsvTools } from "@/core/customers/csv-import-export";
import { db } from "@/core/db/client";
import { DataTable } from "@/components/ui/table";
import { StatusPill, type StatusTone } from "@/components/ui/status-pill";
import { Button } from "@/components/ui/button";
import { formatMoney } from "@/core/shared/money";
import type { CustomerStatus } from "@/generated/prisma/client";

const STATUS_TONE: Record<CustomerStatus, StatusTone> = {
  PROSPECT: "neutral",
  ACTIVE: "success",
  ON_HOLD: "warning",
  INACTIVE: "neutral",
  CLOSED: "neutral",
};

const FILTERS: { key: CustomerListFilter | "all"; label: string }[] = [
  { key: "all", label: "All" },
  { key: "active", label: "Active" },
  { key: "prospects", label: "Prospects" },
  { key: "on_hold", label: "On hold" },
  { key: "my_customers", label: "My customers" },
  { key: "archived", label: "Archived" },
];

export default async function CustomersPage({ searchParams }: { searchParams: Promise<{ filter?: string; q?: string }> }) {
  const session = await requireSession();
  assertCapability(session, CUSTOMER_CAPABILITIES.read);

  const params = await searchParams;
  const requestedFilter = params.filter;
  const filter: CustomerListFilter | undefined =
    requestedFilter && FILTERS.some((item) => item.key === requestedFilter && item.key !== "all")
      ? (requestedFilter as CustomerListFilter)
      : undefined;

  const salesSince = new Date(); salesSince.setFullYear(salesSince.getFullYear() - 1);
  const salesRead = can(session, "sales.order.read");
  const creditRead = can(session, CUSTOMER_CAPABILITIES.creditRead);
  const [customers, accountManagers] = await Promise.all([
    listCustomers(session.organisationId, { search: params.q, filter, accountManagerUserId: session.userId, salesSince, salesRead }),
    db.user.findMany({ where: { memberships: { some: { organisationId: session.organisationId } } }, select: { id: true, name: true } }),
  ]);

  const managerNameById = new Map(accountManagers.map((user) => [user.id, user.name]));

  const rows = customers.map((customer) => ({
    id: customer.id,
    name: customer.name,
    customerCode: customer.customerCode,
    status: customer.status,
    location: customer.addresses[0] ? [customer.addresses[0].city, customer.addresses[0].country].filter(Boolean).join(", ") : "—",
    accountManager: customer.accountManagerUserId ? (managerNameById.get(customer.accountManagerUserId) ?? "—") : "—",
    sales12m: Object.entries(customer.salesOrders.reduce<Record<string, number>>((sum, order) => { sum[order.currency] = (sum[order.currency] ?? 0) + order.grossAmount; return sum; }, {})).map(([currency, amount]) => formatMoney(amount, currency)).join(" · ") || "—",
    onHold: customer.creditProfile?.onHold ?? false,
  }));

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6">
      <WorkspaceHeading eyebrow="Customer workspace" title={filter === "archived" ? "Archived accounts" : "Know your customers"} description="One place for every account, its people, relationships and shared history. Open a customer to see its details and the next steps." actions={<>{can(session, CUSTOMER_CAPABILITIES.create) && <Link href="/customers/new"><Button variant="primary">Add customer</Button></Link>}<CustomerCsvTools /></>} />
      <WorkspaceStats items={[
        { label: "Matching accounts", value: rows.length, hint: "In the current view", icon: Building2 },
        { label: "Active", value: rows.filter(row => row.status === "ACTIVE").length, hint: "Ready to do business", icon: ShieldCheck },
        { label: "Prospects", value: rows.filter(row => row.status === "PROSPECT").length, hint: "Relationships to develop", icon: Users },
        { label: "Managed by you", value: customers.filter(row => row.accountManagerUserId === session.userId).length, hint: "Your account portfolio", icon: UserRound },
      ]} />
      <form className="flex flex-wrap items-center gap-3 rounded-2xl border border-slate-200 bg-white p-3">
        <input
          aria-label="Search customers"
          type="search"
          name="q"
          defaultValue={params.q}
          placeholder="Search by name, code, registration number..."
          className="min-w-48 flex-1 rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-[var(--color-atlas-blue)]"
        />
        {filter && <input type="hidden" name="filter" value={filter} />}<button className="rounded-xl bg-blue-600 px-4 py-3 text-xs font-medium text-white">Search</button>
      </form>

      <div className="flex items-center gap-1 overflow-x-auto">
        {FILTERS.map((item) => (
          <Link
            key={item.key}
            href={`/customers?${new URLSearchParams({ ...(item.key !== "all" ? { filter: item.key } : {}), ...(params.q ? { q: params.q } : {}) })}`}
            className={`shrink-0 rounded-full px-3 py-1.5 text-sm ${
              (filter ?? "all") === item.key
                ? "bg-[var(--color-atlas-blue-soft)] text-[var(--color-atlas-blue)]"
                : "text-[var(--color-ink-muted)] hover:bg-[var(--color-surface-sunken)]"
            }`}
          >
            {item.label}
          </Link>
        ))}
      </div>

      <DataTable<(typeof rows)[number]>
        rows={rows}
        getHref={(row) => `/customers/${row.id}`}
        emptyLabel={params.q ? "No customers match this search." : "No customers in this view yet."}
        columns={[
          {
            header: "Customer",
            render: (row) => (
              <span className="flex items-center gap-3"><span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-sm font-semibold text-blue-700">{row.name.slice(0, 2).toUpperCase()}</span><span className="flex flex-col"><span className="font-semibold text-slate-800">{row.name}</span><span className="text-xs text-slate-400">{row.customerCode}</span></span></span>
            ),
          },
          { header: "Location", render: (row) => row.location },
          { header: "Account manager", render: (row) => row.accountManager },
          ...(salesRead ? [{ header: "12m order value", render: (row: (typeof rows)[number]) => row.sales12m, align: "right" as const }] : []),
          ...(creditRead ? [{
            header: "Credit status",
            render: (row: (typeof rows)[number]) => (row.onHold ? <StatusPill label="On hold" tone="danger" /> : <StatusPill label="OK" tone="success" />),
          }] : []),
          { header: "Status", render: (row) => <StatusPill label={row.status.replace("_", " ")} tone={STATUS_TONE[row.status]} /> },
        ]}
      />
      <Link href="/customers/map" className="inline-flex items-center gap-2 text-sm font-medium text-blue-600"><Network size={16} />Explore a customer hierarchy</Link>
    </div>
  );
}
