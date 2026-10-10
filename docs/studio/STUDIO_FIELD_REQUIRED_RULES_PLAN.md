# Phase2B4d — required rules and native transaction integration

10 October 2026. Source Sections6.5,14,23–28. Depends on ordinary read/write
checkpoint and existing sealed field storage/migration contracts. This plan is
implementation work ordering, not a rewrite of the supplied specification.

| Workstream | Purpose/dependencies | Expected files/database | Verification | Status |
| --- | --- | --- | --- | --- |
| d1 | Closed versioned required-if payload/compiler; preserve v1 plans | fields condition/schema contracts, compiler helpers and tests; no DDL | Bounded typed predicates, unknown/cyclic/foreign/unsupported fact denial, exact old checksum regression; pure helpers only until d2–4 | VERIFIED locally; grammar/compiler and67files416 tests/build/strict post-build TS/lint/diff PASS; unwired |
| d2 | Owner-approved transaction facts, canonical cohort and new-record initialisation contracts | registry types/entities/contracts, service-work Studio new descriptor versions/query callbacks, runtime authority shared transaction helper; no DDL expected | Exact new native creation authority, current/private/tenant/source policy, canonical final/unanchored cohort, sealed old hashes | VERIFIED live0925bb5; candidateytkpaL/publicsZJ2uA combined PASS + actual contracts/native/Audit rollback proof;69files431/build/types/lint |
| d3 | Canonical publication/evolution coverage | definitions binding/publication/review/coverage services, requirement runtime and tests; additive guards only if necessary | All canonical records including absent anchors; optional-populate-review path; conditional resulting requirements, current/written/ref rights, reviewed conversion coverage, Audit/CAS | NOT STARTED |
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
| d3c | Transactional fact/value reading and resulting requirements; d3a/b and d2 owner facts/proofs | required runtime reader + tests; no new datastore | Current/written/native/reference guards before values, staged changes, create-only new record proof, absence vs unavailable, deterministic locked reads | NOT STARTED |
| d3d | Required initial publication and activation coverage; d3b/c | definition lifecycle + existing canonical snapshot access; additive guards only if necessary | Complete canonical cohort incl final/unanchored; required coverage/unique/source/CAS/Audit; optional-populate-review path; no metadata principal impersonation | NOT STARTED |
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
entity versions when integration is wired. Current d2 proof only approves explicit
v6 initialisation and never enables existing-record reads or broad editing.

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

D3b1 full isolated v2 compiler IMPLEMENTED:29 focused/71files446/build/lint/diff
PASS, final strict post-build TS pending. Native metadata is compared with exact
registered declarations; query and field-version dependencies are sealed. Existing
v1 and authoring dispatch unchanged. D3b2 actual stored-source provider remains
NOT STARTED; injected pure test metadata is not binding/history/cycle proof.

### d3c work ordering — resulting required inputs

c1 existing-record transactional reader first: reuse versioned base-field/value
integrity and current/pinned/written/native/reference access; exact native revision,
approved query output and absence vs unavailable. No metadata principal as data
principal, no source condition execution while viewing a value. c2 then staged
resulting values and genuine creation proof, with explicit current owner creation
fact policy/legacy version coverage where required. Actual native creation-only
facts must not borrow ordinary read/manage grants. Neither reader activates rules;
canonical publication/evolution coverage and d4 native hooks remain mandatory.
