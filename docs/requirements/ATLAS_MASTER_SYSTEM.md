COPY PROMPT FROM HERE
ATLAS ERP/MRP MASTER SYSTEM BIBLE
COMPLETE PRODUCT, DOMAIN, DATA, WORKFLOW, UX AND ENGINEERING SPECIFICATION
You are working directly inside the existing Atlas ERP/MRP codebase.
Atlas is no longer an early prototype.
It is intended to become a serious business operating platform capable of running sales, customer relationships, purchasing, inventory, manufacturing, material planning, production scheduling, quality, logistics, finance, customer service and management planning inside one coherent system.
The existing Atlas application already contains substantial functionality.
The challenge is no longer simply adding functionality.
The challenge is creating coherence.
The objective of this programme is therefore:
Turn Atlas from a collection of feature-rich applications into one exceptionally well-connected ERP/MRP operating system.
Atlas must be capable of managing substantial business complexity while remaining significantly easier to operate than traditional ERP software.
The primary design principle is:
COMPLEXITY MUST LIVE IN THE ENGINE, NOT IN THE USER JOURNEY
Atlas may internally contain:
- multi-level BOM calculations
- material requirements planning
- supplier lead times
- production calendars
- machine capacity
- labour capacity
- finite scheduling
- product costing
- inventory valuation
- reservations
- pegging
- supply allocation
- tax rules
- credit exposure
- warehouse rules
- approval policies
- financial posting
- quality restrictions
- multiple companies
- multiple sites
- multiple warehouses
- different currencies
- thousands of transactions
That does not mean a normal user should be required to understand all of those concepts.
The system must turn complexity into understandable decisions.
For example, a salesperson should not be shown:
Projected Available Balance: -3,450
Coverage Code: Period 7
Planning Fence: 14
Explosion Level: 3
Resource Load: 113.4%

They should see:
Customer requested:
5,000 units by 18 October

Atlas can currently supply:
1,500 units on 18 October
3,500 units on 20 October

Recommended promise:
5,000 units on 20 October

Reason:
Additional production is required.

Risk:
Low

[Accept 20 October]
[Offer split delivery]
[View supply details]

The planner can click deeper and see the detailed reasoning.
The salesperson should not need to.
That philosophy applies throughout Atlas.
1. YOUR ROLE
Operate as a combined:
Principal ERP architect.
Manufacturing systems architect.
MRP specialist.
Supply chain specialist.
Production planning specialist.
Financial systems architect.
Warehouse specialist.
Procurement architect.
Quality systems architect.
CRM architect.
Customer service systems architect.
Enterprise UX designer.
Product designer.
Database architect.
Staff-level full-stack engineer.
Security architect.
Integration architect.
Data architect.
Technical programme lead.
You must think about Atlas as a whole.
Never improve one module in a way that damages the consistency of the wider system.
2. DO NOT BEGIN WITH A REWRITE
Atlas already exists.
Before making significant changes, inspect the actual repository.
Understand what is working.
Understand what is weak.
Understand what is duplicated.
Understand what is missing.
Understand what has been implemented differently in separate modules.
Do not assume that a feature is absent simply because you cannot immediately see it.
Do not recreate functionality that already exists.
Do not build parallel implementations.
Do not create:
newInventory
inventoryV2
betterInventory
finalInventory
unless there is a temporary, documented migration reason.
The end state must always converge towards one canonical implementation.
3. CREATE THE ATLAS SYSTEM MAP
Inspect and document:
Frontend architecture.
Backend architecture.
Database technology.
Schemas.
Tables.
Migrations.
APIs.
Application services.
Domain services.
Background jobs.
Queues.
Schedulers.
Caching.
Authentication.
Authorisation.
Roles.
Permissions.
Audit infrastructure.
Documents.
Imports.
Exports.
Integrations.
Notifications.
Tasks.
Approvals.
Activity feeds.
Reporting.
Dashboards.
Design system.
Routing.
Error handling.
Logging.
Testing.
Deployment assumptions.
Then inspect every existing Atlas business area.
For every area record:
What database entities currently exist?
Which domain appears to own them?
Which APIs operate on them?
Which screens operate on them?
What statuses exist?
What workflows exist?
What calculations exist?
What other modules depend on them?
Where are relationships represented properly?
Where are relationships represented only through copied values or text?
Where is logic duplicated?
Where is business logic incorrectly placed inside UI components?
Where are permissions enforced only visually?
Where is historical information mutable when it should not be?
Where does the user need to perform unnecessary manual steps?
Where is configuration mixed with operational work?
Where are screens overloaded?
Where are multiple concepts using the same terminology?
Where are identical concepts using different terminology?
Create and maintain:
docs/atlas-system-map.md
docs/atlas-domain-map.md
docs/atlas-business-processes.md
docs/atlas-data-ownership.md
docs/atlas-architecture-decisions.md
docs/atlas-integration-map.md
docs/atlas-unification-roadmap.md
docs/atlas-known-technical-debt.md
Do not simply create these files and stop.
Use them to drive the actual refactoring.
4. THE ATLAS OPERATING MODEL
Atlas should model the real flow of a business.
The core commercial and operational spine is:
CUSTOMER / MARKET DEMAND
→ OPPORTUNITY
→ COMMERCIAL PROJECT
→ QUOTATION
→ CUSTOMER COMMITMENT
→ SALES ORDER
→ DEMAND
→ AVAILABILITY
→ ATP / CTP
→ MATERIAL PLANNING
→ MAKE / BUY / TRANSFER DECISION
→ PROCUREMENT / MANUFACTURING / INTERNAL TRANSFER
→ QUALITY
→ INVENTORY
→ WAREHOUSE
→ FULFILMENT
→ TRANSPORT
→ DELIVERY
→ INVOICE
→ CASH
→ CUSTOMER SERVICE
→ RETURN / CREDIT / CORRECTIVE ACTION
Every major operational record should fit somewhere into this chain.
Modules are not independent worlds.
They are perspectives on the same business.
5. THE ATLAS BUSINESS GRAPH
Build Atlas conceptually around a Business Graph.
This does not require a graph database.
It means records maintain proper explicit relationships.
Every significant record should be able to answer three questions.
What caused me?
Example:
Why does Manufacturing Order MO-482 exist?
Atlas should know:
SO-1842 requires 5,000 units.
Only 1,500 were available.
3,500 additional units were required.
MRP created Planned Manufacturing Order PMO-381.
Planner Jane Smith firmed PMO-381.
That created MO-482.
What am I causing?
Example:
What does PO-882 support?
Atlas should know:
PO-882 supplies RM-14.
RM-14 is required by MO-482.
MO-482 supports SO-1842.
SO-1842 belongs to ABC Construction.
What else affects me?
Example:
Why is SO-1842 at risk?
Atlas should know:
PO-882 became late.
That caused RM-14 shortage.
That delayed MO-482.
That moved finished stock availability.
That affected the customer promise.
The user should not reconstruct these relationships manually.
6. UNIVERSAL RELATIONSHIP PANEL
Create a reusable relationship component available on major records.
Sections:
Upstream
Records that caused this record.
Downstream
Records created from this record.
Related
Other relevant objects.
Example for Sales Order:
Upstream:
Opportunity.
Sales Project.
Quotation.
Contract.
Downstream:
Demand.
Reservation.
Planned supply.
Manufacturing orders.
Purchase supply.
Warehouse release.
Shipment.
Invoice.
Credit.
Related:
Customer.
Customer PO.
Tickets.
Complaints.
Documents.
Tasks.
Emails.
The user should move through related business records directly.
They should not be forced back into the application menu.
7. CANONICAL DATA PRINCIPLE
Atlas must have one authoritative business entity for each real business concept.
There is one customer.
There is one supplier.
There is one product.
There is one sales order.
There is one purchase order.
There is one manufacturing order.
There is one shipment.
There is one invoice.
Applications reference these records.
Applications should not create copies simply because they require their own screen.
Copy data only where a historical snapshot is genuinely necessary.
Examples:
Invoice address at time of posting.
Tax rate at time of invoice.
Price agreed on an order.
Historical product description printed on a legal document.
These snapshots must be deliberate.
8. DATA OWNERSHIP
Every core data type needs an owner.
Example:
Customer domain owns:
customer identity
account code
commercial account status
contacts
addresses
customer grouping
basic commercial configuration
Finance owns:
credit assessment
credit limit
financial balance
payment behaviour
AR exposure
Sales references those finance outputs.
Sales does not independently calculate customer debt.
Inventory owns:
physical stock truth
stock states
inventory transactions
reservations
Sales consumes availability.
Manufacturing consumes availability.
Planning consumes availability.
Logistics consumes availability.
They must not maintain separate stock totals.
9. MODULAR MONOLITH FIRST
Atlas should currently favour a well-structured modular monolith.
Do not split the application into dozens of microservices simply because it sounds enterprise.
Microservices introduce:
network failures
distributed transactions
duplicate models
eventual consistency
deployment complexity
observability complexity
version management
development overhead
AI coding confusion
Atlas should instead use:
strong domain boundaries
explicit service interfaces
clear data ownership
internal events
transactional boundaries
a reliable outbox where required
Modules can later be extracted if there is a genuine scaling or organisational reason.
Do not build complexity years before Atlas requires it.
10. DOMAIN BOUNDARIES
Likely primary Atlas domains include:
Identity.
Organisation.
Customer.
CRM.
Sales.
Product.
Inventory.
Planning.
Manufacturing.
Procurement.
Approvals.
Quality.
Warehouse.
Logistics.
Finance.
Customer Service.
Projects.
Marketing.
Plan.
HR.
Health & Safety.
Reporting.
Platform Services.
Each domain should expose intentional services.
Avoid arbitrary cross-domain SQL or ORM access.
11. SHARED PLATFORM SERVICES
Some concepts belong to the platform rather than one business domain.
Build or consolidate shared services for:
Documents.
Comments.
Activity timeline.
Audit.
Tasks.
Approvals.
Notifications.
Global search.
Saved views.
Imports.
Exports.
Attachments.
Workflow transitions.
Background jobs.
Integration logging.
Permissions.
Feature flags.
Do not create a different attachment implementation in Sales, Quality, Projects and Customer Service.
12. ATLAS UX PRINCIPLE
The UI must answer:
What is happening?
Does anything need attention?
What can I do next?
Why has Atlas reached this conclusion?
Do not make users interpret raw system state unnecessarily.
13. ONE DESIGN LANGUAGE
All Atlas applications must share:
record headers
buttons
forms
tables
filters
drawers
dialogs
status indicators
notifications
empty states
loading states
error states
search
activity
documents
timelines
command palette
saved views
bulk actions
pagination
Atlas must look and behave like one system.
14. ROLE-BASED NAVIGATION
Do not show every module equally to every user.
A sales user might primarily see:
Home.
CRM.
Customers.
Sales.
Products.
Tasks.
A planner might see:
Home.
Planning.
Manufacturing.
Inventory.
Supply.
Products.
A buyer might see:
Home.
Procurement.
Suppliers.
Planning Actions.
Approvals.
Inventory.
A finance user might see:
Home.
Finance.
Customers.
Suppliers.
Approvals.
Expenses.
A warehouse worker might see:
Warehouse.
Receipts.
Picks.
Packing.
Transfers.
Counts.
A customer service user might see:
Customers.
Orders.
Tickets.
Complaints.
Returns.
Role navigation reduces noise.
Permissions still determine actual security.
15. ATLAS HOME
Do not make Atlas Home an icon launcher.
Home should be operational.
It should answer:
What requires my attention today?
Suggested areas:
My Work.
Exceptions.
Today's workload.
Recent records.
Role KPIs.
Quick actions.
Example planner home:
Critical shortages: 6.
Orders at risk: 4.
Late supply: 8.
Capacity conflicts: 2.
Recommendations awaiting review: 12.
Example buyer home:
Purchase requests awaiting action: 5.
POs overdue: 9.
Supplier acknowledgements missing: 4.
Price variances: 3.
MRP purchase actions: 14.
16. MY WORK
Create a unified My Work system.
Do not confuse four different concepts.
Task
Work assigned to someone.
Approval
A decision requiring authority.
Exception
A system-detected problem.
Notification
Information for awareness.
They may be displayed together.
They must remain semantically different.
My Work should support:
priority
due date
record context
owner
team
type
severity
status
source
Users should act directly from the queue when possible.
17. GLOBAL SEARCH
Global search should become a major Atlas capability.
Search across authorised records:
customers
contacts
suppliers
products
quotes
orders
customer PO numbers
manufacturing orders
purchase orders
shipments
invoices
tickets
projects
lot numbers
serial numbers
documents
Search should support partial matches and exact business references.
Results should be grouped intelligently.
Searching:
ABC 881
could return:
Customer:
ABC Construction Ltd
Order:
SO-8812
Customer PO:
ABC/881
Invoice:
INV-1881
Product:
ABC881
Permissions must be enforced in search results.
18. COMMAND PALETTE
Provide a global command palette.
For example:
Cmd/Ctrl + K.
Commands:
New quote.
New order.
New purchase request.
New ticket.
New transfer.
Search customer.
Open planner.
Open dashboard.
Record complaint.
Go to product.
Experienced users should be able to operate Atlas quickly.
19. STANDARD RECORD PAGE
Every major business record should follow the same structural grammar.
Header
Record identifier.
Record title.
Status.
Key contextual information.
Primary action.
Secondary actions.
More menu.
Example:
SO-1842
ABC Construction Ltd

