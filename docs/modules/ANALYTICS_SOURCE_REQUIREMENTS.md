# ATLAS ANALYTICS STUDIO

## Dashboards, Reporting, Self-Service Analytics and Excel Architecture

## 1. PURPOSE

Build a first-class analytics platform directly inside Atlas.

This must not feel like:

- an ERP report viewer
- a collection of fixed charts
- a Power BI embed
- a developer-only query builder
- a complicated data warehouse tool
- Excel inside a browser

The objective is:

> Give any authorised Atlas user the ability to understand the business, build beautiful dashboards, explore information from across Atlas, share those dashboards with colleagues, drill from a KPI to the actual business transactions behind it, and export the data to Excel when needed.

The system must provide significant analytical depth without exposing unnecessary technical complexity.

The user should think:

> “What do I want to know?”

Not:

> “Which database table do I join?”

---

# 2. CORE PRODUCT PRINCIPLE

Atlas Analytics should combine:

```text
POWER BI DEPTH
+
ERP CONTEXT
+
METABASE SIMPLICITY
+
ACUMATICA ACCESSIBILITY
+
NETSUITE DATASET REUSE
+
ODOO LIVE DATA
+
ATLAS VISUAL DESIGN
```

But it must be significantly easier to use.

The operating principle is:

> Simple first. Powerful when needed.

A normal manager should be able to build a meaningful dashboard in minutes.

A finance analyst should be able to build sophisticated multi-measure reporting.

A data specialist should have access to advanced calculations, relationships and modelling.

Those experiences must exist in the same product without forcing every user into the advanced experience.

---

# 3. ANALYTICS IS A CORE ATLAS MODULE

Create a parent module:

```text
ANALYTICS
│
├── Home
├── My Dashboards
├── Shared With Me
├── Team Dashboards
├── Company Dashboards
├── Explore Data
├── Reports
├── Metrics
├── Datasets
├── Alerts
├── Scheduled Reports
└── Administration
```

Do not call the primary experience "Business Intelligence".

Call it:

# Analytics

The dashboard-building environment should be:

# Dashboard Studio

The exploratory environment should be:

# Explore

The underlying reusable data objects should be:

# Data Views

This terminology is far easier for ordinary ERP users.

---

# 4. RESEARCH PRINCIPLES TO INCORPORATE

## Acumatica

Acumatica's Generic Inquiry approach is especially relevant.

Its users can expose ERP information for:

- dashboards
- reports
- pivot tables
- Excel
- OData

without requiring programming.

It also supports role-based real-time dashboards, drill-down and drag-and-drop dashboard design.

Atlas should take this concept considerably further.

---

## NetSuite

NetSuite correctly separates:

```text
DATASET
from
WORKBOOK
```

One dataset can power multiple visualisations, and permissions affect which records and fields a user can access.

Atlas should adopt this separation.

However, normal Atlas users should not have to know they are interacting with an analytical dataset unless they enter advanced mode.

---

## Odoo

Odoo connects dashboard components to live ERP data and provides global filters that can affect the underlying data sources simultaneously.

Atlas must support global dashboard filters, but use a stronger semantic mapping system so that one filter such as:

```text
Site = Doncaster
```

can correctly filter:

```text
Sales
Inventory
Production
Finance
Purchasing
Transport
```

even though those modules may technically store the site relationship differently.

---

## Dynamics 365

Dynamics makes analytical workspaces operational.

A visual can take users directly into detailed business pages and filtered transactions, so the dashboard becomes a starting point for work rather than the end of analysis.

Atlas must take this very seriously.

A dashboard should allow the user to:

```text
SEE
→ UNDERSTAND
→ INVESTIGATE
→ ACT
```

without changing application.

---

## Metabase

Metabase provides excellent contextual drill-through.

Clicking data can offer actions such as:

```text
Filter by this
See these records
Break out by
Zoom in
```

without changing the original dashboard.

Atlas should implement an even cleaner version.

---

## SAP Analytics Cloud

SAP demonstrates the power of:

- story-level filters
- page-level filters
- widget-level filters
- dynamic measure selectors
- dimension selectors
- input controls
- linked analysis

so dashboard viewers can interact with sophisticated reports without editing them.

Atlas should provide this power with dramatically less configuration.

---

# 5. ATLAS ANALYTICS ARCHITECTURE

The conceptual architecture should be:

```text
ATLAS TRANSACTIONAL MODULES
│
├── Sales
├── CRM
├── Finance
├── Customers
├── Purchasing
├── Products
├── Inventory
├── Manufacturing
├── Logistics
├── Quality
├── Maintenance
└── Other modules
       │
       ▼
SEMANTIC ANALYTICS LAYER
       │
       ├── Business Objects
       ├── Dimensions
       ├── Measures
       ├── Metrics
       ├── Relationships
       ├── Security
       ├── Time Intelligence
       └── Calculations
       │
       ▼
DATA VIEWS
       │
       ▼
QUERY ENGINE
       │
       ├── Live operational data
       ├── Cached aggregates
       └── Historical analytics store
       │
       ▼
ATLAS ANALYTICS
│
├── Dashboards
├── Explore
├── Reports
├── Alerts
├── Exports
└── Excel
```

This semantic layer is absolutely critical.

Do not build dashboard widgets directly against random database tables.

---

# 6. THREE LEVELS OF ANALYTICS USER

The system should progressively expose complexity.

## Level 1: Viewer

Most employees.

They can:

- open dashboards
- use filters
- click charts
- drill down
- change permitted parameters
- export permitted information
- save personal filter views
- subscribe
- comment
- share where allowed

They do not see dataset configuration.

---

## Level 2: Builder

Managers and power users.

They can:

- build dashboards
- drag metrics onto the canvas
- create charts
- build tables
- configure filters
- combine approved Data Views
- create straightforward calculations
- share dashboards
- create alerts

They should not need SQL.

---

## Level 3: Analyst

Advanced users.

They can additionally:

- create Data Views
- create calculations
- define relationships
- create advanced measures
- create parameters
- create analytical models
- inspect query lineage
- build custom fields
- configure advanced aggregation

---

## Level 4: Analytics Administrator

Can:

- certify datasets
- certify metrics
- configure semantic models
- manage relationships
- control analytics permissions
- manage external data
- monitor performance
- govern company dashboards

This progression prevents Atlas becoming another BI product where everyone faces analyst tooling.

---

# 7. SEMANTIC BUSINESS LAYER

This is the heart of the platform.

The database might contain:

```text
sales_order
sales_order_line
customer_account
warehouse_location
inventory_transaction
invoice_line
```

The user should see:

```text
Sales Orders
Customers
Products
Invoices
Inventory
Production
Suppliers
```

Not table names.

---

# 8. BUSINESS SUBJECTS

Create curated analytical subject areas.

Examples:

```text
Sales
Customers
CRM
Orders
Invoices
Finance
Cash
Purchasing
Suppliers
Products
Inventory
Production
Planning
Quality
Maintenance
Logistics
Transport
Customer Service
```

Selecting:

> Sales

should expose sensible things such as:

### Measures

Revenue  
Quantity  
Orders  
Average Order Value  
Gross Margin  
Margin %  
Customers  
Average Selling Price

### Dimensions

Customer  
Product  
Product Family  
Salesperson  
Region  
Site  
Date  
Month  
Quarter  
Order Status

The user should not configure joins.

---

# 9. BUSINESS OBJECTS

Internally define:

```text
analytics_subject
analytics_entity
analytics_field
analytics_relationship
analytics_dimension
analytics_measure
analytics_metric
```

Example:

```text
Subject:
Sales

Entity:
Sales Order Line

Grain:
One record per sales order line

Dimensions:
Customer
Product
Order Date
Salesperson
Site

Measures:
Net Revenue
Quantity
Cost
Gross Margin
```

