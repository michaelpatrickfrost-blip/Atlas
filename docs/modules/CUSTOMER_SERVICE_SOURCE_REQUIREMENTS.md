# ATLAS CUSTOMER SERVICE

## Case Management, Complaints, Queries, Departmental Tickets, CSAT, SLAs, Knowledge and Customer Experience

# 1. PRODUCT VISION

Build Customer Service as a major Atlas operational domain.

It must not be:

```text
Customer emails us
↓
Agent replies
↓
Ticket closed
```

Atlas Customer Service must manage the complete customer-service lifecycle across the organisation.

It should handle:

- customer queries
- complaints
- order queries
- delivery issues
- invoice queries
- pricing queries
- product issues
- shortages
- damaged goods
- returns
- quality complaints
- technical enquiries
- export queries
- credit queries
- account queries
- service failures
- requests
- feedback
- compliments
- escalations
- internal departmental actions
- root cause
- corrective action
- CSAT
- NPS-style surveys
- customer effort surveys
- service analytics
- knowledge
- SLA management
- internal OLA management
- customer communication history

The objective is:

> Give Customer Service complete ownership of the customer experience while allowing the rest of the business to participate in resolving the problem without losing accountability.

---

# 2. CORE ARCHITECTURAL PRINCIPLE

The single biggest principle is:

# A CUSTOMER CASE IS NOT THE SAME THING AS AN INTERNAL WORK TICKET

Example:

Customer says:

> My invoice is wrong and I need this sorting urgently.

Atlas creates:

```text
CUSTOMER CASE
CASE-000882
```

Customer Service owns it.

Customer Service needs Finance to investigate.

Atlas creates:

```text
INTERNAL TICKET
FIN-00218
```

linked to:

```text
CASE-000882
```

Finance now has its own queue, ownership, due date and internal SLA.

But the customer does not suddenly become Finance's problem.

Customer Service remains responsible for:

```text
customer communication
overall case status
customer expectation
final resolution
```

Finance owns:

```text
internal investigation
financial correction
departmental response
```

This separation is critical.

Zendesk uses a similar parent/child ticket pattern for cross-team collaboration, including examples where Finance receives a separate child ticket while the originating support case remains intact.

---

# 3. CUSTOMER SERVICE DOMAIN

Create:

```text
CUSTOMER SERVICE
│
├── Service Home
├── My Work
├── Inbox
├── Cases
├── Queries
├── Complaints
├── Department Tickets
├── Queues
├── Escalations
├── Customer Feedback
├── CSAT
├── Surveys
├── Knowledge
├── Returns
├── Service Recovery
├── Root Cause
├── SLAs & OLAs
├── Service Quality
├── Automations
├── Templates
├── Reports
└── Administration
```

Do not expose all configuration to normal agents.

---

# 4. CORE OBJECT MODEL

Use:

```text
CUSTOMER
    │
    ▼
CASE
    │
    ├── Conversation
    ├── Activity
    ├── Linked ERP Records
    ├── Internal Tickets
    ├── Tasks
    ├── SLA
    ├── Root Cause
    ├── Resolution
    └── Feedback
```

A case is the authoritative record of a customer-service incident.

Dynamics similarly treats the case as the central record for an issue through intake, activity, routing and resolution.

---

# 5. CASE TYPES

Support configurable types.

Defaults:

```text
QUERY

COMPLAINT

ORDER_QUERY

DELIVERY_QUERY

INVOICE_QUERY

CREDIT_QUERY

PRODUCT_QUERY

QUALITY_COMPLAINT

SHORTAGE

DAMAGED_GOODS

RETURN

PRICING_QUERY

ACCOUNT_QUERY

EXPORT_QUERY

TECHNICAL_QUERY

REQUEST

FEEDBACK

COMPLIMENT

OTHER
```

Do not create separate databases for complaints and queries.

Use one Case engine with different workflows.

---

# 6. CASE SEVERITY VS PRIORITY

Keep separate.

## Priority

How urgently should we respond?

```text
CRITICAL
HIGH
NORMAL
LOW
```

## Severity

How serious is the underlying impact?

```text
SEV1
SEV2
SEV3
SEV4
```

Example:

```text
Customer cannot operate
→ Severity 1
```

but:

```text
Strategic customer
→ High Priority
```

These concepts may interact but must not be conflated.

---

# 7. CASE RECORD

Suggested:

```text
case

id
case_number

customer_id
contact_id

case_type_id
category_id
subcategory_id

subject
description

status
priority
severity

channel

owner_user_id
owner_team_id
queue_id

opened_at

first_response_at

resolved_at
closed_at

sla_policy_id

root_cause_id

resolution_code_id

customer_sentiment

created_by
created_at
updated_at
```

---

# 8. CASE STATUS

Default:

```text
NEW

TRIAGE

OPEN

IN_PROGRESS

WAITING_INTERNAL

WAITING_CUSTOMER

WAITING_SUPPLIER

RESOLVED

CLOSED

CANCELLED
```

Important:

```text
WAITING_INTERNAL
```

does not mean:

```text
Nobody owns this.
```

The Customer Service owner remains responsible.

---

# 9. RESOLVED VS CLOSED

Keep separate.

### Resolved

The business believes the issue has been fixed.

### Closed

Resolution accepted or closure policy completed.

Possible workflow:

```text
OPEN
↓
RESOLVED
↓
3 days
↓
CLOSED
```

Customer replying during the resolution period can:

```text
REOPEN
```

according to policy.

---

# 10. CASE CHANNELS

Support:

```text
EMAIL

PHONE

WEB FORM

CUSTOMER PORTAL

LIVE CHAT

MANUAL

SALES

INTERNAL

SOCIAL

API
```

Future channels should plug into the same case model.

---

# 11. AUTOMATIC EMAIL-TO-CASE

Inbound:

```text
customerservice@
orders@
accounts@
quality@
```

may create or update Cases.

Rules determine:

```text
customer
contact
case type
queue
priority
owner
```

Dynamics supports automatic record creation and routing from incoming activities such as email.

---

# 12. CONVERSATION THREAD

Each Case has one customer-facing timeline.

Example:

```text
10:22 Customer email
10:34 Michael replied
10:39 Finance ticket created
11:18 Finance responded internally
11:26 Michael replied to customer
```

Internal details and customer-visible communication must be distinguishable.

---

# 13. MESSAGE VISIBILITY

Every communication has:

```text
PUBLIC

INTERNAL
```

Public:

```text
customer can receive/see
```

Internal:

```text
employees only
```

Never rely on visual colour alone to indicate this.

---

# 14. INTERNAL NOTES

Agents can write:

```text
Internal Note
```

without customer receiving it.

Use cases:

```text
Need Finance review.

Customer has called three times.

Awaiting planner confirmation.
```

---

# 15. SIDE CONVERSATIONS

Allow separate internal/external collaboration threads linked to Case.

Example:

```text
CUSTOMER THREAD

SIDE CONVERSATION:
Supplier ABC

SIDE CONVERSATION:
Finance
```

Zendesk uses a comparable side-conversation concept to keep additional internal or external discussions organised without cluttering the primary customer conversation.

---

# 16. DEPARTMENT TICKETS

This is a major Atlas feature.

Create:

```text
department_ticket
```

A Department Ticket is:

> A formal piece of internal work required to resolve a customer case.

Example:

```text
CASE-882
Customer charged incorrectly
```

creates:

```text
FIN-221
Investigate invoice INV-992
```

and perhaps:

```text
SALES-188
Confirm agreed pricing
```

Both sit beneath one customer Case.

---

# 17. PARENT/CHILD STRUCTURE

```text
CASE-882

Customer:
ABC Ltd

Issue:
Incorrect invoice
│
├── FIN-221
│   Finance investigation
│
└── SALES-188
    Pricing confirmation
```

Customer Service can see:

```text
Finance      IN PROGRESS
Sales        COMPLETE
```

without manually chasing email trails.

---

# 18. DEPARTMENT TICKET TYPES

Examples:

