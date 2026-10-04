-- Real, company-pinned links between Sales, Logistics and Stock.
-- Composite (id, "organisationId") keys make a cross-company reference impossible.

CREATE UNIQUE INDEX IF NOT EXISTS sales_orders_id_organisationId_key ON sales_orders (id, "organisationId");
CREATE UNIQUE INDEX IF NOT EXISTS logistics_fulfilments_id_organisationId_key ON logistics_fulfilments (id, "organisationId");
CREATE UNIQUE INDEX IF NOT EXISTS logistics_fulfilments_id_salesOrderId_key ON logistics_fulfilments (id, "salesOrderId");
CREATE UNIQUE INDEX IF NOT EXISTS logistics_fulfilment_lines_id_organisationId_key ON logistics_fulfilment_lines (id, "organisationId");
CREATE UNIQUE INDEX IF NOT EXISTS logistics_fulfilment_lines_id_requirementId_key ON logistics_fulfilment_lines (id, "requirementId");
CREATE UNIQUE INDEX IF NOT EXISTS logistics_shipments_id_organisationId_key ON logistics_shipments (id, "organisationId");
CREATE UNIQUE INDEX IF NOT EXISTS logistics_receipts_id_organisationId_key ON logistics_receipts (id, "organisationId");

-- Fulfilment lines point at the real order line and product.
ALTER TABLE logistics_fulfilment_lines
  ADD CONSTRAINT logistics_fulfilment_lines_salesOrderLineId_fkey FOREIGN KEY ("salesOrderLineId") REFERENCES sales_order_lines (id) ON UPDATE CASCADE ON DELETE NO ACTION,
  ADD CONSTRAINT logistics_fulfilment_lines_productId_fkey FOREIGN KEY ("productId") REFERENCES products (id) ON UPDATE CASCADE ON DELETE NO ACTION;

-- Shipment sources: a shipment is linked to each sales order it carries (a shipment may combine several orders).
ALTER TABLE logistics_shipment_sources ADD COLUMN "salesOrderId" text;
UPDATE logistics_shipment_sources s SET "salesOrderId" = f."salesOrderId" FROM logistics_fulfilments f WHERE f.id = s."requirementId";
ALTER TABLE logistics_shipment_sources ALTER COLUMN "salesOrderId" SET NOT NULL;
ALTER TABLE logistics_shipment_sources
  ADD CONSTRAINT logistics_shipment_sources_order_fkey FOREIGN KEY ("salesOrderId", "organisationId") REFERENCES sales_orders (id, "organisationId") ON UPDATE CASCADE ON DELETE CASCADE,
  ADD CONSTRAINT logistics_shipment_sources_line_requirement_fkey FOREIGN KEY ("fulfilmentLineId", "requirementId") REFERENCES logistics_fulfilment_lines (id, "requirementId") ON UPDATE CASCADE ON DELETE CASCADE,
  ADD CONSTRAINT logistics_shipment_sources_requirement_order_fkey FOREIGN KEY ("requirementId", "salesOrderId") REFERENCES logistics_fulfilments (id, "salesOrderId") ON UPDATE CASCADE ON DELETE CASCADE;
CREATE INDEX logistics_shipment_sources_salesOrderId_idx ON logistics_shipment_sources ("organisationId", "salesOrderId");

CREATE VIEW logistics_shipment_orders AS
  SELECT DISTINCT "organisationId", "shipmentId", "salesOrderId" FROM logistics_shipment_sources;

-- Stock reservations: typed link to the fulfilment line, filled automatically from sourceType/sourceId.
ALTER TABLE stock_reservations ADD COLUMN "fulfilmentLineId" text;
UPDATE stock_reservations SET "fulfilmentLineId" = "sourceId" WHERE "sourceType" = 'FULFILMENT_LINE';
CREATE FUNCTION atlas_reservation_link() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW."sourceType" = 'FULFILMENT_LINE' AND NEW."fulfilmentLineId" IS NULL THEN
    NEW."fulfilmentLineId" := NEW."sourceId";
  END IF;
  RETURN NEW;
END; $$;
CREATE TRIGGER stock_reservations_link BEFORE INSERT ON stock_reservations FOR EACH ROW EXECUTE FUNCTION atlas_reservation_link();
ALTER TABLE stock_reservations
  ADD CONSTRAINT stock_reservations_fulfilment_line_fkey FOREIGN KEY ("fulfilmentLineId", "organisationId") REFERENCES logistics_fulfilment_lines (id, "organisationId") ON UPDATE CASCADE ON DELETE NO ACTION;
CREATE INDEX stock_reservations_fulfilmentLineId_idx ON stock_reservations ("organisationId", "fulfilmentLineId");

-- Inventory movements: typed links to the shipment that issued the stock or the receipt that brought it in.
ALTER TABLE inventory_movements ADD COLUMN "shipmentId" text, ADD COLUMN "receiptId" text;
ALTER TABLE inventory_movements
  ADD CONSTRAINT inventory_movements_shipment_fkey FOREIGN KEY ("shipmentId", "organisationId") REFERENCES logistics_shipments (id, "organisationId") ON UPDATE CASCADE ON DELETE NO ACTION,
  ADD CONSTRAINT inventory_movements_receipt_fkey FOREIGN KEY ("receiptId", "organisationId") REFERENCES logistics_receipts (id, "organisationId") ON UPDATE CASCADE ON DELETE NO ACTION,
  ADD CONSTRAINT inventory_movements_one_source CHECK (NOT ("shipmentId" IS NOT NULL AND "receiptId" IS NOT NULL));
CREATE INDEX inventory_movements_shipmentId_idx ON inventory_movements ("organisationId", "shipmentId");
CREATE INDEX inventory_movements_receiptId_idx ON inventory_movements ("organisationId", "receiptId");
