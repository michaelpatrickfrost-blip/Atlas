# Atlas delivery checklist

Updated 3 October 2026. This is the working delivery tracker, not a declaration that Atlas is a complete ERP. Checkboxes describe specific accepted workflows. A module's catalogue entry or schema alone never earns a tick.

## Current position and first delivery batch

**Legend:** `[x]` is a completed, evidenced checkpoint; `[ ]` is still open. “Foundation exists” means there is working code to build on, not a finished ERP module. The detailed feature checkboxes below stay open until their complete acceptance checks pass.

- [x] Record the agreed visual direction and separate module ownership.
- [x] Write a phased plan for every requested module, including Finance and forecast-driven Production Planning.
- [x] Register separate CRM, Sales, Products, Pricing, Inventory, Projects and KPI app foundations; registry tests pass.
- [x] Verify selected server safeguards: foreign-pipeline stages, disabled CRM writes, authenticated-company chat, missing permissions, invented permissions and administrator self-lockout. Six targeted tests pass; this is not a full tenant-security audit.
- [x] Validate the current code baseline: production build and its TypeScript check, ESLint, and 65 automated tests pass on 3 October 2026.
- [ ] Accept the redesigned shell and app menus at desktop, tablet and mobile widths.
- [ ] Complete one connected acceptance journey: customer → assigned pricelist → product-backed quote → order → stock reservation → delivery → invoice.

| Area | Current position | Next acceptance checkpoint |
| --- | --- | --- |
| Platform / Customers | User, role, signup, hierarchy, chat and audit foundations exist | Full company-isolation tests; customer default pricing; mobile visual review |
| Products / Pricing | Separate apps, product codes, pricelists and import foundations exist | Catalogue editing, default assignment and import preview/apply verification |
| CRM | Separate app, stage movement and curated dashboards exist | Pipeline usability, qualification rules, accurate reporting and full record lifecycle |
| Sales | Product-backed document composer and order record foundations exist | Quote revisions, PO/tax confirmation rules, complete conversion and stock allocation |
| Inventory | Warehouse balances and movement ledger exist | Concurrent adjustments, reservations, transfers and counts |
| Projects / Meetings / KPIs | Project, task, meeting and manual scorecard foundations exist | Board/timeline usability, timezone correctness, assigned actions and automatic metrics |
| Logistics / Finance / Purchasing | Planned | Fulfilment contracts, accounting design and reconciled end-to-end transactions |
| HR / Scheduling / Production | Planned | Resource calendars, demand model, MRP and finite-capacity scheduler |
| Service / Quality / Safety / Marketing | Planned | Connected operational records, approvals, restricted access and reporting |
| Mac / paid add-ons | Private SSH Mac client and isolated test server running; entitlement foundation exists | Notarised distribution, billing and production release verification |

**Next batch:** finish the visual system and customer/catalogue/pricing/Sales journey before opening another major module. Start with app menus, rounded controls, consistent spacing and mobile tables; then verify imports and customer defaults; then enforce confirmation rules and connect inventory reservations. Follow with Logistics and Finance so an order can become a delivered, correctly invoiced transaction.

## Latest verified delivery

- [x] Deploy the icon-launcher shell with app switching and separate module top menus to the private test service. Full mobile acceptance remains open.
- [x] Add product/category/all-product pricing rule calculation with quantity, date, percentage, amount and explicit conversion tests.
- [x] Use customer default pricing in commercial documents with tenant-safe relation validation.
- [x] Generate paginated quote PDFs from saved records; rendering and PDF tests pass.
- [x] Separate Atlas operator access from company roles; reject forged platform capabilities and suspended memberships in session tests.
- [x] Install isolated Mac/server test connection and verify backup restore without overwriting live data.

Research and remaining acceptance journeys: [ODOO_MODULE_GAP_ANALYSIS.md](./ODOO_MODULE_GAP_ANALYSIS.md). These checkpoints do not close the broader feature lists below.

## Design direction

