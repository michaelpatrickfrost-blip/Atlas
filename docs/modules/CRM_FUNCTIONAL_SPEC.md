> Contract builder and customer sharing implementation (7 October 2026): see [Contracts and Templates](../plans/CONTRACTS_TEMPLATES.md) for delivered scope, security and remaining extensions.

# ATLAS CRM

## Complete Sales CRM Technical Functional Specification

**Product:** Atlas ERP  
**Module:** CRM  
**Purpose:** Lead management, account management, contact management, opportunities, pipeline, sales activity, prospecting, forecasting, goals, automation, reporting, dashboards and sales intelligence.

**Connected Atlas modules:**

- Customer Master
- Sales Order Processing
- Quotations
- Finance
- Products
- Pricing
- Inventory
- Marketing
- Customer Service
- Reporting / BI

**Explicit principle:**

CRM manages the relationship and potential revenue.

Sales Order Processing manages committed customer orders.

The CRM must never become a cluttered mixture of prospects, confirmed orders, invoices and warehouse transactions.

---

# 1. THE ATLAS CRM OBJECTIVE

Atlas CRM should answer five questions instantly:

1. **Who should I contact today?**
2. **Which deals need my attention?**
3. **What am I likely to close?**
4. **Am I going to hit target?**
5. **What should I do next?**

For a manager it should additionally answer:

1. What is genuinely in the pipeline?
2. What changed this week?
3. Which deals are slipping?
4. Which reps need support?
5. Where is pipeline weak?
6. How reliable is the forecast?
7. Where are deals being won and lost?
8. Which customers have growth potential?
9. Which activities actually result in sales?
10. What is likely to happen next?

---

# 2. COMPETITIVE FUNCTIONALITY TO LEARN FROM

Atlas should take strong concepts from major CRM platforms without copying their complexity.

## Salesforce

Current Salesforce Pipeline Inspection consolidates pipeline metrics, opportunities, week-to-week changes, activity and deal insights into a single pipeline-management experience. Salesforce forecasting also supports live forecast roll-ups, forecast categories and managerial judgement.

### Atlas should adopt

- historical pipeline movement;
- opportunity change detection;
- forecast categories;
- opportunity scoring;
- sales methodology;
- manager forecast adjustments;
- pipeline inspection;
- powerful reporting.

### Atlas should improve

Make these features obvious rather than hiding them behind separate products and administration layers.

---

# 3. HUBSPOT

HubSpot's sales workspace combines deal management with daily selling activities. Its reporting system supports custom reports using multiple connected CRM objects, while its forecasting tools support configurable forecast categories and revenue goals.

HubSpot also supports sales goals for users and teams, including revenue, deals, calls and meetings, with goal data available in reporting.

### Atlas should adopt

- strong rep workspace;
- sequences;
- goals;
- simple CRM record management;
- cross-object reporting;
- useful dashboards.

### Atlas should improve

Make advanced reporting much more flexible without making it feel like a BI development tool.

---

# 4. MICROSOFT DYNAMICS 365 SALES

Dynamics supports:

- leads;
- opportunities;
- accounts;
- contacts;
- predictive scoring;
- relationship intelligence;
- conversation intelligence;
- sequences;
- work queues;
- dashboards;
- Power BI;
- sales forecasts.


Its forecasts can be configured around revenue or quantity, hierarchies, permissions and custom columns.

### Atlas should adopt

- structured selling processes;
- work queues;
- predictive information;
- flexible forecasting;
- account relationship intelligence.

### Atlas should improve

Remove the feeling of navigating a business database.

---

# 5. PIPEDRIVE

Pipedrive's strength is simplicity.

Its Insights system lets users build custom reports, place them on configurable dashboards, filter them and track goals and pipeline metrics.

### Atlas should adopt

- visual pipeline;
- quick editing;
- highly approachable reporting;
- activity-driven selling;
- personal dashboards.

### Atlas should improve

Add the enterprise depth Pipedrive deliberately avoids.

---

# 6. THE ATLAS DIFFERENCE

Atlas should combine:

**Pipedrive usability**

+

**HubSpot salesperson workflow**

+

**Salesforce reporting and pipeline inspection**

+

**Dynamics forecasting and sales intelligence**

+

**Atlas ERP transactional data**

The final advantage is important.

Traditional CRM usually stops at:

> Deal won for £80,000.

Atlas can eventually know:

> Deal won £80,000  
> Orders actually placed £74,200  
> Gross margin £21,100  
> £68,000 delivered  
> £62,000 invoiced  
> £49,000 paid

That provides much stronger sales intelligence.

---

# 7. CRM NAVIGATION

Keep primary navigation simple.

```text
CRM

Home

Leads
Opportunities
Accounts
Contacts

Activities
Forecast

Reports
Dashboards
```

Secondary functionality should appear contextually.

Do not create separate main menu entries for:

- deal health;
- sequences;
- competitors;
- stakeholders;
- scoring;
- playbooks;
- territory;
- notes;
- documents;
- products;
- relationships.

Those belong inside the relevant workflow.

---

# 8. ROLE-BASED EXPERIENCE

The CRM interface should change subtly according to role.

## Salesperson

Focus on:

- today's work;
- leads;
- opportunities;
- tasks;
- communication;
- personal pipeline;
- target;
- forecast.

## Sales Manager

Focus on:

- team pipeline;
- deal movement;
- forecast;
- coaching;
- rep performance;
- pipeline coverage;
- activity;
- risks.

## Sales Director

Focus on:

- revenue;
- pipeline;
- forecast;
- forecast accuracy;
- regions;
- teams;
- products;
- customer groups;
- new versus existing business;
- strategic accounts.

## CRM Administrator

Focus on:

- configuration;
- fields;
- workflows;
- permissions;
- pipelines;
- stages;
- reporting;
- data quality.

---

# 9. CRM HOME

Do not make the homepage a wall of charts.

For a salesperson:

```text
GOOD MORNING, MICHAEL

£428k
Open pipeline

£92k
Likely this month

74%
Target achieved

£61k
Still needed


TODAY

3 calls
2 follow-ups
1 meeting
4 deals need attention


NEEDS ATTENTION

ABC Ltd
£42,000
No activity for 11 days

Travis Perkins
£28,400
Close date moved twice

Northbuild
£18,200
Proposal viewed yesterday


YOUR PIPELINE

Qualification       £84k
Discovery          £112k
Proposal           £146k
Negotiation         £86k
```

Everything should be clickable.

---

# 10. MY WORK

Atlas should have a dedicated personalised work queue.

This is more useful than expecting a salesperson to search the CRM.

Sections:

### Due Now

Overdue and today's activities.

### Follow Up

Leads or opportunities requiring contact.

### Opportunities At Risk

Deals requiring attention.

### New Leads

Recently assigned.

### Engagement

Customers who have replied, opened important communications or otherwise generated relevant signals.

### Waiting

Deals currently waiting on the customer.

### Upcoming

Future scheduled actions.

---

# 11. PRIORITY ENGINE

Each work item can receive a priority score.

Possible inputs:

- deal value;
- probability;
- stage;
- close date;
- inactivity;
- customer engagement;
- overdue activity;
- proposal sent;
- customer response;
- opportunity age;
- stage age;
- account value;
- relationship quality;
- deal risk.

But Atlas must explain the score.

Never simply show:

**AI score 82**

Show:

```text
PRIORITY: HIGH

£48,000 opportunity
Close date in 8 days
Customer replied yesterday
No next meeting scheduled
Deal has spent 19 days in proposal
```

---

# 12. LEAD MANAGEMENT

A Lead represents a potential customer or opportunity that has not yet been properly qualified.

Lead fields:

- Lead ID
- Person
- Company
- Email
- Telephone
- Mobile
- Job title
- Website
- Address
- Country
- Territory
- Industry
- Source
- Campaign
- Product interest
- Estimated value
- Owner
- Team
- Status
- Score
- Rating
- Next activity
- Last activity
- Created date
- Qualification information
- Consent / communication status

