// Live-DB scenario: a delivered shipment raises one draft invoice, opens books when a company has none,
// and is repeat-safe. Run with DATABASE_URL set: ./node_modules/.bin/tsx scripts/check-delivery-invoice.ts
// (creates and then deletes a Test company).
import { db } from "@/core/db/client";
import { wipeCompany } from "@/core/admin/wipe-company";
import { invoiceDeliveredShipment } from "@/modules/finance/services/delivery-invoice";

const ok = (label: string, cond: boolean, extra = "") => { console.log(`${cond ? "PASS" : "FAIL"}  ${label} ${extra}`); if (!cond) process.exitCode = 1; };

async function main() {
  const tag = Date.now().toString(36);
  const org = await db.organisation.create({ data: { name: `INVTEST ${tag}`, slug: `invtest-${tag}`, isTest: true } });
  const user = await db.user.create({ data: { name: "T", email: `invtest-${tag}@example.invalid`, passwordHash: "x" } });
  const session = { userId: user.id, userName: "T", userEmail: user.email, organisationId: org.id, organisationName: org.name, membershipId: "m", capabilities: new Set<string>() } as never;
  try {
    const party = await db.party.create({ data: { organisationId: org.id, kind: "COMPANY", name: "Customer", customerCode: "C000001" } });
    const product = await db.product.create({ data: { organisationId: org.id, code: "PIPE", name: "Pipe", basePriceAmount: 1000 } });
    const order = await db.salesOrder.create({ data: { organisationId: org.id, partyId: party.id, reference: `SO-${tag}`, ownerUserId: user.id, commercialStatus: "CONFIRMED", currency: "GBP", netAmount: 10000, taxAmount: 2000, grossAmount: 12000,
      lines: { create: [{ lineNumber: 1, productId: product.id, descriptionSnapshot: "Pipe", orderedQuantity: 10, unitPriceAmount: 1000, netAmount: 10000, taxAmount: 2000, taxCategory: "STANDARD" }] } }, include: { lines: true } });
    const line = order.lines[0];
    ok("company starts with no finance books", (await db.financeEntity.count({ where: { organisationId: org.id } })) === 0);

    // part delivery: 4 of 10
    await invoiceDeliveredShipment(session, { shipmentId: `ship-a-${tag}`, shipmentReference: "SH-A", deliveredAt: new Date(), lines: [{ salesOrderId: order.id, salesOrderLineId: line.id, quantity: 4 }] });
    const books = await db.financeEntity.findMany({ where: { organisationId: org.id } });
    ok("books were opened automatically in GBP", books.length === 1 && books[0].currency === "GBP");
    ok("standard chart of accounts created", (await db.financeAccount.count({ where: { organisationId: org.id } })) === 14);
    let invoices = await db.financeDocument.findMany({ where: { organisationId: org.id, kind: "AR_INVOICE" }, include: { lines: true } });
    ok("one draft invoice raised for the part delivery", invoices.length === 1, `n=${invoices.length}`);
    ok("invoice is for 4 units: net 40.00, VAT 8.00, gross 48.00", invoices[0]?.net === 4000n && invoices[0]?.tax === 800n && invoices[0]?.gross === 4800n, `net=${invoices[0]?.net} tax=${invoices[0]?.tax}`);
    ok("invoice is linked to the order, the customer and the order line", invoices[0]?.salesOrderId === order.id && invoices[0]?.partyId === party.id && invoices[0]?.lines[0]?.salesOrderLineId === line.id);
    ok("invoice is a draft for Finance to post", invoices[0]?.status === "DRAFT", `status=${invoices[0]?.status}`);

    // the same delivery reported again must not invoice twice
    await invoiceDeliveredShipment(session, { shipmentId: `ship-a-${tag}`, shipmentReference: "SH-A", deliveredAt: new Date(), lines: [{ salesOrderId: order.id, salesOrderLineId: line.id, quantity: 4 }] });
    ok("repeating the same delivery does not invoice twice", (await db.financeDocument.count({ where: { organisationId: org.id, kind: "AR_INVOICE" } })) === 1);

    // second delivery over-reports 10; only the 6 still open may be invoiced
    await invoiceDeliveredShipment(session, { shipmentId: `ship-b-${tag}`, shipmentReference: "SH-B", deliveredAt: new Date(), lines: [{ salesOrderId: order.id, salesOrderLineId: line.id, quantity: 10 }] });
    invoices = await db.financeDocument.findMany({ where: { organisationId: org.id, kind: "AR_INVOICE" }, include: { lines: true }, orderBy: { createdAt: "asc" } });
    ok("second delivery raises a second invoice", invoices.length === 2, `n=${invoices.length}`);
    ok("second invoice is capped at the 6 still open: net 60.00", invoices[1]?.net === 6000n, `net=${invoices[1]?.net}`);
    ok("order is never invoiced for more than was ordered", invoices.reduce((sum, row) => sum + row.net, 0n) === 10000n);
    ok("no second set of books", (await db.financeEntity.count({ where: { organisationId: org.id } })) === 1);

    // a third delivery has nothing left to invoice
    await invoiceDeliveredShipment(session, { shipmentId: `ship-c-${tag}`, shipmentReference: "SH-C", deliveredAt: new Date(), lines: [{ salesOrderId: order.id, salesOrderLineId: line.id, quantity: 1 }] });
    ok("nothing more is invoiced once the order is fully invoiced", (await db.financeDocument.count({ where: { organisationId: org.id, kind: "AR_INVOICE" } })) === 2);
  } finally {
    await wipeCompany(org.id);
    await db.user.deleteMany({ where: { id: user.id } });
    console.log("cleanup: test companies left =", await db.organisation.count({ where: { slug: { startsWith: "invtest-" } } }));
  }
}
main().then(() => process.exit(process.exitCode ?? 0)).catch((e) => { console.error("ERROR", e?.message ?? e); process.exit(1); });
