# Atlas

A modular ERP / business operating system. See [`AGENTS.md`](./AGENTS.md) for
the repository map and [`docs/ARCHITECTURE.md`](./docs/ARCHITECTURE.md) for
the full architecture.

## Getting started (offline, on this Mac)

```bash
npm install
npm run dev:all
```

That's it — no Docker, no Homebrew, no cloud database. This starts a real
local Postgres, applies the schema, seeds demo data, and opens the app. Or
just double-click **Atlas** on the Desktop. See
[`docs/LOCAL_DEVELOPMENT.md`](./docs/LOCAL_DEVELOPMENT.md).

Sign in with the seeded demo account: `demo@atlas.app` / `atlas-demo`.

## Getting started (shared Postgres)

```bash
npm install
cp .env.example .env   # set DATABASE_URL to a reachable Postgres instance
npm run db:migrate
npm run db:seed
npm run dev
```

## Commands

```bash
npm run dev          # start the dev server
npm run build        # production build
npm run lint          # eslint
npx tsc --noEmit      # typecheck
npm test              # unit tests (vitest)
```

## Documentation

- [`docs/LOCAL_DEVELOPMENT.md`](./docs/LOCAL_DEVELOPMENT.md) — running fully
  offline on this Mac
- [`docs/ARCHITECTURE.md`](./docs/ARCHITECTURE.md) — Core + Modules, request
  flow, multi-tenancy, events
- [`docs/MODULE_SPEC.md`](./docs/MODULE_SPEC.md) — how to build a new module
- [`docs/CUSTOMER_MASTER.md`](./docs/CUSTOMER_MASTER.md) — the canonical
  customer identity (Customer 360)
- [`docs/DESIGN_SYSTEM.md`](./docs/DESIGN_SYSTEM.md) — visual language and UI
  primitives
- [`docs/DATA_MODEL.md`](./docs/DATA_MODEL.md) — shared entities, tenancy,
  money
- [`docs/PERMISSIONS.md`](./docs/PERMISSIONS.md) — capability/role model
