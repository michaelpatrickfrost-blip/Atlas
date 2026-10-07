# ATLAS CUSTOMER SERVICE + TICKETS + QUERIES

## MASTER CODEX IMPLEMENTATION SPECIFICATION

You are acting as the principal ERP architect, senior full-stack engineer, customer service systems architect and service-management specialist responsible for rebuilding Atlas Customer Service and implementing a new Atlas Tickets application.

This is a major cross-module implementation.

Do not build two isolated apps.

The architecture must provide:

1. **Customer Service**
   Customer-facing cases, complaints, service enquiries, after-sales actions, CSAT, complaint investigation and customer recovery.

2. **Tickets**
   A configurable internal service desk for IT, Finance, Customer Service, HR, Operations, Quality, Procurement, Facilities and any other business team.

3. **Queries**
   The existing or enhanced cross-department work/request mechanism that allows Customer Service cases and Tickets to request action from another team without losing context.

These applications must share infrastructure where appropriate but retain different business meaning.

---

# 1. FIRST INSPECT ATLAS

Before changing code, inspect the existing repository.

Understand:

- architecture
- frontend
- backend
- database
- ORM
- authentication
- tenancy/company handling
- sites/business units
- employees/users
- teams
- departments
- roles
- permissions
- Customer model
- Contacts
- CRM
- Sales Orders
- Sales Order lines
- Products
- deliveries
- Logistics
- Inventory
- invoices
- Finance
- existing credit notes
- pricing
- discounts
- Quality
- RCA
- Manufacturing
- Procurement
- HR
- Assets
- Projects
- Notifications
- email capabilities
- activity/timeline components
- attachments
- comments
- existing Queries functionality
- existing Customer Service functionality
- existing complaint functionality
- existing CSAT functionality
- current dashboards
- audit logging
- approval workflows
- Atlas design system

Do not create duplicate concepts simply because the existing implementation is messy.

Refactor and reuse safely where appropriate.

Do not destroy historical complaints, CSAT records, queries or support records.

Create migrations and compatibility mappings where required.

---

# 2. CORE ARCHITECTURAL PRINCIPLE

Atlas needs three related service concepts.

## Customer Case

A customer-facing issue or enquiry.

Examples:

- damaged product
- late delivery
- incorrect product
- short delivery
- product quality complaint
- pricing problem
- invoice dispute
- documentation request
- missing certificate
- delivery complaint
- service complaint
- technical enquiry
- product failure
- return request
- commercial complaint

## Ticket

An internal service-management work item.

Examples:

- laptop not working
- system access request
- Finance query
- HR request
- warehouse system problem
- printer issue
- procurement request
- internal Customer Service task
- maintenance request
- new starter request
- facilities issue

## Query

A cross-department request for information or action.

Examples:

Customer Case requires Finance investigation.

Customer Service creates:

**Finance Query**

The Finance Query stays linked to the Customer Case.

Finance resolves the Query.

Customer Service retains ownership of the customer relationship.

Likewise:

An IT Ticket could create a Procurement Query.

A Finance Ticket could create a Sales Query.

Queries are therefore the cross-functional collaboration layer.

---

# 3. SHARED SERVICE WORK INFRASTRUCTURE

Avoid implementing the same concepts three times.

Where appropriate create a shared service-work domain layer supporting:

- unique reference
- title
- description
- type
- status
- priority
- severity
- owning team
- assignee
- requester
- followers/watchers
- SLA
- due dates
- activities
- comments
- internal notes
- attachments
- tags
- linked records
- parent/child relationships
- related work
- audit history
- timeline
- notifications

Possible architecture:

ServiceWorkItem

specialised by:

CustomerCase  
Ticket  
Query

Do not blindly create inheritance if the existing ORM/database makes composition cleaner.

The important requirement is shared behaviour without losing domain meaning.

---

# 4. UNIQUE REFERENCES

Use clear identifiers.

Examples:

Customer Case:

CS-000142

Ticket:

TKT-001827

Query:

QRY-004912

Credit Request:

CR-000284

Return:

RMA-000591

Do not reuse the same number as the primary database identifier.

Use normal Atlas IDs internally.

---

# 5. CUSTOMER SERVICE APP

Rebuild Customer Service as a professional service workspace.

Suggested navigation:

## Overview

Operational dashboard.

## Cases

All customer cases.

## Complaints

Complaint-specific view.

## My Work

Cases assigned to the current user.

## Queues

Team queues.

## Orders & Deliveries

Customer service-oriented order visibility.

## Returns

Customer returns and RMAs.

## Credits & Remedies

Customer recovery activity.

## CSAT

Customer satisfaction.

## Knowledge

Support knowledge articles.

## Customers

Customer service 360.

## Products

Product complaint intelligence.

## Queries

Queries originating from customer service.

## Reports

Performance and trends.

## Settings

Configuration.

Do not create duplicate navigation if existing Atlas patterns provide a cleaner approach.

---

# 6. CUSTOMER CASE MODEL

A Customer Case should contain:

### Identity

Case number  
Title  
Description  
Case type  
Complaint category  
Subcategory

### Customer

Customer  
Account/site  
Contact  
Contact email  
Contact telephone  
Preferred communication channel

### Source

Email  
Phone  
Web  
Portal  
Sales  
Internal  
In person  
Other

### Commercial links

Sales Order  
Sales Order line  
Customer PO  
Invoice  
Invoice line  
Project  
CRM opportunity

### Product links

Product  
Variant  
Lot  
Batch  
Serial number  
Quantity affected  
UoM

### Fulfilment links

Delivery  
Delivery line  
Shipment  
Carrier  
Proof of delivery

### Operational links

Manufacturing order  
Production batch  
Work order  
Quality inspection

### Service information

Priority  
Severity  
Queue  
Owner  
Status  
SLA  
First-response deadline  
Resolution deadline

### Investigation

Problem description  
Customer impact  
Immediate containment  
Suspected cause  
Confirmed cause  
Root cause

### Resolution

