# Atlas: researched module scope and connected workflows

Reviewed 3 October 2026 against Odoo 19 documentation. These are implementation requirements for Atlas, not claims that every Odoo feature exists here. The reference explains established workflows; the Atlas proposals below are our design decisions. A working foundation is not a complete ERP module. Track delivery in [IMPLEMENTATION_PLAN.md](./IMPLEMENTATION_PLAN.md).

## Product experience and shared data

The latest agreed design (9 October 2026) uses grouped Home app cards, a separate workspace-utility rail, crisp white workspaces, blue accents, rounded controls and compact horizontal module menus. Business workspaces use the supplied wide Apps panel with responsive grouped columns. Every app follows the same patterns: overview, work queue, records, reporting and configuration. Creation opens a focused dialog or document editor; advanced fields appear in sections. Mobile tables scroll inside their container, while navigation remains usable without a desktop mouse. Never make an enabled app tile imply that unfinished workflows work.

Customer Master owns Group → Customer → Branch identity, contacts and addresses. Products owns the business catalogue. Pricing owns price rules. Sales references these records and snapshots the commercial agreement. Inventory owns availability and movements; Logistics owns physical fulfilment; Finance owns postings and payments. A customer view aggregates those capabilities through providers rather than maintaining duplicate customer tables.

## Customers and company administration