---

# 10. GRAIN IS MANDATORY

Every analytical entity must declare its grain.

Examples:

```text
Sales Order
ONE ROW PER ORDER
```

```text
Sales Order Line
ONE ROW PER ORDER LINE
```

```text
Inventory Transaction
ONE ROW PER STOCK TRANSACTION
```

```text
Production Operation
ONE ROW PER PRODUCTION OPERATION
```

This prevents one of the most common BI errors:

# accidental duplication through joins.

Atlas must understand dataset grain.

---

# 11. RELATIONSHIP ENGINE

Define semantic relationships.

Example:

```text
Sales Order Line
→ Customer

Sales Order Line
→ Product

Sales Order Line
→ Salesperson

Sales Order Line
→ Site
```

Each relationship records:

```text
relationship_type

ONE_TO_ONE
ONE_TO_MANY
MANY_TO_ONE
MANY_TO_MANY
```

Also:

```text
join_keys
direction
mandatory
security_propagation
fanout_risk
```

---

# 12. FANOUT PROTECTION

Suppose someone combines:

```text
Order Line
+
Shipment Lines
```

One order line may have several shipment records.

A naive join can duplicate sales value.

Atlas must detect this.

Show:

> This relationship could duplicate Revenue. Atlas will aggregate Shipment data before combining it.

The platform must protect normal users from analytical mistakes.

---

# 13. CANONICAL DIMENSIONS

Create company-wide analytical dimensions.

Examples:

```text
Date
Company
Legal Entity
Site
Warehouse
Customer
Supplier
Product
Product Family
Employee
Salesperson
Department
Cost Centre
Project
Currency
```

Individual modules map into these dimensions.

This enables cross-module filtering.

---

# 14. WHY CANONICAL DIMENSIONS MATTER

Dashboard:

```text
Site = Doncaster
```

Widgets:

```text
Sales Revenue
Production Output
Inventory Value
Purchase Spend
OTIF
Labour Cost
```

Each widget may use a different Data View.

The global filter should still work.

Atlas maps:

```text
CANONICAL SITE
```

to the correct field in every source.

Odoo already demonstrates field matching for global filters across data sources. Atlas should formalise this concept at the semantic-model level.

---

# 15. METRIC CATALOGUE

Metrics must be reusable business objects.

Do not let each dashboard redefine:

```text
Revenue
Margin
OTIF
WIP
Inventory Value
```

independently.

Create:

```text
analytics_metric
```

Example:

```text
Metric:
Gross Margin

Description:
Net sales less recognised cost of goods sold.

Formula:
Net Revenue - COGS

Format:
Currency

Owner:
Finance

Status:
CERTIFIED
```

---

# 16. METRIC STATES

Metrics can be:

```text
PERSONAL
TEAM
COMPANY
CERTIFIED
DEPRECATED
```

Certified metrics show a subtle verification mark.

Example:

```text
Revenue ✓
```

Hover:

```text
Certified by Finance
Definition updated 12 September
```

---

# 17. METRIC INFORMATION

Click:

```text
ⓘ Gross Margin %
```

Show:

```text
Definition

Formula

Source

Owner

Last refreshed

Available dimensions

Security

Related metrics

Used by 14 dashboards
```

This eliminates arguments such as:

> Why does Finance's revenue not match Sales' revenue?

---

# 18. TIME INTELLIGENCE

This must be built into Atlas.

Users should not write formulas for:

```text
Month to date
Quarter to date
Year to date
Previous month
Previous quarter
Previous year
Rolling 7 days
Rolling 30 days
Rolling 12 months
Year-on-year
Period-on-period
```

Every compatible measure should support:

```text
COMPARE TO
```

with these options.

---

# 19. FISCAL CALENDARS

Support:

```text
calendar year
financial year
4-4-5
4-5-4
5-4-4
custom accounting period
```

Finance and Operations may use different calendars.

Do not hard-code Gregorian month reporting.

---

# 20. DATA VIEW

A Data View is the reusable analytical dataset.

Examples:

```text
Sales Performance

Order Fulfilment

Inventory Position

Production Performance

Customer Profitability

Supplier Performance

Financial Actuals

WIP Analysis
```

This resembles NetSuite's reusable dataset concept, but Atlas should make it more approachable.

---

# 21. DATA VIEW BUILDER

Normal experience:

```text
Create Data View

What do you want to analyse?

[ Sales ]

Start with:

○ Orders
● Order Lines
○ Invoices
○ Customers
```

Then:

```text
Choose information

☑ Revenue
☑ Quantity
☑ Customer
☑ Product
☑ Order Date
☑ Salesperson
```

Atlas resolves relationships automatically.

---

# 22. DATA VIEW PREVIEW

Always display a live preview.

Example:

```text
CUSTOMER        REVENUE       QUANTITY
ABC Ltd         £122,400      14,882
XYZ Plc          £98,210       9,210
```

Builder can immediately see whether their model makes sense.

---

# 23. ADVANCED DATA VIEW MODE

Analysts may open:

# Advanced

Show:

```text
Entities

Relationships

Dimensions

Measures

Filters

Calculations

Parameters

Security

Grain

Lineage
```

Do not show this by default.

---

# 24. CALCULATED FIELD BUILDER

Simple calculation UI:

```text
New calculation

Name:
Margin %

Formula:

[ Gross Margin ]
÷
[ Revenue ]
×
100
```

Support autocomplete.

---

# 25. EXPRESSION LANGUAGE

Advanced analysts may use an Atlas expression language.

Example:

```text
DIVIDE(
    SUM(GrossMargin),
    SUM(NetRevenue)
)
```

Functions:

```text
SUM
AVG
MIN
MAX
COUNT
DISTINCTCOUNT
DIVIDE

IF
CASE
COALESCE

DATE_DIFF
DATE_TRUNC
YEAR
MONTH

RUNNING_TOTAL
MOVING_AVERAGE
RANK

LAG
LEAD
```

Do not require DAX.

Keep the expression language intentionally small.

---

# 26. DASHBOARD STUDIO

The builder should feel closer to:

```text
Figma
+
Notion
+
modern analytics
```

than Power BI Desktop.

Structure:

```text
┌─────────────────────────────────────────────────────────┐
│ Dashboard Name                   Preview  Share Publish │
├──────────────┬────────────────────────────┬──────────────┤
│              │                            │              │
│ DATA         │                            │ PROPERTIES   │
│              │          CANVAS            │              │
│ Metrics      │                            │              │
│ Dimensions   │                            │ Data         │
│ Charts       │                            │ Style        │
│ Filters      │                            │ Interaction  │
│              │                            │              │
└──────────────┴────────────────────────────┴──────────────┘
```

---

# 27. BUILDER MODES

Toolbar:

```text
Add
Layout
Filters
Theme
Preview
Share
Publish
```

Avoid massive tool ribbons.

---

# 28. ADDING A VISUAL

User selects:

```text
+ Add
```

Options:

```text
KPI
Chart
Table
Pivot
Filter
Text
Image
Button
Insight
Record List
Progress
Target
```

Then:

```text
What do you want to show?
```

Search:

```text
revenue
```

Results:

```text
Revenue ✓
Revenue Forecast
Revenue Budget
Revenue per Customer
```

Drag:

```text
Revenue
```

onto canvas.

Atlas automatically creates an appropriate KPI card.

---

# 29. AUTOMATIC VISUAL RECOMMENDATION

If:

```text
Measure only
```

suggest:

```text
KPI
Gauge
Progress
```

If:

```text
Measure + Date
```

suggest:

```text
Line
Area
Column
```

If:

```text
Measure + Category
```

suggest:

```text
Bar
Column
Table
```

If:

```text
Two measures
```

