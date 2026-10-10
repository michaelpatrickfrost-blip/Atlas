# Data Model

Full source of truth: `prisma/schema.prisma`.

## Tenancy

`Organisation` is the tenant. Every tenant-scoped table carries
`organisationId` and is always queried filtered by it (never trust a
client-supplied id — it comes from the resolved session).

## Identity

`User` → `Membership` (per-org) → `Role` (org-scoped, holds a
`capabilities: string[]`) → `RoleOnMembership` (join table). A user can have
multiple memberships (multiple orgs); a membership can have multiple roles.

## Shared entities

- **Party — the Customer Master.** Any real-world company or person a
  business deals with (`kind: COMPANY | PERSON`). This is the one
  customer/supplier/contact identity in Atlas — see
  [`docs/CUSTOMER_MASTER.md`](./CUSTOMER_MASTER.md) for the full model
  (`Contact`, `Address`, `CommunicationDestination`,
  `CustomerCommercialSettings`, `CustomerCreditProfile`, `PaymentTerm`,
  `TaxRegistration`, `BankAccount`, `DirectDebitMandate`, `Document`, `Note`).
  Modules relate their own records to a `Party` rather than inventing
  `SalesCustomer`, `FinanceCustomer`, etc. — Sales' `Opportunity`, `Quote` and
  `SalesOrder` all reference `Party` this way.
- **ModuleState** — per-org enable/disable flag for a module id. The module
  catalogue itself (capabilities, nav, manifest) lives in code, not the
  database. Customer Master itself is Core, not a module — it has no
  `ModuleState` row.
- **AuditEntry** — who did what to which entity, with before/after JSON.
  Written via `writeAudit()`; never store secrets/sensitive payloads here.
- **Activity** — human-readable feed entry, written via `writeActivity()`,
  rendered on Home. Carries an optional `partyId` (independent of
  `entityType`/`entityId`) so it can also power the unified customer Activity
  tab without Customer Master knowing each module's entity shape.

## Money

Stored as integer minor units (`Int`, e.g. pence) + an ISO currency code
string. Never store money as a float. Format with `formatMoney()`
(`src/core/shared/money.ts`).

## Sales (reference module)

`Opportunity` → optional `Quote` (with `QuoteLine[]`) → optional
`SalesOrder`. All three reference `Party` and `Organisation`. Enum fields
(`OpportunityStage`, `QuoteStatus`, `SalesOrderStatus`) model the status
language from `docs/DESIGN_SYSTEM.md`.

## Customer Service, Tickets and Queries

Customer Service retains `ServiceCase` linked to canonical `Party`, Contact and
verified source purchase context. Shared Core `ServiceWorkItem` represents distinct
TICKET / QUERY kinds; Query origins reference accessible cases or work items.
`ServiceWorkEntry` preserves append-only history; `ServiceQueue` retains membership,
restricted access and configured SLA/catalogue definitions. `ServiceFile` stores
opaque metadata for bytes held only in private server storage. `ServiceRecovery`
and `ServiceRedemption` retain independently approved, bounded benefits and explicit
Sales applications. `ServiceKnowledge` stores reviewed article versions.

Migration `20261007190000_service_work_desk` is additive: it also adds case context,
clock/merge fields and CSAT integrity fields, preserves historical cases/department
work and backfills historical comment timestamps. Canonical Finance documents,
Logistics returns, Sales orders, Inventory positions, Quality NCRs and CSAT responses
remain authoritative; Service does not duplicate their ledgers. See
[connected service desk](modules/SERVICE_WORK_DESK.md).

## Adding a module's entities

1. Add models to `prisma/schema.prisma`, prefixed `<module>_` for table names
   (`@@map("fleet_vehicles")`).
2. Relate to `Party`/`Organisation` where the entity represents a
   relationship with a tenant or a real-world company/person — don't
   duplicate either.
3. Add an index on `organisationId` (and any other frequently-filtered
   column).
4. Run `npm run db:migrate` and commit the generated migration.

## Local development

See [`docs/LOCAL_DEVELOPMENT.md`](./LOCAL_DEVELOPMENT.md) — `npm run dev:all`
runs a real local Postgres (no Docker/Homebrew/cloud DB needed) and applies
migrations automatically. For a shared/staging/production Postgres instance,
set `DATABASE_URL` and run:

```bash
npm run db:migrate
npm run db:seed
```


## Connected Plan inputs and S&OP — 7 October 2026

Additive source migration `20261007160000_connected_plans_sop` introduces:

- `PlanInput`: tenant/plan/product references, authorised polymorphic source link,
  monthly measure/value, source-linked or overridden probability, selling price,
  inclusion, required reason and optimistic revision. Canonical Party/Product,
  CRM project/opportunity, Sales quote and HR employee identities are reused.
- `BusinessPlan.revision`: compare-and-swap protection for builder/grid writes.
- `SopCycle`: tenant/owner, privacy, dates/currency, selected Plan IDs, settings,
  exact-version review stages, risks/actions/decisions and input/workflow revisions.
- `SopVersion`: immutable payload and lineage, source capabilities/modules,
  creator, source revision and approval/publication metadata. Private scenarios
  are creator-scoped. Approval/publication do not rewrite snapshot payloads.
- `ManufacturingDemandForecast.sourceSopVersionId`: retained publication lineage;
  manual Manufacturing forecast edits clear this link.

New source/snapshot records are exposed only through authenticated tenant-scoped
use cases, not the generic database read allowlist. The additive migration is
applied on the live server; a database trigger also blocks calculated evidence
rewrites. Activation and 42 authenticated acceptance checks passed. See
[the S&OP module](modules/SOP.md) for implemented behaviour and genuine gaps.

## Studio metadata kernel

`StudioDefinition` is a tenant-owned UUID plus non-recyclable key/kind; the active
version is a separate pointer. `StudioDraft` stores revision, base published
version, editor, validated payload and validation results. `StudioDefinitionVersion`
stores immutable payload/compiled plan, schema/semantic versions, checksum and
publication actor/time. `StudioDependency` pins owner contract IDs/versions/hashes.
Composite foreign keys require every draft/history/dependency/pointer to share the
definition's tenant. Publication is serializable and audited. Metadata tables never
store copies of domain records. The additive migration is
`20261009210000_studio_metadata_kernel`; the execution ledger records application
and runtime verification. Immutable history deletion is only permitted by the
existing explicitly authorised Test-company cleanup flag for database-confirmed
Test customer organisations. Production history is retained.

## Studio additional fields — Phase 2B2 source checkpoint

Five additive models reuse the metadata kernel: permanent StudioFieldBinding and
immutable StudioFieldGeneration; canonical-ID StudioExtensionRecord CAS anchor;
per-generation StudioFieldSlot current pointer/uniqueness marker; immutable typed
StudioFieldValue history bound to its exact published schema. No native business
columns are copied or changed. Composite FKs bind tenant/entity/family/generation,
with deferred initial/current pointer cycles and typed SQL checks. Decimal physical
capacity is 38,10; declared logical precision/scale/currency is separately enforced.
Migration 20261009220000_studio_typed_fields is additive. See the Studio ledger for
actual application/verification status; schema existence is not a working value API.
## Pre-authentication infrastructure — 9 October 2026

`AuthenticationRateLimit` (`authentication_rate_limits`) stores HMAC keys, attempt
counts and expiry for central atomic login/recovery throttling. It deliberately
has no tenant identity: it runs before a session exists and exposes no email, IP
or credential. It is private server infrastructure, excluded from company exports
and data-gateway reads. Additive migration `20261009220000_authentication_attempt_limits`
changes no business records or permissions. Expired counters are disposable;
see `docs/ATLAS_ADMIN.md` for the enforced limits and private staff address.

## Connected People workspaces — 9 October 2026

Canonical Employee, Kpi, RotaShift and PlannerTask remain the shared identities.
Company-owned KpiScorecard/items weight shared goals; StaffingInterval and
OpenRotaShift/requests add intraday demand and assignment into canonical shifts.
EmployeeAvailability and RotaActivity use tenant-bound employee/shift foreign keys.
Root scorecards, intervals and openings also have Organisation foreign keys.
PayrollPeriodAdjustment stores reviewed replacement/statutory/additional inputs;
EmployeeTaxYearToDate retains reviewed opening history separately from finalised
YTD. PayrollRun holds the reviewed calculation snapshot/digest/version; Payslip
records approved actual hours/source timesheets. Drafts do not advance YTD.
New tables stay closed to generic desktop queries; named permissioned readers
serve their workspaces. Sensitive pay setup remains outside generic HR reads.
See docs/plans/PEOPLE_PLATFORM_OVERHAUL.md for calculation and integration limits.


