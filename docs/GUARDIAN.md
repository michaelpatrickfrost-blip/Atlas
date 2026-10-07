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
`atlas-guardian.timer`. A database advisory lock prevents overlapping workers.
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
node --env-file=.env.local --import tsx scripts/guardian/triage.ts list [page]
node --env-file=.env.local --import tsx scripts/guardian/triage.ts show <issue-id>
sudo systemctl status atlas-guardian.timer atlas-guardian.service
```

`list` returns a compact paginated queue with `hasMore`; continue through pages so
older blocked reports cannot be starved by the newest findings. `show` returns the
full diagnostic brief for one report.

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