CONFIRMED

Requested: 18 Oct
Promise: 20 Oct
Value: £42,680
Risk: Material shortage

[View Fulfilment] [Edit] [...]

Do not show fifteen equally prominent buttons.
20. RECORD SUMMARY
Immediately show a summary strip containing only critical information.
For a manufacturing order:
Product.
Quantity.
Progress.
Scheduled finish.
Material readiness.
Demand source.
Cost variance.
Status.
For a PO:
Supplier.
Value.
Expected date.
Receipt progress.
Approval state.
Late status.
21. RECORD TABS
Use tabs or sections.
Do not create enormous pages.
Common tabs might include:
Overview.
Lines.
Supply.
Operations.
Fulfilment.
Finance.
Quality.
Activity.
Documents.
Related.
History.
Only show relevant tabs.
22. CONTEXT DRAWERS
Users often need more detail without leaving the record.
Build reusable side drawers.
Example:
A user clicks:
3,500 short
Open a Supply drawer.
Do not immediately navigate away.
Drawer:
Required: 5,000
Available: 1,500
Short: 3,500

Planned Supply
MO-482
3,500
Due 19 Oct

Blocking issue
RM-14 shortage

[Open Supply Lens]

23. PROGRESSIVE DISCLOSURE
Hide configuration until it is needed.
Example Product page default:
Product code.
Name.
Category.
Capabilities.
Price.
Stock.
Primary supplier.
Manufacturing status.
Advanced Planning contains:
Safety stock.
Planning fence.
Order modifiers.
Coverage parameters.
Advanced Manufacturing contains:
Yield.
Scrap.
Routing policy.
Alternate resources.
Advanced Finance contains:
Valuation.
Posting rules.
Accounts.
This allows Atlas to remain sophisticated without overwhelming users.
24. TABLES ARE A CORE ERP EXPERIENCE
Enterprise users spend enormous amounts of time in tables.
Build excellent tables.
Support where appropriate:
resizable columns
reorderable columns
pinning
sorting
filters
saved views
grouping
search
bulk actions
quick edit
keyboard navigation
drill-through
export
virtualisation
Column sets should have good defaults.
Do not display every available field by default.
25. FORMS
Forms should avoid unnecessary data entry.
Use:
smart defaults
typeahead search
conditional fields
sections
templates
inline validation
clear errors
existing business context
If Customer ABC always uses GBP and 30-day terms, new sales orders should not repeatedly ask for those values.
Show them.
Allow authorised override.
26. STATUS MACHINES
Important business records require defined lifecycle state machines.
Do not allow unrestricted status dropdown editing.
Example Sales Order:
Draft.
Pending Approval.
Confirmed.
Allocated.
In Fulfilment.
Partially Shipped.
Shipped.
Closed.
Cancelled.
Transitions execute logic.
Example:
Confirm Sales Order may:
validate customer
validate credit
validate pricing
capture promise
create demand
publish event
record audit
A user cannot simply change the status text to Confirmed.
27. TRANSITION SERVICE
A transition should define:
source state
destination state
permission
validation
approval requirement
side effects
event
audit behaviour
reason requirement
Use reusable infrastructure without creating an over-engineered BPM product.
28. ORGANISATION MODEL
Atlas should support the possibility of:
multiple legal entities
multiple business units
multiple sites
multiple plants
multiple warehouses
multiple departments
multiple currencies
multiple tax registrations
Do not assume every deployment requires these.
Do not design the database in a way that makes them impossible.
29. CUSTOMER MASTER
Customer master must be comprehensive.
Potential data:
Account code.
Legal name.
Trading name.
Company registration.
Tax/VAT registration.
Website.
Industry.
Customer group.
Account manager.
Status.
Currency.
Price list.
Payment terms.
Credit policy.
Credit limit.
Incoterm.
Delivery preference.
Invoice method.
Communication preference.
Marketing consent.
Tax treatment.
Default warehouse.
Default ship-from site.
Contacts.
Billing addresses.
Delivery addresses.
Project/site addresses.
Documents.
External identifiers.
Do not show everything on one page.
30. CUSTOMER 360
Customer 360 should feel like the entire customer relationship is visible from one place.
Header example:
ABC Construction Ltd

ACTIVE
Credit: OK

Open Orders: £82,000
Outstanding AR: £31,000
Orders at Risk: 1

[New Quote]
[New Order]
[New Ticket]

Overview:
Primary contact.
Account manager.
Customer since.
Latest order.
Latest interaction.
Commercial:
Opportunities.
Sales projects.
Quotes.
Orders.
Products purchased.
Revenue history.
Operations:
Open deliveries.
Backorders.
Delayed orders.
Returns.
Finance, permission controlled:
Balance.
Overdue.
Credit limit.
Available credit.
Invoices.
Credits.
Payments.
Service:
Open tickets.
Complaints.
CSAT.
Returns.
Activity:
Emails.
Calls.
Notes.
Tasks.
System events.
The user should not have to visit five applications to understand a customer.
31. CONTACT MODEL
Contacts may have roles.
Example:
Buyer.
Accounts Payable.
Technical.
Site Manager.
Director.
Goods In.
Invoice Contact.
Allow multiple contacts per customer and supplier.
Do not overload one "main contact" field.
32. CRM PURPOSE
CRM manages commercial potential before a confirmed sale.
It should help answer:
Who could buy?
What do they need?
What is the opportunity worth?
What stage is it at?
Who is responsible?
What happens next?
When might it close?
What commercial project is involved?
Do not turn CRM into compulsory data administration.
33. CRM WORKSPACE
Salesperson should see:
My opportunities.
Follow-ups due.
Stalled opportunities.
New leads.
Pipeline.
Expected revenue.
Opportunities without next action.
Recently active customers.
Do not begin with charts that look attractive but do not help someone work.
34. OPPORTUNITY
Opportunity should include:
Customer/prospect.
Contacts.
Description.
Products/interests.
Potential value.
Probability.
Expected close.
Stage.
Owner.
Competitors.
Next action.
Activity.
Quotes.
Sales project.
Documents.
Lost reason.
Won conversion.
Stage changes should be recorded historically.
35. SALES PROJECTS
Commercial Sales Projects must remain separate from internal Project Management.
A large construction project might involve:
end client
consultant
architect
contractor
merchant
distributor
site location
several quotes
several quote revisions
samples
technical submissions
competitor products
multiple eventual orders
multiple call-offs
Sales Project should hold this commercial ecosystem.
It should be visible in CRM and Sales.
It should not automatically create an internal project.
36. SALES PROJECT 360
Show:
Project name.
Location.
Expected value.
Stage.
Probability.
Expected dates.
Owner.
Stakeholders.
Customers.
Contractors.
Consultants.
Products.
Samples.
Quotes.
Quote revisions.
Orders won.
Remaining potential.
Activity.
Documents.
Technical specifications.
37. QUOTATIONS
Quotation creation should be fast.
Select customer.
Atlas brings:
currency
price list
tax
terms
incoterm
default addresses
account manager
Add products.
Atlas resolves:
price
discount rules
availability indicator
lead time
margin, permission controlled
Support:
quote expiry
revision
notes
terms
attachments
approval
sending
acceptance
rejection
conversion
38. QUOTE REVISION
Never overwrite historical commercial proposals.
Example:
Q-1042 Rev 1.
Q-1042 Rev 2.
Q-1042 Rev 3.
One current revision.
Older revisions remain available.
Order conversion references the accepted revision.
39. PRICING ENGINE
Pricing should support:
base price
price list
customer-specific price
contract price
quantity break
promotion
discount
manual override
currency
effective dates
minimum margin rule
The system must explain the resolved price.
Example:
Base price: £18.00
Customer agreement: £16.50
Quantity adjustment: -£0.50
Final price: £16.00

