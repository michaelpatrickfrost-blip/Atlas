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

## Single-app follow-up — historical preparation (superseded below)

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

## Detailed consolidation preparation history

This dated history is superseded by the final public acceptance below.

## 9 October 2026 — Single Manufacturing app consolidation in progress

User follow-up requires other apps doing this work to disappear. Inventory joins
Production Planning under the accessible Manufacturing launcher/switcher entry;
Products was already hidden and now shares the console chrome. Product/Stock
route layouts use the same Manufacturing & Supply header/navigation, retaining
source guards and bookmarks. Warehouses/locations added to Products & plant.
Manage apps nests Inventory/Planning/Products access switches under one parent
card, retaining original service/entitlement/dependency checks and state flags.
No schema, records, role grants or company switches changed. Product-only readers
can open the console with only their permitted source destinations. Finance and
business-wide Plan/S&OP remain separate for other teams unless clarified otherwise.
Paths: app layouts/apps page/card; module manifests/console destinations; generic
core/modules/workspaces.ts grouping; checker and module/workspace tests.
Checks before source preservation: local production build, strict TypeScript,
scoped ESLint PASS; nine regressions/47 tests and four launcher/search files/14
tests PASS. Extended candidate checker covers Home/switcher/Manage apps and legacy
Product/Inventory/Planning routes at desktop/tablet/phone. Source 18116af preparation
stopped while waiting for the shared deployment lock, before new backup/fixture.
Observed live e5d66e6 (Studio fields and modern Apps) is merged exactly to preserve
its deployed source. Integrated Prisma generation, production build, scoped ESLint
and 14 files/67 regression tests PASS. Explicit strict post-build TypeScript PASS.
Candidate 0010eab prepared/smoke PASS after backup atlas-pre-deploy-20261009-220838;
complete candidate acceptance PASS in /tmp/atlas-supply-staging-wuDkuu, including
Home/Apps/Manage apps, eight existing route pages and responsive Product/Inventory
fit; full Make/Buy/spend/eligibility/guides and unchanged QA permissions. While
queued, observed live advanced to 5ebd700 (shared Nunito font); that exact deployed
source is merged. Combined production build, explicit strict TypeScript, scoped
lint and five launcher/search/shell files/17 tests PASS. Added source-page/Manage apps screenshots to
the checker for visual review. 6a12fc1 prepared/smoke PASS after backup
atlas-pre-deploy-20261009-221710; complete candidate acceptance PASS in
/tmp/atlas-supply-staging-nfUzeE, screenshots visually inspected. Activation stopped
at ancestry before a new backup/switch: public live advanced to 56c9d88 (business/
staff navigation boundary). That exact deployed source is preserved. Integrated
production build, explicit post-build strict TypeScript, scoped lint and six
launcher/search/business-boundary files/23 tests PASS. ddb35f2 prepared/smoke
PASS with backup atlas-pre-deploy-20261009-223610; complete candidate PASS in
/tmp/atlas-supply-staging-QdOOi5, screenshots visually inspected. Live advanced to
94dd3e1 (commercial workspaces) ahead of activation; that exact source and its
already-applied SalesActivity additive migration are preserved. Integrated Prisma
generation, production build, explicit strict post-build TypeScript, scoped lint
and 14 files/67 focused regressions PASS. c8b49aa prepared/smoke PASS after
backup atlas-pre-deploy-20261009-224802; complete candidate PASS in
/tmp/atlas-supply-staging-yMKGrR. Public advanced to 7941f9b (Studio field policy
helpers) ahead of activation; that exact deployed source is preserved.
10 October: integrated Studio helpers production build, strict TypeScript, scoped
lint and 12 files/62 tests PASS. Linux global-lock ownership/inheritance/rejection
prototype checks PASS without app/database/service writes. Observed public live
advanced to 36d0d2d (People/payroll). It already supplies a native acceptance hook
inside the normal release lock scope; preserve that exact source and extend the
hook for supply instead of introducing a second locking mechanism. 36d0d2d exact People/payroll source, migrations and generated gateway are merged.
Supply now extends its deployed held-lock acceptance hook, with separate candidate
and public fixture backups and normal public-failure runtime rollback. Prisma generation, production build, scoped lint, shell syntax and 15 files/95
focused regressions and explicit strict post-build TypeScript PASS. Final hooked
candidate/public acceptance pending. Owned diff against exact live 36d0d2d passes
whitespace; imported applied People migration EOF whitespace is preserved for
checksum integrity. No inherited-lock mechanism is included.
No live single-app claim yet.


## Single-app public acceptance — PASS, 10 October 2026

Exact application **2ef5b4c2f9dffaa2dd92c7df894a5587e45a12de** is live and
publicly verified. Current pointer/control HEAD and public health match; previous
immutable `36d0d2d` is retained. One held-lock invocation used the original deploy
path with `ATLAS_RELEASE_ACCEPTANCE=supply`, preserving every gate and all exact
intervening public sources. No inherited-lock mechanism is shipped.

Backups under `/home/administrator/backups`:
`atlas-pre-deploy-20261009-231158`,
`atlas-pre-supply-candidate-20261009-231340`,
`atlas-pre-supply-public-20261009-231425`.
Candidate evidence `/tmp/atlas-supply-candidate-3owMAy`; public evidence
`/tmp/atlas-supply-public-7GlYCp`. Database/private-file backups remain retained.

Both exact-source runs PASS: one Manufacturing app on Home, Apps switcher and
Manage apps; no separate Inventory/Production Planning/Products app links;
three source controls inside the parent card; unified header on eight existing
Product/Stock/Planning routes; desktop 1448/tablet 820/phone 390 with no root
overflow. Full Make/Buy/spend/eligibility/drill-through/nine-guide workflow also
passes with the exact values and fixture-retirement checks listed above. Public
Product/Inventory/Manage apps screenshots visually inspected; zero page exceptions.
Original QA account/auth version/profile grants remain unchanged, Test affiliation
revoked/company suspended and financial/audit history retained.

Final production build, explicit strict post-build TypeScript, scoped lint, shell
syntax and 15 files/95 focused regressions PASS. Full suite not rerun; previous
baseline failures are not represented as passing. Owned diff against `36d0d2d`
passes whitespace; imported applied migration trailing blank lines are retained
for checksum integrity. Canonical Desktop checkout still has 598 pre-existing
changes at ed54a6c; preserve them and reconcile this committed release branch later.
No app code changed after public verification. Finance and business-wide Plan/S&OP
remain available; the requested product/inventory/production-planning consolidation
is complete. The broader 173-section engine programme remains as documented.