suggest:

```text
Scatter
Comparison
```

Users may override.

---

# 30. CHART GUARDRAILS

Do not allow meaningless chart design without warning.

Example:

User tries:

```text
Pie chart
187 customers
```

Show:

> This chart will be difficult to read with 187 categories. A ranked bar chart or table may work better.

Allow override.

Atlas advises rather than dictates.

---

# 31. DASHBOARD CANVAS

Use responsive grid positioning.

Recommended desktop system:

```text
12 columns
```

Widgets support:

```text
drag
resize
snap
align
distribute
duplicate
group
lock
```

Display alignment guides during movement.

---

# 32. RESPONSIVE BREAKPOINTS

Store layout independently for:

```text
Desktop
Tablet
Mobile
```

Desktop layout should intelligently generate initial smaller layouts.

Builder may override.

Do not merely shrink a 12-column dashboard until it becomes unreadable.

---

# 33. PAGE STRUCTURE

Dashboards may contain pages.

Example:

```text
Sales Performance

Overview
Customers
Products
Salespeople
Pipeline
Margin
```

Page tabs should be clean and lightweight.

---

# 34. SECTIONS

Pages can contain sections.

Example:

```text
EXECUTIVE SUMMARY

CUSTOMER PERFORMANCE

PRODUCT PERFORMANCE

RISKS
```

Sections improve visual hierarchy without surrounding everything with heavy boxes.

---

# 35. VISUAL DESIGN

Atlas Analytics must look like part of Atlas, but more refined.

Avoid:

- rainbow charts
- chunky Power BI-style visual boxes
- excessive shadows
- coloured backgrounds everywhere
- dashboard walls filled with tiny tiles
- gauge charts everywhere
- unnecessary icons
- gigantic headings
- childish status colours

Use:

- generous spacing
- sophisticated typography
- restrained borders
- consistent number formatting
- quiet neutral backgrounds
- strong hierarchy
- purposeful colour

---

# 36. CARD DESIGN

Cards should generally use:

```text
12–16px radius
subtle border
minimal shadow
```

But not every dashboard element requires a card.

Allow borderless visualisations inside grouped dashboard sections.

This prevents the UI looking like:

```text
BOX
BOX
BOX
BOX
BOX
```

---

# 37. KPI CARD

Example:

```text
NET SALES

£4.28m

▲ 8.4%
vs previous period

Target £4.50m
95.1%
```

Optional small sparkline beneath.

Clicking the KPI opens context.

---

# 38. KPI CONFIGURATION

KPI supports:

```text
Primary measure
Comparison
Target
Trend
Conditional status
Sparkline
Formatting
Click action
```

---

# 39. TARGETS

Targets may originate from:

```text
budget
forecast
sales target
production target
manual target
planning target
```

Never require users to encode target values inside the dashboard itself.

---

# 40. STATUS KPI

Example:

```text
ORDERS AT RISK
17

▲ 5 since yesterday
```

Click:

```text
See 17 orders
```

This immediately opens the underlying Atlas order list.

---

# 41. CHART TYPES

Support intentionally useful charts.

Core:

```text
Line
Area
Column
Bar
Stacked Column
Stacked Bar
Combination
Scatter
Bubble
Donut
Waterfall
Funnel
Histogram
Heatmap
Treemap
```

Operational:

```text
Timeline
Gantt
Capacity
Calendar heatmap
Progress
Variance
Target
```

Advanced:

```text
Pareto
Box plot
Sankey
Cohort
Contribution
Waterfall bridge
```

Avoid implementing obscure charts solely to claim feature parity.

---

# 42. TABLE VISUAL

Tables are extremely important in ERP.

Support:

```text
sorting
grouping
filtering
subtotal
grand total
conditional formatting
sparklines
mini-bars
frozen columns
column resizing
column reorder
column hide/show
```

---

# 43. MATRIX / PIVOT

Create powerful pivot visual.

Dimensions can be dragged into:

```text
ROWS
COLUMNS
VALUES
FILTERS
```

Example:

```text
                 JAN       FEB       MAR
North           £240k     £270k     £290k
South           £180k     £190k     £220k
```

Allow:

```text
expand
collapse
subtotal
percentage
variance
comparison
```

---

# 44. RECORD LIST

This is an important Atlas-specific widget.

Instead of aggregated analytics:

```text
LATE ORDERS

Order      Customer       Due        Value
SO-8821    ABC Ltd        Today       £24k
SO-8827    Jones Ltd      Today       £18k
```

Rows are live Atlas records.

Click opens the order.

This bridges dashboards and operations.

---

# 45. ACTION WIDGET

Allow certain dashboard widgets to contain permitted actions.

Example:

```text
ORDERS REQUIRING CREDIT RELEASE
12

[Review orders]
```

Or:

```text
PRODUCTION SHORTAGES
7

[Open planner workbench]
```

Dashboards become operational workspaces.

This follows the useful Dynamics principle that workspaces should support understanding and then enable navigation or lightweight action.

---

# 46. GLOBAL FILTER BAR

Every dashboard may have global filters.

Example:

```text
Period ▾    Company ▾    Site ▾    Product ▾    Customer ▾
```

Filters stay at the top.

Do not hide them in menus where viewers cannot see current context.

---

# 47. FILTER TYPES

Support:

```text
Date
Date range
Relative date
Text
Number
Boolean
Single select
Multi-select
Hierarchy
Entity selector
Measure parameter
Dimension parameter
```

---

# 48. RELATIVE DATE FILTER

Examples:

```text
Today
Yesterday
This week
Last week
This month
Last month
This quarter
This year
Last 7 days
Last 30 days
Last 12 months
Custom
```

---

# 49. FILTER HIERARCHIES

Example:

```text
Company
↓
Site
↓
Warehouse
↓
Location
```

Selecting:

```text
Company A
```

should limit site options to Company A.

---

# 50. FILTER SCOPE

Filters may target:

```text
Dashboard
Page
Section
Widget
```

Default:

```text
Dashboard
```

---

# 51. FILTER BINDING

A filter should bind to semantic dimensions.

Example:

```text
Filter:
Customer
```

Bindings:

```text
Sales.Customer
Finance.Customer
CRM.Customer
Receivables.Customer
```

Builder should not manually map each database column unless necessary.

---

# 52. CROSS-FILTERING

Click:

```text
North Region
```

on one chart.

Other charts immediately filter to:

```text
Region = North
```

Display active filter as:

```text
Region: North ×
```

Looker and Metabase both demonstrate useful cross-filter patterns.

---

# 53. TEMPORARY FILTER STATE

Viewer changes must not alter the shared dashboard.

Users may choose:

```text
Save as my view
```

Example:

```text
Michael – Doncaster Sales
```

---

# 54. SAVED VIEWS

A dashboard can therefore have:

```text
Original Dashboard
```

plus personal views:

```text
My default
North only
Key accounts
This month
```

---

# 55. SHARE FILTERED VIEW

Generate a shareable internal link containing the current filter state.

Opening it displays:

```text
same dashboard
+
same permitted filters
```

The underlying dashboard is unchanged.

Looker similarly supports sharing filtered dashboard state via the dashboard URL.

---

# 56. PARAMETERS

Parameters change analysis rather than simply filtering records.

Example:

```text
View by:

○ Revenue
● Margin
○ Quantity
```

Or:

```text
Break down by:

○ Customer
● Product
○ Region
```

SAP uses comparable measure and dimension input controls.

Atlas should make these much simpler to configure.

---

# 57. CLICK INTERACTION

Every analytical visual can define:

```text
CLICK ACTION
```

Possible actions:

```text
Drill
Cross-filter
Open records
Open Atlas page
Open another dashboard
Open URL
Do nothing
```

---

# 58. SMART DRILL

Default click menu:

```text
Revenue: £482,100
Customer: ABC Ltd
Month: September

Explore

See transactions
Break down by Product
Break down by Salesperson
View customer
Filter dashboard to ABC Ltd
Open Sales dashboard
```

This should be generated contextually.

---

# 59. DRILL DOWN

Hierarchy example:

```text
Year
↓
Quarter
↓
Month
↓
Week
↓
Day
```

Or:

```text
Product Family
↓
Product Group
↓
Product
↓
Variant
```

---

# 60. DRILL THROUGH

Example:

Dashboard says:

```text
LATE ORDERS
24
```

Click:

```text
See orders
```

Atlas opens:

```text
Sales Orders
```

automatically filtered to those 24 records.

No separate report has to be created.

---

# 61. EXPLORE MODE

Every widget should have:

```text
Explore
```

This opens a larger temporary analysis workspace.

Example:

```text
SALES BY CUSTOMER
```

Viewer can temporarily:

```text
add Product
change Date
group by Region
switch measure
change chart
sort
filter
```

without modifying the dashboard.

---

# 62. SAVE FROM EXPLORE

If user has permission:

```text
Save as...

New dashboard widget
New Data View
Personal analysis
```

This creates a natural analytical workflow.

---

# 63. COMPARISON MODE

Any KPI or compatible chart can enable:

```text
Compare
```

Examples:

```text
vs previous period
vs last year
vs budget
vs forecast
vs target
```

Automatically calculate:

```text
absolute difference
percentage difference
```

---

# 64. EXCEPTION MODE

Atlas should be particularly strong at exception analytics.

Examples:

```text
Customers down >20%
Products below target
Orders at risk
Stock below safety level
Production behind schedule
Supplier deliveries late
Margin below threshold
Overdue debt
```

Users should be able to build exception dashboards without complicated formulas.

---

# 65. CONDITIONAL FORMATTING

Example:

```text
Margin < 10%
→ highlight subtly

OTIF < 85%
→ warning

OTIF < 70%
→ critical
```

Formatting rules may use:

```text
absolute value
percentage
target comparison
another measure
```

---

# 66. DASHBOARD OWNERSHIP

Every dashboard has:

```text
Owner
Team
Status
Created
Modified
Last viewed
```

---

# 67. DASHBOARD VISIBILITY

Possible visibility:

```text
PRIVATE
SELECTED USERS
TEAM
DEPARTMENT
ROLE
COMPANY
```

---

# 68. SHARING

Share dialogue:

```text
Share "Manufacturing Performance"

People or teams

[ Production Team        Editor ]
[ Finance Team           Viewer ]
[ Daniel                 Viewer ]

Company access:
Off

Allow viewers to export:
Yes

Allow viewers to create personal copies:
Yes
```

SAP and NetSuite both support sharing analytical content to selected users or user groups/roles.

---

# 69. IMPORTANT SECURITY RULE

Sharing a dashboard must never grant access to data that the recipient could not otherwise see.

Example:

Dashboard owner can see:

```text
All companies
```

Viewer has permission for:

```text
Company A only
```

When viewer opens dashboard:

```text
Company A only
```

The query engine enforces this.

Dashboard access and data access are separate concerns.

---

# 70. TEAM SPACES

Analytics should have spaces.

Example:

```text
Finance
Sales
Manufacturing
Customer Service
Board
Operations
```

Each contains:

```text
Dashboards
Data Views
Metrics
Reports
```

---

# 71. COMPANY DASHBOARDS

Certified corporate dashboards can be:

```text
Published
```

They appear prominently.

Examples:

```text
Executive Overview
Sales Performance
Manufacturing Performance
Finance Overview
Operations
```

Only authorised publishers can modify them.

---

# 72. PERSONAL COPY

A user can take a company dashboard:

```text
Create personal copy
```

Their changes do not affect the corporate version.

Acumatica has a comparable user-copy concept for dashboards where personalisation is allowed.

---

# 73. DASHBOARD PUBLISHING

Never have dashboard edits instantly change the version everybody sees.

Lifecycle:

```text
DRAFT
↓
REVIEW
↓
PUBLISHED
↓
SUPERSEDED
↓
ARCHIVED
```

---

# 74. VERSION HISTORY

Store:

```text
Dashboard v18
Published 3 October
Michael
```

History:

```text
v17
v16
v15
```

Allow:

```text
Compare
Restore
Duplicate
```

---

# 75. COMMENTS

Allow comments at:

```text
dashboard
page
widget
```

Example:

> September margin is down because of the raw material increase.

Mention:

```text
@Donna
```

Do not let comments obscure the dashboard.

Use a contextual discussion side panel.

SAP Analytics Cloud similarly provides comments and collaboration within analytical stories.

---

# 76. SUBSCRIPTIONS

Users can subscribe to a dashboard.

Example:

```text
Sales Performance

Send:
Every Monday

At:
08:00

Filters:
Site = Doncaster
Period = Previous Week

Format:
Dashboard link
PDF
Excel attachment
```

Metabase similarly supports scheduled dashboard subscriptions and XLSX/CSV attachments.

---

# 77. CONDITIONAL SUBSCRIPTIONS

Better:

```text
Only send if:
OTIF < 90%
```

or:

```text
Only send if:
Overdue debt > £100,000
```

This prevents pointless dashboard emails.

---

# 78. ALERTS

Create alerts from virtually any metric.

Example:

```text
Alert me when:

Inventory value
>
£5m
```

or:

```text
Production schedule attainment
<
90%
```

Alert channels can initially include:

```text
Atlas notification
email
```

with integration extensibility later.

---

# 79. SMART ALERT CONTEXT

Do not simply say:

> Margin alert triggered.

Say:

```text
Gross Margin fell to 18.2%

Threshold:
20%

Previous period:
21.4%

Largest contributors:
Product A -£31k
Product C -£18k

[Investigate]
```

---

# 80. EXCEL INTEGRATION

Excel needs to be a first-class output.

Not an afterthought.

Provide four distinct experiences.

---

# 81. OPTION 1: EXPORT VISUAL

From any widget:

```text
Download
→ Excel
```

Exports exactly the data currently represented by the visual.

---

# 82. OPTION 2: EXPORT UNDERLYING DATA

Example:

KPI:

```text
Sales £4.2m
```

Choose:

```text
Export underlying records
```

Atlas produces:

```text
SalesDetail.xlsx
```

containing the permitted contributing transactions.

---

# 83. OPTION 3: DASHBOARD WORKBOOK

Choose:

```text
Export dashboard to Excel
```

Generate:

```text
Dashboard.xlsx

Summary
Sales
Customers
Products
Underlying Data
Filters
Definitions
```

The Filters sheet records:

```text
Period: September 2026
Site: All
Company: Atlas Manufacturing Ltd
Exported: 3 October 2026
Exported by: Michael
```

Acumatica similarly includes parameters separately when exporting Generic Inquiry data to Excel.

---

# 84. OPTION 4: CONNECTED EXCEL

Advanced option:

```text
Open in Excel
```

Generate a connected workbook referencing an authorised Atlas analytical endpoint.

The workbook can:

```text
Refresh
```

to retrieve updated data.

The connection retains:

```text
Data View
Filters
Measures
Dimensions
```

Never embed database credentials.

Use secured Atlas authentication/query tokens.

---

# 85. EXCEL SHOULD NOT BECOME THE MASTER

Connected Excel is analytical.

It must not silently write changes back into Atlas.

Any write-back functionality must be implemented as an explicit controlled import/process.

---

# 86. EXPORT SECURITY

Every export request must re-run access control.

Store audit:

```text
user
dashboard
dataset
filter
record count
format
timestamp
```

Sensitive exports may require additional permission.

Example:

```text
analytics.export.financial_detail
```