Avoid users wondering where a price came from.
40. DISCOUNT CONTROL
Discount thresholds can trigger approval.
Example:
Up to 5%:
salesperson authorised.
5% to 10%:
sales manager.
Over 10%:
commercial director.
The user should see:
Discount requested: 12%
Your authority: 5%

Approval required:
Commercial Director

[Request Approval]

41. SALES ORDER ENTRY
Default flow should be simple.
Customer.
Customer PO.
Delivery address.
Requested date.
Products.
Quantities.
Price.
Availability.
Confirm.
Atlas should populate known defaults automatically.
42. SALES ORDER LINE
Each line should show useful commercial and fulfilment information.
Example:
SP1/100
100mm Clay Pipe

Qty: 5,000
Price: £14.20
Net: £71,000

Requested: 18 Oct
Promise: 20 Oct

Supply:
1,500 available
3,500 planned

Status: SUPPLY PLANNED

Click Supply to open Supply Lens.
43. CUSTOMER PO
Customer PO must be:
structured
searchable
reportable
visible on customer account
available for invoice
available for delivery paperwork
available to Customer Service
Do not treat it as free-text notes.
44. ORDER NOTES
Distinguish:
Internal note.
Warehouse instruction.
Delivery instruction.
Invoice note.
Customer-facing note.
Technical note.
Do not use one giant Notes field for everything.
45. CALL-OFF ORDERS
Support call-offs/releases against a parent agreement.
Parent:
10,000 units agreed.
Released:
5,500.
Delivered:
4,000.
Remaining available:
4,500.
Support:
agreement period
price conditions
customer reference
maximum quantity
remaining quantity
release history
delivery schedules
Do not represent call-offs as unrelated orders.
46. CREDIT CHECK
Order confirmation should evaluate credit policy.
Potential inputs:
credit limit
outstanding AR
open uninvoiced orders
overdue debt
current order value
customer hold
insurance limit where applicable
configured tolerance
Example:
Credit Limit: £100,000
Current Exposure: £83,000
New Order: £28,000
Projected Exposure: £111,000

£11,000 over limit.

Approval required.

Do not return:
ERROR: credit check failed.
47. SALES ORDER 360
A sales order should become one of the strongest connected screens in Atlas.
Header:
Order.
Customer.
Customer PO.
Value.
Requested date.
Promise.
Fulfilment.
Credit state.
Risk.
Tabs:
Overview.
Lines.
Supply.
Fulfilment.
Shipments.
Finance.
Customer Service.
Documents.
Activity.
Related.
The user should understand the entire order lifecycle.
48. PRODUCT MASTER
Product/item master is foundational.
A product may participate in:
Sales.
Purchasing.
Inventory.
Manufacturing.
Quality.
Planning.
Logistics.
Finance.
Use one canonical item.
49. PRODUCT CAPABILITIES
Do not use an overly simplistic product type field.
Use independent capabilities.
Possible capabilities:
Saleable.
Purchasable.
Manufacturable.
Inventory tracked.
Lot controlled.
Serial controlled.
Subcontracted.
Consumable.
Service.
Asset.
Expense.
Raw material.
Intermediate.
Finished good.
Packaging.
Spare part.
Maintenance item.
Non-saleable.
One product may have multiple capabilities.
50. PRODUCT DATA
Product may include:
Item code.
Description.
Long description.
Category.
Brand.
Status.
Lifecycle state.
Base UOM.
Sales UOM.
Purchase UOM.
Manufacturing UOM.
Conversions.
Weight.
Dimensions.
Volume.
Commodity code.
Country of origin.
Barcode.
Storage requirements.
Shelf life.
Dangerous goods attributes.
Primary supplier.
Primary warehouse.
Planning policy.
Make/buy policy.
Cost method.
Tax category.
Documents.
Images.
Technical specifications.
51. PRODUCT 360
Header:
SP1/100
100mm Clay Pipe

Manufactured
Active

Available: 8,420
Reserved: 4,200
Incoming 30d: 6,000
Demand 30d: 12,100
First shortage: 17 Oct

Standard Cost: £8.42
Average Sale Price: £15.80

Tabs:
Overview.
Availability.
Supply.
Planning.
Manufacturing.
Purchasing.
Sales.
Quality.
Cost.
Documents.
History.
52. INVENTORY PRINCIPLE
Inventory must not be a mutable number sitting on the product.
Use an inventory transaction ledger.
Every physical movement is represented by a transaction.
Examples:
Supplier receipt.
Customer shipment.
Internal transfer.
Manufacturing issue.
Manufacturing output.
Customer return.
Supplier return.
Adjustment.
Scrap.
Rework.
Quality movement.
53. INVENTORY TRANSACTION
Store as appropriate:
transaction ID
product
variant
quantity
UOM
company
site
warehouse
from location
to location
lot
serial
inventory status
source document type
source document ID
source line
transaction date
posting date
user/process
cost
currency where applicable
reason
Do not silently rewrite posted stock history.
54. INVENTORY STATES
Clearly separate:
On Hand
Physically present.
Reserved
Allocated to demand.
Available
Usable stock not reserved.
Quality Hold
Physically present but unavailable pending quality.
Blocked
Explicitly prohibited.
In Transit
Moving between locations/sites.
Expected
Future supply.
Expected is not stock.
55. RESERVATIONS
Reservation is not the same as physical movement.
Reservations should reference:
demand
product
warehouse
quantity
lot where required
priority
reservation date
state
Allow policies:
soft allocation
hard reservation
lot-specific reservation
warehouse-specific reservation
56. STOCK AVAILABILITY
Never expose one mysterious "Available" number without context.
Availability should be explainable.
For example:
On Hand       10,000
Quality Hold   1,000
Blocked          500
Usable          8,500
Reserved        4,000
Available       4,500

57. SUPPLY LENS
Supply Lens should become one of Atlas's defining features.
It is a universal way to understand:
what exists
what is committed
what is coming
what is required
when shortages occur
what causes those shortages
what can be done about them
Accessible from:
Product.
Sales Order.
Sales Order line.
Planning.
Manufacturing.
Purchase Order.
Inventory.
Logistics.
Customer Service.
58. SUPPLY LENS HEADER
Example:
SP1/100
Warehouse: Crow Edge

On Hand: 8,420
Reserved: 4,200
Available: 4,220

Incoming: 6,000
Demand: 7,900

Projected: 2,320

First shortage:
None within 30 days

or:
First shortage:
17 October

Short quantity:
1,280

59. SUPPLY TIMELINE
Show time-phased balance.
Example:
TODAY
Available: 4,220

10 Oct
SO-1812
Demand -2,000
Balance 2,220

12 Oct
PO-482
Supply +4,000
Balance 6,220

14 Oct
SO-1842
Demand -5,000
Balance 1,220

17 Oct
MO-921 Component Requirement
Demand -2,500

Balance -1,280

SHORTAGE

Users can understand the story visually.
60. PEGGING
Planning must maintain relationships between demand and supply.
Demand can be pegged to:
stock
purchase order
manufacturing order
transfer
planned supply
Example:
SO-1842
Demand: 5,000

Covered by:

Existing Stock      1,500
MO-482               3,500

Reverse view:
MO-482 Output: 5,000

Supports:

SO-1842              3,500
SO-1860              1,000
Safety Stock           500

This should be visible.
61. DEMAND MODEL
Not all demand is equal.
Demand sources may include:
confirmed sales orders
call-offs
forecast
master production schedule
dependent component demand
internal transfer demand
safety stock
service/spare requirements
approved project demand
Demand should store:
product
quantity
required date
source
source line
site
warehouse
priority
firmness
customer context
status
62. DEMAND PRIORITY
Priority must be configurable.
Example:
Critical service requirement.
Priority customer commitment.
Confirmed sales order.
Production component requirement.
Safety stock.
Forecast.
Do not hardcode one global hierarchy.
63. FORECASTING
Forecasts should be separate from actual sales orders.
Support:
manual forecast
imported forecast
statistical forecast later
sales forecast
customer forecast
product family forecast
Forecast should have:
version
period
quantity
confidence/context
owner
approval status
Forecast consumption should prevent double-counting actual orders plus forecast where appropriate.
64. MASTER PRODUCTION SCHEDULE
MPS can define expected finished product supply requirements independently from individual sales demand.
Support where relevant:
product
site
period
planned quantity
firm zone
forecast linkage
actual demand comparison
MPS feeds planning.
It should not automatically create production without planning logic.
65. MRP PURPOSE
MRP answers:
What do we need?
How much?
When?
What supply already exists?
What is missing?
Should missing supply be:
made
bought
transferred
MRP proposes action.
It does not blindly execute everything.
66. MRP INPUTS
Demand:
Sales orders.
Forecast.
MPS.
Component demand.
Safety stock.
Transfers.
Approved internal requirements.
Supply:
Usable inventory.
Purchase orders.
Manufacturing orders.
Transfers.
Firm planned orders where policy allows.
Planning attributes:
Make/buy policy.
BOM.
Lead time.
MOQ.
Order multiple.
Supplier.
Warehouse.
Production site.
Calendar.
Safety stock.
Planning horizon.
Planning fence.
67. NETTING
At each relevant date:
Start with projected supply.
Subtract demand.
Add scheduled receipts.
Respect usable inventory.
Respect reservations.
Respect safety stock policy.
Determine shortage.
Generate supply recommendation.
Calculations must be deterministic and testable.
68. BOM EXPLOSION
Manufactured demand must create dependent demand.
Example:
Product A requires:
2 × Component B.
3 kg × Raw Material C.
Demand for Product A:
1,000.
Dependent demand:
2,000 Component B.
3,000 kg Raw Material C.
If Component B is itself manufactured, explode its BOM.
Support:
multi-level BOM
phantom BOM
effective dates
revision
scrap factor
yield
co-products
by-products
alternate components where supported
subcontract components
69. LEAD-TIME OFFSETTING
MRP needs proper timing.
Consider:
supplier lead time
purchase administration time
goods receipt processing
quality inspection time
internal transfer time
material preparation
queue
setup
operation duration
move
wait
production calendars
supplier calendars where supported
warehouse processing
shipping preparation
Atlas should determine not only what is required but when the action must begin.
70. ORDER MODIFIERS
Support:
lot-for-lot
fixed order quantity
minimum order quantity
maximum order quantity
order multiple
days-of-supply grouping
batch size
Example:
Requirement:
1,050 units.
MOQ:
500.
Multiple:
500.
Recommended quantity:
1,500.
Atlas should explain why.
71. SAFETY STOCK
Safety stock should be a planning policy, not a hidden adjustment.
Support:
fixed safety stock
minimum stock
future dynamic methods if developed
If supply dips below safety stock, Atlas can recommend replenishment.
Supply Lens should distinguish customer demand from safety stock requirement.
72. PLANNING HORIZON
Do not plan indefinitely.
Support planning horizon.
Example:
90 days.
Separate near-term actionable planning from long-range planning noise.
73. FIRMING FENCE
Near-term planned supply may require protection from constant automatic change.
Support planning time fences such as:
firm zone
slushy zone
free planning zone
Keep terminology understandable in UI.
The engine may use sophisticated policy.
The planner can see:
Locked.
Planner review required.
System may replan.
74. PLANNED ORDERS
MRP should create proposals.
Types:
Planned Manufacturing Order.
Planned Purchase Order.
Planned Transfer.
Planned orders should include:
product
quantity
required date
suggested release date
source
destination
reason
demand coverage
planning run
warnings
priority
planner
75. FIRMING
Firming converts planned supply into operational documents.
Planned Manufacturing Order:
→ Manufacturing Order.
Planned Purchase:
→ Purchase Requisition or Purchase Order according to policy.
Planned Transfer:
→ Transfer Order.
Maintain traceability to the originating planned order.
76. ACTION MESSAGES
MRP should continuously compare current supply plans with requirements.
Generate actions such as:
Create.
Advance.
Postpone.
Increase.
Decrease.
Cancel.
Expedite.
Change source.
Transfer.
Reschedule.
Review shortage.
Example:
ADVANCE PO-482

