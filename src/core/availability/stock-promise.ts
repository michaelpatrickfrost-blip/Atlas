/** Dated supply for a quotation line. Receipts are inbound goods. Production uses
 * the larger of the plan and open production orders, matching the shared availability picture. */
export type SupplyArrival = { on: string; quantity: number; source: "receipt" | "plan" | "production" };

export type StockCover = { on: string; source: SupplyArrival["source"] };

const day = (value: string) => {
  const [year, month, date] = value.slice(0, 10).split("-").map(Number);
  if (!year || !month || !date) return value;
  return new Date(Date.UTC(year, month - 1, date)).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });
};

const sourceLabel: Record<SupplyArrival["source"], string> = {
  receipt: "expected receipt",
  plan: "production plan",
  production: "production order",
};

export function incomingArrivals(input: { receipts: SupplyArrival[]; plan: SupplyArrival[]; production: SupplyArrival[] }): SupplyArrival[] {
  const total = (rows: SupplyArrival[]) => rows.reduce((sum, row) => sum + Math.max(0, row.quantity), 0);
  const made = input.production.length && total(input.production) >= total(input.plan) ? input.production : input.plan;
  return [...input.receipts, ...made]
    .filter((row) => row.quantity > 0 && /^\d{4}-\d{2}-\d{2}$/.test(row.on))
    .sort((left, right) => left.on.localeCompare(right.on) || left.source.localeCompare(right.source));
}

/** The first dated arrival that brings free stock up to the quoted quantity. */
export function forecastCover(freeNow: number, needed: number, arrivals: SupplyArrival[]): StockCover | null {
  const need = Math.max(0, needed);
  let running = Math.max(0, freeNow);
  if (need <= running) return null;
  for (const row of [...arrivals].sort((left, right) => left.on.localeCompare(right.on))) {
    running += Math.max(0, row.quantity);
    if (running >= need) return { on: row.on, source: row.source };
  }
  return null;
}

export function stockPromiseLabel(freeNow: number, needed: number, arrivals: SupplyArrival[]) {
  if (needed <= Math.max(0, freeNow)) return "In stock";
  const cover = forecastCover(freeNow, needed, arrivals);
  if (!cover) return "Out of stock. No dated supply covers this quantity.";
  return `Forecasted in on ${day(cover.on)} · ${sourceLabel[cover.source]}`;
}

export function quotationSupplyNote(input: { quantity: number; freeNow: number | null; arrivals: SupplyArrival[]; invoiceWhenInStock: boolean; kind?: string | null }) {
  if (input.kind && input.kind !== "PRODUCT") return input.invoiceWhenInStock ? "Delivered and invoiced when back in stock." : null;
  if (input.freeNow == null) return input.invoiceWhenInStock ? "Delivered and invoiced when back in stock." : null;
  const short = input.quantity > input.freeNow;
  const when = short ? stockPromiseLabel(input.freeNow, input.quantity, input.arrivals) : null;
  if (input.invoiceWhenInStock && short) return `${when}. Delivered and invoiced when back in stock.`;
  if (input.invoiceWhenInStock) return "Delivered and invoiced when back in stock.";
  return when;
}

/** Oldest confirmed lines are invoiced first, and only for the whole remaining quantity. */
export function linesReadyToInvoice<T extends { id: string; remaining: number }>(freeNow: number, lines: T[]) {
  let free = Math.max(0, freeNow);
  const ready: T[] = [];
  for (const line of lines) {
    if (line.remaining <= 0) continue;
    if (free < line.remaining) break;
    ready.push(line);
    free -= line.remaining;
  }
  return ready;
}
