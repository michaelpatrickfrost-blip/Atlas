import Link from "next/link";
import { notFound } from "next/navigation";
import { requireSession } from "@/core/auth/session";
import { can } from "@/core/permissions/check";
import { SAFETY_CAPABILITIES as C } from "@/core/permissions/capabilities";
import { ActionForm } from "@/components/ui/action-form";
import { Button } from "@/components/ui/button";
import { holdDetail } from "@/modules/safety/services/queries";
import { overrideSafetyHold, releaseSafetyHold, updateReturnToService } from "@/modules/safety/services/control";
import { Field, inputClass } from "../../../ui";

export default async function HoldPage({ params }: { params: Promise<{ holdId: string }> }) {
  const session = await requireSession();
  const hold = await holdDetail(session, (await params).holdId);
  if (!hold) notFound();
  const stopped = hold.status === "ACTIVE";
  return (
    <div className="space-y-8">
      <header>
        <p className="text-sm text-[var(--color-ink-muted)]">{hold.reference}</p>
        <h1 className="mt-2 text-4xl font-semibold tracking-tight">{hold.targetLabel}</h1>
        <p className={`mt-3 text-lg font-medium ${stopped ? "text-rose-700" : "text-amber-700"}`}>{stopped ? "Do not use" : hold.status === "RELEASED" ? "Returned to service" : "Override in force"}</p>
        <p className="mt-2 max-w-xl text-sm">{hold.reason}</p>
      </header>
      <ul className="space-y-2 text-sm">
        <li>{hold.repairComplete ? "Repair complete" : "Repair not confirmed"}</li>
        <li>{hold.inspectionComplete ? "Inspection complete" : "Inspection not confirmed"}</li>
        <li>{hold.safetyVerified ? "Safety verification complete" : "Safety verification pending"}</li>
      </ul>
      {hold.action && <p className="text-sm">Maintenance request {hold.action.reference} · {hold.action.status.toLowerCase()}. Completing that request does not clear this hold.</p>}
      {hold.orders.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold">Production affected</h2>
          <ul className="mt-2 text-sm">
            {hold.orders.map((order) => <li key={order.id}>{order.orderNumber} · {order.product.name}{order.sourceSalesOrderLine ? " · linked sales order" : ""}</li>)}
          </ul>
        </section>
      )}
      {stopped && can(session, C.holdManage) && (
        <ActionForm action={updateReturnToService} className="space-y-3 rounded-3xl border border-[var(--color-border)] bg-white p-5">
          <input type="hidden" name="holdId" value={hold.id} />
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="repairComplete" defaultChecked={hold.repairComplete} /> Repair complete</label>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="inspectionComplete" defaultChecked={hold.inspectionComplete} /> Inspection complete</label>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="safetyVerified" defaultChecked={hold.safetyVerified} /> Safety verification</label>
          <Field label="What was checked"><input name="verificationNote" className={inputClass} /></Field>
          <div className="flex gap-2"><Button type="submit">Save checks</Button></div>
        </ActionForm>
      )}
      {stopped && can(session, C.holdManage) && hold.repairComplete && hold.inspectionComplete && hold.safetyVerified && (
        <ActionForm action={releaseSafetyHold}><input type="hidden" name="holdId" value={hold.id} /><Button type="submit" variant="primary">Verify return to service</Button></ActionForm>
      )}
      {stopped && can(session, C.holdManage) && (
        <ActionForm action={overrideSafetyHold} className="grid gap-3 rounded-3xl border border-amber-200 bg-amber-50 p-5 md:grid-cols-2">
          <input type="hidden" name="holdId" value={hold.id} />
          <Field label="Why override"><input name="why" required className={inputClass} /></Field>
          <Field label="Scope"><input name="scope" required className={inputClass} /></Field>
          <Field label="Approved by"><input name="approvedBy" required className={inputClass} /></Field>
          <Field label="Expires"><input type="datetime-local" name="expiresAt" required className={inputClass} /></Field>
          <div className="md:col-span-2"><Button type="submit">Record a time-limited override</Button></div>
        </ActionForm>
      )}
      {hold.overrideReason && <p className="text-sm">Override · {hold.overrideReason} · scope {hold.overrideScope} · approved by {hold.overrideApprovedByUserId} · until {hold.overrideExpiresAt?.toLocaleString("en-GB")}</p>}
      <Link href="/manufacturing" className="text-sm text-[var(--color-atlas-blue)]">Manufacturing</Link>
    </div>
  );
}
