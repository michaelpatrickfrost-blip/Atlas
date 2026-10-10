# Atlas software retention

10 October 2026: Michael authorised redundant development/release-copy cleanup,
keeping Atlas and central business data. He also explicitly requested avoiding
unnecessary dump files. Read-only audits/software-output retirement create no
business-data dump. Required migration/release recovery backups remain mandatory.

## Confirmed cause and completed cleanup

| Location | Before | After cleanup |
| --- | ---: | ---: |
| VPS root free space | 0 (100% used) | 168 GiB (14% used) |
| `/opt/atlas-releases` | 181 GiB / 130 release directories | 21 GiB, source/static/history retained |
| Mac master project `/Users/michael/Desktop/RP SYSTEM` | 32 GiB | 5.6 GiB |
| Mac generated `build/` | 29 GiB | 2.6 GiB |
| Current Mac browser launcher | 3.3 MiB | Preserved, 3.3 MiB |

A deployed runtime was ~2.2GiB including dependencies and compiled output. The
PostgreSQL cluster measured140MiB. The large footprint was accumulated software
copies; no customer-data deduplication or record purge was needed/performed.

Under both original exclusive locks, the utility initially retired118 inactive runtime
output sets, then retired one newly superseded runtime after the concurrent release
finished. Legacy maintenance dependency/non-static build copies were also retired
after process/link checks. Final audit eligible runtime output sets0; root168GiBfree. Emergency relief first removed dependency copies from inactive
74fab2d/1f2ab97. It preserves source, config links, old browser static assets and
renames `.atlas-ready` to `.atlas-ready.retired-<timestamp>`. Current and immediate
previous runtimes plus `/proc`-pinned candidates remain intact. On Mac,59 generated
output/package paths retired, including four obsolete installed native packages;
current browser launcher/Desktop shortcut, master source/history/config and
concurrent worktrees remain. No tracked master source was deleted/reset.

A concurrent release legitimately changed live runtime from1bf0e2c to97ceb35 during
final verification. Retirement correctly refused to run while its locks were held.
Final health/current97ceb35 and previous1bf0e2c matched, login HTTP200, atlas active,
PG18main online. Health confirms runtime availability; it does not prove another
task's feature acceptance. No Studio feature migration/deployment occurred here.

## Operational policy

Keep current, immediate rollback and all process-pinned release candidates runnable.
Older source/static/config/evidence remains; duplicated dependencies and non-static
Next output may retire. Only full-SHA/bootstrap release folders are eligible. Do
not follow source/environment/storage/output-parent links. Any uncertainty fails
closed. Busy locks mean defer; never recreate or bypass the release locks.

The root-owned live operator utility is installed at
`/opt/atlas-maintenance-tools/prune-releases.{sh,mjs}`. Use documented audit/prune
commands in DEPLOY. The checked-in deployer calls it only after public acceptance
and previous-pointer update. That hook becomes effective on the next compatible
release including it; operator cleanup has already run live. Retired old source
requires an isolated rebuild and full acceptance before activation. Keep deployment
history; do not interpret retired readiness as a runnable rollback.

Do not generate unnecessary ad-hoc dumps or repeated local business exports. Check
existing valid recovery backups first; mandatory migration/fixture/release backups
remain. Customer data/files/backups are not cleanup candidates. Backup rotation
needs explicit recovery coverage and active-job checks before removal.

## Verification and evidence

Six focused filesystem tests PASS: live/rollback/process pins and directory
boundaries; source/static/external data preservation; idempotency; pointer/root
rejection; symlink isolation; changed-parent rejection before readiness mutation.
Node/bash syntax, scoped ESLint, production build and strict post-build TypeScript
PASS. Actual Linux prune PASS; nonblocking busy-lock refusal observed; Mac cleanup
completed59 output/package paths with0 in-use paths removed.

No SQL/schema/Prisma changes or migrations. No resets, business record deletion,
restore, local business database or app restart by the cleanup operation.

Local operator evidence: `/tmp/atlas-release-retirement-live.txt`,
`/tmp/atlas-retention-final-prune.txt`, `/tmp/atlas-retention-final-health.txt`,
`/tmp/atlas-mac-software-cleanup.{txt,json}`, `/tmp/atlas-release-retirement-tests.txt`,
`/tmp/atlas-retention-{build,types}.txt`, `/tmp/atlas-retirement-lint.txt`.
Durable server inventory is `/opt/atlas-maintenance-backups/software-retention-20261010.txt`.
The repository records the results so temporary logs are not required for recovery.

## Studio handoff

Capacity is resolved. Phase2 f4b1 remains IMPLEMENTED pending real nested Test SQL
and full candidate/public native checks; forward0007 unapplied. Recheck live ancestry,
locks/status and capacity before the exact pinned Studio release; do not claim the
Phase2 gate or visual designer is complete. See the Studio implementation ledger.
