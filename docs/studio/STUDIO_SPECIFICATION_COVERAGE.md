# Atlas Studio specification coverage

11 October 2026. Execution index for the unchanged supplied
`ATLAS_STUDIO_SOURCE.docx`, not a replacement specification. Original and repository
copy SHA256: `4afb01d98ead51cd70ec4958620eb9d27a19a0298cd0fa1cb8bd0aee69d9198d`.
The full document was re-read after Michael requested an explicit scope check.
The permanent ledger contains checkpoint evidence and the exact next action.

## Phase sequence and completion rule

Section 27 defines phases 0–9. Follow that sequence, as Michael clarified after
the initial five-phase wording. Current Phase 2 remains IN PROGRESS. Preserve the
foundation-first workstream order; do not mistake a detailed internal subdivision
for a new source requirement or a completed phase. A status below is limited to
the stated scope. Later phases are NOT STARTED, even where Atlas already has a
related provider or service to adapt.

| Source phase | Required outcome | Current evidence / gap |
| --- | --- | --- |
| 0 Contract hardening | Provider/event inventory, registry identifiers/schema/compatibility, adapters preserving Atlas | VERIFIED earlier; retained registry/adapters/contracts and release compatibility gate |
| 1 Metadata kernel | Definitions/drafts/immutable versions/dependencies, validation/publication/audit/capabilities | VERIFIED earlier; retained CAS, compile-on-publish, separate activation and history-preserving rollback |
| 2 Fields, record types and pages | Extension policy, custom fields, record types, structured builder, conditional variants, generated list/detail/form runtime, dependency impact | IN PROGRESS; detailed matrix below; no phase PASS |
| 3 Decisions and approvals | Deterministic tables, explanations, shared policies and suitable route migration | NOT STARTED; native required-if evaluator is not Decision Studio |
| 4 Durable events | Transactional outbox/dispatcher/consumer idempotency/schema registry/replay | NOT STARTED as Studio phase; inspect/adapt existing event infrastructure when reached |
| 5 Flow runtime | Leases/nodes/retries/timers/waits/joins/subflows/uncertainty/Operations | NOT STARTED; no second workflow engine |
| 6 Automations migration | Existing authoring over Flow, definition/history migration | NOT STARTED; preserve existing Automations until proven migration |
| 7 Process Studio | Opted-in canonical lifecycle/state/transition engine | NOT STARTED; no generic replacement for native business statuses |
| 8 Packages/environments | Export/install/dry run/compatibility/bindings/overlays/conflicts | NOT STARTED; no premature package-engine implementation |
| 9 Broad adoption | Progressive safe module settings/extension integration | NOT STARTED; module examples in Section 20 are not permission to bypass owners |

## Phase 2 requirement-to-implementation matrix

| Source | Requirement | Implemented evidence | Remaining before Phase 2 gate |
| --- | --- | --- | --- |
| 6.4;27 | Explicit owner opt-in; aliases vs extension storage vs record types vs native domain fields | Registry entity policy, reserved keys, typed compiler; Tickets canonical ServiceWorkItem owner; protected native columns read-only to fields | Customer editor must visibly separate these choices; record types/pages still required |
| 6.4;6.1 | Immutable keys/identity, mutable labels, retained history | Permanent field binding, immutable versions/generations/value history; same-generation cosmetics verified live | Visual authoring must generate keys and preserve identity rather than asking noncoders for technical IDs |
| 6.5 | Approved typed constraints including decimal/money/currency/enum versions/reference policy | Closed field/storage/value schemas, server validators, typed SQL families/constraints and atomic ordinary saves verified | Usable owner form inputs/approved defaults and presentation aliases, configured field search/filter/sort runtime, complete native writer integration |
| 6.5;14 | Required-if on every write; hiding never waives validation; sensitivity/capabilities narrow access | Typed condition compiler/evaluator, authorised input reader, current-owner coverage and actual row observation; no arbitrary code/SQL | Native create/save hooks now IMPLEMENTED locally with shared lock/final validation; actual central atomic/concurrency/release proof, typed form inputs and conditional activation remain gated |
| 24;24.1 | Review counts/examples/failures/index/rollback limits; resumable/idempotent conversion; compatible rolling reads; explicit cutover | Existing legacy review/publication/batches/cutover/rollback/finalization and current/history services verified live | Usable migration preview/control UI; conditional cutover/settlement verified actual candidate/public1f4 (independent current settler, original creator revoked, Audit atomicity, drift/history/replay); whole affected native window integration now IMPLEMENTED locally; actual central native/window proof and usable UI remain; format2 conversion/recovery/cancel also verified |
| 7;7.1–2 | Canonical record types, base + one overlay, deterministic resolution, explicit conflict policy, compiled result | Owner recordTypes opt-in exists as contract only | Record-type compiler/persistence/association and authorised resolution; no shadow customer/ticket tables or implicit security grants |
| 8;8.1 | Structured approved components and registered record surfaces, bounded queries/metrics/actions | Registry/query/access and existing design-system/domain services are foundations | Page schema/compiler/runtime, approved component catalogue, list/detail/forms; reject arbitrary script/table access |
| 8;8.2 | Default/conditional variants, shallow inspectable inheritance, capability/record-type/approved fact selection | Foundations only | Deterministic variants; ambiguity/depth rejection; hidden components do not query; underlying server permissions always enforced. Do not build Phase 3 Decision engine early |
| 8.3 | Buttons reference approved commands, typed modal/preview/result/navigation | Existing registry command contracts are foundation only | Safe page button bindings/runtime, no execution in preview, owning invariant/idempotency/access checks; later Process/Flow buttons unavailable until their phases |
| 17;17.1 | Compile/cache by tenant/version; bounded costs/cardinality/pagination; avoid N+1 | Registry cost/cardinality and dependency checks exist | Page budget validation/resolution and version-scoped runtime caching; useful configured search/index paths |
| 18;18.2 | Catalogue/editor/properties; persistent draft/live context; guided presets; test/preview; keyboard/accessibility; where-used/impact | Kernel history/reference comparison is foundation tooling | Real visual modular editor, shared preview/published rendering, permitted record or labelled synthetic sample; responsive desktop/tablet/phone; clear errors/impact/version comparison |
| 19;22 | Service-only mutations, server validation/compilation, CAS/dependencies/risk/classification/cycles | Metadata and field services enforce scope/CAS/Audit, compile-on-publish; registry deployment gate verified | Artefact-specific record-type/page compiler and dependency impact; compatibility checks for new payloads and UI flows |
| 25–28 | Tenant/security/concurrency/failure/compatibility evidence, additive safe release, live verification | Each delivered field checkpoint has scoped tests/build and combined candidate/public acceptance; source ledger retains exact evidence | Whole Phase 2 gate requires representative noncoder create/design/preview/publish/live/rollback journey, two tenants, denied actor, native module regressions, all remaining rows above |

