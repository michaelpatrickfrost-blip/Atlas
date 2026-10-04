import { ActionForm } from "@/components/ui/action-form";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireSession } from "@/core/auth/session";
import { assertCapability } from "@/core/permissions/check";
import { LOGISTICS_CAPABILITIES as C } from "@/core/permissions/capabilities";
import { receiptDetail } from "@/modules/logistics/services/queries";
import { completeReceiptAction, putAwayAction, receiveLineAction } from "../../actions";

export default async function ReceiptPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await requireSession();
  assertCapability(session, C.receiptExecute);
  const row = await receiptDetail(session.organisationId, (await params).id);
  if (!row) notFound();
  return (
    <div className="space-y-6">
      <Link href="/logistics/receive" className="text-sm text-[var(--color-ink-muted)]">Receive</Link>
      <header><p className="text-sm text-[var(--color-ink-muted)]">{row.sourceType} · {row.sourceReference}</p><h1 className="text-4xl font-semibold">{row.reference}</h1></header>
      {row.lines.map((line) => (
        <article key={line.id} className="rounded-3xl border border-[var(--color-border)] bg-white p-5">
          <h2 className="text-lg font-medium">{line.description}</h2>
          <p className="mt-2 text-sm">Expected {line.expectedQuantity} · Received {line.receivedQuantity}{line.discrepancy ? ` · ${line.discrepancy}` : ""}</p>
          <ActionForm action={receiveLineAction.bind(null, line.id)} className="mt-4 flex flex-wrap gap-2">
            <input type="hidden" name="requestKey" value={`recv:${line.id}:${line.receivedQuantity}`} />
            <input name="quantity" type="number" min={1} defaultValue={Math.max(1, line.expectedQuantity - line.receivedQuantity)} className="w-24 rounded-xl border px-3 py-2 text-sm" />
            <input name="lot" placeholder="Lot" className="rounded-xl border px-3 py-2 text-sm" />
            <select name="condition" className="rounded-xl border px-3 py-2 text-sm"><option value="GOOD">Good</option><option value="DAMAGED">Damaged</option><option value="QUARANTINE">Quarantine</option></select>
            <button className="rounded-full bg-[var(--color-atlas-blue)] px-4 py-2 text-sm font-semibold text-white" type="submit">Receive</button>
          </ActionForm>
          {line.receivedQuantity > 0 && line.status !== "PUTAWAY" && (
            <ActionForm action={putAwayAction.bind(null, line.id)} className="mt-3 flex gap-2">
              <input type="hidden" name="requestKey" value={`putaway:${line.id}`} />
              <input name="destination" placeholder="Scan destination" defaultValue="STOCK" className="rounded-xl border px-3 py-3 text-lg" />
              <button className="rounded-full border px-4 py-2 text-sm" type="submit">Put away</button>
            </ActionForm>
          )}
        </article>
      ))}
      <ActionForm action={completeReceiptAction.bind(null, row.id)}><button className="rounded-full border px-4 py-2 text-sm" type="submit">Complete receipt</button></ActionForm>
    </div>
  );
}
