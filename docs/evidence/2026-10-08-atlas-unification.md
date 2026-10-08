# Atlas unification deployment evidence — 8 October 2026

Michael requested continuous implementation/deployment without phases and stressed
that ease of use is vital. Five compatible application releases were built and
published to https://atlassystem.online from the managed release worktree, excluding
the primary checkout's unrelated unfinished edits. Each deploy backed up central
Postgres and private Service evidence, applied the release schema gate (96 migrations,
none pending), built/restarted the service and verified HTTPS login 200.

| Application release | Delivered behavior | Live assertions | Pre-deploy dump timestamp |
| --- | --- | --- | --- |
| `29316a8` | Active-line availability, dispatch netting, receipts, protected Finance chain | 10 | `20261008-111337` |
| `58ee4f3` | Owner-authorised relationships and protected shared financial quantities | 26 | `20261008-112355` |
| `77252b4` | Attention-first Home, source health, direct My work, keyboard Apps disclosure | 34 | `20261008-112902` |
| `bff3a5c` | Atomic material/output/completion/audit; safe concurrent retry | 44 | `20261008-113632` |
| `bae014b` | Product-first Inventory; contextual guidance and planning settings disclosure | 54 | `20261008-114017` |

Backups are `/home/administrator/backups/atlas-pre-deploy-<timestamp>.dump` and
matching `-service-files.tar.gz`. Existing evidence/backups were preserved.

## Checks actually run

- Latest logic suite: 712 passed, 22 integration tests skipped, 117 files.
- Clean release strict TypeScript, changed-file ESLint, production build and final
  baseline-to-release diff check passed. Final layout follow-up repeated typecheck,
  changed-file lint and build; it changed no calculations or data rules.
- `ATLAS_UNIFICATION_LIVE_TEST=1 npx tsx scripts/check-atlas-unification.ts`, on
  the deployed VPS, passed 54 authenticated assertions. Real Chromium verified
  forward/reverse record links, Home/Inventory, phone/keyboard navigation and no
  runtime page errors. Sales-only and Manufacturing-only viewers did not receive
  protected Finance/customer/order identities; private-project scope was preserved.
- Real completion action: second material deliberately short; no movement,
  warehouse assignment or step/parent version survived failure. After replenishing
  the fixture, concurrent identical requests yielded two material issues, one output
  receipt and one audit/activity. Parent and step completed together. Changed-key
  payload, overproduction, missing execution capability and outside-tenant attempts
  failed. The outside actor also lacked execution capability; separate record/data
  isolation checks verified tenant denial with read access.
- All synthetic records were in disposable `isTest` organisations on the central
  server. Finally, organisations were suspended and credentials/memberships revoked;
  immutable synthetic transaction evidence remains. No customer records or profile
  permissions were changed and no local business database/cache was created.
- Four manufacturing regressions and six original availability/access regressions
  failed before repair. Initial live wait used network-idle and timed out; explicit
  content waits corrected the harness. A primary integration duplicate import was
  fixed; the final primary focused suite passed 56 tests across 7 files.
- Primary-wide TypeScript did not complete after six idle minutes and was stopped.
  No primary-wide build/typecheck success is claimed. The clean, deployed compatible
  release passed both. Source/memory were merged back with base equality/patch checks
  and narrow conflict handling; other contributors' edits were preserved.

## Remaining scope

These releases certify only the recorded behavior. The complete 251-section master
brief is not done. Consistent quality/position provenance, both MRP paths, dated
purchased supply/BUY and transfer execution, protected ATP/CTP, repeated partial
production, costing/WIP/COGS, performance and the remaining workflows need further
implementation and acceptance. See the rolling work list and technical-debt guide.
