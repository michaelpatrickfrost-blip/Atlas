export const SALES_POINTERS = [
  {
    key: "completeSale",
    form: "pointerCompleteSale",
    label: "To complete a sale",
    detail: "Confirm the customer, the prices and the quantities. A customer purchase order is a separate number from hashtags.",
    surfaces: ["sale", "customer"],
  },
  {
    key: "completeDelivery",
    form: "pointerCompleteDelivery",
    label: "To complete a delivery",
    detail: "A delivery date may be set. The goods may be packed, dispatched and marked delivered.",
    surfaces: ["sale", "delivery"],
  },
  {
    key: "mayStillBeDone",
    form: "pointerMayStillBeDone",
    label: "This may still be done",
    detail: "A cancelled order or delivery can be put back. An order can also return to a quotation.",
    surfaces: ["sale", "delivery", "customer"],
  },
] as const;

export type SalesPointerKey = (typeof SALES_POINTERS)[number]["key"];
export type SalesPointerSurface = (typeof SALES_POINTERS)[number]["surfaces"][number];
export type SalesPointers = Record<SalesPointerKey, boolean>;

export const defaultSalesPointers: SalesPointers = { completeSale: true, completeDelivery: true, mayStillBeDone: true };

export function visiblePointers(pointers: SalesPointers, surface: SalesPointerSurface) {
  return SALES_POINTERS.filter((pointer) => pointers[pointer.key] && (pointer.surfaces as readonly SalesPointerSurface[]).includes(surface));
}
