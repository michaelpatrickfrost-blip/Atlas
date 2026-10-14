# Atlas Dashboards

11 October 2026. The complete [Analytics source requirements](ANALYTICS_SOURCE_REQUIREMENTS.md)
remain the long-term target; [coverage](ANALYTICS_COVERAGE.md) is not a declaration
that all 195 sections are accepted. This document describes the implemented workspace.

## Workspace and design

Published business-dashboard discovery on Home refreshes the genuine authenticated
identity and checks the server-owned customer workspace before reading Studio
metadata. The internal Atlas workspace has no customer dashboards. Staff launcher
availability does not bypass selected-company enablement, entitlement or current
Read permission: unavailable Analytics is omitted before names or definition queries.
Direct dashboard readers/writers and incompatible sealed definitions remain strict.

Dashboards at `/analytics` joins Home, Reports, My tasks, Messages and Settings in
the modern business workspace sidebar. It is removed from Home's business-app cards.
Analytics remains an entitled/enabled module with its original read/manage
capabilities; navigation relocation grants no licence or data access. The Admin
console remains separate. Reports at `/reports` owns filtered detailed Excel exports.

The pale-blue/white gallery uses a decorative canvas illustration and offers personal boards, a blank canvas and
Whole business, Commercial, Operations and People starters. Visual previews depict
chart shapes, not invented live business figures. The editor has a searchable,
app-filtered library and a widget inspector beside the canvas on desktop and above
it on smaller screens. The inspector groups Data, Design and Focus separately; record filters are disclosed when needed. View mode hides editing controls. A public
`/analytics-preview` uses synthetic curated measures without tenant reads or saves.

Up to 24 widgets support number, bars, split, columns, line, area, donut, pie, gauge,
funnel and grouped table views. Configure title, category focus, value thresholds,
sort, displayed group limit, 4/6/8/12-column width, compact/standard/tall height,
colour, white/soft-blue/midnight tone and borderless style. Reorder by desktop drag
or accessible earlier/later buttons; duplicate, remove and undo/redo 30 changes.
Number widgets and target gauges use all matching groups, not a truncated top-eight display.

Atlas blue, Botanical, Prism and After hours apply coordinated colours/card tones
in one undoable action. Balanced pairs, Hero + supporting and Compact grid arrange
existing widgets; individual sizes/styles remain editable. Themes/layouts change
only existing widget settings, with no separate appearance store. Starters use
smaller number/distribution/gauge/table cards and a dark number card; mixed-currency
pipeline starts as a table. Existing saved boards retain their chosen appearance.

Chart clicks and the values toggle explore aggregates in transient page state,
including for readers, without dirtying or saving the board. Expand opens a native
modal with chart/values/type controls and Escape/focus restoration. Exploration
stays within the saved group/value selection and resets when the source query or
period changes. The expanded table shows aggregate groups, never raw transactions.
Focus settings may save up to 50 exact category labels; no selection means all.
An optional positive gauge target is a personal visual reference in the measure's
unit, not a company Goal. Progress above 100% remains labelled above target while
the arc clamps at 100%. Filtered distinct totals still reject overlapping groups;
unfiltered gauges may use the exact server-provided distinct total. Weighted
averages/extrema retain their calculation. Line/area charts use readable axes,
gradient fills and keyboard-accessible points; dark cards use lighter chart colours.

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
Reports retains the exact values for Excel. Empty/null-only averages and extrema show no reading; group averages retain their
sample weights. Distinct KPI totals cannot add overlapping groups after value
thresholds and instruct the reader to use record filters instead. Only aggregate points and metadata
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

