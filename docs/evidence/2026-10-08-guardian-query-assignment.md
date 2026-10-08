# Guardian query assignment evidence — 8 October 2026

## Original reproduction

On live application `2b7a486` (checkout `622259f`), server-only opt-in
`scripts/guardian/check-service-query.ts --reproduce` used a disposable Test
company, its case requester and a separate receiving-team agent. Real browser
creation linked a query to the exact case and queue. Agent assignment persisted.
Selecting Unassigned and Update work reported Saved while the exact central owner
remained the agent. Report: `cmuzlnwu80000x0d5b8mxdfbn`.

The first attempt timed out on an exact select-label locator. The locator was
corrected and the complete reproduction rerun successfully; the timeout was not
counted as product evidence. Both attempts retired their exact fixture and sessions.
Private database/service-evidence backup `atlas-pre-guardian-query-20261008-135417`
remains in administrator backups. No existing customer records or messages used.

## Repair and checks

`updateWork` now distinguishes an explicitly empty assignment (null) from an
omitted assignment (unchanged), with readable unassigned history. Existing queue,
mutation capability, tenant, version, child/evidence/approval and transaction guards
remain. No schema migration or local business persistence.

- Two Ticket/Query unassignment regressions failed before the fix.
- 22 focused tests pass, including six new assignment cases: Ticket/Query clearing,
  omission, foreign queue member, forbidden mutation and stale event exclusion.
- Full suite: 863 passed / 22 integration tests skipped; 135 files passed / 3 skipped.
- Production build, scoped ESLint, separate strict TypeScript and whitespace passed.
- Deployed application `7079baa`; server build/restart, HTTPS login 200 and all 97
  migrations current. Private deploy database/evidence backup
  `atlas-pre-deploy-20261008-140135` preserved. No pending schema changes.
- A stalled local typecheck was traced to an ignored duplicate generated Prisma
  artifact. Removed only generated duplicate files in the isolated checkout and
  regenerated the client before repeating strict verification.

## Historical Service failures and queue review

Private journal matches the original 7 October 07:26:10 UTC digests:
`1943871693` missing ViewportBoundary, `2212267853` missing MetadataBoundary,
`129530712` missing IconMark in the React Client Manifest. The 07:25:52 UTC
undigested failure coincides with ENOENT loading the static /500 page. Browser
query/report ScriptErrors are timing-correlated with those failures, without
independent exception/control evidence. Six current NEEDS_AI briefs now distinguish
exact matches from inference and specify immutable staged releases, preserved
private storage/environment, schema compatibility, continuous original page/menu
checks and rollback. Deployment reliability `cmuxsymb70000cmd5jgotzfwo` remains open;
this independent assignment fix cannot clear release-time failures.

Three recent Quality/Goals reports were exact expected synthetic foreign-record
checks (NCR detail, NCR closure and goal connection). Private journal, tracked
acceptance scripts and existing final 22/37-assertion live evidence reviewed;
those suites were not rerun here. IGNORED classification saved through actual staff
UI and independently checked in the current private AI brief. No guard suppressed.
Guardian service/timer and heartbeat healthy at review; both active queue pages read.

## Final live proof

On `7079baa`, normal opt-in `check-service-query.ts` passed all seven workflow
groups under the shared release lock. The exact Unassigned action now stores null,
retains Unassigned after reload and appends one matching readable owner-change
entry. The real originating case form creates the exact query/queue/requester;
receiving-team list/detail works without parent private content or an inaccessible
case link. Requester-visible reply records one central entry and first-response
time; private team note is excluded from requester response payload.

Resolution records the result/time and a safe parent event. Case ownership and
WAITING_INTERNAL status remain, with no parent resolution. Customer Service sees
the response-ready prompt; both case/query link directions work. Service report
shows the observed 1/1 completed SLA, actual receiving team and working underlying
case-list/back navigation. Zero browser runtime errors. Exact synthetic Test
company suspended, both membership/user sessions revoked; audit/history retained.
No customer message sent. Report `cmuzlnwu80000x0d5b8mxdfbn` marked FIXED at
`7079baa` only after these original control and connected-state assertions passed.

Guardian timer active, heartbeat 14:03:25 UTC on `7079baa`. Active queue is 41
NEEDS_AI reports with no new OPEN report; the historical deployment cause remains
explicitly unresolved. Owned code/check/topic files integrated into canonical repo
using base comparisons; only the owned memory section/evidence merged afterward,
preserving concurrent edits. No claim that every dynamic workflow is verified.
