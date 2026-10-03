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
| 6 — Advanced | Frameworks, call-offs, recurring contracts, configurable automation, integrations and richer analytics | Durable subscribers, external integration audit and idempotency |

Independent commercial, supply, fulfilment and financial status projections remain to be completed. The present order screen reports the commercial state and explicitly says supply is pending integration. Whole units and two-decimal minor-unit currencies are the current numerical model; currency-specific decimal precision/UOM conversions are not complete. UK standard VAT is supported; unsupported tax cases block confirmation pending configuration rather than fabricating a rate.

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