Resolution type  
Resolution summary  
Customer response  
Resolved by  
Resolved at

### Financial impact

Requested credit  
Approved credit  
Replacement cost  
Return cost  
Transport cost  
Scrap cost  
Total complaint cost

### Satisfaction

CSAT sent  
CSAT response  
CSAT score  
CSAT comment

---

# 7. CASE TYPES

Provide configurable case types.

Seed sensible defaults such as:

Complaint  
General Enquiry  
Technical Enquiry  
Delivery Issue  
Product Issue  
Pricing Issue  
Invoice Issue  
Documentation  
Return Request  
Warranty  
Service Request

Do not hard-code workflows tightly to these values.

Administrators must be able to add types.

---

# 8. COMPLAINT CATEGORIES

Suggested defaults:

Product damaged  
Product defective  
Quality  
Incorrect product  
Incorrect quantity  
Short delivery  
Over delivery  
Late delivery  
Delivery damage  
Packaging  
Documentation  
Certificate  
Price incorrect  
Discount missing  
Invoice incorrect  
Customer service  
Technical performance  
Returns  
Other

Support category and subcategory.

Example:

Quality
→ Dimensions

Quality
→ Appearance

Quality
→ Product failure

Delivery
→ Late

Delivery
→ Damaged in transit

---

# 9. PRIORITY VS SEVERITY

Do not combine priority and severity.

Severity represents impact.

Priority represents how urgently Atlas should work the case.

Example severity:

Minor  
Moderate  
Major  
Critical

Example priority:

Low  
Normal  
High  
Urgent

A minor problem for a strategically important delivery may still need urgent attention.

Allow routing/SLAs to use both.

---

# 10. CASE STATUS MODEL

Suggested statuses:

New  
Triaged  
Assigned  
Investigating  
Awaiting Customer  
Awaiting Internal  
Awaiting Supplier  
Resolution Proposed  
Resolved  
Closed  
Reopened  
Cancelled

Do not simply use:

Open / Closed.

Keep the lifecycle meaningful.

---

# 11. CUSTOMER SERVICE WORKSPACE

Opening a case should present a professional working screen.

Header:

Case reference  
Customer  
Status  
Priority  
Owner  
SLA timer

Main content:

## Summary

What happened.

## Customer

Contact and account details.

## Related Order

Order and relevant lines.

## Product

Affected product.

## Timeline

All interactions and actions.

## Investigation

Findings.

## Queries

Internal cross-team requests.

## Remedy

Customer recovery actions.

## Quality

NCR/RCA information.

## Financial

Credits/adjustments.

## Satisfaction

CSAT.

Use tabs/sections intelligently.

Do not present one enormous form.

---

# 12. ORDER LOOKUP FROM CASE

This is critical.

When a user selects the customer, Atlas should allow them to search that customer's relevant orders.

Filters:

Recent  
Open  
Delivered  
Invoiced  
By customer PO  
By product  
By date

Selecting an order should show its lines.

The user can select:

Order SO10452  
Product SP1  
Quantity ordered 4,000  
Quantity delivered 4,000  
Delivery DL20484  
Invoice INV10284

Then select:

**Affected quantity: 250**

Do not make the user manually type product/order information Atlas already knows.

---

# 13. PRODUCT VALIDATION

If a user selects a Product before selecting the Sales Order, filter possible Orders/Deliveries to transactions containing that product where practical.

If a Sales Order is selected first, Product options should come from that order.

Allow manual product complaints where no Sales Order exists, but flag them as:

**Unverified purchase relationship**

Do not fake a Sales Order link.

---

# 14. DELIVERY CONTEXT

For delivery complaints show:

- requested date
- promised date
- dispatched date
- delivered date
- carrier
- vehicle/load where available
- delivery address
- POD
- delivered quantity
- OTIF result
- delay
- Logistics exceptions

This should link directly to the S&OP / Orders & Service data created elsewhere in Atlas.

---

# 15. CUSTOMER 360 SERVICE VIEW

Customer Service should have a customer-focused workspace.

Show:

Open cases  
Recent cases  
Complaint rate  
CSAT  
OTIF  
Open Orders  
Late Orders  
Outstanding Queries  
Open returns  
Pending credit requests  
Credits last 12 months  
Service recovery discounts  
Products purchased  
Projects  
Key contacts

Do not duplicate CRM.

Link to CRM where deeper commercial information is needed.

---

# 16. CASE TIMELINE

One chronological timeline should contain:

- case created
- status changes
- user assignment
- customer communication
- calls
- emails
- internal notes
- query creation
- query responses
- attachments
- credit requests
- approvals
- return activity
- replacements
- quality records
- resolution
- CSAT

Allow filters:

Customer communication  
Internal  
Financial  
Quality  
Fulfilment  
System

---

# 17. EMAIL

Where Atlas already has email integration, connect communications to the case.

Support:

- inbound email
- outbound email
- reply
- attachments
- templates
- case reference in subject where appropriate

Avoid creating another email client if Atlas already has one.

Architecture should allow shared support mailboxes later.

---

# 18. PHONE, CURRENT STATE

Atlas currently does not have an integrated telephone system.

Do not pretend that one exists.

Provide:

**Log Call**

Fields:

Direction:
Inbound / Outbound

Contact  
Telephone number  
Start time  
Duration  
Outcome  
Notes  
Follow-up  
Case/Customer link

Allow:

**Create Case from Call**

and:

**Log Call on Existing Case**

---

# 19. FUTURE TELEPHONY ARCHITECTURE

Design a connector interface for future phone integration.

Potential capabilities later:

- caller ID
- customer/contact matching
- screen pop
- click to call
- incoming call activity
- outgoing call activity
- call duration
- queue
- agent
- disposition
- recording reference
- transcription reference
- consent status

Do not build a telephony provider now unless Atlas already has one configured.

Do not store raw call recordings in the Customer Case table.

Use external recording references/storage appropriately.

---

# 20. CASE ROUTING

Cases should route into queues.

Examples:

General Customer Service  
Delivery Problems  
Technical Support  
Product Quality  
Export  
Billing

