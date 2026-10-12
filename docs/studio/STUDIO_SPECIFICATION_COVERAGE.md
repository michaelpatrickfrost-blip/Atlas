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
| 6.4;27 | Explicit owner opt-in; aliases vs extension storage vs record types vs native domain fields | Registry entity policy, reserved keys, typed compiler; Tickets canonical ServiceWorkItem owner; protected native columns read-only to fields | Friendly setup distinguishes additional details/base/type; exact customer/native visual evidence pending |
| 6.4;6.1 | Immutable keys/identity, mutable labels, retained history | Permanent field binding, immutable versions/generations/value history; same-generation cosmetics verified live | Friendly all15 typed creation now generates stable keys/choice IDs server-side; actual customer setup/create/publication evidence remains |
| 6.5 | Approved typed constraints including decimal/money/currency/enum versions/reference policy | Closed field/storage/value schemas, server validators, typed SQL families/constraints and atomic ordinary saves verified; native whole-form controls/receipts/defaults and configured indexed search IMPLEMENTED | Latest533 candidate form/default/search journeys PASS before unrelated profile failure; public/latest connected field setup, customer search controls and native reference usage verification remain |
| 6.5;14 | Required-if on every write; hiding never waives validation; sensitivity/capabilities narrow access | Typed condition compiler/evaluator, authorised input reader, current-owner coverage and actual row observation; native hooks/final validation/required activation VERIFIED live ad9 with atomicity/windows/concurrency proof; native typed forms IMPLEMENTED | Paired non-Test conditional readiness/checker IMPLEMENTED; positive production activation requires compatible actual candidate/public evidence, preserving liveTest/current native/field/reference guards |
| 24;24.1 | Review counts/examples/failures/index/rollback limits; resumable/idempotent conversion; compatible rolling reads; explicit cutover | Existing legacy review/publication/batches/cutover/rollback/finalization and current/history services verified live | Friendly settings, review/conversion/live/history controls IMPLEMENTED source; closed2 adapter integration185/5 PASS, non-Test conditional readiness and compatible visual gates pending. Conditional cutover/settlement verified actual candidate/public1f4 (independent current settler, original creator revoked, Audit atomicity, drift/history/replay); whole affected native window integration VERIFIED live ad9 candidate/public; usable UI remains; format2 conversion/recovery/cancel also verified |
| 7;7.1–2 | Canonical record types, base + one overlay, deterministic resolution, explicit conflict policy, compiled result | Compiler/base binding/one overlay/exact version pins/assignment070/required union/cohort services, friendly setup, existing-record selector and initial receipt2 IMPLEMENTED;070/080 APPLIED | Original533 association exposed070 JSON precedence; additive12020000 function-only repair rehearsed PASS_ROLLBACK and forward APPLIED5f1a. Original profile/default/type journey still required;5f1a stopped earlier on search deadline |
| 8;8.1 | Structured approved components and registered record surfaces, bounded queries/metrics/actions | Strict Page schema/compiler, owner sources/approvals/shared runtime, Sales/Tickets list/detail and Tickets native form surface IMPLEMENTED; native panels/KPI/exact Analytics embedding owner@3 IMPLEMENTED; View-edge20261012010000 CHECK APPLIED in original147 candidate | Compatible actual Page/form/default/embedded candidate/public journey; unsupported later engines absent |
| 8;8.2 | Default/conditional variants, shallow inspectable inheritance, capability/record-type/approved fact selection | Deterministic shallow variants/compiler/runtime and approved fact visual conditions IMPLEMENTED;113 integrated assertions PASS | Actual conditional customer/private/hidden-query behavior; do not build Phase3 Decisions early |
| 8.3 | Buttons reference approved commands, typed modal/preview/result/navigation | Current visible Page/head/device/owner command gateway and Sales native PDF action IMPLEMENTED; shared preview inert | Original actual visual/PDF permission/tenant gate; later Process/Flow commands unavailable |
| 17;17.1 | Compile/cache by tenant/version; bounded costs/cardinality/pagination; avoid N+1 | Registry costs/cardinality, bounded related reads and combined visible embedded query reservations; Page tenant/version/seal+fresh approval metadata cache IMPLEMENTED; original533 authorised search/index checker PASS | Latest connected Page/nested View actual runtime acceptance; tiny-fixture/index evidence is not a production-scale performance claim |
| 18;18.2 | Catalogue/editor/properties; persistent draft/live context; guided presets; test/preview; keyboard/accessibility; where-used/impact | Standalone visual library/editor/presets/properties/conditional layouts/shared previews/save/review/GoLive/restore and customer home/screens IMPLEMENTED; build41429/local interaction checks PASS | Friendly field/type/rule controls, selected-business original Templates editor, native Analytics company dashboard designer and embedded dashboard palette/display IMPLEMENTED source; compatible actual tenant/permission/publish/restore journeys pending |
| 19;22 | Service-only mutations, server validation/compilation, CAS/dependencies/risk/classification/cycles | Original metadata/field publisher, record-type/Page/View compilers, bounded immutable dependency graph and active reverse-usage/assignment guards IMPLEMENTED; existing registry deployment gate verified | Actual connected publication/activation/retirement/current-permission evidence for latest artefacts and reference navigation; no new publisher or generic table API |
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

