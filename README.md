# Atlas

> **Superseded deployment target — 3 October 2026:** The user requires Atlas
> software/UI/application runtime on the Desktop/Mac and shared user data stored
> only on the server. Remote hosting of the Atlas UI/full application and the
> hosted thin-client target below are historical, not the approved architecture.
> See AGENTS.md and .ai/ARCHITECTURE.md. Minimal secured data access must retain
> server-side tenant/capability enforcement. Current deployment compliance is unverified.


A modular ERP / business operating system. See [`AGENTS.md`](./AGENTS.md) for
the repository map and [`docs/ARCHITECTURE.md`](./docs/ARCHITECTURE.md) for
the full architecture.

## Shared project memory

Claude Code, Codex and Cursor use the same repository context. Start at
[.ai/PROJECT_MEMORY.md](.ai/PROJECT_MEMORY.md), then read the current handoff and
decisions. AGENTS.md, CLAUDE.md and .cursor/rules/atlas-memory.mdc route tools to
that shared context. Update memory with significant implementation changes; keep
parallel editing in separate Git worktrees and merge the documentation with code.

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
- [`docs/modules/SALES_CRM.md`](./docs/modules/SALES_CRM.md) — prospecting,
  pipelines, forecasting and reporting
- [`docs/DESIGN_SYSTEM.md`](./docs/DESIGN_SYSTEM.md) — visual language and UI
  primitives
- [`docs/DATA_MODEL.md`](./docs/DATA_MODEL.md) — shared entities, tenancy,
  money
- [`docs/PERMISSIONS.md`](./docs/PERMISSIONS.md) — capability/role model