---

# 13. LEAD SOURCES

Support:

- manual;
- web form;
- website;
- telephone enquiry;
- inbound email;
- referral;
- event;
- exhibition;
- social;
- campaign;
- imported;
- API;
- partner;
- existing customer;
- outbound prospecting.

Source must persist through the entire customer journey.

This enables proper revenue attribution later.

---

# 14. LEAD ROUTING

Leads can be assigned automatically.

Rules may consider:

- geography;
- postcode;
- country;
- industry;
- product;
- account type;
- company size;
- language;
- value;
- source;
- existing relationship;
- workload.

Example:

```text
IF
Country = United Kingdom
AND
Product Group = Drainage
AND
Estimated value > £25,000

THEN
Assign Team = UK Infrastructure
```

---

# 15. ROUND-ROBIN ASSIGNMENT

Atlas should support:

- straight round-robin;
- weighted distribution;
- availability-based distribution;
- territory assignment;
- named account ownership;
- queue assignment.

Users marked unavailable should be excluded.

---

# 16. LEAD SLA

A business should be able to define:

```text
New website lead

First contact:
Within 2 hours

Follow-up:
Within 1 working day
```

Atlas then displays:

**Contact due in 47 minutes**

or:

**SLA missed by 2h 14m**

---

# 17. LEAD STATUS

Example:

```text
New
Attempting Contact
Connected
Qualifying
Qualified
Nurture
Disqualified
Converted
```

Status must be configurable.

---

# 18. LEAD QUALIFICATION

Qualification frameworks should be configurable.

Atlas should support concepts similar to:

- BANT;
- MEDDIC;
- MEDDPICC;
- SPICED;
- CHAMP;
- custom methodology.

But these should not be forced on customers.

Example custom framework:

```text
Need identified          ✓
Decision maker known     ✓
Budget understood        ⚠
Timescale confirmed      ✓
Competitor known         ○
```

---

# 19. QUALIFICATION RULES

A company may require specific fields before conversion.

Example:

To mark **Qualified** require:

- company;
- main contact;
- identified requirement;
- estimated value;
- next action.

Atlas should display what is missing.

---

# 20. LEAD SCORING

Support:

### Fit score

How closely the lead matches desired customer attributes.

### Engagement score

How actively they are interacting.

### Sales score

Combined likelihood / priority indication.

Possible factors:

- industry;
- company size;
- geography;
- product interest;
- previous purchases;
- emails;
- calls;
- meetings;
- website actions;
- responses;
- lead age.

Rules can be manual, statistical or AI-assisted.

---

# 21. LEAD CONVERSION

Converting a lead may create or link:

```text
Account
+
Contact
+
Opportunity
```

Before creation, Atlas must search for duplicates.

Example:

> **Possible existing company**
>
> ABC Infrastructure Ltd  
> Leeds  
> Existing account A-10421
>
> [Use existing account]
> [Create new]

---

# 22. ACCOUNT

An Account represents an organisation or customer relationship.

Account workspace must contain:

### Identity

- Account ID
- Name
- Trading name
- Legal name
- Registration number
- VAT number
- Industry
- Website
- Territory

### Relationship

- Account owner
- Account team
- Customer status
- Prospect status
- Strategic status
- Parent account
- Relationship start
- Relationship health

### Commercial

- Potential value
- Open pipeline
- Won opportunities
- Actual sales
- Margin
- Outstanding orders

### Activity

- last contact;
- next contact;
- meetings;
- calls;
- emails;
- tasks.

---

# 23. ACCOUNT 360

The account screen should provide the complete commercial relationship.

```text
ABC INFRASTRUCTURE

Account owner
Michael

Relationship
8 years

Open pipeline
£184,000

Sales last 12 months
£624,000

Gross margin
27.2%

Open orders
£81,000

Outstanding invoices
£42,800


CONTACTS

Sarah Mason
Commercial Director

James Wood
Buyer


OPEN OPPORTUNITIES

Northern Framework
£120,000

Leeds Phase 2
£64,000
```

The CRM retrieves actual transactional figures from Atlas ERP.

---

# 24. ACCOUNT HIERARCHIES

Support:

```text
BuildCo Group
│
├── BuildCo North
│   ├── Leeds
│   └── Newcastle
│
├── BuildCo Midlands
│
└── BuildCo South
```

Users can report at:

- site;
- subsidiary;
- account;
- group.

---

# 25. ACCOUNT RELATIONSHIP MAP

Visually display people around an account.

Example:

```text
                  CEO
                   │
          Commercial Director
            /              \
        Buyer             Finance
          │
       Site Manager
```

Each contact can have:

- influence;
- decision authority;
- sentiment;
- relationship owner;
- opportunity role.

---

# 26. CONTACTS

Contact information:

- first name;
- surname;
- title;
- role;
- department;
- company;
- location;
- telephone;
- mobile;
- email;
- preferred contact channel;
- account role;
- buying role;
- influence;
- relationship strength;
- owner;
- notes;
- communication preferences.

---

# 27. BUYING ROLES

Contacts can be classified as:

- Decision Maker
- Economic Buyer
- Technical Buyer
- User
- Champion
- Influencer
- Procurement
- Finance
- Gatekeeper
- Legal
- Executive Sponsor
- Blocker
- Other

One contact may have different roles in different opportunities.

---

# 28. OPPORTUNITIES

An Opportunity represents potential commercial business.

This is the central CRM transaction.

It must not become an order until the appropriate commercial point is reached.

---

# 29. OPPORTUNITY FIELDS

Core fields:

```text
Opportunity ID
Opportunity Name
Account
Primary Contact

Owner
Team

Pipeline
Stage

Estimated Value
Currency

Expected Margin
Estimated Quantity

Probability

Forecast Category

Expected Close Date

Opportunity Type
New / Existing / Renewal / Expansion

Lead Source

Product Interest

Competitor

Next Step
Next Step Date

Created Date
Stage Entered Date

Last Activity
Next Activity

Opportunity Health
```

---

# 30. MULTIPLE PIPELINES

Atlas must support different selling processes.

Example:

### New Business

```text
Prospecting
Qualification
Discovery
Proposal
Negotiation
Closed Won
Closed Lost
```

### Key Accounts

```text
Identified
Customer Discussion
Commercial Review
Agreement
Won
Lost
```

### Framework Tender

```text
Identified
Prequalification
Tender Preparation
Tender Submitted
Clarification
Award Pending
Won
Lost
```

---

# 31. CUSTOM STAGES

Administrators can configure:

- name;
- order;
- colour indicator;
- default probability;
- forecast category;
- entry criteria;
- exit criteria;
- required fields;
- activities;
- automated actions;
- maximum expected stage age.

---

# 32. STAGE ENTRY AND EXIT CRITERIA

Moving a card should not always be meaningless.

For example:

To move from **Discovery** to **Proposal**:

```text
Requirement documented       ✓
Decision process known        ✓
Estimated value entered       ✓
Close date entered            ✓
Decision maker                ⚠
```

Atlas can warn or block depending on configuration.

---

# 33. PIPELINE VIEW

Primary pipeline:

```text
QUALIFICATION        DISCOVERY        PROPOSAL         NEGOTIATION

ABC                  Northbuild       Travis           City Group
£18k                 £42k             £86k             £54k
4 days               8 days           12 days          3 days

Delta                King & Co        West Ltd
£26k                 £64k             £31k
```

Cards show only information that helps make a decision.

---

# 34. PIPELINE CARD

Suggested information:

```text
TRAVIS PERKINS

£86,000
Proposal

Close: 18 Oct
Probability: 60%

Last activity: 2 days
Next: Call tomorrow

⚠ Proposal stage 12 days
```

---

# 35. DRAG AND DROP

Moving an opportunity between stages should:

1. validate required information;
2. record stage history;
3. update probability if appropriate;
4. update forecast category if configured;
5. trigger workflows;
6. start stage ageing;
7. create prescribed activities.

Never simply update a text field.

---

# 36. OPPORTUNITY WORKSPACE

Opening a deal should show:

```text
NORTHERN FRAMEWORK
ABC Infrastructure

£120,000

PROPOSAL

Expected close
31 Oct

Probability
65%

Forecast
Best Case


HEALTH

✓ Decision maker engaged
✓ Proposal sent
⚠ No meeting scheduled
⚠ Close date moved twice


NEXT STEP

Commercial review
8 Oct


STAKEHOLDERS

Sarah Mason   Champion
John Lee      Decision Maker


ACTIVITY

Today
Email reply

Yesterday
Proposal sent
```

---

# 37. DEAL HEALTH

Deal health should be separate from probability.

Probability answers:

> How likely is this deal to close?

Health answers:

> Is this deal progressing normally?

Health may consider:

- recent engagement;
- next activity;
- stage age;
- expected close date;
- stakeholder coverage;
- qualification completeness;
- amount changes;
- close-date movement;
- activity;
- competitor status.

---

# 38. DEAL RISK

Possible risk signals:

```text
Close date moved 3 times
No activity for 14 days
No identified decision maker
No next action scheduled
Deal value reduced 22%
Proposal stage 41 days
Customer stopped responding
Expected close date already passed
```

These should be directly actionable.

---

# 39. DEAL CHANGE HISTORY

Atlas should preserve opportunity movement.

Example:

```text
THIS WEEK

Pipeline value
£648k → £612k

Changes

+ £80k new opportunity
+ £42k value increase

- £64k moved to next month
- £38k lost
- £56k value reduction
```

This is substantially more useful than only looking at the pipeline's current state.

---

# 40. DEAL SLIPPAGE

Track:

- original close date;
- current close date;
- number of changes;
- total days slipped.

Example:

```text
Original close:
30 Sep

Current:
31 Oct

Moved:
3 times

Total slip:
31 days
```

---

# 41. OPPORTUNITY PRODUCTS

An opportunity can contain estimated products or service lines.

Example:

```text
SP1
50,000 units
£420,000

RI1/20
12,000 units
£78,000
```

This allows forecasting by:

- product;
- product family;
- division;
- quantity;
- estimated margin.

These are not committed order lines.

---

# 42. COMPETITOR TRACKING

Per opportunity capture:

- competitor;
- incumbent;
- known price position;
- strengths;
- weaknesses;
- customer preference;
- result.

When an opportunity is lost:

**Primary loss reason**

and

**Competitor**

should be separately captured.

---

# 43. CLOSED LOST

Require configurable reason.

Examples:

- Price
- Competitor
- No decision
- Budget cancelled
- Timing
- Specification
- Delivery
- Product unavailable
- Relationship
- Duplicate opportunity
- Customer stopped project
- Other

Allow secondary detail.

---

# 44. CLOSED WON

Winning a deal should trigger a structured handoff.

Possible actions:

```text
Create quotation
Create draft sales order
Create contract
Create customer
Notify customer service
Notify planning
Create onboarding activities
```

The CRM opportunity remains as the commercial history.

---

# 45. OPPORTUNITY TEAMS

Support multiple participants:

```text
Michael       Opportunity Owner
Sarah         Technical
John          Commercial Director
Anne          Account Manager
```

---

# 46. REVENUE / CREDIT SPLITS

Where appropriate:

```text
Michael       70%
Sarah         30%
```

Useful for shared opportunities and reporting.

---

# 47. ACTIVITIES

Unified activity types:

- call;
- email;
- meeting;
- task;
- video meeting;
- site visit;
- demonstration;
- presentation;
- follow-up;
- proposal;
- LinkedIn/social contact;
- custom activity.

---

# 48. ACTIVITY RECORD

Fields:

- type;
- subject;
- related account;
- contact;
- opportunity;
- owner;
- date;
- time;
- duration;
- outcome;
- notes;
- next action;
- completed status.

---

# 49. ACTIVITY OUTCOMES

For calls:

```text
Connected
Voicemail
No answer
Wrong number
Call back requested
Meeting booked
Not interested
```

For meetings:

```text
Completed
Rescheduled
Cancelled
No show
```

Outcomes should be customisable.

---

# 50. TASK MANAGEMENT

Tasks support:

- owner;
- due date;
- priority;
- reminder;
- account;
- contact;
- opportunity;
- sequence;
- recurring;
- status.

Quick completion must be possible directly from the work queue.

---

# 51. CALENDAR

CRM calendar shows:

- meetings;
- calls;
- tasks;
- follow-ups;
- opportunity deadlines;
- quotation expiries where linked.

Allow integration with:

- Microsoft 365;
- Google Calendar.

CRM activities should not require duplicate diary entry.

---

# 52. EMAIL INTEGRATION

Atlas should integrate with business email providers.

Functions:

- send;
- reply;
- compose;
- templates;
- CRM tracking;
- automatic association;
- manual association;
- attachments;
- signature;
- email history.

Inbound and outbound correspondence can appear in the appropriate CRM timeline.

---

# 53. EMAIL ASSOCIATION

Atlas should attempt to associate email based on:

1. contact;
2. account;
3. active opportunity;
4. explicit user association.

Users must be able to correct the association.

---

# 54. EMAIL TEMPLATES

Templates can contain:

```text
{{contact.first_name}}
{{account.name}}
{{opportunity.name}}
{{owner.name}}
{{owner.telephone}}
```

Templates are categorised and searchable.

---

# 55. SNIPPETS

Users should also have short reusable pieces of text.

For example:

**Delivery information**

**Meeting confirmation**

**Product specification link**

These are different from full email templates.

---

# 56. SALES SEQUENCES

Allow structured follow-up sequences.

Example:

```text
DAY 1
Personal email

DAY 3
Call

DAY 5
Follow-up email

DAY 9
Call

DAY 14
Final email
```

Sequences can mix:

- automated email;
- manual email;
- call task;
- LinkedIn/social task;
- research task;
- meeting request;
- custom activity.

---

# 57. SEQUENCE EXIT CONDITIONS

Automatically remove a contact from a sequence if:

- they reply;
- opportunity created;
- meeting booked;
- salesperson removes them;
- contact opts out;
- account becomes blocked;
- configurable condition is satisfied.

---

# 58. DYNAMIC SEQUENCES

Atlas can modify sequence behaviour based on engagement.

Example:

If prospect responds:

**Exit sequence**

If prospect opens proposal:

**Create call task**

If no engagement after three attempts:

**Extend interval**

HubSpot currently supports dynamic sequences where automated communication can run while manual tasks are surfaced when engagement occurs.

---

# 59. SALES PLAYBOOKS

Playbooks guide conversations.

Example:

### Discovery Call

```text
Current supplier:
________________

Annual spend:
________________

Main issue:
________________

Decision process:
________________

Timing:
________________

Products:
________________
```

Answers can populate CRM fields.

---

# 60. NOTES

Notes support:

- rich text;
- mentions;
- attachments;
- timestamp;
- owner;
- related records;
- pinned notes.

Users should not need to create fake activities merely to record a useful observation.

---

# 61. DOCUMENTS

Associate:

- presentations;
- proposals;
- specifications;
- tender documents;
- customer documents;
- contracts;
- meeting notes;
- drawings.

Documents can be linked to accounts and opportunities.

---

# 62. SALES GOALS

Goals can be assigned at:

- user;
- team;
- territory;
- region;
- company.

Periods:

- day;
- week;
- month;
- quarter;
- year;
- custom period.

---

# 63. GOAL TYPES

Examples:

### Revenue

- won opportunity value;
- actual order intake;
- invoiced sales;
- margin.

### Pipeline

- new pipeline generated;
- pipeline coverage;
- qualified pipeline;
- opportunities created.

### Activity

