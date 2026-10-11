# Phase 2B — typed additional fields

Source: supplied specification Sections 6.4–6.5, 14, 19, 22, 24–28. Depends on
verified 2A canonical owner contracts and the existing Phase 1 metadata kernel.
This is an execution design; the source specification remains unchanged.

| Workstream | Purpose/dependencies | Files/database | Checks | Status |
| --- | --- | --- | --- | --- |
| 2B1 | Closed field/storage/value contracts and server validators | core/studio/fields/{schema,validation}, focused tests; no DB | Required/type/bounds/exact decimal/currency/calendar/enum/contact/reference-shape/address/extra-capability cases | VERIFIED locally |
| 2B2 | Versioned field compiler, stable identity binding and typed current/history storage | Compiler dispatch/definition lifecycle + additive central models/migration | Immutable identity/version bindings, tenant FKs, typed-family constraints, indexes, immutable value history | VERIFIED on candidate/public e5d66e6; schema/lifecycle, not owner value API |
| 2B3 | Safe definition evolution, retirement and explicit conversion planning | fields evolution/migration services and durable migration metadata | Compatibility/conversion preview/failures, no in-place conversion, resumable/idempotent batches/cutover/history | IN PROGRESS; pure conversion/retirement/principals verified on candidate/public 7941f9b, review/publication/execution candidate/public verified on 8d6eb9e; cutover receipt verified5f5fce5, authorised service VERIFIED9aad1fc; f4 rollback/finalization VERIFIEDa527ccd; ordinary current/history reads VERIFIED53c05ae |
| 2B4 | Atomic owner-authorised read/write and reference validation | fields services + schema from 2B2 | Owner access/locks, field caps, CAS, required rules, uniqueness and audit; references independently owner-checked | IN PROGRESS; ordinary current/history/read/save VERIFIED live62201ae; d1 pure conditional compiler VERIFIED locally; canonical/native hooks pending |
| 2B5 | Central acceptance/checkpoint | tests, central driver, memory/docs | Real typed storage/history/constraints/retirement/tenant/security/compatibility; build and runtime proof | NOT STARTED |

2B3 is subdivided in STUDIO_FIELD_EVOLUTION_PLAN.md. Its reviewed job/publication/batch backend is VERIFIED on 8d6eb9e; cutover identity
passed080e4d7 and receipt storage passed5f5fce5. Authorised shared cutover/replay
is VERIFIED9aad1fc complete candidate/public; f4 rollback/finalization VERIFIEDa527ccd; ordinary current/history reads VERIFIED53c05ae. User preview/editor/value gateway remain incomplete. Combined 2B2
candidate/public e5d66e6 release acceptance PASS.

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

Current next: f4 honest rollback/value compatibility after a bounded Studio entry-point clarity companion. Receipt guards0006 are already applied. The compiler/binding/typed storage
are already VERIFIED; do not restart 2B2. No reset/local business datastore.

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

10 October f4b2b IMPLEMENTED locally: forward0008 integrity-function changes only,
no Prisma/table/backfill/reset. Source-first freeze and definition locking, retained
completed sources/obsolete targets, approved active schema and same-generation
label/help activation. Nested exact Test RB/FINAL continuation and real subsequent
reviewed-publication helpers added to the existing acceptance pipeline. Central
fullDDL BEGIN/ROLLBACK compatibility and cosmetic/generation/structure/malformed
checks PASS with no persistent changes;55files343 regression/build/scoped lint/
strict post-build TS PASS. Actual new helper runtime proof/candidate/public gate
pending; not VERIFIED, no production settlement/value API or visual-designer claim.
Exact next: reviewed clean checkpoint, pinned full Studio release, investigate any
actual helper failure without weakening guards; then f4c/d and2B4 before2C/D/2E.

F4b2b VERIFIED10 October1109UTC: exactf1a9bf1 candidatezDzdGq/publici1zMEw
ALL COMBINED PASS, runner65486 exit0. Both nested terminal cosmetics/owner fixture
and actual subsequent reviewed publication source-first freeze PASS; source/target/
receipt/native history retained.0008 applied, no model/table/backfill/reset. Local
55files343/build/types/lint PASS. Current/public exact, previous666efeb and168GiBfree
verified; retention only retired inactive1d7f558 runtime output. Phase2 not passed;
nextf4c1 historical/current settlement inspection before shared service/Audit/replay
and2B4 normal owner forms (historical checkpoint; see newer runtime entries). Visual2E remains required after2B–D. See ledger.

## 2B4 ordered runtime workstreams (planned10 October)

These start after f4c/d acceptance; they do not replace source requirements or
claim completion from schema helpers. No new database is introduced.

