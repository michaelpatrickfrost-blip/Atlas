# Connected Logistics, Sales and Finance

Required by Michael on 3 October 2026. Logistics must link to both Sales and
Finance through real operational and financial workflows. This is an architecture
and acceptance requirement, not a claim that the integrations are implemented.
The full [222-section Logistics brief](LOGISTICS_SOURCE_REQUIREMENTS.md) is preserved
verbatim; [coverage](LOGISTICS_COVERAGE.md) keeps every section open until evidenced.

## Ownership and shared records

Sales owns the commercial order, prices, amendments and customer promise.
Logistics owns fulfilment orders, shipments, warehouse work, handling units, loads,
trips, stops, delivery and POD. These remain distinct entities with line-level
source references: one order can split across shipments; compatible orders can
consolidate into a shipment; a load can contain several shipments and stops.
Inventory owns the immutable quantity ledger and stock positions. Finance owns
valuation/accounting policy, invoices, credit notes, payments and journals.
Use shared Party, Product, UOM, organisation and site identities; do not duplicate
customer/product masters or create separate module databases.

## Mandatory Sales connection

- Consume confirmed, versioned Sales demand using stable order/line identities,
  quantities, delivery-address snapshots, dates and partial-delivery policy.
  Confirmation does not automatically authorise warehouse release.
- Check credit/payment/customer/manual/export holds and stock availability at
  release. Finance owns financial eligibility; Sales owns commercial holds.
  Missing eligibility must be explicit and must not silently become permission.
- Separate reservation from allocation. Return shortages, backorders and proposed
  dates to Sales without rewriting its commercial quantities or prices.
- Project allocated, picked, packed, dispatched, delivered, failed and returned
  quantities per order line, with shipment links, tracking, exceptions and POD.
  Commercial, supply, fulfilment and financial statuses remain independent.
- Coordinate amendments and cancellation against current reservations, warehouse
  work, dispatched quantities and financial commitments. Release unused reservations
  transactionally; posted movements require reversal/correction, never deletion.
- Link RMA and return receipts to original order/shipment lines. Inspection and
  disposition inform the commercial remedy; receipt alone never creates a credit.

## Mandatory Finance connection

| Operational source | Finance responsibility | Required traceability |
| --- | --- | --- |
| Goods issue / dispatch | Valuation, configurable COGS timing and invoice eligibility | Order line, shipment line, movement and valuation source |
| Count gain/loss, scrap, adjustments | Configurable posting rules and approval | Count/variance approval, reason and immutable movement |
| Transfer dispatch/receipt | In-transit valuation and legal-entity policy | Matched transfer lines and dispatch/receipt quantities |
| Freight estimate/accrual | Accrual, allocation and customer/order profitability | Shipment/load/trip, currency and allocation basis |
| Carrier invoice | Expected/actual matching, tolerance and approval | Carrier Party, invoice line, freight charge and variance |
| Return receipt/disposition | Credit eligibility, inventory value and write-off | RMA, original order/shipment, inspection and disposition |
| Packaging consumption | Inventory cost and configured accounting treatment | Handling unit, packaging product and movement |

Logistics emits operational facts through the shared accounting-event boundary;
Finance applies configured posting rules and creates journals. Warehouse code
must never select hard-coded debit/credit accounts. Invoicing and COGS timing
are Finance policy; dispatch, delivery and POD are separate facts. Finance returns
credit/hold, invoice, credit-note, payment and posting status for authorised Sales
and Logistics views. Pending/failed processing must remain visible and reconcilable.

## Delivery and security contract

Persist an event in the same server transaction as the originating change.
Consumers require tenant-scoped idempotency keys, retries/backoff, failure review,
replay and reconciliation. Keep source/version/correlation references through
operational events, accounting events and journals. Outbox presence is not proof
that a consumer ran. Register providers through the module registry; Core must
not import module internals outside that wiring point.

Server-side session, organisation, capability and enabled-module checks apply to
commands and projections, including linked records. Do not trust a supplied tenant
or order ID. Existing single-ID provider types must be bound to verified session
scope or extended before use; type definitions alone enforce no access control.

Atlas UI/application runtime remains on the Mac. Records, attachments, evidence,
backups and durable queues remain on the server through secured data access.
Source section 185's poor-connection requirement means clear retry and transient
in-memory task protection under this boundary; no persistent local business store
or offline movement queue is authorised. Failed connectivity must not fabricate
successful picks, dispatches, receipts or financial postings.

## Observed implementation and release gates

Inspection on 3 October 2026: Logistics remains a stub in
`src/modules/stubs.ts`, with no Logistics routes or module implementation. Finance
now has a registered foundation in `src/modules/finance/manifest.ts`; its old stub
is excluded from the runtime catalogue. The installed Apps screen shows Logistics
as Coming soon and Finance as Installed. No Logistics integration is delivered by
Finance catalogue enablement. `src/core/logistics/types.ts` and
`src/core/finance/types.ts` declare future providers/events. Sales writes durable
DomainOutbox records, but no operational downstream dispatcher/consumer is
installed. These contracts need delivery/status/link and tenant-context extensions;
they are not a completed Logistics integration.

`src/modules/sales/services/orders.ts` currently sets shippedQuantity to zero in
cancelLineRemaining; whole-order cancellation does not check downstream execution.
Replace both with atomic operational/financial guards before enabling consumers.
Existing Customer Master credit checks do not prove Finance-ledger integration.

Follow source phases 198–207: warehouse/locations/dimensions/handling units/movements
and counts; reservation/allocation/putaway/replenishment/work/scanning; fulfilment/
shipments/waves/picking; packing/staging; loads/docks/dispatch; transport/tracking/POD;
export; returns; freight accounting/reconciliation; then optimisation. Design Sales
and Finance contracts from phase 1; produce valuation/accounting events whenever
financially relevant movements start, rather than waiting for freight phase 9.

Acceptance must prove: partial dispatch preserves the open Sales balance;
consolidation preserves each source line; concurrent allocation cannot double-use
stock; replay cannot double-pick or double-post; holds block release; cancellation
cannot erase dispatched/posted quantities; an approved count loss reconciles quantity
and Finance value; inspected returns follow credit policy; carrier invoice variance
requires configured approval; foreign-tenant/disabled-module access fails; failed
consumers stay visible. Run all source tests 208–218 plus these integration gates.
The operational module now consumes confirmed Sales orders, projects fulfilment
without exposing Logistics tables, and publishes dispatch, delivery, receipt and
return events for Finance. It does not create journals. See [LOGISTICS.md](LOGISTICS.md).
The 222-section acceptance gates remain open. No live carrier invoice reconciliation
is accepted until a connected carrier and Finance policy exist.
