# ATLAS SALES & ORDER PROCESSING

## Technical Functional Specification

**Module:** Sales / Order Processing  
**Product:** Atlas ERP  
**Scope:** Quotation, order capture, pricing, commercial validation, stock availability, order confirmation, allocation, fulfilment integration, invoicing readiness, returns and order closure.  
**Explicitly excluded:** CRM prospecting, leads, opportunities, campaigns and general relationship management.

---

# 1. PURPOSE

Atlas Sales Order Processing must manage the complete commercial transaction from the point where a customer requests a price or places an order through to delivery, invoicing and closure.

The system must provide the depth expected of a serious ERP while being significantly easier to operate than traditional ERP products.

The design principle is:

> **Complex underneath. Simple in front of the user.**

A sales processor should be able to enter the majority of orders from one workspace without repeatedly opening customer records, stock screens, price lists, finance screens, delivery screens and product records.

Atlas should surface the information required to make the next decision directly within the order.

---

# 2. MARKET FUNCTIONALITY REVIEW

## 2.1 Odoo 18

Odoo's standard sales lifecycle is:

**Quotation → Sales Order → Delivery → Invoice → Payment.**

A quotation becomes a sales order when confirmed. Odoo then connects the order with inventory fulfilment and invoicing.

Odoo provides:

- quotation templates;
- optional products;
- customer signatures;
- online payment confirmation;
- quotation expiry dates;
- separate invoice and delivery addresses;
- customer and product pricelists;
- fixed prices, formula prices and discounts;
- minimum quantity pricing;
- date-valid pricing;
- line discounts;
- sales margins;
- ordered quantity or delivered quantity invoicing;
- deposits/down payments;
- pro-forma invoices;
- delivery dates;
- customer lead times;
- warehouse reservation;
- make-to-order and replenishment routes;
- dropshipping;
- shipping methods;
- partial delivery and backorder handling;
- returns and refunds.

Odoo's pricing engine can calculate prices based on customers, products, categories, quantities, currencies and validity periods. It also supports fixed pricing, formulas and percentage adjustments.

Odoo can calculate sales margin on both individual lines and the entire order.

Odoo also allows different stock reservation strategies, including reservation immediately when the order is confirmed, manual reservation and reservation shortly before the scheduled delivery date.

The logistics routing architecture supports stock fulfilment, inter-warehouse movement, purchasing, manufacturing and dropshipping.

### Atlas lesson

Keep Odoo's connected transaction model, but make availability, pricing, credit, approvals and fulfilment significantly easier to understand.

---

## 2.2 Microsoft Dynamics 365 Business Central

Business Central adds several strong ERP concepts Atlas should adopt.

It supports partial shipment and partial invoicing directly from the sales order. Users explicitly control the quantity to ship and quantity to invoice.

Its reservation system can reserve existing inventory or inbound supply against specific sales demand and exposes whether the order is actually ready to ship.

Projected availability can consider:

**Current inventory + scheduled receipts - existing demand**

rather than simply displaying stock currently sitting in the warehouse.

Business Central also supports:

- approval workflows;
- prepayment requirements;
- preventing shipment when required prepayment has not been received;
- drop shipments;
- special purchase orders linked specifically to customer demand.


### Atlas lesson

Availability must answer:

> "Can I actually promise this quantity for this customer on this date?"

rather than simply:

> "How many are physically in stock today?"

---

## 2.3 NetSuite

NetSuite provides several controls particularly relevant to Atlas.

Sales orders can move through formal approval states before entering fulfilment. Editing an approved order can also require reapproval.

Inventory commitment can be prioritised according to:

- expected shipment date;
- transaction date;
- customer/order priority.

This provides considerably better allocation control than simple first-created, first-served stock allocation.

NetSuite also supports credit policies including:

- ignore;
- warn;
- enforce hold.

Credit calculations can include outstanding invoices and optionally unbilled orders.

### Atlas lesson

An order being entered should not automatically mean it is commercially approved, financially acceptable or entitled to stock.

These are separate decisions.

---

## 2.4 SAP Business One

SAP Business One uses the traditional document relationship:

**Quotation → Sales Order → Delivery → A/R Invoice**

with returns and other documents linked through the transaction chain.

One particularly useful SAP feature is **Blanket Agreements**.

These allow customers to agree:

- quantities;
- values;
- prices;
- validity periods;
- delivery schedules.

Individual sales documents can then consume the agreement while the ERP tracks remaining commitment.

SAP also supports approval procedures against sales documents.

### Atlas lesson

Atlas should have proper customer contracts and call-off orders rather than expecting users to maintain agreement quantities externally in spreadsheets.

---

## 2.5 Sage X3

Sage X3 distinguishes between:

**Global allocation**

Reservation of quantity against a product/site.

and

**Detailed allocation**

Reservation against a specific:

- lot;
- serial number;
- location;
- stock status.


### Atlas lesson

Atlas needs an allocation model separate from simple "stock available".

---

# 3. ATLAS CORE ORDER PHILOSOPHY

The biggest architectural improvement should be separating the different meanings of "order status".

Traditional ERPs often try to describe an entire transaction using one status.

Atlas should not.

Every sales order should have four independently calculated status dimensions.

## Commercial Status

- Draft
- Awaiting validation
- Awaiting approval
- Approved
- Confirmed
- Amended
- Cancelled
- Closed

## Supply Status

- Not checked
- Available
- Part available
- Shortage
- Allocated
- Part allocated
- Supply planned
- Ready

## Fulfilment Status

- Not released
- Released
- Picking
- Part picked
- Picked
- Part dispatched
- Dispatched
- Part delivered
- Delivered
- Backordered

## Financial Status

- Credit OK
- Credit warning
- Credit hold
- Prepayment required
- Prepayment received
- Not invoiced
- Part invoiced
- Invoiced
- Part paid
- Paid
- Overdue

The user therefore sees something such as:

**SO-108452**

Commercial: **Confirmed**  
Supply: **Part Allocated**  
Delivery: **Due 8 Oct**  
Invoice: **Not Invoiced**

This immediately tells the story of the order.

---

# 4. END-TO-END ATLAS FLOW