- calls;
- meetings;
- site visits;
- proposals;
- new conversations.

### Conversion

- lead conversion;
- opportunity win rate;
- proposal conversion.

---

# 64. TARGET DISPLAY

Salesperson:

```text
OCTOBER TARGET

£100,000

Won
£64,000

Commit
£22,000

Best Case
£31,000

Remaining
£36,000
```

---

# 65. FORECASTING

Forecasting needs its own serious workspace.

Suggested forecast categories:

```text
Pipeline
Best Case
Commit
Closed
Omitted
```

Categories are independent of opportunity stage.

---

# 66. FORECAST VIEW

Example:

```text
OCTOBER FORECAST

Target                    £1.20m

Closed                    £620k
Commit                    £310k
Best Case                 £280k
Pipeline                  £540k

Coverage                   1.46x
```

Then drill down by:

- manager;
- rep;
- region;
- team;
- product;
- customer;
- opportunity.

---

# 67. REP FORECAST SUBMISSION

Salespeople should periodically submit their forecast.

Example:

```text
System Commit
£94,000

Rep Forecast
£88,000

Difference
-£6,000

Comment
"ABC order likely to move into November."
```

Keep both.

Do not replace system values.

---

# 68. MANAGER FORECAST

Managers can add judgement.

Example:

```text
System              £1.02m
Rep submissions      £980k
Manager forecast     £950k
```

All adjustments need:

- user;
- date;
- amount;
- reason.

---

# 69. FORECAST SNAPSHOTS

Every forecast period must preserve historical snapshots.

Example:

```text
OCTOBER

1 Sep forecast        £820k
15 Sep forecast       £910k
1 Oct forecast        £1.05m
15 Oct forecast       £990k
Actual                £972k
```

Without snapshots, forecast accuracy cannot properly be measured.

---

# 70. FORECAST ACCURACY

Report:

```text
Michael

Forecast   £120k
Actual     £111k

Variance    -£9k
Accuracy    92.5%
```

Track accuracy over time.

---

# 71. PIPELINE COVERAGE

Calculate:

```text
Open qualified pipeline
÷
Remaining sales target
=
Pipeline coverage
```

Example:

```text
Target remaining       £400k
Qualified pipeline     £1.20m

Coverage                3.0x
```

Allow different stages to qualify for coverage.

---

# 72. CUSTOMISABLE DASHBOARDS

This needs to be one of Atlas's strongest areas.

Users can:

- create dashboards;
- duplicate dashboards;
- rename dashboards;
- share dashboards;
- publish team dashboards;
- set default dashboard;
- drag widgets;
- resize widgets;
- rearrange widgets;
- change visualisation;
- change date range;
- apply dashboard filters;
- add text / headings;
- add targets;
- drill into underlying data.

---

# 73. DASHBOARD BUILDER

Simple layout:

```text
DASHBOARD: SALES DIRECTOR

[ + Add Widget ]  [ Filters ]  [ Edit Layout ]


┌──────────────────┬──────────────────┐
│ Revenue          │ Forecast         │
│ £1.24m           │ £1.31m           │
├──────────────────┴──────────────────┤
│ Pipeline by Stage                   │
│                                     │
│          CHART                      │
├──────────────────┬──────────────────┤
│ Win Rate         │ Pipeline Cover   │
│ 38.2%            │ 3.1x             │
└──────────────────┴──────────────────┘
```

---

# 74. DASHBOARD WIDGETS

Support:

### KPI

Single number.

### KPI comparison

```text
£482k
+12.4% vs last month
```

### Progress

Target versus actual.

### Bar chart

### Column chart

### Stacked bar

### Line chart

### Area chart

### Funnel

### Pie / donut

Use sparingly.

### Gauge

### Table

### Ranking

### Leaderboard

### Heat map

### Pipeline flow

### Conversion funnel

### Scatter chart

### Forecast chart

### Activity stream

### Saved list

### Text / heading

---

# 75. DASHBOARD GLOBAL FILTERS

Examples:

```text
Date
Team
Salesperson
Territory
Region
Pipeline
Product
Account
Industry
Opportunity type
Lead source
```

Changing a global filter refreshes compatible widgets.

---

# 76. PERSONAL DASHBOARDS

Every user can create their own dashboards without administrator involvement.

Example:

**My October**

- target;
- won;
- forecast;
- pipeline;
- opportunities closing;
- overdue tasks;
- lead conversion;
- top accounts.

---

# 77. MANAGER DASHBOARD

Suggested default:

```text
Team target attainment

Forecast

Pipeline coverage

Pipeline by stage

Pipeline added this week

Pipeline lost this week

Deals pushed

Win rate

Average deal size

Sales cycle

Rep performance

Activity trend

Deals needing attention
```

---

# 78. EXECUTIVE SALES DASHBOARD

Suggested default:

```text
Sales YTD

Orders YTD

Gross Margin

Forecast

Forecast accuracy

Pipeline

Pipeline coverage

New business

Existing customer growth

Win rate

Top customers

Top products

Regions

Teams

New versus lost pipeline
```

---

# 79. REPORTING ENGINE

Reporting must be a platform within Atlas.

Not just a collection of fixed reports.

There should be three levels:

### Quick Reports

Pre-built.

### Custom Reports

Built using a simple visual builder.

### Advanced Analytics

Cross-module reporting, calculated measures and advanced datasets.

---

# 80. REPORT BUILDER

The workflow should be:

```text
1. What do you want to analyse?

Opportunities


2. Add related information

Accounts
Contacts
Activities
Products
Orders


3. What do you want to measure?

Opportunity Value


4. Break it down by

Salesperson


5. Filter

Close date = This year


6. Visualise

Bar chart
```

A salesperson should understand this.

---

# 81. REPORT DATA SOURCES

Core CRM sources:

- Leads
- Accounts
- Contacts
- Opportunities
- Opportunity Products
- Activities
- Tasks
- Meetings
- Calls
- Emails
- Goals
- Forecasts
- Sequences
- Campaign Sources
- Territories
- Users
- Teams

Connected ERP sources:

- Quotations
- Orders
- Order Lines
- Products
- Invoices
- Deliveries
- Payments
- Returns
- Margin

---

# 82. RELATED DATA

The reporting engine needs safe predefined relationships.

Example:

```text
Opportunity
├── Account
├── Contacts
├── Activities
├── Products
├── Owner
├── Team
├── Quotes
└── Orders
```

This prevents users accidentally creating invalid database joins.

---

# 83. DIMENSIONS

Users can group by:

- salesperson;
- team;
- account;
- account group;
- product;
- category;
- territory;
- region;
- lead source;
- stage;
- opportunity type;
- industry;
- customer type;
- date;
- week;
- month;
- quarter;
- year;
- custom field.

---

# 84. MEASURES

Standard measures:

- count;
- sum;
- average;
- minimum;
- maximum;
- unique count;
- median;
- percentage;
- conversion;
- duration;
- value;
- weighted value;
- margin;
- quantity.

---

# 85. CUSTOM CALCULATED METRICS

Allow formulas.

Example:

```text
Pipeline Coverage =
Qualified Pipeline /
Remaining Target
```

or:

```text
Average Revenue per Won Deal =
Won Revenue /
Won Opportunities
```

or:

```text
Conversion % =
Won Opportunities /
Closed Opportunities
```

---

# 86. REPORT FILTERS

Support:

```text
equals
does not equal
contains
does not contain
greater than
less than
between
is empty
is not empty
in list
not in list
```

Date filters:

```text
today
yesterday
this week
last week
this month
last month
this quarter
last quarter
this year
last year
last 7 days
last 30 days
last 90 days
custom
```

---

# 87. FILTER GROUPS

Allow:

```text
Country = UK

AND

(
Industry = Construction
OR
Industry = Manufacturing
)

AND

Opportunity Value > £10,000
```

---

# 88. PERIOD COMPARISON

Any time report should allow:

**Compare with**

