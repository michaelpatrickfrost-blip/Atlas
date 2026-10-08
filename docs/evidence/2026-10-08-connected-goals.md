# Connected Goals live evidence — 8 October 2026

Final runtime `2b7a48633925bdea85c8fbf8817e7e37c6afb4aa` is deployed to
https://atlassystem.online. Source calculations initially deployed at `0105f95`;
final release also fixes mobile sizing and rate labels. Clean pinned releases retain
previous Quality/Tickets changes and exclude unrelated unfinished primary edits.

## Release and central records

- Reviewed code/type contracts, provider registrations, source scopes and final diff.
- No schema migration or local business persistence. Server migration status:
  97 migrations; schema up to date. Service active; checkout clean; HTTPS login 200.
- Private pre-deploy database dumps and configured service-evidence archives retained
  under administrator backups as `atlas-pre-deploy-20261008-133332` and
  `atlas-pre-deploy-20261008-134301`, alongside historical backups.
- Final production build and separate strict TypeScript passed. Full suite: 857
  passed / 22 integration tests skipped (135 files passed, three skipped).
  Final focused Goals regressions: 45 passed across six files. Scoped ESLint and
  whitespace passed. Primary integration's 45 focused tests also passed.

## Final live acceptance

`ATLAS_GOALS_TEST=1 npx tsx scripts/check-connected-goals.ts` on the deployed
central server used ordinary password sign-in, explicitly granted source permissions,
synthetic `isTest` companies and known source records. All **37 assertions passed**.

- Nine guided source selections and their actual results: confirmed sales £150,
  posted revenue £1,000, posted profit £600, overall CSAT 66.7% (three valid answers),
  service CSAT 50% (two visible valid answers), two completed production orders,
  50% on-time production, one visible resolved case and one dispatched shipment.
- Sales includes the final goal day's 23:59:59.900 UTC confirmation and excludes
  cancelled orders, other currencies and next-period confirmations. Ledger excludes
  drafts and later accounting dates; profit subtracts posted expenses.
- Service CSAT excludes restricted cases, invalidated responses and later answers.
  Overall CSAT uses its own permitted overall-response scope, not the service-case
  scope. Production compares actual completion with required calendar date.
- Adding another in-period sale changes the goal reading to £160 after refresh,
  while `Kpi.current` remains zero; authoritative actuals are not copied into Goals.
- Existing manual goal connects to Sales with its ID/owner/period/history retained;
  target converted to selected source unit and one central connection audit.
- Sales documents, Finance ledger, CSAT, Manufacturing and Service pages each show
  matching connected goals. A saved dashboard's 30-day chart filter does not change
  its August goal's £600 result.
- Detail and setup fit 390px phone viewport; final screenshot visually reviewed for
  wrapped text, legible actual/target/Below target label and source definitions.
  Manager journey produced zero browser runtime errors.
- Central data-query executor excludes captured live-goal numbers in direct
  KpiUpdate and nested Kpi history reads. Read-only Goals profile sees source-access
  explanation rather than profit/captured numbers; another company sees no goal.
- Direct read-only/foreign source changes reject without writes. Stale connection
  state cannot replace a newer connection. Disabling Finance removes its actual
  reading rather than falling back to stored progress. Audit remains central.

Earlier acceptance fixtures were corrected for composite relation field inference,
Finance's existing overview-entry permission and canonical saved-board schema/ID.
The real mobile detail overflow was reproduced and fixed in `2b7a486`; the complete
37-assertion suite was rerun on that final runtime. No guard was weakened to pass.
Every attempt's finally block suspended its exact synthetic companies, disabled
memberships, revoked sessions and rotated credentials. Central history was retained;
no real company records were changed by the fixture journeys.

## Limits

See `docs/modules/GOALS_KPIS.md`. Personal source links remain context, not employee
attribution. Arbitrary formulas, weighted roll-ups, recurring goal schedules,
historical snapshot archive and notifications are not delivered here. Old unbounded
flow measures show an explicit reconnect requirement. Current operational statuses
and repricing can change past-period readings; Finance retains posting/reversal
semantics. Skipped integration tests are not passes; logical company scopes are not
proof of separate physical company server environments.
