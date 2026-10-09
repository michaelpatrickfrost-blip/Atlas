# Sales order processing — implementation and delivery map

User specification: [105-section Sales specification](SALES_FUNCTIONAL_SPEC.md). Next module: [185-section CRM specification](CRM_FUNCTIONAL_SPEC.md). CRM owns relationship/pipeline work; Sales owns quotations and commercial orders. Customer Master owns Party, Contact and Address; Products and Pricing are shared business catalogues, never customer-specific copies.

## Delivered in this Sales batch

- [x] Separate top navigation for Orders, Quotations, Reporting, Catalogue, Pricelists, Audit and Settings.
- [x] Direct new sale and quotation composers, stable document references, customer hierarchy invoice/delivery addresses, customer defaults, PO and external references, delivery/expiry dates and terms.
- [x] Searchable product picker by SKU, name and category, unit, current catalogue/pricelist pricing and permission-gated on-hand stock.
- [x] Product, service/charge, section and note lines; fractional percentage discounts; optional quotation products excluded from totals and acceptance unless explicitly included.
- [x] Server-calculated pricing/tax/totals; currency consistency; tenant ownership validation. Authorised custom/overridden prices require reasons; calculated/agreed price decisions appear in the audit.
- [x] Draft editing with optimistic concurrency and atomic line replacement/audit; accepted quotations and confirmed commercial lines cannot be silently rewritten.
- [x] Quote lifecycle: draft, manually mark sent, decline/reset, duplicate, save reusable template, accept into one draft order. Acceptance is atomic, preserves quoted prices and excludes optional products; repeated acceptance opens the existing order.
- [x] Repeat a sale as a new draft using current product prices, with fresh PO/delivery review.
- [x] Numbered record workspaces with address snapshots, line totals, contextual tabs, linked customer/source quote and persistent Order Checks.
- [x] Confirmation checks required PO/reference/address, customer status, credit, VAT and configured commercial authority. Approval/holds remain visible; no external email dispatch is implied by Mark sent.
- [x] Confirmed revision snapshots and transactional durable outbox records; delivery scheduling checks the posted version, records requested/promised dates and preserves confirmed revisions.
- [x] Atomic whole-order cancellation preserves prior commercial snapshots plus the cancelled revision. Downstream fulfilment/financial cancellation restrictions must be implemented before those modules can consume orders.
- [x] Preview/download quotation and order acknowledgement PDFs with saved prices/totals, addresses, PO, terms, sections, notes, delivery dates and page numbers.
- [x] Search, owner/customer/tag/status/date filters, pagination and read-only workflow boards. Reporting groups order intake by currency/customer/owner/status; it does not label orders as invoiced revenue.
- [x] Per-company switches prohibit new customer/product creation across mutation/import paths, plus configurable discount and currency-value approval thresholds (settings UI currently GBP/EUR/USD).
- [x] Tenant/capability checks, isolated real-database acceptance journey and PDF pagination checks.

## Remaining scope — not claimed complete

The 105-section specification is the product target, not the status of this release. Foundation work is partially implemented; all six phases retain work.

| Phase | Next delivery | Required integration boundary |
| --- | --- | --- |
| 1 — Core transactions | Operational Sales overview, saved views/bulk actions, configurable numbering, customer quick-create without losing the draft, richer template editing/branding, order acknowledgement issue history, quote revisions and merge/copy policies, configurable tax/UOM/rounding, broad acceptance coverage | Shared Customer Master, Products, Pricing, permissions and audit |
| 2 — Commercial intelligence | Immutable price-decision entities, margin/cost snapshots and field permissions, contract precedence, discount tiers, credit authority/override reasons, proper proposed/approved confirmed amendments | Pricing, Finance credit projection, shared approvals |
| 3 — Supply | Availability/ATP, allocation and backorders, supplier/production promises, reservation lifecycle, stock-aware cancellation guards | Inventory, Purchasing, Production |
| 4 — Logistics | Shipment/release/partial-delivery workflow, picking, packing, proof of delivery, returns and serial/batch traceability | Logistics events and fulfilment projections |
| 5 — Finance | Invoice requests, invoices/credit notes, payment allocation, aged debt, exposure reconciliation, financial cancellation guards, country-specific tax/accounting | Finance owns postings; Sales requests and displays status |
| 6 — Advanced | Call-off agreements and shared project links are in CRM, quotations and sales orders. Recurring contracts, configurable automation, integrations and richer analytics remain open | Durable subscribers, external integration audit and idempotency |

## Out of stock balances, then a delivery and an invoice — 3 October 2026

