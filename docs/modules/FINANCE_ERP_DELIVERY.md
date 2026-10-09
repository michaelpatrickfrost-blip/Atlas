# Finance ERP continuation — 7 October 2026

The [223-section request](FINANCE_ERP_REQUIREMENTS.md) is preserved verbatim and
extends the original [80-section request](FINANCE_SOURCE_REQUIREMENTS.md).
This release delivers connected accounting controls and operational workflows.
It does not close the entire ERP specification. Existing Approvals, Customer
Master, Sales, Service credits, Inventory, Manufacturing, MRP, S&OP and Plan
integrations remain in place; no module or historical financial record is removed.

## Accounting ownership and design

Finance continues to own purchasing, supplier financial extensions, legal-entity
books, AR/AP, settlements and the GL. Party, Product, Project, Site, employees and
operational events retain their existing canonical owners. Core approvals remain
the shared routing/decision service. Existing Finance providers in the module
manifest are retained, including the business-planning and Service-credit providers.
No parallel customer/supplier master, local business database or cache is added.

Posting keeps integer minor units, decimal rates/quantities, transaction amounts,
base amounts, source key, versioned approval, legal entity, period and dimensions.
New journals retain the original exchange rate and separate accounting/document/tax
dates. Missing legacy provenance is explicitly displayed as unknown; historical
journals and amounts are not rewritten. Exact source retries return the existing
posting; changed evidence under an existing fingerprint is rejected. Balanced source
translation may create only its calculated rounding difference on an explicit profile.

The new migration adds configuration and evidence fields, append-only collections,
period-overlap protection, unique active posting profiles and stronger posting checks.
Database posting validation checks both currencies, entity/period/date, account
availability, currency restrictions and required/prohibited dimensions. Existing
immutability triggers remain. Serializable command retries cover serialization
conflicts; business validation failures do not get silently retried or bypassed.

## Implemented in this release

| Area | Working behaviour / primary paths |
| --- | --- |
| Settings | `/finance/settings`: legal registration, fiscal start month, existing books, configurable typed posting profiles, account groups and posting flags, currency restrictions, dimension rules, department/cost-centre values, period creation and overlap prevention. Site/Project reference canonical records. |
| Period control | Existing close checklist and OPEN/SOFT_CLOSED/CLOSED/LOCKED states retained. Source exceptions are configurable for on-hold periods; existing AP exception is preserved. Closed/on-hold reopening requires a reason and independent versioned Core approval. Locked periods cannot reopen. Rejected requests can be revised into a new version. |
| GL | `/finance/ledger`: posted trial balance, account/date/reference filters, opening and movement amounts, pagination, current AR/AP control reconciliation. `/finance/journals/[id]`: exact distribution, original rate/dates, source links, dimensions, audit and reversal chain. Manual journal entry/independent approval/linked reversal retained and enhanced with dimensions. |
| Documents | Draft editor retains document, accounting and tax dates. Explicit customer line accounts must be revenue/deferred revenue; purchase line accounts must be expense/assets. Posting requires independent approval for the exact version. Retrying posted documents produces no second journal. |
| Purchasing | Cumulative three-way matching counts repeated PO references together. Entity-configured price tolerance defaults to zero; accepted quantity remains a hard ceiling. PO-price GRNI clears separately from purchase-price variance. Foreign PO bills retain PO valuation rate pending a separate GRNI currency policy. Receipt request keys/fingerprints prevent repeated submissions from duplicating stock/GRNI/quantities. |
| Banking | `/finance/reconcile`: idempotent statement import with stable external IDs; conflicting evidence rejected; server-filtered invoices, suggestions for explicit review, manual split allocation and partial invoice settlement. A bank row must be fully allocated, with no posting on import alone. Existing banks/payment runs remain available. |
| Settlement FX | Base-currency bank settlement of foreign invoices uses actual remaining invoice carrying value, including credits/prior partial payments and final-penny clearing. Retains invoice amount, bank amount, cleared carrying amount and realised gain/loss. Original invoice rate/value remain unchanged. Foreign-currency banks require a separate valuation policy and are explicitly blocked here. |
| Collections | `/finance/collections`: overdue/all-open/promise/dispute-history queues, search/pagination, append-only contact, promise, dispute, follow-up and resolution evidence in invoice timeline/audit. Promise amount cannot exceed outstanding. Records emails/letters without sending messages or automatically altering credit holds. |
| Help | `/finance/help`: capability-filtered workflow instructions and explicit limitations. Existing workspaces/navigation and integrations retained. |

