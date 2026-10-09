# Manufacturing & Supply

Research and implementation review: 9 October 2026. Microsoft Dynamics 365 Supply
Chain Management is the functional benchmark. The console is a connected entry
point to Atlas's existing owners and central records. It is not a claim of
Dynamics parity. The [173-section source](MANUFACTURING_SOURCE_REQUIREMENTS.md)
remains complete; [coverage](MANUFACTURING_COVERAGE.md) records unfinished work.

## The working experience

Open `/manufacturing` from Home. The modern blue-and-white console groups work in
the order users need it: Demand, Materials, Schedule, Production, Products & plant,
Finance & procurement. Planner, Procurement, Production and Finance views focus
the directory. Search and six bookmarkable shortcuts make frequent work easier.
These preferences change presentation only. Enabled apps and source permissions
still determine every destination and action.

Production Planning's `/planning` demand workbench and saved targets remain live,
with a shared console menu. Its duplicate Home card disappears only when the
console is accessible; otherwise the original Planning card remains. Existing
Production Today moves to `/manufacturing/today`. Products, Inventory and Finance
have a return link. The business-wide `/plan` app remains distinct.

The [illustrated how-to library](/manufacturing/help) contains nine guides: getting
started, products/materials/stock, demand, MRP, purchasing, receiving, scheduling,
shop-floor completion and spend. Each gives prerequisites, instructions, expected
results and exception checks. Illustrations explain workflows and contain no
customer data. Guides link only to authorised destinations.

## One product and one stock truth

`Product` is the shared catalogue identity in Sales, recipes, Inventory and Finance.
Item class (raw, packaging, WIP/intermediate, finished, service), `sellable`, active
status and recipe supply policy answer different questions. Internal materials and
intermediates stay active for purchasing/stock/recipes while `sellable=false`
excludes them from new Sales selections, drafts, agreement lines, quote sending,
quote conversion, repeats and order confirmation. Existing confirmed history is
retained. The additive migration defaults existing products to sellable, preserving
their earlier behaviour; operators must deliberately classify internal items.

A stocked intermediate uses its own SKU and recipe when it is independently
stocked. Accounting WIP is unfinished-production value; a WIP-class item does not
implement that ledger. Make/buy is independent of sales eligibility. Services and
charges require their own fulfilment/accounting policy.

Atlas currently uses whole units in Inventory execution. Decimal recipe and MRP
quantities do not remove that limitation. The target requires decimal base and
entered units, dimension-compatible conversions and immutable conversion factors.
Do not round a fractional raw-material receipt into a fictitious whole-unit fact.

## Planning and production today

The rich material-plan action uses `mrp-calculation.ts` and the recursive domain
engine. It reads confirmed/on-hold open Sales demand, approved S&OP forecast
publication, manual forecasts, expected usage, active recipes, usable stock,
reservations, active quality holds and aggregate existing production supply.
Published S&OP totals consume gross product/month bookings. Manual forecasts
consume remaining firm demand in the domain engine; review overlapping forecast
sources and expected usage before committing supply. Saved suggestions retain
demand, component shortages, routing operations, planned hours/cost and run ID.
Only completed runs are presented as the current plan.

Review before conversion. Make firming reads both historical array pegging and
the current rich JSON payload, preserves the product unit and source demand, and
creates the order plus source claim/audit/activity in one serializable transaction.
Stale runs and concurrent claims fail; repeating an already linked Make conversion
returns the original order. Release/execution retains its existing controls.

The current engine aggregates stock across warehouses and existing production
supply without full dated receipt/location matching. Planning estimates, rough
capacity and a machine-overlap check do not establish a guaranteed customer date.
Full finite materials, labour, tooling, maintenance exclusions, CTP, time fences,
alternate sourcing and isolated scenario publication remain target work.

## Procurement attached to the plan

Buy proposal → Review purchase draft → supplier/price/allocation review → Save
draft → existing Finance approval → goods receipt/accepted Inventory movement →
matched supplier invoice → posting/payment controls.

The draft carries the original product, exact decimal quantity, needed date and
proposal/run reference. Supplier, prices, tax, currency/rate and allocation are
reviewed commercial facts. Saving creates the Finance draft and claims the Buy
proposal atomically. The tenant-bound unique `mrp-buy:<suggestion>` key and
version/status comparison prevent duplicate conversion. A changed product,
quantity, proposal or newer run is rejected. Finance timelines and Manufacturing
audit retain the link; the actioned proposal opens the purchase document.
Buy uses a separate tenant-bound Finance document relation; Make retains its
production-order relation. Validation retains form entries and gives readable
guidance. Revisiting an already converted proposal directs users to the plan.

