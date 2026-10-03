# Local Development (fully offline)

Atlas runs entirely on this Mac with no cloud database, Docker, or Homebrew
install required.

## The easy way: the desktop launcher

Double-click **Atlas** on the Desktop. It opens a Terminal window and runs
everything: starts a real local Postgres, applies the schema, seeds demo data
on first run, starts the dev server, and opens `http://localhost:3000` in
your browser. Leave that Terminal window open while you work; close it (or
Ctrl+C) to stop everything.

The launcher is a tiny `.app` at `~/Desktop/Atlas.app` — it just runs
`npm run dev:all` in this project directory. If you ever delete it, recreate
it with:

```bash
mkdir -p ~/Desktop/Atlas.app/Contents/MacOS
# Info.plist + launch script — see AGENTS.md or regenerate by asking an agent
# to "recreate the Atlas.app desktop launcher"
```

## The manual way

```bash
npm run dev:all
```

Does the same thing as the desktop launcher, in your current terminal.

To skip the automatic browser open (used by this environment's preview tooling):

```bash
npm run dev:all:no-open
```

## How the local database works

`embedded-postgres` bundles a real Postgres binary for this Mac (downloaded
once via `npm install`, then fully cached in `node_modules` — no network
needed afterward). `scripts/local-postgres.mjs` initialises a data directory
at `.atlas/pgdata` on first run and starts Postgres listening on
`127.0.0.1:5433`. This is a genuine Postgres server, not an emulation — the
same `prisma migrate dev`, `prisma studio`, `psql`, etc. all work against it
normally.

Data persists between runs in `.atlas/pgdata` (gitignored). To reset:

```bash
rm -rf .atlas
npm run dev:all   # re-initialises, re-pushes schema, re-seeds
```

## Running pieces individually

```bash
npm run db:local    # just the local Postgres server, foreground
npm run db:migrate  # prisma migrate dev (creates a tracked migration)
npm run db:seed     # seed demo data (Northbridge Group / demo@atlas.app / atlas-demo)
npm run dev         # just Next.js (needs the local Postgres already running)
```

## Why `db push` instead of `migrate dev` inside `dev:all`

`scripts/dev-all.mjs` uses `prisma db push` for speed and because it needs no
shadow database. For real schema changes you're committing, use
`npm run db:migrate` directly (recommended workflow, tracked under
`prisma/migrations/`) — the local Postgres here is a real server, so
`migrate dev`'s shadow-database step works fine against it too.

## Non-local / shared environments

Point `DATABASE_URL` at a real Postgres instance (see `.env.example`) and use
`npm run db:migrate` / `npm run db:seed` as documented in the main
[README](../README.md). Nothing in `src/` knows or cares whether
`DATABASE_URL` points at the embedded local server or a managed Postgres —
it's the same Prisma client and `pg` driver adapter either way.
