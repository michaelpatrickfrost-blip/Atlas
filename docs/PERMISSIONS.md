# Permissions

## Model

Capability-based. A **capability** is a string `<module>.<entity>.<action>`
(e.g. `sales.quote.approve`). A **role** (`Role` model, org-scoped) holds a
`capabilities: string[]`. A **membership** (user ↔ org) has one or more
roles via `RoleOnMembership`. `getSession()` resolves the union of all
capabilities across a membership's roles into `session.capabilities: Set<string>`.

**Never write `if (session.role === "admin")` or any hardcoded role-name
check in application code.** Always check a capability:

```ts
import { can, assertCapability } from "@/core/permissions/check";

if (can(session, SALES_CAPABILITIES.quoteApprove)) { /* ... */ }

// In a server action / route handler, fail closed:
assertCapability(session, SALES_CAPABILITIES.quoteApprove);
```

## Declaring capabilities

Each module declares its capability constants (see
`src/core/permissions/capabilities.ts` for Core + Sales) and lists them in
its manifest's `capabilities` array, so they're discoverable in the
role editor. `accessCapability` on the manifest is the single capability that
gates whether the module appears in navigation at all.

## Customer Master's sensitive sections

`CUSTOMER_CAPABILITIES` splits by section rather than one
`customers.manage`: `commercial.*`, `credit.*`, `tax.*`, `bank.*` (further
split into `read`/`reveal`/`manage` — reading masked bank values is a
different capability from revealing full ones), `contacts.manage`,
`addresses.manage`, `documents.*`, `restricted_notes.*`. A salesperson's role
can read commercial and credit summaries without ever gaining tax or bank
access. See [`docs/CUSTOMER_MASTER.md`](./CUSTOMER_MASTER.md).

## Standard roles

`STANDARD_ROLES` (`src/core/permissions/capabilities.ts`) is seeded into
every new organisation by `prisma/seed.ts`: `admin` (every capability),
`sales_user`, `sales_manager`, `finance_manager` (credit/tax/bank read+manage,
bank reveal, but no commercial.manage — the inverse shape to `sales_user`).
Company administration provides reusable role presets and granular controls, individual membership grants/denials, and company restrictions. See [Company administration](COMPANY_ADMINISTRATION.md).

## Enforcement points

- **Navigation**: `getNavigableModules()` / `getModuleNavigation()` filter by
  capability — a user never sees a link they can't use.
- **Pages**: every page calls `requireSession()` then `assertCapability()`
  for the capability it requires, before querying data.
- **Server actions**: same pattern, as the first two lines, before any
  mutation.
- **Tenant isolation** is a separate, always-on boundary: company workspaces query
  by `session.organisationId` from the signed session. Atlas Admin actions require
  an independent platform capability and validate the selected company server-side
  before accessing its records or changing its settings. Customer actions cannot
  select another tenant.

## Adding a new role or capability

1. Add the capability constant to the owning module's capabilities object.
2. Add it to any `STANDARD_ROLES` entries that should have it by default.
3. Use `can`/`assertCapability` wherever the capability gates something.

## Errors

`assertCapability` throws `Error("FORBIDDEN: missing capability \"...\"")`.
`src/app/(app)/error.tsx` catches this (and `UNAUTHENTICATED` from
`requireSession`) and renders a plain-language `EmptyState` rather than a
stack trace.

For customer users, membership grants are applied after role unions, then individual denials and company workspace restrictions. Active Atlas staff receive the full standard company capabilities after these restrictions, under the explicit current staff policy below. Session versions revoke older JWTs after suspension, recovery, or explicit session revocation. Management-group oversight scopes employees without granting capabilities.

## Manager level

Company administrators turn a manager level on per app under Company administration → Manager level. The switch does not grant a permission. It decides when an existing manager permission is required:

