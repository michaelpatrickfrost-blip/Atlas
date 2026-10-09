# Atlas delivery checklist

> **Current deployment target — 7 October 2026:** Every finished app change must
> be deployed and verified at https://atlassystem.online. This supersedes the earlier
> Desktop/Mac-only and data-only-server restrictions. Preserve central records,
> backups, tenant/capability checks and profile permissions. See AGENTS.md and
> [deployment](DEPLOY.md).


Service checkpoints updated 7 October 2026; other checkpoints retain their recorded dates. This is the working delivery tracker, not a declaration that Atlas is a complete ERP. Checkboxes describe specific accepted workflows. A module's catalogue entry or schema alone never earns a tick.

## Reports workspace — 9 October 2026

- [x] Modern Reports utility, distinct from Dashboards; initial detailed coverage
  Customers, Products, Sales, Inventory, Logistics, Manufacturing and Finance,
  plus authorised summaries from other apps. Live source `2a8522f` accepted:
  all 14 detailed datasets and 48 authorised summaries passed public preview/XLSX
  checks, with filters, selected columns, permissions and responsive layouts.
  Evidence: `docs/evidence/2026-10-09-reports.md`.
- Reports preserves source permissions and private Finance scope, supports top
  filters/columns/preview and explicit formatted Excel downloads (10,000-row bound).
  See [Reports](modules/REPORTS.md) for scope; this does not mark the broader Finance
  reporting checkpoints complete.

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
| Projects / Meetings / KPIs | Canonical work-management workspace with detailed Gantt, versioned date edits, dependencies, milestones and baseline variance; evidence in PROJECTS_WORKSPACE.md | Full 256-section acceptance, advanced collaboration/workflow/capacity, live ERP/Finance processing and installed desktop activation |
| Logistics / Finance / Purchasing | Planned | Fulfilment contracts, accounting design and reconciled end-to-end transactions |
| HR / Scheduling / Production | Partial foundations; acceptance open | Resource calendars, demand model, MRP and finite-capacity scheduler |
| Service / Tickets / Quality / Safety / Marketing | Core connected case/ticket/query server journey verified; existing Quality/Safety/Marketing foundations | Service advanced/native extensions and external delivery remain open; see module delivery evidence |
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

Grouped app-card Home with a light workspace-utility rail (9 October reference), crisp white workspaces and blue accents. The rail does not repeat apps; module workspaces retain their existing top menus. Rounded controls and bars, consistent top menus, clear active states, compact document layouts and short transitions. Desktop, tablet and phone are all supported targets. Projects uses Linear-like precision, Notion-like calm and Atlas business depth, per the full Projects brief; commercial documents follow the functional structure of the supplied Odoo screen with Atlas styling.

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
- [x] An Atlas owner creates an isolated organisation, initial roles and first administrator atomically from the console. Public sign-up is removed.
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
- [x] CSV template, validation, preview and transactional customer import, including parent/branch codes. Atlas owners use the company setup portal; company administrators keep the customers file under Company administration → Imports.
- [ ] Improve quick-create into a polished full-record flow; capture all required data without a giant form.
- [ ] Complete account-manager editing, hierarchy roll-ups, duplicate merge and document management.

## 3. Products and Pricing — separate business-wide apps

- [ ] Products app: shared SKU/product code, catalogue/category code, product/service type, units, standard price and tax category.
- [ ] Pricing app: independent pricelists, currencies, date validity and quantity breaks.
- [ ] Explain price source: customer contract → selected/default pricelist → standard price.
- [x] Product and pricelist CSV templates, preview, validation and imports. The owner portal also covers price lists, warehouses, locations and employees.
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
- [ ] Customer contract pricing now lives on Pricing agreements (assigned list, special prices, payment terms and a service promise) and on the customer Commercial tab. Stock reservations and allocation visibility remain open; commercial/fulfilment/invoice/payment/credit states remain separate.

## 6. Inventory and Logistics

- [ ] Inventory app: warehouse creation, balances, reasoned movements and audit history.
- [ ] Transactional stock updates prevent negative balances and duplicate request processing.
- [ ] Shared products and on-hand availability appear in sales line entry.
- [ ] Add bins, lots, serials, units, transfers, counts, reservations, reorder policies and valuation.
- [ ] Logistics app: dispatch workspace, allocations, pick/pack, partial shipments, carriers, proof of delivery and exceptions.
- [ ] Returns: RMA, receipt, inspection, restock/quarantine/scrap and Finance credit handoff.
- [ ] Reconcile sales quantities, reservations, shipment quantities and stock movements under concurrency.

## 7. Projects, meetings and team work

