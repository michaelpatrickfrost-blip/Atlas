-- Sites group warehouses and yards. A place is a warehouse or a yard. Stock between sites stays in transit until received.

CREATE TABLE "sites" (
  "id" TEXT NOT NULL,
  "organisationId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "code" TEXT NOT NULL,
  CONSTRAINT "sites_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "sites_organisationId_code_key" ON "sites"("organisationId", "code");
CREATE INDEX "sites_organisationId_idx" ON "sites"("organisationId");
ALTER TABLE "sites" ADD CONSTRAINT "sites_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "organisations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "warehouses" ADD COLUMN "kind" TEXT NOT NULL DEFAULT 'WAREHOUSE';
ALTER TABLE "warehouses" ADD COLUMN "siteId" TEXT;
CREATE INDEX "warehouses_organisationId_siteId_idx" ON "warehouses"("organisationId", "siteId");
ALTER TABLE "warehouses" ADD CONSTRAINT "warehouses_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "sites"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "internal_moves" (
  "id" TEXT NOT NULL,
  "organisationId" TEXT NOT NULL,
  "reference" TEXT NOT NULL,
  "productId" TEXT NOT NULL,
  "fromWarehouseId" TEXT NOT NULL,
  "toWarehouseId" TEXT NOT NULL,
  "fromLocationId" TEXT,
  "toLocationId" TEXT,
  "quantity" INTEGER NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'IN_TRANSIT',
  "reason" TEXT NOT NULL,
  "requestKey" TEXT NOT NULL,
  "actorUserId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "receivedAt" TIMESTAMP(3),
  CONSTRAINT "internal_moves_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "internal_moves_organisationId_requestKey_key" ON "internal_moves"("organisationId", "requestKey");
CREATE UNIQUE INDEX "internal_moves_organisationId_reference_key" ON "internal_moves"("organisationId", "reference");
CREATE INDEX "internal_moves_organisationId_status_idx" ON "internal_moves"("organisationId", "status");
ALTER TABLE "internal_moves" ADD CONSTRAINT "internal_moves_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "organisations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "internal_moves" ADD CONSTRAINT "internal_moves_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "internal_moves" ADD CONSTRAINT "internal_moves_fromWarehouseId_fkey" FOREIGN KEY ("fromWarehouseId") REFERENCES "warehouses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "internal_moves" ADD CONSTRAINT "internal_moves_toWarehouseId_fkey" FOREIGN KEY ("toWarehouseId") REFERENCES "warehouses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "internal_moves" ADD CONSTRAINT "internal_moves_fromLocationId_fkey" FOREIGN KEY ("fromLocationId") REFERENCES "stock_locations"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "internal_moves" ADD CONSTRAINT "internal_moves_toLocationId_fkey" FOREIGN KEY ("toLocationId") REFERENCES "stock_locations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "stock_positions" ADD CONSTRAINT "stock_positions_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
