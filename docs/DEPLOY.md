# Deploying Atlas

Michael’s latest instruction (7 October 2026): always deploy finished Atlas changes
to the live server at https://atlassystem.online (85.190.118.218), then verify the
changed feature. This supersedes earlier Mac-only/data-only-server requirements.
Preserve data, backups, secrets, tenant/capability checks and existing permissions.
A Mac installation alone is insufficient. The Mac procedure below is optional
additional packaging, not a substitute for server deployment.

## Server deployment — current required target

Commit the reviewed compatible changes on main, then:

```bash
npm run deploy:vps
```

When main contains another contributor's unfinished committed work, create a
`codex/` release branch from the exact currently live revision and apply only the
reviewed change and its shared-memory updates. Pin that branch explicitly:

```bash
ATLAS_RELEASE_BRANCH=codex/home-menu-release ATLAS_RELEASE_COMMIT=$(git rev-parse HEAD) npm run deploy:vps
```

This opt-in path keeps the same remote-tip SHA check, server ancestry check,
locks, backups, immutable build, smoke tests and rollback behavior. The source
branch must match the local checkout and the exact pinned commit. Merge the
release branch and evidence back into main without deploying unrelated work;
future main must include the deployed branch so the server can fast-forward.
Do not rewrite the server checkout or bypass a moved-tip check.

`scripts/deploy-vps.sh` pushes the reviewed pinned revision, then invokes the
checked-in `scripts/deploy/vps-release.sh` over key-only SSH. A clean detached
worktree uses `ATLAS_RELEASE_COMMIT=<full HEAD SHA>` after pushing that exact
commit to `origin/main`. Main moving causes a safe stop for review.

For People releases, set `ATLAS_RELEASE_ACCEPTANCE=people` on prepare/activation.
The checked-in People harness verifies real central Test workflows against the
smoke candidate before switching and against public HTTPS before completion,
under the same release locks. Existing backup/ancestry/immutability/rollback gates
still apply; a failure before switching leaves production unchanged, and a public
failure follows the normal runtime rollback. Synthetic companies are suspended
and sessions revoked; audited history is retained. This prevents another release
interleaving between final feature acceptance and activation. The default is none.

For the Dashboard/Messages release use `ATLAS_RELEASE_ACCEPTANCE=dashboards`.
The checked-in harness runs Dashboard, Home/business-navigation, Reports/Finance,
typography and Messages against the sealed candidate, then repeats all five on
public HTTPS under the same locks. Revision checks bracket both runs. Only
synthetic personal boards/chat fixtures are written; underlying source records
are read-only, explicit exports audited, and fixtures cleaned/retired in finally.
It keeps the same preparation, backup, compatibility and runtime rollback gates.

For the Manufacturing & Supply console, use `ATLAS_RELEASE_ACCEPTANCE=supply`
with the pinned scoped branch. Its existing central Test checker runs against the
sealed smoke candidate and publicly before completion, under this same lock pair.
Both fixture stages take their own database/private-file backup. The original
clean-tree/pinned push, remote-tip, ancestry, compatibility, immutability, smoke and
rollback gates remain; public failure restores the previous runtime without a
database rollback. This prevents another release overtaking final acceptance.
Use activate (the default) to complete the whole checked sequence in one run:

```bash
ATLAS_RELEASE_BRANCH=codex/manufacturing-supply-console ATLAS_RELEASE_COMMIT=$(git rev-parse HEAD) ATLAS_RELEASE_ACCEPTANCE=supply npm run deploy:vps
```

The server backs up PostgreSQL and configured private Service files into
`~/backups`, then installs, generates, applies compatible migrations and builds in
`/opt/atlas-releases/<revision>`. It never installs/builds over the running tree.
Each release has its own dependencies, generated client, build and retained old
hashed browser assets. Runtime files are root-owned; only disposable `.next/cache`
is writable. `.env.local` links to the existing central configuration; private
Service evidence stays at its existing absolute path (`/opt/atlas/shared/service-files`
on this VPS) or another external persistent path, always outside releases. No business data is
copied into a release. Existing backups and previous releases are retained.

Before first activation, prepare and test the actual candidate and rollback:

```bash
ATLAS_RELEASE_MODE=prepare ATLAS_RELEASE_COMMIT=<full SHA> npm run deploy:vps
ssh administrator@85.190.118.218 'ATLAS_GUARDIAN_RELEASE_TEST=1 bash /opt/atlas-releases/<full SHA>/scripts/deploy/check-release-switch.sh /opt/atlas <full SHA>'
ATLAS_RELEASE_COMMIT=<full SHA> npm run deploy:vps
```

Prepare smoke-tests the sealed candidate on loopback 3011 without changing the
production pointer/service. The opt-in staging script starts a separate temporary
loopback service/proxy, continuously checks authorised pages and Apps menus with
all writes blocked, switches old → candidate → old, and asserts both runtimes
remain immutable. It cleans up its service/proxy and retains private test logs.
It uses the existing Guardian QA membership, never creates/grants an account.

Also challenge forms opened on the candidate across an actual different runtime:

```bash
ssh administrator@85.190.118.218 'ATLAS_GUARDIAN_ACTION_TEST=1 bash /opt/atlas-releases/<candidate SHA>/scripts/deploy/check-action-switch.sh /opt/atlas <candidate SHA> <retained SHA>'
```

This explicitly authorised Test fixture check backs up central data and verifies
rejected drafts, no automatic POST replay, exact unchanged records, and intentional
reload/re-entry/save after restoring the candidate. It reuses existing Guardian
staff rights, retires synthetic access and leaves the production pointer unchanged.

For the Customers/CRM/Sales/Marketing refinement, exercise the actual commercial
forms and responsive layouts on a sealed candidate before activation:

Set `ATLAS_RELEASE_ACCEPTANCE=commercial` to run the checked-in commercial checker
on the candidate and public HTTPS in one deployment, holding both existing locks
through activation. Each run takes its own central fixture backup and verifies
the exact revision, including Customer Actions/Manage Record layering at three
viewport sizes. Existing rollback, source, compatibility and immutability gates
remain. This prevents concurrent releases moving between feature checks and activation.
The separate candidate-only command below remains available.

```bash
ssh administrator@85.190.118.218 'ATLAS_COMMERCIAL_CHECK=1 bash /opt/atlas-releases/<candidate SHA>/scripts/deploy/check-commercial-workspaces.sh /opt/atlas <candidate SHA>'
```

This check holds both release locks, takes a central backup, starts a temporary
loopback service and creates isolated central Test companies with manager, reader
and rep profiles. It checks selected-customer hierarchy, shared/private notes,
appointment lifecycle and isolation, visual journey editing, automation versions
and desktop/tablet/phone layouts. External calls and background writes are blocked.
Only its exact Test access is revoked; records and audit remain. The temporary
service is removed and the production pointer must remain unchanged. Repeat
`scripts/check-commercial-workspaces.ts` against public HTTPS after activation,
with the exact release environment and `ATLAS_TEST_REVISION` set; retain evidence
in CURRENT_STATE.md. No existing business company is used for fixture writes.

The first transition from the old npm launcher sends SIGTERM to its entire process
group so the Next child can drain; later direct-Node releases use mixed kill mode.

Activation uses an atomic `/opt/atlas-current` symlink and graceful direct-Node
systemd restart. `/api/health/release` must report the exact SHA before completion.
Failure after switching restores the previous runtime; **database migrations are
never rolled back**. Only backward-compatible reviewed migrations may be released.
`/opt/atlas-previous` retains the rollback target. To restore it, hold both release
locks, atomically change `atlas-current` with `release-files.mjs link`, restart
Atlas, check login/revision and prove the affected workflow. Control checkout HEAD
may remain newer after rollback; review it before another release.

The control checkout remains `/opt/atlas` for Guardian/operator commands. Its
`node_modules`, `.next` and generated Prisma client link through `atlas-current`.
Original mutable directories are preserved in `/opt/atlas-maintenance-backups`.
**Do not run npm ci, Prisma generation or a build in the control checkout.** Build
only a fresh release through the deployer; stale in-place writes fail permissions.

Deploy/staging acquire exclusive `/tmp/atlas-vps-deploy.lock` (legacy acceptance
compatibility) and `/run/lock/atlas-vps-deploy.lock`. Guardian's systemd service
uses a shared nonblocking global lock, exits successfully with 75 when busy and
retries on its next timer tick. `/run/lock` is essential because Guardian has
`PrivateTmp=true`. Activation preserves the timer's previous active state.

