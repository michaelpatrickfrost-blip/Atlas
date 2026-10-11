# Manufacturing & Supply acceptance — 9 October 2026

Scope: modern connected console, preserved workspaces, independent sales eligibility,
atomic Make/Buy conversion, Finance-owned supplier spend and illustrated instructions.
The full 173-section brief remains partially delivered; see coverage and Manufacturing.

## Local checks

- Initial production build and scoped TypeScript/ESLint passed.
- 128 tests in 18 focused files passed, including source permissions, launcher fallback,
  rich Make firming, Buy concurrency/quantity checks, product eligibility and Finance controls.
- Full suite baseline at the exact live c46bbef was tested in an isolated Git worktree:
  85 failures in 14 existing files, mainly stale entitlement mocks. Earlier integrated suite (before later Messages/private Admin preservation) has the same 85 failures in 14 files: 167 files passed,
  1,071 tests passed and 22 skipped. No full-suite pass claimed.
- Final production build, scoped ESLint, Prisma validation/generation and shell syntax passed.
  Final explicit TypeScript passed (separate from Next build, which skips type validation).
- Live-compatible integration preserves Reports/standalone Admin and Guardian MRP
  lineage/guard repairs; nine integration files/53 tests passed.
- An Inventory transfer test hit its default import timeout during concurrent builds;
  its 12-test suite passed with a 30-second test timeout and the final full suite
  also passed that file.

## Historical candidate evidence

These earlier gate entries are retained as history and superseded by the final
live acceptance below.

Candidate `1f93216` prepared after central backup `atlas-pre-deploy-20261009-201307`;
server build, Studio compatibility and smoke passed. Sales eligibility migration
applied. Responsive console, real recursive MRP and Make conversion passed. Buy
conversion exposed the pre-existing Make-only database FK; its transaction rolled
back with no purchase draft. Refined source adds a separate tenant-bound purchase
link and readable draft/source feedback. Complete candidate/public acceptance is
still pending; no deployment completion claimed.

Combined source preserves observed live `0ce9f4a` MRP shortage repair. Final
production build, explicit TypeScript, scoped ESLint and Prisma validation passed;
seven focused files/40 tests passed, including aggregate shortage regressions and
new draft feedback. The second additive migration was subsequently applied after backup
`atlas-pre-deploy-20261009-203333`; its Make foreign key is preserved.
The checker uses existing Guardian staff rights, creates only an isolated central Test
company/affiliation without permission grants, then retires that exact company/session
and preserves history. Existing customer records and QA membership remain unchanged.
Report source fixtures use balanced guarded ledger postings; this validates report
reads, not independent approval/payment workflow acceptance.

Candidate: `ATLAS_SUPPLY_CHECK=1 bash scripts/deploy/check-supply-release.sh /opt/atlas <SHA>`.
Public: run `scripts/check-manufacturing-supply.ts` with `ATLAS_SUPPLY_CHECK=1`, the
existing Guardian environment and `ATLAS_SUPPLY_URL=https://atlassystem.online`.
Always hold deployment locks and take a central database/evidence backup before
fixture writes. Never create a local business database or bypass financial guards.


## Historical final refinement gate

Candidate `f0807fa` fully passed desktop/tablet/phone console, actual MRP Make 10 /
Buy 15 net of stock, single source-linked PO draft with preserved rejected inputs,
repeat refusal, internal Sales eligibility, GBP/EUR spend, restricted source
redaction, document drill-through, all nine illustrated guides and zero browser
exceptions. Evidence: `/tmp/atlas-supply-staging-6nLSJ6`. Activation stopped before
pointer changes on a Ticket v2 dependency belonging to a suspended Test company;
backup `atlas-pre-deploy-20261009-212304`. Live remained `1dafe16`.

Lifecycle repair excludes only suspended Test history from release compatibility:
all real companies, active Tests and unknown statuses retain missing/changed/expired
checks. No saved metadata was edited. Legacy cockpit/Planned orders estimates now
require independent cost access, including actioned rows. Current refinement:
production build, explicit strict TypeScript, scoped ESLint and 14 files/67 tests
passed. Full suite was not rerun after later live integrations; no whole-suite
pass is claimed. Prepare this exact corrected source, repeat connected acceptance,
activate and verify public HTTPS before declaring the feature deployed.


