# Phase2B4d — required rules and native transaction integration

10 October 2026. Source Sections6.5,14,23–28. Depends on ordinary read/write
checkpoint and existing sealed field storage/migration contracts. This plan is
implementation work ordering, not a rewrite of the supplied specification.

| Workstream | Purpose/dependencies | Expected files/database | Verification | Status |
| --- | --- | --- | --- | --- |
| d1 | Closed versioned required-if payload/compiler; preserve v1 plans | fields condition/schema contracts, compiler helpers and tests; no DDL | Bounded typed predicates, unknown/cyclic/foreign/unsupported fact denial, exact old checksum regression; pure helpers only until d2–4 | VERIFIED locally; grammar/compiler and67files416 tests/build/strict post-build TS/lint/diff PASS; unwired |
| d2 | Owner-approved transaction facts, canonical cohort and new-record initialisation contracts | registry types/entities/contracts, service-work Studio new descriptor versions/query callbacks, runtime authority shared transaction helper; no DDL expected | Exact new native creation authority, current/private/tenant/source policy, canonical final/unanchored cohort, sealed old hashes | NOT STARTED |
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
No owner initialisation/facts provider, native hook, coverage or publishable conditional
implementation is claimed by this document.
