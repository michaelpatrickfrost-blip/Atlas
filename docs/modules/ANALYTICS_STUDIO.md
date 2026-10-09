# Atlas Dashboards

9 October 2026. The complete [Analytics source requirements](ANALYTICS_SOURCE_REQUIREMENTS.md)
remain the long-term target; [coverage](ANALYTICS_COVERAGE.md) is not a declaration
that all 195 sections are accepted. This document describes the implemented workspace.

## Workspace and design

Dashboards at `/analytics` joins Home, Reports, My tasks, Messages and Settings in
the modern business workspace sidebar. It is removed from Home's business-app cards.
Analytics remains an entitled/enabled module with its original read/manage
capabilities; navigation relocation grants no licence or data access. The Admin
console remains separate. Reports at `/reports` owns filtered detailed Excel exports.

The logo-based pale-blue/white gallery offers personal boards, a blank canvas and
Whole business, Commercial, Operations and People starters. Visual previews depict
chart shapes, not invented live business figures. The editor has a searchable,
app-filtered library and a widget inspector beside the canvas on desktop and above
it on smaller screens. View mode hides editing controls. A public
`/analytics-preview` uses synthetic curated measures without tenant reads or saves.

Up to 24 widgets support number, bars, split, columns, line, area, donut, pie, gauge,
funnel and grouped table views. Configure title, category focus, value thresholds,
sort, displayed group limit, 4/6/8/12-column width, compact/standard/tall height,
colour, white/soft-blue/midnight tone and borderless style. Reorder by desktop drag
or accessible earlier/later buttons; duplicate, remove and undo/redo 30 changes.
Number widgets use all matching groups, not a truncated top-eight display.

## Flexible data

Curated source-owned measures remain supported, with their definitions, grain,
period/snapshot behavior, permitted breakdowns and connected goal markers. No
module-owned metric definition is rewritten by chart settings.

Record widgets use the existing authorised Reports catalogue: Customers, Products,
Sales orders/quotations, Inventory balances/movements, Logistics shipments/fulfilment,
Manufacturing orders/work centres/resources and Finance documents/accounts/ledger.
There are 14 initial record datasets; actual visibility depends on the reader.
Choose any exposed grouping field, day/month/year date grouping, count records,
count distinct values or a numeric total/average/minimum/maximum. Add up to 12
source-supported typed field filters, search and date ranges. The widget inspector
only offers numeric fields for numeric calculations.

Board record search/from/to are defaults for supporting datasets; widget values
override them. Snapshot datasets without a date field ignore board dates, and
sources without search fields ignore board search. This is explicit in the UI.
Curated measures use the separately saved rolling 30/90/365-day/all-time period;
current snapshots remain current. These are not canonical multi-source customer,
site or fiscal-calendar filters. Category focus operates on authorised aggregate
points, not a cross-source join or record update.

Source providers retain tenant, licence, capability, ownership/private work and
Finance document/journal scope. Query fields/operators are allowlisted. Server
aggregation reads **all** matching records, up to 10,000, and fails with a narrowing
instruction rather than aggregating a truncated page. Monetary calculations require
one filterable currency and reject mixed results; no currency conversion occurs.
Exact high-precision text that cannot safely become a chart number is rejected;
Reports retains the exact values for Excel. Only aggregate points and metadata
reach the browser, not underlying raw rows. Four record queries run concurrently
at most. Source failures are isolated per widget. Query edits are briefly debounced
and stale responses are discarded. No arbitrary SQL, formula execution or joins.

## Personal persistence and monitor

Existing central Dashboard rows and `Analytics · ` namespacing are preserved.
Validated JSON definitions contain settings and widget queries, never business
records/results. Legacy boards/settings remain readable. Saves retain selected ID,
rename that same owner/tenant board and check expected `updatedAt` atomically;
a stale/foreign row cannot fall back to creating or overwriting another board.
New boards/copies use unique-name creation. No sharing grants are introduced.

Save stores the measure period, record filters and refresh preference (manual,
15/30/60/120 seconds). Changing period retains the unsaved canvas. Failed saves
retain edits; editing is disabled during save. Undo covers canvas/settings; internal
board navigation asks before discarding edits and browser unload warns. Unsaved
work is in page memory only and does not survive reload. No automatic persistent
local cache or local business database is created.

`/board` resolves each widget's stored data query or curated breakdown independently,
with the same permissions and filters. Manual refresh remains manual; timed refresh
pauses when the document is hidden. Save before opening monitor mode. Reports links
select the widget's dataset, while Reports applies its own filters and authorisation;
the link does not promise an exact transaction drill-through.

## Verification and remaining scope

Focused query, persistence, UI, catalogue/private-project, CRM, Reports, Messages
and Admin regressions, TypeScript, lint and production build are required. The
opt-in `scripts/check-dashboards.ts` exercises central Guardian QA personal board
creation/rename/reload, record configuration/currency guard, duplicate/undo/redo,
monitor and three viewports; it deletes only its synthetic personal boards afterward.
Candidate and public deployment status is recorded in `.ai/CURRENT_STATE.md`.

The broader source brief still includes future governed relationships/calculated
expressions, fiscal calendars, exact drill-through, company/team sharing/publication,
version history, subscriptions/alerts, matrix pivots and external sources. Those
are not represented as completed by this personal-dashboard redesign.
