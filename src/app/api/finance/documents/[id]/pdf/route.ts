import { requireSession } from "@/core/auth/session";
import { assertCapability } from "@/core/permissions/check";
import { assertModuleEnabled } from "@/core/modules/access";
import { db } from "@/core/db/client";
import { documentBrandFrom } from "@/core/documents/company-brand";
import { buildQuotePdf } from "@/modules/sales/services/quote-pdf";
import { documentCapability, documentScope } from "@/modules/finance/services/access";

const CUSTOMER_COPY = { AR_INVOICE: "Tax invoice", AR_CREDIT: "Credit note", AR_DEBIT: "Debit note" } as const;

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireSession();
  assertCapability(session, "finance.overview.read");
  await assertModuleEnabled(session, "finance");
  const { id } = await params;
  const doc = await db.financeDocument.findFirst({
    where: { AND: [documentScope(session), { id }] },
    include: {
      lines: { orderBy: { number: "asc" }, include: { product: { select: { code: true } } } },
      party: { include: { addresses: { where: { active: true } } } },
      salesOrder: { select: { customerPoReference: true, invoiceAddressSnapshot: true, deliveryAddressSnapshot: true } },
    },
  });
  const documentType = doc ? CUSTOMER_COPY[doc.kind as keyof typeof CUSTOMER_COPY] : undefined;
  if (!doc || !documentType || !doc.party) return new Response("Customer invoice not found", { status: 404 });
  assertCapability(session, documentCapability(doc.kind));
  const organisation = await db.organisation.findUniqueOrThrow({ where: { id: session.organisationId }, select: { name: true, logoDataUrl: true, companyProfile: true } });
  const billing = doc.party.addresses.find((address) => address.isDefaultBilling) ?? doc.party.addresses.find((address) => address.type === "BILLING");
  const delivery = doc.party.addresses.find((address) => address.isDefaultDelivery) ?? doc.party.addresses.find((address) => address.type === "DELIVERY");
  const fromAccount = (address: NonNullable<typeof billing> | undefined) => address ? { label: address.label, line1: address.line1, line2: address.line2, city: address.city, region: address.region, postcode: address.postcode, country: address.country } : null;
  const bytes = await buildQuotePdf({
    documentType,
    brand: documentBrandFrom(organisation),
    dueDate: doc.dueAt,
    reference: doc.reference,
    organisationName: organisation.name,
    customerName: doc.party.name,
    customerCode: doc.party.customerCode,
    status: doc.status,
    createdAt: doc.documentDate,
    expiryDate: null,
    customerPoReference: doc.salesOrder?.customerPoReference ?? doc.externalReference,
    paymentTerms: null,
    currency: doc.currency,
    invoiceAddress: doc.salesOrder?.invoiceAddressSnapshot ?? fromAccount(billing),
    deliveryAddress: doc.salesOrder?.deliveryAddressSnapshot ?? fromAccount(delivery),
    netAmount: Number(doc.net),
    taxAmount: Number(doc.tax),
    totalAmount: Number(doc.gross),
    vatLabel: "VAT",
    lines: doc.lines.map((line) => ({
      description: line.description,
      code: line.product?.code ?? null,
      quantity: Number(line.quantity.toString()),
      unitAmount: Number(line.unitPrice),
      discountPercent: 0,
      netAmount: Number(line.net),
      taxAmount: Number(line.tax),
    })),
  });
  const name = doc.reference.replace(/[^a-zA-Z0-9_-]/g, "_");
  return new Response(Buffer.from(bytes), { headers: { "Content-Type": "application/pdf", "Content-Disposition": `${new URL(request.url).searchParams.get("preview") === "1" ? "inline" : "attachment"}; filename="${name}.pdf"`, "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff" } });
}