```text
FINANCE_QUERY

CREDIT_QUERY

PRICE_CHECK

ORDER_CHECK

STOCK_CHECK

DELIVERY_INVESTIGATION

POD_REQUEST

QUALITY_INVESTIGATION

PRODUCTION_QUERY

PROCUREMENT_QUERY

SUPPLIER_QUERY

TECHNICAL_REVIEW

RETURN_AUTHORISATION

MANAGEMENT_APPROVAL
```

Configurable.

---

# 19. DEPARTMENT QUEUES

Examples:

```text
Customer Service

Finance

Credit Control

Sales

Planning

Warehouse

Transport

Quality

Manufacturing

Procurement

Technical

Management
```

Each can have:

```text
members
operating hours
priority
routing rules
capacity
OLA
```

Dynamics similarly uses queues to centralise work and route cases/tasks to teams based on business area, product, geography or other classifications.

---

# 20. INTERNAL OWNERSHIP

Example:

```text
CASE OWNER
Michael
Customer Service
```

Department ticket:

```text
FINANCE OWNER
Donna
```

Two different responsibilities.

Do not reassign the whole customer Case simply because Finance is needed.

---

# 21. INTERNAL OLA

Customer-facing SLA:

```text
Resolve complaint:
48 hours
```

Internal dependency may require:

```text
Finance response:
8 working hours
```

This is an:

# OLA

Operational Level Agreement.

Zendesk explicitly supports separate group SLAs for internal teams, distinct from the external ticket SLA.

---

# 22. OLA EXAMPLE

Case SLA:

```text
Resolution due:
Tomorrow 14:00
```

Finance ticket:

```text
Finance response due:
Today 12:00
```

Why?

Because Customer Service needs time after Finance replies to update the customer.

Atlas should calculate internal dependency deadlines backwards from the customer commitment where appropriate.

---

# 23. DEPARTMENT TICKET STATUS

```text
NEW

QUEUED

ASSIGNED

IN_PROGRESS

WAITING

COMPLETE

REJECTED

CANCELLED
```

Completion requires:

```text
outcome
```

not merely status change.

---

# 24. DEPARTMENT RESPONSE

Finance completing ticket should provide:

```text
Outcome

Customer-safe response

Internal notes

ERP changes made

Attachments
```

Example:

```text
Invoice was raised using superseded pricing.

Credit note CN-882 created.

Corrected invoice INV-992-R generated.
```

Customer Service sees that immediately.

---

# 25. CUSTOMER-SAFE SUMMARY

Important feature.

Department response can contain:

```text
INTERNAL DETAIL

Customer-safe summary
```

Example internal:

> Sales incorrectly maintained the price list.

Customer-safe:

> We identified a pricing discrepancy and have corrected the invoice.

This makes cross-team support much smoother.

---

# 26. LINKED ERP RECORDS

Case can link directly to:

```text
Customer

Contact

Sales Order

Order Line

Product

Shipment

Delivery

POD

Invoice

Credit Note

Payment

Return

Batch

Production Order

Purchase Order

Supplier

Quality Record
```

Use generic typed links rather than hundreds of nullable columns.

---

# 27. ORDER-BASED CASE CREATION

From Sales Order:

```text
SO-882
```

button:

```text
Create Case
```

Atlas automatically links:

```text
customer
order
order lines
ship-to
salesperson
```

User chooses:

```text
Delivery query
Product query
Pricing issue
Other
```

---

# 28. DELIVERY-BASED CASE

From Shipment:

```text
SH-192
```

Create:

```text
Delivery Complaint
```

Automatically link:

```text
shipment
load
carrier
delivery
POD
products
```

---

# 29. INVOICE-BASED CASE

From Invoice:

```text
INV-991
```

Create:

```text
Invoice Query
```

Finance gets relevant context without the Customer Service agent copying invoice details into an email.

---

# 30. CUSTOMER TIMELINE

Customer record should show:

```text
ORDERS

INVOICES

DELIVERIES

CASES

COMPLAINTS

RETURNS

CSAT

CONTACTS
```

in one chronological activity stream.

---

# 31. CUSTOMER SERVICE 360

When customer calls:

```text
ABC LTD

Account Status
Active

Open Orders
7

Late Orders
1

Outstanding Balance
£88,420

Open Cases
2

Last Delivery
Yesterday

CSAT
4.6 / 5
```

Then:

```text
RECENT ACTIVITY

Today
Called regarding invoice

Yesterday
Shipment delivered

29 Sep
Case closed
```

One workspace.

---

# 32. AGENT WORKSPACE

Customer Service Agent screen:

```text
┌──────────────────────────────────────────────┐
│ CASE-882      Invoice Complaint       HIGH │
├───────────────────────┬──────────────────────┤
│                       │ CUSTOMER             │
│ CONVERSATION          │                      │
│                       │ ABC Ltd              │
│                       │                      │
│                       │ Open orders     7    │
│                       │ Open cases      2    │
│                       │ Balance     £88k    │
│                       │                      │
├───────────────────────┴──────────────────────┤
│ Order  SO-1882     Invoice INV-299          │
│ Finance ticket FIN-219    IN PROGRESS       │
└──────────────────────────────────────────────┘
```

No bouncing between ten screens.

---

# 33. CONTEXT PANEL

Show:

```text
Customer

Contact

Orders

Deliveries

Invoices

Cases

Department Tickets

Knowledge

Tasks
```

Context should respond to Case type.

---

# 34. CASE TIMELINE

Unified:

```text
Customer communication

Internal notes

Status changes

Assignments

Department tickets

ERP events

Attachments

CSAT
```

Use clear filtering:

```text
All

Customer

Internal

System
```

---

# 35. CASE CLASSIFICATION

Hierarchy:

```text
TYPE
↓
CATEGORY
↓
SUBCATEGORY
↓
ROOT CAUSE
```

Example:

```text
Complaint
↓
Delivery
↓
Late Delivery
↓
Carrier Delay
```

Do not force Root Cause during initial triage.

Root Cause may only become known after investigation.

---

# 36. PRODUCT CLASSIFICATION

Case may relate to:

```text
one product
multiple products
product family
```

Useful for trend analysis.

---

# 37. CASE IMPACT

Capture:

```text
Quantity affected

Financial impact

Customer operational impact

Safety impact

Regulatory impact

Repeat issue
```

Use only where relevant.

---

# 38. COMPLAINT WORKFLOW

Potential flow:

```text
RECEIVED
↓
ACKNOWLEDGED
↓
INVESTIGATING
↓
ACTION_REQUIRED
↓
RESOLUTION_PROPOSED
↓
CUSTOMER_UPDATED
↓
RESOLVED
↓
CLOSED
```

Workflow configurable by Case type.

---

# 39. COMPLAINT ACKNOWLEDGEMENT

Track:

```text
received_at
acknowledged_at
```

and SLA:

```text
Acknowledgement target
```

Do not consider automated receipt necessarily equivalent to meaningful first response unless policy says so.

---

# 40. SLA ENGINE

Support multiple milestones per Case.

Examples:

```text
FIRST RESPONSE

ACKNOWLEDGEMENT

NEXT RESPONSE

RESOLUTION

CUSTOMER UPDATE
```

Salesforce and Dynamics both model time-dependent milestones such as first-response and resolution targets.

---

# 41. SLA POLICY

Can depend upon:

```text
customer

service level

case type

severity

priority

product

country

contract

channel
```

Example:

```text
Strategic Customer

Critical Complaint

First Response:
30 minutes

Resolution:
4 hours
```

---

# 42. BUSINESS HOURS

SLA calendars support:

```text
business days

working hours

bank holidays

regional holidays

24/7
```

Dynamics supports configurable work hours and pause/resume behaviour for SLA KPIs.

---

# 43. SLA PAUSE

Certain statuses may pause certain clocks.

Example:

```text
WAITING_CUSTOMER
```

may pause:

```text
Resolution SLA
```

but perhaps not:

```text
Customer Update SLA
```

