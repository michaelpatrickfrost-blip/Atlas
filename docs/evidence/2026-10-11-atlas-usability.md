# Atlas usability, website, Guides and production holding — live evidence

11 October 2026. Live URL: https://atlassystem.online.
Runtime and control revision: `a0fd2d01876103f879bb82f78873816227bc64ef`.
Rollback runtime: `b6610512138ba40e16a294fd4e296016d75d03b5`.

## What changed

- Crisp white editorial Atlas introduction: real Plan/Make/Deliver illustrations,
  animated charts and connections, softer scene/detail entry, moving workspace
  strip, scroll reveals, manual scene controls, Pause and reduced motion. Private
  existing-user access; no signup, checkout or subscriptions.
- Stable responsive spacing: product panel, message and controls retain separate
  space; headers, calls to action, menus, tabs and operational forms wrap cleanly.
- 37 practical Guides: searchable by task, permission/app filtered, with preparation,
  real steps, linked source workspaces, outcome, blockers and terminology.
- Procurement: clearer document labels, filters that retain context, PO selection,
  invoice-only outstanding/age semantics and human percentage tax entry.
- Maintenance: single required equipment-or-vehicle selection, actual due queues,
  permission-scoped fleet lookup, full-register counts, search/filters and paging.
- Quality: accurate outstanding action/effectiveness-review queues and actual
  counts, with clearer containment/correction/verification next actions.
- S&OP: visible process stages and working New cycle disclosure/focus, preserving
  the existing review, immutable-version, approval and publication safeguards.
- Production: final good output enters canonical BLOCKED PROD-HOLD stock. Warehouse
  can collect part or all into an active yard/storage location. Same-transaction
  stock posting, tenant foreign keys, version checks, repeat keys, active Quality
  hold refusal and immutable collection history prevent duplicate/early availability.
  Holding/transit quantities stay out of availability, S&OP and rich MRP netting.

## Verification actually run

Full bounded-worker unit/component suite: 300 files and 2,197 tests passed; 3 files/
22 tests skipped. This checkpoint preceded the last concurrent manufacturing
refinements. Integrated domain tests then passed 5 files/62 tests; final build,
explicit TypeScript and scoped ESLint passed. Last phone-only CSS changes passed
build/scoped lint and the real responsive acceptance. Full ESLint had zero errors
and 29 image/unused warnings; this task's unused stock import was subsequently
removed. Prisma validation/client generation, generated 395 model descriptors/918
native actions, shell syntax and Git diff checks passed.

Candidate and public HTTPS acceptance both passed under the deployment locks:

1. Website animations run, scenes switch, panel/message/controls do not overlap,
   tabs support keyboard switching, expanded detail and responsive navigation work,
   reduced motion stops animation, and private destinations require sign-in.
2. Real Shop Floor completion creates a held batch. Availability excludes it.
   Partial collection books stock into the yard; a stale open form is refused.
   Replay creates no additional collection. An active Quality hold refuses booking.
   Final collection conserves the lot and balances and records collection history.
3. Actual Maintenance work creation selects exactly one asset; S&OP New cycle opens
   and focuses the form; native purchasing starts with PO and accepts percentages.
4. All 240 authorised registered destinations and Guide links return successfully.
   Critical workspaces and Guides at 1440/820/390/320 have no root overflow or
   operational client exceptions. Original QA membership/permissions are unchanged.
5. Both exact temporary companies, records, memberships and record screenshots are
   removed in cleanup.

The first candidate's checker incorrectly expected the phone menu at tablet width.
The checker was repaired to follow visible navigation; production was unchanged
while that candidate failed. Earlier queued deployments stopped at ancestry when
concurrent accepted releases advanced. They made no candidate/data changes.

Private server evidence: `/tmp/atlas-usability-candidate-kRhM8p` and
`/tmp/atlas-usability-public-YVhfdr`. Anonymous website screenshots remain; synthetic
record screenshots were removed. Live browser visual proof is a separate local
output, not company data.

## Test-data cleanup

After public acceptance, the explicitly authorised protected atomic sweep deleted
486 historical companies marked CUSTOMER + isTest and their scoped records/private
files. It verified zero Test companies and zero pending file deletions, retention
of every ordinary/internal company, and retention of the existing staff identity.
Cleanup audit: `cmv42oh4n0000uxd5ys59qa1s`.

Backups are retained: deployment `atlas-pre-deploy-20261011-165925`, candidate
`atlas-pre-usability-candidate-20261011-170059`, public/cleanup
`atlas-pre-usability-public-20261011-170222` under the operator's private backups.
Ordinary records, audit, rollback runtime, private configuration and backups were
preserved. No local business database/cache was created; none was found in this
worktree. The unused rejected artwork was removed.

## Practical limits

This verifies the scoped usability and production handoff release; it does not
establish every ERP master-spec feature or external-provider integration. Existing
module coverage documents remain authoritative. Production execution continues
to use whole units, older completed orders are not silently restaged, and regulated
lot release/WIP valuation/repeated production receipts remain separate coverage.
Permission regressions plus actual existing staff acceptance were used; the 240
route sweep is not a simulation of every possible custom access profile or action.

## Follow-up: software-card layout correction

The user's live screenshot revealed software-card internals squeezed into a row by
the shared global summary style. The earlier hero geometry/root-overflow checks
did not catch this, since the website clips horizontal overflow. Website card
summaries now explicitly stack their content; the final wide desktop card keeps
its intentional grid. Website summaries use their existing custom indicator
without an additional shell arrow.

Local production build and diff checks passed. Browser inspection at
1440/820/390/320 verified all six cards have readable paragraph widths and no
internal clipping/overlap; expanded cards and phone FAQ were visually checked.
No business fixtures or data writes were needed. Pinned deployment and live
section verification follow.
