# Dashboard redesign acceptance — 9 October 2026

## Final activation and public acceptance — 10 October 2026

Activated source **70ca23ea83662c94e254488de717ee26de0e2c84** through the pinned
codex/dashboard-redesign-release with ATLAS_RELEASE_ACCEPTANCE=dashboards.
Candidate and public revision checks bracketed all five acceptance workflows
under the existing two release locks. All five PASS on both URLs: Dashboard
builder/personal save/rename/reload/monitor/Reports source, Home/Apps and business
boundary, Reports/Finance previews and actual XLSX exports (63 authorised datasets),
Nunito typography (ten routes at three viewports), Messages send/order attachment/
history/pagination/details/drafts/forged-reference rejection. Desktop, tablet and
phone checks PASS; no browser/asset errors. Public login returned 200.

Backup atlas-pre-deploy-20261009-232442 includes central database/private files.
Private server evidence: /tmp/atlas-dashboards-candidate-Y0aKmw/browser.log and
/tmp/atlas-dashboards-public-t3dAEj/browser.log. Local deployment transcript:
/tmp/atlas-dashboards-locked-deploy-retry.log. Public SHA verified after completion.
Previous /opt/atlas-releases/2ef5b4c2f9dffaa2dd92c7df894a5587e45a12de retained.
Exact already-live People/Supply/Studio/commercial/typography source preserved.
No new Dashboard migration, grants or source-record changes. Synthetic owned boards
removed and synthetic chat fixtures retired in finally; no real person messaged.

Final combined checks: 28 files/138 assertions; subsequent Supply integration
seven files/35 assertions; client/descriptors, route types, strict types, production
build, scoped lint (zero errors/one brand-image warning), shell syntax and diff PASS.
The full baseline suite was not rerun. Earlier candidates below are historical.

First activation attempt failed at remote Git fetch due to disk exhaustion before
backup/switch. Under both locks, removed only reproducible node_modules from ten
inactive October 8 releases (6028b1f, 0c742ff, 6ef3cdf, 9ef1414, dbd5c91, 2bda114,
2d25bd2, dd66039, c471fb0, 6483c96). Source/build assets/evidence/backups retained;
ready markers preserved as .atlas-ready-retired-dependencies, preventing reuse
without restoration. Active and previous runtimes excluded. Recovered 13 GB;
unchanged live SHA verified, then same reviewed source retry passed completely.

## Historical preparation evidence

## Source and release

Application candidate `d61e5c461fb8ac83b55bdecf6b9773492619a2a5` includes
modern personal Dashboards, final Messages Me assignment, already-live private
Admin `1dafe165`, Studio and Guardian MRP source. No new Dashboard schema or grants.
`codex/dashboard-redesign-release` is the pinned app source; evidence branch adds
runner-only navigation/rename assertion corrections outside the sealed runtime.

Prepared immutable candidate with database/private-file backup
`atlas-pre-deploy-20261009-212614`. Production pointer remained on `1dafe165`.
Preparation/compatibility/startup smoke passed. Candidate Dashboard/Messages/Home/Reports browser acceptance passed. Visual
inspection found phone Settings clipping and a white hero-logo rectangle; utility
padding/icon sizing and logo blending were corrected before activation. KPI
sparklines now render only meaningful trends. A new candidate must pass its own
acceptance; no public Dashboard activation is claimed by this checkpoint.

## Local verification

- 13 focused files / 58 assertions passed: four Dashboard query/action/canvas/chart
  suites plus existing Analytics catalogue/private Projects, CRM scope, Reports,
  Messages, Admin layout and Admin action aliases.
- Final currency refinements: four Dashboard files / 25 assertions passed.
- Private authentication-counter metadata exclusion plus data-query regression:
  two files / 13 assertions passed. Generated gateway metadata includes already-live
  Studio descriptors, but deliberately excludes AuthenticationRateLimit.
- Strict TypeScript and production build passed for the final application source.
  Next build skips type validation; standalone TypeScript was run separately.
- Scoped lint has zero errors and two decorative logo image warnings; final
  refinement lint has zero errors and one such warning. Diff check passed.
- The global suite was not rerun; the existing unrelated baseline failures are
  recorded in CURRENT_STATE. No whole-repository success is claimed.

## Central acceptance protocol

`scripts/check-dashboards.ts` uses the existing Guardian QA membership/grants.
Only synthetic personal Dashboard definitions are created and deleted afterward;
underlying Customer/Sales/Inventory/Finance records are read-only. Tests cover
utility placement, record grouping/calculation, currency requirement, styling,
duplicate/undo/redo, central save/rename/reload, saved period, monitor, three
viewports, Reports source selection and browser runtime errors.

Corrected committed runner is staged outside the immutable candidate with imports
bound to its exact source and dependency tree. Home runner similarly recognises
Dashboards as a utility and checks the visible responsive nav. Messages and Reports
run their existing central acceptance scripts against the same runtime. Chat creates
only retired synthetic central contact/history fixtures, not messages to real users.

Activation must follow passing candidate checks, preserve ancestry/current live
work, then repeat against public HTTPS with health revision verified before/after.

## Final refinements before activation

Polished 650b13b candidate passed Dashboard, Home (including utility icon/label
bounds), all 14 detailed Reports/Finance previews/workbooks/filters, summary scope
and Messages history/order/draft/responsive checks. Screenshots inspected: ribbon
background and all six phone utilities fit. Final numeric refinement distinguishes
empty/null-only averages/extrema from zero and keeps group averages weighted;
distinct KPIs warn when value thresholds would combine overlapping groups.
Ten focused files/53 assertions and final projection suite (14 assertions), strict
types, scoped lint and production build passed. Final source still needs candidate
and public acceptance; earlier passing candidates do not substitute for that.

