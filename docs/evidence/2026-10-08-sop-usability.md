# S&OP guided usability — 8 October 2026

Runtime `d3312b4` at https://atlassystem.online. SAP, Oracle and Kinaxis primary
research informed the guided workflow; see ../plans/SOP_USABILITY_RESEARCH.md.

## Release and checks

- Clean compatible release retains finished concurrent admin cleanup. Production
  build and separate strict TypeScript pass; scoped ESLint and whitespace pass.
  148 test files pass/3 skip; 946 tests pass/22 integration skips.
- Canonical shared repo: 57 focused SOP tests pass after guarded owned-source
  integration. Unrelated dirty changes preserved; shared memory reconciled.
- Deployment private database backup:
  `/home/administrator/backups/atlas-pre-deploy-20261008-145354.dump`, matching
  `-service-files.tar.gz` retained. 99 migrations, none pending. Server production
  build/restart healthy and public /login 200. No SOP migration introduced.
- `ATLAS_SOP_LIVE_TEST=1 npx tsx scripts/check-sop.ts`: all 42 assertions pass.
  Existing calculations, scenarios, source/version gates, immutable publication,
  overlapping demand protection and firm-order consumption remain verified.
- `ATLAS_SOP_USABILITY_TEST=1 npx tsx scripts/check-sop-usability.ts`: all 28 pass.
  Normal sign-in and actual browser create/setup/generate/month switch/review
  evidence/seven exact-version reviews/explicit approval/separate release; exact
  100/200 quantities for two populated months with version lineage; owned central
  action/completion; refreshed draft resets reviews, published history preserved.
  Overview/setup/reviews/decisions/help fit 390×844. Zero manager runtime errors.
  How-to accessible without source permissions; restricted snapshot recovery and
  cross-company isolation checked. Phone screenshot visually inspected.
- First harness run checked a destination before navigation settled; changed to
  wait for heading. Next incorrectly expected twelve publication rows despite
  only two populated months; confirmed deployed snapshot and exact quantities,
  corrected fixture expectation. Final run passes all assertions. Harness-only
  follow-up commits do not change the deployed app runtime.
- Every run suspends synthetic Test companies, revokes memberships/session/auth
  versions and rotates passwords. Central historical records retained. No real
  company's business data or grants changed by acceptance.

## Boundaries

Start here guides existing work; it does not certify finite material/machine/labour
capacity, actual costing, FX, weekly hierarchy or the entire master specification.
Unknown targets/supply/margin remain unavailable; unlike units stay separate.
Reviews/approval/release remain explicit guarded mutations, not page-visit effects.
No new schema, capability grants, local database/cache or business calculation.
