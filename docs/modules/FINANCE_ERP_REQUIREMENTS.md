# ATLAS FINANCE

## COMPLETE ERP FINANCIAL MANAGEMENT SYSTEM

You are acting as the principal ERP financial architect, chartered-accounting systems specialist, senior backend engineer, senior frontend engineer and data architect responsible for building the Atlas Finance application.

This is a major core-system implementation.

The objective is not merely to replicate Xero.

The desired product is:

**Xero-level simplicity and usability**
+
**enterprise ERP financial controls**
+
**deep native integration with every relevant Atlas module**

Finance must become the accounting source of truth for Atlas.

It must support organisations ranging from small businesses through multi-site manufacturers and multi-company groups.

The application must integrate natively with:

- Customers
- Sales
- Sales Orders
- Logistics
- Inventory
- Procurement
- Suppliers
- Manufacturing
- MRP
- Production Planning
- S&OP
- Customer Service
- Credits
- Projects
- Expenses
- HR
- Payroll interfaces
- Fixed Assets
- Tickets
- Approvals
- Banking
- Reporting
- Dashboards

Do not create an isolated accounting application.

The fundamental architecture is:

BUSINESS EVENT
↓
SOURCE DOCUMENT
↓
SUBLEDGER
↓
ACCOUNTING DISTRIBUTION
↓
JOURNAL
↓
GENERAL LEDGER
↓
FINANCIAL STATEMENTS

Examples:

SALE
↓
SALES ORDER
↓
DELIVERY
↓
CUSTOMER INVOICE
↓
ACCOUNTS RECEIVABLE
↓
GENERAL LEDGER

PURCHASE
↓
PURCHASE ORDER
↓
GOODS RECEIPT
↓
SUPPLIER BILL
↓
ACCOUNTS PAYABLE
↓
GENERAL LEDGER

MANUFACTURING
↓
MATERIAL CONSUMPTION
↓
WIP
↓
PRODUCTION
↓
FINISHED GOODS
↓
MANUFACTURING VARIANCES
↓
GENERAL LEDGER

Every financial amount must be explainable back to the originating business transaction.

---

# 1. INSPECT ATLAS BEFORE IMPLEMENTATION

Before modifying code, inspect the existing Atlas repository.

Understand:

- technology stack
- database
- ORM
- tenancy model
- company/legal-entity structure
- sites
- fiscal/calendar concepts
- Customers
- Suppliers
- Products
- Sales Orders
- invoices
- credit notes
- Procurement
- Purchase Orders
- Inventory
- stock valuation
- Manufacturing
- costing
- MRP
- S&OP
- Customer Service credit requests
- Projects
- HR/employees
- existing Expenses
- existing Assets
- existing dashboards
- existing reporting
- Approvals
- permissions
- audit
- currencies
- taxation
- bank data
- imports
- document storage
- notifications
- background processing
- domain events

Do not create duplicates of existing canonical records.

Finance references Customer.

Finance references Supplier.

Finance references Product.

Finance references Sales Order.

Finance references Purchase Order.

Do not create:

FinanceCustomer  
FinanceSupplier  
FinanceProduct

unless the existing architecture genuinely requires specialised extension records.

---

# 2. ACCOUNTING DESIGN PRINCIPLES

These principles are non-negotiable.

## Double-entry accounting

Every posted financial transaction must balance.

Total debits = total credits.

Never allow an unbalanced posted journal.

## Immutable posted accounting

Once a journal is posted, normal users must not edit or delete it.

Corrections happen using:

- reversal
- correcting journal
- credit note
- debit note
- authorised adjustment

Preserve history.

## Draft versus posted

Draft documents do not affect official ledger balances unless explicitly designed as commitments.

Posted documents do.

## Source traceability

Every journal line should retain source information.

Example:

Journal JE-004812  
↓
Customer Invoice INV-10922  
↓
Sales Order SO-10582  
↓
Delivery DL-10221  
↓
Customer ABC

## Idempotency

Processing the same business event twice must not create duplicate accounting.

## Period control

Transactions cannot silently post into closed periods.

## Approval control

Where policy requires approval, posting cannot bypass it.

## Segregation of duties

Sensitive actions can require separate users.

## Currency precision

Never use floating-point arithmetic for money.

Use appropriate decimal arithmetic.

---

# 3. FINANCE APP NAVIGATION

Suggested top-level areas:

## Overview

Financial control centre.

## General Ledger

Chart of accounts, journals and ledger.

## Receivables

Customer invoicing, receipts, credit control and collections.

## Payables

Supplier invoices and payments.

## Banking

Bank accounts, transactions and reconciliation.

## Cash & Treasury

Cash position, cash-flow forecasting and funding.

## Expenses

Employee expenses and corporate spend.

## Fixed Assets

Asset register and depreciation.

## Inventory Accounting

Inventory value, COGS and stock-related finance.

## Manufacturing Costing

WIP, production cost and manufacturing variance.

## Budgeting

Budgets, forecasts and controls.

## Tax

VAT and other configured taxes.

## Intercompany

Cross-company transactions and reconciliation.

## Consolidation

Group financial reporting.

## Period Close

Month-end/year-end close workspace.

## Reports

Statutory and management reporting.

## Audit

Financial audit and transaction history.

## Settings

Financial configuration.

Use Atlas's existing navigation conventions where stronger.

---

# 4. LEGAL ENTITIES

Finance must distinguish:

- organisation
- legal entity/company
- business unit
- site
- department
- cost centre

Each legal entity can have:

Legal name  
Registration number  
Tax/VAT number  
Registered address  
Base currency  
Reporting currency  
Fiscal calendar  
Chart of accounts  
Tax configuration  
Financial periods  
Bank accounts

Do not treat multiple sites as automatically separate legal entities.

---

# 5. FISCAL CALENDAR

Support configurable financial calendars.

Examples:

Calendar year

January to December.

Alternative fiscal year:

April to March.

Support:

years  
periods  
adjustment periods if required

Period states:

Open  
On Hold  
Closed

Optionally:

Open for specific modules/users.

Example:

Sales closed.

General Ledger still open for Finance adjustments.

---

# 6. CHART OF ACCOUNTS

Create a strong Chart of Accounts system.

Account fields:

Code  
Name  
Description  
Type  
Sub-type  
Parent/group  
Active  
Reconciliation allowed  
Posting allowed  
Currency restrictions  
Default tax treatment  
Financial statement category

Major types:

Assets  
Liabilities  
Equity  
Revenue  
Cost of Sales  
Operating Expenses  
Other Income  
Other Expenses

Subtypes may include:

Cash  
Bank  
Accounts Receivable  
Inventory  
WIP  
Prepayments  
Fixed Assets  
Accumulated Depreciation  
Accounts Payable  
Accruals  
Deferred Revenue  
Tax Payable  
Loans  
Share Capital  
Retained Earnings

Do not allow deletion of accounts with transactions.

Allow deactivation.

---

# 7. FINANCIAL DIMENSIONS

Do not create thousands of General Ledger accounts merely to represent departments or projects.

Implement flexible Financial Dimensions.

Suggested dimensions:

Department  
Cost Centre  
Site  
Business Unit  
Project  
Product Family  
Sales Region  
Channel  
Customer Group  
Manufacturing Work Centre

Configuration determines which dimensions are valid for which accounts.

Example:

Account 7000 Marketing Expense

Department mandatory.

Project optional.

Product prohibited.

Account 5000 Manufacturing Labour

Site mandatory.

Work Centre mandatory.

Use dimension validation rules.

---

# 8. ACCOUNTING DISTRIBUTIONS

Business documents should calculate accounting distributions before posting.

Example supplier invoice:

Machinery repair £10,000.

Distribution:

Maintenance Expense      £7,000  
Production Overhead      £3,000  
                         ↓
Accounts Payable         £10,000

Allow splitting across:

accounts  
departments  
cost centres  
projects  
sites

---

# 9. POSTING PROFILES

Do not hard-code account numbers in application code.

Create configurable posting profiles.

Examples:

Customer receivables account

Supplier payable account

Sales revenue by product category

COGS

Inventory

WIP

Manufacturing variance

Freight

Discount

Tax

Scrap

Stock write-off

Goods received not invoiced

Asset acquisition

Exchange gains/losses

Profiles may depend on:

company  
product category  
customer group  
supplier group  
site  
transaction type

---

# 10. GENERAL LEDGER ENGINE

Build a robust accounting engine.

Core records:

Journal Header  
Journal Line  
Posting Batch  
Ledger Entry  
Source Document Reference

Every posted journal must include:

Journal reference  
Posting date  
Document date  
Accounting period  
Currency  
Exchange rate  
Description  
Source module  
Source document  
User/system actor

Lines:

