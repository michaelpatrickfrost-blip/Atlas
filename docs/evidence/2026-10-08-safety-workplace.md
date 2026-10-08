# Safety workplace register — 8 October 2026

Live at https://atlassystem.online/safety/workplace. Runtime release `88c2e8b`,
following `ba2d17c` (register) and `286653f` (accessible labels/search permissions).

## Delivered

- Register exposes all 29 existing workplace record types with search and review
  filters. Guided findings, location, responsible contact/team, follow-up,
  evidence references, review date and editable detail use existing SafetyRecord.
- Completion requires recorded evidence; stale timestamps protect concurrent
  work. Unknown historical JSON remains; audit metadata writes atomically.
- Sensitive creation/editing requires health-surveillance access. Register/detail
  and search require entity read access and server-side tenant scope. Active
  module entitlement is checked on mutations. No new employee/equipment stores.
- Home/Safety Today includes overdue reviews; completed records leave due work.
  Safety search no longer queries risks/incidents/permits without their relevant
  capability. Restricted workplace results remain filtered.
- Live mixed-type testing exposed legacy per-type `SFR` counters producing the
  same company-wide unique reference. New records share `workplace_record` / `WSR`;
  existing records/references are preserved.

## Checks actually run

Clean managed release worktree: production build, strict `tsc --noEmit`,
Safety-scoped ESLint and whitespace checks passed. Full Vitest: 772 passed,
22 integration tests skipped. Primary checkout integration: 33 focused Safety
checks passed. Global ESLint was run and fails on 16 existing errors and 24
warnings outside Safety; those unrelated files were excluded from this release.

Server-only `scripts/check-safety-workplace.ts`, normal login/cookies and real
Chromium browser against public HTTPS: **20 assertions passed**:

- Create guided fire-drill findings/date centrally; atomic creation audit.
- Overdue record visible on Safety Today and in filtered register.
- Saved responsibility restored when editing.
- Missing completion evidence rejected with draft retained and no status write.
- Completion evidence accepted; completed work removed from overdue register.
- Two-window conflict preserves newer record and retains rejected draft.
- Different types use distinct references; evacuation record is sensitive.
- Main content fits 390px viewport; manager journey has no browser runtime errors.
- Same-company reader can read ordinary record but cannot edit it.
- Another-company manager cannot read or mutate the record.
- Ordinary/foreign readers cannot see restricted detail or register results.
- Direct action request cannot bypass read-only capability.

Phone screenshot of the synthetic evacuation record was visually inspected:
readable wrapping, contained content and clear editing disclosure.
Initial browser attempts identified ambiguous implicit select labels (fixed with
explicit accessible names), then the genuine mixed-type reference collision.
The final complete acceptance run passed after both corrections.

Only explicitly marked synthetic test tenants were used; every attempt suspended
its tenants, revoked memberships/sessions, rotated test credentials and retained
central records/audit. No customer records were changed or local business store
created. Existing safety hold/permit/approval gates were not relaxed.

## Deployment evidence

Each deploy used `ATLAS_RELEASE_COMMIT` with the committed, pushed clean release.
VPS migrations: 96 present, none pending. Production build succeeded, service
healthy and public `/login` returned HTTP 200. Private backups retained:

- `/home/administrator/backups/atlas-pre-deploy-20261008-123919.dump`
- `/home/administrator/backups/atlas-pre-deploy-20261008-124500.dump`
- `/home/administrator/backups/atlas-pre-deploy-20261008-124832.dump`

Each has its matching `-service-files.tar.gz` evidence archive. Historical
backups and earlier deployment evidence were preserved.

No compliance certification, clinical record, emergency monitoring, automatic
responsibility notification or physical per-company server isolation is claimed.
Evidence fields are references/notes; this change does not add file upload.
