import { can } from "@/core/permissions/check";
import { requireSession } from "@/core/auth/session";
import { StatusPill } from "@/components/ui/status-pill";
import { readStockForecast } from "@/modules/stock/services/forecast";
import { PlanningForm } from "./planning-form";

const states = { ORDER_NOW: { label: "Order now", tone: "danger" }, ORDER_SOON: { label: "Order soon", tone: "warning" }, COVERED: { label: "Covered", tone: "success" }, NO_USAGE: { label: "No usage yet", tone: "neutral" } } as const;
const whole = (value: number) => Math.round(value).toLocaleString("en-GB");

/** Forecast and planning figures on a product's stock page. */
export async function ProductPlanning({ productId }: { productId: string }) {
  const session = await requireSession();
  if (!can(session, "stock.read")) return null;
  const [row] = await readStockForecast(productId);
  if (!row) return null;
  const figures: [string, string, string][] = [
    ["Usage a month", row.usageSource === "none" ? "—" : whole(row.dailyUsage * 30), row.usageSource === "plan" ? "From the production forecast" : row.usageSource === "set" ? "Set by you" : row.usageSource === "history" ? "From what left stock" : "No usage yet"],
    ["Cover", row.daysOfCover == null ? "—" : row.daysOfCover > 365 ? "Over a year" : `${whole(Math.floor(row.daysOfCover))} days`, row.runsOutOn && (row.daysOfCover ?? 0) <= 365 ? `Runs out ${new Date(`${row.runsOutOn}T00:00:00Z`).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" })}` : ""],
    ["Reorder at", row.reorderPoint ? whole(row.reorderPoint) : "—", "Usage over the lead time, plus safety stock"],
    ["Suggested order", row.suggestedOrder ? whole(row.suggestedOrder) : "—", row.suggestedOrder ? "Covers the lead time and 30 days" : "Nothing needed now"],
  ];
  return <section className="rounded-2xl border border-slate-200 bg-white p-5">
    <div className="flex flex-wrap items-center justify-between gap-3"><div><h3 className="text-sm font-semibold">Forecast and planning</h3><p className="mt-1 text-xs text-slate-500">{row.supply === "BUY" ? "Bought in" : "Made here"}{row.productionNeed ? ` · ${whole(row.productionNeed)} needed by open production orders` : ""} · the production planner uses these figures</p></div><StatusPill label={states[row.state].label} tone={states[row.state].tone} /></div>
    <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{figures.map(([label, value, note]) => <div key={label} className="rounded-xl bg-slate-50 px-4 py-3"><p className="text-xs text-slate-500">{label}</p><p className="mt-1 text-xl font-semibold tabular-nums">{value}</p><p className="mt-1 text-xs text-slate-500">{note}</p></div>)}</div>
    {can(session, "stock.manage") && <details className="mt-5 border-t border-slate-100 pt-5"><summary className="cursor-pointer text-sm font-medium">Planning settings</summary><div className="mt-4"><PlanningForm productId={row.id} unit={row.unit} safetyStock={row.safetyStock} leadTimeDays={row.leadTimeDays} monthlyUsage={row.monthlyUsage} historyMonthly={row.usageSource === "history" ? Math.round(row.dailyUsage * 30) : 0} /></div></details>}
  </section>;
}
