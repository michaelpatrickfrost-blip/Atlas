# Atlas Logistics

Operational execution between commercial demand and physical movement.
Navigation is Today, Fulfil, Receive, Dispatch, Returns and Reports.
Picks, packages, waves, shipments, loads, receipts and returns open from that work.

The separate [222-section source brief](LOGISTICS_SOURCE_REQUIREMENTS.md) is unchanged.
[Coverage](LOGISTICS_COVERAGE.md) for that brief stays open. This document describes
the warehouse module that is registered and running.

## Domain ownership

Sales owns the commercial promise: order, quantities, requested and promised dates,
delivery terms, ship-to, customer PO, commercial holds and the partial-delivery rule.

Stock owns inventory truth: on-hand, reserved, available, warehouses, locations,
lots, serials, expiry, the stock ledger and valuation references. Logistics never
calculates that truth itself.

Logistics owns physical execution: fulfilment requirements, warehouse work,
allocation requests, picking, packing, packages, staging, shipments, loads,
carrier execution, tracking, delivery, proof of delivery, receiving, put-away,
operational transfers and returns.

Finance owns invoices, credit, receivables, freight accounting, credit notes,
refunds and journals. Logistics publishes events and does not post journals.
Warehouse screens show a hold label such as “Credit hold”, never a balance or margin,
unless `logistics.cost.read` is granted for carrier cost fields.

Purchasing will own purchase orders and commercial receipt tolerances. Logistics
records what arrived. Fleet will own vehicles. A load stores a vehicle label or
`fleetVehicleRef`, not a second vehicle master.

## Contracts

Core types live in `src/core/logistics/types.ts`. Sales calls
`src/core/logistics/handoff.ts`, which runs only when Logistics is enabled.
Sales and Customer Master do not query Logistics tables.

- `FulfilmentProjectionProvider` — allocated, picked, packed, shipped, delivered
  and returned quantities, next shipment, expected completion, hold label.
- `StockProvider` on the Stock manifest — availability, locations, lots, serials,
  reservations, and commands to reserve, release, move, receive, ship, return
  stock or report a discrepancy. Logistics loads it with `getModule("stock")`.
- `CarrierProvider` — rates, create, cancel, label, tracking, proof of delivery.
  No carrier-specific code is scattered through warehouse workflows. Rules choose
  a carrier code; a manual carrier is the default when no provider is connected.
- `PurchaseReceiptProvider`, `FleetProvider`, `RoutePlanningProvider`,
  `QualityProvider` and `ExternalFulfilmentProvider` are extension points.
  They are not live purchasing, fleet, route-optimisation, quality or 3PL systems.

## Fulfilment

A confirmed sales order creates one fulfilment requirement per order and split.
The requirement stores the order and line ids, customer, ship-to snapshot,
quantities, dates, partial-shipment policy, priority and warehouse preference.
It is not a copy of the sales order, and it is not a shipment.

Confirmation does not release work unless the company policy is Automatic and
there is no hold. Default policy is Standard mode (pick, pack, ship), reserve on
confirmation, release manually, barcode pack verification, over-pick prohibited,
FEFO removal, OTIF on or before the promised date, and in full at 100 percent.

Amendments update outstanding demand. Cancellation keeps already shipped quantity
and releases unused reservations. Drop-ship and direct-ship terms create a
supplier shipment record and no warehouse stock movement.

Allocation status is Unallocated, Part allocated, Allocated, Short or Blocked.
A shortage explains available, incoming and reserved-elsewhere quantities.

Company administration → Logistics chooses whether dispatch also records the delivery. Off, the shipment stays dispatched until someone confirms delivery. On, dispatch marks the shipment and a fully delivered order as delivered, and Finance receives the draft invoice dated that day. Existing companies start with the switch off.

Confirming delivery raises a draft sales invoice for the delivered quantity.
The invoice date is the delivery date, and the draft stays linked to the sales
order and the shipment. Finance posts it. Units already invoiced are not invoiced
again. A missing finance book does not undo the delivery.

## Warehouse work

One system, three modes:

- Simple: pick, then ship.
- Standard: pick, pack, then ship.
- Advanced: reserve, wave, pick, consolidate, pack, stage, load, then ship.