Michael requests all 256 [Projects requirements](modules/PROJECTS_SOURCE_REQUIREMENTS.md)
as one scope without delivery phase gates. The new broad workspace extends the
existing records; [implementation and verification](modules/PROJECTS_WORKSPACE.md)
and [open coverage](modules/PROJECTS_COVERAGE.md) supersede the former basic
customer-project/Monday-style plan. Source/build/synthetic browser/database evidence
is not full acceptance or installed desktop activation.

- [x] Detailed Gantt planning deployed 8 October: versioned date saves, dependencies, milestones, baseline variance, 28 live checks and 25 planning regressions; see Projects evidence.
- [ ] Accept every requirement and all supplied permission/dependency/view/workload/ERP/automation/budget/update/document scenarios.
- [ ] Complete configurable workflows/roles, external collaboration/forms, rich simultaneous editing and full view/bulk/drag interactions.
- [ ] Complete working calendars/leave-aware capacity/resource forecasting, multi-stage approvals, nested portfolio/goals and advanced templates.
- [ ] Deliver real Finance cost/billing and Procurement/Manufacturing/Logistics/Service providers, durable event processing and reconciliation.
- [ ] Verify remaining Projects scope on the required live server with protected central records/backups; optional desktop packaging does not replace server acceptance.

## 8. Goals & KPIs

8 October: connected targets read Sales value, Finance posted revenue/profit, valid
CSAT, visible resolved cases, actual production completions/on-time performance and
shipment dispatch. Bounded goal dates, direct rate/snapshot judgement, source access,
existing-goal connections and source-app/dashboard views are implemented. See
[Goals & KPIs](modules/GOALS_KPIS.md) and CURRENT_STATE for deployment verification.
Private personal/PIP/development workflows retain their existing scope.

- [x] Separate Goals app, shared/private access, owner/target/direction/period and notes.
- [x] Team filtering and source-owned calculation definitions for nine connected results.
- [x] Bounded actuals, denominator counts, source links, existing-goal connection and matching dashboard targets.
- [ ] Arbitrary formulas, weighting/roll-ups, recurring periods and employee attribution.
- [ ] Goal review meetings, historical snapshot/trend archive and automated notifications.

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

3 October: source foundations now include self-service holiday/contacts, direct-team
approvals, private manager/HR notes, actual timesheets and the separate Scheduling
weekly board/bulk shifts/tasks. See [delivery and release limits](modules/STAFF_SCHEDULING.md).
8 October: connected HR home, internal recruitment/accepted-offer handover, learning
and qualification records, document renewals and operational workforce reports extend
those foundations. See [HR platform scope](modules/HR_PLATFORM.md) and CURRENT_STATE
for checks/deployment evidence. Broader HR acceptance remains open.

- [x] HR source workflows: employee directory, lifecycle tasks, internal recruitment, training/qualification register, document metadata/expiry, leave, policies and restricted-data checks.
- [ ] HR: public recruiting, document uploads/signatures, benefits, configurable probation, course delivery and unattended notifications.
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
  Core browser/server workflow is verified; automatic escalation delivery, broader integrations and native transport remain open.
  See [connected service desk](modules/SERVICE_WORK_DESK.md), [live acceptance](modules/SERVICE_WORK_ACCEPTANCE.md), and historical [241-section coverage](modules/CUSTOMER_SERVICE_COVERAGE.md).
- [x] Core connected service journey: purchase/delivery complaint → internal Query → independently approved/posted credit, RMA/replacement/NCR and approved recovery → resolution/immutable CSAT; live acceptance passed on 7 October 2026.
- [x] Tickets/Queries core: configurable service form, receiving queues, assignment, business-hours targets, private collaboration, independent approval, reasoned reopen and scoped reporting; automated and live browser/server checks passed. This does not close advanced change/CAB, portal, telephony or native transport.
- [ ] Quality: inspections, specifications, nonconformance, CAPA, traceability, supplier issues and holds/releases.
- [ ] Health & Safety: risks, incidents, near misses, inspections, training compliance, actions and restricted records.
- [ ] Marketing: source foundation includes strategy plans, budget allocations, channel calendar, audiences, consent, campaigns, content, versioned journey steps, CRM handoff and order attribution. External delivery, automatic scheduling and full brief completion remain pending; see docs/modules/MARKETING.md.
- [ ] Explicitly authorised sending and provider integrations; no pretend email/SMS delivery.

## 13. Mac app and central server

Shared-data rules and the isolated Blocwrite-host proposal: [TEST_SERVER_AND_LINKED_DATA.md](./TEST_SERVER_AND_LINKED_DATA.md). Atlas is running on the isolated private test service. Blocwrite was not restarted. A backup restore drill matched all 53 tables and 125 records.

- [x] Inspect server capacity and provision Atlas test hosting with an independent database, credentials, storage and service; protect Blocwrite from deployment and resource interference.