A confirmed order that cannot be allocated stays open. The short quantity is the balance. When a receipt, stock adjustment, purchase receipt or arriving transfer covers it, Atlas raises the delivery for that quantity and then the draft invoice. The invoice date is the delivery date. Finance still posts it. An order that must ship complete waits until the whole order can go. The earliest promised order is served first. Stock already allocated to a warehouse pick is left for that pick.

## Projects and call-offs — 3 October 2026

A delivery project is one Projects record. CRM, a quotation and a sales order store that project's id; the order also keeps the project reference for the document. Creating a project from those screens requires Projects access and does not copy the customer into a second project list.

A call-off order is the big order: customer, validity, agreed price and the full quantity. Add it from Sales → Call-offs, or by accepting a blanket quotation. It is not planning demand and it is not shipped in full. Deliver and invoice a quantity from that order each time. That delivery is a confirmed release at the agreed price, and Finance receives a draft invoice for those items only, dated on the delivery. The invoice needs Finance turned on and books in the order currency; a confirmed delivery that has no invoice can raise it once those books exist. Drafts and confirmed releases count against the open quantity; cancelling the release puts it back. Repeating or confirming a release is refused when the remaining quantity is not enough.

Still open in this phase: recurring contracts, delivery schedules on the agreement, configurable automation and the broader amendment/returns reporting items.

Independent commercial, supply, fulfilment and financial status projections remain to be completed. The present order screen reports the commercial state and explicitly says supply is pending integration. Whole units and two-decimal minor-unit currencies are the current numerical model; currency-specific decimal precision/UOM conversions are not complete. A UK delivery, or a sale with no country chosen yet, adds VAT at 20% unless the product is zero-rated or exempt. A delivery address outside the UK is an export and carries no VAT. An overall discount can be applied or removed at the end of the sale; it is taken off before VAT. Zero-rated and exempt products stay at 0% in the UK. A quotation line shows when the product is out of stock. Hovering that mark shows the date free stock is forecast to cover the quantity, from the next expected receipt or from production (the open production order when that quantity is at least the plan, otherwise the plan). The line can stay on the confirmation. Choosing “Deliver and invoice when back in stock” keeps the balance open until stock covers it, then raises the delivery and the draft invoice.

## Durability and security

Confirmation, confirmed delivery scheduling and cancellation write a SalesOrderRevision and DomainOutbox row in the same database transaction as the business state/audit. Runtime database grants prohibit UPDATE/DELETE of revision snapshots and audit rows. Migration/backup administration remains a privileged operator responsibility.

Outbox events are durable but no background dispatcher or downstream consumer is installed yet. Before integrations go live, add retry/backoff, idempotent consumers, dead-letter review, replay tooling and projection reconciliation. Existing in-process events remain compatibility notifications, not proof that finance/stock work completed.

Draft edits compare the client document's updatedAt value. A stale edit/schedule fails without deleting lines or writing a misleading audit. Standard form actions guard state/capability; full concurrency and proposal workflows across all legacy amendment/hold/approval paths remain a further hardening task.

## Reference research

