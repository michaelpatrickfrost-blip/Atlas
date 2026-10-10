# Atlas Studio implementation progress

Updated: 10 October 2026.

# Current Phase

Phase 2 — Fields, record types and pages — IN PROGRESS. Phase 0/1 gates PASS.
Michael reconciled the source mismatch on 9 October: “do all as a plan do 1 then
once done contiune”. Use the supplied Section 27 sequence; complete prerequisites
and Phase 1 first, then proceed sequentially only after each gate passes.

# Current Workstream

2B3c6b1 — Authenticated pinned preparation — IMPLEMENTED locally; central proof pending.
c5a/c5b VERIFIED live 5d101da; c6a policy locally verified. No collector/writer/designer yet.

# Overall Status

IN PROGRESS for Phase 2. Admin-only/modern-UI companion VERIFIED. Phase 1 remains
VERIFIED. Latest confirmed live source 5d101daec0618fee623e15b9c639d6afb4d581d6,
preserving verified 7941f9b;
2B2 exact acceptance e5d66e6 is preserved;
combined candidate and complete public HTTPS acceptance PASS.
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
| 2B3a Pure compatibility/conversion analysis | VERIFIED | 3 files/22 tests, strict TypeScript/scoped lint/build PASS; no DB or executable migration. Candidate/public 7941f9b pure converter evidence; no jobs. |
| 2B3b Field retirement backend | VERIFIED | Exact 7941f9b candidate/public real CAS/atomic audit/failure rollback/history/tenant checks PASS; no purge/history API/UI. |
| 2B3c1 Refreshed customer/support principals | VERIFIED | Exact candidate/public 7941f9b real revocation/permission/audit/metadata-context checks PASS; no preview/job endpoint. |
| 2B2 Compiler/identity/generations/typed storage | VERIFIED | e5d66e6 candidate/public schema/lifecycle plus complete combined native acceptance PASS; 29 files/143 local tests, TypeScript/lint/build. Owner value API remains 2B4. |
| 2B3c2a Owner cohort-access preflight | VERIFIED | 931a600 candidate/public includes final/unanchored rows and generic private-access denial; sealed v1/v2 retained. |
| 2B3c2b Typed stored-value decoder | VERIFIED | Local all-15-type cases and 931a600 candidate/public real exact decimal/money checks. Pure library, no value API. |
| 2B3c2c Stable combined release acceptance | VERIFIED | Both full suites PASS, exact source activated, public health/current checked, prior b57ba720 retained. |
| 2B3c3 Immutable review contracts | VERIFIED | Local closed/stale/digest cases and 8780a07 SQL helper roundtrip; no preview endpoint. |
| 2B3c4 Durable review archive | VERIFIED | 8780a07 candidate/public actual tenant/source/draft/slot/value guards, sealed rows/history, CAS/stale/audit rollback; no worker. |
| 2B3c5 Owner shared snapshot/coverage | VERIFIED | 5d101da full candidate/public proof: exact native set/revisions, private/membership/isolation/final/unanchored; no native mutation. |
| 2B3c6a Explicit data and field/reference policies | VERIFIED | Pure contract: 4 files/18 local assertions, build/types/lint. No runtime collector/preview claim. |

# Current Workstream Detail

4e4a0e8 candidate preparation FAIL: support platform lock selected nonexistent id;
actual model key userId. Earlier owner/archive checks PASS, deploy exit 1 before
activation; accepted live 5d101da unchanged, exact Test access retired. No temporary
Audit trigger reached. SQL corrected; focused support refresh/revocation regression
added. Corrected tests/build/types/lint and a new backed-up candidate/public pin
required. c6b2a plan only, no observation code started.

5d101da complete combined candidate/public PASS and deploy exit 0; actual public
health match, previous 8780a07 retained. Evidence m4iKXU/ubk7cv, backup 005837,
fixtures 010035/010423. c5a/c5b VERIFIED; historical pending notes superseded.
c6b1 local 10 files/52 assertions, build/post-build TS/scoped lint PASS. Actual
service central helper NOT RUN; isolated Test/actor/operation Audit failure trigger
created temporarily and removed in finally. No persistent DDL or domain writes.