Realised monetary settlement differences are posted to profit/loss, consistent with
[IAS 21, paragraphs 28–29](https://www.ifrs.org/content/dam/ifrs/publications/pdf-standards/english/2024/issued/part-a/ias-21-the-effects-of-changes-in-foreign-exchange-rates.pdf?bypass=on).
The profile names do not imply statutory certification or implementation of the
associated future WIP, consolidation or accrual workflows.

## Verification and deployment

- Isolated compatible release based on the latest reviewed main, preserving other
  finished releases while excluding the shared checkout's unrelated unfinished edits.
- Prisma schema validation/client generation passed. Separate TypeScript, focused
  ESLint, production build, full test-suite and live acceptance results are recorded
  in `.ai/CURRENT_STATE.md`; never infer success from this workflow description.
- `scripts/check-finance-erp.ts` runs only when explicitly enabled on the central
  server. It uses normal password sign-in and deployed Server Actions, creates
  clearly marked disposable Test companies, checks real posting/approval/settlement/
  period/security invariants, and suspends its synthetic companies/revokes credentials in `finally`. Immutable
  journal, settlement and audit acceptance evidence is retained.
  It sends no customer communication and uses no real customer financial fixtures.
- Deployment must use `docs/DEPLOY.md`, take a central backup before migrations,
  build/restart the live service and verify actual features at `atlassystem.online`.

Live deployment and the 41 passing authenticated assertions are recorded in
[the acceptance evidence](FINANCE_ERP_ACCEPTANCE.md).

## Explicit remaining work

The brief remains the complete backlog. These gaps must not be represented by
placeholder screens or by renaming existing tables:

- Full inventory valuation layers, FIFO/weighted average, costed Sales dispatch/COGS,
  landed-cost allocation, stock revaluation and Inventory-to-GL reconciliation.
- Manufacturing material/labour/overhead WIP, variance/cost rollups and actual
  cost settlement; complete financial S&OP/MRP scenarios. Buy-to-draft handoff is now implemented;
  transfer/subcontract orchestration remains open.
- Treasury facilities, bank feeds/payment-provider execution and foreign-bank
  revaluation; bank fees/write-offs/prepayments/overpayments and settlement undo.
- Recurring journals, calculated accrual/prepayment/revenue schedules, automatic
  reversals and multi-book/reporting currencies; unrealised FX period revaluation.
- Opening-data import and historical conversion; full journal templates/allocation
  engines and constrained staff-defined report/management-pack exports.
- Complete collection case state, promise kept/broken outcomes, dunning dispatch,
  credit-policy holds/releases and dispute resolution orchestration.
- Complete AP exception/capture/OCR/EDI/PEPPOL, discount/retention/tolerance policy,
  purchase amendments/returns and foreign GRNI/quantity-credit valuation.
- Company cards, mileage/per-diem/expense policies and payroll interfaces.
- Asset acquisition linkage, disposal, impairment, transfers, leases and CIP.
- Statutory VAT return adjustments/MTD submissions and other local tax regimes.
- Intercompany matching, eliminations, ownership/FX consolidation and group close.
- Full cash-flow statements, budget versions/forecast calculations/variance drill,
  close automation and accountable Finance AI. Existing saved assumptions remain
  inputs, not calculated forecasts.

The next coherent accounting extension is costed Inventory/Manufacturing event
posting and reconciliation using the existing module contracts. Preserve the
Approvals/S&OP/Manufacturing foundations when extending those owners.

## 9 October 2026 — Manufacturing supply purchasing and spend

Buy proposals now open a reviewed PO draft with the source SKU, exact quantity and
needed date. Finance draft creation and Manufacturing source claim/audit are atomic,
version checked and duplicate protected. Supplier/price/VAT/allocation remain
reviewed; approval, receipt, posting and payment controls are unchanged.

The Finance-owned supply spend provider feeds `/manufacturing/spend`. Posted net
AP spend includes credits/debits; unbilled PO commitments, accepted receipt net and
current open gross payables remain distinct by source currency. Legal-entity,
project and independent source permissions apply. Current-status commitments are
not a reconstructed historical snapshot; payables are current, not cash spending.
See [Manufacturing & Supply](MANUFACTURING.md) for basis and limitations and its
acceptance record for exact deployment/check evidence.
