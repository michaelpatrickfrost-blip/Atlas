# Data Model

Full source of truth: `prisma/schema.prisma`.

## Tenancy

`Organisation` is the tenant. Every tenant-scoped table carries
`organisationId` and is always queried filtered by it (never trust a
client-supplied id — it comes from the resolved session).

## Identity

`User` → `Membership` (per-org) → `Role` (org-scoped, holds a
`capabilities: string[]`) → `RoleOnMembership` (join table). A user can have
multiple memberships (multiple orgs); a membership can have multiple roles.

## Shared entities

- **Party** — any real-world company or person a business deals with
  (`kind: COMPANY | PERSON`). This is the one customer/supplier/contact
  concept in Atlas. Modules relate their own records to a `Party` rather than
  inventing `SalesCustomer`, `FinanceCustomer`, etc. Today Sales'
  `Opportunity`, `Quote` and `SalesOrder` all reference `Party` — Finance,
  Service and others would do the same later rather than adding their own
  customer table.
- **Address**, **ContactMethod** — attached to a `Party`.
- **ModuleState** — per-org enable/disable flag for a module id. The module
  catalogue itself (capabilities, nav, manifest) lives in code, not the
  database.
- **AuditEntry** — who did what to which entity, with before/after JSON.
  Written via `writeAudit()`; never store secrets/sensitive payloads here.
- **Activity** — human-readable feed entry, written via `writeActivity()`,
  rendered on Home and (eventually) record pages.

## Money

Stored as integer minor units (`Int`, e.g. pence) + an ISO currency code
string. Never store money as a float. Format with `formatMoney()`
(`src/core/shared/money.ts`).

## Sales (reference module)

`Opportunity` → optional `Quote` (with `QuoteLine[]`) → optional
`SalesOrder`. All three reference `Party` and `Organisation`. Enum fields
(`OpportunityStage`, `QuoteStatus`, `SalesOrderStatus`) model the status
language from `docs/DESIGN_SYSTEM.md`.

## Adding a module's entities

1. Add models to `prisma/schema.prisma`, prefixed `<module>_` for table names
   (`@@map("fleet_vehicles")`).
2. Relate to `Party`/`Organisation` where the entity represents a
   relationship with a tenant or a real-world company/person — don't
   duplicate either.
3. Add an index on `organisationId` (and any other frequently-filtered
   column).
4. Run `npm run db:migrate` and commit the generated migration.

## Known deferred infrastructure

This environment has no reachable PostgreSQL instance (no local Postgres,
Docker, or `npx prisma dev` support — the latter needs Node 22+ for its
bundled SQLite dependency; this environment runs Node 20). `npx prisma
generate` runs and the schema/client compile correctly, but `prisma migrate
dev` and the seed script have not been executed against a live database in
this environment. Set `DATABASE_URL` to a real Postgres instance and run:

```bash
npm run db:migrate
npm run db:seed
```
