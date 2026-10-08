# Connected manufacturing and dedicated planning

Agreed direction: 3 October 2026, updated same day when a replacement brief
("ATLAS MANUFACTURING — MRP, Production Planning, Scheduling and Shop-Floor
Execution Master Build Brief", sections 1–173) superseded the prior 143-section
brief preserved earlier that day. Target architecture, with the limited
implemented starting slice described below.

## Scope and ownership

All supplied requirements remain in scope, regardless of how apps are packaged.
The [source specification](MANUFACTURING_SOURCE_REQUIREMENTS.md) preserves the
current replacement attachment, sections 1–173. [Section coverage](MANUFACTURING_COVERAGE.md)
assigns each numbered section a phase and delivery status. The current
attachment supersedes the earlier truncated and 143-section sources and their
delivery sequences — Git history retains those for reference.

## Phase 1 delivered this task (3 October 2026)

Schema: `ManufacturingWorkCentre`, `ManufacturingResource`, `ManufacturingOrder`,
`ManufacturingWorkOrder`, `ManufacturingCounter` (migration
`20261003670000_manufacturing_phase1_foundation`, written by hand — not yet
applied; see the inherited migration-ordering blocker in
[coverage](MANUFACTURING_COVERAGE.md)). These sit alongside the pre-existing
`ProductDefinition`/`ProductBomLine`/`ProductOperation` BOM/routing snapshot on
Product, which `ManufacturingOrder.definitionId` references rather than
duplicating.

Module: `src/modules/manufacturing/` (manifest, domain lifecycle guards,
queries, idempotent/optimistically-locked commands) registered in
`src/core/modules/registry.ts`; routes at `/manufacturing` (Today),
`/manufacturing/produce` (list) and `/manufacturing/produce/[orderId]`
(detail). Capabilities `MANUFACTURING_CAPABILITIES` in
`src/core/permissions/capabilities.ts`, plus `manufacturing_planner` and
`shop_floor_operator` standard roles (§151–152 of the source brief).

This is a narrow vertical slice through §57–60/66–68/144–154 of the current
brief — a real Production Order/Work Order execution spine with guarded
lifecycles, audit, activity, attention and search — not MRP, scheduling, Shop
Floor UI, costing or traceability. See [coverage](MANUFACTURING_COVERAGE.md)
for the full open/delivered breakdown and the next build-order steps.

Inventory & Manufacturing is a domain grouping, not a second application or database.
Planning is a dedicated app. Manufacturing owns execution. Production scheduling is
inside Planning and distinct from HR rotas and the existing Scheduling & Hours stub.
The table describes target ownership; Planning is registered as a limited starting slice.

| App / owner | Scope | Supplied sections |
| --- | --- | --- |
| Products (`products`) and shared catalogue contracts | One Product identity, variants, UOM classes/conversions, site policies; engineering workspace for versions, ECOs, BOMs, recipes and routings | 4–18 |
| Inventory (`stock`) | Immutable quantity ledger, dimensional balances, reservations, lots/serials, traceability; warehousing workspace | 23–27, 88–91 |
| Planning (`planning`, implemented starting slice) | Unified demand and supply, forecasts/consumption, MPS, MRP, pegging, capacity and advanced finite scheduling, ATP/CTP, scenarios and exceptions | 19–22, 28–51, 92–93, 95–96, 112–115 |
| Manufacturing (`manufacturing`, existing stub to become execution) | Production orders, release checks, snapshots, work orders, MES, time and consumption; WIP, subcontract and rework workflows | 52–66, 78, 87, 94, 118 |
| Quality (`quality`) | Specifications, checks, nonconformance, holds/releases, batch disposition | 79–83 |
| Maintenance (packaging to be decided) | Equipment, downtime, maintenance orders, spares and calendar exclusions | 84–86 |
| Costing (manufacturing workspace with Finance contract) | Standard/actual costs, labour/machine/overhead, WIP valuation, co-product allocation and variances | 15, 66–77, 90, 97 |
| Existing Sales, CRM, Purchasing, Logistics, Finance, Projects and People owners | Originate demand, purchase/receive, dispatch, post journals, expose skills/availability; share canonical references | 75–77, 99–110, 120–123 |

BOM, capacity, MES, traceability and analytics are workspaces/capabilities; they need
not each become a separate installable app. Separate ownership and permissions must
still be explicit. Analytics reads reconciled records rather than creating a parallel ledger.

## One record with many connected views

Reuse `Product`, `Party`, `User` and `Employee`; never introduce manufacturing customer,
inventory product, finance product or a separate operator login. Product policies are
associated records, not a giant nullable Product table. Engineering variants describe
real configurations; snapshots preserve historical facts and are not new identities.

Define shared operational Site, legal-entity, UOM and resource references before writing
module tables. A customer address is not automatically an operational factory. Separate
legal entities inside an organisation require explicit ownership and intercompany rules;
never weaken organisation isolation to implement transfers.

Each business record has one owner. Cross-app reads use registered providers/public Core
contracts; writes use the owning command. Core imports modules only in the registry.
All relations are checked against the session tenant, including nested records and variants.
Permissions and enabled-module checks apply to pages, actions, APIs, exports and providers.

Sales order line → canonical demand requirement → planning run/pegging → planned supply
→ confirmed production/purchase/transfer/subcontract order → operations and reservations
→ stock movements and production outputs → costing/WIP entries → Finance journals.
Each arrow retains source IDs, quantities, dates and status. Users can follow these links
in both directions without retyping a customer, product, order or quantity.

Demand is an upserted projection keyed by tenant, source type, source line and revision.
Forecast consumption prevents forecast plus actual-order double counting. Reservations
are separate commitments and do not reduce physical stock. Expected receipts are not
on-hand stock. The shared availability figure still counts incoming production:
the larger of the open production plan and open production orders. Planning
proposals are not executable orders or accounting postings.

Cross-app state changes persist owner records and durable outbox messages atomically.
Consumers enforce tenant-scoped idempotency, retries and reconciliation. The synchronous
event bus alone does not provide durable delivery. Changes and cancellations update or
reverse downstream obligations; exceptions expose failed handoffs with actionable reasons.
Use decimal quantities and explicit precision/rounding for materials; capture entered/base
UOM and conversion factor permanently. Financial postings retain currency and approved
rounding rules. Ledger corrections use reversal transactions, never edits to posted history.

## Manufacturing planning acceptance

Planning must deliver an operational planner workspace, not merely a calendar or job list:

- Time-phased demand/MPS grid with forecast consumption, projected stock, safety targets,
  planner overrides, firm proposals and freeze/planning fences.
- Reproducible MRP runs with versioned inputs, recursive BOM explosion, cycle rejection,
  dependency order, scrap/yield, alternatives, lot sizing, dated supply and demand pegging.
- Buy/make/transfer/subcontract proposals with explainable expedite/defer/cancel/shortage
  actions, source links, review/firm/conversion transitions and duplicate-safe conversion.
- Rough-cut and infinite capacity comparison plus finite resource and material scheduling;
  real shifts/exceptions, resource capabilities, labour/tool constraints, parallel units,
  batch/weight/rate capacity, setup matrices and alternative routes.
- Forward/backward scheduling and branching dependency graphs with overlap, transfer
  batches and min/max lags. Impossible plans produce constraint reasons, not false promises.
- Hour/day/week resource board with drag and keyboard/touch equivalents. Every move
  recalculates dependencies, materials, capacity, lateness and affected customer orders.
- Locks on operations/orders/resources/windows respected by every automatic rerun.
  Concurrent changes are detected before saving or publishing a schedule.
- Isolated what-if versions: compare lateness, shortages, utilisation, changeovers and cost.
  Publishing validates current demand/material/resource versions and requires capability.
- ATP/CTP promises use actual commitments and feasible capacity. Show stale inputs,
  last run, uncertainty and infeasibility explicitly. Avoid guaranteeing unknown supply.

Acceptance fixtures must include simple assembly, discrete/process/repetitive production,
MTS/MTO/ETO/CTO, multiple sites, semi-finished/phantom structures, alternate inputs/routes,
co-/by-products, rework/scrap, subcontracting and customer-owned stock. No production mode
is marked delivered solely because an enum exists.

## Evidence and delivery gates

Inspection on 3 October 2026: `Product` already links commercial lines and stock records.
`InventoryBalance.quantity` and `InventoryMovement.delta` are integers; stock adjustment
updates both in a serializable transaction with request-key uniqueness. This is a foundation,
not the required full dimensional immutable ledger/reservation workflow. Availability and
Finance interfaces exist in `src/core/availability/types.ts` and `src/core/finance/types.ts`;
these contracts do not prove implemented downstream integrations. Manufacturing is a stub
in `src/modules/stubs.ts`. Planning now has an implemented demand/physical-stock workbench and saved product-target plans; its full MPS/MRP/finite-scheduling engine remains open.

Within each phase, section 124 requires domain model → database rules → ledger →
business services → events → planning logic → costing logic → APIs → UI → reporting
where applicable. Section 99 requires coherent domain migrations, not one giant migration.
The numbered phases below follow sections 125–131; they supersede our earlier ordering.

| Gate / phase | Required deliverable and acceptance evidence | Status |
| --- | --- | --- |
| 0 | Resolve documented migration drift/seed and verify baseline before extending schema | Open; prior blocker in CURRENT_STATE |
| 1 (125) | Product/variants/UOM/site policies, locations, dimensional ledger/balances/reservations, versioned BOMs/routes/operations/resources/calendars | Open |
| 2 (126) | Production/material requirements/work orders; issue/return/output/scrap/completion, then MES; controlled release snapshots | Open |
| 3 (127) | Cost components/versions, recursive standard rollup, actual costs, operational/financial WIP, variances, accounting events and reconciled journals | Open |
| 4 (128) | Unified demand/forecast/MPS, BOM explosion/netting, pegged planned orders, exceptions and duplicate-safe firming/conversion | Open |
| 5 (129) | Calendar-aware infinite scheduling → finite capacity → finite materials → alternative resources → setup optimisation | Open |
| 6 (130) | Quality/quarantine/nonconformance/rework, maintenance, subcontracting and lot/serial genealogy | Open |
| 7 (131) | Planner workbench/board, control tower, analytical reporting, simulations, ATP/CTP; connected end-to-end acceptance | Open |

Basic material and release safety is required in earlier phases; phase 6 adds full
quality/maintenance workflows. Schemas reserve their references from phase 1 without
pretending these workflows are implemented. Deterministic scheduling precedes optimisation;
AI recommendations always use standard validated transactions (139, 141).

## Required acceptance scenarios (132–138)

| Scenario | Required result |
| --- | --- |
| Multi-level production (132) | 100 A explodes to B=200, C=100, D=300; B stock 50 and D stock 120 yield B=150 and D=180 net need before lot/safety policies, assuming no other supply or C stock |
| Finite capacity (133) | 4-hour and 6-hour jobs share an 08:00–16:00 machine without overlap; remaining work moves into valid future availability |
| Finite materials (134) | Monday resource availability cannot start work before Wednesday material availability |
| Cost (135) | £1,000 material + £300 labour + £400 machine + £200 overhead = £1,900 actual; £1,800 standard means £100 adverse, with reconciled component explanations |
| Quality (136) | 500 completed units, 100 failed: physical stock 500, available 400, quarantine 100; MRP/ATP immediately reflect the hold |
| Breakdown (137) | Unavailable machine blocks capacity; impacted jobs/customer orders identified; valid alternatives and dates produce planner exceptions |
| Genealogy (138) | RM-L001 → MO-44 → FG-L921 → three customer shipments is traversable both ways within a defined seconds-level acceptance budget |

These are required tests, not results from tests run. Component variance allocation
needs its own standards/rate fixtures; the supplied total alone cannot establish it.

Each gate requires capability/tenant tests, meaningful domain/concurrency tests, migration
verification, lint, typecheck, production build and visual acceptance. Boundary tests must
cover duplicate event replay, amended/cancelled orders, failed consumers and reconciliation.
Balance = replayed ledger; stock status/reservations reconcile; order demand/supply is counted
once; no finite capacity overlap exceeds allowed units; released revisions remain stable;
valuation reconciles to Finance without duplicate journals. Keep checkboxes open until run.

The original numbered source is the coverage baseline: every requirement must gain an
implementation path, acceptance fixture and result before final acceptance. Staged delivery
orders the work; it does not remove any supplied capability from the target.

## Implemented starting slice — 3 October 2026

Production Planning is a separate registered app at `/planning`. It reads minimal
confirmed Sales product demand and Inventory balances through declared providers;
no customer/product records are copied. The workbench exposes physical shortages,
unit conflicts and linked source lines, not ATP or net outstanding shipped demand.

`/planning/plans` saves annual/monthly/weekly/custom date windows (up to five years)
and daily/weekly/monthly/quarterly/yearly intervals. Lines save decimal product targets,
work dates, notes, shared team and existing membership responsibility. They remain
planner intentions; they do not create executable orders, WIP or inventory receipts.
`/planning/teams` shows teams and assigned plan work. Planning writes are audited,
tenant-scoped and use version checks; creation retries retain request keys.

Inventory shows searchable on-hand stock, warehouses, movements and transfers.
Opening a product also shows its recipe, standard cost, work-in-progress
components and what is short against confirmed orders. CSV exports cover stock, movements, demand, plans and assigned work. Explicit native
CSV downloads are permitted by user request, without enabling a local database/cache.

The [planning research](PLANNING_RESEARCH.md) records primary vendor references,
annual-to-shift planning layers, BOM/WIP netting, constraints, simulations, scheduling
and acceptance. These remain full delivery requirements. None of the seven broad
phase gates is closed by this starting slice.

## Product engineering, resources and cost — user clarification, 3 October 2026

Products and Planning must share one manufacturing definition. Each manufactured
Product needs versioned, effective-dated BOMs/recipes and routings: raw components,
canonical intermediate/WIP Products, quantities/UOM, yield/scrap, alternate routes,
batch size and make/buy/subcontract policy. A WIP Product definition is distinct
from the actual unfinished quantity and operation progress of a production order.

Routing operations identify eligible machines/work centres, required skills, crew
size, setup/changeover time, run time per unit or batch, queue/transfer time, tools
and dependencies. Machine/crew calendars, shifts, downtime and simultaneous
resource requirements constrain the same annual/monthly/weekly plan. Assignment
does not prove availability; scheduled operations must book all required resources
without overloading them. Logistics adds dated internal moves, external transport,
loading/unloading and subcontract journeys to the critical path.

Product cost must explain materials, setup and run machine costs, labour/crew cost,
overheads, subcontract and logistics separately. Store rate versions, currency,
units and effective dates; state whether machine rates already include labour or
overhead to prevent double counting. Calculations distinguish batch-level setup
from per-unit effort, accepted output from scrap, planned/standard estimates from
actual consumption, time, freight and WIP valuation. Finance owns ledger posting.

Required acceptance: a multi-level product with an intermediate WIP item links its
BOM, operations and eligible machines from its Product record; planning 100 units
shows material demand, setup/run/crew hours, feasible completion and an auditable
cost breakdown. Changing a rate, crew size, BOM version, machine breakdown or
transport lead time affects a scenario predictably without changing historical
released-order snapshots. Partial production reduces remaining work and material
needs once, and actual cost reconciles to execution/Inventory/Logistics/Finance.

The product record now keeps one active recipe version: make, buy, or an
intermediate WIP product, with components, scrap, yield, batch size and operation
rates. Setup is spread across the batch for the standard unit cost, and charged
again for every batch started when costing a quantity. Confirmed orders and plan
targets stay separate. Bought parts underneath a WIP item are exploded once.
Saving a recipe retires the previous version instead of rewriting it. The
product page shows the multi-level structure, where the product is used, and
splits cost into materials, machine, labour, overhead, subcontract and logistics.
A step chooses a work centre and machine from Manufacturing → Plant. Releasing a
production order copies that machine onto the work order. The name still matches
an older step that only typed a work centre. Choosing a machine does not book
the calendar; scheduling does that.

Still open: effective dates, alternate routes, named machines and skills,
calendars, finite scheduling, production orders, shop-floor WIP quantities,
reservations, and Finance journals. A plan target still does not move stock.

## Contextual record access — 8 October 2026

Manufacturing order Related records uses shared owner-authorised providers. The
originating Sales order appears only with Sales read and enabled Sales; operators
without that permission receive neither its reference nor customer identity.
Existing product/material/operation details remain. Manufacturing contributes exact
source-line-linked production orders back to Sales; no product-match guessing.
