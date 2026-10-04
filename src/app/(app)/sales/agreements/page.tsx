import Link from "next/link";
import { requireSession } from "@/core/auth/session";
import { assertCapability, can } from "@/core/permissions/check";
import { db } from "@/core/db/client";
import { formatMoney } from "@/core/shared/money";
import { commitmentView } from "@/modules/sales/services/call-off-balance";

export default async function AgreementsPage() {
  const session = await requireSession();
  assertCapability(session, "sales.order.read");
  const agreements = await db.salesAgreement.findMany({
    where: { organisationId: session.organisationId },
    include: { party: true, lines: true, callOffs: { where: { commercialStatus: { not: "CANCELLED" } }, include: { lines: true } } },
    orderBy: { updatedAt: "desc" },
  });
  return <div className="space-y-5">
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">Call-off orders</h2>
        <p className="mt-2 max-w-2xl text-sm text-slate-500">Add one big order. Deliver and invoice some of the items whenever the customer wants them. The rest stays open.</p>
      </div>
      {can(session, "sales.order.create") && <Link href="/sales/agreements/new" className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-medium text-white">New call-off order</Link>}
    </div>
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
      {agreements.map((agreement) => {
        const open = commitmentView(agreement.lines, agreement.callOffs);
        const remaining = agreement.lines.reduce((sum, line) => sum + (open.get(line.id)?.remaining ?? line.committedQuantity), 0);
        const committed = agreement.lines.reduce((sum, line) => sum + line.committedQuantity, 0);
        return <Link key={agreement.id} href={`/sales/agreements/${agreement.id}`} className="grid gap-2 border-b border-slate-100 px-5 py-4 last:border-0 sm:grid-cols-[1.2fr_1fr_auto] sm:items-center">
          <span><span className="font-medium">{agreement.reference}</span><span className="mt-1 block text-sm text-slate-500">{agreement.party.name}</span></span>
          <span className="text-sm text-slate-500">{agreement.status} · until {agreement.endsAt.toLocaleDateString("en-GB")} · {formatMoney(agreement.lines.reduce((sum, line) => sum + line.unitPriceAmount * line.committedQuantity, 0), agreement.currency)}</span>
          <span className="text-sm">{remaining} of {committed} still open</span>
        </Link>;
      })}
      {!agreements.length && <p className="p-6 text-sm text-slate-500">No call-off orders yet. Add the full order here, then deliver and invoice it in parts.</p>}
    </div>
  </div>;
}