- previous period;
- previous month;
- previous quarter;
- previous year;
- custom period.

Example:

```text
PIPELINE CREATED

This month       £422k
Last month       £371k

+13.7%
```

---

# 89. TREND LINES

Allow optional:

- moving average;
- target;
- previous period;
- previous year;
- forecast;
- trend.

---

# 90. DRILL DOWN

Every chart must allow the user to inspect the underlying records.

Click:

**£184k Proposal Stage**

Then see:

```text
ABC        £80k
North Ltd  £42k
Build Co   £38k
Jones      £24k
```

Click again to open the opportunity.

Never create a dashboard where numbers cannot be investigated.

---

# 91. REPORT LIBRARY

Atlas should ship with a strong standard library.

Users should not have to build common reports themselves.

---

# 92. PIPELINE REPORTS

Include:

- Pipeline by stage
- Pipeline by salesperson
- Pipeline by team
- Pipeline by region
- Pipeline by product
- Pipeline by customer
- Pipeline by close month
- Weighted pipeline
- Pipeline coverage
- Pipeline added
- Pipeline removed
- Pipeline movement
- Pipeline ageing
- Stage ageing
- Stale opportunities
- Slipped opportunities
- Opportunity value movement

---

# 93. CONVERSION REPORTS

Include:

- Lead conversion rate
- Lead-to-opportunity conversion
- Opportunity win rate
- Stage conversion
- Proposal win rate
- Conversion by salesperson
- Conversion by source
- Conversion by industry
- Conversion by product
- Conversion by opportunity value
- Conversion over time

---

# 94. SALES VELOCITY

Calculate sales velocity using configurable measures.

Useful components:

```text
Number of opportunities
×
Average deal value
×
Win rate
÷
Average sales cycle
```

Also report the underlying components separately.

---

# 95. SALES CYCLE REPORTS

Include:

- Average days to close
- Median days to close
- Days by stage
- Sales cycle by salesperson
- Sales cycle by product
- Sales cycle by account type
- Sales cycle by source
- Won versus lost duration

---

# 96. LEAD REPORTS

Include:

- Leads created
- Leads by source
- Leads by owner
- Leads by territory
- Lead response time
- Lead SLA compliance
- Qualification rate
- Conversion rate
- Disqualification reasons
- Average lead age
- Uncontacted leads
- Leads without next activity

---

# 97. ACTIVITY REPORTS

Include:

- Calls
- Calls connected
- Meetings
- Meetings booked
- Emails
- Tasks
- Site visits
- Proposals
- Activities completed
- Activities overdue
- Activity by user
- Activity by account
- Activity by opportunity
- Activity versus conversion
- Activity versus revenue

Pipedrive currently exposes activity-performance reporting around calls, meetings and tasks. Atlas should go further by relating those activities directly to resulting pipeline and actual revenue.

---

# 98. REP PERFORMANCE

Suggested report:

```text
                     MICHAEL     SARAH     JOHN

Target               £200k       £180k     £180k
Won                   £188k       £174k     £142k
Target %                94%         97%       79%

Pipeline              £480k       £392k     £420k
Coverage               4.0x        6.5x      11.1x

Win Rate               42%         38%       31%
Avg Deal              £28k        £21k      £19k

Sales Cycle           31d         28d       39d
```

Do not reduce performance to activity volume alone.

---

# 99. SOURCE ATTRIBUTION

Report:

```text
SOURCE          LEADS     PIPELINE     WON

Website          182       £420k       £112k
Referral          42       £280k       £148k
Outbound         114       £360k        £86k
Events            38       £190k        £72k
```

---

# 100. WON / LOST ANALYSIS

Show:

- won value;
- lost value;
- win rate;
- reasons;
- competitor;
- product;
- region;
- salesperson;
- source;
- price impact;
- delivery impact;
- stage lost.

---

# 101. PIPELINE MOVEMENT REPORT

This should be one of Atlas's strongest reports.

Example:

```text
OPENING PIPELINE      £2.84m

+ New                 £420k
+ Increased           £110k
- Reduced              £82k
- Won                 £390k
- Lost                £140k
- Moved out           £280k
+ Moved in            £120k

CLOSING PIPELINE      £2.60m
```

Click any value to inspect opportunities.

---

# 102. STAGE FLOW REPORT

Visualise movement:

```text
100 Leads

72 Qualified

51 Discovery

34 Proposal

19 Negotiation

14 Won
```

Report conversion between each stage.

---

# 103. COHORT REPORTS

Example:

Opportunities created in each month and eventual conversion.

```text
Created       Won in 30d   Won in 60d   Won in 90d

January          18%           31%           39%
February         21%           34%           41%
March            24%           39%           46%
```

This reveals whether pipeline quality is improving.

---

# 104. ACCOUNT REPORTS

Include:

- Account pipeline
- Account sales
- Account margin
- Account growth
- Account decline
- Account activity
- Account inactivity
- Account opportunities
- Account penetration
- Contact coverage
- Strategic accounts

---

# 105. WHITESPACE ANALYSIS

Because Atlas is an ERP, it can analyse products a customer does not currently buy.

Example:

```text
ABC INFRASTRUCTURE

Currently buys:

Clay Drainage     £182k
Fittings           £84k

Not buying:

Channel Drainage
Accessories
Specials
```

This can create sales opportunities.

---

# 106. CUSTOMER GROWTH

Report:

```text
CUSTOMER             LAST YEAR    THIS YEAR     CHANGE

ABC                   £420k        £584k        +39%
Build Ltd             £281k        £312k        +11%
North Group           £610k        £488k        -20%
```

The declining customer should be actionable.

---

# 107. PRODUCT REPORTING

CRM plus ERP integration should allow:

- pipeline by product;
- pipeline by category;
- opportunities by product;
- product win rate;
- product lost reasons;
- actual sales versus expected pipeline;
- cross-sell opportunities;
- product growth;
- product margin.

---

# 108. FORECAST REPORTING

Include:

- Forecast by rep
- Forecast by team
- Forecast by territory
- Commit
- Best case
- Pipeline
- Target gap
- Forecast changes
- Forecast accuracy
- Forecast versus actual
- Rep forecast versus manager forecast
- Rep submission history

---

# 109. GOAL REPORTING

Visualisations:

- progress bar;
- gauge;
- leaderboard;
- trend;
- target line;
- projected attainment.

HubSpot currently supports goal reporting through gauges, bar charts and time-based progress visualisations. Atlas should expose this capability directly in the dashboard builder.

---

# 110. REPORT SHARING

Reports can be:

- Private
- Shared with users
- Shared with team
- Shared with role
- Shared company-wide

Permission rules must still apply to the underlying records.

Sharing a report must never grant access to records the viewer is not allowed to see.

---

# 111. SCHEDULED REPORTS

Allow:

```text
Every Monday
08:00

Send:
Sales Director Dashboard

To:
Sales Leadership
```

Formats:

- interactive Atlas link;
- PDF;
- Excel/CSV where permitted;
- email summary.

---

# 112. REPORT ALERTS

Example:

```text
Notify me when:

Pipeline coverage < 2.5x
```

or:

```text
Notify Sales Manager when:

Any opportunity > £100k
moves backwards
```

or:

```text
Notify account owner when:

Customer sales fall >20%
versus same period last year
```

---

# 113. LIVE DASHBOARD MODE

Allow dashboards to display on office screens.

Features:

- full screen;
- automatic refresh;
- rotating dashboards;
- hide confidential fields;
- large-format widgets.

---

# 114. SAVED VIEWS

Every list should support saved views.

Examples:

**My Opportunities**

**Closing This Month**

**No Activity 7 Days**

**Greater Than £50k**

**Proposal Sent**

**North Region**

Users may create their own views.

Managers may publish team views.

---

# 115. VISUAL FILTER BUILDER

Users should be able to create:

```text
Close Date = This Month

AND

Stage is not Closed

AND

Value > £25,000

AND

Owner = Me
```