## Final live acceptance — PASS

Application source **2690c26cb0f5f3c28e21265820e8a713708ce699** activated and
verified at https://atlassystem.online. Exact health/pointer matched before and
after public checks. Previous immutable runtime 1dafe16 remains retained.
Preparation/activation central backup prefixes: `atlas-pre-deploy-20261009-213355`
and `atlas-pre-deploy-20261009-213834`; public fixture backup
`atlas-pre-supply-public-20261009-213846`, all under `/home/administrator/backups`.
Candidate evidence `/tmp/atlas-supply-staging-igQlin`; public evidence
`/tmp/atlas-supply-public-nqKaat`. Database/private evidence backups are retained.
Both additive migrations applied; original production-order FK remains.

The same exact-source candidate and public checks passed:

- Desktop 1448, tablet 820 and phone 390 console; no root horizontal overflow;
  Finance role view and optimistic bookmarkable shortcut customisation.
- Real recursive plan: 10 assemblies need 20 internal components; five stocked
  components leave Buy 15. Make converts once with saved source lineage.
- A zero-price purchase save rejects safely and retains supplier/quantity; reviewed
  15 units at GBP2.50 save as one GBP37.50 Finance draft. Source claim, tenant FK,
  audit/timeline and actioned destination link persist; repeats create no duplicate.
- Internal material remains usable in purchasing/stock/recipes and is rejected by
  Sales eligibility. Existing sellable products remain eligible.
- GBP posted supplier spend 85, unbilled commitment 100, accepted receipts 120 and
  current gross payables 82 stay separate; EUR spend 30 remains separate. Restricted
  source amounts are unavailable. Source document drill-through works.
- All nine guide routes and responsive illustrations load; no browser exceptions.
- Exact synthetic Test companies are suspended, fixture memberships revoked,
  immutable financial/audit history retained and original QA membership/auth version
  unchanged. No existing customer data or profile grants changed.

Final source production build, explicit strict TypeScript, scoped ESLint and 14
files/67 regressions pass, including lifecycle/expiry gates and rendered-page cost
redaction. Earlier full-suite baseline failure counts above remain; no current
full-suite pass claimed. Candidate/public screenshots reviewed visually. Read-only
final revision check also matched 2690c26. This acceptance covers the connected
console and listed workflows, not all remaining 173-section engines.

Canonical source integration awaits reconciliation of 598 dirty/untracked entries
in the main Desktop checkout, including 27 overlapping task paths. The complete
release branch and shared memory remain committed in the same Git repository;
no contributor's unfinished changes were reset or overwritten.

## Single-app follow-up — candidate/public acceptance pending

Inventory and Product route trees now share the Manufacturing & Supply shell;
Inventory's launcher/switcher card joins the already folded Production Planning
entry. Products remains hidden as before. Manage apps nests all three source access
switches under one Manufacturing card, preserving current states and entitlement/
dependency services. Search retains included source pages under the parent name.
Build, explicit strict TypeScript, scoped lint and targeted workspace/access/search
regressions passed. Extended checker asserts Home/switcher/Manage apps, existing
Product/Stock/Planning route guards and desktop/tablet/phone fit. It must pass on
the exact candidate and publicly after activation; no new live claim yet.

Preserved exact observed live `e5d66e6` (Studio fields and modern Apps) after
`18116af` stopped at the shared lock before preparation. Combined Prisma generation,
production build, explicit post-build strict TypeScript, scoped ESLint and 14 files/
67 regressions PASS. Candidate/public acceptance is still pending.

`0010eab` preparation/smoke and complete candidate acceptance PASS, with backup
`atlas-pre-deploy-20261009-220838` and private evidence `/tmp/atlas-supply-staging-wuDkuu`.
All single-app route/launcher assertions and the full connected workflow passed.
Before activation, exact public live advanced to `5ebd700` (Nunito typography);
that source is preserved. Combined build, explicit strict TypeScript, scoped lint
and five focused launcher/search/shell files/17 tests PASS. Final candidate/public
acceptance remains pending.