- [ ] Package Atlas software/UI/runtime on the Desktop/Mac, with server-only user-data persistence and secured data access; verify no remote Atlas UI/full-app dependency or local business-data store.
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

## Connected manufacturing target — 3 October 2026

Dedicated Planning and Manufacturing execution follow the complete
[manufacturing delivery gates](modules/MANUFACTURING_PLANNING.md), retaining all
[supplied requirements](modules/MANUFACTURING_SOURCE_REQUIREMENTS.md). Earlier
combined Production Planning references describe the domain, not final app packaging.
All new manufacturing gates remain open. The complete replacement source contains
sections 1–143; [section coverage](modules/MANUFACTURING_COVERAGE.md) tracks every
numbered requirement. Manufacturing phase order follows source sections 125–131:
foundation → production → financial manufacturing → planning → scheduling →
quality/maintenance/subcontract/genealogy → advanced workspaces and ATP/CTP.

## Logistics delivery source — 3 October 2026

- [ ] Implement and accept all [222 Logistics requirements](modules/LOGISTICS_COVERAGE.md), following source phases 198–207.
- [ ] Deliver the mandatory [Sales and Finance connections](modules/LOGISTICS_INTEGRATION.md), including partial fulfilment, holds/cancellation guards, valuation events, returns and freight reconciliation.
- [ ] Verify transactional events, idempotent consumers, replay, tenant/capability gates and reconciled operational/financial projections using server data and the desktop runtime.

The source is preserved verbatim in [LOGISTICS_SOURCE_REQUIREMENTS.md](modules/LOGISTICS_SOURCE_REQUIREMENTS.md). Documentation and existing provider types do not complete these gates.

## Production Planning and Inventory starting slice — 3 October 2026

Registered Production Planning (`/planning`) now has Sales/stock coverage, saved
product targets for annual/monthly/weekly/custom windows and team/person work
assignment. Inventory adds warehouse/product views, search, movement pagination,
atomic transfers and CSV exports. This is a starting slice, not accepted full
MPS/MRP/BOM/WIP/capacity scheduling. [Research and required acceptance](modules/PLANNING_RESEARCH.md)
records the user's industrial-planner requirement. All broad manufacturing gates
remain open. See CURRENT_STATE.md for fresh checks and activation evidence.

## Atlas Admin portal — 7 October 2026

- [x] Company accounts/profiles, entitlements, user roles and granular access,
  staff classifications and audited workspace switching implemented.
- [x] Full access for active Atlas staff; customer roles cannot grant platform access.
- [x] Company/staff recovery, archive/restore and complete company handover implemented.
- [x] Isolated typecheck/build, server deployment and all 31 authenticated live
  workflow checks passed; 40 focused tests and browser team review passed.

Scope: [Atlas Admin](ATLAS_ADMIN.md). Evidence: shared CURRENT_STATE. Completion
requires live server feature verification.


## S&OP connected implementation — 7 October 2026

8 October usability deployed and verified: guided Start here, monthly decision brief, simple
Setup, explained review checklists, Decisions & actions and independent How-to.
Research: [S&OP usability](plans/SOP_USABILITY_RESEARCH.md). All 28 new and 42 existing
live assertions pass; [release evidence](evidence/2026-10-08-sop-usability.md).

- [x] Source implementation: explicit Plan inputs, canonical projections, immutable
  cycles/versions, monthly demand/service/supply/assumed-finance reviews, scenarios,
  exact-version approvals and transactional Manufacturing publication.
- [ ] Complete remaining master-spec scope in [SOP.md](modules/SOP.md), including
  hierarchy/weekly grain, finite material/capacity review, actual cost/FX/budget,
  advanced OTIF policy, notifications and high-volume acceptance.
- [x] Server deployment, backed-up additive migration, Michael Test activation with
  existing permissions preserved, and all 42 authenticated end-to-end checks passed.
  Source checks: 655 tests passed / 22 integration skips, TypeScript/lint/build green.
  See [live acceptance](modules/SOP_ACCEPTANCE.md).
- [ ] After S&OP: four distinct researched Sales, Customer Service, Marketing and HR
  Plan modules. The current shared builder does not satisfy this later scope.


## Five operational apps — 8 October 2026

Michael requests Meetings (shared calendar, notes/actions and Outlook/Teams link),
Maintenance, Engineering / PLM, Fleet and Field Service as distinct apps. Working
source is deployed and enabled for Michael Test; all 62 live acceptance assertions pass. See
[operational app scope and boundaries](modules/OPERATIONAL_APPS.md).
This does not close broad warehouse/Finance/manufacturing integration or certify
Microsoft delivery without configured consent/provider evidence.
