-- Widen operational quantities without rounding or changing existing records.
ALTER TABLE "price_list_entries" ALTER COLUMN "minimumQuantity" TYPE DECIMAL(18,6) USING "minimumQuantity"::DECIMAL(18,6);
ALTER TABLE "agreement_prices" ALTER COLUMN "minimumQuantity" TYPE DECIMAL(18,6) USING "minimumQuantity"::DECIMAL(18,6);
ALTER TABLE "sales_agreement_lines" ALTER COLUMN "committedQuantity" TYPE DECIMAL(18,6) USING "committedQuantity"::DECIMAL(18,6);
ALTER TABLE "sales_quote_lines" ALTER COLUMN "quantity" TYPE DECIMAL(18,6) USING "quantity"::DECIMAL(18,6);
ALTER TABLE "sales_order_lines" ALTER COLUMN "orderedQuantity" TYPE DECIMAL(18,6) USING "orderedQuantity"::DECIMAL(18,6);
ALTER TABLE "sales_order_lines" ALTER COLUMN "cancelledQuantity" TYPE DECIMAL(18,6) USING "cancelledQuantity"::DECIMAL(18,6);
ALTER TABLE "inventory_balances" ALTER COLUMN "quantity" TYPE DECIMAL(18,6) USING "quantity"::DECIMAL(18,6);
ALTER TABLE "inventory_movements" ALTER COLUMN "delta" TYPE DECIMAL(18,6) USING "delta"::DECIMAL(18,6);
ALTER TABLE "internal_moves" ALTER COLUMN "quantity" TYPE DECIMAL(18,6) USING "quantity"::DECIMAL(18,6);
ALTER TABLE "stock_positions" ALTER COLUMN "quantity" TYPE DECIMAL(18,6) USING "quantity"::DECIMAL(18,6);
ALTER TABLE "stock_forecasts" ALTER COLUMN "quantity" TYPE DECIMAL(18,6) USING "quantity"::DECIMAL(18,6);
ALTER TABLE "stock_reservations" ALTER COLUMN "quantity" TYPE DECIMAL(18,6) USING "quantity"::DECIMAL(18,6);
ALTER TABLE "stock_discrepancies" ALTER COLUMN "systemQuantity" TYPE DECIMAL(18,6) USING "systemQuantity"::DECIMAL(18,6);
ALTER TABLE "stock_discrepancies" ALTER COLUMN "reportedQuantity" TYPE DECIMAL(18,6) USING "reportedQuantity"::DECIMAL(18,6);
ALTER TABLE "logistics_fulfilment_lines" ALTER COLUMN "orderedQuantity" TYPE DECIMAL(18,6) USING "orderedQuantity"::DECIMAL(18,6);
ALTER TABLE "logistics_fulfilment_lines" ALTER COLUMN "cancelledQuantity" TYPE DECIMAL(18,6) USING "cancelledQuantity"::DECIMAL(18,6);
ALTER TABLE "logistics_fulfilment_lines" ALTER COLUMN "allocatedQuantity" TYPE DECIMAL(18,6) USING "allocatedQuantity"::DECIMAL(18,6);
ALTER TABLE "logistics_fulfilment_lines" ALTER COLUMN "pickedQuantity" TYPE DECIMAL(18,6) USING "pickedQuantity"::DECIMAL(18,6);
ALTER TABLE "logistics_fulfilment_lines" ALTER COLUMN "packedQuantity" TYPE DECIMAL(18,6) USING "packedQuantity"::DECIMAL(18,6);
ALTER TABLE "logistics_fulfilment_lines" ALTER COLUMN "shippedQuantity" TYPE DECIMAL(18,6) USING "shippedQuantity"::DECIMAL(18,6);
ALTER TABLE "logistics_fulfilment_lines" ALTER COLUMN "deliveredQuantity" TYPE DECIMAL(18,6) USING "deliveredQuantity"::DECIMAL(18,6);
ALTER TABLE "logistics_fulfilment_lines" ALTER COLUMN "returnedQuantity" TYPE DECIMAL(18,6) USING "returnedQuantity"::DECIMAL(18,6);
ALTER TABLE "logistics_task_lines" ALTER COLUMN "requiredQuantity" TYPE DECIMAL(18,6) USING "requiredQuantity"::DECIMAL(18,6);
ALTER TABLE "logistics_task_lines" ALTER COLUMN "confirmedQuantity" TYPE DECIMAL(18,6) USING "confirmedQuantity"::DECIMAL(18,6);
ALTER TABLE "logistics_package_contents" ALTER COLUMN "quantity" TYPE DECIMAL(18,6) USING "quantity"::DECIMAL(18,6);
ALTER TABLE "logistics_shipment_sources" ALTER COLUMN "quantity" TYPE DECIMAL(18,6) USING "quantity"::DECIMAL(18,6);
ALTER TABLE "logistics_receipt_lines" ALTER COLUMN "expectedQuantity" TYPE DECIMAL(18,6) USING "expectedQuantity"::DECIMAL(18,6);
ALTER TABLE "logistics_receipt_lines" ALTER COLUMN "receivedQuantity" TYPE DECIMAL(18,6) USING "receivedQuantity"::DECIMAL(18,6);
ALTER TABLE "logistics_return_lines" ALTER COLUMN "quantity" TYPE DECIMAL(18,6) USING "quantity"::DECIMAL(18,6);
ALTER TABLE "logistics_return_lines" ALTER COLUMN "receivedQuantity" TYPE DECIMAL(18,6) USING "receivedQuantity"::DECIMAL(18,6);
ALTER TABLE "quality_holds" ALTER COLUMN "quantity" TYPE DECIMAL(18,6) USING "quantity"::DECIMAL(18,6);

