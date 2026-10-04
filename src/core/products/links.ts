export const LINK_KINDS = ["CONTAINS", "REQUIRES"] as const;
export type ProductLinkKind = (typeof LINK_KINDS)[number];

export type ProductLinkDraft = { relatedProductId: string; kind: ProductLinkKind; quantity: number; notes?: string };

export function cleanPackUnit(value: string) {
  const unit = value.trim().slice(0, 40);
  if (unit && !/^[\w ./-]+$/.test(unit)) throw new Error("Name the pack with letters and numbers, such as box, carton or crate.");
  return unit;
}

export function assertProductLinks(productId: string, links: ProductLinkDraft[]) {
  const seen = new Set<string>();
  for (const link of links) {
    if (!LINK_KINDS.includes(link.kind)) throw new Error("Choose whether this pack contains the product, or this product needs it.");
    if (!link.relatedProductId) throw new Error("Choose the other product.");
    if (link.relatedProductId === productId) throw new Error("A product cannot link to itself.");
    if (!(link.quantity > 0) || link.quantity > 1_000_000) throw new Error("Enter how many, up to 1,000,000.");
    const key = `${link.kind}:${link.relatedProductId}`;
    if (seen.has(key)) throw new Error("Link each product once as contents and once as something this needs.");
    seen.add(key);
  }
}

/** A pack cannot contain a chain that comes back to itself. */
export function packContainsLoops(productId: string, nextChildren: string[], existing: Array<{ productId: string; relatedProductId: string }>) {
  const edges = new Map<string, string[]>();
  for (const row of existing) {
    if (row.productId === productId) continue;
    const list = edges.get(row.productId) ?? [];
    list.push(row.relatedProductId);
    edges.set(row.productId, list);
  }
  edges.set(productId, nextChildren);
  const seen = new Set<string>();
  const stack = new Set<string>();
  const visit = (id: string): boolean => {
    if (stack.has(id)) return true;
    if (seen.has(id)) return false;
    seen.add(id);
    stack.add(id);
    for (const child of edges.get(id) ?? []) if (visit(child)) return true;
    stack.delete(id);
    return false;
  };
  return visit(productId);
}
