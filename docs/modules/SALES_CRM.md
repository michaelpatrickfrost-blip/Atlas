> CRM now lives in `src/modules/crm/`. Sales owns commercial transactions; see [Sales delivery map](SALES_ORDER_PROCESSING.md). The new [CRM specification](CRM_FUNCTIONAL_SPEC.md) supersedes this historical scope.

# CRM (historical foundation notes)

Atlas's Sales module. Covers the full Prospect → Opportunity → Customer
journey: prospecting, configurable pipelines, a work-prioritisation engine
(Today), forecasting, and a lean standard report pack. Built as a module
(`src/modules/sales/`), not Core — it depends on Customer Master (`Party`)
but Atlas keeps working with Sales disabled.

## Domain entities

| Entity | Purpose |
|---|---|
| `Prospect` | Someone/some org we may want to sell to — deliberately distinct from `Opportunity` and from the canonical `Customer` (`Party`). See **Prospect/Customer boundary** below. |
| `Pipeline` / `PipelineStage` | A configurable sales process. Businesses may run several (`isDefault` marks the one used when none is specified). Won/Lost are `Opportunity.status` values, not stages (§39). |
| `Opportunity` | A genuine potential sale. References `Party` (always), optionally `Prospect` (if converted from one), `Pipeline`/`PipelineStage`, `SalesTeam`, a primary `Contact`. |
| `OpportunityStakeholder` | The buying committee — a `Contact` + one or more `OpportunityStakeholderRole`s on one opportunity. |
| `OpportunityMilestone` | A lightweight Deal Plan (§46) — ordered, optional. |
| `OpportunityChangeEvent` | Stage/value/close-date/owner/forecast-category history, written at the moment of change (§50) — never reconstructed later. Powers stage age and close-date slippage. |
| `LossReason` | Org-scoped reference table for lost-opportunity reasons. |
| `SalesActivity` | The working record for prospecting/opportunity activity (calls, emails, tasks, ...) — distinct from the shared Atlas `Activity` feed (see below). |
| `SalesTeam` / `SalesTeamMember` | Lightweight team grouping; `managerUserId` + members. |

## Prospect/Customer boundary

A prospect is **not** a customer. It can exist with nothing more than a
company name and may never become one. It carries its own identity fields
(`companyName`, `contactFirstName`/`contactSurname`, `email`, ...) rather
than referencing a `Contact` — because a prospect usually predates having
enough information to justify a canonical record at all.

`Prospect.partyId` is nullable and is only ever set two ways: the business
links an existing customer to a prospect, or `convertProspect` creates a new
`Party` at conversion time. **Converting never creates a parallel history** —
the prospect's source/attribution/activities/scoring stay on the `Prospect`
row (linked via `Opportunity.prospectId`), not copied and forked (§25).
Duplicate protection on prospect creation reuses Customer Master's own
`findPossibleDuplicates` (`src/core/customers/duplicate-detection.ts`) rather
than inventing a second matching algorithm.

## Pipeline model

`Pipeline` + `PipelineStage` replace what was previously a hardcoded
`OpportunityStage` enum. Each stage carries `order`, `defaultProbability`,
`typicalDurationDays` (used by stage-age detection) and optional `guidance`.
Moving an opportunity to a stage (`moveOpportunityStage` in
`src/modules/sales/services/opportunities.ts`) resets `stageEnteredAt`,
applies the stage's `defaultProbability`, and writes an
`OpportunityChangeEvent` — this is the only path that should ever change
`stageId`.

## Work prioritisation (Today)

`src/modules/sales/services/work-queue.ts` builds Today's queue from
explicit, inspectable rules — overdue/due-today `SalesActivity` rows, and
per-open-opportunity checks (no next action, next action overdue, unusually
long in stage, close date passed). `computeOpportunityReasons` is the pure
rule function (no DB access), unit tested in
`tests/sales-work-queue.test.ts`. **Every item states why it's there** — there
is no opaque scoring model (§7).

## Module extension points

Sales contributes to Core through the same typed-provider pattern every
module uses — it implements the provider, Core calls it, Core never knows
Sales exists as a concept:

- **`customerOverviewProvider`** (`services/customer-overview.ts`) — 12-month
  sales, open pipeline value, open quotes/orders, and an optional
  `creditExposure` figure (confirmed-but-unbilled orders — an honest proxy
  until a Finance module exists to supply a real receivables number; see
  `docs/CUSTOMER_MASTER.md` §Credit). Rendered on the customer record's
  Overview tab and its header actions.
- **`attentionProvider`** (`services/attention.ts`) — opportunities with no
  next action, new unworked prospects, quotes awaiting response.
- **`searchProvider`** (`services/search.ts`) — prospects, opportunities,
  quotes/orders by reference. Customer search itself lives in Customer
  Master, not here.

## Activity: two layers, on purpose

`SalesActivity` is the seller's working record — things to do, things done,
owned, due, completable. The shared `Activity` model (`src/core/activity/`)
is a read-only rendered timeline for Home and the customer record. Completing
a significant `SalesActivity` (winning/losing an opportunity, sending a
quote) writes a shared `Activity` row via `writeActivity()`, carrying
`partyId` so it shows on the right customer. The two are related, not
merged — exactly the same split the brief asks for between "ordinary
Activity" and audit (§92), applied here to sales-specific work items.

