import { requireSession } from "@/core/auth/session";
import { assertCapability } from "@/core/permissions/check";
import { SALES_CAPABILITIES } from "@/core/permissions/capabilities";
import { listSalesOrders } from "@/modules/sales/services/queries";
import { DataTable } from "@/components/ui/table";
import { StatusPill, type StatusTone } from "@/components/ui/status-pill";
import { formatMoney } from "@/core/shared/money";
import Link from "next/link";
import type { SalesOrderStatus } from "@/generated/prisma/client";

const STATUS_TONE: Record<SalesOrderStatus, StatusTone> = {
  CONFIRMED: "neutral",
  FULFILLED: "success",
  CANCELLED: "danger",
};

export default async function OrdersPage() {
  const session = await requireSession();
  assertCapability(session, SALES_CAPABILITIES.orderRead);

  const orders = await listSalesOrders(session.organisationId);

  return (
    <DataTable<(typeof orders)[number]>
      rows={orders}
      emptyLabel="No orders yet."
      columns={[
        { header: "Reference", render: (row) => row.reference },
        {
          header: "Customer",
          render: (row) => (
            <Link href={`/customers/${row.partyId}`} className="text-[var(--color-atlas-blue)] hover:underline">
              {row.party.name}
            </Link>
          ),
        },
        { header: "Status", render: (row) => <StatusPill label={row.status} tone={STATUS_TONE[row.status]} /> },
        { header: "Total", render: (row) => formatMoney(row.totalAmount, row.totalCurrency), align: "right" },
      ]}
    />
  );
}
