# Phase 2B — typed additional fields

Source: supplied specification Sections 6.4–6.5, 14, 19, 22, 24–28. Depends on
verified 2A canonical owner contracts and the existing Phase 1 metadata kernel.
This is an execution design; the source specification remains unchanged.

| Workstream | Purpose/dependencies | Files/database | Checks | Status |
| --- | --- | --- | --- | --- |
| 2B1 | Closed field/storage/value contracts and server validators | core/studio/fields/{schema,validation}, focused tests; no DB | Required/type/bounds/exact decimal/currency/calendar/enum/contact/reference-shape/address/extra-capability cases | VERIFIED locally |
| 2B2 | Versioned field compiler, stable identity binding and typed current/history storage | Compiler dispatch/definition lifecycle + additive central models/migration | Immutable identity/version bindings, tenant FKs, typed-family constraints, indexes, immutable value history | VERIFIED on candidate/public e5d66e6; schema/lifecycle, not owner value API |
| 2B3 | Safe definition evolution, retirement and explicit conversion planning | fields evolution/migration services and durable migration metadata | Compatibility/conversion preview/failures, no in-place conversion, resumable/idempotent batches/cutover/history | IN PROGRESS; pure conversion/retirement/principals verified on candidate/public 7941f9b, cohort query local; jobs not started |
| 2B4 | Atomic owner-authorised read/write and reference validation | fields services + schema from 2B2 | Owner access/locks, field caps, CAS, required rules, uniqueness and audit; references independently owner-checked | NOT STARTED |
| 2B5 | Central acceptance/checkpoint | tests, central driver, memory/docs | Real typed storage/history/constraints/retirement/tenant/security/compatibility; build and runtime proof | NOT STARTED |

2B3 is subdivided in STUDIO_FIELD_EVOLUTION_PLAN.md. Its remaining job/publication/batch/cutover workstreams remain
NOT STARTED; combined 2B2 candidate/public e5d66e6 release acceptance PASS.

2B1 is a pure validation library, not a stored-field feature. The UI does not expose
these schemas yet. Reference syntax validation does not prove target access: 2B4
must resolve its pinned entity contract and authorise the target record separately.
Additional field permissions narrow native owner permissions; they do not grant
record access. Native status, priority, assignment, SLA, finance, stock and process
invariants remain owning-domain operations. Existing native intake questions and
frozen answers are preserved, with their own owner surface in the later builder.

Storage design for 2B2: reuse StudioDefinition/immutable versions for field metadata,
with a permanent tenant/entity/field-key identity binding. Keep only a canonical
record association and additional-value revision in Studio's record anchor. Typed
value families hold text/integer/decimal/boolean/calendar/instant/enum/reference/
address values; immutable history is version-bound, and current pointers use CAS.
Tenant/entity/field/version composite FKs must prevent cross-company associations.
Scalar equality/uniqueness uses a normalised fingerprint; numeric/date range indexes
retain native SQL types. A field's active uniqueness policy cannot be bypassed by
omitting a client marker. Structured values do not pretend to support scalar indexes.

Exact decimal/money input uses decimal strings and declared precision/scale; no
floating-point rounding or inferred currency. Date is a calendar day; datetime is
an explicit UTC instant; durations declare seconds. Enum choices use immutable IDs,
value-set versions and retirement. General stored text is bounded. Configured regex
uses a deliberately linear approved-character/bounded-repeat grammar to avoid
untrusted backtracking; unsupported expressions fail validation.

Type changes require a first-class reviewed migration plan and new storage generation,
not editing old values in place. Preview analyses loss/failed rows. Source and target
remain until resumable batches complete and explicit cutover passes CAS/permission/
uniqueness checks. Same-key identity is retained; old schema/value history remains.
Retirement removes new editing eligibility while preserving authorised history.
Do not claim 2B VERIFIED or start 2C from the 2B1 library alone.

Next: implement the compiler/identity binding and reviewed additive models/constraints
for 2B2, generate Prisma, then add relational/type/version/history tests. No destructive
reset, local business datastore or publication of unvalidated client plans.

Working-tree design now uses five models: permanent FieldBinding, immutable storage
Generation, canonical ExtensionRecord association/CAS, per-generation FieldSlot
current pointer and immutable typed FieldValue history. Decimal physical storage
38,10 supports every declared precision<=28/scale<=10; validators and SQL guard
enforce exact logical bounds. New generation IDs permit source/target coexistence
during future reviewed conversions. Tickets entity v2 declares approved types,
reserved native keys and self-reference target; real sealed v1 hashes are regression
tested. Central migration and candidate SQL/runtime checks PASS; activated e5d66e6,
public HTTPS acceptance PASS. No customer value API is exposed.

2B2 checkpoint: compiler dispatch and transactional permanent identity binding are
connected to the existing metadata lifecycle. Owner field limits include retained
retired identities. Only label/help revisions publish until reviewed evolution is
available in 2B3. Activation requires the exact tenant-owned generation. Local
checks, transaction-only central DDL syntax verification and candidate migration/data
guards PASS. Generic desktop model reads
must remain denied for additional values: the future gateway must authorise native
record, current field policy and written-schema policy before returning any value.

Prepared fcfd512 central schema/lifecycle tests PASS (private logs in ledger);
migration applied after backup. Complete combined candidate/public e5d66e6 acceptance PASS, including Messages,
private Admin and connected supply; source live with rollback runtime retained. No owner-authorised customer values API is
claimed; that is 2B4.

## Remaining correctness requirements before the Phase 2 gate

The current required flag is unconditional. Section 6.5 required-if remains
unimplemented; add a closed typed server condition contract with appropriate
field/record dependencies in 2B4/2C without building the Phase 3 Decision engine.
Hiding a field must never relax server validation. Preserve sealed older field
payloads and checksums when introducing the condition contract.

Required-field publication/evolution coverage must include canonical owner records
that have no Studio extension anchor or slot, not only existing stored values.
Before opening the owner value API/native forms, implement the owner-authorised
coverage/backfill gate and atomic required-field validation for native create/save.
Unavailable records block review/cutover without disclosing private records.

The existing release scan checks registry dependencies. New field/record-type/page
metadata runtime schemas also need explicit compatibility validation before the
Phase 2 gate: an older runtime must not accept a new payload merely because its
entity descriptor still resolves. Preserve existing version/checksum contracts;
introduce version-aware validation rather than adding defaults to sealed payloads.
These are remaining requirements, not implemented features or passed checks.

Runtime consumers and builder permissions remain a 2B4/2C design dependency.
Business operators must be able to use approved native forms/pages without being
given configuration-edit privileges. Resolve only the schema needed by that owner
runtime, enforce native and additional field permissions on the server, and never
turn schema access into data access. Disabling the Studio authoring UI must not
silently bypass published required/unique policies. Define and test disable/retire/
rollback behavior before opening native writes; this is not implemented by the
Phase 1 metadata `activeDefinition` helper.