```text
ORDER ENTRY
    ↓
CUSTOMER + DELIVERY DETAILS
    ↓
PRODUCT / SERVICE LINES
    ↓
PRICING ENGINE
    ↓
AVAILABILITY / ATP
    ↓
COMMERCIAL CHECKS
    ↓
CREDIT CHECK
    ↓
APPROVAL ENGINE
    ↓
ORDER CONFIRMATION
    ↓
STOCK ALLOCATION / SUPPLY CREATION
    ↓
LOGISTICS RELEASE
    ↓
PICK / PACK / DISPATCH / DELIVERY
    ↓
INVOICE ELIGIBILITY
    ↓
INVOICE
    ↓
PAYMENT
    ↓
CLOSE
```

These stages must be connected, but they must not be technically inseparable.

For example, invoicing may be triggered before dispatch for a prepaid order but after delivery for another customer.

---

# 5. ORDER ENTRY SOURCES

Atlas must support orders created from:

1. New direct order
2. Existing quotation
3. CRM opportunity
4. Repeat previous order
5. Customer contract
6. Blanket/call-off agreement
7. Imported CSV
8. API
9. EDI
10. eCommerce
11. Customer portal
12. Recurring order
13. External marketplace integration

All routes ultimately create the same underlying Sales Order entity.

Source must therefore be metadata, not a different order structure.

Example:

```text
Source Type: CRM Opportunity
Source ID: OPP-34881
Source Channel: Sales Team
Created By: Michael
```

---

# 6. NEW ORDER WORKSPACE

This is the central Atlas screen.

The salesperson should not need six screens to process one order.

## Header

Display:

**SO-000184**
**Draft**

Customer | PO | Requested date | Delivery site | Value

Primary actions:

**Save Draft**
**Check Order**
**Confirm**
**More**

Confirmation is disabled until mandatory checks pass.

---

# 7. CUSTOMER SELECTION

Selecting a customer immediately loads the operational information required for the order.

Do not simply fill the customer name.

Atlas should retrieve:

### Commercial

- account number;
- currency;
- default price agreement;
- customer-specific prices;
- standard discount;
- sales tax/VAT treatment;
- payment terms;
- Incoterms;
- minimum order value;
- standard order charges;
- contract;
- sales channel.

### Financial

- credit limit;
- current receivables;
- overdue receivables;
- oldest overdue item;
- uninvoiced confirmed orders;
- remaining credit;
- credit hold;
- prepayment requirement.

### Delivery

- default delivery address;
- permitted delivery locations;
- delivery instructions;
- standard carrier;
- route;
- delivery calendar;
- receiving hours;
- contact;
- telephone;
- unloading requirements.

### Order Controls

- customer requires PO;
- customer requires delivery reference;
- customer requires batch numbers;
- customer requires certificates;
- customer requires specific invoice information;
- blocked products;
- restricted products;
- customer-specific product numbers.

---

# 8. CUSTOMER ALERT BAR

When the customer is selected, Atlas should display only operationally relevant alerts.

Example:

**Wolseley UK**

✓ Credit OK  
£81,420 available

⚠ Invoice overdue 6 days

✓ Price agreement active until 31 Dec

✓ Standard delivery: 2 working days

This is far more useful than making a salesperson open four tabs.

---

# 9. ORDER HEADER

Required fields should include:

### Identity

- Order ID
- Order type
- Customer
- Customer PO
- Customer reference
- External order reference
- Source

### Dates

- Order date
- Requested delivery date
- Promised date
- Planned dispatch date
- Expiry date for quotations

### Addresses

- Sold-to
- Bill-to
- Ship-to
- Site

Addresses used on a transaction must be snapshotted.

Changing the customer's master address later must not retrospectively alter historical orders.

### Contacts

- Buyer
- Delivery contact
- Invoice contact
- Site contact

### Commercial

- Currency
- Pricelist
- Contract
- Payment terms
- Incoterms
- VAT/tax treatment
- Sales entity
- Company
- Branch

### Fulfilment

- Warehouse
- Route
- Delivery method
- Carrier
- Collection
- Dropship
- Direct delivery
- Priority

---

# 10. ORDER TYPES

Atlas should support configuration of order types.

Standard initial types:

### Standard Order

Normal warehouse fulfilment.

### Prepaid Order

Payment required before release.

### Cash Order

Invoice/payment handled immediately.

### Drop Ship

Supplier → Customer.

### Make-to-Order

Customer demand creates manufacturing supply.

### Buy-to-Order

Customer demand creates purchase supply.

### Special Order

Purchased specifically for the customer, but received internally first.

### Call-Off Order

Consumes a commercial contract/blanket agreement.

### Collection

Customer collects.

### Replacement Order

Replacement goods relating to a previous delivery or complaint.

### Free-of-Charge

Zero-value supply requiring authorisation.

Order types should drive rules rather than require separate software modules.

---

# 11. PRODUCT ENTRY

The order line grid must support extremely fast entry.

Search should recognise:

- Atlas SKU;
- product name;
- description;
- barcode;
- customer's product code;
- previous customer purchases;
- manufacturer reference;
- alias;
- supplier reference where permitted.

Search results should show:

```text
SP1
Super Strength Pipe 100 mm

Free: 3,450
ATP 8 Oct: 7,200
Customer price: £8.42
```

The salesperson should not need to select the product before discovering there is no stock.

---

# 12. ORDER LINE STRUCTURE

Every line should contain:

- line number;
- product;
- customer SKU;
- description;
- requested quantity;
- UOM;
- selling UOM;
- base quantity;
- warehouse;
- requested date;
- promised date;
- unit price;
- price source;
- line discount;
- net price;
- VAT/tax;
- line total;
- unit cost;
- margin;
- margin percentage;
- route;
- stock availability;
- allocated quantity;
- fulfilled quantity;
- invoiced quantity;
- backorder quantity.

Optional fields:

- batch requirement;
- serial requirement;
- package;
- pallet quantity;
- weight;
- volume;
- tonnage;
- project;
- cost centre;
- site;
- contract line;
- customer drawing/reference.

---

# 13. UNIT OF MEASURE ENGINE

Atlas must properly support different selling and stocking units.

Examples:

```text
Stock UOM: Each
Sales UOM: Pallet
1 pallet = 48 each
```

or:

```text
Stock UOM: kg
Sales UOM: tonne
```

Conversions must be centrally defined and immutable once transactions use them.

Order screens should always allow visibility of both:

**Ordered: 3 pallets**
**Base quantity: 144 each**

---

# 14. PRICING ENGINE

This is a core Atlas service, not simply a `unit_price` column.

Price resolution should evaluate rules in priority order.

Suggested hierarchy:

```text
Contract price
↓
Customer + product price
↓
Customer group + product
↓
Customer + category
↓
Quantity break
↓
Campaign / temporary agreement
↓
Standard pricelist
↓
Product standard selling price
```

Each rule may have:

- customer;
- customer group;
- product;
- product group;
- quantity range;
- currency;
- UOM;
- start date;
- end date;
- warehouse;
- region;
- channel;
- contract;
- fixed amount;
- percentage discount;
- markup;
- formula.

---

# 15. PRICE PROVENANCE

This is something Atlas should make dramatically clearer than traditional ERPs.

Clicking the price should explain it.

Example:

**£8.42**

Source:

> Customer Agreement CP-00192  
> Product SP1  
> 1 Jan 2026 to 31 Dec 2026  
> Quantity 100+  
> Base £9.35  
> Discount 9.95%

Then:

**Override price**

can be available to authorised users.

Never leave users wondering why a price appeared.

---

# 16. MANUAL PRICE OVERRIDES

Manual changes must record:

- original price;
- calculated price;
- new price;
- difference;
- margin impact;
- user;
- timestamp;
- reason.

Example:

```text
Calculated      £8.42
Override        £7.95
Difference      -5.58%
Margin           18.2%
```

If outside the user's authority:

**Manager approval required**

The original pricing information must never be destroyed.

---

# 17. DISCOUNTS

Support:

- line percentage;
- line fixed amount;
- whole-order percentage;
- whole-order value;
- promotional discount;
- contractual discount;
- rebate;
- early payment discount;
- quantity discount.

Atlas should distinguish:

**Discount source**

from

**Discount amount**

so users can understand why it was applied.

---

# 18. SURCHARGES AND CHARGES

Support charges for:

- delivery;
- fuel;
- small order;
- pallet;
- packaging;
- handling;
- hazardous goods;
- expedited delivery;
- customs;
- environmental levy;
- service charges.

Rules may be automatic.

Example:

```text
Order value: £540
Minimum delivery order: £700

Small order charge: £50
```

The user should see the reason automatically.

---

# 19. MARGIN CONTROL

Display:

### Per line

Cost  
Revenue  
Margin £  
Margin %

### Overall order

Revenue  
Cost  
Gross margin  
Margin %

Example:

```text
Order value       £18,420
Estimated cost    £12,684
Margin             £5,736
Margin              31.14%
```

Cost visibility should be permission controlled.

---

# 20. MARGIN APPROVAL

Rules could include:

```text
Margin ≥ 25%
Auto approve

20% to 24.99%
Sales Manager

15% to 19.99%
Commercial Director

<15%
Director approval
```

These rules must be configurable.

---

# 21. STOCK AVAILABILITY

Never show only:

**On hand: 10,000**

That number is commercially dangerous.

Atlas should show:

```text
Physical on hand       10,000
Already allocated       6,200
Free stock              3,800

Inbound PO              4,000   7 Oct
Production              5,000   9 Oct

Projected ATP 9 Oct    12,800
```

---

# 22. AVAILABLE-TO-PROMISE ENGINE

Atlas ATP should evaluate:

```text
Opening usable stock

+ confirmed incoming purchase
+ planned manufacturing output
+ confirmed transfers in
+ released returns if reusable

- committed sales demand
- production demand
- transfers out
- safety stock
- quarantine
- blocked stock
```

against time.

The question becomes:

> "When can quantity X genuinely be supplied?"

---

# 23. ATP RESULT

Example:

Customer requests:

**7,000 SP1 for 8 October**

Atlas responds:

```text
Requested               7,000

Available 8 Oct          3,800
Available 9 Oct          8,800

Earliest full supply:
9 October

Options

○ Deliver 3,800 on 8 Oct
  Backorder 3,200 for 9 Oct

○ Deliver all 7,000 on 9 Oct

○ Check alternative warehouse

○ Create supply requirement
```

This decision should happen while entering the order.

---

# 24. ALTERNATIVE SUPPLY

If local stock cannot fulfil the requirement, Atlas should automatically evaluate:

1. other bins;
2. other warehouse;
3. scheduled receipt;
4. production;
5. purchase;
6. transfer;
7. direct supplier shipment;
8. substitute item.

Display the options and impact on promise date.

---

# 25. STOCK ALLOCATION

Availability and allocation are different.

Atlas should support:

### Soft Allocation

Planning reservation.

May be reallocated.

### Firm Allocation

Dedicated to the order.

Cannot be moved without authorisation.

### Detailed Allocation

Specific:

- lot;
- batch;
- serial;
- pallet;
- location.

---

# 26. ALLOCATION PRIORITY

Do not rely purely on order creation time.

Possible allocation rules:

- delivery date;
- customer priority;
- order priority;
- contract priority;
- service level;
- first confirmed;
- manual override.

Example:

```text
Order A
Entered Monday
Delivery Friday

Order B
Entered Tuesday
Delivery Wednesday
```

Atlas should not automatically give scarce Wednesday stock to Order A merely because it was entered first.

---

# 27. DELIVERY PROMISE

Atlas should calculate three dates separately.

### Customer Requested Date

What the customer wants.

### Atlas Promised Date

What Atlas has committed to.

### Current Expected Date

What supply information now predicts.

Example:

```text
Requested       8 Oct
Promised        8 Oct
Expected        10 Oct ⚠
```

That difference is extremely important.

---

# 28. PROMISE CHANGES

If the expected date moves beyond the promised date:

- flag the order;
- add it to an exception queue;
- identify affected lines;
- calculate value affected;
- show cause.

Examples:

**Production delayed**

**Purchase order late**

**Stock reallocated**

**Warehouse transfer delayed**

This becomes useful customer-service information automatically.

---

# 29. MINIMUM ORDER RULES

Support:

- minimum order value;
- minimum product quantity;
- minimum pallet quantity;
- full pallet only;
- multiples;
- minimum weight;
- minimum delivery charge.

Atlas should explain violations.

Not:

> Cannot confirm.

Instead:

> Order is £84 below this customer's £700 minimum delivery value.

Possible actions:

**Add products**
**Apply authorised small-order charge**
**Request override**

---

# 30. CREDIT CONTROL

Credit must be visible before confirmation.

Calculate exposure using configurable components:

```text
Posted unpaid invoices
+
Past-due balance
+
Confirmed uninvoiced orders
+
Current order
-
Payments on account
=
Projected exposure
```

Example:

```text
Credit limit             £100,000
Current exposure           £72,400
This order                 £18,200
Projected                  £90,600

Remaining                   £9,400

CREDIT OK
```

---

# 31. CREDIT HOLD

Policies:

### Ignore

No check.

### Warn

Salesperson may proceed.

### Approval

Credit Control approval required.

### Hard Hold

Order cannot proceed.

Rules may be triggered by:

- credit limit;
- overdue amount;
- overdue days;
- account status;
- insurance limit;
- manual hold;
- legal hold.

---

# 32. CREDIT OVERRIDE

An authorised override must require:

- approver;
- reason;
- authorised amount;
- expiry;
- order;
- timestamp.

Never use a simple editable checkbox such as:

`credit_override = true`

without an audit event.

---

# 33. PREPAYMENT

Allow rules such as:

```text
Customer: New export customer

Required prepayment: 50%
Release stock: Yes
Release shipment: No, until received
```

Atlas must distinguish:

**Order confirmed**

from

**Order releasable for fulfilment**

---

# 34. COMMERCIAL VALIDATION

Before confirmation Atlas runs a validation engine.

Example:

```text
ORDER CHECK

✓ Customer active
✓ Customer PO present
✓ Pricing valid
✓ VAT determined
✓ Delivery address valid
✓ Order above MOV
✓ Stock plan available
✓ Delivery date achievable
✓ Credit available
⚠ Margin requires approval
✓ No restricted products

1 action required
```

This should become one of Atlas's defining features.

---

# 35. APPROVAL ENGINE

Approval rules must be reusable across Atlas.

Triggers for sales orders may include:

- order value;
- manual price;
- discount;
- margin;
- credit;
- overdue debt;
- free-of-charge item;
- delivery surcharge override;
- minimum order override;
- restricted item;
- unusually long payment terms;
- non-standard tax;
- order cancellation;
- confirmed-order amendment.

---

# 36. APPROVAL EXAMPLE

```text
SO-10472
£47,240

Approval required

Reason:
Margin 17.2%

Rule:
Margin below 20%

Approver:
Commercial Director

Status:
Awaiting approval
```

Approval actions:

**Approve**
**Reject**
**Return for amendment**

Comments must be retained.

---

# 37. REAPPROVAL

A previously approved order should require reapproval if a material field changes.

Examples:

- quantity increase;
- value increase;
- price reduction;
- discount increase;
- margin reduction;
- payment-term change;
- customer changed;
- delivery date significantly brought forward;
- credit exposure increases.

Minor fields such as internal notes should not trigger reapproval.

---

# 38. ORDER CONFIRMATION

Confirmation should be a business event, not merely changing a field from Draft to Confirmed.

Confirmation must:

1. assign final sales order number if not previously assigned;
2. snapshot commercial terms;
3. lock the confirmed revision;
4. reserve/allocate stock according to policy;
5. create required supply demand;
6. create fulfilment demand;
7. create invoice plan;
8. consume contract/call-off quantity if applicable;
9. record confirmation event;
10. notify relevant downstream services.

---

# 39. CONFIRMED ORDER EDITING

One of the biggest ERP mistakes Atlas must avoid is allowing a confirmed order to be silently edited.

Use revision control.

Example:

```text
SO-10842

Revision 1
Confirmed 2 Oct 09:42

Revision 2
Created 3 Oct 11:16
Awaiting approval
```

The original transaction remains visible.

---

# 40. AMENDMENT COMPARISON

Show exactly what changed.

```text
                    Previous      Proposed

SP1 Quantity          2,000         2,500
Unit price             £8.42         £8.30
Delivery             8 Oct         7 Oct

Order value         £16,840       £20,750
Margin                28.4%         25.2%
```

Then recalculate:

- stock;
- capacity;
- transport;
- credit;
- margin;
- approvals.

---

# 41. CHANGES AFTER FULFILMENT STARTS

Rules become stricter after warehouse processing starts.

Examples:

### Line not allocated

Fully editable.

### Allocated

Quantity reduction may release stock.

### Picked

Requires warehouse intervention.

### Dispatched

Cannot simply change quantity.

Use:

- return;
- replacement;
- credit;
- additional order.

Never rewrite operational history.

---

# 42. DELIVERY GROUPS

One order may have multiple deliveries.

Therefore:

**Order ≠ Delivery**

Lines should support delivery grouping.

Example:

```text
SO-10048

Delivery 1
8 Oct
Warehouse A
£12,400

Delivery 2
12 Oct
Warehouse A
£4,200

Dropship
10 Oct
Supplier → Customer
£1,800
```

---

# 43. PARTIAL DELIVERY

When only some quantity can ship:

```text
Ordered       10,000
Allocated      8,000
Picked         8,000
Delivered      8,000
Remaining      2,000
```

Options:

**Create backorder**
**Cancel remaining**
**Change promise date**
**Transfer supply**
**Substitute**

---

# 44. BACKORDERS

The original order remains the commercial source.

Do not unnecessarily duplicate the sales order.

Create fulfilment demands underneath it.

Example:

```text
SO-10520

Line 10: SP1
Ordered 10,000

Shipment SH-20104
8 Oct
8,000

Backorder BO-1021
11 Oct
2,000
```

---

# 45. DROPSHIPPING

For dropship lines:

```text
Sales Order
↓
Supply Requirement
↓
Purchase Order
↓
Vendor Ships Customer
↓
Delivery Confirmation
↓
Invoice eligibility
```

Maintain traceability between:

Customer order ↔ Purchase order ↔ Supplier delivery.

---

# 46. BUY-TO-ORDER

For specially purchased products:

```text
Sales Order
↓
Purchase requirement
↓
PO
↓
Goods Receipt
↓
Reserved automatically to original customer order
↓
Customer shipment
```

The stock must not accidentally become available to unrelated orders unless explicitly released.

---

# 47. MAKE-TO-ORDER

```text
Sales Order
↓
Manufacturing demand
↓
Production order
↓
Manufacturing completion
↓
Stock reservation
↓
Customer fulfilment
```

The order should show:

```text
Supply: Production
MO-4021

Planned completion:
8 Oct

Current forecast:
9 Oct ⚠
```

Sales should see the answer without entering manufacturing screens.

---

# 48. CUSTOMER COLLECTION

Collection orders require:

- collection location;
- collection date/time;
- contact;
- vehicle details optionally;
- readiness status;
- collection reference;
- proof of collection.

Status:

**Awaiting Stock**
→ **Ready for Collection**
→ **Collected**

---

# 49. LOGISTICS HANDOFF

The Sales module should not attempt to perform every warehouse function.

It should publish fulfilment demand containing:

- order;
- customer;
- delivery address;
- delivery date;
- priority;
- lines;
- quantities;
- weights;
- pallets;
- packaging;
- carrier;
- delivery instructions;
- site restrictions.

Logistics then owns execution.

Sales retains visibility.

---

# 50. ORDER FULFILMENT PANEL

Inside the order:

```text
FULFILMENT

SH-10084
Delivery: 8 Oct

✓ Released
✓ Picked
✓ Loaded
→ Out for delivery
○ Delivered

Vehicle:
YN24 ABC

Carrier:
Atlas Transport

POD:
Pending
```

Sales therefore does not have to navigate into Logistics simply to answer a customer.

---

# 51. INVOICE POLICY

Atlas must support invoice policies at company, customer, product and order level.

Policies:

### Ordered Quantity

Invoice confirmed order quantities.

### Dispatched Quantity

Invoice once dispatched.

### Delivered Quantity

Invoice actual delivered quantity.

### Manual

Finance/user controls release.

### Prepayment

Invoice deposit first.

### Milestone

Useful for services/projects.

---

# 52. INVOICE PLAN

Every confirmed order should have an invoice plan.

Example:

```text
ORDER £100,000

Deposit
30%
£30,000
On confirmation

Balance
70%
£70,000
On delivery
```

This is preferable to relying on ad hoc invoice creation.

---

# 53. INVOICE READINESS

Atlas should calculate:

```text
Ordered        1,000
Delivered        800
Invoiced         500

Eligible now      300
```

Button:

**Create invoice for £X**

Finance ultimately controls posting according to permissions.

---

# 54. FINANCE INTEGRATION

The sales order supplies Finance with:

- customer;
- legal entity;
- currency;
- payment terms;
- tax;
- revenue account;
- product;
- cost centre;
- quantities;
- values;
- delivery evidence;
- invoice policy;
- deposits;
- charges.

Finance returns:

- invoice number;
- invoice date;
- amount;
- due date;
- payment status;
- outstanding amount;
- credit note;
- payment allocation.

---

# 55. RETURNS

Support return initiation against:

- sales order;
- shipment;
- delivery;
- invoice;
- individual line.

Return reasons:

- damaged;
- incorrect product;
- over-delivery;
- customer rejection;
- quality issue;
- transport damage;
- pricing dispute;
- duplicate order;
- other.

---

# 56. RETURN ACTIONS

A return may result in:

- return to stock;
- quarantine;
- scrap;
- inspection;
- replacement;
- repair;
- credit;
- no credit.

Returning goods and issuing credit must be separate controlled events.

---

# 57. CANCELLATION

Cancellation rules depend on execution.

### Draft

Delete or cancel.

### Confirmed, nothing processed

Cancel and release allocation.

### Part fulfilled

Cancel only outstanding quantity.

### Delivered

Return/credit workflow required.

### Invoiced

Financial reversal rules apply.

Historical business records must never simply disappear.

---

# 58. CONTRACTS AND BLANKET ORDERS

Atlas should include a **Sales Agreement** entity.

Fields:

- customer;
- contract number;
- start date;
- end date;
- currency;
- products;
- committed quantity;
- committed value;
- agreed price;
- payment terms;
- delivery schedule;
- locations;
- status.

---

# 59. CONTRACT CONSUMPTION

Example:

```text
CONTRACT CT-1004

SP1

Committed       100,000
Released         62,000
Delivered        57,000
Open commitment  38,000

Agreement price:
£7.82
Valid until:
31 Dec
```

Creating a call-off order automatically uses the contracted price and reduces the available commitment.

---

# 60. ORDER COCKPIT USER EXPERIENCE

The order should feel like a workspace, not a database form.

Suggested layout:

```text
┌─────────────────────────────────────────────────────────┐
│ SO-10842     CONFIRMED                    £48,291       │
│ Wolseley UK                                             │
│ PO 482901     Delivery 8 Oct                            │
├─────────────────────────────────────────────────────────┤
│ ✓ Credit OK    ✓ Price    ⚠ 1 Shortage    ✓ Margin     │
├─────────────────────────────────────────────────────────┤
│ PRODUCT       QTY     AVAILABLE    DATE     PRICE       │
│ SP1           5000      5000       8 Oct     £8.42      │
│ RI1/20        2000       600      11 Oct     £7.80 ⚠    │
│                                                         │
│ + Add product                                           │
├─────────────────────────────────────────────────────────┤
│ Products £47,591          Margin 28.2%                  │
│ Delivery    £700                                      │
│ TOTAL    £48,291                                      │
├─────────────────────────────────────────────────────────┤
│ [Fulfilment] [Invoices] [Documents] [Audit]             │
└─────────────────────────────────────────────────────────┘
```

Most work happens here.

---

# 61. CONTEXTUAL DRAWERS

Complex information should open alongside the order without taking the user away from it.

Examples:

Click **Availability**:

```text
SP1

Free now             3,800

Incoming
7 Oct                 4,000
9 Oct                 5,000

Demand before 9 Oct  -2,000

ATP 9 Oct            10,800
```

Click outside and continue entering the order.

---

# 62. EXCEPTION-LED UX

Do not force users to check everything manually.