Material:
RM-100

Current Arrival:
21 Oct

Required:
17 Oct

Impact:
MO-842 cannot start.
SO-1842 becomes 4 days late.

Recommended Arrival:
16 Oct

77. PLANNING EXPLANATION
Every MRP recommendation needs a "Why?" view.
Example:
Why manufacture 4,500 units?

Demand:

SO-182     3,000
SO-194     2,500

Total      5,500

Current available stock:
1,800

Protected safety stock:
800

Usable against demand:
1,000

Net shortfall:
4,500

Recommendation:
Manufacture 4,500

Trust depends on explainability.
78. PLANNING RUN
Every MRP execution should create a run record.
Store:
run ID
start time
completion time
status
sites included
warehouses
horizon
parameters
items processed
recommendations generated
exceptions
errors
duration
initiating user/process
Planned orders and recommendations reference the planning run.
79. PLANNER WORKBENCH
The planner should not open MRP and see configuration.
They should see problems and decisions.
Header summary:
Critical shortages.
Orders at risk.
Late supply.
Production delays.
Capacity conflicts.
Planner actions awaiting review.
80. PLANNER EXCEPTION LIST
Example columns:
Severity.
Product.
Issue.
Required Date.
Current Date.
Quantity.
Customer Impact.
Cause.
Suggested Action.
Owner.
Example:
CRITICAL
SP1/100

Short 3,500
Required 18 Oct
Available 21 Oct

Customer:
ABC Construction

Order Value:
£42k

Cause:
Late RM-14

Suggested:
Expedite PO-882

81. EXCEPTION DETAIL
When planner opens exception:
Show:
Problem.
Business impact.
Root cause.
Demand affected.
Supply affected.
Alternatives.
Recommended action.
Do not show an unexplained red row.
82. ATP
Available to Promise answers:
What can we supply using current and scheduled supply?
Inputs:
current stock
reserved stock
existing confirmed purchase supply
existing manufacturing supply
transfers
known demand
Example:
Requested:
5,000 on 16 Oct.
ATP:
1,500 available 16 Oct.
3,500 available 19 Oct.
Options:
Split.
Full shipment 19 Oct.
83. CTP
Capable to Promise asks:
Can we create additional supply?
For manufactured items:
materials
routing
capacity
production calendar
lead time
For purchased items:
supplier
lead time
MOQ
supplier restrictions
For transfers:
stock elsewhere
transfer time
Return realistic dates.
84. SALES VIEW OF ATP/CTP
Sales sees:
Requested:
5,000 by 16 Oct

Recommended Promise:
5,000 by 19 Oct

Alternative:
1,500 on 16 Oct
3,500 on 19 Oct

Reason:
Additional manufacturing required.

Confidence:
High

[Accept Promise]
[Offer Split]
[View Why]

They do not need BOM explosion details.
85. PROTECTED SUPPLY
Once Atlas confirms important customer commitments, supply should be protected according to policy.
Do not allow newer demand to casually steal earlier committed supply.
If authorised user reallocates:
You are reallocating 2,000 units.

Currently allocated to:
SO-1842
ABC Construction

Current Promise:
18 Oct

New Expected:
21 Oct

Affected Order Value:
£32,000

Reason required.

86. MANUFACTURING MASTER DATA
Manufacturing should support:
BOMs.
BOM revisions.
Routings.
Routing revisions.
Operations.
Work centres.
Machines.
Labour.
Skills.
Tools.
Production calendars.
Shifts.
Setup rules.
Batch sizes.
Yield.
Scrap.
Alternative resources.
Subcontract operations.
Quality checks.
Instructions.
87. BOM SCREEN
BOM should answer:
What is this product made from?
Show:
component
quantity
UOM
scrap
operation
supply type
effectivity
substitute
issue method
Example:
SP1/100

Clay Mix A
2.1 kg
Operation 10

Packaging P12
1 each
Operation 50

88. BOM REVISION
Never overwrite historical manufacturing definitions.
Revision:
A.
B.
C.
Effective dates.
Manufacturing orders should snapshot/reference the applicable revision.
89. ROUTING
Routing describes how the product is manufactured.
Example:
10 Extrusion.
20 Drying.
30 Firing.
40 Inspection.
50 Packing.
Each operation can contain:
work centre
alternate resources
setup
run time
queue
wait
move
operators
skills
tools
instructions
quality checks
90. WORK CENTRES
Work Centre 360 should show:
name
site
resource type
capacity
calendar
current schedule
current operation
next operations
utilisation
availability
downtime
maintenance
capabilities
cost rate
performance
Do not bury work centres exclusively inside settings.
Operational users need useful live views.
91. MACHINES
Individual machines may belong to work centres.
Store where appropriate:
asset ID
capabilities
site
availability
maintenance state
calendar
production rate
cost rate
status
Do not force every business to model individual machines if work-centre level is sufficient.
92. LABOUR
Operations may require:
number of people
specific skills
labour grade
labour rate
Human capacity may become a scheduling constraint where configured.
Do not require employee-level scheduling for businesses that only need aggregated labour capacity.
93. MANUFACTURING ORDER
MO should represent the authorised requirement to manufacture a quantity of product.
Lifecycle:
Planned.
Firmed.
Scheduled.
Released.
In Progress.
Paused/Held.
Completed.
Closed.
Cancelled.
Use proper transitions.
94. MO 360
Example header:
MO-1842

SP1/100
5,000 units

IN PROGRESS

Scheduled Finish:
17 Oct

Material Readiness:
92%

Production Progress:
61%

Demand:
SO-482
SO-490

Cost Variance:
+2.4%

Tabs:
Overview.
Demand.
Materials.
Operations.
Quality.
Output.
Costs.
Documents.
Activity.
History.
95. MO DEMAND
Show why the manufacturing order exists.
Example:
MO-1842
5,000 units

Demand Coverage:

SO-482        3,500
SO-490        1,000
Safety Stock    500

This is critical for prioritisation.
96. MO MATERIALS
For every component show:
required
reserved
issued
consumed
remaining
available
short
expected receipt
Example:
Packaging P12

Required:
5,000

Reserved:
3,500

Short:
1,500

Expected:
PO-1144
1,500
Due 15 Oct

97. MO OPERATIONS
Show operation sequence.
Example:
10 Extrusion
Complete

20 Drying
Complete

30 Firing
In Progress
62%

40 Inspection
Waiting

50 Packing
Waiting

Allow click-through.
98. WORK ORDERS
Operations can create Work Orders.
State:
Ready.
Blocked.
In Progress.
Paused.
Complete.
Quality Hold.
Work Order includes:
MO
operation
resource
planned quantity
actual quantity
planned start
actual start
planned finish
actual finish
operators
machine
downtime
scrap
quality
99. SHOP FLOOR
Shop Floor must be intentionally simple.
Designed for large monitors/tablets/touch terminals where appropriate.
Operator sees:
Current machine/work centre.
Job.
Product.
Quantity.
Instructions.
Material readiness.
Quality checks.
Actions.
Example:
MO-1842

SP1/100

Target:
5,000

Completed:
3,200

Remaining:
1,800

Materials:
Ready

[START / RESUME]

[REPORT OUTPUT]
[REPORT SCRAP]
[REPORT ISSUE]
[PAUSE]
[COMPLETE]

No accounting.
No CRM.
No advanced planning settings.
100. PRODUCTION OUTPUT
Operator reports:
Good quantity.
Scrap quantity.
Rework quantity.
Reason.
Atlas updates:
work order progress
MO progress
inventory
cost
scrap
planning projections
expected completion
customer risk if relevant
Do not require downstream departments to re-enter the information.
101. MATERIAL CONSUMPTION
Support:
manual issue
scan issue
backflush
partial consumption
lot selection
serial selection
substitution
return unused material
scrap
Consumption creates inventory transactions and production cost.
102. BACKFLUSH
Where configured:
Completing production can automatically consume expected components.
Still allow variance recording.
Do not force backflush on manufacturers requiring actual scanning.
103. LOT GENEALOGY
Where lot controlled, Atlas should trace:
Supplier lot.
Receipt.
Inventory.
Manufacturing consumption.
Manufacturing batch.
Finished lot.
Customer shipment.
Customer.
Reverse trace:
A supplier lot is defective.
Atlas identifies all finished lots and customers affected.
104. WIP
Work In Progress must exist operationally and financially.
Typical value flow:
Raw Material.
Issued to Production.
WIP.
Finished Production.
Finished Goods.
Quality Hold.
Scrap/Rework.
Finance should reconcile value.
Operations should understand physical production state.
105. MANUFACTURING COSTING
Expected manufacturing cost can include:
materials
labour
machine
overhead
subcontract
expected scrap
Expected cost comes from BOM and routing.
Actual cost comes from execution.
106. COST VARIANCE
Example:
Expected Cost:
£8.20/unit

