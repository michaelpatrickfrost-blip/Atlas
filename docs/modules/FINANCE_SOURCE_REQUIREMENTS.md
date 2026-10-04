# ATLAS FINANCE
## Finance, Purchasing, Spend Control, Banking & Business Performance

### Product objective

Atlas Finance is not simply where accountants enter journals.

It is the financial control layer for the entire Atlas platform.

Every event elsewhere in Atlas that has a financial consequence should flow naturally into Finance:

**Sales → Order → Dispatch → Invoice → Receivable → Payment → Bank**

**Purchase Request → Approval → PO → Receipt → Supplier Invoice → Payment → Bank**

**Product → Purchase Cost → Freight → Stock Value → Sale → Cost of Goods Sold → Margin**

**Expense → Receipt → Approval → Reimbursement → Ledger**

**Project → Commitments → Actual costs → Revenue → Margin**

Finance therefore becomes the single financial truth of the organisation without forcing users to understand accounting terminology just to perform their jobs.

The underlying engine remains full double-entry accounting, but ordinary users should almost never need to create accounting entries themselves.

Odoo demonstrates the value of automatically creating the accounting entries behind invoices, supplier bills, expenses and inventory valuations. Atlas should take this principle much further.

---

# 1. FINANCE HOME

The Finance landing page should feel more like a business command centre than an accounting application.

### Top financial position

Show:

- Bank balance
- Available cash
- Forecast cash
- Receivables
- Payables
- Overdue receivables
- Overdue payables
- Revenue this month
- Gross margin
- Operating expenses
- Profit before tax
- VAT liability
- Inventory value
- Committed purchasing
- Available budget
- Debt position
- Working capital

Every metric is clickable.

Click **£486k receivables** and Atlas opens the actual invoices.

Click **£93k committed purchasing** and Atlas shows the purchase orders causing it.

Click **£1.7m inventory value** and Atlas breaks that value down by product, warehouse, product family and ageing.

---

# 2. FINANCE WORKSPACES

Do not create fifty menu options.

The left navigation should initially contain:

### Overview
Financial command centre.

### Sales & Receivables
Everything customers owe the business.

### Purchases & Payables
Everything the business is buying or owes suppliers.

### Spend
Purchase requests, expenses, cards, approvals and spend control.

### Banking
Bank accounts, payments, receipts, reconciliation and cash.

### Accounting
Ledger, journals, periods, accruals and technical accounting.

### Assets
Fixed assets, depreciation and leases.

### Planning
Budgets, forecasts, scenarios and cash planning.

### Tax
VAT, tax configuration, returns and compliance.

### Reporting
Financial reporting, management reporting and analysis.

### Control Centre
Approvals, exceptions, audit, fraud controls and close.

This gives Atlas enormous depth without presenting users with an ERP maze.

---

# 3. PURCHASE-TO-PAY

This needs to be a major Atlas capability.

Purchasing should not start with a purchase order.

It starts with somebody wanting to spend company money.

## Stage 1: Purchase request

Any authorised employee can raise a request.

Example:

**Purchase 10 new warehouse scanners**

The request contains:

- description
- required date
- quantity
- estimated price
- supplier if known
- product/service category
- department
- cost centre
- project
- site
- reason
- supporting documents
- quotations
- preferred supplier
- budget
- capital expenditure flag
- recurring purchase flag

Atlas immediately shows:

**Estimated spend: £8,420**

**Department budget remaining: £41,230**

**After approval: £32,810**

**Supplier: Approved**

**3 quotations required: Yes**

**Approval route: Warehouse Manager → Operations Director**

The requester does not need to understand nominal codes.

Atlas determines that later.

Purchase requisition workflows and conditional approval routing are standard capabilities in systems such as Dynamics 365.

---

# 4. APPROVAL ENGINE

This should be a platform-wide Atlas service rather than something built only for Finance.

Finance administrators can create rules such as:

| Spend | Approval |
|---|---|
| £0 to £250 | Automatic / manager |
| £251 to £2,500 | Department manager |
| £2,501 to £10,000 | Head of department |
| £10,001 to £50,000 | Director |
| £50,000+ | CFO + CEO |

But values are only one condition.

Rules can use:

- department
- supplier
- category
- project
- location
- product
- capital expenditure
- recurring spend
- contract status
- budget status
- variance from previous purchase
- risk score
- supplier status
- employee
- legal entity
- currency

Atlas supports parallel and sequential approvals.

Example:

£70,000 machinery purchase:

Operations Director  
↓  
Finance Director  
↓  
CEO