Atlas should continuously calculate the order and surface exceptions.

Normal:

**✓**

Needs attention:

**⚠**

Blocked:

**●**

Examples:

```text
✓ Pricing
✓ Credit
⚠ Availability
✓ Margin
✓ Tax
```

The salesperson concentrates on the exception.

---

# 63. ORDER LIST

Columns:

- order;
- customer;
- PO;
- date;
- requested delivery;
- promised delivery;
- value;
- commercial status;
- availability;
- fulfilment;
- invoice;
- owner.

Provide saved operational views:

**Today's Orders**

**Awaiting Approval**

**Credit Hold**

**Stock Shortage**

**Due to Dispatch**

**Late Orders**

**Backorders**

**Ready to Invoice**

**Recently Changed**

Users should be able to create and save their own views.

---

# 64. BULK ACTIONS

Authorised bulk operations:

- confirm;
- approve;
- release;
- allocate;
- change promised date;
- assign owner;
- print;
- email;
- export;
- invoice eligible lines;
- cancel remaining quantities.

Bulk actions must still execute the same validations as individual processing.

---

# 65. DOCUMENTS

Order documents can include:

- customer PO;
- quotation;
- order acknowledgement;
- specification;
- drawings;
- certificates;
- delivery instructions;
- export paperwork;
- correspondence;
- proof of delivery;
- invoice.

Documents should be linked, versioned and searchable.

---

# 66. ORDER ACKNOWLEDGEMENT

Atlas should generate a professional order acknowledgement showing:

- Atlas order number;
- customer PO;
- customer;
- delivery address;
- products;
- quantities;
- agreed prices;
- charges;
- tax;
- requested date;
- confirmed/promised date;
- payment terms;
- delivery terms;
- contact.

Sending the acknowledgement should be recorded in the timeline.

---

# 67. TIMELINE

Every order should have a human-readable activity timeline.

Example:

```text
3 Oct 14:42
Order confirmed by Michael

3 Oct 14:42
5,000 SP1 allocated

3 Oct 14:43
RI1/20 shortage detected
1,400 units short

3 Oct 14:51
Supply linked to MO-2841

3 Oct 15:02
Order acknowledgement emailed

4 Oct 09:18
Expected completion of MO-2841 moved to 10 Oct
Promised delivery at risk
```

---

# 68. AUDIT LOG

Separately maintain an immutable technical audit trail.

Capture:

- user;
- timestamp;
- event;
- field;
- previous value;
- new value;
- revision;
- source;
- reason;
- session/IP where appropriate.

Financial and commercial history should be fully traceable.

---

# 69. DATA MODEL

Core entities should include:

```text
sales_order
sales_order_revision
sales_order_line

sales_order_address
sales_order_contact

sales_price_decision
sales_discount
sales_charge

sales_allocation
sales_supply_link

sales_delivery_group
sales_fulfilment_link

sales_invoice_plan
sales_invoice_link

sales_approval_request
sales_hold

sales_contract
sales_contract_line
sales_contract_release

sales_return
sales_return_line

sales_order_event
sales_order_audit
```

Do not create a single giant `sales_orders` table containing every concept.

---

# 70. SALES_ORDER

Important fields:

```text
id
order_number
revision
company_id
customer_id
order_type

order_date
requested_date
promised_date

customer_po
external_reference

currency_id
price_list_id
contract_id

payment_terms_id
tax_profile_id

warehouse_id
fulfilment_route

commercial_status
supply_status
fulfilment_status
financial_status

subtotal
discount_total
charge_total
tax_total
grand_total

estimated_cost
margin_amount
margin_percentage

created_by
created_at
confirmed_by
confirmed_at

version
```

---

# 71. SALES_ORDER_LINE

```text
id
sales_order_id
line_number

product_id
customer_product_code
description

quantity
uom_id
base_quantity

warehouse_id

requested_date
promised_date

unit_price
price_source_id

discount
net_price

tax_id
tax_amount

unit_cost
margin_amount
margin_percent

allocation_policy
supply_route

quantity_allocated
quantity_picked
quantity_dispatched
quantity_delivered
quantity_invoiced
quantity_cancelled

status
```

---

# 72. CONCURRENCY CONTROL

Atlas must prevent two users unknowingly overwriting one another.

Use optimistic record versioning.

Example:

```text
Michael opens Revision 4.

Kim changes and saves the order.

Michael attempts to save old Revision 4.

Atlas:
"This order changed while you were working on it."

Show changes.

Merge or reload.
```

Never silently overwrite.

---

# 73. EVENT ARCHITECTURE

Important domain events:

```text
sales.order.created
sales.order.validation_requested
sales.order.approval_requested
sales.order.approved
sales.order.confirmed

sales.order.amended
sales.order.cancelled

sales.stock.requested
sales.stock.allocated
sales.stock.shortage_detected

sales.supply.created
sales.promise.changed

sales.fulfilment.released
sales.fulfilment.dispatched
sales.fulfilment.delivered

sales.invoice.eligible
sales.invoice.created

sales.return.created

sales.order.closed
```

These events allow Atlas modules to integrate without tightly coupling every database operation.

---

# 74. MODULE INTEGRATION

## CRM → Sales

CRM sends:

- customer;
- contact;
- opportunity;
- quotation requirements.

Sales returns:

- quotation;
- order;
- value;
- result.

CRM does not own confirmed sales orders.

---

## Customer Master → Sales

Provides:

- addresses;
- tax;
- credit profile;
- payment terms;
- price agreement;
- delivery preferences.

---

## Inventory → Sales

Provides:

- physical stock;
- free stock;
- stock status;
- reservation;
- lot/batch;
- warehouse availability.

---

## Planning / Manufacturing → Sales

Provides:

- production orders;
- supply quantity;
- completion forecasts;
- capacity-derived dates.

---

## Procurement → Sales

Provides:

- incoming purchases;
- vendor dates;
- special orders;
- dropships.

---

## Logistics → Sales

Provides:

- shipment;
- picking;
- vehicle;
- carrier;
- dispatch;
- ETA;
- POD;
- delivery result.

---

## Finance → Sales

Provides:

- receivables;
- credit;
- invoice;
- payment;
- overdue balances;
- credit notes.

---

