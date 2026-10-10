# Phase2B4d — required rules and native transaction integration

10 October 2026. Source Sections6.5,14,23–28. Depends on ordinary read/write
checkpoint and existing sealed field storage/migration contracts. This plan is
implementation work ordering, not a rewrite of the supplied specification.

| Workstream | Purpose/dependencies | Expected files/database | Verification | Status |
| --- | --- | --- | --- | --- |
| d1 | Closed versioned required-if payload/compiler; preserve v1 plans | fields condition/schema contracts, compiler helpers and tests; no DDL | Bounded typed predicates, unknown/cyclic/foreign/unsupported fact denial, exact old checksum regression; pure helpers only until d2–4 | VERIFIED locally; grammar/compiler and67files416 tests/build/strict post-build TS/lint/diff PASS; unwired |
| d2 | Owner-approved transaction facts, canonical cohort and new-record initialisation contracts | registry types/entities/contracts, service-work Studio new descriptor versions/query callbacks, runtime authority shared transaction helper; no DDL expected | Exact new native creation authority, current/private/tenant/source policy, canonical final/unanchored cohort, sealed old hashes | VERIFIED live0925bb5; candidateytkpaL/publicsZJ2uA combined PASS + actual contracts/native/Audit rollback proof;69files431/build/types/lint |
| d3 | Canonical publication/evolution coverage | definitions binding/publication/review/coverage services, requirement runtime and tests; additive guards only if necessary | All canonical records including absent anchors; optional-populate-review path; conditional resulting requirements, current/written/ref rights, reviewed conversion coverage, Audit/CAS | IN PROGRESS; a/b/c implemented; d/e pending |
| d4 | Owning native create/save and ordinary-value transaction rules | service-work actions/engine and shared runtime-write primitive; no native schema copies | Native protected transitions/SLA/intake preserved; atomic new record+values, create-only permission, hidden/omitted fields/disabled authoring, native/extension CAS, atomic failure/replay | NOT STARTED |
| d5 | Central native/security/version gate | tests, exact Test helper and release compatibility scan; no destructive reset | Real missing-anchor/conditional/native create/transition/write cases, payload runtime compatibility, two companies/private/source/field denial, build/full candidate/public | NOT STARTED |

Keep d1 pure and do not enable publication of conditional rules until their native
runtime/coverage is implemented and verified. A metadata-only partial feature must
not let an administrator activate a rule that native actions can bypass.

Use a versioned payload rather than changing defaults/shape/checksums of sealed v1
definitions. The field remains one artefact and one typed value store. A condition
may reference only owner-approved native facts or approved field dependencies;
typed bounded predicates replace arbitrary code, expressions and SQL. This is
field validation, not the Phase3 Decision engine. Unsupported facts must fail
closed and remain a recorded gate issue rather than be advertised as working.

Required rules evaluate resulting native facts and staged extension values in the
same transaction. A field change can affect another field's requirement. Native
facts are supplied through the owning registered transaction contract, never
trusted from client FormData. Field/native permissions and sensitivity apply to
condition inputs; configuration grants no ability to see private values. Reference
targets stay independently authorised. Preserve frozen native service questions
and answers, priority/queue/assignment/SLA/evidence/approval/status rules.

Ordinary creators retain native create permission. Do not require or invent broad
manage/read grants to initialise fields on a genuinely new native record. Design
an explicit owner-approved proof/path for that record in the existing transaction;
existing record saves retain native extend guards. Shared transaction primitives
must refresh genuine Session identity/versions/modules without nested transactions
or client-authenticated Session DTOs. Normal record actions keep requireSession and
their owning capability checks first. Inspect every owner mutation path before
hooking central engine changes; incidental watch/comment/version activity should
not acquire unrelated management permissions.

Publication/evolution must prove required coverage against the complete canonical
owner cohort, including final and absent-anchor records. An empty Studio table is
not an empty business. For existing mandatory fields guide optional publication,
population and reviewed constraint change; do not delete records or silently fill
invented business values. Conditional initial publication must also prove each
current canonical record's resulting requirement. New conditional migration
versions adapt existing reviewed jobs, not a second migration engine.

