# Historical department work — 8 October 2026

The live `/service/tickets` page redirected into the newer Tickets app. Preserved
`ServiceTicket` records could therefore disappear from the user's journey or require
unrelated Tickets permissions. A pre-fix browser check reproduced that redirect.

Release `67b8c3d` restores the historical list, search/status/ownership/case filters,
individual ticket details and exact case Linked work links. Existing scoped,
version-checked updates handle ownership, progress, outcomes and completion. No
schema migration or record conversion was needed. Completion preserves case owner
and status; completed/cancelled tickets are read-only.

Validation: 721 tests passed, 22 integration skips; separate strict TypeScript,
production build, changed-file lint and diff check passed. Primary integration:
22 focused tests passed. Server deployment built/restarted successfully; all 96
migrations current; public login 200. Backup retained:
`/home/administrator/backups/atlas-pre-deploy-20261008-120207.dump` and companion
`atlas-pre-deploy-20261008-120207-service-files.tar.gz`.

`ATLAS_SERVICE_HISTORY_TEST=1 npx tsx scripts/check-service-history.ts` ran on the
live server with normal sign-in and actual browser forms. All 13 assertions passed:

- Original open/completed tickets visible without newer Tickets permissions.
- Restricted queue/case records excluded from the list.
- Department responders cannot read the parent's private description/conversation.
- Real form saves ownership/progress and completion outcome/customer-safe summary.
- Completion time and response event recorded; parent owner/status preserved.
- Detail fits a 390px viewport; no browser runtime errors.
- Read-only, foreign-company and restricted detail boundaries preserved.
- Raw action request cannot bypass read-only permission.
- Case Linked work opens its exact historical ticket.

Initial harness attempts needed a required Party customer code and selectors that
allow select option text/tab counts; those attempts were not counted as successful
acceptance. Every synthetic tenant was suspended and credentials revoked in cleanup;
central records/audit history retained. No private customer data or credentials are
stored here. This verifies the restored historical workflow, not all Customer
Service features or the broader ERP brief.
