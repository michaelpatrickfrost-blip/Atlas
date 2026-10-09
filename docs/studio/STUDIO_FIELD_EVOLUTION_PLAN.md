# Field evolution workstreams — 2B3

Source: unchanged Studio specification Sections 6.4, 24–24.1 and 25–28.
Dependencies: 2B2 permanent field identity, immutable generations/typed history and
metadata publication. 2B3a pure library VERIFIED locally (tests/types/lint/build); combined 2B2 candidate/public e5d66e6 release acceptance PASS.
Remaining evolution checkpoints are NOT STARTED. This plan breaks the specified operation into
reviewable checkpoints; it does not substitute for the supplied specification.

| ID | Purpose and dependencies | Expected files / database | Required evidence | Status |
| --- | --- | --- | --- | --- |
| 2B3a | Typed compatibility analysis and deterministic conversion rules; depends on existing validators | fields/evolution and conversion tests; no DB | Stable field/entity identity; exact integer→decimal bounds; explicit string→enum mappings/unmapped policy; explicit date/UTC semantics; no inferred money currency or changed reference targets | VERIFIED locally; pure library only |
| 2B3b | Retirement with CAS and audit, retaining published schema, binding and history | definitions/field lifecycle + tests; additive metadata only if required | Tenant/publish access, stale revisions, no further editing/activation, authorised history retained, keys not recycled | NOT STARTED |
| 2B3c | First-class reviewed plan, preview and durable job/row state | fields/migrations, Prisma additive migration | Source/target version/checksum, affected count, bounded authorised examples/failures, index impact and rollback limits; forged/stale plans rejected | NOT STARTED |
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
