-- A product stores its own class. Existing products take the class of their category.

ALTER TABLE "products" ADD COLUMN "itemClass" TEXT NOT NULL DEFAULT 'OTHER';

UPDATE "products" AS product
SET "itemClass" = category."itemClass"
FROM "product_categories" AS category
WHERE category."organisationId" = product."organisationId"
  AND category."code" = product."categoryCode"
  AND category."itemClass" IN ('FINISHED', 'RAW', 'WIP', 'PACKAGING', 'SERVICE', 'OTHER');
