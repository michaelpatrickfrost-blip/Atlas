<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Shared project memory

The repository itself is the shared memory for Codex, Claude Code and Cursor.
Before planning, reviewing or changing Atlas:

1. Read `.ai/PROJECT_MEMORY.md` and `.ai/CURRENT_STATE.md`.
2. Read `.ai/DECISIONS.md` and the relevant topic guides linked from memory.
3. Inspect the actual implementation and Git diff before proposing changes.
4. Follow this file's architecture, security and verification rules.

## Mandatory memory update gate

Every task that changes tracked project content (code, schema, configuration,
scripts, dependencies, UI, documentation or agent instructions) MUST update
`.ai/CURRENT_STATE.md` before the final handoff, commit or pull request. This
includes small fixes and unfinished/blocked work; do not wait for a major feature.
Read-only tasks must update memory when they uncover a new confirmed issue,
correct a stale fact or establish a lasting decision. Pure questions need no update.

Before handing back changed work:

1. Review the task's final diff and reconcile affected shared documentation.
2. Update CURRENT_STATE.md: date, what changed, relevant paths, checks actually
   run and results (or explicitly not run), blockers and next step.
3. Record lasting decisions with rationale in `.ai/DECISIONS.md`; update
   `.ai/PROJECT_MEMORY.md` only when enduring product/context changes.
4. Update relevant topic docs and delivery checkpoints when behaviour changes;
   remove or supersede stale claims rather than keeping contradictory entries.
5. Include memory changes with the implementation in the same handoff/commit/PR,
   and identify the memory update in the final response. If it could not be saved,
   state why and do not claim the handoff is complete.

Keep updates concise and factual. A memory-only task records its own change once;
it does not require recursive updates. Preserve concurrent contributors' entries.

Never claim a check passed unless it was run; distinguish implemented, documented,
verified and planned work. Correct stale documentation when code contradicts it,
while reporting unintended code violations rather than silently blessing them.
Do not keep essential project knowledge only in chat or tool-specific memory.
Do not overwrite another contributor's changes. For parallel editing, use separate
Git worktrees and merge the memory updates with the implementation. Never store
secrets, tokens, private customer data or environment credentials in memory.

# Atlas

Modular ERP/business-OS. Core owns platform concerns; modules own business capabilities.
Read `docs/ARCHITECTURE.md` for the full picture. This file is a map, not a textbook.

## Key directories

- `src/core/` — platform: auth (`auth/`), permissions (`permissions/`), the module
  registry and runtime (`modules/`), events (`events/`), audit (`audit/`), activity
  (`activity/`), attention aggregation (`attention/`), search aggregation (`search/`),
  **Customer Master** (`customers/` — the canonical customer identity; see
  `docs/CUSTOMER_MASTER.md`), the Prisma client singleton (`db/`), shared value types
  (`shared/`).
- `src/modules/<module-id>/` — one directory per module (manifest, domain/services,
  pages). `src/modules/sales/` is the reference implementation — copy its shape for
  a new module. `src/modules/stubs.ts` lists future modules not yet built.
- `src/app/(app)/customers/` — Customer Master's own routes (list, quick-create,
  5-tab record page). Not under any module's route tree — Customer Master is Core.
- `src/app/(app)/` — authenticated routes, wrapped by the shell (sidebar/topbar/⌘K).
- `src/app/(auth)/` — sign-in.
- `src/components/ui/` — design system primitives (Button, Card, DataTable, StatusPill,
  EmptyState). `src/components/shell/` — sidebar, topbar, command palette.
- `prisma/schema.prisma` — the one data model, shared across modules. `prisma/seed.ts`
  — demo organisation/data.
- `docs/` — ARCHITECTURE, MODULE_SPEC (read before building a module),
  CUSTOMER_MASTER, DESIGN_SYSTEM, DATA_MODEL, PERMISSIONS, LOCAL_DEVELOPMENT.
  `docs/modules/` — per-module architecture docs (e.g. SALES_CRM.md).

## Module rule

**Never build a new module's business entity as a standalone "Customer"/"Product"
copy.** Attach to the shared `Party` (Customer Master — see
`docs/CUSTOMER_MASTER.md` and `docs/DATA_MODEL.md`). A module may add its own
tables (like Sales' `Opportunity`, `Quote`), but relates them to `Party` rather
than re-inventing a customer concept. If the module should show on a customer's
record, implement `customerOverviewProvider` — don't add routes under
`src/app/(app)/customers/`, which belongs to Core.

Core (`src/core/**`) must never import from `src/modules/**`. Modules register
themselves into `src/core/modules/registry.ts` — that's the only wiring point.

## Canonical commands

```bash
npm run dev:all       # fully offline: local Postgres + schema + seed + dev server + browser
                       # (or double-click Atlas.app on the Desktop — see docs/LOCAL_DEVELOPMENT.md)
npm run dev            # just the app (needs DATABASE_URL pointing at a running Postgres)
npm run build          # production build; must succeed before calling work done
npm run lint            # eslint
npx tsc --noEmit        # typecheck
npm test                # vitest
npm run db:migrate      # prisma migrate dev (requires a reachable Postgres)
npm run db:seed         # seed the demo organisation (Northbridge Group / demo@atlas.app / atlas-demo)
```

## Conventions that differ from defaults

- Prisma 7: import the client from `@/generated/prisma/client`, not
  `@/generated/prisma` (no barrel file). The client requires an explicit driver
  adapter (`@prisma/adapter-pg`) — see `src/core/db/client.ts`.
- Capabilities are strings (`<module>.<entity>.<action>`), never hardcoded role
  checks (`if (role === "admin")`). See `docs/PERMISSIONS.md`.
- Server actions that mutate data must call `requireSession()` then
  `assertCapability()` as their first two lines.

## Security boundaries

- Tenant (`organisationId`) scoping happens server-side, in every query — never
  trust a client-supplied organisation id.
- Session is a signed JWT in an httpOnly cookie (`src/core/auth/session.ts`).
- See `docs/PERMISSIONS.md` for the full capability/role model.