| ID | Purpose/dependencies | Expected files / DB implications | Evidence / status |
| --- | --- | --- | --- |
| 2B4a | Current ordinary operator authority and read compiler; f4c/d then existing owner/typed storage | fields/runtime-authority, compiler/fields and tests; no schema | Real membership/role/platform/source locks and tenant denial, field reads without publish/edit or write grant, same sealed checksums; VERIFIED53c05ae full candidate/public |
| 2B4b | Current and retained field read gateway | fields/runtime-read, typed schemas/codec/registry and Test helper; no schema | Owner native/private checks, current+written policies, reference target access, storage fingerprint/history, source/target active pointer, no foreign/value leakage; VERIFIED53c05ae full candidate/public |
| 2B4c | Atomic ordinary value writes and migration-window integration | fields/runtime-write, existing storage/Audit/CAS/owner services; additive DDL only if evidence requires | Expected native/extension/slot/config revisions, native final/merged rules, uniqueness/required, current+written policies, reference authority, one value+pointer+Audit, explicit compatible settlement and failure/concurrency tests; VERIFIED62201ae complete candidate/public;65files402/build/types/lint PASS (endpoint/native hooks gated by2B4d) |
| 2B4d | Required-if contract and canonical coverage / native save hooks | schema-version-aware metadata/compiler, owning ServiceWork create/save, focused tests; compatibility-only additive evolution | Closed typed native/field conditions, hidden/disabled controls cannot bypass rules; missing anchors included; metadata authoring disablement cannot bypass published requirements; NOT STARTED |
| 2B4e | Operator forms and declared field search | approved Tickets runtime components/actions/query plus existing search/indexes | Business users need native data grants, not Studio authoring; real create/edit/reload/form validation/private/reference/search/history and responsive modern UI; NOT STARTED |
| 2B4f | Central runtime gate | Test fixtures, native compatibility, release scan/docs | Real all type families, storage/Audit/CAS/revocation/tenant/retirement/disable/migration/required-if checks, schema compatibility scan/build/full candidate+public; NOT STARTED |

Default design: published field rules are platform runtime policy even when Studio
authoring is disabled. Native source availability is still mandatory. Ordinary
read checks read grants in both current/written schemas, not a configuration edit
or value-write grant. Writes remain owning-domain extension operations; Studio
never rewrites native fields. Source representation remains current until explicit
cutover; historical/obsolete generation must not become an ordinary write target.
Required publication must prove canonical coverage including absent anchors or
fail with a guided population/review step. Resolve exact native save/create hooks
before opening ordinary writes; do not silently permit incomplete required rows.
These are planning constraints, not implemented behaviour. Visual2E follows2B–D.

## 10 October 2026 — f4c/d VERIFIED live1146UTC; next2B4a

Exacta527ccdf3832c16da541e6a0df650b06e90d1e8e full candidate1qikYT/publicWMNUWf
ALL COMBINED PASS; runner96792 exit0. Actual retained/open/terminal/post-cosmetic
inspector, independent-current-customer rollback/finalize, both rollback Audit
failures and finalization Audit failure, concurrent exactly-once CAS/Audit, fresh
revocation/private/module/tenant/session checks, changed-extension rollback denial
but finalization, continued cosmetics/writes/new-publication history replay and
source-first freeze PASS in both stages. Native snapshots unchanged. Dashboards/
Home/Settings/Reports/MRP/Messages/private Admin/Supply/Commercial/People allPASS;
no reported browser errors.60files372/build/strict post-build TS/scoped lint/diff
PASS. No schema/model/migration/backfill/reset/native/UI changes in this checkpoint.
Required backup113558, fixtures113732/114133; no ad-hoc dumps. Retention retired
only inactive666efeb runtime output; source/static/history/data/backups retained.
Current/public exacta527ccd, previousf1a9bf1, atlas active, PG18main online/login200,
root168GiBfree/14%used. Original locks idle verified using read-only file descriptors
after plain flock open was denied; neither original file removed/replaced.
Files: shared cutover identity; settlement receipt/inspector/coverage/services;
registry owner policy and Tickets query; Test helpers/fixtures/five focused suites;
MODULE_SPEC/decisions/field plan/ledger/current state. Source checkpoints35d471a,
fa100f7,a527ccd. Evidence /tmp/atlas-studio-f4cd-live-deploy.txt and private stage dirs.
Phase2 remains IN PROGRESS: ordinary values, required-if/native hooks, record types/
pages/search and visual business/Sales/document/dashboard builder still outstanding.
Exact next:2B4a ordinary operator authority and read compiler, then2B4b scoped
current/history gateway. Preserve write/source/module/native/current+written checks;
operators must not require authoring/write grants to read permitted fields.

## 10 October — current2B4c release and next required-rule work

2B4a/b VERIFIED exact53c05ae full candidate/public acceptance.2B4c internal atomic
saves IMPLEMENTED62201ae;65files402/build/strictpostbuildTS/lint/diff PASS; pinned
full candidate/public acceptance running. No endpoint or native writes.
Required2B4d workstreams must be split before coding: version-aware closed required-if
contracts/compiler retaining sealedv1; canonical coverage including missing anchors
at publication/review; shared-transaction owning native create/save validation;
operator permission/backward compatibility/native acceptance. Ordinary creators use
existing native create authority and an explicit owner-approved new-record field
initialisation path, not broad manage grants. Preserve queue intake questions,
status/approval/evidence/SLA/native CAS; rules survive authoring disablement and
hidden controls. Native finalization evaluates resulting native facts atomically.
No Phase3 Decision engine or arbitrary expression/SQL is part of required-if.

2B4d1 pure required-if grammar/compiler VERIFIED locally (67files416/build/strict
post-build TS/lint/diff PASS). Versioned v2 metadata stays outside authoring
dispatch until d2–4 owner facts, canonical coverage and native enforcement work.
See STUDIO_FIELD_REQUIRED_RULES_PLAN.md. No conditional runtime completion claim.