`6a12fc1` preparation/smoke and complete candidate acceptance PASS; backup
`atlas-pre-deploy-20261009-221710`, evidence `/tmp/atlas-supply-staging-nfUzeE`.
Product/Inventory desktop/phone and Manage apps screenshots visually inspected.
Activation stopped safely at ancestry before backup/switch after public live
advanced to `56c9d88` (business navigation excludes staff Admin tools). Preserved
that exact source. Combined production build, explicit strict TypeScript, scoped
lint and six launcher/search/business-boundary files/23 tests PASS. Final combined
candidate/public acceptance remains pending.

`ddb35f2` preparation/smoke and complete candidate acceptance PASS; backup
`atlas-pre-deploy-20261009-223610`, evidence `/tmp/atlas-supply-staging-QdOOi5`.
Activation stopped before backup/switch because live advanced to `94dd3e1`
(commercial workspaces). Preserved its exact source and already-applied additive
SalesActivity migration. Integrated Prisma generation, production build, explicit
post-build strict TypeScript, scoped lint and 14 files/67 focused regressions PASS.
Final combined candidate/public verification remains pending.

`c8b49aa` preparation/smoke and complete candidate acceptance PASS; backup
`atlas-pre-deploy-20261009-224802`, evidence `/tmp/atlas-supply-staging-yMKGrR`.
Public advanced to Studio `7941f9b`, then People/payroll `36d0d2d` ahead of
activation. Both exact deployed sources, central migrations and generated gateway
are preserved. Integrated client generation, production build, scoped lint and
15 files/95 focused regressions and explicit strict post-build TypeScript PASS.
Extend the deployed People acceptance hook with `ATLAS_RELEASE_ACCEPTANCE=supply`
so normal deploy locks cover candidate, activation and public verification together.
Both supply fixture stages have separate central database/private-file backups;
source pointers/revisions are verified afterward. All original release gates and
public-failure runtime rollback remain. No inherited-lock mechanism is included.
Final exact-source hooked acceptance remains pending. Imported People migration
EOF whitespace is retained to preserve already-applied checksums; owned diff
against exact live `36d0d2d` passes whitespace checks.

## 11 October 2026 — Finite kilns and flexible forecast checkpoint (pending live)

Research and remaining programme: docs/plans/MANUFACTURING_KILN_RESEARCH.md.
Implemented explicit batch/load/cooling/wait timing, eligible alternatives,
timezone/shift/downtime-constrained release and atomic reviewed cascades, machine
capacity and plant configuration, backtested Sales-history forecast assumptions
(last-year percentage/additive/fixed/individual), gross-booking consumption and
protected S&OP. Whole-unit stock limits stay open; fractional backflush refuses
rather than rounds. No claim of complete process manufacturing or plant readiness.

Local Prisma generation/validation, strict TypeScript, scoped ESLint, production
build and whitespace PASS. 16 files/113 focused assertions PASS, including preserved
live Dashboard, company administration and Finance access. Full suite not rerun.
New scripts/check-manufacturing-kilns.ts runs from the existing backed-up supply
Test gate on candidate and public, exercising actual release and forecast UI save,
wrong-machine/tenant/locked/stale rejection, atomic cascade and three-width layout.
Migration 20261011120000_manufacturing_finite_kilns is additive; central application,
browser feature checks, visual review and deployment results remain pending.

Final correction preserves reviewed future start/finish through Make firming and
finite release; new command/UI acceptance covers forecast proposal→release timing.
Preserved accepted company phone-header c607e12. Final strict TypeScript, scoped
ESLint and production build PASS; 16 files/114 assertions PASS. First b2a3891
activation attempt stopped before backup/migration/candidate while live advanced;
no first-candidate result or server change claimed. Retry uses the compatible
live ancestor and same locked supply acceptance, with no force/reset.

