const LIVE = new Set(["DRAFT", "PENDING_APPROVAL", "CONFIRMED", "ON_HOLD"]);

export type RestoredPosition = {
  commercialStatus: "DRAFT" | "PENDING_APPROVAL" | "CONFIRMED" | "ON_HOLD";
  netAmount: number;
  taxAmount: number;
  grossAmount: number;
  discountAmount: number;
  lines: Array<{ id: string; cancelledQuantity: number; netAmount: number; taxAmount: number }>;
};

export type QuotationLineDraft = {
  lineNumber: number;
  type: "PRODUCT" | "TEXT" | "SECTION" | "NOTE";
  description: string;
  quantity: number;
  unitAmount: number;
  discountPercent: number;
  netAmount: number;
  taxAmount: number;
  taxCategory: string | null;
  priceSource: string | null;
  unitOfMeasure: string;
  productId: string | null;
  invoiceWhenInStock: boolean;
};

function numberOr(value: unknown, fallback = 0) {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

/** The revision saved before cancellation is the position a mistaken cancel returns to. */
export function positionBeforeCancellation(snapshot: unknown, fromStatus: string | null): RestoredPosition {
  if (!snapshot || typeof snapshot !== "object") throw new Error("The earlier commercial position is missing.");
  const record = snapshot as Record<string, unknown>;
  const snapshotStatus = typeof record.commercialStatus === "string" ? record.commercialStatus : "";
  const status = fromStatus && LIVE.has(fromStatus) ? fromStatus : LIVE.has(snapshotStatus) ? snapshotStatus : "";
  if (!status) throw new Error("This cancellation cannot be wound back.");
  const lines = Array.isArray(record.lines)
    ? record.lines.flatMap((line) => {
        if (!line || typeof line !== "object") return [];
        const row = line as Record<string, unknown>;
        if (typeof row.id !== "string") return [];
        return [{ id: row.id, cancelledQuantity: numberOr(row.cancelledQuantity), netAmount: numberOr(row.netAmount), taxAmount: numberOr(row.taxAmount) }];
      })
    : [];
  if (!lines.length) throw new Error("The earlier lines are missing.");
  return {
    commercialStatus: status as RestoredPosition["commercialStatus"],
    netAmount: numberOr(record.netAmount),
    taxAmount: numberOr(record.taxAmount),
    grossAmount: numberOr(record.grossAmount),
    discountAmount: numberOr(record.discountAmount),
    lines,
  };
}

/** Open commercial lines become quotation lines. A pre-cancellation snapshot is used when the order was cancelled. */
export function quotationLinesFrom(lines: unknown[]): QuotationLineDraft[] {
  const mapped = lines.flatMap((line, index) => {
    if (!line || typeof line !== "object") return [];
    const row = line as Record<string, unknown>;
    const rawType = row.type;
    const type: QuotationLineDraft["type"] = rawType === "SECTION" || rawType === "NOTE" || rawType === "TEXT" || rawType === "PRODUCT" ? rawType : "PRODUCT";
    const ordered = numberOr(row.orderedQuantity, numberOr(row.quantity, 1));
    const cancelled = numberOr(row.cancelledQuantity);
    const quantity = Math.max(0, ordered - cancelled);
    if (quantity <= 0 && type !== "SECTION" && type !== "NOTE") return [];
    const description = String(row.descriptionSnapshot ?? row.description ?? "").trim();
    if (!description && type !== "PRODUCT") return [];
    return [{
      lineNumber: index + 1,
      type,
      description: description || "Product",
      quantity: quantity || 1,
      unitAmount: numberOr(row.unitPriceAmount, numberOr(row.unitAmount)),
      discountPercent: numberOr(row.discountPercent),
      netAmount: type === "SECTION" || type === "NOTE" ? 0 : numberOr(row.netAmount),
      taxAmount: type === "SECTION" || type === "NOTE" ? 0 : numberOr(row.taxAmount),
      taxCategory: typeof row.taxCategory === "string" ? row.taxCategory : null,
      priceSource: typeof row.priceSource === "string" ? row.priceSource : null,
      unitOfMeasure: typeof row.unitOfMeasure === "string" ? row.unitOfMeasure : "each",
      productId: typeof row.productId === "string" ? row.productId : null,
      invoiceWhenInStock: row.invoiceWhenInStock === true,
    }];
  });
  if (!mapped.some((line) => line.type === "PRODUCT" || line.type === "TEXT")) throw new Error("There is no line left to put on a quotation.");
  return mapped.map((line, index) => ({ ...line, lineNumber: index + 1 }));
}
