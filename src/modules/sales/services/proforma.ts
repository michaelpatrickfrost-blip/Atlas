import type { Prisma } from "@/generated/prisma/client";
import { db } from "@/core/db/client";
import { readCompanyProfile } from "@/core/setup/company-profile";
import {
  buildProformaFacts, exportReadyMessage, measuresOf, PROFORMA_STATEMENT, readExportHeader, type ExportHeader,
} from "../domain/invoice-templates";

type Writer = Prisma.TransactionClient;

function sellerFrom(profile: ReturnType<typeof readCompanyProfile>, name: string, eori: string | null) {
  return {
    name: profile.legalName || name,
    vat: profile.vatNumber,
    eori,
    address: [profile.addressLine1, profile.city, profile.postcode, profile.country].filter(Boolean).join(", "),
  };
}

export async function syncOrderProforma(tx: Writer, input: {
  organisationId: string;
  orderId: string;
  partyId: string;
  assignmentId: string | null;
  currency: string;
  customerPo: string | null;
  paymentTermId: string | null;
  invoiceAddress: unknown;
  deliveryAddress: unknown;
  notifyAddress: unknown;
  header: ExportHeader;
  lines: Array<{ type: string; description: string; productId: string | null; quantity: number; unitAmount: number; netAmount: number }>;
}) {
  const existing = await tx.salesProforma.findFirst({ where: { orderId: input.orderId, organisationId: input.organisationId } });
  if (!input.assignmentId) {
    if (existing?.status === "DRAFT") await tx.salesProforma.delete({ where: { id: existing.id } });
    if (existing?.status === "ISSUED") throw new Error("This export proforma is already issued with the sale.");
    return;
  }
  const assignment = await tx.customerInvoiceTemplate.findFirst({
    where: { id: input.assignmentId, organisationId: input.organisationId, partyId: input.partyId },
    include: { template: true, party: { select: { name: true, customerCode: true } } },
  });
  if (!assignment?.template.active) throw new Error("Choose an invoice template from this customer account.");
  if (assignment.template.kind !== "EXPORT") {
    if (existing?.status === "DRAFT") await tx.salesProforma.delete({ where: { id: existing.id } });
    if (existing?.status === "ISSUED") throw new Error("This export proforma is already issued with the sale.");
    return;
  }
  if (existing?.status === "ISSUED") throw new Error("This export proforma is already issued with the sale.");
  const [organisation, term, products] = await Promise.all([
    tx.organisation.findUniqueOrThrow({ where: { id: input.organisationId }, select: { name: true, companyProfile: true } }),
    input.paymentTermId ? tx.paymentTerm.findFirst({ where: { id: input.paymentTermId, organisationId: input.organisationId }, select: { name: true } }) : null,
    tx.product.findMany({ where: { organisationId: input.organisationId, id: { in: input.lines.map((line) => line.productId).filter((id): id is string => Boolean(id)) } } }),
  ]);
  const profile = readCompanyProfile(organisation.companyProfile);
  const seller = sellerFrom(profile, organisation.name, assignment.template.exporterEori);
  const destination = input.deliveryAddress && typeof input.deliveryAddress === "object" ? String((input.deliveryAddress as { country?: string }).country ?? "") || null : null;
  const facts = buildProformaFacts({
    blocks: assignment.template.blocks,
    header: input.header,
    destinationCountry: destination,
    invoiceAddress: input.invoiceAddress,
    deliveryAddress: input.deliveryAddress,
    sellerEori: seller.eori,
    lines: input.lines.map((line) => ({
      ...line,
      code: products.find((product) => product.id === line.productId)?.code ?? null,
      measures: measuresOf(products.find((product) => product.id === line.productId)),
    })),
  });
  const snapshot = {
    statement: PROFORMA_STATEMENT,
    templateName: assignment.template.name,
    blocks: assignment.template.blocks,
    footer: assignment.template.footer,
    seller,
    buyer: { name: assignment.party.name, code: assignment.party.customerCode, eori: input.header.buyerEori, vat: input.header.buyerVat },
    invoiceAddress: input.invoiceAddress ?? null,
    deliveryAddress: input.deliveryAddress ?? null,
    notifyAddress: input.notifyAddress ?? null,
    customerPo: input.customerPo,
    paymentTerms: term?.name ?? null,
    currency: input.currency,
    header: input.header,
    destinationCountry: destination,
    lines: facts.lines,
    totals: facts.totals,
    missing: facts.missing,
  };
  const data = {
    templateId: assignment.templateId,
    incoterms: input.header.incoterms,
    namedPlace: input.header.namedPlace,
    countryOfDestination: destination,
    portOfLoading: input.header.portOfLoading,
    portOfDischarge: input.header.portOfDischarge,
    packageCount: input.header.packageCount,
    packageType: input.header.packageType,
    marks: input.header.marks,
    reasonForExport: input.header.reasonForExport,
    buyerEori: input.header.buyerEori,
    buyerVat: input.header.buyerVat,
    netWeightGrams: facts.totals.netGrams,
    grossWeightGrams: facts.totals.grossGrams,
    volumeMl: facts.totals.volumeMl,
    missing: facts.missing,
    snapshot,
  };
  if (existing) await tx.salesProforma.update({ where: { id: existing.id }, data });
  else await tx.salesProforma.create({ data: { ...data, organisationId: input.organisationId, orderId: input.orderId, reference: `PF-${crypto.randomUUID().slice(0, 8).toUpperCase()}`, status: "DRAFT" } });
}