without SQL.

---

# 116. COLUMN CUSTOMISATION

Users can choose list columns.

Example:

```text
Account
Opportunity
Stage
Value
Close Date
Last Contact
Next Step
Health
```

Column layouts can be saved per view.

---

# 117. INLINE EDITING

Where safe, users can edit directly from lists.

Example:

- close date;
- owner;
- stage;
- next step;
- forecast category;
- probability.

Validation rules still apply.

---

# 118. WORKFLOW AUTOMATION

Atlas CRM requires a no-code automation engine.

Structure:

```text
WHEN

event happens

IF

conditions are true

THEN

perform actions
```

---

# 119. WORKFLOW TRIGGERS

Examples:

- Lead created
- Lead assigned
- Lead status changed
- Opportunity created
- Stage changed
- Amount changed
- Close date changed
- Activity completed
- Email received
- Meeting completed
- Opportunity idle
- Date reached
- Customer sales decline
- Order placed
- Invoice overdue
- Deal won
- Deal lost

---

# 120. WORKFLOW CONDITIONS

Example:

```text
Opportunity Value > £100,000

AND

Stage = Proposal

AND

Region = North
```

---

# 121. WORKFLOW ACTIONS

Examples:

- create task;
- create activity;
- send notification;
- send email;
- assign owner;
- change field;
- add tag;
- start sequence;
- remove sequence;
- request approval;
- create opportunity;
- create quote;
- call webhook;
- invoke integration.

---

# 122. AUTOMATION EXAMPLE

```text
WHEN
Opportunity enters Proposal

AND
Value > £50,000

THEN
Create task:
"Manager commercial review"

Due:
Within 2 days

AND
Notify:
Sales Manager
```

---

# 123. STALE OPPORTUNITY AUTOMATION

```text
WHEN

No meaningful activity
for 10 days

AND

Opportunity is open

THEN

Flag:
Needs Attention

Create Task:
Review opportunity
```

---

# 124. DUPLICATE MANAGEMENT

Atlas should identify probable duplicates using:

- company name;
- domain;
- email;
- telephone;
- registration number;
- VAT number;
- postcode;
- address.

Confidence should be displayed.

---

# 125. MERGE

Authorised users can merge:

- leads;
- accounts;
- contacts.

Show differences before merge.

Example:

```text
                RECORD A            RECORD B

Phone           0113...             0113...
Industry        Construction        Infrastructure
Owner           Michael             Sarah
```

User chooses retained information.

References are migrated safely.

---

# 126. DATA QUALITY

Provide CRM data-quality reports:

- missing email;
- missing telephone;
- missing industry;
- missing account owner;
- missing next step;
- duplicate account;
- invalid email;
- old contact;
- opportunities past close date;
- opportunities without contacts;
- opportunities without activity.

---

# 127. CUSTOM FIELDS

Administrators can add fields to:

- lead;
- account;
- contact;
- opportunity;
- activity.

Types:

- text;
- long text;
- number;
- currency;
- percentage;
- date;
- datetime;
- checkbox;
- single choice;
- multiple choice;
- user;
- account;
- contact;
- product;
- formula.

---

# 128. CONDITIONAL FIELDS

Example:

If:

```text
Opportunity Type = Tender
```

Show:

```text
Tender Number
Tender Deadline
Submission Portal
Framework
```

Normal opportunities should not see irrelevant fields.

---

# 129. CUSTOM OBJECTS

Advanced organisations may create objects such as:

- Projects
- Sites
- Contractors
- Consultants
- Frameworks
- Buildings
- Specifications

Custom objects can relate to standard CRM records.

---

# 130. PAGE LAYOUT BUILDER

Administrators can configure:

- sections;
- fields;
- tabs;
- field order;
- conditional visibility;
- required fields;
- role visibility.

Do not require developers for routine CRM configuration.

---

# 131. SALES TERRITORIES

Territories can be based on:

- geographic region;
- postcode;
- customer group;
- industry;
- product;
- named accounts.

Support overlapping territories where required.

---

# 132. OWNERSHIP

Records can have:

- Primary owner
- Team
- Account manager
- Secondary owner
- Territory

Ownership drives:

- permissions;
- reporting;
- assignment;
- targets.

---

# 133. RECORD SECURITY

Access levels:

```text
Own
Team
Territory
Business Unit
Company
```

Additional explicit sharing can be supported.

---

# 134. FIELD SECURITY

Sensitive information may require field-level security.

Examples:

- margin;
- commission;
- customer credit;
- strategic notes;
- manager forecast adjustment.

---

# 135. AUDIT TRAIL

Audit:

- field changed;
- previous value;
- new value;
- user;
- timestamp;
- import/API source.

Particularly important fields:

- value;
- stage;
- probability;
- close date;
- forecast category;
- owner;
- won/lost status.

---

# 136. TIMELINE

Each Lead, Account, Contact and Opportunity has a unified timeline.

Example:

```text
TODAY

10:42
Sarah replied to email

09:12
Michael completed follow-up task


YESTERDAY

15:31
Proposal sent

11:04
Opportunity moved
Discovery → Proposal


MONDAY

14:15
Teams meeting
42 minutes
```

---

# 137. SEARCH

Global CRM search must recognise:

- company;
- contact;
- telephone;
- email;
- opportunity;
- PO where linked;
- postcode;
- product;
- site;
- registration number;
- note text.

---

# 138. COMMAND SEARCH

Keyboard:

```text
⌘ K
```

Then:

```text
ABC
```

Results:

```text
Accounts
ABC Infrastructure

Contacts
Sarah Mason, ABC Infrastructure

Opportunities
ABC Northern Framework
```

---

# 139. QUICK CREATE

From anywhere:

```text
+ Lead
+ Contact
+ Account
+ Opportunity
+ Task
+ Meeting
+ Note
```

Context should pre-fill related information.

---

# 140. NOTIFICATIONS

Good notifications:

- new lead assigned;
- customer responded;
- meeting approaching;
- opportunity changed;
- approval required;
- opportunity at risk;
- colleague mention;
- forecast due.

Bad notifications:

- every normal CRM field update.

Allow users to configure notification channels.

---

# 141. SALES INTELLIGENCE

Atlas can calculate useful signals:

### Deal signals

- engagement increasing;
- engagement declining;
- close date risk;
- stage ageing;
- decision maker absent;
- no future meeting;
- multiple stakeholders engaged.

### Account signals

- sales declining;
- sales growing;
- new orders;
- overdue debt;
- dormant customer;
- product gap;
- increased purchasing frequency.

---

# 142. AI SALES ASSISTANT

AI should support the salesperson rather than take over the CRM.

Useful functions:

### Account summary

> Summarise my relationship with ABC.

### Meeting preparation

> Prepare me for tomorrow's meeting.

### Opportunity summary

> What's happening with the Northern Framework deal?

### Action extraction

Turn meeting notes into tasks.

### Email drafting

Draft follow-up communication.

### CRM update suggestion

Suggest fields based on notes.

### Report building

> Show won business by product for each salesperson this quarter.

Atlas generates the report configuration.

---

# 143. AI REPORT CREATION

This could become one of Atlas's most impressive features.

User types:

> Show me pipeline added each week for the last 12 weeks split by salesperson.

Atlas interprets:

```text
Source:
Opportunities

Metric:
Sum Opportunity Value

Date:
Created Date

Group:
Week

Breakdown:
Owner

Period:
Last 12 weeks
```

Then generates the visual.

The user can open **Edit Report** to inspect or change the configuration.

---

# 144. AI EXPLAIN REPORT

User can ask:

> Why was September down?

Atlas should analyse the available CRM/ERP data and surface concrete drivers, for example:

```text
Won value fell £82k.

Primary contributors:

£41k fewer opportunities reached negotiation.
North region win rate fell 7 percentage points.
Two opportunities totalling £64k moved into October.
```

