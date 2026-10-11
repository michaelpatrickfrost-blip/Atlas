import { requireSession } from "@/core/auth/session";
import { assertCapability } from "@/core/permissions/check";
import { MANUFACTURING_CAPABILITIES as C } from "@/core/permissions/capabilities";
import { shopFloorQueue } from "@/modules/manufacturing/services/queries";
import { ActionForm } from "@/components/ui/action-form";
import { startAction, pauseAction, completeAction } from "./actions";

import { recordProductionUsage } from "@/modules/finance/services/manufacturing-settings";
import { compatibleUnits } from "@/core/shared/measurement";

const PAUSE_REASONS = ["Break", "Waiting material", "Machine problem", "Quality issue", "Changeover", "No operator", "Other"];

export default async function ShopFloorPage() {
  const session = await requireSession();
  assertCapability(session, C.workOrderExecute);
  const queue = await shopFloorQueue(session.organisationId);
  const running = queue.filter((w) => w.status === "RUNNING" || w.status === "PAUSED");
  const upNext = queue.filter((w) => w.status === "READY" || w.status === "WAITING");
  const blocked = queue.filter((w) => w.status === "BLOCKED");

  return (
    <div className="space-y-10">
      <header>
        <h1 className="text-4xl font-semibold tracking-tight">Shop Floor</h1><p className="mt-3 max-w-3xl text-sm leading-7 text-slate-500">Record actual work and quantities. Completing the final operation places good output in production holding, ready for Warehouse to collect and book into its destination.</p>
      </header>

      {running.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-sm font-semibold uppercase tracking-[0.16em] text-[var(--color-ink-faint)]">Now</h2>
          {running.map((w) => {
            const requestKey = `${w.id}-${w.version}`;
            return (
              <div key={w.id} className="rounded-3xl border-2 border-[var(--color-atlas-blue)] bg-white p-6">
                <p className="text-2xl font-semibold">{w.product}</p>
                <p className="text-lg text-[var(--color-ink-muted)]">{w.operationName} · {w.orderNumber} · {w.workCentre}</p>
                <p className="mt-2 text-sm text-[var(--color-ink-muted)]">Target {w.quantity} {w.unitOfMeasure} · Good so far {w.producedQuantity} · Scrap {w.scrapQuantity} · Remaining {w.remainingQuantity}</p>
                <p className="mt-2 text-sm text-[var(--color-ink-muted)]">Enter only the new output for this report. Report output keeps this step open; Finish step releases the next operation.</p>
                {w.costingConfigured && !w.machineLoadId && <ActionForm action={recordProductionUsage} className="mt-4 flex flex-wrap items-end gap-3 rounded-2xl bg-blue-50 p-4"><input type="hidden" name="workOrderId" value={w.id}/><input type="hidden" name="requestKey" value={crypto.randomUUID()}/><label className="text-xs font-semibold">New machine minutes<input name="machineMinutes" type="number" min="0" step="0.000001" defaultValue="0" className="mt-1 block w-32 rounded-xl border border-blue-100 p-2"/></label><label className="text-xs font-semibold">New person minutes<input name="personMinutes" type="number" min="0" step="0.000001" defaultValue="0" className="mt-1 block w-32 rounded-xl border border-blue-100 p-2"/></label><label className="text-xs font-semibold">New energy (kWh)<input name="energyKwh" type="number" min="0" step="0.000001" defaultValue="0" className="mt-1 block w-32 rounded-xl border border-blue-100 p-2"/></label><button className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white">Record usage</button><p className="basis-full text-xs text-blue-800">Record only the usage since your last entry, before reporting the output it belongs to. Person minutes add together everyone’s time.</p></ActionForm>}
                <div className="mt-6 flex flex-wrap gap-4">
                  {w.status === "RUNNING" ? (
                    <ActionForm action={pauseAction} className="flex min-w-0 flex-wrap items-center gap-2">
                      <input type="hidden" name="workOrderId" value={w.id} />
                      <input type="hidden" name="requestKey" value={requestKey} />
                      <select name="reason" className="rounded-full border border-[var(--color-border)] px-4 py-3 text-base" defaultValue="">
                        <option value="" disabled>Pause reason…</option>
                        {PAUSE_REASONS.map((r) => <option key={r} value={r}>{r}</option>)}
                      </select>
                      <button type="submit" className="rounded-full border-2 border-[var(--color-border)] px-8 py-4 text-lg font-semibold">Pause</button>
                    </ActionForm>
                  ) : (
                    <ActionForm action={startAction}>
                      <input type="hidden" name="workOrderId" value={w.id} />
                      <input type="hidden" name="requestKey" value={requestKey} />
                      <button type="submit" className="rounded-full bg-[var(--color-atlas-blue)] px-8 py-4 text-lg font-semibold text-white">Resume</button>
                    </ActionForm>
                  )}
                  <ActionForm action={completeAction} className="flex min-w-0 flex-wrap items-center gap-2">
                    <input type="hidden" name="workOrderId" value={w.id} />
                    <input type="hidden" name="requestKey" value={`${requestKey}-complete`} />
                    <input name="goodQuantity" type="number" step="0.000001" min="0" placeholder="Good qty" className="w-28 rounded-full border border-[var(--color-border)] px-4 py-3 text-base" required />
                    <input name="scrapQuantity" type="number" step="0.000001" min="0" placeholder="Scrap" defaultValue="0" className="w-24 rounded-full border border-[var(--color-border)] px-4 py-3 text-base" />
                    <select name="enteredUnit" aria-label="Report unit" defaultValue={w.unitOfMeasure} className="rounded-full border border-[var(--color-border)] px-4 py-3">{compatibleUnits(w.unitOfMeasure).map(unit => <option key={unit.id} value={unit.id}>{unit.label}</option>)}</select>
                    <input name="lotCode" aria-label="Output batch" placeholder="Batch (or automatic)" maxLength={80} className="max-w-full rounded-full border border-[var(--color-border)] px-4 py-3" />
                    {w.trackingMode === "SERIAL" && <input name="serials" aria-label="Output serials" placeholder="One serial per unit, comma separated" className="max-w-full rounded-full border border-[var(--color-border)] px-4 py-3" required />}
                    <input name="shortCloseReason" aria-label="Short completion reason" placeholder="Reason if finishing short" maxLength={500} className="max-w-full rounded-full border border-[var(--color-border)] px-4 py-3" />
                    <button type="submit" name="reportMode" value="partial" className="rounded-full border-2 border-emerald-600 px-6 py-4 text-lg font-semibold text-emerald-700">Report output</button>
                    {session.capabilities.has("manufacturing.order.create") && <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="createBackorder"/>Create a linked replacement order for any finished-product shortfall</label>}
                    <button type="submit" name="reportMode" value="finish" className="rounded-full bg-emerald-600 px-6 py-4 text-lg font-semibold text-white">Finish step</button>
                  </ActionForm>
                </div>
              </div>
            );
          })}
        </section>
      )}

      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-[0.16em] text-[var(--color-ink-faint)]">Next</h2>
        <div className="divide-y divide-[var(--color-border)] rounded-3xl border border-[var(--color-border)] bg-white">
          {upNext.length === 0 && <p className="px-6 py-8 text-center text-base text-[var(--color-ink-muted)]">Nothing waiting.</p>}
          {upNext.map((w) => (
            <div key={w.id} className="flex items-center justify-between gap-4 px-6 py-5">
              <div>
                <p className="text-lg font-medium">{w.product} — {w.operationName}</p>
                <p className="text-sm text-[var(--color-ink-muted)]">{w.orderNumber} · {w.workCentre} · {w.quantity} {w.unitOfMeasure}</p>
                <p className="mt-1 text-xs text-[var(--color-ink-faint)]">{w.startGuidance}</p>
              </div>
              <ActionForm action={startAction}>
                <input type="hidden" name="workOrderId" value={w.id} />
                <input type="hidden" name="requestKey" value={`${w.id}-${w.version}`} />
                <button type="submit" disabled={!w.canStart} className="rounded-full bg-[var(--color-atlas-blue)] px-8 py-4 text-lg font-semibold text-white disabled:opacity-40">Start</button>
              </ActionForm>
            </div>
          ))}
        </div>
      </section>

      {blocked.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-[0.16em] text-rose-600">Blocked</h2>
          <div className="divide-y divide-[var(--color-border)] rounded-3xl border border-rose-200 bg-rose-50">
            {blocked.map((w) => (
              <div key={w.id} className="px-6 py-5 text-base">{w.product} — {w.operationName} · {w.orderNumber}</div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
