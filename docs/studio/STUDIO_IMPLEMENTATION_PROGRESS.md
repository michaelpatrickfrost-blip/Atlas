# Atlas Studio implementation progress

Updated: 9 October 2026.

# Current Phase

Phase 2 — Fields, record types and pages — IN PROGRESS. Phase 0/1 gates PASS.
Michael reconciled the source mismatch on 9 October: “do all as a plan do 1 then
once done contiune”. Use the supplied Section 27 sequence; complete prerequisites
and Phase 1 first, then proceed sequentially only after each gate passes.

# Current Workstream

2B2 — Versioned field compiler/identity and typed storage — IN PROGRESS. 2B1 pure
validation VERIFIED locally; 2A candidate/public acceptance PASS. Standalone Admin
companion VERIFIED; detailed plans in STUDIO_PHASE_2_PLAN.md and STUDIO_PHASE_2_FIELDS.md.

# Overall Status

IN PROGRESS for Phase 2. Admin-only/modern-UI companion VERIFIED. Phase 1 remains
VERIFIED. Latest observed live source 1dafe165f97545829d96242b1846e87d9c1f42b4; 2B2 local only.
The supplied source defines ten phases 0–9, not five. The original
is preserved unchanged at `docs/studio/ATLAS_STUDIO_SOURCE.docx` (source
`/Users/michael/Downloads/atlas_studio.docx`, SHA-256
`4afb01d98ead51cd70ec4958620eb9d27a19a0298cd0fa1cb8bd0aee69d9198d`).
All 903 body/table paragraphs and additional footer read. No specification rewrite.

# Completed Workstreams

| Workstream | Status | Evidence |
| --- | --- | --- |
| Specification intake and repository recovery | VERIFIED | Full document read; clean detached starting HEAD af030b0; source/provider/schema inspection. |
| Source sequence reconciliation | VERIFIED | Michael's 9 October follow-up authorises ordered plan and continuation. |
| 0A Registry contracts/runtime | VERIFIED | Five focused tests and full TypeScript check passed before adapter work. |
| 0B Existing template provider adapters | VERIFIED | Seven Studio tests plus 13 existing module/template/permission assertions passed; changed-file lint passed. |
| 0C Compatibility checks and prerequisite gate | VERIFIED | Catalogue hash snapshot, 21 tests, TypeScript, changed-file lint and production build passed. |
| 1A Tenant metadata models/additive migration | VERIFIED | Central additive migration applied; real immutable update/delete, sealed-edge and cross-tenant pointer constraints passed in candidate 5f8d83. |
| 1B Draft/validate/publish/activate service | VERIFIED | Central real publication/activation/rollback/history, simultaneous draft CAS, disabled sources, permissions and atomic audit passed after correcting nested Prisma FK mapping. |
| 1C Configuration capabilities/admin interface | VERIFIED | Candidate and public real forms, saved drafts/conflict diff, publication/activation and customer/Admin routes passed. |
| 1D Release compatibility/security/live acceptance | VERIFIED | Exact candidate/public metadata and Home acceptance passed; dependency scans, backup, build, activation and public revision checked. |
| Standalone modern Admin shell companion | VERIFIED | Live a642df0; metadata/Admin/business and Home/Reports checks passed; visible UI inspected. |
| Companion Admin/business sign-in and provisioning | VERIFIED | Real Admin creates Test-company user; correct company setup/login passes; wrong company recovery/login and customer Admin access rejected. |
| 2A Owner-approved entity/extension contracts | VERIFIED | 8 focused files/54 assertions, TypeScript, scoped lint/build; central candidate/public owner checks PASS on 6775044. No native write changes. |
| 2B1 Typed field/value validation | VERIFIED | 7 focused assertions, TypeScript/scoped lint; integrated 17 files/110 assertions and production build. Pure library, no storage/UI claim. |

# Current Workstream Detail

2B2 IMPLEMENTED locally, NOT DEPLOYED: closed compiler dispatch/lifecycle, permanent
publication identity/generation binding, owner field limit, activation checks and
cosmetic-only evolution until reviewed migrations. Tickets v2 preserves sealed v1
hashes. Five additive typed models/SQL guards with immutable history/current pointers.
Prisma validate/generate, 19 files/85 tests, scoped lint, production build and strict
post-build types PASS. Backed-up central DDL transaction-only syntax check PASS after
fixing CASE parentheses; rolled back and table absence confirmed. Migration NOT
APPLIED; data constraints/runtime NOT VERIFIED. Real privileged schema/lifecycle
acceptance helper added, distinct from the pending owner-authorised values API.

