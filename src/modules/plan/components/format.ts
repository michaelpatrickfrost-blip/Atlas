import { formatMoney } from "@/core/shared/money";
import type { MetricUnit } from "../domain/catalogue";

export function showMeasure(value: number | null | undefined, unit: MetricUnit, currency = "GBP") {
  if (value == null || !Number.isFinite(value)) return "—";
  if (unit === "money") {
    const pounds = value / 100;
    const sign = pounds < 0 ? "−" : "";
    const absolute = Math.abs(pounds);
    if (absolute >= 1_000_000) return `${sign}£${(absolute / 1_000_000).toLocaleString("en-GB", { maximumFractionDigits: 1 })}m`;
    if (absolute >= 10_000) return `${sign}£${Math.round(absolute / 1000).toLocaleString("en-GB")}k`;
    return formatMoney(Math.round(value), currency);
  }
  if (unit === "percent") return `${value.toLocaleString("en-GB", { maximumFractionDigits: 1 })}%`;
  if (unit === "hours") return `${value.toLocaleString("en-GB", { maximumFractionDigits: 1 })} h`;
  return value.toLocaleString("en-GB", { maximumFractionDigits: unit === "count" ? 0 : 1 });
}

export const field = "mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm";
export const quiet = "rounded-full border border-black/10 px-4 py-2 text-sm font-semibold";
export const primary = "rounded-full bg-[var(--color-atlas-blue)] px-4 py-2 text-sm font-semibold text-white";
