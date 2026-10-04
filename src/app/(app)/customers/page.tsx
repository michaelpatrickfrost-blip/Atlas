import Link from "next/link";
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
];

export default async function CustomersPage({ searchParams }: { searchParams: Promise<{ filter?: string; q?: string }> }) {
  const session = await requireSession();
  assertCapability(session, CUSTOMER_CAPABILITIES.read);

  const params = await searchParams;
  const filter = (params.filter as CustomerListFilter | undefined) ?? undefined;

  const [customers, accountManagers] = await Promise.all([
    listCustomers(session.organisationId, { search: params.q, filter, accountManagerUserId: session.userId }),
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
    sales12m: customer.salesOrders.reduce((sum, order) => sum + order.grossAmount, 0),
    onHold: customer.creditProfile?.onHold ?? false,
  }));

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
<h1 className="text-2xl font-semibold tracking-tight text-[var(--color-ink)]">Customers</h1>
        <div className="flex gap-2">
          {can(session, CUSTOMER_CAPABILITIES.create) && (
            <Link href="/customers/new">
              <Button variant="primary">Add customer</Button>
            </Link>
          )}
          <CustomerCsvTools />
        </div>
      </div>

      <form className="flex flex-wrap items-center gap-3 rounded-2xl border border-slate-200 bg-white p-3">
        <input
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
            href={item.key === "all" ? "/customers" : `/customers?filter=${item.key}`}
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
        emptyLabel="No customers yet."
        columns={[
          {
            header: "Customer",
            render: (row) => (
              <span className="flex flex-col">
                <span className="font-medium text-[var(--color-ink)]">{row.name}</span>
                <span className="text-xs text-[var(--color-ink-faint)]">{row.customerCode}</span>
              </span>
            ),
          },
          { header: "Location", render: (row) => row.location },
          { header: "Account manager", render: (row) => row.accountManager },
          { header: "12m sales", render: (row) => formatMoney(row.sales12m, "GBP"), align: "right" },
          {
            header: "Credit status",
            render: (row) => (row.onHold ? <StatusPill label="On hold" tone="danger" /> : <StatusPill label="OK" tone="success" />),
          },
          { header: "Status", render: (row) => <StatusPill label={row.status.replace("_", " ")} tone={STATUS_TONE[row.status]} /> },
        ]}
      />
    </div>
  );
}