Configuration must be milestone-specific.

---

# 44. SLA TIMER

Case should clearly show:

```text
FIRST RESPONSE
Met

NEXT UPDATE
1h 42m

RESOLUTION
11h 22m
```

Do not wait until SLA has already failed.

---

# 45. SLA WARNING

Policy:

```text
75% consumed
→ Warning
```

```text
90%
→ Escalate
```

```text
100%
→ Breached
```

---

# 46. SLA ESCALATION

Example:

```text
Resolution due in 30 mins
```

actions:

```text
notify owner

notify team leader

increase priority

add to escalation queue
```

---

# 47. ROUTING ENGINE

Create:

```text
ServiceRoutingEngine
```

Inputs:

```text
case type

category

customer

priority

severity

product

region

channel

required skill

queue availability

agent capacity
```

Output:

```text
queue

agent
```

Dynamics and Salesforce both support automated queue and capacity/availability based routing.

---

# 48. ROUTING RULE

Example:

```text
IF

Case Type = Invoice Query

AND

Customer Country = UK

THEN

Queue = Customer Service Finance Queries
```

---

# 49. SKILL-BASED ROUTING

Agent skills could include:

```text
French

Export

Technical Product

Drainage

Finance Queries

Key Accounts
```

A Case can require:

```text
French + Export
```

Future routing engine may prefer an available agent with both.

---

# 50. CAPACITY

Not every Case has equal weight.

Example:

```text
Simple query
1 capacity unit

Complex complaint
4

Live chat
2
```

Useful for automatic workload balancing.

Salesforce and Dynamics both incorporate agent capacity into work routing.

---

# 51. MANUAL PICK-UP

Queue may allow:

```text
Pick next
```

or:

```text
Open queue
```

and manually take Case.

Configuration determines team behaviour.

---

# 52. SERVICE INBOX

Agent home:

```text
MY WORK

NEW                         8
RESPONSE DUE                3
WAITING INTERNAL            6
WAITING CUSTOMER            4
AT RISK                     2
OVERDUE                     1
```

Then actual Cases.

---

# 53. TEAM QUEUE

Example:

```text
CUSTOMER SERVICE

Unassigned        18

Critical           1

High               4

SLA Risk            3

Oldest            2h 14m
```

---

# 54. SUPERVISOR BOARD

Show:

```text
Queue volume

Open Cases

Unassigned Cases

SLA risk

SLA breaches

Agent capacity

Oldest Case

Reopened Cases

Escalations
```

---

# 55. INTERNAL QUEUE VIEW

Finance:

```text
CUSTOMER SERVICE REQUESTS

NEW                     5

DUE TODAY               7

OVERDUE                 1

Waiting Information     3
```

Finance does not need full Customer Service UI.

They see departmental work.

---

# 56. REQUEST INFORMATION

Finance can reply:

```text
Need PO number.
```

Department Ticket status:

```text
WAITING_INFORMATION
```

Customer Service receives:

```text
Finance requires additional information.
```

Case remains visible.

---

# 57. INTERNAL DEPENDENCY VIEW

Case:

```text
DEPENDENCIES

Finance         IN PROGRESS     Due 11:00

Quality         COMPLETE        09:42

Transport       WAITING         Due 13:00
```

This should be exceptionally clear.

---

# 58. CUSTOMER UPDATE CADENCE

Case may require:

```text
Update customer every 24 hours
```

even if no resolution exists.

Atlas tracks:

```text
last_customer_update
next_update_due
```

This is critical for good complaint handling.

---

# 59. NO-CHANGE UPDATE

Customer update can explicitly say:

> Investigation is still in progress.

Atlas should treat a meaningful update as satisfying update cadence.

---

# 60. ESCALATION

Escalation can be:

```text
OPERATIONAL

MANAGEMENT

CUSTOMER

COMMERCIAL

QUALITY

LEGAL
```

where organisation requires.

---

# 61. ESCALATION LEVEL

Example:

```text
L0 Normal

L1 Team Leader

L2 Manager

L3 Director
```

Do not hard-code titles.

---

# 62. ESCALATION TRIGGERS

Could include:

```text
SLA risk

SLA breach

high financial impact

strategic customer

repeat complaint

multiple reopenings

customer escalation

safety issue

quality severity

manual escalation
```

---

# 63. ESCALATION RECORD

Store:

```text
reason

level

escalated_by

escalated_at

owner

response

deescalated_at
```

---

# 64. REOPENING

Track:

```text
reopen_count
```

and reason.

Repeated reopening is a major quality signal.

---

# 65. DUPLICATE CASE DETECTION

When new Case appears:

```text
Same customer

Same order

Same issue

within 24 hours
```

Atlas may suggest:

> This may relate to CASE-882.

Options:

```text
Merge

Link

Keep Separate
```

Never silently merge.

---

# 66. CASE MERGE

Preserve:

```text
original case number

original timeline

messages

attachments

audit
```

Merged Case links to surviving Case.

---

# 67. RELATED CASES

Cases may be:

```text
RELATED_TO

DUPLICATE_OF

CAUSED_BY

FOLLOW_UP_TO
```

---

# 68. MAJOR INCIDENT

Multiple customers can be affected by one underlying issue.

Example:

```text
Production problem
↓
42 customer orders affected
↓
18 customer cases
```

Create:

```text
service_incident
```

linked to Cases.

---

# 69. INCIDENT MODEL

Incident:

```text
INC-0028

225mm availability issue

Status:
Investigating

Affected customers:
18

Affected orders:
42
```

Customer Cases remain individual.

Incident provides common root context.

---

# 70. INCIDENT UPDATE

Incident update can draft updates to linked Cases.

Customer Service reviews before sending.

Avoid manually writing the same information 18 times.

---

# 71. MASS CUSTOMER UPDATE

Where authorised:

```text
18 affected customers

Send update
```

Use templates with customer/order personalisation.

Audit each resulting communication.

---

# 72. KNOWLEDGE BASE

Create:

```text
Knowledge
```

Types:

```text
Internal Article

Customer Article

Process Guide

Troubleshooting Guide

Product FAQ

Policy

Script
```

Dynamics and other mature service platforms use knowledge articles as a standard part of case resolution.

---

# 73. KNOWLEDGE ARTICLE

Fields:

```text
title

summary

content

category

products

audience

owner

status

effective_from

effective_to

version
```

---

# 74. KNOWLEDGE STATUS

```text
DRAFT

REVIEW

APPROVED

PUBLISHED

EXPIRED

ARCHIVED
```

---

# 75. ARTICLE SUGGESTION

Case:

```text
Invoice Query
```

Atlas may suggest:

```text
How to explain credit-note processing
```

based on:

```text
case classification

product

keywords
```

AI can improve ranking but must not invent policy.

---

# 76. INSERT KNOWLEDGE INTO REPLY

Agent can:

```text
Insert
```

relevant answer.

Allow editing before sending.

---

# 77. KNOWLEDGE FEEDBACK

Agent:

```text
Helpful
Not helpful
```

and customer article views/feedback can inform article quality.

---

# 78. MACROS / RESPONSE TEMPLATES

Create:

```text
service_macro
```

A macro can:

```text
insert response

set status

set classification

assign queue

create departmental ticket

set priority

add task
```

Zendesk combines macros, triggers and automations as service-workflow tools.

---

# 79. RESPONSE TEMPLATE

Example:

```text
DELIVERY INVESTIGATION

Thank customer

Confirm order

Explain investigation

Give next-update commitment
```

Do not make agents sound robotic.

Templates should be starting points.

---

# 80. PERSONAL TEMPLATES

Allow:

```text
My Replies
```

but company-approved templates should be identifiable.

---

# 81. AUTOMATIONS

Use same clear pattern as Atlas Projects:

```text
WHEN

IF

THEN
```

---

# 82. EXAMPLE AUTOMATION

```text
WHEN
Case created

IF
Type = Invoice Query

THEN
Create Finance Ticket
```

---

# 83. SLA AUTOMATION

