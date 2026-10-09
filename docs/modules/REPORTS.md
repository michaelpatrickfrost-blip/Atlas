# Reports workspace

Reports (`/reports`) is a built-in workspace utility for filtering authorised data
and explicitly downloading Excel workbooks. Dashboards remains the separate
Analytics app at `/analytics`. Reports appears in the Home utility rail and the
compact Apps menu; it does not duplicate business apps in the rail or Home cards.

The initial record catalogue covers Customer Master, Products, Sales orders and
quotations, Inventory balances and movements, Logistics shipments and fulfilment,
Manufacturing orders/work centres/resources, and Finance documents/accounts/ledger
entries. Other apps contribute their existing authorised summary measures.
Summary measures are labelled as summaries, retain their definitions, and support
label search and a start-to-now period when applicable. Snapshots cannot pretend
to be historical date-range reports. Broad Finance overview counts are excluded;
only Finance's scoped posted-ledger measures contribute summaries.

## Ownership and permissions

`ModuleManifest.reportProvider` registers a module-owned dataset implementation.
Core owns the contract, validation, catalogue, bounded loader and workbook format
in `src/core/reports/`; Customer Master owns its own Core dataset. Core imports
modules only at the existing registry wiring point. Every dataset is allowlisted
and checks its original read capabilities and source module entitlement. The
Reports utility is always available to an authenticated session with
`core.profile.self`; it grants no source capabilities or licences. Utility modules
cannot be enabled/disabled or offered as company module toggles.

Record providers keep tenant predicates and record visibility inside their own
queries. Arbitrary SQL, entity names, database fields and organisation overrides
are not accepted. Customer Master excludes archived/scrubbed identities. Protected
product pricing, shipping costs, bank details, credential fields and free-text
private notes are not exposed. Finance uses `documentScope` for both preview and
export; whole journals with hidden documents or private project lines are excluded.
Base ledger and transaction currencies are distinct. Exact large monetary amounts
are written as text to preserve Excel precision.

## Filters and download

Choose source and dataset, search, inclusive UTC dates where supported, field
filters (up to 12) and columns. Search and supported field paths are developer
allowlists. Enums, dates, numeric inputs, selected columns and operators are
validated server-side. Preview pages contain at most 100 rows; Excel contains all
matching rows up to 10,000. Oversized downloads fail with `422`, never silently
truncate. Preview and download use the same query predicates and selected columns;
records can naturally change between requests. Pending filter edits disable export
until applied. No results, inaccessible data and failed sources have distinct UI
states; a failed source is not presented as a successful empty report.

`GET /api/reports` returns a preview; `download=xlsx` makes an explicit download.
Signed-out requests receive `401`; unavailable datasets receive `403`. Responses
are private/no-store. The workbook has frozen blue headers, native Excel numbers
and dates, autofilters, alternating rows and a Report details sheet describing
source, definition, company, generation time, columns and applied filters. Text
starting with `=` is literal text, never a generated formula. Successful workbook
preparation is audited as `reports.exported` with dataset, count and options;
record contents/search terms are not copied into audit history. The audit proves
file generation, not that the browser saved it. XLSX is an explicit user-chosen
file, not an automatic business-data cache or local authoritative store.

## Verification

`tests/reports.test.ts`, `tests/reports-api.test.ts`, module registry/entitlement
tests, production build and `scripts/check-reports.ts` cover the boundary. Candidate
and live acceptance use the existing Guardian QA membership without granting new
permissions or changing business records. Explicit exports create only export audit
entries. See the dated delivery evidence for checks actually run.
