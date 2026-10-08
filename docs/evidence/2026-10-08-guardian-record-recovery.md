# Guardian unavailable-record recovery — 8 October 2026

Repair first deployed in immutable runtime **2d25bd29cbd5761d574e88ee361a19dcc5677e98**
on https://atlassystem.online. Parallel launcher runtime **dd66039772fc57daa77dc1189ab53af3d4e5569d**
included it; the complete original check was repeated successfully on that
pinned live SHA on 8 October. Historical runtimes and central backups retained.
No migration, customer record change or permission grant in this repair.

## Original reproduction and repair

The opt-in central Test fixture on 2bda114 produced twelve missing/foreign HTTP 500
responses across six record routes: Meetings, Maintenance Equipment, Maintenance
work, Fleet, Engineering and Field Service. Each displayed “Something went wrong.”
A private same-company meeting opened by a non-attendee produced the same generic
failure. Six authorised valid records rendered. Private title/agenda stayed hidden.
Private journal confirms 11 Meeting and six each Equipment/Work order/Vehicle/
Revision/Job unavailable exceptions across the original harness iterations.

All six null-read branches now return a neutral unavailable explanation with a
module return link. Meeting workspace reads use the same meetingScope predicate;
mutation access still throws. Other tenant/audience/project/source/module/read/
customer-erasure filters are unchanged. Unexpected DB errors still propagate.
Guardian recognises the explicit marker as unavailable, never working coverage;
HTTP or streamed exceptions take precedence over it.

`tests/operational-record-pages.test.tsx` first produced nine failures against old
code. The repaired 27 checks cover recovery, scoped predicates, no forms/private
IDs, genuine DB failures, read permissions, disabled apps, private meeting entry
reads, throwing mutation access, vehicle-source access and erased customers.

## Actual candidate and live outcome

`scripts/guardian/check-unavailable-records.ts` seeds two disposable central Test
companies/read-only profiles and connected Meeting, Equipment, Work, Vehicle,
Product revision and customer visit records. Full exact central fixture snapshots
remain in process memory; no private bodies, credentials or IDs are exported.
Every browser non-GET/HEAD request is blocked, including background notice reads.
The SHA must remain stable throughout; an explicit expected SHA was supplied.

Original mode completes with 13 reproduced generic errors, six valid pages and
successful equipment/work and Fleet/work round-trips. Corrected candidate, initial
public production and newer dd66039 public normal mode each pass:

- All 13 explicit unavailable states and actual calendar/register return clicks.
- Six authorised valid record headings and rendered workspaces.
- Hidden private meeting title/agenda and absence from the returned calendar.
- Actual work → equipment → work and Fleet → linked work → Fleet navigation.
- Exact unchanged full central record values/versions/history, canonical Product/
  Party/asset connections, audit/outbox, Finance documents and Inventory movements.
- Zero browser runtime errors and no attempted business write. Twenty-one background
  notice reads blocked; synthetic companies suspended and sessions revoked while
  central history remains.

Prepared candidate private evidence: `/tmp/atlas-record-staging-4KmPKa`.
Actual isolated old → candidate → old switch/rollback:
`/tmp/atlas-release-switch-F6fNk0`; **40 page requests and 40 Apps toggles**, zero
browser/chunk failures, production pointer unchanged. After activation, public
existing-QA read check passes five pages/five Apps toggles. These are read continuity
checks, not universal business-button or uninterrupted write guarantees.

## Release checks and retained evidence

Full suite: **1,034 pass / 22 integration skips**, 155 files pass / three skip.
Focused operational/record/Guardian checks: **73 pass**. Production build, separate
strict TypeScript, focused ESLint and whitespace pass. The final probe-only changes
also pass strict types/lint. Canonical four-file focused integration suite: **76 pass**.

Private database/Service-file backups retained under administrator backups:
170522 original fixture, 171205 prepare, 171440 staged fixture, 171649 activation,
171745 live fixture and 172432 repeated latest-runtime fixture UTC on this date. Deploy uses both locks, sealed independent
builds and atomic activation. Exact public SHA confirmed; Atlas and Guardian timer
active, worker success and fresh heartbeat. Anonymous staff inbox redirects 307;
actual `/api/atlas/guardian/[issueId]/brief` returns 401. An initial test used a
nonexistent brief URL and returned 404; that was not used as access-boundary proof.

