# Studio Phase 2 workstreams and Admin separation checkpoint

9 October 2026. Source: unchanged ATLAS_STUDIO_SOURCE.docx, Section 27 Phase 2,
Sections 6.4–8, 14, 17–19, 22, 25–28. Phase 1 gate passed and is retained.
Michael now requests continued ordered implementation, an administration-only
Atlas console without the business app/tool shell, and the modern Atlas UI.

## Immediate companion workstream — Admin shell separation

Purpose: /atlas routes must not inherit business Apps, global search, chat,
notifications or My work. Move routes to a separate Next route group with its own
server-guarded layout and responsive administration navigation. Preserve public
URLs, all action guards, explicit audited support-workspace entry, desktop action
identifiers and existing business layouts. Use current ribbon/wordmark, blue/white
surfaces, visible active states and accessible labels.

Expected files: app/(admin)/atlas (moved from app/(app)/atlas), components/admin/*,
Core logout routing, action registry/generator compatibility, related imports/tests,
Admin/design/architecture docs. Database: none. Tests: staff/non-staff guard,
standalone layout, legacy/new desktop actions, existing Admin/security suites;
production build; candidate and live real navigation including responsive overflow
and absence of business-shell controls. Status: VERIFIED (merged 146 focused assertions, TypeScript/build; candidate/public
Studio/Admin, Home and Reports acceptance; visible browser UI checked).

## Phase 2 workstreams (ordered; no later engines)

| ID | Purpose and dependencies | Expected files | Database implications | Verification | Status |
| --- | --- | --- | --- | --- | --- |
| 2A | Owner-approved entity/extension contracts; inspect existing fields/page/settings before adding systems. Depends on Phase 1 registry. | core/studio/registry, owner manifests/services, contract inventory, MODULE_SPEC | None for contracts | Unique IDs, schema/hash compatibility, tenant and native access, protected native fields | VERIFIED; candidate/public owner checks PASS |
| 2B | Versioned custom-field definitions, typed values, lifecycle/validation and indexed/unique strategies. Depends on 2A and metadata kernel. | core/studio/fields, compiler dispatch, schema/migration | Additive tenant-owned field/value models, stable identity/history, relational/index constraints; no canonical entity copy | Types/required/uniqueness, two tenants, access, retirement/history, atomic writes | IN PROGRESS; 2B1/2B2 and review/batches/receipt storage verified live; authorised cutover/rollback/finalization and ordinary current/history reads verified live53c05ae; atomic ordinary saves verified62201ae; required native hooks remain |
| 2C | Record types and shallow deterministic configuration resolution. Depends on 2A–B. | core/studio/definitions, compiler, record-type policies | Versioned metadata; canonical record associations only where approved | Base + one overlay, deterministic precedence/conflict rejection, incompatible references | NOT STARTED |
| 2D | Structured page schemas/compiler, variants, dependency impact and validation. Depends on 2A–C. | core/studio/pages, compiler, compatibility | Published metadata/dependency graph | Safe components/references, mobile representation, permission visibility, no arbitrary scripts/SQL | NOT STARTED |
| 2E | Modern customer builders and generated list/detail/form runtime at approved record surfaces; staff setup stays Admin. Depends on 2B–D. | modules/studio, customer Studio routes, owning record surfaces, design primitives | No independent business datastore | Real create/edit/read, field permissions, hidden components not queried, native domain rules retained, desktop/tablet/phone | NOT STARTED |
| 2F | Gate/release and representative native/customer integration. Depends on 2A–E. | tests, scripts/studio, documentation/ledger | Backed-up additive central migration; retained history | Contract/property/security/runtime regression, production build, candidate then public live acceptance | NOT STARTED |

Each workstream must be reviewed, tested and checkpointed before the next begins.

2B subworkstreams are detailed in STUDIO_PHASE_2_FIELDS.md. 2B1 typed validation
library and 2B2 persistence are VERIFIED; review/publication/batches/receipt storage
are VERIFIED live. Authorised cutover service and settlement storage are VERIFIED on full combined
candidate/public proof; rollback/finalization and ordinary current/history reads VERIFIED live53c05ae; atomic saves VERIFIED live62201ae; required native hooks remain.
Michael's visual/easy-setup requirements for 2E are in
STUDIO_VISUAL_BUILDER_REQUIREMENTS.md and form part of its acceptance gate.
Do not mark VERIFIED from code or schema existence. Reconcile the implementation
against source requirements before Phase 2 PASS. Narrow owner opt-in is acceptable;
unsupported protected domains must fail closed rather than appear configurable.

## Later ordered plan — architectural context only

3 Decisions and shared Approvals; 4 durable events/outbox; 5 durable Flow runtime;
6 adapt existing Automations onto that runtime; 7 opted-in Process Studio;
8 packages/environments; 9 broad module adoption. All NOT STARTED. Each receives
its detailed workstreams and hard gate when preceding phase has passed. Keep
existing Templates and Automations authoritative until their specified migration.

## 2A exploration evidence and first owner

Tickets' current canonical record is ServiceWorkItem with kind TICKET, governed by
Core service-work access/queues/versions/final-state rules. Historical ServiceTicket
and QUERY records remain separate and are excluded from this first target. Existing
service catalogue fields store frozen intake definitions and answers; these are
not silently converted/replaced. Approved native projections are bounded and
private-record scoped. Extension writes require source permission and owner policy,
not Studio edit permission. Future field storage is separate from protected native
columns, with transactions/expected native revision supported by the owner contract.
No fields/record-type/page persistence or later engines are part of 2A.

## Visual designer integration within 2E — Michael's clarification

The intended product is a bespoke business design studio, not a catalogue of
technical references. 2E is split before implementation into these dependencies:

| ID | Purpose | Expected source | Verification | Status |
| --- | --- | --- | --- | --- |
| 2E0 | Owner-approved Sales order screen contracts, building on native Sales queries/actions and preserving commercial/financial invariants | modules/sales/services/studio, manifest, contract tests | Tenant/native access, protected fields/statuses, no new Sales datastore | NOT STARTED |
| 2E1 | Plain-language business/screen/preset selection and structured layout editor | modules/studio + pages/components | Real selection/editing, preserved drafts, generated internal identifiers | NOT STARTED |
| 2E2 | Responsive screen preview using published rendering rules and approved/sample content | same structured page renderer and preview surface | Desktop/tablet/phone, hidden queries/fields, no preview commands | NOT STARTED |
| 2E3 | Business-document authoring/preview entry using existing Templates engine and owner-approved Sales sources | existing Core templates/services + Studio authoring adapter | Bespoke document preview/render/publish compatibility; no duplicate template engine | NOT STARTED |
| 2E4 | Native record forms/list/detail integration and business-specific publication | owner surfaces + Studio runtime | Actual Sales/Tickets representative behaviour, native permissions/rules, distinct tenant layouts | NOT STARTED |
| 2E5 | Published business dashboard layouts and configurable buttons; reuse existing Dashboards/analytics and owner actions | existing analytics renderer/providers, Studio resolution adapter, owner command surfaces | Activated tenant layout appears live, personal boards retained, rollback, permitted/denied button invocation and native outcomes | NOT STARTED |

Do not display unsupported choices as working. These are explicit Phase 2 owner/UI
integration workstreams once 2B–2D pass, not permission to implement later Flow,
Process, Packages or broad module migration early.

10 October f4b2 continuation checkpoints: a fixes active-vs-latest ordinary field
binding with real cancelled-source label/help publish/activate proof (VERIFIED
666efeb full candidate/public PASS, no DDL); b adds forward0008 generation/open-freeze/settled
cosmetic activation guards and exact Test storage proof (IMPLEMENTED locally; runtime gate pending). See field
evolution plan and execution ledger. Phase2 remains IN PROGRESS.

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
and2B4 normal owner forms. Visual2E remains required after2B–D. See ledger.

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

## 10 October — latest execution order

Michael restored foundation-first dependency order. Finish d3d central proof, then
d3e reviewed evolution, d4 shared native/field lock order and atomic writer/window
integration, d5 gate, remaining 2B/2C/2D, then visual 2E. Unfinished document designer
source is preserved in Git stash `28243b7fbe1bccd0458d770177aee24ce9607aec`
(IN PROGRESS, unverified, not live). Do not restore its superseded planning entries.
Keep focused checks proportionate and consolidate builds/releases per coherent
block; security/integrity and phase gates remain mandatory.
