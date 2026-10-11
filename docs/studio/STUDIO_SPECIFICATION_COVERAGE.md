# Atlas Studio specification coverage

12 October 2026. Execution index for the unchanged supplied
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
| 6.4;6.1 | Immutable keys/identity, mutable labels, retained history | Permanent field binding, immutable versions/generations/value history; same-generation cosmetics verified live | Friendly all15 typed creation now generates stable keys/choice IDs server-side; actual customer setup/create/publication evidence remains |
| 6.5 | Approved typed constraints including decimal/money/currency/enum versions/reference policy | Closed field/storage/value schemas, server validators, typed SQL families/constraints and atomic ordinary saves verified | Usable owner form inputs/approved defaults and presentation aliases, configured field search/filter/sort runtime, complete native writer integration |
| 6.5;14 | Required-if on every write; hiding never waives validation; sensitivity/capabilities narrow access | Typed condition compiler/evaluator, authorised input reader, current-owner coverage and actual row observation; no arbitrary code/SQL | Native hooks/final validation/required activation VERIFIED live ad9 with actual candidate/public atomicity/windows/concurrency proof; usable typed native form inputs remain incomplete |
| 24;24.1 | Review counts/examples/failures/index/rollback limits; resumable/idempotent conversion; compatible rolling reads; explicit cutover | Existing legacy review/publication/batches/cutover/rollback/finalization and current/history services verified live | Usable migration preview/control UI; conditional cutover/settlement verified actual candidate/public1f4 (independent current settler, original creator revoked, Audit atomicity, drift/history/replay); whole affected native window integration VERIFIED live ad9 candidate/public; usable UI remains; format2 conversion/recovery/cancel also verified |
| 7;7.1–2 | Canonical record types, base + one overlay, deterministic resolution, explicit conflict policy, compiled result | Compiler/base binding/one overlay/exact version pins/assignment070/required union/cohort services IMPLEMENTED; focused source checks PASS | Friendly setup and existing-record selector IMPLEMENTED source; initial creation and actual cohort/SQL/native/browser evidence remain;070 APPLIED central history; no shadow records or grants |
| 8;8.1 | Structured approved components and registered record surfaces, bounded queries/metrics/actions | Strict Page schema/compiler, owner sources/approvals/shared runtime, Sales/Tickets list/detail and Tickets native form surface IMPLEMENTED; local checks/build PASS | Actual customer Page/form/browser/SQL evidence and remaining owner-approved families; unsupported later engines absent |
| 8;8.2 | Default/conditional variants, shallow inspectable inheritance, capability/record-type/approved fact selection | Deterministic shallow variants/compiler/runtime and approved fact visual conditions IMPLEMENTED;113 integrated assertions PASS | Actual conditional customer/private/hidden-query behavior; do not build Phase3 Decisions early |
| 8.3 | Buttons reference approved commands, typed modal/preview/result/navigation | Current visible Page/head/device/owner command gateway and Sales native PDF action IMPLEMENTED; shared preview inert | Original actual visual/PDF permission/tenant gate; later Process/Flow commands unavailable |
| 17;17.1 | Compile/cache by tenant/version; bounded costs/cardinality/pagination; avoid N+1 | Registry cost/cardinality and dependency checks exist | Page bounded query-budget enforcement and tenant/version/seal compiled metadata cache IMPLEMENTED source; actual performance/search/index evidence remains |
| 18;18.2 | Catalogue/editor/properties; persistent draft/live context; guided presets; test/preview; keyboard/accessibility; where-used/impact | Standalone visual library/editor/presets/properties/conditional layouts/shared previews/save/review/GoLive/restore and customer home/screens IMPLEMENTED; build41429/local interaction checks PASS | Friendly field/type setup and selected-business original Templates editor IMPLEMENTED source; Analytics adaptation and actual end-to-end tenant/permission/rollback proof remain |
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

Native hooks/windows/enforcement/concurrency and genuine ordinary required activation
VERIFIED livead9d5a4, original candidate627MN9/publicjY9iVL BOTH ALL COMBINED PASS;
rollback1f4dc79. Failed84 history retained; corrected fixture did not weaken policy.
Now integrate bounded typed packet/shared writer, current genuine narrow manifest,
atomic whole-form receipt and shared native controls. Actual typed form/customer
journey still needs its own central proof. Then remaining2B aliases/defaults/search,
2C record types,2D pages,2E visual authoring/runtime and2F complete Phase2 gate.
Use this matrix and unchanged source sections each checkpoint. No Phase3 work or
VERIFIED from file existence; complete noncoder visual journey remains mandatory.

### 11 October — source6.5 native write integration checkpoint

Actual seven Work actions/Service case merge, engine parent/CAS/INSERT receipts and
explicit native reader are integrated locally.157tests/11 suites and final strict
reference boundary17 passed; build/lint passed, final standalone strict types passed after correcting incomplete test Session
fixture. Unit collaborators do not establish PostgreSQL rollback/SSI. Exact
central checker source and real gates remain before release or conditional typed
input/customer activation. Whole Phase2 and noncoder visual journey remain incomplete.

### 12 October — exact customer layouts and editable unpublished field settings

Source6–8 record type/default layout is now integrated with the native Ticket:
current canonical profile chooses its exact retained published Page, current
native/private rights run before metadata, and buttons/forms assert current
head/version/profile/native revision through the original shared selectors.
Default-reader source148/6 PASS; default/settings/gate-prefix integrated183/5 PASS.
Published/unsupported field settings remain protected; safely representable initial
drafts reopen all15 settings with stable server choice IDs and0/false defaults.
Actual native/browser default layout proof remains pending.

Original Analytics prerequisite is integrated;25/4 source checks PASS. It preserves
personal-owner boards and original chart/data loaders. Customer-wide immutable
publishing is still a separate planned adaptation, not delivered by this service.
Original visual central checker now includes friendly field save/review/live and
shared Templates draft/publish/actual Sales facts plus foreign-tenant denials. Those
new checks have not run; Page readiness DEFERRED is not feature acceptance.

Current production build19413 EXIT0. Final sequential strict35359/scopedlint16498 EXIT0 at this
entry. Original c4f6fe59 candidate failed preactivation at exact human denial wording;
checker corrected without relaxing native permission. Live c385/rollback5b remain
confirmed; central060/070 applied. Whole Phase2 FAIL/incomplete; no Phase3.

### 12 October — initial type, published target and Analytics source integration

Source7 initial Ticket type selector uses actual native INSERT/assignment/receipt2
and additive080 original guard.080 compiled centrally under both locks then rolled
back, no retained change; actual create/type/default proof pending. Customer
record chooser now uses exact approved bounded cursors and refreshed publication
assertions instead of stopping at50 records. Original visual fixture checker for
retained default Page/type/native forms is wired, not yet run. Source24 published
field target draft preserves current exact source/security/history and uses explicit
current Tickets9 snapshot/representation compatibility; original preview/control
UI remains. Source8.1/20.30 additive Sales/Products Analytics finite sources reuse
original providers,27 localcases PASS; shared view compiler/publisher/renderer
integration remains. Production83068/strict78429/scopedlint92155 PASS. WholePhase2
FAIL/incomplete; no later engines or family-tag completion claim.