Canonical integration used exact bases and merged schema/model metadata without
replacing concurrent fields. Missing already-deployed operational dependencies were
integrated alongside this repair; 20 action registrations use separate aliases to
retain concurrent mappings. All owned repaired files match release source.
Parallel operational-owner acceptance afterwards records a separate full 62-assertion
rerun on 2d25bd2 in [its evidence](2026-10-08-operational-apps.md); that evidence is
not attributed to this Guardian fixture. External Microsoft delivery is still unverified.

## Reports and next coverage

Independent report `cmuzskpvh00001cd5zp9gv50g` and six instrumentation reports whose
first/last times exactly match our original fixtures are FIXED only after deployed
live proof, then verified again on dd66039. Their full current briefs were read. Identified streams:
`cmuzsh7p70005gcd54mxvg1of`, `cmuzsj2n7000hgcd5l6vroh2w`,
`cmuzsj1ff000fgcd5p3vmn21y`, `cmuzsj07g000dgcd5g1zxe0vj`,
`cmuzsiyz9000bgcd5n3g4j9g7`, `cmuzsixre0009gcd5po3pj42e`.
Older generic reports lacking original profile/action/fixture/state are not closed
by this independent evidence. New staff-team digest 3529963080 at17:12 is NEEDS_AI;
private journal shows an Unknown Server Action nearby, but the exact original
control/state is absent. No write replay or staff grant attempted.

Queue pages are read through hasMore=false. Later operational guard/negative
acceptance diagnostics receive exact symptom/source/context/blocker/next-action
notes; successful acceptance alone does not prove which original request produced
a generic digest. The 8 October broad sweep was 6ef3cdf; its source inventory
and capped browser coverage are not new dynamic workflow verification. Continue
rotating controls and connected state with disposable central fixtures.

The 8 October closing queue had 92 active reports; the reviewed new items were
NEEDS_AI with exact notes.
New `/profile` digest 24128237 at17:21 has no original profile/projection context;
fresh existing authorised Guardian QA GET on dd66039 gives HTTP 200 and no generic
error. This independent HTTP check does not prove the original browser/control or
all employee/module combinations. Its original reproduction remains NEEDS_AI.


## 9 October refresh

The complete original fixture passed again on public pinned
**58b3610f73329264e5b48b92bde721daddeb6a74**: 13 unavailable states and actual
return clicks, six valid records, private meeting concealment, both connected
round-trips and exact unchanged full central snapshots. Zero browser errors and
attempted business writes; 21 notification reads blocked. Exact fixture access
retired; history retained. Private pre-test backup
`/home/administrator/backups/atlas-pre-record-refresh-20261009-184900.dump` and
Service-file archive retained. Seven identified reports now reference this verified
revision. This follow-up did not activate a release.

All seven queue pages read, 169 active reports. Seven recent reports were read in
full and moved to NEEDS_AI with precise symptoms/source/checks/blocker/next action.
Manufacturing planning render/action/browser reports share digest 1518667181 on
585e9ba. The private journal interval has 25 matching requiredDate.getTime
TypeErrors; deployed af030b0 converts stored JSON dates and is included in 58b3610.
Existing QA fresh browser GET checks pass Home, planning, planned orders, shortages,
People, Tickets queues and My work: seven pages, six available Apps toggles, no
browser/chunk errors, all writes blocked. QA has zero saved MRP runs/proposals,
so the original saved-date/action outcome still needs a data-bearing disposable
central fixture. No unrelated historical report was closed. The initial Home
Apps-toggle harness assumption was corrected because Home is the launcher.

Atlas/timer active, worker Result=success; exit 75 is the expected release-lock
skip. Latest completed broad sweep at 15:18 UTC on 585e9ba: 256 requests, 100
rendered pages, 99 safe toggles, zero findings/browser failures. This is capped
read coverage, not every form. Anonymous login 200, Guardian inbox 307 and correct
brief 401 pass. Removed only four completed Guardian ephemeral server files; sealed
checker, central reports, private logs and backups remain. Final follow-up edits
are documentation and triage only; original repair tests/types/lint/build retain
their dated scope above. No fresh full application build is claimed.
