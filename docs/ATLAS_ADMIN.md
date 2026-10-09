# Atlas Admin

Atlas Admin at `/atlas` replaces the basic console. It manages companies
subscribing to Atlas (`Organisation`). A company's own customers remain Core
`Party` records and are not duplicated here.

## Standalone console — 9 October 2026

Michael clarified that Atlas Admin is administration only. Its routes live in
`src/app/(admin)/atlas`, outside the business `(app)` shell. The modern blue/white
console uses the supplied ribbon branding, responsive Admin navigation, selected-
company tabs and staff sign-out to `/19811171adminlogin`. Business Apps, global search,
notifications, chat and My work do not mount in Admin. Customers retain their
business shell and `/business/<slug>/login`. Explicit audited support-workspace
entry is preserved; it is not part of the console's ordinary navigation.
Legacy desktop action identifiers are aliases of the same guarded server functions,
so moving the route group does not break installed callers or grant new privileges.

## Private staff entry — 9 October 2026

The unlisted staff address is `/19811171adminlogin`, with recovery beneath it at
`/recovery`. Customer sign-in has no Admin link and cannot authenticate staff.
Retired `/atlas/login`, `/atlas/reset-password`, legacy platform-recovery query
links and anonymous Admin console requests return not found without revealing
the new address. Signed-in staff retain `/atlas` and its capability checks.

Login, recovery, Admin pages and Admin API responses have `X-Robots-Tag: noindex,
nofollow, noarchive, nosnippet`, no-referrer and private/no-store policies; HTML
pages also have noindex metadata. No sitemap or robots.txt advertises the address.
Noindex requires compliant crawlers to read it and is not access control or an
immediate search-removal guarantee.

Atomic PostgreSQL counters allow 10 attempts per identity/network and 60 per
network in 15 minutes, across login/recovery, and survive app restarts. HMAC keys
store no email, IP or credentials. A missing limiter rejects login; unknown
accounts still perform bcrypt. Platform recovery cannot consume codes through
the generic customer page. The new screen supports password reveal, pending
state, accessible errors and desktop/phone layouts. Existing credentials and
independent staff permissions remain authoritative; MFA/SSO are not introduced.

## Staff and customer access — 7 October 2026

Michael explicitly requires Atlas administrators and employees to see and do
everything for now. Independent active Owner, Administrator and Employee platform
grants give all platform and standard company capabilities in the explicitly
selected workspace. Customer roles, overrides and restrictions never grant
platform access; their existing permission behavior is retained. Module availability,
tenant scoping, private record ownership, secrets and financial controls still apply.
Business-user creation is available to Atlas OWNER/ADMIN; staff-account creation
remains reserved to Michael as described below.

An internal Atlas team workspace provides independent staff sign-in. Existing
owners receive an internal membership in the additive migration. Opening a company
creates/restores the staff membership, switches the signed company session and
audits the operator's own identity. The top bar identifies the workspace and links
back to Atlas Admin. Staff never impersonate a customer. No customer grants change.

Atlas team maintains staff classification, name/email, active status and recovery.
Changes revoke global sessions and pending recovery codes. Self-access changes and
removal of the last active Owner are prohibited. Staff access/profile changes and
recovery require the requesting staff member's password. Only Michael can create or
promote staff, using his authenticated session. Existing identities require explicit
confirmation and keep their password/customer roles. New staff use the password
Michael sets and can sign in immediately. Classifications retain space for a future narrower
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
production accounts cannot be relabelled as disposable and wiped. Deleting an
individual Test company requires the exact company name; password confirmation is
intentionally omitted while Atlas is in its testing phase. Test cleanup at
`/atlas/cleanup` requires platform access, a reviewed company list, an exact count
confirmation, acknowledgement and the administrator’s own password.

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

## Separate administration and business sign-in — 9 October 2026

Atlas staff sign in at `/19811171adminlogin` and land in `/atlas`. The customer Studio
app at `/studio` is separate from staff setup at `/atlas/studio`; staff choose
an active customer there under their own audited identity. Company overview
shows its sign-in URL `/business/<slug>/login`, with matching password recovery.
The company URL selects an active membership in that exact business on the
server, with the submitted selector bound to the observed URL. Atlas recovery
lives at `/19811171adminlogin/recovery`. Generic customer login remains compatible for a single active company;
ambiguous multi-company login asks for the company's own address.

## User creation — 9 October 2026

Michael explicitly authorised Atlas administrators to create business users.
Independent OWNER/ADMIN grants include `atlas.business_users.create`; EMPLOYEE
and customer roles cannot create business identities. First company administrator
and existing business-user creation paths enforce that server guard after their
original capability checks. Business creation controls sit in Atlas Admin.
Only the signed-in `kickablur@icloud.com` identity with independent staff access
can create Atlas staff accounts; business-user permission cannot grant staff.

Atlas team → Add Atlas employee asks Michael for the employee's name, email, role
and sign-in password. New passwords use the existing 12–128 character/72 UTF-8 byte
policy and bcrypt hashing. Michael's authenticated session authorises creation;
there is no repeated request for his own password and no setup-code redemption for
new staff. Existing-account promotion needs its explicit checkbox, preserves the
existing password and revokes old sessions. Duplicate/invalid entries return useful
feedback without creating accounts. Audit never includes passwords or setup codes.
Staff access/profile changes, recovery, archive/export and cleanup retain their
own-password confirmation. This supersedes the previous staff setup-code flow.

## Bulk test cleanup — 8 October 2026

`/atlas/cleanup` selects up to 1,000 Test companies in one sweep. Review lists exact
names and record counts before an explicit permanent-delete confirmation. Ordinary
companies, the internal staff workspace and the current workspace cannot be wiped;
the Test designation stays fixed at creation. Selection names/versions are checked
again under company row locks. All selected database records delete in one
transaction, including indirect children, setup codes and posted/verified Test
finance records. Financial immutability remains enforced for ordinary companies
and for all updates; Test-only deletion requires the transaction-local wipe flag.

Shared/global user identities remain when referenced by other memberships, staff
grants or remaining database foreign keys. An internal audit event and a durable
platform cleanup run survive company deletion. Uploaded Service evidence is removed
after commit; remaining file keys survive storage/process failures and can be
retried from Cleanup history. Missing files count as already removed. Concurrent
retries use a version check. Existing backups and external hosted files remain.
This is an operator-selected sweep, not automatic retention or a reset of real
company records. Historical acceptance cleanup may now remove explicitly disposable
Test finance fixtures; retained earlier evidence is not silently purged.

## Connections

[Connections](CONNECTIONS.md) at `/atlas/connections` is the staff onboarding app: choose a company, download a section template, upload/review and attach canonical records. Thirteen sections include machines/work centres and draft Sales documents, with company-bound review, duplicate protection and import history. Destination app availability and creation policies remain authoritative.

## Private entry release verification — 9 October 2026

Runtime `1dafe165f97545829d96242b1846e87d9c1f42b4` activated and passed public
HTTPS acceptance after the same candidate checks. Real rejected/repeated login,
customer login/tenant selection, wrong-portal code preservation and correct-company
recovery, existing QA staff console/sign-out, desktop/phone layout and response
indexing policies passed. Existing staff credentials/grants were not changed;
correct staff password handling is unit-verified and the live staff checks use an
existing signed QA session. Isolated Test-company users were suspended afterward.
See CURRENT_STATE for private evidence/backups and the full-suite limitation.
