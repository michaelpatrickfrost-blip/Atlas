# Dashboard redesign acceptance — 9 October 2026

## Source and release

Application candidate `d61e5c461fb8ac83b55bdecf6b9773492619a2a5` includes
modern personal Dashboards, final Messages Me assignment, already-live private
Admin `1dafe165`, Studio and Guardian MRP source. No new Dashboard schema or grants.
`codex/dashboard-redesign-release` is the pinned app source; evidence branch adds
runner-only navigation/rename assertion corrections outside the sealed runtime.

Prepared immutable candidate with database/private-file backup
`atlas-pre-deploy-20261009-212614`. Production pointer remained on `1dafe165`.
Preparation/compatibility/startup smoke passed. Candidate browser acceptance is
pending; no public Dashboard activation or acceptance is claimed by this checkpoint.

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