Actual Cost:
£8.68/unit

Variance:
+£0.48

Material:
+£0.14

Labour:
+£0.08

Machine:
+£0.09

Scrap:
+£0.17

Allow drill-through.
107. CAPACITY PLANNING
Capacity planning must understand:
work centre calendars
machines
shifts
maintenance
downtime
setup
run time
batch size
parallel capacity
alternative resources
labour where constrained
Show:
load
capacity
overload
under-utilisation
bottlenecks
late operations
108. DETAILED SCHEDULING
Separate:
MRP.
Capacity Planning.
Detailed Scheduling.
MRP answers what and when.
Scheduling answers exact sequence and resources.
Create visual schedule.
Time horizontally.
Resources vertically.
Operation blocks.
Allow authorised drag to reschedule.
Validate consequences.
109. SCHEDULE CHANGE IMPACT
Dragging an operation must not be cosmetic.
Atlas recalculates:
precedence
finish date
customer risk
downstream operations
resource conflict
material readiness
Example warning:
Moving Operation 30 to 19 Oct
will move MO completion to 21 Oct.

Affected:
SO-1842

Customer promise:
20 Oct

New estimated promise:
22 Oct

Continue?

110. WHAT-IF PLANNING
Allow simulation.
Examples:
Kiln unavailable Thursday.
Supplier five days late.
Demand rises 20%.
Production moved to Site B.
Priority customer inserted.
Simulation must not change live operational data.
Show impact:
orders affected
revenue at risk
capacity
stock
shortages
111. MAINTENANCE CONNECTION
Manufacturing scheduling should recognise maintenance downtime where Atlas later supports maintenance fully.
Planned maintenance reduces capacity.
Unplanned machine failure should create planning exceptions.
Do not make Manufacturing assume machines are always available.
112. PROCUREMENT PURPOSE
Procurement supports direct and indirect purchasing.
Direct:
raw materials
components
packaging
subcontract operations
resale stock
Indirect:
office supplies
services
maintenance
marketing spend
equipment
capital expenditure
software
113. PURCHASE REQUEST
Requester should have a simple experience.
What do you need?
How much?
When?
Why?
Cost centre/project?
Preferred supplier if known?
Attachment/quote?
Submit.
Requester should not need:
GL accounts
three-way match settings
supplier ledger knowledge
114. APPROVAL ROUTING
Atlas determines approval based on policy.
Example:
£250 office purchase.
No approval or line manager only.
£8,000 equipment.
Manager + department head.
£100,000 capex.
Director + Finance.
Rules may use:
amount
department
category
supplier
site
project
requester
currency
risk
115. RFQ
Buyer can send request to several suppliers.
Track:
supplier
quoted price
freight
lead time
MOQ
payment terms
quote validity
quality rating
supplier performance
Comparison should make trade-offs clear.
Do not optimise purely for price.
116. PURCHASE ORDER
PO 360 should show:
supplier
status
approval
value
currency
expected date
delivery site
buyer
payment terms
lines
receipts
invoices
quality
documents
activity
MRP demand where relevant
117. PURCHASE LINE
Show:
product/service
quantity
UOM
price
required date
confirmed date
received
remaining
quality requirement
MRP linkage
manufacturing linkage where applicable
118. SUPPLIER ACKNOWLEDGEMENT
Support supplier confirmation.
PO requested:
15 Oct.
Supplier confirmed:
17 Oct.
Atlas should update supply planning appropriately.
Do not silently change original requested date.
Keep both.
119. PO CHANGE IMPACT
If buyer changes a delivery date:
Atlas should identify affected production and customer commitments.
Example:
Moving PO-882 from 16 Oct to 20 Oct impacts:

MO-482
Start delayed 3 days

SO-1842
Promise moves 20 Oct → 23 Oct

SO-1851
No impact

Continue?

120. SUPPLIER 360
Show:
supplier identity
contacts
approved status
spend
open PO value
late POs
supplier OTIF
quality defects
average lead time
price history
contracts
documents
invoices
balance where authorised
supplier risk
121. RECEIVING
Warehouse should receive against PO.
Display outstanding lines.
Support:
full receipt
partial receipt
over receipt
under receipt
damage
quality hold
lot/serial capture
receipt documents
Receipt immediately updates:
inventory
supply
planning
PO progress
finance receipt accrual where configured
122. THREE-WAY MATCH
AP invoice matching can compare:
PO.
Receipt.
Invoice.
Tolerances can cover:
quantity.
price.
tax.
freight.
Minor differences can auto-match.
Significant differences become exception.
123. SHARED APPROVAL ENGINE
Do not build separate approval logic for:
Purchasing.
Discounts.
Credit.
Credit notes.
Expenses.
Journals.
Supplier creation.
Stock adjustment.
Capex.
Use one shared approval engine.
124. APPROVAL OBJECT
Approval request includes:
request type
record
requester
amount/context
policy used
current stage
approvers
comments
history
status
delegation
expiry/escalation
125. APPROVER EXPERIENCE
My Work:
Purchase Request PR-1842

£18,400

Requester:
Michael

Department:
Operations

Purpose:
Replacement packing equipment

Supplier:
ABC Machinery

Budget Remaining:
£42,000

[Approve]
[Reject]
[Return]
[View Detail]

