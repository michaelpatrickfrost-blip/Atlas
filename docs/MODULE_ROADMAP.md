# Atlas module architecture and delivery plan

> **Superseded deployment target — 3 October 2026:** The user requires Atlas
> software/UI/application runtime on the Desktop/Mac and shared user data stored
> only on the server. Remote hosting of the Atlas UI/full application and the
> hosted thin-client target below are historical, not the approved architecture.
> See AGENTS.md, .ai/ARCHITECTURE.md and [desktop/data runtime](DESKTOP_DATA_BOUNDARY.md). Minimal secured data access must retain
> server-side tenant/capability enforcement. Current deployment compliance is unverified.


Atlas is a modular ERP for smaller businesses: sophisticated business rules with a short, clear path through everyday work. Each app owns a workspace, business records, capabilities, events and customer overview contributions. A shared customer remains one Party across every app.

## Product structure

Core owns companies, accounts, memberships, roles, permissions, module entitlements, audit, chat, search, dashboards and Customer Master. Each company has its own organisationId; membership and capabilities are resolved on the server. Module access requires both an enabled app and an authorised user. User accounts and employee records are separate concepts.

CRM owns prospects, opportunities, relationships, activities, pipeline, forecasting and CRM reporting. Sales owns quotations and commercial orders. Projects owns personal and shared work/project execution and links to canonical Party records; it does not create another customer database.

The CRM capability namespace remains `sales.prospect.*`, `sales.opportunity.*`, etc. for compatibility with existing roles. This is a stored permission identifier, not a reason to combine the two workspaces again. Any future rename needs an explicit migration for roles.

## App catalogue and boundaries

| App | Records and responsibility | Everyday workspace | Integration contracts |
| --- | --- | --- | --- |
| CRM | Prospects, opportunities, stages, stakeholders, activities, forecasts, sources, targets | Dashboards, Today, Prospect, Pipeline, Forecast, Reports | Opportunity won; quote request; Party identity; campaign attribution |
| Sales | Quotes, revisions, order lines, commercial confirmation, holds, amendments, pricing overrides | Orders, Quotations; contextual detail panels | Confirmed order released to Logistics; invoice request to Finance; demand to Production; quote source from CRM |
| Projects | Customer projects, delivery milestones, tasks, budgets, actuals | Overview, Work, Schedule, Costs | Party, quote/order linkage, time entries, purchasing costs |
| Marketing | Campaigns, audiences, consent, journeys, assets, attribution | Overview, Campaigns, Audiences, Results | Consented Party/contact channels; prospect source; campaign touch events. No sending provider until configured |
| HR | Employees, departments, employment, leave, policies, skills | People, Leave, Organisation, Records | Membership is separate; availability to Scheduling; training status to Safety; approved hours to Payroll |
| Staff Scheduling (source foundation) | Shifts, assignments, availability, breaks and tasks; HR owns actual timesheets/approvals | Schedule, My hours, Approvals | Employee/skill/leave constraints; project/work-centre allocations; approved time export |
| Stock | Products, variants, units, warehouses, bins, lots, serials, inventory movements | Availability, Products, Movements, Counts | Canonical Product; reservation/availability interface; lot traceability |
| Logistics (operational module) | Fulfilment requirements, warehouse work, packages, shipments, loads, receipts, returns | Today, Fulfil, Receive, Dispatch, Returns, Reports | Sales handoff and fulfilment projection; StockProvider; Finance events; carrier, purchasing, fleet and route contracts |
| Planning (dedicated app; starting slice implemented) | Demand, forecasts, MPS, MRP, pegging, capacity, finite scheduling and scenarios | Demand, Plan, Materials, Capacity, Schedule | Shared Product/BOM/routing; demand/supply providers; resource calendars; controlled proposal conversion |
| Manufacturing (existing stub; execution target) | Production/work orders, release snapshots, MES, material consumption, outputs, WIP and costing | Production, Shop Floor, Engineering, Costs | Planning proposals; shared engineering versions; stock commands; Quality; Finance posting |
| Customer Service | Cases, complaints, SLA clocks, communications, resolution, escalation | Inbox, My cases, Escalations, Results | Party/contact; quote/order/shipment context; quality investigation; return request |
| Quality | Specifications, inspections, nonconformance, corrective/preventive actions, supplier quality | Checks, Issues, Actions, Trends | Product/lot/work order; complaint investigation; hold/release decisions with auditable approval |
| Health & Safety | Risk assessments, incidents, near misses, training, corrective actions, inspections | Today, Risks, Incidents, Compliance | Employee/location/equipment links; training constraints on scheduling; restricted incident permissions |
| Finance | Receivables, payables, invoices, credits, payments, journals, period controls, tax | Overview, Receivables, Payables, Accounts | Confirmed commercial amounts; invoice/payment statuses; customer credit exposure; immutable posted transactions |
| Purchasing | Suppliers, RFQs, purchase orders, receipts, approvals | Orders, Suppliers, Receipts | Shared Party with supplier extension; Product; production/material demand; stock receipt; Finance bills |
| Payroll | Pay runs, pay elements, deductions, approvals, exports | Runs, People, Exceptions | Approved hours and leave; employment terms; jurisdiction-specific calculation and filing adapters |
| Fleet | Vehicles, maintenance, inspections, utilisation | Vehicles, Maintenance, Schedule | Driver qualifications, logistics assignments, safety checks, purchasing costs |

