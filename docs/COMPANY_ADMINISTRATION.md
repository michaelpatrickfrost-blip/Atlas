# Company administration

Atlas Admin and company administration run on the live server at https://atlassystem.online. The 3 October installed-Mac evidence below is historical. See [Atlas Admin](ATLAS_ADMIN.md) for the current platform portal and staff policy.

## Settings and access profiles — 10 October 2026

Company Settings is an administrator control centre with a searchable overview,
company identity/brand, working rules, users, access profiles, security, apps and
permitted integrations/import/audit destinations. Only core.modules.manage,
core.users.manage, core.roles.manage or core.it.manage opens this workspace;
each destination still requires its own native capability. Ordinary business read,
write, audit-read or personal-email permission does not make someone an administrator.
Their Settings utility opens /profile/settings: own details, password, sessions and
assigned profile names. /profile remains My work; /profile/email lists only the
current user's personal mailboxes and their history, requiring core.email.personal.

Access profiles reuse company Role records. Create empty profiles or copy an
existing company profile; rename by ID. Select one profile in a searchable list,
then expand each app into its native source sections. Apply None/Read/Write/Admin
per app or section, or fine-tune individual permissions. Read includes native
view/self-service permissions; Write adds ordinary changes; Admin includes sensitive
operations, approvals, publication/activation and payroll completion. Not every
section has a separate native Read operation; unsupported presets are disabled.
Levels are configuration shortcuts, not new permissions or a role-name bypass.
Existing profiles/grants are retained, including explicit combinations that display
as Custom. The catalogue includes all implemented capability declarations once.

Multiple profiles combine on a member; individual grants and denials refine that
union. Mixing profiles preserves explicit and unsaved exceptions. Company restrictions
still take precedence, and enabled/entitled source/private-record rules remain.
Editors keep failed drafts, provide reset and warn before discarding changed profiles.
Server-rendered snapshots include role names/capabilities and membership/profile
catalogue versions. Save compares them in an audited Serializable transaction;
stale editing requires reload instead of overwriting someone else's changes.
Self-admin removal and self-membership editing remain blocked. Membership access
changes revoke older company sessions. Duplicate profile names are rejected. The legacy role-only assignment endpoint
requires the same user/role administration and snapshot checks; it cannot bypass
the new editor. Expected validation feedback is returned explicitly so production
forms retain useful errors and their draft; private driver/framework errors stay
generic. Profile, membership and own-name changes are audited transactionally.

Business-user creation remains an independent Atlas administrator workflow per the
9 October policy; company profiles do not create platform grants or provisioning
rights. Company administrators retain account suspension/recovery/session/employee
linking within existing capabilities. No new schema or business-record datastore.
Deployed and publicly accepted at runtime 1646316 on 10 October 2026.
[Settings acceptance evidence](evidence/2026-10-10-settings.md) records candidate/
public workflows, source boundaries and checks; current runtime status lives in
.ai/CURRENT_STATE.md.

## Available workflows

- [x] Search users by name/email, filter by role or account status, open an individual account.
- [x] Atlas administrators provision business users; company administration manages existing accounts. The former company-user setup-code creation flow is superseded by the 9 October platform policy.
- [x] Reusable roles, empty/duplicate role creation and workspace presets: None, Read, Write, Admin.
- [x] Expand granular capability controls. Approvals, bank reveal and company administration are reserved for Admin presets.
- [x] Multiple roles per user and explicit individual grants/denials. Company restrictions override both.
- [x] User account screens show effective visibility, roles, linked employee record, account status and last sign-in.
- [x] Link/unlink existing HR employee records with both user-management and employee-management permissions.
- [x] Suspend/restore accounts and revoke company sessions without deleting their records.
- [x] Administrators issue 30-minute recovery codes after confirming their own password. Codes are hashed in storage, expire and are claimed atomically once. No codes/passwords in audit payloads or generic read API.
- [x] Self-service password changes require the current password and invalidate older sessions. Profile provides company session revocation while preserving the current session.
- [x] Company name, brand, workspace access, sales approval rules, logistics dispatch, manager level and HR company defaults. Only a company administrator (`core.modules.manage`) can change them. Delegated company administrators can manage only the sections their native capabilities allow; ordinary users open their own profile.
- [x] Logistics, under Company administration, chooses whether a dispatched order is marked delivered at the same time. Off, delivery stays a later confirmation. On, the delivered quantity is recorded and Finance receives a draft invoice dated that day.
- [x] Brand holds the customer-facing identity: logo, colour, trading and legal name, address, company and VAT numbers, phone, email, website, payment details, terms and a footer. Invoices, credit notes, debit notes, quotations, order acknowledgements and proformas print that identity. PNG and JPG logos print on the document. WEBP and GIF stay in the workspace. A near-white colour is refused. Saving Workspace keeps the brand text already stored.
- [x] Manager level is a per-app switch. CRM managers assign tasks and push prospects. Finance managers sign off high values. Customer service managers sign off complaints and high-value queries. Turning it off leaves the existing permissions in place.
- [x] Registered company profile: legal name, company and VAT numbers, address, country, time zone, default currency, fiscal year and language. Stored on the company record, separate from customer accounts.
- [x] Workspace access switches for each implemented area, including manufacturing. Turning an area off overrides roles and individual grants. Records stay in place. Only a company administrator can change the switches.
- [x] Management groups reuse shared WorkTeam identity: several departments and managers per group, several groups per manager. Assigned managers with management capability gain department scope in My Team and scheduling. Group assignment grants no capabilities and does not unlock payroll. Own approvals remain prohibited.
- [x] Tenant and capability checks on every administration command, private server-side audit entries, session/version checks on each request.