5d101da sealed candidate actual owner snapshot/coverage proof PASS, canonical
native rows unchanged; metadata/archive/principal/Admin/business PASS. Full native
suite and public pending. Evidence m4iKXU; fixture backup 20261010-010035.
Independent c6a pure policy contract: 4 files/18 assertions, build/types/lint PASS;
no DDL/automatic grants/collector. Test-with-live-data cap is separate from standard
roles/staff/presets; current/written/reference policy helper locally verified.

c5b read-only owner protocol/registry v3 opt-in implemented. Nine files/51 focused
assertions, build, TypeScript and scoped lint PASS; diff reviewed. New central
helper proof NOT RUN yet; do not mark VERIFIED. No DDL/value API/executor. Next
pin clean scoped source and run combined backed-up candidate/public acceptance.

8780a07 complete candidate/public PASS, deployment exit 0 and public source/current
confirmed; prior 1646316 retained. c4 archive constraints VERIFIED; historical
pending statements below are superseded. No conversion engine/preview API yet.

8780a07 actual candidate archive/metadata/principal/Admin and Dashboard/Settings
checks PASS. Full remaining suite in progress; public not confirmed. Migration
20261010030000_studio_field_reviews applied centrally (Prisma finished entry).
Candidate evidence yWPgWM; fixture backup atlas-pre-studio-candidate-20261010-003501.

Exact 8780a07 reviewed release preparing; backup atlas-pre-deploy-20261010-003320,
local log /tmp/atlas-studio-review-archive-deploy.txt. No confirmed archive runtime
PASS yet; keep original locks and pin. Previous live verified Settings 1646316.

2B3c4 purpose/dependencies/files/additive database/checks recorded in the evolution plan.
No persistence, preview service or executor is delivered by a pure review contract.

Latest: 931a600 complete candidate/public combined acceptance PASS and live.
Historical attempt details below are superseded by this proof; retained failures
explain the checker corrections. No new Studio schema in this release.

Native People helper review caught new dashboard already opens Widget library:
removed extra toggle and assert visible initial region. 015698f preparation already
started; do not alter sealed candidate. Current correction strict types/helper lint PASS. 015698f preceding checks PASS,
then expected hidden-library selector failure; no activation, Test access retired.

Preserved exact publicly verified native Dashboard source 70ca23e, including its
modern UI, protected data datasets and final Messages assignment. 28 files/164
focused tests, generation/descriptors/build/scoped lint and strict types PASS.
Added Dashboard workflow to Studio combined acceptance. Fixed merged dispatcher
omission before deploying; all five mode-dispatch probes and shell syntax PASS.
Prior af1338b retry stopped at ancestry before backup/build after 70ca23e advanced.
No cohort/decoder candidate/public claim. Native release evidence retained.

2B3c2b: pure stored-value decoder implements exact decimals/currency, safe integers,
UTC dates/instants, strict storage families, historical enum selections and redacted
failures. Three files/24 assertions, production build, strict post-build TypeScript
and scoped lint PASS. Initial four fixture errors corrected, rerun PASS. Real SQL
decimal/money assertions passed on 931a600 candidate/public.
No encoder, data API, permission change or migration. Preserve current live 2ef5b4c
before candidate proof. 6795f08 preparation has no confirmed success evidence.

2B2 candidate schema/lifecycle VERIFIED and exact tested e5d66e6 ACTIVATED.
Complete combined candidate PASS; logs /tmp/atlas-studio-acceptance-fDWxDN.
Public field/Studio/Admin/business/Home/Apps/Reports/MRP PASS, then Messages desktop
viewport assertion failed after reopen/restore (/tmp/atlas-studio-public-3EmQ8d).
Standalone unchanged-source public Messages reproduction PASS on all three viewports;
complete unchanged-source public rerun PASS (/tmp/atlas-studio-public-1XT85A),
including Messages/private Admin/connected supply. Earlier failure retained; no
persistent app defect confirmed. Five additive typed models/migration applied centrally; privileged schema
checks are distinct from the pending owner-authorised value API. No native writes.
Local integrated Prisma generation, 29 files/143 tests, scoped lint, build and strict
post-build TypeScript PASS. Backup/source/check details in CURRENT_STATE/Test Results.

