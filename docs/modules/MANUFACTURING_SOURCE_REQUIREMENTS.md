# Supplied manufacturing requirements — 3 October 2026 (replaced same day)

Complete replacement attachment, "ATLAS MANUFACTURING — MRP, Production Planning,
Scheduling and Shop-Floor Execution Master Build Brief", sections 1–173, preserved
verbatim below. This supersedes the previous attachment preserved earlier the same
day (the "Inventory, Manufacturing, Planning, Scheduling, Production and Costing
Architecture" brief, sections 1–143) — that earlier text is retained in Git history
at this path, not duplicated here. Target scope, not delivered functionality.
See [delivery architecture](MANUFACTURING_PLANNING.md) and
[section coverage](MANUFACTURING_COVERAGE.md).

---

# ATLAS MANUFACTURING
# MRP, Production Planning, Scheduling and Shop-Floor Execution Master Build Brief

## 1. ROLE

Continue development of Atlas as:

- principal ERP architect
- senior manufacturing systems engineer
- MRP/MES specialist
- production-planning specialist
- supply-chain architect
- premium product designer

This is not a manufacturing-order CRUD screen. This module must become a serious
manufacturing system capable of coordinating Sales, Customer demand, Forecasting,
Products, Stock, Purchasing, Logistics, Production capacity, Shop-floor execution,
Quality, Maintenance, People and Finance, while remaining dramatically easier to
understand than traditional ERP manufacturing software.

Before implementation inspect: AGENTS.md, docs/ARCHITECTURE.md, docs/MODULE_SPEC.md,
docs/DESIGN_SYSTEM.md, Customer Master, Sales CRM, Sales Order Processing, Logistics,
Product architecture, Stock architecture if available, Purchasing contracts if
available, Finance contracts, permissions, audit, activity, events, workflow
infrastructure. Do not duplicate capabilities owned by other Atlas modules.

## 2. PRODUCT GOAL

Atlas Manufacturing must answer five questions extremely well: What do we need to
make? When do we need to make it? Do we have the materials? Do we have the
capacity? Is production actually on track? The system must connect these
questions. Do not create separate islands for MRP, scheduling and shop-floor
execution.

## 3. PRIMARY WORKFLOW

Customer demand + Forecast demand + Stock policy + Existing supply → Production
planning / MRP → Planned Production Orders, Purchase suggestions, Transfer
suggestions → Production scheduling → Production Orders → Work Orders → Material
staging → Shop-floor execution → Finished output → Stock / Quality / Put-away →
Logistics → Customer shipment → Finance. Every step must remain traceable.

## 4. DEMAND-TO-DELIVERY TRACEABILITY

A flagship capability: trace Sales Order → demand → Production Order → components
→ Purchase Order → Work Orders → Finished Stock → Shipment, and backwards from a
component delivery to the customer promise date it protects. Known conceptually as
demand/supply pegging. Implement it deliberately; do not force planners to work it
out manually.

## 5. DOMAIN OWNERSHIP

Sales owns: customer order, quantity ordered, requested date, promised customer
date, commercial priority, customer configuration.

Product owns: product identity, UOM, inventory policy, base attributes.

Manufacturing owns: production BOM, manufacturing formula, routing, operations,
production planning, production orders, work orders, capacity requirements,
manufacturing schedule, production execution, material requirements, consumption
expectations, output, production scrap, manufacturing variances.

Stock owns: inventory truth, locations, lots, serial numbers, available stock,
reservations, stock ledger, inventory movements.

Logistics owns: warehouse execution, component staging, physical warehouse
movements, finished-goods put-away, inter-site transfer, shipment.

Purchasing owns: suppliers, purchase orders, supplier commitments, inbound supply.

Quality owns or extends: inspections, quality specifications, non-conformance,
quality holds.

Maintenance owns or extends: equipment maintenance, downtime, preventive
maintenance, breakdowns.

People owns: employees, skills, working patterns, qualifications.

Finance owns: accounting, WIP accounting, inventory valuation, labour postings,
manufacturing financial postings.

Manufacturing consumes these through stable contracts.

## 6. PRIMARY NAVIGATION

Keep Manufacturing navigation simple: Today, Plan, Schedule, Produce, Shop Floor,
Reports. Do not permanently expose BOMs, Routings, Work Centres, Machines, Work
Orders, MPS, MRP, Capacity, Materials, Subcontracting, Scrap, By-products,
Calendars — those remain available contextually or through Manufacturing settings.

## 7. TODAY

Today is the production command centre. It must answer "what needs attention
right now?" with a real summary of active/running/waiting/ready/blocked orders,
things needing attention (at-risk customer orders, material-short orders,
overloaded work centres, late work orders, critical POs, quality holds blocking
stock), and next completions. No generic dashboard-card wall — everything must
drill into actual production.

## 8. MANUFACTURING MODES

Support architecture for Make to Stock, Make to Order, Assemble to Order,
Configure to Order, Engineer to Order, Batch Production, Repetitive Production.
Do not force every business to configure these explicitly — provide sensible
defaults.

## 9. PRODUCT MANUFACTURING PROFILE

A manufactured product may have: production policy, default BOM, default
routing, manufacturing lead time, minimum/maximum/preferred batch size, multiple
quantity, scrap allowance, yield expectation, production site, default output
location, make/buy policy, subcontract option, planning policy. Keep this as a
Manufacturing extension of Product — do not create another product master.

## 10. BILL OF MATERIALS

Support single-level, multi-level, nested assemblies, subassemblies, phantom
assemblies, variants, configurable components, optional components, substitutes,
by-products, co-products where relevant, scrap allowance, quantity formulas, UOM
conversions.

## 11. BOM LINE

Each component may contain: component product, quantity, UOM, scrap factor,
operation consumption point, issue method, substitute group, optional flag,
effective date, expiry date, notes.

## 12. MULTI-LEVEL BOM

Atlas must explode multi-level structures; MRP must understand demand at every
level. Avoid recalculating the entire world unnecessarily — use low-level code or
equivalent dependency handling.

## 13. BOM VERSIONS

Never silently edit the structure used for historical production. Support
revision, effective-from, effective-to, status, author, approval, change reason.
Production Orders must snapshot the BOM/revision they use.

## 14. BOM CHANGE CONTROL

Optionally support approval before releasing significant BOM revisions: Draft,
Review, Approved, Active, Obsolete. Make it configurable — do not force formal
engineering control onto tiny manufacturers.

## 15. ALTERNATE BOM

A product may have more than one approved way to produce it (standard, high-speed
line, manual backup, subcontracted). Planning/scheduling may select an alternative
based on rules and capacity. Never silently switch method without traceability.

## 16. COMPONENT SUBSTITUTION

Support approved alternatives per primary component. Substitution may be
automatic, planner-approved, production-approved, or prohibited. Track actual
component consumed.

## 17. ROUTINGS

A routing defines how the product is made, as an ordered sequence of operations,
each referencing production resources.

## 18. ROUTING VERSIONING

Routings also require revisions/effectivity. Production history must retain the
route actually used — do not allow historical production to change because
today's routing was edited.

## 19. OPERATION

An operation may contain: sequence, name, work centre/resource requirement, setup
time, run time, run quantity, queue time, wait time, move time, overlap, minimum
transfer quantity, instructions, documents, quality requirement, required skill,
tooling requirement, cost parameters.

## 20. OPERATION DEPENDENCIES

Support finish-to-start, and where needed overlapping dependencies ("Operation B
can begin when 50 units of Operation A are complete"). Do not assume the entire
batch must finish every operation before the next begins.

## 21. WORK CENTRES

Manufacturing owns logical Work Centres (e.g. Clay Preparation, Press Line 1,
Press Line 2, Dryer, Kiln, Finishing, Packing) representing a capacity resource
or group.

## 22. RESOURCES

A work centre may contain specific resources (e.g. Kiln 1/2/3). Resource types:
machine, production line, labour team, workstation, cell, subcontract resource.

## 23. RESOURCE CAPABILITY

Do not assume every machine can make every product. Support capabilities such as
diameter range, maximum length, product family, tool requirement, temperature
capability, certification. Scheduling should only assign suitable resources.

## 24. ALTERNATE RESOURCES

Operations may define preferred and alternative resources. Scheduler may use
alternatives where permitted and must explain why a resource was selected.

## 25. PRODUCTION CALENDAR

Capacity requires real calendars: working days, shifts, holidays, breaks, planned
downtime, overtime, special shifts.

## 26. CAPACITY

Capacity derives from available time × number of resources × efficiency. Support
theoretical capacity, available capacity, reserved capacity, scheduled load,
remaining capacity.

## 27. RESOURCE EFFICIENCY

Allow historical/planning efficiency factors (e.g. nominal 100 units/hour,
planning efficiency 85%, expected 85 units/hour). Do not overwrite actual
performance with planning assumptions.

## 28. BOTTLENECKS

Resources may be flagged or detected as likely bottlenecks; the planner should see
capacity vs demand and the overload, then identify which production orders create
it.

## 29. PLANNING VS SCHEDULING

Keep these separate conceptually. Planning asks what/how much/by when/what to
buy. Scheduling asks which resource performs each operation, at what exact time,
in what sequence. Do not blend them into one opaque algorithm.

## 30. MASTER PRODUCTION SCHEDULE

Provide an MPS for medium/long-term production planning, combining actual
customer demand, demand forecast, existing inventory, confirmed production,
planned production, target stock, safety stock, expected purchases, expected
transfers.

## 31. MPS UX

Do not copy a giant spreadsheet. Provide a strong planning grid (opening, firm
demand, forecast, scheduled supply, projected, target, suggested make, by period)
with expandable detail. Click any number to explain it.

## 32. PLANNING PERIODS

Support day/week/month depending on horizon (daily near-term, weekly medium,
monthly long).

## 33. FORECAST

Manufacturing consumes forecast demand from the appropriate Atlas planning/sales
forecasting source — do not make users re-enter forecasts in several modules.
Allow planner adjustments and scenario values; track statistical forecast,
commercial forecast, planner adjustment, final planning forecast where those
capabilities eventually exist.

## 34. MRP

Implement proper material requirements planning: gross requirements − available
supply − existing inventory + safety requirements = net requirement, then explode
dependent component requirements through BOM levels, considering demand dates,
lead times, BOM quantities, scrap/yield, inventory, reservations, existing POs,
existing production orders, transfer supply, safety stock, order modifiers.

## 35. MRP OUTPUT

MRP should produce suggestions, not mysterious changes: Make, Buy, Transfer,
Expedite, Delay, Cancel — each with product/quantity/date and reason.

## 36. PLANNING ACTION MESSAGES

Use clear human language ("Bring PO-1182 forward by 3 days — Why? Material MAT-A
is required by MO-1842 to protect SO-9281 promised for 18 October"), not system
codes like "Reschedule In Exception 17".

## 37. PEGGING

Every planned supply suggestion should show its demand (which sales orders,
forecast, safety stock it serves) and, for components, which production orders
consume it.

## 38. PLANNING EXCEPTIONS

Provide an exception workspace: material shortage, capacity shortage, late
purchase/production order, demand brought forward/cancelled, excess inventory,
safety stock breach, BOM problem, no valid routing, no capable resource.
Prioritise by business impact.

## 39. CUSTOMER IMPACT

A signature feature: a material shortage view must show the affected production
order, the affected customer and sales order, promised delivery, and current
expected delivery — without navigating through five modules.

## 40. SUPPLY SUGGESTIONS

MRP can suggest a production order, purchase order, or stock transfer. The
appropriate module executes it — Manufacturing does not create supplier
commercial orders internally; purchase suggestions go to the Purchasing
provider, transfer suggestions go to Stock/Logistics.

## 41. FIRMING

Planned orders are not committed production. Support Planned, Firm Planned,
Released. Users firm planning suggestions into real Production Orders.
Automatic firming may be configurable within an approved time fence.

## 42. PLANNING TIME FENCES

Support Locked / Controlled / Flexible horizons (e.g. next 2 days locked, days
3–7 need planner approval, beyond 7 days system may freely suggest changes). Use
clear Atlas language, not obscure terminology, unless the business chooses it.

## 43. WHAT-IF PLANNING

Provide scenario planning (e.g. "what if Northbridge needs 500 more?", "what if
Kiln 2 is unavailable next week?"). Scenarios must not alter live production;
display impact on customer dates, material shortage, capacity, workload,
inventory, purchasing requirement.

## 44. PRODUCTION SCHEDULING

The scheduler converts planned work into an executable timeline: forward
scheduling, backward scheduling, finite capacity, optional infinite capacity,
finite materials, alternate resources, operation dependencies, calendars,
setup/run times, priorities.

## 45. BACKWARD SCHEDULING

Work backwards from the customer required date through pack/inspect/fire/dry/form
etc. to the required start.

## 46. FORWARD SCHEDULING

Starting from earliest materials available, calculate earliest finish — can feed
Sales order promising.

## 47. FINITE CAPACITY

Do not schedule two jobs onto the same finite machine at the same time. Existing
committed work consumes capacity. When insufficient capacity exists, show the
conflict and next feasible slot — never silently overbook a finite resource.

## 48. FINITE MATERIALS

Production should not be scheduled to begin before critical material is
available where finite-material policy applies; compute the earliest feasible
start from machine and material availability together.

## 49. SCHEDULER QUALITY

Do not attempt an academically perfect global optimisation solver in this task —
that wastes engineering effort. Build a deterministic, explainable, testable,
finite-capacity scheduler using sensible heuristics, with an extension interface
for future Advanced Planning & Scheduling optimisation.

## 50. SCHEDULE

The primary Schedule screen should be visually exceptional, supporting views By
Work Centre, By Production Order, By Product, By Customer Demand. Default: By
Work Centre.

## 51. GANTT SCHEDULE

Use a serious interactive Gantt/timeline, not a decorative one — an operational
planning tool.

## 52. DRAG AND DROP

Planners may move work where permitted. Before committing a move, show
consequence (customer delivery impact, dependent operations, material conflict)
and require confirmation if it makes a delivery late. Do not silently destroy
schedule integrity.

## 53. AUTOMATIC RESCHEDULING

Offer "Reschedule affected work" after downtime, late material, priority change,
or order amendment. Show proposed changes before applying significant schedule
movements.

## 54. SCHEDULE LOCK

Allow planners to lock production order, operation, resource assignment, start
time. Automatic scheduling must respect locks.

## 55. PRODUCTION PRIORITY

Priority may derive from customer promise, customer priority, lateness risk,
production order priority, downstream dependency, expedite flag. Always explain
priority.

## 56. SETUP OPTIMISATION

Where meaningful, scheduler architecture should support setup families (e.g.
100mm→150mm needs less setup than 100mm→450mm). Do not build complex
sequence-dependent setup optimisation initially unless actual data exists —
provide the model/extension point.

## 57. PRODUCTION ORDER

A Production Order is the committed instruction to manufacture a quantity. It
should contain: number, product, revision, quantity, UOM, site, warehouse, BOM
snapshot, routing snapshot, planned start, planned finish, required date,
priority, source demand, status, material status, capacity status, quality
status.

## 58. PRODUCTION ORDER LIFECYCLE

Keep the visible lifecycle understandable: Planned, Ready, Released, Running,
Complete, Closed. Internal states may be richer — do not expose twenty technical
states to ordinary users.

## 59. READY CHECK

Before release, answer: Materials Ready/Short, Capacity Scheduled/Conflict,
Documents Ready/Missing, Quality plan Ready/Not required, Tooling Ready/Missing,
then "Ready to release" or a clear explanation of why not.

## 60. MATERIAL REQUIREMENTS

Production Order shows required/available/short per material, with incoming
dates. Click a material for pegging/supply explanation.

## 61. MATERIAL STAGING

Manufacturing determines what production needs; Logistics executes physical
staging via a staging request → pick → production staging area flow.
Manufacturing must not directly manipulate warehouse quantities.

## 62. MATERIAL RESERVATION

Manufacturing may request Stock to reserve required material; Stock remains
source of truth. Support policies: reserve on firming, reserve on release,
reserve X days before start, manual.

## 63. MATERIAL ISSUE

Support manual issue, preflush, backflush, and operation-based consumption. Be
extremely careful to prevent double consumption.

## 64. ACTUAL CONSUMPTION

Always preserve expected, actual, and variance (quantity and %) per component.

## 65. OVER / UNDER CONSUMPTION

Configurable tolerance; beyond tolerance require manager approval rather than
silently accepting extreme consumption.

## 66. WORK ORDERS

Routing operations generate Work Orders — the executable shop-floor activity
(e.g. Mix, Form, Dry, Fire, Inspect under one Production Order).

## 67. WORK ORDER

Each Work Order needs: production order, operation, product, quantity, work
centre, resource, scheduled start/end, predecessors, material requirements,
instructions, documents, quality checks, time, produced quantity, scrap, status.

## 68. WORK ORDER STATUS

Keep simple: Waiting, Ready, Running, Paused, Blocked, Complete.

## 69. SHOP FLOOR

A dedicated execution experience — do not place factory workers inside the office
ERP interface. Large, touch friendly, tablet friendly, scanner friendly, minimal
typing.

## 70. SHOP FLOOR HOME

A worker sees the current work centre's now/next work with quantity, operation,
scheduled window, and a Start action.

## 71. START WORK

Running view shows elapsed time, target vs completed quantity, and actions:
Report progress, Pause, Issue material, Problem.

## 72. PAUSE

Pause reasons: Break, Waiting material, Machine problem, Quality issue,
Changeover, No operator, Other — enabling downtime analysis. Do not require a
reason for every normal pause unless configured.

## 73. COMPLETE OPERATION

Worker reports good quantity, scrap, rework; Atlas validates expected quantities,
then completes the operation.

## 74. PARTIAL COMPLETION

Production must support partial output across multiple reporting transactions,
not requiring the entire batch to complete in one go.

## 75. PRODUCTION BACKORDER

If only part of planned production completes, support the remaining quantity as
same-order-remaining or a split/backorder production order, per configured
workflow, preserving original linkage.

## 76. SPLIT PRODUCTION ORDER

Allow a production order to split into multiple orders (different resources,
dates, partial material, expedited portion).

## 77. MERGE

Where valid and safe, planned/compatible orders may be merged. Do not merge
after execution history would make traceability unclear.

## 78. LOT / BATCH TRACEABILITY

Manufacturing must support Stock-managed batch/lot tracking, retaining full
genealogy from consumed lots to produced lots.

## 79. SERIAL TRACEABILITY

For serial-controlled products, retain exact genealogy: finished serial →
components → component serials/lots → production order → work orders → customer
shipment.

## 80. PRODUCT GENEALOGY

Build a clear traceability view (lot produced, production order, components and
their lots, shipped-to customer/shipment) — valuable for recalls and quality
investigation.

## 81. FINISHED OUTPUT

When production reports good output, Manufacturing instructs Stock through a
controlled interface: Work Order completed → production output → quality hold or
output location → Logistics put-away → available stock. Do not directly
manipulate inventory quantities in Manufacturing.

## 82. REPORT AS FINISHED

Support partial finished quantity, good quantity, error/scrap quantity,
lot/serial, output location, quality requirement.

## 83. FINISHED-GOODS PUT-AWAY

Logistics executes the physical movement from production output to storage.

## 84. SCRAP

Scrap is first-class production information: component scrap, process scrap,
finished-product scrap, capturing product, quantity, operation, reason, worker,
resource, production order, cost impact.

## 85. SCRAP REASONS

Configurable: Breakage, Quality failure, Setup waste, Machine fault, Material
defect, Process variation, Handling damage, Other.

## 86. YIELD

Track input, good output, scrap, rework and the resulting yield %; compare
expected and actual yield.

## 87. REWORK

Do not treat rework as invisible extra labour. Support rework quantity, reason,
route, operations, cost, and link to the related original production.

## 88. BY-PRODUCTS

Support output other than the primary product; track by-product stock and
costing treatment.

## 89. CO-PRODUCTS

Prepare architecture for processes producing multiple valuable outputs; keep
financial cost-allocation calculation extensible.

## 90. PROCESS MANUFACTURING

Do not overbuild full chemical/process manufacturing immediately, but
architecture should not prevent formulas, batch sizes, yield, co-products,
variable consumption, lot control, potency/concentration extensions, expiry.
Discrete manufacturing is the initial primary implementation.

## 91. SUBCONTRACTING

Support proper outsourced manufacturing: supplier provides everything; we supply
components (free-issue) and receive finished goods; or direct/dropship
subcontract.

## 92. SUBCONTRACT ORDER

Manufacturing defines the production requirement; Purchasing owns the subcontract
commercial PO; Logistics handles component shipping/receipt; Stock tracks
ownership/location; Manufacturing retains production genealogy.

## 93. SUBCONTRACT COMPONENTS

Track what is supplied to the subcontractor and expected output; track stock
physically at the subcontractor where Stock architecture supports it.

## 94. SUBCONTRACT COST

Manufacturing cost can include components + subcontract charge + freight + other
allowed landed costs; Finance owns final accounting treatment.

## 95. QUALITY INTEGRATION

Do not build a giant Quality application inside Manufacturing — provide clear
extension points. Quality checks may trigger at receipt, start operation, during
operation, completion, report as finished, release to stock.

## 96. QUALITY CHECK

Shop Floor may show a required quality check with target/tolerance and result
entry; on failure, hold production or take the configured action. Quality module
owns the non-conformance process.

## 97. QUALITY HOLD

Finished output may be produced but held, with Sales and Planning understanding
quality-held stock is not available.

## 98. MAINTENANCE INTEGRATION

Resource availability must account for planned and unplanned downtime;
Maintenance contributes unavailable windows the scheduler consumes as unavailable
capacity.

## 99. BREAKDOWN

From Shop Floor, "Report machine problem" can create a Maintenance request;
Manufacturing marks work appropriately blocked. Do not create a second
maintenance system inside Manufacturing.

## 100. PEOPLE / SKILLS

Some operations require specific skills or qualifications; People module
supplies qualification data; scheduler may use it where configured. Do not
expose sensitive HR information unnecessarily.

## 101. LABOUR

Capture actual labour time where relevant (employee, start, finish, duration,
operation); multiple workers may work on an operation. Use People identity — do
not duplicate employee records.

## 102. TOOLING

Prepare resource architecture for moulds, dies, jigs, fixtures, specialist
tools, each with availability, compatible operation, capacity, maintenance
requirement. Do not force tool management where not needed.

## 103. PRODUCTION COSTING

Provide estimated versus actual production cost: materials, labour, machine,
overhead, subcontract, scrap, other.

## 104. PLANNED COST

Estimated cost breakdown before production, with cost/unit.

## 105. ACTUAL COST

Actual cost breakdown after production, with cost/unit.

## 106. COST VARIANCE

Show expected vs actual and variance %, then explain by material/labour/machine
variance.

## 107. FINANCE INTEGRATION

Manufacturing emits financial production events; Finance owns ledger, WIP
accounting, inventory accounting, variance posting, overhead posting.
Manufacturing does not post directly to GL tables.

## 108. WIP

Manufacturing tracks operational WIP (released material, consumed material,
operations complete, finished output); Finance determines financial WIP
valuation; Stock determines physical inventory states.

## 109. SALES INTEGRATION

Sales should see manufacturing projection (production order, % in production,
expected completion vs customer promised date, on-track status). Sales does not
own Production Orders.

## 110. CRM INTEGRATION

For make-to-order opportunities, CRM may eventually show production projection
after a won deal. Keep this as projection.

## 111. LOGISTICS INTEGRATION

Logistics receives component staging demand, finished-goods output for
put-away, and inter-work-centre movement where physical warehouse execution is
required. Manufacturing does not create warehouse picks internally.

## 112. PURCHASING INTEGRATION

MRP supplies purchase suggestions; Purchasing returns PO status, supplier
commitment, expected receipt, actual receipt, delay. Planner sees impact without
owning PO logic.

## 113. STOCK INTEGRATION

Manufacturing requires AvailabilityProvider, ReservationProvider,
InventoryMovementProvider, TraceabilityProvider. Use established Atlas contracts;
do not query Stock tables directly.

## 114. PRODUCTION AVAILABILITY

Production Order should summarise materials ready/short counts and detail per
short material (shortage, incoming date).

## 115. SHORTAGE RESOLUTION

Actions: review supply, request purchase, use substitute, change quantity,
reschedule, split production, transfer stock — each belonging to the appropriate
module.

## 116. CUSTOMER PROMISE

Manufacturing should contribute to capable-to-promise: Sales asks "can we supply
500 CP1/1 by 18 Oct?"; Planning considers current finished stock, component
supply, production capacity, existing commitments, production lead time,
logistics lead time; return an explainable answer.

## 117. CTP RESPONSE

Example: can promise 500 by 18 Oct via 120 from stock + 380 manufactured in a
14–16 Oct production slot; or earliest full delivery 21 Oct with the limiting
constraint named. An exceptional Atlas feature.

## 118. PRODUCE WORKSPACE

The manager/supervisor production-order workspace: Active, Ready, Blocked, Late,
Completed views; saved views like My site, Due today, Material short, Capacity
issue, Customer orders at risk.

## 119. PRODUCTION ORDER LIST

Default columns: MO, Product, Quantity, Required, Planned Finish, Progress,
Material, Schedule, Status. Optional: source demand, customer, cost, yield,
work centre, priority. Keep it readable.

## 120. PRODUCTION ORDER UI

A single order view surfaces product, quantity, required/scheduled finish dates,
progress, material readiness, the operation list with status, source customer
demand, and "needs attention" items — far more useful than every raw field.

## 121. SHOP FLOOR DOCUMENTS

Operations may include work instruction, drawing, photograph, specification,
safety instruction, checklist — using Atlas documents/attachments, version
controlled where appropriate.

## 122. BARCODE / SCANNING

Shop Floor may scan production order, work order, product, component, lot,
serial, employee badge, workstation — using existing Atlas barcode architecture.

## 123. REAL-TIME PROGRESS

Production reporting should update Production Order, Schedule, Material
consumption, Stock, Customer projection, Planning appropriately, avoiding
manual-refresh-heavy architecture.

## 124. DELAY DETECTION

Compare planned vs actual progress and estimate risk (expected %, actual %,
estimated finish vs planned finish), explaining the source of the estimate.

## 125. RESCHEDULING IMPACT

If production slips, calculate affected downstream operations, other
production, Sales Orders, shipment promises, and show how many customer orders
may be affected.

## 126. SCHEDULE ALERTS

Resource overloaded, material arrives after scheduled start, operation running
late, dependent operation cannot start, schedule conflict, machine unavailable,
customer promise at risk — prioritised by impact.

## 127. MPS VS DAILY EXECUTION

Do not force long-term planners into shop-floor details. Plan: days/weeks/months,
demand/supply, materials, capacity. Schedule: hours/days, resources, exact
operations. Shop Floor: now/next, execution. This hierarchy keeps complexity
manageable.

## 128. REPORTING

Manufacturing should ship with serious standard reporting — do not require BI
work just to understand production.

## 129. PRODUCTION PERFORMANCE

Report quantity planned/produced, completion %, orders late/on time, production
lead time, schedule adherence.

## 130. CAPACITY

Report available/scheduled/actual hours, utilisation, overload, idle capacity,
bottlenecks, by work centre/resource/shift/site.

## 131. OEE

Where data quality is sufficient, support Availability × Performance × Quality =
OEE. Never display an OEE value if required data is not actually captured;
explain the calculation.

## 132. DOWNTIME

Report planned/unplanned downtime duration, resource, reason, production impact.

## 133. YIELD REPORTING

Report expected/actual yield, scrap %, rework %, by product/operation/
resource/shift.

## 134. MATERIAL VARIANCE

Report expected vs actual consumption and variance/variance %, drillable by
product/order/operation.

## 135. PRODUCTION COST

Report estimated/actual cost, cost/unit, material/labour/machine variance,
scrap cost, subcontracting cost.

## 136. SCHEDULE ADHERENCE

Measure planned vs actual start/finish by work centre/production order/product.

## 137. THROUGHPUT

Report units/hour, units/shift, orders completed, operation throughput,
constrained throughput. Do not compare dissimilar product quantities blindly —
use appropriate UOM/context.

## 138. WIP

Report open Production Orders, material in WIP, operation stage, age, quantity,
financial value supplied by Finance where permitted.

## 139. CUSTOMER RISK

A "Customer Orders at Risk" report: customer, sales order, promised date,
production order, issue, expected date, impact. One of Atlas's best
cross-module reports.

## 140. MRP PERFORMANCE

Track planning health: shortages, excess, expedites, defer suggestions,
cancelled demand, unresolved planning messages.

## 141. SUBCONTRACTING REPORT

Orders outsourced, supplier, due date, components supplied, finished quantity,
lead time, cost, delay.

## 142. TRACEABILITY REPORT

Search lot, serial, production order, raw material, finished product, customer
shipment; traverse relationships both directions.

## 143. SAVED VIEWS

Due today, Late, Customer risk, Material short, Awaiting release, In production,
Quality hold, Subcontracted, High scrap, Capacity conflict — private/team/company
views.

## 144. ATTENTION PROVIDER

Manufacturing contributes to Atlas Home with real, drillable items (customer
orders at risk, overloaded work centres, material-short orders, late jobs, a
delayed component's exposure value). Home must not contain Manufacturing logic.

## 145. ACTIVITY PROVIDER

Meaningful activities only (order released, production started, units completed,
production finished, shortage detected, order rescheduled) — do not flood the
global feed with every machine event.

## 146. COMMANDS

Atlas global command can create production order, find an MO, show production at
risk, answer "what's short this week?", open the schedule, show a work centre's
capacity, show customer orders at production risk. Manufacturing registers
commands.

## 147. EVENTS

Publish events such as manufacturing.plan.generated, manufacturing.shortage.
detected, manufacturing.order.planned/firmed/released/started/completed/closed,
manufacturing.order.rescheduled, manufacturing.work_order.started/paused/
completed, manufacturing.material.consumed, manufacturing.output.reported,
manufacturing.scrap.reported, manufacturing.rework.created,
manufacturing.subcontract.required. Follow Atlas conventions.

## 148. PROVIDER INTERFACES

Use stable boundaries conceptually: DemandProvider, ForecastProvider,
StockProvider, ReservationProvider, PurchasingSupplyProvider, LogisticsProvider,
QualityProvider, MaintenanceProvider, PeopleAvailabilityProvider,
FinanceManufacturingProvider, AdvancedSchedulerProvider. Do not over-engineer
interfaces where an existing Atlas contract already serves the purpose.

## 149. IDEMPOTENCY

Material movements and completion events must be idempotent — double-tapping
Complete must not produce 1,000 items instead of 500. Every consequential
operation needs robust command identifiers/transaction boundaries.

## 150. CONCURRENCY

Several people may report on the same order, plan schedule, issue material,
complete work concurrently. Handle conflicts safely — do not allow silent
last-write-wins on important production data.

## 151. PERMISSIONS

Capabilities such as manufacturing.plan.read/manage/firm,
manufacturing.schedule.read/manage/lock, manufacturing.order.read/create/
release/amend/close, manufacturing.work_order.read/execute/override,
manufacturing.material.issue/override, manufacturing.scrap.report/approve,
manufacturing.cost.read, manufacturing.bom.read/manage,
manufacturing.routing.manage, manufacturing.resource.manage. Use Atlas
permissions.

## 152. SHOP FLOOR PERMISSIONS

A shop-floor operator usually needs: view assigned work, start work, pause,
report quantity, report scrap, record material, report problem. They do not
automatically need customer prices, sales margin, product cost, supplier
pricing, employee performance data.

## 153. AUDIT

Audit BOM revision, routing revision, planning firming, schedule change,
production release, quantity change, material override, scrap, completion,
reversal, subcontract decision. Keep operational history distinct from
user-facing activity.

## 154. REVERSALS

Do not permit users to simply edit posted historical transactions. Use
controlled correction/reversal; Stock and Finance must remain reconcilable.

## 155. PERFORMANCE

Design for thousands of products, multi-level BOMs, large requirement
explosions, years of production history, thousands of Work Orders, many
concurrent shop-floor devices. Use indexes, incremental calculations, job queues
where appropriate, cached projections, pagination, efficient planning runs. Do
not load all production history to render one order.

## 156. PLANNING RUN

A planning run should have identity: Run ID, timestamp, parameters, demand
snapshot, result, warnings, duration. Allow users to compare or inspect results.

## 157. EXPLAINABILITY

Planning recommendations must be explainable with the actual demand breakdown
behind a suggestion (not "System suggests MO-882").

## 158. AI

Do not make MRP dependent on AI — deterministic calculations remain
authoritative. Future AI may summarise shortages, explain schedule risks,
suggest scenarios, draft production briefings, identify patterns, help planners
interrogate data. Deterministic schedule/data remain source of truth.

## 159. VISUAL DESIGN

Manufacturing should feel like Atlas — no ancient ERP screens, no 50-field
forms, no excessive coloured tiles. Today: calm command centre. Plan:
analytical planning grid. Schedule: visual timeline. Produce: structured
production management. Shop Floor: large, simple execution. Reports: clear
operational analysis.

## 160. PLANNING COLOUR

Use restrained meaning: green safe/on track, amber risk, red cannot meet
requirement, blue planned/selected, grey uncommitted/inactive. Do not use
rainbow colours for every work centre.

## 161. MOBILE / TABLET

Shop Floor is explicitly tablet/mobile friendly. Plan and Schedule remain
desktop-first — do not sacrifice serious planning capability trying to squeeze a
Gantt chart onto a phone.

## 162. REALISTIC DEMO DATA

Test with actual complexity: multiple finished goods, multi-level BOMs, shared
components, constrained work centres, multiple machines, customer demand,
forecast demand, missing material, late purchase, multiple warehouses, lots,
serials, scrap, rework, subcontracting, machine downtime.

## 163. CRITICAL PLANNING TESTS

Test MTO demand, MTS demand, forecast, safety stock, BOM explosion, multi-level
requirements, existing inventory, existing supply, planned production, purchase
suggestions, transfer suggestions, shortages, cancelled demand, changed demand,
pegging.

## 164. SCHEDULING TESTS

Test forward/backward scheduling, finite capacity, finite material, resource
calendar, alternate resource, downtime, locked operation, dependency, overlap,
schedule move, customer impact.

## 165. EXECUTION TESTS

Test release, start, pause, partial complete, complete, material consumption,
backflush, over-consumption, scrap, rework, lot, serial, finished output,
Logistics put-away request.

## 166. CROSS-MODULE TESTS

Sales: Sales Order creates correct demand; production date projects back to
Sales. Stock: material reservations and consumption movements work correctly;
finished output enters Stock correctly. Logistics: material staging,
finished-goods put-away. Purchasing: MRP suggestion creates proper purchase
request/hand-off; supplier delay changes production risk. Finance: production
events/cost projection integrate without Manufacturing posting ledger directly.
Maintenance: machine downtime removes capacity. Quality: quality hold blocks
available finished supply.

## 167. VISUAL REVIEW

Render and inspect: Manufacturing Today, MPS, MRP action messages, shortage
detail, pegging view, work-centre capacity, Gantt schedule, schedule conflict,
Production Order, material shortage, Work Order, Shop Floor tablet, partial
completion, scrap, traceability, production costing, customer-orders-at-risk
report. If any screen feels like traditional ERP complexity, improve
presentation rather than deleting capability.

## 168. DOCUMENTATION

Create docs/modules/MANUFACTURING.md documenting: domain ownership, Product
relationship, Sales demand, BOM, routing, resource/capacity model, MPS, MRP,
pegging, scheduler, Production Order, Work Order, material consumption, Stock
integration, Logistics integration, Purchasing integration, Finance integration,
Quality/Maintenance extension points, Shop Floor, costing, traceability,
permissions, events.

## 169. BUILD ORDER

Phase 1 — Manufacturing domain foundation: BOM, routing, operation, work centre,
resource, Production Order, Work Order.
Phase 2 — Demand and planning: Sales demand, forecast contract, MPS, MRP, BOM
explosion, pegging, action messages.
Phase 3 — Materials: Stock availability, reservations, material requirements,
shortages, Purchasing suggestions, transfer suggestions.
Phase 4 — Scheduling: calendars, capacity, forward/backward scheduling, finite
capacity, finite material, Gantt, locks, rescheduling impact.
Phase 5 — Execution: release, Shop Floor, start/pause/complete, labour/time,
consumption, output, scrap, partial completion.
Phase 6 — Traceability: lots, serials, genealogy, rework, by-products.
Phase 7 — Cross-module execution: Logistics staging, finished-goods put-away,
Quality, Maintenance, subcontracting.
Phase 8 — Costing and analytics: estimated/actual cost, variance, capacity,
yield, OEE, schedule adherence, customer risk.
Phase 9 — Quality of delivery: permissions, audit, performance, concurrency,
tests, visual review, documentation.

## 170. SCOPE CONTROL

Do not waste implementation effort on: mathematically perfect global APS
optimisation, machine-learning scheduling, detailed payroll, full QMS, full
CMMS maintenance, supplier purchasing functionality, logistics warehouse
execution, general ledger posting, complex chemical formulation, PLC/SCADA
integration, IoT hardware. Build appropriate integration contracts — the core
Manufacturing system must be excellent first.

## 171. DEFINITION OF DONE

Atlas Manufacturing is complete for this phase when it can model manufactured
products; manage/version multi-level BOMs and routings; manage work
centres/resources; model real capacity; consume customer and forecast demand;
run MPS and MRP; generate explainable planned supply, purchase suggestions,
transfer suggestions; provide full demand/supply pegging; identify shortages
and customer impact; create/firm Production Orders; forward/backward/finite-
capacity/finite-material schedule; visually schedule resources; safely
reschedule; run Work Orders; provide Shop Floor execution with time, material
consumption, backflush, good output, scrap, partial completion, backorders/
splits, lots/serials, genealogy, by-products; integrate subcontract
manufacturing, Quality, Maintenance, Stock, Logistics, Purchasing, Sales,
Finance (through contracts); calculate estimated/actual production cost and
variance; report capacity, yield, schedule adherence, production risk, auditable
OEE where data permits; expose customer orders at risk; maintain permissions and
audit; pass build and tests.

The strongest acceptance test: a confirmed Sales Order creates demand that flows
through Sales → Planning → MRP → Materials → Purchasing/Stock → Production
Schedule → Shop Floor → Finished Stock → Logistics → Customer without
re-keying, and when anything changes Atlas must show the effect through the
entire chain.

## 172. FINAL EXPERIENCE TEST

A production planner should understand within seconds what to make, what is
short, where capacity is overloaded, what will be late, which customer is
affected. A supervisor should understand what runs next, what is blocked, what
is behind, what has finished. An operator should understand what to make, where,
how many, what materials, what to do next. A sales user should see whether the
customer's order is on track. Logistics should know when finished goods become
available. Purchasing should know which materials matter and by when. Finance
should receive accurate production and costing events. Nobody should need to
understand the whole ERP to do their job.

## 173. FINAL RESPONSE

When implementation is complete, report only: Built (major manufacturing
capabilities), Planning (MPS, MRP, pegging, scheduling), Integrations (Sales,
Stock, Purchasing, Logistics, Finance, Quality, Maintenance), Shop Floor
(execution capabilities delivered), Verified (tests, type checks, production
build), Deferred (only deliberate later capabilities). No long development
diary.
