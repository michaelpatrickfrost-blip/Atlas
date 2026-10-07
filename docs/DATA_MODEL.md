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

- **Party — the Customer Master.** Any real-world company or person a
  business deals with (`kind: COMPANY | PERSON`). This is the one
  customer/supplier/contact identity in Atlas — see
  [`docs/CUSTOMER_MASTER.md`](./CUSTOMER_MASTER.md) for the full model
  (`Contact`, `Address`, `CommunicationDestination`,
  `CustomerCommercialSettings`, `CustomerCreditProfile`, `PaymentTerm`,
  `TaxRegistration`, `BankAccount`, `DirectDebitMandate`, `Document`, `Note`).
  Modules relate their own records to a `Party` rather than inventing
  `SalesCustomer`, `FinanceCustomer`, etc. — Sales' `Opportunity`, `Quote` and
  `SalesOrder` all reference `Party` this way.
- **ModuleState** — per-org enable/disable flag for a module id. The module
  catalogue itself (capabilities, nav, manifest) lives in code, not the
  database. Customer Master itself is Core, not a module — it has no
  `ModuleState` row.
- **AuditEntry** — who did what to which entity, with before/after JSON.
  Written via `writeAudit()`; never store secrets/sensitive payloads here.
- **Activity** — human-readable feed entry, written via `writeActivity()`,
  rendered on Home. Carries an optional `partyId` (independent of
  `entityType`/`entityId`) so it can also power the unified customer Activity
  tab without Customer Master knowing each module's entity shape.

## Money

Stored as integer minor units (`Int`, e.g. pence) + an ISO currency code
string. Never store money as a float. Format with `formatMoney()`
(`src/core/shared/money.ts`).

## Sales (reference module)

`Opportunity` → optional `Quote` (with `QuoteLine[]`) → optional
`SalesOrder`. All three reference `Party` and `Organisation`. Enum fields
(`OpportunityStage`, `QuoteStatus`, `SalesOrderStatus`) model the status
language from `docs/DESIGN_SYSTEM.md`.

## Customer Service, Tickets and Queries

Customer Service retains `ServiceCase` linked to canonical `Party`, Contact and
verified source purchase context. Shared Core `ServiceWorkItem` represents distinct
TICKET / QUERY kinds; Query origins reference accessible cases or work items.
`ServiceWorkEntry` preserves append-only history; `ServiceQueue` retains membership,
restricted access and configured SLA/catalogue definitions. `ServiceFile` stores
opaque metadata for bytes held only in private server storage. `ServiceRecovery`
and `ServiceRedemption` retain independently approved, bounded benefits and explicit
Sales applications. `ServiceKnowledge` stores reviewed article versions.

Migration `20261007190000_service_work_desk` is additive: it also adds case context,
clock/merge fields and CSAT integrity fields, preserves historical cases/department
work and backfills historical comment timestamps. Canonical Finance documents,
Logistics returns, Sales orders, Inventory positions, Quality NCRs and CSAT responses
remain authoritative; Service does not duplicate their ledgers. See
[connected service desk](modules/SERVICE_WORK_DESK.md).

## Adding a module's entities

1. Add models to `prisma/schema.prisma`, prefixed `<module>_` for table names
   (`@@map("fleet_vehicles")`).
2. Relate to `Party`/`Organisation` where the entity represents a
   relationship with a tenant or a real-world company/person — don't
   duplicate either.
3. Add an index on `organisationId` (and any other frequently-filtered
   column).
4. Run `npm run db:migrate` and commit the generated migration.

## Local development

See [`docs/LOCAL_DEVELOPMENT.md`](./LOCAL_DEVELOPMENT.md) — `npm run dev:all`
runs a real local Postgres (no Docker/Homebrew/cloud DB needed) and applies
migrations automatically. For a shared/staging/production Postgres instance,
set `DATABASE_URL` and run:

```bash
npm run db:migrate
npm run db:seed
```