Removed the visible internal-key input/display; server assigns stable UUID keys.
Michael's bespoke business design studio/Sales clarification is permanently saved;
visual preview/builder remains 2E, not claimed from the foundation UI.
Latest follow-up adds easy template customisation, live business dashboards/screens
and custom buttons to 2E acceptance. Existing Home/analytics/dashboard and Sales
Templates source inspected; 2E5 reuses their engines, preserves personal boards and
checks native button permissions. Requirements/plan saved; designer NOT STARTED.
2B3a–g checkpoints saved in STUDIO_FIELD_EVOLUTION_PLAN.md; compatibility/conversion
pure library VERIFIED locally. Retirement IMPLEMENTED locally (35 tests/types/lint/build PASS); reviewed jobs/
publication/batches/cutover and acceptance remain NOT STARTED; 2B2 combined candidate/public release now PASS. Historical/final-record owner
policy must be resolved in code without bypassing existing native restrictions.

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

c6b1: migrations/preparation, actual check-field-preparation/principal driver,
preparation tests, reuse existing validation in migrations/access, docs/memory.

c6a: Studio permissions/manifest, existing access-level presets/labels,
fields/migrations/access, field-data-access tests, PERMISSIONS and plan/memory.

c5a/c5b: registry types/contracts/entities/registry, core/service-work/studio,
transaction-query/entity/snapshot tests, exact-Test principal/review helpers,
MODULE_SPEC/SERVICE_WORK_DESK and plan/ledger/shared state/decisions. No DDL.

2B3c3/4: fields/principal-contract and migrations/contracts, Prisma schema/additive
review migration, generated gateway metadata, check-field-reviews/principal driver,
review/access tests and DATA_MODEL/plan/ledger/state/decisions.

Combined native integration: check-people-workspaces.ts selectors updated for
already-live Dashboard library/inspector; exact saved metric/90→95% assertions retained.

2B3c2c: scripts/deploy/check-studio-release.sh, vps-release.sh, DEPLOY, evolution
plan and shared ledger/memory/decision docs. Existing acceptance modes retained.

2B3c2b: fields/codec.ts, tests/studio-field-codec.test.ts, exact-Test SQL helper,
evolution plan, ledger/CURRENT_STATE/DECISIONS.

2B3c2a: core/service-work/studio.ts, tests/studio-ticket-cohort.test.ts, central
check-field-principal helper, MODULE_SPEC/SERVICE_WORK_DESK, plan/ledger and
CURRENT_STATE/DECISIONS. Read-only owner query; no schema migration.

2B3c1: fields/principal.ts, tests/studio-field-principal.test.ts, central
check-field-principal helper and metadata driver; evolution
plan/ledger/CURRENT_STATE/DECISIONS. Existing audit only; no DB/schema migration.

2B3b: fields/retirement.ts, tests/studio-field-retirement.test.ts, central
check-field-storage helper, plan/ledger/CURRENT_STATE/DECISIONS. No new migration.

2B3a: core/studio/fields/evolution.ts, tests/studio-field-evolution.test.ts, evolution
plan/ledger/CURRENT_STATE/DECISIONS. No DB/Prisma change. No values written.

2B2 committed/activated source: registry policy/types/factory, service-work/studio (retained v1 + v2),
compiler/fields, fields/schema, test compiler/sealed-hash regression, Prisma schema
and additive typed-field migration, binding/lifecycle/acceptance helper and tests.
These are in live e5d66e6; combined candidate/public verification PASS.

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

c5/c6 no persistent schema or migration. Preparation acceptance helper temporarily
creates an Audit failure trigger/function matching only one new Test organisation,
actor and operation UUID; finally removes both. Actual execution pending.

2B3c4 additive three preparation/review/observation models and tenant/source FKs,
immutable source references and CAS guards. Schema/generation and central BEGIN/
ROLLBACK DDL PASS; 20261010030000_studio_field_reviews NOT APPLIED yet. No native
business changes/backfill/reset. Actual archive constraint helper pending.

Applied 2B2: five typed field/storage models and additive migration
20261009220000_studio_typed_fields. Prisma schema validation PASS; SQL/constraints
central DDL syntax tested; migration applied on prepared fcfd512, full runtime
acceptance PASS on e5d66e6 candidate/public HTTPS; source live. Published metadata/history and all
existing domain records remain unchanged. Decimal physical capacity is 38,10 while
metadata enforces explicit precision<=28/scale<=10 without automatic rounding.

Four additive models: StudioDefinition, StudioDraft, StudioDefinitionVersion and
StudioDependency. Migration `20261009210000_studio_metadata_kernel` creates only
metadata tables/indexes/composite tenant foreign keys/constraints/guards. No existing
business records changed, no local business databases, no destructive reset.

