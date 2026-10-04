export type PlaceKind = "WAREHOUSE" | "YARD";

export const WAREHOUSE_LOCATIONS = [
  { code: "RECEIVING", name: "Receiving", capabilities: ["RECEIVING"], sequence: 10 },
  { code: "STOCK", name: "Stock", capabilities: ["STORAGE", "PICK_FACE"], sequence: 20 },
  { code: "BULK", name: "Bulk", capabilities: ["BULK"], sequence: 30 },
  { code: "PACKING", name: "Packing", capabilities: ["PACKING"], sequence: 40 },
  { code: "STAGING", name: "Staging", capabilities: ["STAGING"], sequence: 50 },
  { code: "DISPATCH", name: "Dispatch", capabilities: ["SHIPPING"], sequence: 60 },
  { code: "RETURNS", name: "Returns", capabilities: ["RETURNS"], sequence: 70 },
  { code: "QUARANTINE", name: "Quarantine", capabilities: ["QUARANTINE"], sequence: 80 },
  { code: "SCRAP", name: "Scrap", capabilities: ["SCRAP"], sequence: 90 },
];

export const YARD_LOCATIONS = [
  { code: "YARD", name: "Yard", capabilities: ["STORAGE"], sequence: 10 },
];

export function placeKind(value: string): PlaceKind {
  const kind = value.trim().toUpperCase();
  if (kind === "YARD" || kind === "WAREHOUSE") return kind;
  throw new Error("Choose a warehouse or a yard.");
}

export function placeCode(value: string) {
  const code = value.trim().toUpperCase().replace(/[^A-Z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 20);
  if (!code) throw new Error("Enter a short code.");
  return code;
}

export function starterLocations(kind: PlaceKind) {
  return kind === "YARD" ? YARD_LOCATIONS : WAREHOUSE_LOCATIONS;
}

/** A move inside one site, or where a site is not set, arrives now. A move between sites stays in transit. */
export function moveTiming(fromSiteId: string | null | undefined, toSiteId: string | null | undefined) {
  if (fromSiteId && toSiteId && fromSiteId !== toSiteId) return "transit" as const;
  return "now" as const;
}

export function placeLabel(place: { code: string; name: string; kind?: string | null; siteName?: string | null }) {
  const kind = place.kind === "YARD" ? "Yard" : "Warehouse";
  return `${place.siteName ? `${place.siteName} · ` : ""}${kind} ${place.code} · ${place.name}`;
}
