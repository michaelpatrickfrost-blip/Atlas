# Module memory map

The authoritative runtime catalogue is src/core/modules/registry.ts. Registered
foundations: CRM, Sales, Projects, Stock (Inventory), KPIs, Products, Pricing, People, Staff Scheduling, Production Planning, Plan, Analytics, Customer Service, Marketing, Finance, Logistics, Manufacturing, Safety, Audit, Payroll, Team planner, Quality, Tickets, CSAT, Automations and Templates.
Customer Master belongs to Core. Registered foundations are not complete ERP apps.
Safety is the workplace-risk module at `/safety`. See [Safety](../docs/modules/SAFETY.md).

Audit maps existing change records by system and shows a manager their team.
Echo is the note-and-mention panel on a customer, order, quotation or call-off.
See [Audit and Echo](../docs/modules/AUDIT.md).

The remaining runtime catalogue stub is Fleet. Quality and Tickets have registered implementations. Payroll and Manufacturing have
registered implementations; full workflow acceptance remains separate from registration. Read src/modules/stubs.ts for actual IDs/dependencies and check the
registry for which stubs are replaced by implemented manifests.

- [Module roadmap](../docs/MODULE_ROADMAP.md): boundaries and dependencies.
- [Delivery checklist](../docs/IMPLEMENTATION_PLAN.md): broad acceptance gaps.
- [Sales delivery map](../docs/modules/SALES_ORDER_PROCESSING.md): current commercial batch.
- [Sales specification](../docs/modules/SALES_FUNCTIONAL_SPEC.md): full target scope.
- [CRM specification](../docs/modules/CRM_FUNCTIONAL_SPEC.md): full target scope.

A specification is a target, not evidence of delivery. Before building a module read
docs/MODULE_SPEC.md, inspect the existing services, and reuse shared data/contracts.

Analytics is now an available registered foundation at `/analytics`, with typed
module metric contributions and private Dashboard Studio. See
[Analytics delivery](../docs/modules/ANALYTICS_STUDIO.md) for scope and activation
limits; full requirement acceptance remains open.

Logistics must integrate with both Sales and Finance. The complete
[222-section brief](../docs/modules/LOGISTICS_SOURCE_REQUIREMENTS.md),
[integration contract](../docs/modules/LOGISTICS_INTEGRATION.md) and
[open coverage](../docs/modules/LOGISTICS_COVERAGE.md) retain required scope.
Logistics is a registered module at `/logistics`. It consumes confirmed Sales orders through a handoff, requests Stock reservations and movements, and publishes Finance events. It does not post journals or copy inventory truth. See [Logistics](../docs/modules/LOGISTICS.md). The older 222-section source coverage remains open. The shared product keeps net and gross weight, size, volume, pack and pallet counts, origin, commodity code and hazard.

Plan (`/plan`) is the connected planning layer: targets, forecasts, scenarios, reviews and live actuals. It is not Production Planning (`/planning`), which remains the product-demand and stock-coverage workbench. See [Plan](../docs/modules/PLAN.md).

Manufacturing & Supply (`manufacturing`, `/manufacturing`) now presents the
product-demand workbench, MRP, production schedule/execution, Products, Inventory
and Finance purchasing/spend in one permission-filtered console. Planning routes
and licences remain; their duplicate Home card consolidates only when the console
is accessible. Today remains at `/manufacturing/today`. Business-wide Plan is
separate. Shared Product sales eligibility is independent of class, stock and supply
policy. Buy proposals create source-linked Finance purchase drafts atomically.

Rich recursive MRP, shifts and stock-linked execution exist; they are partial
foundations rather than full Dynamics parity. Dated site/warehouse purchase/transfer
netting, finite materials/labour/tools, scenarios/CTP and production WIP/variance
remain open. Read [Manufacturing & Supply](../docs/modules/MANUFACTURING.md),
[full coverage](../docs/modules/MANUFACTURING_COVERAGE.md) and
[source](../docs/modules/MANUFACTURING_SOURCE_REQUIREMENTS.md). All data remains
central, with existing owner permissions and records retained.

Staff Scheduling is a separate HR-dependent app at `/scheduling`; HR owns My HR,
holidays, company policy PDFs, performance plans, disciplinary cases, My Team, confidential notes and timesheets. Access is split so Staff can have holidays and policies without payroll or conduct. Source foundation/release limits:
[Staff Scheduling](../docs/modules/STAFF_SCHEDULING.md). Central workflows and the installed planner/hours budgets are live
and enabled; acceptance is recorded in CURRENT_STATE.