---

# 87. LARGE EXPORTS

Do not block HTTP requests producing millions of rows.

Create:

```text
export_job
```

States:

```text
QUEUED
RUNNING
COMPLETE
FAILED
EXPIRED
```

Provide notification when complete.

---

# 88. DASHBOARD LIBRARY

Home screen:

```text
Analytics

Search dashboards...

FOR YOU

Executive Overview
Manufacturing Today
Sales Performance

RECENT

...

FAVOURITES

...

YOUR TEAMS

Finance
Operations
Sales
```

---

# 89. SEARCH

Search:

```text
margin
```

Return:

```text
Dashboards
Metrics
Reports
Data Views
```

Example:

```text
Gross Margin ✓
Customer Margin Dashboard
Product Margin Report
Margin by Salesperson
```

---

# 90. DATA CATALOGUE

Create a searchable catalogue.

User searches:

```text
OTIF
```

Atlas displays:

```text
OTIF ✓

Certified metric

Owner:
Operations

Definition:
Orders delivered on time and in full...

Used in:
6 dashboards

Source:
Delivery performance
```

This makes analytics discoverable.

---

# 91. DATA LINEAGE

Advanced users can choose:

```text
View lineage
```

Example:

```text
OTIF
↓
Delivery Performance View
↓
Delivery
Sales Order
Delivery Line
```

This is useful for debugging and governance.

---

# 92. VISUAL LINEAGE

Represent lineage as a clean diagram rather than raw SQL.

```text
SALES ORDER
      │
      ▼
DELIVERY
      │
      ▼
OTIF DATA VIEW
      │
      ▼
OTIF METRIC
      │
      ├── Operations Dashboard
      └── Executive Dashboard
```

---

# 93. DATA FRESHNESS

Every widget should know its freshness.

Possible:

```text
Live
Updated 2 minutes ago
Updated today at 06:00
```

Do not display this constantly unless relevant.

Tooltip:

```text
Data updated 38 seconds ago
```

---

# 94. HYBRID QUERY ARCHITECTURE

Atlas needs both operational and analytical reporting.

Do not force every dashboard through exactly the same storage path.

Use:

```text
QUERY ROUTER
```

Possible sources:

```text
Operational read model
Materialised aggregate
Analytics store
Cached result
```

---

# 95. LIVE OPERATIONAL ANALYTICS

Examples:

```text
Orders waiting today
Machine status
Stock availability
Credit holds
Production shortages
```

These require near-real-time data.

Use controlled operational read models.

---

# 96. HISTORICAL ANALYTICS

Examples:

```text
Five-year revenue trends
Three-year customer profitability
Millions of inventory transactions
Long-term production efficiency
```

These should eventually use an optimised analytical store.

Do not run massive historical aggregation across primary OLTP tables on every dashboard refresh.

---

# 97. INITIAL TECHNICAL APPROACH

Atlas can begin with:

```text
Primary transactional database
+
read replica
+
analytical read models
+
materialised aggregates
+
query cache
```

As volume grows:

```text
CDC / event pipeline
↓
Column-oriented analytics store
```

The semantic API remains unchanged.

Therefore dashboards do not care where data physically comes from.

---

# 98. QUERY REQUEST MODEL

Widget should issue semantic request such as:

```json
{
  "subject": "sales",
  "measures": ["net_revenue", "gross_margin"],
  "dimensions": ["customer"],
  "filters": [
    {
      "dimension": "date",
      "operator": "this_month"
    }
  ],
  "sort": [
    {
      "field": "net_revenue",
      "direction": "desc"
    }
  ],
  "limit": 20
}
```

Not arbitrary browser-generated SQL.

---

# 99. QUERY COMPILER

Pipeline:

```text
Dashboard Widget
↓
Semantic Query
↓
Security Injection
↓
Relationship Resolution
↓
Metric Compilation
↓
Source Selection
↓
Query Generation
↓
Execution
↓
Result
```

---

# 100. SECURITY INJECTION

Before executing:

```text
Requested filters
+
user security filters
+
company security
+
row security
+
field security
```

become one query.

The client must never be trusted to apply security filtering.

---

# 101. CACHE

Cache key must include:

```text
semantic query
user security context
company
currency
timezone
permission version
data version/freshness
```

Never return another user's broader cached result.

---

# 102. QUERY COST CONTROL

Before executing expensive requests estimate:

```text
rows scanned
join complexity
group cardinality
historical range
```

If extremely expensive:

```text
Use aggregate
Run asynchronously
Ask for narrower scope
```

---

# 103. PERFORMANCE TARGETS

Aim for:

```text
KPI:
<1 second cached
<2 seconds normal

Dashboard:
meaningful content visible <2 seconds

Typical visual:
<3 seconds

Drill-through:
<2 seconds
```

Never make the entire dashboard wait for one slow card.

Widgets load independently.

---

# 104. SKELETON LOADING

On open:

```text
Dashboard shell
→ KPI placeholders
→ fast widgets
→ slower widgets
```

Avoid full-screen spinner.

---

# 105. PARTIAL FAILURE

If one visual fails:

```text
11 widgets work
1 shows error
```

Do not fail the entire dashboard.

Error:

> Customer Margin could not load.

Actions:

```text
Retry
Details
```

---

# 106. MULTI-COMPANY

Dashboard filters support:

```text
Legal Entity
Company
Group
```

Metrics can optionally consolidate.

Finance measures must respect:

```text
company currency
group currency
transaction currency
```

---

# 107. CURRENCY

Every financial metric declares:

```text
currency behaviour
```

Possible:

```text
transaction
company
reporting
constant currency
```

Do not simply add GBP, EUR and USD values.

---

# 108. NUMBER FORMATTING

Formats are centrally managed.

Examples:

```text
£1.28m
£128.4k
18.4%
4,281
12.8 tonnes
```

Allow override but provide smart defaults.

---

# 109. DASHBOARD THEMING

Company may define an Analytics theme.

Properties:

```text
Typography
Canvas
Primary accent
Positive
Warning
Critical
Chart palette
Border
Radius
```

Dashboard creators should generally use theme tokens.

Avoid manually choosing arbitrary colours for every chart.

---

# 110. AUTOMATIC COLOUR CONSISTENCY

If:

```text
Region North
```

is blue on one chart, Atlas should retain that semantic colour on other charts where useful.

Likewise:

```text
Actual
Budget
Forecast
```

should use consistent visual conventions.

---

# 111. ACCESSIBILITY

Charts must support:

```text
accessible labels
keyboard navigation
high contrast
non-colour status indicators
screen reader summaries
```

Colour must never be the only way information is communicated.

---

# 112. PRINT / PRESENTATION MODE

Create:

```text
Presentation
```

Removes:

```text
navigation
editing controls
builder chrome
```

and gives a clean executive display.

Useful for management meetings.

---

# 113. FULL-SCREEN DISPLAY MODE

Allow dashboards on wall displays.

Optional:

```text
Auto refresh every 5 minutes
Rotate pages
```

Appropriate for:

```text
factory
warehouse
sales office
control room
```

---

# 114. DASHBOARD TEMPLATES

Provide professional templates.

Examples:

```text
Executive
Operational
Performance
Financial
Exception
Trend Analysis
Management Review
```

Templates provide layout rather than fixed data.

---

# 115. MODULE-SPECIFIC DASHBOARD STARTERS

Atlas should ship with high-quality defaults.

## Sales

```text
Revenue
Margin
Orders
ASP
Customers
Revenue trend
Customer performance
Product performance
Salesperson performance
Orders at risk
```

## CRM

```text
Pipeline
Opportunity value
Win rate
Conversion
Activity
Forecast
Sales stage ageing
```

## Finance

