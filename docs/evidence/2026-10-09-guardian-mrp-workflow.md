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

Prepared and activated exact immutable source
`0ce9f4a8202bdf2413a9eb712b1f0a61a8e4ec72`. Runtime ancestry and Studio dependency
compatibility gates passed; sealed candidate and public login/revision checks
passed. Previous a642df0 runtime retained. Private deployment backup:
`/home/administrator/backups/atlas-pre-deploy-20261009-202221`.

The same public opt-in central Test checker PASSED with backup
`/home/administrator/backups/atlas-pre-mrp-test-20261009-202521`. All three forbidden
actual POSTs rejected with exact unchanged planning state. Real manager Run MRP
created exactly one correct company/actor run with MAKE 10/BUY 10 and 20, matching
BOM, machine/routing, duration and saved material date strings. Historic ISO-dated
operations render; two same-priority shortage dates sort chronologically. Actual
Open planned orders and three product links work. Newly generated forecast label
and quantity 10 render; Needed/Short cells are exactly 10 and 20 with canonical
component names. Pages reload with zero browser errors; full history/input/order/
stock/Finance/audit/outbox state stays unchanged. Ten background writes blocked.
Exact Test companies suspended, synthetic grants/sessions revoked; history kept.

Six reports closed only after this proof: access cmv1e1cdw00007md5sakpls3v, saved
proposal cmv1e2kzn000avgd51damb97r and cmv1ejxm20013m4d53owc482w, quantities
cmv1elqb900007rd5rx35bbq6, identified historical date render/browser
cmv19x5ik001orqd5b873eruw and cmv19x5bh001nrqd51tle9cf8. Historical date-related
action cmv19x58k001mrqd5b6zfudi2 remains NEEDS_AI because its submitted control is
unidentified; successful fresh Run MRP is not proof of that exact original action.
Eleven unresolved/current briefs have precise AI handoffs. Two expected disabled/
unentitled fixture denials produced cmv1f075e0000hbd5racyijal: access checks succeed,
but shared generic app-denial errors are classified as SERVER_ERROR. Keep guards
and genuine runtime reporting; typed expected-denial classification is next work.

Read-only public continuity passes five Finance/Logistics/Manufacturing/Service
pages and actual Apps toggles, no browser/chunk failures. Home desktop/tablet/phone
utilities, authorised cards, branding/no overflow, search/Escape and actual app/
Apps links pass, with all business writes blocked. Existing private screenshot
output permission blocked the initial harness; using this run's own private output
path passed without product changes or modifying another chat's file. Atlas and
Guardian timer active, worker heartbeat on 0ce9f4a and service Result=success. Eight
final queue pages read through hasMore=false: 179 active diagnostics. Other historical
generic reports remain open/NEEDS_AI, with no claim of every app/control verified.

Canonical desktop integration preserves unfinished transactional actions, engine,
legacy cockpit and domain edits; narrowly ports owned guard/demand/date/quantity
adapters with additive types and 14 passing regressions. Scoped lint has zero
errors, one existing unused cockpit variable warning. Full modern source/evidence
published and merged with current contributors' documentation in origin/main;
no unrelated unfinished main source activated. Canonical checkout was not reset,
bulk committed, built or claimed strictly typechecked.