The original save now delegates module-owned `services/authoring.ts`: a genuine
authenticated session refreshes inside the owning Serializable transaction,
rechecks native Manage/module rights, validates the existing source catalogue and
data-view contract, and persists owner/tenant timestamp CAS plus Audit atomically.
Metadata module/catalogue readers accept an optional existing transaction; ordinary
callers retain their original defaults. No business metric/data query runs during
save validation. The shared editor accepts a complete optional server-action bundle
and internal workspace/monitor paths for selected-business authoring; default
actions/routes and chart/Goal polling remain unchanged. A supplied adapter has no
fallback into the user's native workspace. This source prerequisite does not
introduce company-shared publication or change existing personal board ownership.
Each adapter callback must authenticate its actual selected business independently;
its server route must key the editor by that business/selection when switching.

Save stores the measure period, record filters and refresh preference (manual,
15/30/60/120 seconds). Changing period retains the unsaved canvas. Failed saves
retain edits; editing is disabled during save. Undo covers canvas/settings, including the measure period; internal
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
monitor, persisted groups/target/theme, expanded values/Escape and three viewports; it deletes only its synthetic personal boards afterward.
Candidate and public deployment status is recorded in `.ai/CURRENT_STATE.md`.

The broader source brief still includes future governed relationships/calculated
expressions, fiscal calendars, exact drill-through, company/team sharing/publication,
version history, subscriptions/alerts, matrix pivots and external sources. Those
are not represented as completed by this personal-dashboard redesign.

## Explicit Studio source contracts — Phase2 prerequisite

Existing Sales and Products manifests add owner-approved metric/report descriptors
and typed query adapters. Native Analytics/Reports providers and existing registry
contracts remain unchanged. Stable provider IDs form additive `.metric`,
`.metric.read`, `.report` and `.report.read` logical IDs; labels are not identities.
Each descriptor records exact query version, owner capability/module, classification,
complete-result promise, dimensions/column semantics and conservative high query cost.
Policies are immutable; changed native metadata or reader functions fail closed.

The first family is deliberately small: Sales orders by complete status/type, Quotes
by status, Products active catalogue by kind, and original paged Sales order/Quote/
Product catalogue Reports. Original owner readers retain tenant predicates and
allowlisted projections. Query adapters refresh genuinely issued current identity,
reject changed auth/session/tenant/membership, and check current owner source grants
and enabled/entitled modules before native queries. They do not infer native access
from Studio permissions, metadata or an author's cached Session. An existing supplied
transaction is used for identity/module metadata only: original provider business
reads are unchanged, and no new atomic data snapshot is claimed.

Count dimensions accept only declared finite enum labels with nonnegative safe
integer results; unknown, duplicate, unsafe or overflow output fails rather than
being sliced. Current snapshots accept only the all period. Record reports retain
the original 100-row page and typed allowlisted filter/calendar validation, expose
only requested columns, and include currency when amounts are selected. Monetary
values retain native decimal numbers or exact large decimal text; this adapter
performs no aggregation, currency conversion or cross-currency calculation. It never
requests export mode, runs raw SQL, accepts arbitrary provider/query/tenant input, or
caches business results.

Sales customer/product/category/time dimensions and truncated 8,000-record trends,
Finance/posted money, private Service/People/CRM/Goals, Core Customer and generated
summary datasets are unavailable through these new contracts until separate precise
owning approvals. Native existing catalogues remain available under their original
permissions. This checkpoint adds source contracts only; immutable business views,
publication, customer dashboard selection and runtime compatibility enablement are
separate workstreams in the original Studio publisher and existing renderer.

## Studio business view compiler prerequisite — 12 October 2026

The additive `analytics.dashboard.view@1` descriptor is a closed metadata compiler
facet. Core accepts only the explicit schema-1 envelope with its exact registered
source reference and owner content. Original personal Dashboard records, raw native
board payloads and existing renderer/provider entry points retain their behaviour;
they are not silently converted into published business configuration.

The owner reuses the native dashboard/widget presentation schemas while removing
personal record IDs/CAS and rejecting unknown/security/result data. It currently
approves at most eight widgets from registered complete Sales order/quote and
Products catalogue count measures. Only their finite approved breakdowns/categories
are selectable; empty native category/breakdown controls retain their clear/default
meaning. Record filters and export-based report aggregation remain explicitly
unavailable in this family. Original personal data views remain available through
the native app. The eight-query, high-cost budget is recorded in the owner contract.

