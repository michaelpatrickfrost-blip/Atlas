import Link from "next/link";
import { requireSession } from "@/core/auth/session";
import { assertCapability } from "@/core/permissions/check";
import { MANUFACTURING_CAPABILITIES as C } from "@/core/permissions/capabilities";
import { listForecasts } from "@/modules/manufacturing/services/forecast";
import { manufacturableProducts } from "@/modules/manufacturing/services/queries";
import { readAvailability } from "@/modules/stock/services/availability";
import { ActionForm } from "@/components/ui/action-form";
import { setForecastAction, deleteForecastAction } from "./actions";

const whole = (value: number) => value.toLocaleString("en-GB", { maximumFractionDigits: 2 });

export default async function ForecastPage() {
  const session = await requireSession();
  assertCapability(session, C.planRead);
  const canManage = session.capabilities.has(C.planManage);
  const [forecasts, products, chain] = await Promise.all([
    listForecasts(session.organisationId),
    manufacturableProducts(session.organisationId),
    readAvailability(),
  ]);
  const available = new Map(chain.products.map((row) => [row.productId, row]));

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-3xl font-semibold tracking-tight">Forecast demand</h1>
        <p className="mt-2 max-w-2xl text-sm text-[var(--color-ink-muted)]">
          Confirmed sales orders feed MRP automatically. Nothing upstream yet forecasts a quantity of a specific
          product — CRM opportunities carry a deal value, not a product line — so planners enter an expected monthly
          quantity here, and MRP treats it as demand alongside confirmed orders.
        </p>
        <p className="mt-2 text-xs text-[var(--color-ink-faint)]">
          Expected monthly usage set on a product in Inventory fills any month you have not given a figure here.
        </p>
      </header>

      {canManage && (
        <ActionForm action={setForecastAction} className="flex flex-wrap items-end gap-3 rounded-2xl border border-[var(--color-border)] bg-white px-4 py-4">
          <label className="flex flex-col text-xs text-[var(--color-ink-muted)]">
            Product
            <select name="productId" required className="mt-1 rounded-lg border border-[var(--color-border)] px-3 py-2 text-sm">
              {products.map((product) => <option key={product.id} value={product.id}>{product.name} ({product.code})</option>)}
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

      <div className="divide-y divide-[var(--color-border)] rounded-3xl border border-[var(--color-border)] bg-white">
        {forecasts.length === 0 && (
          <p className="px-5 py-10 text-center text-sm text-[var(--color-ink-muted)]">
            {products.length ? "No forecast entered for the next 6 months." : "No products have a recipe yet, so there is nothing to forecast."}
          </p>
        )}
        {forecasts.map((forecast) => (
          <div key={forecast.id} className="flex flex-wrap items-center justify-between gap-4 px-5 py-3 text-sm">
            <span>
              {forecast.periodStart.toLocaleDateString("en-GB", { month: "long", year: "numeric" })} ·{" "}
              <Link href={`/products/${forecast.productId}`} className="text-[var(--color-atlas-blue)] hover:underline">{forecast.product}</Link>{" "}
              <span className="text-[var(--color-ink-faint)]">{forecast.productCode}</span> · {whole(forecast.quantity)}
              {forecast.notes ? ` · ${forecast.notes}` : ""} · available {available.get(forecast.productId)?.available.toLocaleString("en-GB") ?? "—"}
            </span>
            {canManage && (
              <ActionForm action={deleteForecastAction}>
                <input type="hidden" name="forecastId" value={forecast.id} />
                <button type="submit" className="text-xs font-semibold text-rose-600">Remove</button>
              </ActionForm>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