No conversion approves, receives, posts or pays automatically. Receipts retain the
existing whole accepted-unit stock rule and damaged-quantity exclusion. Transfer
proposals still require a reviewed Inventory move; a transfer-order firming engine
is open scope. Subcontract operations require their own commercial/material flow.

## Finance spend reporting

`/manufacturing/spend` reads a Finance-owned registered provider. Select the legal
entity, start/end dates and supplier/category/cost-centre/site/month grouping.
Currencies stay separate; net measures exclude VAT. Source document links allow
review in the original Finance workflow.

| Measure | Definition | Access |
| --- | --- | --- |
| Posted supplier spend | Posted AP invoices + debit notes − credits in accounting period; document-date fallback is disclosed | Report + Payables read |
| Unbilled purchase commitment | Current approved/part-received/received PO net less linked posted invoice net up to period end, floored at zero per PO | Report + Purchasing + Payables read |
| Received value | Posted goods-receipt net within selected document dates | Report + Purchasing read |
| Open payables now | Current posted invoice/debit gross less settlement, minus unsettled credits | Report + Payables read |

Open payables is a current balance, not a historic cut-off or cash-payment report.
Commitments use current PO statuses, not reconstructed historic statuses. Receipts,
commitments and invoiced spend are separate measures; adding them double counts
the same supply. The report includes authorised non-manufacturing supplier spend
in the entity. It is not a production-cost/COGS/WIP report. Missing access yields
unavailable values, not misleading zeroes. Existing project scopes apply. Over
10,000 source documents stops visibly rather than returning a partial total; the
latest 200 displayed documents have an explicit full-total disclosure.

## Researched benchmark and target decisions

The following requirements come from official Microsoft documentation, reviewed
on 9 October 2026. Atlas design choices are our interpretation of that benchmark.