Compilation refreshes genuine current customer identity in the original Serializable
transaction, requires current Analytics Read and Manage and independently checks all
used source capabilities, enabled/entitled modules, support windows and immutable
source/query schemas/hashes/policies. Unused sources require no grants. Exact source
approvals are frozen before pure owner callbacks; compiled query inputs/references,
widget IDs, unused approvals and cost are checked again without executing providers.
The plan retains exact source/query dependencies and immutable per-widget query
requests; no business values, record cache, arbitrary SQL, generic query endpoint,
permission grant or second rendering/publication engine is introduced.

Pure registered source schemas live in `registry/analytics-source-contracts.ts` to
avoid importing executable providers into registry initialisation. Existing exports
and source hashes remain stable. `ReviewedCompiledDefinition` includes the compiled view type. The subsequent
publication bridge below explicitly adapts the original service; it does not
enable business GoLive or a customer reader.

Next: integrate explicit view authoring into the ORIGINAL publisher/activation with
stable owner-origin checks, real candidate/rollback reader-format readiness and
current-viewer source permission enforcement through the existing Analytics renderer.
Actual central/SQL/browser/public verification remains mandatory before GoLive.

## Original business view publication bridge — 12 October 2026

Explicit schema-1 owner view envelopes now use the original Studio create/save/
review/publish/activate services. Fresh current Studio Edit/Publish, Analytics
Read/Manage and every independent used source/module approval are checked in the
existing Serializable transaction. Raw personal boards and unsupported old view
payloads do not acquire a fallback compiler. The original CAS, paired Audit,
immutable definition/version/dependency storage and personal Analytics paths stay.
A draft and all published versions retain their original stable owning source ID;
changing the owning family creates another definition.

Standalone view pins use the same private tenant/definition/version/schema/hash/
payload/configuration-edge seal body as existing Page/profile references. View
is not added to the profile configuration-reference enum. Activation independently
checks the persisted payload/plan mirror, including omitted-default normalization.
Original activeDefinition refreshes genuine Studio Read and reconstructs the exact
metadata without borrowing native Read/Manage or executing a provider. Current
module availability, contract support, owner opt-in and exact source/query policy
still apply. Metadata visibility never grants business query access.

The new analyticsBusinessViews.v1 release feature fences BOTH publication and
activation. The actual runtime evaluator deliberately does NOT advertise this
feature during the metadata bridge. Existing active/retained version scanning
rejects unsupported reader downgrades, with the original suspended Test policy.
Only the later actual customer reader/renderer and semantic current/rollback
probes can enable it. Source compilation and mocked publication checks are not
SQL, runtime, browser, customer GoLive or full Phase2 acceptance evidence.

No Prisma/schema/migration change is proposed: inspected original tables accept
TEXT kinds and schema1 compiled plans; dependency guards accept the exact sealed
registry edges and an empty configuration edge set. Actual central guarded
publication/activation/rollback acceptance remains pending, owned by the original
release driver. Next stage reuses the native Analytics widget renderer and exact
registered queries under actual viewer source rights; it adds no result cache.

Retained Page activation now reconstructs the exact originally sealed owning Page
source and complete checksum under current used grants. An additive owner source
does not silently migrate a retained layout. New Ticket panel source @2 additionally
requires ticketRecordPanels.v1 evidence from both actual runtime registries and the
existing pure native panel renderer; retained @1 needs only structuredPages.v1.
Until that pair is accepted, internal new authoring uses the independently approved
@1 source. No caller-supplied source choice or privilege is added.

## Registered business viewer and native chart reuse — 12 October 2026

