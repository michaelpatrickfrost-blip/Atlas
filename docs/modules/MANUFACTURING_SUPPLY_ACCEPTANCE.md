# Manufacturing & Supply acceptance — 9 October 2026

Scope: modern connected console, preserved workspaces, independent sales eligibility,
atomic Make/Buy conversion, Finance-owned supplier spend and illustrated instructions.
The full 173-section brief remains partially delivered; see coverage and Manufacturing.

## Local checks

- Initial production build and scoped TypeScript/ESLint passed.
- 128 tests in 18 focused files passed, including source permissions, launcher fallback,
  rich Make firming, Buy concurrency/quantity checks, product eligibility and Finance controls.
- Full suite baseline at the exact live c46bbef was tested in an isolated Git worktree:
  85 failures in 14 existing files, mainly stale entitlement mocks. Current suite has
  the same 85 pre-existing failures after the Sales eligibility fixture correction.
- Final production build, scoped ESLint, Prisma validation/generation and shell syntax passed.
  Final explicit TypeScript passed (separate from Next build, which skips type validation).

## Live gate

Pending candidate prepare and real Test acceptance. No deployment completion claimed.
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