Original75977 full candidate/public combined release PASS and health/pointer verified.
WholePhase2 remains incomplete: original old paired reader deferred new visual families.
Root connected original company View publication/readers, opt-in immutable embedding,
retained Page/profile/default pin fixes, plain required-rule target/control workflow.
Integrated source checks are recorded in the permanent ledger. Actual View-edge
CHECK20261012010000 APPLIED in original147 candidate. Original533 candidate stopped
before activation on070 assignment JSON extraction/subtraction precedence; exact
additive12020000 repair rehearsal PASS_ROLLBACK and forward application5f1a are confirmed.
Live75977/rollbackc385 remain. Latest533 candidate form/default/search checks passed;
new production conditional pair was DEFERRED before fixture writes, never PASS.
Original5f1a stopped before activation on the configured-search default5s transaction
deadline. No profile/visual pass inferred. Customer typed search, initial scalar
search/uniqueness settings and exact five-kind reference controls are implemented
source; the permanent ledger records focused checks. Native approved source/usage
links and the bounded registered owning-search deadline correction are IMPLEMENTED
source;104/8 root checks pass. The original compatible runtime/browser gate remains.
Logical business-type condition impact is a separate bounded metadata-only closure
workstream, preserving stable selectors and old seals.
Next checkpoint: reviewed integrated source/build, original immutable bridge,
then exact compatible candidate/public visual/profile/type/dashboard/conditional
runtime gates. Complete
fresh synthetic non-Test conditional readiness without changing existing tenants or
relaxing native/liveTest authority. No Phase3; reuse unchanged source and ledger.

### 12 October — bounded source6.4–8/17–18/27 coverage audit

Actual source inspection confirms presentation aliases stay separate from storage,
all15 approved field types use server validation, profile requirements add to
global rules, and Page edits reuse canonical owner forms. Shallow variants use
approved facts/capabilities/current canonical record types; native panel reuse is
not a Process/Approval/Flow engine. Page compiled-cache stores metadata only, and
query budgets/pagination/visible nested View preflight remain owner-controlled.
No additional later-phase engine is needed to close Phase2. Remaining feature
work is the recorded customer search/native-reference usage and friendly typed
reference/type controls, plus actual compatible publication/runtime journeys.
The Template saved-version/current-publication context gap was identified and
handed to the parent for a visible label; its editable Status choice alone must
not imply unsaved changes are live. Reuse the existing Template save/version
engine. This audit ran no tests/SQL/browser or
deployment; rehearsal and candidate results above are parent-recorded evidence.

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

## 12 October — visual comparison and field-change checkpoint

Source8/24 friendly authoring now includes approved fact-panel/table controls and
side-by-side sealed previous-design/sample current-draft comparison. Original actual
browser checker is extended, not yet passing those journeys. Source24 field-change
metadata/preview52 adapter and original prepare/collect/seal a8 are integrated;
reachable friendly target/save/bounded before-after UI source exists. Full control/
recovery UI and production conversion guards remain required. Source6/8.1/20.30
Analytics finite source+closed owner compiler are implemented; original publication/
seal/readiness and genuine shared viewer integration remain open. Phase2 FAIL.
080 actual migration applied in failed65ede candidate; no activation inferred.