- CRM: `sales.pipeline.manage` is required to push a prospect or move a deal. `sales.prospect.assign` assigns the prospect and tasks.
- Finance: at or above the company limit, or in another currency, the approval route must include someone with `finance.approval.decide`. That person cannot approve their own document.
- Customer Service: `service.case.approve` is required to resolve or close a complaint, or a query linked to an order at or above the limit. Agents can keep working the case.

## Atlas staff and customer users — 7 October 2026

Independent PlatformAdministrator grants control Atlas Admin. Every atlas.* entry
from customer roles or membership overrides is ignored. Active Owner, Administrator
and Employee staff currently have full platform and selected-company capabilities,
per Michael's explicit instruction. Customer permissions and restrictions remain
unchanged. Tenant scoping and private record ownership still apply. Atlas staff
can navigate to and use implemented apps regardless of company enablement or
entitlement switches; those switches remain authoritative for customer users and
cross-app data/integration visibility. Staff app use never changes a company's
module settings. Staff switches and portal mutations are audited under the staff
identity. See
[Atlas Admin](ATLAS_ADMIN.md) for recovery and offboarding.

## Connected service work — 7 October 2026

Customer cases use existing `service.case.*` capabilities, including the additional
restricted-case permission. Internal tickets use `tickets.ticket.*`, cross-team
queries use `service.ticket.*`, and Tickets queue setup uses `tickets.queue.*`. Enabled/entitled app gates and tenant scopes apply on the
server for customer users. Atlas staff retain app availability, while cross-app
source gates remain in force. Restricted receiving queues also require permitted
ownership/membership;
manager capability never bypasses that boundary. Requesters see permitted replies,
not receiving-team internal notes. File downloads re-check parent access.
Case assignment respects both explicit profile grants and denials.

Service creates Finance draft credit requests but cannot approve/post them.
Independent Core approval and separate Finance posting capabilities remain required.
Recovery benefits similarly require independent approval before Sales redemption.
Configuring a queue or catalogue service never grants unrelated business permissions.
See [service work security and behavior](modules/SERVICE_WORK_DESK.md).

User creation policy (9 October 2026, supersedes the 8 October business-user
restriction): independent Atlas OWNER/ADMIN grants include
`atlas.business_users.create`. Those administrators may create business users
and first business administrators. EMPLOYEE and customer role grants cannot.
Atlas staff creation remains limited to Michael's authenticated staff identity.
All original selected-company/capability validation remains in place. Customer
roles cannot manufacture platform grants. See [Atlas Admin](ATLAS_ADMIN.md).

Studio uses `studio.definition.read`, `.edit` and `.publish` independently.
Editing does not grant publication, and none grants domain permissions. Every
reference resolves through its owner's permission and tenant module availability.
Atlas setup selects an active customer with independent staff authorisation;
customer requests cannot supply another organisation. Published versions and
activation revalidate dependencies; hiding controls is supplementary only.

Ordinary additional-field runtime uses the existing authenticated server Session,
not a Studio authoring grant. Auth privately stamps genuine resolved Session objects
with membership/user identity and revocation versions; client/metadata copies do
not inherit that authority. A short Serializable transaction refreshes membership,
roles, account versions, active customer and enabled/entitled source modules before
owner operations. The read compiler preserves the published plan/checksum while
checking field read permissions independently of authoring/write permissions.
Callers still must authorise the native record and both current and written field
policies, including reference targets, before returning values. Disabling Studio
authoring does not disable published business rules. Current/history internal readers additionally enforce both schema policies, native
record and written reference target access and stored plan/fingerprint integrity.
Retired/obsolete values are bounded history only. No client endpoint or native write
hook is provided by this foundation.

The internal ordinary value save service independently requires current native
extend and current/written field write authority, with reference-owner access and
native/configuration/extension/slot revision checks. It stores one immutable value,
CAS pointers and Audit atomically. Repeating an operation ID confirms its original
audited request and current access; it reports historical completion rather than
claiming that the recorded value is still current. A first valid target save may
close the exact rollback window in that transaction without granting publication
or source-data access. Staff retain a purpose-bound support Audit under their real
membership. Source freezes, final native states and private queues remain enforced.
Native create/save integration is gated on required-field coverage in Phase2B4d.