Account  
Debit/Credit  
Transaction currency amount  
Accounting currency amount  
Reporting currency amount where applicable  
Dimensions  
Tax information  
Customer/supplier references where appropriate

---

# 11. JOURNAL TYPES

Support:

General Journal  
Bank Journal  
Customer Journal  
Supplier Journal  
Accrual Journal  
Prepayment Journal  
Allocation Journal  
Depreciation Journal  
Inventory Journal  
Manufacturing Journal  
Intercompany Journal  
Tax Journal  
Opening Balance Journal  
Year-End Journal

Use one accounting engine with specialised behaviour.

---

# 12. MANUAL JOURNALS

Authorised Finance users can create manual journals.

Support:

draft  
submit  
approve  
post

Allow journal templates.

Require attachments where policy says so.

Example:

Large manual journal > £10,000

requires Finance Manager approval.

Use Atlas Approvals.

---

# 13. JOURNAL REVERSALS

Allow reversal:

same date  
specified future date  
automatic first day next period

Example:

December accrual

£50,000 expense.

Automatically reverse:

1 January.

Store relationship between original and reversal.

---

# 14. RECURRING JOURNALS

Support recurring entries.

Examples:

monthly rent  
insurance  
management fees  
standing charges

Configuration:

frequency  
start  
end  
amount  
accounts  
dimensions

Generate draft or auto-post according to policy.

---

# 15. ACCRUALS

Support period accruals.

Example:

Electricity used in March.

Invoice not received until April.

March:

Dr Utilities Expense  
Cr Accrued Expenses

April:

Reverse accrual.

Then post invoice.

Provide accrual schedules where useful.

---

# 16. PREPAYMENTS

Support prepaid expenses.

Example:

Annual insurance £12,000 paid January.

Instead of £12,000 January expense:

Prepayment asset = £12,000.

Release:

£1,000/month.

Allow schedules:

straight-line  
custom

---

# 17. DEFERRED REVENUE

Support revenue received/invoiced before recognition where needed.

Example:

Annual service contract paid in advance.

Record:

Accounts Receivable  
↓
Deferred Revenue

Recognise revenue over configured periods.

Do not assume all invoiced revenue is immediately recognised in every business model.

---

# 18. ALLOCATIONS

Support allocation rules.

Example:

£30,000 electricity cost.

Allocate:

Production 70%  
Warehouse 20%  
Office 10%

Allocation bases can include:

fixed percentage  
headcount  
floor area  
revenue  
machine hours  
labour hours  
custom statistical basis

Store source and resulting allocation entries.

---

# 19. ACCOUNTS RECEIVABLE

Create a full Receivables subledger.

Functions:

Customer invoices  
Credit notes  
Debit adjustments  
Payments  
Refunds  
Prepayments  
Allocations  
Settlements  
Statements  
Aged debt  
Disputes  
Credit control  
Collections

---

# 20. CUSTOMER INVOICES

Invoices may originate from:

Sales Order  
Delivery  
Project  
Subscription/recurring billing  
Manual/free-text invoice

Sales-owned invoices should be created from canonical Sales transactions.

Finance owns financial posting.

Invoice header:

Invoice number  
Customer  
Invoice account  
Billing address  
Tax address  
Currency  
Invoice date  
Due date  
Payment terms  
Customer PO  
Sales Order  
Project  
Reference

Lines:

Product/service  
Quantity  
Unit price  
Discount  
Net  
Tax  
Gross  
Revenue account  
Dimensions

---

# 21. INVOICE POSTING

Posting an invoice typically creates:

Dr Accounts Receivable

Cr Revenue

Cr Tax Payable

plus appropriate inventory/COGS effects from Inventory/Sales policy.

Do not create duplicate COGS if Inventory already generated the financial event.

Create one canonical posting path.

---

# 22. CUSTOMER CREDIT NOTES

Credit notes may originate from:

Customer Service approved credit  
Sales return  
Invoice correction  
Commercial rebate  
Manual Finance correction

Maintain:

Original invoice reference  
Reason  
Approval  
Customer Service case where applicable

Do not allow Customer Service to directly post Finance entries.

---

# 23. CUSTOMER RECEIPTS

Support:

Full payment  
Partial payment  
Payment covering multiple invoices  
Payment on account  
Overpayment  
Underpayment

Payment can settle:

one invoice  
several invoices  
credit notes

Keep settlement records.

---

# 24. CUSTOMER PREPAYMENTS

Support deposits or advance payments.

Example:

Customer pays £20,000 before shipment.

Record customer prepayment appropriately.

Later apply against invoice.

Do not treat an unapplied deposit as normal sales revenue automatically.

---

# 25. CUSTOMER REFUNDS

Where a customer account has credit:

Finance can create refund.

Require appropriate approval.

Maintain links to:

Customer  
Credit Note  
Original payment where relevant.

---

# 26. CUSTOMER STATEMENTS

Generate Customer Statements.

Support:

date range  
outstanding only  
all activity

Show:

opening balance  
invoices  
credits  
payments  
closing balance

PDF/email infrastructure should reuse Atlas document/email systems.

---

# 27. AGED RECEIVABLES

Standard ageing buckets:

Current  
1-30  
31-60  
61-90  
90+

Configurable.

Analyse by:

customer  
salesperson  
region  
company  
customer group

Support drill-through to transactions.

---

# 28. CREDIT MANAGEMENT

Integrate customer credit control with Sales.

Customer fields:

Credit limit  
Temporary limit  
Credit status  
Risk class  
Insurance cover  
Guarantee  
Review date

Sales Orders can run credit checks.

Possible result:

Pass  
Warning  
Hold

Do not simply reject Sales Orders.

Use configurable rules.

---

# 29. CREDIT EXPOSURE

Calculate exposure using configured elements such as:

Outstanding invoices  
Open Sales Orders  
Dispatched not invoiced  
Approved commitments  
Other exposure

Example:

Credit limit: £100,000

Outstanding AR: £62,000  
Open orders: £31,000

Exposure: £93,000

Available credit: £7,000.

---

# 30. CREDIT HOLDS

Credit hold should preserve the Sales Order.

Possible workflow:

Order exceeds credit policy  
↓
Credit Hold  
↓
Credit Controller reviews  
↓
Release / reject / reduce order / temporary limit

Use Approvals where appropriate.

---

# 31. COLLECTIONS

Build a proper collections workspace.

Views:

Due Soon  
Overdue  
Promises to Pay  
Disputed  
High Value  
High Risk  
No Contact  
Oldest Debt

Each customer collection record should show:

Outstanding balance  
Ageing  
Credit limit  
Recent payments  
Open disputes  
Contact details  
Salesperson  
Cases  
Payment history

Microsoft's current Finance product similarly centralises collections and credit management rather than leaving aged debt as a passive report.

---

# 32. COLLECTION ACTIVITIES

Record:

Phone call  
Email  
Letter  
Promise to Pay  
Dispute  
Follow-up task  
Payment arrangement

Link activities to invoices.

---

# 33. PROMISE TO PAY

Store:

Customer  
Amount  
Promised date  
Invoices covered  
Notes

Then track:

Kept  
Partially Kept  
Broken

---

# 34. COLLECTION LETTERS / DUNNING

Support configurable reminder stages.

Example:

Due reminder  
7 days overdue  
30 days overdue  
Final demand

Do not blindly email strategic/disputed accounts.

Allow exclusions and approval policies.

---

# 35. INTEREST AND LATE FEES

Architecture may support configured interest/late charges where legally/commercially appropriate.

Do not activate by default.

---

# 36. BAD DEBT

Support:

write-off request  
approval  
posting

Link to original invoice/customer.

Optionally support bad-debt provision/allowance accounting later.

---

# 37. ACCOUNTS PAYABLE

Create a full Supplier Payables subledger.

Functions:

Supplier invoices  
PO invoices  
Non-PO invoices  
Credit notes  
Prepayments  
Payments  
Payment runs  
Remittances  
Invoice matching  
Invoice approvals  
Supplier statements

---

# 38. SUPPLIER BILLS

Supplier invoice header:

Supplier  
Invoice number  
Invoice date  
Accounting date  
Due date  
Currency  
PO references  
Payment terms  
Tax information  
Attachments

Lines:

PO line/product/category  
Quantity  
Unit price  
Charges  
Discount  
Net  
Tax  
Dimensions  
Expense/asset/inventory treatment

---

# 39. DUPLICATE BILL DETECTION

Before accepting supplier invoice, detect probable duplicate using:

Supplier  
Invoice number  
Date  
Amount  
Currency

Also optionally:

similar invoice reference.

Do not auto-delete.

Warn/block according to policy.

---

# 40. DOCUMENT CAPTURE

Build an abstraction for invoice/receipt document capture.

