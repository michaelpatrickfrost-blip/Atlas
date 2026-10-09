# People platform release — 10 October 2026

Accepted runtime `36d0d2de7e64340a5faf130a69b3bcf21db3a2fc` activated at
https://atlassystem.online; public release health confirmed that exact revision.
Previous immutable `7941f9bfb9e4120d9726cea49f03590107a5750c` retained. Central
backup: `atlas-pre-deploy-20261009-230051` (UTC filename).

## Verified delivery

- Weighted company scorecards persist and feed a real saved Analytics dashboard;
  actual goal changes render 90→95%. Private goals and foreign-company reads stay
  excluded; missing/inaccessible source readings remain unscored.
- Actual employee pay setup, approved-hour draft creation, refresh, finalisation
  and paid UI persist. Drafts do not advance YTD. Changed inputs, duplicate runs,
  invalid status, unauthorised/foreign actors and repeated finalisation are denied.
  Foreign-company time is excluded; finalisation advances YTD exactly once.
- Real open-shift request/approval creates exactly one published canonical shift.
  Skills, availability, employment civil days, tenant scope, repeat decisions and
  competing concurrent claims are checked. Timed breaks and non-work activities
  change assured interval coverage.
- Team effort/goal links, status, reassignment and reloads persist. Published
  rotas, unioned breaks/activities and availability affect capacity. Member/tenant
  boundaries and stale versions reject invalid updates.
- Seven workspaces exercised at 1440 and 390 widths with no horizontal overflow
  and zero browser/asset errors. HR/rota desktop and Team/Goals phone screenshots
  visually inspected. These screenshots show synthetic Test records only.

The above PASS on both the sealed loopback candidate and public HTTPS under the
same deployment locks. Evidence remains private on the VPS:
`/tmp/atlas-people-candidate-wwFroa`, `/tmp/atlas-people-public-uTisM7`.
Opt-in checker: `scripts/check-people-workspaces.ts`; release selector:
`ATLAS_RELEASE_ACCEPTANCE=people`. Every fixture run suspends its Test companies
and revokes their sessions, retaining canonical workflow/audit history. The
deliberately mismatched synthetic time fixture is deleted after its isolation check.
Existing customer records, passwords and profile grants are not altered.

Production build and strict TypeScript PASS. Focused suite: 18 files/125 tests;
final Commercial schema/API regression: 4 files/35; final Studio merge regression:
7 files/59, all PASS. Scoped lint and deployment shell syntax PASS. Full suite was
not rerun for this task; earlier unrelated baseline failures remain distinguished.
Post-release private Admin login HTML and HTTP headers still carry noindex,
private/no-store and no-referrer. The public login responds 200.

## Preserved preparation history

- `28a45e6` prepared and passed real candidate workflows/layouts. Backup
  `atlas-pre-deploy-20261009-221347`; separate Test backup
  `atlas-pre-people-test-20261009-222213`; evidence
  `/tmp/atlas-people-candidate-cxMJP1`. Four initial screenshots inspected.
- `ff2b3df` passed the candidate including saved dashboard 90→95%; ownership FK
  migration applied. Evidence `/tmp/atlas-people-candidate-rt4owH`. No live switch.
- `2ede4a0` stopped before switching when a dashboard reload raced client
  navigation. Added explicit saved-dashboard URL wait. Backup
  `atlas-pre-deploy-20261009-223227`; evidence
  `/tmp/atlas-people-candidate-Q5RXLH`. This was a checker race, not lost data.
- `b12649a` built and passed dashboard checks, then an impossible 60000-minute
  synthetic daily entry hit an existing DB constraint. Corrected to valid 60
  minutes; the assertion still requires exactly 45 legitimate approved hours.
  Backup `atlas-pre-deploy-20261009-225211`; evidence
  `/tmp/atlas-people-candidate-3hRuWS`. No guard bypass or production switch.
- Queued e38dd4d/ad7417e attempts stopped on moved branch; 401129b/60a814b
  stopped on live ancestry changes. Exact deployed font, business navigation,
  Commercial and Studio source was reviewed/merged before subsequent releases.
  No other contributor's release, metadata or runtime was overwritten.

All earlier immutable candidates, backups and private logs remain retained. The
two People migrations are additive; existing records are not deleted. Applied
migration files are retained unchanged, including their original formatting.
The pg query deprecation notice did not fail acceptance; no adapter behaviour
was changed. No RTI/banking, telephony, service-level forecasting or other
external integration is implied. See [delivered scope and boundaries](../plans/PEOPLE_PLATFORM_OVERHAUL.md).
