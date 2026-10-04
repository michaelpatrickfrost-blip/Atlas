import Link from "next/link";
import { requireSession } from "@/core/auth/session";
import { assertCapability } from "@/core/permissions/check";
import { MANUFACTURING_CAPABILITIES as C } from "@/core/permissions/capabilities";
import { latestPlan } from "@/modules/manufacturing/services/mrp";
import { listForecasts } from "@/modules/manufacturing/services/forecast";
import { manufacturableProducts } from "@/modules/manufacturing/services/queries";
import { ActionForm } from "@/components/ui/action-form";
import { runMrpAction, firmSuggestionAction, dismissSuggestionAction, setForecastAction, deleteForecastAction } from "./actions";
import { readAvailability } from "@/modules/stock/services/availability";

export default async function PlanWorkspace() {
  const session = await requireSession();
  assertCapability(session, C.planRead);
  const canManage = session.capabilities.has(C.planManage);
  const [{ run, suggestions }, forecasts, products, chain] = await Promise.all([
    latestPlan(session.organisationId),
    listForecasts(session.organisationId),
    manufacturableProducts(session.organisationId),
    readAvailability(),
  ]);
  const available = new Map(chain.products.map((row) => [row.productId, row]));

  return (
    <div className="space-y-10">
      <header className="flex items-start justify-between gap-6">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Plan</h1>
          <p className="mt-2 max-w-xl text-sm text-[var(--color-ink-muted)]">
            What do we need to make, and when must we start? Net requirement is confirmed demand still to
            deliver, plus the monthly forecast, minus free stock, minus planned production. Planned production
            is the larger of the production plan and open production orders, and that same figure is forecasted
            stock on Inventory, Sales and Production Planning.
          </p>
        </div>
        {canManage && (
          <ActionForm action={runMrpAction}>
            <button type="submit" className="rounded-full bg-[var(--color-atlas-blue)] px-5 py-2.5 text-sm font-semibold text-white">Run MRP</button>
          </ActionForm>
        )}
      </header>

      {run && (
        <p className="text-xs text-[var(--color-ink-faint)]">
          Last run {run.startedAt.toLocaleString("en-GB")} · {run.productCount} product{run.productCount === 1 ? "" : "s"} considered · {run.suggestionCount} suggestion{run.suggestionCount === 1 ? "" : "s"}
          {run.warnings.length > 0 && <> · {run.warnings.join(" ")}</>}
        </p>
      )}

      <div className="divide-y divide-[var(--color-border)] rounded-3xl border border-[var(--color-border)] bg-white">
        {suggestions.length === 0 && (
          <p className="px-5 py-10 text-center text-sm text-[var(--color-ink-muted)]">
            {run ? "No shortages — everything confirmed and forecast is covered by stock or open production." : "Run MRP to see what needs making."}
          </p>
        )}
        {suggestions.map((s) => (
          <div key={s.id} className="flex items-start justify-between gap-6 px-5 py-5">
            <div>
              <p className="font-medium">
                Make {s.quantity} <Link href={`/products/${s.productId}`} className="text-[var(--color-atlas-blue)] hover:underline">{s.product}</Link> <span className="text-[var(--color-ink-faint)]">{s.productCode}</span>
              </p>
              <p className="mt-1 text-sm text-[var(--color-ink-muted)]">
                Available now {available.get(s.productId)?.available.toLocaleString("en-GB") ?? "—"} ·{" "}
                {s.neededBy ? `Needed ${s.neededBy.toLocaleDateString("en-GB")}` : "No committed date"}
                {s.startBy && (
                  <> · <span className={s.overdueToStart ? "font-semibold text-rose-600" : ""}>
                    {s.overdueToStart ? "Should already have started" : `Start by ${s.startBy.toLocaleDateString("en-GB")}`}
                  </span></>
                )}
              </p>
              <div className="mt-2 space-y-0.5 text-xs text-[var(--color-ink-faint)]">
                {s.pegging.length === 0 && <p>Safety stock requirement.</p>}
                {s.pegging.map((p, i) => (
                  <p key={i}>{p.label} · {p.quantity}</p>
                ))}
              </div>
            </div>
            {session.capabilities.has(C.planFirm) && (
              <div className="flex shrink-0 items-center gap-2">
                <ActionForm action={dismissSuggestionAction}>
                  <input type="hidden" name="suggestionId" value={s.id} />
                  <button type="submit" className="rounded-full border border-[var(--color-border)] px-4 py-2 text-xs font-semibold">Dismiss</button>
                </ActionForm>
                <ActionForm action={firmSuggestionAction}>
                  <input type="hidden" name="suggestionId" value={s.id} />
                  <button type="submit" className="rounded-full bg-[var(--color-atlas-blue)] px-4 py-2 text-xs font-semibold text-white">Firm into order</button>
                </ActionForm>
              </div>
            )}
          </div>
        ))}
      </div>

      <section className="space-y-4">
        <div>
          <h2 className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--color-ink-faint)]">Forecast demand</h2>
          <p className="mt-1 max-w-xl text-sm text-[var(--color-ink-muted)]">
            Confirmed sales orders feed MRP automatically. Nothing upstream yet forecasts a quantity of a
            specific product (CRM opportunities carry a deal value, not a product line) — so planners enter
            an expected monthly quantity here, and MRP treats it the same as a confirmed order.
          </p>
        </div>

        {canManage && (
          <ActionForm action={setForecastAction} className="flex flex-wrap items-end gap-3 rounded-2xl border border-[var(--color-border)] bg-white px-4 py-4">
            <label className="flex flex-col text-xs text-[var(--color-ink-muted)]">
              Product
              <select name="productId" required className="mt-1 rounded-lg border border-[var(--color-border)] px-3 py-2 text-sm">
                {products.map((p) => <option key={p.id} value={p.id}>{p.name} ({p.code})</option>)}
              </select>
            </label>
            <label className="flex flex-col text-xs text-[var(--color-ink-muted)]">
              Month
              <input type="month" name="periodStart" required defaultValue={new Date().toISOString().slice(0, 7)} className="mt-1 rounded-lg border border-[var(--color-border)] px-3 py-2 text-sm" />
            </label>
            <label className="flex flex-col text-xs text-[var(--color-ink-muted)]">
              Quantity
              <input type="number" name="quantity" min="0" required className="mt-1 w-28 rounded-lg border border-[var(--color-border)] px-3 py-2 text-sm" />
            </label>
            <label className="flex flex-col text-xs text-[var(--color-ink-muted)]">
              Notes
              <input type="text" name="notes" className="mt-1 w-48 rounded-lg border border-[var(--color-border)] px-3 py-2 text-sm" />
            </label>
            <button type="submit" className="rounded-full bg-[var(--color-atlas-blue)] px-4 py-2 text-sm font-semibold text-white">Save forecast</button>
          </ActionForm>
        )}

        <div className="divide-y divide-[var(--color-border)] rounded-2xl border border-[var(--color-border)] bg-white">
          {forecasts.length === 0 && <p className="px-5 py-6 text-sm text-[var(--color-ink-muted)]">No forecast entered for the next 6 months.</p>}
          {forecasts.map((f) => (
            <div key={f.id} className="flex items-center justify-between gap-4 px-5 py-3 text-sm">
              <span>{f.periodStart.toLocaleDateString("en-GB", { month: "long", year: "numeric" })} · <Link href={`/products/${f.productId}`} className="text-[var(--color-atlas-blue)] hover:underline">{f.product}</Link> <span className="text-[var(--color-ink-faint)]">{f.productCode}</span> · {f.quantity}{f.notes ? ` · ${f.notes}` : ""} · available {available.get(f.productId)?.available.toLocaleString("en-GB") ?? "—"}</span>
              {canManage && (
                <ActionForm action={deleteForecastAction}>
                  <input type="hidden" name="forecastId" value={f.id} />
                  <button type="submit" className="text-xs font-semibold text-rose-600">Remove</button>
                </ActionForm>
              )}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