Icon-launcher home, crisp white workspaces and blue accents; no permanent sidebar. Rounded controls and bars, consistent top menus, clear active states, compact document layouts and short transitions. Desktop, tablet and phone are all supported targets. Projects takes inspiration from Monday; commercial documents follow the functional structure of the supplied Odoo screen with Atlas styling.

## Delivery order

| Phase | Focus | Dependency / reason |
| --- | --- | --- |
| 1 | Product design, platform, company security, Customer Master | Every workflow depends on trustworthy shared records and access |
| 2 | Products, Pricing, CRM and Sales | Establish catalogue, prices, customer relationship and commercial demand |
| 3 | Inventory and Logistics | Fulfil orders with traceable stock, deliveries and returns |
| 4 | Projects, meetings, tasks and KPI scorecards | Connect team work and measurable outcomes |
| 5 | Finance and Purchasing | Build reconciled subledgers and double-entry accounting on reliable transactions |
| 6 | HR, Scheduling, Production Planning | Use people, materials, demand and capacity together |
| 7 | Service, Quality, Safety, Marketing | Extend connected operational workflows with clear permissions |
| 8 | Mac distribution, commercial entitlements and launch hardening | Package and sell verified modules against a secured central service |

## 1. Design and platform

- [ ] Finish the approved app-home/white/blue design system and visually verify every implemented workspace.
- [ ] Build desktop/mobile acceptance tests for shell, menus, tables, forms, boards and customer map.
- [ ] Company signup creates an isolated organisation, initial roles and creator membership atomically.
- [ ] User creation, role assignment and permission editing work with visible errors and save feedback.
- [ ] Test cross-company direct actions, record relations and disabled module access.
- [ ] Add verified invitations, password reset, email verification, MFA, session revocation and distributed rate limiting.
- [ ] Add data retention/export, backups, recovery drills and independent security review before launch.
- [ ] Add purchase entitlements separately from enablement; module dependencies and permissions remain server-enforced.

## 2. Customer Master

- [ ] Editable Group → Customer → Branch hierarchy with circular-reference validation.
- [ ] Interactive customer landscape: connected cards, collapse/expand, search and customer-type filters.
- [ ] Canonical customer, contacts, delivery sites, invoice addresses, tax, bank and credit sections.
- [ ] Attach a default business pricelist and ordering rules to a customer.
- [ ] CSV template, validation, preview and transactional customer import, including parent/branch codes.
- [ ] Improve quick-create into a polished full-record flow; capture all required data without a giant form.
- [ ] Complete account-manager editing, hierarchy roll-ups, duplicate merge and document management.

## 3. Products and Pricing — separate business-wide apps

- [ ] Products app: shared SKU/product code, catalogue/category code, product/service type, units, standard price and tax category.
- [ ] Pricing app: independent pricelists, currencies, date validity and quantity breaks.
- [ ] Explain price source: customer contract → selected/default pricelist → standard price.
- [ ] Product and pricelist CSV templates, preview, validation and imports.
- [ ] Add complete product records, categories, variants, multiple units, customer-specific codes and supplier references.
- [ ] Add image/document uploads, archived products, duplicate/code policies and import job/error exports.
- [ ] Add margin guidance, approved overrides, discount groups and price version history.

## 4. CRM

- [ ] Separate CRM app, routes, navigation and services from Sales order processing.
- [ ] Drag-and-drop pipeline persists stage changes with a keyboard/touch alternative and tenant/pipeline validation.
- [ ] Prospect lifecycle, opportunity record, activities, stakeholders, next actions and history.
- [ ] Saved personal dashboard layouts using live CRM data, owner/date filtering and separate currency totals.
- [ ] Customer/opportunity links to quotations and projects.
- [ ] Configurable stage requirements, pipeline administration and guided qualification.
- [ ] Deep reporting: cohort conversion, source/campaign attribution, stage velocity, slippage, forecast changes, rep/team performance and targets.
- [ ] General report designer: dataset, filters, grouping, measures, chart type, saved views, export, sharing permissions and metric definitions.
- [ ] Email/calendar/telephony integrations, consent-aware communication and automation.

## 5. Sales