The underlying records must be available for inspection.

---

# 145. AI CONTROL

AI must never silently:

- change opportunity value;
- close an opportunity;
- move pipeline stages;
- submit forecasts;
- send customer emails;
- delete records.

It can suggest.

The user approves consequential actions.

---

# 146. CRM AND ORDER PROCESSING INTEGRATION

The boundary must remain clean.

```text
CRM

Lead
↓
Account
↓
Opportunity
↓
Quote
↓
WON

          HANDOFF

SALES ORDER PROCESSING

Order
↓
Allocation
↓
Fulfilment
↓
Invoice
↓
Payment
```

But CRM can display downstream status.

---

# 147. WON OPPORTUNITY VIEW

After the sale:

```text
NORTHERN FRAMEWORK

WON
£120,000


COMMERCIAL

Opportunity       £120,000


ACTUAL

Orders             £98,420
Delivered          £61,800
Invoiced           £52,600
Paid               £42,100

Margin             28.4%
```

This closes the loop between CRM optimism and actual commercial performance.

---

# 148. CRM-TO-ERP VARIANCE REPORT

One exceptionally useful Atlas report:

```text
                     CRM WON       ACTUAL ORDERS

Michael               £420k          £381k
Sarah                 £380k          £376k
John                  £310k          £242k
```

Identify where "won" opportunities do not turn into expected orders.

---

# 149. CUSTOMER VALUE

Eventually Atlas should calculate:

```text
Lifetime Sales

Lifetime Margin

Average Order Value

Order Frequency

Open Pipeline

Forecast Opportunity

Outstanding Debt
```

This creates a true customer value picture.

---

# 150. CORE CRM DATA MODEL

Core entities:

```text
crm_lead
crm_account
crm_contact

crm_opportunity
crm_opportunity_stage
crm_opportunity_stage_history
crm_opportunity_product
crm_opportunity_contact
crm_opportunity_competitor
crm_opportunity_team

crm_activity
crm_task
crm_meeting
crm_call
crm_email_reference

crm_sequence
crm_sequence_step
crm_sequence_enrolment

crm_goal
crm_goal_target

crm_forecast
crm_forecast_submission
crm_forecast_snapshot

crm_pipeline
crm_pipeline_stage

crm_territory

crm_playbook
crm_playbook_response

crm_note
crm_document_link

crm_workflow
crm_workflow_execution

crm_dashboard
crm_dashboard_widget

crm_report
crm_report_dimension
crm_report_measure
crm_report_filter

crm_event
crm_audit
```

---

# 151. OPPORTUNITY HISTORY MODEL

Do not rely solely on current values.

Maintain history for:

```text
Stage
Value
Probability
Close Date
Forecast Category
Owner
Health
```

This makes pipeline movement reporting possible.

---

# 152. ANALYTICS SNAPSHOTS

Certain metrics need periodic snapshots.

Examples:

- daily pipeline;
- forecast;
- opportunity stage;
- sales targets;
- account health.

Without snapshots Atlas cannot accurately answer:

> What did the pipeline look like last Monday?

---

# 153. EVENT ARCHITECTURE

Important events:

```text
crm.lead.created
crm.lead.assigned
crm.lead.qualified
crm.lead.converted

crm.opportunity.created
crm.opportunity.stage_changed
crm.opportunity.value_changed
crm.opportunity.close_date_changed
crm.opportunity.won
crm.opportunity.lost

crm.activity.created
crm.activity.completed

crm.forecast.submitted

crm.goal.updated

crm.account.created
crm.contact.created
```

---

# 154. API

Example endpoints:

```text
GET    /crm/leads
POST   /crm/leads
GET    /crm/leads/{id}
PATCH  /crm/leads/{id}

POST   /crm/leads/{id}/convert

GET    /crm/accounts
GET    /crm/accounts/{id}

GET    /crm/contacts
GET    /crm/contacts/{id}

GET    /crm/opportunities
POST   /crm/opportunities
GET    /crm/opportunities/{id}
PATCH  /crm/opportunities/{id}

POST   /crm/opportunities/{id}/stage
POST   /crm/opportunities/{id}/won
POST   /crm/opportunities/{id}/lost

GET    /crm/activities
POST   /crm/activities

GET    /crm/forecast
POST   /crm/forecast/submission

GET    /analytics/reports/{id}
POST   /analytics/reports
POST   /analytics/query
```

---

# 155. PERFORMANCE TARGETS

CRM must feel extremely fast.

Suggested objectives:

```text
Global search          <300ms
Opportunity opening    <500ms
Pipeline load          <600ms
Task completion        <250ms
Simple dashboard       <1 second
Complex report         <3 seconds
```

Use cached aggregates or analytics models where necessary rather than hitting transactional tables with enormous live queries.

---

# 156. REPORTING ARCHITECTURE

Do not allow complex analytics to cripple transactional CRM performance.

Recommended architecture:

```text
Transactional Database
        │
        ↓
Domain Events
        │
        ↓
Analytics Projection Layer
        │
        ↓
Metrics / Aggregation Engine
        │
        ↓
Report API
        │
        ↓
Dashboards
```

Real-time changes can update incremental projections.

---

# 157. REPORT DEFINITION

A saved report should store something similar to:

```text
data_source
related_sources

dimensions
measures

filters

date_field
date_range

sort

visualisation

comparison_period

permissions
```

Not generated SQL.

The analytics engine translates the definition safely.

---

# 158. DASHBOARD DEFINITION

Store:

```text
dashboard_id
name
owner
visibility

layout

global_filters

widget_id
position_x
position_y
width
height

report_id
widget_override
```

This permits draggable responsive dashboards.

---

# 159. MOBILE EXPERIENCE

The salesperson mobile experience should prioritise:

- today's work;
- accounts;
- contacts;
- opportunities;
- notes;
- calls;
- meetings;
- quick updates.

Do not simply shrink the desktop dashboard onto a telephone screen.

---

# 160. VOICE NOTE

Useful mobile feature:

**Add voice note**

Atlas transcribes:

> Met Sarah at ABC. They want pricing by Friday. Decision is next Tuesday. Need to include 225 mm pipe.

AI can suggest:

```text
Create task:
Send pricing
Friday

Opportunity next step:
Pricing

Decision date:
Tuesday
```

User confirms changes.

---

# 161. DATA IMPORT

Import:

- leads;
- accounts;
- contacts;
- opportunities;
- activities.

Provide:

1. column mapping;
2. duplicate checking;
3. validation;
4. preview;
5. import;
6. error report;
7. rollback capability where practical.

---

# 162. BULK ACTIONS

Authorised bulk operations:

- assign owner;
- change territory;
- add tag;
- enrol sequence;
- update status;
- create task;
- export;
- merge where applicable.

Bulk actions must respect permissions and validation.

---

# 163. GDPR / PRIVACY CONTROLS

CRM should support:

- communication preferences;
- consent history where used;
- opt-out;
- suppression;
- data export;
- retention policies;
- deletion/anonymisation workflows;
- lawful-business-use notes where configured.

Personal data access should be permission-controlled and auditable.

---

# 164. SALES METHODOLOGY CONFIGURATION

Businesses can optionally define structured methodology.

Example:

```text
BUSINESS PAIN
Known

ECONOMIC BUYER
Sarah Mason

DECISION CRITERIA
Price
Delivery
Product compliance

DECISION PROCESS
Commercial committee

COMPETITION
Supplier X

CHAMPION
James Wood
```

This information should feed deal health.

---

# 165. MANAGER COACHING VIEW

A sales manager should be able to open a salesperson and see:

```text
MICHAEL

Target                  £200k
Actual                  £188k
Forecast                £214k

Pipeline                £480k
Coverage                 4.0x

Win Rate                  42%
Sales Cycle               31d


ATTENTION

2 opportunities slipping
1 opportunity >30 days in proposal
£80k pipeline with no next meeting
```

