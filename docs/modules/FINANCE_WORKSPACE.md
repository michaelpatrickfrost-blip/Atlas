# Atlas Finance scope and implementation constraints

Current continuation: [223-section ERP request](FINANCE_ERP_REQUIREMENTS.md) and
[implementation, verification and remaining gaps](FINANCE_ERP_DELIVERY.md).
The historical 80-section evidence below is retained; server deployment and live
feature verification supersede earlier Mac-only delivery instructions.

Captured: 3 October 2026. The [supplied 80-section brief](FINANCE_SOURCE_REQUIREMENTS.md)
is preserved byte-for-byte. [Coverage](FINANCE_COVERAGE.md) retains every requirement
and its acceptance evidence. Michael explicitly authorised building and refining the full brief. No scope
reduction is agreed; the implementation remains in progress.

## Historical starting point before this build

Inspected `src/modules/stubs.ts`, `src/core/modules/registry.ts`,
`src/core/modules/types.ts`, `src/core/finance/types.ts`, `prisma/schema.prisma`,
`src/server/data-api/read-policy.ts` and Sales delivery documentation.

At the initial inspection Finance and Purchasing were coming-soon stubs. There is no Finance ledger,
AR/AP invoice, settlement, purchase-to-pay or banking model in the inspected schema.
Core Party already supplies customer identity, credit profiles, payment terms,
tax registrations and bank records. Products, Inventory, Projects and HR have
existing records that must be reused through authorised owner contracts.

`src/core/finance/types.ts` defines credit, invoice, payment and receivables
interfaces, but the invoice/payment/receivables interfaces are not registered on
ModuleManifest. Their existence is not a working integration. Sales' current
credit checking uses Customer Master limits/holds rather than a Finance subledger.
Durable Sales outbox records exist; the documented dispatcher, idempotent consumers,
retry/dead-letter handling and downstream reconciliation remain outstanding.
Logistics and Manufacturing execution remain dependencies needing implementation.

## Required ownership

Finance owns legal-entity books, posting policy, monetary valuation, subledgers,
credits, settlements, banking, tax, budgets/commitments, financial assets and close.
The brief places purchase-to-pay inside Finance's Purchases & Payables and Spend
workspaces. Finance now replaces the separate Purchasing catalogue stub; its stored historical
module state remains preserved, while purchasing is governed by Finance capabilities.
The brief explicitly requires a platform-wide Core approval service. Existing
Sales, Projects and HR approvals cannot be treated as that complete service.

Reuse Party for supplier/customer identity; add financial extensions rather than
copy customer/supplier masters. Reuse canonical Product, Project, Employee, User,
Membership, WorkTeam and stock/fulfilment identities. Core registers typed providers
and generic approval infrastructure; it must not import Finance implementation
outside the module registry wiring point. Operational modules own physical events;
Finance owns their accounting consequences.

## Posting and control invariants to implement

- Exact monetary arithmetic with explicit currency exponent, rounding and retained
  transaction/base amounts. Rates and fractional quantities need decimal precision;
  never use floating-point accumulation as ledger truth.
- Every posting balances in its book/base currency and references legal entity,
  ledger, accounting date, open period, accounts, dimensions and source revision.
- Final postings are immutable at command and database boundaries. Corrections
  link reversal/credit/adjustment entries; drafts and approval histories are distinct.
- Unique source/event/revision keys make consumers idempotent. Posting, subledger,
  commitment release, audit and outgoing event changes commit together.
- Lock/version checks prevent concurrent double posting, over-settlement, duplicate
  payment, over-receipt and overspending. Approval snapshots become invalid when
  the underlying amount, recipient bank version or material document details change.
- Tenant, entity and independent source capability checks run on the data service.
  Employee requests/expenses and approver inboxes require their own scoped reads;
  generic queries and nested relations must enforce the same restrictions.
- Creator/reviewer/authoriser separation is based on actual actors and capabilities.
  Delegates retain original approver attribution and cannot bypass conflicts.
- Payment release consumes a verified bank version and independently authorised
  run. An exported file is not proof of bank execution; execution/settlement require
  external confirmation and reconciliation.