Caddy retries connection gaps for up to five seconds, using its default safe
request retry policy; no POST replay is enabled. Next's `NEXT_DEPLOYMENT_ID` handles
navigation version changes and old static assets stay available. See installed
Next `deploymentId.md` and [Caddy reverse_proxy documentation](https://caddyserver.com/docs/caddyfile/directives/reverse_proxy).
This is an isolated-build deployment with graceful restart, **not a guarantee of
uninterrupted in-flight business writes**. Verify read-only continuity plus actual
connected fixture workflows after activation. Login alone is insufficient.

Login is SSH key only; no password is stored in the repo. On a new Mac run
`ssh-copy-id -i ~/.ssh/id_ed25519.pub administrator@85.190.118.218` once.
Overrides: `ATLAS_VPS_HOST`, `ATLAS_VPS_DIR`, `ATLAS_VPS_URL`.

The Mac-app procedure below is unchanged and still applies to the installed app.

## When candidate installation stops with ENOSPC

Check free space and the private stage log before retrying; a stopped installation
is not a deployed release. Preserve the active/rollback runtime, central records,
private files, backups and deployment evidence. Under both existing release locks,
only disposable package/incremental compiler caches and positively identified failed
candidate build/dependency outputs may be reclaimed. Retain failed candidate source
and readiness history in maintenance backups; never follow environment/storage
symlinks. Keep inactive ready releases' source, dependencies, compiled server/static
assets and markers intact when reclaiming only their Turbopack compiler cache.
Open an existing lock without recreating/truncating it when Linux protected regular
files reject a root write-open; use exclusive flock on the same inode. Do not weaken
locks or filesystem protections. Retry the normal pinned build and full acceptance.

10 October Studio recovery retained failed source for 6d2f5a9/36c211b/bef1a40 and
reclaimed 22 inactive incremental compiler caches, preserving current f5bb914 and
rollback 64361cb. Free space reached 16G and public health stayed exact. Inventory is
`/opt/atlas-maintenance-backups/studio-inactive-compiler-cache-reclaim-20261010.txt`;
full evidence is in the Studio implementation ledger. No business data/backups removed.

## Additional Mac package (when needed)

```bash
npm run build                          # must succeed first — catches most problems cheaply
scripts/deploy-mac-client.sh <short-name>
```

`<short-name>` is a short label for this release (e.g. `customer-relationships`),
used to name the backup of the previous build. That's it for a normal deploy:
the script builds, signs, quits the running app, swaps
`/Users/michael/Applications/Atlas.app`, relaunches it and confirms it serves
`/login`. The previous build is kept alongside it as
`Atlas-before-<short-name>-<timestamp>.app` — never deleted by the script, safe
to remove manually once you've confirmed the new one is good.

## When it fails at the schema gate

`scripts/build-mac-client.sh` (called by `deploy-mac-client.sh`) runs
`scripts/check-release-schema.mjs` before anything else. That script SSHes into
the shared central database (`$ATLAS_SCHEMA_CHECK_HOST`, default
`root@217.154.51.15`) and compares its actual columns against every model in
`prisma/schema.prisma`. If it prints `Missing <table>.<column>` lines and exits
1, **the remote database is missing a migration that local schema.prisma
already assumes** — almost always because another session added
models/migrations locally but never applied them centrally. This is normal in
a multi-agent repo; it is not something to work around by editing the schema
check.

Fix it, then redeploy:

```bash
scripts/apply-central-migrations.sh
npm run build
scripts/deploy-mac-client.sh <short-name>
```

`apply-central-migrations.sh`:
1. reads the remote DB connection details over SSH,
2. takes a `pg_dump` backup on the remote host first (`/opt/atlas-test/backups/pre-migration-<timestamp>.sql.gz`),
3. opens a local SSH tunnel and runs `prisma migrate status` against the real remote database so you see exactly what's pending,
4. **stops and asks for confirmation** before applying anything,
5. runs `prisma migrate deploy` (the production-safe Prisma command — applies pending migrations in order, never resets/diffs),
6. re-runs the schema check so you know it's actually fixed.

Before confirming the prompt in step 4, read the pending migrations' `.sql`
files under `prisma/migrations/`. This hits the live shared database other
people and sessions are using right now:
- **Safe to apply without asking further**: `CREATE TABLE`, `CREATE TYPE`,
  `ALTER TABLE ... ADD COLUMN`, `CREATE INDEX`, additive `UPDATE`s like
  granting a new capability to a role.
- **Stop and ask the user first**: anything with `DROP TABLE`, `DROP COLUMN`,
  `TRUNCATE`, or a destructive `UPDATE`/`DELETE` touching existing rows. These
  are exactly the hard-to-reverse, shared-system actions that need explicit
  sign-off before running, backup or not.

If a migration is someone else's uncommitted, in-progress work and you don't
know whether it's finished, say so and ask before applying it — a migration
only needs to be structurally safe (additive) to apply without asking; it
doesn't need to be "yours."

## When the build itself fails (typecheck/lint/compile errors)

This is a shared, actively-edited repository — `npm run build` can fail on
code a concurrent session touched, unrelated to what you changed. Before
assuming you broke it:
1. `npx tsc --noEmit` to get a clean list of type errors with file:line.
2. Check whether the error is in a file you touched. If not, it's very likely
   a half-finished concurrent edit — fix it narrowly (don't refactor around
   it) so the build is green, or re-run the typecheck a moment later in case
   the other session is mid-edit and about to fix it themselves.
3. Re-run `npx tsc --noEmit` after any fix — don't proceed on an assumption.

## Verifying after deploy

The script already confirms `/login` returns 200. For anything you changed,
actually click through it in the installed app (or the dev preview first via
`npm run dev:all` / the `atlas-dev` preview config in `.claude/launch.json`) —
a 200 on `/login` proves the app started, not that your feature works.

## When another session's unfinished schema blocks the gate

If the gate reports tables that belong to someone's uncommitted schema edit with no
migration yet, do not apply or bypass anything. Build the release from a clean
snapshot instead: `git worktree add --detach ~/Library/Caches/atlas-release-wt HEAD`,
copy in your own uncommitted files, `cp -cR node_modules` into it (an APFS clone),
and run `scripts/deploy-mac-client.sh` from there. To apply one committed additive
migration while an unfinished one is also pending, run `prisma migrate deploy` from
a scratch copy of `prisma/` that leaves the unfinished migration out.

## Atlas in the browser

`scripts/install-browser-launcher.sh` installs `~/Applications/Atlas in Browser.app`
with a Desktop link. It starts the installed Atlas runtime (by opening Atlas.app in
the background) when it is not already serving, then opens
`http://127.0.0.1:13200/home` in the default browser. Same local software, same
central data. Quitting Atlas.app stops the server; click the button again.

## Release safeguards

- Keep shared credentials out of client packages and source control.
- Never use migrate dev, db push or reset against the live database.
- Back up before migrations and inspect pending changes; preserve records.
- Do not include unrelated unfinished work merely to clear the release gate.

Server deployments acquire exclusive release locks and wait for an existing Next build before preparing a candidate. A busy lock/build times out safely after ten minutes. Backups retain both the PostgreSQL dump and configured private service evidence (`-service-files.tar.gz`), with private file permissions.

## Studio release checks

Candidate preparation and activation run `scripts/studio/check-compatibility.ts`
against all active dependency metadata before claiming release compatibility. A
missing, changed or expired registered contract blocks release. Ordinary runtime
reads also recheck tenant/module/permission boundaries. Metadata migration is
additive; database rollback is not part of release rollback.

Run `ATLAS_STUDIO_LIVE_TEST=1` with the existing server environment and
`scripts/studio/check-metadata.ts` against the prepared loopback candidate, then
the live URL. It creates isolated central Test-company configuration, exercises
real services and Admin forms and suspends its exact fixture companies afterward.
An isolated Test-company business user is created through the real Admin form to
verify provisioning and company login/recovery. No staff grants or existing
identities change; fixture companies are suspended and audit history retained.

### Build-stage failures — 9 October 2026

Candidate preparation runs `scripts/deploy/build-release.sh` in an independent
shell. An outer OR handler must not suppress `set -e` during installation,
generation, migration, build or Studio compatibility checks. Readiness is written
only after all stages and nonempty BUILD_ID/server manifest checks. Failure keeps
the live pointer unchanged and retains the candidate/logs for review. Six injected
stage failures and a successful preparation are covered in
`tests/release-build-gate.test.ts`. Never activate a ready marker alone.

Atlas bundles the same Plus Jakarta Sans and Geist Mono families from the pinned
official Google Fonts source with SIL OFL licences in `src/app/fonts/`. The
`next/font/local` path avoids Google CSS/font-query parsing during release builds;
full variable character coverage and existing font variables are retained.
## Private Admin entry acceptance — 9 October 2026

After preparing the backed-up candidate, run `scripts/check-private-admin-login.ts`
on the server with the existing `.env.local` and `/etc/atlas/guardian.env`,
`ATLAS_PRIVATE_ADMIN_TEST=1` and
`ATLAS_PRIVATE_ADMIN_TEST_URL` set to the loopback candidate, then repeat on public
HTTPS after activation. It uses existing Guardian staff for console GETs/sign-out,
creates one isolated central Test-company customer for real login/denial/recovery
checks, tests concurrent central counters and expires only its own counter keys.
It changes no existing password or staff grant. Its exact Test company is suspended
and sessions/recovery invalidated afterward; fixture history is retained.

Check retired/anonymous Admin URLs return 404 without private-address disclosure,
public customer login has no Admin link, `/19811171adminlogin` and recovery carry
noindex metadata/headers and no-referrer/no-store, mobile/desktop controls work,
customer credentials cannot enter Admin and repeated login is blocked. Existing
staff console/Team/Studio/Connections and sign-out must still work. Correct staff
password branching is unit-verified; this runner uses an existing signed QA staff
session and does not claim to test Michael's unknown password.

Studio release compatibility scans preserve missing/changed/expired-contract gates
for all real companies and active Test companies. Suspended Test companies retain
immutable acceptance history and are excluded from runtime dependency checks;
reactivating them restores the checks. Do not resolve a gate by deleting history,
changing a real company's status or clearing another contributor's active pointers.

## Company Settings release acceptance

Use ATLAS_RELEASE_ACCEPTANCE=settings with the exact pinned scoped release.
The locked deployer runs check-company-settings.ts and Home/Apps verification on
the sealed candidate, then public HTTPS, with exact SHA checks bracketing both.
Only synthetic central Test-company identities/profiles/settings are mutated;
finally suspends companies/revokes sessions and retains audit history. No email
transport is invoked. Existing backups/ancestry/compatibility/seal/rollback gates
and other feature acceptance modes remain. Private evidence is printed per stage.

## Studio combined acceptance under release locks

For a reviewed scoped Studio checkpoint, set `ATLAS_RELEASE_ACCEPTANCE=studio`
on the pinned deploy. The existing deployer runs `check-studio-release.sh` on its
sealed candidate before switching and on exact public HTTPS before completion,
while retaining the original release locks and normal rollback behavior. It uses
the existing metadata/fields/owner/principal checker plus Home, Reports, real MRP,
Messages, private Admin, Manufacturing/Supply, commercial and People checks.
Fixture writes are isolated central Test companies with backups before each phase;
existing business records and QA identity/profile grants are preserved. No local
business database or new permission system. Default/People/Supply selectors retain
their behavior. Candidate/public evidence stays private in reported /tmp paths.
A partial checkpoint acceptance is not the full Phase 2 gate or visual builder.


The combined Studio acceptance also preserves and exercises the accepted Company
Settings/profile workflow through its checked-in native checker, with a separate
private fixture backup. Field review archive checks run inside the Studio exact-
Test principal driver; they verify storage guards, not an unimplemented migration
preview or conversion engine. All existing closed release selectors are retained.

For the assigned task pop-out, use `ATLAS_RELEASE_ACCEPTANCE=tasks`. The checked-in
central QA harness tests notes, linked records, assigned-only filtering, guarded
completion and persisted status at 320/390/820/1448 widths on candidate and public
HTTPS under the same locks. Each stage backs up central data/private evidence.
Only its synthetic tasks are written, and retained canceled at cleanup. Existing
backup, immutable release, revision checks and rollback gates apply.