Or simultaneously:

Operations Director + Engineering Director

Then:

Finance Director.

### Approval delegation

If someone is away:

**Delegate approvals from 3 October to 11 October to Sarah.**

Audit history records both the original approver and delegate.

### Escalations

Atlas can automatically escalate:

> Awaiting approval for 48 hours.

### Approval inbox

Managers get one simple screen:

**Needs your approval**

Each item shows:

£12,600  
Supplier  
Requester  
Reason  
Budget impact  
Previous purchases  
Supporting quote  
Risk warnings

Buttons:

**Approve**

**Reject**

**Request information**

**Delegate**

Do not make approvers navigate around the ERP.

---

# 5. PURCHASE ORDERS

Once approved, Atlas can generate the PO automatically.

Purchase order supports:

- products
- services
- free-text items
- delivery locations
- multiple delivery dates
- tax
- currency
- supplier references
- contract references
- project allocation
- cost centres
- attachments
- payment terms
- Incoterms
- freight
- landed costs
- partial deliveries
- deposits
- prepayments

Xero already connects purchase orders to subsequent supplier bills. Atlas should maintain that principle but add enterprise spend controls and receiving.

---

# 6. GOODS RECEIVING

Finance must connect directly with Logistics and Inventory.

Warehouse receives:

**PO-004921**

Ordered: 1,000 units  
Received: 940  
Damaged: 12  
Accepted: 928  
Outstanding: 60

Atlas records the receipt against the PO.

Finance now knows:

- goods ordered
- goods received
- goods outstanding
- expected invoice amount
- goods received but not invoiced
- purchase commitment remaining

The warehouse user does not make accounting entries.

Atlas handles the financial consequence automatically.

---

# 7. SUPPLIER INVOICE CAPTURE

Supplier invoices should be accepted through:

- upload
- drag and drop
- email inbox
- supplier portal
- mobile photograph
- API
- EDI
- PEPPOL/e-invoicing where relevant

Atlas extracts:

- supplier
- invoice number
- invoice date
- due date
- PO
- line items
- quantities
- unit price
- VAT
- totals
- bank information
- currency

Then it attempts to match automatically.

---

# 8. THREE-WAY MATCHING

This is critical.

Atlas compares:

**Purchase Order**

against

**Goods Receipt**

against

**Supplier Invoice**

Dynamics provides two-way and three-way invoice matching with configurable tolerances. Atlas should include the same control but make the result dramatically easier to understand.

Example:

PO quantity: 1,000  
Received: 1,000  
Invoice: 1,000

PO price: £2.50  
Invoice price: £2.50

### Result

**MATCHED**

No human intervention required.

---

If the supplier invoice says £2.72:

### Atlas shows

**Price variance detected**

Expected: £2,500  
Invoiced: £2,720  
Variance: +£220 / +8.8%

Tolerance: 2%

**Approval required**

The system explains the problem instead of displaying an obscure accounting warning.

---

# 9. TOUCHLESS ACCOUNTS PAYABLE

Atlas should aim for invoices to process without finance touching them.

If:

- supplier recognised
- PO exists
- receipt matches
- price matches
- VAT valid
- payment details unchanged
- budget valid
- invoice not duplicated

then:

invoice capture  
→ matching  
→ approval  
→ posting  
→ payment queue

can happen automatically.

Dynamics already provides automated receipt matching and workflow submission for supplier invoices. Atlas should make this the default philosophy.

Finance should manage **exceptions**, not type invoices.

---

# 10. SUPPLIER MANAGEMENT

Every supplier gets a complete financial record.

### Supplier overview

Show:

- supplier status
- spend YTD
- last 12 months
- outstanding payable
- average invoice
- average payment days
- agreed terms
- currency
- VAT number
- tax information
- bank details
- contracts
- insurance expiry
- purchasing categories
- contacts
- open POs
- invoices
- credits
- disputes
- quality issues
- delivery performance
- spend trend

### Supplier onboarding

New suppliers require configurable checks.

For example:

Supplier requested  
→ Procurement review  
→ Finance review  
→ Bank details verification  
→ Compliance documents  
→ Approval  
→ Active

Nobody should simply type a new supplier into Atlas and start paying them.

---

# 11. BANK DETAIL CHANGE CONTROL

This deserves its own security process.

Supplier bank details cannot simply be overwritten.

A change should create:

**BANK DETAILS CHANGE REQUEST**

Old account  
New account  
Changed by  
Date  
Supporting evidence

Then require independent approval.

Possible policy:

Requester cannot approve their own change.