- [ ] Document-style quote/order composer: customer, invoice/delivery address, PO number, dates, terms, project and CRM opportunity.
- [ ] Product line table: SKU/catalogue code, quantity, unit, on-hand stock, price source, discount, tax and amount; calculated totals.
- [ ] Save an atomic draft with customer/product/pricelist links and address/price snapshots.
- [ ] Quote record and quote-to-order handoff retain origin, products, prices and addresses.
- [ ] Order record: details, lines, confirmation, holds, approvals and change history.
- [ ] Enforce required PO/reference rules, supported tax treatment and valid confirmation transitions.
- [ ] Complete quote editing, revisions, templates, PDFs, controlled send/sign/acceptance and expiry.
- [ ] Complete order amendment, partial cancellation, returns authorisation, blanket/call-off orders and commercial reporting.
- [ ] Customer contract pricing, stock reservations and allocation visibility; commercial/fulfilment/invoice/payment/credit states remain separate.

## 6. Inventory and Logistics

- [ ] Inventory app: warehouse creation, balances, reasoned movements and audit history.
- [ ] Transactional stock updates prevent negative balances and duplicate request processing.
- [ ] Shared products and on-hand availability appear in sales line entry.
- [ ] Add bins, lots, serials, units, transfers, counts, reservations, reorder policies and valuation.
- [ ] Logistics app: dispatch workspace, allocations, pick/pack, partial shipments, carriers, proof of delivery and exceptions.
- [ ] Returns: RMA, receipt, inspection, restock/quarantine/scrap and Finance credit handoff.
- [ ] Reconcile sales quantities, reservations, shipment quantities and stock movements under concurrency.

## 7. Projects, meetings and team work

- [ ] Customer project records with status, notes and linked quotations.
- [ ] Monday-style task table with owner, due date, project, meeting linkage and status updates.
- [ ] Meetings with agenda, attendees and linked assigned actions.
- [ ] Add board/table/calendar/timeline views, drag-and-drop, dependencies, milestones, files and comments.
- [ ] Add capacity, time logging, budget/actuals, profitability, recurring tasks and notifications.
- [ ] Locate the earlier project-management reference before transplanting any design. NEW PROGRAME currently appears to be Vocal Clinic Pro.

## 8. Goals & KPIs

- [ ] Separate KPI app: team, owner, unit, target, direction, period, progress and update history.
- [ ] Filter scorecards by team and audit progress updates.
- [ ] Add automatic metric sources, calculation definitions, baseline/thresholds, weighting, roll-ups and recurring periods.
- [ ] Add team scoreboards, review meetings, trend charts, data freshness and permission-controlled dashboard sharing.

## 9. Finance and Purchasing

Finance scope is researched against primary product documentation and UK digital-record requirements; implementation needs a dedicated accounting build.

- [ ] General ledger: chart of accounts, balanced journals, posting periods, immutable posting and reversing entries.
- [ ] Receivables: invoices/credits, deposits, payment terms, collections, ageing, allocations and customer credit.
- [ ] Payables: supplier bills/credits, approvals, payment proposals, expenses and ageing.
- [ ] Bank/cash: statement import, matching rules, reconciliation, controls and bank integration adapters.
- [ ] Tax: jurisdiction/localisation policies, VAT evidence, return calculations, audit trace and MTD-compatible integration.
- [ ] Reports: trial balance, P&L, balance sheet, cash flow, budgets, dimensions, projects/departments and period comparison.
- [ ] Assets, depreciation, accruals, deferrals, foreign exchange and consolidation where required.
- [ ] Purchasing: shared suppliers, RFQs, POs, approvals, receipts, landed costs and three-way matching.
- [ ] Reconcile every report to the ledger and every stock/invoice event to its source document before release.

## 10. HR and Scheduling & Hours

- [ ] HR: employee records, departments, contracts, leave, policies, skills, training and restricted-data permissions.
- [ ] Scheduling: availability, shifts, rotations, leave, skills/certification constraints and overtime rules.
- [ ] Hours: time capture, timesheets, breaks, approval, project/work-centre costing and Payroll export.
- [ ] Payroll remains a separately validated jurisdiction-specific engine; employee access is separate from app membership.

