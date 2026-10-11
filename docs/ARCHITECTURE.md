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
customer Studio `/studio` uses its authenticated company. `/19811171adminlogin` and
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

Studio field validation now has explicit owner contracts for native condition facts
and new-record initialisation. Tickets v6 is additive; its v1–5 contracts stay sealed.
Ordinary runtime and native operations share refreshed transaction authority. Native
creation proof is ephemeral server memory scoped to one actual INSERT/transaction,
not a database/cache/permission system. No new business datastore or native rule
engine is introduced. Conditional publication/native action hooks remain gated on
canonical coverage and atomic implementation in Phase2B4d3–4.

## Current owner creation coverage — Phase2 contracts, 10 October 2026

Optional hashed `record.initialisation.acceptedFieldVersions` declares the exact
registered legacy typed-field entity versions the current owner approves for new
records. Current resolution uses the newest owner policy and fails unsupported
coverage without fallback. It grants no ordinary native read/manage access.
Optional `requiredFacts.initialQuery` references a distinct same-owner creation-
capability transactional query. Only explicit proof-bound invocation supplies the
opaque INSERT token in server context; generic/JSON invocation cannot. Owner query
rechecks NEW/version1/requester/tenant/source before projecting approved facts.
New conditional plans seal both read and initialization query hashes; metadata
sealing does not require an author's native Create grant. Explicit field grants and
independent reference reads remain mandatory. Tickets v7 is additive; v1–6 and
ordinary fact-query hashes/migration ranges unchanged. Consolidated central creation/
staged-value/SQL rollback proof is VERIFIED live6b3d03f (candidate/public). Native
hooks and conditional publication remain outstanding.

## Resulting-field validation — internal Phase2 runtime, 10 October 2026

`validateResultingFieldRequirements` reads actual staged native/typed rows in the
caller's owning Serializable transaction. It validates all active requirements,
including omitted targets, after current/pinned/written policies and exact native/
extension revisions. Unconditional required remains mandatory; false/zero count
as present. Optional unconditional private fields impose no unrelated value reads.
Creation-only paths require the genuine same-INSERT current owner proof, approved
legacy versions and sealed initialization-query meaning. They never borrow native
Read/Manage or use the proof for an existing reference target/other record. Returned
fingerprints/revisions remain internal; any validation failure must propagate through
the owning transaction and roll back native/typed/Audit changes. No native hooks,
initial writer or conditional publication dispatch is enabled yet: common lock order,
canonical coverage and reviewed rollback-window closure remain integration gates.

Candidate requirement checks may inspect a server-loaded immutable tenant version
before activation while preserving the real active pointer. They use actual native/
typed values and current/pinned/written/reference rights. This internal d3d helper
does not grant publication or establish complete canonical coverage on its own;
ordinary v1 gateways remain closed and unchanged. Not enabled in live authoring.

## Complete candidate required-field coverage — 10 October 2026

Optional hashed `record.requiredCoverage` identifies a same-owner, native-write-
capability, transaction-required query and the exact typed field entity versions
it covers. Registry registration validates the entire bundle atomically. Runtime
selects the newest owner policy; missing coverage, changed hashes, expired contracts,
disabled modules or insufficient current capabilities fail without fallback.
Tickets v8 approves versions2–8 and reuses existing canonical preflight/snapshot
logic through `tickets.ticket.required_coverage@1` (preflight/snapshot only).
Existing v1–7 hashes and migration/representation/settlement ranges stay sealed;
creation v8 explicitly extends existing proof-bound field-version approval.

Internal `fields/required-coverage.ts` checks a server-loaded immutable candidate
without changing activation. Genuine company identity or the existing explicitly
audited support principal, Publish, Studio enablement, native Read/Manage and
independent target/source/written/reference field policies apply. Full private
access is checked before IDs/counts. Pages include final/merged/unanchored native
records; exact cursor/count/revision reconciliation and current source-graph/value
checks run inside the owning Serializable transaction. Empty cohorts still validate
all declared metadata. Returned count/fingerprint is internal transaction evidence,
not durable approval or a grant. No new DDL or publication endpoint. IMPLEMENTED
locally with95 focused checks/build/types/lint; actual central probe and deployment
pending. Native/common-lock/initial-writer/window prerequisites remain d4 before
conditional authoring dispatch. Full Phase2 and visual designer remain unfinished.

### Reviewed conditional field evolution — 10 October checkpoint

The existing field evolution analyser now exposes a pure v1/v2 impact entry: rule
addition/change/removal requires reviewed generation replacement; cosmetic labels
preserve storage. Explicit migration packet v2 seals normalised intent/review and
ordered observations containing references/requirement evaluation checksums only.
Legacy v1 parsers/converters/digests/owner ranges remain closed and unchanged.
These helpers grant no business access, persistence or execution. Real conditional
inspection, additive SQL guards, existing execution/cutover/settlement adaptation
and shared native locks/enforcement must precede authoring dispatch. No new engine.

### Studio reviewed migration format approval — 11 October 2026

