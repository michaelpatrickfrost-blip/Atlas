-- CreateEnum
CREATE TYPE "ProductKind" AS ENUM ('PRODUCT', 'SERVICE', 'CHARGE');

-- CreateEnum
CREATE TYPE "CommercialOrderStatus" AS ENUM ('DRAFT', 'PENDING_APPROVAL', 'CONFIRMED', 'ON_HOLD', 'CANCELLED', 'CLOSED');

-- CreateEnum
CREATE TYPE "OrderType" AS ENUM ('STANDARD', 'PROJECT', 'BLANKET', 'CALL_OFF', 'SAMPLE', 'REPLACEMENT', 'INTERNAL');

-- CreateEnum
CREATE TYPE "OrderLineType" AS ENUM ('PRODUCT', 'SERVICE', 'CHARGE', 'DISCOUNT', 'TEXT');

-- CreateEnum
CREATE TYPE "OrderHoldType" AS ENUM ('CREDIT', 'PRICING_APPROVAL', 'CUSTOMER_REQUEST', 'COMPLIANCE', 'STOCK_REVIEW', 'DELIVERY_ISSUE', 'MANUAL');

-- CreateEnum
CREATE TYPE "OrderChangeType" AS ENUM ('CUSTOMER', 'QUANTITY', 'PRICE', 'PRODUCT', 'REQUESTED_DATE', 'DELIVERY_ADDRESS', 'REFERENCE', 'STATUS', 'CANCELLATION', 'PRICE_OVERRIDE');

-- CreateEnum
CREATE TYPE "OrderApprovalStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- AlterTable
ALTER TABLE "sales_orders" ADD COLUMN     "allowPartialDelivery" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "cancelledAt" TIMESTAMP(3),
ADD COLUMN     "closedAt" TIMESTAMP(3),
ADD COLUMN     "commercialStatus" "CommercialOrderStatus" NOT NULL DEFAULT 'DRAFT',
ADD COLUMN     "confirmationDate" TIMESTAMP(3),
ADD COLUMN     "contractReference" TEXT,
ADD COLUMN     "currency" TEXT NOT NULL DEFAULT 'GBP',
ADD COLUMN     "customerNotes" TEXT,
ADD COLUMN     "customerPoReference" TEXT,
ADD COLUMN     "deliveryAddressSnapshot" JSONB,
ADD COLUMN     "deliveryContactId" TEXT,
ADD COLUMN     "deliveryInstructions" TEXT,
ADD COLUMN     "deliveryTerms" TEXT,
ADD COLUMN     "discountAmount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "expiryDate" TIMESTAMP(3),
ADD COLUMN     "externalReference" TEXT,
ADD COLUMN     "grossAmount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "incoterms" TEXT,
ADD COLUMN     "internalNotes" TEXT,
ADD COLUMN     "invoiceAddressSnapshot" JSONB,
ADD COLUMN     "invoiceContactId" TEXT,
ADD COLUMN     "latestAcceptableDate" TIMESTAMP(3),
ADD COLUMN     "netAmount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "opportunityId" TEXT,
ADD COLUMN     "orderContactId" TEXT,
ADD COLUMN     "orderDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "orderType" "OrderType" NOT NULL DEFAULT 'STANDARD',
ADD COLUMN     "ownerUserId" TEXT,
ADD COLUMN     "paymentTermId" TEXT,
ADD COLUMN     "priceListId" TEXT,
ADD COLUMN     "projectReference" TEXT,
ADD COLUMN     "promisedDeliveryDate" TIMESTAMP(3),
ADD COLUMN     "requestedDeliveryDate" TIMESTAMP(3),
ADD COLUMN     "revision" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "taxAmount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "teamId" TEXT;

-- AlterTable
ALTER TABLE "sales_quotes" ADD COLUMN     "deliveryAddressSnapshot" JSONB,
ADD COLUMN     "invoiceAddressSnapshot" JSONB,
ADD COLUMN     "projectId" TEXT;