## Shared contracts

- Party identity and hierarchy are Core. A parent account does not automatically grant access to another company's records. Site/contact/address selections must be validated against the selling company's tenant and the selected customer's allowed hierarchy.
- Product identity, units and tax category must be shared. Stock owns stock movements; Sales owns commercial lines; Production owns BOMs and material consumption intent.
- Money always includes currency and uses integer minor units. Reports never add currencies together without an explicit conversion policy and rate date.
- Sales order status has independent commercial, fulfilment, invoicing, payment and credit dimensions. Finance and Logistics supply their own states; Sales must not fabricate them.
- Documents preserve address, product description, price and tax snapshots. Later master-data edits must not rewrite issued documents.
- Approved or posted records have transitions, reversal/amendment policies and reasons; their history is retained.
- Every cross-app reference is validated server-side. Events carry organisationId and record IDs. Future asynchronous delivery requires durable outbox, idempotency and retries before it is enabled.

## Module packaging and paid add-ons

The catalogue describes availability; ModuleState stores per-company enablement. Paid entitlement and enablement are separate concepts: a purchased module can be disabled, but an unpurchased module cannot be activated by a client request. Billing/subscription integration is not implemented yet. Add an Entitlement record with source, valid-from/to and status, enforced by the same server-side access boundary before selling add-ons.

Dependencies describe necessary capabilities, not arbitrary marketing bundles. Core and Customer Master are included. CRM and Sales remain independently selectable. Logistics requires Stock; scheduling requires HR; Production requires Stock. A module cannot be disabled while an enabled module depends on it. Disabling hides access but preserves records for later reactivation and retention.

All implemented apps are enabled for new workspaces during development. Upcoming apps remain catalogue entries until their vertical slice works end to end. Do not sell a catalogue entry as a finished module.

## Interface rules

Use one app rail, a small set of app navigation items, and contextual controls on the record. Quiet monochrome line icons, rounded bars and panels, clear typography, consistent spacing and visible active states create the visual language. Short route, hover and save transitions respect reduced-motion preferences. Do not use an unbounded menu of every database table.

Use progressive disclosure: a clear overview first, deeper record sections next. Create/edit forms need inline errors, pending state, success feedback and preserved input on failure. Tables support filters, saved views, sorting, pagination and export as the data volume grows. Kanban supports dragging and an equivalent keyboard/touch control. Dashboards are based on defined metrics, with owner/date/currency context and readable empty states.

## Security and validation requirements

Every server mutation starts with session and capability checks, then module access where relevant. Never accept a client organisationId. Queries and relation lookups stay tenant-scoped. Sensitive HR, bank, quality investigation and incident fields need distinct read/manage/reveal permissions and audit events.

A company is created only from the Atlas console by an Atlas owner (`atlas.companies.manage`): the organisation, its roles and its first administrator are created atomically, and the administrator sets a password with a one-time setup code. There is no public sign-up. Never join a person to an existing company by name or email domain. User management must verify organisation membership before role changes; the current administrator cannot remove their own administration access through this editor. Existing global accounts need a verified invitation/acceptance flow before joining another company.

Before public launch: verified email invitations, email verification, password reset, MFA, distributed login/signup rate limits, hardened session key management, session revocation, upload scanning/private signed URLs, retention/export policies, backup/restore drills, row-level-security evaluation, and an independent security review. The current local app is a development foundation, not a certified production ERP.

## Delivery sequence

The current ordered checklist and verified checkpoints live in [IMPLEMENTATION_PLAN.md](./IMPLEMENTATION_PLAN.md); it is authoritative for delivery order and completion status.

1. Platform and customer foundation: shell, independent app spaces, company isolation, users/roles, module access, customer hierarchy, audit. Validate direct action and cross-tenant attacks.
2. CRM depth: opportunity creation/editing, stage requirements, configurable pipelines, activities, loss reasons, source reporting, targets, forecast inspection, saved views, dashboard metrics and CSV export. Test calculations and transitions.
3. Sales depth: quote editing/revisions, catalogue-backed lines, tax and price policies, approvals, quote-to-order, address snapshots, credit holds, amendments and cancellation. Validate commercial totals and concurrent conversions.
4. Stock and Logistics: inventory ledger, reservation, partial fulfilment, picking/packing, shipment exceptions and returns. Reconcile movements and order quantities.
5. Projects, HR and Scheduling: project tasks/milestones, employee records, leave/skills, assignments, timesheets and approvals. Validate time overlaps, capacity and restricted employment data.
6. Service, Quality and Safety: cases/complaints with SLA, inspections, corrective actions, incidents and training. Use separate capabilities for restricted information.
7. Production, Purchasing and Finance: versioned BOMs, planning/capacity, material purchase/receipt, invoices/payments and posting. Use specialist validation for finance, tax and payroll calculations.
8. Marketing and commercial packaging: consented audiences, provider adapters, attribution, subscription entitlements and add-on billing. No campaign sending without explicit user authorisation.