Payment blocked until verification completed.

Previous details remain in audit history permanently.

---

# 12. DUPLICATE PAYMENT PREVENTION

Atlas checks:

- supplier
- invoice number
- invoice date
- amount
- PO
- bank account
- near-identical invoice numbers
- duplicate uploaded document
- similar OCR result

It should flag:

> Possible duplicate invoice. 94% match with INV-19384 entered six days ago.

---

# 13. EXPENSE MANAGEMENT

Employees should have a beautifully simple expense experience.

Take photo.

Atlas reads the receipt.

It extracts:

Merchant  
Date  
VAT  
Amount  
Currency  
Category

Employee selects:

**Customer visit**

Atlas suggests:

Sales → Travel → Customer ABC.

Submit.

Done.

---

# 14. EXPENSE POLICY ENGINE

Policies can control:

- meal limits
- hotels
- travel
- mileage
- entertainment
- alcohol
- company cards
- international spending
- mileage rates
- receipt requirements
- approval thresholds
- weekend spending
- personal expenses

Atlas should not just say:

**Rejected**

It should explain:

> Hotel expense is £34 above the policy limit. Manager approval required.

Odoo, for example, routes submitted employee expenses to authorised approvers before posting them into accounting. Atlas should preserve that control while giving users a much cleaner workflow.

---

# 15. COMPANY CARDS

Atlas can support corporate card feeds.

Each card transaction automatically appears against the cardholder.

### £47.30
Shell Service Station

Atlas suggests:

**Vehicle fuel**

Employee adds receipt.

Finance sees:

Matched.

Missing receipt transactions appear automatically in:

**Needs attention**

Managers can see spending by card, employee, department and category.

---

# 16. ACCOUNTS PAYABLE

Dedicated AP workspace.

### AP dashboard

Outstanding payables  
Due today  
Due this week  
Overdue  
Invoices awaiting approval  
Invoices without PO  
Invoices with discrepancies  
Credits awaiting allocation  
Payment runs awaiting approval

Filters:

supplier  
currency  
entity  
business unit  
department  
due date  
payment method  
risk

---

# 17. PAYMENT RUNS

Atlas proposes payments based on:

- due dates
- supplier terms
- available cash
- early payment discounts
- disputed invoices
- payment holds
- priority suppliers
- cash forecast

Example:

## Proposed payment run

126 invoices  
£438,220 total

Due today: £151,400  
Due within 7 days: £286,820

Atlas highlights:

**£18,420 cash discount available if paid today**

and:

**Paying entire run leaves forecast headroom of £671k.**

Finance can remove or defer individual payments.

---

# 18. PAYMENT APPROVAL

Creating a payment should not mean authorising it.

Example:

AP Clerk creates run.

Finance Manager reviews.

Finance Director authorises.

Bank file/API payment is then generated.

Full segregation of duties.

---

# 19. BANKING

Banking needs Xero-level simplicity but enterprise-level control.

Xero demonstrates how useful automatic bank feeds, suggested matching and bank rules are for daily finance operations.

Atlas Banking should support:

- multiple banks
- multiple accounts
- bank feeds
- currencies
- credit cards
- loans
- deposits
- merchant accounts
- payment providers
- bank statement imports
- Open Banking integrations

### Bank screen

HSBC Current Account

Ledger balance: £782,440  
Bank balance: £782,440  
Unreconciled: £0

Another account:

Ledger: £219,400  
Bank: £214,900

**£4,500 unreconciled**

Click it.

Atlas shows the difference.

---

# 20. SMART BANK RECONCILIATION

Incoming:

£14,820.00

Atlas searches open invoices.

It finds:

INV-4192 £9,200  
INV-4203 £5,620

Customer reference matches.

### Suggested match

Confidence: 99%

**Reconcile**

One click.

If confidence is sufficiently high and company policy permits it, Atlas can auto-reconcile.

---

# 21. ACCOUNTS RECEIVABLE

Sales flows automatically into Finance.

Customer order:

£12,000

Dispatch completed.

Invoice generated.

Finance records:

Revenue  
VAT  
Accounts receivable

Payment received.

Invoice settled.

No rekeying.

---

# 22. CUSTOMER FINANCIAL PROFILE

Because Atlas Sales and Finance share the same customer record, salespeople should see the financial context they are authorised to see.

Customer:

**ABC Civils**

Credit limit: £150,000  
Outstanding: £127,000  
Overdue: £21,400  
Open orders: £46,000

Potential exposure:

£173,000

Atlas warns:

> Completing all open orders would exceed the approved credit limit by £23,000.

The salesperson can request a credit override directly from the order.

Finance receives the request.

---

# 23. CREDIT CONTROL

Dedicated collections workspace.

Customers grouped into:

Current  
1-30 days  
31-60  
61-90  
90+  
Disputed  
Payment plan  
Legal / collection

Atlas records:

- calls
- emails
- promises to pay
- disputes
- notes
- payment plans
- credit holds
- collection status

Finance sees:

**Promised today: £84,000**

**Received: £61,000**

---

# 24. SMART COLLECTIONS

Atlas identifies which accounts need attention.

Not simply:

“Invoice overdue.”

Instead:

> ABC normally pays within 31 days. This invoice is now 46 days old and no dispute exists.

or:

> Three invoices totalling £48,000 become due in the next seven days. Customer's average payment delay is 12 days.

This gives credit controllers an intelligent queue.

---

# 25. CUSTOMER DISPUTES

If a customer disputes an invoice:

**INV-18922**

Reason:
Damaged goods

The dispute connects to:

Customer Service ticket  
Sales order  
Delivery  
Product  
Credit note  
Finance

Finance can therefore see why money is withheld rather than maintaining notes in another system.

---

# 26. CREDIT NOTES & REFUNDS

Credit notes can originate from:

- pricing correction
- return
- damaged goods
- service complaint
- goodwill
- cancelled order
- rebate
- overpayment

Approval requirements can vary by value and reason.

A £50 pricing correction may auto-approve.

A £40,000 commercial credit could require Sales Director + Finance Director.

---

# 27. PRODUCT PROFITABILITY

This is where Atlas can outperform Xero-type accounting systems.

Product record:

**SP1**

Selling price  
Standard cost  
Actual cost  
Average cost  
Freight  
Handling  
Rebates  
Manufacturing cost  
Margin  
Margin %  
Inventory value  
Stock ageing

Because Product, Logistics, Sales and Finance share information, Atlas can calculate the actual economics of the product.

---

# 28. INVENTORY ACCOUNTING

Support:

- standard costing
- weighted average
- FIFO
- inventory valuation
- stock adjustments
- write-offs
- scrap
- transfers
- landed costs
- production variances
- purchase price variance
- stock revaluation

Odoo demonstrates the importance of connecting physical movements to stock valuation and supporting FIFO, average and standard costing.

---

# 29. LANDED COST

Atlas should calculate what stock actually costs.

Example:

Purchase value: £80,000  
Freight: £7,500  
Customs: £2,100  
Insurance: £900

Total landed cost:

**£90,500**

Atlas allocates this across the received products based on configurable methods:

quantity  
weight  
volume  
purchase value  
manual allocation

This gives actual product margin rather than fake margin based only on supplier price.

---

# 30. GENERAL LEDGER

Behind everything is a proper accounting engine.

Support:

- chart of accounts
- journals
- accounting periods
- fiscal years
- dimensions
- journal templates
- recurring journals
- reversals
- allocations
- accruals
- prepayments
- deferred revenue
- deferred expense
- intercompany
- consolidation
- multi-currency
- multi-entity
- exchange revaluation
- retained earnings

But hide this complexity from ordinary Atlas users.

---

# 31. DIMENSIONS

Do not force businesses to create thousands of nominal accounts.

Transactions can carry dimensions such as:

Account  
Department  
Cost centre  
Site  
Region  
Project  
Product family  
Sales channel  
Customer  
Supplier

Example:

**Travel**

can then be analysed by:

Sales  
Marketing  
Operations  
Project  
Site

without creating a separate travel ledger account for every combination.

---

# 32. AUTOMATIC ACCRUALS

Atlas identifies:

goods received but no invoice  
services delivered but not invoiced  
annual contracts covering future periods  
prepaid insurance  
deferred income

At month end Atlas proposes:

**17 accruals identified**

Total: £142,600

Finance reviews and posts.

Reversals can occur automatically next month.

---

# 33. FIXED ASSETS

Asset register covering:

- machinery
- vehicles
- computers
- buildings
- fixtures
- tools
- equipment
- intangible assets

Record:

purchase cost  
purchase date  
supplier  
serial number  
location  
department  
asset owner  
depreciation method  
useful life  
residual value  
current net book value

Automatically create depreciation journals.

---

# 34. ASSET LIFECYCLE

Purchase request marked:

**Capital expenditure**

Once received and invoiced:

Atlas asks:

> Create fixed asset?

Asset generated automatically.

Later:

transfer  
revalue  
impair  
dispose  
sell  
write off