Admin metadata preview does not become a business-data principal. Required-data
review needs a genuine active company identity or explicit existing audited support
affiliation, with owner/private/current-and-written access. Do not silently create
staff affiliations or borrow a creator's privileges.

Published requirements survive disabled Studio authoring; owning source enablement
and tenant checks remain authoritative. Retirement keeps history but removes new
editing eligibility. Active and retained/open migration metadata need version-aware
release checks; registry hashes alone cannot prove payload compatibility. Preserve
old published definitions, values, receipts and backward native behaviour.

d1 pure grammar/compiler is implemented and tested, with strict post-build TS PASS.
d2 owner fact metadata/query and native creation proof contracts are implemented
locally; actual central proof PASS in candidate/public. Canonical cohort access reuses the existing
complete owner snapshot (including final/unanchored records), while required-value
coverage, field-dependency provider, native hooks and publishable conditional
implementation remain d3–4.

## d3 ordered workstreams — coverage and runtime dependencies

Candidate0925bb5 and public sZJ2uA full combined acceptance PASS; runner40775 exit0. d3a is an
independent pure evaluator over the verified d1 compiled subplan; it grants no
record access or publication. Do not move the pinned release branch while it runs.

| ID | Purpose/dependencies | Expected files/database | Tests/gate | Status |
| --- | --- | --- | --- | --- |
| d3a | Evaluate bounded typed conditions and seal observed fact fingerprints; d1 contracts | required compiler plan schema + evaluator/tests; no DDL/data reads | all/any, false/zero/empty, literal precision, missing/unavailable/foreign fact shapes, no authorization short circuit, tampered plans | VERIFIED locally;70files440/build/strictpostbuildTS/lint/diff PASS, pure/unwired |
| d3b | Sealed source metadata/current dependency closure and version-aware field compilation; d1/d2/d3a | required metadata provider/compiler/schema tests; no publication dispatch yet | Exact current+pinned tenant binding/generation/checksum/access, transitive cycles/bounds/cosmetic compatibility, sealed v1 preservation | VERIFIED locally; b1 full isolated compiler, b2 locked source provider/inspection;25 focused/types/lint/diff PASS, central gate pending |
| d3c | Transactional fact/value reading and resulting requirements; d3a/b and d2 owner facts/proofs | required runtime reader + tests; no new datastore | Current/written/native/reference guards before values, staged changes, create-only new record proof, absence vs unavailable, deterministic locked reads | VERIFIED scoped live6b3d03f; c1 local + c2a/b actual staged/current-owner creation/SQL rollback and full candidate/public PASS; broader existing conditional gate d5 |
| d3d | Required initial publication and activation coverage; d3b/c | candidate-version checker + explicit owner canonical snapshot policy; no DDL | Complete canonical cohort incl final/unanchored; empty metadata/private/CAS; native integration remains d4 | VERIFIED scoped live18bd031; actual candidate/public SQL proof PASS |
| d3e | Existing reviewed evolution/execution/settlement integration and impact; d3c/d | existing migration services/contracts + owner versioned policies; preserve old receipts | Native/global extension revisions capture input drift, new generations, dependent rule compatibility, target eligibility, source freeze/history/replay, rollback | NOT STARTED |

A rule input that cannot be authorised/resolved is an error, never a false/absent
fact. Evaluate/authorise all declared facts before Boolean aggregation; any/all
must not hide a denied fact via short circuit. Zero and false are present. Null or
an empty selection is absent. Equality and inequality require a present fact;
matching absence uses the explicit presence/absence operators. These semantics
must be represented in the later visual builder with plain-language choices.

Legacy published fields also need explicit current owner approval for creation
initialisation in d4, rather than silently interpreting their read/edit contract
as a create grant. Add a versioned current native policy covering approved old
entity versions when integration is wired. Current c2a/b proof explicitly approves v7 current creation/legacy field versions
2–7 and never enables existing-record reads or broad editing.

### d3b–e exploration constraints to preserve during implementation

- Keep v1 payload/plan/intent/receipt checksums unchanged; a full v2 field plan is
  separate from the pure required-if subplan. Authoring dispatch stays disabled.