- Tax mappings, posting accounts and invoice eligibility are explicit configuration.
  Missing configuration creates a visible exception, never an invented posting.
- Statements, OCR inputs and supporting documents remain on server storage. OCR
  suggestions do not modify verified bank details or approve their own results.
- Valuation, subledgers, bank reconciliation, trial balance, reports and dashboard
  aggregates reconcile at defined cutoffs with exact transaction drill-through.

## Connected contracts and remaining work

Sales supplies confirmed commercial revisions and requests invoicing; Logistics
supplies eligible accepted dispatch/return quantities and physical source IDs.
Finance returns guarded invoice/payment/receivables/credit projections. Confirming
an order alone is not dispatch evidence. Partial invoices, credits and collections
must preserve line lineage and avoid counting both invoiced orders and AR exposure.

Purchase request approval reserves commitments; PO amendments, accepted receipts,
GRNI, bills, credits/cancellation and settlement transition those commitments
without counting the same obligation twice. Matching is cumulative per line and
accounts for damaged/rejected stock and prior invoices/reversals.

The receiving example in section 6 has 1,000 ordered, 940 received, 12 damaged,
928 accepted and 60 outstanding. Here 60 is physically unreceived; 72 is the gap
to fully accepted supply. Preserve both measures and resolve replacement/credit
policy explicitly rather than label them interchangeably.

HR owns employee/expense submission identities; Finance adds policy, posting and
reimbursement without silently creating a second expense engine. Projects owns
work budgets/time and protected project access; Finance owns financial actuals,
billing/capitalisation and allocations. Customer Service requests remedies and
receives permitted financial status while retaining case permissions.

Inventory/Manufacturing supply immutable quantity and cost-source events. Finance
adds standard/average/FIFO valuation, landed cost and production variance policy;
existing stock quantity is not evidence of a delivered financial valuation engine.
Analytics consumes Finance-owned typed metric providers and source drill-through,
not arbitrary SQL or business logic copied into widgets.

Bank feeds, payment rails, OCR/email/EDI/PEPPOL, card feeds, HMRC/MTD and external
provider connections need specific authenticated integrations and acceptance.
Their credentials and production availability have not been inspected in this task.
UK tax/localisation behaviour must be checked against current official sources
before implementation; this document does not certify statutory compliance.

## Delivery and live acceptance

No new local business database, offline record store or persistent record cache.
Build compatible source snapshots, back up and migrate central schema, deploy the
full app to https://atlassystem.online and verify authenticated changed features.
Preserve existing role permissions and active unsaved forms. Mac packaging is optional.

Validate domain/accounting invariants, tenant/entity isolation, actor separation,
period locks, bank-version changes, cumulative matching and replay/concurrency.
Run applicable lint/typecheck/tests and production/package builds. Verify actual
live-server authorised central read/write workflows plus forbidden-action rejection.
Record each of the 80 coverage rows with specific evidence before claiming full
Finance delivery. A shell, schema, build or synthetic preview is insufficient.

## Build in progress — 3 October 2026

Finance is now registered with all eleven named workspaces, plus purchase orders,
suppliers and scoped document detail/revision screens. There are 25 Finance/Core
approval models and one reviewed additive migration. Monetary arithmetic uses
integer minor units and exact decimal quantities/rates. Posted journals and lines,
posted documents, verified bank snapshots, attachments and settlement/timeline
history have database protections; journals enforce a positive balanced posting.

Implemented workflows: legal-entity books/chart/period setup; supplier onboarding
with independent compliance approval; requests, sequential/parallel approval rules,
dated delegation and draft revision; request-to-PO conversion; cumulative receipt
limits/GRNI and three-way bill matching; AP/AR/credit posting; statement import and
exact allocations; verified supplier-bank history and approved payment-run preparation;
manual journal approval/reversal; close checklist/period locks; basic assets/monthly
depreciation; budgets/commitments and budget block rechecks; invoice-based cash
forecast, actual P&L/balance sheet and tax ledger; central PDF/image supporting
evidence; approved HR-claim link; Customer Master receivables contribution.