Rules can consider:

- case type
- category
- product
- customer
- customer tier
- site
- geography
- language
- priority
- severity

Allow manual reassignment.

Keep routing history.

---

# 21. QUEUES

Queue screens should show:

Unassigned  
Assigned  
At Risk  
SLA Breached  
Waiting  
Oldest  
Urgent

Columns:

Case  
Customer  
Subject  
Type  
Priority  
Owner  
Age  
Next SLA  
Status

Allow supervisors to assign/reassign.

---

# 22. SLA ENGINE

Build reusable SLA infrastructure for Customer Service, Tickets and Queries.

Support multiple SLA milestones.

Examples:

First response  
Next response  
Investigation update  
Resolution

Policies may depend on:

- priority
- severity
- customer tier
- case type
- ticket type
- service
- team

Support:

- business hours
- weekends
- holidays
- site calendar
- timezone
- warning threshold
- breach threshold
- pause states

Example:

Priority High

First response: 1 business hour  
Resolution target: 8 business hours

---

# 23. SLA PAUSE

Allow SLA clocks to pause in configurable states.

Example:

Awaiting Customer

could pause resolution SLA.

Awaiting Internal

may or may not pause depending on policy.

Store:

pause start  
pause reason  
resume time

Do not alter the original deadline without audit history.

---

# 24. ESCALATION

Configurable escalation rules.

Example:

15 minutes before first-response breach:

Notify owner.

At breach:

Notify Team Leader.

Two hours beyond breach:

Escalate to Customer Service Manager.

High-severity complaint:

Immediately notify relevant manager.

Avoid excessive notifications.

---

# 25. INTERNAL QUERIES FROM A CASE

This is essential.

Customer Service should not reassign a customer complaint to Finance and lose ownership.

Instead:

Case CS-00124

requires Finance investigation.

User selects:

**Create Query**

Team: Finance  
Type: Invoice Investigation  
Question:

"Customer disputes freight charge on invoice INV28491."

Atlas creates:

QRY-00312

The customer case remains owned by Customer Service.

Case status may become:

Awaiting Internal

Query appears within the case.

---

# 26. QUERY MODEL

Queries should support:

Reference  
Source type  
Source record  
Requesting team  
Requested from team  
Requester  
Owner  
Subject  
Description  
Priority  
Status  
Due date  
SLA  
Attachments  
Comments  
Internal discussion  
Resolution  
Resolved by  
Resolved at

Queries must link back to their origin.

Possible origins:

Customer Case  
Ticket  
Sales Order  
Invoice  
Purchase Order  
Product  
Project  
Quality record  
other Atlas entity

---

# 27. QUERY STATUS

Suggested:

New  
Assigned  
In Progress  
Waiting  
Answered  
Resolved  
Closed  
Cancelled

The originating case/ticket should receive an event when the Query is answered/resolved.

---

# 28. QUERY CONTEXT

Do not require the receiving team to hunt for background information.

A Finance Query created from a complaint should include context links such as:

Customer  
Case  
Sales Order  
Invoice  
Product  
Complaint reason  
Requested action

A Quality Query may include:

Product  
Batch  
Delivery  
Complaint evidence

---

# 29. MULTIPLE QUERIES

One case may require multiple Queries.

Example:

Customer reports broken product.

Customer Service creates:

Quality Query  
Finance Query  
Logistics Query

All remain linked to the same Case.

The case can therefore show:

Quality: Complete  
Finance: Waiting Approval  
Logistics: Complete

---

# 30. COMPLAINT INVESTIGATION

Complaint workflow should support:

Customer problem  
Impact  
Containment  
Investigation  
Cause  
Root cause  
Corrective action  
Preventive action  
Customer resolution

Not every small complaint requires full RCA.

Allow escalation to formal RCA.

---

# 31. QUALITY INTEGRATION

For quality-related complaints provide:

**Create Quality Issue**

Link the Case to Atlas Quality/RCA.

Possible result:

Case CS-00241  
↓
Quality Non-Conformance NC-00132  
↓
RCA RCA-00059  
↓
CAPA actions

Do not duplicate the Quality system inside Customer Service.

Bring summary/status back to the Case.

---

# 32. BATCH AND TRACEABILITY

If Inventory/Manufacturing supports lot/batch tracking, allow complaints to select the affected batch.

Then show relevant information such as:

Batch  
Manufacturing order  
Production date  
Quality inspections  
Other complaints against batch  
Remaining stock  
Customers supplied from batch

This enables systemic quality detection.

---

# 33. COMPLAINT CLUSTER DETECTION

Provide reporting that highlights patterns.

Examples:

12 complaints against Product A this month.

6 complaints involving Batch B291.

8 complaints involving Carrier X.

Complaint rate increased 34%.

Do not automatically claim causal relationships.

Show factual clustering.

---

# 34. CUSTOMER REMEDY

Within a Customer Case create:

**Propose Remedy**

Possible remedy types:

No financial remedy  
Explanation/apology  
Replacement product  
Replacement delivery  
Free-of-charge goods  
Return  
Repair  
Partial credit  
Full credit  
Refund  
Invoice correction  
Freight refund  
Surcharge refund  
Goodwill credit  
Discount on next order  
Free freight on next order  
Commercial allowance  
Other approved action

Each remedy has its own workflow.

---

# 35. FINANCIAL CONTROL PRINCIPLE

Customer Service must not directly post accounting transactions.

Customer Service may:

- propose a credit
- propose a refund
- propose an invoice correction
- propose a commercial discount

Finance controls accounting outcomes according to approval rules.

---

# 36. CREDIT REQUEST

From a complaint select:

**Request Credit**

The user chooses:

Customer  
Sales Order  
Invoice  
Invoice line  
Product  
Quantity affected

Atlas should pre-populate:

Original quantity  
Original unit price  
Discount  
Net line value  
Tax  
Currency

The user then selects:

Credit type:
Full line  
Partial quantity  
Percentage  
Fixed value  
Freight  
Surcharge  
Other