Removed the visible internal-key input/display; server assigns stable UUID keys.
Michael's bespoke business design studio/Sales clarification is permanently saved;
visual preview/builder remains 2E, not claimed from the foundation UI.

2B1 delivered closed typed field contracts/required/constraint validation, exact
decimal/currency/calendar/UTC/duration semantics, stable enum options/retirement,
contact/address/reference syntax and additional capability checks. Reference target
authorisation is required in later 2B4. Compiler/storage now implemented locally in 2B2; no field builder/value API yet. Subworkstreams
and storage/history/migration design saved in STUDIO_PHASE_2_FIELDS.md. Visual setup
and responsive draft previews are a permanent 2E acceptance requirement in
STUDIO_VISUAL_BUILDER_REQUIREMENTS.md; not an implemented builder.

2A delivered: strict entity metadata and projection ownership/hash checks, separate
canonical record authorisation gateway, native write/expected revision/transaction
requirement, output tenant/ID validation. Tickets owner registers bounded keyset
list/get plus read-only native fields; workScope/private/member/final/merged guards
remain owning-domain logic. Module enablement and record state are locked/rechecked
inside the extension transaction. Core never imports a module implementation.

2B purpose: strict versioned field metadata, typed central values with tenant-aware
indexes/uniqueness/history, server validation and atomic owner-authorised writes.
Dependencies: 2A contracts and Phase 1 metadata kernel. Next design must preserve
stable keys, retirement/history and migration-plan requirements, and existing native
intake fields. Expected files: core/studio/fields + compiler dispatch, Prisma additive
models/migration, tests/central acceptance. No native-domain column conversion/reset.

0A purpose: typed discoverable descriptors, stable IDs/versions/hash/lifecycle,
fail-closed invocation through tenant session, owner module availability and domain
capability, validated inputs/outputs. Files: `src/core/studio/registry/*`, manifest
optional bundle, focused tests. No database change. Checks: duplicate/invalid IDs,
schema changes, missing capability, disabled owner, two-tenant contexts, malformed
inputs/results and immutability.

0B purpose: adapt existing TemplateContextProvider list/get without replacing the
renderer/provider or expanding source fields. Files: registry adapter/runtime,
template service and tests. No database change. Preserve project/CRM/service scopes.

0C purpose: dependency snapshots and breaking-change detection; document module
contract and run prerequisite build/regressions. No active Studio definitions yet.

1A purpose: Definition/Draft/Version/Dependency, tenant indexes/composite foreign
keys, append-only versions, CAS drafts, activation pointer. Schema + additive SQL;
no reset/backfill of business records. Check relational/immutability constraints.

1B purpose: strict metadata payload/reference validation, compilation/checksums,
transactional immutable publication, audit, version compare/activation/rollback.
Core services + tests. No domain writes; published metadata is configuration only.

1C purpose: narrow Studio permissions and administration shell for draft lifecycle.
Core permissions/module manifest/routes. No generated domain pages/fields/flows.

1D purpose: candidate release dependency scan, regression/security checks and live
metadata lifecycle with two tenant scopes and missing publication permission.
Deployment must preserve central records, backups and concurrent contributions.

# Files Changed

2B2 working-tree: registry policy/types/factory, service-work/studio (retained v1 + v2),
compiler/fields, fields/schema, test compiler/sealed-hash regression, Prisma schema
and proposed additive typed-field migration. These are not part of live 6775044.

2B1: fields/{schema,validation}, tests/studio-field-values; visual requirements and
field execution design, plan/ledger/state/decisions. Merged exact concurrent live
Guardian MRP 0ce9f4a plus its source/tests/docs/evidence; no native correction removed.

2A: registry/{types,entities,contracts,registry}, service-work/studio, tickets manifest,
tests/studio-{entities,ticket-owner}, scripts/studio/check-ticket-contract and metadata
driver, MODULE_SPEC, SERVICE_WORK_DESK, inventory/plan/ledger and .ai state/decisions.

