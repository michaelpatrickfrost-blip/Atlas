import { ActionForm } from "@/components/ui/action-form";
import Link from "next/link";
import { requireSession } from "@/core/auth/session";
import { assertCapability, can } from "@/core/permissions/check";
import { LOGISTICS_CAPABILITIES as C } from "@/core/permissions/capabilities";
import { RETURN_REASONS } from "@/modules/logistics/domain/operations";
import { returnsBoard } from "@/modules/logistics/services/queries";
import { returnRequestAction } from "../actions";

export default async function ReturnsPage() {
  const session = await requireSession();
  assertCapability(session, C.returnRead);
  const rows = await returnsBoard(session.organisationId);
  return (
    <div className="space-y-8">
      <header><h1 className="text-3xl font-semibold tracking-tight">Returns</h1><p className="mt-2 text-sm text-[var(--color-ink-muted)]">Authorise, receive, inspect, then decide. Returned goods are not automatically saleable.</p></header>
      <div className="space-y-2">{rows.map((row) => <Link key={row.id} href={`/logistics/returns/${row.id}`} className="flex justify-between rounded-2xl border border-[var(--color-border)] bg-white px-5 py-4 text-sm"><span className="font-medium">{row.reference} · {row.party.name}</span><span>{row.status.replaceAll("_", " ")} · {row.reason}</span></Link>)}{rows.length === 0 && <p className="text-sm text-[var(--color-ink-muted)]">No open returns.</p>}</div>
      {can(session, C.returnAuthorise) && <ActionForm action={returnRequestAction} className="grid gap-2 rounded-3xl border border-[var(--color-border)] bg-white p-5 sm:grid-cols-2"><input name="partyId" required placeholder="Customer id" className="rounded-xl border px-3 py-2 text-sm" /><input name="salesOrderId" placeholder="Sales order id" className="rounded-xl border px-3 py-2 text-sm" /><select name="reason" className="rounded-xl border px-3 py-2 text-sm">{RETURN_REASONS.map((reason) => <option key={reason}>{reason}</option>)}</select><input name="description" placeholder="Product" className="rounded-xl border px-3 py-2 text-sm" /><input name="quantity" type="number" min={1} defaultValue={1} className="rounded-xl border px-3 py-2 text-sm" /><button className="rounded-full bg-[var(--color-atlas-blue)] px-4 py-2 text-sm font-semibold text-white" type="submit">Start return</button></ActionForm>}
    </div>
  );
}
