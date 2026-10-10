# Field evolution workstreams — 2B3

Source: unchanged Studio specification Sections 6.4, 24–24.1 and 25–28.
Dependencies: 2B2 permanent field identity, immutable generations/typed history and
metadata publication. 2B3a pure library VERIFIED on candidate/public 7941f9b (tests/types/lint/build); combined 2B2 candidate/public e5d66e6 release acceptance PASS.
2B3b retirement VERIFIED on candidate/public 7941f9b (35 local tests/types/lint/build and real central checks PASS); Reviewed publication is VERIFIED on ea27b2f complete candidate/public suites. Batches/cutover remain NOT STARTED; principal and review foundations are VERIFIED live. This plan breaks the specified operation into
reviewable checkpoints; it does not substitute for the supplied specification.

| ID | Purpose and dependencies | Expected files / database | Required evidence | Status |
| --- | --- | --- | --- | --- |
| 2B3a | Typed compatibility analysis and deterministic conversion rules; depends on existing validators | fields/evolution and conversion tests; no DB | Stable field/entity identity; exact integer→decimal bounds; explicit string→enum mappings/unmapped policy; explicit date/UTC semantics; no inferred money currency or changed reference targets | VERIFIED candidate/public; pure library only |
| 2B3b | Retirement with CAS and audit, retaining published schema, binding and history | definitions/field lifecycle + tests; additive metadata only if required | Tenant/publish access, stale revisions, no further editing/activation, authorised history retained, keys not recycled | VERIFIED backend candidate/public 7941f9b; no history API/UI |
| 2B3c | First-class reviewed plan, preview and durable job/row state | fields/migrations, Prisma additive migration | Source/target version/checksum, affected count, bounded authorised examples/failures, index impact and rollback limits; forged/stale plans rejected | IN PROGRESS; c1 principals verified candidate/public 7941f9b; preview/persistence not started |
| 2B3d | Reviewed target publication into a new generation | compiler/binding/lifecycle, job FK constraints | Immutable old schemas/values, exact target plan required, unsupported structural changes fail closed, target publication does not activate it | VERIFIED ea27b2f candidate/public |
| 2B3e | Bounded resumable/idempotent conversion batches | migration runner/codec, durable row outcomes and tests | Owner and field access rechecked, source value revision checked, atomic target value plus outcome, failure/restart/replay evidence, no native mutation | IN PROGRESS; execution contracts/inspection locally checked, actual rows pending |
| 2B3f | Explicit cutover and rolling read compatibility | activation/resolver and subsequent 2B4 gateway | Source remains readable until cutover; all failures/conflicts resolved; uniqueness/required/access rechecked; CAS activation and auditable rollback limits | NOT STARTED |
| 2B3g | Central migration acceptance and checkpoint | existing isolated Test driver, docs/memory | Real preview, failed batch, resume, duplicate invocation, tenant/permissions, retained history, cutover/rollback, production build and live verification | NOT STARTED |

Review the actual published source and current source slots; client counts,
conversion examples or compiled plans never authorise a migration. Review tokens
must bind the exact tenant, field, source/target checksums and observed revisions.
Long jobs use short bounded transactions and durable row outcomes; do not hold a
business transaction while waiting for the next batch. Recheck the initiating
actor's current membership/capabilities and source availability on resumed work.

Owner policy is a dependency, not a permission shortcut. Tickets currently permits
extension writes only on accessible, non-final, non-merged records, with native
revision/queue checks and a shared transaction. Determine explicitly how the owner
approves representation migration of historical/final records before implementing
that path; preserve its existing mutation restrictions and sealed v1/v2 contracts.
Do not bypass that policy using direct native SQL or treat a failed owner check as
a successful conversion. Unavailable rows remain explicit blockers to cutover.

Specify how concurrent writes are coordinated before opening the 2B4 value API.
If a migration temporarily freezes editing, enforce the freeze on the server and
explain it in the UI. Reads use the approved source representation until reviewed
cutover. Preserve source generations/history and define rollback limits after
target-only writes; never imply lossless rollback where no reverse conversion exists.
No field purge, Flow engine, Process engine or Packages implementation belongs here.

## Confirmed access dependency before 2B3c

`core/studio/definitions/admin.ts` deliberately provides a metadata-only company
context, retaining the staff membership identity. Its own contract prohibits
using it to impersonate customers or query business records. Retirement is metadata
only and fits that context. Migration preview/counts/examples and row processing
must not reuse it as authority to read stored values or native records.

Existing `sessionForUser` reloads actual active target-company membership and current
permissions; it returns null for departed members/suspended companies. Existing
Admin `openCompanyWorkspace` explicitly creates/reactivates a staff affiliation,
audits `atlas.workspace.opened`, then changes the company session. Reuse the owning
support authorisation mechanism for explicit data access rather than inventing a
second permission model. If preview remains inside Admin, extract a purpose-bound,
audited support context without bringing the business app shell into the console.
Do not create affiliations/grants merely because a configuration draft is opened.

Before implementing job persistence, define and test how the initiating principal
is stored and refreshed on resume. Customer jobs need a real target membership;
staff jobs need explicit audited support authority, not persisted capability sets.
Every record still passes native owner/private-queue and current/written field
checks. Inaccessible records block review/cutover without leaking their values or
identities. Provide approved sample content for design previews where live record
access is not authorised. The context dependency is implemented locally in 2B3c1 below; no UI/job authority
is claimed before its real acceptance checks.

## 2B3c1 — Current principal and explicit data support context

Purpose: authorise migration preview/job data without treating configuration target
selection as company membership. Dependencies: existing sessionForUser, independent
Atlas staff permissions, real active company membership and Studio publish/module
checks. Expected files: fields/principal.ts and focused principal tests. Database:
no new model/migration; one explicit support audit in the existing Audit engine.

VERIFIED backend on candidate/public 7941f9b: captureCustomerFieldMigrationPrincipal rejects metadata-only
membership and staff masquerading as customers. openFieldMigrationSupportContext
requires refreshed platform access plus an existing active target affiliation,
then saves a purpose-bound audit; it creates no affiliation/roles/grants and does
not change the browser session or mount business tools. Jobs will store identity,
membership and auth/session versions, with support audit identity where applicable.
resolveFieldMigrationPrincipal reloads current grants and checks revocation and the
exact audit stamp. It accepts server-stored identity only, not a client endpoint.
Native owner/private-record and both current/written field checks remain mandatory.

Checks: 3 files/16 assertions PASS; strict post-build TypeScript, scoped lint and production build PASS. Real central checks on candidate/public 7941f9b PASS. No endpoint/job wiring. 2B3c2 reviewed preview/job persistence
remains NOT STARTED. Retirement candidate release is separately awaiting combined
acceptance/public proof with current live business separation preserved.

Before exposing restricted live conversion examples, enforce the specification's
explicit live-data test permission as well as owner/current/written field access.
Absent that authority use approved samples/redaction; counts and job details must
not reveal inaccessible records. No live-preview permission or UI added here.

## 2B3c2 — Preview and job persistence design checkpoint (NOT STARTED)

Purpose: make a reviewed conversion a durable, tenant-owned operation with stable
source/target identity and explicit per-record outcomes. Prerequisites: 2B3c1 real
principal acceptance and native owner cohort/representation authority. Expected
files: fields/migrations, additive Prisma job/row models and SQL guards, focused
service/schema tests and central helper. No domain tables or local datastore.

Before coding persistence, resolve owner cohort coverage: registry list projections
are intentionally scoped to visible records and cannot prove whole-tenant coverage.
Add an owner-approved, versioned preflight that can reject incomplete private-queue
access generically, without revealing inaccessible IDs/counts. It must include
canonical records with absent Studio anchors for required-policy coverage. Keep
sealed Tickets v1/v2 hashes unchanged and ordinary final/merged write restrictions.
Representation-only migration requires an explicit owner hook and a reviewed
source value; it must never become another normal-write intent.

Durable review binds exact definition/draft revisions, active source version and
checksum, target payload/checksum, closed conversion rule, refreshed initiating
principal and deterministic observed owner/value revisions. Store redacted preview
examples/failure classes, index/unique impact and rollback limits. Job rows record
source identity/revision and outcome atomically with any target value; duplicate
invocation and restart must resolve the same outcome. Do not hold a business
transaction across batches. Current/written field ACL and owner policy govern
preview, job detail and every batch. No preview count or source value from a client
can authorise publication, conversion or cutover.

A reviewed source must stay readable until explicit cutover; preserve all source
generations/history. Coordinate native record/value writes and configuration
retirement/publication/activation with a server-enforced migration gate before
opening 2B4. Stale source revisions require explicit re-review rather than silently
converting a different value. A changed mapping/target is a new immutable review;
retry cannot replace a reviewed plan. These are design dependencies, not delivered
job models, preflight or runtime behaviour.