- Metadata provider uses server-derived tenant/root definition, locked canonical
  bindings, exact immutable version/checksum pins and current active read policy.
  Permit compatible label/help revisions, reject retirement/new generation/type/
  policy drift. Compute bounded current dependency closure, not client-supplied
  closure, so historical pins cannot hide a newly formed current cycle.
- Include registered native fact query hashes as well as entity hashes in compiled
  dependencies. Source metadata compilation performs no business-value queries.
- Ordinary read validation requires read policy, not field write/Studio authoring.
  Evaluating requirements separately authorises every actual input/reference. A
  sealed source field's own condition does not grant access to its private inputs.
- Existing migration observations capture native and global extension revisions;
  the shared extension revision advances on every ordinary field save. Absent
  anchors and added canonical rows are already covered by owner snapshots/checks.
  Recheck condition metadata and native/extension state at review/seal/execution/
  cutover. Do not copy business facts/values into review archives just to prove them.
- Adapt the existing versioned reviewed migration/coverage/representation/settlement
  services and additive SQL guards where necessary; do not build another engine.
  Current owner policies must explicitly approve new field/entity versions while
  retaining exact old policies and receipts. v6 old snapshot source ranges are not
  silently widened; new opt-in versions cover the new conditional representation.
- Full runtime compatibility must scan actual active/retained/open metadata payload
  versions, not merely resolve contract IDs. Do not allow publication that an older
  runtime would parse differently or execute without native required enforcement.
- A conditional result is ORed with the field's unconditional required flag; it can
  never turn off a mandatory field. Hidden/omitted form inputs never bypass it.

### Native integration lock/compatibility findings (planned, not implemented)

Ordinary c4 writers currently lock the target definition before native record
extension authorisation. Cross-field required checks will read other definitions.
Two writers/native saves can therefore deadlock if each holds a different target
and waits for the other's dependency or native row. Before d4 wiring, establish
and test a consistent lock order across metadata publication, all field writers
and native create/save paths; cover same/different records and crossed fields.
Do not simply add dependency SHARE locks after the existing target FOR UPDATE and
assume the graph being acyclic prevents every lock cycle. Batch resulting-required
validation reads other active rules even when their values are not being changed.
Inspect metadata/cohort/native queue/parent/approval interactions when choosing a
bounded entity/record lock scheme; record the actual chosen approach and rationale.

Legacy active unconditional-required fields also need canonical coverage before
native hooks are enabled. A release must not silently invent values, waive required
rules on hidden/omitted fields, or break existing business activity because old
publication allowed missing anchors. Inspect actual active company metadata and
require an authorised optional/populate/review or retirement path for any invalid
legacy cohort. Suspended synthetic Test fixtures do not establish live business
coverage. Keep actual unsupported payload/open-migration checks in the release gate.

Ordinary value viewing is distinct from requirement evaluation: validate sealed
field metadata and current/written/native/reference read policy without fetching
or evaluating unrelated private condition inputs. The conditional compiler's read
intent validates rule metadata without target write grants; actual rule input reads
remain separately authorised. Preserve this distinction in d3b2/read gateways.

D3b1 full isolated v2 compiler VERIFIED locally:29 focused/71files446/build/
strict post-build TS/lint/diff PASS. Native metadata is compared with exact
registered declarations; query and field-version dependencies are sealed. Existing
v1 and authoring dispatch unchanged. D3b2 source provider VERIFIED locally:25 focused/types/lint/diff PASS; actual
central locking/runtime proof remains d5, not inferred from mocked source metadata.

### d3c work ordering — resulting required inputs

c1 existing-record transactional reader first: reuse versioned base-field/value
integrity and current/pinned/written/native/reference access; exact native revision,
approved query output and absence vs unavailable. No metadata principal as data
principal, no source condition execution while viewing a value. c2 then staged
resulting values and genuine creation proof, with explicit current owner creation
fact policy/legacy version coverage where required. Actual native creation-only
facts must not borrow ordinary read/manage grants. Neither reader activates rules;
canonical publication/evolution coverage and d4 native hooks remain mandatory.

### c1 verified; c2 actual resulting-state approach