Enter:

Requested amount  
Reason  
Description  
Evidence/attachments

---

# 37. CREDIT REQUEST VALIDATION

Validate:

- invoice belongs to customer
- product is present on invoice where product-specific
- requested credit does not accidentally exceed invoice line amount
- already credited quantity/value
- previous open credit requests
- currency
- tax basis

Warnings should be clear.

Do not prevent authorised exceptional credits where policy allows.

Require override reason.

---

# 38. FINANCE: CREDITS & ADJUSTMENTS

Add a new Finance area:

**Credits & Adjustments**

Views:

Pending Approval  
Approved  
Rejected  
Draft Credits  
Posted Credits  
Invoice Corrections  
Refunds  
Customer Service Requests

A Finance user opening a request sees:

Customer  
Case  
Complaint  
Order  
Delivery  
Invoice  
Invoice lines  
Product  
Quantity  
Original value  
Requested credit  
Previous credits  
Reason  
Attachments  
Customer history  
Approval history

Links must open the underlying records.

---

# 39. DRAFT CREDIT NOTE

When appropriate, generate a draft credit transaction referencing:

- original invoice
- customer
- affected lines
- Customer Case
- Credit Request
- reason

Status:

**Draft, Pending Approval**

It must not affect posted accounting balances.

It must not be treated as issued to the customer.

It must not post automatically merely because Customer Service requested it.

---

# 40. CREDIT APPROVAL

Configurable approval policy.

Example:

Up to £100:
Customer Service Manager approval.

£100 to £1,000:
Finance approval.

£1,000 to £5,000:
Finance Manager.

Above £5,000:
Finance Director.

This is illustrative.

Do not hard-code values.

Allow rules using:

- amount
- percentage of invoice
- customer
- reason
- business unit
- credit type
- role

---

# 41. CREDIT APPROVAL ACTIONS

Approver can:

Approve  
Reject  
Return for Information  
Amend within permission  
Escalate

Require comments for:

Reject  
Amend  
Exceptional override

Keep full approval history.

---

# 42. CREDIT POSTING

After approval:

The draft remains available for authorised Finance posting.

Possible configurable policy:

**Manual Post**

Finance must choose Post.

Or:

**Auto Post After Final Approval**

Only if the company explicitly configures this.

Default to manual Finance posting.

Posting must use Atlas Finance's canonical credit-note accounting process.

Never implement accounting entries directly in Customer Service.

---

# 43. CREDIT DOCUMENT FLOW

The Case should show:

Complaint
→ Credit Request
→ Approval
→ Draft Credit Note
→ Posted Credit Note
→ Customer Account

All references remain linked.

---

# 44. RETURNS

From the Case select:

**Create Return**

Select from actual delivered products.

Fields:

Sales Order  
Delivery  
Product  
Quantity delivered  
Quantity to return  
Lot/batch  
Reason  
Condition  
Return location

Creates an RMA / return record.

---

# 45. RETURN LIFECYCLE

Suggested:

Requested  
Authorised  
Awaiting Customer Return  
In Transit  
Received  
Inspection  
Disposition  
Completed  
Cancelled

Inventory movement only occurs through Atlas Inventory/Logistics.

Do not directly increment stock when Customer Service clicks Return.

---

# 46. RETURN DISPOSITION

Upon receipt:

Restock  
Quarantine  
Quality inspection  
Rework  
Repair  
Scrap  
Return to supplier  
Other

Require appropriate permissions.

---

# 47. REPLACEMENT

For a replacement remedy:

Create a linked draft replacement Sales Order or replacement fulfilment record using existing Sales architecture.

Reference:

Case  
Original order  
Original product  
Original delivery

Possible replacement pricing:

Free of charge  
Partial charge  
Normal charge

Do not simply insert free stock movements.

Use the canonical Sales/Logistics process.

---

# 48. SHORT DELIVERY

If the complaint is:

Missing/Short Delivery

allow:

Reship missing quantity  
Credit missing quantity  
Investigate Logistics  
Reject claim  
Other

Reship should generate a properly linked fulfilment requirement/replacement order according to Atlas architecture.

---

# 49. DISCOUNT ON NEXT ORDER

This should not be handled as a free-text note.

Create a controlled:

**Service Recovery Discount**

Fields:

Customer  
Case  
Type:
Percentage  
Fixed amount  
Free freight  
Free item  
Other

Value  
Maximum discount  
Valid from  
Expiry  
Eligible products  
Excluded products  
Minimum order value  
Usage limit  
Approval status

Default usage limit:

1

Configurable.

---

# 50. SERVICE RECOVERY DISCOUNT WORKFLOW

Customer Service proposes:

10% off next order.

Depending on policy this may route to:

Sales Manager  
Finance  
Commercial Manager

Once approved it becomes:

**Available Customer Recovery**

When a new Sales Order is created for that customer, Atlas should show:

> Customer has an approved service recovery benefit available from Case CS-00128.

Sales can:

Apply

or, if policy allows:

Defer.

Do not silently alter the customer price list.

---

# 51. REDEMPTION

When used:

Record:

Sales Order  
Date  
Value used  
User  
Remaining uses

Then mark recovery benefit:

Redeemed

or:

Partially Redeemed

as appropriate.

The original Case remains linked.

---

# 52. GOODWILL

Support goodwill that is not tied directly to invoiced product value.

Examples:

£50 goodwill account credit  
Free freight  
Free product  
Discount on future order

Still require an appropriate approval path.

Do not disguise goodwill as product-return credit.

---

# 53. TOTAL COST OF COMPLAINT

Calculate complaint cost where information is available.

Components may include:

Credit notes  
Replacement product cost  
Replacement freight  
Return freight  
Scrap  
Rework  
Labour  
Third-party costs  
Goodwill

Show:

**Total Cost of Complaint**

Do not invent unavailable costs.

Label estimated and actual cost separately.

---

# 54. CSAT

Move CSAT properly into Customer Service.

Do not leave it as an isolated page with disconnected scores.