### 2B3c2a — Owner cohort-access preflight (VERIFIED)

Implement a closed Tickets registry query for whole canonical TICKET access
coverage/count, using a short serializable owner transaction, source module lock,
native read/manage capabilities and private-queue membership. Reject incomplete
coverage generically before returning any count. Include final/merged records and
records without Studio anchors in the count; this grants no final/merged write or
representation-conversion authority. Preserve sealed entity v1/v2 and normal owner
writer. Expected files: service-work/studio, new focused owner tests and real
principal helper. Database: none. Tests: missing native access, disabled source,
private nonmember denial without identity/count, scoped count including no anchors,
empty tenant and unchanged sealed contracts. Remaining representation hook and job
persistence are separate NOT STARTED dependencies.

2B3c2a local evidence: 4 files/22 tests including sealed v1/v2 hashes, production
build, strict post-build TypeScript and scoped lint PASS. New central helper tests
a real final record and unanchored native ticket, removes/restores only its exact
new Test queue membership to prove denial before counts, and checks unchanged
canonical records. Actual helper PASS on 931a600 candidate/public. No final/merged
representation write hook or durable job implemented.

### 2B3c2b — Typed stored-value decoder for previews (VERIFIED)

Purpose: convert typed SQL columns into validated logical values using the written
field schema before conversion preview. Dependencies: 2B1 validators, 2B2 typed
storage, 2B3a converter; no new data authority. Expected files: fields/codec and
focused codec tests; existing privileged exact-Test storage helper. Database: none.
Checks: exact 28-digit decimals/money, safe integer/duration bounds, zero/false/null
distinction, UTC calendar/instant semantics, closed family/type matching, historical
retired enum IDs, malformed address/reference/extra columns and redacted failures.
This pure library is not an authorised value API. Native owner plus current/written
field ACL and reference-target checks remain mandatory in preview/2B4 services.
No encoder/value writer, migration job or later engine in this checkpoint.

Local evidence: three files/24 assertions, production build, strict post-build
TypeScript and changed-file lint PASS. Seven codec tests cover all 15 field types.
First fixture run failed four assertions; corrected duration/timezone/phone policy
and normalised address fixtures, preserving validation. Real SQL decimal/money
helper assertions PASS on 931a600 candidate/public runtime.

### 2B3c2c — Stable combined release acceptance (VERIFIED)

Purpose: complete cohort/decoder proof without another verified release advancing
between candidate and activation. Dependencies: deployed People/Supply acceptance
hook and existing proven combined Test runners. Files: deploy/check-studio-release.sh,
vps-release.sh and deployment/memory/ledger docs. Database: no schema change;
back up central Test writes before each candidate/public run. Tests: shell syntax,
closed selector rejection, exact revision/pointer, real Studio/storage/cohort and
existing Home/Reports/MRP/Messages/Admin/supply/commercial/People acceptance.
Reuse original locks, build/compatibility/backup/switch/rollback; no second locking
mechanism or arbitrary shell hook. Other acceptance selectors remain unchanged.

2B3c2c local evidence: shell syntax and three unrecognised selector/foreign URL/
wrong phase-URL rejection checks PASS before database/service actions. Integrated
23 files/135 assertions, generation/build/strict types/scoped lint PASS. Combined
runtime candidate/public PASS on 931a600. No Phase 2 gate or designer completion.

Dashboard live integration: preserved exact publicly verified 70ca23e modern UI
and all native acceptance modes. Review caught dispatcher omission of Studio after
merge; fixed before deployment. Five mode dispatch probes and shell syntax PASS.
Regenerated client/descriptors, 28 files/164 tests, production build, strict post-
build TypeScript and scoped lint PASS. Combined Studio runtime PASS on 931a600.

## Next persistence/owner checkpoint dependency (DESIGN; NOT STARTED)

After current cohort candidate/public proof, introduce immutable review identity,
separate resumable job state and tenant-owned per-record observations/outcomes.
A review pins definition/draft/source versions and checksums, closed target/rule,
refreshed principal, actual owner cohort and observed value revisions. Rows include
canonical records without slots; reference immutable source values rather than
copying their business payload into job metadata. Live examples require explicit
live-data-test authority plus native/current/written field and reference access;
redacted classes/counts cannot reveal inaccessible identities. No new live-test
permission, preview service or model is implemented yet.

Refine the local order: review/job/row persistence precedes the executable final/
merged representation hook. A hook accepting a caller's `reviewed: true` cannot
establish a real reviewed source. The owner hook instead takes a server-stored job
row identity, rechecks its tenant/source/job state and current native scope under
one transaction, and preserves all native fields. Core verifies the exact reviewed
conversion, source pointer/revision and both field policies before target storage.
Use a new entity contract version; sealed v1/v2 and ordinary `extend` stay unchanged.
This refines the implementation plan, not the specification's phase order or safety
requirement. No conversion executes before both persistence and owner policy pass.

Cutover coverage must prove the exact current canonical set against reviewed rows,
not just equal counts (a deleted record plus new record can preserve a count).
Prefer an owner-approved transactional missing/extra-row check using tenant/entity
job references; never expose hidden IDs/counts or use visible-list pagination as
proof. Add owner evidence for absent anchors, final/merged work, foreign/missing
records, incomplete queue access and concurrent set changes. These are remaining
requirements, not implemented checks or authority to write final records.


## 2B3c3 — Immutable review contracts (VERIFIED locally)

Purpose: define the exact closed server-stored review and canonical per-record
observation format before creating durable tables. Dependencies: verified current
principal, whole-owner access preflight, validators/converter and SQL decoder.
Expected files: fields/migrations/contracts.ts, pure principal contract extraction,
focused review-contract tests, ledger/state. Database: none in this checkpoint;
subsequent additive review/job/row persistence must implement tenant/source FKs.
Tests: exact source/draft/target/principal binding, no capability snapshots/scripts,
source/target generation separation, deterministic streaming canonical-set digest,
absent anchors/slots, mismatched fingerprints/revisions, redacted corrupt/stale
review rejection. Sealed source metadata/hash contracts remain unchanged.

The review checksum is an integrity check, never client authority. Only a server
service can collect owner-authorised observations, compile both schemas, persist
review plus audited identity and recheck live state. No preview endpoint, migration
executor or final-record representation hook is introduced by this contract. Do
not mark persistence or the wider reviewed migration operation complete from it.


2B3c3 evidence: 4 focused files/32 assertions, production build, strict post-build
TypeScript and changed-file lint PASS. Eight review cases include integrity/stale
bindings, foreign identity/default insertion/script rejection, missing anchors,
immutable value pins, changed same-count membership, ordering/duplicate rejection
and redacted failures. This is a pure contract, not a preview/persistence feature.

## 2B3c4 — Durable preparation/review observations (VERIFIED archive candidate/public)

Purpose: persist a frozen preparation intent, immutable review and immutable
per-record source observations. Dependencies: 2B3c3 contracts, verified typed
storage and current principals/owner preflight. Files: Prisma models, additive
20261010030000_studio_field_reviews SQL, contracts/helpers as needed, exact-Test
storage acceptance helper and memory/docs. Database: three new tenant-owned tables;
composite source-generation/version/draft/extension/slot/value FKs, retained history,
indexes and CAS guards. No business tables/records changed. Add one composite
unique draft index for tenant-bound identity; no destructive reset/backfill.

Only PREPARING/REVIEWED/CANCELLED states in this checkpoint. Immutable rows contain
references/revisions/fingerprints, never copied business values. Collection is a
separate future service; server checksums are integrity rather than authority.
Review seals exactly the stored intent and row counts/results; app validates the
ordered digest. Whole canonical set, live owner/field access and source/draft
freshness remain required before executable publication/cutover. No target values,
final-record writer, preview endpoint or conversion worker yet.

Checks: schema validation/generation, real central DDL/tenant FKs/immutable intent,
CAS/state guards, stale source/draft rejection, row linkage and sealed append denial,
full rollback on audit failure, build/types/lint and candidate/public integration.
A table existing is only IMPLEMENTED until actual database constraints pass.


2B3c4 local evidence: schema/generation PASS, initial long index name/one-to-one
unique errors corrected before SQL generation. All additive DDL executed centrally
inside BEGIN/ROLLBACK successfully; NOT applied. Five files/34 assertions,
production build, strict TypeScript and scoped lint PASS. Gateway descriptors
regenerated; direct/aggregate reads remain denied even to configuration staff.
Exact-Test support-principal helper exercises missing anchors and real immutable
slot/value references, sealed append guards, stale draft and audit rollback; NOT RUN
until compatible backed-up candidate. No public preview/migration runner claimed.


## 2B3c5 — Owner transactional snapshot/coverage contracts (IN PROGRESS)