## Concurrent live source preservation

726b860 preparation stopped safely at ancestry before backup/build when Supply
2690c26 became live. Exact already-deployed source is merged, including purchasing
links, product eligibility, planning cost/privacy guards, retired-Test dependency
checks and bundled fonts. Prisma/client and generated gateway descriptors are
synchronised without including private authentication counters. Nineteen focused
files/79 assertions, combined strict types, production build, scoped lint and
diff check passed. Exact combined candidate/public acceptance follows.
This does not activate unrelated unfinished Apps work from main.

## Final input guard and integrated live source

73fcdb94987ee97bf63b48f62808b024b80d7b3a rejects invalid three-letter
monetary currency input per widget, with 19 focused assertions, strict types,
scoped lint and build PASS. Prepared backup atlas-pre-deploy-20261009-215512;
exact candidate Dashboard/Home/Reports/Messages acceptance PASS, private log
/tmp/atlas-dashboards-final-candidate.log. Production advanced independently to
e5d66e6cf36b0fe228ac65287fdaa8d5ceb8be7c, integrated Studio/Apps source.
Merged that exact already-deployed source and preserved both contributors'
acceptance refinements. Combined 23 files/97 assertions, strict types, production
build, scoped lint (zero errors/two decorative brand-image warnings) and diff PASS.
Schema/client/descriptors now match its already-live typed fields; private auth
counters remain excluded. Candidate preparation/acceptance and public proof follow.

## Combined acceptance and font preservation

Prepared bc8fc2e with backup atlas-pre-deploy-20261009-220614; Dashboard,
Home/Apps (including 320px), Reports/Finance all PASS. Chat fixtures/history PASS,
viewport assertion FAIL: the incoming runner accepted DOM visibility before the
restored timeline was on screen. It now retries scrolling with the actual
toBeInViewport assertion; no application behaviour assertion is relaxed. Failed
log retained: /tmp/atlas-dashboards-integrated-candidate.log. Public runtime advanced
to 5ebd700d3526b6fdaa70efa4514da0803301a285 (rounded Nunito typography); its
exact source is merged unchanged. Four UI files/18 assertions, strict types,
production build, runner lint and whitespace PASS. Final candidate/public checks
include the existing read-only typography checker.

## Accepted final candidate; live business boundary preservation

054dd1c29f158f55cb3dbefc361bb4214fae1ded prepared/smoke PASS, backup
atlas-pre-deploy-20261009-222031. Exact candidate Dashboard, Home/Apps, Reports/
Finance, typography (10 routes/3 sizes) and Messages (actual viewport after
restore) all PASS: /tmp/atlas-dashboards-rounded-candidate.log. Main integration
df58451 preserves source/evidence and explicitly records activation pending.
Live advanced to 56c9d88a66ba2b257fe780a3174e699cfcd81261; obsolete activation
was cancelled before acquiring a lock/switching. Preserved its already-deployed
business/platform navigation boundary and updated Home runner assertions. Final
merged boundary checks and preparation/public verification follow.

Boundary merge validation: five UI files/24 assertions, strict types, production
build, Home runner lint and diff PASS. Analytics/chat/font application source
remains identical to fully accepted 054dd1c; candidate checks focus on changed
Home/business navigation and Dashboard integration, then all five checks repeat
on public HTTPS after activation. No Dashboard schema/grant change.

## Commercial live release preservation

8f0dfa957a052be00aaa3c73a7b14c902f9efcf6 prepared/smoke PASS with backup
atlas-pre-deploy-20261009-223752. Dashboard and Home/business-boundary candidate
acceptance PASS: /tmp/atlas-dashboards-boundary-candidate.log. Activation stopped
safely at ancestry before backup/switch after exact live 94dd3e1 commercial
workspaces advanced. That already-deployed source and additive appointment/account
notes schema are merged; no unfinished commercial branch is being deployed.
Final combined checks and public acceptance follow.

Commercial integration validation: Prisma/client and generated action/model
descriptors match exact live 94dd3e1. Authentication counters remain omitted.
Next route types generated; 24 files/103 assertions, strict types, production
build, scoped lint (zero errors/one decorative brand-image warning) and diff PASS.
Final combined preparation/candidate acceptance/activation/public proof follow.

## 10 October — identical application source, new Studio helper preservation

081e9c396720bc8c93eecb5a515ba8228ba0e398 prepared/smoke PASS, backup
atlas-pre-deploy-20261009-225519; all five candidate workflows PASS:
/tmp/atlas-dashboards-commercial-candidate.log. Live advanced to 7941f9b with
new Studio field helper libraries, tests, acceptance helpers and documentation.
Obsolete queued activation cancelled before lock acquisition; no switch/write.
Exact source merged. Application, Dashboard/chat/Reports/fonts match accepted
081e9c3; new helper functions have no runtime consumers. Validate helpers/types/
build, retain prior app acceptance, prepare/activate and repeat all five publicly.

## 10 October — locked acceptance integration

Exact deployed People 36d0d2d and Supply 2ef5b4c are preserved. The People merge
passed 28 focused files/138 assertions, Prisma/client/descriptors, Next route types,
strict types, production build, scoped lint (zero errors/one brand-image warning),
shell syntax and diff checks. The Dashboard acceptance mode now runs all five
workflows on candidate and public URLs, bracketed by exact SHA checks, under the
existing deployment locks. Existing People/Supply acceptance and all release gates
remain; no source-record edits or new Dashboard migration. Activation pending.
