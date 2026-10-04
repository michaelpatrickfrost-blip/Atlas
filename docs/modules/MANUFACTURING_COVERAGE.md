# Manufacturing section coverage — 3 October 2026

Tracks the 173 numbered sections of the current brief
([source](MANUFACTURING_SOURCE_REQUIREMENTS.md)) against delivery phase and
status. This replaces the previous 143-section coverage map built against the
superseded brief — see Git history for that version. Every row not marked
"Delivered" remains open target scope, not completed functionality.

Ownership split (unchanged target, restated against the new numbering):
Products/engineering owns BOM & routing definition (§9–20); Manufacturing owns
capacity resources and execution (§21–27, §57–127); Stock owns inventory truth
(§61–64, §78–83, §113); Logistics owns physical staging/put-away (§61, §83,
§111); Purchasing owns commercial supply (§40, §91–94, §112); Quality/
Maintenance extend at defined points (§95–99); Finance owns ledger/WIP
valuation (§107–108); Sales/CRM own demand and projection (§109–110).

| Sections | Topic | Phase | Status |
| --- | --- | --- | --- |
| 1–8 | Role, product goal, primary workflow, pegging concept, domain ownership, navigation | 0 (framing) | Delivered as this document + source/coverage docs |
| 9–16 | Product manufacturing profile, BOM, BOM line, multi-level BOM, BOM versions/change control, alternate BOM, substitution | 1 | Partially delivered — `ProductDefinition`/`ProductBomLine` (version, status, lines) already exist on Product; alternate BOM, substitute groups, change-control workflow states are open |
| 17–20 | Routings, routing versioning, operation, operation dependencies | 1 | Partially delivered — `ProductOperation` now carries a real FK (`workCentreId`/`resourceId`) to the specific machine a step runs on, not just a free-text name (built by a concurrent session's Plant tool at `/manufacturing/plant`, with a name-match fallback in `src/modules/manufacturing/domain/plant.ts::releasedAssignment` for older routings); `releaseOrder` resolves and copies this onto each Work Order. Routing-level versioning/effectivity separate from BOM version, and operation dependencies/overlap, are open |
| 21–27 | Work centres, resources, resource capability, alternate resources, production calendar, capacity, resource efficiency | 1 | Substantially delivered — Plant (`/manufacturing/plant`) manages work centres and machines; `ManufacturingShift` (migration `20261003750000_manufacturing_shifts_and_forecast`) is a real, planner-editable weekly man-hours calendar per work centre or specific machine (days, hours, crew headcount) via `/manufacturing/schedule`'s Shifts &amp; man-hours section — `capacityByWorkCentre()` uses it for real labour-hours-vs-available when shifts exist, falling back to a naive 40h/week estimate only when they don't (verified against real shift rows). Capability matching and alternate-resource selection rules are open |
| 28 | Bottlenecks | 4 | Partially delivered — `capacityByWorkCentre()` shows scheduled-vs-naive-capacity overload hours per centre on the Schedule page; does not yet identify *which* orders cause the overload |
| 29–43 | Planning vs scheduling, MPS, MPS UX, planning periods, forecast, MRP, MRP output, action messages, pegging, planning exceptions, customer impact, supply suggestions, firming, time fences, what-if planning | 2–3 | Substantially delivered — `runMrp()` computes net requirement from confirmed Sales demand **plus** forecast demand, minus Stock availability, minus open Manufacturing Order supply, for manufactured products; persists an identified `ManufacturingPlanningRun` + `ManufacturingSupplySuggestion` rows with pegging (now distinguishing `SALES_ORDER` vs `FORECAST` peg lines); `firmSuggestion()` turns one into a real `ManufacturingOrder`. Forecast itself is `ManufacturingDemandForecast` — a plain planner-entered monthly quantity per product, editable on `/manufacturing/plan`, standing in for §33's statistical/commercial forecast split since CRM Opportunities carry deal value, not product/quantity lines, so there is nothing upstream yet to consume automatically. Each suggestion also carries `startBy` — the needed-by date minus the product's actual manufacturing lead time, computed from its live routing at the suggested quantity (`totalLeadTimeMinutes`, verified against real routing data) — surfaced on the Plan page and flagged when already overdue to start. Open: the MPS period grid UI, Buy/Transfer suggestion hand-off to Purchasing/Logistics, time fences, what-if scenarios, the full exception taxonomy beyond simple shortage |
| 44–56 | Scheduling (forward/backward/finite capacity/finite material), Gantt, drag-and-drop, auto-reschedule, lock, priority, setup optimisation | 4 | Substantially delivered — `src/modules/manufacturing/services/scheduler.ts` is a real planner's tool at `/manufacturing/schedule`: a drag-and-drop Gantt (one row per resource, 14-day window, native HTML5 DnD, no new dependency), finite-capacity conflict detection (`findConflicts`) with a suggested next-feasible slot (`nextFeasibleSlot`, §47-48), cascading reschedule of dependent later operations in the same routing (`cascadeFrom`, §52's "1 dependent operation moves"), a preview-before-commit dialog showing conflicts/cascade/customer-delivery impact (§52), a hard refusal to silently overbook unless the planner explicitly forces it (§47), and a schedule lock (§54, `ManufacturingWorkOrder.locked`, migration `20261003720000_manufacturing_work_order_lock`). Gated behind `manufacturing.schedule.manage`/`.lock` — the `shop_floor_operator` role has neither, so operators never see the planning tool, only its published result (§152's "only certain people" requirement). Verified against real Postgres: conflict detection, next-feasible-slot, and the full reschedule+cascade transaction. Open: backward scheduling, true resource calendars (the naive 40h/week capacity stand-in), setup-family optimisation, drag precision finer than whole days |
| 57–60 | Production Order definition, lifecycle, ready check | 1 | Delivered — `ManufacturingOrder` with the six-state visible lifecycle (`PLANNED/READY/RELEASED/RUNNING/COMPLETE/CLOSED`), guarded transitions, and a minimal ready check (BOM snapshot + quantity present); material/capacity/document/tooling readiness are open |
| 61–65 | Material staging, reservation, issue methods, actual consumption, over/under consumption | 3 | Open — MRP reads Stock *availability* through the shared `StockProvider` contract (§113), but nothing reserves or consumes material yet; `ManufacturingOrder` carries a `definitionId` snapshot only |
| 66–68 | Work Orders, Work Order fields, status | 1 | Delivered — `ManufacturingWorkOrder` with the six-state status, scheduled/actual times, produced/scrap quantities, optimistic `version` lock and idempotency key; now actually generated by `releaseOrder` from the routing snapshot (previously a gap — released orders had no Work Orders at all) |
| 69–77 | Shop Floor UX, start/pause/complete, partial completion, backorder, split, merge | 5 | Partially delivered — a real large/touch-friendly `/manufacturing/shop-floor` page (Now/Next/Blocked) drives the idempotent `startWorkOrder`/`pauseWorkOrder` (with reason)/`completeWorkOrder` (good+scrap, partial-completion-safe) commands end-to-end-verified against Postgres. Open: backorder/split/merge, documents, scanning |
| 78–83 | Lot/serial traceability, genealogy, finished output, report-as-finished, put-away | 6–7 | Open |
| 84–90 | Scrap, scrap reasons, yield, rework, by-products, co-products, process manufacturing | 5–6 | Partially delivered — `scrapQuantity` is captured on completion and audited; reasons, yield reporting, rework, by/co-products are open |
| 91–94 | Subcontracting (order, components, cost) | 7 | Open |
| 95–99 | Quality integration, quality check, quality hold, maintenance integration, breakdown | 7 | Open |
| 100–102 | People/skills, labour, tooling | 7 | Open |
| 103–108 | Costing (planned/actual/variance), Finance integration, WIP | 8 | Open |
| 109–117 | Sales/CRM/Logistics/Purchasing/Stock integration, production availability, shortage resolution, customer promise (CTP) | 7 (integrations), 8 (CTP) | Open |
| 118–127 | Produce workspace, order list/UI, shop-floor documents, barcode, real-time progress, delay detection, rescheduling impact, schedule alerts, MPS vs execution | 1 (minimal), 4–5 (rest) | Partially delivered — a Produce list and single Production Order view exist (§118–120); real-time progress updates via `revalidatePath` after each shop-floor action. Documents, scanning, delay detection, rescheduling impact, alerts are open |
| 128–143 | Reporting suite (performance, capacity, OEE, downtime, yield, variance, cost, adherence, throughput, WIP, customer risk, MRP performance, subcontracting, traceability, saved views) | 8 | Partially delivered — `/manufacturing/reports` has §139 Customer Orders at Risk (named in the brief as a signature report) joining production progress to the pegged sales order/customer; §130 capacity-vs-load also exists on the Schedule page. The other dozen+ reports (OEE, downtime, yield, variance, cost, adherence, throughput, WIP, MRP performance, subcontracting, traceability, saved views) are open |
| 144–147 | Attention provider, activity provider, commands, events | 9 | Partially delivered — a minimal attention provider (overdue/blocked orders) and search provider are registered; activity writes exist on order/work-order transitions; the command palette and the full `manufacturing.*` event list are open |
| 148–150 | Provider interfaces, idempotency, concurrency | 9 | Partially delivered — optimistic `version` locks and `requestKey`/`lastRequestKey` idempotency exist on both order tables; the cross-module provider contracts (Stock/Purchasing/Logistics/Quality/Maintenance/People/Finance/AdvancedScheduler) are not yet defined |
| 151–154 | Permissions, shop-floor permissions, audit, reversals | 1 (permissions), 9 (rest) | Partially delivered — `MANUFACTURING_CAPABILITIES` and the `manufacturing_planner`/`shop_floor_operator` roles exist; audit entries are written on create/release/scrap; controlled reversal workflows are open |
| 155–158 | Performance, planning run identity, explainability, AI | 2–4, 9 | Open |
| 159–162 | Visual design, planning colour, mobile/tablet, demo data | 9 | Open — current UI reuses Atlas's existing design tokens/components but has not had a dedicated design pass; no manufacturing demo data seeded |
| 163–166 | Critical planning/scheduling/execution/cross-module tests | 9 | Open — no automated tests written for this module yet beyond the production build/typecheck/lint gate |
| 167 | Visual review | 9 | Open |
| 168 | Documentation (`docs/modules/MANUFACTURING.md`) | 9 | Open — this coverage doc and `MANUFACTURING_PLANNING.md` exist; the consolidated `MANUFACTURING.md` described by §168 has not been written yet |
| 169–173 | Build order, scope control, definition of done, final experience test, final response format | — | Process guidance, not a deliverable row |

## What exists in the database today

`ManufacturingCounter`, `ManufacturingWorkCentre`, `ManufacturingResource`,
`ManufacturingOrder`, `ManufacturingWorkOrder` (migration
`20261003670000_manufacturing_phase1_foundation`, written by hand against the
schema — **not yet applied** to the local dev database; see the blocker below).
`ProductDefinition`/`ProductBomLine`/`ProductOperation` on Product predate this
task and already cover part of §9–20.

## Blocker inherited from a previous session (not introduced by this task)

`prisma migrate dev` cannot run — `migrate dev`'s shadow-database replay fails
earlier in migration history (`20261003155019_add_hr_module` references
`domain_outbox`, which a still-earlier migration apparently fails to create in
the shadow DB). This was already flagged in CURRENT_STATE.md after the HR
module build and is unresolved. The manufacturing migration SQL was therefore
written by hand and is ready to apply with `prisma migrate deploy` once that
ordering issue is fixed — it was validated with `prisma validate`/`prisma
generate` and the full `npm run build`, `npx tsc --noEmit`, `npx eslint`, and
`npm test` gates, all against the generated client rather than a live table.

## Next steps, in build order

1. Fix the inherited migration-ordering blocker, then `prisma migrate deploy`
   (or `migrate resolve` + `migrate dev`) to apply
   `20261003670000_manufacturing_phase1_foundation`, then re-verify with a real
   create/read round-trip against Postgres (the HR module's precedent for this
   kind of check).
2. Finish Phase 1: routing versioning/effectivity separate from BOM version,
   resource capability matching, alternate resources, a real production
   calendar.
3. Phase 2: MPS/MRP engine, pegging, planning action messages, exceptions,
   customer-impact view — the single biggest remaining capability gap.
4. Phase 3: Stock integration contracts (reservation, consumption, backflush).
5. Phases 4–9 follow the brief's build order (§169).
