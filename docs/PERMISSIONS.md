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
unchanged. Tenant scoping, private record ownership and module gates still apply.
Staff switches and portal mutations are audited under the staff identity. See
[Atlas Admin](ATLAS_ADMIN.md) for recovery and offboarding.