Customer Service (`service`, `/service`) now connects customer/order/product/delivery
complaints, investigations, canonical remedies and immutable CSAT. Tickets
(`tickets`, `/tickets`) and cross-team Queries share Core service-work infrastructure
while keeping distinct business meaning and case ownership. Business-hours clocks,
private evidence, service forms, independent approvals and source-module providers
are implemented and core browser/server journeys verified on 7 October 2026.
See [connected service desk](../docs/modules/SERVICE_WORK_DESK.md) and
[live acceptance](../docs/modules/SERVICE_WORK_ACCEPTANCE.md) for genuine advanced
and native gaps. The historical [241-section source](../docs/modules/CUSTOMER_SERVICE_SOURCE_REQUIREMENTS.md)
and [coverage](../docs/modules/CUSTOMER_SERVICE_COVERAGE.md) remain preserved targets,
not a claim of full acceptance.

Projects now has a broad work-management implementation, not complete brief acceptance.
The user requests all 256 sections without staged delivery gates. See
[Projects workspace](../docs/modules/PROJECTS_WORKSPACE.md) and
[open coverage](../docs/modules/PROJECTS_COVERAGE.md). Source migration/package/UI
verification is separate from central data migration and installed Mac activation.

Finance now has a preserved [80-section brief](../docs/modules/FINANCE_SOURCE_REQUIREMENTS.md),
[acceptance map](../docs/modules/FINANCE_COVERAGE.md) and
[inspected starting point/constraints](../docs/modules/FINANCE_WORKSPACE.md).
Finance has a registered runtime foundation at `/finance` and owns purchasing;
the competing Purchasing catalogue stub is retired by the registry. Historical
Purchasing module-state rows are retained. Initial catalogue observations did not
verify Finance schema or workflows; see CURRENT_STATE.md for release evidence.
All 80 full-brief acceptance gates remain open.

## Installed catalogue omission audit — 3 October 2026

Native Atlas Apps at `127.0.0.1:13200/apps` shows 14 installed module entries:
CRM, Sales, Projects, Inventory, Goals & KPIs, Products, Pricing, HR, Staff
Scheduling, Production Planning, Analytics, Customer Service, Marketing and Finance.
Customer Master is Core and is not a separate module-catalogue entry.

Six entries remain Coming soon: Logistics, Quality, Health & Safety,
Payroll, Manufacturing execution and Fleet. None is a completed standalone app.
HR payroll does not establish completion of the separate Payroll catalogue target. Planning is distinct from Manufacturing execution.
This was a point-in-time audit; both Logistics and Manufacturing have since been
registered (see their entries above) — this paragraph is retained as that day's
snapshot, not a current claim.

Logistics source and coverage contain consecutive sections 1–222 with no omissions
or duplicates. Every Logistics acceptance gate remains open. Required next work
is runtime implementation plus connected Sales/Finance acceptance and compatible
Mac installation/central-data release; enabling its stub would not deliver it.
Installed catalogue presence is evidence of enablement, not workflow completion
or access for every profile. Preserve the full coverage maps for implemented apps
as well: their unfinished requirements must not disappear behind Installed labels.

Price lists are embedded in Sales and commercial agreements in CRM; `pricing` remains an internal registered module with its existing enablement/capability gates. See [Pricing](../docs/modules/PRICING.md).


## Templates — 7 October 2026

`templates` provides the shared business document library, section editor and generation from CRM deals, Sales quotations/orders, Projects and Customer Service cases. Uses existing contract permission; source access remains scoped by the owning module. [Delivery scope](../docs/plans/CONTRACTS_TEMPLATES.md).


## S&OP — 7 October 2026

`/sop` is deployed for connected demand, service, supply, assumed finance,
scenarios and exact-version cycle review. Its additive migration is applied and
S&OP is enabled for Michael Test with existing profile/source permissions preserved.
All 42 authenticated live acceptance checks passed. See [implementation and genuine
master-spec gaps](../docs/modules/SOP.md) and [acceptance](../docs/modules/SOP_ACCEPTANCE.md).
Plan now has phased, source-linked inputs; the four researched departmental Plan
modules follow S&OP and remain unimplemented.


## 8 October 2026 — Requested operational apps

Meetings (`/meetings`), Maintenance (`/maintenance`), Engineering / PLM
(`/engineering`), Fleet (`/fleet`) and Field Service (`/fieldservice`) now have
deployed workflows, enabled for Michael Test; all 62 live acceptance assertions pass.
Fleet replaces its catalogue placeholder. See [scope and genuine integration
boundaries](../docs/modules/OPERATIONAL_APPS.md) and CURRENT_STATE for release truth.
Microsoft calendar application configuration/consent and provider proof remain
required; no external delivery is inferred from a connected UI or manual draft.

## Studio — foundation in progress, 9 October 2026

Customer app `/studio`; independent staff setup `/atlas/studio`. Core registry and
metadata services are under `src/core/studio`; module UI/manifest under
`src/modules/studio`. This is the Phase 1 metadata kernel, not completed Page/
Process/Flow Studio. Later builders/engines remain deferred. Recovery and gate
evidence: `docs/studio/STUDIO_IMPLEMENTATION_PROGRESS.md`.
