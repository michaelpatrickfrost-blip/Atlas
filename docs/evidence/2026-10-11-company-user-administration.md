# Company user administration — 11 October 2026

The finished company-admin account and access workflows are deployed at
https://atlassystem.online. Exact immutable runtime:
**c607e12b3a4f6896b88fb19c2ee15c8c2f67e7c0**. Public release health and the original
candidate/public acceptance revision brackets match. Previous accepted runtime
**1acc63c6d0b3f62f6cf515029d89490f7f92c2a8** remains available for rollback.

Company user administrators can edit company-only users' names/sign-in emails,
assign passwords, issue one-use recovery codes, suspend/restore accounts, revoke
company sessions and link existing employee records. Identity/password changes
require the administrator's own password and an unchanged account snapshot. Email
and password changes invalidate older authentication/recovery codes. Self, shared
and Atlas staff credentials remain protected. Audit contains no passwords/codes.

Reusable profiles remain native company Roles: create empty/custom profiles, copy
or rename them, or start from Customer service manager, Logistics coordinator or
Invoice viewer. Profiles can combine on a member, with personal grants/denials.
Every implemented native capability is listed under its app and source section.
App/section presets, plain-language explanations, inheritance/exception labels,
sensitive/selected/exception filters, company-blocked labels and unsaved review
make the effective configuration easier to inspect. Workspace-entry prompts require
an explicit choice; licensing, private-record and domain rules still apply.

The Customer service manager example was assigned through the real editor. Its
user viewed a real synthetic invoice, created/saved a procurement REQUEST and
opened that request in the own-document Spend list. Banking was denied and another
user's request was hidden. Finance workspace entry alone no longer exposes Service
credits; section permissions and tenant/project/creator scope are enforced in native
queries. No schema or grant migration, local business database/cache or platform
provisioning change was introduced.

Both candidate and public acceptance passed:

- Personal Settings redirects, own-name save, password feedback and owner-only mail.
- Create/copy/rename/reload profiles, mixed sections and stale/self/foreign guards.
- Multiple profiles, individual grants/denials, session revocation, company
  restrictions and foreign-company member denial.
- Account name/email edits, wrong admin password/stale rejection, password
  assignment, actual sign-in and one-use recovery, including replay denial.
- Customer service profile assignment/review, invoice view, procurement save/own
  view, banking denial and other-user isolation.
- User account tabs, profiles and personal Settings at desktop/tablet/phone;
  Home/Apps at four widths, keyboard/touch navigation and platform-tool exclusion.
- Zero browser errors and no horizontal overflow. Exact synthetic Test companies
  suspended, sessions revoked and Audit history retained in finally.

Checks: 16 focused files/122 assertions, strict TypeScript, scoped lint, production
build, shell syntax and diff whitespace passed. The final three-class phone header
correction passed strict types/page lint/build and the complete central candidate
and public pipeline. Desktop profile/password screenshots and both final candidate
and public phone screenshots were visually inspected. Repository-wide and opt-in
database integration suites were not run; central acceptance supplies real workflow
proof. Public /login returns 200. Inactive-runtime cleanup was safely deferred by the
existing retention guard; accepted runtime and rollback remain intact.

Private evidence retained on the server:

- Backup: atlas-pre-deploy-20261011-155956.
- Candidate: /tmp/atlas-settings-candidate-zx4A3e.
- Public: /tmp/atlas-settings-public-uba86z.
- Home: /tmp/atlas-home-menu-check-Rq4W6t and /tmp/atlas-home-menu-check-G6LYD3.
- First complete acceptance of 1acc63c: backup atlas-pre-deploy-20261011-155056,
  candidate /tmp/atlas-settings-candidate-JemTBe and public
  /tmp/atlas-settings-public-BqcaSX.

Earlier candidates stopped safely on checker selector/persistence-wait issues before
activation; each checkpoint/backup is preserved in CURRENT_STATE.md. Accepted live
Dashboard and Studio source is retained. Shared-main Dashboard evidence integration
changes documentation only; runtime files remain byte-identical to accepted c607e12.

Recovery codes are shared manually through a private channel; automated email
delivery is not configured. Company administration manages existing users; user
provisioning stays in the independent Atlas administrator workflow.