Possible inputs:

upload  
email ingestion  
future OCR/document service

Extract where possible:

supplier  
invoice number  
date  
amount  
tax  
PO number

Require validation before posting.

Do not trust OCR blindly.

---

# 41. NON-PO INVOICES

Allow authorised supplier invoices without PO.

Examples:

utility  
rent  
professional service

Require:

expense account  
dimensions  
approval

Higher-risk categories may require stronger approval.

---

# 42. 2-WAY MATCHING

Compare:

Purchase Order  
vs  
Supplier Invoice

Validate:

price  
quantity/value  
charges

---

# 43. 3-WAY MATCHING

Compare:

Purchase Order  
vs  
Goods Receipt  
vs  
Supplier Invoice

Validate:

Ordered  
Received  
Invoiced

Example:

Ordered 100.

Received 80.

Supplier invoices 100.

Raise matching exception.

Do not silently pay.

Dynamics uses this same underlying principle and allows tolerances at entity, item and supplier combinations.

---

# 44. MATCH TOLERANCES

Configure tolerances for:

price  
quantity  
total  
freight  
tax  
charges

Potential levels:

company  
supplier  
category  
product  
supplier/product combination

Example:

Price variance ≤2% allowed.

Above:

requires approval.

---

# 45. GRNI / ACCRUED RECEIPTS

Goods may arrive before supplier invoice.

Example:

£10,000 raw material received December.

Supplier invoice arrives January.

December accounting should recognise:

Inventory / Expense  
↓
Goods Received Not Invoiced liability

When invoice posts:

Clear GRNI  
↓
Accounts Payable

This is essential for proper month-end accounting.

---

# 46. SUPPLIER PREPAYMENTS

Support supplier deposits.

Example:

30% machinery deposit.

Record prepayment separately.

Later apply against supplier invoice.

---

# 47. SUPPLIER CREDITS

Supplier credit notes may reference:

invoice  
purchase return  
pricing correction

Support settlement against open payables.

---

# 48. PAYMENT TERMS

Support:

Net X days  
End of month  
Day of month  
Instalments  
Immediate

Early payment discount:

Example:

2% if paid within 10 days.

---

# 49. PAYMENT RUNS

Create Supplier Payment Runs.

Filters:

Due date  
Company  
Currency  
Supplier  
Payment method  
Bank account  
Priority

Proposed payments should show:

Supplier  
Invoices  
Credits  
Amount  
Due date  
Discount available

---

# 50. PAYMENT APPROVAL

Payment proposal
↓
Approval
↓
Payment file/instruction
↓
Bank
↓
Reconciliation

Use shared Atlas Approvals.

Do not allow the person who entered a high-risk supplier bank change to automatically approve/payment-authorise it where separation policy applies.

---

# 51. PAYMENT METHODS

Architecture should support:

Bank transfer  
BACS  
SEPA  
Cheque where needed  
Card  
Direct debit  
Other electronic payment

Do not claim live banking capability unless an actual banking/payment connector exists.

Use provider abstractions.

---

# 52. PAYMENT FILES

Architecture should allow formatted bank payment exports where required.

For example:

ISO 20022 style payment interfaces.

Keep provider/file-format logic outside core ledger services.

---

# 53. REMITTANCE ADVICE

Generate supplier remittance showing:

Invoices paid  
Credits applied  
Payment total  
Payment date/reference

---

# 54. SUPPLIER STATEMENT RECONCILIATION

Allow Finance to compare supplier statement against Atlas AP.

Identify:

Invoice supplier has but Atlas does not  
Invoice Atlas has but supplier omitted  
Payment differences  
Credits missing

Useful for month-end supplier reconciliation.

---

# 55. BANKING

Build a Xero-quality bank workspace.

This should be one of the cleanest parts of Atlas Finance.

Bank Account fields:

Bank  
Account name  
Account reference  
Currency  
GL account  
Feed/provider configuration  
Reconciliation status

---

# 56. BANK TRANSACTION IMPORT

Support provider abstraction for:

live bank feed  
open-banking provider  
statement import

Import formats where appropriate:

CSV  
OFX/QFX  
MT940  
BAI2  
ISO 20022

Do not build all parsers if Atlas only needs some initially.

Design for extensibility.

Microsoft's advanced reconciliation likewise separates electronic statement import, transaction-code mapping and matching rules.

---

# 57. BANK FEED SAFETY

Imported bank transactions are evidence of activity.

They should not automatically invent accounting without explicit matching/rules.

Lifecycle:

Imported  
Unmatched  
Suggested Match  
Matched  
Reconciled

---

# 58. BANK RECONCILIATION

Create a polished matching UI.

Left:

Bank transaction.

Right:

Suggested Atlas transactions.

Possible match types:

Customer payment  
Supplier payment  
Internal transfer  
Expense  
Fee  
Interest  
Refund  
Multiple transactions  
Split transaction

Actions:

Match  
Create  
Split  
Transfer  
Ignore only where appropriate

---

# 59. AUTOMATIC MATCHING

Matching engine can consider:

amount  
date  
currency  
reference  
customer/supplier  
invoice number  
payment reference

Support confidence score.

Example:

97% Match

Invoice INV-10582

Allow automatic reconciliation above configured confidence only if policy allows.

---

# 60. BANK RULES

Users can create deterministic rules.

Example:

Description contains:

"MICROSOFT"

Post to:

Software Expense

Department:

IT

Do not allow rules to bypass tax/approval policy incorrectly.

---

# 61. SUSPENSE / CLEARING

Unidentified bank transactions can remain against appropriate clearing/suspense accounts until resolved.

Never force users to invent an expense category just to finish reconciliation.

---

# 62. INTERNAL BANK TRANSFERS

Moving money between Atlas bank accounts:

Bank A  
↓
Cash in Transit/Clearing if required  
↓
Bank B

Avoid counting transfer as revenue/expense.

---

# 63. MERCHANT PROVIDERS

Support clearing accounts for:

Stripe  
PayPal  
other processors

Example:

Customer pays £100.

Provider fee £2.

Bank receives £98.

Accounting should preserve:

Customer settlement £100  
Fee £2  
Bank £98

---

# 64. CASH POSITION

Create:

**Cash & Treasury**

Show:

Current bank balances  
Available cash  
Restricted cash  
Expected receipts  
Expected payments

By:

Company  
Currency  
Bank

---

# 65. CASH FLOW FORECAST

Provide at least:

13-week short-term cash forecast.

Also allow:

30/60/90/180 day views.

Sources:

Opening bank cash  
AR expected receipts  
AP expected payments  
Payroll forecast  
Tax  
Purchase Orders  
approved expenses  
capital expenditure  
loan payments  
S&OP forecast where useful

Separate:

Committed

from:

Forecast.

---

# 66. CASH SCENARIOS

Examples:

Customer pays 30 days late.

Major purchase delayed.

Supplier requires deposit.

Run effects on projected bank balance.

Do not change live accounting.

---

# 67. LOANS AND FINANCING

Support basic liability schedules or integrate through recurring journals.

Potential records:

Principal  
Interest rate  
Repayment schedule  
Maturity  
Bank

Do not build full treasury derivatives initially.

Leave clean extension points.

---

# 68. MULTI-CURRENCY

Multi-currency must be first-class.

Each transaction can have:

Transaction currency  
Accounting/base currency  
Reporting currency where configured

Store exchange rate used at transaction time.

Do not recalculate historical posted entries using today's rate.

Xero likewise supports foreign currency transactions, live rates and reporting in foreign/base currencies.

---

# 69. EXCHANGE RATES

Support:

rate date  
source  
rate type

Examples:

Spot  
Monthly corporate rate  
Budget rate

Allow authorised manual override.

Store original source.

---

# 70. REALISED FX

When foreign invoice and payment use different exchange rates:

calculate realised gain/loss.

Post to configured FX account.

---

# 71. UNREALISED FX

At period end support revaluation of:

Foreign bank balances  
Accounts Receivable  
Accounts Payable  
appropriate GL accounts

Generate unrealised gain/loss journals.

Allow reversal next period where configured.

---

# 72. EXPENSE MANAGEMENT

Integrate employee expenses into Finance.

Employee comes from Atlas HR.

Expense fields:

Employee  
Date  
Merchant  
Description  
Category  
Amount  
Currency  
Tax  
Project  
Department  
Cost Centre  
Customer/job if rechargeable  
Receipt

---

# 73. RECEIPT CAPTURE

Allow attachment/photo receipt.

Architecture may support OCR.

User remains responsible for review.

---

# 74. EXPENSE CLAIMS

Workflow:

Draft  
Submitted  
Manager Approval  
Finance Review  
Approved  
Reimbursable  
Paid