```text
Revenue
Gross margin
EBITDA
Cash
Receivables
Payables
Overdue debt
P&L variance
Working capital
```

## Inventory

```text
Inventory value
Availability
Stock turns
Days cover
Slow moving
Excess
Shortage
Stock by site
```

## Manufacturing

```text
Output
Schedule attainment
WIP
Scrap
OEE
Capacity
Cost variance
Downtime
Material shortages
Orders at risk
```

## Procurement

```text
Spend
PO value
Supplier OTIF
Late POs
Price variance
Lead time
Supplier quality
```

## Logistics

```text
Deliveries
OTIF
Late deliveries
Transport cost
Cost per delivery
Vehicle utilisation
```

## Customer Service

```text
Cases
Response time
Resolution time
CSAT
Open cases
Ageing
Customer issues
```

---

# 116. EXECUTIVE DASHBOARD

Atlas should ship with a particularly strong company overview.

Example:

```text
BUSINESS PERFORMANCE

Revenue            £14.2m       +8.2%
Gross Margin       24.8%        -0.6pt
Order Intake       £16.1m       +11%
Cash               £3.8m
OTIF                91.4%
Inventory           £6.2m
WIP                 £1.4m

SALES TREND

MARGIN

ORDER INTAKE

OPERATING EXCEPTIONS

7 production orders at risk
£188k overdue debt
4 critical supplier delays
OTIF below target at Site 2
```

The dashboard should tell a story.

Not simply show twenty unrelated charts.

---

# 117. DASHBOARD NARRATIVE

Builder may add:

```text
Section title
Text
Commentary
Insight
```

Example:

> Revenue remains above plan, although margin softened during September due primarily to Material Group A.

Manual or generated.

---

# 118. ATLAS INSIGHT WIDGET

Optional advanced widget:

```text
KEY CHANGES

Revenue increased 8.2%.

73% of growth came from three customers.

Gross margin decreased 0.6 points.

Product Family C accounted for most of the margin decline.
```

This can be automatically generated from governed metrics.

---

# 119. AI ANALYTICS ASSISTANT

Once the semantic foundation exists, introduce:

# Ask Atlas

Example:

> Show me sales this month against last month by customer.

Atlas converts this into a semantic query.

Display:

```text
Sales
Current month vs previous month
Grouped by Customer
```

before executing.

---

# 120. CREATE DASHBOARD USING LANGUAGE

Example:

> Build me a manufacturing dashboard showing output, schedule attainment, scrap, WIP and downtime for the last 12 weeks.

Atlas can generate a first draft dashboard.

The user can then visually edit it.

---

# 121. AI MUST USE THE SEMANTIC LAYER

Do not allow the AI to invent arbitrary SQL against production tables.

Flow:

```text
Natural language
↓
Semantic interpretation
↓
Known metrics
↓
Known dimensions
↓
Validated query
```

This keeps answers consistent.

---

# 122. AI EXPLANATION

User:

> Why has margin dropped?

Atlas may analyse:

```text
Product mix
Customer mix
selling price
material cost
discount
volume
```

and provide a traceable explanation.

Every numerical statement should link to supporting data.

---

# 123. AI TRANSPARENCY

Show:

```text
Based on:

Gross Margin ✓
Net Revenue ✓
COGS ✓

Period:
September vs August

Filters:
All companies
```

Never produce unexplained numbers.

---

# 124. ANOMALY DETECTION

Future capability:

Automatically detect:

```text
unusual sales change
margin anomaly
inventory spike
supplier decline
scrap spike
unexpected cost
```

Acumatica is already incorporating anomaly detection into its analytics offering, so this is an appropriate direction for a modern ERP analytics platform.

---

# 125. DASHBOARD DATA MODEL

Core tables:

```text
analytics_subject

analytics_entity
analytics_field
analytics_relationship

analytics_dimension
analytics_hierarchy

analytics_measure
analytics_metric

analytics_data_view
analytics_data_view_field
analytics_data_view_filter
analytics_data_view_relationship

dashboard
dashboard_version
dashboard_page
dashboard_section

dashboard_widget
dashboard_widget_query
dashboard_widget_style
dashboard_widget_interaction

dashboard_filter
dashboard_filter_binding

dashboard_access
dashboard_owner
dashboard_favourite

dashboard_personal_view

analytics_comment

analytics_subscription
analytics_alert

analytics_export_job

analytics_query_log

analytics_lineage_edge

analytics_cache_entry
```

---

# 126. DASHBOARD ENTITY

Suggested:

```text
dashboard

id
name
description

owner_user_id
owner_team_id

visibility

status

current_published_version_id

default_date_dimension

theme_id

allow_export
allow_personal_copy
allow_subscription

created_at
created_by

updated_at
updated_by
```

---

# 127. DASHBOARD VERSION

```text
dashboard_version

id
dashboard_id

version_number

status

definition_json

created_by
created_at

published_by
published_at

change_note
```

The entire visual definition can be stored in structured JSON while ownership and security remain relational.

---

# 128. WIDGET DEFINITION

Example:

```text
dashboard_widget

id
page_id

widget_type

title
subtitle

x
y
width
height

data_view_id

query_definition

visual_definition

interaction_definition
```

---

# 129. FILTER DEFINITION

```text
dashboard_filter

id

dashboard_id

name

semantic_dimension_id

type

default_value

allow_multiple

required

scope
```

---

# 130. FILTER BINDINGS

```text
dashboard_filter_binding

filter_id

widget_id

target_dimension_id
```

Usually auto-generated through canonical dimensions.

---

# 131. ACCESS MODEL

```text
dashboard_access

dashboard_id

principal_type

USER
TEAM
ROLE
DEPARTMENT
COMPANY

principal_id

access_level

VIEW
COMMENT
EDIT
MANAGE
```

---

# 132. METRIC GOVERNANCE

Metric:

```text
analytics_metric

id

code
name
description

subject_id

formula

format

owner_department

certification_status

effective_from
effective_to

created_by
approved_by
```

---

# 133. API ARCHITECTURE

Examples:

```text
GET /api/analytics/catalogue

GET /api/analytics/subjects

GET /api/analytics/metrics

POST /api/analytics/query

POST /api/analytics/explain-query

POST /api/analytics/data-views

GET /api/dashboards

POST /api/dashboards

POST /api/dashboards/{id}/versions

POST /api/dashboards/{id}/publish

POST /api/dashboards/{id}/share

POST /api/dashboards/{id}/subscribe

POST /api/analytics/exports
```

---

# 134. QUERY ENDPOINT

Use:

```text
POST /api/analytics/query
```

Never expose:

```text
POST /run-sql
```

to ordinary dashboard builders.

---

# 135. QUERY RESULT

Return:

```text
columns

rows

totals

metadata

formatting

lineage

freshness

query_id

execution_time
```

---

# 136. QUERY METADATA

Include:

```text
Metric definitions

Currency

Timezone

Date range

Active filters

Data freshness

Security scope
```

This becomes particularly important for exports.

---

# 137. AUDIT

Audit:

```text
Dashboard created
Dashboard edited
Dashboard published
Dashboard shared
Dashboard exported
Metric changed
Dataset changed
Permission changed
```

Large/sensitive data exports must be especially visible.

---

# 138. OBSERVABILITY

Administrators need an Analytics Performance screen.

Show:

```text
Queries today

Median query time

Slow queries

Most expensive dashboards

Cache hit rate

Failed queries

Largest exports

Most viewed dashboards

Unused dashboards
```

---

# 139. QUERY DIAGNOSTICS

For administrators:

```text
Dashboard:
Production Performance

Widget:
Output by Product

Query time:
8.4 sec

Reason:
Large historical scan

Suggested optimisation:
Materialise weekly production aggregate
```

---

# 140. DO NOT MAKE DASHBOARD CREATORS DATABASE ADMINISTRATORS

