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
module — no wiring beyond returning them from the manifest. Providers must enforce
entity-specific capabilities and tenant scope themselves. Home aggregates sources
independently, labels their origin and sorts by urgency. A failed source marks the
list incomplete while retaining other sources; it is never a healthy empty queue.

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

Studio capability discovery supplements the existing providers through an optional
`studio` bundle on ModuleManifest. Use typed factories in
`src/core/studio/registry/contracts.ts`; identifiers are owner-prefixed logical IDs
with explicit versions, classifications and permission strings. Registry inputs and
outputs are schema-validated; invocations retain the resolved tenant Session and
owning-domain guards. Never register arbitrary configuration-provided functions.

Existing template-context providers are adapted into template/list/get descriptors.
The shared renderer and original source permission/private-record queries remain
authoritative. Template compatibility access preserves existing staff-aware app
gates; Studio composition uses company enablement/entitlement. A display-label
rename does not break contract references. All other descriptor/schema hash changes
are conservatively breaking at the same version: retain the old version or republish
dependent metadata. Custom refinements/business rules require an explicit contract
version change even when their JSON schema representation is unchanged.

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

## Record relationships — 8 October 2026

Optional `recordContextProvider(session, record)` validates the source's type,
capability and same-tenant existence before returning identity-only anchors.
`recordRelationshipProvider(session, context)` contributes authorised upstream,
downstream and related links from its own records. Core calls only enabled owners;
each contributor applies target capability and record visibility. Never infer a
relationship merely because two records use the same product. Customer Master
contributes through Core and hides scrubbed identities. Finance uses `documentScope`.

`src/core/relationships/load.ts` deduplicates internal links and tolerates optional
provider failure; the reusable Server Component is
`src/components/records/relationships.tsx`. Providers bound display lists with an
explicit more-records marker. This is navigation over canonical records, not a
second graph database or a persistence cache. Current roots: Sales order,
Manufacturing order, Logistics fulfilment/shipment, Finance document.

## Report providers

Modules may register `reportProvider` datasets using `src/core/reports/types.ts`.
Providers retain typed tenant/record-scoped queries and safe column allowlists.
Reports is a built-in utility and never bypasses source licences/capabilities.
See [Reports](modules/REPORTS.md) for the contract and bounds.

## Studio entity opt-in — Phase 2 contracts

An extensible entity registers `entity()` with unique native read-field IDs and an
owner `record` policy. The policy names registered same-owner/same-capability list
and get queries, a canonical route/label, the native write capability and an
`authorise` callback. All policy metadata participates in the compatibility hash.
The registry rejects missing callbacks, dangling projections and client tenant IDs.
Entity descriptors remain non-executable through the query/command gateway.

`authoriseRecord()` returns only a tenant-checked canonical ID and positive owner
revision. Extension intent requires native read/write permission, expected owner
revision and the trusted transaction client. The owner locks/rechecks the canonical
record inside that transaction and enforces private-record, final-state and source
availability rules. This permits Studio-owned additional values, never generic
patches of native status, priority, assignment, SLA or protected domain columns.
Studio configuration permission alone cannot authorise a record write.

Tickets is the first opt-in: `tickets.ticket`, `.list` and `.get`, version 1,
over canonical `ServiceWorkItem(kind=TICKET)`. Existing intake definitions/answers
stay with the service desk. Phase 2 persistence/builders are separate workstreams;
these contracts do not establish completed custom-field/page runtime.

Studio field-migration coverage is an owning-module query, not a count of paginated
visible projections. Tickets registers `tickets.ticket.migration_cohort@1` with
native read/manage checks and complete private-queue access before a canonical
count. Its one serializable snapshot includes records without extension anchors;
generic denial returns no inaccessible identity/count. It grants no final/merged
write or representation conversion authority. Future migration jobs pin that
contract separately and must still enforce owner and current/written value access.

An entity can add `record.migrationSnapshot` only in a new contract version. It
names a registered same-owner query with native write capability and
`transaction: "required"`, and explicitly approved typed-field source versions.
The registry validates these references before adding any bundle. Tickets v3 opts
in to `tickets.ticket.field_migration@1`; v1/v2 stay unchanged. The protocol has
preflight, bounded canonical anchor snapshot and persisted observation coverage
modes. Its supplied transaction must be SERIALIZABLE, with actual active company
membership, native read/manage, enabled/entitled source and complete private queue
access checked before IDs/counts. Coverage checks both missing/extra record IDs
and native revisions; equal counts do not prove completeness. This read-only
protocol grants no final/merged writes, value access or representation conversion.