Use Atlas Approvals.

---

# 75. EXPENSE POLICIES

Examples:

Meal limit  
Hotel limit  
Receipt required over threshold  
Alcohol prohibited  
Weekend rules  
Mileage rate

Violations may:

warn  
require explanation  
block

according to policy.

---

# 76. MILEAGE

Support:

Journey date  
From  
To  
Distance  
Vehicle type  
Rate  
Business reason

Calculate reimbursement.

Country-specific rules belong in localisation configuration.

---

# 77. CORPORATE CARDS

Support corporate-card statement import.

Match transactions to employee submissions.

Highlight:

missing receipt  
uncategorised  
personal transaction

---

# 78. EXPENSE REIMBURSEMENT

Approved employee expenses can enter payment run or payroll reimbursement according to company policy.

Keep expense approval and cash settlement separate.

---

# 79. FIXED ASSETS

Build full fixed-asset management.

Xero supports asset registers, depreciation and disposal, but Atlas needs deeper integration with Procurement, Maintenance, locations and multiple accounting books.

---

# 80. ASSET REGISTER

Asset fields:

Asset number  
Name  
Description  
Category  
Serial number  
Supplier  
Purchase Order  
Supplier Invoice  
Acquisition date  
Placed-in-service date  
Original cost  
Residual value  
Useful life  
Location  
Site  
Department  
Cost centre  
Custodian  
Parent asset  
Status

---

# 81. ASSET CREATION

Assets may originate from:

Procurement receipt  
Supplier invoice  
Capital project  
Manual migration

Example:

Purchase of £80,000 forklift.

Finance marks purchase as capital.

Create Asset.

Preserve PO and invoice references.

---

# 82. CAPITALISATION THRESHOLD

Support configurable capitalisation policy.

Below threshold:

expense.

Above threshold:

asset candidate.

Allow authorised exception.

---

# 83. ASSET BOOKS

Allow more than one depreciation book where required.

Examples:

Accounting Book  
Tax Book

Do not assume book depreciation and tax capital allowances are identical.

---

# 84. DEPRECIATION

Support methods including:

Straight Line  
Reducing Balance  
No Depreciation  
Full immediate depreciation where appropriate

Architecture allows additional methods.

Store:

method  
rate/useful life  
start date  
frequency

Generate depreciation journals.

---

# 85. ASSET MOVEMENT

Track:

Location transfer  
Department transfer  
Custodian change

Do not alter financial cost merely because physical location changes.

---

# 86. ASSET IMPAIRMENT / WRITE-DOWN

Authorised Finance users can record impairment.

Require reason and approval where configured.

---

# 87. ASSET DISPOSAL

Support:

Sale  
Scrap  
Write-off  
Loss

Calculate:

Net book value  
Proceeds  
Gain/loss

Post appropriate journals.

---

# 88. ASSET SPLIT / MERGE

Architecture should support splitting an asset where useful.

Example:

£100,000 equipment purchase comprising separate capital assets.

Implement if practical within current architecture.

---

# 89. ASSET MAINTENANCE LINK

Where Atlas Manufacturing/Maintenance tracks machinery:

Financial Asset
↔
Operational Asset/Machine

Show:

NBV  
acquisition cost  
maintenance cost  
downtime

without merging Finance and maintenance responsibilities.

---

# 90. INVENTORY ACCOUNTING

Finance must integrate deeply with Inventory.

Inventory remains source of truth for physical quantities.

Finance owns financial valuation/postings.

---

# 91. INVENTORY VALUATION METHODS

Architecture should support configurable valuation methods such as:

Standard Cost  
FIFO  
Weighted Average

Do not allow casual mid-year valuation-method changes that rewrite history.

Require controlled migration/effective dating.

---

# 92. INVENTORY ACCOUNTS

Posting profiles can distinguish:

Raw Materials  
Components  
WIP  
Finished Goods  
Packaging  
MRO  
Consumables

Example receipt:

Dr Raw Material Inventory  
Cr GRNI

---

# 93. COST OF GOODS SOLD

When goods are sold, recognise inventory cost according to configured accounting policy.

Example:

Dr COGS  
Cr Finished Goods Inventory

Coordinate with Sales/Logistics to ensure COGS posts once.

---

# 94. LANDED COST

Support landed-cost allocation.

Examples:

Freight  
Customs  
Duty  
Insurance  
Handling

Allocate by:

quantity  
weight  
volume  
value  
custom basis

Increase inventory cost appropriately.

---

# 95. INVENTORY REVALUATION

Authorised Finance users can post revaluations.

Require:

reason  
effective date  
approval where configured

Keep original valuation history.

---

# 96. OBSOLESCENCE / PROVISION

Support stock write-down/provision workflows.

Example:

Slow-moving stock.

Cost £100,000.

Expected recoverable value £60,000.

Finance can recognise £40,000 provision/write-down according to accounting policy.

---

# 97. STOCK WRITE-OFF

Inventory transaction provides quantity event.

Finance receives valuation impact.

Example:

Damaged stock £8,000.

Dr Stock Write-off  
Cr Inventory

Approval may be required.

---

# 98. INVENTORY TRANSFERS

Internal transfers within the same legal entity normally change location rather than P&L.

Preserve inventory valuation.

Intercompany transfers require separate handling.

---

# 99. IN-TRANSIT STOCK

Where Inventory supports in-transit:

Finance should preserve value in:

Inventory in Transit

or appropriate configured accounting representation.

---

# 100. MANUFACTURING COST ACCOUNTING

This is critical for Atlas.

Finance must consume manufacturing data rather than make Production manually recreate costs.

---

# 101. PRODUCT COST STRUCTURE

Manufactured product cost can include:

Raw materials  
Purchased components  
Direct labour  
Machine time  
Energy  
Setup  
Campaign startup  
Consumables  
Subcontracting  
Variable overhead  
Fixed overhead  
Scrap

Use Manufacturing/MRP data.

---

# 102. STANDARD COST

Support standard product cost versions.

Each version records:

Effective date  
Material standards  
Labour standards  
Machine standards  
Overhead standards

Do not overwrite previous standard cost.

---

# 103. COST ROLL-UP

BOM/routing cost roll-up:

Raw materials
+
subassemblies
+
labour
+
machine
+
overhead
=
standard manufactured cost

Make calculation drillable.

---

# 104. WIP

When material/labour is consumed before completion:

recognise Work in Progress.

Example:

Material issued:

Dr WIP  
Cr Raw Material Inventory

Labour applied:

Dr WIP  
Cr Labour Absorption

Machine/overhead:

Dr WIP  
Cr Overhead Absorption

Exact postings are configurable.

---

# 105. PRODUCTION COMPLETION

When finished goods produced:

Dr Finished Goods Inventory  
Cr WIP

based on configured costing method.

---

# 106. MANUFACTURING VARIANCE

Calculate planned/standard versus actual.

Possible variances:

Material price  
Material usage  
Labour rate  
Labour efficiency  
Machine rate  
Machine efficiency  
Overhead  
Yield  
Scrap  
Campaign

Expose operational cause where data exists.

---

# 107. SCRAP COST

Production scrap should create financial impact.

Track:

Expected scrap  
Unexpected scrap

Allow separate reporting.

---

# 108. CAMPAIGN COSTING

Production campaign fixed costs, such as kiln startup, flow into product costing according to the allocation configured in Manufacturing.

Finance sees:

Campaign cost  
Allocation basis  
Products  
Resulting cost

Do not recalculate independently in Finance.

---

# 109. PURCHASE PRICE VARIANCE

Compare:

Standard material cost

with

Actual purchase cost.

Report/post variance according to costing policy.

---

# 110. COST HISTORY

Product Finance view should show:

Standard cost history  
Actual production cost  
Purchase price history  
Margin history

---

# 111. PROJECT ACCOUNTING

Projects from Atlas Projects/CRM can carry financial dimensions.

Track:

Revenue  
Labour  
Purchases  
Expenses  
Inventory usage  
Other cost

Calculate:

Project revenue  
Cost  
Margin  
Forecast  
Budget

Do not create a second project-management system.

---

# 112. COST CENTRES / MANAGEMENT ACCOUNTING

Finance must support analysis by:

Cost centre  
Department  
Site  
Business unit  
Project  
Product family

This should be dimension-based wherever possible.

---

# 113. BUDGETING

Create a proper Budgeting workspace.

Not merely one annual number.

Support:

Annual budget  
Monthly phasing  
Rolling forecast  
Latest estimate  
Scenario

Microsoft's current budget-planning architecture similarly uses scenarios, organisational hierarchy, layouts and actual-ledger information as planning inputs.

---

# 114. BUDGET DIMENSIONS

Budget can be entered by:

Account  
Department  
Cost centre  
Site  
Project  
Product group

Do not require every organisation to budget at maximum detail.

---

# 115. BUDGET METHODS

Allow:

Manual entry  
Prior year actual + %  
Run-rate  
Copy prior budget  
Spread annual amount evenly  
Seasonal profile  
Import

---

# 116. BUDGET VERSIONS

Examples:

FY27 Draft 1  
FY27 Department Submission  
FY27 Approved  
FY27 Forecast 1  
FY27 Latest Estimate

Never overwrite approved budget.

---

# 117. BUDGET WORKFLOW

Department
↓
Submission
↓
Manager
↓
Finance
↓
Executive Approval
↓
Approved Budget

Use Atlas Approvals.

---

# 118. BUDGET CONTROL

This should connect to Procurement.

Example:

IT Equipment Budget:

£100,000

Actual: £20,000  
Committed PO: £35,000  
Pending approved requisitions: £10,000

Available:

£35,000

When someone requests £50,000:

Atlas warns/blocks according to policy.

Dynamics likewise supports budget control against source documents and available-funds rules rather than only reporting variance afterwards.

---

# 119. COMMITMENTS

Track:

Purchase Requisitions  
Purchase Orders

as commitments where policy requires.

Separate:

Budget  
Committed  
Actual  
Forecast

---

# 120. S&OP INTEGRATION

Finance should consume approved S&OP assumptions.

S&OP provides:

Volume  
Selling price assumptions  
Manufacturing requirements  
Inventory assumptions

Finance turns them into:

Revenue forecast  
COGS  
Gross margin  
Working capital  
Cash

Do not duplicate S&OP forecasting inside Finance.

---

# 121. FINANCIAL FORECAST

Finance adds assumptions such as:

Payroll  
Rent  
Utilities  
Capex  
Tax  
Interest  
FX  
Overheads

Produce:

Forecast P&L  
Forecast Balance Sheet  
Forecast Cash Flow

---

# 122. TAX ENGINE

Build configurable tax infrastructure.

Do not hard-code only UK VAT.

Tax definition:

Tax code  
Rate  
Effective dates  
Jurisdiction  
Input/output  
Recoverability  
Account mappings

---

# 123. UK VAT

For UK localisation support concepts including:

Standard rate  
Reduced rate  
Zero rate  
Exempt  
Outside scope  
Reverse charge where configured

Maintain digital transaction records needed for VAT reporting.

---

# 124. VAT RETURN

Create VAT workspace.

Show relevant VAT return boxes/calculations based on localisation configuration.

Allow drill-down from return figure to transactions.

Workflow:

Draft  
Review  
Approved  
Submitted  
Filed

---

# 125. MAKING TAX DIGITAL

Architecture should support an HMRC connector for MTD-compatible VAT submission.

Do not fake HMRC submission.

Actual submission requires official API integration, credentials and compliance testing.

Store:

Submission period  
Payload/version  
HMRC response  
Receipt/reference  
Submitted by  
Timestamp

---

# 126. VAT ADJUSTMENTS

Allow authorised adjustments.

Require:

reason  
amount  
period  
audit

Do not silently edit source transactions merely to change a VAT return.

---

# 127. VAT LOCK

After filing VAT period, protect transactions that would alter the filed return.

Possible:

warning  
lock  
adjust next return

according to configuration.

---

# 128. CIS

For UK businesses using Construction Industry Scheme, design a localisation component supporting:

Subcontractor status  
Verification reference  
Deduction rate  
CIS deduction calculation  
Monthly reporting/submission interface

Keep optional.

Do not make manufacturing companies use CIS functionality.

---

# 129. WITHHOLDING TAX

For international localisation architecture, allow withholding tax rules.

Implement only where required.

---

# 130. INTERCOMPANY

Support multi-company groups.

Example:

Company A pays a cost on behalf of Company B.

Create balanced entries in each company.

---

# 131. DUE TO / DUE FROM

Configure intercompany accounts.

Company A:

Intercompany Receivable B.

Company B:

Intercompany Payable A.

Never use arbitrary customer/supplier balances for internal journal imbalance.

---

# 132. INTERCOMPANY JOURNALS

One entry can generate corresponding entries across legal entities according to policy.

Maintain common intercompany transaction reference.

---

# 133. INTERCOMPANY SALES / PURCHASES

Architecture should support:

Company A sells stock/service to Company B.

Potentially create:

Intercompany Sales Order  
Intercompany Purchase Order  
Intercompany invoices

Use existing Sales/Procurement modules.

---

# 134. INTERCOMPANY RECONCILIATION

Workspace should compare:

Company A receivable from B

against

Company B payable to A.

Highlight mismatch.

---

# 135. CONSOLIDATION

Group Finance requires consolidation.

Support:

multiple legal entities  
different currencies  
account mapping  
eliminations  
group reporting

Microsoft's consolidation model includes legal-entity consolidation, account mapping, currency translation and elimination handling, which is the appropriate ERP benchmark here.

---

# 136. CONSOLIDATION MAPPING

Entities can use:

same Chart of Accounts

or

local accounts mapped to group accounts.

---

# 137. CURRENCY TRANSLATION

Translate subsidiary financial statements into group reporting currency using configured rate types.

Potential:

P&L average rate  
Balance Sheet closing rate  
Equity historical rates

Exact accounting policy must be configurable.

---

# 138. ELIMINATIONS

Identify and eliminate:

Intercompany revenue  
Intercompany expense  
Intercompany receivables  
Intercompany payables  
other configured balances

Preserve elimination journals.

---

# 139. OWNERSHIP

Architecture should support ownership percentage/minority interest later where required.

Do not overcomplicate V1 unless current Atlas requirements require it.

---

# 140. FINANCIAL REPORTING

Provide first-class reports.

Mandatory:

Profit & Loss  
Balance Sheet  
Cash Flow  
Trial Balance  
General Ledger  
Journal Report  
Aged Receivables  
Aged Payables  
Customer Statements  
Supplier Balances  
Tax Report  
VAT Report  
Fixed Asset Register  
Depreciation Schedule  
Inventory Valuation  
Budget vs Actual  
Cash Forecast  
Manufacturing Variance  
Project Profitability  
Audit Trail

These are standard core reports found in mature accounting systems. Odoo, for example, exposes Balance Sheet, P&L, General Ledger, aged receivables/payables, cash flow, tax reports and an audit trail as standard financial reporting.

---

# 141. REPORT DRILL-THROUGH

Reports must not be static PDFs only.

Example:

P&L

Manufacturing Cost £820,000

click
↓
Accounts

click
↓
Transactions

click
↓
Supplier Invoice / Production Order

This is essential.

---

# 142. MANAGEMENT P&L

Allow:

Actual  
Budget  
Forecast  
Prior year  
Variance  
Variance %

Columns configurable.

Analyse by:

Company  
Site  
Department  
Cost centre  
Project  
Product family

---

# 143. BALANCE SHEET RECONCILIATION

Create reconciliation capability for key balance sheet accounts.

Examples:

Bank  
AR  
AP  
Inventory  
GRNI  
VAT  
Payroll liability  
Fixed assets  
Intercompany  
Accruals

Status:

Not Started  
In Progress  
Reconciled  
Reviewed

---

# 144. CASH FLOW STATEMENT

Support appropriate cash-flow reporting.

At minimum:

Operating  
Investing  
Financing

Configuration controls account mapping.

---

# 145. DASHBOARDS

Finance Overview should be genuinely useful.

Headline:

Cash  
Revenue MTD  
Revenue YTD  
Gross Margin  
Net Profit  
Receivables  
Payables  
Overdue Debt  
Inventory Value  
Working Capital

Charts:

Revenue & Margin  
Cash position  
AR ageing  
AP ageing  
Budget vs Actual  
Cash forecast  
Working capital  
Expense trend

Exceptions:

Bank transactions unreconciled  
Invoices awaiting approval  
Payments awaiting approval  
Credit limit breaches  
VAT deadline  
Close tasks overdue

---

# 146. WORKING CAPITAL

Show:

Receivables  
Inventory  
Payables

Metrics:

DSO  
DPO  
Inventory days

Cash conversion cycle where meaningful.

Make formulas visible.

---

# 147. MARGIN ANALYSIS

Analyse:

Revenue  
COGS  
Gross Margin  
Margin %

By:

Customer  
Product  
Product family  
Salesperson  
Site  
Project

Integrate actual manufacturing/product cost.

---

# 148. PERIOD CLOSE

Build a proper financial close workspace.

Dynamics similarly treats period close as a controlled process involving subledgers, journals, FX revaluation, allocations, consolidation and period locking.

---

# 149. CLOSE TEMPLATE

Example month-end tasks:

Bank feeds complete  
Bank reconciliations complete  
AR cut-off  
AP invoices entered  
Supplier statements reconciled  
GRNI reviewed  
Inventory movements complete  
Inventory valuation reviewed  
Manufacturing WIP calculated  
Production variances posted  
Fixed asset depreciation  
Accruals  
Prepayments  
Payroll posted  
VAT reviewed  
FX revaluation  
Intercompany reconciled  
Allocations  
Balance sheet reconciliations  
Management accounts reviewed  
Period locked

---

# 150. CLOSE TASKS

Each task:

Owner  
Due date  
Dependencies  
Status  
Evidence  
Reviewer

Status:

Not Started  
In Progress  
Blocked  
Complete  
Reviewed

---

# 151. SOFT CLOSE / HARD CLOSE

Allow:

On Hold

restrict ordinary posting while Finance finishes close.

Closed

no normal posting.

Reopening requires authorised action/audit.

---

# 152. YEAR END

Support:

Final adjustments  
Profit/loss closing  
Retained earnings  
Year-end journal  
Opening balances where appropriate  
New fiscal year

Keep year-end process auditable.

---

# 153. AUDIT TRAIL

Every posted transaction should be traceable.

Audit:

Created  
Modified before posting  
Submitted  
Approved  
Posted  
Reversed  
Reconciled  
Settlement changes

Store:

Actor  
Timestamp  
Source  
Old/new values where applicable

---

# 154. FINANCIAL AUDIT WORKSPACE

Allow auditors/Finance users to search:

Journal  
Invoice  
Payment  
Account  
Customer  
Supplier  
Amount  
Date  
Source

Provide drill-through.

---

# 155. ATTACHMENTS

Support evidence on:

Journals  
Supplier invoices  
Expenses  
Approvals  
Asset disposals  
Write-offs  
Tax adjustments

Reuse Atlas document storage.

---

# 156. APPROVALS INTEGRATION

Use the central Atlas Approvals application.

Finance should not build its own isolated workflow engine.

Potential approvals:

Manual journal  
Supplier invoice  
Payment run  
Customer refund  
Credit note  
Bad debt write-off  
Inventory revaluation  
Asset disposal  
Budget change  
Supplier bank change

---

# 157. SEGREGATION OF DUTIES

Support controls such as:

Creator cannot approve own high-value journal.

Supplier bank editor cannot approve first payment.

Payment preparer cannot final-authorise payment.

Credit requester cannot post credit.

Policies should be configurable.

---

# 158. SUPPLIER BANK CHANGE CONTROL

This is high risk.

When supplier bank details change:

record previous value  
request approval  
store evidence  
flag supplier/payment run

Optionally require independent verification.

Do not allow silent edits.

---

# 159. NUMBER SEQUENCES

Configure sequences for:

Customer Invoice  
Credit Note  
Supplier Invoice internal reference  
Journal  
Payment  
Asset  
Tax submission  
Consolidation

Respect legal/local numbering requirements where configured.

---

# 160. FINANCIAL DOCUMENT STATES

Do not use one generic status.

Example invoice:

Draft  
Submitted  
Approved  
Posted  
Partially Paid  
Paid  
Cancelled/Reversed

Keep workflow and settlement state distinct where necessary.

---

# 161. SOURCE DOCUMENT ENGINE

Financial postings should derive from source documents using one controlled posting service.

Examples:

postCustomerInvoice()

postSupplierInvoice()

postGoodsReceipt()

postInventoryAdjustment()

postManufacturingCompletion()

postPayment()

Do not let every controller write General Ledger lines manually.

---

# 162. ACCOUNTING EVENT MODEL

Where Atlas uses events, useful concepts include:

sales.invoice.posted  
sales.credit.posted  
customer.payment.received  
procurement.goods_received  
supplier.invoice.posted  
supplier.payment.posted  
inventory.adjustment.posted  
manufacturing.material_consumed  
manufacturing.production_completed  
expense.approved  
asset.depreciation.posted

Finance consumes exactly-once/idempotently.

---

# 163. SUBLEDGER TO GL

AR, AP, Assets, Inventory and other subledgers must reconcile to GL.

Example:

AR subledger total:

£1,284,552

GL Accounts Receivable:

£1,284,552

If not:

raise reconciliation exception.

---

# 164. SUBLEDGER RECONCILIATION

Provide reconciliation reports:

AR ↔ GL  
AP ↔ GL  
Inventory ↔ GL  
Fixed Assets ↔ GL

Do not allow unexplained differences to disappear.

---

# 165. DATA MODEL

Fit into Atlas conventions rather than blindly using exact names.

Potential entities:

## Core

FinancialLegalEntity  
FiscalCalendar  
FiscalPeriod  
Ledger  
ChartOfAccount  
MainAccount  
FinancialDimension  
FinancialDimensionValue  
AccountStructure  
PostingProfile

## Ledger

Journal  
JournalLine  
PostingBatch  
LedgerEntry  
Settlement  
ReversalLink

## AR

CustomerInvoice  
CustomerInvoiceLine  
CustomerPayment  
CustomerSettlement  
CustomerCredit  
CollectionActivity  
CreditLimitAdjustment  
PromiseToPay

## AP

SupplierInvoice  
SupplierInvoiceLine  
SupplierCredit  
SupplierPayment  
PaymentProposal  
PaymentRun  
InvoiceMatch  
InvoiceMatchException

## Banking

BankAccount  
BankStatement  
BankStatementLine  
BankMatchRule  
BankReconciliation  
BankReconciliationLine

## Fixed Assets

FixedAsset  
AssetBook  
AssetTransaction  
DepreciationSchedule  
AssetDisposal

## Expenses

ExpenseClaim  
ExpenseLine  
ExpensePolicy  
CorporateCardTransaction

## Budgeting

BudgetModel  
BudgetVersion  
BudgetLine  
BudgetCommitment  
BudgetControlResult

## Tax

TaxCode  
TaxRate  
TaxPeriod  
TaxReturn  
TaxAdjustment

## Consolidation

ConsolidationRun  
ConsolidationMapping  
ConsolidationEntry  
EliminationEntry

Do not duplicate source documents already owned by other apps unnecessarily.

---

# 166. DATABASE CONSTRAINTS

Use database-level safeguards where appropriate.

Examples:

Unique posted document numbers per legal entity.

Balanced journal enforcement in posting service.

No duplicate source-event posting.

Unique supplier invoice number by supplier where policy applies.

Currency required.

Fiscal period validation.

---

# 167. TRANSACTION SAFETY

Financial posting should be atomic.

If journal line 14 fails:

Do not post lines 1-13.

The whole accounting transaction should fail/roll back.

---

# 168. IDEMPOTENCY

Every integration posting should have a unique idempotency/source-event key.

Example:

inventory-receipt:GR-10942:v1

Processing it twice produces one financial posting.

---

# 169. ROUNDING

Handle:

currency decimal precision  
tax rounding  
line versus document rounding  
FX rounding

Post differences to configured rounding account where required.

Never leave journals unbalanced due to rounding.

---

# 170. TIME AND DATES

Financial documents need distinguishable:

Document date  
Transaction date  
Posting/accounting date  
Tax date  
Due date

Do not collapse all into `date`.

---

# 171. OPENING BALANCES

Provide controlled migration/import tools for:

GL trial balance  
Outstanding AR invoices  
Outstanding AP bills  
Bank balances  
Inventory value  
Fixed assets

Opening data must still balance.

---

# 172. IMPORT

Allow safe import of:

Chart of Accounts  
Journals  
Customer opening balances  
Supplier opening balances  
Budget  
Fixed Assets  
Bank Statements

Validate before posting.

Provide error file/report.

---

# 173. EXPORT

Support exports appropriate to Atlas:

CSV  
Excel  
PDF reports

Use the existing Atlas export infrastructure.

---

# 174. API SECURITY

All posting endpoints require explicit permissions.

Never rely on frontend hidden buttons.

Examples:

finance.journal.post  
finance.payment.approve  
finance.period.close  
finance.tax.submit  
finance.asset.dispose

Follow Atlas permission architecture.

---

# 175. SENSITIVE FINANCIAL DATA

Restrict access to:

Bank details  
Payroll postings  
Employee expenses  
Supplier banking  
Profitability  
Financial statements

Role-based and company-based security.

---

# 176. PAYROLL INTEGRATION

Do not rebuild payroll inside Finance unless Atlas has explicitly chosen to build Payroll.

Finance should accept payroll journals from HR/Payroll.

Typical posting:

Gross wages  
Employer costs  
PAYE/tax liability  
Pension liability  
Net payroll liability

Later payments settle liabilities.

---

# 177. CUSTOMER SERVICE INTEGRATION

Approved Customer Service credit:

Customer Service Case
↓
Credit Request
↓
Approval
↓
Finance Draft Credit
↓
Post
↓
AR updated

Case receives posted credit reference.

---

# 178. PROCUREMENT INTEGRATION

Procurement provides:

Requisition commitments  
Purchase Orders  
Goods Receipts  
Supplier details

Finance provides:

Budget availability  
Invoice matching  
Payables  
Payments

---

# 179. INVENTORY INTEGRATION

Inventory provides:

Receipts  
Issues  
Transfers  
Adjustments  
Counts

Finance calculates/records valuation effects.

Quantity stays owned by Inventory.

---

# 180. MANUFACTURING INTEGRATION

Manufacturing provides:

Material consumption  
Labour actuals  
Machine actuals  
Production completion  
Scrap  
Campaign cost

Finance provides:

Cost rates  
valuation  
WIP accounting  
variance reporting

---

# 181. SALES INTEGRATION

Sales owns:

Quotes  
Orders  
Pricing

Finance owns:

Invoice accounting  
AR  
collections  
credit control

Invoice document may originate in Sales but posting is controlled by Finance engine.

---

# 182. S&OP INTEGRATION

S&OP provides future plan.

Finance provides financial translation.

Examples:

Revenue  
COGS  
Margin  
Inventory investment  
Cash requirement

---

# 183. PROJECT INTEGRATION

Costs and revenue can carry Project dimension/reference.

Projects see financial actuals.

Finance retains ledger ownership.

---

# 184. REPORTING ENGINE INTEGRATION

Use Atlas Dashboard/BI infrastructure.

Finance should expose governed measures such as:

Revenue  
COGS  
Gross Margin  
OPEX  
EBITDA where configured  
Cash  
Debt  
Receivables  
Payables  
Inventory  
Working Capital

Definitions must be centralised.

---

# 185. USER EXPERIENCE

The UI should be radically cleaner than traditional ERP Finance.

Use Xero as inspiration for simplicity, not for capability limits.

Priorities:

clear language  
excellent reconciliation  
strong search  
excellent drill-through  
fast keyboard workflows  
wide data tables where necessary  
saved filters  
contextual side panels  
clear exceptions  
minimal modal nesting

Avoid:

thousands of unexplained fields  
cryptic accounting codes everywhere  
childish coloured cards  
excessive status badges  
forcing accountants through ten screens

---

# 186. FINANCE HOME

Top:

Cash  
Revenue  
Gross Margin  
Net Profit  
AR  
AP

Below:

Cash forecast  
Overdue debt  
Bills due  
Bank reconciliation  
Budget variance  
Month-end status

Actions:

Create Journal  
New Supplier Bill  
Record Payment  
Reconcile Bank  
Run Payment Proposal  
Start Close

Only show actions user has permission for.

---

# 187. GLOBAL FINANCE SEARCH

Search by:

Invoice number  
PO number  
Sales Order  
Customer  
Supplier  
Journal  
Payment reference  
Amount  
Bank reference  
Asset  
Product

Result opens canonical transaction.

---

# 188. TRANSACTION EXPLAINABILITY

Any posted journal should show:

**Why does this entry exist?**

Example:

Dr Raw Material Inventory £18,400  
Cr GRNI £18,400

Reason:

Goods receipt GR-1052  
PO PO-0284  
Supplier ABC  
Product RM-01  
60 tonnes

Click through.

---

# 189. ACCOUNT EXPLAINABILITY

Account balance:

Inventory £4.3m

Allow drill:

Site  
Product category  
Product  
Transactions

where source data permits.

---

# 190. AUTOMATION PRINCIPLE

Automate routine accounting.

Do not automate ambiguity.

Good automation:

PO receipt posting  
Invoice matching  
Bank matching suggestions  
Depreciation  
Recurring journals  
Scheduled prepayment release

Bad automation:

Automatically posting unexplained bank transaction to random expense account.

---

# 191. EXCEPTION-FIRST WORKSPACES

Finance users should mainly see what needs attention.

Examples:

12 bank transactions unmatched.

4 supplier invoices exceed tolerance.

3 customers exceed credit limit.

2 payment runs awaiting approval.

1 VAT period due.

This is better than requiring users to inspect everything.

---

# 192. ACCOUNTING PERIOD CLOSE ACCEPTANCE TEST

At month end Atlas must support:

Complete AP  
Complete AR  
Reconcile bank  
Review GRNI  
Value inventory  
Calculate WIP  
Post manufacturing variance  
Run depreciation  
Release prepayments  
Post accruals  
Run FX revaluation  
Reconcile intercompany  
Review VAT  
Run allocations  
Generate Trial Balance  
Produce P&L / Balance Sheet  
Lock period

All steps must be traceable.

---

# 193. SALES ACCEPTANCE SCENARIO

Sales Order:

£10,000 net  
£2,000 VAT

Invoice posting:

Dr AR £12,000  
Cr Sales £10,000  
Cr VAT Payable £2,000

Customer pays:

£12,000

Payment settles invoice.

Bank reconciliation matches payment.

Customer balance becomes zero.

Every step linked.

---

# 194. SUPPLIER 3-WAY MATCH SCENARIO

PO:

100 units × £10

Receipt:

80 units

Invoice:

100 × £10

Atlas:

recognises mismatch.

Does not silently approve invoice.

User sees:

Ordered 100  
Received 80  
Invoiced 100

Exception quantity:

20.

---

# 195. GRNI ACCEPTANCE SCENARIO

Goods received:

£10,000

No invoice yet.

Post:

Dr Inventory £10,000  
Cr GRNI £10,000

Supplier invoice later:

Dr GRNI £10,000  
Cr AP £10,000

GRNI clears.

---

# 196. MANUFACTURING ACCEPTANCE SCENARIO

Production Order:

Materials £20,000  
Labour £5,000  
Machine/overhead £7,000

WIP accumulates:

£32,000.

Output completed.

Finished Goods receives correct value.

Actual cost:

£34,000.

Variance:

£2,000.

Finance can explain source.

---

# 197. CUSTOMER CREDIT ACCEPTANCE SCENARIO

Customer Service requests:

£500 credit.

Finance approval required.

Request approved.

Draft Credit Note created.

Finance posts.

Customer AR reduces £500.

Case shows posted credit.

No duplicate posting possible.

---

# 198. MULTI-CURRENCY ACCEPTANCE SCENARIO

Supplier invoice:

€10,000.

Rate on invoice date:

0.86 GBP/EUR.

Liability:

£8,600.

Payment later equivalent:

£8,750.

Atlas posts:

£150 realised FX loss.

Do not rewrite original invoice cost.

---

# 199. BANK RECONCILIATION ACCEPTANCE

Bank statement receives:

£12,000

Reference matches Customer Invoice INV-001.

Atlas suggests customer payment.

User accepts.

Invoice settles.

Bank statement reconciles.

No duplicate journal created.

---

# 200. EXPENSE ACCEPTANCE

Employee submits:

£120 hotel.

Receipt attached.

Manager approves.

Finance approves.

Expense posts to correct department/project.

Employee reimbursement enters payment process.

---

# 201. FIXED ASSET ACCEPTANCE

Purchase forklift:

£80,000.

Procurement approved.

Supplier bill posted.

Finance capitalises Asset FA-001.

Useful life:

5 years.

Straight-line depreciation.

Monthly depreciation automatically generated.

Later disposal calculates NBV and gain/loss.

---

# 202. BUDGET CONTROL ACCEPTANCE

Department budget:

£100,000.

Actual:

£20,000.

Committed:

£60,000.

Available:

£20,000.

New requisition:

£30,000.

Atlas returns:

Budget exceeded by £10,000.

Policy determines warning/block/approval.

---

# 203. INTERCOMPANY ACCEPTANCE

Company A pays £10,000 expense belonging to Company B.

Atlas creates balanced cross-company accounting.

Company A:

Intercompany receivable.

Company B:

Intercompany payable plus expense.

Both share common reference.

Intercompany reconciliation matches.

---

# 204. CONSOLIDATION ACCEPTANCE

Group:

Company UK in GBP.

Company EU in EUR.

Consolidation:

translate EU accounts according to configured rules.

Aggregate both.

Remove intercompany balances/revenue.

Produce group:

P&L  
Balance Sheet  
Cash Flow

Preserve consolidation and elimination detail.

---

# 205. VAT ACCEPTANCE

Sales:

£1,000 net + VAT.

Purchase:

£500 net + recoverable VAT.

VAT return calculations must trace each total back to transactions.

Submitted return becomes locked/versioned.

Subsequent adjustment does not silently rewrite filing history.

---

# 206. TESTING

Finance calculations require substantially stronger tests than ordinary UI features.

Use targeted tests during development.

