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
its manifest's `capabilities` array, so they're discoverable for a future
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
Organisations can edit role capabilities later (no UI for that yet — direct
`Role.capabilities` update).

## Enforcement points

- **Navigation**: `getNavigableModules()` / `getModuleNavigation()` filter by
  capability — a user never sees a link they can't use.
- **Pages**: every page calls `requireSession()` then `assertCapability()`
  for the capability it requires, before querying data.
- **Server actions**: same pattern, as the first two lines, before any
  mutation.
- **Tenant isolation** is a separate, always-on boundary: every query filters
  by `session.organisationId`, which can only come from the signed session
  cookie — never from a request parameter.

## Adding a new role or capability

1. Add the capability constant to the owning module's capabilities object.
2. Add it to any `STANDARD_ROLES` entries that should have it by default.
3. Use `can`/`assertCapability` wherever the capability gates something.

## Errors

`assertCapability` throws `Error("FORBIDDEN: missing capability \"...\"")`.
`src/app/(app)/error.tsx` catches this (and `UNAUTHENTICATED` from
`requireSession`) and renders a plain-language `EmptyState` rather than a
stack trace.