with the appropriate accounting automatically created.

---

# 35. BUDGETING

Budgets need to become operational, not spreadsheets finance uploads once a year.

Budget by:

company  
department  
cost centre  
project  
product  
region  
account  
month

Example:

Marketing annual budget: £500,000

Actual: £273,000  
Committed: £72,000  
Remaining: £155,000

The **committed** number is important.

Approved purchase orders should consume budget before invoices arrive.

---

# 36. BUDGET CONTROL

A purchase request can display:

Budget: £50,000  
Actual: £31,000  
Committed: £14,000  
Available: £5,000

New request: £9,000

Atlas:

**£4,000 over available budget**

Depending on policy:

Warn  
Require additional approval  
Block

---

# 37. FORECASTING

Forecasts should incorporate actual operational data.

Atlas already knows:

Sales pipeline  
Confirmed sales orders  
Production plans  
Purchase orders  
Payroll  
Recurring expenses  
Projects  
Customer payment behaviour  
Supplier payment terms

Finance forecasting should use this data automatically.

Not:

**“Please update the spreadsheet.”**

---

# 38. CASH FLOW FORECASTING

Cash model:

Today  
7 days  
30 days  
60 days  
90 days  
6 months  
12 months

Include:

opening cash  
expected receipts  
expected payments  
payroll  
VAT  
tax  
loans  
leases  
capital expenditure  
purchase commitments  
forecast sales

Dynamics similarly treats cash management and forecasting as core Finance functions.

---

# 39. SCENARIO PLANNING

Allow management to create scenarios.

### Base

£4.8m monthly revenue.

### Downside

Sales -15%

### Growth

Sales +20%  
10 additional employees  
£400k machinery purchase

Atlas recalculates:

Profit  
Cash  
Working capital  
Stock requirement  
Debtors  
Credit requirement

without affecting live accounting.

---

# 40. VAT AND TAX

For UK businesses, Atlas should support proper VAT functionality including:

standard rate  
reduced rate  
zero rated  
exempt  
outside scope  
reverse charge  
imports  
exports  
partial exemption where required

Create VAT returns from underlying transactions.

Users should be able to drill from:

**VAT payable £84,217**

directly into every transaction making up that balance.

Making Tax Digital integration should be part of the UK localisation.

---

# 41. FOREIGN CURRENCY

Support:

Customer invoice: EUR  
Supplier invoice: USD  
Company books: GBP

Record:

transaction currency  
base currency  
exchange rate  
settlement rate  
realised FX gain/loss  
unrealised FX gain/loss

Finance can perform automated currency revaluation.

---

# 42. MULTI-COMPANY

Atlas must be designed for organisations operating:

Company A  
Company B  
Company C

Each company may have:

own accounts  
own VAT  
own bank accounts  
own currency  
own tax rules

But management can view:

**Group**

with consolidation and elimination of intercompany transactions.

---

# 43. INTERCOMPANY

Company A sells to Company B.

Atlas creates:

Company A receivable

and automatically:

Company B payable.

One side should never exist without the other.

Reconciliation occurs automatically.

---

# 44. MONTH-END CONTROL CENTRE

This could be one of Atlas Finance's killer features.

Instead of finance maintaining an Excel checklist:

## October close

Bank reconciliation  
✓ Complete

Accounts receivable  
✓ Complete

Accounts payable  
✓ Complete

Stock valuation  
⚠ 3 exceptions

Accruals  
⚠ Review required

Fixed assets  
✓ Complete

Payroll  
✓ Posted

Intercompany  
⚠ £7,240 difference

VAT  
○ Not started

Management accounts  
○ Pending

Overall close:

**78%**

Target close: 5 November

Owner and deadline attached to every step.

---

# 45. CLOSE ASSISTANT

Atlas searches for unusual conditions before closing.

For example:

**14 invoices dated October remain in draft.**

**3 warehouses have unposted stock adjustments.**

**Bank account ending 8721 has £4,210 unreconciled.**

**£94,000 goods received have not been invoiced.**

**2 intercompany balances do not agree.**

That is far more useful than finance manually discovering these issues.

---

# 46. AUDIT TRAIL

Every significant action records:

Who  
What  
When  
Previous value  
New value  
Reason  
Approval  
Device/session where appropriate

No posted accounting transaction is silently overwritten.

Corrections happen through:

reversal  
credit  
adjustment  
replacement entry

leaving the history intact.

---

# 47. SEGREGATION OF DUTIES

Atlas needs enterprise-grade permissions.

Potential conflicts:

Create supplier + change supplier bank + authorise payment

Create purchase + approve purchase

Enter invoice + approve invoice

Create refund + authorise refund

Create journal + approve journal

Atlas can detect risky permission combinations.

Administrators receive:

**Control conflict detected**

rather than finding the problem during an audit.

---

# 48. FINANCIAL EXCEPTION CENTRE

Instead of making finance inspect thousands of perfectly normal transactions, Atlas produces one intelligent queue.

### Needs attention

7 unmatched bank transactions  
4 invoices above tolerance  
2 duplicate invoice warnings  
6 overdue approvals  
3 supplier bank changes  
11 expenses missing receipts  
2 customers over credit limit  
1 unusual journal  
3 stock valuation differences

This should be the daily workspace for finance.

---

# 49. FINANCIAL REPORTING

Standard reports:

Profit & Loss  
Balance Sheet  
Cash Flow  
Trial Balance  
General Ledger  
Aged Receivables  
Aged Payables  
VAT  
Budget vs Actual  
Cash Forecast  
Inventory Valuation  
Fixed Assets  
Expense Analysis  
Supplier Spend  
Customer Profitability  
Product Profitability  
Project Profitability  
Cost Centre Performance

But reports cannot just be PDFs.

Every value should be explorable.

---

# 50. DRILL ANY NUMBER

P&L:

Transport Costs

**£418,220**

Click.

Warehouses:

Doncaster £181k  
Leeds £92k  
Manchester £145k

Click Doncaster.

Carriers.

Click carrier.

Invoices.

Click invoice.

Original PDF.

This is how Atlas removes the gap between reporting and ERP transactions.

---

# 51. CUSTOM FINANCIAL REPORT BUILDER

Link this directly with the Atlas Dashboard platform.

Users choose:

Measures  
Dimensions  
Periods  
Comparisons  
Filters

Example:

**Gross margin by customer by product category, comparing this quarter with last year.**

No finance developer or BI specialist required.

Save.

Share with Finance Team.

Or publish to management.

Export to Excel when required.

---

# 52. MANAGEMENT PACKS

Create recurring management packs.

Example:

### Monthly Board Pack

Executive summary  
Revenue  
Gross margin  
EBITDA  
Cash  
Working capital  
Sales performance  
Inventory  
Receivables  
Payables  
Forecast  
Budget variance

Atlas generates it automatically from live data.

Finance reviews commentary and publishes.

---

# 53. SMART VARIANCE EXPLANATIONS

Atlas should not just report:

Transport costs +18%.

It investigates the underlying transactions.

Example:

> Transport costs increased £42,300 versus September. £29,800 relates to higher third-party haulage volumes, £8,100 relates to fuel surcharge increases and £4,400 relates to two exceptional deliveries.

Finance can verify the explanation before using it.

---

# 54. ASK ATLAS FINANCE

Natural language querying:

**“Why is gross margin down this month?”**

**“Which customers owe us more than £20,000 and are over 30 days late?”**

**“What suppliers have we spent most with this year?”**

**“Show purchases over £10,000 made without an approved PO.”**

**“How much cash will we have on 31 December?”**

Atlas returns the answer plus the transactions used to calculate it.

AI must never invent a financial answer.

Every figure is generated from actual Atlas records.

---

# 55. ANOMALY DETECTION

Atlas continuously watches for unusual activity.

Examples:

Supplier invoice materially higher than normal

Payment to a newly changed bank account

Employee expense considerably above normal pattern

Repeated amounts

Invoices entered just below approval limits

Unusual weekend transaction

Unexpected margin collapse

Large manual journal

Rapid supplier bank changes

Duplicate invoice patterns

These are warnings, not accusations.

---

# 56. PURCHASE INTELLIGENCE

Atlas should understand corporate spend.

Finance can ask:

**Where are we spending money?**

Categories:

Raw materials  
Packaging  
Transport  
Utilities  
IT  
Marketing  
Professional services  
Travel  
Maintenance

Then identify:

fragmented spend  
price changes  
supplier concentration  
duplicate suppliers  
off-contract spend  
renewals  
saving opportunities

---

# 57. CONTRACT AND RENEWAL CONTROL

Supplier contract:

Microsoft 365

£48,000/year

Renewal:

1 March 2027

Notice period:

90 days

Atlas warns before the cancellation window closes.

Finance can see upcoming commitments.

---

# 58. RECURRING EXPENDITURE

Atlas recognises regular payments.

Examples:

rent  
insurance  
software  
telecommunications  
utilities  
leases

It can detect:

> Adobe subscription increased 14% compared with the previous charge.

or:

> This service has been charged monthly but no active contract is recorded.

---

# 59. EXPENDITURE COMMITMENTS

This is important.

Traditional accounting shows what has already happened.

Atlas also shows what has been committed.

Example:

Cash: £2.4m

Supplier invoices outstanding: £710k

Approved POs not yet invoiced: £920k

Approved capital projects: £400k

Therefore management understands future obligations, not simply today's bank balance.

---

# 60. PROJECT FINANCE

Project:

Warehouse Expansion

Budget: £1.4m  
Approved commitments: £960k  
Actual invoiced: £710k  
Paid: £490k  
Forecast final cost: £1.52m

**Forecast overspend: £120k**

Purchases and expenses automatically roll into the project.

---

# 61. SALES + FINANCE CONNECTION

Sales should know:

customer balance  
credit limit  
payment history  
credit hold  
outstanding disputes

Finance should know:

pipeline  
confirmed orders  
future invoicing  
expected margin  
contract commitments

Neither team works blind.

---

# 62. PRODUCT + FINANCE CONNECTION

Finance receives:

stock value  
product cost  
landed cost  
production variance  
scrap  
write-offs  
margin

Product/Operations receives:

supplier pricing trends  
purchase price variance  
stock carrying value  
slow-moving stock cost

---

# 63. LOGISTICS + FINANCE CONNECTION

Logistics costs attach to:

shipment  
customer  
order  
product  
route  
carrier

Atlas can therefore calculate:

Revenue: £2,000  
Product cost: £1,080  
Delivery cost: £310

True contribution:

**£610**

rather than pretending the margin was £920.

---

# 64. CUSTOMER SERVICE + FINANCE CONNECTION

Customer complaint can trigger:

credit request  
refund  
replacement  
write-off

Finance sees the originating customer service case.

Customer Service sees the financial status without needing access to the Finance ledger.

---

# 65. FINANCE DATA MODEL

At the technical level, major financial objects should include:

Legal Entity  
Ledger  
Account  
Dimension  
Fiscal Period  
Journal  
Journal Entry  
Journal Line  
Customer Account  
Supplier Account  
Bank Account  
Invoice  
Invoice Line  
Credit Note  
Payment  
Settlement  
Purchase Request  
Purchase Order  
Goods Receipt  
Supplier Invoice  
Expense  
Card Transaction  
Budget  
Forecast  
Commitment  
Asset  
Tax Transaction  
Currency Rate  
Approval  
Financial Period  
Reconciliation  
Financial Report

Everything uses stable IDs and a complete audit history.

---

# 66. DOCUMENT GRAPH

Every financial transaction should show its complete lineage.

For a supplier payment:

**Payment PAY-4882**

← Supplier Invoice INV-8291

← Goods Receipt GR-1943

← Purchase Order PO-1902

← Purchase Request PR-1331

← Approved by Sarah Ellis

Click any object.

For a customer receipt:

Payment

← Invoice

← Dispatch

← Sales Order

← Quote

← Opportunity

This is vastly more intuitive than switching between modules searching for references.

---

# 67. UNIVERSAL FINANCIAL TIMELINE

Every object has a timeline.

Example supplier invoice:

2 Oct 09:21  
Invoice received by email

09:21  
Atlas extracted invoice

09:22  
Matched PO

09:22  
Three-way match passed

09:22  
Submitted for approval

10:14  
Approved by James

10:14  
Posted

3 Oct 08:00  
Added to proposed payment run

Complete history in one place.

---

# 68. ROLE-BASED EXPERIENCES

### CFO

Cash  
Profitability  
Forecast  
Risk  
Working capital  
Budgets

### Finance Manager

Close  
Approvals  
Exceptions  
Reporting  
Controls

### AP Clerk

Invoices  
Supplier accounts  
Payments  
Exceptions

### AR / Credit Controller

Receivables  
Collections  
Customer disputes  
Cash allocation

### Procurement

Requests  
POs  
Suppliers  
Contracts  
Spend

### Employee

My expenses  
My requests  
My approvals

Same platform, different experience.

---

# 69. SEARCH

Global Atlas search should recognise:

PO-12984  
Invoice 43902  
ABC Civils  
£14,820  
Supplier  
Customer  
Bank reference  
Product code

Searching an amount should even find transactions containing that value.

---

# 70. FINANCE NOTIFICATIONS

Avoid notification spam.

Create an intelligent Finance inbox.

Examples:

**Requires you**

£18,200 purchase approval

