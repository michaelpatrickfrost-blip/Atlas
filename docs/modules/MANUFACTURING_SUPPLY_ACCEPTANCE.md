# Manufacturing & Supply acceptance — 9 October 2026

Scope: modern connected console, preserved workspaces, independent sales eligibility,
atomic Make/Buy conversion, Finance-owned supplier spend and illustrated instructions.
The full 173-section brief remains partially delivered; see coverage and Manufacturing.

## Local checks

- Initial production build and scoped TypeScript/ESLint passed.
- 128 tests in 18 focused files passed, including source permissions, launcher fallback,
  rich Make firming, Buy concurrency/quantity checks, product eligibility and Finance controls.
- Full suite baseline at the exact live c46bbef was tested in an isolated Git worktree:
  85 failures in 14 existing files, mainly stale entitlement mocks. Integrated final suite has the same 85 failures in 14 files: 167 files passed,
  1,071 tests passed and 22 skipped. No full-suite pass claimed.
- Final production build, scoped ESLint, Prisma validation/generation and shell syntax passed.
  Final explicit TypeScript passed (separate from Next build, which skips type validation).
- Live-compatible integration preserves Reports/standalone Admin and Guardian MRP
  lineage/guard repairs; nine integration files/53 tests passed.
- An Inventory transfer test hit its default import timeout during concurrent builds;
  its 12-test suite passed with a 30-second test timeout and the final full suite
  also passed that file.

## Live gate

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
new draft feedback. The second additive migration awaits backed-up preparation.
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
