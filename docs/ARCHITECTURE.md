# Atlas Architecture

> **Current deployment target — 7 October 2026:** Michael explicitly confirmed
> server deployment, including S&OP. Atlas runs at `https://atlassystem.online`
> with central records and authenticated, tenant/capability-checked access.
> Backups and live feature verification are required. Earlier Mac-only target
> statements are superseded; see AGENTS.md and docs/DEPLOY.md.

## Shape

Atlas is **Core + Modules**, built on Next.js (App Router, TypeScript) and
PostgreSQL via Prisma.

- **Core** (`src/core/`) owns platform concerns: organisations, users,
  authentication, memberships, roles/permissions, the module registry and
  lifecycle, **Customer Master** (the canonical `Party` identity — see
  `docs/CUSTOMER_MASTER.md`), audit, activity, attention, search, navigation,
  shared UI primitives.
- **Modules** (`src/modules/`) own business capabilities (Sales, CRM, Projects,
  HR — `people`, Customer Service, Tickets, Finance, Logistics and Quality).
  Consult the runtime registry and [module memory](../.ai/MODULES.md) for registered
  implementations, remaining stubs and acceptance limits. A module declares a manifest, owns its own
  database tables, and contributes navigation, pages, capabilities, an
  attention provider and a search provider through typed contracts — it never
  reaches into another module's internals, and Core never contains
  module-specific business logic.

## Request flow

1. `src/app/(app)/layout.tsx` resolves the session (`getSession()`), redirects
   to `/login` if absent, and renders the shell (`Topbar`, app-directory home and app switcher).
2. The launcher and app switcher call `getNavigableModules(session)` to build app
   navigation. Customer users see only enabled, entitled and accessible modules;
   Atlas staff can open every implemented, accessible app regardless of that
   company's module switches. No module is hardcoded into the shell.
3. A module's own layout (e.g. `src/app/(app)/sales/layout.tsx`) renders its
   secondary navigation via `getModuleNavigation(manifest, session)`.
4. Pages call `requireSession()` then `assertCapability()` before reading or
   writing anything. Server actions (`"use server"` files) do the same.

## Module lifecycle

`ModuleState` (database) stores per-organisation enable/disable state.
`src/core/modules/registry.ts` holds the in-code catalogue (`MODULE_CATALOGUE`)
— identity, dependencies, capabilities, navigation, providers. Enabling a
module (`setModuleEnabled`) checks its declared dependencies are already
enabled; this is enforced server-side, not just in the Apps screen UI.

## Customer Master

See `docs/CUSTOMER_MASTER.md`. A real-world company or person is one `Party`
row, owned by Core — not Sales, not any module — because every module that
deals with customers depends on it. Modules relate their own records to
`Party` rather than inventing their own customer table, and contribute to a
customer's record (metrics, actions, credit exposure) through a
`customerOverviewProvider` on their manifest, the same typed-contract pattern
as attention/search. The customer record page
(`src/app/(app)/customers/[partyId]/page.tsx`) is the canonical example of
rendering one entity through multiple modules' data, each section gated by
its own capability.

## Cross-module communication

`src/core/events/bus.ts` is an in-process synchronous event emitter. Modules
emit named domain events (`DOMAIN_EVENTS` in that file) rather than calling
into each other's services directly. This is intentionally simple — Atlas is
one application today — but the event names and payload shapes are the
contract that would carry over to a real queue later.

Confirmed Sales mutations now also write Core DomainOutbox records transactionally. These are durable pending records; no background dispatcher/consumer is installed yet. See [Sales delivery map](modules/SALES_ORDER_PROCESSING.md) for retry/idempotency/projection work before downstream integration.

## Shared service work

Core `src/core/service-work/` provides reusable queues, clocks, access, history,
private evidence, knowledge and approval connections. Customer Service owns
customer cases; Tickets owns internal tickets; Queries retain an accessible case
or ticket origin without transferring its owner. Typed registry providers connect
canonical Finance credits, Sales replacements/recovery, Logistics returns,
Inventory quarantine, Quality NCRs and CSAT. Core never imports their module
implementations. See [connected service desk](modules/SERVICE_WORK_DESK.md).

## Multi-tenancy

Every tenant-scoped table carries `organisationId` and every query filters on
it server-side (see any function in `src/modules/sales/services/queries.ts`).
Client-supplied organisation ids are never trusted; `organisationId` always
comes from the resolved session.

## Permissions

Capability strings, not role names, gate every action. See
`docs/PERMISSIONS.md`.

## What's deliberately not built yet

The repository includes accounting controls, a statutory payroll calculation engine,
MRP, warehouse execution and tax calculations. These are substantial implementations,
not blanket completion of those domains. Full operational costing/WIP/COGS, protected
ATP/finite CTP, external bank/statutory submissions and other delivery gaps remain
open in the owning-module guides. See [system map](atlas-system-map.md) and the
[source assessment](atlas-known-technical-debt.md) for current verified limits.

## Customer Service

`service` provides a source foundation for one Case engine attached to Core Party
and separate Department Tickets. Completion of internal work preserves customer
case ownership/status. Read scopes also enforce case security and queue membership;
commands are forwarded to the central data service. See
[Customer Service delivery](modules/CUSTOMER_SERVICE.md) for remaining workflows,
full source coverage and activation limits.


## Reusable documents and contract sharing

Core `templates/` and `contracts/` own template rendering, snapshots, PDFs and public customer responses. The separate Templates app registers normally. CRM owns contract operations. Each source module contributes `templateContextProvider` through its manifest for scoped record choices/fields; Core calls the registry contract and never imports source implementations directly. See [Contracts and Templates](plans/CONTRACTS_TEMPLATES.md).

## Studio foundation — Phase 1

Core Studio owns the typed registry and tenant metadata lifecycle under
`src/core/studio`. Module manifests contribute descriptors/owner callbacks; Core
resolves only stable IDs and validates permissions, source availability and schemas.
Template providers are compatibility adapters over the existing Templates engine.
No duplicate workflow/template engine or shadow business records are introduced.

Definition/Draft/Version/Dependency form an additive metadata kernel. Drafts use
CAS revisions; publication recompiles on the server, persists immutable plans and
audit atomically, and activation moves a separate tenant-bound pointer. Rollback
activates retained history. The first compiler supports read capability sets only;
later artefact compilers follow the supplied source's phase gates. PostgreSQL
guards immutable identity/history and sealed dependency edges.

Staff setup uses `/atlas/studio` with independently authorised target companies;
customer Studio `/studio` uses its authenticated company. `/atlas/login` and
`/business/<slug>/login` share the canonical identity service with distinct server
membership selection. Proxy overwrites the path hint on page/API requests for sign-in routing;
membership/capability checks remain the permission boundary. See the permanent Studio ledger for verified
status and deferred work.

## Separate platform console

Atlas `/atlas` routes are under `src/app/(admin)/atlas`; their guarded AdminShell
is independent of `src/app/(app)/layout.tsx`. Business launcher/search/chat/profile
components are not mounted by the console. Public URLs and mutation guards remain
unchanged. Platform staff can explicitly open an audited business support workspace;
customer sessions still cannot enter Admin. Installed desktop operation keys for
`(app)/atlas` remain aliases of `(admin)/atlas` guarded actions.
