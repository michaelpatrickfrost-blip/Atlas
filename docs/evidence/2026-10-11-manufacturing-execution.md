# Exact manufacturing execution and app guides — 11 October 2026

Accepted live source: `c385a2be2302a514e4b84e33198926cbf149bbf5` at https://atlassystem.online.
Previous Decimal-compatible runtime: `5b6390c874b42571f091a53b1b017aea70121df7`.
Original release locks, pinned push/ancestry, central backups, immutable builds,
Studio compatibility, candidate/public gates and rollback safeguards were retained.
No local business database/cache or ordinary customer fixture writes were introduced.

## Verified behavior

- 1.000125 metric tonnes receives exactly 1000.125 kg, freezes entry/base conversion,
  replays once and refuses conflicting requests. Serial identities remain whole units.
- Partial reports commit progress, stock, actual material allocations, WIP and Audit
  atomically. Held components leave all unchanged. Actual 2.5 kg planned output makes
  2.25 kg good/0.25 kg loss, creates a linked replacement and two held output batches.
  Partial collection, Quality/stale/version/serial guards and replay checks pass.
- Actual manually selected component serials trace to their own partial outputs and
  each £1 component costs its output at £1. Automatic material use totals exactly 5 kg;
  carrying-value journal rounding leaves its remainder in raw stock, never inventing cost.
- Partial work retains WIP; closure clears all remaining minor units. Machine/labour/
  energy usage posts once. Every posted manufacturing journal balances to the penny.
  Actual 0.5 kg shipment posts Inventory → COGS once, within the stock transaction;
  a 0.125 kg warehouse transfer preserves overall carrying value and batch identity.
- Two compatible products occupy 250/300 kg on one shared 60-minute machine booking.
  One actual shared-cost journal allocates £27.30 at 80%/20%; completed member WIP is zero.
- Supplier receipt date remains separate from payment due date. Approved on-time open
  PO supply covers MRP once. Receiving 2 kg with 1 kg damage books/value-posts only 1 kg,
  and replay creates one receipt. Replacing the remaining arrival with a later confirmed
  date exposes demand before that arrival. Finance receipts use their own tenant FK;
  existing Logistics source links and single-source guards remain protected.
  The approved PO is a synthetic source fixture; this check does not claim separate
  independent-approval, invoice settlement or bank-payment acceptance.
- Actual Sales-history last-year +10% plus additive value, fixed target/individual
  overrides, stale review, future Make firming/release, recursive MRP, Buy draft linkage,
  finite eligible-machine shifts/downtime/cooling and protected cascades pass.
- Filled traceability/cost/load/production/collection screens fit 1440/768/390. App-guide
  and console screens also pass desktop/tablet/phone, canonical redirects, illustrated
  images and zero browser exceptions. Real user Operations tab shows 28 guides across
  nine apps; Manufacturing has 20 Setup/Daily work/Troubleshooting guides. Filters continue
  through app links/search/back. Finance Procurement stays under its proper owner.

## Checks and evidence

Final guide checks: 7 tests, production build, strict TypeScript and focused lint PASS.
Receipt correction: 4 files/39 tests, schema validation/generation, metadata generation,
production build, strict types/lint PASS. Earlier execution foundation full suite:
306 files/2,241 tests PASS; 3 files/22 opt-in tests skipped. Full suite was not repeated
for the focused corrections, per Michael's instruction against excessive testing.

Candidate `/tmp/atlas-supply-candidate-9ChVpt`; public `/tmp/atlas-supply-public-9AX7DW`.
Text `browser.log`/`cleanup.log` evidence is retained privately. Central backups:
`/home/administrator/backups/atlas-pre-deploy-20261011-204732` and
`atlas-pre-supply-public-20261011-205051` (database plus configured private files).
Final public login returned 200; revision/pointers matched before and after acceptance.
Cost phone, shared-load tablet and genealogy desktop screenshots were reviewed.

## Cleanup and practical limits

The backed-up protected sweep removed 13 explicitly marked CUSTOMER Test companies
and their scoped records. Zero Test companies and pending Test-file deletions verified;
ordinary/internal companies, shared staff identity, deletion Audit and backups preserved.
378 task-owned server Test screenshots/failure payloads and six local PNGs were removed
after visual review. Acceptance text logs and mandatory backups remain.

Earlier failed candidates caught an existing-pool negative-upsert constraint failure,
a misconfigured Test storage location/Buy batch, and the incorrect Logistics receipt
link. Failed mutations rolled back; those candidates never activated. The final guide
assertion was corrected to include operational Procurement under Finance. None of the
repairs weakened application, database, tenant or accounting guards.

This validates the listed operational workflows. Remaining site-specific supply/
transfer netting, expected-good yield/input-capacity alignment, full CTP, rework,
subcontract/co-product costing, governed reversals and complete recall engines remain
open in MANUFACTURING_COVERAGE.md; this is not full 173-section/commercial-readiness
acceptance. Existing legacy work without captured approved cost bases requires review.