-- Preserve existing commercial records while upgrading the order model.
UPDATE "sales_orders" SET "grossAmount" = "totalAmount", "netAmount" = "totalAmount", "currency" = "totalCurrency",
 "commercialStatus" = CASE "status"::text WHEN 'FULFILLED' THEN 'CLOSED' WHEN 'CANCELLED' THEN 'CANCELLED' ELSE 'CONFIRMED' END::"CommercialOrderStatus",
 "ownerUserId" = (SELECT m."userId" FROM "memberships" m WHERE m."organisationId" = "sales_orders"."organisationId" ORDER BY m."createdAt" LIMIT 1);
ALTER TABLE "sales_orders" ALTER COLUMN "ownerUserId" SET NOT NULL;
ALTER TABLE "sales_orders" DROP COLUMN "status", DROP COLUMN "totalAmount", DROP COLUMN "totalCurrency";

-- DropEnum
DROP TYPE "SalesOrderStatus";

-- CreateTable
CREATE TABLE "products" (
    "id" TEXT NOT NULL,
    "organisationId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "kind" "ProductKind" NOT NULL DEFAULT 'PRODUCT',
    "unitOfMeasure" TEXT NOT NULL DEFAULT 'each',
    "basePriceAmount" INTEGER NOT NULL,
    "baseCurrency" TEXT NOT NULL DEFAULT 'GBP',
    "taxCategory" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "customer_products" (
    "id" TEXT NOT NULL,
    "partyId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "customerProductCode" TEXT,
    "customerDescription" TEXT,
    "contractedPriceAmount" INTEGER,
    "contractedPriceCurrency" TEXT DEFAULT 'GBP',
    "packQuantity" INTEGER,
    "preferredDeliveryUnit" TEXT,

    CONSTRAINT "customer_products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "price_lists" (
    "id" TEXT NOT NULL,
    "organisationId" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'GBP',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "price_lists_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "price_list_entries" (
    "id" TEXT NOT NULL,
    "priceListId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "unitPriceAmount" INTEGER NOT NULL,
    "minimumQuantity" INTEGER NOT NULL DEFAULT 1,
    "validFrom" TIMESTAMP(3),
    "validTo" TIMESTAMP(3),

    CONSTRAINT "price_list_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sales_order_lines" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "lineNumber" INTEGER NOT NULL,
    "type" "OrderLineType" NOT NULL DEFAULT 'PRODUCT',
    "productId" TEXT,
    "descriptionSnapshot" TEXT NOT NULL,
    "customerProductReference" TEXT,
    "orderedQuantity" INTEGER NOT NULL DEFAULT 1,
    "cancelledQuantity" INTEGER NOT NULL DEFAULT 0,
    "unitOfMeasure" TEXT NOT NULL DEFAULT 'each',
    "unitPriceAmount" INTEGER NOT NULL,
    "priceSource" TEXT,
    "discountPercent" INTEGER DEFAULT 0,
    "netAmount" INTEGER NOT NULL,
    "taxCategory" TEXT,
    "taxAmount" INTEGER NOT NULL DEFAULT 0,
    "requestedDeliveryDate" TIMESTAMP(3),
    "promisedDeliveryDate" TIMESTAMP(3),
    "warehousePreference" TEXT,
    "projectReference" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sales_order_lines_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sales_order_holds" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "type" "OrderHoldType" NOT NULL,
    "reason" TEXT,
    "blockingScope" TEXT,
    "releaseAuthority" TEXT,
    "createdByUserId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "releasedByUserId" TEXT,
    "releasedAt" TIMESTAMP(3),

    CONSTRAINT "sales_order_holds_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sales_order_change_events" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "lineId" TEXT,
    "type" "OrderChangeType" NOT NULL,
    "fromValue" TEXT,
    "toValue" TEXT,
    "reason" TEXT,
    "changedByUserId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sales_order_change_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sales_order_approvals" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "status" "OrderApprovalStatus" NOT NULL DEFAULT 'PENDING',
    "requestedByUserId" TEXT NOT NULL,
    "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "decidedByUserId" TEXT,
    "decidedAt" TIMESTAMP(3),

    CONSTRAINT "sales_order_approvals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "projects" (
    "id" TEXT NOT NULL,
    "organisationId" TEXT NOT NULL,
    "partyId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "reference" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PLANNED',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "projects_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "products_organisationId_active_idx" ON "products"("organisationId", "active");

-- CreateIndex
CREATE UNIQUE INDEX "products_organisationId_code_key" ON "products"("organisationId", "code");

-- CreateIndex
CREATE UNIQUE INDEX "customer_products_partyId_productId_key" ON "customer_products"("partyId", "productId");

-- CreateIndex
CREATE UNIQUE INDEX "price_lists_organisationId_key_key" ON "price_lists"("organisationId", "key");

-- CreateIndex
CREATE UNIQUE INDEX "price_list_entries_priceListId_productId_minimumQuantity_key" ON "price_list_entries"("priceListId", "productId", "minimumQuantity");

-- CreateIndex
CREATE UNIQUE INDEX "sales_order_lines_orderId_lineNumber_key" ON "sales_order_lines"("orderId", "lineNumber");

-- CreateIndex
CREATE INDEX "sales_order_holds_orderId_idx" ON "sales_order_holds"("orderId");

-- CreateIndex
CREATE INDEX "sales_order_change_events_orderId_createdAt_idx" ON "sales_order_change_events"("orderId", "createdAt");

-- CreateIndex
CREATE INDEX "sales_order_approvals_orderId_idx" ON "sales_order_approvals"("orderId");

-- CreateIndex
CREATE INDEX "projects_organisationId_status_idx" ON "projects"("organisationId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "projects_organisationId_reference_key" ON "projects"("organisationId", "reference");

-- CreateIndex
CREATE INDEX "sales_orders_organisationId_commercialStatus_idx" ON "sales_orders"("organisationId", "commercialStatus");

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "organisations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customer_products" ADD CONSTRAINT "customer_products_partyId_fkey" FOREIGN KEY ("partyId") REFERENCES "parties"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customer_products" ADD CONSTRAINT "customer_products_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "price_lists" ADD CONSTRAINT "price_lists_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "organisations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "price_list_entries" ADD CONSTRAINT "price_list_entries_priceListId_fkey" FOREIGN KEY ("priceListId") REFERENCES "price_lists"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "price_list_entries" ADD CONSTRAINT "price_list_entries_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales_quotes" ADD CONSTRAINT "sales_quotes_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales_orders" ADD CONSTRAINT "sales_orders_priceListId_fkey" FOREIGN KEY ("priceListId") REFERENCES "price_lists"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales_orders" ADD CONSTRAINT "sales_orders_paymentTermId_fkey" FOREIGN KEY ("paymentTermId") REFERENCES "payment_terms"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales_order_lines" ADD CONSTRAINT "sales_order_lines_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "sales_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales_order_lines" ADD CONSTRAINT "sales_order_lines_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales_order_holds" ADD CONSTRAINT "sales_order_holds_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "sales_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales_order_change_events" ADD CONSTRAINT "sales_order_change_events_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "sales_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales_order_approvals" ADD CONSTRAINT "sales_order_approvals_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "sales_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "projects" ADD CONSTRAINT "projects_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "organisations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "projects" ADD CONSTRAINT "projects_partyId_fkey" FOREIGN KEY ("partyId") REFERENCES "parties"("id") ON DELETE RESTRICT ON UPDATE CASCADE;


-- Make the existing combined Sales installation explicit as two apps.
INSERT INTO "module_states" ("id","organisationId","moduleId","enabled","installedAt","updatedAt")
SELECT 'crm_' || "id", "organisationId", 'crm', "enabled", NOW(), NOW() FROM "module_states" WHERE "moduleId"='sales'
ON CONFLICT ("organisationId","moduleId") DO NOTHING;
