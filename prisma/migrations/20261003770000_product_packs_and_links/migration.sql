-- How a product is packed, and links to the products it contains or needs.

ALTER TABLE "products" ADD COLUMN "packUnit" TEXT NOT NULL DEFAULT '';

CREATE TABLE "product_links" (
    "id" TEXT NOT NULL,
    "organisationId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "relatedProductId" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "quantity" DECIMAL(18,6) NOT NULL,
    "notes" TEXT NOT NULL DEFAULT '',
    CONSTRAINT "product_links_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "product_links_organisationId_productId_relatedProductId_kind_key" ON "product_links"("organisationId", "productId", "relatedProductId", "kind");
CREATE INDEX "product_links_organisationId_relatedProductId_idx" ON "product_links"("organisationId", "relatedProductId");

ALTER TABLE "product_links" ADD CONSTRAINT "product_links_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "organisations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "product_links" ADD CONSTRAINT "product_links_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "product_links" ADD CONSTRAINT "product_links_relatedProductId_fkey" FOREIGN KEY ("relatedProductId") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