**Exception**

Supplier invoice exceeds PO by 7%

**Risk**

Supplier bank details changed before £62k payment

**Deadline**

VAT return due in 7 days

**Insight**

Customer overdue exposure increased £84k this week

---

# 71. PERIOD LOCKING

Finance controls accounting periods.

Open  
Soft closed  
Closed  
Locked

Different ledgers can have different control states.

Finance may allow AP invoices while preventing manual journals, for example.

Reopening a closed period requires approval and creates an audit entry.

---

# 72. DATA IMPORT & MIGRATION

Atlas Finance should support:

CSV  
Excel  
API  
bank formats  
accounting migrations

Import:

chart of accounts  
customers  
suppliers  
opening balances  
outstanding invoices  
assets  
bank balances  
historical transactions

Migration tooling should include validation before posting anything.

---

# 73. INTEGRATIONS

Finance integration framework should accommodate:

Open Banking  
payment providers  
Stripe  
PayPal  
GoCardless  
corporate cards  
payroll providers  
HMRC  
banks  
e-commerce  
expense providers  
tax systems

But Atlas remains the financial system of record.

---

# 74. API

Every core finance object should be API-accessible with appropriate permissions.

Events include:

invoice.created  
invoice.posted  
invoice.paid  
purchase.approved  
purchase.received  
supplier.updated  
payment.authorised  
expense.approved  
period.closed

This allows larger customers to integrate external platforms without manipulating Atlas internally.

---

# 75. ATLAS FINANCIAL CONTROL GRAPH

This is something I would make uniquely Atlas.

Rather than treating every transaction individually, Atlas maintains relationships between:

Person  
Supplier  
Customer  
Bank account  
Purchase  
Invoice  
Payment  
Product  
Project  
Approver  
Department

This enables controls such as:

> The employee who created this supplier also requested this purchase and would normally approve this invoice.

Atlas flags the segregation-of-duties conflict.

Or:

> This new supplier shares bank details with an existing supplier.

Flag.

Or:

> 11 purchases from the same supplier were each £4,900 when £5,000 requires director approval.

Flag possible approval threshold splitting.

That is significantly smarter than conventional bookkeeping.

---

# 76. ATLAS FINANCE DESIGN PRINCIPLE

The finance system should operate around four states:

## Money In

Sales  
Invoices  
Receipts  
Collections

## Money Out

Requests  
Purchases  
Expenses  
Invoices  
Payments

## Money Held

Cash  
Inventory  
Assets  
Working capital

## Money Planned

Budgets  
Commitments  
Forecasts  
Projects

This is much easier for ordinary managers to understand than accounting terminology.

Finance professionals can still access the technical ledger underneath.

---

# 77. WHAT ATLAS SHOULD AUTOMATE

The platform should attempt to automate:

invoice capture  
ledger coding  
PO matching  
receipt matching  
expense coding  
bank matching  
cash allocation  
accrual identification  
prepayment schedules  
depreciation  
currency revaluation  
recurring journals  
payment proposals  
credit control prioritisation  
budget checks  
fraud warnings  
duplicate detection  
financial close checks  
management reporting

Humans handle judgement and exceptions.

---

# 78. WHAT ATLAS MUST NEVER AUTOMATE BLINDLY

Atlas should never silently:

change supplier bank details  
authorise large payments  
override approval rules  
write off material balances  
reopen accounting periods  
change historical posted transactions  
approve its own AI recommendation

High-risk actions always have explicit policy and human control.

---

# 79. THE CORE DIFFERENCE

Xero largely tells you:

**what happened financially.**

A traditional ERP tells you:

**what happened across the business and how it was accounted for.**

Atlas should tell you:

**what happened, why it happened, what is about to happen, what needs attention, who needs to act and what the financial consequence will be.**

And then allow the user to open the underlying transaction immediately.

That should be the philosophy of Atlas Finance.

---

# 80. TARGET EXPERIENCE

A finance user should be able to open Atlas at 08:30 and see:

**Cash**
£2.41m

**Receivables**
£1.82m

**Overdue**
£283k

**Payables**
£1.11m

**Due this week**
£407k

**Committed purchases**
£892k

**October revenue**
£4.71m

**Gross margin**
31.4%

**October close**
82%

### Your attention

4 invoice discrepancies  
2 payment approvals  
1 supplier bank change  
7 unreconciled transactions  
3 overdue approvals  
£46k customer exposure requiring review

That is the product.

Not thirty accounting menus.

Not a sea of journals.

Not another Xero clone.

A live financial operating system for the whole company.