**Reference:** Odoo separates user access configuration from company structures. [Access rights](https://www.odoo.com/documentation/19.0/applications/general/users/access_rights.html), [multi-company](https://www.odoo.com/documentation/19.0/applications/general/companies/multi_company.html).

**Atlas now:** shared customer records, hierarchy map, commercial preferences/default pricelist, users/roles, company signup, profile and audit foundations. A separate operator grant controls the Atlas company-account console; tenant roles cannot grant platform access. Paid entitlement is separate from a company's enable/disable preference.

**Still needed:** invitation lifecycle, deactivation UI, verified emails, password recovery, MFA, revocation, explicit subsidiary/operating-company model, duplicates/merge, custom fields, files, retention and full tenant isolation tests. Distinct SaaS tenants must not be treated as Odoo-style operational companies sharing records.

**Acceptance:** a branch uses its designated invoice/delivery contacts; foreign-tenant IDs fail on every write and export; a company admin cannot enable an unlicensed app or access the owner console.

## CRM

**Reference:** activity types and activity plans organise prospect follow-up. [CRM activities](https://www.odoo.com/documentation/19.0/applications/sales/crm/optimize/utilize_activities.html).

**Atlas now:** independent CRM workspace, prospect/opportunity records, pipeline movement, activities, forecasts and saved curated dashboards.

**Still needed:** configurable stage requirements, lost reasons, duplicate handling, lead assignment/scoring, inbound lead capture, structured qualification, email/calendar integration, team targets, attribution and forecast history. Reporting needs dataset definitions, filters, measures, grouping, drill-down, saved views and permission-controlled sharing, with currencies kept separate or explicitly converted.

**Acceptance:** moving to a qualified stage checks required data, records history and updates reports; winning an opportunity links a real customer, project and quote without creating copies. Keyboard/touch users can change stage.

## Products and Pricing

**Reference:** Odoo pricing covers fixed prices, discounts/formulas, products/categories, quantity/date conditions and currencies. [Pricelists](https://www.odoo.com/documentation/19.0/applications/sales/sales/products_prices/prices/pricing.html).

**Atlas now:** separate business-wide catalogue and pricelist apps; SKU/category codes; customer defaults; product/category/all-product rules; fixed, percentage and signed monetary adjustment methods; quantity breaks, dates, priority and explicit exchange-rate basis. Existing CSV imports support products and fixed product prices with previews.

**Still needed:** variants, barcode/unit conversions, category hierarchy, supplier/customer aliases, cost bases, margin floors, rounding, approval-controlled overrides, rule versioning and complete rule CSV imports. Currency precision must support non-two-decimal currencies before claiming universal currency support. Rates need date/source governance and finance integration.

**Acceptance:** the same server rule calculates the preview and saved quote. Product specificity wins over category/all rules; expired rules do not apply; conversion cannot silently relabel a price. Import rejects invalid codes and foreign-tenant relations before writing.

## Sales

**Reference:** quote PDF composition supports commercial document presentation. [PDF quote builder](https://www.odoo.com/documentation/19.0/applications/sales/sales/sales_quotations/pdf_quote_builder.html).

**Atlas now:** new quote and new order document editors, product-backed lines, PO, addresses, terms, quantity/discount/tax totals, price source, stock visibility, quote-to-order links and saved-record PDF downloads. Order approval/hold foundations exist.

**Still needed:** revisions, editing policy, optional products/sections/notes, quote templates and branded Unicode PDFs, signing/acceptance, authenticated email delivery, explicit required-PO/reference checks at confirmation, tax localisation, amendments/cancellations, deposits, blanket orders, allocations and invoicing policies.

**Acceptance:** customer → default pricelist → quote PDF → confirmed order retains agreed prices and address snapshots. Commercial, credit, fulfilment, invoice and payment states remain independent. Confirmation never fabricates a stock reservation or invoice.

## Inventory

**Reference:** Odoo inventory distinguishes warehouses, locations, movements, reservation and replenishment workflows. [Inventory and MRP](https://www.odoo.com/documentation/19.0/applications/inventory_and_mrp.html).

**Atlas now:** warehouse, balance and reasoned movement foundations; stock availability appears in commercial line entry.

**Still needed:** bins/locations, stock status, reservations, transfers, receipts, cycle counts, lot/serial traceability, units, reorder rules, expiry, valuation and concurrency-safe transaction/idempotency controls.

**Acceptance:** available = usable on-hand minus active reservations; a receipt raises stock once, a dispatch lowers stock once, a cancelled allocation releases its reservation. Parallel orders cannot over-allocate. Financial valuation reconciles to movement history.

## Logistics and returns

**Reference:** after-sales workflows connect returns, repairs and invoice credits. [After-sales services](https://www.odoo.com/documentation/19.0/applications/services/helpdesk/advanced/after_sales.html).

**Atlas status:** planned, not a finished dispatch app.

**Build:** delivery orders per shipment, pick/pack queues, partials/backorders, carrier adapters, labels, tracking, proof of delivery, exceptions and costs. Returns require RMA approval, receipt against original shipped quantities, inspection, restock/quarantine/scrap and a separately approved credit request.

**Acceptance:** a partial shipment affects only shipped quantities; a return cannot exceed fulfilled quantities; receiving a damaged return does not automatically make it saleable or issue a financial refund.

## Purchasing

**Reference:** bill controls depend on ordered/received quantities and three-way matching. [Bill control](https://www.odoo.com/documentation/19.0/applications/inventory_and_mrp/purchase/manage_deals/control_bills.html).

**Atlas status:** planned.

**Build:** shared supplier identities, supplier catalogue/prices, RFQs, comparisons, POs, approval limits, expected receipts, purchase returns, landed costs, supplier lead times and performance. Link each bill line to the PO/receipt and flag quantity/price/tax variances.

**Acceptance:** purchasing demand produces an approved PO; receipt records stock; Finance can match a supplier bill to authorised quantities and explain exceptions.

## Finance

**Reference:** accounting and bank reconciliation cover source transactions, matching and reporting. [Accounting](https://www.odoo.com/documentation/19.0/applications/finance/accounting.html), [bank reconciliation](https://www.odoo.com/documentation/19.0/applications/finance/accounting/bank/reconciliation.html).

**Atlas status:** shared finance contracts/credit data only; a full accounting app is not implemented.

**Build:** chart of accounts, balanced immutable journals/reversals, posting periods; receivables/invoices/credits/deposits/collections; payables/expenses/payment proposals; statement import/matching/reconciliation; VAT/localisation; assets/depreciation/accruals/deferrals; currency revaluation; budgets, dimensions and audit-linked reports. Bank transfers and statutory filing need actual provider integrations and explicit authorisation.

**Acceptance:** every posted journal balances; receivables/payables reconcile to the ledger; stock movements reconcile to valuation; trial balance, P&L and balance sheet agree. Tax reporting requires jurisdiction-specific validation before any compliance claim.

## Projects and meetings

**Reference:** task dependencies can block progress and appear in Gantt views. [Task dependencies](https://www.odoo.com/documentation/19.0/applications/services/project/tasks/task_dependencies.html). Calendar supports event scheduling. [Calendar](https://www.odoo.com/documentation/19.0/applications/productivity/calendar.html).

**Atlas now:** projects, task tables/status/assignment, meeting agenda/attendees and linked actions.

**Still needed:** Monday-inspired board/table/timeline/calendar views, task dependencies, milestones, recurring work, time/budgets, workload, files, comments, reminders, timezone-aware invitations and meeting decisions/minutes. Meetings remain a Projects workspace, with actions linked to canonical tasks.

**Acceptance:** an action assigned in a meeting appears in its owner's project/task queue; dependency cycles fail; a task update changes every view and audit once.

## Goals and KPIs

**Reference:** dashboards use data sources, filters and access configuration. [Dashboards](https://www.odoo.com/documentation/19.0/applications/productivity/dashboards.html).

**Atlas now:** team/owner/period/unit/direction targets, manual values, progress history and filtering.

**Still needed:** governed metric definitions, live dataset adapters, baseline/thresholds, weighted objectives, roll-ups, recurring periods, trends, review meeting links, freshness indicators and shared dashboard permissions. Chart access never bypasses underlying record permissions.

**Acceptance:** a metric exposes its numerator/denominator, filters, period and refresh time; drill-down matches the displayed value; users cannot infer another tenant's figures through aggregates.

## HR and Scheduling / Hours

**Reference:** employee management and leave are separate workflows; resource planning uses roles and calendars. [Employees](https://www.odoo.com/documentation/19.0/applications/hr/employees.html), [Time off](https://www.odoo.com/documentation/19.0/applications/hr/time_off.html), [Planning](https://www.odoo.com/documentation/19.0/applications/services/planning.html).

**Atlas status:** planned.

**Build:** restricted employee profiles, departments, contracts, skills/certifications, onboarding/offboarding, leave/accrual/approval and policy acknowledgements. Scheduling needs availability, shifts, recurring patterns, roles, leave conflicts and publication. Hours needs attendance, breaks, corrections, approvals, project costing and payroll export. An employee record is not automatically an application user.

**Acceptance:** approved leave blocks a proposed shift; certification expiry blocks restricted work; employee private records are excluded from ordinary search/chat. Payroll requires a separately validated country-specific implementation.

## Production Planning

**Reference:** MPS plans forecast/stock targets and suggests replenishment; manufacturing covers BOMs, work centres and execution. [MPS](https://www.odoo.com/documentation/19.0/applications/inventory_and_mrp/manufacturing/workflows/use_mps.html), [Manufacturing](https://www.odoo.com/documentation/19.0/applications/inventory_and_mrp/manufacturing.html).

**Atlas status:** planned. A scheduler chart alone does not constitute MRP.

**Build in order:** versioned BOMs/routings and resource calendars; forecast versions and order consumption rules; net requirements using usable stock/reservations/scheduled receipts; multi-level BOM explosion, lot sizes and lead times; purchasing/manufacturing suggestions with demand pegging; finite machine/labour capacity with setup, downtime, skills and shifts; what-if versions and approval/release; actual material/output/scrap/time recording.

**Experience:** explain shortages and late dates; drag a job only if constraints remain valid or a controlled override is recorded. Freeze near-term production. Report plan versus actual, schedule adherence, waste and resource utilisation.

**Acceptance:** forecast and orders are not double-counted; an unavailable component or overloaded work centre changes the promised date visibly; a proposal does not silently create a live PO/work order. Production output passes required quality gates before available stock increases.

## Customer Service / Complaints

**Reference:** tickets connect to commercial after-sales operations. [Helpdesk after-sales](https://www.odoo.com/documentation/19.0/applications/services/helpdesk/advanced/after_sales.html).

**Atlas status:** planned.

**Build:** cases/complaints, inbox, categories, severity, ownership, customer/order/product links, business-hour SLAs, escalation, communication log, knowledge base and resolution/customer satisfaction. Return/repair/credit requests are traceable linked records.

**Acceptance:** SLA clocks honour business hours; closing a complaint records outcome; a credit request follows Finance approval rather than changing an invoice directly.

## Quality

**Reference:** quality checks can be manual or triggered by configured control points. [Quality checks](https://www.odoo.com/documentation/19.0/applications/inventory_and_mrp/quality/quality_management/quality_checks.html).

**Atlas status:** planned.

**Build:** versioned specifications, sampling, receiving/in-process/final checks, measurements, nonconformance, containment, root cause, corrective/preventive actions, verification, supplier issues, calibration and traceability.

**Acceptance:** failed inspection holds the related lot/operation; release requires authorised review; corrective actions retain evidence, ownership, due dates and effectiveness verification.

## Health and Safety

**Reference:** HSE guidance covers risk management and incident investigation; this is a dedicated Atlas scope rather than a claim that Odoo has a complete safety app. [Risk management](https://www.hse.gov.uk/simple-health-safety/risk/steps-needed-to-manage-risk.htm), [incident investigation](https://www.hse.gov.uk/pubns/books/hsg245.htm).

**Atlas status:** planned.

**Build:** risk register/assessments, hazards/controls, incidents/near misses, inspections, corrective actions, training/certification, equipment checks and restricted investigation records. Statutory reporting rules and retention need jurisdiction-specific review.

**Acceptance:** high-risk findings create tracked actions; overdue controls surface in attention; sensitive incident/health evidence has distinct access and audit rules.

## Marketing

**Reference:** double opt-in supports confirmed consent workflows. [Double opt-in](https://www.odoo.com/documentation/19.0/applications/marketing/marketing_automation/campaign_templates/double_optin.html).

**Atlas status:** planned.

**Build:** consent/purpose/channel ledger, audiences/segments, suppression, assets, campaigns, scheduled messages/journeys, provider delivery events, UTM/source attribution and campaign-to-opportunity reporting. Transactional communication has separate rules from marketing.

**Acceptance:** an opted-out contact is suppressed immediately; consent evidence remains traceable; sent/delivered labels reflect actual provider responses. No simulated sending.

## Internal communication and audit

**Reference:** Discuss provides channels; chatter attaches collaboration to records. [Team communication](https://www.odoo.com/documentation/19.0/applications/productivity/discuss/team_communication.html), [Chatter](https://www.odoo.com/documentation/19.0/applications/productivity/discuss/chatter.html).

**Atlas now:** company chat/feed and audit foundations. Database runtime cannot update/delete audit records or grant platform administration.

**Still needed:** channel membership/privacy, mentions, notifications, attachments, record threads, retention, live updates, export and tamper-evident audit controls. Human conversation is distinct from immutable operational history.

## Mac, central service and extensibility

**Atlas now:** native Mac WebKit client; private SSH transport; isolated server service, database role and storage; daily backups and a successful temporary-database restore drill. New server modules appear without rebuilding the thin client.

**Still needed:** public HTTPS provisioning, signed/notarised distribution, automatic client updates, production monitoring, migrations/rollback policy, full security review, recovery objectives and offline conflict design. Subscription fields/entitlements are implemented; automated billing is not.

## Release gate

The first complete vertical journey is Customer → Pricing → Quote → Order → Reservation → Delivery → Invoice → Payment/Return. Test partials, concurrent writes, duplicate submissions, permissions, cross-tenant IDs and reversals at each step. Modules are only marked complete after the workflow, reporting, failure states and mobile UI have been verified. Catalogue stubs remain visibly planned.
