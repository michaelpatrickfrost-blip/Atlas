import { describe, expect, it } from "vitest";
import { hashtagLabel, parseHashtags } from "@/core/shared/hashtags";
import { parseTags } from "@/modules/sales/services/document-lines";
import { defaultSalesPointers, visiblePointers } from "@/modules/sales/domain/pointers";
import { positionBeforeCancellation, quotationLinesFrom } from "@/modules/sales/domain/rewind";
import { readSalesPolicy } from "@/modules/sales/services/sales-policy";
import { restoredDeliveryStatus } from "@/modules/logistics/domain/operations";

describe("hashtags and sales rewind", () => {
  it("treats tags as hashtags and keeps a customer purchase order separate", () => {
    expect(parseHashtags("#Priority #priority, New-Business")).toEqual(["priority", "new-business"]);
    expect(parseTags("Priority, priority, New Business")).toEqual(["priority", "new business"]);
    expect(hashtagLabel("new business")).toBe("#new-business");
    expect(() => parseHashtags("<script>")).toThrow(/tags/);
  });

  it("shows only the pointers an administrator has left on", () => {
    expect(readSalesPolicy({ discountLimit: 10 }).pointers).toEqual(defaultSalesPointers);
    const pointers = { completeSale: false, completeDelivery: true, mayStillBeDone: false };
    expect(visiblePointers(pointers, "sale").map((pointer) => pointer.key)).toEqual(["completeDelivery"]);
    expect(visiblePointers(pointers, "customer")).toEqual([]);
    expect(visiblePointers(defaultSalesPointers, "delivery").map((pointer) => pointer.label)).toEqual(["To complete a delivery", "This may still be done"]);
  });

  it("winds a cancelled order back to the saved commercial position", () => {
    const position = positionBeforeCancellation({
      commercialStatus: "CONFIRMED",
      netAmount: 1000,
      taxAmount: 200,
      grossAmount: 1200,
      discountAmount: 0,
      lines: [{ id: "line-1", cancelledQuantity: 0, netAmount: 1000, taxAmount: 200 }],
    }, "CONFIRMED");
    expect(position.commercialStatus).toBe("CONFIRMED");
    expect(position.lines[0]).toMatchObject({ id: "line-1", netAmount: 1000 });
    expect(() => positionBeforeCancellation({ commercialStatus: "CANCELLED", lines: [{ id: "line-1" }] }, "CANCELLED")).toThrow(/cannot be wound back/);
  });

  it("turns the open lines of an order into a quotation", () => {
    const lines = quotationLinesFrom([
      { type: "PRODUCT", descriptionSnapshot: "Widget", orderedQuantity: 4, cancelledQuantity: 1, unitPriceAmount: 500, netAmount: 1500, taxAmount: 300, productId: "sku" },
      { type: "NOTE", descriptionSnapshot: "Call before delivery", orderedQuantity: 1, cancelledQuantity: 0 },
    ]);
    expect(lines[0]).toMatchObject({ quantity: 3, description: "Widget", productId: "sku" });
    expect(lines[1].type).toBe("NOTE");
    expect(() => quotationLinesFrom([{ type: "PRODUCT", orderedQuantity: 2, cancelledQuantity: 2, descriptionSnapshot: "Gone" }])).toThrow(/no line/);
  });

  it("puts a cancelled delivery back only while the sale is live and nothing has left", () => {
    expect(restoredDeliveryStatus({ orderStatus: "CONFIRMED", requirementStatus: "CANCELLED", blocked: false, shipped: 0 })).toBe("OPEN");
    expect(restoredDeliveryStatus({ orderStatus: "CANCELLED", requirementStatus: "CANCELLED", blocked: false, shipped: 0 })).toBe("CANCELLED");
    expect(restoredDeliveryStatus({ orderStatus: "CONFIRMED", requirementStatus: "CANCELLED", blocked: false, shipped: 2 })).toBeNull();
  });
});