c1 new tests cover actual typed value decoding, read-only grants, authorised
absence/false, no unconditional relaxation, stale/private native denial, malformed/
foreign/missing native facts, written restrictions/fingerprints, source v2 private
rule inputs not executed, independent references and client-data injection.34
focused/build/strict post-build TS/lint/diff PASS; ordinary v1 readers/writer pass.

For c2, prefer reading actual uncommitted domain and typed-value writes in the same
owning Serializable transaction. Do not trust a caller's claimed native/staged fact
map or create a second in-memory persistence engine. Conditional failure rolls back
all staged rows/native/Audit/outbox changes. Actual creation needs a versioned
current owner approval of legacy field versions and a distinct proof-bound native
fact query with creation capability; never add ordinary read/manage grants. Newly
published conditional fields must seal that initialization query as well as normal
fact dependencies. Keep old v1–6 owner hashes and old migration ranges unchanged.

### c2a implemented; c2b integration constraints

Tickets v7 accepts legacy typed field entity versions2–7 for actual new records,
with separate proof-bound status/priority query using creation capability. Both
normal and initialization query hashes seal into new native conditional plans.
Existing v1–6/query1 hashes and migration ranges preserved.46 focused/types/lint/
diff PASS; production build and actual central c2 proof pending.

c2b validates actual staged database state and required target values. Ordinary
paths keep read/current/written/ref policies; new-record paths use genuine current
owner proof, explicit field grants and independent existing reference access. Never
use creation proof to read a different record. Conditional native creation facts
must match the source's sealed initialization query and current owner approval.
Optional unconditional fields need no unrelated value reads during native validation.

Before d4, account for legacy required fields with absent canonical anchors, all
native mutation paths and shared lock ordering. Fresh target-generation writes may
close a retained rollback window: creation-only actors need an explicitly approved
proof-based close with atomic target value/receipt/Audit, not borrowed manager/cohort
authority. Preserve existing settlement guarantees and reviewed receipts; assess and
record the exact alternative before integration. No new workflow/template engine.

### c2b VERIFIED live6b3d03f

Proof-aware readers and all-active resulting validation are implemented;54 focused
assertions/build/strict post-build TS/lint/diff PASS.8 new cases establish staged
native/typed inputs, required target absence, false/zero, no unconditional relaxation,
genuine create-only proof scope, immutable written rights/refs, unavailable/corrupt
inputs and changing extension denial. Exact guarded rollback-only server probe PASS in candidate0ozZHm/publicQhQzoM;
runner85809 exit0. It compares native/typed/config/Audit snapshots after a
propagated required failure and checks actual deferred relational/pointer constraints.
No writer/native hooks/publication/DDL; shared lock order/window closure still d4.

### d3d exploration and exact first action — IN PROGRESS

Read current definition publication/activation/binding, existing snapshot/coverage
and principal services before wiring. The metadata-only Admin target context is
not a data principal; retain genuine company identity or explicitly audited support.
Reuse the existing transaction-required canonical snapshot protocol (complete
private-access preflight, final/merged/unanchored records and bounded pages). The
older standalone cohort query opens its own transaction and cannot prove coverage
inside publication's owning transaction. No second cohort/review engine.

First implement a server-loaded candidate-version field context/evaluator using
sealed version ID/checksum, tenant binding and current/pinned/written native/field/
reference policy. It must evaluate a published candidate before activation without
temporarily changing the active pointer or using a client-supplied plan/fact map.
Then use it in a complete canonical coverage helper: count equals visited records,
exact native/global extension revisions and required targets, private input denial,
empty vs absent anchors, stale/cycle/field dependency denial. Initial mandatory
fields on nonempty canonical cohorts require optional/populate/review; no invented
values. Existing changes still use the reviewed migration engine in d3e.

Expected shared runtime-read/required-runtime, required-coverage helper and focused
candidate/cohort tests; latest owner opt-in contract only if existing sealed policy
cannot express coverage. No DDL expected initially. Do not dispatch conditional
publication/activation before d4 native and ordinary writer enforcement, common
lock order and rollback-window closure are verified. Recheck current source and
reviewed migration policy before settling any implementation names/contract shape.