# Migrations Applied

20261010030000_studio_field_reviews applied in backed-up 8780a07 preparation;
Prisma finished history confirmed. Real archive candidate constraints PASS. Full
combined candidate/public completion pending; no reset or native backfill.

`20261009220000_studio_typed_fields` applied during fcfd512 backed-up candidate
preparation; new tables only, no native business changes. Candidate/public SQL/history/lifecycle and combined checks PASS; production e5d66e6.

`20261009210000_studio_metadata_kernel` applied centrally by backed-up candidate
preparation on 9 October. Backup prefix:
`/home/administrator/backups/atlas-pre-deploy-20261009-184707`. Existing runtime
was retained during preparation; branding 58b3610 and verified Home 329b60a are
preserved. Final candidate/activation backup prefixes: `atlas-pre-deploy-20261009-193301`
and `atlas-pre-deploy-20261009-193700` in the same server backup directory.

# Tests Added

Eight owner snapshot cases plus atomic registry opt-in case; central helper exact-
set, private queue, actual membership, isolation and native preservation assertions.

Seven codec cases cover all 15 field types, exact decimals and invalid/redacted
storage; real decimal/money assertions passed in candidate/public Test helper.

2B3c2a owner cohort suite: complete/private/capability/source/tenant/empty coverage
cases. 2B3c1 principal suite: real membership/current permission/revocation/audit
stamps, metadata-context denial and audit-failure cases.

Registry/adapters/catalogue/compiler/service/admin-context suites; company login,
platform grants and business-user provisioning regression cases.

# Tests Run

Corrected platform support lock: 10 files/53 assertions, production build, strict
post-build TS/changed-source lint/diff review PASS. Evidence /tmp/atlas-studio-
preparation-corrected-{tests,build,types,lint}.txt. Actual new pin proof pending.

c6b1: 10 files/52 assertions, build/strict post-build TS/scoped lint PASS; evidence
/tmp/atlas-studio-preparation-{tests,build,postbuild-types,lint}.txt. Actual service
helper NOT RUN. c5b complete combined candidate/public PASS and deployed 5d101da.

c6a pure contract: 4 files/18 assertions, production build/TypeScript/scoped lint
PASS. Logs /tmp/atlas-studio-data-policy-{tests,build,types,lint}.txt. No runtime
collector/preview proof; candidate c5b owner checks PASS, full/public pending.

c5b: 9 files/51 assertions PASS; production build, TypeScript, scoped lint and
whitespace/diff review PASS. Evidence /tmp/atlas-studio-snapshot-{tests,build,types,
lint}.txt. New candidate/public helper NOT RUN; current accepted live 8780a07.

Integrated Settings-preserving source: 37 files/197 focused assertions, build,
strict post-build types, changed-source lint, generation, shell syntax/six dispatch
probes PASS. Real archive constraints and candidate/public check still pending.

2B3c4 local: 5 files/34 assertions, production build, strict post-build TypeScript,
scoped lint, schema/generation PASS. Central transaction-only DDL syntax PASS and
rolled back. New Test helper NOT RUN; no actual constraint/preview/worker claim.

Historical local check snapshots below precede final combined 931a600 proof.

Latest b57ba720-preserving source: generation, 29 files/171 focused assertions,
production build, strict post-build TypeScript and scoped lint PASS. Browser Admin
redirect helper correction retains 307; 931a600 runtime candidate/public PASS.

Latest integrated source preserving live 2ef5b4c: 23 files/135 tests, generation,
production build, strict post-build TypeScript, scoped lint PASS. Acceptance shell
syntax and three invalid argument rejection cases PASS; runtime pending.

Codec: three files/24 tests, production build, strict post-build TypeScript and
changed-file lint PASS. 931a600 cohort/codec candidate/public checks PASS.

Latest integrated People/cohort source: 21 files/128 tests, Prisma generation,
production build, strict post-build TypeScript and scoped lint PASS. Real cohort
helper still pending; full suite not rerun.

2B3c2a: 4 files/22 tests, build, strict post-build TypeScript and scoped lint PASS.
New central cohort helper not run; no live cohort-query claim.