Core authoring/view helpers now refresh actual selected-business authority in the
existing Serializable transaction, then call the original compiler/publisher/
activation and paired Audit. Optional metadata rename uses definition CAS alongside
draft CAS; publish+activation commits together. Friendly module inputs contain native
dashboard settings and Studio revision IDs only, never client tenant/source approvals
or result data. Actual draft.updatedAt is display metadata; revision controls saves.
Browser-safe content contracts import only original pure native definitions.

The customer reader selects the actual tenant active pointer, reconstructs the exact
sealed owner plan, and preflights every used source/query capability/module/support
window before the FIRST provider. Customers need native Analytics/source Read, with
no Studio or Manage grant. Expected-head values are stale assertions, not selection.
Only three approved finite complete count sources run through original registered
adapters. Their original genuine-principal refresh and business reads remain; this
is not a cross-provider snapshot. Discovery shares the exact metadata preflight
without provider reads, omits denied source views before names and fails on corruption
or more than 100 candidates. No business result persists or falls back to native
personal dashboards/Reports/Goals.

BusinessViewCharts is a thin supplied-results wrapper around original TileChart,
presentation schemas and responsive stylesheet. The actual runtime evaluator now
requires real customer reader exports, strict owner compilation and blocked forged
authority before transaction access, then SSR of the actual native chart with zero
and escaped labels. A probe-only restored CSS token loader reads the actual stylesheet;
production build/browser gates separately prove layout. Both actual accepted runtime
readers must support analyticsBusinessViews.v1 before publication or activation can
open. A predecessor metadata bridge stays unsupported. Original driver must still
prove SQL/CAS/Audit rollback, customer/browser/current permissions and public GoLive.

Trusted exact retained View pins also have distinct metadata/read entries, with the
same genuine current grants/seal reconstruction and no active-pointer substitution.
Metadata inspection returns full exact plan, queryCount and cost computed from each
approved query descriptor using original Page weights low1/medium3/high8, without
provider reads. This is the cost an enclosing Page must charge. The existing View@1
private budget/checksum remains unchanged; its original units are not substituted
for the enclosing Page budget. Page embedding schema/edges/rendering remain another
workstream, not implied by the standalone pin reader.


## 12 October immutable dashboards on Studio pages

Opt-in Page owners may embed an exact sealed company View version. Core reconstructs
its immutable dependency graph and preflights all current used native permissions;
combined cost/query bounds are reserved before visible nested View reads. Historical
Page contracts without opt-in retain their seals. Module-owned pure chart display
uses the same original Analytics renderer; Core imports no Analytics module service.
The palette exposes only authorised published choices. Source is implemented;
forward View-edge CHECK and compatible actual Page/default/customer gates pending.

## Business draft feedback and native measure references — 12 October 2026

The standalone business dashboard adapter continuously checks its strict shared
content schema, then uses the original module-owned View compiler under freshly
selected authority. Metadata-only inspection does not run measure providers,
save validation, write Audit, publish or alter native records. Current saved and
local designs are separately compiled with the actual saved owner envelope;
old/future/foreign identities or revoked source rights fail before labels.

Compare saved draft displays inert native chart illustrations, plain setting
changes and explicit Back, Keep my changes against this saved draft, and Use
saved draft choices. Keep changes only the locally observed draft/definition
head; Use deliberately loads current saved content. Both invalidate previous
publication review and preserve original CAS for later saves. No automatic
merge/save/publish happens. Original expected-error feedback is returned explicitly
so production error redaction does not conceal a stale-save/current-access notice.

Authorised registered measure choices provide Go to source and Where used through
an explicit View-source metadata reference branch. It shares the original exact
registry source/query/current-hash/module/capability guards and persisted native
reverse index (25 per page, maximum 500 saved versions with stable scoped cursor).
No native query/provider/action runs. Page-source reference URL and grant semantics
remain unchanged. Original personal Dashboard persistence, chart data refresh,
query adapters and publication/renderer engines stay the same. Focused source/DOM
checks do not establish candidate/public acceptance; the original fixture now
adds current checks and all three choices with unchanged metadata/Audit/native
snapshots for its actual execution gate.
