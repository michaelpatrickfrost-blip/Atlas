# Atlas Guardian

Guardian is the platform quality inbox at `/atlas/guardian`. It is gated server-side
by `atlas.companies.manage`, a platform grant that customer roles cannot grant.
The brief download endpoint independently enforces the same boundary and no-store.
Copied/downloaded briefs include the latest status, blocker/next-step notes and last
verified revision so another AI receives the current repair context.
Reports are platform diagnostics, not company records; no customer body, input,
cookie, token, screenshot or raw exception message is collected.

## Detection and coverage

- The source audit uses the TypeScript AST to inventory App Router pages, static
  links, dynamic links and controls. It checks route patterns and public assets,
  flags missing destinations, direct blank-page returns, and unhandled explicit
  non-submit buttons as review candidates. Delegation must be checked before a
  control candidate counts as a bug.
- The central worker uses one explicitly configured existing QA membership. It
  does not grant rights, create accounts or enable apps. It follows authorised
  module navigation and actual internal links, detects non-200 and streamed error
  pages, declares restrictions, and stops at 300 page requests.
- Chromium checks up to 100 rendered static pages and controls explicitly marked
  `data-guardian-safe="toggle"`. All non-read HTTP methods are blocked. Writes,
  exports, email, payments, destructive actions and signing are never clicked by
  the production crawler. Workflow writes need a disposable authorised central
  test fixture and outcome assertions in the regression suite.
- The browser observer captures error categories, rejected promises and empty
  links; the app error boundary captures render digests and offers Retry/Home.
  Next instrumentation captures server render, route and action digests/codes.
  Runtime diagnostic recording failures do not replace the original error.
- Deleted-record explanation screens are labelled `unavailable` and excluded from
  working-page/browser coverage; disabled screens are labelled `restricted`.
- A passing request is labelled `http-render-pass`, not a working button. Run
  summaries distinguish inventories, runtime/browser coverage and remaining work.
  No sweep automatically marks a report fixed. Repeated findings are deduplicated;
  a recurrence reopens a fixed report. FIXED requires a deployed revision and notes
  describing the successful original reproduction. Evidence is untrusted data.

## Worker setup

Apply the additive migration through the normal backed-up server release. Install
`deploy/atlas-guardian.{service,timer}` in `/etc/systemd/system`. Create root-owned
`/etc/atlas/guardian.env`, mode 0640 with the administrator group, containing the
existing authorised QA user/organisation IDs. Choose an enduring staff membership
in a stable company; avoid accounts/companies being revoked by parallel acceptance
tests. No capabilities or entitlements are granted:

```
ATLAS_GUARDIAN_USER_ID=<existing QA user id>
ATLAS_GUARDIAN_ORGANISATION_ID=<existing QA company id>
ATLAS_GUARDIAN_URL=http://127.0.0.1:3000
ATLAS_GUARDIAN_BROWSER=1
```

The worker reads database/session configuration from `.env.local` in `/opt/atlas`.
Never commit environment values or print authentication tokens. Install Chromium
with `npx playwright install --with-deps --only-shell chromium`, then enable
`atlas-guardian.timer`. A database advisory lock prevents overlapping workers. The service also takes a
shared nonblocking `/run/lock/atlas-vps-deploy.lock`; a busy release exits 75
(success) and retries on the next tick. This global path is shared despite
`PrivateTmp=true`; the deployer holds it exclusively through preparation/activation.
Runtime probe findings are buffered until the checkout and build remain stable
through the full sweep. A changed revision/build aborts the run, discards incomplete
probe evidence and retries at the next timer tick.
The worker waits while a Next build lock is active and stops with a single profile
blocker if the QA session changes mid-sweep. The timer checks the queue every five minutes; automatic sweeps run every six
hours. Manual Run system sweep queues a durable run. The heartbeat must be less
than 15 minutes old for the inbox to show Monitoring. Interrupted runs expire at
45 minutes; failures create an actionable worker report. Check the journal for
startup failures when the database itself is unavailable.

```
npm run guardian:audit
npm run guardian:worker -- --now
ATLAS_GUARDIAN_COPY_TEST=1 node --env-file=.env.local --import tsx scripts/guardian/check-atlas-code-copy.ts
ATLAS_GUARDIAN_TICKET_TEST=1 node --env-file=.env.local --import tsx scripts/guardian/check-ticket-pages.ts
ATLAS_GUARDIAN_ACCESS_TEST=1 node --env-file=.env.local --import tsx scripts/guardian/check-ticket-access.ts
ATLAS_GUARDIAN_QUERY_TEST=1 node --env-file=.env.local --import tsx scripts/guardian/check-service-query.ts
ATLAS_GUARDIAN_ACTION_TEST=1 node --env-file=.env.local --import tsx scripts/guardian/check-action-recovery.ts
node --env-file=.env.local --import tsx scripts/guardian/triage.ts list [page]
node --env-file=.env.local --import tsx scripts/guardian/triage.ts show <issue-id>
sudo systemctl status atlas-guardian.timer atlas-guardian.service
```