## Consolidated workspaces

A manifest may set `launcherConsolidatedInto` to an implemented parent workspace
ID. Home and the Apps switcher hide that source app only when the parent is enabled,
entitled and accessible to the current person. Manage apps nests the source access
switches under its parent app card; enabling/disabling still uses the original
module service, dependency and entitlement checks. Use a single direct parent, not
nested/cyclic consolidation. Retain source routes, record identity, capabilities,
audit, providers and exports. Shared workspace layouts must enforce their original
source guards. Manufacturing & Supply includes Planning, Inventory and Products;
companies without console access retain their existing licensed entry points.


A Studio query may explicitly declare `transaction: "required"` when its owner
must share the caller's server-owned Prisma transaction for an atomic snapshot.
Core invokes these only through `invokeQueryInTransaction`; ordinary invocation
rejects. Existing queries do not opt in implicitly, and this entry point cannot
execute commands or bypass command idempotency. The owner still checks native
permissions, tenant scope and module availability inside the supplied transaction.
The option is a pinned contract change; publish a new descriptor/version instead
of changing a sealed old contract. It adds no field conversion authority.

An owner migration snapshot may additionally declare referenceVersions: explicit
native read versions of the same canonical entity covered by its pinned query.
Registry registration requires reference type/entity approval and actual registered
native versions; omitting it preserves old metadata/hashes. This opt-in never
grants data access: final reference review needs the new owner query's real target/
tenant/private checks after Studio current/written policy and source coverage.
Use new entity/query versions rather than changing already sealed descriptors.


### Explicit representation approval (Phase 2 foundation)

A new entity contract version may add `record.migrationRepresentation` with a
registered same-owner query, mandatory shared transaction, native write capability
and explicit source versions that are a subset of its approved migration snapshot.
Registry validation is atomic. Existing snapshot contracts grant only read coverage;
normal `read`/`extend` and final-record restrictions do not change. The future query
must reload scoped persisted reviewed publication/observation proof and authorise the
actual native row; it may approve extension representation only, never native writes.
Tickets v5 declares this policy; real owner/SQL execution and cutover were verified
on8d6eb9e/9aad1fc. These capabilities grant no ordinary final-record writes.


### Current retained field settlement coverage

A new transaction-required owner query can declare hashed `fieldSettlement`
metadata: canonical entity ID and supported source/target/reference entity versions.
Registration requires registered same-owner entity versions, typed field policies
for source/target and the owner's native write capability. One query identifier per
entity supports versioned evolution; `resolveFieldSettlement` selects the latest
registered version and fails closed if unsupported, unavailable or expired. It
never silently falls back or accepts client query selection. Older descriptors
retain their exact hashes. Tickets adds `tickets.ticket.field_settlement@1`.

Its rollback mode checks current complete native/private access and exact reviewed
cohort/revisions; history mode permits unrelated native/extension changes but still
checks current access, retained record existence and original source/target reference
coverage. It uses immutable stored reviews/values instead of today's draft. No
record ID/count/value is returned and no native or extension operation is granted.
Studio independently refreshes the settling actor and enforces current active,
source/target/written field policies, compiler/module compatibility and exact open
configuration CAS. Separate internal rollback/finalization operations share existing
authority and activation/Audit primitives. A terminal replay reports actual history,
not today's active version. Verifieda527ccd full candidate/public: real current actor/private/field/module/tenant
checks, atomic Audit/CAS/failure/replay and continued-history proof.

## Native required facts and creation initialisation contracts

An entity may explicitly opt into `record.requiredFacts`: registered same-owner,
same-native-read-capability transaction-required query and bounded native fact
IDs/types/sensitivity/enum codes. The registry validates declarations and hashes
them; normal readable fields are not automatic condition inputs. The metadata
adapter checks current module/owner/field grants; the owning query independently
checks tenant/private/current native revision before projecting only approved facts.
Tickets v6 approves status/priority; sealed v1–5 are retained.

`record.initialisation` names the owner's create capability and opaque proof callback.
`resolveForRecordInitialisation` resolves metadata only; it grants neither queries
nor existing-record editing. The proof must come from the actual owning native
INSERT in the same Serializable transaction and genuine principal; JSON/copies/
sibling transactions/stale identities fail. Tickets' bridge owns that INSERT and
expires its private proof when the callback finishes. Existing native creation
validation remains with createWork; its field integration/coverage is still d3–4.