## Studio field review archive — Phase 2 checkpoint

StudioFieldMigrationPreparation pins the exact tenant-owned source version and
storage generation, draft identity and frozen conversion intent. State/revision
changes are separate from that immutable identity. StudioFieldMigrationReview seals
one review per operation; StudioFieldMigrationObservation retains native IDs and
source extension/slot/value revisions with immutable value fingerprints. Composite
foreign keys preserve tenant/field/generation links. A new target/mapping requires
a new operation. No business values are copied into review metadata, and generic
desktop reads remain denied. These additive archive models do not provide a
preview API, migration executor or cutover; see the Studio ledger for actual
migration/constraint verification status.


Studio field preparation service pins the server-loaded active source and target
draft into the existing immutable archive under SERIALIZABLE and identity/profile/
source locks. Matching operation UUID replay returns the same preparation without
another Audit; stale/changed/cancelled intent requires a new review. Starting writes
no field values, target generation or activation. See the Studio ledger for actual
candidate/public proof versus locally implemented services. No new schema here.


The migration observation helper fetches source pointer and immutable written-schema
metadata before business columns, checks current/written policy and schema hashes,
then decodes exact typed values. Referenced-owner denials abort; closed invalid
source/target classes never copy raw values into observation metadata. It returns
references/revisions plus a conversion fingerprint; persistence/sealing remains a
separate workstream. No native data or target values are changed by observation.

Studio field review collection uses the existing immutable archive in short
Serializable transactions: refresh stored actor and policies, prove pinned source/
draft/compiler/owner identity, derive the cursor from saved observations, append
1–50 rows with preparation revision CAS and existing Audit atomically. Replaying
an old revision does not advance. Cursor exhaustion is not sealed coverage or
permission to execute; exact source/native review sealing follows separately. No
new schema, target value or protected native write is introduced by collection.

Source coverage validation delegates exact canonical membership/revisions to the
owner, then locks and compares every current extension/slot/value pointer against
immutable observations and checks distinct written-schema ACL/checksums without
value columns. Equal native counts are insufficient. This internal prerequisite
returns no data or approval; references, uniqueness and digest/state/Audit sealing
remain required before an executable reviewed operation.

Field review sealing derives the existing v1 canonical ordered digest and closed
counts from immutable archive metadata inside the fresh source/native/written
policy transaction. It rejects duplicate non-null converted fingerprints when
target uniqueness is required, then inserts the same-operation immutable review,
preparation REVIEWED/revision CAS and Audit atomically. Fresh sealed replay writes
nothing; changed source invalidates it. Failed/lossy rows remain visible as review
summary, never execution authority. No target publication or activation occurs.
Reference fields additionally require explicit same-entity approved versions and
pinned owning-domain reference coverage before aggregate/review, including replay.
Tickets entity v4/query v2 implements actual canonical target existence/tenant/kind
and complete current-member/private access; legacy/missing opt-in denies review.
Reference coverage VERIFIED on 32ee77e full candidate/public acceptance. The service is internal and not a public/desktop generic-data endpoint.


Reviewed publication (2B3d1–d4 VERIFIED candidate/public ea27b2f): StudioFieldMigrationPublication
binds the immutable review to a distinct target generation/version/checksum and
publisher/loss acknowledgement. An additive partial unique index permits only one
PUBLISHED operation per field/tenant; retained identity is immutable and cancellation
requires state/revision CAS. Exact post-publication metadata freshness does not
relax earlier preparation freshness. Pending generation activation and normal
target writes are denied; open source/draft/metadata changes freeze until cancellation
or later reviewed execution/cutover. Native domain operations remain unchanged.
The schema is not a migration executor; actual SQL constraints passed central candidate/public acceptance.


The reviewed publisher and sparse cancellation service use the shared metadata
publisher and exact review inspector. Migration 20261010040000 applied successfully;
actual candidate/public receipt/freeze/Audit rollback/replay/cancellation/runtime
constraints passed in ea27b2f. No target values/executor/cutover or public migration
action is exposed. Native operations and permission architectures are retained.


