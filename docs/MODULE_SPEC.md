# Module Specification

How to build an Atlas module. Follow `src/modules/sales/` as the worked
example — everything below describes the pattern it implements.

## What a module is

A directory under `src/modules/<module-id>/` plus:

- entries in `prisma/schema.prisma` for any tables it owns (prefixed or
  clearly named per module, e.g. `sales_quotes`)
- one `ModuleManifest` (see `src/core/modules/types.ts`) registered in
  `src/core/modules/registry.ts`
- routes under `src/app/(app)/<module-id>/...`

## Directory convention

```
modules/<module-id>/
  manifest.ts         # the ModuleManifest — identity, capabilities, nav, providers
  domain/              # pure types/helpers specific to this module (optional)
  services/
    queries.ts         # read-only data access, always scoped by organisationId
    commands.ts         # "use server" mutations: requireSession → assertCapability → write
    attention.ts         # AttentionProvider implementation (optional)
    search.ts             # SearchProvider implementation (optional)
  components/            # module-specific UI built from src/components/ui primitives
```

Routes live in `src/app/(app)/<module-id>/` (Next.js App Router owns the URL
structure; it is not duplicated under `src/modules`).

## Manifest format

```ts
export const myModuleManifest: ModuleManifest = {
  id: "fleet",
  name: "Fleet",
  description: "Vehicles, maintenance and operating records.",
  icon: Car,                     // lucide-react icon
  version: "0.1.0",
  minimumCoreVersion: "0.1.0",
  dependencies: [],               // other module ids that must be enabled first
  capabilities: Object.values(FLEET_CAPABILITIES),
  rootPath: "/fleet",
  accessCapability: FLEET_CAPABILITIES.vehicleRead, // gates nav visibility
  status: "installed",            // "available" | "installed" | "coming_soon"
  navigation: [
    { label: "Vehicles", href: "/fleet/vehicles", capability: FLEET_CAPABILITIES.vehicleRead },
    // 7+ items? Give related ones the same `group: "Label"` — ModuleSpace collapses
    // them into one dropdown in the floating nav instead of a long flat row.
  ],
  attentionProvider: fleetAttentionProvider, // optional
  searchProvider: fleetSearchProvider,       // optional
};
```

Register it by adding to `MODULE_CATALOGUE` in
`src/core/modules/registry.ts`. That is the **only** place Core references a
module by name — do not import a module elsewhere in `src/core`.

## Routes & navigation

Pages live under `src/app/(app)/<module-id>/`. A module's layout wraps its
pages in `<ModuleSpace module={myModuleManifest}>` (`src/components/shell/module-space.tsx`)
— copy an existing module's `layout.tsx`, don't hand-build this. `ModuleSpace`
reads `module.navigation` (filtered by capability via `getModuleNavigation`)
and renders it as the shared **floating module nav**: a glass pill that
reveals when the pointer nears the top of the screen, sits flush with the
module's icon/title, and tucks away otherwise. This is Atlas's one nav
treatment — every module gets it automatically and should not build its own
tab row. Group related nav items with a shared `group: "Label"` string on
each `ModuleNavItem` so they collapse into one dropdown instead of a long
flat row (see Finance's or HR's manifest for worked examples). Primary
(sidebar) navigation is generated from `getNavigableModules(session)` —
**never edit the sidebar to add a module.**

## Permissions

Declare capability constants as `<module>.<entity>.<action>` strings (see
`src/core/permissions/capabilities.ts` for the Sales example). Add them to
`STANDARD_ROLES` if a seeded role should have them by default. Every
server action and every page must call:

```ts
const session = await requireSession();
assertCapability(session, MY_CAPABILITIES.thingRead);
```

Never check `session.someRole === "admin"` in application code.

## Database ownership & migrations

A module may add any number of tables to `prisma/schema.prisma`, but:

- every tenant-scoped table has an `organisationId` column, indexed, and
  every query filters on it
- a real-world company/person is **not** duplicated — relate to the shared
  `Party` model (see `docs/DATA_MODEL.md`) instead of adding another
  `XCustomer` table
- run `npm run db:migrate` to create the migration; commit the generated SQL
  under `prisma/migrations/`

