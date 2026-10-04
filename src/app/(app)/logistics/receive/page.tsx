import { ActionForm } from "@/components/ui/action-form";
import Link from "next/link";
import { requireSession } from "@/core/auth/session";
import { assertCapability } from "@/core/permissions/check";
import { LOGISTICS_CAPABILITIES as C } from "@/core/permissions/capabilities";
import { receiveBoard } from "@/modules/logistics/services/queries";
import { db } from "@/core/db/client";
import { expectAction } from "../actions";

export default async function ReceivePage() {
  const session = await requireSession();
  assertCapability(session, C.receiptExecute);
  const [rows, warehouses] = await Promise.all([receiveBoard(session.organisationId), db.warehouse.findMany({ where: { organisationId: session.organisationId }, orderBy: { name: "asc" } })]);
  const today = rows.filter((row) => row.expectedOn && row.expectedOn.toDateString() === new Date().toDateString());
  return (
    <div className="space-y-8">
      <header><h1 className="text-3xl font-semibold tracking-tight">Receive</h1><p className="mt-2 text-sm text-[var(--color-ink-muted)]">Expected goods from purchasing, transfers and returns. Staff do not retype the purchase order.</p></header>
      <div className="space-y-2">
        {(today.length ? today : rows).map((row) => (
          <Link key={row.id} href={`/logistics/receive/${row.id}`} className="flex items-center justify-between rounded-2xl border border-[var(--color-border)] bg-white px-5 py-4">
            <span><span className="font-medium">{row.reference}</span> <span className="text-[var(--color-ink-muted)]">{row.partyName || row.sourceReference}</span></span>
            <span className="text-sm text-[var(--color-ink-muted)]">{row.lines.length} lines · {row.status}</span>
          </Link>
        ))}
        {rows.length === 0 && <p className="rounded-3xl border border-dashed border-[var(--color-border)] px-5 py-8 text-sm text-[var(--color-ink-muted)]">Nothing is expected. Record an authorised receipt when goods arrive without a purchase order.</p>}
      </div>
      <ActionForm action={expectAction} className="grid gap-3 rounded-3xl border border-[var(--color-border)] bg-white p-5 sm:grid-cols-2">
        <select name="sourceType" className="rounded-xl border px-3 py-2 text-sm"><option value="PURCHASE">Purchase</option><option value="TRANSFER">Transfer</option><option value="RETURN">Return</option><option value="MANUAL">Manual</option></select>
        <input name="sourceReference" required placeholder="PO or transfer reference" className="rounded-xl border px-3 py-2 text-sm" />
        <input name="partyName" placeholder="Supplier" className="rounded-xl border px-3 py-2 text-sm" />
        <select name="warehouseId" className="rounded-xl border px-3 py-2 text-sm">{warehouses.map((warehouse) => <option key={warehouse.id} value={warehouse.id}>{warehouse.name}</option>)}</select>
        <input name="description" required placeholder="Product" className="rounded-xl border px-3 py-2 text-sm" />
        <input name="quantity" type="number" min={1} required placeholder="Quantity" className="rounded-xl border px-3 py-2 text-sm" />
        <button className="rounded-full bg-[var(--color-atlas-blue)] px-4 py-2 text-sm font-semibold text-white sm:col-span-2" type="submit">Expect receipt</button>
      </ActionForm>
    </div>
  );
}