ALTER TABLE "products" ALTER COLUMN "safetyStockLevel" TYPE DECIMAL(18,6), ALTER COLUMN "monthlyUsage" TYPE DECIMAL(18,6), ALTER COLUMN "averageDailyDemand" TYPE DECIMAL(18,6);
ALTER TABLE "product_bom_lines" ADD COLUMN "enteredQuantityPerUnit" DECIMAL(18,6), ADD COLUMN "enteredUnit" TEXT, ADD COLUMN "baseUnit" TEXT, ADD COLUMN "conversionFactor" DECIMAL(24,12);
ALTER TABLE "inventory_movements" ADD COLUMN "enteredQuantity" DECIMAL(18,6), ADD COLUMN "enteredUnit" TEXT, ADD COLUMN "baseUnit" TEXT, ADD COLUMN "conversionFactor" DECIMAL(24,12);

-- Preserve the operator's count entry separately from its resulting stock correction.
ALTER TABLE "stock_discrepancies" ADD COLUMN "enteredQuantity" DECIMAL(18,6), ADD COLUMN "enteredUnit" TEXT, ADD COLUMN "conversionFactor" DECIMAL(24,12);

ALTER TABLE "internal_moves" ADD COLUMN "requestFingerprint" TEXT;

ALTER TABLE "stock_production_batches" ALTER COLUMN "quantity" TYPE DECIMAL(18,6), ALTER COLUMN "collectedQuantity" TYPE DECIMAL(18,6);
ALTER TABLE "stock_production_collections" ALTER COLUMN "quantity" TYPE DECIMAL(18,6);

ALTER TABLE "stock_reservations" ADD COLUMN "requestFingerprint" TEXT;