Core tests:

Double-entry balancing  
Posting atomicity  
Idempotency  
Journal reversal  
Period locks  
Dimension validation  
AR invoice  
Credit note  
Customer settlement  
Partial payment  
Credit control  
AP invoice  
Duplicate supplier invoice  
2-way match  
3-way match  
Match tolerance  
GRNI  
Supplier credit  
Payment run  
Bank reconciliation  
Multi-match reconciliation  
Bank transfer  
FX conversion  
Realised FX  
Unrealised FX  
Expense approval  
Asset depreciation  
Asset disposal  
Inventory valuation  
WIP  
Manufacturing variance  
Budget control  
VAT  
Intercompany  
Consolidation  
Approvals  
Permissions  
Audit

Financial test fixtures must use exact expected values.

Do not use imprecise floating-point assertions.

---

# 207. PERFORMANCE

Plan for:

millions of ledger lines  
large Sales volumes  
large bank histories  
many products  
many dimensions  
multiple companies  
years of history

Use:

proper indexes  
aggregated balances/read models  
pagination  
virtualised tables  
server-side reporting

Do not recalculate entire ledger balances from every raw line on every dashboard request.

---

# 208. ACCOUNT BALANCES

Maintain safe performant balance aggregates/materialised views where appropriate.

Ledger entries remain canonical.

Aggregates can always be rebuilt from ledger entries.

---

# 209. REPORT SNAPSHOTS

Posted accounting remains canonical.

Published management reports may optionally retain snapshots/version.

Do not use mutable dashboard cache as financial source of truth.

---

# 210. SECURITY REVIEW

Before completion verify:

Finance user only sees authorised companies.

Sensitive expenses protected.

Bank data protected.

Payment approvals protected.

Closed periods cannot be bypassed.

Journal posting cannot be called by unauthorised API user.

Supplier bank changes audited.

---

# 211. MIGRATIONS

Finance migrations require particular care.

Use:

reversible schema migration where possible  
validation before data migration  
balance checks

Never silently modify historical financial amounts.

---

# 212. DATA IMPORT VALIDATION

Before migration completion verify:

Total debits = total credits.

Opening AR = imported customer balances.

Opening AP = imported supplier balances.

Inventory value = agreed opening value.

Fixed asset NBV = imported register.

Bank opening balance = agreed balance.

---

# 213. UK LOCALISATION

Create a modular localisation framework.

Initial UK localisation can support:

GBP defaults  
UK VAT  
Making Tax Digital connector architecture  
CIS where enabled  
UK tax codes  
UK invoice requirements where configured

Do not hard-code UK rules into core global ledger logic.

---

# 214. FUTURE LOCALISATIONS

Architecture should permit:

EU VAT  
GST  
Sales tax  
withholding  
country charts of accounts  
country-specific electronic reporting

without rewriting Finance.

---

# 215. E-INVOICING

Prepare a connector interface for structured electronic invoicing.

Do not implement country-specific e-invoice networks without current requirement.

Financial document model should support:

external document ID  
delivery status  
provider response

---

# 216. PAYMENT PROVIDERS

Create connector abstraction for future integrations such as:

banking provider  
Stripe  
PayPal  
direct debit provider

Do not put provider-specific logic in General Ledger.

---

# 217. FINANCE DOCUMENTATION

Build in-app documentation under:

Finance → Help

Documentation must cover:

Finance overview  
Chart of Accounts  
Financial Dimensions  
Journals  
Receivables  
Credit Control  
Collections  
Payables  
Supplier Bills  
Invoice Matching  
Payment Runs  
Bank Reconciliation  
Expenses  
Fixed Assets  
Budgeting  
Inventory Accounting  
Manufacturing Costing  
Tax / VAT  
Multi-Currency  
Intercompany  
Consolidation  
Period Close  
Reports

Use plain business language.

---

# 218. CONTEXTUAL HELP

Important pages should explain difficult concepts.

Examples:

**Why is this invoice on hold?**

3-way match failed.

**Why is this order credit-held?**

Customer exposure exceeds configured credit limit.

**Why is this period unavailable?**

September accounting period is closed.

---

# 219. ROLE-BASED EXPERIENCE

Finance roles may include:

Finance Administrator  
Finance Director  
Financial Controller  
Management Accountant  
Accounts Receivable  
Credit Controller  
Accounts Payable  
Treasury  
Expense Approver  
Asset Accountant  
Auditor / Read Only

Do not force every role to see every Finance menu.

---

# 220. DEFINITION OF DONE

Finance is not complete because it can produce an invoice and P&L.

It is complete when Atlas can execute coherent end-to-end accounting.

### Order to Cash

Sales Order  
→ delivery  
→ invoice  
→ AR  
→ receipt  
→ reconciliation  
→ collections/reporting

### Procure to Pay

Requisition  
→ PO  
→ receipt  
→ supplier bill  
→ invoice match  
→ approval  
→ payment  
→ reconciliation

### Manufacturing

Materials  
→ WIP  
→ production  
→ finished stock  
→ COGS  
→ variance

### Record to Report

Business transactions  
→ ledger  
→ adjustments  
→ close  
→ financial statements

### Asset Lifecycle

Purchase  
→ capitalise  
→ depreciate  
→ transfer  
→ dispose

### Budget to Control

Budget  
→ requisition/commitment  
→ actual  
→ variance  
→ forecast

### Tax

Transactions  
→ tax ledger  
→ return  
→ filing  
→ payment/reconciliation

### Group Finance

Legal entities  
→ intercompany  
→ reconciliation  
→ translation  
→ elimination  
→ consolidated accounts

These workflows must be real application flows.

---

# 221. FINAL ARCHITECTURE REVIEW

Before declaring completion, inspect the implementation as:

Finance Director  
Financial Controller  
Management Accountant  
AP Clerk  
AR/Credit Controller  
Treasury User  
Production Accountant  
Auditor  
ERP Architect

Look specifically for:

unbalanced postings  
editable posted journals  
hard-coded GL accounts  
duplicate postings  
duplicate supplier invoices  
weak invoice matching  
incorrect GRNI  
incorrect inventory valuation  
incorrect WIP  
missing manufacturing variance  
poor FX handling  
unreconciled subledgers  
weak period locks  
payments bypassing approvals  
missing tax audit trail  
intercompany mismatches  
poor report drill-down  
slow ledger queries  
missing permissions  
weak auditability

Fix meaningful issues.

---

# 222. IMPLEMENTATION PRIORITY

Because this is a very large module, implement in coherent vertical slices.

## Foundation

General Ledger  
Chart of Accounts  
Dimensions  
Periods  
Posting engine  
Posting profiles  
Audit

## Order to Cash

AR  
Customer invoices  
Payments  
Credit control  
Collections

## Procure to Pay

AP  
Supplier invoices  
Matching  
Payment runs

## Banking

Feeds/import  
Reconciliation  
Cash

## Cost Accounting

Inventory  
Manufacturing  
WIP

## Fixed Assets / Expenses

## Budgeting / Forecast

## Tax

## Intercompany / Consolidation

## Close / Reporting

Do not stop after writing this implementation plan.

Continue implementing as far through the scope as the codebase allows safely.

Prefer a working, correct accounting foundation over dozens of disconnected screens.

---

# 223. FINAL CODEX RESPONSE

When implementation is complete, report:

## Built

Actual Finance capabilities implemented.

## Accounting Engine

Ledger, dimensions, posting and period controls.

## AR

What works.

## AP

What works.

## Banking

What works.

## Costing

Inventory/manufacturing integration.

## Fixed Assets / Expenses

What works.

## Budget / Tax

What works.

## Group Finance

Intercompany/consolidation.

## Integrations

Sales  
Procurement  
Inventory  
Manufacturing  
S&OP  
Customer Service  
Approvals  
HR

## Database

Important migrations.

## Tests

Actual checks run and results.

## Documentation

Help sections added.

## Remaining Gaps

Only genuine unfinished items.

Do not claim a capability because a button or placeholder exists.

Do not dump source code into the response.

The working Atlas Finance implementation is the deliverable.

---

# FINAL PRODUCT EXPECTATION

Atlas Finance should feel simple enough that an ordinary business user can:

send an invoice  
submit an expense  
check a customer balance  
reconcile a bank transaction

without understanding ERP accounting architecture.

But underneath that simple interface, a Finance Director must have:

double-entry integrity  
financial dimensions  
budget controls  
invoice matching  
approval controls  
credit management  
inventory accounting  
manufacturing costing  
multi-currency  
period close  
audit trails  
intercompany  
consolidation  
tax reporting  
full drill-through

That combination is the goal.

Do not copy Xero's limits.

Use its usability standard.

Build the financial engine expected from a serious ERP.