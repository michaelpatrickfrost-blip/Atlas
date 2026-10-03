-- Clear legacy text labels and foreign-tenant assignments before enforcing the canonical relation.
UPDATE customer_commercial_settings s SET "priceList" = NULL
WHERE "priceList" IS NOT NULL AND NOT EXISTS (
 SELECT 1 FROM price_lists l JOIN parties p ON p.id=s."partyId"
 WHERE l.id=s."priceList" AND l."organisationId"=p."organisationId"
);
ALTER TABLE customer_commercial_settings ADD CONSTRAINT customer_commercial_settings_priceList_fkey
FOREIGN KEY ("priceList") REFERENCES price_lists(id) ON DELETE SET NULL ON UPDATE CASCADE;
