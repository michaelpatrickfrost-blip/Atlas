# User provisioning and Danielle setup — 8 October 2026

Application runtime `2fe33ad` is live at https://atlassystem.online. The deployment
preserves central records, prior releases and backups. No schema changes.

Michael requested direct password setup for a new Atlas Employee and restricted
adding users to his own account. All five runtime provisioning entry points now
require Michael's signed-in Atlas staff identity after their existing capability
guards. Matching controls are hidden for others, including new-company first-user
creation. Other staff/company management capabilities remain intact.

New Atlas staff use a bcrypt-hashed password chosen in the create form, with the
existing password policy and immediate normal sign-in. Repeated own-password entry
and setup-code redemption are removed from creation only. Existing-account promotion
retains explicit consent and keeps the existing password. Recovery, staff changes,
archive/export and cleanup retain their own-password confirmation.

## Verification actually run

- Production build; separate strict TypeScript; scoped ESLint; whitespace: pass.
- Full suite: 953 passed, 22 integration skips, 149 files passed, 3 skipped.
- Release-focused regressions: 36 passed. Shared canonical integration: 33 passed.
- Live create form created the requested Danielle account as active Atlas Employee.
  Normal browser sign-in with the user-requested credentials succeeds. Credentials
  are omitted from this evidence, source, command arguments and project memory.
- Final server/browser harness: 20 assertions passed. Confirms active internal
  membership, hash storage, no pending setup code, secret-free Michael-attributed
  audit, useful duplicate feedback, sign-in and hidden staff/company creation,
  five direct forged creation attempts without accounts, actual selected-company
  workspace navigation and retained user administration reading.
- Private service journal confirms five server-side `Only Michael` rejections.
  Michael's password hash remains unchanged.
- Server deployment build/restart and public HTTPS login 200 passed. Existing 99
  migrations current. Backup `atlas-pre-deploy-20261008-150343.dump` and private
  matching `-service-files.tar.gz` retained on the VPS.
- Disposable dependencies refreshed from lockfile after a copied dependency tree
  lacked Playwright. Initial live harness stopped at exact role-label selection
  before creation; selector scoped. Next run created and signed in but stopped at
  raw company-action cookie extraction; final harness uses the actual live control.
  Final run passed completely. Subsequent source commits affect harness/docs only.
- Historical broad Admin acceptance was updated for Michael-only creation but was
  not rerun; focused live acceptance above covers the changed provisioning behavior.

Owned changes are integrated into the canonical working repository without replacing
concurrent contributors' edits. No local business database or automatic cache added.
