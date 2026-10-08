# Atlas Admin

Atlas Admin at `/atlas` replaces the basic console. It manages companies
subscribing to Atlas (`Organisation`). A company's own customers remain Core
`Party` records and are not duplicated here.

## Staff and customer access — 7 October 2026

Michael explicitly requires Atlas administrators and employees to see and do
everything for now. Independent active Owner, Administrator and Employee platform
grants give all platform and standard company capabilities in the explicitly
selected workspace. Customer roles, overrides and restrictions never grant
platform access; their existing permission behavior is retained. Module availability,
tenant scoping, private record ownership, secrets and financial controls still apply.

An internal Atlas team workspace provides independent staff sign-in. Existing
owners receive an internal membership in the additive migration. Opening a company
creates/restores the staff membership, switches the signed company session and
audits the operator's own identity. The top bar identifies the workspace and links
back to Atlas Admin. Staff never impersonate a customer. No customer grants change.

Atlas team maintains staff classification, name/email, active status and recovery.
Changes revoke global sessions and pending recovery codes. Self-access changes and
removal of the last active Owner are prohibited. Grants, profile changes and recovery
require the requesting staff member's password. Existing identities can be promoted
only with explicit confirmation and keep their password/customer roles. New staff
receive a one-use setup code. Classifications retain space for a future narrower
policy; every active classification currently has full access.

## Company workflows

- Search/filter active, suspended and archived accounts, with pagination.
- Create a company and first administrator. Manage subscription records and app
  entitlements. Payment collection and automatic subscription expiry are not configured.
- Edit registered identity, currency, locale, time zone and financial year. Brand
  setup targets the selected company rather than the operator's current workspace.
- Search/filter users; create users with selected roles; edit name/email, roles and
  granular capabilities; view effective access; suspend/restore and revoke sessions.
- Platform identities are managed through Atlas team. Shared identities change
  their global profile/password through self-service; their company permissions
  can still be managed in the company access editor.
- Reissue setup/recovery codes after administrator password confirmation. Codes
  are hashed, valid for 30 minutes and atomically claimed once. PasswordReset.purpose
  separates staff recovery from ordinary company recovery. Company administrators
  cannot reset platform staff or shared identities.
- Admin activity records account, access, recovery, archive, export and workspace
  changes. Passwords and codes never appear in activity payloads.

User profile changes revoke sessions and unused recovery codes. Archived accounts
remain read only until restored. A company's test designation is fixed at creation:
production accounts cannot be relabelled as disposable and wiped. Existing test
wipe requires platform access and exact-name confirmation.

## Offboarding and full export

Archive requires the exact company name, reason and requesting staff password. It
sets ARCHIVED, records time/reason, revokes all company membership sessions and
invalidates unused setup/recovery codes. All records/documents/history remain
intact and exportable. Operators cannot archive their current workspace or the
internal staff workspace. Restoration returns to SUSPENDED; Account access must
explicitly become Active. Old sessions and codes never resume. Subscription status
is retained independently.

The company download is gzip-compressed NDJSON: header, table records, attachments
and final manifest. Catalog inspection covers company-scoped base tables and
follows child-to-parent foreign keys for indirect children/junctions. Shared users
are included only through this company's memberships. Platform grants and recovery
records are excluded. Passwords, service credentials and authentication tokens are
omitted, including matching nested JSON keys. The manifest lists counts and excluded
tables/columns. Bytea documents retain PostgreSQL hex encoding; external server
attachments are base64 with SHA-256 checks. External document URLs remain references;
remotely hosted content is not fetched.

PostgreSQL Repeatable Read provides a consistent database snapshot
([PostgreSQL isolation documentation](https://www.postgresql.org/docs/current/transaction-iso.html)).
Archive first when customer writes must stop. Exports run on demand in bounded
server memory, with no server disk cache. The authenticated POST checks platform
capability, Origin/Host, operator password and exact company name, and returns
private/no-store attachment headers. A 250 MB uncompressed limit and 120-second
transaction bound fail the whole request without a partial file. Larger accounts
need a managed export. Missing/corrupt stored attachments also fail rather than
silently omitting content. Audit records generated counts, not export contents.
Browser confirmation means download initiated, not disk save completed. This is
a portable handover rather than a SQL restore backup.

No automatic deletion/retention schedule, email delivery, MFA, SSO or customer
impersonation is introduced. Backups are preserved. Release and live acceptance
evidence belongs in `.ai/CURRENT_STATE.md`.

## Employee creation feedback — 8 October 2026

Adding Atlas staff requires the signed-in administrator's existing Atlas password.
The new employee chooses their own password with the generated one-use setup code.
Incorrect password, invalid identity/role and existing/duplicate-account errors are
returned as explicit form results so production does not hide them. The form retains
entered employee details for correction and disables fields during submission.
Unexpected server failures use a generic retry message; capability checks remain
server-side and no access is granted on validation failure.