## Security boundaries

User access administration cannot edit the current administrator's own membership. Role editing preserves their access-administration capabilities. Platform permissions remain independent of company roles.

Company administrators cannot reset platform administrator credentials or globally shared accounts belonging to multiple companies. Recovery of those accounts needs the account owner's self-service flow or a separate platform recovery process.

Recovery follows [OWASP password recovery guidance](https://cheatsheetseries.owasp.org/cheatsheets/Forgot_Password_Cheat_Sheet.html): random credentials, secure hashes, expiration and one-time use. Codes are shared manually through an approved private channel; there is no configured email service. Passwords have at least 12 characters and avoid bcrypt's 72-byte truncation boundary.

Password resets and changes increment the global account authentication version. Company session revocation and suspension increment the membership session version. Restoring membership does not revive old sessions.

## Atlas Admin portal — 7 October 2026

/atlas is now Atlas Admin: company accounts, profiles, entitlements, company users
and individual permissions, a separate Atlas team, admin activity, archive/restore
and full company exports. All active Atlas staff currently have full platform and
selected-company permissions as Michael explicitly requested. Customer roles cannot
grant platform access. Atlas platform tools and links do not appear in business
Home/Apps, headers, settings or search, even during staff support. Company settings,
Manage apps and native imports retain their existing permissions.
See [Atlas Admin](ATLAS_ADMIN.md) for scope and boundaries.

Data setup retains the nine CSV templates and transactional import. Brand setup
now targets the selected company. Company administrators keep the smaller customer,
product and price import under Company administration.

## Remaining integrations

- [ ] Automated email invitations and recovery delivery.
- [ ] Shared-account invitation acceptance.
- [x] Separate platform staff recovery through Atlas Admin. Company administrators cannot issue staff credentials.
- [ ] MFA, SSO, SCIM, detailed device/IP session inventory.
- [ ] Department identity records and controlled rename across employee data. Current department names are derived from HR records and selected by company administrators.
- [x] Deploy/install the local Mac app and secure server data API; verify native-client administration and management groups.

Validation covers role exceptions, self/foreign-tenant restrictions, setup/reset credential handling, concurrent one-use redemption, session revocation, and multi-department oversight without implicit permission grants.

Verified: 208 tests passed (five skipped), production build passed using the isolated `/tmp/atlas-company-admin-preview` source snapshot, and scoped lint passed. Browser checks confirmed user search/filter controls, role Read presets, linked employee profile, multi-select management-group fields, and 390px mobile layouts without horizontal overflow. Existing company permissions were not changed during browser verification.

## Installed release — 3 October 2026

Installed `/Users/michael/Applications/Atlas.app` (Desktop shortcut retained). Private API release: `/opt/atlas-test/data-releases/admin-management-20261003-v1`, active through `atlas-test` on loopback port 3100. No business UI routes run on the server. Database backup and previous release retained under `/var/backups/atlas-test/admin-management-20261003`; previous Mac bundle is `~/Applications/Atlas-before-admin-20261003.app`.

Both desktop and data-service production builds passed. Isolated server acceptance passed account setup, one-use recovery, permission and tenant enforcement, management groups, session revocation, suspension/resumption, and HR team/leave/rota/timesheet checks. Live API acceptance passed after activation. Installed native app signed in against central data and opened Company administration and Management groups. Blocwrite process IDs and online states were unchanged. Email invitations, MFA and SSO remain outstanding.

User creation exception (8 October 2026): only Michael’s authenticated
`kickablur@icloud.com` Atlas staff identity can provision staff/company users or a
new company’s first administrator. Existing capability and tenant checks still run;
other user management remains separately permissioned. See [Atlas Admin](ATLAS_ADMIN.md).
