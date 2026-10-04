import { ActionForm } from "@/components/ui/action-form";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireSession } from "@/core/auth/session";
import { assertCapability, can } from "@/core/permissions/check";
import { LOGISTICS_CAPABILITIES as C } from "@/core/permissions/capabilities";
import { DISPOSITIONS } from "@/modules/logistics/domain/operations";
import { returnDetail } from "@/modules/logistics/services/queries";
import { authoriseReturnAction, closeReturnAction, inspectAction, receiveReturnAction } from "../../actions";

export default async function ReturnPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await requireSession();
  assertCapability(session, C.returnRead);
  const row = await returnDetail(session.organisationId, (await params).id);
  if (!row) notFound();
  return (
    <div className="space-y-6">
      <Link href="/logistics/returns" className="text-sm text-[var(--color-ink-muted)]">Returns</Link>
      <header><p className="text-sm text-[var(--color-ink-muted)]">{row.party.name} · {row.reason}</p><h1 className="text-4xl font-semibold">{row.reference}</h1><p className="mt-2 text-sm">{row.status.replaceAll("_", " ")}</p></header>
      {can(session, C.returnAuthorise) && row.status === "REQUESTED" && <div className="flex gap-2"><ActionForm action={authoriseReturnAction.bind(null, row.id, true)}><button className="rounded-full bg-[var(--color-atlas-blue)] px-4 py-2 text-sm font-semibold text-white" type="submit">Authorise</button></ActionForm><ActionForm action={authoriseReturnAction.bind(null, row.id, false)}><button className="rounded-full border px-4 py-2 text-sm" type="submit">Reject</button></ActionForm></div>}
      {row.lines.map((line) => (
        <article key={line.id} className="rounded-3xl border border-[var(--color-border)] bg-white p-5">
          <h2 className="font-medium">{line.description}</h2>
          <p className="mt-1 text-sm text-[var(--color-ink-muted)]">Asked {line.quantity} · Received {line.receivedQuantity}{line.disposition ? ` · ${line.disposition}` : ""}</p>
          {can(session, C.receiptExecute) && <ActionForm action={receiveReturnAction.bind(null, line.id)} className="mt-3 flex gap-2"><input name="quantity" type="number" min={1} defaultValue={line.quantity} className="w-24 rounded-xl border px-3 py-2 text-sm" /><select name="condition" className="rounded-xl border px-3 py-2 text-sm"><option>UNKNOWN</option><option>GOOD</option><option>DAMAGED</option></select><button className="rounded-full border px-4 py-2 text-sm" type="submit">Goods arrived</button></ActionForm>}
          {can(session, C.returnInspect) && <ActionForm action={inspectAction.bind(null, line.id)} className="mt-3 flex flex-wrap gap-2"><select name="disposition" className="rounded-xl border px-3 py-2 text-sm">{DISPOSITIONS.map((item) => <option key={item}>{item}</option>)}</select><input name="replacement" placeholder="Replacement fulfilment id" className="rounded-xl border px-3 py-2 text-sm" /><button className="rounded-full border px-4 py-2 text-sm" type="submit">Inspect</button></ActionForm>}
        </article>
      ))}
      {can(session, C.returnResolve) && <ActionForm action={closeReturnAction.bind(null, row.id)}><button className="rounded-full border px-4 py-2 text-sm" type="submit">Close return</button></ActionForm>}
      <p className="text-xs text-[var(--color-ink-muted)]">Finance is told when goods are received, inspected and accepted. Logistics does not raise the credit.</p>
    </div>
  );
}
