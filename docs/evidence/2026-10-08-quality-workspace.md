# Quality workspace live evidence — 8 October 2026

Runtime release `9c98eab85021618680577337e80c2f392a03839b` deployed to
https://atlassystem.online using the pinned clean release procedure. Previously
finished Tickets fixes (`62196fa`) retained; concurrent unfinished primary edits
excluded. No local business database/cache created.

## Release and data

- Reviewed additive migration `20261008130000_quality_workspace` adds optional
  NCR owner/target, JSON workspace default and company-owner-target index.
- Deployment preserved private PostgreSQL dump and configured service evidence:
  `atlas-pre-deploy-20261008-131137.dump` and matching `-service-files.tar.gz`
  under administrator backups. Historical backups retained.
- Server production build/restart succeeded; atlas service active; HTTPS login 200.
- Server `prisma migrate status`: 97 migrations, schema up to date. Checkout clean.

## Verification actually run

- Clean compatible release: production build, separate strict TypeScript, scoped
  Quality ESLint, whitespace check. Full suite: 817 passed, 22 integration skipped
  (130 test files passed, three skipped). New focused tests: 36 passed across four
  files, also passed after owned changes were integrated into the canonical repo.
- Server-only `ATLAS_QUALITY_TEST=1 npx tsx scripts/check-quality-workspace.ts`
  used ordinary login/capability grants and isolated synthetic `isTest` companies.
  All 22 assertions passed through live browser interactions and direct actions:
  1. Rich issue context, owner and resolution date persist centrally.
  2. Search/assigned-to-me/overdue issue filters.
  3. Stale investigation rejected; newer record protected and draft retained.
  4. Major closure blocked without verified corrective action.
  5. Owned action and effectiveness criterion persist.
  6. Assigned overdue action appears on register.
  7. Premature verification rejected with version rollback.
  8. Ineffective work prevents closure.
  9. Ineffective action reopens, completes and verifies with review evidence.
  10. Evidence-based closure freezes editing.
  11. Reasoned reopening retains history.
  12. Independent numeric/visual/pass-fail results create correct failure, hold and
      receiving-source NCR.
  13. Inspection detail/history readable.
  14. Empty manual check rejected without partial inspection.
  15. Manual failure creates hold and issue.
  16. Issue workspace fits 390px viewport.
  17. Manager journey produces zero browser runtime errors.
  18. Read-only same-company view excludes editing.
  19. Foreign-company view excludes issue details/editing.
  20. Direct actions cannot bypass read-only/company boundaries.
  21. Foreign product linkage rejected without record creation.
  22. Central audit history retained.
- Mobile screenshot visually reviewed: legible wrapped navigation, owner/date,
  workflow steps and record cards without main-content horizontal overflow.
- Harness finally suspended exact synthetic companies, disabled memberships,
  revoked session versions and rotated test credentials; audit/records retained.
  No real company records modified by the acceptance journey.

## Scope and limits

See `docs/modules/QUALITY.md` and `docs/plans/QUALITY_WORKSPACE_RESEARCH.md`.
Evidence is notes/references, not uploaded signed documents. No certification,
full supplier programme, calibration, independent approval or complete QMS parity
is claimed. Recorded holds do not prove automatic inventory quarantine succeeded;
closure never releases holds. Skipped database integration tests are not passes.