- [Odoo 19 quotation workflows](https://www.odoo.com/documentation/19.0/applications/sales/sales/sales_quotations.html)
- [Odoo optional products](https://www.odoo.com/documentation/19.0/applications/sales/sales/sales_quotations/optional_products.html)
- [Odoo reporting fundamentals](https://www.odoo.com/documentation/19.0/applications/essentials/reporting.html)
- [Odoo quotation templates, SaaS 19.3](https://www.odoo.com/documentation/saas-19.3/applications/sales/sales/sales_quotations/quote_template.html)

These inform workflow structure. Atlas retains its own presentation, tenancy rules and cross-module contracts.

## Next: CRM

The new CRM specification is queued immediately after this Sales release. Start with a gap map of the existing CRM implementation, then transactional opportunity history, stage criteria, account/contact links, saved views and My Work. Reporting/dashboard configuration and forecast snapshots are core delivery priorities, not cosmetic charts. Reuse shared Party/Contact identities rather than introducing the document's illustrative crm_account/crm_contact tables as duplicate master data. Email/calendar/sequences and AI need explicit provider configuration and must never pretend communications or consequential updates happened.


## Sales and customer network refinement

See [Sales/customer network checklist](SALES_CUSTOMER_NETWORK.md) for the current compact filters, saved views, exports, autosaved drafts, optional hierarchy/trading accounts and downstream handoff implementation. That checklist supersedes earlier statements here that saved views or exports have not been built. The latest build is local; installation and downstream consumers remain separate work.

## Mandatory Logistics and Finance connection — 3 October 2026

The [Logistics integration contract](LOGISTICS_INTEGRATION.md) requires Sales
fulfilment/dispatch/delivery/return projections and Finance-controlled holds,
invoicing, credit and accounting status. Preserve order/line/revision references
through splits and consolidation. Replace the shippedQuantity=0 placeholder in
cancelLineRemaining and add whole-order downstream cancellation guards before
consumers go live. All integration acceptance remains open; the
[222-section Logistics source](LOGISTICS_SOURCE_REQUIREMENTS.md) is the full target.

## Export proforma and customer invoice templates — 3 October 2026

Sales → Templates is the menu of invoice templates. A template chooses the address and the other details printed for a customer. Attach it on the customer account, including the invoice address, consignee and notify party. The consignee is printed even when that address is the account’s billing address. An export template always includes weight, volume, commodity code, country of origin, Incoterms and the exporter’s identity. Those weights and volumes come from the product. Saving an export sale raises a proforma with that sale. Confirming the sale issues it, and waits until the export facts are complete. The proforma states that it is not a tax invoice. Finance still owns the tax invoice.

## Sales workspace tabs — 3 October 2026

New/edit composers open on Sale (customer, pricing, billing, references and lines),
with separate Invoice (the customer’s template, and export weight, volume and customs details), Delivery (destination, requested date and instructions) and Notes
(customer-facing notes and internal Finance instructions). Panels remain mounted
inside one form so tab changes retain values and full submission/autosave payloads.
Totals remain visible across all sections. Saved orders have Sale, Delivery and
Notes sections; PDF actions explicitly name the order acknowledgement.

This does not implement Logistics vehicle assignment/picking or Finance invoices.
These remain integration gates above. Delivery and internal Finance instructions
are not passed to the existing customer PDF renderer; customer notes intentionally
appear on quotations/acknowledgements. The export proforma is a sales document
raised with the sale. A Finance tax invoice remains a separate document.

## Finance connection refinement — 3 October 2026

The earlier “awaiting Finance” statements are superseded for reviewed order-based
invoicing: Sales Connections now displays Finance-owned invoices and linked
credit/debit notes via Core contracts and separate receivables permission. Finance
can generate one draft from a confirmed commercial revision, preserving source
lines/customer/products/totals, with an explicit legal entity, billing basis,
reason and due date. Blankets/internal orders, active holds, absent revision and
unverified tax mapping block generation. Approvals and posting remain in Finance.
Unposted invoice voids retain history; active financial documents block whole-order
cancellation transactionally. Confirmed partial-line cancellation awaits a safe
revision/fulfilment/Finance workflow. Credit exposure reconciliation, dispatch-based
invoice requests, returns/COGS and automatic durable consumers remain open.
See [Finance delivery](FINANCE_WORKSPACE.md) and CURRENT_STATE.md for actual release
checks. Source presence alone does not prove installed acceptance of later batches.


### CRM contracts ownership — 7 October 2026

Contracts & approvals is at /crm/contracts in CRM. The former Sales URL redirects
with filters preserved. Sales retains order processing and source quotation links.
New/edit order entry places delivery, pricing and notes/tags in separate tabs.

## Shared stock and invoice-chain correction — 8 October 2026

The order Delivery tab labels the cross-product forecast as Projected stock,
separately from physical available-now stock. Shared Inventory availability matches
fulfilment to each active base-unit sales line, caps progress per line and removes
shipped goods from inventory demand once. Outstanding expected receipts are incoming
only; historical deliveries cannot erase today's demand. Promise calculations retain
all dated arrivals rather than truncating at twelve.

Invoice-chain references and quantities require enabled Finance and receivables read.
Finance's `salesInvoiceChainProvider` applies its own document/project scope; Inventory
consumes the narrow Core contract rather than directly querying invoice metadata.
The Delivery table scrolls within its panel at small widths. These are projections,
not protected ATP/CTP or full time-phased pegging. Release evidence: CURRENT_STATE.

## Connected records — 8 October 2026

Connections now contains the shared Related records panel: accepted quotation,
actual linked manufacturing, fulfilment, shipments, permitted Finance documents and
canonical customer/products. Each owning module scopes its contribution; unavailable
or disabled apps do not disclose linked records. Empty groups are omitted. Delivery
links directly to the first actual fulfilment record; split deliveries remain
individually listed in Connections. Existing Finance invoice actions are retained.

## Order workspace refinement — 9 October 2026

Orders is a dedicated destination alongside Quotations and All sales. Their
workspace headers and summary cards preserve the existing filters, saved views,
exports, selections and document actions. Quotation rows/counts/tag metadata are
queried only with quotation read rights; combined status boards avoid duplicated
quotation cards. Order detail brings its value, line count and next commercial step
forward while retaining the existing approval, delivery and financial workflows.
Order identity/value and selling actions come first; billing/reference details
and recovery guidance are collapsible, while linked service, messages, campaigns
and projects live in Connections. The UI refinement does not change order
posting/fulfilment rules. Final source and
live checks are recorded in CURRENT_STATE.md.
