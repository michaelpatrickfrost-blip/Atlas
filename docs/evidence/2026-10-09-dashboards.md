# Dashboard redesign acceptance — 9 October 2026

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
