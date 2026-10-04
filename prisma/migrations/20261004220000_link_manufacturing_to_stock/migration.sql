-- Link manufacturing to stock and to the supply plan with enforced keys.
CREATE UNIQUE INDEX IF NOT EXISTS manufacturing_orders_id_organisationId_key ON manufacturing_orders (id, "organisationId");
CREATE UNIQUE INDEX IF NOT EXISTS manufacturing_work_orders_id_organisationId_key ON manufacturing_work_orders (id, "organisationId");

-- Each production order records the warehouse it builds into and draws from.
ALTER TABLE manufacturing_orders ADD COLUMN "warehouseId" text;
ALTER TABLE manufacturing_orders ADD CONSTRAINT manufacturing_orders_warehouse_fkey
  FOREIGN KEY ("warehouseId") REFERENCES warehouses (id) ON UPDATE CASCADE ON DELETE NO ACTION;
CREATE INDEX manufacturing_orders_warehouseId_idx ON manufacturing_orders ("organisationId", "warehouseId");

-- Stock movements record which production order (and step) caused them.
ALTER TABLE inventory_movements ADD COLUMN "manufacturingOrderId" text, ADD COLUMN "workOrderId" text;
ALTER TABLE inventory_movements DROP CONSTRAINT inventory_movements_one_source;
ALTER TABLE inventory_movements
  ADD CONSTRAINT inventory_movements_manufacturing_order_fkey FOREIGN KEY ("manufacturingOrderId", "organisationId") REFERENCES manufacturing_orders (id, "organisationId") ON UPDATE CASCADE ON DELETE NO ACTION,
  ADD CONSTRAINT inventory_movements_work_order_fkey FOREIGN KEY ("workOrderId", "organisationId") REFERENCES manufacturing_work_orders (id, "organisationId") ON UPDATE CASCADE ON DELETE NO ACTION,
  ADD CONSTRAINT inventory_movements_one_source CHECK (num_nonnulls("shipmentId", "receiptId", "manufacturingOrderId") <= 1),
  ADD CONSTRAINT inventory_movements_work_order_needs_order CHECK ("workOrderId" IS NULL OR "manufacturingOrderId" IS NOT NULL);
CREATE INDEX inventory_movements_manufacturingOrderId_idx ON inventory_movements ("organisationId", "manufacturingOrderId");

-- A firmed suggestion must point at a real production order.
UPDATE manufacturing_supply_suggestions s SET "resultingOrderId" = NULL
  WHERE "resultingOrderId" IS NOT NULL AND NOT EXISTS (SELECT 1 FROM manufacturing_orders o WHERE o.id = s."resultingOrderId");
ALTER TABLE manufacturing_supply_suggestions ADD CONSTRAINT manufacturing_supply_suggestions_resulting_order_fkey
  FOREIGN KEY ("resultingOrderId") REFERENCES manufacturing_orders (id) ON UPDATE CASCADE ON DELETE SET NULL;
