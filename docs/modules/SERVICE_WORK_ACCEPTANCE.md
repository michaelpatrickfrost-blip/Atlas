# Service work release acceptance — 7 October 2026

## Release and deployment

The connected Customer Service, Tickets and Queries application is live at
https://atlassystem.online. Runtime revision `d1f126b` includes the independently
finished Finance controls `6e1743a`; `c763018` adds Finance acceptance documentation
and a server-only test utility change, with no application-runtime change.

- Additive migration `20261007190000_service_work_desk` applied; no historical records removed.
- Initial backup: `/home/administrator/backups/atlas-pre-deploy-20261007-071426.dump`.
- Polish backup: `/home/administrator/backups/atlas-pre-deploy-20261007-072900.dump`.
- An attempted deployment backed up at `20261007-073554` then stopped on another active Next build; it was not a successful release.
- Final serialized deployment backed up `/home/administrator/backups/atlas-pre-deploy-20261007-073804.dump` and `atlas-pre-deploy-20261007-073804-service-files.tar.gz` in the same server backup directory. Server build/restart, active systemd service and public `/login` HTTP 200 passed.
- Private service evidence uses `/opt/atlas/shared/service-files`; file bytes and database metadata remain central. No local business database/cache was created.

A concurrent in-place build briefly caused missing Next client manifests. The same
pages rendered after restart. Release serialization now prevents build collisions;
atomic release-directory deployment would also protect availability during a build.

## Automated verification

On the clean managed release checkout, Prisma generation/validation, production
`npm run build`, separate `npx tsc --noEmit`, targeted ESLint and `git diff --check`
passed. Final full Vitest suite: **97 files / 587 tests passed**, with **3 files /
22 integration tests skipped**. The skipped integration tests are not green claims.
Nine initial focused suites passed 72/72 tests; later regressions cover replacement
tax preservation and explicit owner capability grants/denials. Shell syntax check
passed for the serialized deployment script.

## Fresh authenticated server acceptance

`deploy/check-service-work.mts` ran `setup`, `verify` and `extended` on the Linux
application server using its existing database environment. Normal sign-in and
authorised action endpoints exercised these workflows in a separate synthetic
company after the final compatible runtime deployment:

- Complaint links the existing customer, contact, order, product and delivery; 250 affected units out of 4,000 delivered. Business response/resolution deadlines exist. A Quality query preserves context and case ownership, blocks premature resolution, then resolves.
- Line-based credit requests create GBP 250 net plus GBP 50 source tax in Finance DRAFT with no invoice settlement change. Service cannot post or approve its own request. An independent approver approves, a separately authorised posting command posts a balanced journal and settles exactly GBP 300.
- Private PNG evidence uploads/downloads successfully; an unrelated requester receives 404. Receiving-team private notes reject requester writes.
- Dynamic service-catalogue form creates a ticket. Independent approval, resolution and reasoned reopening pass; self-approval is rejected.
- Canonical RMA requests 250 units, receipt puts exactly 250 into Inventory quarantine, an exact retry adds nothing and an extra unit is rejected. Replacement creates a Sales draft; Quality creates an NCR.
- A 1.5% recovery benefit requires independent approval, retains cap/expiry/minimum/currency/usage limits and applies explicitly to a Sales draft. Repeated redemption counts once; catalogue price remains unchanged.
- Resolving a case creates a linked Support CSAT response. Repeated score/comment submissions preserve the original 2/5 and comment. Low feedback records recovery-needed history; explicit reopening increments once. Mail status is queued/failed according to existing transport; actual external delivery was not asserted.

Signed-in browser review also verified purchase context, populated owner options,
saved investigation/root cause, linked query detail, a second dynamic-form ticket,
published knowledge version 2 and performance/cost reports showing GBP 300 posted
credit gross and GBP 3.75 redeemed discount net.

## Cleanup and limits

All three service acceptance companies, including the earlier interrupted fixture,
were confirmed suspended with every fixture membership inactive. Temporary credential
state and the obsolete server test script were removed. Immutable posted financial
and audit acceptance evidence was retained; no production guards were disabled.
The revoked browser session redirected to sign-in. No existing company's data or
profile permissions were changed.

This verifies the core connected browser/server journey, not every extension in the
123-section specification. See [explicit remaining work](SERVICE_WORK_DESK.md#explicit-remaining-work).
SMTP/IMAP external transport and native-client generic reads/evidence transport are
not verified. Existing module entitlement/enablement, profile capabilities, queue
membership and approval configuration still govern who can use the workflows.
