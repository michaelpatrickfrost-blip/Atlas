# Guardian action recovery — 8 October 2026

## Confirmed original outcome

On 6ef3cdf, the real Atlas account form for a newly created disposable central
Test company received a whitespace-only name and an unsaved plan. Save account
rejected; the plan/name reset to stored defaults. Central company and audit were
unchanged. Corrected explicit Save updated exactly that company and one audit.

The same browser kept Atlas account and Service query forms open while a separate
loopback service actually switched 6ef3cdf → retained 6028b1f. Both old forms
rejected with an unrecognised Server Action. PortalActionForm erased its plan;
shared ActionForm retained its query draft. Both exposed a technical error. Each
attempt made exactly one POST; no company/query change or history was written.
After restoration, intentional reload/re-entry/save persisted IN_PROGRESS, exact
fixture owner, version 2 and exactly one reason entry. Zero browser errors.

Private staging: `/tmp/atlas-action-switch-wqGPQT/browser.log`, 16:01 UTC.
Private DB/Service archive backup: `atlas-pre-action-test-20261008-160122`.
Production pointer was unchanged. Exact Test company suspended; synthetic session
and credential versions revoked; central history retained. Existing QA unchanged.
New central staff report: `cmuzq6drq0000oud569cvjp0m`.

## Change and checks

PortalActionForm now delegates to the shared form lifecycle: disable while pending,
reset only on success, preserve rejected inputs. Shared unknown-action handling
explains that changes were not saved and asks users to copy/reload/re-enter. No
automatic mutation replay or browser business draft storage. Existing permissions,
provisioning identity checks and central action implementations are unchanged.

Three Portal tests fail on original source. Final local full suite: 963 passed,
22 integration skips; 152 files pass / 3 skip. Focused 13 regressions, production
build, separate strict TypeScript, focused ESLint, shell syntax and whitespace pass.
The initial typecheck stalled on duplicate ignored generated-client scratch files;
regenerated only the isolated worktree client and corrected QA null narrowing.

Combined with corrected operational-app main dbd5c91: 1,007 tests pass / 22 skips
(154 files pass / 3 skip); regenerated client, strict TypeScript and production
build pass. Seven focused tests also pass in the shared canonical repository.

## Deployed proof

Prepared exact immutable runtime `2bda1142adf664ebc4c04ff2aad5bd7cdcc82b81`.
Actual loopback candidate → retained 6ef3cdf → candidate passes all four groups:
rejected account draft retained with company/audit unchanged; corrected Save
persists once; both forms kept open across the switch retain drafts and explain
copy/reload with exactly one POST each and no central changes; intentional restored
reload/re-entry/query save persists exact status/owner/version and one reason entry.
Zero browser errors. Sealed release files and production pointer unchanged.
Private staging `/tmp/atlas-action-switch-Kq9v1f`, 16:51 UTC.

Activated the prepared candidate at the required public server. Exact public
release SHA and retained previous dbd5c91 runtime verified. Live original account
validation test retains its draft and leaves company/audit unchanged; corrected
real Save persists once. Query reload/re-entry/save retains exact IN_PROGRESS,
owner, version 2 and one reason history entry. Zero browser errors. Test companies
suspended and all synthetic credentials/sessions revoked; existing QA unchanged.

Private central PostgreSQL and Service evidence backups retained:
`atlas-pre-deploy-20261008-160914` (prepare),
`atlas-pre-action-test-20261008-165146` (staging),
`atlas-pre-deploy-20261008-165324` (activation), and
`atlas-pre-action-live-20261008-165412` (public fixture), plus original 160122.
No schema or permission change in this repair. Concurrent corrected operational
app code/migration through dbd5c91 was retained; its separate provider/workflow
acceptance is not certified by this fix.

After activation, 35 rendered pages and 35 actual Apps open/close controls pass,
zero browser/chunk failures and all business writes blocked. The initial attempted
activation probe refused configuration because its explicit opt-in was omitted;
the corrected probe ran **after activation**. Do not claim continuous public
browser proof during this activation. Atlas and Guardian timer active, worker
success/fresh heartbeat, anonymous staff inbox redirects 307 and brief rejects 401.

New action-recovery report `cmuzq6drq0000oud569cvjp0m` marked FIXED only after
this deployed original reproduction. All four queue pages read (80 active before
closure); 17 new generic action/render reports fully inspected, retained NEEDS_AI
with exact digest/time, source, attempted work, negative-acceptance context and
missing original control/profile/state evidence. No permission/validation guard
weakened or historic report guessed fixed.

The historical team stream report `cmuzoku170000lod5qx9koaa9` still lacks the
original action identity and outcome; independent recovery proof does not close
that digest. Already-open pre-fix tabs retain their original form handler until
reloaded. This change provides safe rejection and manual recovery, not continuous
execution of arbitrary in-flight business writes. Owned canonical files and memory
sections integrated without changing unrelated parallel work.
