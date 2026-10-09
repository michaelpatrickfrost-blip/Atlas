# Field evolution workstreams — 2B3

Source: unchanged Studio specification Sections 6.4, 24–24.1 and 25–28.
Dependencies: 2B2 permanent field identity, immutable generations/typed history and
metadata publication. 2B3a pure library VERIFIED on candidate/public 7941f9b (tests/types/lint/build); combined 2B2 candidate/public e5d66e6 release acceptance PASS.
2B3b retirement VERIFIED on candidate/public 7941f9b (35 local tests/types/lint/build and real central checks PASS); reviewed jobs/publication/batches/cutover remain NOT STARTED; principal foundation below is IMPLEMENTED locally. This plan breaks the specified operation into
reviewable checkpoints; it does not substitute for the supplied specification.

| ID | Purpose and dependencies | Expected files / database | Required evidence | Status |
| --- | --- | --- | --- | --- |
| 2B3a | Typed compatibility analysis and deterministic conversion rules; depends on existing validators | fields/evolution and conversion tests; no DB | Stable field/entity identity; exact integer→decimal bounds; explicit string→enum mappings/unmapped policy; explicit date/UTC semantics; no inferred money currency or changed reference targets | VERIFIED candidate/public; pure library only |
| 2B3b | Retirement with CAS and audit, retaining published schema, binding and history | definitions/field lifecycle + tests; additive metadata only if required | Tenant/publish access, stale revisions, no further editing/activation, authorised history retained, keys not recycled | VERIFIED backend candidate/public 7941f9b; no history API/UI |
| 2B3c | First-class reviewed plan, preview and durable job/row state | fields/migrations, Prisma additive migration | Source/target version/checksum, affected count, bounded authorised examples/failures, index impact and rollback limits; forged/stale plans rejected | IN PROGRESS; c1 principals verified candidate/public 7941f9b; preview/persistence not started |
| 2B3d | Reviewed target publication into a new generation | compiler/binding/lifecycle, job FK constraints | Immutable old schemas/values, exact target plan required, unsupported structural changes fail closed, target publication does not activate it | NOT STARTED |
| 2B3e | Bounded resumable/idempotent conversion batches | migration runner/codec, durable row outcomes and tests | Owner and field access rechecked, source value revision checked, atomic target value plus outcome, failure/restart/replay evidence, no native mutation | NOT STARTED |
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

### 2B3c2a — Owner cohort-access preflight (IMPLEMENTED locally)

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
canonical records. Helper NOT RUN on a cohort-enabled candidate. No final/merged
representation write hook or durable job implemented.

### 2B3c2b — Typed stored-value decoder for previews (IMPLEMENTED)

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
helper assertions added but NOT RUN on a codec-enabled candidate/public runtime.