```text
WHEN
Resolution SLA reaches 80%

THEN
Notify case owner
```

---

# 84. CUSTOMER AUTOMATION

```text
WHEN
Case resolved

THEN
Schedule CSAT survey
```

---

# 85. TIME AUTOMATIONS

Example:

```text
WHEN
Case has been waiting internal for 8 hours

IF
Department ticket incomplete

THEN
Escalate departmental ticket
```

---

# 86. CSAT

CSAT should be native.

Typical question:

```text
How satisfied were you with the support you received?
```

Scale may be:

```text
1–5
```

or simple:

```text
Positive
Negative
```

Zendesk uses a deliberately lightweight post-resolution CSAT flow because simple feedback requests can improve participation.

---

# 87. CSAT TRIGGERS

Survey can send:

```text
On case resolution

X hours after resolution

After delivery

After order completion

After return

After complaint closure

Manually
```

Dynamics Customer Voice similarly supports automatically sending surveys after a case is resolved and linking responses back to that Case.

---

# 88. SURVEY TYPES

Support:

```text
CSAT

CUSTOMER EFFORT

NPS-LIKE RELATIONSHIP SURVEY

DELIVERY SURVEY

ORDER EXPERIENCE

COMPLAINT EXPERIENCE

CUSTOM SURVEY
```

Do not force all feedback into CSAT.

---

# 89. SURVEY BUILDER

Questions:

```text
Rating

Scale

Multiple Choice

Text

Yes/No
```

Keep customer-facing surveys intentionally short.

---

# 90. CONDITIONAL QUESTIONS

Example:

```text
Rating <= 2

→

What could we have done better?
```

---

# 91. RESPONSE LINKING

Every response should know:

```text
customer

contact

case

order

shipment

agent

team

product

date
```

where applicable.

This enables meaningful analytics.

---

# 92. CSAT METRIC

Example:

```text
Satisfied responses
÷
Valid responses
```

Define certified company metric through Atlas Analytics.

Never allow every team to invent its own CSAT formula.

---

# 93. RESPONSE RATE

Track:

```text
Surveys sent

Delivered

Opened where known

Responses

Response rate
```

This is essential when reporting CSAT.

A 98% score from 3 responses means something very different from 98% across 500 responses.

---

# 94. CSAT DASHBOARD

Show:

```text
CSAT                94.2%

Response Rate       28.4%

Responses           242

Negative              14
```

Break down:

```text
Agent

Team

Case Type

Product

Customer

Region

Order Type

Delivery Method
```

---

# 95. LOW CSAT FOLLOW-UP

Rule:

```text
CSAT <= 2
```

creates:

```text
SERVICE RECOVERY
```

task/case.

Assign:

```text
Team Leader
```

---

# 96. SERVICE RECOVERY

Record:

```text
what went wrong

contact attempted

customer contacted

recovery action

outcome
```

Then measure:

```text
Recovered customers

Repeat complaints
```

---

# 97. CUSTOMER SENTIMENT

Agents may optionally record:

```text
POSITIVE

NEUTRAL

FRUSTRATED

VERY_DISSATISFIED
```

AI may suggest sentiment from conversation.

It must remain an assistive signal, not an unquestionable fact.

---

# 98. CUSTOMER EFFORT

Survey:

> How easy was it to get your issue resolved?

Useful in addition to satisfaction.

---

# 99. CUSTOMER FEEDBACK HUB

Customer record:

```text
FEEDBACK

CSAT 4.6/5

Latest 3/5

Surveys 12 months
8

Complaints
3
```

---

# 100. COMPLAINT ROOT CAUSE

Do not confuse:

```text
Customer complaint type
```

with:

```text
Root cause
```

Example:

```text
Complaint:
Late Delivery

Root Cause:
Production delay
```

or:

```text
Root Cause:
Carrier failure
```

---

# 101. ROOT CAUSE HIERARCHY

Example:

```text
PEOPLE

PROCESS

SYSTEM

PRODUCT

PRODUCTION

WAREHOUSE

TRANSPORT

SUPPLIER

CUSTOMER DATA

COMMERCIAL
```

then detailed sub-causes.

---

# 102. CONTRIBUTING FACTORS

Allow multiple:

```text
Primary root cause

Contributing factors
```

This prevents oversimplification.

---

# 103. ROOT CAUSE REQUIRED

Certain Case types may require root cause before final closure.

Example:

```text
Formal Complaint
Quality Complaint
```

Simple query may not.

---

# 104. CORRECTIVE ACTION

Serious complaint may create:

```text
corrective_action
```

or Atlas Project task.

Example:

```text
Update packing inspection process
```

Owner:

```text
Warehouse Manager
```

Due:

```text
12 October
```

---

# 105. PREVENTIVE ACTION

Also:

```text
preventive_action
```

where appropriate.

Quality module may own formal CAPA.

Customer Service can link to it.

Do not duplicate Quality functionality.

---

# 106. QUALITY INTEGRATION

Quality Complaint:

```text
CASE-991
```

creates:

```text
QUALITY INVESTIGATION
```

linked to:

```text
Product

Batch

Shipment

Customer
```

Quality owns technical investigation.

Customer Service owns communication.

---

# 107. RETURN INTEGRATION

Case may create:

```text
RMA
```

through Logistics Returns.

Example:

```text
Damaged goods
↓
Case
↓
Return Authorisation
↓
Warehouse receipt
↓
Inspection
↓
Disposition
```

Case follows the actual return status live.

---

# 108. CREDIT NOTE REQUEST

Case may create departmental Finance ticket:

```text
REQUEST CREDIT NOTE
```

Finance decides according to permissions/workflow.

Customer Service must not directly manufacture financial transactions unless authorised.

---

# 109. GOODWILL / SERVICE RECOVERY

Support controlled:

```text
Goodwill credit

Replacement

Free delivery

Discount

Other recovery
```

Approval rules based on value.

---

# 110. SERVICE RECOVERY APPROVAL

Example:

```text
£0–£100
Team Leader

£101–£1,000
Manager

>£1,000
Director
```

Configurable.

---

# 111. FINANCIAL IMPACT

Track complaint financial impact.

Potential:

```text
Credit note

Replacement cost

Freight

Scrap

Rework

Goodwill

Labour
```

This should pull from real Atlas transactions where possible.

---

# 112. COST OF POOR SERVICE

Metric:

```text
Complaint-related credits
+
replacement
+
redelivery
+
scrap
+
other recovery cost
```

Analytics can show:

```text
Cost by root cause

Cost by customer

Cost by product

Cost by department
```

---

# 113. ORDER PROCESSING INTEGRATION

Sales Order should show:

```text
CUSTOMER SERVICE

Open Cases     2

CASE-882
Late delivery

CASE-901
Quantity query
```

No need to leave order screen.

---

# 114. ORDER HOLD FROM CASE

Certain serious Cases may request:

```text
ORDER HOLD
```

Example:

```text
Customer dispute
```

But Case engine must request operational hold through Sales/Finance workflow.

Do not directly alter order status without authority.

---

# 115. PROACTIVE SERVICE

Atlas should not only respond after customers complain.

Use ERP events.

Example:

```text
Shipment predicted late
```

could create:

```text
PROACTIVE CUSTOMER ACTION
```

for Customer Service.

---

# 116. PROACTIVE QUEUE

```text
CUSTOMERS TO CONTACT

Order 1882
2 days late

Customer ABC

Owner Michael
```

This is much better service than waiting for the customer to chase.

---

# 117. PROACTIVE AUTOMATION

```text
WHEN
Shipment risk becomes Critical

IF
Customer proactive notification enabled

THEN
Create Customer Service task
```

Do not auto-email every issue without configurable policy.

---

# 118. CUSTOMER PREFERENCE

Store:

```text
Preferred channel

Language

Service contact

Do-not-contact rules

Notification preferences
```

---

# 119. CONTACT VALIDATION

Case can originate from unknown contact.

Atlas should allow:

```text
Existing contact

New contact

Unknown caller
```