Snapshot/representation/settlement policies may explicitly pin closed ordered
`intentVersions` (1 or 2); omission preserves legacy1 JSON and hashes. A v2 entity
snapshot/representation approval must match the pinned callback's hashed
`fieldMigration` entity/purpose/version declaration, plus existing owning module,
native write capability and required shared transaction. Representation support
must be contained by snapshot support. Current settlement selection rejects an
unsupported newest format without fallback. Existing Tickets1–8 and owner-query
ranges remain unchanged. These contracts do not enable v2 authoring, persistence,
execution or native mutation; actual owner implementation and remaining Phase2
migration/lock/runtime gates are still required.

### Studio migration metadata inspection — 11 October 2026

The existing preparation, collection, coverage and written-value inspection paths
share `fields/migrations/metadata.ts`. Their retained v1 intent/payload parsers
remain closed and compilation/hash meaning is unchanged. The internal v2 compiler
branch requires the existing genuine-principal Serializable source provider and
uses its locked registry/current/pinned dependency graph to compile the full rule,
including empty cohorts. It does not read business values, invoke native facts,
persist a v2 preparation or permit authoring/execution. Actual stored-intent
selection, per-row evaluation and additive SQL guards are the next integration gate.

### Shared Studio rule-input reads — 11 October 2026

Ordinary validation uses the internal `fields/required-inputs.ts` reader after full
metadata inspection. It retains every native/private/current/pinned/written/reference
check and uses the actual opaque creation gateway, accepting no supplied fact data.
Condition value evidence excludes revision envelopes; ordinary fingerprints still
include native/global extension revisions. This allows upcoming migration evaluation
to reuse the same reader while independently checking the exact original/own-outcome
revision lineage. Equal condition evidence grants no drift waiver or execution right.

### Studio real per-row conditional migration review — 11 October 2026

The internal preparation-only `inspectRequiredFieldMigrationRecord` refreshes
actual Serializable authentication, current customer/audited support identity and
server company/source/draft state. Both full source and compiled server-target rules
and owner/query format opt-in precede native/condition/value reads. Current/pinned/
written/reference access is checked independently. Shared source decoding and
structural conversion preserve legacy v1 gates/hashes; conditional evaluations can
only strengthen unconditional required. Null/empty multi are absent, zero/false
present; missing source INVALID_SOURCE, evaluated missing target FIELD_REQUIRED.
Archive wrappers return references/semantic checksums only. Exact native/global
revision envelopes remain separate; equality never waives drift. No v2 durable
preparation/archive/owner/execution/authoring/native hook is enabled by this readonly
component. Actual persistence/owner/central proof and later stage/lock gates remain.

### Studio server-stored migration format selection — 11 October 2026

Internal `migrations/stored-protocol.ts` selects closed intent/review1/2 solely from
server-loaded JSON and verifies canonical hashes/tenant/row identity. It grants no
owner or data authority. Existing preparation/collection/sealing explicitly route
1/2 from server metadata with full authority/metadata/owner approval; unknown/coerced/
missing versions never fall back. Actual format2 owning callbacks/runtime acceptance
are VERIFIED for normal prepare/collect/seal. Reviewed publication is implemented
below; execution/cutover remain closed1 until their explicit lineage is delivered.

### Required migration archive integrity — 11 October 2026

The additive required-field-reviews migration extends the existing preparation and
observation guards with explicit numeric2 metadata branches; legacy1 guards and
immutable history/FKs/CAS remain. Requirement evidence stores only two semantic
checksums and a required boolean. Real condition evaluation, owner approval and
revision envelopes remain server responsibilities. The existing aggregate retains
frame1 bytes and adds frame2 behind exact stored parent identity/hash verification.
This integrity substrate does not enable format2 preparation, authoring or domain
execution. The central Test SQL fixture uses synthetic semantic hashes, rolls back
every attempt, and checks that native, typed, draft, metadata and Audit state is
unchanged; it must not be reported as real format2 owner/condition/runtime proof.

### Required migration preparation/review routing — 11 October 2026

The existing engine derives protocol from saved source/draft or stored intent only.
Conditional preparation requires an exact canonical saved draft; it never silently
edits/normalizes metadata or accepts a client-selected protocol. Snapshot approval
must name both entity and callback intent coverage and native write capability.
Required preparation-only review refreshes genuine authority, validates owner/source/
written metadata before archive IDs/counts, then reevaluates actual authorised rows
in bounded pages. Matching conversions/hashes do not waive changed conditions or
native/global revisions. Pure/SQL archive framing must agree before the existing
CAS/Audit sealer writes. Reference coverage shares the retained helper. Empty cohorts
still require actual authority/metadata/owner checks. Actual current-owner normal
prepare/collect/seal APIs are VERIFIED live a475823. Reviewed publication is now
implemented as described below; execution/settlement/native hooks and public
conditional authoring remain gated.

## Studio current Tickets reviewed representation contracts — 11 October 2026

Native9 and new owning snapshot4/representation2/settlement2 contracts add explicit
migration formats1/2 while retaining every old descriptor/hash. Current callbacks
load immutable scoped source/review evidence; retained history never assumes an
editable draft. Native5 settlement preserves format1 only. Owner approval concerns
representation, not a business mutation or Studio permission grant. Full conditional
runtime/native writer integration is still gated. See the Studio source coverage map
and permanent ledger for scope and verification; Phase2 is unfinished.

