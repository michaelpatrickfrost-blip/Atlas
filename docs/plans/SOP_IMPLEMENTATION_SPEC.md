# ATLAS S&OP / INTEGRATED BUSINESS PLANNING

## MASTER CODEX IMPLEMENTATION SPECIFICATION

You are acting as the principal ERP architect, senior full-stack engineer, supply-chain planning specialist and data architect responsible for implementing a first-class Sales & Operations Planning application inside the existing Atlas ERP.

This is not a standalone forecasting tool.

This is not a dashboard mock-up.

This is not a CRM report.

Build a deeply integrated Atlas S&OP application that connects:

- historical sales
- actual customer demand
- CRM opportunities
- CRM sales projects
- quotations
- confirmed Sales Orders
- open order backlog
- requested delivery dates
- confirmed/promised delivery dates
- picking
- dispatch
- shipments
- actual customer deliveries
- OTIF
- product history
- stock
- inventory forecasts
- procurement
- supplier performance
- production plans
- MRP
- manufacturing capacity
- production campaigns
- labour capacity
- costs
- financial budgets
- revenue forecasts
- margin
- scenarios
- risks
- management decisions

The application must answer four fundamental questions:

1. What do we expect customers to want?
2. What can we realistically supply?
3. What will that mean financially?
4. Are we actually delivering what we planned and promised?

Atlas S&OP should become the cross-functional planning layer between commercial demand and operational execution.

The core flow is:

CRM / PROJECTS / OPPORTUNITIES
↓
SALES ORDERS / HISTORICAL DEMAND
↓
DEMAND PLAN
↓
CONSENSUS FORECAST
↓
SUPPLY REVIEW
↓
MRP / MANUFACTURING / INVENTORY / PROCUREMENT
↓
FINANCIAL REVIEW
↓
EXECUTIVE S&OP
↓
APPROVED OPERATING PLAN
↓
EXECUTION
↓
ORDERS / PRODUCTION / DELIVERIES
↓
ACTUAL PERFORMANCE
↓
FORECAST ACCURACY / OTIF / VARIANCE
↓
NEXT S&OP CYCLE

These must be genuine data relationships, not links between unrelated screens.

---

# 1. FIRST: INSPECT ATLAS

Before implementing anything, inspect the repository thoroughly.

Understand:

- application architecture
- frontend stack
- backend stack
- database
- ORM
- API conventions
- authentication
- company/tenant model
- site model
- product model
- customer model
- CRM
- CRM opportunities
- CRM projects
- quotes
- Sales Orders
- order lines
- delivery schedules
- Inventory
- stock movements
- Logistics
- dispatches
- shipments
- delivery records
- carrier integration
- proof-of-delivery data if present
- Manufacturing
- production orders
- MRP
- production planning
- machine/work-centre models
- Procurement
- purchase orders
- Finance
- budgets
- price lists
- product costing
- invoices
- currencies
- Atlas notifications
- roles and permissions
- comments/tasks
- audit logging
- reporting
- dashboard framework
- chart components
- tables
- filters
- drawers
- modals
- design tokens
- light/dark themes

Do not invent parallel sources of truth.

S&OP consumes and augments data owned by other Atlas applications.

Examples:

Sales Orders owns customer orders.

Logistics owns shipments/deliveries.

Inventory owns stock.

CRM owns opportunities.

Manufacturing owns manufacturing orders.

MRP owns detailed material requirements.

Finance owns actual financial transactions.

S&OP owns:

- planning cycles
- demand plans
- forecast layers
- consensus plans
- planning assumptions
- scenario versions
- S&OP overrides
- plan snapshots
- review workflow
- plan decisions
- calculated planning metrics
- planning exceptions
- planning-specific aggregations

---

# 2. APPLICATION NAME AND POSITION

Create a first-class Atlas application:

**S&OP**

Full name:

**Sales & Operations Planning**

Where Atlas terminology permits, the product can also describe itself as:

**Integrated Business Planning**

Do not hide this inside CRM.

CRM supplies commercial intelligence.

S&OP reconciles that intelligence with actual history, supply capability and Finance.

---

# 3. PROPOSED NAVIGATION

Use existing Atlas navigation conventions.

Suggested S&OP application navigation:

## Overview

Executive view of the current operating plan.

## Demand

Commercial and statistical demand planning.

## Orders & Service

Live open-order, dispatch, delivery and OTIF control tower.

## Supply

Inventory, MRP, manufacturing, capacity and procurement feasibility.

## Finance

Revenue, cost, margin, budget and financial reconciliation.

## Products

Product-level demand and supply intelligence.

## Customers

Customer-level planning and delivery intelligence.

## Projects

CRM project demand and associated orders.

## Scenarios

Base, upside, downside and custom what-if planning.

## Planning Cycle

Current monthly S&OP process, responsibilities and approvals.

## Accuracy

Forecast accuracy, bias and forecast-value-add analysis.

## Risks & Actions

Cross-functional exceptions, decisions and actions.

## History

Archived S&OP cycles and plan versions.

## Settings

S&OP configuration.

Do not force this exact route structure if Atlas already has a stronger consistent navigation pattern.

---

# 4. CORE PLANNING HORIZON

Do not limit S&OP to the current financial year.

Default planning horizon should be configurable.

Recommended default:

- first 13 weeks: weekly visibility
- months 4 to 18: monthly
- optional months 19 to 36: monthly or quarterly

Allow businesses to configure:

- 12 months
- 18 months
- 24 months
- 36 months

The system must support a rolling horizon.

When a month closes, the planning horizon moves forward.

Historical actuals remain available.

---

# 5. PLANNING DIMENSIONS

S&OP measures must be analysable through relevant dimensions.

At minimum:

- company
- business unit
- site
- warehouse
- sales region
- salesperson
- customer group
- customer
- delivery location
- market
- channel
- project
- opportunity
- product category
- product family
- product group
- SKU/product
- manufacturing family
- currency
- period

Reuse Atlas master-data hierarchies.

Do not create a separate hierarchy system if Atlas already provides one.

Support flexible aggregation.

Example:

Company
→ Product Family
→ Product
→ Customer
→ Project

Or:

Company
→ Region
→ Salesperson
→ Customer
→ Product

Users must be able to change perspective without creating a new forecast.

---

# 6. PLANNING GRAIN