A CSAT response must relate back to:

- Case
- Customer
- Contact
- Agent
- Team
- Case type
- Product where relevant
- Date

---

# 55. CSAT SURVEY

Default simple survey:

**How satisfied were you with the support you received?**

1 to 5

Optional:

Comment

Possible labels:

1 Very dissatisfied  
2 Dissatisfied  
3 Neutral  
4 Satisfied  
5 Very satisfied

Allow administrators to configure wording.

Do not create huge surveys as the default.

---

# 56. CSAT TRIGGER

Typical rule:

Send when Case becomes Resolved or Closed.

Configurable delay.

Example:

30 minutes  
4 hours  
1 day

Allow suppression:

- duplicate contact
- no email/communication method
- case category excluded
- customer opted out
- survey sent recently

---

# 57. CSAT INTEGRITY

Customer responses should be immutable by normal agents.

Agents may not edit a bad score.

Managers may mark:

Invalid  
Spam  
Duplicate

with an audit reason.

Original response remains stored.

---

# 58. CSAT METRICS

Report:

Average CSAT  
% satisfied  
Response rate  
CSAT by agent  
CSAT by team  
CSAT by customer  
CSAT by product  
CSAT by case category  
CSAT trend

Allow drill-through to Cases.

Avoid ranking employees from tiny sample sizes without context.

---

# 59. CSAT AND SERVICE CORRELATION

Allow analysis such as:

CSAT vs response time  
CSAT vs resolution time  
CSAT vs SLA breach  
CSAT vs complaint type  
CSAT vs credit/remedy

Present correlations as observations, not proof of causation.

---

# 60. KNOWLEDGE BASE

Provide or reuse Atlas Knowledge capability.

Articles may be:

Internal  
Customer-facing  
Team-specific

Fields:

Title  
Category  
Content  
Keywords  
Products  
Status  
Version  
Owner  
Last reviewed

From a Case or Ticket show relevant articles.

Do not force an AI feature.

Simple search and good tagging matter first.

---

# 61. CANNED RESPONSES / MACROS

Support reusable actions.

Examples:

Request photographs  
Delivery investigation response  
Credit awaiting approval  
Replacement confirmed  
Case resolved

A macro may:

- insert text
- change status
- set category
- assign team
- create task

Require sensible permissions.

---

# 62. CUSTOMER SERVICE DASHBOARD

Headline measures:

Open Cases  
New Today  
Urgent  
SLA At Risk  
SLA Breached  
Awaiting Internal  
Average First Response  
Average Resolution  
CSAT  
Complaint Cost

Operational sections:

My Work  
Unassigned  
Overdue  
High Severity  
Finance Waiting  
Quality Waiting  
Recent Poor CSAT

Trends:

Cases by category  
Complaints by product  
Complaints by root cause  
Service performance  
CSAT trend

Keep dashboard focused.

---

# 63. CUSTOMER SERVICE REPORTING

Useful metrics:

Case volume  
Complaint rate  
First response  
Resolution time  
SLA attainment  
Reopen rate  
Backlog  
Ageing  
CSAT  
Query turnaround  
Credit requested  
Credit approved  
Complaint cost  
Returns  
Replacement rate  
Product complaint rate  
Delivery complaint rate

Allow filters.

---

# 64. TICKETS APP

Create a separate top-level Atlas application:

**Tickets**

This is the internal service-management system.

It must not be an IT-only tool.

It should support any team.

---

# 65. TICKETS NAVIGATION

Suggested:

Overview  
My Tickets  
All Tickets  
Queues  
Service Catalogue  
Approvals  
Problems  
Changes  
Knowledge  
Reports  
Settings

Do not show irrelevant IT concepts to teams that do not use them.

Use configurable modules/features where sensible.

---

# 66. TICKET MODEL

Core fields:

Ticket reference  
Title  
Description  
Requester  
Requester department  
Requested for  
Team  
Queue  
Assignee  
Type  
Category  
Subcategory  
Service  
Priority  
Impact  
Urgency  
Status  
SLA  
Due date  
Attachments  
Linked Assets  
Linked Records  
Queries  
Parent Ticket  
Child Tickets  
Approvals  
Resolution

---

# 67. TICKET TYPES

Support configurable ticket types.

Suggested defaults:

Incident  
Service Request  
Task  
Problem  
Change  
Access Request

Do not require every team to use all types.

Examples:

IT:
Incident, Service Request, Access, Problem, Change.

Finance:
Service Request, Task.

HR:
Request, Task.

Customer Service:
Internal Service Request.

---

# 68. TICKET PRIORITY

Support either direct priority or an impact/urgency matrix.

Example:

Impact:

Individual  
Team  
Department  
Business

Urgency:

Low  
Normal  
High  
Immediate

Atlas calculates suggested priority.

Allow authorised override.

Store reason.

---

# 69. TICKET STATUS

Suggested:

New  
Assigned  
In Progress  
Pending Requester  
Pending Internal  
Pending External  
Resolved  
Closed  
Cancelled

Problem/Change may require specialised statuses.

---

# 70. SERVICE CATALOGUE

Create a configurable Service Catalogue.

Examples:

## IT

Password reset  
New software  
Hardware issue  
Access request  
New starter setup  
Printer problem  
System outage

## Finance

Invoice query  
Supplier setup  
Expense issue  
Payment query

## HR

Employee data change  
Policy question  
New starter  
Leaver

## Facilities

Building issue  
Access card  
Furniture  
Cleaning

Each catalogue item can define:

- owning team
- form fields
- SLA
- approval
- workflow
- priority default
- required attachments

---

# 71. DYNAMIC REQUEST FORMS

Do not create one huge generic form.

A request type can define custom fields.

Example:

**Software Access Request**

System  
Access level  
Business reason  
Manager

Example:

**Building Maintenance**

Location  
Issue type  
Safety risk  
Photograph

Store form definition/version so historical tickets remain understandable.

---

# 72. TICKET QUEUES

Every team can have queues.

Examples:

IT Support  
Infrastructure  
Finance Queries  
Payroll  
HR  
Facilities  
Quality  
Customer Service Operations

Allow automatic routing.

---

# 73. ASSIGNMENT

Tickets can be:

Unassigned  
Assigned to queue  
Assigned to user

Support:

manual assignment  
round-robin later  
skills routing later  
workload-based routing later

Do not overbuild complex AI routing initially.

---

# 74. TICKET TIMELINE

Timeline should include:

Created  
Assigned  
Status changed  
Comments  
Requester messages  
Internal notes  
Queries  
Approvals  
Attachments  
Resolution

Clearly distinguish:

**Requester-visible**

from:

**Internal**

---

# 75. CHILD TICKETS

Allow a Ticket to create child tickets.

Example:

New Starter

creates:

IT Setup  
Facilities Access  
Payroll Setup

Parent remains open until configured dependencies complete.

---

# 76. TICKET QUERIES

Tickets can create Queries exactly as Cases can.

Example:

IT Ticket requires purchase approval.

Create Procurement Query.

Procurement responds.

Ticket timeline updates automatically.

---

# 77. CUSTOMER SERVICE AND TICKETS RELATIONSHIP

Do not merge the two apps.

Customer-facing complaints belong in Customer Service.

Internal work belongs in Tickets.

However:

A Customer Case can create a Ticket.

Example:

Customer reports portal inaccessible.

Case:

CS-00121

creates IT Ticket:

TKT-00451

The Case remains customer-facing.

The Ticket is internal technical work.

Both remain linked.

---

# 78. TICKET TO CASE

If an internal Ticket reveals a customer-facing impact, authorised users can create/link a Customer Case.

Example:

System outage caused 25 customer orders to fail.

The internal IT incident remains separate from individual customer cases.

---

# 79. INCIDENT MANAGEMENT

For Incident tickets support:

Affected service  
Impact  
Start time  
Detection source  
Outage status  
Workaround  
Resolution

Allow multiple tickets to link to a master incident/problem.

---

# 80. PROBLEM MANAGEMENT

A Problem groups recurring incidents around an underlying cause.

Fields:

Problem statement  
Known symptoms  
Affected services  
Known error  
Workaround  
Root cause  
Resolution

Allow Tickets to link to a Problem.

Do not force every Incident into Problem Management.

---

# 81. CHANGE MANAGEMENT

Provide a practical Change record.

Fields:

Change description  
Reason  
Risk  
Impact  
Implementation plan  
Rollback plan  
Testing plan  
Schedule  
Approver  
Status

Types:

Standard  
Normal  
Emergency

Do not build a bloated ITIL simulator.

Use this where the business needs controlled changes.

---

# 82. APPROVALS

Tickets can require approvals.

Examples:

Software purchase  
System access  
Hardware purchase  
Finance exception  
HR request

Approval definition may depend on:

- requester
- team
- value
- request type
- manager
- role

Show approval history.

---

# 83. ASSET LINKS

Where Atlas has Assets/Equipment:

Tickets may link to:

Laptop  
Printer  
Machine  
Vehicle  
Building asset  
Software/service

Show previous Tickets for that asset.

Do not create a duplicate asset database.

---

# 84. EMAIL TO TICKET

Design for team mailbox intake.

Examples:

it@company  
financequeries@company

Incoming email may create:

Ticket

or append to an existing Ticket using reference/thread matching.

Use Atlas's existing email infrastructure where possible.

Do not implement another mailbox synchronisation engine unnecessarily.

---

# 85. REQUESTER PORTAL

Architect Tickets so a future/internal portal can support:

Create request  
View my requests  
Add comment  
Upload attachment  
See status  
See approvals

Implement only if Atlas already has an appropriate portal framework or scope permits.

Do not block core Tickets on portal work.

---

# 86. TICKET SLA

Reuse the same SLA engine as Customer Service.

Example:

IT P1 incident:

Response: 15 minutes  
Update: 30 minutes  
Resolution target: 4 hours

Finance request:

Response: 4 business hours  
Resolution: 2 business days

Team-specific policies.

---

# 87. TICKET DASHBOARD

Headline:

Open Tickets  
Unassigned  
At Risk  
Breached  
Resolved Today  
Average Resolution

Views:

My Work  
Team Work  
Urgent  
Oldest  
Pending Requester  
Pending Internal  
Approvals

Trends:

Volume  
SLA  
Resolution  
Category  
Requester department

---

# 88. CROSS-APP SEARCH

Atlas global search should find:

Case  
Ticket  
Query  
Credit Request  
RMA

Searchable fields:

reference  
customer  
requester  
subject  
order  
invoice  
product  
PO  
email where permitted

Respect permissions.

---

# 89. LINKED WORK PANEL

Every Case/Ticket/Query should have:

**Linked Work**

Example:

Case CS-00121

Queries:
QRY-00141 Finance
QRY-00142 Quality

Tickets:
TKT-00482 IT

Credits:
CR-00129

Return:
RMA-00342

Quality:
NC-00311

This gives a coherent case graph.

---

# 90. RELATIONSHIP GRAPH / DOCUMENT FLOW

Where practical provide a visual flow.

Example:

Customer
↓
Sales Order
↓
Delivery
↓
Case
├─ Quality NCR
├─ Finance Query
└─ Credit Request
   ↓
Finance Approval
   ↓
Credit Note

This should be navigable.

Do not create a visual simply for decoration.

---

# 91. DUPLICATE DETECTION

Help users avoid duplicate cases/tickets.

When creating a Case, show possible matches using:

Customer  
Product  
Order  
Similar open subject  
Recent cases

When creating Ticket:

Requester  
Service  
Asset  
Similar open ticket

Do not auto-merge without user action.

---

# 92. MERGE

Authorised users should be able to merge duplicate cases/tickets.

Preserve:

timeline  
attachments  
links  
audit trail  
original references

Redirect/search old reference to merged record.

---

# 93. REOPEN

Resolved work can reopen.

Store:

original resolution  
reopened time  
reason  
reopened by

