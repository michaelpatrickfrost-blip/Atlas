import { requireSession } from "@/core/auth/session";
import { assertCapability } from "@/core/permissions/check";
import { QUALITY_CAPABILITIES } from "@/core/permissions/capabilities";
import { requireNcr, similarNcr } from "@/modules/quality/services/queries";
import { updateNcrInvestigation, addNcrAction, updateNcrAction, closeNcr } from "@/modules/quality/services/commands";
import { StatusPill } from "@/components/ui/status-pill";
import { Button } from "@/components/ui/button";
import { NCR_DISPOSITIONS, ACTION_STATUSES, canClose, label } from "@/modules/quality/domain/workflow";

const input = "w-full rounded-xl border px-3 py-2 text-sm";

export default async function NcrDetail({ params }: { params: Promise<{ ncrId: string }> }) {
  const { ncrId } = await params;
  const session = await requireSession();
  assertCapability(session, QUALITY_CAPABILITIES.ncrRead);
  const ncr = await requireNcr(session, ncrId);
  const similar = await similarNcr(session, ncr.productId, ncr.defect);
  const canManage = session.capabilities.has(QUALITY_CAPABILITIES.ncrManage);
  const closeGate = canClose(ncr);

  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold">{ncr.number}</h2>
          <p className="text-sm text-slate-500">{ncr.title}</p>
        </div>
        <div className="flex items-center gap-2">
          <StatusPill label={label(ncr.severity)} tone={ncr.severity === "CRITICAL" ? "danger" : ncr.severity === "MAJOR" ? "warning" : "neutral"} />
          <StatusPill label={label(ncr.status)} tone={ncr.status === "CLOSED" ? "success" : "warning"} />
        </div>
      </div>

      <section className="grid grid-cols-2 gap-4 rounded-2xl border bg-white p-4 text-sm">
        <div><p className="text-xs text-slate-500">Product</p><p>{ncr.product?.name ?? "—"}</p></div>
        <div><p className="text-xs text-slate-500">Quantity affected</p><p>{ncr.quantityAffected ?? "—"}</p></div>
        <div><p className="text-xs text-slate-500">Source</p><p>{label(ncr.source)}</p></div>
        <div><p className="text-xs text-slate-500">Quality hold</p><p>{ncr.hold ? `${ncr.hold.number} (${label(ncr.hold.status)})` : "None"}</p></div>
        <div className="col-span-2"><p className="text-xs text-slate-500">Defect</p><p>{ncr.defect}</p></div>
      </section>

      {similar.length > 0 && (
        <section className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm">
          <p className="font-semibold text-amber-900">Similar issues found</p>
          <ul className="mt-2 space-y-1">
            {similar.filter((s) => s.id !== ncr.id).map((s) => (
              <li key={s.id}><a className="underline" href={`/quality/ncr/${s.id}`}>{s.number}</a> — {s.title} ({label(s.status)})</li>
            ))}
          </ul>
        </section>
      )}

      {canManage && (
        <form action={updateNcrInvestigation} className="space-y-4 rounded-2xl border bg-white p-5">
          <input type="hidden" name="ncrId" value={ncr.id} />
          <p className="text-sm font-semibold">Containment, root cause and disposition</p>
          <label className="text-xs">Containment<textarea name="containment" defaultValue={ncr.containment ?? ""} className={input} rows={2} /></label>
          <label className="text-xs">Root cause<textarea name="rootCause" defaultValue={ncr.rootCause ?? ""} className={input} rows={3} /></label>
          <label className="flex items-center gap-2 text-xs"><input type="checkbox" name="rootCauseConfirmed" value="1" defaultChecked={ncr.rootCauseConfirmed} /> Root cause confirmed (not just a hypothesis)</label>
          <div className="grid grid-cols-2 gap-4">
            <label className="text-xs">Disposition<select name="disposition" defaultValue={ncr.disposition} className={input}>
              {NCR_DISPOSITIONS.map((d) => <option key={d} value={d}>{label(d)}</option>)}
            </select></label>
            <label className="text-xs">Disposition note<input name="dispositionNote" defaultValue={ncr.dispositionNote ?? ""} className={input} /></label>
          </div>
          <Button type="submit" variant="primary">Save investigation</Button>
        </form>
      )}

      <section className="space-y-3 rounded-2xl border bg-white p-5">
        <p className="text-sm font-semibold">Corrective actions &amp; effectiveness</p>
        <div className="divide-y">
          {ncr.actions.map((action) => (
            <div key={action.id} className="py-3 text-sm">
              <div className="flex items-center justify-between">
                <p>{action.description}</p>
                <StatusPill label={label(action.status)} tone={action.status === "VERIFIED" ? "success" : action.status === "INEFFECTIVE" ? "danger" : "neutral"} />
              </div>
              {action.effectivenessCriterion && <p className="mt-1 text-xs text-slate-500">Effectiveness criterion: {action.effectivenessCriterion}{action.effectivenessReviewDate ? ` · Review ${action.effectivenessReviewDate.toLocaleDateString("en-GB")}` : ""}</p>}
              {action.effectivenessResult && <p className="text-xs text-slate-500">Result: {action.effectivenessResult}</p>}
              {canManage && (
                <form action={updateNcrAction} className="mt-2 flex flex-wrap items-center gap-2">
                  <input type="hidden" name="actionId" value={action.id} />
                  <input type="hidden" name="ncrId" value={ncr.id} />
                  <select name="status" defaultValue={action.status} className={`${input} w-auto`}>
                    {ACTION_STATUSES.map((s) => <option key={s} value={s}>{label(s)}</option>)}
                  </select>
                  <input name="effectivenessResult" placeholder="Effectiveness result" defaultValue={action.effectivenessResult ?? ""} className={`${input} w-auto flex-1`} />
                  <Button type="submit" variant="secondary">Update</Button>
                </form>
              )}
            </div>
          ))}
          {ncr.actions.length === 0 && <p className="py-3 text-sm text-slate-500">No corrective actions recorded yet.</p>}
        </div>
        {canManage && (
          <form action={addNcrAction} className="space-y-2 border-t pt-3">
            <input type="hidden" name="ncrId" value={ncr.id} />
            <input name="description" required placeholder="Corrective action description" className={input} />
            <div className="grid grid-cols-2 gap-2">
              <input name="dueDate" type="date" className={input} />
              <input name="effectivenessReviewDate" type="date" className={input} placeholder="Effectiveness review date" />
            </div>
            <input name="effectivenessCriterion" placeholder="Effectiveness criterion (e.g. no repeat defect for 8 weeks)" className={input} />
            <Button type="submit" variant="secondary">Add action</Button>
          </form>
        )}
      </section>

      {session.capabilities.has(QUALITY_CAPABILITIES.ncrClose) && ncr.status !== "CLOSED" && (
        <form action={closeNcr} className="rounded-2xl border bg-white p-5">
          <input type="hidden" name="ncrId" value={ncr.id} />
          {!closeGate.ok && <p className="mb-2 text-xs text-amber-700">{closeGate.reason}</p>}
          <Button type="submit" variant={closeGate.ok ? "primary" : "secondary"} disabled={!closeGate.ok}>Close NCR</Button>
        </form>
      )}
      {ncr.status === "CLOSED" && <p className="text-sm text-slate-500">Closed {ncr.closedAt?.toLocaleString("en-GB")}.</p>}
    </div>
  );
}