## 11. Production Planning and scheduler

- [ ] Product/BOM revisions, routes, operations, resources, work centres and calendars.
- [ ] Demand plan: confirmed orders, forecast versions, forecast consumption and stock/replenishment targets.
- [ ] MPS/MRP: BOM explosion, available stock, reservations, scheduled receipts, lead times, lot sizes and demand pegging.
- [ ] Finite capacity scheduler: machines, labour, skills, shifts, downtime, setup/changeovers and routing constraints.
- [ ] Explain shortages, capacity overloads and date changes; propose options rather than hiding infeasibility.
- [ ] Drag-and-drop Gantt with constraint checking, locked/frozen periods, manual overrides and audit reasons.
- [ ] What-if plans, baseline/version comparison, approval/release and promise-date feedback to Sales.
- [ ] Execution: work orders, material issue/output, scrap/rework, quality gates and actual-versus-plan reporting.

## 12. Service, Quality, Health & Safety and Marketing

- [ ] Customer Service: cases, complaints, inbox, ownership, SLAs, escalation, communication and resolution.
- [ ] Quality: inspections, specifications, nonconformance, CAPA, traceability, supplier issues and holds/releases.
- [ ] Health & Safety: risks, incidents, near misses, inspections, training compliance, actions and restricted records.
- [ ] Marketing: audiences, consent, campaigns, journeys, assets, scheduling, attribution and reporting.
- [ ] Explicitly authorised sending and provider integrations; no pretend email/SMS delivery.

## 13. Mac app and central server

Shared-data rules and the isolated Blocwrite-host proposal: [TEST_SERVER_AND_LINKED_DATA.md](./TEST_SERVER_AND_LINKED_DATA.md). Atlas is running on the isolated private test service. Blocwrite was not restarted. A backup restore drill matched all 53 tables and 125 records.

- [x] Inspect server capacity and provision Atlas test hosting with an independent database, credentials, storage and service; protect Blocwrite from deployment and resource interference.

- [ ] Package a native macOS client pointing at the hosted HTTPS Atlas service; preserve mobile/browser access.
- [x] Keep database credentials and tenant authorization on the server. The client is never the security boundary.
- [ ] Add server selection, environment labelling, reconnect/error states, secure session handling and external-link controls.
- [ ] Sign/notarise, install/update and test Intel/Apple Silicon; document distribution and support.
- [ ] Define offline/read caching and conflict rules before allowing offline business mutations.

## Verification gate and tick policy

An item receives a tick only when its named workflow exists, relevant validation/security tests pass, typecheck/lint/production build pass, and its UI has been reviewed where applicable. A tick applies to that item, not every feature in its module. Keep remaining gaps visible. Do not start another major module while the preceding foundation cannot build or run.

Detailed module boundaries and dependencies: [MODULE_ROADMAP.md](./MODULE_ROADMAP.md). Finance research sources are listed below; production scheduling requirements are specified in section 11.

## Finance research sources

- [Odoo accounting scope](https://www.odoo.com/documentation/19.0/applications/finance/accounting.html): accounting workflows and reporting reference.
- [Odoo bank reconciliation](https://www.odoo.com/documentation/19.0/applications/finance/accounting/bank/reconciliation.html): statement matching and reconciliation reference.
- [Microsoft Business Central general ledger](https://learn.microsoft.com/en-gb/dynamics365/business-central/finance-general-ledger): ledger, accounts and posting reference.
- [HMRC Making Tax Digital for VAT](https://www.gov.uk/government/publications/vat-notice-70022-making-tax-digital-for-vat/vat-notice-70022-making-tax-digital-for-vat): UK digital records and VAT integration requirements.

These sources inform the proposed scope; they do not establish that Atlas already implements or complies with it.

## Sales specification delivery and next module

The current Sales batch and remaining six-phase scope are tracked in [SALES_ORDER_PROCESSING.md](modules/SALES_ORDER_PROCESSING.md). The user’s complete Sales and CRM specifications are preserved verbatim in docs/modules. CRM is next after the Sales verification/deployment gate; it stays independent of commercial order processing.
