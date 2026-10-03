CREATE TABLE "customer_trading_links" (
 "id" TEXT NOT NULL, "organisationId" TEXT NOT NULL, "accountId" TEXT NOT NULL, "tradingAccountId" TEXT NOT NULL,
 "active" BOOLEAN NOT NULL DEFAULT true, "notes" TEXT, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL,
 CONSTRAINT "customer_trading_links_pkey" PRIMARY KEY ("id"),
 CONSTRAINT "customer_trading_links_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "organisations"("id") ON DELETE CASCADE,
 CONSTRAINT "customer_trading_links_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "parties"("id") ON DELETE CASCADE,
 CONSTRAINT "customer_trading_links_tradingAccountId_fkey" FOREIGN KEY ("tradingAccountId") REFERENCES "parties"("id") ON DELETE CASCADE,
 CONSTRAINT "customer_trading_links_not_self" CHECK ("accountId" <> "tradingAccountId")
);
CREATE UNIQUE INDEX "customer_trading_links_organisationId_accountId_tradingAccountId_key" ON "customer_trading_links"("organisationId","accountId","tradingAccountId");
CREATE INDEX "customer_trading_links_organisationId_tradingAccountId_active_idx" ON "customer_trading_links"("organisationId","tradingAccountId","active");
ALTER TABLE "sales_quotes" ADD COLUMN "pricingPartyId" TEXT, ADD COLUMN "financeInstructions" TEXT, ADD COLUMN "deliveryInstructions" TEXT;
ALTER TABLE "sales_orders" ADD COLUMN "pricingPartyId" TEXT, ADD COLUMN "financeInstructions" TEXT;
ALTER TABLE "sales_quotes" ADD CONSTRAINT "sales_quotes_pricingPartyId_fkey" FOREIGN KEY ("pricingPartyId") REFERENCES "parties"("id");
ALTER TABLE "sales_orders" ADD CONSTRAINT "sales_orders_pricingPartyId_fkey" FOREIGN KEY ("pricingPartyId") REFERENCES "parties"("id");