Then drill into those specific deals.

---

# 166. ONE-TO-ONE VIEW

Optional manager workspace:

```text
MICHAEL / SALES REVIEW

Last review:
26 Sep

Target progress

Forecast changes

Top opportunities

Deals at risk

Pipeline required

Activities

Agreed actions
```

Manager and salesperson can record actions from the review.

---

# 167. PIPELINE INSPECTION

Atlas should have a dedicated inspection mode.

Filters:

```text
This month
My team
Open opportunities
```

Columns:

```text
Opportunity
Account
Stage
Value
Forecast
Close
Value change
Close-date change
Stage change
Last activity
Next action
Risk
```

Highlight what changed since:

- yesterday;
- last week;
- last forecast submission;
- custom date.

Salesforce's current Pipeline Inspection specifically emphasises this type of consolidated view of opportunities, metrics and week-to-week changes.

Atlas should make it available as a core CRM capability.

---

# 168. EXAMPLE PIPELINE INSPECTION

```text
THIS WEEK

                         VALUE    CLOSE      CHANGE

ABC Framework            £120k    31 Oct      Date +14d ⚠
BuildCo                   £84k     18 Oct      +£20k
Northern                  £72k     28 Oct      Stage ↑
Jones                     £61k     12 Nov      Date +30d ⚠
Delta                     £44k     16 Oct      No activity ⚠
```

This tells management considerably more than a static funnel.

---

# 169. NATURAL LANGUAGE CRM SEARCH

Examples:

> Show opportunities over £50k closing this month.

> Which customers haven't been contacted in 90 days?

> Show deals Sarah moved into November this week.

> Which accounts spent less this year than last year?

> Show my open tasks for today.

Atlas turns the request into safe queries.

---

# 170. NATURAL LANGUAGE DASHBOARD CREATION

Example:

> Create me a sales manager dashboard showing monthly sales, pipeline, forecast, target, win rate and each rep's performance.

Atlas generates a dashboard draft.

The user can edit every widget normally afterwards.

---

# 171. CONFIGURATION, NOT DEVELOPMENT

Most CRM behaviour should be controlled by configuration:

- pipelines;
- stages;
- probability;
- qualification;
- fields;
- layouts;
- workflows;
- goals;
- territory;
- assignment;
- notifications;
- reporting;
- dashboards.

Code should define the platform.

Configuration should define how each company sells.

---

# 172. DEVELOPMENT PHASE 1

## Core CRM

Build:

- accounts;
- contacts;
- leads;
- opportunities;
- pipeline;
- stages;
- tasks;
- activities;
- notes;
- search;
- audit;
- saved views.

---

# 173. DEVELOPMENT PHASE 2

## Selling Workspace

Build:

- CRM Home;
- My Work;
- priority engine;
- email integration;
- calendar;
- sequences;
- playbooks;
- lead routing;
- account 360.

---

# 174. DEVELOPMENT PHASE 3

## Analytics

Build:

- report engine;
- report builder;
- report library;
- dashboards;
- dashboard builder;
- goals;
- period comparison;
- drill-down;
- scheduled reports.

I would treat this phase as core product functionality, not a later luxury.

---

# 175. DEVELOPMENT PHASE 4

## Sales Management

Build:

- forecasting;
- forecast submission;
- manager adjustment;
- snapshots;
- pipeline inspection;
- pipeline movement;
- forecast accuracy;
- coaching views.

---

# 176. DEVELOPMENT PHASE 5

## ERP Intelligence

Integrate:

- orders;
- invoices;
- margin;
- deliveries;
- payments;
- products.

Build:

- CRM won versus actual order value;
- customer growth;
- account profitability;
- product whitespace;
- actual customer value;
- opportunity-to-order conversion.

---

# 177. DEVELOPMENT PHASE 6

## Intelligence

Build:

- deal risk;
- relationship signals;
- sales scoring;
- natural-language reporting;
- meeting preparation;
- CRM summaries;
- next-action suggestions;
- data-quality suggestions.

---

# 178. ACCEPTANCE TEST, SALES REP

A salesperson logs in.

Without navigating multiple screens, they must be able to determine:

- who needs contacting;
- what tasks are overdue;
- what meetings are today;
- what deals are at risk;
- what is closing this month;
- current target attainment;
- personal forecast;
- pipeline gap.

---

# 179. ACCEPTANCE TEST, MANAGER

A manager must be able to determine:

- team pipeline;
- pipeline movement;
- forecast;
- target performance;
- pipeline coverage;
- deal slippage;
- stale opportunities;
- rep performance;
- win rates;

and drill from every metric into the underlying opportunities.

---

# 180. ACCEPTANCE TEST, REPORT

User asks:

> Show opportunity value by salesperson for this quarter versus last quarter.

Without technical knowledge they must be able to create:

```text
Source:
Opportunities

Metric:
Opportunity Value

Group:
Owner

Period:
This Quarter

Comparison:
Previous Quarter

Visualisation:
Bar
```

and save it to a dashboard.

---

# 181. ACCEPTANCE TEST, PIPELINE MOVEMENT

Given an opportunity:

```text
Monday
£50,000
October
Proposal
```

and Friday:

```text
£70,000
November
Negotiation
```

Atlas must retain and report:

```text
Value:
+£20,000

Close:
October → November

Stage:
Proposal → Negotiation
```

It must not only retain Friday's final state.

---

# 182. ACCEPTANCE TEST, FORECAST

If a salesperson submits:

```text
£100k
```

and the manager changes their management forecast to:

```text
£90k
```

Atlas must preserve:

- system forecast;
- salesperson submission;
- manager forecast;
- timestamp;
- reason;
- historical snapshot.

---

# 183. ACCEPTANCE TEST, WON DEAL

When a £100,000 opportunity becomes won:

Atlas must be capable of:

1. locking the won commercial result;
2. recording the won date;
3. retaining opportunity history;
4. initiating a quotation/order handoff;
5. preserving the opportunity independently of the resulting order;
6. linking subsequent orders back to the opportunity;
7. reporting expected £100,000 versus actual order intake.

---

# 184. VISUAL DESIGN PRINCIPLE

Atlas CRM should not visually resemble old enterprise software.

Avoid:

- endless tabs;
- dense grey forms;
- tiny tables;
- dozens of icons;
- coloured status badges everywhere;
- popup warnings;
- enormous side menus.

Use:

- strong typography;
- whitespace;
- restrained colour;
- clear hierarchy;
- large usable tables;
- contextual side panels;
- progressive disclosure;
- inline editing;
- meaningful charts;
- clear exceptions.

Complexity should appear only when somebody needs it.

---

# 185. THE FINAL CRM PRINCIPLE

The CRM should not be somewhere salespeople are forced to enter information for management.

It should be the place that **helps them sell**.

Every interaction should return value to the salesperson.

When they update an opportunity, Atlas improves their forecast.

When they complete a call, Atlas updates the relationship history.

When they enter a next step, Atlas manages their workload.

When they close a deal, Atlas follows it into actual orders.

When they record customer information, Atlas uses it to give them better context later.

The result should be a CRM where the salesperson thinks:

> **"This tells me what I need to do."**

The sales manager thinks:

> **"I finally know what is actually happening."**

And the director thinks:

> **"I can see pipeline, forecast, sales and actual commercial performance in one system."**

That is where Atlas can move beyond being another CRM and become the commercial operating system for the business.
## Authorised summary measures — 9 October 2026

CRM Analytics/Reports summaries use `ownerRestriction(session)` like the prospect
list and pipeline: sales reps see their own records; `sales.pipeline.manage`
permits all owners within the session company. Win rate uses grouped counts of all
matching WON/LOST opportunities instead of an unlabelled 8,000-row slice. The
prospect trend still explicitly declares its latest-8,000 source limit. Reports
keeps the Analytics licence/dashboard capability for summaries and adds literal
Excel output, definitions and selected columns. No CRM records are changed.