The canonical S&OP fact model should support a lowest useful planning grain such as:

company  
site  
customer/customer group where relevant  
product  
period  
scenario/version  
forecast layer

Do not materialise every possible dimension combination unnecessarily.

Use efficient aggregation/read models.

---

# 7. DEMAND SIGNAL TYPES

Atlas must distinguish different demand signals.

Do not combine them into a single opaque number.

Model at least:

### Historical bookings

What customers ordered.

### Historical requested demand

Quantity requested for a particular delivery period.

### Historical shipments

What Atlas dispatched.

### Historical delivered demand

What was actually delivered.

### Historical invoiced sales

Financial actual.

### Current confirmed orders

Open Sales Orders.

### Current backlog

Orders whose requested/confirmed date has passed but remain unfulfilled.

### Statistical baseline forecast

System-generated expected demand.

### CRM opportunity demand

Potential future sales.

### CRM project demand

Expected product requirements from commercial projects.

### Sales forecast adjustment

Salesperson/account-manager judgement.

### Marketing/event adjustment

Where applicable.

### Product lifecycle adjustment

Launch, ramp-up, decline or phase-out.

### Management adjustment

Approved planning intervention.

### Consensus demand

Agreed unconstrained commercial forecast.

### Constrained demand

Demand Atlas believes the current supply plan can fulfil.

### Demand at risk

Consensus demand that cannot currently be confidently supplied.

Every measure should remain independently traceable.

---

# 8. DO NOT CONFUSE SHIPMENTS WITH DEMAND

This is critical.

A business might have:

Customer requested: 100,000 units  
Orders accepted: 100,000  
Shipped: 85,000

Do not teach Atlas that historical demand was 85,000 simply because supply failed.

Store the distinction.

This enables Atlas to identify:

Demand = 100,000

Supply failure = 15,000

rather than:

Demand = 85,000

Where possible, forecasting should allow the planner to choose the historical signal:

- bookings
- requested demand
- shipments
- delivered quantity
- adjusted demand

---

# 9. HISTORICAL DATA

Default analytical history:

36 months where available.

Allow:

- 12 months
- 24 months
- 36 months
- 60 months
- all available

Historical measures should include:

## Sales

- ordered quantity
- shipped quantity
- delivered quantity
- invoiced quantity
- net revenue
- selling price
- discounts
- surcharge
- returns
- cancellations
- lost demand where known

## Service

- requested delivery date
- confirmed delivery date
- actual dispatch date
- actual delivery date
- OTIF
- on-time percentage
- in-full percentage
- lateness
- early delivery
- order changes

## Manufacturing

- planned output
- actual output
- plan attainment
- production delays
- machine downtime
- capacity utilisation
- campaign performance
- scrap
- yield

## Inventory

- stock level
- available stock
- reservations
- safety stock
- stock-outs
- coverage
- excess stock

## Procurement

- purchase quantities
- requested arrival
- supplier-confirmed arrival
- actual receipt
- supplier OTIF
- supplier lead-time variation

## Financial

- actual revenue
- product cost
- margin
- margin %
- budget
- forecast
- variance

---

# 10. HISTORICAL DATA QUALITY

Do not blindly feed every historical transaction into forecasting.

Support metadata/flags for:

- stock-out affected
- exceptional one-off order
- abnormal promotion
- unusual project order
- system migration anomaly
- customer closure
- pandemic/disruption event
- pricing anomaly
- cancelled order
- return
- data-quality problem

Do not automatically delete these.

Allow users to:

- include
- exclude from statistical baseline
- retain for reporting
- annotate

Keep an audit trail.

---

# 11. DEMAND FORECAST LAYERS

For each product/period, support layers such as:

Historical reference  
Statistical baseline  
Confirmed order demand  
CRM project demand  
CRM opportunity demand  
Sales adjustment  
Marketing adjustment  
Lifecycle adjustment  
Management adjustment  
Consensus forecast  
Constrained forecast

Example:

Product A, June

Statistical baseline: 82,000  
Open confirmed orders: 31,000  
Project pipeline effect: +8,000  
Sales adjustment: +4,000  
Lifecycle adjustment: 0  
Consensus forecast: 94,000  
Current constrained supply: 87,000  
Demand at risk: 7,000

Make the calculation inspectable.

---

# 12. FORECAST ALGORITHMS

Create a pluggable forecasting architecture.

Do not build forecasting calculations directly inside React components.

Useful baseline methods include:

- seasonal naïve
- moving average
- weighted moving average
- exponential smoothing
- Holt trend
- Holt-Winters / ETS
- intermittent-demand method such as Croston/SBA where appropriate
- manual
- historical-year profile
- project-driven forecast

If the existing Atlas stack has suitable statistical libraries, additional models may be implemented cleanly.

Do not introduce large machine-learning infrastructure merely to say Atlas uses AI.

Create a forecast-provider interface so more sophisticated models can be added later.

---

# 13. BEST-FIT FORECASTING

Where multiple models exist, support historical back-testing.

Compare model performance over a holdout window.

Possible metrics:

- MAE
- RMSE
- MAPE where valid
- sMAPE
- WAPE
- bias

Select the best model using a documented rule.

Store:

- model selected
- parameters
- training window
- validation window
- accuracy
- run timestamp
- source data snapshot

The user must be able to see:

**Why did Atlas select this model?**

---

# 14. INTERMITTENT DEMAND

Some products will have:

0  
0  
0  
800  
0  
0  
400  
0

Do not treat intermittent products as normal smooth-demand products.

Classify product demand patterns.

Possible classifications:

- stable
- growing
- declining
- seasonal
- highly volatile
- intermittent
- project-driven
- new product
- end-of-life

Expose the classification.

Allow planners to override it with a reason.

---

# 15. FORECAST EXPLAINABILITY

Selecting a forecast should show the components.

Example:

## Product X, March

Historical March 2024: 8,300  
Historical March 2025: 9,100  
Historical March 2026: 9,800

Trend effect: +450  
Seasonal effect: +600  
CRM project: +1,200  
Sales adjustment: +500  
Lost customer: -400

Consensus: **12,150**

Do not show unsupported pseudo-AI explanations.

Every component should be traceable to actual calculations/data.

---

# 16. FORECAST AGGREGATION AND DISAGGREGATION

Allow users to adjust forecasts at aggregate levels.

Example:

Clay Drainage FY27:

+8%

Atlas should distribute the adjustment across underlying products using an explicit allocation method.

Support:

- proportional to current baseline
- proportional to historical mix
- proportional to prior year
- equal spread
- custom weight

Allow individual products to be locked.

Reconcile totals after adjustments.

Never silently lose or create quantity during disaggregation.

---

# 17. FORECAST OVERRIDES

Manual adjustments need:

- original value
- adjusted value
- adjustment amount
- adjustment %
- user
- timestamp
- reason code
- comment
- source
- approval status where configured

Suggested reason codes:

- customer intelligence
- new project
- project delayed
- project lost
- customer growth
- customer decline
- market change
- competitor activity
- pricing
- promotion
- supply restriction
- product launch
- phase-out
- one-off event
- other

Do not overwrite the baseline.

---

# 18. CRM OPPORTUNITIES

CRM opportunities must feed S&OP but must not directly drive live MRP.

For each opportunity expose:

- opportunity
- customer
- expected close date
- project/delivery period
- stage
- stage probability
- salesperson confidence
- forecast category
- expected value
- products
- quantities
- expected timing

Forecast categories can include:

- pipeline
- upside
- best case
- commit

Keep:

raw opportunity quantity

separate from:

probability-weighted quantity.

Example:

Opportunity Product A quantity: 50,000  
Probability: 60%

Raw pipeline: 50,000  
Weighted pipeline: 30,000

Do not replace 50,000 with 30,000.

---

# 19. CRM SALES PROJECTS

Atlas CRM projects should support a demand profile.

Example:

**Meadow View Development**

Product SP1  
Total expected: 50,000

Jun: 5,000  
Jul: 10,000  
Aug: 12,000  
Sep: 10,000  
Oct: 8,000  
Nov: 5,000

Project demand should support:

- total estimated quantity
- product mix
- expected start
- expected completion
- phasing pattern
- probability
- confidence
- associated quotes
- associated orders
- associated customer
- commercial owner

When Sales Orders are raised against the project, S&OP should reconcile forecast demand with converted actual demand.

Avoid double counting project forecast plus confirmed orders.

---

# 20. FORECAST CONSUMPTION

Implement configurable forecast consumption.

Example:

Forecast demand for June: 100,000

Sales Orders already received for June: 40,000

Do not necessarily calculate total demand as:

140,000.

Depending on policy, confirmed order demand may consume the forecast.

Support consumption rules such as:

- confirmed orders consume forecast
- orders are additive
- project-specific consumption
- customer-specific consumption
- configurable backward/forward consumption windows

Make the effect visible.

Example:

Baseline forecast: 100,000  
Consumed by orders: 40,000  
Remaining forecast: 60,000  
Confirmed orders: 40,000  
Total planned demand: 100,000

---

# 21. PRODUCT LIFECYCLE

Support:

- pre-launch
- launch
- growth
- mature
- declining
- phase-out
- discontinued

New products may use a reference product.

Example:

New Product B

Reference demand profile: Product A

Allow:

- launch date
- ramp percentage
- cannibalisation relationship
- replacement product
- phase-out curve

Do not rely on non-existent history.

---

# 22. SALES ORDER INTEGRATION

S&OP must link all relevant demand to real Atlas Sales Orders.

Every qualifying order should be drillable from S&OP to:

- Sales Order
- Sales Order line
- customer
- delivery address
- product
- requested date
- confirmed date
- quantity
- allocated stock
- picking
- dispatch
- shipment
- delivery
- invoice
- project
- production requirement where relevant

Do not duplicate the order.

Store references.

---

# 23. ORDER DATE MODEL

Preserve distinct date concepts.

At Sales Order line/delivery-line level where possible:

- order date
- requested ship date
- requested delivery/receipt date
- confirmed/promised ship date
- confirmed/promised delivery date
- planned pick date
- actual pick completion
- planned dispatch date
- actual dispatch date
- estimated arrival date
- actual delivery date
- invoice date

Do not collapse these into a generic `deliveryDate`.

---

# 24. OTIF DEFINITIONS

Atlas needs clear service metrics.

Do not use one ambiguous OTIF figure.

At minimum calculate:

## Customer OTIF

Measures service against the customer's requested delivery date.

**On Time**

Actual customer delivery date is on/before requested delivery date, subject to configured tolerance.

**In Full**

Cumulative quantity delivered by that date meets the required quantity threshold.

Default threshold:

100%

Configurable by company policy.

## Promise OTIF

Measures reliability against Atlas's confirmed/promised delivery date.

This answers:

> Did we keep the promise we gave the customer?

## Dispatch OTIF / Ship OTIF

Where actual customer delivery is unavailable, measure shipment against promised/requested ship date.

Do not label dispatch OTIF as customer-delivery OTIF.

---

# 25. DELIVERY DATA QUALITY

If Atlas has no actual customer delivery/POD event, it must not pretend to know customer delivery OTIF.

Use states such as:

- delivery verified
- carrier-confirmed
- estimated
- dispatch-only
- no delivery evidence

The UI should disclose the measurement basis.

Example:

Customer OTIF: unavailable  
Reason: no actual delivery/POD timestamp

Dispatch OTIF: 96.4%

This is preferable to false precision.

---

# 26. OTIF POLICY CONFIGURATION

Settings should allow:

### Date basis

Customer requested delivery date  
Confirmed delivery date  
Requested ship date  
Confirmed ship date

### Early/late tolerance

Example:

0 days  
+1 working day  
custom

### In-full tolerance

100%  
99%  
98%  
custom

### Time basis

Calendar days  
Working days

### Inclusion rules

Include/exclude:

- cancelled lines
- free-of-charge lines
- samples
- internal transfers
- collection orders
- returns
- replacement orders
- disputed orders

Store the policy version used for calculated historic metrics.

---

# 27. SPLIT DELIVERIES

Support split deliveries correctly.

Example:

Order line quantity: 1,000

Requested date: 10 June

Delivered:

8 June: 600  
10 June: 300  
12 June: 100

By 10 June:

900/1,000 delivered.

If In Full threshold = 100%:

On Time may be false for the complete line.

In Full = false.

OTIF = false.

Do not allow the final late 100 units to rewrite history as on-time.

Retain delivery-event detail.

---

# 28. ORDER-LEVEL OTIF