Purpose: collect bounded canonical record anchors and verify the exact canonical
set against persisted observations, without Core scanning an owner's native tables.
Dependencies: c4 archive constraint/public proof, existing whole-owner access policy.
Expected files: registry types/factory/runtime, service-work/studio owner callbacks,
focused transaction/owner coverage tests and module docs. Database: no new schema;
read existing canonical records and new tenant-owned observation references only.

New queries explicitly require a server-supplied shared transaction; ordinary
invocation must reject. Preserve existing query/entity v1/v2 hashes and runtime.
Owner checks enabled/entitled source, native read/manage, private membership and
whole canonical access before returning any IDs/counts. Snapshot includes final,
merged and unanchored rows with stable paging. Coverage rejects missing/extra IDs
and changed native revisions generically; equal counts are insufficient. No native
mutation, final-record write authority or public preview endpoint in this checkpoint.

Tests: required transaction, wrong query/tenant/job/source, disabled source/missing
native permissions/private member, bounded snapshot and canonical-set substitution,
missing anchors/final records, no native writes and old sealed contract hashes.
Core collection service subsequently refreshes principal and validates current plus
written field and reference access, explicit live-test permission and source-value
CAS. Job-backed representation authority follows reviewed publication; do not add
migration intent to the existing ordinary record authorisation method.


2B3c5a scope: first add explicit transaction-required query descriptors and a
server-context registry invocation method. Ordinary invocation rejects those
queries; transactional invocation rejects commands and older queries that have
not opted in. Typed context contains the existing Prisma transaction, never a
client-supplied identity/connection. Existing descriptor details/hashes remain
unchanged when the option is absent. Files: types/contracts/registry and focused
registry tests. Database: none; no new owner query or executable migration yet.


Final c4 evidence: exact 8780a07 full candidate/public combined acceptance PASS,
deploy exit 0, current health/pointer match and previous 1646316 retained. Additive
migration applied after backup; actual private logs yWPgWM/6U4Ohy include source/draft/
tenant/slot/value links, absent anchors, history/sealed append, stale/CAS/audit
rollback. This supersedes earlier unrun constraint notes; collection, live preview,
reviewed publication and executable batches are still unimplemented.


c5a local evidence: six focused files/30 assertions, production build, strict
post-build TypeScript and changed-file lint PASS. Tests cover server transaction
identity, native/source/input/output guards, old hashes, source-descriptor mutation
and command-idempotency boundaries. No owner snapshot query yet. This foundation
will ship with the next owner checkpoint; current live archive remains 8780a07.


2B3c5b scope IN PROGRESS: a single versioned Tickets transaction-only query with
preflight/snapshot/coverage modes keeps the whole owner read protocol under one
pinned reference. Entity v3 declares the read-only snapshot opt-in and approved
source versions 2/3; sealed v1/v2 and ordinary final/merged write guards stay intact.
Require actual active target membership and SERIALIZABLE isolation before native
coverage/IDs/counts. Snapshot pages only canonical anchors; coverage checks exact
persisted membership plus native revisions, not equal counts. No field values or
representation writer. Core's subsequent collection service still checks explicit
live-test authority, current/written field ACL and reference targets.
Files: registry entity schema/types/factory/registration, service-work owner adapter,
owner snapshot tests and existing exact-Test principal/review helper. Database: no
new DDL, read only native records/membership and current archive. Tests include
missing transaction/isolation/membership/source/permissions/private access, final/
unanchored rows, foreign job, missing/extra/stale/same-count substitution, original
hashes and no native writes. Real central acceptance required before completion.


c5b implemented local evidence: 9 focused files/51 assertions, production build,
TypeScript and scoped lint PASS. Central owner SQL/helper assertions added but
NOT RUN. No new DDL. Pin shared-query foundation plus owner protocol together,
then actual combined candidate/public acceptance before VERIFIED.


## 2B3c6a — Explicit data-preview authority and field/reference policies (IN PROGRESS)

Independent prerequisite for collection, while c5b central proof runs. Purpose:
register a separate live-data test capability without auto-granting it through
standard roles, staff uplift or app presets; apply current and written field read/
write policy before data decoding, and authorise reference records through their
registered owning entity. Dependencies: verified principal/compiler/native record
contracts. Files: Studio permissions/manifest, existing access presets, one typed
field access helper and focused permission/reference tests. Database: none, no
role backfill or existing membership grant. Exact-Test fixtures may use approved
sample data after the same tenant/native/field guards; production rows require
explicit live-data capability. This helper is not a preview endpoint or collector.
Tests: automatic grants/presets absent, server-owned company identity/Test flag,
missing current/written rights denied, referenced owner/tenant/source failures
propagate without revealing payload, shared transaction and historical read only.
Completion: local tests/types/lint/build plus central collection integration in
c6b; only independent pure contracts can be VERIFIED locally. c5b remains pending.


c6a pure contract verified locally: 4 files/18 assertions, production build, strict
post-build TypeScript/scoped lint PASS. No runtime preview/collector. c5b actual
sealed candidate owner checks PASS; full/public acceptance pending. No DDL.


## 2B3c6b1 — Start an authenticated pinned preparation (IN PROGRESS)

Purpose: create an idempotent audited preparation from actual server source/draft
state without client-supplied payloads, checksums, principals or organisation IDs.
Dependencies: c6a policies and existing c4 archive; owner protocol must pass public
proof before service release. Input: operation UUID, definition UUID and expected
definition/draft revisions plus closed conversion rule. Principal is a separate
server-only parameter from existing capture/support service, refreshed on entry
and under membership/user/role locks. Require matching acting identity, server
active company, Studio/source availability, both field policies and owner target
snapshot opt-in; pin source version/checksum and compile target server-side. Source
generation binding and full owner preflight precede persistence. One SERIALIZABLE
transaction writes immutable intent and existing Audit; replay must match checksum,
principal and fresh source/draft exactly. No values, observations, target generation
or activation are written. Files: migrations/preparation service and focused tests,
central exact-Test helper next, docs/memory. Database: no DDL; existing archives.
Tests: fresh permissions/tenant, forged identities/payload, missing owner policy,
stale revisions/source integrity, changed-idempotency payload, audit rollback and
no native/target mutation. Completion requires central actual service proof; local
mocks alone are not feature VERIFIED. Collection/sealing is next c6b2.


c5a/c5b VERIFIED: exact 5d101da full combined candidate/public and deploy exit 0,
public health match; native canonical rows unchanged, prior 8780a07 retained.
c6b1 implemented locally: 10 files/52 assertions, build/post-build TS/scoped lint
PASS. Central actual service helper NOT RUN. No persistent DDL; rollback proof
uses a temporary Audit trigger/function constrained to a single new Test company,
actor and operation, with finally removal. Collection/sealing remains c6b2.


## 2B3c6b2a — Authorised immutable source observation (IN PROGRESS)

Purpose: implement one row of a future bounded collector without an execution
worker or public data endpoint. Trusted context is the refreshed batch principal,
server-loaded company and sealed intent; caller supplies an owner snapshot anchor.
Recheck native owner read/manage and anchor revision, current/target policies, then
load only source pointer/written schema metadata before decoding any stored value.
Validate written compilation/hash/generation and current+written field policies;
authorise referenced native records through written/current/target owner contracts.
Return only immutable refs/revisions plus closed conversion result class/hash, no
raw values. Bad source storage/fingerprint/conversion produces a redacted invalid
row; permission/reference/integrity failures abort. Source ext/slot read locks and
SQL append guard protect later persistence; final exact set/pointer checks remain
c6b2b. Files: migrations/observation and focused tests, docs/memory. Database: none;
read Studio storage and native owner callback only. Tests cover absent anchors/null,
exact typed conversion, written field denial before business value fetch, stale/
foreign owner, generation/integrity/fingerprint errors, reference denial propagation
and no native writes/raw value copies. Pure helper tests are not collector acceptance.


Preparation candidate 4e4a0e8 failed before activation: SQL used nonexistent
PlatformAdministrator.id instead of its actual userId key. Corrected lock and
support-authority regression; preparation remains IN PROGRESS pending new pin
and repeated actual candidate/public proof. c6b2a recorded plan, code NOT STARTED.


Corrected support lock local validation: 10 files/53 assertions, production build,
strict post-build TypeScript/scoped lint PASS. New actual pin proof required.


Corrected preparation c6b1 VERIFIED: e309ff8 complete candidate/public combined
PASS and deploy exit 0; actual replay/one Audit, stale/client/tenant/permissions and
Audit-failure rollback, exact Test trigger cleanup and native preservation. Prior
5d101da retained. c6b2a local 9 files/64 assertions, production build/post-build TS/
scoped lint PASS; no collector. Actual absent-slot/typed-source helper NOT RUN.