Then associate later.

---

# 120. CUSTOMER PORTAL

Future/optional portal:

```text
My Cases

Create Case

View Status

Reply

Upload Files

Orders

Deliveries

Returns
```

Customer should not see internal department tickets.

---

# 121. CUSTOMER-FACING STATUS

Internal:

```text
WAITING FINANCE
```

Customer-facing:

```text
IN PROGRESS
```

Use separate mappings.

Do not expose internal organisational mechanics unnecessarily.

---

# 122. PORTAL TIMELINE

Customer sees:

```text
Case received

Response

Updates

Resolution
```

not:

```text
Finance SLA breached

Transport ticket reassigned
```

---

# 123. ATTACHMENTS

Support:

```text
Photos

PDF

Order documentation

Delivery documentation

Evidence

Correspondence
```

Tag:

```text
CUSTOMER_VISIBLE

INTERNAL
```

---

# 124. IMAGE EVIDENCE

Quality/damage Cases may store:

```text
damage photographs

packaging photographs

delivery photographs
```

linked to return/quality records where appropriate.

---

# 125. CALL LOGGING

Phone interaction:

```text
Inbound/Outbound

Start

Duration

Agent

Contact

Summary

Outcome
```

Link to Case.

---

# 126. CALLBACK

Create:

```text
Callback
```

with:

```text
owner

due time

contact
```

Appears in My Work.

---

# 127. FOLLOW-UP

Case can generate:

```text
Follow-up task
```

Example:

```text
Call customer tomorrow after replacement arrives.
```

Use Atlas Projects/Task engine where appropriate.

Do not create another generic task engine.

---

# 128. CUSTOMER SERVICE MY WORK

Combine:

```text
Cases

Callbacks

Follow-ups

Approvals

Mentions

Department responses

CSAT recovery
```

into one personal workspace.

---

# 129. CASE SUMMARY

Top of Case:

```text
CASE-00882

ABC LTD

Invoice Complaint

HIGH

Open 6h 21m

Owner
Michael

SLA Resolution
5h 39m remaining
```

Then:

```text
Order     SO-882
Invoice   INV-219

Finance Ticket
FIN-129
In Progress
```

---

# 130. CASE BRIEF

Button:

```text
Brief me
```

Output based on Case history:

```text
Customer queried invoice INV-219 this morning.

Customer believes agreed pricing was not applied.

Sales confirmed the contract price at 10:42.

Finance is reviewing the invoice.

Next customer update is due by 13:00.
```

Do not make the agent reread 30 messages.

---

# 131. AI DRAFT REPLY

Atlas may draft reply using:

```text
Case conversation

Knowledge

ERP status

Department response
```

Agent reviews before sending.

AI must not invent:

```text
refund

delivery date

stock

price

credit
```

---

# 132. REPLY SOURCE TRANSPARENCY

Where useful:

```text
Draft based on:

Finance ticket FIN-129

Order SO-882

Knowledge Article KB-19
```

---

# 133. CASE NEXT ACTION

Atlas can suggest:

```text
Next best action:
Update customer
```

because:

```text
Finance completed investigation

Customer has not been updated
```

Deterministic workflow first.

AI can improve wording.

---

# 134. KNOWLEDGE GAP

If many Cases have:

```text
same question
```

and no knowledge article exists:

```text
Knowledge gap identified
```

Suggest creating one.

---

# 135. CUSTOMER HISTORY SIGNAL

Case view might show:

```text
Customer has raised 4 delivery complaints in 90 days.
```

This is factual and useful.

---

# 136. REPEAT ISSUE DETECTION

Repeated:

```text
Product X
+
Damage
```

may trigger:

```text
Recurring Issue
```

for Quality/Operations review.

---

# 137. CUSTOMER RISK SIGNAL

Do not invent emotional customer scoring.

Use explainable signals such as:

```text
3 open complaints

2 SLA breaches

CSAT average 2.1

£22k unresolved credit
```

Then let authorised users decide response.

---

# 138. CASE ANALYTICS

Core metrics:

```text
Cases Opened

Cases Closed

Open Backlog

First Response Time

Resolution Time

Average Handle Time

SLA Achievement

SLA Breaches

Reopen Rate

Escalation Rate

Complaint Rate

CSAT

Survey Response Rate
```

---

# 139. CUSTOMER METRICS

```text
Cases per Customer

Complaints per Customer

Cases per £ Revenue

CSAT

Repeat Cases

Credits

Service Recovery Cost
```

---

# 140. PRODUCT METRICS

```text
Cases per Product

Complaint Rate

Quality Complaints

Return Rate

Cost

Root Cause
```

---

# 141. ORDER METRICS

```text
Cases per 100 Orders

Delivery Complaints

Shortages

Invoice Queries

Pricing Queries
```

---

# 142. TEAM METRICS

Use responsibly:

```text
Current Case Load

First Response SLA

Resolution SLA

CSAT

Case Age
```

Avoid measuring agent quality solely through:

```text
Cases closed per hour
```

Customer service is not a click factory.

---

# 143. DEPARTMENT PERFORMANCE

This is important.

Measure:

```text
Finance OLA

Quality OLA

Transport OLA

Planning OLA
```

Customer Service can see where Cases become stuck.

Example:

```text
AVERAGE INTERNAL RESPONSE

Finance        2h 10m

Planning       1h 21m

Transport      3h 44m

Quality        7h 12m
```

---

# 144. CASE AGEING

Buckets:

```text
< 4h

4–8h

8–24h

1–2 days

2–5 days

>5 days
```

Configurable.

---

# 145. BACKLOG HEALTH

Show:

```text
Backlog                188

Within SLA             172

At Risk                  9

Breached                 7
```

---

# 146. CUSTOMER SERVICE CONTROL TOWER

Home dashboard:

```text
TODAY

New Cases            82

Open Cases          214

Resolved Today       61

────────────────────

SERVICE

First Response SLA   96.2%

Resolution SLA       91.8%

CSAT                  94.4%

Response Rate         28.7%

────────────────────

ATTENTION

7 SLA breaches

9 SLA risks

4 escalations

12 waiting Finance

8 waiting Transport

3 negative CSAT follow-ups
```

Everything clickable.

---

# 147. CASE FLOW DASHBOARD

Show:

```text
NEW
42

TRIAGE
18

IN PROGRESS
81

WAITING INTERNAL
34

WAITING CUSTOMER
22

RESOLVED
17
```

---

# 148. ROOT CAUSE DASHBOARD

Example:

```text
Delivery            31%

Production           22%

Pricing              14%

Quality              12%

Warehouse             9%

Other                12%
```

Then drill deeper.

---

# 149. COMPLAINT TREND

Example:

```text
Delivery complaints
+18% vs previous month
```

Click:

```text
Why?
```

Break down:

```text
Carrier

Route

Customer

Product

Warehouse
```

through Atlas Analytics.

---

# 150. COST DASHBOARD

```text
SERVICE FAILURE COST

This Month
£84,200

Credit Notes
£44,100

Replacement
£18,300

Freight
£12,800

Other
£9,000
```

---

# 151. CSAT ANALYTICS

Examples:

```text
CSAT by:

Case Type

Agent

Team

Customer

Product

Order Type

Resolution Time

SLA Result
```

Useful relationship:

```text
SLA met:
96% CSAT

SLA breached:
71% CSAT
```

---

# 152. CERTIFIED ANALYTICS

All service KPIs must use Atlas Analytics semantic definitions.

Examples:

```text
First Response Time ✓

Resolution Time ✓

CSAT ✓

Complaint Rate ✓
```

One company definition.

---

# 153. REPORT BUILDER

Service managers can create:

```text
Weekly Complaint Report

Monthly CSAT

Quality Complaints

Customer Trends

Department OLA Performance
```

through Analytics Studio.

---

# 154. CUSTOMER-SPECIFIC REPORT

Customer review:

```text
ABC Ltd

Orders              182

Cases                 12

Complaints             3

OTIF                  91%

CSAT                  4.4

Service Credits       £821
```