Do not simply overwrite resolution history.

---

# 94. ATTACHMENTS

Cases, Tickets and Queries need attachments.

Examples:

Photos  
Documents  
POD  
Invoice  
Screenshots

Use existing Atlas file storage.

Do not store large binary files directly in inappropriate database columns.

---

# 95. SECURITY

Permissions must support:

Customer Service Agent  
Customer Service Manager  
IT Agent  
IT Manager  
Finance User  
Finance Approver  
Quality User  
HR  
Operations  
Administrator

Sensitive queues may require restricted access.

Example:

HR Ticket must not be visible to general IT users.

Finance attachments may be restricted.

Secure backend APIs, not just UI navigation.

---

# 96. DATA PRIVACY

Service records may contain personal or confidential information.

Support:

access control  
audit  
appropriate retention architecture  
attachment security

Do not leak customer or employee service data through global search.

---

# 97. AUDIT

Audit important actions.

Including:

Case changes  
Ticket changes  
Query changes  
Assignments  
Priority changes  
SLA overrides  
Financial remedy requests  
Approval decisions  
Credit posting references  
Returns  
Discount approvals  
CSAT invalidation  
Merges  
Reopens

Store:

actor  
timestamp  
old value  
new value  
reason where appropriate

---

# 98. NOTIFICATIONS

Useful notifications:

New assignment  
Urgent Case  
SLA warning  
SLA breach  
Query answered  
Credit approved/rejected  
Return received  
Customer replied  
Ticket approval required  
Ticket reopened

Prevent notification overload.

---

# 99. SERVICE ANALYTICS

Provide cross-service reporting without merging semantics.

Customer Service:

Complaints and customer outcomes.

Tickets:

Internal service performance.

Queries:

Cross-department turnaround.

Global Service:

Overall workload and SLA where useful.

---

# 100. QUERY PERFORMANCE

Measure:

Queries opened  
Queries answered  
Average turnaround  
SLA attainment  
Queries by department  
Queries by source  
Oldest unresolved

This will highlight departments causing delays to customer resolution.

---

# 101. CUSTOMER COMPLAINT COST ANALYTICS

Report:

Complaint cost by:

Customer  
Product  
Product family  
Root cause  
Site  
Carrier  
Batch  
Month

Split:

Credit  
Replacement  
Freight  
Return  
Scrap  
Other

This connects Customer Service to real business cost.

---

# 102. PRODUCT QUALITY FEEDBACK

From Product screens show:

Complaint count  
Complaint rate  
Open complaints  
Complaint cost  
Common complaint categories  
Affected batches  
CSAT

Allow navigation to Customer Service.

Do not duplicate Case records in Products.

---

# 103. SALES ORDER FEEDBACK

Sales Order should show:

Cases  
Complaints  
Returns  
Credits  
Service recovery

Example smart links:

Cases 2  
Credits 1  
Returns 1

---

# 104. FINANCE FEEDBACK

Invoice should show:

Disputes  
Cases  
Credit requests  
Credit notes

Credit Note should show:

Originating Case  
Credit Request  
Approval history

---

# 105. QUALITY FEEDBACK

Quality record should show linked customer complaints.

Customer Case shows current Quality/RCA status.

Keep source ownership intact.

---

# 106. ROOT-CAUSE TAXONOMY

Allow configurable root causes.

Example:

Manufacturing  
Raw material  
Packaging  
Warehouse  
Transport  
Customer error  
Sales entry  
Planning  
Supplier  
Documentation  
Pricing  
System  
Unknown

Subcategories should be supported.

Avoid forcing a root cause before investigation is complete.

---

# 107. RESOLUTION CODES

Create structured resolution codes.

Examples:

Information provided  
Customer error  
Replacement sent  
Credit issued  
Refund issued  
Return processed  
Price corrected  
Delivery completed  
Quality corrective action  
No fault found  
Claim rejected  
Goodwill provided

Combine structured reporting with free-text resolution notes.

---

# 108. KNOWLEDGE FROM RESOLUTION

Allow resolved Cases/Tickets to suggest creation of a Knowledge article.

Do not automatically publish case content.

An authorised user must review/edit the article.

---

# 109. EVENT ARCHITECTURE

Use existing Atlas domain-event infrastructure if present.

Conceptual events:

customer.case.created  
customer.case.updated  
customer.case.assigned  
customer.case.resolved  
customer.case.reopened  
service.query.created  
service.query.resolved  
ticket.created  
ticket.assigned  
ticket.resolved  
credit.request.created  
credit.request.approved  
credit.request.rejected  
finance.credit.posted  
return.created  
return.received  
replacement.created  
service.recovery.approved  
service.recovery.redeemed  
csat.sent  
csat.received

Do not tightly couple UI components to other app database tables.

---

# 110. FINANCIAL IDEMPOTENCY

This is critical.

Repeated processing must never create duplicate credits.

Use:

unique source references  
idempotency keys  
transaction protection

A Credit Request must not generate two posted Credit Notes because a request/API event was retried.

---

# 111. INVENTORY TRANSACTION SAFETY

Returns and replacements must use canonical Inventory/Logistics services.

Do not:

UPDATE stock = stock + return_quantity

from Customer Service.

Use proper stock transactions and locations.

---

# 112. CONCURRENCY

Protect:

Case edits  
Ticket assignment  
Query assignment  
Credit approval  
Return processing

Use Atlas's existing optimistic locking/version strategy where possible.

Show stale edit conflict rather than silently overwriting important changes.

---

# 113. PERFORMANCE

Plan for:

large Case history  
large Ticket history  
millions of timeline events  
many attachments  
many Sales Orders

Do not query every related module individually per table row.

Use appropriate summaries/read models.

Avoid N+1 queries.

Virtualise large queues where appropriate.

---

# 114. TESTING

Use focused testing during development.

Do not repeatedly run the entire Atlas suite after tiny edits.

Core tests must cover:

1. Create Case
2. Customer/order lookup
3. Product derived from Order
4. Delivery link
5. Create Query from Case
6. Resolve Query and update Case
7. Create Ticket
8. Create Query from Ticket
9. SLA calculation
10. Business-hours SLA
11. SLA pause
12. SLA breach
13. Queue routing
14. Credit request
15. Credit approval
16. Credit rejection
17. No duplicate credit
18. Draft credit cannot post without permission
19. Return creation
20. Inventory return flow
21. Replacement flow
22. Recovery discount approval
23. Recovery discount redemption
24. CSAT trigger
25. CSAT immutability
26. Ticket approval
27. Child tickets
28. Permissions
29. Merge
30. Reopen

---

# 115. COMPLAINT ACCEPTANCE SCENARIO

Customer reports:

"250 pipes from my recent delivery are broken."

Agent:

1. Opens Customer Service.
2. Creates Case.
3. Selects Customer.
4. Atlas displays recent Orders.
5. Selects Sales Order.
6. Selects Product.
7. Selects Delivery.
8. Enters affected quantity 250.
9. Uploads photographs.
10. Selects category Product Damage.
11. Creates Quality Query.
12. Creates Logistics Query if required.
13. Requests credit for 250 units.

Atlas must:

- retain all relationships
- show order/product/delivery context
- route Queries
- create a Credit Request
- create/prepare draft credit according to Finance architecture
- prevent posting until approved
- return approval status to the Case
- record final remedy
- calculate complaint cost when known
- send CSAT on resolution if policy says so

---

# 116. NEXT ORDER DISCOUNT ACCEPTANCE SCENARIO

Customer complains about poor service.

Agent proposes:

10% discount on next Sales Order.

Atlas:

1. Creates Service Recovery request.
2. Routes approval.
3. Approval granted.
4. Stores eligibility and expiry.
5. Customer places next Order.
6. Sales sees available recovery.
7. Applies it.
8. Pricing engine applies controlled discount.
9. Recovery record links to new Order.
10. Case shows Redeemed.

Do not permanently modify the customer's standard price list.

---

# 117. INTERNAL IT TICKET ACCEPTANCE SCENARIO

Employee reports:

"Cannot access ERP."

Atlas:

1. Creates TKT reference.
2. Routes to IT.
3. SLA starts.
4. IT assigns agent.
5. Agent logs investigation.
6. If Finance permissions are required, IT creates Query to Finance or relevant owner.
7. Query resolves.
8. IT resolves Ticket.
9. Requester receives resolution.
10. SLA and timeline remain auditable.

---

# 118. CROSS-APP ACCEPTANCE SCENARIO

Customer reports online portal failure.

Customer Service Case:

CS-00120

Customer Service creates:

IT Ticket TKT-00451

IT creates:

Development Query QRY-00582

Developer response resolves Query.

IT resolves Ticket.

Customer Service receives automatic update.

Agent responds to customer and resolves Case.

CSAT is sent.

All records retain separate ownership and linked history.

---

# 119. MIGRATION

Where current Customer Service or CSAT data exists:

Preserve it.

Map existing:

complaints  
cases  
CSAT  
activities  
queries

to the new architecture.

Do not discard historical data because the structure is changing.

Create safe migrations.

---

# 120. IMPLEMENTATION ORDER

Recommended:

Phase 1:
Shared service-work infrastructure and Query integration.

Phase 2:
Customer Case model and Customer Service workspace.

Phase 3:
Order/Product/Delivery integration.

Phase 4:
Queues, routing and SLA.

Phase 5:
Complaint investigation and Quality integration.

Phase 6:
Finance Credit Request and approval workflow.

Phase 7:
Returns, replacements and service recovery.

Phase 8:
CSAT.

Phase 9:
Tickets core.

Phase 10:
Service Catalogue and approvals.

Phase 11:
Ticket Problem/Change extensions.

Phase 12:
Dashboards/reporting.

Phase 13:
Migration/hardening.

Do not stop after writing the plan.

Implement it.

---

# 121. DEFINITION OF DONE

Customer Service is complete when an agent can:

- receive a complaint
- identify the customer
- select their Order
- identify the affected Product
- identify the Delivery
- record evidence
- request internal investigation
- monitor those Queries
- issue an appropriate remedy request
- create a return/replacement where required
- request financial credit
- see Finance approval
- resolve the complaint
- collect CSAT
- report the actual cost/root cause

Tickets is complete when any department can:

- configure a service/request type
- receive a Ticket
- route it
- assign it
- track SLA
- collaborate internally
- create Queries
- request approvals
- resolve it
- report performance

Queries are complete when they can reliably connect departments while preserving the originating context.

---

# 122. FINAL QUALITY REVIEW

Review the build as:

Customer Service Agent  
Customer Service Manager  
Finance Approver  
Quality Manager  
IT Service Desk Agent  
Department Manager  
ERP Architect

Check specifically for:

- duplicated records
- disconnected CSAT
- complaints without Order context
- manual product typing when Atlas already knows the product
- financial credits bypassing Finance
- missing approval history
- returns incorrectly modifying stock
- Cases being reassigned to other departments rather than using Queries
- Tickets confused with Customer Cases
- weak SLA handling
- poor timeline usability
- excessive form complexity
- privacy leaks
- broken permissions
- duplicate credits
- bad auditability
- slow queue views

Fix meaningful issues before completion.

---

# 123. FINAL CODEX RESPONSE

When complete report:

## Built

Customer Service  
Tickets  
Queries changes

## Integration

Sales  
Orders  
Products  
Logistics  
Inventory  
Quality  
Finance  
CRM

## Finance

Credit-request and approval flow implemented.

## Service Recovery

Returns  
Replacements  
Discounts  
Other remedies

## CSAT

How it works and where it is linked.

## Ticketing

Teams, queues, SLAs, service catalogue and workflows.

## Data Model

Important entities and migrations.

## Testing

Checks performed and results.

## Remaining Gaps

Only genuine gaps.

Do not claim features that are not actually implemented.

Do not paste the entire source code in the answer.

The Atlas implementation is the deliverable.