## 2B3c6b2b1 — Shared refreshed batch authority (IN PROGRESS)

Purpose: reuse the preparation service's verified identity/company/member/user/
role/platform/Studio locks for bounded collection, instead of copying a second
permission path. Extract one typed internal transaction wrapper; preparation
continues to compile/pin/preflight/write Audit exactly as before. Dependencies:
c6b1 VERIFIED live; c6b2a new row observation source proof pending. Files: migrations/
authority and preparation, existing preparation/principal/data-policy tests plus
docs/memory. Database: none; existing SERIALIZABLE locks only. Tests: same actor/
principal refresh/revocation/support key, callback failure/Audit propagation,
company/source guards, identical idempotency and no native writes. No collector
endpoint, worker, target schema or state-machine change delivered by extraction.


c6b2b1 extraction local checks PASS: five files/34 assertions, production build,
strict post-build TypeScript/scoped lint, full diff review. No new endpoint/schema.
9183e53 actual sealed candidate source observation PASS; full/public pending.
Keep exact collection append/CAS separate from final source/set/digest sealing.

### c6b2b2 — Bounded collection append (IMPLEMENTED locally, 10 October)

Dependencies: verified preparation/source observation, local shared authority.
Server-loaded immutable job/principal, refreshed membership/policies/modules and
source/draft/compiler identity; trusted last stored record cursor, bounded owner
page and source refs, atomic insert/CAS/Audit. Stale revision replay writes nothing.
Files migrations/collection.ts, tests/studio-field-collection.test.ts and isolated
central helper. Database: existing archive only, no migration/reset/target values.
Checks: interruption/resume, stale/repeated/foreign input, revoked/private/disabled
source, changed draft, per-row/Audit rollback. Exact coverage sealing follows.

Local evidence: 16 files/103 assertions, production build, strict post-build
TypeScript/scoped lint and diff review PASS. Actual central helper added; NOT RUN.
No review completeness/target mutation claim from cursor exhaustion.

### c6b2b3a — Exact source coverage validation (IMPLEMENTED locally)

Purpose: reject stale source pointers even when native counts/revisions are equal.
Dependencies: existing owner coverage query, archive observations, principal and
current/written policies. Expected coverage.ts, focused tests, later central
helper integration. No DDL, target generation, execution or public API. Lock the
stored preparation and current extension/slot rows, prove exact owner coverage,
compare absent/current extension, slot and immutable value refs, then check all
observed written schema policies/checksums before returning. Returns no values,
counts or approval. This is a prerequisite, not the final reference checks,
uniqueness/digest/summary/state/Audit seal. Test stale/foreign job, source pointers,
private owner denial before coverage details, written ACL and metadata-only reads.

Source coverage local evidence: 17 files/109 assertions, production build, strict
post-build TypeScript/scoped lint and full diff review PASS. Actual helper added
but NOT RUN. Collector full candidate PASS; public pending. Final seal next.

### c6b2b3b — Atomic scalar review sealing (IMPLEMENTED locally)

Purpose: seal an actual authorised complete scalar preview, not execute it.
Dependencies: collection, source coverage, shared authority and immutable archive.
Files archive-digest.ts/sealing.ts, focused service tests and central helper; no
schema change. Preserve the existing v1 canonical ordered digest exactly using
PostgreSQL sha256 over mirrored immutable metadata (verified server primitive),
so final scalar sealing does not iterate/decode every business value in one long
application transaction. Check native/source/written policies first; aggregate
closed result counts and duplicate non-null target fingerprints, then create the
same-operation review, revision CAS and Audit atomically. No publication/activation.
Reject unique collisions, stale/foreign/client summaries and repeated stale
PREPARING requests. Fresh sealed replay returns the same review without writes.
Reference fields fail closed until c6b2b3c owner reference coverage exists; that
is outstanding Phase 2 work, not an accepted exception or later-phase deferral.
Actual proof must compare SQL digest to existing Node canonical stream, enforce
real Audit rollback, replay/append-sealed denial and retained source/native data.

Local evidence: 19 files/117 assertions, production build, strict post-build
TypeScript/scoped lint and full diff review PASS. Actual helpers added but NOT RUN.
Unique scalar fixture uses two active exact-Test tickets seeded before baseline,
normal-owner source-only writes, actual full-cohort review denial; formatter-only
fake anchors are separate and cannot pass owner coverage. Reference seal pending.

### c6b2b3c — Reference review workstreams

c1 VERIFIED locally: optional explicit same-entity referenceVersions on migrationSnapshot;
validate registered native versions and reference type/entity opt-in; old absence
and hashes unchanged. Files registry types/entities/registry + tests/docs; no DB.
c2 IMPLEMENTED locally: new Tickets entity/query versions approve whole native reference
coverage using actual canonical targets and current full private/native access,
without per-record value round trips or ordinary write/final guard changes.
c3 IMPLEMENTED locally: final reference review invokes that pinned owner protocol after
current/written field/source/native checks; same archive digest/review/CAS/Audit.
c4 VERIFIED candidate/public 32ee77e: actual Test reference/private/missing/foreign/stale/written-policy
and replay proof, plus full production/regression acceptance. No second permission
engine or reference privilege is granted by metadata; old owner versions stay sealed.

c1 evidence: seven files/44 assertions, production build, strict post-build
TypeScript/scoped lint/diff PASS. Exact live old entity v1/v2/v3/query v1 hashes
pinned; metadata alone grants no reference runtime authority. No DDL.

c2 plan before code: factor existing snapshot execution without descriptor/schema
changes; add query v2 and entity v4. Query v2 keeps preflight/snapshot/coverage and
adds reference_coverage: same-entity source/target/written reference versions 1–4,
actual target existence in this tenant/kind, complete current private/native access
and actual membership/Serializable transaction before metadata/target checks. No
reference IDs/counts or native writes returned. Files service-work/studio + focused
owner tests; no DB change. Old exact hashes and ordinary final/merged guards must
pass. Final sealer integration remains separate c3.

c2 local evidence: 21 files/132 assertions, production build, strict post-build
TypeScript/scoped lint/diff PASS; old hashes and ordinary guards retained. Actual
new protocol proof not run; final sealer c3/central c4 follow before VERIFIED.

c3 plan before code: rename the internal scalar seal to the single generic field
seal (no second path). After refreshed current/written/source/native validation,
require explicit target-owner referenceVersions for same-entity current/target refs,
invoke pinned reference_coverage in the same transaction, validate its scoped
coverage truth, then use existing digest/unique/review/CAS/Audit. Missing opt-in,
legacy query, unsupported/missing/foreign/private references deny before aggregate.
Files sealing.ts, existing caller/test renames, focused final reference tests; no DB.
c4 actual reference helper follows; no target publication or operation authority.


c3 local evidence: 21 files/136 assertions, production build, strict post-build
TypeScript/scoped lint and diff PASS. One generic internal review service; explicit
owner protocol rechecked on replay before digest/CAS/Audit. No DDL/public endpoint.
Actual c4 proof remains NOT STARTED; fc9b80f accepted scalar live remains current.


c4 IN PROGRESS before code: exact Test reference helper after uniqueness proof.
Good source reference uses approved native read and normal active-parent extend;
actual shared preparation/collector/seal/Audit rollback/replay then private queue
revocation denial. Missing/foreign source fixtures are explicitly privileged
negative storage cases, cannot collect or seal; a separate single invalid archive
frame must be denied by owner query v2 before counts. Synthetic foreign ticket is
created before baseline; compare native snapshots unchanged after checks. Reuse
existing sealer actual helper, no duplicate engine/DDL, no target/native writes.
Expected files check-field-reference-sealing.ts, principal driver/sealing checker,
plan/ledger/state. Build/types/lint and full pinned combined candidate/public proof
required; accepted live fc9b80f, Phase 2 NOT PASSED.


c4 helper IMPLEMENTED, actual NOT RUN: good approved closed native target read
plus active-parent extend, real collector and existing shared SQL–Node seal/Audit
rollback/replay helper, private queue revocation/recovery. Missing/foreign stored
source fixtures explicitly privileged negatives; collector must abort with zero
observations, separate invalid archive frame must fail actual owner protocol and
canonical seal, no approved failure summaries. Foreign exact Test native fixture
created before baseline; both tenants' native snapshots preserved. No new DDL,
target/native mutations by review, permission grants or parallel engine.
Checks: c3 scoped 21 files/136 assertions retained; c4 production build, strict
post-build TypeScript, scoped lint/diff PASS, /tmp/atlas-studio-reference-proof-
{build,postbuild-types,lint}.txt. Pin c1–c4 through full candidate/public combined
suite next; fc9b80f accepted current. Phase 2 NOT PASSED.


## 2B3d — Reviewed target publication workstreams

