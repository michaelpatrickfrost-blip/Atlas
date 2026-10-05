/** Stock cover for one product. Usage comes from the movement ledger unless a
 * monthly figure is set on the product. Nothing here is stored. */
export type ForecastInput = {
  available: number;
  usedInWindow: number;
  windowDays: number;
  monthlyUsage: number | null;
  /** This month's figure from the production forecast, when the planner entered one. */
  planMonth?: number | null;
  leadTimeDays: number;
  safetyStock: number;
};
export type ForecastState = "ORDER_NOW" | "ORDER_SOON" | "COVERED" | "NO_USAGE";
export type Forecast = {
  dailyUsage: number;
  usageSource: "plan" | "set" | "history" | "none";
  next30: number;
  reorderPoint: number;
  daysOfCover: number | null;
  runsOutOn: string | null;
  suggestedOrder: number;
  state: ForecastState;
};

/** Days of cover ordered beyond the lead time once a product needs buying or making. */
export const ORDER_COVER_DAYS = 30;
/** How far ahead of the reorder point a product is flagged. */
export const WARNING_DAYS = 14;

const positive = (value: number) => (Number.isFinite(value) && value > 0 ? value : 0);

export function forecastStock(input: ForecastInput, today = new Date()): Forecast {
  const plan = input.planMonth != null && input.planMonth >= 0;
  const set = input.monthlyUsage != null && input.monthlyUsage >= 0;
  const history = positive(input.usedInWindow) / Math.max(1, input.windowDays);
  const dailyUsage = plan ? positive(input.planMonth ?? 0) / 30 : set ? positive(input.monthlyUsage ?? 0) / 30 : history;
  const usageSource = plan ? "plan" : set ? "set" : history > 0 ? "history" : "none";
  const lead = positive(input.leadTimeDays);
  const safety = positive(input.safetyStock);
  const reorderPoint = Math.ceil(dailyUsage * lead + safety);
  const daysOfCover = dailyUsage > 0 ? Math.max(0, input.available) / dailyUsage : null;
  const runsOutOn = daysOfCover == null ? null : new Date(today.getTime() + Math.floor(daysOfCover) * 86_400_000).toISOString().slice(0, 10);
  const target = Math.ceil(dailyUsage * (lead + ORDER_COVER_DAYS) + safety);
  let state: ForecastState;
  if (input.available < 0 || (reorderPoint > 0 && input.available <= reorderPoint)) state = "ORDER_NOW";
  else if (dailyUsage === 0 && safety === 0) state = "NO_USAGE";
  else if (input.available <= reorderPoint + dailyUsage * WARNING_DAYS) state = "ORDER_SOON";
  else state = "COVERED";
  const suggestedOrder = state === "ORDER_NOW" || state === "ORDER_SOON" ? Math.max(0, target - input.available) : 0;
  return { dailyUsage, usageSource, next30: Math.ceil(dailyUsage * 30), reorderPoint, daysOfCover, runsOutOn, suggestedOrder, state };
}