Excellent for account reviews.

---

# 155. COMPLAINT REGISTER

Formal grid:

```text
Case

Customer

Received

Type

Severity

Owner

SLA

Root Cause

Resolution

Closed
```

Exportable.

---

# 156. QUEUE ADMINISTRATION

Queue:

```text
name

department

members

hours

priority

routing policy

capacity

default OLA
```

---

# 157. PUBLIC VS PRIVATE QUEUE

Support:

```text
Company Queue

Restricted Queue
```

But queue membership alone must not override Case security.

Dynamics likewise distinguishes public/private queues from underlying record permissions.

---

# 158. CASE SECURITY

Sensitive cases may be:

```text
STANDARD

RESTRICTED

CONFIDENTIAL
```

Restricted topics might include:

```text
Legal

Executive

Data Protection

Sensitive HR crossover
```

according to company policy.

---

# 159. FIELD SECURITY

Certain fields may require permission:

```text
Legal notes

Financial exposure

Internal fault attribution
```

---

# 160. AUDIT

Track:

```text
Case created

Owner changed

Priority changed

Status changed

SLA changed

Ticket created

Escalated

Response sent

Resolution changed

Case closed

Case reopened
```

---

# 161. COMMUNICATION AUDIT

Every outbound message:

```text
sender

recipient

channel

timestamp

template

message version

attachments
```

---

# 162. AUTOMATION AUDIT

Store:

```text
rule

trigger

condition result

actions

success/failure
```

---

# 163. CASE LINK ENTITY

Use:

```text
case_entity_link

case_id

entity_type

entity_id

relationship_type
```

Example:

```text
CASE-882

AFFECTS

SO-1991
```

---

# 164. CASE CONTACTS

A Case may involve:

```text
Requester

Primary Contact

Additional Contact

Customer Account

Third Party
```

Do not assume one person.

---

# 165. WATCHERS

Internal employees can:

```text
Follow Case
```

without ownership.

---

# 166. CC

Customer-facing communication may support:

```text
CC
```

according to security rules.

---

# 167. CUSTOMER COMMUNICATION LOG

Customer record should show all:

```text
case emails

phone calls

survey responses

complaints

service recovery
```

alongside CRM interactions.

---

# 168. CRM INTEGRATION

CRM Account page:

```text
SERVICE

Open Cases
3

Last Complaint
12 Sep

CSAT
92%

Current Escalation
None
```

Salesperson can see service context before calling customer.

---

# 169. SALES ALERT

Major customer complaint may notify Account Manager according to policy.

Do not notify Sales of every simple question.

---

# 170. CUSTOMER SERVICE TASKS

Use Atlas common Task engine.

Examples:

```text
Call customer

Check replacement

Review complaint

Prepare monthly analysis
```

No duplicate Customer Service task implementation.

---

# 171. CASE CHECKLISTS

Workflow may provide:

```text
☐ Customer acknowledged

☐ Order checked

☐ Relevant department consulted

☐ Customer updated

☐ Root cause recorded

☐ Resolution confirmed
```

Checklist configurable by type.

---

# 172. RESOLUTION

Case cannot simply close with:

```text
Done
```

Store:

```text
resolution_code

resolution_summary

customer_outcome

internal_outcome
```

---

# 173. RESOLUTION CODES

Examples:

```text
INFORMATION_PROVIDED

ORDER_CORRECTED

INVOICE_CORRECTED

CREDIT_ISSUED

REPLACEMENT

RETURN

DELIVERY_COMPLETED

NO_FAULT_FOUND

CUSTOMER_ERROR

GOODWILL

DUPLICATE

CANCELLED
```

Configurable.

---

# 174. FAULT ATTRIBUTION

Where business needs this:

```text
INTERNAL

SUPPLIER

CARRIER

CUSTOMER

NO_FAULT

UNKNOWN
```

Separate from detailed root cause.

---

# 175. RESOLUTION VALIDATION

Before closure certain types may require:

```text
Root cause

Resolution code

Customer updated

Department tickets complete

Return complete

CSAT scheduled
```

---

# 176. CLOSE WITH OPEN DEPENDENCY

Normally warn:

> Finance Ticket FIN-221 remains open.

Options where authorised:

```text
Cancel ticket

Keep open

Return to Case
```

Do not silently abandon internal work.

---

# 177. CASE REOPEN

When customer replies to Closed Case:

Policy may:

```text
Reopen existing Case
```

or:

```text
Create follow-up Case
```

linked to original.

---

# 178. SERVICE CONTRACTS / ENTITLEMENTS

Optional advanced module.

Customer may have:

```text
Standard Support

Premium Support

24/7 Support
```

with:

```text
support hours

response commitments

case allowances

contacts
```

Dynamics ties entitlements to service commitments and SLAs in a similar way.

---

# 179. ENTITLEMENT

Create:

```text
service_entitlement
```

linked to:

```text
customer

contract

product

SLA
```

---

# 180. SELF-SERVICE KNOWLEDGE

Customer Portal can surface:

```text
FAQs

Product guides

Delivery questions

Returns process
```

before Case creation.

---

# 181. CASE DEFLECTION

When customer types:

```text
How do I get a copy invoice?
```

portal may show relevant article.

Customer can still:

```text
Continue to create Case
```

Never block them behind useless search.

---

# 182. SERVICE FORMS

Different intake forms:

```text
General Query

Delivery Complaint

Quality Complaint

Return Request

Invoice Query
```

Each asks only relevant questions.

---

# 183. CONDITIONAL FORM

Example:

```text
Issue = Damaged Goods
```

then ask:

```text
Quantity damaged

Upload photo

Delivery number
```

---

# 184. CUSTOMER CASE NUMBER

Always readable:

```text
CASE-001882
```

Customers can quote it.

---

# 185. INTERNAL TICKET NUMBERS

Department prefixes:

```text
FIN-192

LOG-882

QUAL-228

PLAN-118
```

Optional configurable numbering.

---

# 186. GLOBAL SEARCH

Search:

```text
CASE-882

Customer

Order

Invoice

Email

Product

Department ticket
```

Permission-aware.

---

# 187. SERVICE COMMAND PALETTE

Example:

```text
⌘K

Create Case

Assign to me

Create Finance Ticket

Send Reply

Resolve

Escalate

Open Customer
```

---

# 188. QUICK CASE CREATION

Minimum:

```text
Customer

Subject
```

Everything else can follow during triage.

Do not force agents through a giant form while a customer is waiting on the phone.

---

# 189. PHONE MODE

Fast screen:

```text
Search customer...

ABC LTD

[New Case]
```

Then:

```text
What are they calling about?
```

Large selectable categories.

---

# 190. CASE SAVE

Autosave drafts.

Do not lose a 20-minute complaint note because browser refreshed.

---

# 191. DRAFT REPLY

Replies remain:

```text
DRAFT
```

until sent.

Support:

```text
Save draft

Discard

Send
```

---

# 192. SHARED DRAFT

Optional:

Agent drafts.

Manager reviews.

Then:

```text
Approve & Send
```

for sensitive cases.

---

# 193. APPROVAL

Examples:

```text
Large credit

Legal response

Major complaint outcome

Compensation
```

Use common Atlas approval engine.

---

# 194. CASE SLA VS DEPARTMENT OLA

Display both.

Example:

```text
CUSTOMER SLA

Resolution
5h 20m

────────────────

INTERNAL DEPENDENCIES

Finance
Due 1h 20m

Quality
Complete

Transport
Due 45m
```

This could be one of Atlas Customer Service's strongest screens.

---

# 195. WHY CASE IS AT RISK

Example:

```text
CASE AT RISK

Customer resolution SLA:
5h 20m remaining

Finance dependency:
Overdue by 42m

Finance response is required before resolution.
```

No guessing.

---

# 196. SERVICE WORK GRAPH

Atlas Projects introduced the Work Graph.

Customer Service should participate.

Example:

```text
Customer ABC
↓
CASE-882
↓
Sales Order SO-991
↓
Shipment SH-282
↓
Delivery failure
↓
Transport Ticket LOG-88
↓
Carrier ABC
```

This enables real causal investigation.

---

# 197. MAJOR CUSTOMER VIEW

For key account:

```text
SERVICE HEALTH

Cases last 90 days       12

Complaints                4

CSAT                     89%

SLA                      96%

Credits                £8.2k
```

---

# 198. CUSTOMER CONTACT PROMISE

If agent tells customer:

> I will update you tomorrow.

Capture:

```text
customer_commitment
```

Due:

```text
Tomorrow
```

Shows in My Work.

This prevents forgotten promises.

---

# 199. COMMITMENT BREACH

If due and not completed:

```text
PROMISED CUSTOMER UPDATE OVERDUE
```

This is separate from formal SLA.

---

# 200. CALLBACK PROMISE

Same engine:

```text
Call customer by 15:00
```

---

# 201. CUSTOMER PROMISE HISTORY

Case shows:

```text
Promises made      4

Met                4

Missed             0
```

Potential future service-quality metric.

---

# 202. CROSS-DEPARTMENT REQUEST TEMPLATE

Example:

```text
FINANCE INVESTIGATION

Case:
CASE-882

Customer:
ABC

Invoice:
INV-1882

Problem:
Customer disputes pricing.

Required:
Confirm correct price and financial correction.

Due:
11:00

Customer-facing deadline:
14:00
```

Finance immediately knows what is needed.

---

# 203. DEPARTMENT TICKET FORMS

Different teams can configure required fields.

Finance:

```text
Invoice

Value

Reason
```

Quality:

```text
Product

Batch

Quantity

Photos
```

Transport:

```text
Shipment

Delivery

Carrier
```

---

# 204. TICKET CREATION SHOULD COPY CONTEXT, NOT DATA

Important.

Department ticket should reference:

```text
Customer

Order

Invoice
```

rather than store duplicate customer/order records.

Snapshot only where historical evidence requires it.

---

# 205. DEPARTMENT TICKET LINK BACK

Finance sees:

```text
Originating Customer Case
CASE-882
```

with permitted context.

Finance should not need to ask:

> Which customer is this for?

---

# 206. DEPARTMENT RESPONSE RETURNS TO PARENT

When Finance completes:

```text
FIN-221 COMPLETE
```

Customer Service receives:

```text
Department response ready
```

and Case dependency updates automatically.

---

# 207. INTERNAL TICKET REJECTION

Department may say:

```text
WRONG QUEUE
```

Reason required.

Atlas reroutes according to policy.

Do not simply close the request.

---

# 208. INTERNAL ESCALATION

If Finance OLA breached:

```text
FIN-221
```

escalates within Finance.

Customer Case retains Customer Service ownership.

---

# 209. DEPARTMENT MANAGER VIEW

Finance Manager can see:

```text
Customer Service Requests

Open

Age

OLA

Customer Impact

Value
```

without being given Customer Service administration access.

---

# 210. CROSS-DEPARTMENT ANALYTICS

Show:

```text
Customer cases requiring internal help

Finance             22%

Transport           18%

Quality             14%

Sales               11%

Planning             9%
```

and:

```text
Average departmental response
```

This reveals organisational bottlenecks.

---

# 211. SERVICE OPERATING MODEL

The desired model:

```text
CUSTOMER
    │
    ▼
CUSTOMER SERVICE
    │
    ▼
CASE
    │
    ├──────────────┬─────────────┬──────────────┐
    ▼              ▼             ▼              ▼
 FINANCE        LOGISTICS      QUALITY       SALES
 TICKET          TICKET         TICKET       TICKET
    │              │             │              │
    └──────────────┴──────┬──────┴──────────────┘
                          ▼
                    CUSTOMER SERVICE
                          │
                          ▼
                   CUSTOMER RESPONSE
```

That is fundamentally better than forwarding emails around departments.

---

# 212. TECHNICAL DATA MODEL

Core entities:

```text
CASE

case
case_type
case_category
case_status
case_priority
case_severity

case_entity_link

case_contact
case_relationship

COMMUNICATION

case_message
case_activity
case_attachment
case_side_conversation

DEPARTMENT WORK

department_ticket
department_ticket_type
department_ticket_status
department_ticket_link
department_ticket_response

QUEUE

service_queue
service_queue_member
service_queue_policy

ROUTING

routing_rule
routing_rule_condition
routing_assignment

SLA

sla_policy
sla_milestone
case_sla_instance
case_sla_event

OLA

ola_policy
department_ticket_ola

KNOWLEDGE

knowledge_article
knowledge_article_version
knowledge_category
knowledge_feedback

FEEDBACK

survey
survey_question
survey_invitation
survey_response
survey_answer

ROOT CAUSE

root_cause
case_root_cause
corrective_action

ESCALATION

case_escalation

RESOLUTION

resolution_code
case_resolution

AUTOMATION

service_automation
service_automation_execution

SERVICE RECOVERY

service_recovery
customer_commitment
```

---

# 213. SERVICE BOUNDARIES

Logical modules:

```text
CaseService

CaseCommunicationService

DepartmentTicketService

ServiceRoutingService

ServiceSLAService

ServiceOLAService

KnowledgeService

CustomerFeedbackService

ServiceRecoveryService

ServiceAutomationService

ServiceAnalyticsService
```

Initially within Atlas modular monolith.

---

# 214. EVENT MODEL

Important:

```text
CaseCreated

CaseAssigned

CaseReclassified

CaseEscalated

CustomerResponded

AgentResponded

DepartmentTicketCreated

DepartmentTicketAssigned

DepartmentTicketCompleted

SLARiskDetected

SLABreached

CaseResolved

CaseClosed

CaseReopened

SurveySent

SurveyCompleted

NegativeCSATReceived

RootCauseConfirmed
```

---

# 215. ERP EVENTS CONSUMED

Potential:

```text
OrderConfirmed

OrderCancelled

ShipmentCreated

ShipmentDispatched

ShipmentDelivered

DeliveryFailed

InvoicePosted

CreditNotePosted

ReturnReceived

ProductionDelayed

QualityFailed
```

Only linked Cases/automation rules should react.

---

# 216. EXAMPLE AUTOMATION

```text
WHEN
Credit Note CN-882 posts

IF
Linked to CASE-188

THEN
Update Department Ticket FIN-18

Notify Case owner
```

---

# 217. API EXAMPLES

```text
POST /api/service/cases

GET /api/service/cases/{id}

POST /api/service/cases/{id}/reply

POST /api/service/cases/{id}/internal-note

POST /api/service/cases/{id}/assign

POST /api/service/cases/{id}/escalate

POST /api/service/cases/{id}/resolve

POST /api/service/cases/{id}/reopen

POST /api/service/cases/{id}/department-tickets

POST /api/service/department-tickets/{id}/complete

POST /api/service/surveys/send
```

---

# 218. SECURITY

Enforce:

```text
case.read

case.update

case.reply

case.internal_note

case.assign

case.escalate

case.resolve

case.close

case.financial_recovery

department_ticket.create

department_ticket.complete

survey.manage

knowledge.publish
```

---

# 219. IMMUTABILITY

Do not delete historical:

```text
messages

case events

SLA events

department responses

survey responses
```

Correction through new records/events.

---

# 220. IDEMPOTENCY

Inbound email/API events require idempotency.

Duplicate email webhook must not create:

```text
two Cases
```

Duplicate carrier event must not create:

```text
two Case updates
```

---

# 221. IMPLEMENTATION PHASE 1

Build Case core:

```text
Cases

Customer linkage

Contact linkage

Classification

Status

Priority

Ownership

Internal Notes

Customer replies

Attachments

Timeline
```

Then:

```text
Order
Invoice
Shipment
Product links
```

---

# 222. IMPLEMENTATION PHASE 2

Build departmental work:

```text
Department Tickets

Queues

Internal ownership

Parent/child relationships

Department responses

OLAs
```

This should happen early.

