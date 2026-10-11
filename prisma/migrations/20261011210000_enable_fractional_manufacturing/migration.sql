-- Enable fractional quantities only after the Decimal-capable runtime is retained for rollback.
ALTER TABLE "price_list_entries" DROP CONSTRAINT "atlas_quantity_bridge_28de83a6d7ef0141";
ALTER TABLE "agreement_prices" DROP CONSTRAINT "atlas_quantity_bridge_f019d11c2bbdbab8";
ALTER TABLE "sales_agreement_lines" DROP CONSTRAINT "atlas_quantity_bridge_e4d5a6af19460ea5";
ALTER TABLE "sales_quote_lines" DROP CONSTRAINT "atlas_quantity_bridge_65915fd29c44d3a8";
ALTER TABLE "sales_order_lines" DROP CONSTRAINT "atlas_quantity_bridge_549dfaec7166acbb";
ALTER TABLE "sales_order_lines" DROP CONSTRAINT "atlas_quantity_bridge_f06c13d032ad02d0";
ALTER TABLE "inventory_balances" DROP CONSTRAINT "atlas_quantity_bridge_94445611d3b28d0e";
ALTER TABLE "inventory_movements" DROP CONSTRAINT "atlas_quantity_bridge_a7bf1e809ea516cc";
ALTER TABLE "internal_moves" DROP CONSTRAINT "atlas_quantity_bridge_0c646ceacaada273";
ALTER TABLE "stock_positions" DROP CONSTRAINT "atlas_quantity_bridge_ba5d2d110a1988ae";
ALTER TABLE "stock_forecasts" DROP CONSTRAINT "atlas_quantity_bridge_09444b4210e02e31";
ALTER TABLE "stock_reservations" DROP CONSTRAINT "atlas_quantity_bridge_489528774c505326";
ALTER TABLE "stock_discrepancies" DROP CONSTRAINT "atlas_quantity_bridge_310e3099a768c9dc";
ALTER TABLE "stock_discrepancies" DROP CONSTRAINT "atlas_quantity_bridge_9dad5101d50d01b7";
ALTER TABLE "logistics_fulfilment_lines" DROP CONSTRAINT "atlas_quantity_bridge_4e145e25ca427e54";
ALTER TABLE "logistics_fulfilment_lines" DROP CONSTRAINT "atlas_quantity_bridge_2cb48cb8e3956f58";
ALTER TABLE "logistics_fulfilment_lines" DROP CONSTRAINT "atlas_quantity_bridge_5c266d3479b9d7e3";
ALTER TABLE "logistics_fulfilment_lines" DROP CONSTRAINT "atlas_quantity_bridge_3c0ac1d30c05df7c";
ALTER TABLE "logistics_fulfilment_lines" DROP CONSTRAINT "atlas_quantity_bridge_9f78e5793115df23";
ALTER TABLE "logistics_fulfilment_lines" DROP CONSTRAINT "atlas_quantity_bridge_8ea9253fa022248e";
ALTER TABLE "logistics_fulfilment_lines" DROP CONSTRAINT "atlas_quantity_bridge_cb31200b158064f6";
ALTER TABLE "logistics_fulfilment_lines" DROP CONSTRAINT "atlas_quantity_bridge_d9d1b35825b30c29";
ALTER TABLE "logistics_task_lines" DROP CONSTRAINT "atlas_quantity_bridge_15385427ed7ba6b4";
ALTER TABLE "logistics_task_lines" DROP CONSTRAINT "atlas_quantity_bridge_d4033047a08cc78b";
ALTER TABLE "logistics_package_contents" DROP CONSTRAINT "atlas_quantity_bridge_b6bba79a2b38d4b7";
ALTER TABLE "logistics_shipment_sources" DROP CONSTRAINT "atlas_quantity_bridge_92a5102f3a51fadf";
ALTER TABLE "logistics_receipt_lines" DROP CONSTRAINT "atlas_quantity_bridge_85a52d6154d21d13";
ALTER TABLE "logistics_receipt_lines" DROP CONSTRAINT "atlas_quantity_bridge_4a50cc71013be7c1";
ALTER TABLE "logistics_return_lines" DROP CONSTRAINT "atlas_quantity_bridge_d2865d5352b8893c";
ALTER TABLE "logistics_return_lines" DROP CONSTRAINT "atlas_quantity_bridge_581ebb834324f6bd";
ALTER TABLE "quality_holds" DROP CONSTRAINT "atlas_quantity_bridge_6717f4070d03ea3b";
ALTER TABLE "stock_production_batches" DROP CONSTRAINT "atlas_quantity_bridge_7008c78a01b6c722";
ALTER TABLE "stock_production_collections" DROP CONSTRAINT "atlas_quantity_bridge_93d075d719a4f894";
ALTER TABLE "stock_production_batches" DROP CONSTRAINT "atlas_quantity_bridge_4cba9bc251387c31";
DROP INDEX "stock_production_batches_manufacturingOrderId_organisationId_key";
ALTER TABLE "quality_inspections" DROP CONSTRAINT "atlas_quantity_bridge_cd75d2719305738f";
ALTER TABLE "non_conformances" DROP CONSTRAINT "atlas_quantity_bridge_34cb350e34e18c54";

ALTER TABLE "products" DROP CONSTRAINT "atlas_quantity_bridge_9988d95078825992";

ALTER TABLE "products" DROP CONSTRAINT "atlas_quantity_bridge_1a62441fcf48da17";

ALTER TABLE "products" DROP CONSTRAINT "atlas_quantity_bridge_aa5fa705b812e04f";
