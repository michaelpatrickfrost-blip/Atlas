# Guardian MRP reproduction and repair — 9 October 2026

## Reproduced failures

Backed-up, locked central Test fixtures on c46bbef, 2a8522f and a642df0 used fresh
customer reader/manager profiles, with enabled, disabled and unentitled app states.
No existing users, grants, companies or business records were edited.

- The actual `runMrpForm` Server Action accepted three forbidden POSTs: planning
  read-only, disabled Manufacturing and unentitled Manufacturing. Each created a
  central run attributed to the forbidden fixture actor; the reader's UI had no
  Run MRP button. Source checked plan read and omitted app availability.
- An authorised manager clicked Run MRP once. The central run/proposals saved, but
  newly generated Planned orders failed: the engine stores demandId/demandType/
  demandQuantity/sourceLabel while the reader expected sourceId/sourceType/
  quantity/label. Private 19:59 journal matched undefined toLocaleString TypeError
  and digest 1480022851; report cmv1e2kzn000avgd51damb97r.
- Actual saved BOM/BUY quantities 10 and 20 displayed needed/short 20 and 40 in
  Shortages. The reader summed component requirements and matching BUY proposals.
  The explicit cell assertions reproduced this on a642df0 at 20:12 UTC.
- A sealed retained 585e9ba query module reproduced requiredDate.getTime-is-not-a-
  function against the same synthetic persisted ISO material dates. No legacy web
  server was started. The existing af030b0 date conversion remains in the release.

Synthetic history, BOM/routing/forecast inputs, stock, orders, Finance, audit and
outbox snapshots remained identical. Exact Test companies were suspended and
synthetic grants/sessions revoked; central history was retained. No record bodies,
tokens, private IDs or customer content were exported. Latest private reproduction
backup: /home/administrator/backups/atlas-pre-mrp-test-20261009-201240 (DB plus
configured private Service evidence).

## Repair and checks

The mutation now requires plan management and the shared Manufacturing app guard
before executing, preserving session scope and the Atlas staff exception. Saved
demand decoding adapts current and legacy shapes without rewriting history and
retains forecast/firm/safety-stock lineage. Shortages aggregate component demand,
net one shared stock snapshot, retain larger independent BUY requirements and use
scoped canonical suggestion-product names where a component label is missing.
No schema/migration or existing profile grant changes.

The new action/date/demand/quantity suite reproduced failures before each repair
and now passes all 14 assertions. Quantity regressions include matching BUY supply,
shared stock across two parents, individually covered parents with an aggregate
shortfall, and independent direct demand. The 13-file focused suite passes 89
assertions, including existing Reports/Admin/provisioning/Guardian boundaries.
Production build and scoped lint pass. A fresh tracked-only checkout generated
Next types and passes strict TypeScript without exclusions; the original worktree's
untracked duplicate test referencing a moved Admin route is preserved untouched.

Final full suite: 1050 passed, 85 failed, 22 skipped. Exact failure names match the
unchanged a642df0 baseline (1036/85/22); the repository-wide suite is not green.
Initial concurrent Inventory timeouts disappear in stable runs. No claim of every
ERP page/control being verified follows from these scoped tests or source inventory.

## Server verification

Pending: sealed compatible preparation, activation and the same public central
Test-fixture check. Reports remain open until a deployed revision passes the
original POST, actual button, saved proposal/shortage pages and connected products.
Publish final runtime SHA, backup and outcome here after successful verification.