It is central to the product.

---

# 223. IMPLEMENTATION PHASE 3

Build:

```text
Routing

SLAs

Escalations

Agent queues

Supervisor views
```

---

# 224. IMPLEMENTATION PHASE 4

Build:

```text
Complaint workflows

Root cause

Resolution

Corrective actions

Returns integration

Finance integration

Quality integration
```

---

# 225. IMPLEMENTATION PHASE 5

Build:

```text
Knowledge

Response templates

Macros

Automations
```

---

# 226. IMPLEMENTATION PHASE 6

Build:

```text
CSAT

Surveys

Service recovery

Feedback analytics
```

---

# 227. IMPLEMENTATION PHASE 7

Build:

```text
Control Tower

Advanced analytics

Department OLA reporting

Complaint costing

Customer service health
```

---

# 228. IMPLEMENTATION PHASE 8

Add:

```text
Customer Portal

Self-service

Proactive service

Major incidents

Mass updates
```

---

# 229. IMPLEMENTATION PHASE 9

Add assistive AI:

```text
Case Summary

Reply Draft

Knowledge Suggestions

Classification Suggestions

Root Cause Pattern Detection

Brief Me
```

AI does not become source of ERP truth.

---

# 230. TEST: FINANCE QUERY

Customer:

```text
ABC Ltd
```

Case:

```text
CASE-100
Incorrect invoice
```

Create:

```text
FIN-100
```

Finance completes:

```text
Credit note created
```

Expected:

```text
CASE-100 remains owned by Customer Service.

FIN-100 becomes COMPLETE.

Customer Service is notified.

Credit Note is visible through linked Finance record.

Case is not automatically closed unless configured.
```

---

# 231. TEST: MULTIPLE DEPARTMENTS

Complaint needs:

```text
Quality
Transport
Finance
```

Create three Department Tickets.

Case displays all independently.

Case does not close prematurely when only one finishes.

---

# 232. TEST: SLA AND OLA

Customer resolution SLA:

```text
8h
```

Finance OLA:

```text
2h
```

Finance exceeds 2h.

Expected:

```text
Finance OLA breach

Case remains open

Customer SLA continues

Case owner warned about dependency risk
```

---

# 233. TEST: WAITING CUSTOMER

Agent asks customer for photograph.

Case becomes:

```text
WAITING_CUSTOMER
```

Configured Resolution SLA pauses.

Customer replies.

SLA resumes automatically.

---

# 234. TEST: CSAT

Case resolved.

Survey sent.

Customer gives:

```text
2/5
```

Expected:

```text
Response linked to Case

CSAT analytics updated

Negative feedback workflow triggered

Service recovery task created if configured
```

---

# 235. TEST: ORDER LINK

Case linked to:

```text
SO-100
```

Order later dispatches.

Case should see live order status.

No duplicate stored status should become stale.

---

# 236. TEST: CASE REOPEN

Case resolved.

Customer replies:

> This still isn't fixed.

Expected:

```text
Case reopened

Reopen count +1

SLA behaviour according to policy

Owner notified
```

---

# 237. TEST: PERMISSIONS

Customer Service agent can see:

```text
Finance Ticket exists
```

but lacks permission for restricted Finance fields.

Expected:

```text
Only permitted financial context shown.
```

---

# 238. NON-NEGOTIABLE RULES FOR CODEX

Do not:

- make complaints a completely separate system
- treat queries and complaints as email folders
- route the entire customer Case to Finance just because Finance needs to help
- lose Customer Service ownership during departmental work
- copy entire ERP records into Case fields
- let department tickets become disconnected from parent Case
- treat SLA and internal OLA as identical
- let customer see internal notes
- let customer see departmental ticket internals
- manually recalculate service metrics inside dashboards
- use one hard-coded SLA
- assume every Case is email
- assume every Case belongs to one order
- automatically close a Case just because a department ticket completes
- automatically return stock from a complaint
- automatically issue credit without Finance authority
- let AI promise dates, refunds, prices or stock without validated ERP data
- delete Case history
- overwrite customer messages
- silently merge duplicate cases
- measure agent performance purely by volume
- report CSAT without response rate
- store root cause as the same thing as complaint category
- build a second generic task system inside Customer Service

---

# 239. ATLAS CUSTOMER SERVICE DIFFERENTIATOR

The system should answer:

> Why has the customer contacted us?

```text
Invoice incorrect
```

Then:

> Which order?

```text
SO-882
```

Then:

> Which invoice?

```text
INV-991
```

Then:

> Who is investigating?

```text
Finance
Donna
FIN-221
```

Then:

> When do they owe us an answer?

```text
11:00
```

Then:

> When do we owe the customer an answer?

```text
14:00
```

Then:

> What has actually happened?

```text
Pricing discrepancy identified
Credit note CN-882 posted
Corrected invoice generated
```

Then:

> Have we told the customer?

```text
Not yet
```

Atlas should immediately make the next action obvious:

```text
UPDATE CUSTOMER
```

That is proper customer-service workflow.

---

# 240. EXAMPLE CUSTOMER SERVICE EXPERIENCE

Customer calls.

Agent searches:

```text
ABC Ltd
```

Atlas immediately shows:

```text
ABC LTD

Open Orders                 7

Late Orders                 1

Open Cases                  2

Balance                  £88k

Last Delivery          Yesterday

CSAT                       94%
```

Customer says:

> Invoice 991 is wrong.

Agent clicks:

```text
INV-991
```

then:

```text
Create Case
```

Atlas pre-populates customer and invoice.

Agent chooses:

```text
Invoice Query
```

System sees this Case type requires Finance.

Offers:

```text
Create Finance Ticket?
```

Agent confirms.

Customer Service Case:

```text
CASE-882

OPEN
```

Internal Finance Ticket:

```text
FIN-221

Due 11:00
```

At 10:42 Finance completes:

```text
Incorrect contract price applied.

Credit note CN-882 raised.

Corrected invoice INV-991-R available.
```

Customer Service receives:

```text
FINANCE RESPONSE READY
```

The Case now shows:

```text
NEXT ACTION

Update customer
```

Agent clicks:

```text
Reply
```

Atlas drafts from the validated Finance response.

Agent checks it.

Sends.

Case resolves.

CSAT goes automatically.

Customer replies:

```text
5/5
```

Everything is stored against:

```text
Customer
Case
Invoice
Agent
Department
Root Cause
```

and immediately becomes available in Analytics.

That is the level Atlas Customer Service should aim for.

---

# 241. FINAL MODEL

```text
                         CUSTOMER
                             │
                             ▼
                           CASE
                             │
          ┌──────────────────┼──────────────────┐
          │                  │                  │
          ▼                  ▼                  ▼
    COMMUNICATION        ERP CONTEXT       SERVICE SLA
          │                  │                  │
          │      ┌───────────┼───────────┐      │
          │      ▼           ▼           ▼      │
          │    ORDER      INVOICE     SHIPMENT   │
          │                                      │
          ▼                                      ▼
   CUSTOMER SERVICE                         COMMITMENT
          │
          ▼
   DEPARTMENT WORK
          │
 ┌────────┼────────┬─────────┬─────────┐
 ▼        ▼        ▼         ▼         ▼
FIN     SALES    QUALITY   LOGISTICS   MFG
 │        │        │         │         │
 └────────┴────────┴────┬────┴─────────┘
                        ▼
                INTERNAL RESPONSES
                        │
                        ▼
                 CUSTOMER SERVICE
                        │
                        ▼
                    RESOLUTION
                        │
             ┌──────────┴──────────┐
             ▼                     ▼
         ROOT CAUSE              CSAT
             │                     │
             ▼                     ▼
        CORRECTIVE ACTION       ANALYTICS
```

Customer Service owns the relationship.

Departments own their work.

Atlas owns the complete thread.

No forwarding emails.

No lost actions.

No wondering whether Finance replied.

No separate spreadsheet for complaints.

No separate CSAT system.

No manually checking whether the order delivered.

Everything connects.