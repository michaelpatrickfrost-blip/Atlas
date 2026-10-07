# Atlas Architecture

> **Current deployment target — 7 October 2026:** Michael requires every finished
> change deployed and verified on the live Atlas server. This supersedes prior
> Mac-only/data-only-server restrictions. See AGENTS.md and docs/DEPLOY.md.

## Shape

Atlas is **Core + Modules**, built on Next.js (App Router, TypeScript) and
PostgreSQL via Prisma.

- **Core** (`src/core/`) owns platform concerns: organisations, users,
  authentication, memberships, roles/permissions, the module registry and
  lifecycle, **Customer Master** (the canonical `Party` identity — see
  `docs/CUSTOMER_MASTER.md`), audit, activity, attention, search, navigation,
  shared UI primitives.
- **Modules** (`src/modules/`) own business capabilities (Sales, CRM, Projects,
  HR — `people`, Staff Scheduling, Production Planning, Inventory, KPIs,
  Products, Pricing, Analytics, Customer Service, Finance and Marketing have source foundations;
  Purchasing, Payroll, Manufacturing execution, Logistics, Quality, Health & Safety
  and Fleet remain planned/stub domains). A module declares a manifest, owns its own
  database tables, and contributes navigation, pages, capabilities, an
  attention provider and a search provider through typed contracts — it never
  reaches into another module's internals, and Core never contains
  module-specific business logic.

## Request flow

1. `src/app/(app)/layout.tsx` resolves the session (`getSession()`), redirects
   to `/login` if absent, and renders the shell (`Topbar`, icon-launcher home and app switcher).
2. The launcher and app switcher call `getNavigableModules(session)` — the enabled, accessible
   modules for this org/user — to build app navigation. No module is
   hardcoded into the shell.
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

## Multi-tenancy

Every tenant-scoped table carries `organisationId` and every query filters on
it server-side (see any function in `src/modules/sales/services/queries.ts`).
Client-supplied organisation ids are never trusted; `organisationId` always
comes from the resolved session.

## Permissions

Capability strings, not role names, gate every action. See
`docs/PERMISSIONS.md`.

## What's deliberately not built yet

Full accounting, payroll calculation, MRP, warehouse management, tax engines,
bank integrations, marketing automation, natural-language commands. The
module stubs in `src/modules/stubs.ts` and the `coming_soon` status on the
Apps screen represent this honestly — nothing is faked.

## Customer Service

`service` provides a source foundation for one Case engine attached to Core Party
and separate Department Tickets. Completion of internal work preserves customer
case ownership/status. Read scopes also enforce case security and queue membership;
commands are forwarded to the central data service. See
[Customer Service delivery](modules/CUSTOMER_SERVICE.md) for remaining workflows,
full source coverage and activation limits.