## Events

Emit domain events for anything another module might someday react to:

```ts
await emit(DOMAIN_EVENTS.salesOrderConfirmed, { orderId, organisationId });
```

Add new event names to `DOMAIN_EVENTS` in `src/core/events/bus.ts` rather than
inlining string literals. Modules subscribe with `on(eventName, handler)`.
Also write an `Activity` row (`writeActivity`) when the event is something a
human should see on Home/record pages, and an `AuditEntry`
(`writeAudit`) when it's a business-significant change worth a permanent
record.

## UI conventions

Build pages from `src/components/ui/*` (Button, Card, DataTable, StatusPill,
EmptyState) and the shell's record-page pattern
(`src/app/(app)/sales/customers/[partyId]/page.tsx`). Don't invent new
visual patterns per module — see `docs/DESIGN_SYSTEM.md`.

## Attention & search

Implement `AttentionProvider`/`SearchProvider` (both in
`src/core/modules/types.ts`) if the module has something worth surfacing on
Home or in ⌘K. Core calls these automatically for every enabled, accessible
module — no wiring beyond returning them from the manifest.

## Contributing to a customer record

If the module relates its entities to `Party` (most will — see
[`docs/CUSTOMER_MASTER.md`](./CUSTOMER_MASTER.md)), implement
`customerOverviewProvider` to contribute metrics, quick actions, and
optionally a `creditExposure` figure to that customer's Overview tab. See
`src/modules/sales/services/customer-overview.ts` for the reference
implementation. Customer Master calls this for every enabled, accessible
module exactly like attention/search — never hardcode a module's presence
into Customer Master itself.

## Settings

A module's own configuration UI lives at `src/app/(app)/<module-id>/settings`
(not built yet for any module — add when a module needs it). There's no
central settings registry yet; follow the Apps/Settings route pattern when
you add one.

## Testing

Add unit tests under `tests/` for domain logic (see `tests/modules.test.ts`,
`tests/permissions.test.ts` for the pattern). Run with `npm test`.

## Naming

- module id: lowercase, single word where possible (`sales`, `stock`, `fleet`)
- capability: `<module>.<entity>.<action>`, e.g. `fleet.vehicle.manage`
- database tables: `<module>_<entity>` (e.g. `sales_quotes`), except shared
  core tables which have no prefix

## What modules may access

- `src/core/*` public exports (auth, permissions, modules runtime, events,
  audit, activity, shared UI)
- their own tables, and read access to shared core tables (`Party`,
  `Organisation`, etc.) via the shared Prisma client

## What modules must never access

- another module's `services/` directly — go through an event or, if truly
  needed, a capability-gated query Core exposes
- the raw session cookie/JWT (`src/core/auth/session.ts` internals) — use
  `requireSession()`/`getSession()`
- `src/core/modules/registry.ts`'s `MODULE_CATALOGUE` to look up another
  module's internals beyond `ModuleManifest`'s public shape

## Installation, disabling, uninstall

Today: `setModuleEnabled(organisationId, moduleId, enabled)` flips a
`ModuleState` row; the Apps screen calls this through
`toggleModuleAction`. There is no data-deletion "uninstall" yet — disabling
hides navigation/access but keeps data, which is the safe default until a
real uninstall flow (data export + confirmed deletion) is designed.

## Version compatibility

`minimumCoreVersion` on the manifest is informational today (no Core version
gate is enforced yet) — set it, and revisit when Core starts versioning
releases.

## Worked example

Sales (`src/modules/sales/`) implements this spec end to end: manifest,
queries/commands, an attention provider (quotes awaiting response), a search
provider (customer name match), capability-gated navigation, and the
Pipeline/Customers/Quotes/Orders pages. Read it before building anything new.


## Contributing document template context

A module may register a `templateContextProvider` with source types, capability-gated `list` and `get` functions returning whitelisted merge fields, canonical Party/contact references and its record link. Both functions enforce tenant and record visibility; the shared engine re-checks the source on generation, sharing and file access. See `src/modules/crm/services/template-context.ts` and [Contracts and Templates](plans/CONTRACTS_TEMPLATES.md).