Calculate at line/delivery schedule level first.

For order-level OTIF:

Default:

order passes only when all included qualifying lines pass.

Also support reporting:

- line OTIF
- order OTIF
- revenue-weighted OTIF
- quantity-weighted OTIF

Never mix these without clearly labelling them.

---

# 29. LIVE ORDERS & SERVICE CONTROL TOWER

Create a major S&OP workspace:

**Orders & Service**

This should work operationally every day, not just at the monthly S&OP meeting.

Primary views:

### Going Out Today

Orders/loads scheduled to dispatch today.

### Due to Customer Today

Orders expected at customer today.

### Tomorrow

Upcoming deliveries.

### Next 7 Days

Forward service risk.

### At Risk

Orders likely to miss requested/confirmed dates.

### Late

Orders already late.

### Partial

Partially delivered orders.

### Dispatched

Goods in transit.

### Delivered

Completed deliveries.

### Unconfirmed

Orders without reliable promise dates.

---

# 30. ORDER SERVICE GRID

Columns should be configurable but may include:

- order number
- customer
- delivery site
- project
- product summary
- order value
- requested delivery
- confirmed delivery
- planned dispatch
- actual dispatch
- ETA
- actual delivery
- order status
- pick status
- stock status
- production status
- carrier/load
- service risk
- customer OTIF status
- promise OTIF status

Clicking an order opens an inspector/drawer.

Do not force users to leave S&OP simply to understand the issue.

Provide links to the canonical Atlas records.

---

# 31. ORDER TIMELINE

Order inspector should show a chronological timeline.

Example:

02 Oct  
Order entered

03 Oct  
Stock allocated

04 Oct  
Requested delivery changed by customer

05 Oct  
Production completed

06 Oct 08:12  
Picking started

06 Oct 11:35  
Picking completed

06 Oct 15:20  
Load confirmed

07 Oct 06:30  
Dispatched

07 Oct 13:42  
Delivered

Keep source-event references.

---

# 32. ORDER RISK ENGINE

Create an explainable service-risk calculation.

Do not start with a black-box AI model.

Risk signals may include:

- no stock allocated
- insufficient ATP
- required production not complete
- material shortage
- machine delay
- pick not started
- dispatch cutoff approaching
- no carrier booking
- dispatch late
- ETA beyond promised date
- historical route/carrier lateness
- customer delivery window
- open credit hold where relevant

Output:

Low  
Medium  
High  
Critical

Also expose reasons.

Example:

**High risk**

- Production completion 14 hours behind plan
- Picking cannot begin until 13:00
- Dispatch cutoff 15:00

---

# 33. SERVICE FORECAST

S&OP should forecast not only sales but likely service performance.

For future periods expose:

- forecast demand
- planned supply
- demand at risk
- orders at risk
- projected OTIF
- projected backlog
- projected shortage

Do not present projected OTIF as actual OTIF.

Label clearly.

---

# 34. DEMAND REVIEW WORKSPACE

Build a flexible planning grid.

Selectors:

Measure:
- units
- tonnes
- pallets
- revenue
- margin
- ASP
- forecast accuracy
- order demand
- shipment demand

Version:
- baseline
- Sales
- consensus
- budget
- scenario

Time:
- week
- month
- quarter
- year

Hierarchy:
- product
- customer
- salesperson
- region
- project
- site

Example:

| Product | Jan | Feb | Mar | Apr | FY |
|---|---:|---:|---:|---:|---:|
| SP1 | 98k | 103k | 120k | 114k | 1.34m |
| SB1 | 32k | 34k | 41k | 39k | 470k |

Allow expand/collapse.

Support totals.

Support locking.

---

# 35. FORECAST VERSIONS

Never overwrite published forecast history.

Support:

- working version
- Sales submission
- Finance submission
- consensus
- approved operating plan
- archived snapshot
- scenarios

Example:

January Consensus  
February Consensus  
March Consensus

Preserve all.

---

# 36. FORECAST LAG ACCURACY

Measure forecast accuracy by planning horizon.

Example:

Actual March = 90,500

March forecast made in December: 81,000  
March forecast made in January: 87,000  
March forecast made in February: 91,200

Calculate:

3-month lag accuracy  
2-month lag accuracy  
1-month lag accuracy

This matters because long manufacturing/procurement lead times require useful forecasts well before the month starts.

---

# 37. FORECAST ACCURACY

Support metrics including:

- MAE
- MAPE where meaningful
- sMAPE
- WAPE
- bias
- absolute bias
- forecast-value-add

Allow breakdown by:

- product
- customer
- salesperson
- product family
- site
- region
- forecast model
- forecast contributor
- horizon

---

# 38. FORECAST VALUE ADD

Compare forecast stages.

Example:

Statistical baseline accuracy: 82%

Sales-adjusted: 88%

Consensus: 90%

Sales FVA:

+6 percentage points.

Another example:

Baseline: 88%  
Sales: 80%

Sales intervention reduced accuracy.

Do not use this as an employee-performance score automatically.

It is planning-quality information.

---

# 39. SUPPLY REVIEW

The Supply Review consumes the unconstrained consensus forecast.

Integrate with:

- Inventory
- MRP
- Manufacturing
- Production Planning
- Procurement
- Logistics
- labour
- machinery
- production campaigns

Show:

Demand  
Available stock  
Expected receipts  
Planned production  
Capacity  
Material availability  
Supplier capacity where available  
Constrained supply  
Gap

---

# 40. UNCONSTRAINED VS CONSTRAINED

This distinction is essential.

Example:

Consensus demand: 800,000

Current feasible supply: 720,000

Demand at risk: 80,000

Do not reduce the commercial demand forecast to 720,000.

Keep:

Unconstrained demand = 800,000

Constrained operating plan = 720,000

Gap = 80,000

Management can then choose an action.

---

# 41. DEMAND-AT-RISK ROOT CAUSE

Break constrained demand down by reason:

- raw material
- machine capacity
- labour
- supplier
- production lead time
- inventory
- logistics
- warehouse
- financial/credit hold where applicable
- unknown

Example:

Demand at risk: £820,000

Machine capacity: £420,000  
Material shortage: £210,000  
Supplier delay: £120,000  
Other: £70,000

Allow drill-through.

---

# 42. MRP INTEGRATION

Approved S&OP demand should be publishable to MRP.