Normal users must never need to know:

```text
schema
index
foreign key
join syntax
SQL
database type
```

Atlas handles this.

---

# 141. CUSTOM FIELDS

When users add custom fields to Atlas modules, eligible fields should automatically become available to analytics.

Example:

```text
Customer.custom_market_segment
```

becomes:

```text
Market Segment
```

in the Customer dimension.

Subject to security.

---

# 142. EXTERNAL DATA

Architecture should allow later connection of:

```text
CSV
Excel
API
SQL source
data warehouse
third-party application
```

However, external data must be brought into a governed Atlas Data Source.

Do not allow random browser dashboards to execute unrestricted queries against external databases.

---

# 143. DATA SOURCE ADMINISTRATION

External source records:

```text
analytics_source

type
connection
authentication
refresh_policy
owner
status
```

Credential values must be stored securely outside normal application rows where appropriate.

---

# 144. INGESTION

External data may be:

```text
LIVE
CACHED
IMPORTED
SCHEDULED
```

Provide freshness indication.

---

# 145. DASHBOARD DATA FROM MULTIPLE MODULES

A single Atlas dashboard must be able to show:

```text
Sales Revenue
Inventory Value
Production Output
Purchase Spend
Cash
OTIF
```

without creating a monstrous single dataset.

Each widget may use an appropriate Data View.

Canonical dimensions coordinate filters between them.

This is preferable to requiring everything to be joined into one enormous model.

---

# 146. OPERATIONAL ACTIONABILITY

The fundamental Atlas difference should be:

# Every number has somewhere to go.

Example:

```text
OVERDUE DEBT
£188,400
```

click:

```text
View invoices
```

then:

```text
Customer
Invoice
Due date
Amount
Owner
```

From there the user can enter the normal Finance workflow.

---

# 147. ANOTHER EXAMPLE

Dashboard:

```text
PRODUCTION ORDERS AT RISK
8
```

Click:

```text
8 orders
```

shows:

```text
MO       Product    Cause             Impact
882      SP1        Material shortage 2 days
893      RM4        Capacity           1 day
```

Select MO-882.

Open production order.

This creates a genuine analytical operating system.

---

# 148. DASHBOARDS SHOULD UNDERSTAND CONTEXT

If dashboard is opened from:

```text
Customer ABC
```

Atlas may pass:

```text
Customer = ABC
```

as contextual filter.

If opened from:

```text
Product SP1
```

same dashboard can automatically contextualise to:

```text
Product = SP1
```

This allows analytics to be embedded throughout Atlas.

---

# 149. EMBEDDED MINI-ANALYTICS

Core ERP pages can include small analytics.

Customer:

```text
12-month revenue
Margin
Open orders
Overdue debt
```

Product:

```text
Sales trend
Stock
Forecast
Production
Margin
```

Supplier:

```text
Spend
OTIF
Quality
Lead time
```

These should use the same analytics engine.

Do not build separate chart logic inside each module.

---

# 150. REPORT BUILDER

Dashboards and reports are related but different.

Dashboard:

```text
interactive
visual
screen-oriented
```

Report:

```text
structured
print/export-oriented
repeatable
```

Both use the same semantic layer.

---

# 151. REPORT DESIGNER

Allow:

```text
Header

Title

Filters

Table

Grouped sections

Totals

Charts

Footer

Page numbers
```

Common outputs:

```text
PDF
Excel
CSV
```

---

# 152. SCHEDULED REPORT

Example:

```text
Weekly Sales Report

Monday
07:00

Recipients:
Sales Management

Period:
Previous Week

Excel:
Attached
```

---

# 153. DATA QUALITY

Metrics can optionally expose quality flags.

Example:

```text
Revenue ✓

Data quality:
Complete

Last refresh:
17:22
```

Or:

```text
Supplier OTIF

Warning:
12 receipts missing confirmed dates
```

Do not pretend imperfect data is perfect.

---

# 154. EMPTY STATES

Good dashboard design includes useful empty states.

Instead of:

```text
NO DATA
```

Show:

> There were no quality failures during this period.

That can be positive information.

---

# 155. ZERO VS MISSING

Analytics must distinguish:

```text
0
```

from:

```text
NULL
```

and:

```text
not applicable
```

They mean different things.

---

# 156. PERSONALISATION

Viewer may choose:

```text
Default period
Preferred currency
Favourite dashboards
Default team space
Default company
```

without changing corporate dashboard configuration.

---

# 157. COMMAND PALETTE

Dashboard Studio should support:

```text
⌘K
```

Search:

```text
Add revenue chart
Add customer filter
Insert table
Change theme
Publish
```

Power users become very fast.

---

# 158. KEYBOARD SUPPORT

Support:

```text
Copy
Paste
Duplicate
Delete
Undo
Redo
Align
Move
Resize
```

Dashboard construction should feel like a professional design application.

---

# 159. UNDO / REDO

Every builder action should support undo.

Do not make users frightened of moving dashboard objects.

---

# 160. AUTO-SAVE

Save drafts continuously.

Show quietly:

```text
Saved
```

Do not require a Save button for every layout change.

Publishing remains explicit.

---

# 161. DUPLICATE WIDGET

Allow:

```text
Duplicate
```

Then change:

```text
Revenue
```

to:

```text
Margin
```

This makes dashboard construction fast.

---

# 162. COPY BETWEEN DASHBOARDS

Widgets may be copied to another dashboard.

Reuse:

```text
query
visual
formatting
```

subject to Data View permissions.

---

# 163. REUSABLE COMPONENTS

Advanced:

Save visual as:

```text
Reusable widget
```

Example:

```text
Corporate Sales KPI
```

If centrally updated, optionally update linked instances.

---

# 164. DASHBOARD QUALITY CHECK

Before publishing:

```text
Dashboard Check
```

Atlas analyses:

```text
Broken metrics
Missing filter mappings
Slow widgets
Duplicate metrics
Poor chart choices
Permission conflicts
Mobile layout
Missing titles
```

Output:

```text
Ready to publish
```

or:

```text
3 issues
```

---

# 165. PUBLISH PREVIEW

Preview as:

```text
Desktop
Tablet
Mobile
```

Also:

```text
View as role...
```

Admin can test:

```text
Salesperson
Finance Manager
Production Planner
```

without changing their actual account.

---

# 166. DATA PERMISSION PREVIEW

Example:

```text
View dashboard as:
Salesperson
```

Atlas shows what that role would be able to see.

This is extremely useful for dashboard governance.

---

# 167. DASHBOARD DISCOVERY

Show popularity carefully.

Examples:

```text
Frequently used by Operations
Recently published
Recommended for your role
```

Do not turn corporate analytics into social media.

---

# 168. ARCHIVING

Dashboards should not live forever.

Track:

```text
last viewed
views 90 days
owner active
```

Admin can identify:

```text
Unused dashboard
```

and archive it.

---

# 169. DUPLICATE DETECTION

If somebody creates:

```text
Sales Performance 2
```

Atlas may suggest:

> A company Sales Performance dashboard already exists. Would you like to use or copy it?

Reduces analytics sprawl.

---

# 170. IMPLEMENTATION ARCHITECTURE

Recommended logical services:

```text
AnalyticsCatalogueService

SemanticModelService

MetricService

DataViewService

AnalyticsQueryService

DashboardService

DashboardSharingService

AnalyticsExportService

AnalyticsSubscriptionService

AnalyticsAlertService

AnalyticsCacheService

AnalyticsLineageService
```

These may remain modules within Atlas initially.

Do not create unnecessary distributed microservices.

---

# 171. IMPLEMENTATION PHASE 1

Build semantic foundation.

Create:

```text
Subjects
Entities
Fields
Relationships
Dimensions
Measures
Metrics
Security integration
Semantic query API
```

Initially cover:

```text
Sales
Customers
Products
Inventory
```

Do not begin with fancy dashboards.

---

# 172. IMPLEMENTATION PHASE 2

Build query engine.

Implement:

```text
aggregation
grouping
sorting
filters
time filters
security
pagination
totals
```

Then:

```text
comparison periods
calculated measures
```

---

# 173. IMPLEMENTATION PHASE 3

Build Data Views.

Include:

```text
creation
preview
save
share
permissions
calculated fields
```

---

# 174. IMPLEMENTATION PHASE 4

Build Dashboard Viewer.

Implement:

```text
KPI
Line
Bar
Column
Table
Pivot
Global filters
Drill-through
Cross-filter
```

Ensure performance and interaction are excellent before adding dozens of chart types.

---

# 175. IMPLEMENTATION PHASE 5

Build Dashboard Studio.

Implement:

```text
drag/drop
resize
grid
properties
copy
paste
undo
redo
auto-save
preview
publish
```

---

# 176. IMPLEMENTATION PHASE 6

Build collaboration.

```text
sharing
teams
company publishing
versions
comments
personal views
favourites
```

---

# 177. IMPLEMENTATION PHASE 7

Build Excel/export.

```text
Visual export
Underlying data
Dashboard workbook
CSV
PDF
Connected Excel
```

---

# 178. IMPLEMENTATION PHASE 8

Add:

```text
Subscriptions
Alerts
Conditional alerts
Scheduled reports
```

---

# 179. IMPLEMENTATION PHASE 9

Expand semantic models across:

```text
Finance
Procurement
Manufacturing
Planning
Logistics
CRM
Quality
Maintenance
Customer Service
```

---

# 180. IMPLEMENTATION PHASE 10

Add advanced analytics:

```text
AI dashboard generation
Ask Atlas
anomaly detection
insight generation
forecasting
scenario analysis
```

Only once the deterministic semantic model is trusted.

---

# 181. TEST: SECURITY

User A can access:

```text
Company A + B
```

User B:

```text
Company B only
```

User A shares dashboard.

When B views it:

```text
only Company B data
```

must be returned.

---

# 182. TEST: CROSS FILTER

Dashboard contains:

```text
Revenue by Region
Margin by Product
Top Customers
```

Click:

```text
North
```

All compatible visuals update to North.

Clear filter.

All return to original state.

---

# 183. TEST: MULTIPLE DATA VIEWS

Dashboard uses:

```text
Sales Data View
Inventory Data View
Production Data View
```

Global:

```text
Site = Doncaster
```

must correctly filter all three using canonical Site.

---

# 184. TEST: DRILL THROUGH

KPI:

```text
Late Orders = 17
```

Click:

```text
See orders
```

Atlas opens exactly 17 permitted Sales Order records.

---

# 185. TEST: METRIC CONSISTENCY

Certified Revenue metric is used on:

```text
Executive Dashboard
Sales Dashboard
Finance Dashboard
```

All must use identical metric definition.

---

# 186. TEST: EXCEL EXPORT

Dashboard filtered to:

```text
September
Site A
Product Family X
```

Excel export must contain exactly that scope.

Include filter metadata.

---

# 187. TEST: RELATIONSHIP FANOUT

Combine:

```text
Sales Order Line
+
multiple shipment lines
```

Revenue must not duplicate.

---

# 188. TEST: DASHBOARD VERSIONING

Published:

```text
v7
```

Editor modifies draft:

```text
v8
```

Normal users must continue seeing:

```text
v7
```

until v8 is published.

---

# 189. TEST: PARTIAL FAILURE

12 widgets.

One query fails.

11 still load normally.

Dashboard remains usable.

---

# 190. TEST: LARGE DASHBOARD

Dashboard:

```text
20 widgets
```

Ensure:

```text
parallel loading
caching
priority loading
no N+1 query behaviour
```

---

# 191. NON-NEGOTIABLE RULES FOR CODEX

Do not:

- build dashboards directly against database table names
- expose SQL to standard users
- redefine common KPIs on every dashboard
- trust browser-side security filters
- create unrestricted joins
- ignore dataset grain
- duplicate measures because of joins
- make one slow widget block an entire dashboard
- hard-code currencies
- hard-code financial calendars
- let shared dashboards bypass data permissions
- overwrite published dashboards while editing
- make Excel export an afterthought
- make users create multiple dashboards merely to change filters
- require an external BI product for normal ERP reporting
- create 50 chart types before basic drill-through works properly
- use arbitrary colour everywhere
- turn every visual into a boxed tile
- hide the business transaction behind the analytics
- let AI-generated SQL become trusted business logic

---

# 192. ATLAS ANALYTICS UX PRINCIPLE

Every dashboard should answer three questions:

```text
WHAT IS HAPPENING?
```

then:

```text
WHY IS IT HAPPENING?
```

then:

```text
WHAT NEEDS ATTENTION?
```

and finally:

```text
TAKE ME THERE.
```

---

# 193. EXAMPLE EXPERIENCE

Managing Director opens:

# Business Performance

Sees:

```text
Revenue             £4.28m   +8.4%

Margin               23.1%   -1.2pt

Order Intake         £4.71m  +11%

OTIF                  84.9%   -3.1pt

Inventory            £6.2m   +£400k

WIP                  £1.3m
```

Underneath:

```text
ATTENTION

OTIF below target
17 orders at risk

Inventory increased £400k
£180k is slow moving

Margin declined 1.2 points
72% driven by Product Family C
```

Click:

```text
17 orders at risk
```

Atlas displays those 17 orders.

Click one.

Open order.

Click:

```text
Why at risk?
```

Atlas shows:

```text
Production order MO-820
↓
Material RM-220 short
↓
PO-882 expected 6 October
↓
Required 4 October
```

That is what makes Atlas analytics materially better than a normal BI dashboard.

The analytics does not stop at the graph.

It connects directly to the business.

---

# 194. FINAL PRODUCT MODEL

```text
                    ATLAS ERP
                       │
        ┌──────────────┼──────────────┐
        │              │              │
       SALES       MANUFACTURING    FINANCE
        │              │              │
        └──────────────┼──────────────┘
                       │
                       ▼
               SEMANTIC LAYER
                       │
          ┌────────────┼─────────────┐
          │            │             │
      METRICS      DIMENSIONS     DATA VIEWS
          │            │             │
          └────────────┼─────────────┘
                       │
                       ▼
                  QUERY ENGINE
                       │
      ┌────────────────┼────────────────┐
      │                │                │
      ▼                ▼                ▼
 DASHBOARDS          EXPLORE          REPORTS
      │                │                │
      ├────────────┬───┴─────┬──────────┤
      │            │         │          │
      ▼            ▼         ▼          ▼
    ALERTS        EXCEL    SHARING    SCHEDULES
      │
      ▼
   ACTION
      │
      ▼
 ACTUAL ATLAS BUSINESS RECORD
```

---

# 195. DEFINITION OF SUCCESS

Atlas Analytics succeeds when a user can think:

> I want to know sales by customer compared with last year.

and within seconds produce it.

Then think:

> Show me only Yorkshire.

and filter it.

Then:

> Break it down by product.

and click once.

Then:

> Why is ABC down?

and investigate.

Then:

> Show me the actual orders.

and reach the transactions.

Then:

> I want this every Monday.

and subscribe.

Then:

> Finance needs this.

and share it.

Then:

> I need to work with the detail.

and send it cleanly into Excel.

All without:

```text
SQL
DAX
Power Query
database relationships
IT tickets
developer intervention
```

for normal business use.

That is the target.

Atlas Analytics should feel less like using a BI product and more like simply asking the ERP increasingly detailed questions.