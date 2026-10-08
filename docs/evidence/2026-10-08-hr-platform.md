# HR platform live acceptance — 8 October 2026

Final runtime `e20c5c8547146d806f2fad6e3a1f34bfc2405ada` deployed to
https://atlassystem.online. Initial expansion `94e1c34`; accessible form labels
`10ba54f`; final release preserves concurrent Service repair `7079baa`.
Only reviewed HR changes were released from the managed checkout; unfinished
canonical-project edits were excluded.

## Release checks

- Final full suite: **893 passed / 22 integration tests skipped**, 141 files passed,
  three skipped. Focused HR suite: **30 passed** across six files. Primary integration's
  same 30 tests passed. Skipped tests are not passes.
- Production build, separate strict TypeScript, scoped ESLint and whitespace passed.
  Server build/restart and public HTTPS login returned 200; service active and checkout
  clean at final runtime. No full build of unrelated unfinished primary edits is claimed.
- Additive migration `20261008160000_hr_platform`; **98 migrations current**. New HR
  records/tenant-qualified relations and optional document dates/version/state preserve
  existing employees, document references, payroll, profile permissions and history.
- Private database dumps and configured service-evidence archives retained under
  administrator backups: `atlas-pre-deploy-20261008-140555`,
  `atlas-pre-deploy-20261008-141006`, `atlas-pre-deploy-20261008-141419`.
  Historical backups retained. No local business database/cache added.

## Live workflow proof

`ATLAS_HR_TEST=1 npx tsx scripts/check-hr-platform.ts` ran on the final central
server using ordinary password sign-in, explicit capability grants and two isolated
synthetic `isTest` companies. **All 36 assertions passed**:

- HR opens on its operational home and links records, learning and reports.
- A vacancy saves with a company hiring owner. Applicant links to that vacancy;
  interview without date rejects, then real interview and offer stages save.
- Existing Add employee creates one onboarding Employee with real checklist tasks.
  Hiring hands the accepted offer to that same record; no duplicate employee/login.
  Closed recruitment retains its onboarding link and decision history.
- Required learning saves against canonical Employee. Overdue filter finds it;
  actual completion/expiry save centrally with a new version. Expired qualification
  appears in renewal work; a stale save cannot replace newer evidence.
- Employee document issue/expiry dates save; renewal filter finds it. Archive retains
  readable history rather than deleting the record.
- Workforce report counts two already-employed people independently from one onboarding
  employee. Employee page links its learning and renewal registers. Legacy filtered
  `/people` URLs retain their directory meaning.
- Home, Recruitment, Training, Documents and Reports fit a 390px viewport. Final Home
  screenshot visually reviewed for readable hierarchy, wrapped cards and grouped nav.
  Manager journey has zero browser runtime errors.
- Central self-service query returns only the linked employee's training. Employee
  reading cannot query confidential applicants. My learning shows own qualification
  without a colleague's record. Another company cannot read applicant contact data.
- Direct read-only and foreign-company writes reject without changes. Executable evidence
  links reject without records. Disabling HR rejects actions and removes generic source
  reads. Hire/training audits are central with no false stale-write success entries.

Each attempt's finally block suspended its exact synthetic companies, disabled fixture
memberships, cleared grants, revoked sessions and rotated credentials. Central records/
audit retained. No real company records were changed by acceptance fixtures.

## Corrections and boundaries

First run stopped before vacancy creation on an ambiguous select label. Explicit field
labels improve accessibility and allow exact browser locators. Second run saved through
offer, then stopped because Department matched both directory filter and employee dialog;
fixture now scopes that control to the dialog. A separate TypeScript check caught an
unsupported option in the new accessibility tests; corrected and strict check passed.
All 36 assertions were rerun on final runtime; no permission guard was weakened.

See [HR platform scope](../modules/HR_PLATFORM.md) and [official product comparisons](../plans/HR_PLATFORM_RESEARCH.md).
Recruitment is internal; course content, automatic competence enforcement, file uploads/
signatures, benefits, public job boards, historical FTE/turnover and unattended notifications
are not delivered here. Payroll, Scheduling, conduct and private notes keep their owners.
Company tenant tests do not establish dedicated physical company server environments.