Do not make approver search for the originating record manually.
126. QUALITY PRINCIPLE
Quality belongs inside operational workflows.
Quality is not merely a standalone app.
Triggers may include:
supplier receipt
production operation
production completion
warehouse movement
customer return
complaint
supplier issue
127. QUALITY PLAN
Products/processes may define required inspections.
For example:
Incoming RM-14:
Supplier certificate required.
Moisture test.
Visual inspection.
Manufacturing:
Operation 30 temperature.
Final dimension.
Pressure test.
Packaging inspection.
128. QUALITY CHECK
Support check types:
pass/fail
numeric measurement
tolerance
selection
text
photo
document
signature
barcode/serial verification
129. QUALITY HOLD
If quality fails:
Stock enters Quality Hold.
Atlas immediately updates:
available stock
Supply Lens
ATP
MRP
manufacturing readiness
affected customer risk
Do not wait for someone manually to tell Planning.
130. NON-CONFORMANCE
NC should include:
source
product
lot
quantity
issue
severity
containment
owner
evidence
disposition
affected inventory
affected production
potential customer impact
131. DISPOSITION
Possible outcomes:
Use as is.
Rework.
Scrap.
Return supplier.
Downgrade.
Conditional release.
Approval may be required.
132. RCA
Support structured Root Cause Analysis.
Potential methods:
5 Whys.
Fishbone.
Cause category.
Contributing factors.
Do not force RCA on trivial issues.
Allow policy/severity to determine depth.
133. CAPA
Corrective and Preventative Action should include:
root cause
corrective action
preventative action
owner
target
status
evidence
effectiveness review
closure approval
134. SUPPLIER QUALITY
Quality issues should feed supplier performance.
Example:
Supplier OTIF good.
Quality rejection poor.
Overall supplier score should reflect both where configured.
135. WAREHOUSE VERSUS LOGISTICS
Warehouse manages stock handling.
Logistics manages outward/inbound movement between business and external destinations.
Keep them connected but conceptually clear.
136. WAREHOUSE HOME
Show work.
Receipts awaiting.
Picks.
Packing.
Transfers.
Put-away.
Cycle counts.
Exceptions.
Blocked tasks.
Users should not begin with raw inventory tables.
137. PUT-AWAY
Receipt may create put-away task.
Atlas suggests location based on policy.
Potential rules:
product category
hazard
temperature
warehouse zone
available capacity
fixed bin
Put-away scanning validates destination.
138. PICKING
Picking task should show:
order
customer
product
quantity
source location
lot/serial
destination/staging
Scanner validates:
correct item
correct lot
correct quantity
Handle:
short pick
damaged stock
alternative location
authorised substitution
139. PICK WAVES
Warehouse supervisors can group picking by:
route
carrier
dispatch date
zone
customer
priority
vehicle
Wave creation should optimise operational work without losing individual order traceability.
140. PACKING
Packing station sees:
order
shipment
customer
items expected
items picked
packaging
cartons/pallets
weight
dimensions
labels
documentation
Allow multiple containers.
141. SHIPMENT
Shipment 360:
customer
orders
ship-from
ship-to
carrier
service
dispatch
delivery estimate
packages
pallets
weight
tracking
documents
export data
proof of delivery
exceptions
142. DELIVERY PLANNING
Where needed support:
delivery date
route
vehicle
carrier
load
site restrictions
time window
customer instructions
Do not force advanced route planning where a business does not need it.
143. EXPORT
Use product/customer/order data already held.
Support:
commodity code
country of origin
description
quantity
value
currency
net weight
gross weight
incoterm
shipper
consignee
packing information
customs references
Do not repeatedly re-enter this data.
144. RETURNS
Customer return flow:
Return request.
Authorisation.
Expected return.
Receipt.
Inspection.
Disposition.
Credit/replacement.
Stock outcome.
Possible dispositions:
return to stock
quality hold
rework
scrap
supplier return
145. FINANCE PRINCIPLE
Finance must be a real integrated ERP finance engine.
Operational systems create financially meaningful events.
Finance controls how those events post.
Do not allow random modules to write directly to arbitrary ledger accounts.
146. FINANCE STRUCTURE
Finance should include:
General Ledger.
Accounts Receivable.
Accounts Payable.
Bank.
Cash.
VAT/tax.
Credit control.
Expenses.
Fixed Assets.
Budgets.
Forecasts.
Accruals.
Prepayments.
Multi-currency.
Financial periods.
Close.
Financial reporting.
147. SUBLEDGERS
Use controlled subledgers.
Sales Invoice:
→ AR.
Purchase Invoice:
→ AP.
Inventory transaction:
→ Inventory Accounting.
Manufacturing:
→ WIP / variance.
Assets:
→ Fixed Assets.
Expenses:
→ Expense/Payables.
Then post to GL using posting rules.
148. POSTING PROFILES
Map business events to accounting.
Example:
Customer invoice product category A:
Debit Accounts Receivable.
Credit Product Revenue.
Credit VAT Payable.
Inventory shipment:
Debit Cost of Sales.
Credit Inventory.
Configuration must be central and controlled.
149. FINANCIAL DIMENSIONS
Use dimensions to avoid enormous charts of accounts.
Possible dimensions:
site
department
cost centre
project
product category
customer segment
channel
campaign
warehouse
Dimensions should flow automatically from source records where possible.
150. GENERAL LEDGER
Support:
accounts
journals
periods
balances
posting
reversal
recurring journals
allocations later if needed
currency
dimensions
audit
Do not allow posted journals to be casually edited.
151. ACCOUNTS RECEIVABLE
Customer finance should show:
open invoices
credits
payments
balance
ageing
credit limit
available credit
disputes
payment promises
holds
AR should link back to sales and service context.
152. CREDIT CONTROL WORKBENCH
Show:
customers overdue
largest exposures
broken payment promises
accounts near limit
accounts on hold
orders blocked by credit
recent payments
tasks
Allow notes and actions.
153. ACCOUNTS PAYABLE
Support:
supplier invoice
matching
approval
posting
payment proposal
payment
credit notes
supplier statements
ageing
AP should link directly to PO and receipt.
154. BANKING
Support:
bank accounts
imported transactions
future bank feeds
matching
reconciliation
payment
receipt
transfer
rules
unmatched queue
Suggested matches should reduce manual work.
155. EXPENSES
Employee experience:
Photograph/upload receipt.
Category.
Amount.
Date.
Purpose.
Project/cost centre if relevant.
Submit.
Atlas handles:
policy
approval
tax
accounting
reimbursement
Do not make employee choose ledger accounts.
156. FIXED ASSETS
Support:
asset register
asset category
purchase
capitalisation
location
custodian
depreciation method
useful life
depreciation
disposal
impairment
documents
Asset creation may originate from approved capital purchases.
157. INVENTORY ACCOUNTING
Inventory value must reconcile with the inventory ledger.
Support chosen costing methods where implemented.
Potential methods:
standard cost
weighted average
FIFO
Do not implement every method unless Atlas genuinely supports them correctly.
Manufacturing costing must integrate.
158. WIP ACCOUNTING
Manufacturing consumption transfers value into WIP.
Production completion transfers value out.
Scrap and variance are posted appropriately.
Finance should be able to reconcile:
opening WIP
additions
completions
adjustments
closing WIP
159. PERIOD CLOSE
Provide guided close.
Checklist:
Bank reconciliation.
AR review.
AP review.
Inventory reconciliation.
WIP reconciliation.
Accruals.
Prepayments.
Depreciation.
Currency revaluation.
VAT review.
Journals.
Financial report review.
Each step can have:
owner
status
notes
completion
160. CUSTOMER SERVICE PRINCIPLE
Customer Service should start from customer context.
Do not make an agent search four applications to answer:
Where is my order?
161. CUSTOMER SERVICE WORKSPACE
Show:
open tickets
tickets near SLA
open complaints
orders at risk
recent failed deliveries
returns awaiting action
customer callbacks
CSAT alerts
162. TICKETING PLATFORM
One generic ticket platform can support:
Customer Service.
IT.
Finance.
Quality.
Operations.
HR.
Ticket contains:
reference
type
category
team
owner
priority
status
SLA
requester
customer/supplier/employee as appropriate
description
linked records
activity
attachments
resolution
163. LINKED TICKET RECORDS
Allow relationships to:
customer
supplier
product
order
order line
delivery
invoice
PO
MO
lot
employee
asset
project
Do not write:
"Order SO-1842"
inside plain text if a relationship can be stored.
164. COMPLAINT FLOW
Agent selects customer.
Atlas shows recent orders.
Agent selects order.
Atlas shows lines.
Agent selects product/line.
Complaint records:
quantity affected
reason
description
evidence
delivery
lot where traceable
invoice
The system already knows the commercial information.
165. COMPLAINT CLASSIFICATION
Potential categories:
damaged
incorrect quantity
wrong product
late delivery
technical failure
quality defect
documentation
invoice issue
service
Other.
Use categories for analytics and root cause.
166. COMPLAINT RESOLUTION
Potential resolutions:
information only
replacement
return
rework
credit
partial credit
refund
future discount
goodwill
quality investigation
supplier investigation
167. CREDIT FROM COMPLAINT
Customer Service should not directly post finance transactions unless authorised.
Flow:
Complaint.
Proposed credit.
Approval if needed.
Finance draft credit.
Finance validates/posts.
Complaint updates automatically.
Customer Service sees status.
No retyping.
168. CSAT
Support CSAT event triggers.
Examples:
ticket closure
complaint closure
delivery
support interaction
Store:
score
comment
customer
interaction
team
agent where appropriate
Look for trends:
product
complaint type
delivery route
team
customer segment
169. TELEPHONY
Design an integration interface for telephony.
Incoming number may resolve contact.
Possible screen pop:
ABC Construction

Caller:
John Smith

Open Orders:
3

Open Tickets:
2

Last Contact:
Yesterday

Do not tightly bind the architecture to one phone provider.
170. INTERNAL PROJECTS
Projects application is for internal/project delivery work.
Examples:
New production line.
ERP implementation.
Website project.
Cost reduction.
Facility upgrade.
Not the same as sales projects.
171. PROJECT MODEL
Project.
Workstream.
Milestone.
Task.
Subtask.
Dependency.
Owner.
Team.
Priority.
Dates.
Status.
Documents.
Comments.
Budget.
Cost.
Time where applicable.
Risk.
172. PROJECT VIEWS
Support:
list
board
timeline
Gantt
calendar
My Tasks
Allow project owners to choose useful views.
173. PLAN MODULE
Plan is a management planning workspace.
Possible plans:
Sales Plan.
Marketing Plan.
Production Plan.
Operational Plan.
Customer Service Plan.
Financial Plan.
Annual Business Plan.
174. PLAN COMPONENTS
Objective.
Measure.
Target.
Initiative.
Action.
Owner.
Date.
Assumption.
Risk.
Comment.
Scenario.
Version.
Attachment.
175. LIVE PLAN METRICS
Plan measures can reference governed Atlas metrics.
Example:
Objective:
Improve OTIF.
Target:
95%.
Actual:
89.2%.
Trend:
+1.4%.
Data comes live from Atlas.
No manual spreadsheet copying.
176. PLAN WRITE-BACK
Plan should not casually change operational systems.
Example:
Approved forecast can explicitly publish demand forecast into planning.
This is a controlled action.
Strategic plans should not silently create purchase orders.
177. KPI SEMANTIC LAYER
Create a governed business metric layer.
Metric definition should include:
name
description
business meaning
formula
source
time basis
filters
owner
permissions
version where needed
Examples:
Revenue.
Order Intake.
Backlog.
OTIF.
Inventory Value.
Stock Turns.
WIP.
Gross Margin.
Scrap.
Yield.
OEE.
Capacity Utilisation.
Supplier OTIF.
Customer Complaints.
CSAT.
178. ONE KPI DEFINITION
Do not calculate OTIF separately in:
Sales dashboard.
Logistics dashboard.
Management dashboard.
Customer report.
Create one governed OTIF definition.
Every consumer uses it.
179. DASHBOARD BUILDER
Users should create dashboards without technical BI knowledge.
Flow:
Add widget.
Choose metric.
Choose visual.
Choose filters.
Save.
Supported components:
KPI.
Trend.
Bar.
Line.
Table.
Exception list.
Target.
Status.
Use charts where they add understanding.
180. DASHBOARD DRILL-THROUGH
Every important aggregate should lead to detail.
Click:
OTIF 87%.
See orders that contributed.
Click:
£340k overdue debt.
See invoices.
Click:
6 production delays.
See MOs.
Dashboards should lead to action.
181. MARKETING
Marketing should use real customer data and permissions.
Support:
campaigns
segments
audiences
forms
landing pages
email activity
events
UTM
consent
leads
attribution
Do not create a second customer database.
182. SEGMENT BUILDER
Human-readable segment filters.
Example:
Customers where:
Product Category = Clay Drainage
AND
Last Order > 90 days ago
AND
Revenue Last 12 Months > £10,000
AND
Marketing Consent = Yes
No SQL required.
183. HR
HR master can include:
employee
role
department
manager
site
employment dates
skills
training
documents
leave
timesheets where used
HR data requires stronger permissions.
184. TRAINING AND SKILLS
Skills can connect to manufacturing.
Example:
Operation requires:
Kiln Operator certification.
Scheduling could warn if required skilled resource is unavailable where labour scheduling is enabled.
185. HEALTH AND SAFETY
Support:
incidents
near misses
hazards
risk assessments
COSHH
PPE
audits
inspections
training
corrective actions
186. INCIDENT
Capture:
time
location
people
description
injury
immediate response
witnesses
photos
severity
investigation
root cause
actions
closure
187. RISK ASSESSMENT
Capture:
hazard
people affected
existing controls
likelihood
severity
score
additional actions
owner
review date
version
Never overwrite historical approved versions.
188. DOCUMENT SERVICE
One shared document architecture.
Documents may relate to:
customer
supplier
product
order
PO
MO
shipment
invoice
quality
project
employee
H&S
Documents store:
name
type
version
source
owner/uploader
date
related records
permissions
expiry where relevant
189. ACTIVITY AND AUDIT ARE DIFFERENT
Activity timeline is user-facing business history.
Audit is system evidence.
Example Activity:
Michael added note.
Customer accepted quote.
Shipment dispatched.
Audit:
Field X changed from A to B by user ID 124 at 14:32.
Keep both.
190. AUDIT
Audit critical actions.
Record:
who
when
what
old value
new value
source
reason where required
request/context ID where useful
Important areas:
finance
inventory
pricing
credit
approvals
quality
master data
permissions
191. IMMUTABILITY
Posted financial transactions should not be silently edited.
Posted inventory transactions should not be silently edited.
Corrections should use:
reversal
credit
replacement
adjustment
corrective journal
This protects trust.
192. NOTIFICATIONS
Central notification engine.
Channels may include:
in-app
email
future integrations
Allow preferences where appropriate.
Do not notify users about every technical event.
Notify for meaningful action or risk.
193. EXCEPTION ENGINE
Atlas should proactively detect problems.
Potential exceptions:
customer order risk
material shortage
late PO
late production
capacity overload
quality failure
credit risk
inventory anomaly
invoice mismatch
supplier underperformance
ticket SLA
unusual scrap
low margin order
Every exception should ideally contain:
what happened
severity
why
business impact
recommended action
owner
194. "WHY?" FRAMEWORK
Atlas should expose explanation for important calculated or automated decisions.
Examples:
Why is this order late?
Why is this product unavailable?
Why is this price £14.20?
Why does this require approval?
Why did MRP suggest this order?
Why is this customer on credit hold?
Why is this production cost high?
Why is this stock blocked?
Why did Atlas choose this warehouse?
195. AI PRINCIPLE
AI may help interpret Atlas.
AI must not become the source of transactional truth.
Good AI use:
natural language query
record summarisation
exception explanation
draft email
suggested action
report commentary
search assistance
dashboard suggestions
Bad AI use:
inventing stock
guessing journal entries
fabricating delivery dates
replacing MRP logic
changing financial transactions without deterministic validation
196. ATLAS ASSISTANT
Example question:
"Why is ABC's order late?"
Atlas retrieves deterministic relationships:
Sales Order.
Demand.
MO.
Material.
PO.
Then AI summarises:
ABC's order is currently expected two days late.