Candidate-version context/required target primitive IMPLEMENTED locally:4 new
cases,36 focused/build/strict post-build types/lint/diff PASS.
No live publication/activation change or complete-cohort claim. Next explicit
versioned owner required-coverage approval/query reusing canonical snapshot logic;
preserve all old migration ranges/hashes, then full canonical coverage helper.


## 10 October 2026 — d3d complete canonical candidate coverage IMPLEMENTED locally

Explicit owner policy/query and readonly same-transaction coverage helper delivered.
Tickets v8 approves field versions2–8; old v1–7 hashes/ranges preserved. Full private
preflight,50-row pages, exact count/cursor/native revisions, final/merged/unanchored
records, server candidate/real activation pointer, current source graph and actual
required target values. Empty sets still validate dependencies and target rights.
No DDL, new datastore, grants, durable approval or publication/native dispatch.
13 new meaningful owner/cohort cases;95 focused checks/10 suites, production build,
initial strict TS, scoped ESLint/diff PASS. One new test initially expected the final
root read on call4 instead of3; corrected fixture timing, production policy unchanged.
Strict post-build TS PASS (runner65022 exit0). Guarded Test rollback-only server probe added using
existing fixture/backup gates: actual final/merged/unanchored coverage, missing/fill/
false-clear target states, no activation, stale CAS and native/config/typed/Audit
snapshot equality. Central probe NOT RUN; live6b3d03f unchanged until release.
Expected next review/commit pinned consolidated d3d release and verify candidate/
public central probe. Then d3e reviewed required-rule evolution followed by d4
shared mutation lock order/native hooks/initial writer/rollback-window closure.
Full Phase2 gate NOT PASSED; visual2E NOT STARTED.

## d3e coherent implementation blocks — 10 October

Existing migration intents/observations/owner queries, representation approval,
cutover and settlement parse v1 payloads; SQL preparation guards also pin intent
version1. Do not widen these historical contracts or route v2 through their parser.

| ID | Purpose/dependencies | Expected files/database | Verification | Status |
| --- | --- | --- | --- | --- |
| d3e1 | Version-aware evolution impact using the existing pure evolution analyser; d3c/d | fields/evolution.ts + focused evolution suite; no DDL/persistence/dispatch | Rule add/change/removal needs reviewed new generation; cosmetic preservation; input pin impact; exact legacy semantics and v1 rejection of v2 receipts | VERIFIED pure scope;32/4, strict TS/lint/build; livef83e889 runtime/compatibility PASS |
| d3e2 | Versioned reviewed intent/observation/owner approval and compiler support; e1 | existing migration contracts/access/observation/preparation/coverage + explicitly new owner contracts; additive SQL guard updates if necessary | Genuine current principal, all fact/dependency metadata and native/global extension drift, bounded canonical set and invalid rows, old receipt hashes | IN PROGRESS: e2a pure packet VERIFIED; e2b real inspection/persistence NOT STARTED |
| d3e3 | Existing resumable representation/execution, cutover and settlement support; e2 | existing migration/execution/cutover/settlement, native owner callbacks, focused SQL probe | Source freeze, exact target requirement coverage, dependency compatibility, replay/rollback/history and current access | NOT STARTED |

Conditional publication remains disabled until d4 common mutation locking and
native enforcement are verified. e1 is metadata impact analysis, not a converter,
review approval, business-value reader or permission grant. Existing conversion
functions and migration intent v1 remain closed to v2.

### d3e2a packet contract — VERIFIED pure scope (livef83e889)

First e2 block: explicit v2 migration intent/observation/review integrity packet
inside the existing migration directory. Reuse typed conversion declarations and
evolution identity rules; archive only references and requirement fingerprints.
Old v1 packet parser/digest/owner ranges stay unchanged. Pure integrity grants no
record/publication access; no DB persistence or route dispatch until e2b server
inspection and additive SQL guards support these packets. Expected new versioned
contract, focused packet tests, shared payload union and memory/decision updates.
No DDL in e2a. Test canonical metadata, typed conversion compatibility, exact
required-null validity, complete deterministic cohort digest, tamper/replay/foreign
identity and old v1 rejection of v2 packets.

### e1/e2a local checkpoint — VERIFIED locally