Purpose: publish the exact reviewed target as a new immutable version/generation,
using the existing metadata publisher; leave the source active and readable.
Dependencies: c3 sealed exact review and c4 actual reference/source/permission proof
(candidate reference PASS on 32ee77e; full native/public acceptance still running).
No row execution, cutover, value API or later-phase feature in publication work.

| Workstream | Purpose / files | Database implications | Required verification | Status |
| --- | --- | --- | --- | --- |
| 2B3d1 | Closed reviewed publication pin; migrations/publication-contract and tests | None; pure integrity guard, never authority | Exact reviewed payload/plan/tenant/field/generation, initiating actor, explicit loss consent, invalid rows fail publication, no extra/client authority | VERIFIED locally, pure pin only |
| 2B3d2 | Additive publication receipt and pending-generation guards; Prisma/SQL | Tenant/source/review/target FKs, immutable identity/CAS state, retained history; no backfill or reset | Real FK/immutable/freeze/activation denial, old runtime/schema compatibility | NOT STARTED |
| 2B3d3 | Extract existing publisher transaction helper; guarded reviewed service, binding and tests | Atomic target/version/generation/receipt/Audit; old schemas/source active | Fresh source/draft/cohort/ref/actor, idempotent retry, lost CAS/Audit rollback, ordinary structural publish remains denied | NOT STARTED |
| 2B3d4 | Actual central lifecycle helper and complete pinned release | Only exact Test fixtures; central additive migration | Source remains active, no target values or premature activation, exact reviewed target, audit/history/tenant/source/private/stale regressions | NOT STARTED |

Publication must not silently weaken atlas_studio_migration_fresh after metadata
revision/base changes. A durable reviewed publication receipt will bind that exact
transition; later execution validates immutable source/target and its own state.
Normal activateVersion must reject any pending target generation, including a
cosmetic descendant. Ordinary saves into source/target of an open migration must
be frozen on the server; normal native business operations retain owner control.
Use one publisher/Audit engine and additive receipts, not a second metadata system.
Invalid review rows must be resolved and collected again before target publication;
lossy conversions require explicit acknowledgement recorded in the publication.
No receipt/hash can replace refreshed actor/module/field/native/reference policy.



2B3d1 IMPLEMENTED/local VERIFIED pure contract: exact sealed review and immutable
target tenant/definition/payload/plan/checksum/generation plus initiating publisher
pin, no privileges/activation. Invalid rows require source resolution/new review;
reviewed conversion loss needs explicit recorded acknowledgement. Four files/23
assertions, production build, strict post-build TypeScript/scoped lint PASS. Logs
/tmp/atlas-studio-publication-contract-{tests,build,postbuild-types,lint}.txt.
No DDL or publication runtime. Reviewed target receipt/DB guards d2 next.
32ee77e full candidate combined PASS; public wXodWM running, fixture 024724;
accepted prior fc9b80f retained, no complete public claim yet. Phase 2 NOT PASSED.


2B3d2 IN PROGRESS before code: additive StudioFieldMigrationPublication, keyed by
sealed review/preparation, exact source/target generations and immutable target
version/checksum/number, publisher/loss acknowledgement; tenant FKs and one open
publication per field. Identity/history immutable; initial PUBLISHED and only CAS
PUBLISHED→CANCELLED permitted here. Cancellation service and execution transitions
remain d3/e, not silently enabled. No existing rows/backfills/resets.

SQL guards reject pending target activation (including cosmetic descendants),
changes to open field publication/activation/retirement/draft, normal source writes
while PUBLISHED and any normal target-generation writes. Native domain tables and
operations unchanged. Receipt insert validates the exact reviewed publication
transition (source remains active; definition/draft revisions +1, target latest/
base/payload/checksum and zero target slots). This does not relax old preparation
freshness. Files Prisma schema/additive SQL, archive API denial test, docs/memory.
Local schema/generate/types/lint/build and actual DB guards required before VERIFIED;
new migration not applied until d3 shared publisher/acceptance candidate is ready.


32ee77e7b1c684ab9c6b5f898eb641cebf0ae3f9 full combined candidate/public PASS,
deploy exit 0 and actual public health exact match. Reference c1–c4 VERIFIED:
existing hashes/native guards preserved, real approved final target read, actual
collection/shared seal/SQL–Node parity/Audit rollback/replay, private revocation,
missing/foreign target denial without approved failure summary. All native Atlas
checks passed. Evidence izKehB/wXodWM, backup 024145, fixtures 024333/024724; prior
fc9b80f retained. /tmp/atlas-studio-reference-deploy.txt. Phase 2 NOT PASSED; visual
builder/live customer dashboards/custom buttons remain authorised Phase 2 work.

2B3d2 IMPLEMENTED/local checks PASS, actual SQL NOT RUN: additive publication
receipt with tenant review/generation/version FKs, immutable identity/CAS cancellation,
one PUBLISHED operation per field, exact post-publication freshness distinct from
unchanged preparation freshness. Source stays active; metadata/draft and normal
source saves frozen while open; pending/cancelled target activation/value writes
denied. No native table modifications. Migration 20261010040000_studio_field_
publications is NOT APPLIED. Schema validate/generate, 24 files/146 assertions,
production build, strict post-build TypeScript/scoped lint/diff PASS. Initial TS
caught stale generated data-service catalogue; regenerated with existing script,
action allowlist unchanged, archive reads/counts remain denied. Logs /tmp/atlas-
studio-publication-schema-{validate,generate,data-api,tests,build,postbuild-types,
lint}.txt. Ship with d3 shared publisher and d4 actual acceptance before VERIFIED.


2B3d3a IN PROGRESS before code: extract publishDraft's existing transaction into
Core definitions/publication.ts, preserving module availability, definition CAS,
immutable version/dependency creation, normal field binding, draft CAS and Audit.
Keep normal public result and structural denial. Internal typed binding callback
only, no use-server/client handler. Add tenant/kind checks before mutations; tests
must use actual scoped draft shape rather than incomplete mocks. Files service,
publication helper and definitions tests. No DDL application or reviewed publisher
runtime yet; type/lint/build + native publication regressions required.


2B3d3a IMPLEMENTED/local checks PASS: extracted existing publishDraft transaction
into Core definitions/publication.ts. Normal module count, definition CAS/version/
dependencies, ordinary binder, draft CAS and Audit/result retained; typed internal
binder callback only. Tenant/kind/draft checks before writes; normal foreign/stale
input denied. Four files/22 assertions, production build, strict post-build TS/
scoped lint/diff PASS; /tmp/atlas-studio-publisher-extraction-{tests,build,postbuild-
types,lint}.txt. No reviewed service yet; additive d2 migration still NOT APPLIED.
Accepted live 32ee77e; Phase 2 NOT PASSED. Next d3b shared review inspector and
publication/replay/cancellation through existing publisher, then d4 actual proof.


2B3d3b1 IN PROGRESS before code: extract exact source/written/native/reference/
digest/uniqueness inspection from sealer into one internal review inspector.
Coverage stage is closed server-only preparation/publication: default old SQL
freshness unchanged; publication requires scoped receipt + exact intent checksum
and atlas_studio_publication_fresh before the same native/source/written checks.
No client stage, copied values, target writes or permission widening. Files shared
inspection, sealing/coverage and focused coverage tests; no new DDL beyond pending
d2. d3b2 reviewed publication and d3b3 cancellation follow after checkpoint.


d3b1 IMPLEMENTED/local checks PASS: one exact review inspector reused by sealer;
source/written/native/reference/access guards precede v1 digest/uniqueness. Closed
server-only coverage stage; preparation predicate unchanged, publication requires
scoped exact receipt/intent checksum and its separate post-publication freshness.
Fresh receipt cannot substitute for current private/native/source/written access.
Eight files/60 assertions, production build, strict post-build TypeScript/scoped
lint/diff PASS, /tmp/atlas-studio-review-inspection-{tests,build,postbuild-types,
lint}.txt. Receipt SQL still NOT APPLIED/actual not run, no publisher/target writes.
Next d3b2 reviewed service/atomic receipt/Audit/replay and d3b3 cancellation, then
d4 actual constraints/lifecycle release. Accepted live 32ee77e; Phase 2 NOT PASSED.


d3b2 IN PROGRESS before code: strict prep/review revision/checksum + warning/loss
acknowledgements only; reload actual REVIEWED source and initiating principal.
Lock preparation, shared inspector (stage derived from scoped publication row),
exact review checksum. New target uses existing publisher with checked permanent
binding/source generation and new target generation; exact receipt + paired Audit
atomic, source active/no target values. Fresh replay validates actual immutable
target/receipt under same policies and writes nothing. Invalid/loss consent checks
before publication. Files migrations/publication and publication-contract helper,
service tests; pending DDL not applied. Cancellation and actual central proof follow.