## Section-level access profiles — 10 October 2026

Company Settings is gated by existing company administration capabilities; normal
business permissions open personal Settings. Profiles are canonical company Roles,
with app/section RWA presets and individual selections over every implemented
capability. Admin shortcuts include sensitive operations; source checks remain
authoritative. Profile/member saves compare snapshots under audited Serializable
transactions and reject stale catalogues, foreign IDs and self-admin loss.
Mixing profiles preserves personal exceptions. See Company administration above.

## Studio field migration data previews

`studio.test.live_data` is a separate explicit grant for live business data in
Studio previews. It is registered for granular access management, excluded from
standard roles, staff uplift, role auto-sync and all app access presets. No existing
profile or membership is backfilled. A server-loaded active Customer company must
match the actor; Test samples still require publish plus current/written field
read/write policies and native owner access. Production field previews require the
live-data capability even for fields without an extra sensitivity restriction.
References require the exact written entity contract and target owner read
authorisation inside the shared server transaction. Configuration access alone
grants no data authority. This policy helper is a prerequisite; see the Studio
ledger for collection/preview implementation and runtime evidence.

Studio native-operation bridges can refresh the genuine Session inside an existing
Serializable transaction; no nested transaction, configuration-authoring grant or
native record authority is implied. Owner-required facts remain native read/private/
revision scoped. A distinct owner creation proof supports only the record actually
inserted in that transaction; create capability never becomes existing-record read
or manage access. Additional field/reference grants and atomic required coverage
remain mandatory before enabling conditional/native field workflows (d3–4).

## Current owner creation coverage — Phase2 contracts, 10 October 2026

Optional hashed `record.initialisation.acceptedFieldVersions` declares the exact
registered legacy typed-field entity versions the current owner approves for new
records. Current resolution uses the newest owner policy and fails unsupported
coverage without fallback. It grants no ordinary native read/manage access.
Optional `requiredFacts.initialQuery` references a distinct same-owner creation-
capability transactional query. Only explicit proof-bound invocation supplies the
opaque INSERT token in server context; generic/JSON invocation cannot. Owner query
rechecks NEW/version1/requester/tenant/source before projecting approved facts.
New conditional plans seal both read and initialization query hashes; metadata
sealing does not require an author's native Create grant. Explicit field grants and
independent reference reads remain mandatory. Tickets v7 is additive; v1–6 and
ordinary fact-query hashes/migration ranges unchanged. Consolidated central creation/
staged-value/SQL rollback proof is VERIFIED live6b3d03f (candidate/public). Native
hooks and conditional publication remain outstanding.

## Resulting-field validation — internal Phase2 runtime, 10 October 2026

`validateResultingFieldRequirements` reads actual staged native/typed rows in the
caller's owning Serializable transaction. It validates all active requirements,
including omitted targets, after current/pinned/written policies and exact native/
extension revisions. Unconditional required remains mandatory; false/zero count
as present. Optional unconditional private fields impose no unrelated value reads.
Creation-only paths require the genuine same-INSERT current owner proof, approved
legacy versions and sealed initialization-query meaning. They never borrow native
Read/Manage or use the proof for an existing reference target/other record. Returned
fingerprints/revisions remain internal; any validation failure must propagate through
the owning transaction and roll back native/typed/Audit changes. No native hooks,
initial writer or conditional publication dispatch is enabled yet: common lock order,
canonical coverage and reviewed rollback-window closure remain integration gates.

Candidate requirement checks may inspect a server-loaded immutable tenant version
before activation while preserving the real active pointer. They use actual native/
typed values and current/pinned/written/reference rights. This internal d3d helper
does not grant publication or establish complete canonical coverage on its own;
ordinary v1 gateways remain closed and unchanged. Not enabled in live authoring.