## Forecast

`src/app/(app)/sales/forecast/page.tsx` rolls up open opportunities by
`ForecastCategory` (`PIPELINE`/`BEST_CASE`/`COMMIT`/`CLOSED`/`OMITTED` —
independent of pipeline stage, per §58) and shows a stage-weighted total
alongside it. Every number drills down into the opportunities behind it on
the same page (§81). **Deferred**: forecast snapshots (no
point-in-time capture exists, so forecast accuracy over time can't be
reported yet), manager-vs-rep forecast variance, hierarchy roll-up by
team/territory, and Goals/Quotas (no `Goal` model exists — there is nothing
to show a "target" against, so the page honestly omits one rather than
faking it).

## Reports

`src/app/(app)/sales/reports/page.tsx` ships four of the ~30 reports listed
in the brief's standard pack: funnel (prospect → qualified → won), pipeline
by stage, win/loss rate, loss reasons. These use `groupBy` aggregates over
`Prospect`/`Opportunity` — the same primitives a future report builder would
use, not bespoke one-off queries, so extending the pack is additive. No
custom report builder exists yet.

## Events

See `DOMAIN_EVENTS` in `src/core/events/bus.ts`:
`sales.prospect.{created,assigned,qualified,disqualified,nurtured,converted}`,
`sales.opportunity.{created,stage_changed,value_changed,close_date_changed,won,lost}`,
`sales.activity.completed`.

## Permissions

`SALES_CAPABILITIES` (`src/core/permissions/capabilities.ts`) separates
prospect/opportunity/pipeline/activity/forecast/report capabilities —
`sales_user` can work prospects and opportunities but not manage the pipeline
or forecast; `sales_manager` can. Server-side only, as with every Atlas
capability (see `docs/PERMISSIONS.md`) — never UI filtering alone. "Own vs
team vs territory vs all" visibility (§93) is **not** implemented — every
capability currently grants organisation-wide visibility within the
capability's scope; a `SalesTeam`/territory-aware query filter is the natural
next addition and the schema (`Opportunity.teamId`, `territory`) is already
shaped for it.

## Multi-company

Not implemented. Every Sales row carries `organisationId` (today's one
tenant boundary) but nothing models per-legal-entity pipelines/ownership —
same deferral as Customer Master (`docs/CUSTOMER_MASTER.md` §Multi-company).

## What's deliberately deferred

Per the brief's own scope control (§131) and build-order phasing (§130),
this slice covers Phase 1–2 (domain + core working experience) plus light
Phase 3/4 (next-action, stage history, forecast categories, pipeline
inspection via drill-down). Not built, and not pretended at:

- **Sequences, playbooks, qualification frameworks (BANT/MEDDICC/SPICED)** —
  no sequence engine, no guided-selling forms. `Opportunity.qualificationNotes`
  (JSON) exists as the honest placeholder for structured playbook output.
- **Email/calendar/telephony integration** — no `MailProvider`/
  `CalendarProvider`/`TelephonyProvider` interfaces built yet; `SalesActivity`
  is where their output would land.
- **Prospect data/enrichment providers** — no ICP model, no enrichment
  provider interface.
- **Forecast snapshots, Goals/Quotas, Territories as a first-class entity**
  — see Forecast section above.
- **Custom report builder, saved views, bulk operations, CSV import** — the
  report pack above is fixed, not user-composable.
- **AI architecture** — no summarisation/drafting/coaching surfaces.
- **Multi-company**, **own/team/territory visibility filtering** — see
  Permissions/Multi-company above.
- **Drag-and-drop pipeline** — stage moves use a stage-select control, not a
  DnD library (see `src/app/(app)/sales/pipeline/move-stage-select.tsx`).

## Testing

`tests/sales-crm-permissions.test.ts` (capability separation, standard-role
grants, event registry) and `tests/sales-work-queue.test.ts` (the Today
prioritisation rules) — see also `tests/customer-*.test.ts` for the
duplicate-detection logic Sales' prospect creation reuses. Tenant isolation,
stage-history writes and conversion correctness were verified end-to-end
in-browser against a real local Postgres (login → Today → Prospect →
convert → Opportunity → Customer 360), not re-asserted as integration tests
in this slice.

## CRM commercial workspace — 9 October 2026

Today now leads into Appointments, Accounts, Pipeline and Prospects. The pipeline
adds search and a missing-next-action filter. CRM Accounts uses canonical customer
contacts and shared notes, with links back to Customer Master and its selected
hierarchy. Opportunities and upcoming appointments retain CRM owner restrictions;
restricted notes require their own read capability.

Appointments is a weekly agenda/diary for meetings, calls, demos, site visits and
follow-ups. It supports an active salesperson, account/prospect and optional deal,
start/end in London time, location/link, preparation, reschedule, completion outcome
and retained cancellation. Additive SalesActivity fields provide duration, location,
cancellation, optimistic version and per-tenant unique request key. Commands check
CRM availability, activity capability, owner scope, all linked records and time
overlaps inside a serializable transaction, with audit/customer activity. No external
calendar sync or invitation delivery is claimed. See
[research and acceptance](../plans/COMMERCIAL_WORKSPACE_RESEARCH.md).
