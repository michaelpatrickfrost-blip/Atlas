-- Customer invoice templates, and the export proforma raised with the sale.
CREATE TYPE "InvoiceTemplateKind" AS ENUM ('DOMESTIC', 'EXPORT');

CREATE TABLE "invoice_document_templates" (
    "id" TEXT NOT NULL,
    "organisationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "kind" "InvoiceTemplateKind" NOT NULL,
    "blocks" TEXT[] NOT NULL,
    "exporterEori" TEXT,
    "footer" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "invoice_document_templates_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "invoice_document_templates_organisationId_name_key" ON "invoice_document_templates"("organisationId", "name");
CREATE INDEX "invoice_document_templates_organisationId_idx" ON "invoice_document_templates"("organisationId");
ALTER TABLE "invoice_document_templates" ADD CONSTRAINT "invoice_document_templates_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "organisations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "customer_invoice_templates" (
    "id" TEXT NOT NULL,
    "organisationId" TEXT NOT NULL,
    "partyId" TEXT NOT NULL,
    "templateId" TEXT NOT NULL,
    "invoiceAddressId" TEXT,
    "deliveryAddressId" TEXT,
    "notifyAddressId" TEXT,
    "buyerEori" TEXT,
    "buyerVat" TEXT,
    "marks" TEXT,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "customer_invoice_templates_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "customer_invoice_templates_partyId_templateId_key" ON "customer_invoice_templates"("partyId", "templateId");
CREATE UNIQUE INDEX "customer_invoice_templates_one_default" ON "customer_invoice_templates"("partyId") WHERE "isDefault";
CREATE INDEX "customer_invoice_templates_organisationId_partyId_idx" ON "customer_invoice_templates"("organisationId", "partyId");
ALTER TABLE "customer_invoice_templates" ADD CONSTRAINT "customer_invoice_templates_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "organisations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "customer_invoice_templates" ADD CONSTRAINT "customer_invoice_templates_partyId_fkey" FOREIGN KEY ("partyId") REFERENCES "parties"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "customer_invoice_templates" ADD CONSTRAINT "customer_invoice_templates_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "invoice_document_templates"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "sales_quotes" ADD COLUMN "invoiceAssignmentId" TEXT;
ALTER TABLE "sales_orders" ADD COLUMN "invoiceAssignmentId" TEXT;
CREATE INDEX "sales_quotes_invoiceAssignmentId_idx" ON "sales_quotes"("invoiceAssignmentId");
CREATE INDEX "sales_orders_invoiceAssignmentId_idx" ON "sales_orders"("invoiceAssignmentId");
ALTER TABLE "sales_quotes" ADD CONSTRAINT "sales_quotes_invoiceAssignmentId_fkey" FOREIGN KEY ("invoiceAssignmentId") REFERENCES "customer_invoice_templates"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "sales_orders" ADD CONSTRAINT "sales_orders_invoiceAssignmentId_fkey" FOREIGN KEY ("invoiceAssignmentId") REFERENCES "customer_invoice_templates"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "sales_proformas" (
    "id" TEXT NOT NULL,
    "organisationId" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "templateId" TEXT,
    "reference" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "incoterms" TEXT,
    "namedPlace" TEXT,
    "countryOfDestination" TEXT,
    "portOfLoading" TEXT,
    "portOfDischarge" TEXT,
    "packageCount" INTEGER,
    "packageType" TEXT,
    "marks" TEXT,
    "reasonForExport" TEXT,
    "buyerEori" TEXT,
    "buyerVat" TEXT,
    "netWeightGrams" INTEGER,
    "grossWeightGrams" INTEGER,
    "volumeMl" INTEGER,
    "missing" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "snapshot" JSONB NOT NULL,
    "issuedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "sales_proformas_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "sales_proformas_orderId_key" ON "sales_proformas"("orderId");
CREATE UNIQUE INDEX "sales_proformas_organisationId_reference_key" ON "sales_proformas"("organisationId", "reference");
ALTER TABLE "sales_proformas" ADD CONSTRAINT "sales_proformas_status_check" CHECK ("status" IN ('DRAFT', 'ISSUED'));
ALTER TABLE "sales_proformas" ADD CONSTRAINT "sales_proformas_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "organisations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "sales_proformas" ADD CONSTRAINT "sales_proformas_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "sales_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "sales_proformas" ADD CONSTRAINT "sales_proformas_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "invoice_document_templates"("id") ON DELETE SET NULL ON UPDATE CASCADE;
