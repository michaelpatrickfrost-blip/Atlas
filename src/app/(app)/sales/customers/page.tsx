import { requireSession } from "@/core/auth/session";
import { assertCapability } from "@/core/permissions/check";
import { SALES_CAPABILITIES } from "@/core/permissions/capabilities";
import { listCustomers } from "@/modules/sales/services/queries";
import { DataTable } from "@/components/ui/table";
import { StatusPill } from "@/components/ui/status-pill";

export default async function CustomersPage() {
  const session = await requireSession();
  assertCapability(session, SALES_CAPABILITIES.customerRead);

  const customers = await listCustomers(session.organisationId);

  return (
    <DataTable<(typeof customers)[number]>
      rows={customers}
      getHref={(row) => `/sales/customers/${row.id}`}
      emptyLabel="No customers yet."
      columns={[
        { header: "Name", render: (row) => row.name },
        { header: "Type", render: (row) => <StatusPill label={row.kind === "COMPANY" ? "Company" : "Person"} tone="neutral" /> },
        { header: "Added", render: (row) => row.createdAt.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) },
      ]}
    />
  );
}