d3b2 IMPLEMENTED/local checks PASS: publishReviewedFieldMigration refreshes exact
initiating principal and REVIEWED revision/checksum, shared native/source/written/
reference/digest inspection before invalid/loss consent checks. Existing publisher
and checked permanent binding create only new target generation/version plus exact
receipt and paired Audit atomically; source stays active, no target values. Fresh
lost-response replay uses real target/receipt stage and no writes. 25 files/156
assertions, production build, strict post-build TS/scoped lint/diff PASS; logs
/tmp/atlas-studio-reviewed-publication-{full-tests,build,postbuild-types,lint}.txt.
Real SQL/Audit/freeze/lifecycle proof not run; pending migration NOT APPLIED. Next
sparse current-principal cancellation, then d4 exact Test candidate/public proof.
Accepted live 32ee77e; Phase 2 NOT PASSED, visual/customer publishing still planned.


d3b3 IN PROGRESS before code: sparse metadata-only cancel service with fresh
current company principal and Studio publish, locked publication CAS and Audit.
Current authorised publisher can cancel a stopped creator's operation; never
replay revoked creator grants or read native IDs/counts/values. Cancelled target
stays unusable, source/draft editing unfreezes by existing SQL. Replays verify
current authority and audit nothing twice. Files migrations/cancellation + focused
tests, docs/memory/decision. No new migration/engine; actual central proof d4 next.


d3b3 IMPLEMENTED/local checks PASS: current captured/explicit company principal,
Studio publish, scoped locked publication CAS and existing Audit cancel/replay.
Sparse state/revision output, no native count/value/record reads or old creator
grants; no live-data privilege needed for metadata cancellation. Four files/21
assertions, production build, strict post-build TS/scoped lint/diff PASS, /tmp/atlas-
studio-publication-cancellation-{tests,build,postbuild-types,lint}.txt. Target remains
blocked; SQL source/draft freeze release awaits actual central d4. No new engine/
public endpoint; pending migration NOT APPLIED. Accepted live 32ee77e, Phase 2 NOT
PASSED. Next exact Test publication/freeze/rollback/cancel proof plus pinned release.


d4 IN PROGRESS before code: fresh exact Test integer source/decimal v3 review after
reference helper, normal structural publish denial, paired Audit SQL failure/rollback,
reviewed exact source-active publication/receipt/replay, real FKs/history/CAS/freeze/
retirement/draft/premature activation and target-write denial. Private queue revocation
must reject replay, then restore only exact Test member. Cancellation/replay releases
normal source/draft editing; a cancelled target and its cosmetic descendant still
cannot activate. Owner-guarded privileged source 42→43 fixture only; no target values/
native changes, both tenants' native snapshots preserved. Files check-field-publication
plus principal integration/docs. Pending migration applied only in pinned candidate,
full normal/native/public suites required before VERIFIED.


d4 helper IMPLEMENTED, actual NOT RUN: fresh exact Test source/review uses shared
publisher, real paired Audit failure/rollback/replay, source active/history and
receipt identities. Tenant/immutable/CAS/freeze/draft/retirement/source-target save/
premature activation SQL guards, private queue denial/recovery, sparse cancellation
and source/draft editing recovery; cancelled target/cosmetic descendant still blocked.
Source-only privileged owner-guarded 42→43 fixture, no target/native writes, both
native tenant snapshots compared. 26 files/160 assertions, production build, strict
post-build TS/scoped lint/diff PASS; /tmp/atlas-studio-publication-proof-{tests,build,
postbuild-types,lint}.txt. Initial helper guessed retirement path; corrected to
existing fields/retirement before final checks. No broken checkpoint/deployment.
Pending migration 20261010040000 not applied; pin full candidate/public release next.
Accepted live 32ee77e, Phase 2 NOT PASSED; no row executor/cutover/visual builder yet.


## 2B3e — Representation execution workstreams (plan before code)

Dependencies: exact reviewed publication and its real candidate/public proof.
Section 24 requires resumable, idempotent conversion with unambiguous durable row
state. This is the custom-field operation within Phase 2, not a Flow engine.

| ID | Purpose / expected files | Database implications | Verification / completion |
| --- | --- | --- | --- |
| 2B3e1 | Explicit optional owner representation policy in registry types/entities/contracts/registration; pure typed encoder in fields/codec | None; existing absent metadata and hashes retained | Atomic owner/transaction/source-version contract validation; all 15 types, exact decimal/money, null/zero/false, UTC, retired-choice policy and write rejection tests; NOT STARTED |
| 2B3e2 | Durable execution/outcome contracts and additive schema/SQL | Tenant-bound publication/observation/target slot/value lineage; immutable outcomes, bounded CAS state and atomic target/outcome guards; no native tables/backfill/reset | Actual SQL/FK/history/source and target guards plus failure rollback; NOT STARTED |
| 2B3e3 | Tickets explicitly approves representation-only historical/final conversion through a new versioned query/entity | No native writes; server-stored receipt and observation only, same Serializable transaction | Actual private/member/module/native revision and publication identity checks; existing v1–v4 and query v1/v2 hashes unchanged; ordinary final/merged extend still denied; NOT STARTED |
| 2B3e4 | Shared exact execution inspection and one-row target writer | Source remains active; target value, slot pointer, extension revision, durable outcome and Audit commit together | Written/current/target field and reference authority before decoding; source digest/result replay match; no native mutation; NOT STARTED |
| 2B3e5 | Bounded resumable server batch service | Stored cursor/revision, success/failure state and idempotent outcomes; transactions end between batches | Limit 1–50, fresh initiating authority each resume, concurrent/stale/replay/cancel/failure/retry tests; NOT STARTED |
| 2B3e6 | Actual central acceptance through combined candidate/public runner | Only exact synthetic Test records; retain history and compare native snapshots | Interrupted/resumed batches, closed/unanchored/null values, paired Audit rollback, denied target normal edits/activation and source still readable; NOT STARTED |

Representation approval is separate from normal `read`/`extend`. Optional registry
metadata points to an explicitly registered same-owner transactional query with
native write capability and declared typed source versions. It grants no native
write or permission by itself. The owner receives only server-stored publication
and observation identifiers, reloads scoped proof and locks/authorises the actual
native row, including private queues. Old read-only snapshot opt-ins do not imply
approval. Native business columns are never written by this operation.

Execution must account for extension revision increments caused by its own target
writes through durable outcomes. An observation's global extension revision cannot
be silently ignored: unrelated changes or new/deleted native records invalidate
coverage. The original preparation and publication predicates stay strict; use a
separate explicit execution proof. Target rows remain unusable until 2B3f cutover,
and cancellation/failure never activates them. Persisted success identifies exact
source observation and target slot/value; replay rechecks current authority and
that lineage. Do not infer authority from a checksum or client-supplied stage.

The pure encoder validates normal input through the existing field validator.
A separate server-only representation path may retain retired enum IDs already
approved by the converter; it cannot make those IDs selectable in ordinary saves.
Null uses empty typed columns (Prisma JSON database null), integers use safe BigInt,
decimal/money use exact Decimal strings, dates UTC midnight, instants UTC with
millisecond precision. It does not persist or authorise any record.

Do not move to 2B3f until execution has real failure/recovery evidence. The later
2B4 value gateway and 2C–2E resolver/runtime/visual designer are still required;
this foundation does not satisfy the customer's visual publishing acceptance.

2B3e1 IN PROGRESS before code: optional owner representation policy points to
registered same-owner transactional query/native write capability and explicit
snapshot-supported typed source versions. Old absent metadata/hashes and ordinary
read/extend intents stay unchanged; no owner execution is enabled yet. Pure normal
and representation encoder reuse strict validation, exact typed columns/fingerprints;
representation retains only converter-approved retired choice IDs. Files registry
contracts/types/entities/registration, fields/codec and focused tests; no DDL/native
writes/runner/UI. d4 candidate and public Studio helper PASS, full public native
runner pending. Run focused tests/types/lint/build, review diff and update memory.

ea27b2ffa32ec484f90a27ad28faaa1d78dd4aff complete combined candidate/public
acceptance PASS, deploy session 42364 exit 0 and public /api/health/release exact
SHA confirmed. 2B3d1–d4 VERIFIED: real scoped receipt/immutability/CAS/source-draft
freeze, premature target/descendant activation denial, paired Audit rollback/fresh
replay, private revocation, sparse cancellation and source/draft editing recovery.
No target values/native mutation/cutover. Native Atlas acceptance all PASS; exact
synthetic Test companies suspended/access revoked, QA originals/history retained.
Evidence xkustF/tSM6C9, backup 031634, fixtures 031832/032224; migrate log confirms
20261010040000 applied successfully. Previous 32ee77e retained. Deployment log
/tmp/atlas-studio-publication-deploy.txt. Phase 2 NOT PASSED; designer, dashboard
publication/custom buttons and row conversion remain pending. Current 2B3e1 local
policy/encoder checks in progress, then additive execution/outcome schema 2B3e2.