2B3b: 5 files/35 assertions, scoped lint, production build and strict TypeScript
PASS. Central helper and combined candidate checks PASS on 8b99c1b; no public retirement claim.

2B3a: 3 files/22 assertions PASS; scoped lint, production build and strict TypeScript
PASS (narrowing error fixed and checks rerun). Pure library not yet invoked by UI/jobs.

Document structure/phase searches; repository status/diff/source inspection.
`npm ci --no-audit --no-fund` completed; isolated worktree dependencies installed.

# Test Results

8780a07 candidate/public complete combined PASS; deploy exit 0, health/current exact.
Evidence candidate yWPgWM/public 6U4Ohy; backups deploy-20261010-003320, candidate
20261010-003501 and public 20261010-003850. Archive constraints plus eleven native/
Studio checks PASS. Existing Test fixtures suspended/access revoked; history kept.

931a600 full combined candidate PASS; exact runtime activated, previous b57ba720
retained. All real Studio and native checks, including corrected People UI and
90→95% dashboard result, passed. Full public suite PASS; evidence
/tmp/atlas-studio-public-qqYkvj, candidate /tmp/atlas-studio-candidate-Ww5GqF,
local /tmp/atlas-studio-people-initial-deploy.txt. Backups: atlas-pre-deploy-
20261010-000049, atlas-pre-studio-candidate-20261010-000232 and atlas-pre-studio-
public-20261010-000600. Public health/current source confirmed; Test access revoked.

8133299 candidate Studio/owner cohort/private/final/unanchored/principals/decoder/
retirement/metadata and Dashboard/Home/Reports/MRP/Messages/private Admin/Supply/
Commercial PASS. Final People script hit obsolete Dashboard App selector; no switch.
Evidence /tmp/atlas-studio-candidate-5wV4P4. Updated to current real controls with
all persistence/exact metric/90→95%/privacy/tenant assertions retained. Public proof
pending. No schema/application/security change; strict types/helper lint PASS; full runtime rerun pending.

0af763d candidate build/storage/decoder/retirement/metadata/draft/Dashboard checks
PASS, then authenticated Admin-denial transport assertion failed 404!=307; no
activation. Evidence /tmp/atlas-studio-candidate-Fjw1UR. Separate HTTP API context
omitted Secure browser cookie; helper corrected to real browser navigation while
retaining exact 307/home and adding no-Admin-shell checks. Real cohort helper not
reached; no public cohort/decoder verification. Application cookies unchanged.

Exact 7941f9b complete candidate/public checks PASS, including real principals,
retirement and commercial/native regressions. Private evidence
/tmp/atlas-studio-acceptance-9ztRSn and /tmp/atlas-studio-public-23i93X. Activation
backup atlas-pre-deploy-20261009-225700; previous immutable 94dd3e retained.
No new Studio migration, value API, designer or whole Phase 2 gate claim.

Latest 6085d70 combined candidate PASS; /tmp/atlas-studio-acceptance-wM3A1X.
Exact native source subsequently advanced to 94dd3e, merged unchanged. New
combined 23 files/118 assertions, Prisma generation/types/lint/build PASS; real
principal helper pending. No public retirement/principal claim. Earlier exact
checkpoint results below are historical evidence, not current next actions.

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

Preparation support lock failure fixed in working source but not yet re-verified
centrally; current phase/workstream remains IN PROGRESS, live 5d101da unchanged.

The separately verified Dashboard release also cleared reproducible dependencies
from ten inactive October 8 releases; its evidence documents those retained sources
requiring dependency restoration to run. This was distinct from Studio disposable
cache cleanup. Current/previous runtimes remain available.

First af1338b deployment stopped at remote fetch with root disk full. RESOLVED:
cleared only disposable caches in 86 older releases under original locks, keeping
current/rollback caches and all source/assets/backups/evidence. 51G free/74% used;
public health unchanged. Subsequent 931a600 combined candidate/public acceptance PASS.

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

Pin c6a/c6b1 and run combined backed-up candidate/public acceptance. Require real
service idempotency/fresh identity/source/draft/owner checks and Audit-failure
rollback before preparation VERIFIED. Then c6b2: collect bounded immutable source
observations under refreshed principal, owner snapshots and current/written field/
reference guards; seal only exact current coverage, with source pointer/revision
freshness and ordered digest. Phase 2 NOT PASSED; visual builder/customer
publication/custom buttons still outstanding.
