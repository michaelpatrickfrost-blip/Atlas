import { requireSession } from "@/core/auth/session";
import { assertCapability } from "@/core/permissions/check";
import { MANUFACTURING_CAPABILITIES as C } from "@/core/permissions/capabilities";
import { shopFloorQueue } from "@/modules/manufacturing/services/queries";
import { ActionForm } from "@/components/ui/action-form";
import { startAction, pauseAction, completeAction } from "./actions";

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
        <h1 className="text-4xl font-semibold tracking-tight">Shop Floor</h1>
      </header>

      {running.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-sm font-semibold uppercase tracking-[0.16em] text-[var(--color-ink-faint)]">Now</h2>
          {running.map((w) => {
            const requestKey = `${w.id}-${w.status}-${w.producedQuantity}`;
            return (
              <div key={w.id} className="rounded-3xl border-2 border-[var(--color-atlas-blue)] bg-white p-6">
                <p className="text-2xl font-semibold">{w.product}</p>
                <p className="text-lg text-[var(--color-ink-muted)]">{w.operationName} · {w.orderNumber} · {w.workCentre}</p>
                <p className="mt-2 text-sm text-[var(--color-ink-muted)]">Target {w.quantity} {w.unitOfMeasure} · Produced so far {w.producedQuantity}</p>
                <div className="mt-6 flex flex-wrap gap-4">
                  {w.status === "RUNNING" ? (
                    <ActionForm action={pauseAction} className="flex items-center gap-2">
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
                  <ActionForm action={completeAction} className="flex items-center gap-2">
                    <input type="hidden" name="workOrderId" value={w.id} />
                    <input type="hidden" name="requestKey" value={`${requestKey}-complete`} />
                    <input name="goodQuantity" type="number" min="0" placeholder="Good qty" className="w-28 rounded-full border border-[var(--color-border)] px-4 py-3 text-base" required />
                    <input name="scrapQuantity" type="number" min="0" placeholder="Scrap" defaultValue="0" className="w-24 rounded-full border border-[var(--color-border)] px-4 py-3 text-base" />
                    <button type="submit" className="rounded-full bg-emerald-600 px-8 py-4 text-lg font-semibold text-white">Complete</button>
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
              </div>
              <ActionForm action={startAction}>
                <input type="hidden" name="workOrderId" value={w.id} />
                <input type="hidden" name="requestKey" value={`${w.id}-${w.status}-${w.producedQuantity}`} />
                <button type="submit" className="rounded-full bg-[var(--color-atlas-blue)] px-8 py-4 text-lg font-semibold text-white">Start</button>
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
