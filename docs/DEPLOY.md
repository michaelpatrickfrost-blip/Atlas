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

`scripts/deploy-vps.sh` pushes `main`, then over SSH on the VPS: takes a
private `pg_dump` backup and configured service-evidence archive in `~/backups`
(existing backups are preserved), `git pull --ff-only`, `npm ci`,
`prisma generate`, `prisma migrate deploy`, builds, restarts the `atlas`
systemd service and checks `/login`. It refuses to run with uncommitted changes. A clean detached release worktree may use `ATLAS_RELEASE_COMMIT=<full HEAD SHA> npm run deploy:vps` only after that exact commit is pushed to `origin/main`. The script verifies the pinned commit both locally and after the server pull, stopping if another release moved main. This lets a compatible reviewed release exclude concurrent unfinished edits. Login is SSH key only — no password is stored in the
repo; on a new Mac run `ssh-copy-id -i ~/.ssh/id_ed25519.pub administrator@85.190.118.218` once.
Overrides: `ATLAS_VPS_HOST`, `ATLAS_VPS_DIR`, `ATLAS_VPS_URL`.

The Mac-app procedure below is unchanged and still applies to the installed app.

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

Server deployments acquire a shared release lock and wait for an existing Next build before changing the checkout. A busy lock/build times out safely after ten minutes. Backups retain both the PostgreSQL dump and configured private service evidence (`-service-files.tar.gz`), with private file permissions.