/** Refresh the draft proforma from the products and refuse confirmation while export facts are missing. */
export async function prepareExportProforma(organisationId: string, orderId: string) {
  const order = await db.salesOrder.findFirst({
    where: { id: orderId, organisationId },
    include: { lines: { include: { product: true } }, proforma: true, invoiceAssignment: { include: { template: true } }, paymentTerm: true, party: true },
  });
  if (!order?.invoiceAssignment || order.invoiceAssignment.template.kind !== "EXPORT") return;
  if (!order.proforma) throw new Error("Save the sale again so the export proforma is raised.");
  if (order.proforma.status === "ISSUED") return;
  const organisation = await db.organisation.findUniqueOrThrow({ where: { id: organisationId }, select: { name: true, companyProfile: true } });
  const profile = readCompanyProfile(organisation.companyProfile);
  const seller = sellerFrom(profile, organisation.name, order.invoiceAssignment.template.exporterEori);
  const header = readExportHeader({
    incoterms: order.proforma.incoterms, namedPlace: order.proforma.namedPlace, portOfLoading: order.proforma.portOfLoading,
    portOfDischarge: order.proforma.portOfDischarge, packageCount: order.proforma.packageCount ?? "", packageType: order.proforma.packageType,
    shippingMarks: order.proforma.marks, reasonForExport: order.proforma.reasonForExport, buyerEori: order.proforma.buyerEori, buyerVat: order.proforma.buyerVat,
  });
  const destination = (order.deliveryAddressSnapshot as { country?: string } | null)?.country ?? null;
  const facts = buildProformaFacts({
    blocks: order.invoiceAssignment.template.blocks,
    header,
    destinationCountry: destination,
    invoiceAddress: order.invoiceAddressSnapshot,
    deliveryAddress: order.deliveryAddressSnapshot,
    sellerEori: seller.eori,
    lines: order.lines.map((line) => ({
      type: line.type, description: line.descriptionSnapshot, code: line.product?.code, quantity: line.orderedQuantity - line.cancelledQuantity,
      unitAmount: line.unitPriceAmount, netAmount: line.netAmount, measures: measuresOf(line.product),
    })),
  });
  const previous = order.proforma.snapshot && typeof order.proforma.snapshot === "object" ? order.proforma.snapshot as Record<string, unknown> : {};
  await db.salesProforma.update({
    where: { id: order.proforma.id },
    data: {
      missing: facts.missing, netWeightGrams: facts.totals.netGrams, grossWeightGrams: facts.totals.grossGrams, volumeMl: facts.totals.volumeMl,
      snapshot: { ...previous, seller, lines: facts.lines, totals: facts.totals, missing: facts.missing, statement: PROFORMA_STATEMENT },
    },
  });
  const message = exportReadyMessage(facts.missing);
  if (message) throw new Error(message);
}

export async function issueExportProforma(tx: Writer, organisationId: string, orderId: string) {
  await tx.salesProforma.updateMany({ where: { organisationId, orderId, status: "DRAFT" }, data: { status: "ISSUED", issuedAt: new Date() } });
}
