-- Additive physical handoff records; existing stock balances/history are unchanged.
CREATE UNIQUE INDEX "warehouses_id_organisationId_key" ON "warehouses"("id","organisationId");
CREATE UNIQUE INDEX "manufacturing_orders_id_organisationId_key" ON "manufacturing_orders"("id","organisationId");
CREATE UNIQUE INDEX "stock_locations_id_warehouseId_organisationId_key" ON "stock_locations"("id","warehouseId","organisationId");
CREATE UNIQUE INDEX "manufacturing_work_orders_id_productionOrderId_organisationId_key" ON "manufacturing_work_orders"("id","productionOrderId","organisationId");
CREATE TABLE "stock_production_batches" (
 "id" TEXT PRIMARY KEY, "organisationId" TEXT NOT NULL, "manufacturingOrderId" TEXT NOT NULL,
 "workOrderId" TEXT NOT NULL, "productId" TEXT NOT NULL, "warehouseId" TEXT NOT NULL,
 "locationId" TEXT NOT NULL, "lotCode" TEXT NOT NULL, "quantity" INTEGER NOT NULL,
 "collectedQuantity" INTEGER NOT NULL DEFAULT 0, "fullyCollected" BOOLEAN NOT NULL DEFAULT false, "version" INTEGER NOT NULL DEFAULT 1,
 "createdByUserId" TEXT NOT NULL, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
 CONSTRAINT "production_batch_quantities" CHECK ("quantity">0 AND "collectedQuantity">=0 AND "collectedQuantity"<="quantity" AND "version">0 AND "fullyCollected"=("collectedQuantity"="quantity")),
 CONSTRAINT "production_batch_org_fk" FOREIGN KEY ("organisationId") REFERENCES "organisations"("id") ON DELETE CASCADE ON UPDATE CASCADE,
 CONSTRAINT "production_batch_order_fk" FOREIGN KEY ("manufacturingOrderId","organisationId") REFERENCES "manufacturing_orders"("id","organisationId") ON DELETE RESTRICT ON UPDATE CASCADE,
 CONSTRAINT "production_batch_work_fk" FOREIGN KEY ("workOrderId","manufacturingOrderId","organisationId") REFERENCES "manufacturing_work_orders"("id","productionOrderId","organisationId") ON DELETE RESTRICT ON UPDATE CASCADE,
 CONSTRAINT "production_batch_product_fk" FOREIGN KEY ("productId","organisationId") REFERENCES "products"("id","organisationId") ON DELETE RESTRICT ON UPDATE CASCADE,
 CONSTRAINT "production_batch_warehouse_fk" FOREIGN KEY ("warehouseId","organisationId") REFERENCES "warehouses"("id","organisationId") ON DELETE RESTRICT ON UPDATE CASCADE,
 CONSTRAINT "production_batch_location_fk" FOREIGN KEY ("locationId","warehouseId","organisationId") REFERENCES "stock_locations"("id","warehouseId","organisationId") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "stock_production_batches_manufacturingOrderId_organisationId_key" ON "stock_production_batches"("manufacturingOrderId","organisationId");
CREATE UNIQUE INDEX "stock_production_batches_id_organisationId_key" ON "stock_production_batches"("id","organisationId");
CREATE INDEX "stock_production_batches_organisationId_createdAt_idx" ON "stock_production_batches"("organisationId","createdAt");
CREATE TABLE "stock_production_collections" (
 "id" TEXT PRIMARY KEY, "organisationId" TEXT NOT NULL, "batchId" TEXT NOT NULL,
 "warehouseId" TEXT NOT NULL, "locationId" TEXT NOT NULL, "quantity" INTEGER NOT NULL,
 "requestKey" TEXT NOT NULL, "actorUserId" TEXT NOT NULL, "note" TEXT NOT NULL,
 "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
 CONSTRAINT "production_collection_quantity" CHECK ("quantity">0),
 CONSTRAINT "production_collection_org_fk" FOREIGN KEY ("organisationId") REFERENCES "organisations"("id") ON DELETE CASCADE ON UPDATE CASCADE,
 CONSTRAINT "production_collection_batch_fk" FOREIGN KEY ("batchId","organisationId") REFERENCES "stock_production_batches"("id","organisationId") ON DELETE RESTRICT ON UPDATE CASCADE,
 CONSTRAINT "production_collection_warehouse_fk" FOREIGN KEY ("warehouseId","organisationId") REFERENCES "warehouses"("id","organisationId") ON DELETE RESTRICT ON UPDATE CASCADE,
 CONSTRAINT "production_collection_location_fk" FOREIGN KEY ("locationId","warehouseId","organisationId") REFERENCES "stock_locations"("id","warehouseId","organisationId") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "stock_production_collections_organisationId_requestKey_key" ON "stock_production_collections"("organisationId","requestKey");
CREATE INDEX "stock_production_collections_organisationId_batchId_createdAt_idx" ON "stock_production_collections"("organisationId","batchId","createdAt");

-- Physical identity and collection evidence are retained. Only the protected
-- Test-company cleanup may delete synthetic history.
CREATE FUNCTION atlas_guard_production_handoff() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
 IF TG_OP='DELETE' AND current_setting('atlas.test_wipe',true)='on'
   AND EXISTS (SELECT 1 FROM organisations WHERE id=OLD."organisationId" AND "isTest" AND kind='CUSTOMER') THEN RETURN OLD; END IF;
 IF TG_TABLE_NAME='stock_production_batches' AND TG_OP='UPDATE' THEN
   IF (to_jsonb(NEW)-ARRAY['collectedQuantity','fullyCollected','version']) IS DISTINCT FROM (to_jsonb(OLD)-ARRAY['collectedQuantity','fullyCollected','version'])
      OR NEW."collectedQuantity"<=OLD."collectedQuantity" OR NEW.version<>OLD.version+1 THEN
      RAISE EXCEPTION 'Production batch identity is immutable; use a controlled collection.';
   END IF;
   RETURN NEW;
 END IF;
 RAISE EXCEPTION 'Production handoff history is immutable.';
END $$;
CREATE TRIGGER production_batch_history_guard BEFORE UPDATE OR DELETE ON stock_production_batches FOR EACH ROW EXECUTE FUNCTION atlas_guard_production_handoff();
CREATE TRIGGER production_collection_history_guard BEFORE UPDATE OR DELETE ON stock_production_collections FOR EACH ROW EXECUTE FUNCTION atlas_guard_production_handoff();