Do not make every working forecast feed production.

Flow:

Working forecast  
↓
Consensus  
↓
Approved consensus  
↓
Published demand plan  
↓
MRP

Version the publication.

Record:

- S&OP cycle
- forecast version
- publication date
- user
- planning horizon
- products/sites
- MRP demand-plan reference

MRP should be able to trace demand back to S&OP.

---

# 43. SUPPLY RESPONSE

Bring summarised MRP response back into S&OP.

Example:

Product A

Consensus demand: 120,000  
Opening stock: 20,000  
Planned production: 90,000  
Closing stock: -10,000  
Demand at risk: 10,000

Click through to detailed MRP.

Do not duplicate the full detailed production scheduler in S&OP.

---

# 44. PRODUCTION CAPACITY

Expose aggregate capacity.

By:

- work centre
- machine group
- machine
- production family
- site
- month/week

Show:

available capacity  
required capacity  
utilisation  
overload

Example:

Extrusion:

Available: 2,400 h  
Required: 2,790 h  
Utilisation: 116.3%

Overload: 390 h

---

# 45. INVENTORY PLAN

For each period:

Opening stock  
Planned receipts  
Production  
Purchases  
Demand  
Closing stock  
Safety stock  
Excess  
Shortage  
Weeks/days cover

Support:

- quantity
- value

Highlight:

- projected stock-outs
- excessive stock
- slow-moving risk
- obsolete risk

---

# 46. PROCUREMENT VIEW

Summarise:

- critical materials
- future requirements
- existing POs
- unplaced requirement
- supplier constraints
- expected shortages
- supplier OTIF
- lead-time performance

Click through to Procurement.

Do not rebuild purchase-order management.

---

# 47. FINANCIAL REVIEW

Convert the operating plan into money.

Support:

- units
- tonnes
- revenue
- net revenue
- average selling price
- material cost
- manufacturing cost
- logistics cost where available
- gross margin
- margin %
- inventory value
- working-capital impact

Compare:

Budget  
Target  
Latest forecast  
Consensus  
Constrained operating plan  
Actual

---

# 48. VOLUME, PRICE AND MIX

Revenue change should be explainable.

Build a bridge separating:

- volume
- price
- mix
- new customers
- lost customers
- new products
- projects
- FX where relevant
- other adjustments

Example:

FY26 actual: £22.4m

Volume: +£1.6m  
Price: +£780k  
Mix: +£210k  
Projects: +£890k  
Lost customers: -£310k

FY27 forecast: £25.57m

---

# 49. PRICE ASSUMPTIONS

Do not force Sales to forecast revenue manually where Atlas can derive it.

Allow forecast quantities to combine with:

- customer price list
- contract price
- expected price change
- discount
- surcharge
- currency
- FX rate
- rebate assumptions

Finance can adjust planning price assumptions without altering demand quantity.

---

# 50. BUDGET VS TARGET VS FORECAST

These are not interchangeable.

Store separately:

## Budget

Original approved financial plan.

## Target

Management goal.

## Forecast

Current expectation.

## Actual

What happened.

Example:

Budget: £30m  
Target: £32m  
Latest Forecast: £28.9m  
Actual YTD: £18.2m

Do not inflate forecast to make it equal target.

---

# 51. SCENARIO PLANNING

Create non-destructive scenarios.

Default:

Base  
Upside  
Downside

Allow custom.

Examples:

- win major project
- lose major customer
- price increase 5%
- raw material +10%
- kiln outage six weeks
- second shift
- extra campaign
- supplier delay
- sales growth +12%
- economic downturn

Scenario changes should be stored as deltas/assumptions where practical.

Do not duplicate the entire ERP database.

---

# 52. SCENARIO IMPACT

Calculate scenario changes across:

Commercial:

- revenue
- volume
- customer/project demand

Operations:

- capacity
- machine load
- production
- procurement

Inventory:

- stock
- coverage
- shortages

Finance:

- revenue
- costs
- margin
- working capital

Service:

- demand at risk
- potential OTIF
- backlog

---

# 53. SCENARIO COMPARISON

Allow side-by-side comparison.

Example:

| Metric | Base | Upside | Downside |
|---|---:|---:|---:|
| Revenue | £29.1m | £32.4m | £25.8m |
| Margin | 39.2% | 40.1% | 36.8% |
| Demand at risk | £0.8m | £2.4m | £0.2m |
| Peak inventory | £4.1m | £5.4m | £3.2m |
| Capacity overload | 480h | 1,740h | 0h |

---

# 54. S&OP PLANNING CYCLE

Create a configurable planning-cycle workflow.

Suggested stages:

1. Data Refresh
2. Product Review
3. Demand Review
4. Supply Review
5. Financial Review
6. Pre-S&OP
7. Executive Review
8. Approved / Published

Businesses can rename or disable stages where appropriate.

Each stage can have:

- owner
- participants
- tasks
- due date
- status
- comments
- actions
- decisions
- approval

---

# 55. DATA REFRESH

At the start of a cycle, snapshot planning inputs.

Include:

- latest actual Sales Orders
- shipments
- deliveries
- inventory
- production
- CRM
- procurement
- actual finance
- master data
- previous forecast

Do not freeze operational systems.

Snapshot only what is necessary for reproducible planning.

---

# 56. PRODUCT REVIEW

Review:

- new products
- launches
- phase-outs
- substitutions
- lifecycle
- major cost changes
- manufacturing changes

Decisions feed the demand/supply plan.

---

# 57. DEMAND REVIEW

Sales/commercial team reviews:

- baseline
- confirmed orders
- projects
- opportunities
- customer changes
- product changes
- forecast errors
- proposed adjustments

Output:

**Unconstrained Consensus Demand Plan**

---

# 58. SUPPLY REVIEW

Operations tests consensus demand against:

- Inventory
- Procurement
- MRP
- machinery
- labour
- manufacturing
- logistics

Output:

**Constrained Operating Plan**

plus:

**Demand at Risk**

---

# 59. FINANCIAL REVIEW

Finance compares:

- revenue
- cost
- margin
- inventory
- budget
- target
- latest forecast

Identify financial gaps.

---

# 60. PRE-S&OP

Cross-functional users resolve major mismatches.

Example:

Demand: 1.2m units

Current capacity: 1.05m

Options:

A. Overtime  
B. Additional campaign  
C. External manufacturing  
D. Build inventory early  
E. Accept shortfall

Store the options and decision.

---

# 61. EXECUTIVE REVIEW

Executive view should focus on decisions, not hundreds of cells.

Display:

- plan vs budget
- revenue
- margin
- demand
- supply gap
- inventory
- OTIF
- forecast accuracy
- production attainment
- capacity
- major risks
- required decisions
- previous actions

Executives approve the operating plan.

---

# 62. EXECUTIVE S&OP DASHBOARD

Create a polished dashboard.

Headline KPIs:

Revenue Forecast  
Gross Margin  
Forecast Accuracy  
Customer OTIF  
Promise OTIF  
Production Attainment  
Inventory Cover  
Demand at Risk  
Capacity Gap

Charts:

### Actual + Forecast

Historical actuals flowing into future forecast.

### Demand vs Supply

Unconstrained versus constrained.

### Revenue vs Budget

### Forecast Accuracy Trend

### OTIF Trend

### Inventory Coverage

### Capacity Bottlenecks

### Forecast Movement Waterfall

### Demand-at-Risk Causes

### Products at Risk

### Customers at Risk

### Decisions Required

Avoid dashboard clutter.

Prioritise material exceptions.

---

# 63. ORDERS & SERVICE DASHBOARD

This is a live operational dashboard.

Top KPIs:

Due Today  
Going Out Today  
At Risk  
Late  
Dispatched  
Delivered  
Customer OTIF  
Promise OTIF

Main sections:

**Going Out Today**

**Due Today**

**Next 7 Days**

**At Risk**

**Late**

**Recently Delivered**

Allow search and filters.

This should provide management, Sales, Customer Service and Logistics with the same order truth.

---

# 64. CUSTOMER DRILL-DOWN

Customer page inside S&OP:

- historical sales
- forecast
- open orders
- backlog
- deliveries
- OTIF
- requested vs delivered trend
- forecast accuracy
- projects
- opportunities
- margin
- product mix
- upcoming demand
- service risks

Provide links to CRM and Sales.

---

# 65. PRODUCT DRILL-DOWN

Product page:

- sales history
- bookings history
- shipment history
- delivered history
- baseline forecast
- consensus
- orders
- projects
- customers
- forecast accuracy
- bias
- OTIF
- stock
- projected stock
- MRP requirement
- production plan
- capacity requirement
- shortages
- cost
- margin

This should become an excellent product intelligence page.

---

# 66. PROJECT DRILL-DOWN

Show:

- project value
- probability
- expected products
- phasing
- forecast contribution
- quotes
- converted orders
- delivered quantities
- remaining project demand
- project forecast accuracy
- project margin
- supply risk

Automatically reconcile project forecast with orders attributed to the project.

---

# 67. ORDER DRILL-DOWN

Show:

Commercial:

- order
- customer
- project
- value
- requested date
- promised date

Fulfilment:

- allocation
- pick
- pack
- load
- dispatch
- carrier
- ETA
- delivery

Supply:

- stock
- production
- material dependencies

Performance:

- Customer OTIF
- Promise OTIF
- days early/late

Timeline:

all key order events.

---

# 68. FORECAST MOVEMENT WATERFALL

Build a useful waterfall showing changes between versions.

Example:

Previous Forecast: £27.8m

Customer growth: +£620k  
New projects: +£1.1m  
Lost projects: -£430k  
Price: +£290k  
Volume: -£180k  
New products: +£520k

Latest: £29.72m

Support:

- revenue
- units
- tonnes
- margin

---

# 69. RISKS

Create structured planning risks.

Fields:

- type
- severity
- probability
- financial exposure
- demand exposure
- owner
- due date
- linked product
- customer
- project
- order
- machine
- material
- supplier
- scenario
- mitigation
- status

Risk types:

Demand  
Supply  
Capacity  
Inventory  
Customer service  
Supplier  
Financial  
Project  
Product lifecycle

---

# 70. ACTIONS AND DECISIONS

S&OP meetings should create actions.

Fields:

- action
- owner
- due date
- status
- priority
- linked cycle
- linked risk
- linked decision
- comments

Decisions should store:

- decision
- alternatives considered
- decision maker
- date
- reason
- impact
- linked scenario

This creates institutional memory.

---

# 71. NOTIFICATIONS

Use Atlas notification infrastructure.

Useful triggers:

- high-value order at risk
- order became late
- forecast override awaiting review
- major forecast movement
- demand exceeds supply
- capacity overload
- projected stock-out
- planning-cycle task overdue
- executive decision required

Avoid notification spam.

Aggregate related alerts where sensible.

---

# 72. DATA MODEL

Map to Atlas conventions rather than blindly using exact names.

Potential S&OP concepts:

SopPlanningCycle  
SopPlanningStage  
SopCycleParticipant  
SopCycleTask  
SopPlanVersion  
SopScenario  
SopScenarioAssumption  
SopSnapshot  
SopDemandFact  
SopForecastSeries  
SopForecastValue  
SopForecastModelRun  
SopForecastAdjustment  
SopForecastAccuracy  
SopForecastContribution  
SopConsensusPlan  
SopSupplyPlanSummary  
SopFinancialPlanSummary  
SopPlanPublication  
SopRisk  
SopAction  
SopDecision  
SopComment  
SopServiceMetricSnapshot  
SopOrderRiskSnapshot

References should point to canonical Atlas entities.

Do not copy full customer/product/order entities into S&OP.

---

# 73. TIME-SERIES FACT MODEL

Consider a normalised planning fact structure conceptually containing:

id  
company_id  
site_id  
product_id  
customer_id nullable  
project_id nullable  
period_start  
period_grain  
scenario_id  
version_id  
measure_type  
forecast_layer  
quantity  
value  
currency  
source_type  
source_id  
calculation_run_id  
created_at

Optimise based on the actual Atlas database.

Use efficient read models/materialisation for large planning grids.

---

# 74. SERVICE PERFORMANCE FACTS

Do not recalculate millions of historical order lines on every dashboard load.

Create an appropriate service-performance/read model containing data such as:

order_id  
order_line_id  
delivery_schedule_id  
customer_id  
product_id  
requested_date  
promised_date  
actual_dispatch_date  
actual_delivery_date  
required_quantity  
delivered_by_requested_date  
delivered_by_promised_date  
customer_on_time  
customer_in_full  
customer_otif  
promise_on_time  
promise_in_full  
promise_otif  
lateness_days  
measurement_basis  
policy_version