73210f8 candidate build/compatibility/smoke succeeded after central backup
atlas-pre-deploy-20261011-160550; additive kiln migration applied. Candidate supply
fixture backup atlas-pre-supply-candidate-20261011-160718, evidence
/tmp/atlas-supply-candidate-iRsczq. Existing console/MRP/Make/Buy/internal checks
PASS. New Node API helper sent a loopback Origin inconsistent with Next's internal
request URL and was correctly refused before production release. Remove that
Node-only Origin header, preserving the existing authenticated desktop API and all
production guards. Fixture retired/session revoked; QA unchanged. Public activation
did not occur; c607e12 remains current. Fresh exact pinned gates required.

ef3ef9c candidate: future MRP timing and finite kiln release PASS. New execution
assertion exposed the historical Waiting/Ready lifecycle gap; fixture cleanup PASS,
no public switch. Current source makes first/next steps Ready, validates legacy
Waiting start without bulk updates, keeps paused work fixed, and explains floor
readiness. Actual central execution/stock-replay gate added. Explicit plant/timeline
timezones avoid host-dependent rendering/moves; UK browser and DST domain checks
added. Fresh final local checks and exact candidate/public gate remain required.

Final lifecycle/timezone/occupied-machine source local checks: 16 files/116 tests,
strict TypeScript, scoped ESLint, production build and whitespace PASS. Initial tsc
hit generated-route-type regeneration during a concurrent build; sequential
post-build rerun passed. No type waiver. Fresh pinned candidate/public full flow
and five-workspace, three-width UK browser acceptance remain pending.

303cf56 candidate build/compatibility/smoke and actual supply/MRP/finite cascade/
legacy-start/pause/resume/next-ready/final stock posting/replay PASS. Central Sales
24-month seasonal backtest and correct future month PASS. Browser forecast selector
timed out because implicit Product label includes option text; failure screenshot
confirms workbench renders correctly. Harness now scopes the first combobox inside
Demand intelligence. Application auth/forecast logic unchanged. Backup atlas-pre-
deploy-20261011-162844, fixture backup atlas-pre-supply-candidate-20261011-163019,
evidence /tmp/atlas-supply-candidate-FJmAK4. Test retired/session revoked; public
still c607e12. Forecast browser save/responsive gate and public activation pending.

11 October 2026 live checkpoint b80f8baad0cc694422981238d201e150b927b522:
candidate and public supply gates PASS, public login 200, immutable runtime active;
previous c607e12 retained. Release backup atlas-pre-deploy-20261011-163626; candidate
fixture backup atlas-pre-supply-candidate-20261011-163801, evidence /tmp/atlas-supply-
candidate-YikYVo; public fixture backup atlas-pre-supply-public-20261011-163907,
evidence /tmp/atlas-supply-public-N0Lkfi. Actual MRP Make/Buy→Finance, forecast future
release, finite compatible full-load/cooling/shift/wait scheduling, stale/locked/
wrong-machine refusals, atomic cascades, legacy execution/pause/resume/next-ready,
final component/output stock and replay, Sales seasonal forecast and +10% +5 UI
save/fixed/override, five routes at three widths, reports/guides/zero browser errors
PASS. Both Test fixtures suspended/sessions revoked; original QA unchanged. Central
additive kiln migration applied earlier and retained. Desktop/phone screenshots
reviewed locally: Plant, Schedule and loaded Forecast fit; detailed recipe screenshot
was Overview rather than active routing editor. Visual refinement will focus machine
configuration on opening, tighten assumption labels and show batch timings in the
read-only routing summary; further active-editor acceptance required for that work.
Full-suite not rerun; full 173-section process programme remains open as documented.

Post-release visual/source refinement: Plant opens/focuses machine configuration
and work-centre editing directly in view; Forecast assumption labels have dedicated
aligned space and explicit select names; read-only routing shows true batch load/
cycle/cooling/wait instead of zero per-unit run. Scheduler now refuses closed/non-
released parents, matching execution. Supply gate extends to actual routing UI save
(version/zero crew/eligible machines/released recipe preservation), closed-parent
refusals and active routing/configuration views at three widths. Browser write
allowlist adds only the exact newly owned Test product path. Final local checks and
new pinned candidate/public gate required; b80f8ba stays the verified live checkpoint.
