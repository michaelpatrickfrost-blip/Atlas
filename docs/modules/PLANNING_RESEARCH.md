# Manufacturing planning research and acceptance direction

3 October 2026. Primary vendor documentation reviewed in response to the user's
request for a flexible industrial planner, annual/weekly product plans, BOMs/WIP,
CSV downloads and team work assignment. Research defines targets; it is not a
certification or evidence that Atlas has implemented every capability.

## Reference findings

- [Odoo MPS](https://www.odoo.com/documentation/master/applications/inventory_and_mrp/manufacturing/workflows/use_mps.html): adjustable long-range product demand and replenishment with yearly, monthly, weekly and daily time ranges. This is the rolling `master` documentation; it must not be treated as a guarantee of features in a pinned Odoo release.
- [Dynamics master plans](https://learn.microsoft.com/en-us/dynamics365/supply-chain/master-planning/master-plans): distinct coverage, freeze, forecast, firming and capacity fences, plus multiple plans/simulations. Planning horizon and detailed finite scheduling horizon are separate settings.
- [Dynamics finite capacity](https://learn.microsoft.com/en-us/dynamics365/supply-chain/master-planning/planning-optimization/finite-capacity) and [job scheduling](https://learn.microsoft.com/en-us/dynamics365/supply-chain/production-control/job-scheduling): plan/resource constraints and existing capacity reservations determine feasible scheduling. Insufficient capacity changes feasible dates.
- [Dynamics BOM explosion](https://learn.microsoft.com/en-us/dynamics365/supply-chain/master-planning/master-plan-explosion-bom-version): dependent material demand carries site/warehouse context and recursively explodes relevant BOM versions.
- [Oracle aggregate production planning](https://docs.oracle.com/en/cloud/saas/supply-chain-and-manufacturing/26b/fausp/aggregate-production-planning-with-bills-of-resources.html): long-range planning can use aggregate bills of resources and critical components/bottlenecks, rather than detailed operation bookings for every future job.
- [Oracle manufacturing work orders](https://docs.oracle.com/en/cloud/saas/supply-chain-and-manufacturing/26b/faumf/overview-of-work-orders.html) and [scheduling analysis](https://docs.oracle.com/en/cloud/saas/supply-chain-and-manufacturing/26b/fapsu/analysis-and-adjustment-using-work-orders.html): operational definitions contain materials, operations, resources, output and dates; scheduled work is linked to execution and its current completion state.

## Atlas design derived from the research and user direction

These are design decisions/inferences for Atlas, not vendor guarantees:

1. Keep annual/multi-year product/family targets, monthly/weekly MPS and daily/shift
   operation scheduling as connected layers. Separate the covered horizon, visible
   bucket granularity and finite scheduling window. Permit rolling plans and custom
   dates; changing the view must never silently change or distribute quantities.
2. Keep a baseline and separate scenario versions. Model demand changes, resource
   outages, overtime/extra shifts, supplier delays, substitutions and route choices.
   Compare date risk, material shortage, capacity, WIP and cost before publishing.
3. Resolve effective BOM/routing definitions by product/variant/site/date/quantity.
   Explode multi-level, phantom, formula and alternative structures deterministically,
   retain pegging, reject cycles, and preserve approved/released snapshots.
4. Net usable stock, reservations, remaining order demand, expected receipts, WIP
   outputs and firm supply separately. Track remaining good output and unconsumed
   component demand at operation level. A partial completion must not count the
   same quantity in WIP and finished stock; scrap/rework/quality holds affect supply.
5. Support resource groups, work centres, machines, labour skills, tools, calendars,
   setup matrices and parallel/batch/rate capacities. Offer forward/backward
   scheduling, material constraints, precedence/overlap and lock protection.
6. A planner override retains the original proposal, reason, user and input version.
   Show cause → impact → action, with links to customer demand, component shortage,
   supplier receipt, WIP operation and downstream delivery risk.
7. Shared operational teams use existing memberships and user identities, with HR
   skill/leave/shift constraints supplied by their owning module. Assigning a target
   to a team does not prove labour availability or book machine capacity.
8. Export dated, tenant/capability-scoped demand, plans, assigned work and inventory
   as formula-safe CSV. Explicit user downloads are permitted; they do not establish
   local caches or a second source of truth.

## Acceptance that must precede calling the planner complete

- A 12-month product plan can be inspected monthly, weekly or daily; totals and
  scenario isolation remain correct across leap years, fiscal boundaries and DST.
- Annual targets are allocated to periods only by an explicit policy or user action;
  actual sales consume forecasts without double counting.
- Demand for 100 A with B×2 and C×1, where C needs D×3, explodes to B200/C100/D300.
  Usable stock, existing production/WIP and purchase/transfer receipts are netted once.
- A partially complete job feeds remaining good output, component requirements,
  resource effort and dated supply into the next run. Quality-held goods cannot
  fulfil demand until released.
- Two constrained jobs never overbook a machine, labour team or shared tool;
  freeze windows/locks survive reruns, breakdowns and drag-and-drop rescheduling.
- Work can be assigned/reassigned to teams and people with active membership,
  skill/availability validation, audit and concurrency conflict detection.
- Scenario approval converts proposals once into controlled executable orders.
  CSV represents the selected plan/filter and never bypasses read permissions.

## Delivered starting slice and remaining scope

The current implementation adds a stock-coverage workbench, saved date-bounded
product targets, team/person assignments and CSV exports. This is not a full MPS,
MRP, WIP engine or finite scheduler. Detailed source requirements and open gates
remain in [manufacturing planning](MANUFACTURING_PLANNING.md) and
[coverage](MANUFACTURING_COVERAGE.md). Do not manufacture BOM/WIP/capacity values
from these targets to make an incomplete planner appear complete.