2B3e1 VERIFIED locally, pure contract/encoder only: optional representation
metadata validates explicit snapshot-supported sources and a registered same-owner
transactional query/native write capability atomically. Existing absent contracts
and all owner hash regression tests pass; normal read/extend remains unchanged.
Normal encoder uses current selections; representation revalidates canonical typed
converter output and retains known retired IDs only, with exact 15-family roundtrip,
null/zero/false/required, decimal/money, UTC and rejection/fingerprint evidence.
33 Studio files/191 assertions PASS; production build, strict post-build TypeScript,
scoped lint and diff PASS. Logs /tmp/atlas-studio-representation-contract-{all-tests,
build,postbuild-types,lint}.txt. An initial quoted Vitest glob selected no tests;
corrected to the supported filename filter and all 33 files ran successfully.
No DDL or owner execution enabled. Accepted live ea27b2f, Phase 2 NOT PASSED.
Next 2B3e2a closed execution/outcome protocol and tests before additive persistence.

2B3e2a IN PROGRESS before code: closed pure execution pin derived from the actual
sealed review/publication/immutable target and explicitly approved target owner
metadata/query. Closed success outcome binds actual stored observation checksum,
record/native revision and exact target extension/slot/value identity; own revision
is observed+1 (or new=1), never a generic revision exemption. Progress validates
bounded CAS/cursor/count and READY completeness, failure codes contain no values.
No persistence/authority/runner/DDL; source remains active. Files migrations/execution-
contract and focused tests. Additive deferred target/outcome guards follow e2b.

2B3e2a VERIFIED locally, pure integrity only: execution pin reuses exact sealed
review and publication target, approved target owner metadata/transactional query,
explicit source opt-in and canonical checksums. Success lineage pins actual stored
observation, native revision, distinct target slot/value and own extension increment
(observed+1/new=1); overflow/substitution/invalid rows rejected. Closed bounded
request/progress and generic failure codes; READY requires exact cohort count.
34 Studio files/197 assertions, production build, strict post-build TypeScript,
scoped lint/diff PASS; /tmp/atlas-studio-execution-contract-{all-tests,build,
postbuild-types,lint}.txt. No DB/owner query/runner/target write authority. e1/e2a
checkpoint not deployed yet; last accepted live ea27b2f. Phase 2 NOT PASSED.
Next additive execution/outcome persistence with immutable lineage and atomic
commit guards, then explicit Tickets approval and the actual bounded writer.

2B3e2b IN PROGRESS before code: additive execution and immutable success-outcome
models. Execution pins publication/review/approved owner contract with CAS progress;
lookup remains private. Outcome tenant-FKs bind stored observation and exact target
extension/slot/value. Deferred FKs/commit guards permit one atomic claim→typed value→
pointer→outcome transaction, never an outcome without its target or vice versa.
Initial execution requires unchanged publication proof/no targets. Separate execution
freshness accounts only exact outcome-owned extension increments and checks unchanged
source pointers plus complete target lineage. Existing preparation/publication freshness
stay unchanged; normal source and target activation remain blocked. Target writes need
an exact RUNNING outcome claim; no caller flag. State cursor/count is exact immutable
outcome prefix, max 50 new rows per CAS; failure retains prior committed state. Receipt
cancellation atomically cancels execution without data reads, retaining outcomes/source.
Native owner/private/field/reference authorisation remains mandatory in e3–e5 services;
SQL metadata is never native permission. Files schema/additive migration/model catalogue/
archive denial tests/docs. No applied DDL or writer until actual central acceptance.

64361cbb60f0a1e3b9e131856867976531373bf1 complete combined candidate/public
acceptance PASS, deploy session 31720 exit 0 and actual public release health exact
SHA confirmed. e1/e2a pure contracts/encoder deployed; existing sealed owners/native
Atlas and prior reviewed publication/freeze/cancellation checks preserved. Evidence
50jeOW/6lZOTh, backup 033432, fixtures 033632/034025, log /tmp/atlas-studio-execution-
contract-deploy.txt; previous ea27b2f retained. No new DDL at this release. Phase 2
NOT PASSED; visual designer/live dashboards/buttons and actual conversion remain open.

2B3e2b IMPLEMENTED locally; actual row execution NOT VERIFIED. Additive execution/
outcome models and tenant/immutable pin/CAS/bounded prefix guards, exact source and
target lineage, deferred atomic target/progress constraints and sparse cancellation
cascade. Original preparation/publication predicates unchanged; normal source and
premature target activation remain blocked. Generic models/counts denied; generated
catalogue regenerated by existing script, 905 action allowlist unchanged. Initial
Prisma validation required explicit compound unique for one-to-one observation FK;
corrected before final validate/generate/types/tests/lint/build. 34 files/197 assertions,
production build, strict post-build TS/scoped lint/diff PASS; logs /tmp/atlas-studio-
execution-schema-{validate,generate,data-api,tests,build,postbuild-types,lint}.txt.
After pinned release finished, entire pending SQL was parsed on central Postgres
inside BEGIN/ROLLBACK with 2s lock/20s statement limits and no business DML. Metadata
checksum parity and null-scoped helper compilation PASS; table absence after rollback
confirmed. /tmp/atlas-studio-execution-schema-rollback.{sql,txt}. This verifies syntax,
not actual trigger lifecycle/authority/outcomes. Migration 20261010050000 NOT APPLIED;
source/target data and schema remain at accepted 64361cb. Need e3 owner approval and
actual e4–e6 failure/replay/commit evidence before execution is VERIFIED or deployed.

2B3e3 IN PROGRESS before code: new Tickets entity v5, snapshot query v3 and
representation approval query v1. Preserve sealed v1–v4/query v1–v2 descriptors and
normal read/extend final/merged guards. Full current member/private/module/native
access precedes scoped reviewed publication/observation metadata; exact initiating
principal/current auth+session versions and native row revision under Serializable
FOR UPDATE. Output only scoped representation anchor, no values/counts/native writes.
New snapshot/reference coverage explicitly approves versions 2–5/read 1–5; old
reference query defaults remain unchanged. Expected service-work/studio, focused
owner tests and module docs. Pending e2b SQL remains NOT APPLIED; actual owner/
writer/SQL proof follows e4–e6 before release. Last accepted live 64361cb.

2B3e3 IMPLEMENTED/local checks PASS, actual owner SQL NOT RUN: Tickets entity v5
explicitly opts into source versions 2–5, snapshot/reference query v3/read 1–5 and
representation approval query v1. Existing descriptors and v2 defaults unchanged;
normal final/merged extend still denied. Complete current native/private/member/module
access precedes scoped stored review/publication/observation, initiating actor and
current membership/auth-version checks, exact metadata freshness and FOR UPDATE native
revision. Output only scoped representation anchor, no values/counts/native mutation.
35 Studio files/204 assertions, production build, strict post-build TypeScript,
scoped lint/diff PASS; /tmp/atlas-studio-ticket-representation-{all-tests,build,
postbuild-types,lint}.txt. Initial TS caught an assumed User.active column (actual
model uses membership active/authVersion) and local never-function narrowing; fixed
before final checks. Pending 20261010050000 NOT APPLIED; no row writer yet. Accepted
live 64361cb; Phase 2 NOT PASSED. Next e4a shared execution inspection/start service,
then exact one-row writer, bounded batches and actual owner/SQL recovery proof.

2B3e4a1 IN PROGRESS before code: extend the single source/review inspector with
an internal execution stage derived from a scoped actual execution. Require target
owner explicit representation opt-in and persisted approval query hash resolution,
exact intent/publication/execution freshness and the same native/private/written/
reference policies. Account only outcome-recorded own extension increments through
separate execution-source proof; original preparation/publication queries remain
unchanged. No stage in client input, no target writes/start/activation. Files coverage/
inspection plus focused execution-stage regressions. Then shared start service e4a2.
Pending DDL remains unapplied; last accepted live 64361cb, Phase 2 NOT PASSED.

2B3e4a1 IMPLEMENTED/local checks PASS: the shared inspector has an internal
execution stage with persisted owner-query hash/opt-in and exact publication,
outcome-owned source revisions, native/private/written/reference authority. Old
preparation/publication freshness is unchanged. Current source and target native
write grants are both required before archive access. 35 Studio files/207 assertions,
production build, strict post-build TypeScript, scoped lint and diff PASS; logs
/tmp/atlas-studio-execution-inspection-{all-tests,build,postbuild-types,lint}.txt.
Pending SQL retains the existing generic target-write denial text for compatibility;
its exact outcome requirement is unchanged. No target writes/start or DDL application;
actual execution remains NOT VERIFIED. Accepted live 64361cb, Phase 2 NOT PASSED.
Next e4a2 shared exact execution inspection/start service and atomic Audit, then
e4b one-row writer, e5 bounded batches and e6 actual central lifecycle proof.