## Cross-cutting source rules retained throughout

- Sections 1–4,19,20,30: Core + Modules, canonical Party/domain ownership, registry
  contracts, no generic table API, arbitrary code or shadow ERP. No duplicate
  Templates, Automations, permissions, search, audit or relationships engines.
- Sections 5–6,14,19,22–23: stable logical IDs, immutable published plans, typed
  inputs, CAS, server session/tenant/module/native/field access, sensitivity and
  safe concurrency. Studio never grants an absent business permission.
- Sections 9–13,15–16,21,23.1,26.2: process/decision/approval/flow, durable event and
  integration uncertainty, Operations/Guardian, package promotion and long-running
  recovery belong to their ordered phases. They remain requirements, not forgotten
  omissions or already delivered features.
- Sections 20.1–36: integration expectations remain owner-specific. Broad module
  adoption is Phase 9; earlier vertical slices expose only implemented contracts.
  Preserve canonical domains and existing business functionality throughout.
- Sections 25,27.1,29: complete cross-module vertical slice and whole-system “Studio
  is real” checklist remain the final system target. Worker/approval/flow/package
  checks cannot be claimed from Phase 2 tests, nor implemented prematurely.

## Michael's additional product requirements

Separate staff Admin setup/login and each business's login URL remain delivered
companions and continuously checked. Atlas administrators may create business
users; customer users cannot provision Atlas staff. The intended Studio is visual,
modular and easy for a noncoder: choose a business/software area, start from a useful
preset, edit/preview, publish and see that business's live screens/dashboard with
safe custom buttons. Reuse the existing Templates and Analytics engines; preserve
personal dashboards and other tenants. These requirements are recorded in
STUDIO_VISUAL_BUILDER_REQUIREMENTS.md and are still unfinished Phase 2 work.

## Exact next checkpoint

Conditional cutover/settlement passed original candidate/public gates on live1f4dc79;
native write integration and ordinary required activation correction are locally
verified at84f64da8. The original release failed safely before activation at an old
metadata-only required-field storage fixture; live1f4/rollbackb34 unchanged. Repair
that fixture without weakening production policy, integrate the two reviewed-but-
unpublished publication races, then retry original central candidate/public gates.
Actual native enforcement, whole-window rollback and concurrency remain unverified
until those gates execute successfully. Next implement the typed native form packet
and shared controls, then remaining2B aliases/defaults/search,2C record types,2D pages,
2E visual authoring/runtime and2F complete Phase2 gate. No Phase3 work.
Use this matrix and original relevant sections at each checkpoint. No silent omission,
VERIFIED from a file or moving a requirement to a later phase to obtain PASS.

### 11 October — source6.5 native write integration checkpoint

Actual seven Work actions/Service case merge, engine parent/CAS/INSERT receipts and
explicit native reader are integrated locally.157tests/11 suites and final strict
reference boundary17 passed; build/lint passed, final standalone strict types passed after correcting incomplete test Session
fixture. Unit collaborators do not establish PostgreSQL rollback/SSI. Exact
central checker source and real gates remain before release or conditional typed
input/customer activation. Whole Phase2 and noncoder visual journey remain incomplete.
