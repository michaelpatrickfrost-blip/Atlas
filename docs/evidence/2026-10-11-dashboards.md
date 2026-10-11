# Dynamic Dashboards — 11 October 2026

## Reviewed source

Release `50b39151b4f7cd1fc027ed576aeb7e3d7960efdc` starts from the observed public
`ad9d5a430e2b92e6b08448a45d11f694f5ce2066`. Shared-main Settings documentation
from `5297d519` is reconciled; its merge changes documentation only. All existing
source owners, capabilities, tenant restrictions and accepted Studio code remain.

The gallery, canvas and inspector use the shared Atlas/Nunito design. Data, Design
and Focus separate source choices from appearance and advanced group/threshold
settings. Four themes and three layouts change existing widget fields, with undo.
Multiple category selection and optional personal gauge references are bounded
settings. Chart clicks, value switches and expanded exploration remain transient.

Gauge references use complete aggregates, weighted averages/extrema or exact
unfiltered distinct totals. Filtered overlapping distinct groups cannot become a
summed headline; monetary guards remain. No new migration, grants, local database,
raw-row client store, arbitrary expression engine or sharing boundary.

## Local verification

- Eight focused suites, 52 assertions: charts, workspace, persistence, data queries,
  schema, catalogue, private-project scope and CRM scope: PASS.
- Standalone TypeScript, scoped ESLint, production build and diff whitespace: PASS.
- Playwright synthetic gallery/canvas/inspector/explorer at desktop, tablet, 390px
  and 320px: PASS with zero page errors.
- Multi-group focus, chart styling, themes, expanded chart/table/Escape: PASS.
- Visual review caught and corrected cramped phone titles and the global table
  minimum width. Final phone modal is centered, shows both columns and returns
  focus to its opener after Escape: PASS.
- Full repository suite not run. Local evidence: `/tmp/atlas-dynamic-*`.

## Deployment

Original pinned Dashboard pipeline uses both release locks, existing central
backups, source/ancestry/compatibility gates, immutable build, smoke and runtime
rollback. Candidate and public Dashboard/Home/Reports/typography/Messages acceptance
both PASS at exact `50b39151b4f7cd1fc027ed576aeb7e3d7960efdc`, with revision
checks before/after each run. The updated Dashboard checker verifies persisted
multi-group/target/theme settings, expanded values/Escape, saved periods, rename,
currency guards, duplicate/undo/redo, monitor and desktop/tablet/phone layouts.
Reports verifies 63 authorised datasets including scope and actual Excel outputs;
source business records remain unchanged. Messages fixtures are cleaned afterward.

- Preparation backup: `atlas-pre-deploy-20261011-154453`.
- Candidate: `/tmp/atlas-dashboards-candidate-tIT2em/browser.log`.
- Public: `/tmp/atlas-dashboards-public-j35dEg/browser.log`.
- Active: `/opt/atlas-releases/50b39151b4f7cd1fc027ed576aeb7e3d7960efdc`.
- Previous retained: `/opt/atlas-releases/ad9d5a430e2b92e6b08448a45d11f694f5ce2066`.
- Public login returns 200; current/previous pointers confirmed.
- Separate public synthetic preview verifies canvas, expanded values, Escape and
  opener focus, with zero page errors. Screenshot `/tmp/atlas-dynamic-live-preview.png`.

The deployer accepted the release and safely deferred inactive-runtime retirement
at its existing guard. Active and rollback runtimes remain intact. No feature
blocker remains. Final evidence/shared-main integration changes documentation
only, so the publicly verified runtime stays `50b3915`.
