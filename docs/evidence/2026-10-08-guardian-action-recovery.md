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

## Release evidence pending

Candidate actual runtime challenge, backed-up activation and public original-form
verification are required before FIXED. The historical team stream report
`cmuzoku170000lod5qx9koaa9` still lacks the original action identity and outcome;
this independent reproduction does not prove that render digest. Already-open tabs
retain their older handler until reloaded. This change provides safe rejection and
manual recovery, not continuous execution of arbitrary in-flight business writes.
