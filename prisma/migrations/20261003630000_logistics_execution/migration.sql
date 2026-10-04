-- Logistics execution plus the stock locations, lots, serials and reservations it consumes.
ALTER TABLE "products" ADD COLUMN "trackingMode" TEXT NOT NULL DEFAULT 'NONE';
ALTER TABLE "products" ADD COLUMN "barcode" TEXT;
ALTER TABLE "products" ADD CONSTRAINT "products_tracking_mode_check" CHECK ("trackingMode" IN ('NONE', 'LOT', 'SERIAL'));
CREATE UNIQUE INDEX "products_organisationId_barcode_key" ON "products"("organisationId", "barcode");

CREATE TABLE "stock_locations" (
  "id" TEXT NOT NULL,
  "organisationId" TEXT NOT NULL,
  "warehouseId" TEXT NOT NULL,
  "parentId" TEXT,
  "code" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "capabilities" TEXT[] DEFAULT ARRAY[]::TEXT[],
  "sequence" INTEGER NOT NULL DEFAULT 0,
  "active" BOOLEAN NOT NULL DEFAULT true,
  CONSTRAINT "stock_locations_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "stock_locations_warehouseId_code_key" ON "stock_locations"("warehouseId", "code");
CREATE INDEX "stock_locations_organisationId_warehouseId_idx" ON "stock_locations"("organisationId", "warehouseId");

CREATE TABLE "stock_lots" (
  "id" TEXT NOT NULL,
  "organisationId" TEXT NOT NULL,
  "productId" TEXT NOT NULL,
  "code" TEXT NOT NULL,
  "manufacturedOn" TIMESTAMP(3),
  "expiresOn" TIMESTAMP(3),
  "bestBeforeOn" TIMESTAMP(3),
  "removalOn" TIMESTAMP(3),
  "warningOn" TIMESTAMP(3),
  CONSTRAINT "stock_lots_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "stock_lots_organisationId_productId_code_key" ON "stock_lots"("organisationId", "productId", "code");

CREATE TABLE "stock_serials" (
  "id" TEXT NOT NULL,
  "organisationId" TEXT NOT NULL,
  "productId" TEXT NOT NULL,
  "serial" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'ON_HAND',
  "warehouseId" TEXT,
  "locationId" TEXT,
  "lotId" TEXT,
  CONSTRAINT "stock_serials_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "stock_serials_organisationId_productId_serial_key" ON "stock_serials"("organisationId", "productId", "serial");
CREATE INDEX "stock_serials_organisationId_status_idx" ON "stock_serials"("organisationId", "status");

CREATE TABLE "stock_positions" (
  "id" TEXT NOT NULL,
  "organisationId" TEXT NOT NULL,
  "warehouseId" TEXT NOT NULL,
  "locationId" TEXT NOT NULL,
  "productId" TEXT NOT NULL,
  "lotId" TEXT NOT NULL DEFAULT '',
  "status" TEXT NOT NULL DEFAULT 'AVAILABLE',
  "quantity" INTEGER NOT NULL DEFAULT 0,
  CONSTRAINT "stock_positions_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "stock_positions_warehouseId_locationId_productId_lotId_status_key" ON "stock_positions"("warehouseId", "locationId", "productId", "lotId", "status");
CREATE INDEX "stock_positions_organisationId_productId_idx" ON "stock_positions"("organisationId", "productId");

CREATE TABLE "stock_reservations" (
  "id" TEXT NOT NULL,
  "organisationId" TEXT NOT NULL,
  "productId" TEXT NOT NULL,
  "warehouseId" TEXT NOT NULL,
  "locationId" TEXT,
  "lotId" TEXT NOT NULL DEFAULT '',
  "quantity" INTEGER NOT NULL,
  "sourceType" TEXT NOT NULL,
  "sourceId" TEXT NOT NULL,
  "requestKey" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'ACTIVE',
  CONSTRAINT "stock_reservations_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "stock_reservations_organisationId_requestKey_key" ON "stock_reservations"("organisationId", "requestKey");
CREATE INDEX "stock_reservations_organisationId_productId_status_idx" ON "stock_reservations"("organisationId", "productId", "status");

CREATE TABLE "stock_discrepancies" (
  "id" TEXT NOT NULL,
  "organisationId" TEXT NOT NULL,
  "productId" TEXT NOT NULL,
  "warehouseId" TEXT NOT NULL,
  "locationId" TEXT,
  "systemQuantity" INTEGER NOT NULL,
  "reportedQuantity" INTEGER NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'OPEN',
  "sourceType" TEXT NOT NULL,
  "sourceId" TEXT NOT NULL,
  "requestKey" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "stock_discrepancies_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "stock_discrepancies_organisationId_requestKey_key" ON "stock_discrepancies"("organisationId", "requestKey");
CREATE INDEX "stock_discrepancies_organisationId_status_idx" ON "stock_discrepancies"("organisationId", "status");

CREATE TABLE "logistics_policies" (
  "organisationId" TEXT NOT NULL,
  "mode" TEXT NOT NULL DEFAULT 'STANDARD',
  "reservationPolicy" TEXT NOT NULL DEFAULT 'ON_CONFIRMATION',
  "reserveDaysBefore" INTEGER NOT NULL DEFAULT 0,
  "releaseMethod" TEXT NOT NULL DEFAULT 'MANUAL',
  "packVerification" TEXT NOT NULL DEFAULT 'BARCODE',
  "overPickPolicy" TEXT NOT NULL DEFAULT 'PROHIBITED',
  "removalStrategy" TEXT NOT NULL DEFAULT 'FEFO',
  "otifOnTimeRule" TEXT NOT NULL DEFAULT 'ON_OR_BEFORE_PROMISE',
  "otifFullPercent" INTEGER NOT NULL DEFAULT 100,
  "fulfilmentModel" TEXT NOT NULL DEFAULT 'ATLAS',
  "cutOffs" JSONB NOT NULL DEFAULT '{}',
  CONSTRAINT "logistics_policies_pkey" PRIMARY KEY ("organisationId")
);

CREATE TABLE "logistics_counters" (
  "organisationId" TEXT NOT NULL,
  "kind" TEXT NOT NULL,
  "value" INTEGER NOT NULL DEFAULT 0,
  CONSTRAINT "logistics_counters_pkey" PRIMARY KEY ("organisationId", "kind")
);

CREATE TABLE "logistics_fulfilments" (
  "id" TEXT NOT NULL,
  "organisationId" TEXT NOT NULL,
  "reference" TEXT NOT NULL,
  "salesOrderId" TEXT NOT NULL,
  "partyId" TEXT NOT NULL,
  "splitKey" TEXT NOT NULL DEFAULT '',
  "shipTo" JSONB NOT NULL,
  "priority" INTEGER NOT NULL DEFAULT 50,
  "priorityReason" TEXT NOT NULL DEFAULT '',
  "status" TEXT NOT NULL DEFAULT 'OPEN',
  "holdSummary" TEXT,
  "warehouseId" TEXT,
  "warehousePreference" TEXT,
  "requestedOn" TIMESTAMP(3),
  "promisedOn" TIMESTAMP(3),
  "partialPolicy" BOOLEAN NOT NULL DEFAULT true,
  "deliveryRules" TEXT,
  "shippingInstructions" TEXT,
  "serviceLevel" TEXT NOT NULL DEFAULT 'STANDARD',
  "timeWindow" TEXT,
  "fulfilmentMode" TEXT NOT NULL DEFAULT 'WAREHOUSE',
  "sourceEventKey" TEXT NOT NULL,
  "releasedAt" TIMESTAMP(3),
  "expectedCompletion" TIMESTAMP(3),
  "version" INTEGER NOT NULL DEFAULT 1,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "logistics_fulfilments_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "logistics_fulfilments_organisationId_reference_key" ON "logistics_fulfilments"("organisationId", "reference");
CREATE UNIQUE INDEX "logistics_fulfilments_organisationId_salesOrderId_splitKey_key" ON "logistics_fulfilments"("organisationId", "salesOrderId", "splitKey");
CREATE UNIQUE INDEX "logistics_fulfilments_organisationId_sourceEventKey_key" ON "logistics_fulfilments"("organisationId", "sourceEventKey");
CREATE INDEX "logistics_fulfilments_organisationId_status_promisedOn_idx" ON "logistics_fulfilments"("organisationId", "status", "promisedOn");
CREATE INDEX "logistics_fulfilments_organisationId_partyId_idx" ON "logistics_fulfilments"("organisationId", "partyId");

CREATE TABLE "logistics_fulfilment_lines" (
  "id" TEXT NOT NULL,
  "organisationId" TEXT NOT NULL,
  "requirementId" TEXT NOT NULL,
  "salesOrderLineId" TEXT NOT NULL,
  "productId" TEXT,
  "description" TEXT NOT NULL,
  "orderedQuantity" INTEGER NOT NULL,
  "cancelledQuantity" INTEGER NOT NULL DEFAULT 0,
  "allocatedQuantity" INTEGER NOT NULL DEFAULT 0,
  "pickedQuantity" INTEGER NOT NULL DEFAULT 0,
  "packedQuantity" INTEGER NOT NULL DEFAULT 0,
  "shippedQuantity" INTEGER NOT NULL DEFAULT 0,
  "deliveredQuantity" INTEGER NOT NULL DEFAULT 0,
  "returnedQuantity" INTEGER NOT NULL DEFAULT 0,
  "allocationStatus" TEXT NOT NULL DEFAULT 'UNALLOCATED',
  "shortage" JSONB,
  "unitOfMeasure" TEXT NOT NULL DEFAULT 'each',
  CONSTRAINT "logistics_fulfilment_lines_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "logistics_fulfilment_lines_requirementId_salesOrderLineId_key" ON "logistics_fulfilment_lines"("requirementId", "salesOrderLineId");
CREATE INDEX "logistics_fulfilment_lines_organisationId_allocationStatus_idx" ON "logistics_fulfilment_lines"("organisationId", "allocationStatus");

CREATE TABLE "logistics_waves" (
  "id" TEXT NOT NULL,
  "organisationId" TEXT NOT NULL,
  "reference" TEXT NOT NULL,
  "method" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'PLANNED',
  "criteria" JSONB,
  "cutOffAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "logistics_waves_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "logistics_waves_organisationId_reference_key" ON "logistics_waves"("organisationId", "reference");
CREATE INDEX "logistics_waves_organisationId_status_idx" ON "logistics_waves"("organisationId", "status");

CREATE TABLE "logistics_loads" (
  "id" TEXT NOT NULL,
  "organisationId" TEXT NOT NULL,
  "reference" TEXT NOT NULL,
  "vehicleLabel" TEXT,
  "fleetVehicleRef" TEXT,
  "driverName" TEXT,
  "routeName" TEXT,
  "plannedDepartureAt" TIMESTAMP(3),
  "status" TEXT NOT NULL DEFAULT 'PLANNING',
  "maxWeightKg" INTEGER,
  "maxPallets" INTEGER,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "logistics_loads_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "logistics_loads_organisationId_reference_key" ON "logistics_loads"("organisationId", "reference");
CREATE INDEX "logistics_loads_organisationId_status_idx" ON "logistics_loads"("organisationId", "status");

CREATE TABLE "logistics_shipments" (
  "id" TEXT NOT NULL,
  "organisationId" TEXT NOT NULL,
  "reference" TEXT NOT NULL,
  "partyId" TEXT NOT NULL,
  "shipTo" JSONB NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'PLANNING',
  "carrierCode" TEXT NOT NULL DEFAULT 'MANUAL',
  "carrierReason" TEXT NOT NULL DEFAULT '',
  "serviceLevel" TEXT NOT NULL DEFAULT 'STANDARD',
  "plannedDispatchAt" TIMESTAMP(3),
  "dispatchedAt" TIMESTAMP(3),
  "expectedDeliveryAt" TIMESTAMP(3),
  "deliveredAt" TIMESTAMP(3),
  "trackingNumber" TEXT,
  "rawCarrierStatus" TEXT,
  "estimatedCostMinor" INTEGER,
  "actualCostMinor" INTEGER,
  "customerChargeMinor" INTEGER,
  "currency" TEXT NOT NULL DEFAULT 'GBP',
  "loadId" TEXT,
  "stageLane" TEXT,
  "collection" BOOLEAN NOT NULL DEFAULT false,
  "onTime" BOOLEAN,
  "inFull" BOOLEAN,
  "failureReason" TEXT,
  "pod" JSONB,
  "version" INTEGER NOT NULL DEFAULT 1,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "logistics_shipments_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "logistics_shipments_organisationId_reference_key" ON "logistics_shipments"("organisationId", "reference");
CREATE INDEX "logistics_shipments_organisationId_status_plannedDispatchAt_idx" ON "logistics_shipments"("organisationId", "status", "plannedDispatchAt");
CREATE INDEX "logistics_shipments_organisationId_partyId_idx" ON "logistics_shipments"("organisationId", "partyId");

CREATE TABLE "logistics_receipts" (
  "id" TEXT NOT NULL,
  "organisationId" TEXT NOT NULL,
  "reference" TEXT NOT NULL,
  "sourceType" TEXT NOT NULL,
  "sourceReference" TEXT NOT NULL,
  "partyName" TEXT,
  "warehouseId" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'EXPECTED',
  "expectedOn" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "logistics_receipts_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "logistics_receipts_organisationId_reference_key" ON "logistics_receipts"("organisationId", "reference");
CREATE INDEX "logistics_receipts_organisationId_status_idx" ON "logistics_receipts"("organisationId", "status");

CREATE TABLE "logistics_tasks" (
  "id" TEXT NOT NULL,
  "organisationId" TEXT NOT NULL,
  "reference" TEXT NOT NULL,
  "kind" TEXT NOT NULL,
  "method" TEXT NOT NULL DEFAULT 'SINGLE',
  "status" TEXT NOT NULL DEFAULT 'READY',
  "requirementId" TEXT,
  "waveId" TEXT,
  "shipmentId" TEXT,
  "receiptId" TEXT,
  "assigneeUserId" TEXT,
  "claimedAt" TIMESTAMP(3),
  "startedAt" TIMESTAMP(3),
  "completedAt" TIMESTAMP(3),
  "version" INTEGER NOT NULL DEFAULT 1,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "logistics_tasks_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "logistics_tasks_organisationId_reference_key" ON "logistics_tasks"("organisationId", "reference");
CREATE INDEX "logistics_tasks_organisationId_kind_status_idx" ON "logistics_tasks"("organisationId", "kind", "status");

CREATE TABLE "logistics_task_lines" (
  "id" TEXT NOT NULL,
  "organisationId" TEXT NOT NULL,
  "taskId" TEXT NOT NULL,
  "fulfilmentLineId" TEXT,
  "productId" TEXT,
  "description" TEXT NOT NULL,
  "productCode" TEXT NOT NULL DEFAULT '',
  "locationCode" TEXT,
  "expectedBarcode" TEXT,
  "requiredQuantity" INTEGER NOT NULL,
  "confirmedQuantity" INTEGER NOT NULL DEFAULT 0,
  "lotCode" TEXT,
  "serials" TEXT[] DEFAULT ARRAY[]::TEXT[],
  "status" TEXT NOT NULL DEFAULT 'OPEN',
  "exceptionReason" TEXT,
  "clusterSlot" TEXT,
  "zoneCode" TEXT,
  "sequence" INTEGER NOT NULL DEFAULT 0,
  CONSTRAINT "logistics_task_lines_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "logistics_task_lines_organisationId_taskId_idx" ON "logistics_task_lines"("organisationId", "taskId");

CREATE TABLE "logistics_packages" (
  "id" TEXT NOT NULL,
  "organisationId" TEXT NOT NULL,
  "reference" TEXT NOT NULL,
  "shipmentId" TEXT,
  "parentId" TEXT,
  "packageType" TEXT NOT NULL DEFAULT 'BOX',
  "weightGrams" INTEGER,
  "expectedWeightGrams" INTEGER,
  "lengthMm" INTEGER,
  "widthMm" INTEGER,
  "heightMm" INTEGER,
  "trackingNumber" TEXT,
  "sealNumber" TEXT,
  "sscc" TEXT,
  "packedByUserId" TEXT,
  "packedAt" TIMESTAMP(3),
  CONSTRAINT "logistics_packages_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "logistics_packages_organisationId_reference_key" ON "logistics_packages"("organisationId", "reference");
CREATE INDEX "logistics_packages_organisationId_shipmentId_idx" ON "logistics_packages"("organisationId", "shipmentId");

CREATE TABLE "logistics_package_contents" (
  "id" TEXT NOT NULL,
  "organisationId" TEXT NOT NULL,
  "packageId" TEXT NOT NULL,
  "productId" TEXT,
  "description" TEXT NOT NULL,
  "quantity" INTEGER NOT NULL,
  "lotCode" TEXT,
  "serials" TEXT[] DEFAULT ARRAY[]::TEXT[],
  "fulfilmentLineId" TEXT,
  CONSTRAINT "logistics_package_contents_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "logistics_package_contents_organisationId_packageId_idx" ON "logistics_package_contents"("organisationId", "packageId");

CREATE TABLE "logistics_shipment_sources" (
  "id" TEXT NOT NULL,
  "organisationId" TEXT NOT NULL,
  "shipmentId" TEXT NOT NULL,
  "requirementId" TEXT NOT NULL,
  "fulfilmentLineId" TEXT NOT NULL,
  "quantity" INTEGER NOT NULL,
  CONSTRAINT "logistics_shipment_sources_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "logistics_shipment_sources_shipmentId_fulfilmentLineId_key" ON "logistics_shipment_sources"("shipmentId", "fulfilmentLineId");

CREATE TABLE "logistics_tracking_events" (
  "id" TEXT NOT NULL,
  "organisationId" TEXT NOT NULL,
  "shipmentId" TEXT NOT NULL,
  "packageId" TEXT,
  "status" TEXT NOT NULL,
  "rawStatus" TEXT,
  "occurredAt" TIMESTAMP(3) NOT NULL,
  "note" TEXT,
  "requestKey" TEXT NOT NULL,
  CONSTRAINT "logistics_tracking_events_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "logistics_tracking_events_organisationId_requestKey_key" ON "logistics_tracking_events"("organisationId", "requestKey");
CREATE INDEX "logistics_tracking_events_organisationId_shipmentId_idx" ON "logistics_tracking_events"("organisationId", "shipmentId");

CREATE TABLE "logistics_load_stops" (
  "id" TEXT NOT NULL,
  "organisationId" TEXT NOT NULL,
  "loadId" TEXT NOT NULL,
  "shipmentId" TEXT NOT NULL,
  "sequence" INTEGER NOT NULL,
  "partyName" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'PLANNED',
  "windowLabel" TEXT,
  CONSTRAINT "logistics_load_stops_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "logistics_load_stops_loadId_shipmentId_key" ON "logistics_load_stops"("loadId", "shipmentId");

CREATE TABLE "logistics_receipt_lines" (
  "id" TEXT NOT NULL,
  "organisationId" TEXT NOT NULL,
  "receiptId" TEXT NOT NULL,
  "productId" TEXT,
  "description" TEXT NOT NULL,
  "expectedQuantity" INTEGER NOT NULL,
  "receivedQuantity" INTEGER NOT NULL DEFAULT 0,
  "lotCode" TEXT,
  "serials" TEXT[] DEFAULT ARRAY[]::TEXT[],
  "condition" TEXT NOT NULL DEFAULT 'GOOD',
  "discrepancy" TEXT,
  "status" TEXT NOT NULL DEFAULT 'OPEN',
  CONSTRAINT "logistics_receipt_lines_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "logistics_receipt_lines_organisationId_receiptId_idx" ON "logistics_receipt_lines"("organisationId", "receiptId");

CREATE TABLE "logistics_returns" (
  "id" TEXT NOT NULL,
  "organisationId" TEXT NOT NULL,
  "reference" TEXT NOT NULL,
  "partyId" TEXT NOT NULL,
  "salesOrderId" TEXT,
  "shipmentId" TEXT,
  "status" TEXT NOT NULL DEFAULT 'REQUESTED',
  "reason" TEXT NOT NULL,
  "requestedResolution" TEXT,
  "authorisationRequired" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "logistics_returns_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "logistics_returns_organisationId_reference_key" ON "logistics_returns"("organisationId", "reference");
CREATE INDEX "logistics_returns_organisationId_status_idx" ON "logistics_returns"("organisationId", "status");
CREATE INDEX "logistics_returns_organisationId_partyId_idx" ON "logistics_returns"("organisationId", "partyId");

CREATE TABLE "logistics_return_lines" (
  "id" TEXT NOT NULL,
  "organisationId" TEXT NOT NULL,
  "returnId" TEXT NOT NULL,
  "productId" TEXT,
  "description" TEXT NOT NULL,
  "quantity" INTEGER NOT NULL,
  "receivedQuantity" INTEGER NOT NULL DEFAULT 0,
  "lotCode" TEXT,
  "serials" TEXT[] DEFAULT ARRAY[]::TEXT[],
  "condition" TEXT,
  "disposition" TEXT,
  "replacementRequirementId" TEXT,
  CONSTRAINT "logistics_return_lines_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "logistics_return_lines_organisationId_returnId_idx" ON "logistics_return_lines"("organisationId", "returnId");

CREATE TABLE "logistics_operations" (
  "id" TEXT NOT NULL,
  "organisationId" TEXT NOT NULL,
  "requestKey" TEXT NOT NULL,
  "action" TEXT NOT NULL,
  "result" JSONB NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "logistics_operations_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "logistics_operations_organisationId_requestKey_key" ON "logistics_operations"("organisationId", "requestKey");
CREATE INDEX "logistics_operations_organisationId_action_idx" ON "logistics_operations"("organisationId", "action");

CREATE TABLE "logistics_carrier_rules" (
  "id" TEXT NOT NULL,
  "organisationId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "priority" INTEGER NOT NULL DEFAULT 100,
  "explanation" TEXT NOT NULL,
  "match" JSONB NOT NULL,
  "carrierCode" TEXT NOT NULL,
  "serviceLevel" TEXT NOT NULL,
  "active" BOOLEAN NOT NULL DEFAULT true,
  CONSTRAINT "logistics_carrier_rules_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "logistics_carrier_rules_organisationId_active_priority_idx" ON "logistics_carrier_rules"("organisationId", "active", "priority");

CREATE TABLE "logistics_saved_views" (
  "id" TEXT NOT NULL,
  "organisationId" TEXT NOT NULL,
  "ownerUserId" TEXT,
  "scope" TEXT NOT NULL DEFAULT 'PRIVATE',
  "name" TEXT NOT NULL,
  "definition" JSONB NOT NULL,
  CONSTRAINT "logistics_saved_views_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "logistics_saved_views_organisationId_scope_idx" ON "logistics_saved_views"("organisationId", "scope");

CREATE TABLE "logistics_notes" (
  "id" TEXT NOT NULL,
  "organisationId" TEXT NOT NULL,
  "entityType" TEXT NOT NULL,
  "entityId" TEXT NOT NULL,
  "audience" TEXT NOT NULL,
  "body" TEXT NOT NULL,
  "authorUserId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "logistics_notes_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "logistics_notes_organisationId_entityType_entityId_idx" ON "logistics_notes"("organisationId", "entityType", "entityId");

ALTER TABLE "stock_locations" ADD CONSTRAINT "stock_locations_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "organisations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "stock_locations" ADD CONSTRAINT "stock_locations_warehouseId_fkey" FOREIGN KEY ("warehouseId") REFERENCES "warehouses"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "stock_locations" ADD CONSTRAINT "stock_locations_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "stock_locations"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "stock_lots" ADD CONSTRAINT "stock_lots_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "organisations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "stock_lots" ADD CONSTRAINT "stock_lots_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "stock_serials" ADD CONSTRAINT "stock_serials_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "organisations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "stock_serials" ADD CONSTRAINT "stock_serials_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "stock_positions" ADD CONSTRAINT "stock_positions_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "organisations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "stock_positions" ADD CONSTRAINT "stock_positions_warehouseId_fkey" FOREIGN KEY ("warehouseId") REFERENCES "warehouses"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "stock_positions" ADD CONSTRAINT "stock_positions_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "stock_locations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "stock_reservations" ADD CONSTRAINT "stock_reservations_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "organisations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "stock_reservations" ADD CONSTRAINT "stock_reservations_warehouseId_fkey" FOREIGN KEY ("warehouseId") REFERENCES "warehouses"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "stock_discrepancies" ADD CONSTRAINT "stock_discrepancies_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "organisations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "stock_discrepancies" ADD CONSTRAINT "stock_discrepancies_warehouseId_fkey" FOREIGN KEY ("warehouseId") REFERENCES "warehouses"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "logistics_policies" ADD CONSTRAINT "logistics_policies_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "organisations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "logistics_counters" ADD CONSTRAINT "logistics_counters_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "organisations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "logistics_fulfilments" ADD CONSTRAINT "logistics_fulfilments_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "organisations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "logistics_fulfilments" ADD CONSTRAINT "logistics_fulfilments_partyId_fkey" FOREIGN KEY ("partyId") REFERENCES "parties"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "logistics_fulfilments" ADD CONSTRAINT "logistics_fulfilments_salesOrderId_fkey" FOREIGN KEY ("salesOrderId") REFERENCES "sales_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "logistics_fulfilment_lines" ADD CONSTRAINT "logistics_fulfilment_lines_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "organisations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "logistics_fulfilment_lines" ADD CONSTRAINT "logistics_fulfilment_lines_requirementId_fkey" FOREIGN KEY ("requirementId") REFERENCES "logistics_fulfilments"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "logistics_waves" ADD CONSTRAINT "logistics_waves_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "organisations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "logistics_loads" ADD CONSTRAINT "logistics_loads_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "organisations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "logistics_shipments" ADD CONSTRAINT "logistics_shipments_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "organisations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "logistics_shipments" ADD CONSTRAINT "logistics_shipments_partyId_fkey" FOREIGN KEY ("partyId") REFERENCES "parties"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "logistics_shipments" ADD CONSTRAINT "logistics_shipments_loadId_fkey" FOREIGN KEY ("loadId") REFERENCES "logistics_loads"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "logistics_receipts" ADD CONSTRAINT "logistics_receipts_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "organisations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "logistics_receipts" ADD CONSTRAINT "logistics_receipts_warehouseId_fkey" FOREIGN KEY ("warehouseId") REFERENCES "warehouses"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "logistics_tasks" ADD CONSTRAINT "logistics_tasks_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "organisations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "logistics_tasks" ADD CONSTRAINT "logistics_tasks_requirementId_fkey" FOREIGN KEY ("requirementId") REFERENCES "logistics_fulfilments"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "logistics_tasks" ADD CONSTRAINT "logistics_tasks_waveId_fkey" FOREIGN KEY ("waveId") REFERENCES "logistics_waves"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "logistics_tasks" ADD CONSTRAINT "logistics_tasks_shipmentId_fkey" FOREIGN KEY ("shipmentId") REFERENCES "logistics_shipments"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "logistics_tasks" ADD CONSTRAINT "logistics_tasks_receiptId_fkey" FOREIGN KEY ("receiptId") REFERENCES "logistics_receipts"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "logistics_task_lines" ADD CONSTRAINT "logistics_task_lines_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "organisations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "logistics_task_lines" ADD CONSTRAINT "logistics_task_lines_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "logistics_tasks"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "logistics_packages" ADD CONSTRAINT "logistics_packages_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "organisations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "logistics_packages" ADD CONSTRAINT "logistics_packages_shipmentId_fkey" FOREIGN KEY ("shipmentId") REFERENCES "logistics_shipments"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "logistics_packages" ADD CONSTRAINT "logistics_packages_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "logistics_packages"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "logistics_package_contents" ADD CONSTRAINT "logistics_package_contents_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "organisations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "logistics_package_contents" ADD CONSTRAINT "logistics_package_contents_packageId_fkey" FOREIGN KEY ("packageId") REFERENCES "logistics_packages"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "logistics_shipment_sources" ADD CONSTRAINT "logistics_shipment_sources_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "organisations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "logistics_shipment_sources" ADD CONSTRAINT "logistics_shipment_sources_shipmentId_fkey" FOREIGN KEY ("shipmentId") REFERENCES "logistics_shipments"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "logistics_shipment_sources" ADD CONSTRAINT "logistics_shipment_sources_requirementId_fkey" FOREIGN KEY ("requirementId") REFERENCES "logistics_fulfilments"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "logistics_shipment_sources" ADD CONSTRAINT "logistics_shipment_sources_fulfilmentLineId_fkey" FOREIGN KEY ("fulfilmentLineId") REFERENCES "logistics_fulfilment_lines"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "logistics_tracking_events" ADD CONSTRAINT "logistics_tracking_events_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "organisations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "logistics_tracking_events" ADD CONSTRAINT "logistics_tracking_events_shipmentId_fkey" FOREIGN KEY ("shipmentId") REFERENCES "logistics_shipments"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "logistics_load_stops" ADD CONSTRAINT "logistics_load_stops_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "organisations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "logistics_load_stops" ADD CONSTRAINT "logistics_load_stops_loadId_fkey" FOREIGN KEY ("loadId") REFERENCES "logistics_loads"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "logistics_load_stops" ADD CONSTRAINT "logistics_load_stops_shipmentId_fkey" FOREIGN KEY ("shipmentId") REFERENCES "logistics_shipments"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "logistics_receipt_lines" ADD CONSTRAINT "logistics_receipt_lines_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "organisations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "logistics_receipt_lines" ADD CONSTRAINT "logistics_receipt_lines_receiptId_fkey" FOREIGN KEY ("receiptId") REFERENCES "logistics_receipts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "logistics_returns" ADD CONSTRAINT "logistics_returns_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "organisations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "logistics_returns" ADD CONSTRAINT "logistics_returns_partyId_fkey" FOREIGN KEY ("partyId") REFERENCES "parties"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "logistics_return_lines" ADD CONSTRAINT "logistics_return_lines_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "organisations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "logistics_return_lines" ADD CONSTRAINT "logistics_return_lines_returnId_fkey" FOREIGN KEY ("returnId") REFERENCES "logistics_returns"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "logistics_operations" ADD CONSTRAINT "logistics_operations_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "organisations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "logistics_carrier_rules" ADD CONSTRAINT "logistics_carrier_rules_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "organisations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "logistics_saved_views" ADD CONSTRAINT "logistics_saved_views_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "organisations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "logistics_notes" ADD CONSTRAINT "logistics_notes_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "organisations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