-- Compatibility bridge: the retained Int client truncates NUMERIC fractions.
-- Prevent fractional writes until this Decimal-capable release is the rollback runtime.
ALTER TABLE "price_list_entries" ADD CONSTRAINT "atlas_quantity_bridge_28de83a6d7ef0141" CHECK ("minimumQuantity"=trunc("minimumQuantity"));
ALTER TABLE "agreement_prices" ADD CONSTRAINT "atlas_quantity_bridge_f019d11c2bbdbab8" CHECK ("minimumQuantity"=trunc("minimumQuantity"));
ALTER TABLE "sales_agreement_lines" ADD CONSTRAINT "atlas_quantity_bridge_e4d5a6af19460ea5" CHECK ("committedQuantity"=trunc("committedQuantity"));
ALTER TABLE "sales_quote_lines" ADD CONSTRAINT "atlas_quantity_bridge_65915fd29c44d3a8" CHECK ("quantity"=trunc("quantity"));
ALTER TABLE "sales_order_lines" ADD CONSTRAINT "atlas_quantity_bridge_549dfaec7166acbb" CHECK ("orderedQuantity"=trunc("orderedQuantity"));
ALTER TABLE "sales_order_lines" ADD CONSTRAINT "atlas_quantity_bridge_f06c13d032ad02d0" CHECK ("cancelledQuantity"=trunc("cancelledQuantity"));
ALTER TABLE "inventory_balances" ADD CONSTRAINT "atlas_quantity_bridge_94445611d3b28d0e" CHECK ("quantity"=trunc("quantity"));
ALTER TABLE "inventory_movements" ADD CONSTRAINT "atlas_quantity_bridge_a7bf1e809ea516cc" CHECK ("delta"=trunc("delta"));
ALTER TABLE "internal_moves" ADD CONSTRAINT "atlas_quantity_bridge_0c646ceacaada273" CHECK ("quantity"=trunc("quantity"));
ALTER TABLE "stock_positions" ADD CONSTRAINT "atlas_quantity_bridge_ba5d2d110a1988ae" CHECK ("quantity"=trunc("quantity"));
ALTER TABLE "stock_forecasts" ADD CONSTRAINT "atlas_quantity_bridge_09444b4210e02e31" CHECK ("quantity"=trunc("quantity"));
ALTER TABLE "stock_reservations" ADD CONSTRAINT "atlas_quantity_bridge_489528774c505326" CHECK ("quantity"=trunc("quantity"));
ALTER TABLE "stock_discrepancies" ADD CONSTRAINT "atlas_quantity_bridge_310e3099a768c9dc" CHECK ("systemQuantity"=trunc("systemQuantity"));
ALTER TABLE "stock_discrepancies" ADD CONSTRAINT "atlas_quantity_bridge_9dad5101d50d01b7" CHECK ("reportedQuantity"=trunc("reportedQuantity"));
ALTER TABLE "logistics_fulfilment_lines" ADD CONSTRAINT "atlas_quantity_bridge_4e145e25ca427e54" CHECK ("orderedQuantity"=trunc("orderedQuantity"));
ALTER TABLE "logistics_fulfilment_lines" ADD CONSTRAINT "atlas_quantity_bridge_2cb48cb8e3956f58" CHECK ("cancelledQuantity"=trunc("cancelledQuantity"));
ALTER TABLE "logistics_fulfilment_lines" ADD CONSTRAINT "atlas_quantity_bridge_5c266d3479b9d7e3" CHECK ("allocatedQuantity"=trunc("allocatedQuantity"));
ALTER TABLE "logistics_fulfilment_lines" ADD CONSTRAINT "atlas_quantity_bridge_3c0ac1d30c05df7c" CHECK ("pickedQuantity"=trunc("pickedQuantity"));
ALTER TABLE "logistics_fulfilment_lines" ADD CONSTRAINT "atlas_quantity_bridge_9f78e5793115df23" CHECK ("packedQuantity"=trunc("packedQuantity"));
ALTER TABLE "logistics_fulfilment_lines" ADD CONSTRAINT "atlas_quantity_bridge_8ea9253fa022248e" CHECK ("shippedQuantity"=trunc("shippedQuantity"));
ALTER TABLE "logistics_fulfilment_lines" ADD CONSTRAINT "atlas_quantity_bridge_cb31200b158064f6" CHECK ("deliveredQuantity"=trunc("deliveredQuantity"));
ALTER TABLE "logistics_fulfilment_lines" ADD CONSTRAINT "atlas_quantity_bridge_d9d1b35825b30c29" CHECK ("returnedQuantity"=trunc("returnedQuantity"));
ALTER TABLE "logistics_task_lines" ADD CONSTRAINT "atlas_quantity_bridge_15385427ed7ba6b4" CHECK ("requiredQuantity"=trunc("requiredQuantity"));
ALTER TABLE "logistics_task_lines" ADD CONSTRAINT "atlas_quantity_bridge_d4033047a08cc78b" CHECK ("confirmedQuantity"=trunc("confirmedQuantity"));
ALTER TABLE "logistics_package_contents" ADD CONSTRAINT "atlas_quantity_bridge_b6bba79a2b38d4b7" CHECK ("quantity"=trunc("quantity"));
ALTER TABLE "logistics_shipment_sources" ADD CONSTRAINT "atlas_quantity_bridge_92a5102f3a51fadf" CHECK ("quantity"=trunc("quantity"));
ALTER TABLE "logistics_receipt_lines" ADD CONSTRAINT "atlas_quantity_bridge_85a52d6154d21d13" CHECK ("expectedQuantity"=trunc("expectedQuantity"));
ALTER TABLE "logistics_receipt_lines" ADD CONSTRAINT "atlas_quantity_bridge_4a50cc71013be7c1" CHECK ("receivedQuantity"=trunc("receivedQuantity"));
ALTER TABLE "logistics_return_lines" ADD CONSTRAINT "atlas_quantity_bridge_d2865d5352b8893c" CHECK ("quantity"=trunc("quantity"));
ALTER TABLE "logistics_return_lines" ADD CONSTRAINT "atlas_quantity_bridge_581ebb834324f6bd" CHECK ("receivedQuantity"=trunc("receivedQuantity"));
ALTER TABLE "quality_holds" ADD CONSTRAINT "atlas_quantity_bridge_6717f4070d03ea3b" CHECK ("quantity"=trunc("quantity"));
ALTER TABLE "stock_production_batches" ADD CONSTRAINT "atlas_quantity_bridge_7008c78a01b6c722" CHECK ("quantity"=trunc("quantity"));
ALTER TABLE "stock_production_collections" ADD CONSTRAINT "atlas_quantity_bridge_93d075d719a4f894" CHECK ("quantity"=trunc("quantity"));
ALTER TABLE "stock_production_batches" ADD CONSTRAINT "atlas_quantity_bridge_4cba9bc251387c31" CHECK ("collectedQuantity"=trunc("collectedQuantity"));

ALTER TABLE "quality_inspections" ALTER COLUMN "quantityInspected" TYPE DECIMAL(18,6);
ALTER TABLE "non_conformances" ALTER COLUMN "quantityAffected" TYPE DECIMAL(18,6);
ALTER TABLE "quality_inspections" ADD CONSTRAINT "atlas_quantity_bridge_cd75d2719305738f" CHECK ("quantityInspected"=trunc("quantityInspected"));
ALTER TABLE "non_conformances" ADD CONSTRAINT "atlas_quantity_bridge_34cb350e34e18c54" CHECK ("quantityAffected"=trunc("quantityAffected"));

ALTER TABLE "products" ADD CONSTRAINT "atlas_quantity_bridge_9988d95078825992" CHECK ("safetyStockLevel"=trunc("safetyStockLevel"));

ALTER TABLE "products" ADD CONSTRAINT "atlas_quantity_bridge_1a62441fcf48da17" CHECK ("monthlyUsage"=trunc("monthlyUsage"));

ALTER TABLE "products" ADD CONSTRAINT "atlas_quantity_bridge_aa5fa705b812e04f" CHECK ("averageDailyDemand"=trunc("averageDailyDemand"));
