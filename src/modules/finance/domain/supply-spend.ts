export type SpendDocument = { id: string; kind: string; net: bigint; gross: bigint; settled: bigint; currency: string; documentDate: Date; accountingDate: Date | null; party: { name: string; customerCode?: string } | null; category: string | null; costCentre: string | null; site: string | null; children: Array<{ net: bigint; currency: string }> };
export function spendSupplier(party: SpendDocument["party"]) { return party ? `${party.name}${party.customerCode ? ` · ${party.customerCode}` : ""}` : "Unassigned supplier"; }
export function signedSpend(kind: string, amount: bigint) { return kind === "AP_CREDIT" ? -amount : amount; }
export function unbilledCommitment(order: Pick<SpendDocument, "net" | "currency" | "children">) {
  if (order.children.some((bill) => bill.currency !== order.currency)) throw new Error("A purchase order has a bill in a different currency; reconcile it before reporting commitments.");
  const billed = order.children.reduce((sum, bill) => sum + bill.net, 0n);
  return order.net > billed ? order.net - billed : 0n;
}
export function spendBreakdown(documents: SpendDocument[], group: "supplier" | "category" | "costCentre" | "site" | "month") {
  const rows = new Map<string, { label: string; currency: string; net: bigint; documents: number }>();
  for (const doc of documents) {
    const label = group === "supplier" ? spendSupplier(doc.party) : group === "month" ? (doc.accountingDate ?? doc.documentDate).toISOString().slice(0, 7) : doc[group] || "Unassigned";
    const key = JSON.stringify([label, doc.currency]);
    const row = rows.get(key) ?? { label, currency: doc.currency, net: 0n, documents: 0 };
    row.net += signedSpend(doc.kind, doc.net); row.documents += 1; rows.set(key, row);
  }
  return [...rows.values()].sort((a, b) => a.currency.localeCompare(b.currency) || (a.net === b.net ? a.label.localeCompare(b.label) : a.net > b.net ? -1 : 1)).map((row) => ({ ...row, net: row.net.toString() }));
}
