<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Every prompt — desktop software, server data

Deploy Atlas to the Desktop/Mac. The remote server stores shared data only and
must not run Atlas software. Finished work goes live in the installed Mac app.
Cursor loads `.cursor/rules/desktop-data-boundary.mdc` on every prompt.

## Required deployment boundary — 3 October 2026

User requirement: Atlas software, UI and application runtime belong on the user's
Desktop/Mac. The remote server stores shared user/business data; it must not host
the Atlas UI or full Atlas application. Apply this to every module, including HR,
CRM, Sales and Manufacturing. A desktop wrapper displaying a remotely hosted Atlas
application does not satisfy this requirement.

Persist user/business records, attachments and backups on the server only. Do not
introduce a local business database, offline record store or persistent business-data
cache. Local software files and minimal connection/session settings are separate
from business records; review browser caches/logs/exports against this boundary.
Transient data needed to display a record is not an authoritative local datastore.

A minimal authenticated data-access service may be needed to protect the remote
database and enforce tenant/capability checks; it must not grow into a hosted Atlas
application. Do not put shared database credentials into the desktop package or
remove server-enforced access controls. The precise data-service/runtime split is
an implementation task, not a claim that the current build already meets the target.

Older hosted-web-app/private-SSH thin-client plans are superseded as target
architecture. Preserve historical deployment evidence, clearly labelled, and inspect
actual runtime/package/network/storage behaviour before claiming compliance.
Do not deploy the Atlas application to the remote server. Any retirement of an
existing remote application must preserve all user data and backups.

## Live completion requirement — 3 October 2026

Michael requires completed apps and app changes to be made live, not left only in
source code, a build or a design preview. This applies to every app worked on from
now onwards, including current work and subsequent fixes. Deployment and live
verification are required task steps before a completed handoff, not an optional
follow-up to offer the user. Treat this as standing authorization to
perform the necessary compatible release, installed Mac package update and app
activation within the deployment boundary above. Verify the installed app opens
the delivered feature and its authorised server-data reads/writes work before
calling it complete. A page that errors is not live. Install the built bundle
over `/Users/michael/Applications/Atlas.app` (the Desktop icon points there).
Enable the completed module for Michael’s organisation as
part of release, including Production and Marketing when ready, and verify its
Apps entry/navigation is available to authorised profiles. Do not leave a finished
module disabled after deployment. Preserve existing profile permissions; activation is not
authorization to expose additional source data or grant every user access.

Preserve unsaved work and central records before switching runtimes. If a concrete
blocker prevents safe activation, finish safe release preparation, record the
blocker and next step in CURRENT_STATE.md, and clearly report that activation is
pending. Ask only for missing information or a genuinely necessary decision;
do not repeatedly request permission for already-authorised activation.

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

See `docs/DEPLOY.md` for the full deploy procedure (desktop build/install,
what to do when the release schema gate or the build itself fails in this
shared repo). The short version: `npm run build` then
`scripts/deploy-mac-client.sh <short-name>`.

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


## One editable project and one shared save location

Claude Code, Codex and Cursor must edit this same Atlas repository and save shared
context in its .ai/ directory. On Michael's Mac the working project is
`/Users/michael/Desktop/RP SYSTEM`. Resolve the root from this repository's AGENTS.md
when opened elsewhere. Do not create separate Claude/Cursor/Codex copies of Atlas,
parallel handbooks or external source-file folders. Explicit Git worktrees are the
exception for parallel work; merge their code and memory back into this repository.
Generated build/ staging/package files are disposable outputs, never editable masters.
Atlas modules share the same central server data store via the secured data service;
never create per-module/local business databases or silently fall back to local storage.

## User-requested CSV exports

Explicit CSV downloads from Planning, Inventory, Sales, Logistics and Audit may be saved to a
user-chosen location. This supersedes the blanket native-download prohibition;
authoritative shared records remain server-side, and no local database, offline
store or automatic business-data cache is permitted. See `.ai/PROJECT_MEMORY.md`.