Recompute when relevant order/delivery events change.

---

# 75. DATA LINEAGE

Every important S&OP number should be traceable.

Example:

Consensus June Product A = 94,000

Show:

Baseline forecast 82,000  
Open orders effect 4,000  
Project adjustment 5,000  
Sales adjustment 3,000

Click sources.

Do not store unexplained totals where source components exist.

---

# 76. APPLICATION SERVICES

Keep calculations outside controllers/components.

Likely services:

DemandHistoryService  
DemandAggregationService  
ForecastGenerationService  
ForecastBacktestService  
ForecastAccuracyService  
ForecastConsumptionService  
ForecastAdjustmentService  
ForecastDisaggregationService  
ConsensusPlanningService  
SupplyReconciliationService  
FinancialPlanningService  
OrderServicePerformanceService  
OtifCalculationService  
OrderRiskService  
ScenarioService  
PlanComparisonService  
SopCycleService  
PlanPublicationService  
RiskService  
ActionService

Follow Atlas naming conventions.

---

# 77. EVENT INTEGRATION

Where Atlas has domain events, subscribe to relevant events.

Conceptually:

sales.order.created  
sales.order.updated  
sales.order.confirmed  
sales.order.cancelled  
sales.order.line.changed  
inventory.allocated  
picking.started  
picking.completed  
shipment.planned  
shipment.dispatched  
shipment.delivered  
delivery.confirmed  
invoice.posted  
crm.opportunity.updated  
crm.project.updated  
forecast.updated  
production.plan.updated  
production.completed  
inventory.changed  
purchase.order.updated  
purchase.receipt.completed

Use these to refresh affected read models.

Do not tightly couple S&OP UI directly to other modules' tables.

---

# 78. API / USE CASES

Expose clear application actions.

Examples:

GET current S&OP cycle  
POST create cycle  
POST refresh cycle inputs  
POST run demand forecast  
POST create forecast adjustment  
POST submit Sales forecast  
POST generate consensus  
POST run supply reconciliation  
POST run scenario  
POST compare scenarios  
POST publish operating plan  
GET demand grid  
GET product forecast  
GET customer forecast  
GET order service dashboard  
GET order service detail  
GET OTIF metrics  
GET forecast accuracy  
GET supply gaps  
GET capacity gaps  
GET financial review  
POST create risk  
POST create action  
POST approve review stage

Use Atlas validation and permission conventions.

---

# 79. CONCURRENCY

Protect planning edits.

Potential controls:

- plan version number
- optimistic locking
- last-updated timestamp
- stale-edit detection

If two users edit the same forecast cell, do not silently overwrite one another.

For published versions, prevent mutation.

Create a new working version.

---

# 80. SNAPSHOTS AND REPRODUCIBILITY

A published S&OP plan must be reproducible.

Snapshot or version enough input data to answer:

> Why did we approve this plan on 6 October?

Record:

- demand input version
- forecast model
- forecast adjustments
- CRM inputs
- open-order snapshot
- stock snapshot
- supply summary
- capacity summary
- financial assumptions
- price assumptions
- approval
- policy versions

Do not rely solely on today's mutable data.

---

# 81. ROLE-BASED ACCESS

Integrate with Atlas roles.

Suggested abilities:

### Sales

Review and edit commercial forecast for authorised customers/regions.

### Sales Manager

Approve Sales forecast and review projects.

### Demand Planner

Manage demand plan and consensus.

### Operations / Planning

Review supply feasibility and capacity.

### Procurement

Review future material constraints.

### Logistics

Review order fulfilment and delivery risk.

### Customer Service

Review live order/service performance.

### Finance

Manage financial assumptions and financial review.

### Executive

Review and approve S&OP operating plan.

### Admin

Configure S&OP settings/policies.

Protect APIs as well as UI.

---

# 82. AUDIT

Audit:

- forecast overrides
- model changes
- plan publication
- scenario assumptions
- price assumptions
- stage approvals
- OTIF policy changes
- manual service corrections
- risk changes
- decisions

Store previous value and new value where appropriate.

---

# 83. PERFORMANCE

Plan for significant datasets.

Potential scale:

- thousands of products
- thousands of customers
- millions of order lines
- years of history
- multiple sites
- many forecast versions

Do not issue API requests per table cell.

Do not calculate full historical OTIF in browser code.

Use:

- server-side aggregation
- indexed time-series queries
- materialised/read models where appropriate
- batching
- pagination
- virtualised large grids
- caching of immutable published versions

Avoid N+1 queries.

---

# 84. UX PRINCIPLES

The S&OP application should feel modern and powerful.

Avoid traditional ugly ERP planning screens.

Use:

- strong information hierarchy
- wide planning grids
- sticky row/column headers
- configurable columns
- expandable hierarchies
- side inspectors
- interactive charts
- restrained colours
- clear exceptions
- contextual drill-through
- useful tooltips
- good keyboard operation

Avoid:

- excessive cards
- colourful badge overload
- giant forms
- endless modal windows
- hidden calculations
- meaningless AI summaries

---

# 85. EXPLAINABILITY FIRST

For important values include a:

**Why?**

interaction.

Examples:

Why is forecast 94,000?

Why is this order high-risk?

Why is demand constrained?

Why is capacity overloaded?

Why did OTIF fail?

Why did forecast accuracy deteriorate?

Provide calculation detail from real data.

---

# 86. ORDERS SERVICE ACCEPTANCE SCENARIO

Use a targeted acceptance fixture.

Customer orders:

Order A  
Quantity 1,000  
Requested delivery 10 June  
Confirmed delivery 10 June

Deliveries:

600 on 8 June  
300 on 10 June  
100 on 12 June

Verify:

- cumulative delivered by requested date = 900
- In Full = false at 100% threshold
- Customer OTIF = false
- Promise OTIF = false
- final delivery does not rewrite historical service status as successful
- order timeline shows all deliveries

---

# 87. REQUESTED VS PROMISED ACCEPTANCE SCENARIO

Order B:

Customer requested: 10 June

Atlas confirmed: 12 June

Actual delivery: 12 June

Expected:

Customer On Time = false

Promise On Time = true

This distinction must be clearly visible.

