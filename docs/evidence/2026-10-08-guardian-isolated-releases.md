# Guardian isolated release verification — 8 October 2026

Runtime: `6ef3cdf566517aaaac5a42856703934c2ff4c8c3` at https://atlassystem.online.
Control entrypoint remains `/opt/atlas`; active systemd PID cwd is the exact sealed
release. Public `/api/health/release` reports the SHA, no-store, without other data.

## Failure and repair

The old deployer replaced running node_modules and .next. Private journal at
14:43:54/14:44:27 UTC matched undigested company/reset-password reports to missing
build static /500 files; historic Service digests matched client-manifest gaps.
Guardian sweeps repeatedly aborted when revision/build changed underneath them.

The deployer now creates separate immutable versioned runtimes, backs up central
PostgreSQL/private evidence before compatible migrations, retains old browser
chunks, smoke-tests the sealed candidate, and changes an atomic pointer only at
activation. Health failure restores the previous runtime, never database state.
Central environment/private attachments remain at their original absolute paths.
Only Next disposable cache is writable. Operator commands must not build in the
control checkout; original mutable directories were preserved outside it.

Deploy uses exclusive legacy /tmp and global /run/lock locks. Guardian takes the
global shared nonblocking lock despite PrivateTmp; a conflict is successful exit
75 and the next timer retries. No grant, tenant guard or business schema changed.

## Checks actually run

- Final combined local suite: 959 pass / 22 integration skips, 151 files pass / 3
  skip. Six new filesystem/health tests cover atomic switch, rollback, incomplete
  target, unfinished directory preservation, old asset retention and strict public
  health identity. Separate strict TypeScript, scoped ESLint, shell syntax,
  whitespace and production build pass. Final script edits reran relevant checks.
- Initial separate build live continuity: 215 page requests / 215 Apps toggles,
  zero browser/chunk errors. Initial direct-Node staged switch/rollback: 40 / 40.
- Final loopback staging `/tmp/atlas-release-switch-BOTcDf`: actual legacy npm
  service -> candidate Node service -> previous Node runtime, continuously checked
  through a separate Caddy proxy. 20 page requests / 20 Apps toggles pass; both
  releases remain root-owned/immutable. Production pointer never changed by staging.
- Final live probe across separate builds and activation: **425 page requests /
  425 Apps toggles, zero browser/chunk failures**. Finance, Logistics,
  Manufacturing and Service queries/reports checked; all non-GET/HEAD blocked.
  Successful full page/menu cycle after activation explicitly awaited.
- Final live Service fixture: linked query creation and list/detail, exact agent
  assignment/unassignment/history, requester reply/first-response, private notes,
  resolution/safe parent prompt, original case state and reports all pass. Exact
  synthetic company suspended and sessions revoked; central audit retained.
- Final live read-only reset-password form/backlink, authorised company account
  pattern and repeated CSAT/team renders pass. Original private company URL was
  absent, so pattern proof does not close the historic original-record report.
- Final worker run `cmuzoxyy500009dd5t0ja47my` COMPLETED on 6ef3cdf: 240 HTTP,
  2 declared unavailable, 0 findings, 100 rendered browser pages, 99 safe toggles,
  0 browser failures. 102 routes beyond browser cap. Inventory of 1130 source
  files/634 links/848 controls is not working-button verification.
- Installed Guardian conflict test returns Result=success/ExecMainStatus=75 under
  exclusive global lock; Atlas and timer active. Public health/PID cwd exact,
  old hashed JS request 200, previous runtime retained, control checkout clean,
  private .env 0600 and evidence directory 0700 unchanged.

## Failures retained and limits

First prepare stopped on /opt creation privileges and then the existing dedicated
shared evidence directory; neither changed the running files. Narrow privilege
operations and storage guard corrected these. First production migration probe
reported TimeoutError: journal 15:17:33 shows the npm parent exiting and its Next
child SIGKILLed, with new Node ready 15:17:34. Original failed request context is
absent, so that timing is evidence rather than exact request attribution. Added
whole-group legacy SIGTERM and explicitly tested it in final staging. Subsequent
production switch passed the continuous probe. Revised harness briefly failed
before running because installed Caddy lacks persist_config; removed unsupported
option, kept per-run XDG isolation, then fully reran staging.

A separate team render at 15:17:59 (digest 4138332578) followed a missing Server
Action log at 15:17:58 and closed stream errors. Fresh pages pass; original older
browser/control/action context is missing. It remains NEEDS_AI: next reproduce
with an authorised disposable form open across deployment, assert recovery/draft
and central state, and never automatically replay business writes. Historical
Service/dynamic company and unknown cancellations also remain unresolved when
original reproduction identity is absent. No errors were suppressed or screens hidden.

Deployment reliability, exact reset-password render and worker-overlap reports
were marked FIXED only after final deployed verification. All three refreshed
queue pages read; 62 active reports remain with NEEDS_AI context, including
unproved deliberate-guard candidates. No expected rejection was guessed away.
Anonymous staff inbox request redirects to sign-in (307). This does not promise
uninterrupted in-flight mutations, every business workflow or every dynamic page.

## Backups and retained runtime

Private PostgreSQL and evidence backups under administrator backups:
`atlas-pre-deploy-20261008-151327`, `151729`, `152043`, `152451`, `152744`.
All retained, private modes checked. 99 migrations current; none introduced here.
Previous 6028b1f and bootstrap d226ef8 retained alongside unactivated prepared
candidates. No automatic deletion, database rollback or evidence move occurred.
See `docs/DEPLOY.md` for preparation, staging, activation and operator rollback.