Admin follow-up: Atlas routes moved to `src/app/(admin)/atlas`; `components/admin`,
Core Admin sign-out, data API action aliases/generator, selected-company Studio tabs,
Admin error boundary, tests and current Admin/architecture/design/shared memory docs.

`src/core/studio/registry/{types,contracts,registry,adapters,runtime}.ts`;
`src/core/modules/types.ts`; `src/core/templates/service.ts`;
`tests/studio-{registry,adapters}.test.ts`; `docs/MODULE_SPEC.md`; metadata compiler/services, four Prisma models/additive migration, Studio module
and customer/Admin routes, login/reset company addresses, proxy login redirect,
platform provisioning guards, deploy compatibility script, focused/regression tests,
source copy, contract inventory, phase completion report, this ledger, CURRENT_STATE and DECISIONS.

# Database / Prisma Changes

Pending 2B2: five typed field/storage models and additive migration
20261009220000_studio_typed_fields. Prisma schema validation PASS; SQL/constraints
not centrally tested, migration not applied. Published metadata/history and all
existing domain records remain unchanged. Decimal physical capacity is 38,10 while
metadata enforces explicit precision<=28/scale<=10 without automatic rounding.

Four additive models: StudioDefinition, StudioDraft, StudioDefinitionVersion and
StudioDependency. Migration `20261009210000_studio_metadata_kernel` creates only
metadata tables/indexes/composite tenant foreign keys/constraints/guards. No existing
business records changed, no local business databases, no destructive reset.

# Migrations Applied

`20261009210000_studio_metadata_kernel` applied centrally by backed-up candidate
preparation on 9 October. Backup prefix:
`/home/administrator/backups/atlas-pre-deploy-20261009-184707`. Existing runtime
was retained during preparation; branding 58b3610 and verified Home 329b60a are
preserved. Final candidate/activation backup prefixes: `atlas-pre-deploy-20261009-193301`
and `atlas-pre-deploy-20261009-193700` in the same server backup directory.

# Tests Added

Registry/adapters/catalogue/compiler/service/admin-context suites; company login,
platform grants and business-user provisioning regression cases.

# Tests Run

Document structure/phase searches; repository status/diff/source inspection.
`npm ci --no-audit --no-fund` completed; isolated worktree dependencies installed.

# Test Results

Combined 6775044 candidate/public owner + metadata/Admin/company sign-in, Home,
Reports and MRP checks all PASS; private logs /tmp/atlas-studio-acceptance-fHPgb0 and
/tmp/atlas-studio-public-Af2xt5. Exact live source verified. Modern Admin screenshot
refreshed at /tmp/atlas-admin-console-live.jpg. Native MRP fixes preserved. Main
eba8b49 includes live source and final concurrent evidence; newer field storage is
working-tree only. Latest compiler 5 files/25 tests PASS; 4-case sealed v1 hashes
regression PASS. Latest 2B2 checkpoint 19 files/85 tests, post-build TypeScript/scoped lint/build PASS.
Central DDL transaction rolled back PASS; backup atlas-studio-field-ddl-TvSAMP.
Latest live 9303039 is a concurrent Messages release to preserve before deployment.

2A candidate ce175fb central owner checks PASS (real private/tenant/member/native
capability/revision/disabled-source/final record cases), metadata/Admin/Home/Reports
regressions PASS; logs /tmp/atlas-studio-acceptance-wsnN9L. Activation safely stopped
at ancestry after 0ce9f4a became live. Combined source needs prepared/public proof.
2B1 7 assertions PASS; integrated merged 17 files/110 assertions and production
build PASS, scoped field lint/TypeScript PASS. No field values are stored yet.

2A local checkpoint: 8 focused files/54 assertions PASS; strict TypeScript, changed-
file lint and production build PASS, diff reviewed/whitespace check PASS. Central
Test-tenant private/member/revision/tenant/disabled-source acceptance helper added
to existing driver but not executed yet. No new migration/deployment at this point.

