import { z } from "zod";
import { db } from "@/core/db/client";
import type { SupplySpendProvider } from "@/core/supply/types";
import { documentScope, requireFinance } from "./access";
import { signedSpend, spendBreakdown, unbilledCommitment } from "../domain/supply-spend";

const day = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine((value) => { const date = new Date(value); return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value; }, "Choose a valid date.");
export const spendRequestSchema = z.object({ entity: z.string().max(100).optional(), start: day, end: day, group: z.enum(["supplier", "category", "costCentre", "site", "month"]) }).refine((input) => input.start <= input.end, "Reporting end must follow start.");

export const supplySpendProvider: SupplySpendProvider = async (session, input) => {
  await requireFinance(session, "finance.report.read");
  const request = spendRequestSchema.parse(input);
  const organisationId = session.organisationId;
  const entities = await db.financeEntity.findMany({ where: { organisationId }, select: { id: true, name: true, currency: true }, orderBy: { name: "asc" } });
  const entity = request.entity ? entities.find((item) => item.id === request.entity) : entities[0];
  if (request.entity && !entity) throw new Error("Choose a legal entity in your company.");
  if (!entity) return { entities, entity: null, start: request.start, end: request.end, totals: [], groups: [], documents: [], purchaseCount: 0, warnings: ["Configure a Finance legal entity before reporting spend."] };
  const start = new Date(`${request.start}T00:00:00.000Z`), end = new Date(`${request.end}T23:59:59.999Z`);
  const payables = session.capabilities.has("finance.payables.read"), purchasing = session.capabilities.has("finance.purchase.read");
  const scope = documentScope(session);
  const [posted, orders, receipts, open] = await Promise.all([
    payables ? db.financeDocument.findMany({ where: { AND: [scope, { entityId: entity.id, kind: { in: ["AP_INVOICE", "AP_CREDIT", "AP_DEBIT"] }, status: "POSTED", OR: [{ accountingDate: { gte: start, lte: end } }, { accountingDate: null, documentDate: { gte: start, lte: end } }] }] }, include: { party: { select: { name: true } } }, orderBy: [{ accountingDate: "desc" }, { documentDate: "desc" }], take: 10001 }) : [],
    purchasing && payables ? db.financeDocument.findMany({ where: { AND: [scope, { entityId: entity.id, kind: "PO", status: { in: ["APPROVED", "PART_RECEIVED", "RECEIVED"] }, documentDate: { lte: end } }] }, select: { net: true, currency: true, children: { where: { AND: [scope, { kind: "AP_INVOICE", status: "POSTED", OR: [{ accountingDate: { lte: end } }, { accountingDate: null, documentDate: { lte: end } }] }] }, select: { net: true, currency: true } } }, take: 10001 }) : [],
    purchasing ? db.financeDocument.groupBy({ by: ["currency"], where: { AND: [scope, { entityId: entity.id, kind: "RECEIPT", status: "POSTED", documentDate: { gte: start, lte: end } }] }, _sum: { net: true } }) : [],
    payables ? db.financeDocument.groupBy({ by: ["currency", "kind"], where: { AND: [scope, { entityId: entity.id, kind: { in: ["AP_INVOICE", "AP_CREDIT", "AP_DEBIT"] }, status: "POSTED" }] }, _sum: { gross: true, settled: true } }) : [],
  ]);
  if (posted.length > 10000 || orders.length > 10000) throw new Error("More than 10,000 source documents. Choose a narrower reporting period or legal entity.");
  // A missing capability never becomes a misleading zero; totals remain unavailable.
  const currencies = [...new Set([entity.currency, ...posted.map((doc) => doc.currency), ...orders.map((doc) => doc.currency), ...receipts.map((row) => row.currency), ...open.map((row) => row.currency)])].sort();
  const warnings = ["Amounts stay in each source currency; net spend excludes VAT. Receipts and commitments are separate measures and must not be added to posted spend.", "Open payables show the current unsettled supplier-document balance, including credits. They are not a historical cash or bank-payment report.", "This report covers authorised supplier documents for the selected entity, including non-manufacturing purchases. WIP valuation, absorbed labour/overheads and production cost variance are not included."];
  if (!payables) warnings.push("Supplier document amounts require Payables read access.");
  if (!purchasing) warnings.push("Purchase commitments and receipts require Purchasing read access.");
  if (posted.some((doc) => !doc.accountingDate)) warnings.push("Some posted records have no accounting date; their document date is used.");
  if (posted.length > 200) warnings.push(`Totals cover all ${posted.length} posted documents; the latest 200 are shown below. Use Finance to browse the full list.`);
  return {
    entities, entity, start: request.start, end: request.end,
    totals: currencies.map((currency) => ({ currency,
      postedNet: payables ? posted.filter((doc) => doc.currency === currency).reduce((sum, doc) => sum + signedSpend(doc.kind, doc.net), 0n).toString() : null,
      committedNet: purchasing && payables ? orders.filter((doc) => doc.currency === currency).reduce((sum, doc) => sum + unbilledCommitment(doc), 0n).toString() : null,
      receivedNet: purchasing ? (receipts.find((row) => row.currency === currency)?._sum.net ?? 0n).toString() : null,
      openPayables: payables ? open.filter((row) => row.currency === currency).reduce((sum, row) => sum + signedSpend(row.kind, (row._sum.gross ?? 0n) - (row._sum.settled ?? 0n)), 0n).toString() : null,
    })),
    groups: spendBreakdown(posted.map((doc) => ({ ...doc, children: [] })), request.group),
    documents: posted.slice(0, 200).map((doc) => ({ id: doc.id, reference: doc.reference, supplier: doc.party?.name ?? "Unassigned supplier", kind: doc.kind, date: (doc.accountingDate ?? doc.documentDate).toISOString().slice(0, 10), currency: doc.currency, net: signedSpend(doc.kind, doc.net).toString(), sourceId: null, sourceReference: null })),
    purchaseCount: orders.length, warnings,
  };
};