`list` returns a compact paginated queue with `hasMore`; continue through pages so
older blocked reports cannot be starved by the newest findings. `show` returns the
full diagnostic brief for one report.

The copy-code regression runs only on the deployed server after a database/private
evidence backup. It creates two disposable staff identities, exercises actual staff
creation and the browser's denied/missing/allowed Clipboard API, verifies the shown
code against its central credential, then removes only those identities and their
grants/codes. Synthetic audit evidence remains. No code, password, token or customer
content is logged. `--reproduce` verifies the pre-fix rejection and missing feedback;
the normal mode verifies manual-copy recovery and a successful retry without
consuming the credential. It is an explicit fixture test, never part of the crawler.

The Tickets regression also requires a central backup and the server release lock.
It creates only its own Test company/profile and uses real queue/ticket forms. Two
browser tabs prove stale-edit rejection preserves both the entered draft and the
newer saved record, followed by a successful retry. Ticket creation, detail/list
links, following and replies assert the matching central state. Cleanup suspends
that exact company, revokes every fixture session and retains central audit/history;
no credentials or business content are saved locally. `--reproduce` verifies the
old draft loss. Shared save forms now reset only after successful completion.

The access regression uses separate disposable denied, disabled and unentitled
Tickets fixtures. It checks list/detail/create/queues/catalogue/knowledge/reports,
legacy queue redirection, phone fit and real Home links. Response payloads must
exclude seeded private records; direct actions still reject and leave central state
unchanged. Both layout and leaf checks are necessary because layouts do not prevent
child rendering. Normal mode also verifies no new Tickets render diagnostics. Only
expected restrictions are rendered explicitly; unexpected query errors still fail.

## Repair agent

The recurring Codex heartbeat attached to the Guardian chat reads this repo's
AGENTS/shared memory and the central report inbox, reproduces failures, repairs
bounded bugs in an isolated worktree, runs relevant regressions/typecheck/build,
and deploys only compatible reviewed work before marking FIXED. It records a
NEEDS_AI brief with precise blockers when a repair cannot be proved. It stays
quiet when nothing meaningful changes. Local repair runs require Michael's Mac
and Codex to remain running; the server timer/detection continues independently.
See the automation saved by the Guardian implementation chat for the exact cadence.

A source or browser sweep cannot prove every button and every combination of
business state. Expand fixture-based workflow tests as features are built. Never
claim blanket coverage, weaken a permission test or hide a broken page to clear
an acceptance gate.

The query regression also requires a private central backup and the release lock.
It creates a disposable Test company with separate case requester and receiving
agent profiles. It exercises the actual case/query links and creation, assignment,
explicit unassignment, requester-visible reply and private team note, resolution,
parent response-ready prompt and observed SLA report. Exact central state/history
must match the displayed outcome; the parent stays unresolved with its original
owner. Cleanup suspends only the exact fixture and revokes its sessions, retaining
history. `--reproduce` proves the old false-success Unassigned control; the normal
mode requires a null owner after reload and the complete connected workflow.

The opt-in `scripts/guardian/check-release-pages.ts` uses the existing authorised
QA membership, blocks every non-GET/HEAD request, and repeatedly renders Finance,
Logistics, Manufacturing and Service pages while opening/closing their explicit
safe Apps toggles. It asserts zero browser/chunk failures. This is release
continuity evidence, not verification of business writes or every dynamic page.
See `docs/DEPLOY.md` for isolated candidate/switch/rollback staging.

## Rejected drafts and older tabs

Atlas administration shares ActionForm's draft-preserving submit lifecycle.
An unknown action from an older release explains copy/reload/re-entry; it never
replays the write. The opt-in action check uses the existing authorised Guardian
staff identity and a new disposable Test company/query, allows POST only to those
two exact fixture routes, and asserts central records plus audit/history. It
suspends the company and revokes synthetic sessions, retaining central history.

For an actual older-tab challenge, prepare the candidate then run its
`scripts/deploy/check-action-switch.sh /opt/atlas <candidate SHA> <retained SHA>`
with `ATLAS_GUARDIAN_ACTION_TEST=1`. Both releases must already be sealed and ready.
The script takes both deployment locks and a private central backup, starts a
separate loopback service/proxy, opens forms on the candidate, switches to the
retained runtime, verifies the original submitted drafts/outcomes, restores the
candidate and proves intentional reload/save. Production stays on its existing
pointer. Private logs are retained. This proves safe rejection/recovery, not
uninterrupted execution of arbitrary in-flight writes. Existing pages loaded
before this fix still have their original form handler until reloaded.