The main cause is raw material RM-14.

PO-991 was originally due 14 October and is now expected 17 October.

This delays MO-482 and moves finished stock availability to 20 October.

Possible recovery options:
1. Expedite PO-991.
2. Transfer RM-14 from Site B.
3. Split the customer delivery.

Every underlying statement must be backed by Atlas records.
197. IMPORT FRAMEWORK
Shared import process:
Upload.
Map.
Validate.
Preview.
Import.
Show bad rows clearly.
Example:
Row 82
Product Code missing

Row 119
Currency "UKP" not recognised

Suggested:
GBP

Allow retry of failures.
198. EXPORT
Exports should respect:
permissions
current filters
selected columns
data scope
Do not expose hidden sensitive data merely because someone can export a list.
199. INTEGRATION ARCHITECTURE
External systems use stable integration interfaces.
Potential:
bank feeds
email
telephony
carriers
EDI
e-commerce
customer portals
supplier portals
payroll
manufacturing equipment
Do not let external systems write arbitrary tables.
200. EXTERNAL IDs
Keep external identifiers separately.
Example:
Atlas Customer ID.
Shopify ID.
EDI ID.
Carrier Account ID.
Do not replace internal primary keys with external identifiers.
201. DOMAIN EVENTS
Use meaningful internal events.
Examples:
sales.order.confirmed
sales.order.changed
inventory.receipt.posted
inventory.stock.changed
planning.run.completed
planning.shortage.detected
planning.order.firmed
manufacturing.order.released
manufacturing.operation.completed
manufacturing.order.completed
quality.hold.created
quality.hold.released
purchase.order.confirmed
shipment.dispatched
finance.invoice.posted
finance.payment.received
service.complaint.created
Do not use events as uncontrolled hidden logic.
Document important publishers and consumers.
202. RELIABLE EVENT DELIVERY
Where state change and event must remain consistent, use an outbox-style approach.
Consumers must be idempotent.
Duplicate event processing must not create:
duplicate stock
duplicate invoices
duplicate tasks
duplicate production
203. TRANSACTION BOUNDARIES
Critical transitions must be atomic.
Example receipt:
Create receipt.
Create inventory transaction.
Update PO receipt state.
Create relevant accounting state.
Either succeed consistently or fail safely.
Do not leave half a receipt.
204. CONCURRENCY
Atlas must support multiple simultaneous users.
Use:
optimistic concurrency
record versions
transaction locking where required
idempotency keys
duplicate submission protection
Example:
Two users editing same sales order.
Second save should not silently overwrite first user's changes.
205. SERVER-SIDE SECURITY
Never rely on hidden buttons.
Backend must authorise every significant action.
Permission scopes may include:
company
site
warehouse
department
team
role
record ownership
financial sensitivity
function
206. SEGREGATION OF DUTIES
Support policies such as:
requester cannot approve own high-value PO
supplier bank changes require approval
journal creation and approval separated
large credit note requires Finance
large stock write-off requires management
credit limit override requires authorised role
Do not hardcode one company's exact policy.
207. SETTINGS ARCHITECTURE
Keep system configuration away from everyday operational screens.
Settings areas:
Organisation.
Users/Security.
Sales.
Product.
Inventory.
Planning.
Manufacturing.
Procurement.
Quality.
Warehouse.
Logistics.
Finance.
Service.
Integrations.
Do not display technical planning parameters next to ordinary sales order entry.
208. GUIDED SETUP
Complex settings should use guided configuration.
Example Planning Setup:
Step 1:
Select planning sites.
Step 2:
Define default horizon.
Step 3:
Set default replenishment policy.
Step 4:
Review manufactured items without BOMs.
Step 5:
Review purchased items without suppliers.
Step 6:
Review missing lead times.
Step 7:
Run validation.
Avoid a 200-field configuration page.
209. DATA VALIDATION
Atlas should identify bad master data before operations fail.
Examples:
Manufactured item has no BOM.
Purchased item has no supplier.
Customer missing invoice address.
Product missing UOM.
Work centre missing calendar.
Finance posting profile incomplete.
Planning workspace can show configuration exceptions separately from operational shortages.
210. OBSERVABILITY
Instrument important processes.
Track:
MRP run duration.
Background jobs.
Failed jobs.
Integration failures.
Import failures.
Financial posting failures.
Inventory posting failures.
Event processing.
API errors.
Do not require developers to reproduce invisible failures from user screenshots.
211. ERROR EXPERIENCE
Never show generic failure if Atlas knows the reason.
Bad:
Something went wrong.
Better:
Order could not be confirmed.

Reason:
Customer ABC Construction is currently on credit hold.

Outstanding overdue balance:
£18,200

[View Customer Finance]
[Request Credit Override]

212. PERFORMANCE
Optimise based on actual system behaviour.
Use:
appropriate indexes
query optimisation
pagination
virtualisation
batch processing
background processing
caching where safe
materialised projections where justified
incremental planning recalculation where suitable
Avoid premature distributed architecture.
213. MRP PERFORMANCE
MRP could process very large datasets.
Consider:
planning by site
incremental recalculation
parallel calculation where safe
precomputed BOM structures where justified
efficient pegging representation
time-phased planning tables/projections
batch persistence
Measure before optimisation.
214. REPORTING ARCHITECTURE
Operational reporting should not execute enormous uncontrolled queries directly against transaction tables if better projections can be maintained.
Separate:
transactional truth
reporting projections
cached summaries
governed metrics
But ensure reporting can drill back to source records.
215. TESTING STRATEGY
Atlas needs:
unit tests
domain tests
integration tests
workflow tests
permission tests
financial reconciliation tests
inventory reconciliation tests
MRP golden tests
end-to-end tests
Do not rely entirely on browser smoke tests.
216. GOLDEN MRP TEST
Create deterministic scenario.
Product A demand:
5,000.
Stock:
1,000.
Required manufacturing:
4,000.
BOM:
2 × Component B.
1 kg × Material C.
B stock:
8,000.
C stock:
1,000 kg.
Therefore:
B requirement 8,000.
B shortage 0.
C requirement 4,000 kg.
C shortage 3,000 kg.
Expected recommendations:
Planned MO A = 4,000.
Planned Purchase C = 3,000 kg.
Expected pegging:
Sales Order.
→ A demand.
→ Planned MO.
→ C component demand.
→ Planned purchase.
Assert exact outcome.
217. MULTI-LEVEL BOM TEST
Product A.
Uses B.
B uses C.
Sales demand A.
Verify:
A planned manufacturing.
B dependent manufacturing.
C purchase requirement.
Lead-time dates correctly offset.
218. SAFETY STOCK TEST
Stock dips below safety stock without customer shortage.
MRP should recommend replenishment according to policy.
Supply Lens should explain that requirement is safety stock, not sales demand.
219. QUALITY HOLD TEST
Stock exists physically.
Quality holds it.
Verify:
On Hand includes it.
Available excludes it.
ATP excludes it.
MRP responds.
Affected customer orders become risk where appropriate.
220. LATE SUPPLIER TEST
Purchase receipt moves five days late.
Verify:
dependent MO risk.
dependent sales risk.
action message.
Supply Lens.
promise impact.
No duplicate demand created.
221. SALES TO CASH TEST
Quote.
Accepted quote.
Sales order.
ATP.
MRP.
Purchase.
Receipt.
Manufacturing.
Quality.
Inventory.
Pick.
Pack.
Dispatch.
Invoice.
Payment.
Verify every relationship.
222. COMPLAINT TO CREDIT TEST
Delivered sales order.
Complaint.
Order line selected.
Return.
Quality inspection.
Credit request.
Approval.
Finance credit.
Inventory disposition.
Customer account.
Verify traceability.
223. MANUFACTURING COST TEST
Expected:
Material £5,000.
Labour £1,000.
Machine £800.
Actual:
Material £5,200.
Labour £1,100.
Machine £900.
Scrap £300.
Atlas calculates:
total actual
total variance
variance categories
WIP movement
finished cost
finance posting
224. PERMISSION TEST
Salesperson can:
view customer credit status.
Cannot:
edit credit limit.
Customer Service can:
propose credit.
Cannot:
post unrestricted finance credit.
Warehouse can:
perform receipt.
Cannot:
change PO commercial price.
Test permissions through API, not only UI.
225. MIGRATION PRINCIPLE
Do not create Atlas 2 beside Atlas.
For duplicated concepts:
identify canonical model
map old data
create migration
migrate references
update services
update UI
test
retire old implementation
Do not keep permanent duplicate paths.
226. FEATURE FLAGS
Use temporary feature flags for risky migrations where useful.
Document:
purpose
owner
removal condition
Do not allow permanent abandoned flags.
227. ARCHITECTURE DECISION RECORDS
Record significant decisions.
Example:
ADR-021

Decision:
Inventory quantity is derived from inventory ledger/projection, not directly mutated on Product.

Reason:
Traceability, costing and concurrency.

