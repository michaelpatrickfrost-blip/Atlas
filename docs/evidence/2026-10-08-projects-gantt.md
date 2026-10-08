# Projects Gantt — 8 October 2026 deployment evidence

Runtime **9d5a460ea30eb2071a84cb2cea9747e4525c9413** deployed at
https://atlassystem.online from the compatible clean managed release checkout.
Original runtime `ddde304` and corrected runtime `9d5a460` each built on the server,
restarted successfully and returned public `/login` 200. Final service active,
checkout clean, 98 migrations current, no schema changes. Both private DB and
service-file backups retained at each deploy:
`atlas-pre-deploy-20261008-142820` and `atlas-pre-deploy-20261008-143425`.
Concurrent employee-validation changes and historical deployment evidence retained.

## Implemented and verified

- Project Plan & Gantt first view and shared Gantt timeline; dated grid, three zooms,
  paging/whole-plan/Today, sticky task owners/status/duration and readable task details.
- Existing dependency types/lag lines, milestone markers, critical/slack forecast,
  conflicts and incomplete-date signals; filters keep analysis context.
- Immutable baseline shadow dates/finish-variance table and added-since-baseline
  rows. Browser projections omit invisible/deleted scope and unnecessary snapshot fields.
- Explicit date-only editing to canonical ProjectTask, submitted version and
  session/capability/module/tenant/project-role checks, atomic audit/outbox. No
  silent successor changes or overwrite of other task details. Archive is read-only.

Final local production build, strict TypeScript, scoped ESLint and whitespace pass.
Full suite: **912 pass / 22 integration skips**, 144 files pass/3 skip. **25 focused
planning checks** also pass after guarded integration into the canonical shared repo.
No local database or business-data cache created.

## Live acceptance

Server-only `scripts/check-projects-gantt.ts` passed **all 28 assertions** via normal
password sign-in, real Chromium forms and direct authenticated Next actions:

- Gantt/milestone/baseline/connector/conflict display; Today, zoom and whole-plan;
- actual central date saves, preserved task content/owner and unchanged successor;
- reload persistence, updated baseline variance, unscheduled task search;
- contained 390px chart scrolling and zero manager browser runtime errors;
- authorized direct-action success, then stale/read-only/viewer/foreign write rejection;
- invalid dates/ranges, read-only UI and foreign private-project read protection;
- archive UI/action and independent disabled-module protection;
- exactly one successful task edit audit, no rejected-edit audit entries.

Each attempt used isolated `isTest` companies. Every attempt's companies were
suspended, memberships/grants disabled and sessions/credentials revoked in `finally`;
central records/audit remain retained. Final phone screenshot `/tmp/atlas-projects-gantt.png`
on the server was copied for visual inspection; task names are synthetic only.

Initial full-suite inventory timeout under simultaneous checks passed unchanged
with four workers. Initial live test checked a collapsed baseline table; corrected
the test to open it. Live acceptance then found a real SVG-title hydration mismatch.
The server-render/hydrate regression reproduced it; one-string title fix passed
locally, was redeployed and the entire live acceptance rerun passed. No error check
or security boundary was weakened. Fixture-required project references were also
caught and corrected by separate TypeScript before the first deployment.

## Limits retained

Calendar-day analysis only. Whole plan is a bounded 366-day overview with explicit
paging for longer schedules. Open task estimates are not actual time-netted effort.
No drag/drop, bulk editing, automatic propagation, finite/leave-aware capacity or
new Finance actuals. Broader 256-section scope remains open in PROJECTS_COVERAGE.md.
