# Customer Master

The canonical customer identity in Atlas. One `Party` row per real-world
company or person — Sales, Finance, Service and every future module relate
their own records to it rather than inventing their own `XCustomer` table.
This is Core, not a module: it has no enable/disable state and doesn't appear
on the Apps screen, because every module depends on it existing.

## Where it lives

- Data model: `prisma/schema.prisma` (`Party` + `Contact`, `Address`,
  `CommunicationDestination`, `CustomerCommercialSettings`,
  `CustomerCreditProfile`, `PaymentTerm`, `TaxRegistration`, `BankAccount`,
  `DirectDebitMandate`, `Document`, `Note`)
- Services: `src/core/customers/` (queries, commands, duplicate detection,
  tax/bank helpers, search, attention, overview aggregation)
- UI: `src/app/(app)/customers/` (list, quick-create, the 5-tab record page)
- Permissions: `CUSTOMER_CAPABILITIES` in `src/core/permissions/capabilities.ts`

## One identity, many sections

Identity (name, status, account manager, ...) lives directly on `Party`.
Everything else is its own 1:1 or 1:many table — `CustomerCommercialSettings`,
`CustomerCreditProfile`, `TaxRegistration[]`, `BankAccount[]`, etc. — so each
section is independently section-editable (§35 of the brief: never one giant
edit form) and so sensitive sections can carry their own capability without
gating the whole record.

## Module extension points

Customer Master never hardcodes "Sales" or "Finance" logic. A module
contributes to a customer record through typed providers on its
`ModuleManifest` (`src/core/modules/types.ts`), the same pattern as
`attentionProvider`/`searchProvider`:

- **`customerOverviewProvider`** — metrics, quick actions, and an optional
  `creditExposure` figure, aggregated by `src/core/customers/overview.ts` and
  rendered on the Overview tab and in the record header's action buttons. See
  `src/modules/sales/services/customer-overview.ts` for the reference
  implementation (12-month sales, open quotes/orders, exposure from confirmed
  orders).
- Core's own customer search (`src/core/customers/search.ts`) and attention
  provider (`src/core/customers/attention.ts`, credit holds) run
  unconditionally — they aren't optional contributions, because Customer
  Master itself isn't optional.

Disabling Sales removes its Overview contribution and quote/order data from
the customer record automatically — Customer Master keeps working with zero
special-casing.

## Credit, honestly

`CustomerCreditProfile` stores customer-level *configuration* (limit, hold
state, payment term/method, review date). It never stores a balance or
exposure figure — those are calculated by whichever module tracks money
movement, and handed to Customer Master as `creditExposure` on their Overview
contribution. Today only Sales exists, so exposure is "confirmed orders not
yet invoiced" — an honest proxy, not a real receivables figure, and it's
documented as such in `customer-overview.ts`. A Finance module would replace
or add to this.

## VAT: verified means verified

`TaxRegistration.validationStatus` is `NOT_VERIFIED` until something real
happens to it. Today that's a human clicking "Mark as manually verified"
(`validationSource: "manual"`, capability `customers.tax.manage`) — Atlas
never claims an automated check occurred when it didn't. The schema has a
`VERIFIED_BY_SERVICE` status and a `validationSource` field specifically so a
future HMRC/VIES integration has somewhere to write real verification
without a migration.

## Bank data: masked by default

`BankAccount` rows store raw values — **this environment has no KMS/secrets
infrastructure to encrypt them at rest**, which is a real limitation, not an
oversight; a production deployment must add field-level encryption or a
vault-backed secrets store before handling real customer bank details. Every
read path masks (`src/core/customers/bank.ts`) except an explicit,
capability-gated (`customers.bank.reveal`), audited reveal
(`revealBankAccount` in `commands.ts`, called on demand by
`RevealBankAccount`, a client component — full values are never in the
page's initial server-rendered payload).

## Duplicate detection

`findPossibleDuplicates` (`src/core/customers/duplicate-detection.ts`) checks
name/trading name, registration number, normalised tax number, and contact
email domain. It never merges automatically — it surfaces candidates with an
"Open existing" link and a "Create anyway" override, both in the quick-create
form (`src/app/(app)/customers/new/quick-create-form.tsx`). There is no merge function yet. `Party.parentPartyId`/`children` supports the
customer ownership hierarchy; linking accounts does not merge their records.

## Multi-company

Deferred. Atlas is single-company today (one `Organisation` = one tenant).
`CustomerCommercialSettings` and `CustomerCreditProfile` are already 1:1 with
`Party` rather than embedded fields specifically so a future multi-company
model can key an equivalent table on `(partyId, companyId)` without
restructuring identity — but that join doesn't exist yet, and nothing in this
slice should be read as supporting per-company overrides.

## Permissions

See `docs/PERMISSIONS.md` for the general model. Customer Master's
capabilities (`CUSTOMER_CAPABILITIES`) split by section so a role can read
commercial data without touching credit/tax/bank, and bank access splits
further into `read` (masked) / `reveal` (unmasked, audited) / `manage`
(create/edit). `STANDARD_ROLES` includes a `finance_manager` role that can
read/manage credit, tax and bank but not commercial settings — the opposite
shape to `sales_user`, which can read commercial/credit but has no tax/bank
access at all.

## What's deliberately not built

- Quote/order *creation* forms (Sales' Overview actions link to the existing
  list views instead of a form that doesn't exist)
- A role editor UI (roles are seeded and editable only via direct DB access
  today — same limitation as Core's existing permission system)
- File upload for `Document.url` (metadata model exists; no storage backend)
- Saved list views, column configuration, bulk export on the customer list
- A real VAT/company-registration verification service integration
- Customer merge, uninstall/data-deletion flows
- Multi-company overrides (see above)

## Building customer hierarchies

Customers → Map, and the Who's who section on a customer, show the group, the
businesses inside it, the branches under those, and the people on each account.
People who report to someone on the same account sit underneath that manager.
A person who reports to someone at another company in the group is labelled
with that manager and company.

**Move up** lifts an account to its grandparent, or makes it independent when
its parent is already at the top. **Move down** places it under the account
drawn above it at the same level. Its own branches and people move with it.
**Group** points the account at a parent. **Invoice customer** is who receives
the invoice; choosing this account means it is invoiced itself. **Reports to**
points a person at a manager in the same group. Linking an existing account
still uses **Build hierarchy**. **Account type** keeps the free-text customer
category.

Cycle-producing choices are excluded in the builder and in the manager list.
Saving a parent, a move or a manager checks the company, the edit or contact
capability, and cycles, then writes an audit row. The invoice customer is the
account’s trading link. The map and the customer record load the first 500
accounts.

Module overview providers fail independently: a failed contribution displays an
explicit “summary unavailable” metric without a fabricated zero or module actions.
Other summaries, shared customer details and hierarchy remain accessible. This is
resilience to unavailable/incompatible module data, not proof of that module’s
working server integration.
