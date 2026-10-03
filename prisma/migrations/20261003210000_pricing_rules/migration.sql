ALTER TABLE price_lists ADD COLUMN "baseCurrency" TEXT NOT NULL DEFAULT 'GBP', ADD COLUMN "exchangeRate" DOUBLE PRECISION NOT NULL DEFAULT 1;
UPDATE price_lists SET "baseCurrency"=currency;
ALTER TABLE price_list_entries ALTER COLUMN "productId" DROP NOT NULL;
ALTER TABLE price_list_entries ADD COLUMN scope TEXT NOT NULL DEFAULT 'PRODUCT', ADD COLUMN method TEXT NOT NULL DEFAULT 'FIXED', ADD COLUMN "categoryCode" TEXT, ADD COLUMN percentage DOUBLE PRECISION NOT NULL DEFAULT 0, ADD COLUMN "adjustmentAmount" INTEGER NOT NULL DEFAULT 0, ADD COLUMN priority INTEGER NOT NULL DEFAULT 0, ADD COLUMN active BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE price_list_entries ADD CONSTRAINT pricing_rule_scope CHECK ((scope='PRODUCT' AND "productId" IS NOT NULL AND "categoryCode" IS NULL) OR (scope='CATEGORY' AND "productId" IS NULL AND "categoryCode" IS NOT NULL) OR (scope='ALL' AND "productId" IS NULL AND "categoryCode" IS NULL));
ALTER TABLE price_list_entries ADD CONSTRAINT pricing_rule_method CHECK (method IN ('FIXED','PERCENT','AMOUNT'));