### Required reviewed publication — 11 October 2026

The existing internal publisher derives closed1/2 from the stored intent and review.
It refreshes actual owner/private/native/condition evidence before first publication
and through a separate source-active publication inspector on replay. Same receipt
shape pins the full sealed review; no protocol guess from target payload (rule
removal may target schema1). The shared typed publisher accepts conditional plans
only with the trusted reviewed Core binder and saves the plan's actual schemaVersion.
Definition/draft CAS, dependency checks, immutable version/generation/publication
and both Audits share one transaction. The original source stays active; no native
or typed values change. A recorded format2 execution cannot fall back to publication
inspection. The separate execution row/review reader now proves current conditions,
exact own +1/new-anchor outcome lineage, unchanged source/native and actual decoded
target under current/written policies before normalizing the archive envelope.
Ordinary conditional authoring/customer activation remains gated. Normal conditional
start/batches/recovery/replay/cancellation are VERIFIED on b34ce50 candidatekT6FVM/
publicqTWEdH, both ALL COMBINED PASS. Existing cutover/settlement services now dispatch
from server-stored closed1/2 intent; local orchestration/identity/coverage tests pass,
actual conditional activation/settlement SQL proof is pending. First conditional
cutover and reactivation of a conditional source on rollback are Test-only until all
native required/write-window hooks pass. Finalization and retained receipt replay
still require current permissions, without a blanket Test restriction. Shared
activation accepts the existing reviewed typed compiled-plan union; ordinary public
compiler/authoring dispatch remains closed1. A different current authorised settler
uses genuine current authority and base/native/field/reference rights while original
publisher/review metadata remains immutable. Rollback reevaluates exact original
conditions/cohort/source/target; history checks full sealed original metadata without
requiring its old input graph to remain current. No second engine, DDL or domain
mutation; native hooks and complete visual Phase2 acceptance remain unfinished.

11 October2026: a separate internal execution2 coverage prerequisite reuses existing
source-active RUNNING/READY/FAILED execution/source/outcome/target guards. Complete
owning private preflight precedes SQL freshness; current representation query must
explicitly support protocol2. Caller owns refreshed locked authority. E3d2b now supplies separate actual row/
condition/review and execution metadata inspection, with full support principal,
source/draft/target checksums, dependencies and exact receipt/progress. Legacy entry
closed1. Existing start/batch/representation derive protocol from stored intent and
reuse the same claim/typed write/CAS/progress/Audit transaction; actual normal proof
pending. Conditional cutover/settlement/native authoring remains unavailable. Local63/types/lint/build/diff PASS;
SQL/private unit fixtures do not prove actual conditional execution. No DDL/engine.
Original0d315f7/46009 candidateMTZpXy/publicVvzibi BOTH ALL COMBINED PASS, exact
public health. Existing conditional review/publication and module regressions verified
live. E3d2b integrated86tests/7suites/strictTS PASS; explicit unit transaction/
authority fixtures do not prove real normal execution. No new engine or DDL.

## Field/native transaction coordination — Phase2 d4a, 11 October 2026

Internal `fields/entity-lock.ts` reuses the existing first-publication tenant/entity
compact JSON/seed0 advisory key. Acquire sorted unique complete owning entity sets
before configuration/receipt/native/sequence/parent/value row locks, after existing
authenticated tenant/module authority. Existing binding may server-derive primary
entity; no binding grants nothing. Native creation and first publication use their
actual approved entity. Draft payload changes and retirement join this order because
existing archive triggers otherwise reverse migration publication-row ordering.

Native Tickets/QUERY parent operations and Service Case merge preserve narrow owning
permissions; three previously default-isolation actions now use Serializable. No
Query field contract, alternative engine, DDL or conditional authoring enablement.
Advisory waiting does not refresh a pre-existing Serializable snapshot; CAS/row locks/
SSI and real first-publication/no-binding/field-limit concurrency remain required.
D4a is locally verified ordering; every-write requirements/all-affected windows and
customer conditional enablement remain incomplete in the permanent Studio ledger.

### Studio owning mutation validation contracts — 11 October 2026

The single typed field writer can stage within an owning Serializable transaction;
public single-field saves validate all resulting required fields before commit.
Initial/batch callers validate once after all intended fields/native writes. Whole
Ticket rollback-window selection covers the owner's complete canonical cohort,
including unrelated field saves/new records, using existing sealed1/2 inspectors
and finalizer rather than another migration engine.

Operation-specific query policies approve native resulting validation without
rewriting existing entity descriptors. Private service-work SQL receipt scopes bind
genuine refreshed principal, transaction, exact existing operation capability and
actual changed Ticket final revisions; generic queries cannot forward proofs.
Proofs grant no field/native-fact/reference access and expire on every exit. Domain
callbacks retain private access/transition/SLA/approval/Audit rules. Required final
validator callback must run after all writes; actual native hooks are implemented locally; SQL atomic/concurrency and release
gates remain incomplete. No-config native/internal behavior is retained.
