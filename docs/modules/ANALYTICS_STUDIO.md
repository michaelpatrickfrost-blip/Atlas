# Atlas Analytics Studio

3 October 2026. Full target: [user brief](ANALYTICS_SOURCE_REQUIREMENTS.md), with [section coverage](ANALYTICS_COVERAGE.md).

## Dashboards — 3 October 2026

Dashboards (`/analytics`, app name Dashboards) open on a gallery. **New dashboard** and four starters (Whole business, Commercial, Operations, People) are on that page. A board mixes any authorised measure from enabled apps: Customers, CRM, Sales, Finance, HR, Scheduling, Inventory, Logistics, Customer Service, Marketing, Projects, Products, Pricing, Planning and Goals. CRM’s Dashboards item opens this gallery when the profile can read Analytics.

On a board, dropdowns sit on the chart. One chooses the measure, one chooses how to split it when that measure has views, and one chooses the chart. Orders can be shown by status, order type, product, category, customer or time. Product and category count lines. Arrange adds width, colour, title, focus and drag order. The same choices are in the add bar above the board. They are saved with the private board.

Live view re-queries the server on a chosen interval (off, 15s, 30s, 60s, 2m). Figures stay in the page for display and are not written to a local database. **On a monitor** opens `/board` in its own window, without the app sidebar, with a fill-screen control and a switcher that can open another board in another window. Refresh preference is stored with the private board definition.

Saving still uses the existing Dashboard rows, namespaced `Analytics · `, plus one settings entry for the refresh interval. Same-name save updates that user’s board. Delete removes only that user’s namespaced board.

## Delivered foundation

Analytics (`analytics`, `/analytics`) is registered as an available app with explicit read/manage capabilities. Dashboard Studio has a gallery, templates, and dropdowns for the app, measure, breakdown and chart. Visuals are number, bars, split, columns, line, area, donut, pie, gauge, funnel and table. Up to 24 tiles. HTML drag ordering works while arranging. Preview uses sample figures; live boards save privately on the server.

Core owns the typed analytics contribution and catalogue (`src/core/analytics/`); modules declare `analyticsProvider` in their manifest. Analytics never imports another module's services. Only enabled source modules and authorised metrics enter the catalogue. Providers perform tenant-scoped aggregates without joins or raw SQL. Definitions expose grain and time scope. Measures cover Customer Master, CRM, Sales, Finance, HR, Scheduling, Inventory, Logistics, Customer Service, Marketing, Projects, Products, Pricing, KPIs and Planning, including trends. Orders can be regrouped by status, type, product, category, customer or time from the Show by dropdown. These are counts, not recognised revenue, margin or valuation. Pipeline value stays split by currency. HR review content, salaries, health and personal fields are excluded. A company or department goal that names a catalogue measure is drawn under that chart. The chart keeps its own period; the pace line uses the goal dates. Personal goals and performance plans are never drawn on a shared dashboard. Future modules contribute through the same contract; automatic access to every field is not implemented.

Period filters use rolling 30/90/365 days or all time for dated metrics. Snapshot metrics explicitly ignore the period. Fiscal calendars and canonical multi-source dimension filters remain open. One source failure is isolated through Promise.allSettled, but initial page rendering still waits for all sources; per-widget streaming/timeout/priority loading remains open. Source workspace links are delivered; exact filtered record drill-through is not.

Private definitions use the existing server Dashboard model, namespaced `Analytics · `, with validated JSON widget entries in its string array. No schema migration required. Same-name saving updates only the current user's own definition. No shared/published object is created or overwritten. Definitions never contain business records or query results. No localStorage, persistent local cache, local database, export download or credential change is introduced.

## Activation and verification boundaries

An existing organisation needs Analytics entitlement/enabled ModuleState and the analytics capabilities granted through existing administration. Standard role definitions now declare grants for newly provisioned roles; existing roles are not silently updated. Source module entitlement/capabilities are also required. Data-action registry regenerated to include saving. No remote deployment, provisioning, permission grant or installed Mac package update performed. A public sample-only `/analytics-preview` uses the same Studio component without tenant reads or saving; the Analytics card offers a generic manifest-defined preview link.

## Next delivery phases

1. Prove end-to-end saves and live-data visual acceptance in a provisioned development tenant. Extend curated measures/dimensions for CRM, customer/product performance, HR and Inventory; include currency-safe commercial totals and exact authorised drill-through.
2. Data Views, canonical filters and date/financial-calendar contracts, query limits/timeouts and independent widget loading. Security and fanout tests before approved relationship exploration.
3. Separate draft/published versions, sharing and recipient permission checks, responsive saved layouts, targets and comparisons.
4. Permission-aware Excel exports with filter metadata and server-only attachment/export storage. Respect the desktop data boundary; do not introduce automatic local business exports.
5. Reports, alerts, scheduled subscriptions, governance, advanced calculations and remaining acceptance scenarios.

The 195-section brief is the target; v0.1 is not a claim that full self-service Analytics is complete.

## Premium visual builder update — 3 October 2026

The shared live/preview Studio now has a midnight header, grouped number tiles,
a responsive canvas and a visual-type gallery. Builders choose a metric, select
its canvas visual and edit its properties in the right panel. Supports custom
titles, category scope, display category limits, width, borderless style, duplicate,
remove, reorder and 30-step canvas undo/redo. Number tiles offer white, soft colour
and midnight styles. Blue/teal/violet/amber/rose/slate palettes apply per visual or
across the dashboard. Pie/donut charts consolidate smaller categories after five
named categories into an explicit Other group when there are more than six;
legend values and category detail provide text access to the data.

Viewer filters: apply reporting period through a GET form, select dashboard subject
(controls visible visuals), and filter categories inside an individual visual.
Category clicks show a count/share and can focus that category. These category
interactions operate on already-authorised aggregate results, not unrestricted
record queries. This is not a canonical cross-source site/customer filter or exact
record drill-through. Source workspaces retain their own authorisation.

Preview contains ten clearly labelled synthetic subject examples. Its period
illustrations scale fixture counts; they are not historical business queries.
Live dated metrics use tenant-scoped date predicates. Snapshot counts do not change
with the period. Browser checks exercised blank creation, number/pie selection,
properties, colour, category detail/filtering, subject filtering, applying periods
and undo. Desktop 1440px and mobile 390px rendering inspected; mobile page width
matched the viewport. Preview access does not activate Analytics in a live tenant.

Source build/ staging outputs are excluded from root TypeScript checking through
tsconfig.json; those generated snapshots have their own builds. Existing source
changes by other contributors were preserved. Scheduling's newly added app has no
Analytics provider in this pass; future/unimplemented apps and unrestricted fields
remain outside the catalogue.

Project and personal-task aggregates also use the shared record visibility predicates in `src/core/permissions/work-access.ts`; read capability alone does not broaden private work visibility. Latest source checks: scoped lint passed, 143 tests passed / 11 skipped, final root production build and its TypeScript passed. Live save/tenant activation and installed desktop/data packaging remain unverified.