# 75. PERMISSIONS

Suggested standard roles:

### Sales Processor

Create and edit drafts.

### Senior Sales Processor

Additional price/discount authority.

### Sales Manager

Approve commercial exceptions.

### Commercial Director

High-level approval.

### Credit Controller

Approve credit exceptions.

### Logistics User

Control fulfilment.

### Finance User

Invoice and financial controls.

### Administrator

Configure policy.

---

# 76. FIELD-LEVEL SECURITY

Permissions should go deeper than screens.

Examples:

A salesperson may:

- see selling price;
- see discount;
- not see cost.

A sales manager may:

- see margin;
- approve discount.

Finance may:

- see credit details;
- place account hold.

Only designated users may:

- change tax;
- override credit;
- backdate orders;
- edit confirmed financial terms.

---

# 77. KEY SALES WORK QUEUES

Atlas should provide operational queues rather than expecting staff to search manually.

### Orders Needing Attention

Anything blocked or risky.

### Stock Shortages

Orders whose current supply does not cover demand.

### Promise At Risk

Expected date later than promised date.

### Credit Hold

Blocked financially.

### Awaiting Approval

Commercial approval outstanding.

### Backorders

Open remaining quantities.

### Ready to Release

Commercially and financially clear.

### Ready to Invoice

Fulfilment has satisfied invoice policy.

---

# 78. SALES ORDER REPORTING

Operational measures:

- orders entered today;
- order value;
- order volume;
- average order value;
- order lines;
- units;
- weight/tonnage;
- orders by customer;
- orders by product;
- orders by warehouse;
- orders by order type;
- orders by delivery date.

---

# 79. AVAILABILITY REPORTING

- lines fully available;
- lines partially available;
- lines unavailable;
- shortage quantity;
- shortage value;
- source causing shortage;
- next availability date;
- projected late orders.

---

# 80. COMMERCIAL REPORTING

- gross sales;
- net sales;
- discounts;
- margin;
- margin percentage;
- manual price overrides;
- override value;
- below-margin orders;
- surcharge recovery;
- sales by pricelist;
- contract versus non-contract sales.

---

# 81. FULFILMENT REPORTING

- confirmed to release time;
- release to dispatch time;
- full orders;
- partial orders;
- backorder rate;
- delivered on time;
- delivered in full;
- OTIF;
- promised-date adherence;
- average delay;
- cancelled quantity.

---

# 82. ORDER QUALITY REPORTING

Atlas should specifically track mistakes and manual intervention.

Examples:

- orders amended after confirmation;
- pricing overrides;
- customer PO missing;
- delivery date overrides;
- credit overrides;
- orders manually unblocked;
- tax overrides;
- cancelled orders;
- orders requiring rework.

This identifies weaknesses in the sales process itself.

---

# 83. CONTRACT REPORTING

For agreements:

- committed value;
- released value;
- remaining value;
- committed quantity;
- released quantity;
- remaining quantity;
- expected consumption;
- expiry;
- under-utilisation;
- over-consumption.

---

# 84. SEARCH

Global order search should accept:

- Atlas order;
- customer;
- customer PO;
- postcode;
- site;
- product;
- invoice;
- delivery;
- shipment;
- tracking number;
- contract;
- contact.

A user should be able to type:

**482910**

and Atlas should determine whether it is an order, PO, invoice or other reference.

---

# 85. KEYBOARD-FIRST ORDER ENTRY

High-volume order processors should be able to work quickly without excessive mouse use.

Support:

- tab navigation;
- keyboard product search;
- quantity entry;
- rapid line insertion;
- duplicate line;
- copy order;
- paste multiple products;
- barcode entry;
- keyboard save;
- keyboard confirmation where authorised.

---

# 86. COPY PREVIOUS ORDER

Search recent orders:

```text
Customer:
Travis Perkins

Previous orders

SO-10281   28 Sep   £4,281
SO-10192   21 Sep   £3,942
SO-9981    12 Sep   £6,241
```

Select:

**Copy as new order**

Atlas then recalculates:

- current price;
- stock;
- lead time;
- tax;
- credit;
- contract;
- delivery date.

Never blindly reuse previous transactional values.

---

# 87. DUPLICATE PO DETECTION

When entering customer PO:

`TP-98214`

Atlas should search existing active and historical orders.

Example:

> **Possible duplicate**
>
> PO TP-98214 already exists on SO-10421 from 28 September.
>
> £8,420
>
> View order

Allow authorised override when genuinely required.

---

# 88. SMART VALIDATION

Validation should happen continuously rather than only after Save.

For example, entering a delivery date instantly recalculates ATP.

Changing quantity recalculates:

- price break;
- margin;
- stock;
- freight;
- MOV;
- credit.

Changing customer recalculates the entire commercial context.

---

# 89. WARNINGS VERSUS ERRORS

Atlas must formally distinguish:

### Information

No action required.

### Warning

User can continue.

### Approval

Authorised approval required.

### Block

Cannot proceed.

This prevents users becoming conditioned to dismiss every popup.

---

# 90. NO POPUP HELL

Do not replicate old ERP behaviour where users receive seven modal warnings while entering an order.

Use one persistent **Order Checks** area.

Example:

```text
2 ITEMS NEED ATTENTION

Credit
£4,220 above limit
[Request approval]

Availability
RI1/10 is 400 short
[Review supply]
```

---

# 91. CONFIGURATION ENGINE

Most business rules should be data-driven.

Administrators should configure:

- price hierarchy;
- discount authority;
- margin authority;
- credit rules;
- approval rules;
- minimum order rules;
- freight;
- tax;
- reservation policy;
- stock priority;
- promise calculation;
- invoice policy;
- order types.

Avoid hardcoding company rules into application logic.

---

# 92. AUDIT PRINCIPLE

Atlas must follow:

> **Correct, do not rewrite.**

Once a commercial event has happened:

- preserve it;
- supersede it;
- reverse it;
- amend it;

but do not silently erase it.

---

# 93. API REQUIREMENTS

Core endpoints should broadly support:

```text
POST   /sales/orders
GET    /sales/orders/{id}
PATCH  /sales/orders/{id}

POST   /sales/orders/{id}/validate
POST   /sales/orders/{id}/submit-approval
POST   /sales/orders/{id}/approve
POST   /sales/orders/{id}/confirm

POST   /sales/orders/{id}/amend
POST   /sales/orders/{id}/cancel

GET    /sales/orders/{id}/availability
POST   /sales/orders/{id}/allocate

GET    /sales/orders/{id}/fulfilments
GET    /sales/orders/{id}/invoices
GET    /sales/orders/{id}/timeline
```

Line-specific endpoints may be exposed where required.

---

# 94. TRANSACTION SAFETY

Confirmation must be transactional.

If Atlas:

1. confirms the order;
2. allocates stock;
3. creates supply;
4. publishes fulfilment demand;

and step 3 fails, Atlas must not leave a half-confirmed invisible failure.

Use:

- database transactions;
- idempotent commands;
- event outbox;
- retry handling;
- failure monitoring.

---

# 95. PERFORMANCE TARGETS

Routine operations should feel effectively instant.

Targets:

Order opening:
**<500 ms perceived response under normal load**

Product search:
**<300 ms**

Pricing recalculation:
**<250 ms**

Availability result:
**<500 ms where data is local**

Order save:
**<500 ms**

Long-running supply calculations should update asynchronously without freezing the interface.

---

# 96. ATLAS SHOULD IMPROVE ON ODOO HERE

## Odoo

A strong modular ERP where the information exists, but users often have to understand where that information lives.

## Atlas

The order itself becomes the command centre.

The user should immediately know:

**Can we sell it?**

**What price should we sell it at?**

**Do we have it?**

**If not, when can we get it?**

**Can the customer have credit?**

**Does anyone need to approve this?**

**When have we promised it?**

**Has Logistics got it?**

**Has it shipped?**

**Has it been invoiced?**

**Has the customer paid?**

That is the experience Atlas should be built around.

---

# 97. RECOMMENDED PRIMARY NAVIGATION

Under **Sales**:

```text
Overview

Orders
Quotations

Returns
Contracts

Approvals

Reports
```

Do not add separate main navigation entries for:

- allocations;
- pricing decisions;
- backorders;
- invoice plans;
- order revisions;
- delivery groups.

These are supporting entities and belong within the relevant order or operational view.

---

# 98. SALES HOME

The Sales landing page should be operational.

Example:

```text
SALES

Today

£184,820
Order intake

42
Orders

£31.2k
Awaiting approval

8
Need attention


NEEDS ACTION

2 Credit holds
4 Stock shortages
1 Margin approval
1 Late promise


TODAY

12 due for dispatch
6 ready to invoice
3 backorders changed
```

No unnecessary decorative dashboard clutter.

Every number should take the user somewhere useful.

---

# 99. DEVELOPMENT PRIORITY

## Phase 1, Core Transaction

Build:

- sales orders;
- order lines;
- customer selection;
- addresses;
- product entry;
- pricing;
- totals;
- taxes;
- statuses;
- order documents;
- audit.

## Phase 2, Commercial Intelligence

Build:

- availability;
- ATP;
- margin;
- credit;
- order checks;
- approval engine;
- duplicate PO detection.

## Phase 3, Supply

Build:

- allocation;
- shortage management;
- warehouse sourcing;
- MTO;
- buy-to-order;
- dropshipping;
- supply linking.

## Phase 4, Fulfilment

Build integration with:

- Logistics;
- picking;
- shipment;
- backorders;
- delivery;
- POD.

## Phase 5, Finance

Build:

- invoice eligibility;
- invoice plans;
- deposits;
- invoices;
- credit notes;
- payment visibility.

## Phase 6, Advanced Commercial

Build:

- contracts;
- blanket agreements;
- call-offs;
- customer portal;
- EDI/API order intake;
- advanced allocation priority.

---

# 100. ACCEPTANCE TEST, NORMAL ORDER

Given:

- active customer;
- sufficient credit;
- valid price;
- stock available;
- delivery achievable;

When:

a user enters and confirms an order;

Then Atlas must:

1. calculate correct price;
2. calculate tax;
3. display margin;
4. calculate availability;
5. validate customer rules;
6. validate credit;
7. calculate promise date;
8. confirm order;
9. create stock commitment;
10. create fulfilment requirement;
11. create invoice plan;
12. create audit events.

No unnecessary additional screens should be required.

---

# 101. ACCEPTANCE TEST, SHORTAGE

Customer orders 10,000.

Only 6,000 can be supplied by requested date.

Atlas must show:

```text
Requested             10,000
Available               6,000
Shortage                4,000

Earliest full supply:
12 Oct
```

and offer valid fulfilment options before confirmation.

---

# 102. ACCEPTANCE TEST, CREDIT HOLD

Customer:

```text
Credit limit           £50,000
Current exposure       £46,000
New order               £8,000
Projected              £54,000
```

Atlas must:

- identify £4,000 excess;
- follow configured credit policy;
- prevent unauthorised override;
- allow approval request;
- record approval decision;
- retain audit history.

---

# 103. ACCEPTANCE TEST, CONFIRMED ORDER CHANGE

Confirmed order price changes from £10 to £8.

Atlas must:

- create an amendment;
- retain £10 in previous revision;
- calculate new margin;
- identify approval requirement;
- prevent the new price becoming active until approved;
- retain complete history.

---

# 104. ACCEPTANCE TEST, PARTIAL DELIVERY

Ordered:

10,000

Delivered:

8,000

Atlas must show:

```text
Ordered        10,000
Delivered       8,000
Outstanding     2,000
```

and allow:

- backorder;
- cancellation of balance;
- revised delivery date;

without creating an unrelated sales transaction.

---

# 105. FINAL PRODUCT PRINCIPLE

Atlas should not attempt to win by having more menus than Odoo, SAP or Dynamics.

It should win because all the complexity required by a serious business is present but organised around the user's actual question.

The Sales Order becomes the single operational truth.

A salesperson opens one order and can understand:

**Customer**
→ **Price**
→ **Margin**
→ **Availability**
→ **Credit**
→ **Approval**
→ **Promise**
→ **Supply**
→ **Delivery**
→ **Invoice**
→ **Payment**

without understanding the internal architecture of the ERP.

That should be the defining principle of Atlas Sales Order Processing.