---

# 88. FORECAST CONSUMPTION ACCEPTANCE SCENARIO

Forecast:

Product A June = 100,000

Confirmed orders = 40,000

Consumption policy:

confirmed orders consume forecast.

Expected:

Remaining forecast = 60,000

Total planned demand = 100,000

Do not produce 140,000.

---

# 89. LOST DEMAND ACCEPTANCE SCENARIO

Historical customer demand:

100,000 requested

Only:

85,000 shipped

due to supply shortage.

Verify:

Atlas retains:

Requested demand = 100,000

Shipment history = 85,000

Supply failure = 15,000

Forecast configuration using requested demand sees the 100,000 signal.

---

# 90. SUPPLY GAP ACCEPTANCE SCENARIO

Consensus demand:

800,000

Feasible supply:

720,000

Expected:

Unconstrained demand: 800,000  
Constrained plan: 720,000  
Demand at risk: 80,000

Do not lower consensus forecast.

---

# 91. PROJECT ACCEPTANCE SCENARIO

CRM project contains:

Product A: 50,000

Probability: 60%

Raw project demand:

50,000

Weighted:

30,000

Then customer places Sales Order:

20,000

Forecast consumption policy should prevent inappropriate project/order double counting.

Maintain traceability to the CRM project and order.

---

# 92. FORECAST VERSION ACCEPTANCE SCENARIO

March forecast snapshots:

December: 81,000  
January: 87,000  
February: 91,200  
Actual March: 90,500

Verify that Atlas can calculate forecast accuracy at multiple lags and that publishing February does not delete December or January.

---

# 93. S&OP END-TO-END ACCEPTANCE SCENARIO

A user must be able to:

1. Open S&OP.
2. See historical actuals.
3. See current open Sales Orders.
4. See current deliveries and OTIF.
5. Generate baseline demand.
6. See CRM project contribution.
7. Apply a justified Sales adjustment.
8. Create consensus forecast.
9. Run supply review.
10. See Inventory impact.
11. See MRP/manufacturing capacity response.
12. Identify demand at risk.
13. See financial impact.
14. Compare against budget.
15. Run a scenario.
16. Record an S&OP decision.
17. Approve the plan.
18. Publish demand to MRP.
19. Later see actual orders/deliveries against that plan.
20. Measure forecast accuracy and OTIF.

If this coherent workflow does not work, the feature is not complete.

---

# 94. TESTING

I want high confidence without wasting execution time.

During implementation use targeted:

- unit tests
- integration tests
- type checking
- linting

Do not repeatedly run the entire repository test suite after trivial changes.

Thoroughly test calculation services.

Important test areas:

- demand aggregation
- forecast consumption
- project demand
- forecast adjustments
- disaggregation
- versioning
- forecast lag accuracy
- OTIF requested-date calculation
- promise OTIF
- split deliveries
- partial deliveries
- cancellations
- service-policy changes
- order risk
- demand/supply gap
- scenarios
- financial calculations
- permissions
- audit
- publication idempotency
- concurrency

At final validation, run the sensible broader checks supported by the repository.

---

# 95. IMPLEMENTATION PHASES

Implement in logical vertical slices.

## Phase 1

Architecture and core S&OP plan/version model.

## Phase 2

Historical demand and Sales Order integration.

## Phase 3

Orders & Service, delivery tracking and OTIF.

## Phase 4

Demand planning and forecast layers.

## Phase 5

CRM opportunity/project integration.

## Phase 6

Forecast accuracy/version analysis.

## Phase 7

Supply Review integration.

## Phase 8

Financial Review.

## Phase 9

Scenarios.

## Phase 10

S&OP cycle/workflow.

## Phase 11

Executive dashboard and drill-through.

## Phase 12

Hardening, permissions, audit, performance and documentation.

Do not stop after producing the phase plan.

Implement the application.

---

# 96. DO NOT OVERBUILD

Do not introduce:

- unnecessary microservices
- a separate data warehouse unless architecture already warrants it
- an external AI platform
- Kubernetes
- excessive event infrastructure
- duplicate reporting engines

Solve the requirements cleanly within Atlas first.

Leave good extension boundaries.

---

# 97. FUTURE EXTENSION POINTS

Architecture should permit future capabilities such as:

- external economic signals
- weather
- commodity prices
- automated causal forecasting
- ML forecasting
- probabilistic forecasts
- confidence intervals
- Monte Carlo planning
- optimisation solvers
- automatic mitigation suggestions
- customer collaborative forecasts
- supplier collaboration

Do not build these merely because they are listed.

---

# 98. FINAL QUALITY REVIEW

Before declaring completion, review the implementation as:

- ERP architect
- Sales Director
- Demand Planner
- Production Planner
- Finance Director
- Customer Service Manager
- Logistics Manager

Look for:

- duplicated data
- broken ownership
- double-counted demand
- misleading OTIF
- missing order dates
- incorrect split-delivery logic
- weak forecast traceability
- poor drill-through
- unmanageable planning grids
- inaccessible calculations
- stale planning data
- incorrect Finance links
- unversioned forecasts
- missing permissions
- missing audits
- slow query patterns
- mock data presented as real functionality

Fix meaningful issues.

---

# 99. FINAL CODEX RESPONSE

When implementation is complete, respond with:

## Built

Main S&OP capabilities actually implemented.

## Integration

CRM  
Sales  
Logistics  
Inventory  
Manufacturing  
MRP  
Procurement  
Finance

## Data Model

Important entities/migrations.

## Calculations

Forecast  
OTIF  
Demand/supply  
Financial calculations.

## UI

Screens/workspaces built.

## Tests

What was run and results.

## Remaining Gaps

Only genuine outstanding work.

Do not claim features that are not implemented.

Do not paste the entire source code back to me.

The codebase is the deliverable.

---

# FINAL EXPECTATION

Atlas S&OP should let a management team move naturally from:

**What did customers actually demand?**

to:

**What did we actually deliver?**

to:

**What are customers likely to want next?**

to:

**What has Sales committed to?**

to:

**What projects might land?**

to:

**Can we supply it?**

to:

**What does that mean for production, inventory and purchasing?**

to:

**What does it mean financially?**

to:

**What decisions do we need to make?**

and then later:

**Were we right?**

The S&OP application must become Atlas's planning and decision layer across the entire business.