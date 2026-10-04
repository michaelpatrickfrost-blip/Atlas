-- Commercial agreements: the customer contract, its price list, special prices, and service promise.
CREATE TYPE "CommercialAgreementStatus" AS ENUM ('DRAFT', 'ACTIVE', 'ENDED');

CREATE TABLE "commercial_agreements" (
    "id" TEXT NOT NULL,
    "organisationId" TEXT NOT NULL,
    "partyId" TEXT NOT NULL,
    "number" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "status" "CommercialAgreementStatus" NOT NULL DEFAULT 'DRAFT',
    "startsOn" TIMESTAMP(3) NOT NULL,
    "endsOn" TIMESTAMP(3),
    "priceListId" TEXT,
    "paymentTerms" TEXT NOT NULL DEFAULT '',
    "notes" TEXT NOT NULL DEFAULT '',
    "slaName" TEXT NOT NULL DEFAULT '',
    "coverage" TEXT NOT NULL DEFAULT '',
    "responseMinutes" INTEGER,
    "resolutionMinutes" INTEGER,
    "slaNotes" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "commercial_agreements_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "agreement_prices" (
    "id" TEXT NOT NULL,
    "agreementId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "unitPriceAmount" INTEGER NOT NULL,
    "minimumQuantity" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "agreement_prices_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "commercial_agreements_organisationId_number_key" ON "commercial_agreements"("organisationId", "number");
CREATE INDEX "commercial_agreements_organisationId_partyId_status_idx" ON "commercial_agreements"("organisationId", "partyId", "status");
CREATE UNIQUE INDEX "agreement_prices_agreementId_productId_minimumQuantity_key" ON "agreement_prices"("agreementId", "productId", "minimumQuantity");
CREATE INDEX "agreement_prices_productId_idx" ON "agreement_prices"("productId");

ALTER TABLE "commercial_agreements" ADD CONSTRAINT "commercial_agreements_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "organisations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "commercial_agreements" ADD CONSTRAINT "commercial_agreements_partyId_fkey" FOREIGN KEY ("partyId") REFERENCES "parties"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "commercial_agreements" ADD CONSTRAINT "commercial_agreements_priceListId_fkey" FOREIGN KEY ("priceListId") REFERENCES "price_lists"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "agreement_prices" ADD CONSTRAINT "agreement_prices_agreementId_fkey" FOREIGN KEY ("agreementId") REFERENCES "commercial_agreements"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "agreement_prices" ADD CONSTRAINT "agreement_prices_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "commercial_agreements" ADD CONSTRAINT "commercial_agreement_dates" CHECK ("endsOn" IS NULL OR "endsOn" >= "startsOn");
ALTER TABLE "commercial_agreements" ADD CONSTRAINT "commercial_agreement_sla" CHECK (("responseMinutes" IS NULL OR "responseMinutes" > 0) AND ("resolutionMinutes" IS NULL OR "resolutionMinutes" > 0));
ALTER TABLE "agreement_prices" ADD CONSTRAINT "agreement_price_positive" CHECK ("unitPriceAmount" >= 0 AND "minimumQuantity" >= 1);