32 checks/4 focused suites, strict TypeScript, scoped ESLint, production build and
diff checks PASS. Explicit v2 intent/review integrity and ordered observation digest
are references/checksums only. Required-null valid outcomes are rejected; true/false
values remain conversion concerns in the real server transaction. Unknown versions,
foreign principal, changed identity, conflicting pins, executable/defaulted input,
tampered reviews, incorrect summaries, duplicate/order/closed digests fail. Old v1
results/converter/parser/digest semantics unchanged. No schema/persistence/dispatch.
Next e2b: actual version-aware owner/metadata/row inspection plus additive guards,
then e3 existing representation/execution/cutover/settlement support.

### e2b/e3 integration findings — confirmed from source

- Existing preparation/observation/review guards enforce intent1 and exact JSON
  equality; execution/outcome/cutover/settlement guards construct receipt1. Add
  explicit version branches without reinterpreting or editing those retained shapes.
- Current Tickets snapshot3/representation1/settlement1 ranges stop at source5/
  target5. New v2 packets need explicit new owner/query approval; requiredCoverage
  v8 is readonly and cannot substitute for migration approval. Historical policy
  arrays/hashes remain unchanged. Avoid publishing a latest owner before its
  explicit legacy creation/candidate coverage compatibility is verified.
- Required metadata and real condition evaluation need genuine company/audited
  support identity in the same Serializable transaction. Admin target metadata
  sessions remain insufficient. Compile source and target full v2 metadata via
  the existing locked source provider; inspect actual current/pinned/written rights
  and dependencies even for an empty cohort. No client plans/facts/closures.
- Existing observations pin native and GLOBAL extension revisions; outcomes
  legitimately advance that global revision by exactly one per converted record.
  Existing atlas_studio_execution_source_fresh explicitly recognises the pinned
  outcome revision. The v2 requirement evaluation checksum must seal semantic
  rule/value evidence (version/condition/result), with native/global revision
  envelopes checked separately against the original observation or exact own
  outcome. Do not naively compare the full required-runtime envelope fingerprint
  after conversion: its extensionRevision changes on this own write. Do not waive
  arbitrary drift or replace sealed observations. Source and target facts/metadata/
  current access must still be re-evaluated at review/execution/cutover/settlement.
- runtime-write-window currently checks only the field being written; input-field
  changes/native fact changes must be captured by the global revision and explicit
  reviewed checks. d4 must close all affected retained windows atomically before
  enabling native/ordinary writers, preserving source freezes and Audit/CAS.

Exact first e2b action: add explicit payload/intent-version approval to newly
versioned owner migration contracts (absent means old1; old hashes unchanged),
then shared version-aware migration metadata inspection in preparation/collection/
coverage using the genuine principal and locked source provider. Keep dispatch
closed while adding real per-row evaluations and additive version2 SQL guards.

Receipt-format review before e3: execution/outcome/cutover/settlement receipts
contain closed hashes/references and explicit owner query pins, rather than field
payloads. Their existing format1 may remain suitable for review2 if its shape and
meaning are unchanged and version-aware review/observation inspection plus new
owner approval enforce all requirements. Do not introduce new receipt versions
merely because the preparation format changed. Preserve old parser entry points;
record the actual choice with tests for both retained v1 and conditional reviews.

Per-row e2b requirement evaluation must check actual converted-value presence:
null and an empty multi-selection are absent; false and zero are present. The v2
packet's required-null shape guard is necessary but cannot independently determine
presence from a fingerprint. Never infer presence from isNull alone or treat the
pure converter-constructor compatibility check as conditional value approval.

### e1/e2a release checkpoint

Original runner33757 exit0; candidateTTfVUe/publicr6k3E7 ALL COMBINED PASS. Exact
livef83e889 health verified. Pure readonly server probe81957 exit0 confirms impact/
v2 intent/review/digest/required failure/closed v1 boundary, no DB writes/files.
First ESM stdin diagnostic failed module loading; correct CommonJS mode passed,
no production defect or source change.32/4 + strict TS/scoped lint/build PASS.
e2b real business inspection/SQL persistence and e3/d4 remain unfinished.
