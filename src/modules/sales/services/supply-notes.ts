import { quotationSupplyNote } from "@/core/availability/stock-promise";
import { readAvailability } from "@/modules/stock/services/availability";

export async function supplyNotesForLines(lines: { id: string; productId: string | null; quantity: number; invoiceWhenInStock: boolean; kind?: string | null }[]) {
  const notes = new Map<string, string>();
  if (!lines.length) return notes;
  let picture: Awaited<ReturnType<typeof readAvailability>> | null = null;
  try {
    picture = await readAvailability();
  } catch {
    picture = null;
  }
  const free = new Map(picture?.products.map((row) => [row.productId, row.availableNow]) ?? []);
  for (const line of lines) {
    const note = quotationSupplyNote({
      quantity: line.quantity,
      freeNow: picture && line.productId ? free.get(line.productId) ?? 0 : null,
      arrivals: line.productId ? picture?.arrivals[line.productId] ?? [] : [],
      invoiceWhenInStock: line.invoiceWhenInStock,
      kind: line.kind,
    });
    if (note) notes.set(line.id, note);
  }
  return notes;
}
