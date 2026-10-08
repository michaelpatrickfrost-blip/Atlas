import type { Prisma } from "@/generated/prisma/client";
import type { SetupImportInput } from "@/core/setup/apply-import";
import { resolvePrice } from "@/core/pricing/resolve-price";
import { vatOnNet, commercialLineNet } from "@/modules/sales/domain/uk-sale";
import { rowIssue } from "@/core/setup/validate";

export function importDay(value: string, index: number) {
  const date = new Date(`${value}T00:00:00.000Z`);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value) || !Number.isFinite(date.getTime()) || date.toISOString().slice(0, 10) !== value) throw new Error(rowIssue(index, "use a real date in YYYY-MM-DD format."));
  return date;
}
export function salesGroupIssue(rows: Record<string, string>[]) {
  const grouped = new Map<string, Record<string, string>>();
  for (const [index, row] of rows.entries()) {
    if (!row.reference) continue;
    const first = grouped.get(row.reference);
    if (first && ["customerCode", "deliveryDate", "expiryDate", "notes"].some(key => (first[key] || "") !== (row[key] || ""))) return rowIssue(index, "rows with the same reference must have the same customer, date and notes.");
    grouped.set(row.reference, row);
  }
  return null;
}
export async function importSalesDrafts(tx: Prisma.TransactionClient, input: SetupImportInput) {
  const issue = salesGroupIssue(input.rows);
  if (issue) throw new Error(issue);
  const quotes = input.entity === "sales-quotes";
  const dateKey = quotes ? "expiryDate" : "deliveryDate";
  const customers = await tx.party.findMany({ where: { organisationId: input.organisationId, customerCode: { in: input.rows.map(row => row.customerCode) } }, include: { addresses: { where: { active: true }, orderBy: { createdAt: "asc" } }, commercialSettings: true } });
  const products = await tx.product.findMany({ where: { organisationId: input.organisationId, code: { in: input.rows.map(row => row.productCode) }, active: true } });
  const groups = new Map<string, Array<{ row: Record<string, string>; index: number }>>();
  for (const [index, row] of input.rows.entries()) {
    if (!/^\d+$/.test(row.quantity) || Number(row.quantity) < 1 || Number(row.quantity) > 1_000_000) throw new Error(rowIssue(index, "quantity must be a whole number from 1 to 1,000,000."));
    if ((row.reference || "").length > 64 || (row.notes || "").length > 4000) throw new Error(rowIssue(index, "reference or notes are too long."));
    if (row[dateKey]) importDay(row[dateKey], index);
    if (row.unitPrice && (!/^\d+(\.\d{1,2})?$/.test(row.unitPrice) || Number(row.unitPrice) * 100 > 2147483647)) throw new Error(rowIssue(index, "unit price must be a non-negative amount with up to two decimal places."));
    const ref = row.reference || `${quotes ? "Q" : "SO"}-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
    groups.set(ref, [...(groups.get(ref) ?? []), { row, index }]);
  }
  const preview: Record<string, string>[] = [];
  for (const [reference, rows] of groups) {
    const first = rows[0].row;
    const customer = customers.find(customer => customer.customerCode === first.customerCode);
    if (!customer || !["ACTIVE", "PROSPECT"].includes(customer.status)) throw new Error(rowIssue(rows[0].index, `customer ${first.customerCode} is missing or unavailable.`));
    if (customer.hierarchyRole === "DELIVERY") throw new Error(rowIssue(rows[0].index, "choose a trading customer rather than a delivery-only account."));
    const existing = quotes ? await tx.quote.findFirst({ where: { organisationId: input.organisationId, reference }, select: { id: true } }) : await tx.salesOrder.findFirst({ where: { organisationId: input.organisationId, reference }, select: { id: true } });
    if (existing) throw new Error(rowIssue(rows[0].index, `reference ${reference} already exists; no existing document is overwritten.`));
    const address = customer.addresses.find(address => address.id === customer.commercialSettings?.defaultDeliveryAddressId) ?? customer.addresses.find(address => address.isDefaultDelivery);
    const invoice = customer.addresses.find(address => address.isDefaultBilling);
    const snapshot = (value: typeof address) => value ? { line1: value.line1, line2: value.line2, city: value.city, region: value.region, postcode: value.postcode, country: value.country } : undefined;
    const lines = [];
    let currency = "";
    for (const { row, index } of rows) {
      const product = products.find(product => product.code === row.productCode);
      if (!product) throw new Error(rowIssue(index, `active product ${row.productCode} is missing.`));
      const resolved = await resolvePrice({ organisationId: input.organisationId, partyId: customer.id, productId: product.id, quantity: Number(row.quantity) });
      if (resolved.currency !== customer.preferredCurrency || (currency && currency !== resolved.currency)) throw new Error(rowIssue(index, "customer and pricing currencies differ. Review the customer pricing setup first."));
      currency = resolved.currency;
      const unit = row.unitPrice ? Math.round(Number(row.unitPrice) * 100) : resolved.unitPriceAmount;
      const discount = row.unitPrice ? 0 : resolved.discountPercent;
      const net = commercialLineNet(unit, Number(row.quantity), discount);
      const tax = vatOnNet(net, product.taxCategory, address?.country).amount;
      if (!Number.isSafeInteger(net + tax) || net + tax > 2147483647) throw new Error(rowIssue(index, "line total is too large."));
      lines.push({ productId: product.id, lineNumber: lines.length + 1, type: product.kind === "SERVICE" ? "SERVICE" as const : product.kind === "CHARGE" ? "CHARGE" as const : "PRODUCT" as const, description: product.name, quantity: Number(row.quantity), unit, discount, net, tax, unitOfMeasure: product.unitOfMeasure, taxCategory: product.taxCategory, priceSource: row.unitPrice ? "Connections override" : resolved.source });
    }
    const netAmount = lines.reduce((sum, line) => sum + line.net, 0), taxAmount = lines.reduce((sum, line) => sum + line.tax, 0);
    if (netAmount + taxAmount > 2147483647) throw new Error(`Document ${reference} is too large.`);
    preview.push({ reference: first.reference || "Auto-generated on import", customer: customer.name, lines: String(lines.length), currency, net: (netAmount / 100).toFixed(2), tax: (taxAmount / 100).toFixed(2), total: ((netAmount + taxAmount) / 100).toFixed(2), status: "DRAFT" });
    if (!input.applying) continue;
    const common = { organisationId: input.organisationId, partyId: customer.id, reference, ownerUserId: input.actorUserId, netAmount, taxAmount, customerNotes: first.notes || null, invoiceAddressSnapshot: snapshot(invoice), deliveryAddressSnapshot: snapshot(address) };
    if (quotes) await tx.quote.create({ data: { ...common, status: "DRAFT", kind: "STANDARD", totalCurrency: currency, totalAmount: netAmount + taxAmount, expiryDate: first.expiryDate ? importDay(first.expiryDate, rows[0].index) : null, lines: { create: lines.map(line => ({ productId: line.productId, lineNumber: line.lineNumber, type: line.type, description: line.description, quantity: line.quantity, unitAmount: line.unit, discountPercent: line.discount, netAmount: line.net, taxAmount: line.tax, taxCategory: line.taxCategory, unitOfMeasure: line.unitOfMeasure, priceSource: line.priceSource, currency })) } } });
    else await tx.salesOrder.create({ data: { ...common, commercialStatus: "DRAFT", orderType: "STANDARD", currency, grossAmount: netAmount + taxAmount, requestedDeliveryDate: first.deliveryDate ? importDay(first.deliveryDate, rows[0].index) : null, allowPartialDelivery: customer.commercialSettings?.partialShipmentAllowed ?? true, lines: { create: lines.map(line => ({ productId: line.productId, lineNumber: line.lineNumber, type: line.type, descriptionSnapshot: line.description, orderedQuantity: line.quantity, unitPriceAmount: line.unit, discountPercent: line.discount, netAmount: line.net, taxAmount: line.tax, taxCategory: line.taxCategory, unitOfMeasure: line.unitOfMeasure, priceSource: line.priceSource })) } } });
  }
  return preview.slice(0, 10);
}