2B3e4a2 IN PROGRESS before code: one shared locked inspection for execution
start/replay and later batches. Derive stage from the actual scoped execution row;
recheck immutable reviewed publication/target/compiler and native/private/written/
reference authority, then derive exact owner approval pin. Strict start input contains
only preparation ID, publication revision and review checksum; no client tenant,
pin or stage. Save initial RUNNING/zero progress and Audit atomically; retries return
only gated progress with no second row/Audit. No target/native writes or public UI.
Expected migrations/execution-inspection and execution-start plus focused tests;
reuse pending execution schema unchanged. Actual SQL proof remains e6.

2B3e4a2 IMPLEMENTED/local checks PASS: shared exact locked execution inspector
reloads reviewed preparation/publication/immutable target, current compiler and
owner-query hashes, current module/native/private/written/reference coverage.
Start saves RUNNING/zero progress and existing Audit atomically; no target/native
write. Lost-response replay reinspects current authority, verifies exact saved pin
and closed progress, and duplicates neither operation nor Audit. 36 Studio files/
213 assertions, production build, strict post-build TypeScript, scoped lint/diff
PASS; /tmp/atlas-studio-execution-start-{all-tests,build,postbuild-types,lint}.txt.
Actual SQL NOT RUN, pending 20261010050000 unapplied, accepted live 64361cb.
Phase 2 NOT PASSED. Next e4b reuses one authorised source observation/decoder to
compare the sealed row and atomically claim/write its exact target representation;
then e5 batches and e6 central interruption/failure/replay evidence.

2B3e4b IN PROGRESS before code: reuse the existing authorised source inspector
and converter rather than a second decode/permission path. Internal inspection may
return the converted value only inside the owning transaction; existing observation
API stays references/fingerprints only. Require exact running execution, server-loaded
observation and registered owner representation approval before source columns.
Compare full sealed observation/result, then claim immutable outcome before its
deferred target FK writes. Existing extension CAS +1 (or new revision 1), new slot0,
exact typed value1/DbNull, slot pointer1/unique token. Caller must atomically update
batch progress and Audit; database deferred guards forbid committing row alone.
Expected observation refactor/representation writer/tests; no native/domain changes,
no new schema or public endpoint. Actual lifecycle remains pending e5/e6.

2B3e4b IMPLEMENTED/local checks PASS: one shared source inspector/converter now
supplies converted values only inside the server transaction; archive observation
wrapper stays unchanged and redacted. Exact owner representation approval precedes
source columns, full sealed row/fingerprint/null/loss comparison precedes immutable
outcome claim, then existing extension CAS+1/new1, target slot0/value1/DbNull and
pointer1/unique token. No native writes; caller must pair progress/Audit, and deferred
SQL forbids committing targets alone. 37 Studio files/219 assertions, production
build, strict post-build TS/scoped lint/diff PASS; /tmp/atlas-studio-representation-
writer-{focused,all-tests,types,build,postbuild-types,lint}.txt. Source observation
regressions preserved. Actual SQL NOT RUN, pending 20261010050000 unapplied.
Accepted live 64361cb, Phase 2 NOT PASSED. Next e5 bounded CAS/progress/Audit batches,
retained-prefix failure recovery and fresh lost-response replay; then e6 actual proof.

2B3e5 IN PROGRESS before code: closed 1–50-row request, stored canonical cursor
and execution CAS; shared exact inspection before progress or values, all row outcomes/
targets/progress/Audit in one short Serializable transaction. Lower revision is gated
no-write replay; READY replay writes nothing. FAILED current revision explicitly
resumes through RUNNING then commits bounded progress; no automatic worker/Flow.
After a rolled-back attempt, a separate sparse current-publisher transaction may
record only generic failure/CAS with the same committed prefix and Audit. It returns
no business progress; if membership/Studio authority or Audit is unavailable, it
cannot claim to record failure, and the original prefix remains intact. Stale/foreign
requests cannot alter a newer cursor. Expected execution-batch/tests and docs; no
new schema beyond pending 20261010050000. Actual failure/restart/SQL proof follows e6.

2B3e5 IMPLEMENTED/local checks PASS: 1–50-row canonical SQL cursor, stored CAS,
shared current execution inspection, atomic target outcomes/progress/Audit; lost
responses/READY replay write nothing. FAILED resume explicitly transitions through
RUNNING. Rollback recovery can record only exact unchanged RUNNING prefix with
closed generic failure and Audit; revocation/Audit outage reports failureRecorded=false
without invented state. Audit excludes native IDs/cursor/value/counts. 38 Studio
files/227 assertions, production build, strict post-build TS/scoped lint/diff PASS;
/tmp/atlas-studio-execution-batch-{focused,all-tests,types,build,postbuild-types,lint}.txt.
Initial mock writer returned id rather than actual observationId, corrected; all
final checks passed. No actual SQL/row proof yet; pending 20261010050000 unapplied,
accepted live 64361cb. Phase 2 NOT PASSED. Next e6 actual Test execution/failure/
process termination/restart/replay/SQL/permissions/cancel/native compatibility proof
through combined candidate/public release before marking execution VERIFIED.

2B3e6 IN PROGRESS before code: extend the existing exact synthetic central Test
principal/combined acceptance runner with a v5 reviewed target and actual owner/SQL
execution proof. Source fixture only through normal active native extend; final and
unanchored records approved representation-only, ordinary final extend still denied.
Actual start Audit rollback, mid-batch SQL rollback, retained failure prefix, lost
response, forced child termination before commit/new-process resume, private/source/
tenant guards, exact typed values/outcome/FK/CAS/history/source compatibility,
premature activation denial and cancellation retention. Compare both native tenant
snapshots. Child helper has strict Linux/explicit opt-in/Test-slug/preparation scope,
no public endpoint. Expected check-field-execution/process helper/principal driver
and docs; pending DDL ships only with pinned combined candidate/public release.

e6 compatibility follow-up before release: publication lost-response replay
must remain valid after its own recorded target writes. Derive replay inspection
from the scoped actual execution row and reuse the shared exact execution inspector;
never relax the original zero-target publication predicate or accept a caller stage.
Add focused delegation/stale tests and actual post-restart publication replay.

2B3e6 helper IMPLEMENTED, actual NOT RUN: exact fresh v5 reviewed Test field,
owner historical approval/normal final-write denial, real start/mid-batch/Audit and
deferred-progress rollback, process SIGKILL before commit/fresh-process resume,
lost response and post-conversion publication replay through shared exact inspector;
private/tenant/CAS/history/activation/cancel checks, exact precision/null values and
both native tenant snapshots. Child helper is explicit Test/Linux-only, no worker or
public endpoint. 38 Studio files/228 assertions, production build, strict post-build
TS/scoped lint/diff PASS; /tmp/atlas-studio-execution-proof-{all-tests,types,build,
postbuild-types,lint}.txt. Old zero-target publication predicate unchanged; only
actual stored execution selects execution inspection. Pending 20261010050000 NOT
APPLIED. Commit and pin full combined candidate/public release next. Accepted live
64361cb; Phase 2 NOT PASSED, visual designer/dashboards/buttons still pending.

Pinned 6d2f5a9 candidate failed before activation at the new final-record
negative check: test omitted mandatory expectedRevision and hit request validation,
not native final-write policy. Correct the test with actual observed native revision;
no permission weakening or DDL change. Actual start/paired Audit/pin proof had passed;
row/deferred/process proof not reached. Candidate 35nN6y, backup 042335, fixture 042536,
deploy session 73316 exit 1. Exact synthetic companies suspended/history retained.
Public health confirmed unchanged accepted 64361cb. Applied 20261010050000 remains
additive; do not edit its checksum or reset data. Rerun local checks and pinned full
candidate/public acceptance after corrected checkpoint.

36c211b candidate IatJ7l stopped before activation exactly at the anticipated
message assertion: actual native final-row guard rejected with "Reopen active ticket
work before changing extension values." The local test now matches that confirmed
domain rule. Strict TypeScript/scoped lint/diff PASS; /tmp/atlas-studio-execution-final-
policy-{types,lint}.txt. App/DDL unchanged; 228 assertions/build retained. Backup 042738,
fixtures 042930, deploy session 39039 exit 1. No row lifecycle/process proof reached.
Synthetic Test access suspended/history retained; public accepted 64361cb unchanged.
Commit corrected assertion and rerun the full pinned combined release now.
