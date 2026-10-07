# Sales & Operations Planning

7 October 2026. Connected S&OP workflows are deployed and verified on the live server;
advanced master-spec coverage remains below. See `SOP_ACCEPTANCE.md`.
The supplied master specification is preserved in `docs/plans/SOP_IMPLEMENTATION_SPEC.md`.
This document describes implemented behaviour, not completion of that entire specification.

## Ownership and integration

S&OP (`sop`, `/sop`) owns cycles, immutable calculated versions, scenarios, review
stages, risks, actions and decisions. Plan (`plan`, `/plan`) owns flexible departmental
planning inputs and targets. Production Planning (`planning`) owns saved production
intentions; Manufacturing owns executable orders and MRP demand.

Module-owned `businessPlanningProvider` projections are called through Core's
`readBusinessPlanning` contract. Sales supplies confirmed/closed/held order lines
and distinct booking/requested/promised dates. CRM supplies permitted projects and
opportunities, enforcing rep ownership. Logistics supplies split shipment allocations,
actual delivery timestamps and expected receipts. Inventory supplies on-hand stock
less quality holds. Manufacturing and Production Planning supply dated production;
the calculation uses the greater quantity per product/month, not their sum. Finance
supplies spending-budget references. Product identity, pricing and units remain canonical.

## Plan builder

- One creation form with department, dates, measures and optional starter work.
- Overview, Build plan, Targets & forecast, Work & sharing, Review & scenarios.
- Source pickers for authorised CRM/Sales projects, opportunities, quotations and HR
  employees; canonical product selector; direct planning assumptions for other work.
- Inputs contain period, measure, value/quantity, probability, selling-price assumption,
  inclusion and a required reason. CRM probability stays linked until an explicit override is saved. Lost/inactive CRM sources are excluded from fresh demand without erasing prior inputs. Equal monthly phasing preserves rounding residue.
- Edit/exclude/include controls; batch monthly targets/forecast; hide/re-add measures
  without deleting prior cells. Money is stored in minor units throughout.
- Build forecast replaces affected totals from included weighted inputs. Product demand
  with an explicit selling price derives revenue. It does not add orders to those totals.
- Plan remains private until shared; view-only shares cannot edit. Locked plans/periods
  reject edits. Existing approved targets are preserved.

## S&OP calculations and screens

- Configurable 12/18/24/36-month cycle horizon and 12/24/36/60-month history.
- Requested demand, bookings, dispatch or delivery history; zero-filled closed-month series. Future cycles train only on fully elapsed months and align seasonal forecasts across the gap; partial/current/future periods do not become historical actuals.
- Moving/weighted average, seasonal naive, exponential smoothing and Croston/SBA;
  rolling holdout MAE selects best fit. Short history has an explicit fallback.
- Raw project demand, probability-weighted demand, conversion by attributed orders,
  remaining project demand, manual Sales inputs and forecast consumption are distinct.
- Consensus stays unconstrained. Dated stock/supply gives a separate constrained
  quantity, closing-stock projection and demand at risk. This is a stock cover review,
  not certification of machine, labour or material feasibility.
- Revenue preserves confirmed order values and uses product list prices or explicit input price assumptions for uncommitted quantities, plus a cycle price change. One selected connected Plan supplies revenue targets; departmental targets are not summed. Cost/margin require an explicit flat unit-cost assumption. Finance's
  spending budgets are labelled references, not misrepresented as sales budgets.
- Orders & Service reads current sources and shows open, today, at-risk, late and
  delivered lines, source timelines, requested Customer OTIF and Promise OTIF.
  Cumulative verified deliveries by the cutoff determine line OTIF. The existing Logistics partial-delivery command does not store actual per-line received quantities; those events are explicitly unavailable rather than treating their full allocation as delivered. Missing delivery evidence
  stays unavailable; final late delivery cannot rewrite historical success. Line, whole-order and same-currency value-weighted measures disclose their measured, pending and unavailable populations.
- Immutable consensus/scenario versions, demand/price/production/cost/receipt-delay assumptions, reconciled revenue movement bridges and model-validation detail. Scenario promotion and justified demand overrides create new consensus drafts with fresh reviews. Product/customer/project inspectors retain source links and input reasons. Forecast-lag
  MAE/WAPE/bias and baseline value add use closed requested-demand periods and retained
  versions created at least one month ahead.
- Review-stage owners/due dates/approvals, risks, actions and decisions are persisted.
  Stage approval requires `sop.approve`, current source access and the exact reviewed version. Source changes require a fresh consensus. Cycle and version selectors submit independently to avoid retaining another cycle’s version.
- Approved consensus publishes monthly total demand to Manufacturing transactionally.
  Empty source results cannot clear Manufacturing demand. Publication is idempotent; each row retains `sourceSopVersionId`. Both the Manufacturing screen action and calculation service subtract
  gross current-month bookings, including closed/part-shipped orders, from S&OP totals before adding open firm demand. Source failures stop MRP visibly.
  Older overlapping cycles cannot replace newer approved product-month demand.
  Historical closed orders remain closed even when delivery evidence is unverified.

## Security and persistence

Cycles are private or explicitly company-shared. Scenarios are private to their creator.
Every action requires an authenticated session, capability and enabled module. Queries
are tenant-scoped. Snapshots record required source capabilities/modules and recheck
linked-plan visibility when read. Generic data queries do not expose S&OP payloads or
PlanInput rows; they are read through authenticated use cases. No local business store
or business-data cache is introduced.

New entities: `PlanInput`, `SopCycle`, `SopVersion`. Additive migration:
`20261007160000_connected_plans_sop`. `BusinessPlan.revision` protects new builder edits;
`SopCycle.revision/inputRevision` protect workflow/input changes. Snapshot payloads are
immutable in both application writes and a database trigger; approval/publication change status metadata only. Publication rechecks connected Plan revisions and current project probabilities after approval.

## Remaining master-spec coverage

Weekly/mixed-grain and hierarchy editing; aggregate disaggregation and cell locks;
full historical quality annotations and lifecycle models; Holt/ETS providers; material,
machine, labour and supplier feasibility; actual costing/financial revenue budget/FX;
customer/project-specific scenario drivers and capacity simulation; live event-maintained scalable service read models; working-day OTIF policies and configurable inclusion rules; richer customer/product intelligence and volume-price-mix decomposition; notifications; structured
risk exposure/mitigations; detailed cycle participants/tasks; full-scale performance QA.
Source reads currently fail clearly above 5,000 rows instead of silently truncating
forecast input. Optional product-code scope narrows provider reads. Large-grid virtualisation, bulk snapshot access validation (comparison/accuracy still validate each retained version) and high-volume aggregation remain outstanding.

## Release target

Michael explicitly confirmed in this chat on 7 October 2026: “deploy to server
when done”. Release to `https://atlassystem.online` with the production migration,
backups, authorised organisation activation and authenticated live acceptance.
This resolves the earlier Mac/server conflict; no additional target approval is
needed. Preserve other finished releases and do not deploy concurrent unfinished work.

## Acceptance procedure

`scripts/check-sop.ts` runs explicitly on the deployed central server with
`ATLAS_SOP_LIVE_TEST=1`. It signs in normally, creates disposable `isTest`
companies, exercises Plan inputs/forecast and S&OP reviews/scenarios/publication/
MRP, checks stale writes and tenant/read-only/source-access boundaries, then
checks real pages and Chromium rendering. Its `finally` suspends those companies
and revokes temporary credentials; immutable central evidence is retained.
Production activation and acceptance results belong in `SOP_ACCEPTANCE.md`.