Alternatives:
Mutable product stock field.

Consequences:
Inventory services must own all quantity-changing operations.

This is especially important when multiple coding agents work on Atlas.
228. CODE ORGANISATION
Avoid:
giant components
giant services
global utility dumping grounds
circular dependencies
UI-owned business rules
cross-domain ORM manipulation
magic strings for status
duplicated enums
Prefer:
domain services
application services
repositories/data access
clear DTO/API contracts
shared primitives
typed state/value objects where appropriate
229. BUSINESS LOGIC LOCATION
Example:
Do not calculate ATP in a React component.
Frontend calls:
AvailabilityService / OrderPromiseService.
Do not calculate journal entries inside Sales UI.
Sales calls Finance posting service.
Do not directly decrement product.stock.
Use Inventory service.
230. UI MUST NEVER BECOME THE SOURCE OF TRUTH
Frontend presents state.
Backend validates business rules.
A malicious or buggy client must not bypass:
credit rules
approval
stock validity
financial permissions
workflow states
231. AUTOMATE THE NORMAL PATH
Normal work should flow automatically.
Example Sales:
Confirm order.
Demand appears.
Availability evaluated.
MRP sees demand.
No one presses:
"Send to Planning".
Example manufacturing:
Complete output.
Inventory appears.
Planning sees supply.
No one presses:
"Update Inventory".
Example dispatch:
Shipment posts.
Fulfilment updates.
Invoice eligibility updates.
No one manually closes three modules.
232. HUMANS MANAGE EXCEPTIONS
The system handles predictable mechanics.
People handle:
commercial judgement
exception decisions
approval
supplier negotiation
customer communication
production prioritisation
quality disposition
risk
This is a crucial Atlas philosophy.
233. DO NOT OVER-AUTOMATE RISK
Require policy-controlled actions for:
large purchases
credit override
large discount
significant reallocation
stock write-off
journal posting
supplier banking change
high-value credit
major schedule override
Automation must not eliminate governance.
234. IMPLEMENTATION SEQUENCE
Do not attempt everything simultaneously.
Stage 1: Discover
Repository audit.
System map.
Domain map.
Duplicate logic.
Broken relationships.
Data ownership.
UX complexity.
Permission gaps.
Stage 2: Platform Foundation
Canonical record patterns.
Activity.
Audit.
Documents.
Tasks.
Approvals.
Notifications.
Global search.
My Work.
Shared design system.
Stage 3: Master Data
Customer.
Supplier.
Product.
Organisation.
Site.
Warehouse.
UOM.
Currency.
Shared dimensions.
Stage 4: Inventory Truth
Inventory ledger.
Stock states.
Reservations.
Availability.
Warehouse/location consistency.
Stage 5: Business Relationships
Business Graph.
Relationship panel.
Source links.
Demand links.
Supply links.
Stage 6: Demand and Supply
Demand model.
Supply model.
Supply Lens.
Pegging.
Projected availability.
Stage 7: MRP
Planning runs.
Netting.
BOM explosion.
Lead times.
Order modifiers.
Planned orders.
Action messages.
Explainability.
Stage 8: Manufacturing
BOM.
Routing.
Resources.
MO.
Work orders.
Shop floor.
Consumption.
Output.
Scrap.
WIP.
Cost.
Stage 9: Capacity and Scheduling
Capacity.
Calendars.
Resource load.
Detailed schedule.
Impact analysis.
What-if.
Stage 10: ATP and CTP
Order promising.
Splits.
Alternative supply.
Supply protection.
Stage 11: Procurement
Requests.
Approvals.
RFQ.
PO.
Supplier confirmation.
Receiving.
Supplier performance.
Stage 12: Quality
Checks.
Holds.
NC.
RCA.
CAPA.
Traceability.
Stage 13: Warehouse and Logistics
Put-away.
Picking.
Packing.
Shipping.
Transport.
Export.
Returns.
Stage 14: Finance
Posting engine.
Subledgers.
GL.
AR.
AP.
Inventory.
WIP.
Bank.
Expenses.
Assets.
Close.
Stage 15: Service
Tickets.
Complaints.
Credits.
Returns.
CSAT.
Telephony interfaces.
Stage 16: Analytics and Plan
Semantic metrics.
Dashboards.
Plan.
Scenarios.
Management reporting.
Stage 17: Hardening
Performance.
Security.
Reconciliation.
Concurrency.
Observability.
Migration clean-up.
End-to-end testing.
235. BEFORE ADDING A NEW FIELD
Ask:
Does Atlas already know this?
Can it be derived?
Does another domain own it?
Is it needed for the current user's job?
Does it belong in advanced configuration?
Will users understand it?
236. BEFORE ADDING A NEW SCREEN
Ask:
Could this be:
a tab
a drawer
a saved view
a contextual panel
a work queue
a section on an existing 360 record
Avoid unnecessary navigation growth.
237. BEFORE ADDING A NEW MODULE
Ask:
Is this genuinely a separate business domain?
Or is it a capability of an existing workflow?
Prefer coherent workflows over endless apps.
238. BEFORE ADDING A STATUS
Ask:
Does this represent a genuine business lifecycle state?
Or is it merely:
a flag
an exception
a progress percentage
an approval state
Do not create dozens of confusing statuses.
239. BEFORE ADDING CONFIGURATION
Ask:
Can Atlas choose a sensible default?
Can policy be inherited?
Can the option be hidden unless advanced behaviour is required?
Configuration flexibility must not become configuration burden.
240. DEFINITION OF DONE
A feature is not finished because the page renders.
It is finished when:
data model is correct
domain ownership is correct
workflow is correct
permissions work
validation works
cross-domain consequences work
audit works
failure behaviour works
loading works
empty state works
error state works
relationships are visible
tests cover important behaviour
responsive behaviour is reasonable
accessibility is reasonable
documentation is updated
no duplicate source of truth was introduced
241. FINAL EXPERIENCE, SALES USER
Salesperson opens:
SO-1842.
They immediately understand:
Customer:
ABC Construction.
Customer PO:
ABC/4922.
Value:
£71,000.
Requested:
18 Oct.
Promise:
20 Oct.
Fulfilment:
0%.
Availability:
1,500 available.
3,500 planned.
Risk:
Low.
They do not need MRP knowledge.
They click "View Supply".
242. FINAL EXPERIENCE, PLANNER
Planner sees:
SO-1842.
Demand:
5,000.
Stock:
1,500.
Shortfall:
3,500.
Planned MO:
MO-482.
Material readiness:
92%.
Blocking material:
RM-14.
Required:
1,400 kg.
Available:
220 kg.
Incoming:
PO-882.
2,000 kg.
Confirmed:
16 Oct.
Production start:
17 Oct.
Production finish:
19 Oct.
Warehouse processing:
1 day.
Promise:
20 Oct.
The full chain is visible.
243. FINAL EXPERIENCE, BUYER
Buyer opens PO-882.
They see:
Supplier.
Material.
Quantity.
Requested date.
Supplier confirmed date.
Manufacturing demand supported.
Customer demand indirectly affected.
Buyer sees:
This purchase supports:

MO-482

Customer commitments:

SO-1842
£71,000
Promised 20 Oct

Buyer understands business priority.
244. FINAL EXPERIENCE, PRODUCTION
Production manager opens MO-482.
Sees:
Product.
Quantity.
Materials.
Routing.
Schedule.
Work centres.
Current progress.
Quality.
Output.
Scrap.
Cost.
Demand.
Customer consequence.
No manual searching.
245. FINAL EXPERIENCE, CUSTOMER SERVICE
Customer calls:
"Where is my order?"
Agent opens customer.
Clicks order.
Sees:
Promised 20 Oct.
Production currently on schedule.
Next milestone:
MO completion 19 Oct.
Shipment expected:
20 Oct.
No need to call Planning for basic status.
If risk exists, agent sees reason in appropriate language.
246. FINAL EXPERIENCE, FINANCE
Finance user opens invoice.
Can trace:
Invoice.
Sales order.
Shipment.
Customer PO.
Products.
Revenue.
Tax.
Payment.
Credit.
If cost analysis permitted:
COGS.
Margin.
Finance does not need to understand production routing to post invoice.
But traceability remains.
247. FINAL EXPERIENCE, MANAGEMENT
Manager should be able to move from:
OTIF 88%.
to:
late orders.
to:
specific customer order.
to:
production delay.
to:
material shortage.
to:
supplier PO.
to:
supplier performance.
without exporting a spreadsheet and manually joining six reports.
This is what integrated ERP should mean.
248. THE ATLAS DIFFERENCE
Atlas should not attempt to win by having more settings than SAP.
Atlas should win because it makes sophisticated operations understandable.
Its major strengths should become:
Customer 360.
Product 360.
Order 360.
Supplier 360.
Manufacturing Order 360.
Supply Lens.
Business Graph.
Explainable MRP.
Exception-driven planning.
Strong ATP/CTP.
Protected customer promises.
Integrated manufacturing cost.
Embedded quality.
Shared approvals.
Connected finance.
Excellent search.
My Work.
Role-focused home.
Powerful but simple dashboards.
Deep traceability.
249. CORE PRODUCT PHILOSOPHY
Transform:
DATA
into
CONTEXT
then
EXCEPTION
then
DECISION
then
ACTION.
Do not simply display more data because it exists.
250. FIRST TASK AFTER RECEIVING THIS BRIEF
Do not respond with:
"Here is what I would do."
Do not produce another conceptual plan and stop.
Inspect the actual Atlas repository.
Then provide a concise initial implementation assessment containing:
The ten biggest architectural fragmentation problems.
The ten biggest workflow problems.
The ten biggest UX complexity problems.
The highest-risk duplicate sources of truth.
The weakest cross-domain relationships.
The places where business logic is duplicated.
The areas where users currently perform avoidable manual work.
The areas where Atlas is over-configured.
The areas where Atlas is under-modelled.
The existing functionality that should be preserved.
The first safe sequence of refactoring.
Then begin making the highest-leverage changes.
251. NEVER LOSE SIGHT OF THIS
Atlas is allowed to be technically complex.
Manufacturing is complex.
Finance is complex.
Supply chains are complex.
Planning is complex.
The mistake is exposing all of that complexity indiscriminately to every user.
A strong ERP does not pretend complexity does not exist.
It organises complexity.
A great ERP makes complex operations feel understandable.
That is what Atlas must become.
END OF MASTER PROMPT