Pick methods are single, batch, wave, cluster and zone. Batch and wave keep one
task line per fulfilment line so a completion cannot merge stock onto the wrong
order. Cluster assigns Bin A, Bin B and so on. Zone splits A, B and Bulk.

The scanner asks for the location, then the product. A wrong scan stops the step.
Lot-controlled products require a lot. Serial-controlled products require a serial.
Expired lots are refused. A short pick can report a stock discrepancy; that does
not silently change the inventory balance. Claiming a task uses an optimistic
version and names the person who already has it.

Packages are handling units. A company catalogue starts with pallet, carton, box, crate, stillage, IBC, roll cage and container, and a warehouse can add, retire or remove a type that has never been packed. A pallet, crate, stillage, roll cage or container can hold other units. How many of a SKU fit on a pallet comes from the product. Packing records the quantity, size and weight, and a pallet cannot take more of that SKU than the product allows. Completing the pack builds the shipment from those units. Dispatch can download a courier CSV and choose the columns, including SKU, items per pallet, size, address, customer PO and delivery date. Weight variance above the configured band needs review.
Shipments move through Planning, Ready, Labelled, Staged, Loaded, Dispatched,
In transit, Delivered, Exception and Cancelled. Own-fleet work uses a Load.
Departure refuses a stop that was not loaded, then dispatches each shipment.

## Inbound and returns

Expected receipts can come from a purchase, transfer, return or an authorised
manual receipt. Over-receipt follows the configured tolerance. Damaged goods
land in quarantine. Put-away moves from receiving to a scanned destination.
Cross-dock is a suggestion, not the default.

A transfer moves stock to an in-transit position at the destination. It stays
on the ledger and is not pickable until the destination receipt.

Returns are return authorisations, not negative sales orders. Status runs from
Requested through Awaiting goods, Received, Inspecting and Closed. Inspection
dispositions are Restock, Quarantine, Repair, Replace, Scrap, Return to supplier,
Customer keeps item, and Investigation. Replace requires a replacement fulfilment
id that Sales created. Restock and scrap request Stock movements. Finance receives
`logistics.return.received`, `logistics.return.inspected` and
`logistics.return.resolved`.

## OTIF, events and permissions

On time means delivered on or before the promised date. If there is no promised
date, on time is unknown rather than assumed. In full uses the company percentage.
The booleans and failure reason are stored on the delivery.

Important commands and sales events use `LogisticsOperation` request keys.
Stock movements and reservations use their own request keys. Scanning twice,
confirming twice, or receiving a carrier callback twice does not double-move stock.

Published events use the `logistics.*` names in `src/core/events/bus.ts`, including
fulfilment, pick, pack, shipment, receipt, return and transfer milestones.
Global activity records those milestones, not every barcode scan.

Capabilities are `logistics.fulfilment.read`, `logistics.fulfilment.release`,
`logistics.pick.read`, `logistics.pick.execute`, `logistics.pick.override`,
`logistics.pack.execute`, `logistics.shipment.read`, `logistics.shipment.create`,
`logistics.shipment.dispatch`, `logistics.shipment.cancel`,
`logistics.receipt.execute`, `logistics.receipt.override`,
`logistics.return.read`, `logistics.return.authorise`, `logistics.return.inspect`,
`logistics.return.resolve`, `logistics.dispatch.manage`, `logistics.route.manage`,
`logistics.exception.resolve`, `logistics.report.read`, `logistics.cost.read`
and `logistics.policy.manage`.

## Reporting

Today answers what needs moving, what is late, what is blocked and what must
leave before cut-off. Reports cover fulfilment volume, OTIF, cycle time between
confirm, release, pick, pack, dispatch and delivery, carrier operational cost
when permitted, returns and receiving. Saved views can be private or company-wide.

## Deferred

Live carrier APIs, SSCC and ZPL printing, scales, dimensioners, photograph bytes,
a persistent offline scan queue, mathematical route optimisation, labour-capacity
planning, a purchasing module, a fleet vehicle master, a quality suite, 3PL
execution, and a second stock-counting engine. Discrepancies are reported to Stock.
The 222-section source coverage is not closed by this module.