| Area | Benchmark evidence | Atlas target |
| --- | --- | --- |
| Item supply policies | [Default order settings](https://learn.microsoft.com/en-us/dynamics365/supply-chain/production-control/default-order-settings), [coverage](https://learn.microsoft.com/en-us/dynamics365/supply-chain/master-planning/coverage-settings) | Independent purchase/sale/stock policies; site/warehouse/variant coverage; min/max/multiple, calendars, lead times and safety stock |
| Explaining and acting on supply | [Planned orders](https://learn.microsoft.com/en-us/dynamics365/supply-chain/master-planning/maintain-planned-orders), [action messages](https://learn.microsoft.com/en-us/dynamics365/supply-chain/master-planning/action-messages), [firming](https://learn.microsoft.com/en-us/dynamics365/supply-chain/master-planning/planning-optimization/planned-order-firming) | Dated demand/supply ledger, pegging, reviewed firming, advance/postpone/increase/decrease/cancel exceptions and source-change reconciliation |
| Manufacturing modes/lifecycle | [Production process](https://learn.microsoft.com/en-us/dynamics365/supply-chain/production-control/production-process-overview), [lean](https://learn.microsoft.com/en-us/dynamics365/supply-chain/production-control/lean-manufacturing-overview) | Discrete first-class execution plus explicitly designed process/batch/formula/co-product, lean/kanban, subcontract and project modes; MTS/MTO/CTO/ETO demand policy |
| Engineering governance | [Engineering change management](https://learn.microsoft.com/en-us/dynamics365/supply-chain/engineering-change-management/engineering-change-management), [product structure release](https://learn.microsoft.com/en-us/dynamics365/supply-chain/engineering-change-management/release-product-structure) | Approved, effective versions of BOM/routing/configuration; impact review; production snapshots; alternates and substitution authority |
| Scheduling | [Operations scheduling](https://learn.microsoft.com/en-us/dynamics365/supply-chain/production-control/operations-scheduling), [scheduling engine](https://learn.microsoft.com/en-us/dynamics365/supply-chain/master-planning/scheduling-engine-performance) | Forward/backward finite calendars, resource groups/alternates, material readiness, labour/skills/tooling, setup sequences, freeze/locks and previewed cascade |
| Material/execution workflow | [Production warehouse release](https://learn.microsoft.com/en-us/dynamics365/supply-chain/production-control/releasing-bom-and-formula-lines-to-warehouse), [floor execution](https://learn.microsoft.com/en-us/dynamics365/supply-chain/production-control/production-floor-execution-configure) | Reserve/stage/pick/issue/backflush and receive with lot/serial genealogy, yield, scrap/rework and controlled correction; touch-friendly operator instructions |
| Procurement/Finance control | [Invoice and receipt matching](https://learn.microsoft.com/en-us/dynamics365/finance/general-ledger/tasks/audit-invoices-key-data-ap-system) | Reviewed purchasing, accepted receipts, cumulative three-way matching, tolerance/approval, landed cost and source-linked supplier reporting |
| Production economics | [BOM calculations](https://learn.microsoft.com/en-us/dynamics365/supply-chain/cost-management/bom-calculations), [costing versions](https://learn.microsoft.com/en-us/dynamics365/supply-chain/cost-management/costing-versions), [backflush costing](https://learn.microsoft.com/en-us/dynamics365/supply-chain/cost-management/backflush-costing) | Approved standard/planned/actual cost basis by site/version/date; labour/machine/overhead, WIP, variance and COGS reconciliation with Finance |
| Outsourced operations | [Subcontracting](https://learn.microsoft.com/en-us/dynamics365/supply-chain/production-control/manage-subcontract-work-production) | Vendor service purchase attached to routing, component shipment/ownership, due dates, receipt and allocation |
| Personalisation | [Personalise the experience](https://learn.microsoft.com/en-us/dynamics365/fin-ops-core/dev-itpro/get-started/personalize-user-experience), [saved workspace views](https://learn.microsoft.com/en-us/dynamics365/fin-ops-core/dev-itpro/user-interface/understanding-saved-views) | Personal and centrally shared filtered views, grids/columns, accessible shortcuts and configurable workspaces, governed independently from record permissions |

The user experience should provide one task queue, a consistent explain-why panel,
source drill-through, safe bulk review and role-specific saved views. That is an
Atlas design decision, not a claim that Microsoft's interface works this way.
AI stays optional; deterministic quantities, dates and postings remain reviewable.

## Complete remaining design programme

1. **Canonical dated planning inputs:** site/warehouse, variants, units, source
   revisions, stock status, dated purchase/transfer/production receipts, reservations,
   independent buffers, consumption rules and reconciliation. One read model shared
   by demand, MRP, scheduling and promise calculations; no parallel business store.
2. **Product and engineering policy:** effective BOM/routing versions, alternatives,
   substitution, phantom/intermediate items, decimal units/conversions, sourcing and
   subcontract policies, quality specifications and controlled documents.
3. **MPS and MRP:** period grid, coverage groups, lot sizing, time/freeze fences,
   pegged exceptions, supply reschedule/cancel suggestions, stable run input/version
   identity, isolated scenarios and reviewed atomic publication.
4. **Constraint scheduling and promises:** real calendars, concurrent resources,
   labour/skills/tools, material receipt gates, maintenance downtime, setup families,
   multi-operation dependencies, forward/backward optimization and explainable CTP.
5. **Production and warehousing:** reservations/staging/picks, actual issues,
   substitutions/overconsumption, partial/split/merge/backorders, lot/serial genealogy,
   inspection/holds, scanning, yield/scrap/rework/co-products and put-away.
6. **Cost and commercial closure:** source-linked purchases/transfer/subcontract
   commitments, approved cost versions, actual labour/machine/overhead, landed costs,
   WIP and variance close, reversals, COGS and Finance reconciliation.
7. **Operational reporting and adoption:** OEE/downtime/yield/variance/adherence,
   throughput/traceability/customer risk, exception owner/age, saved shared views,
   permissions, audit/export, realistic Test scenarios and illustrated instructions.
   Extend through owner-approved Studio contracts for typed custom fields, forms,
   dashboards, documents and reviewed workflows. Personal defaults and company
   templates must stay separate. Required operational facts, tenant boundaries,
   validation, approvals and ledger rules cannot be removed by personalisation.
   Preview, version, publish and roll back definitions with audited authority;
   no arbitrary executable code in manufacturing settings. Current console
   customisation is limited to role/shortcut bookmarks; these richer tools remain
   planned and depend on Studio's phased owner contracts.

Every stage needs changed-demand/cancellation, concurrency, duplicate/retry,
tenant/capability, decimal/unit, currency, failure/rollback and real browser
acceptance. A destination card or schema field cannot close its workflow gate.
Current validation and live evidence belong in `.ai/CURRENT_STATE.md` and the
[acceptance record](MANUFACTURING_SUPPLY_ACCEPTANCE.md).

Saved estimates on the Production planning cockpit and Planned orders (including
already actioned proposals) require `manufacturing.cost.read` independently of
`manufacturing.plan.read`. Planning access retains quantities, readiness and hours;
restricted users see cost-access guidance rather than hidden totals in page output.
Supplier spend remains separately governed by Finance's source permissions.
