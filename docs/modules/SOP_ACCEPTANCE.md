# S&OP server acceptance — 7 October 2026

## Delivered release

- Server: `https://atlassystem.online`, `/opt/atlas`, `atlas` systemd service.
- Initial release `46ca06a`: additive `20261007160000_connected_plans_sop`
  migration, production build/restart and public login 200 passed. Backup:
  `/home/administrator/backups/atlas-pre-deploy-20261007-075416.dump`, with matching
  private service-evidence archive. No existing authoritative records were removed.
- JSONB comparison fix `d5c1c22`: server build/restart and login 200 passed;
  database/evidence backups use `20261007-075753`.
- S&OP is enabled/entitled for Michael Test. Plan was already enabled.
  Existing Michael profile and actual Apps resolver expose both modules and all
  eleven S&OP views. Activation is audited. All existing role rows compared
  unchanged; no source permissions or general customer-profile grants were added.

## Verified workflow

`scripts/check-sop.ts` signs in with normal disposable credentials against the
actual deployed actions. The first run caught PostgreSQL JSONB key-order
normalisation producing false Plan-change rejection. Canonical value comparison
fixed it; regression tests preserve detection of probability/revision/target changes.

All 39 checks then passed:

- Private Sales Plan, canonical CRM project and product/month input, linked 50%
  probability, monthly forecast (1,000 raw → 500 weighted), stale-write/tenant guards.
- Twelve closed months of requested-demand history, twelve-month forecast and
  order/project conversion: baseline 100, firm orders 200, weighted project 500,
  converted 200 and consensus 500; explicit selling price/cost financial projection.
- Draft/scenario publication and incomplete-review rejection, immutable private
  scenario calculation, seven exact-version reviews and approval.
- Live probability change blocks approved publication; refreshed consensus is
  reviewed/approved, publication/replay retains twelve unique total-demand rows
  and immutable version lineage.
- Actual Manufacturing screen action consumes those totals with firm orders once,
  includes the current month and produces the expected net requirement.
- Database rejects payload rewriting; snapshot access is revoked after source
  permission loss. All eleven S&OP screens, actual Plan input builder and authorised
  Apps navigation render through authenticated requests.
- Real Chromium displays demand without JavaScript errors, aggregates two recorded
  deliveries into Customer/Promise OTIF passes, and renders review controls at
  657 × 758. Synthetic canonical Sales source remains intact.

Synthetic `isTest` companies are suspended and their memberships/session versions
and passwords revoked in `finally`; central immutable evidence is retained.
No real company business record was created or rewritten by acceptance.

## Final edge hardening

Final release `5b7f9e2` is live. Production build/restart and public login 200
passed. Backup `/home/administrator/backups/atlas-pre-deploy-20261007-080356.dump`
and matching `-service-files.tar.gz` preserve central records/private evidence.

All 42 expanded authenticated assertions passed. Historical closed orders with
unverified partial receipts do not reopen as future demand; their OTIF stays
unavailable. An older overlapping cycle cannot replace newer approved product-month
demand; the transaction leaves its version approved and all newer forecasts intact.
Both cases were checked through deployed actions and real Chromium screens.
Synthetic companies suspended and credentials revoked after this final run.
The separate customer-link/Guardian follow-up `4f3b964` was subsequently integrated;
S&OP source is unchanged. All 42 live checks passed again against that combined
runtime, and the combined full suite passed 656 tests with 22 integration skips.
The compatible primary-source reconciliation also passed 85 focused integration
tests; unrelated unfinished primary files were preserved.

## Source checks and limits

Integrated source: 655 tests passed, 22 integration tests skipped / 110 files;
Prisma validate/generate, strict TypeScript, changed-file ESLint (zero warnings),
production build and diff checks passed. Migration rehearsed against a temporary
server-only schema clone before production application; no production records
were copied and the clone was removed.

This verifies the connected release, not all 99 sections of the supplied master
specification. Genuine remaining scope is in `SOP.md`, including finite capacity,
actual costing/FX/revenue budgets, hierarchy/weekly planning, advanced OTIF policy,
notifications and high-volume QA. Logistics partial receipt quantities remain
unknown where the owning source did not capture them; S&OP does not invent evidence.
The four detailed departmental Plan workspaces remain behind S&OP by Michael’s
explicit priority. Their research is in `docs/plans/DEPARTMENT_PLANNING_RESEARCH.md`.