Execution persistence (2B3e2b VERIFIED candidate/public f5bb914):
StudioFieldMigrationExecution retains exact publication/owner-policy pin and CAS
state RUNNING/READY/FAILED/CANCELLED, cursor and count. Immutable
StudioFieldMigrationOutcome binds the scoped source observation to exact target
extension revision/slot/value; deferred FKs and commit guards require target and
progress together. Only recorded own increments can explain source extension changes.
Normal source saves and premature target activation stay denied. Cancellation of
publication atomically cancels execution and retains outcomes, without business reads.
The original preparation/publication freshness is unchanged; a separate execution
proof validates source and target lineage. New generic models/counts remain denied.
20261010050000 applied in central preparation (backup 20261010-042335). Exact
candidate/public f5bb914 proof covers owner-approved final/unanchored/scalar rows,
atomic/deferred progress and mid-batch/start/batch Audit rollback, process death,
new-process resume, private/tenant/history/cancel/source compatibility. Both native
tenant snapshots unchanged. No cutover/ordinary value gateway or visual builder yet;
final RUNNING batch+failure-marker Audit proof and cancellation revision reserve also
passed in 8d6eb9e complete candidate/public acceptance after PostgreSQL disk-event
recovery. Migration remains applied; no reset, restore or SQL repair. Recovery backup
and earlier failed candidate evidence are preserved in the Studio ledger.

2B3f1 defines a pure closed cutover identity (no new model/migration or activation).
It binds current READY execution/review/publication and source-active definition CAS,
with explicit unchanged-representation rollback limits. Eight focused and 257 scoped
regression assertions, build/types/lint PASS; actual authorised-row identity proof
passed in 080e4d7 complete candidate/public acceptance. Receipt storage is now VERIFIED5f5fce5; atomic activation is VERIFIED9aad1fc complete candidate/public. Rollback/value gateway/visual builder remain pending.

2B3f2 storage checkpoint (VERIFIED on 5f5fce5 complete candidate/public;0006 APPLIED):
StudioFieldMigrationCutover has scoped execution and source/target immutable-version
FKs, closed f1 pin/checksum and retained publisher/history. Additive 20261010060000
requires receipt, PUBLISHED→CUTOVER CAS and exact source→target/revision+1 pointer
together with deferred proof. Old freshness stays source-active; source/target and
configuration remain frozen at this checkpoint. No normal-write or production
activation/rollback API. Central backed-up DDL rollback and 257 scoped assertions/
build/types/lint PASS; actual central rollback-only storage guards passed candidate/public. Generic
receipt reads/counts denied; unchanged 905 actions. See Studio ledger.

2B3f3 activation service checkpoint (VERIFIED9aad1fc complete candidate/public): no schema
change. Strict current READY review/publication/definition confirmation creates the
retained receipt, CASes publication and reuses the platform activator/source-pointer
CAS with paired Audit in one refreshed-authority Serializable transaction. Replay
checks actual receipt/target-active metadata and retained source/target coverage,
then owning native/private/current/written/reference/unique policies. Old freshness
unchanged; normal values/rollback remain closed. 286 local assertions/build/types/
lint PASS; actual candidate/public service proof PASS, including both paired-Audit
failures, concurrent CAS/raw conflict, fresh replay and current access revocation. See Studio ledger.

F4b1 settlement storage (IMPLEMENTED locally, central backed-up DDL rollback passed, actual Test proof pending): additive
20261010070000 adds nullable settlement pin/checksum/actor/time; original0006
ACTIVATED receipts and immutable source/target/conversion history remain compatible.
Only ACTIVATED/revision0→ROLLED_BACK or FINALIZED/revision1, with matching
CUTOVER→ROLLED_BACK or COMPLETED publication and exact source-restored or target-
retained pointer, can commit. Terminal receipt update/delete remains denied. One
open receipt per tenant/field. Rollback storage additionally requires unchanged
source/target representation; metadata-only finalization closes the rollback
window even if other extension data changed. SQL identity shape does not prove
current native/private access; production current-authority services follow.
Ordinary value/generation continuation remains closed pendingf4b2/2B4.
