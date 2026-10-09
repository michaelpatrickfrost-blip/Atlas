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
| 2A | Owner-approved entity/extension contracts; inspect existing fields/page/settings before adding systems. Depends on Phase 1 registry. | core/studio/registry, owner manifests/services, contract inventory, MODULE_SPEC | None for contracts | Unique IDs, schema/hash compatibility, tenant and native access, protected native fields | IN PROGRESS |
| 2B | Versioned custom-field definitions, typed values, lifecycle/validation and indexed/unique strategies. Depends on 2A and metadata kernel. | core/studio/fields, compiler dispatch, schema/migration | Additive tenant-owned field/value models, stable identity/history, relational/index constraints; no canonical entity copy | Types/required/uniqueness, two tenants, access, retirement/history, atomic writes | NOT STARTED |
| 2C | Record types and shallow deterministic configuration resolution. Depends on 2A–B. | core/studio/definitions, compiler, record-type policies | Versioned metadata; canonical record associations only where approved | Base + one overlay, deterministic precedence/conflict rejection, incompatible references | NOT STARTED |
| 2D | Structured page schemas/compiler, variants, dependency impact and validation. Depends on 2A–C. | core/studio/pages, compiler, compatibility | Published metadata/dependency graph | Safe components/references, mobile representation, permission visibility, no arbitrary scripts/SQL | NOT STARTED |
| 2E | Modern customer builders and generated list/detail/form runtime at approved record surfaces; staff setup stays Admin. Depends on 2B–D. | modules/studio, customer Studio routes, owning record surfaces, design primitives | No independent business datastore | Real create/edit/read, field permissions, hidden components not queried, native domain rules retained, desktop/tablet/phone | NOT STARTED |
| 2F | Gate/release and representative native/customer integration. Depends on 2A–E. | tests, scripts/studio, documentation/ledger | Backed-up additive central migration; retained history | Contract/property/security/runtime regression, production build, candidate then public live acceptance | NOT STARTED |

Each workstream must be reviewed, tested and checkpointed before the next begins.
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