Admin companion: 23 focused files /110 assertions passed; strict TypeScript and
production build passed; scoped lint no errors/one brand-img warning. No schema
change. Candidate 214cbad Studio/Admin/Home acceptance passed. New live Reports 2a8522f
is merged; integrated 30 files/146 assertions, TypeScript/build pass. Merged
candidate/public Studio/Admin, Home and Reports acceptance passed on a642df0;
visible Admin UI verified. Pre-merge full suite: 1009 passes/85 unchanged baseline
failures/22 skips. No new schema changes.

903/903 source paragraphs; original hash matches preserved copy. npm ci and
Prisma generation succeeded. First registry-only run: 5 passed. Combined registry,
adapter, module, template, permission run: 20 passed (after fixing one test fixture
syntax error). First registry TypeScript pass: exit 0. Changed-file lint: exit 0.
Second TypeScript and production build passed. Catalogue snapshot: 1 passed.
Most recent focused run includes 15 test files and 64 assertions (registry,
metadata, permissions, address binding and Proxy; all passed). TypeScript, changed-
file lint and production build passed. Latest full tests: 85 failures/1003 passes; unchanged
HEAD baseline reproduces the same 85 failures (968 passes before additions). Full
lint: 9 errors/21 warnings, unchanged baseline. Central candidate and public metadata lifecycle/browser acceptance and read-only
Home desktop/tablet/phone checks passed on c46bbef. Failures are existing stale
module-availability mocks and existing lint errors,
not a reason to claim full-suite success.

# Architecture Decisions

Use supplied document sequence under Michael's follow-up. Existing template and
automation engines/providers stay authoritative. Registry adapters precede metadata.
Gate checklists below derive from the supplied sections rather than renumbering or
rewriting the specification. Implementation decisions recorded in DECISIONS.

# Known Issues

Full test/lint baseline failures are reproduced unchanged; focused checks pass.
Earlier candidate publication/accessible-label/test-selector failures were fixed
and rerun successfully. Home screenshot ownership interrupted the first combined
runner; the matching read-only test environment passed candidate/public Home.
No unresolved Phase 1 runtime gate failure. Later engines remain unimplemented.
See `STUDIO_PHASE_1_COMPLETION.md` for evidence and practical limits.

# Deferred Items

Remaining Phase 2 work is active, not deferred. Phases 3–9 per Section 27: Decisions/Approvals, durable
outbox, Flow runtime, Automations migration, Process Studio, packages and adoption.
No later-phase implementation before preceding gate passes.

# Acceptance Gate Status

Phase 2 NOT PASSED: 2B–2F remain; owner contract local evidence alone is not the phase
gate. Central owner checks must run on candidate/public release alongside full phase
runtime, tenant, permissions and native module regressions.

Phase 0 PASS (runtime/contract/regression tests + build + live compatibility). Phase 0 checks: (a) stable typed IDs/schema hashes/lifecycle, (b) existing provider
behaviour through adapters, (c) server tenant/module/capability/input-output checks,
(d) duplicate/compatibility/security tests, (e) production build/regressions.
Phase 1 PASS, candidate and public HTTPS evidence for each check: (a) tenant-owned metadata with immutable checksummed versions,
(b) CAS drafts, (c) server validation/closed registry dependencies before publish,
(d) separate activation and historical rollback, (e) distinct edit/publish/read
permissions without domain privilege widening, (f) transactional audit,
(g) two-tenant/conflict/security/immutability/compatibility tests, (h) build and
backward-compatible live deployment/representative lifecycle verification.
These checks derive from Sections 5–6, 14, 19, 25–28; no whole-system gate used
prematurely. Gates cannot PASS from file existence alone.

# Exact Next Action

2B2/local generated-key simplification checkpoint f2beb8b; exact live Messages
9303039 and private Admin 1dafe16 (main 6870014) merged, source/evidence preserved.
Prisma regenerated, 27 files/140 tests, scoped lint and integrated build PASS.
Strict post-build types PASS; record checkpoint, then prepare
the additive backed-up candidate, then run field lifecycle/SQL/history/tenant guards
and existing Studio/Admin/business/Home/Reports/MRP/Messages acceptance before
activation. Proceed to 2B3 reviewed evolution/retirement/conversion planning and
resumable jobs only after 2B2 central checks PASS. 2B4 owner values, then 2C–2F.
Phase 2 remains IN PROGRESS; do not start Phase 3+.