Each stage must deliver a usable vertical slice: create → validate → transition → connected record → report → audit. Required checks are lint, typecheck, meaningful tests, production build and visual review at desktop/mobile sizes. New features must not be described as complete because their navigation or schema exists.

## Current implementation limits

Projects now extends the existing Project/ProjectTask engine with a broad work-management workspace, dependencies, calendar-day forecasts, private work, document history, approvals, workload estimates, templates and internal rules. Advanced scheduling/collaboration and financial/ERP integration remain open; see PROJECTS_WORKSPACE.md for verified evidence and limits. Internal chat is a top-bar dock for direct messages and chats with several colleagues or customer contacts. It can create personal tasks, follow-ups, requests and meetings in Projects, and attach orders, quotations, customers, projects and products. Contact chats stay in Atlas and are not emailed. Company-wide messages are not sent. Chat search across history remains open. Saved dashboards select curated CRM metrics, not arbitrary SQL or a general report designer. Upcoming catalogue modules are planned, not implemented. Paid subscriptions and entitlements are not yet connected.

## Manufacturing scope clarification — 3 October 2026

[Connected manufacturing and dedicated Planning](modules/MANUFACTURING_PLANNING.md)
owns the detailed target and delivery gates; [supplied requirements](modules/MANUFACTURING_SOURCE_REQUIREMENTS.md)
preserve every received section. This supersedes the combined Production Planning
row: Planning and Manufacturing execution are separate app targets. The runtime
manufacturing stub remains unchanged until implementation. Production scheduling
is separate from HR rotas. All supplied scope remains required; none is delivered
by this architecture update.

The complete replacement attachment contains sections 1–143.
[Section coverage](modules/MANUFACTURING_COVERAGE.md) assigns every requirement
an owner and acceptance gate; phases now follow source sections 125–131.

## Analytics Studio — 3 October 2026 foundation

Analytics is now registered at `/analytics`, with private configurable visuals and
module-contributed permission-aware metrics. Full [Analytics brief](modules/ANALYTICS_SOURCE_REQUIREMENTS.md),
[delivery boundaries](modules/ANALYTICS_STUDIO.md) and [coverage](modules/ANALYTICS_COVERAGE.md)
track the broader platform; no full reporting/sharing/export completion is claimed.

## Logistics integration requirement — 3 October 2026

Logistics must link to Sales and Finance. The [complete brief](modules/LOGISTICS_SOURCE_REQUIREMENTS.md),
[mandatory integration contract](modules/LOGISTICS_INTEGRATION.md) and
[222-section coverage](modules/LOGISTICS_COVERAGE.md) define the target.
Sales owns demand and commercial status; Logistics owns physical execution and
fulfilment projections; Finance owns accounting, invoicing and posting policy.
The operational module is registered at `/logistics` and documented in
[LOGISTICS.md](modules/LOGISTICS.md). Sales handoff, Stock commands and Finance
events are in place. The 222-section coverage gates remain open. Live carrier
APIs, fleet masters, purchasing and route optimisation are contracts only.

Runtime starting slice and remaining engine gaps: [planning research](modules/PLANNING_RESEARCH.md)
and [implementation evidence](modules/MANUFACTURING_PLANNING.md#implemented-starting-slice--3-october-2026).

## Staff Scheduling foundation — 3 October 2026

A separate `scheduling` app now depends on HR, sharing Employee/RotaShift through
the typed HR roster contract. HR holds private notes, leave and actual timesheets.
[Scope and activation gates](modules/STAFF_SCHEDULING.md) distinguish source code
from migrated/deployed/accepted functionality; advanced scheduling remains open.

## Customer Service source foundation — 3 October 2026

The [241-section brief](modules/CUSTOMER_SERVICE_SOURCE_REQUIREMENTS.md) is the
authoritative target. Separate customer Cases and department Tickets preserve
Customer Service ownership and shared ERP references. `/service` registers the
case/department foundation, with no live activation claim.
[Delivery limits](modules/CUSTOMER_SERVICE.md) and [coverage](modules/CUSTOMER_SERVICE_COVERAGE.md)
keep all nine source phases and acceptance scenarios open. No stock return or
credit transaction is performed by this case engine.

## Projects scope — 3 October 2026

The full 256-section [Projects brief](modules/PROJECTS_SOURCE_REQUIREMENTS.md) is
one user-requested scope, with no delivery phase gates. Existing Project/ProjectTask
now support a broad connected workspace; full acceptance remains unfinished.
See [implementation/evidence/limits](modules/PROJECTS_WORKSPACE.md) and
[all-section coverage](modules/PROJECTS_COVERAGE.md). Do not infer installed desktop
activation, live Finance/ERP processing or full collaboration from route presence.