UI reads and commands use dedicated authenticated actions; desktop forwarding is retained.
Generic Finance model reads remain denied. Project/source permissions remain
independent; no module grant provides additional customer, project or HR rights.
Original attachments persist in central database Bytes; previews are transient.

This is a substantial foundation, not full acceptance of the 80-section brief.
Outstanding includes OCR/email/EDI/PEPPOL, automatic dispatch/return/COGS and
Logistics/Sales event consumers, landed-cost/valuation workflows, card/expense policies, payment execution
and live bank feeds, currency revaluation/consolidation/intercompany, complete
asset disposal/impairment/leases, operational scenario calculations, automatic
accruals/prepayments, statutory VAT/MTD submissions, advanced
report builder/management packs/export and grounded Finance AI. Saved scenario
assumptions are not a calculated scenario. Payment preparation sends no money.
Tax ledger is not an HMRC-compliant return. Accepted non-tracked whole-unit
purchasing receipts now have an atomic Inventory movement consumer; advanced
lot/serial/bin/UOM and valuation methods remain open. No opening balances, actual legal entities or bank details are invented.

The full [coverage map](FINANCE_COVERAGE.md) remains required; partial evidence does
not close a section. Release checks and installed activation evidence are recorded
in `.ai/CURRENT_STATE.md`. Bank/accounting-system input is pending for external
connections and opening-data import; other unimplemented work remains independent.

Statutory integration design must follow the current primary sources:
[VAT digital records/MTD requirements](https://www.gov.uk/guidance/vat-notice-70022-making-tax-digital-for-vat)
and [HMRC fraud-prevention headers](https://developer.service.hmrc.gov.uk/guides/fraud-prevention/).

## Connected Sales / Product / Inventory delivery

Core contracts in `src/core/finance/connections.ts` register module-owned Sales
sources, Finance invoice generation/projections and Inventory receiving consumers.
A confirmed commercial Sales order (not a blanket/internal order) can generate
one order-based draft invoice, retaining revision, source line IDs, canonical
products/customer and exact saved net/tax/gross amounts. Entity currency must
match, tax treatment must be verified, and billing basis/reason/due date are
explicit. Holds or missing revision evidence block generation. Dispatch invoicing
still requires Logistics evidence; invoice generation does not dispatch stock.

Sales Connections displays authorised invoice/note/status links. Finance documents
link back to Sales and canonical Products. Product and Inventory item records use
the same ProductView and link to product-filtered Finance invoices/bills/notes.
Receipts require separate `stock.manage`, enabled Inventory and a receiving
warehouse for physical products. Accepted whole units, stock balance/movement,
GRNI valuation, receipt and audit commit together; damage is excluded. Fractional
stock units are blocked until Inventory supports the needed quantity model.

Posted invoices can generate linked credit/debit value-adjustment drafts for a
chosen source line. Original VAT proportions, product/order/line identity and
reason are retained. Each generated note needs its own configured approval and
posting. Credits currently apply against invoice outstanding and are capped there;
paid-invoice/on-account credits/refunds and physical-return notes remain open.
Debit notes create additional AR/AP obligations and participate in collection,
reporting and payment-run selection. Notes do not invent a stock return. Purchase
AP credit/debit adjustments against a PO post to the purchase-variance control account, preserving the received standard stock value. Advanced stock valuation/revaluation remains open.

Whole-order cancellation checks financial history in a serializable transaction.
Unposted invoices can be voided with history retained; posted financial documents
block commercial cancellation pending explicit credit/return resolution. Confirmed
partial-line cancellation remains blocked pending a revision-safe combined
Finance/fulfilment process. Sales credit exposure still requires reconciled Finance
projection work; invoice linking alone does not close that credit-control gate.

## Order-chain read boundary — 8 October 2026

`salesInvoiceChainProvider` is a Finance-owned narrow operational projection registered
on the manifest. It checks receivables read, source tenant and the existing Finance
`documentScope`, including private Projects. The Core caller checks enabled Finance.
Order-only viewers receive no invoice references or invoiced quantities from the chain.
No posting, ledger or existing profile permissions changed.
