# ATLAS PROJECTS

## Projects, Tasks, Notes, Workspaces, Workload, Collaboration and Portfolio Management

# 1. PRODUCT VISION

Build Atlas Projects as a complete work management environment integrated directly into Atlas ERP.

It must support everything from:

```text
Remember to ring supplier
```

through:

```text
Private personal project
```

through:

```text
Department project
```

through:

```text
Cross-functional business project
```

through:

```text
Major strategic programme
```

without forcing every user into heavyweight project-management methodology.

The product should feel:

- extremely fast
- visually polished
- calm
- flexible
- collaborative
- powerful when required
- simple when not
- deeply connected to Atlas
- useful every day

The objective is not to create another Monday.com clone.

The objective is:

> Make Atlas the place where the company plans, discusses, decides and gets work done.

---

# 2. RESEARCH PRINCIPLES

The strongest existing products demonstrate several useful ideas.

Monday.com uses highly configurable boards and supports different visibility models including main, private and shareable workspaces, plus granular permissions.

Asana provides dependencies, portfolios, milestones and resource workload across projects. Its portfolio layer provides leadership visibility across multiple projects rather than forcing managers to inspect each project individually.

ClickUp supports numerous representations of the same work, including list, board, calendar, Gantt, timeline and workload views. Its workload system combines task effort with individual capacity, while its automation system uses trigger, condition and action rules.

Linear demonstrates that sophisticated project management does not have to feel visually complicated. It keeps high-level timelines separate from granular task execution, supports milestones, project health updates and initiatives that group related projects around larger objectives.

Notion and ClickUp both show the benefit of keeping project documents and notes directly alongside tasks rather than treating documentation as a different application.

Atlas should combine these strengths but use a single coherent work model.

---

# 3. CORE DIFFERENTIATOR

Standalone project tools understand:

```text
Task
Project
Person
Date
Status
```

Atlas understands:

```text
Customer
Supplier
Product
Sales Order
Purchase Order
Invoice
Production Order
Shipment
Warehouse
Machine
Employee
Project
Task
Finance
```

Therefore Atlas Projects can create genuine relationships.

Example:

```text
PROJECT

Customer Launch
    │
    ├── TASK
    │   Approve commercial terms
    │
    │   ↳ Customer ABC
    │   ↳ Quote Q-882
    │
    ├── TASK
    │   Build initial stock
    │
    │   ↳ Product SP1
    │   ↳ Production MO-281
    │
    └── TASK
        Deliver first order

        ↳ Sales Order SO-991
        ↳ Shipment SH-288
```

Those references must remain live.

Atlas must not copy their status into project fields.

---

# 4. PROJECTS DOMAIN

Create:

```text
PROJECTS
│
├── Home
├── My Work
├── My Day
├── Inbox
├── Projects
├── Portfolios
├── Goals
├── Tasks
├── Notes
├── Docs
├── Decisions
├── Requests
├── Calendar
├── Timeline
├── Workload
├── Timesheets
├── Automations
├── Templates
├── Reports
└── Archive
```

Do not display every submodule to every user.

Personal users may mainly see:

```text
My Work
Projects
Notes
Calendar
```

Project managers may additionally use:

```text
Portfolios
Workload
Reports
Automations
```

---

# 5. WORK HIERARCHY

Atlas should support:

```text
GOAL
  │
  ▼
PORTFOLIO / INITIATIVE
  │
  ▼
PROGRAMME
  │
  ▼
PROJECT
  │
  ▼
PHASE / MILESTONE
  │
  ▼
TASK
  │
  ▼
SUBTASK
  │
  ▼
CHECKLIST ITEM
```

Not every level is mandatory.

A simple project can be:

```text
Project
↓
Tasks
```

A complex transformation can be:

```text
Company Goal
↓
Programme
↓
5 Projects
↓
Milestones
↓
Tasks
```

---

# 6. PROJECT TYPES

Support:

```text
PERSONAL

TEAM

DEPARTMENT

CROSS-FUNCTIONAL

CUSTOMER

SUPPLIER

OPERATIONAL

CAPITAL

PRODUCT

IMPLEMENTATION

CHANGE

STRATEGIC

CONFIDENTIAL
```

Do not encode hard business rules directly from project type.

Use templates and policies.

---

# 7. VISIBILITY

Every Project can be:

```text
PRIVATE

INVITE_ONLY

TEAM

DEPARTMENT

COMPANY

EXTERNAL_COLLABORATION
```

### PRIVATE

Only owner and specifically invited users.

Suitable for:

- personal planning
- confidential work
- drafts
- management matters

### TEAM

Visible to members of selected team.

### COMPANY

Visible across permitted Atlas organisation.

### EXTERNAL_COLLABORATION

Allows selected external users into a tightly restricted project area.

---

# 8. PERMISSION PRINCIPLE

A project containing a link to a restricted Atlas record does not grant access to that record.

Example:

```text
Project visible:
YES

Linked salary review:
NO PERMISSION
```

Viewer sees:

```text
Restricted Atlas record
```

not the sensitive contents.

Project permissions and ERP record permissions remain separate.

---

# 9. PROJECT ROLES

Support:

```text
PROJECT OWNER

PROJECT LEAD

PROJECT MANAGER

MEMBER

CONTRIBUTOR

COMMENTER

VIEWER

EXTERNAL GUEST
```

Permissions should be configurable.

---

# 10. PROJECT HOME

Opening a project should not initially show a giant board.

Instead show a beautiful project overview.

Example:

```text
WAREHOUSE EXPANSION

On Track

Owner
Michael

Target
18 December

Progress
62%

────────────────────────────────

NEXT MILESTONE

Racking Installation
12 October

────────────────────────────────

ATTENTION

3 overdue tasks
1 blocked task
Budget 6% above forecast

────────────────────────────────

RECENT UPDATE

Warehouse layout approved.
Electrical work begins Monday.

────────────────────────────────

MY WORK

Approve final racking quote
Review location coding
Sign contractor access plan
```

Then navigation:

```text
Overview
Tasks
Plan
Timeline
Docs
Notes
Decisions
Files
People
Budget
Risks
Updates
Activity
```

Modules appear only when relevant.

---

# 11. PROJECT OBJECT

Core entity:

```text
project

id
project_code

name
description

project_type

visibility

status
health

owner_user_id
lead_user_id

team_id
department_id

start_date
target_date
actual_finish_date

priority

progress_method

portfolio_id
programme_id

customer_id
supplier_id

budget_enabled
time_tracking_enabled

created_by
created_at

updated_at
updated_by

archived_at
```

---

# 12. PROJECT STATUS

Default:

```text
IDEA

PLANNING

READY

ACTIVE

ON_HOLD

COMPLETED

CANCELLED
```

Organisations may configure additional statuses.

Do not allow arbitrary free-text states.

---

# 13. PROJECT HEALTH

Health is different from status.

Possible:

```text
ON_TRACK

WATCH

AT_RISK

OFF_TRACK

NO_UPDATE
```

Health can be:

```text
MANUAL
SYSTEM_SUGGESTED
```

Atlas may suggest:

> At Risk

because:

```text
Target date: 30 October

Critical milestone:
6 days late

4 blocking tasks unresolved

Responsible team capacity:
112%
```

But authorised project owner decides whether to accept the health change.

---

# 14. PROJECT PROGRESS

Never assume progress equals:

```text
completed task count
÷
all tasks
```

Support:

```text
TASK_COUNT

WEIGHTED_TASKS

MILESTONE

EFFORT

TIME

MANUAL

CUSTOM
```

Example:

Task A:

```text
Weight 50%
```

Task B:

```text
Weight 10%
```

A tiny admin task should not count equally with a six-week implementation activity.

---

# 15. TASK MODEL

Task is a first-class Atlas object.

```text
task

id
task_number

title
description

task_type

project_id

parent_task_id

status
priority

owner_user_id

start_date
due_date

estimated_effort

actual_effort

progress

milestone_id

created_by
created_at

completed_at
completed_by
```

---

# 16. TASK TYPES

Defaults:

```text
TASK

ACTION

ISSUE

REQUEST

BUG

DECISION

APPROVAL

REVIEW

FOLLOW_UP

DELIVERABLE
```

Teams may configure their own.

Do not create different underlying database models for each.

---

# 17. TASK NUMBER

Each task gets a readable identifier.

Example:

```text
PROJ-184
```

or team-specific:

```text
OPS-882
MKT-119
FIN-229
```

Useful for:

```text
search
mentions
emails
meetings
audit
```

---

# 18. TASK ASSIGNMENT

Support:

```text
One accountable owner
```

plus:

```text
Contributors
```

This avoids ambiguity.

Task:

```text
Owner:
Michael

Contributors:
Donna
Kim
Daniel
```

There should always be clarity about who owns completion.

---

# 19. MULTI-ASSIGNEE MODE

Some organisations prefer multiple assignees.

Support this optionally.

However Atlas should distinguish:

```text
ACCOUNTABLE OWNER
```

from:

```text
PARTICIPANTS
```

to avoid tasks where everyone assumes somebody else owns it.

---

# 20. TASK STATUS

A project may define a workflow.

Example:

```text
BACKLOG
↓
READY
↓
IN_PROGRESS
↓
REVIEW
↓
DONE
```

Another:

```text
REQUESTED
↓
ASSESSING
↓
APPROVED
↓
IMPLEMENTING
↓
COMPLETE
```

Status belongs to workflow configuration.

---

# 21. BOARD COLUMNS ARE NOT THE DATA MODEL

Important.

Do not create task state based on visual board columns.

The task has:

```text
status_id
```

Board views group by status.

Other views can group by:

```text
assignee
priority
project
milestone
team
department
```

without changing data architecture.

---

# 22. TASK PRIORITY

Default:

```text
CRITICAL
HIGH
NORMAL
LOW
NONE
```

Allow organisation-specific labels.

---

# 23. TASK DATES

Support:

```text
start date
due date

planned start
planned finish

actual start
actual completion
```

For simple work, only:

```text
due date
```

is necessary.

---

# 24. TASK DEPENDENCIES

Support:

```text
BLOCKS

BLOCKED_BY
```

Advanced:

```text
FINISH_TO_START

START_TO_START

FINISH_TO_FINISH

START_TO_FINISH
```

with:

```text
lag
lead
```

Asana demonstrates how dependencies make handoffs and deadline impact visible, while Linear surfaces project dependencies directly in timeline planning.

---

# 25. BLOCKER EXPERIENCE

Task:

```text
Install equipment
```

shows:

```text
BLOCKED

Waiting for:
Electrical installation

Expected:
8 October
```

If upstream task moves:

```text
8 October
→
12 October
```

Atlas highlights the impact.

---

# 26. DEPENDENCY IMPACT

Show:

```text
TASK DELAYED 4 DAYS

Potential impact:

Testing
+4 days

Training
+4 days

Project target
At risk by 2 days
```

Do not automatically change every date unless scheduling policy permits it.

---

# 27. SUBTASKS

Tasks may contain subtasks.

Example:

```text
Launch Website

├── Final QA
├── DNS configuration
├── Analytics
└── Production release
```

Subtasks are full tasks.

They may have:

```text
owner
dates
status
comments
dependencies
```

---

# 28. CHECKLISTS

Do not force simple checklist activity into subtasks.

Example:

```text
Prepare room

☑ Chairs
☑ Projector
☐ Water
☐ Visitor passes
```

Checklist items are intentionally lightweight.

---

# 29. RECURRING TASKS

Support:

```text
Daily
Weekly
Monthly
Quarterly
Annually
Custom RRULE
```

Examples:

```text
Monthly inventory review

Weekly KPI review

Quarterly supplier meeting
```

Completion should generate the next occurrence according to policy.

---

# 30. TASK TEMPLATES

Task template can include:

```text
description
checklist
owner role
due-date offset
priority
fields
dependencies
automations
```

---

# 31. TASK LINKS

Tasks can relate to:

```text
another task

project

goal

document

note

decision

Atlas record
```

Relationships have types.

Examples:

```text
RELATES_TO

DUPLICATES

BLOCKS

CAUSED_BY

FOLLOW_UP_TO

IMPLEMENTS

REVIEWS
```

---

# 32. ATLAS BUSINESS LINKS

Create generic:

```text
work_object_link
```

Fields:

```text
source_type
source_id

relationship_type

target_domain
target_entity
target_id
```

This allows task links to:

```text
Customer
Supplier
Product
Sales Order
Invoice
Purchase Order
Production Order
Shipment
Quality Issue
Machine
Employee
```

without adding hundreds of nullable FK columns to Task.

---

# 33. LIVE RECORD CARDS

A linked record should render intelligently.

Example:

```text
SO-18829

ABC Ltd
£42,891

Status
Partially Dispatched

Requested
8 Oct
```

If Sales updates the order, the project sees the current status automatically.

---

# 34. TASK DETAIL EXPERIENCE

Clicking a task opens a clean side panel or full workspace.

Header:

```text
OPS-882

Finalise warehouse layout
```

Fields:

```text
Status
Owner
Priority
Dates
Project
Milestone
Estimate
```

Body:

```text
Description

Linked work

Checklist

Subtasks

Attachments

Comments

Activity
```

Do not cover the screen in custom fields by default.

---

# 35. CUSTOM FIELDS

Support:

```text
Text
Number
Currency
Percentage
Date
Date range
Select
Multi-select
Person
Team
Checkbox
URL
Atlas record
Formula
```

Custom fields can be:

```text
project-specific
team-shared
company-global
```

---

# 36. PROPERTY LIBRARY

Do not recreate:

```text
Priority
```

fifty times.

Global properties should exist in a reusable library.

Example:

```text
Impact
Risk
Department
Workstream
Estimated Cost
Customer
```

---

# 37. MULTIPLE VIEWS

The same project data can be shown as:

```text
List
Board
Table
Timeline
Gantt
Calendar
Workload
Milestones
Activity
```

Monday, Notion and ClickUp all demonstrate the usefulness of multiple views over the same underlying work rather than separate copies of tasks.

---

# 38. LIST VIEW

Default day-to-day operational view.

Example:

```text
TASK                       OWNER    STATUS       DUE

Approve contract           Mike     In progress  Today
Confirm equipment          Donna    Ready        8 Oct
Install equipment          Steve    Blocked      10 Oct
```

Support:

```text
inline editing
sorting
grouping
filtering
column reorder
column hide
bulk actions
```

---

# 39. BOARD VIEW

Board can group by:

```text
Status
Assignee
Priority
Phase
Team
Custom field
```

Example:

```text
BACKLOG       READY       DOING       REVIEW       DONE
```

Cards should remain visually restrained.

Avoid giant rainbow Monday-style boards.

---

# 40. TABLE VIEW

For power users.

Dense data:

```text
50+
tasks
custom fields
dates
budget
effort
```

with spreadsheet-like editing.

---

# 41. TIMELINE

Timeline is for project planning.

Show:

```text
projects
phases
milestones
tasks
dependencies
```

with zoom:

```text
Day
Week
Month
Quarter
Year
```

---

# 42. GANTT

Advanced project planning.

Support:

```text
dependencies
critical path
baseline
slippage
milestones
progress
```

Dragging a task date should show impact before committing changes.

---

# 43. BASELINES

Project managers can snapshot:

```text
BASELINE 1
```

containing:

```text
task dates
milestones
budget
effort
scope
```

Then compare:

```text
Current
vs
Baseline
```

---

# 44. PROJECT SLIPPAGE

Example:

```text
ORIGINAL TARGET
30 November

CURRENT FORECAST
8 December

SLIPPAGE
8 days
```

Drill into causes.

---

# 45. CRITICAL PATH

For dependency-driven plans, calculate:

```text
critical path
float
slack
```

Do not burden simple projects with these concepts.

Only expose when advanced planning is enabled.

---

# 46. CALENDAR

Show:

```text
tasks
milestones
deadlines
meetings
project events
```

Views:

```text
Month
Week
Agenda
```

Drag to reschedule where permitted.

---

# 47. MY WORK

This is arguably the most important screen.

It aggregates work from every project.

Example:

```text
MY WORK

TODAY

Approve transport quote
Warehouse Expansion

Review stock forecast
Operations

Reply to customer implementation questions
Customer ABC Launch

────────────────────

THIS WEEK

8 tasks

────────────────────

WAITING ON

3 tasks

────────────────────

OVERDUE

2 tasks
```

Notion's My Tasks concept similarly aggregates assigned tasks from multiple task sources into one place.

Atlas should go further.

---

# 48. MY DAY

My Day is not simply "tasks due today".

It is a personal execution workspace.

Sections:

```text
FOCUS

DUE TODAY

OVERDUE

MEETINGS

WAITING ON

RECENT MENTIONS

APPROVALS

FOLLOW UPS
```

User can drag tasks into:

```text
TODAY
```

without changing their actual project deadline.

This creates a private personal plan.

---

# 49. FOCUS MODE

Select:

```text
Focus
```

Atlas displays one task at a time.

Example:

```text
FINALISE RACKING QUOTE

Due today
45 min estimate

Project
Warehouse Expansion

Related
Supplier ABC
Quote PQ-112

[Start]

Comments
Notes
Checklist
```

Reduces distraction.

---

# 50. PERSONAL TASKS

Allow tasks with no project.

Example:

```text
Ring bank
```

stored as:

```text
personal_task
```

or normal Task with:

```text
project_id = null
visibility = PRIVATE
```

Prefer one task engine.

Do not maintain separate to-do code.

---

# 51. QUICK CAPTURE

Global:

```text
+ New
```

or keyboard shortcut.

Type:

```text
Call John about transport tomorrow
```

Atlas can interpret:

```text
Task:
Call John about transport

Due:
Tomorrow
```

Show interpreted properties before save.

---

# 52. UNIVERSAL INBOX

Anything needing attention appears in:

# Inbox

Sources:

```text
task assigned
mention
comment
approval
request
project update
dependency cleared
deadline change
ERP event
```

Inbox should be actionable.

Not merely a notification log.

---

# 53. INBOX ACTIONS

From inbox:

```text
Complete
Reply
Assign
Snooze
Open
Dismiss
```

Aim for Inbox Zero behaviour.

---

# 54. SNOOZE

Users can snooze:

```text
Later today
Tomorrow
Next week
Custom
```

This affects inbox visibility, not underlying task due date.

---

# 55. NOTES

Create a serious Notes module.

Types:

```text
PERSONAL NOTE

PROJECT NOTE

TEAM NOTE

MEETING NOTE

CUSTOMER NOTE

SUPPLIER NOTE
```

---

# 56. PRIVATE NOTES

Private notes must genuinely be private.

Example:

```text
My Notes

Private
```

Searchable only by owner unless deliberately shared.

Do not accidentally inherit project permissions.

---

# 57. NOTE EDITOR

Modern block editor supporting:

```text
paragraph
heading
bullet
numbered list
checklist
table
callout
code
quote
divider
image
attachment
embed
Atlas record
task
```

---

# 58. INLINE TASK CREATION

Highlight:

```text
Donna to confirm budget by Friday
```

Choose:

```text
Create task
```

Atlas creates:

```text
Confirm budget

Owner:
Donna

Due:
Friday
```

and leaves a live reference inside the note.

ClickUp supports creating tasks directly from document text. Atlas should make this behaviour native throughout notes and documents.

---

# 59. MEETING NOTES

Meeting note template:

```text
WEEKLY PROJECT REVIEW

3 October 2026

Attendees
Michael
Donna
Kim

AGENDA

...

NOTES

...

DECISIONS

...

ACTIONS

...
```

Tasks created in Actions automatically link back to the meeting.

---

# 60. MEETING SERIES

Recurring meeting series should retain:

```text
previous notes
open actions
previous decisions
```

When creating next meeting:

```text
Outstanding Actions

Donna
Confirm budget
OVERDUE

Michael
Issue supplier PO
DONE
```

This is far more useful than blank meeting pages.

---

# 61. PROJECT DOCUMENTS

Docs differ from Notes.

Notes:

```text
informal
quick
working
```

Docs:

```text
structured
long-lived
formal
```

Examples:

```text
Project Brief
Specification
Process
Business Case
Implementation Plan
Lessons Learned
```

---

# 62. DOCUMENT VERSIONING

Track:

```text
version
author
date
changes
```

Allow:

```text
restore
compare
```

---

# 63. COLLABORATIVE EDITING

Support:

```text
real-time cursors
presence
comments
mentions
```

Linear provides real-time collaborative project documents directly attached to projects and other work objects.

---

# 64. DOCUMENT PERMISSIONS

Doc may:

```text
inherit project
```

or have stricter:

```text
private
selected people
```

Never allow a child document to become less restrictive than a confidential parent unless specifically permitted.

---

# 65. DECISION LOG

This should be a first-class feature.

Projects constantly lose knowledge of:

> Why did we decide this?

Create:

```text
project_decision
```

Example:

```text
DEC-019

Use Supplier B for racking

Decision:
Approved

Date:
3 October

Owner:
Michael

Reason:
£18k lower whole-life cost and 2-week shorter lead time.

Alternatives:
Supplier A
Supplier C

Related:
Quote Q-188
Task OPS-829
```

---

# 66. DECISION STATUS

```text
PROPOSED

PENDING

APPROVED

REJECTED

SUPERSEDED
```

---

# 67. DECISION HISTORY

If decision changes:

```text
DEC-019
SUPERSEDED BY
DEC-028
```

Do not rewrite history.

---

# 68. PROJECT UPDATES

Project managers should post structured updates.

Template:

```text
HEALTH
On Track

SUMMARY

This week

Next

Risks

Decisions needed
```

Linear uses structured project health updates and maintains their history.

Atlas should do likewise.

---

# 69. UPDATE CADENCE

Project can require:

```text
Daily
Weekly
Fortnightly
Monthly
Custom
None
```

If expected update missing:

```text
UPDATE OVERDUE
```

---

# 70. AUTOMATIC UPDATE DRAFT

Atlas can prepare a draft from deterministic changes:

```text
12 tasks completed

2 tasks became overdue

Milestone moved 3 days

Budget increased £4,800

New risk added
```

AI may turn those facts into readable prose.

Project owner reviews before publishing.

---

# 71. PROJECT ACTIVITY

Single chronological feed.

Example:

```text
10:48
Donna completed "Approve budget"

10:22
Michael moved target date
12 Oct → 14 Oct

09:41
Production Order MO-228 linked

Yesterday
Project health changed
On Track → At Risk
```

---

# 72. COMMENTS

Comments available on:

```text
task
project
document
note
decision
risk
milestone
```

Support:

```text
@mentions
replies
reactions
attachments
```

---

# 73. ACTIONABLE COMMENTS

Comment:

```text
@Donna can you check this?
```

User may convert comment into:

```text
Task
```

without copying text manually.

---

# 74. RESOLVE THREAD

Comment threads can be:

```text
OPEN
RESOLVED
```

Resolved conversations remain auditable.

---

# 75. MILESTONES

Create:

```text
milestone
```

Fields:

```text
name
description
target_date
actual_date
status
owner
```

Examples:

```text
Design Approved

Factory Acceptance

Go Live

Customer Launch
```

Linear uses milestones to divide a project into meaningful stages and expose milestone progress in higher-level timeline views.

---

# 76. MILESTONE PROGRESS

Derived from:

```text
linked tasks
weighted progress
manual progress
```

depending on policy.

---

# 77. MILESTONE DEPENDENCIES

Allow:

```text
Milestone A
blocks
Milestone B
```

Across different projects where permitted.

---

# 78. PORTFOLIOS

Portfolios group projects.

Examples:

```text
2027 CAPITAL PROJECTS

DIGITAL TRANSFORMATION

CUSTOMER IMPLEMENTATIONS

COST REDUCTION

NEW PRODUCT DEVELOPMENT
```

---

# 79. PORTFOLIO VIEW

Example:

```text
PROJECT                OWNER      HEALTH      PROGRESS   TARGET

Warehouse Expansion    Michael    On Track      62%      Dec
Odoo Phase 2           Kim        At Risk       41%      Nov
New Kiln                Steve      Watch          73%      Jan
```

---

# 80. PORTFOLIO ANALYTICS

Show:

```text
projects by health

projects by status

budget

forecast

resource demand

milestone risk

overdue work

strategic alignment
```

Asana similarly uses portfolios for high-level status, progress, dates, workload and reporting across projects.

---

# 81. NESTED PORTFOLIOS

Allow:

```text
OPERATIONS
│
├── Manufacturing
│   ├── Kiln Programme
│   └── Automation Programme
│
└── Logistics
    ├── Warehouse Expansion
    └── Fleet Replacement
```

Avoid arbitrary hierarchy depth.

Recommended maximum:

```text
3 to 5 meaningful levels
```

---

# 82. GOALS

Create company goals.

Example:

```text
Reduce operating cost by £1m
```

Supporting projects:

```text
Transport optimisation

Packaging reduction

Energy efficiency
```

Goals allow leadership to understand:

> Why are we doing this project?

---

# 83. GOAL MODEL

```text
goal

name
owner

period

target_type

target_value
current_value

status
confidence
```

Target types:

```text
NUMBER

CURRENCY

PERCENTAGE

BOOLEAN

MILESTONE

MANUAL
```

---

# 84. GOAL PROGRESS

Where possible, use real Atlas data.

Example:

```text
GOAL

Reduce transport cost 10%

Baseline:
£82 / delivery

Current:
£74

Progress:
97%
```

Using the Analytics semantic layer.

Do not ask users to manually update measures Atlas already knows.

---

# 85. WORKLOAD

Workload should be one of the best parts of Atlas Projects.

Display:

```text
PERSON            MON   TUE   WED   THU   FRI

Michael            6h    8h   10h    9h    6h
Donna              8h    7h    5h    5h    4h
Kim                 4h    4h    8h    6h    6h
```

---

# 86. CAPACITY

Each person has:

```text
working calendar
working hours
holiday
absence
project allocation
```

Capacity may come from Atlas employee/workforce configuration.

ClickUp and Asana both use capacity-oriented workload views across tasks and projects.

---

# 87. EFFORT

Task effort can use:

```text
Minutes

Hours

Days

Points

Simple size:
XS S M L XL
```

Teams choose their method.

---

# 88. DISTRIBUTED EFFORT

A 20-hour task running Monday-Friday should not necessarily appear as 20 hours on Friday.

Support:

```text
AUTO DISTRIBUTE

MANUAL DISTRIBUTION
```

Example:

```text
Mon 2h
Tue 4h
Wed 6h
Thu 6h
Fri 2h
```

ClickUp similarly allows workload effort to be distributed across the working period of a task.

---

# 89. OVERCAPACITY

Example:

```text
MICHAEL

Capacity:
40h

Assigned:
52h

OVER:
12h
```

Click to identify contributing tasks.

---

# 90. REBALANCE

Drag a task:

```text
Michael
→
Kim
```

Preview:

```text
Michael:
130% → 110%

Kim:
62% → 82%
```

Then confirm.

---

# 91. PEOPLE VIEW

Manager view:

```text
TEAM

Michael
8 active tasks
2 overdue
84% capacity

Donna
5 active tasks
0 overdue
62% capacity

Kim
12 active tasks
1 blocked
96% capacity
```

---

# 92. PERSONAL CAPACITY PRIVACY

Workload should show work capacity without exposing confidential task information.

Example:

Manager lacks private project access.

Shows:

```text
Private work
8h
```

not:

```text
Redundancy Planning
8h
```

---

# 93. TIME TRACKING

Optional per project.

Task:

```text
Estimate:
8h

Logged:
5h 24m
```

Methods:

```text
timer

manual entry

timesheet
```

---

# 94. TIMER

Task includes:

```text
[Start timer]
```

One active timer per user by default.

---

# 95. TIMESHEET

Weekly:

```text
TASK                         MON TUE WED THU FRI

Warehouse layout             2h  3h  1h
Supplier review                   2h       1h
```

Submit if approval enabled.

---

# 96. TIME COST

If integrated with Finance/HR cost rate:

```text
5h × £42
=
£210 project labour cost
```

Sensitive salary/rate data must remain hidden where users lack Finance/HR permission.

---

# 97. PROJECT BUDGET

Optional Budget module.

Categories:

```text
Labour

Materials

External Services

Equipment

Travel

Freight

Other
```

---

# 98. PROJECT COST SOURCES

Actual cost can come from Atlas.

Examples:

```text
Purchase Orders

Supplier Invoices

Timesheets

Inventory Issues

Expense Claims

Finance Journals
```

This is a major Atlas advantage.

---

# 99. BUDGET VIEW

Example:

```text
WAREHOUSE EXPANSION

Budget        £420,000
Committed     £311,000
Actual        £248,000
Forecast      £438,000

Variance      +£18,000
```

---

# 100. COMMITTED COST

Purchase order:

```text
PO-1882
£80,000
```

linked to project.

Atlas knows:

```text
£80,000 committed
```

without the PM typing it manually.

---

# 101. PROJECT FINANCE RELATIONSHIP

Use explicit:

```text
project_cost_assignment
```

linking:

```text
PO
Invoice
Expense
Inventory transaction
Timesheet
Finance journal
```

to Project/Task/Workstream.

---

# 102. RISKS

Create first-class:

```text
project_risk
```

Fields:

```text
title

description

probability

impact

severity

owner

mitigation

target_date

status
```

---

# 103. RISK MATRIX

Optional:

```text
              IMPACT
          1  2  3  4  5

PROB  5
      4
      3
      2
      1
```

Do not overuse bright traffic-light graphics.

---

# 104. ISSUES

Risk:

> Something might happen.

Issue:

> Something has happened.

Keep separate.

```text
project_issue
```

can generate remedial Tasks.

---

# 105. PROJECT RAID

Optional combined view:

```text
RISKS

ASSUMPTIONS

ISSUES

DEPENDENCIES
```

Useful for formal PMO environments.

Do not force it onto simple teams.

---

# 106. APPROVALS

Task can require approval.

Example:

```text
Approve Project Budget

Approver:
Donna

Due:
8 Oct
```

States:

```text
PENDING

APPROVED

REJECTED

CHANGES_REQUESTED
```

---

# 107. MULTI-STAGE APPROVAL

Example:

```text
Project Manager
↓
Finance
↓
Director
```

Support:

```text
sequential

parallel
```

---

# 108. APPROVAL EVIDENCE

Store:

```text
approver

decision

timestamp

comment

version approved
```

If document changes materially after approval:

```text
APPROVAL INVALIDATED
```

where policy requires it.

---

# 109. REQUESTS

Create request intake.

Examples:

```text
Marketing request

IT request

Product change

Engineering request

Purchase request

Project request
```

---

# 110. REQUEST FORM

Fields:

```text
Request type

Description

Needed by

Priority

Department

Attachment
```

Submission becomes:

```text
request
```

not automatically a Task until workflow determines it.

---

# 111. TRIAGE

Requests enter:

```text
TRIAGE
```

Reviewer can:

```text
Accept

Reject

Request more information

Convert to task

Convert to project
```

Linear similarly uses triage to review new work before it enters a team's main workflow.

---

# 112. EXTERNAL FORMS

Allow controlled forms for:

```text
employees

customers

suppliers

external people
```

Submission may create:

```text
Request

Task

Issue
```

Asana and Notion both use forms as structured intake mechanisms feeding work management.

---

# 113. AUTOMATIONS

Automation should be understandable by normal users.

Model:

```text
WHEN
something happens

IF
conditions are true

THEN
do something
```

ClickUp uses the same useful trigger, condition and action structure.

---

# 114. AUTOMATION EXAMPLE

```text
WHEN
Status becomes Complete

IF
Task Type = Approval

THEN
Notify project owner
```

---

# 115. DATE AUTOMATION

```text
WHEN
Due date is tomorrow

IF
Status is not Done

THEN
Notify owner
```

---

# 116. CROSS-ERP AUTOMATION

This is where Atlas becomes interesting.

```text
WHEN
Production Order MO linked to project completes

THEN
Complete task "Produce trial batch"
```

Or:

```text
WHEN
Purchase Order PO-882 becomes fully received

THEN
Move task "Receive equipment"
to Done

AND
Create task
"Installation inspection"
```

---

# 117. AUTOMATION ACTIONS

Examples:

```text
Create task

Assign owner

Change status

Set priority

Set due date

Add comment

Create approval

Send Atlas notification

Send email

Add to project

Create project

Create note

Create follow-up

Update health

Call webhook
```

---

# 118. AUTOMATION SAFETY

Automations must have:

```text
execution log

creator

enabled status

failure handling

loop protection

rate protection
```

Never create infinite:

```text
Task changed
→ change task
→ triggers same automation
```

loops.

---

# 119. AUTOMATION HISTORY

Show:

```text
Rule:
Complete follow-up

Triggered:
10:42

Task:
OPS-188

Result:
Task OPS-221 created
```

---

# 120. TEMPLATES

Support templates for:

```text
Project

Task

Document

Meeting

Portfolio

Request

Workflow
```

---

# 121. PROJECT TEMPLATE

Could include:

```text
phases

milestones

tasks

dependencies

documents

custom fields

roles

automations

views
```

Linear also supports reusable project templates containing milestones and work.

---

# 122. TEMPLATE VARIABLES

Template:

```text
New Customer Implementation
```

can prompt:

```text
Customer

Go-live date

Project lead

Implementation type
```

Then dynamically calculate task dates.

---

# 123. RELATIVE DATES

Example template:

```text
Kick-off
T

Training
T + 21 days

Go Live
T + 42 days
```

Where:

```text
T = project start
```

---

# 124. PROJECT CREATION

Simple:

```text
New Project

Name

Owner

Target date

Team
```

Advanced options hidden under:

```text
More options
```

Do not force a 30-field creation form.

---

# 125. PROJECT CREATION WITH AI

User:

> Create a project to move Warehouse 2 to a new site by 1 February.

Atlas may propose:

```text
Planning

Site preparation

Inventory plan

Racking

IT

Move

Testing

Go live
```

with suggested milestones/tasks.

User reviews before creation.

Monday already offers AI-assisted board generation from a natural-language description. Atlas can go further because it knows business entities and project templates.

---

# 126. AI PROJECT BRIEF

Atlas can create:

```text
Objective

Scope

Deliverables

Risks

Milestones

Stakeholders
```

from project context.

Must be editable.

---

# 127. ASK PROJECT

Within project:

```text
Ask Atlas
```

Questions:

> What is blocking go-live?

> What changed this week?

> Which tasks are overdue?

> What decisions are outstanding?

> Why is the project at risk?

Answers must reference real project data.

---

# 128. PROJECT MEMORY

This is different from AI chat memory.

Atlas Projects should have deterministic project context:

```text
Description

Docs

Notes

Decisions

Tasks

Comments

Linked records

Updates

Risks

Files
```

AI can retrieve from this controlled scope.

---

# 129. PROJECT BRIEFING

Button:

```text
Brief me
```

Example:

```text
WAREHOUSE EXPANSION

Progress:
62%

Health:
At Risk

Since you last viewed:

8 tasks completed
2 deadlines changed
1 new risk
PO-882 approved
Milestone "Electrical Complete" moved 3 days

Attention:

Racking delivery may affect go-live.
```

This could be genuinely excellent.

---

# 130. SMART RETURN

When user returns after absence:

```text
WELCOME BACK

Here's what changed in this project.
```

Not a wall of notifications.

---

# 131. PROJECT SIGNALS

Create an internal:

```text
ProjectSignalEngine
```

Signals:

```text
deadline risk

blocker

stale task

missing owner

capacity conflict

budget risk

unresolved decision

dependency delay

ERP record exception
```

---

# 132. SIGNAL EXAMPLE

```text
GO-LIVE RISK

Milestone
Warehouse Ready

Target
20 Oct

Risk:
Electrical Task is 4 days late

Downstream:
Racking Installation
Testing
Go Live
```

---

# 133. PROJECT HEALTH ENGINE

Inputs might include:

```text
overdue critical tasks

dependency slippage

milestone trend

budget variance

capacity

scope growth

update freshness

unresolved risks
```

Output:

```text
suggested health
```

Never silently change formal project health without configured permission.

---

# 134. STALE PROJECT DETECTION

Atlas can identify:

```text
No task completed 21 days

No update 30 days

Target still future

Status ACTIVE
```

Suggest:

> Is this project still active?

Avoid thousands of abandoned projects.

---

# 135. SCOPE CHANGE

Track project scope changes.

Example:

```text
14 tasks added
6 removed
```

after baseline.

Show:

```text
Scope +18%
```

where useful.

---

# 136. CHANGE REQUESTS

Formal projects may enable:

```text
project_change_request
```

Fields:

```text
requested change

reason

cost impact

schedule impact

scope impact

approval
```

---

# 137. PROJECT FILES

Files can be:

```text
attached

linked from Atlas document storage

external integration reference
```

Organise:

```text
Recent

By task

By document

By type
```

Avoid making users manage an old-fashioned folder tree unless they choose to.

---

# 138. FILE VERSIONING

Where Atlas owns the file:

```text
version
uploaded by
date
```

Do not overwrite silently.

---

# 139. SEARCH

Global project search:

```text
projects

tasks

notes

docs

comments

decisions

files
```

Search:

```text
warehouse racking
```

returns contextual results.

---

# 140. COMMAND PALETTE

Keyboard:

```text
⌘K
```

Commands:

```text
Create task

Open project

Assign to me

Change status

Add note

New project

Search
```

Linear demonstrates how strong keyboard navigation can keep sophisticated project management extremely fast.

Atlas should adopt this philosophy without copying the interface.

---

# 141. QUICK TASK ENTRY

Anywhere:

```text
T
```

or:

```text
+ Task
```

Opens lightweight creator.

Required:

```text
title
```

Everything else optional.

---

# 142. NATURAL LANGUAGE DATE ENTRY

Allow:

```text
Friday

next Monday

end of month

in 2 weeks
```

Resolve to date visibly.

Always show resolved date before saving.

---

# 143. MENTIONS

Support:

```text
@person

@team

@project

@task

@document
```

and Atlas business objects:

```text
@customer

@salesorder

@product
```

Search result should be contextual.

---

# 144. FOLLOW

Users can follow:

```text
project

task

document

note
```

without being assigned.

---

# 145. NOTIFICATION CONTROL

Allow per project:

```text
All activity

Important activity

Mentions only

Mute
```

Do not bombard people.

---

# 146. NOTIFICATION BUNDLING

Instead of:

```text
27 notifications
```

show:

```text
Warehouse Expansion
7 updates

2 tasks completed
3 comments
1 date changed
1 mention
```

---

# 147. WORKSPACE ORGANISATION

Projects can be grouped into:

```text
Teams

Departments

Spaces
```

But do not create deep hierarchy like:

```text
Workspace
> Space
> Folder
> Subfolder
> List
> List Group
```

unless necessary.

Keep mental model simple.

---

# 148. TEAM HOME

Example:

```text
OPERATIONS

Active Projects    12

At Risk             2

Tasks Due Today    18

────────────────────

Projects

Warehouse Expansion
OEE Improvement
Packaging Review

────────────────────

Team Workload

────────────────────

Recent Notes
```

---

# 149. TEAM DOCUMENTS

Team home may pin:

```text
process docs

templates

project links

important dashboards
```

Linear similarly uses team home pages as a place for commonly accessed resources and team-level documentation.

---

# 150. EXTERNAL COLLABORATION

Allow customers or suppliers into selected projects.

External participant can see only:

```text
shared project

shared tasks

shared documents

shared comments
```

No general Atlas navigation.

---

# 151. EXTERNAL TASK ASSIGNMENT

Task:

```text
Provide technical drawing

Assigned:
Supplier ABC
```

External user sees only relevant work.

---

# 152. EXTERNAL PORTAL

Could eventually provide:

```text
Project

Tasks

Files

Updates

Messages
```

with Atlas branding.

Useful for implementations and supplier programmes.

---

# 153. PROJECT DASHBOARD

Project dashboard uses Atlas Analytics.

Widgets:

```text
Progress

Milestones

Task status

Overdue work

Workload

Budget

Risks

Issues

Time

Recent activity
```

Do not create a separate project chart framework.

---

# 154. COMPANY PROJECT DASHBOARD

Example:

```text
ACTIVE PROJECTS      82

ON TRACK             58
WATCH                12
AT RISK               8
OFF TRACK             4

PROJECT VALUE      £8.4m

BUDGET VARIANCE    +£220k

OVERDUE MILESTONES     7
```

Drill directly into the projects.

---

# 155. PMO VIEW

Portfolio management office can view:

```text
Project

Sponsor

Owner

Health

Progress

Budget

Forecast

Target

Last update

Next milestone
```

---

# 156. PROJECT UPDATES BOARD

Leadership can read recent updates without opening every project.

Example:

```text
WAREHOUSE EXPANSION
At Risk

Electrical completion has moved...
```

Linear's project and initiative update system demonstrates the value of structured health updates at portfolio level.

---

# 157. PROJECT CALENDAR ACROSS BUSINESS

View:

```text
all milestones

launches

go-lives

project starts

project completions
```

Filtered by:

```text
team
portfolio
department
owner
```

---

# 158. PROJECT TIMELINE ACROSS BUSINESS

High-level timeline should show Projects and Milestones.

Do not clutter it with every task by default.

Linear intentionally keeps its high-level project timeline focused on projects rather than granular issues. That separation is worth adopting.

---

# 159. CROSS-PROJECT DEPENDENCIES

Example:

```text
NEW WAREHOUSE
Project A

must complete

before

ERP CUTOVER
Project B
```

Portfolio timeline shows this dependency.

---

# 160. PROJECT DUPLICATION

Allow:

```text
Duplicate Project
```

Options:

```text
Structure

Tasks

Documents

Automations

People

Dates
```

Shift dates relative to new start.

---

# 161. ARCHIVE

Completed project:

```text
Archive
```

Retains:

```text
tasks

docs

decisions

comments

audit

financial links
```

Nothing should disappear merely because project completed.

---

# 162. LESSONS LEARNED

On project close:

```text
What worked?

What did not?

What should we repeat?

What should we avoid?

Key decisions
```

Optionally create reusable lessons accessible to future project templates.

---

# 163. PROJECT CLOSURE

Checklist may require:

```text
Tasks complete

Open risks closed

Financial review complete

Documents finalised

Lessons captured

Owner approval
```

Then:

```text
CLOSE PROJECT
```

---

# 164. PROJECT AUDIT TRAIL

Record significant events:

```text
Project created

Owner changed

Dates changed

Budget changed

Task completed

Approval given

Project health changed

Project archived
```

---

# 165. IMMUTABLE AUDIT

Audit events must not be editable by normal users.

Correction occurs through subsequent events.

---

# 166. PERSONAL VIEWS

Every user can create views.

Examples:

```text
My Priority Work

This Week

Waiting on Others

Customer Projects

Finance Actions
```

Views store:

```text
filters

grouping

sorting

columns

layout
```

They do not copy tasks.

---

# 167. SHARED VIEWS

View can be:

```text
PRIVATE

TEAM

PROJECT

COMPANY
```

ClickUp similarly supports private/shared views over the same underlying work.

---

# 168. SAVED FILTERS

Example:

```text
Owner = Me

Status != Done

Due <= Next 7 Days
```

save:

```text
My Week
```

---

# 169. ADVANCED FILTERS

Support:

```text
AND

OR

nested conditions
```

Example:

```text
(
  Owner = Me
  OR Contributor = Me
)
AND
Status != Done
AND
Due <= 7 days
```

---

# 170. BULK ACTIONS

Select 30 tasks.

Actions:

```text
Assign

Status

Priority

Move project

Add tag

Change dates

Archive
```

Permission-aware.

---

# 171. TASK RANKING

Store explicit:

```text
position
```

for manual prioritisation.

Do not depend upon creation date for ordering.

---

# 172. LABELS

Use lightweight labels for cross-cutting classification.

Examples:

```text
Compliance

Cost Saving

Customer

Safety
```

Do not use labels as a substitute for proper structured fields.

---

# 173. PROJECT TAGGING

Projects can have:

```text
Strategic

Operational

Mandatory

Customer-facing

Capital
```

Useful for portfolio filtering.

---

# 174. PROJECT CODE

Allow auto numbering:

```text
PRJ-2026-0082
```

or manually configured code.

Useful for:

```text
Finance

Purchase Orders

Documents

Timesheets
```

---

# 175. BUSINESS PROJECT LINK

Atlas modules can link records to project.

Examples:

Sales Order:

```text
Project:
Customer Rollout
```

Purchase Order:

```text
Project:
Warehouse Expansion
```

Production Order:

```text
Project:
New Product Launch
```

---

# 176. PROJECT COST CENTRE

Finance can optionally create/use:

```text
project financial dimension
```

so financial postings can report:

```text
Actual Cost by Project
```

---

# 177. CAPITAL PROJECT SUPPORT

For CAPEX project:

```text
budget

PO commitments

supplier invoices

labour

asset creation
```

When project completes, Finance may capitalise relevant costs according to configured accounting processes.

Projects itself does not determine accounting policy.

---

# 178. CUSTOMER PROJECT SUPPORT

Link:

```text
customer

contract

sales order

invoice

support cases
```

Potential use:

```text
customer implementation
installation
rollout
consultancy
```

---

# 179. PROJECT BILLING EXTENSION

Architecture should allow future:

```text
fixed fee

milestone billing

time and materials

retainer
```

without embedding billing logic directly into Task.

Finance/Sales owns billing.

Projects records billable activity.

---

# 180. INNOVATION: WORK GRAPH

Atlas should maintain a Work Graph.

Example:

```text
GOAL
Reduce logistics cost

↓ supported by

PROJECT
Transport Optimisation

↓ contains

TASK
Renegotiate carrier agreement

↓ linked to

SUPPLIER
Carrier ABC

↓ linked to

PURCHASE / FREIGHT DATA

↓ affects

METRIC
Cost per Delivery
```

This graph makes business work understandable.

---

# 181. WORK GRAPH ENTITY

Conceptually:

```text
work_relationship

source_entity_type
source_entity_id

relationship_type

target_entity_type
target_entity_id
```

Typed relationships.

---

# 182. WHY WORK GRAPH MATTERS

It enables Atlas to answer:

> What work is related to Supplier ABC?

> Which projects depend on Product SP1?

> Which tasks relate to this customer?

> Which company goals does Warehouse Expansion support?

> Which unresolved actions could affect this production order?

This cannot be achieved elegantly with isolated boards.

---

# 183. INNOVATION: COMMITMENTS

Create a lightweight concept:

```text
Commitment
```

Examples:

```text
Michael will send quote Friday.

Donna will confirm cost tomorrow.
```

Commitment may originate from:

```text
meeting note

comment

project update

email integration
```

It can become a Task.

This reduces actions being lost in conversation.

---

# 184. INNOVATION: WAITING ON

Tasks can explicitly enter:

```text
WAITING
```

with:

```text
waiting_on_person
waiting_on_entity
waiting_until
reason
```

Example:

```text
WAITING ON

Supplier ABC
PO confirmation

Expected:
7 October
```

---

# 185. WAITING FOLLOW-UP

If expected date passes:

```text
Follow up?
```

Atlas surfaces it in My Work.

---

# 186. INNOVATION: PROJECT PULSE

Instead of requiring the PM to inspect everything:

```text
PROJECT PULSE

Velocity:
Stable

Deadline risk:
Increasing

Scope:
+8%

Budget:
On plan

Blocked work:
3 items

Team capacity:
High
```

Subtle, not gimmicky.

---

# 187. INNOVATION: CHANGE SINCE LAST VIEW

Every project should support:

```text
Since your last visit
```

Example:

```text
5 tasks completed

2 comments mention you

1 milestone moved

Budget increased £6,000

Shipment SH-221 delivered
```

---

# 188. INNOVATION: WHY

Any system-generated project warning should support:

```text
Why?
```

Example:

```text
PROJECT AT RISK
```

Why?

```text
Installation delayed 4 days

which blocks

Testing

which currently leaves

1 day before Go Live
```

---

# 189. INNOVATION: WHAT CHANGED

Click project date:

```text
30 Nov
→
8 Dec
```

Show:

```text
Changed by:
Michael

Date:
2 Oct

Reason:
Supplier lead time

Affected:
3 milestones
9 tasks
```

---

# 190. INNOVATION: PROJECT STORY

Project history should be navigable as a story:

```text
Created

Planning approved

Budget approved

Milestone 1

Major decision

Risk emerged

Launch

Completion
```

Not just an unreadable audit log.

---

# 191. INNOVATION: ONE TASK, MULTIPLE CONTEXTS

A task may appear in:

```text
Project

My Work

Team Board

Portfolio

Customer workspace
```

without duplicates.

Asana supports tasks appearing across multiple projects while retaining one underlying task. Atlas should adopt the broader principle, while maintaining one canonical task record.

---

# 192. TASK CONTEXT MEMBERSHIPS

Instead of copying:

```text
task_context
```

can associate a task with:

```text
project
view
initiative
workstream
```

while:

```text
task.id
```

remains one object.

---

# 193. INNOVATION: SMART PROJECT OPEN

When project opens, Atlas determines user context.

Project owner sees:

```text
Health
Risks
Milestones
Budget
```

Contributor sees:

```text
My Tasks
Recent changes
Blocked work
```

Executive sees:

```text
Progress
Target
Health
Budget
Latest Update
```

Same project, better context.

---

# 194. DUE DATE INTELLIGENCE

When user schedules:

```text
31 December
```

Atlas can warn:

```text
This is a non-working day for this team.
```

or:

```text
Assignee is on leave.
```

Offer alternatives.

Do not silently change.

---

# 195. PROJECT CALENDAR

Use common organisational calendars:

```text
working days

bank holidays

site shutdowns

personal leave
```

for scheduling.

---

# 196. RESOURCE ROLES

Projects may request:

```text
Project Manager
20%

Engineer
50%

Designer
25%
```

before named people are assigned.

Useful for future projects.

---

# 197. RESOURCE FORECAST

Portfolio:

```text
NOVEMBER

Engineering
Demand 540h
Capacity 460h
Shortage 80h
```

This is stronger than basic individual workload.

---

# 198. SKILL-BASED RESOURCE PLANNING

Optional future capability:

Task requires:

```text
Electrical Engineer
```

Atlas can show:

```text
Eligible employees

capacity

skills

site
```

Do not automatically assign people solely using AI.

---

# 199. PROJECT FORECAST DATE

Atlas may calculate:

```text
TARGET
30 November

FORECAST
5 December
```

based on deterministic task dependencies and current schedule.

This is different from a speculative AI prediction.

---

# 200. FORECAST CONFIDENCE

Show factors:

```text
4 critical tasks incomplete

2 tasks lack estimates

1 dependency external
```

Rather than pretending forecast is exact.

---

# 201. SPRINTS / CYCLES

Optional for teams who use agile/time-boxed work.

Create:

```text
cycle
```

with:

```text
start
end
team
goal
capacity
```

Linear uses automatically recurring cycles as lightweight time-boxed planning intervals.

Atlas should keep this optional.

---

# 202. BACKLOG

Teams using cycles can maintain:

```text
Backlog
```

Tasks not yet committed.

---

# 203. CYCLE PLANNING

Show:

```text
Capacity:
82 points

Selected:
74

Unplanned:
8
```

or hours depending on methodology.

---

# 204. CYCLE REVIEW

At end:

```text
Planned 72

Completed 61

Carried 11
```

Analyse trends without turning Atlas into a developer-only product.

---

# 205. PROJECT REPORTING

All project analytics should use Atlas Analytics Studio.

Data Views:

```text
Projects

Tasks

Milestones

Risks

Workload

Timesheets

Project Costs

Approvals
```

---

# 206. PROJECT KPI LIBRARY

Examples:

```text
Active Projects

Projects At Risk

Tasks Completed

Overdue Tasks

Milestone Performance

Average Task Age

Project Lead Time

Budget Variance

Resource Utilisation

Scope Change

Project Delivery %
```

---

# 207. PROJECT SEARCH IN ANALYTICS

Because project metrics use Atlas Analytics, users can build:

```text
Projects by Department

Projects by Customer

Cost by Project

Tasks by Owner

Capital Projects by Budget

Project Health by Portfolio
```

alongside Finance or Sales data.

---

# 208. PROJECT HOME DASHBOARD

Personal:

```text
GOOD AFTERNOON

4 tasks due today
2 approvals waiting
1 project needs an update

────────────────────

MY FOCUS

...

────────────────────

PROJECTS

Warehouse Expansion        At Risk
Atlas Implementation       On Track
Cost Reduction             On Track

────────────────────

WAITING ON

Supplier ABC
Donna
Finance
```

---

# 209. VISUAL DESIGN

Do not design this like Monday.com.

Avoid:

```text
rainbow status columns

coloured pills everywhere

thick board chrome

hundreds of icons

overloaded cards
```

Aim closer to:

```text
Linear precision
+
Notion calm
+
Atlas business depth
```

---

# 210. COLOUR

Use colour primarily for:

```text
status

risk

priority

health

selection
```

Not decoration.

---

# 211. PROJECT CARD

Example:

```text
Warehouse Expansion

62%

Target 18 Dec

At Risk

Next
Racking Installation
```

Minimal.

---

# 212. SIDEBAR

Possible:

```text
Projects

My Work
Inbox

Favourites

Projects
  Warehouse Expansion
  Customer Rollout
  Atlas ERP

Teams
  Operations
  Finance
  Commercial
```

Do not show every project permanently.

---

# 213. FAVOURITES

User can favourite:

```text
project

view

portfolio

note

doc
```

---

# 214. RECENTS

Universal recent work.

No need to hunt through navigation.

---

# 215. PROJECT PINNING

Within project pin:

```text
important doc

dashboard

Atlas record

external link
```

to Overview.

---

# 216. MOBILE

Mobile should focus on:

```text
My Work

Inbox

Task

Comments

Notes

Quick Capture

Project Updates
```

Do not try to reproduce full Gantt editing on a phone.

---

# 217. OFFLINE NOTES

Architecture should allow notes/drafts to survive brief connectivity loss.

Sync safely when connection returns.

---

# 218. REAL-TIME COLLABORATION

Use presence channels for:

```text
document editing

task editing

project views
```

Avoid one user silently overwriting another.

---

# 219. OPTIMISTIC LOCKING

Structured entities:

```text
task
project
milestone
risk
```

should carry:

```text
version
```

to detect conflicting writes where appropriate.

---

# 220. EVENT MODEL

Important events:

```text
ProjectCreated

ProjectStarted

ProjectHealthChanged

ProjectCompleted

TaskCreated

TaskAssigned

TaskStarted

TaskBlocked

TaskCompleted

TaskOverdue

MilestoneCreated

MilestoneCompleted

ProjectUpdatePublished

RiskCreated

RiskEscalated

ApprovalRequested

ApprovalCompleted

DecisionApproved

RequestSubmitted

DocumentUpdated

ProjectBudgetChanged
```

---

# 221. CROSS-MODULE EVENTS

Projects may consume:

```text
SalesOrderConfirmed

PurchaseOrderApproved

ProductionCompleted

ShipmentDelivered

InvoicePaid

QualityFailure

SupplierDeliveryLate
```

Only when a project relationship exists or configured automation subscribes.

---

# 222. EXAMPLE ERP PROJECT FLOW

Project:

```text
NEW PRODUCT LAUNCH
```

Task:

```text
Approve Product Specification
```

when complete:

```text
Product revision approved
```

Task:

```text
Produce Trial Batch
```

linked:

```text
MO-882
```

MO completes.

Atlas automatically shows:

```text
Production complete
```

Next Task:

```text
Quality approval
```

linked to Quality Order.

Then:

```text
First customer shipment
```

linked to Sales Order and Shipment.

The project becomes a live orchestration layer over actual ERP execution.

---

# 223. API

Examples:

```text
GET /api/projects

POST /api/projects

GET /api/projects/{id}

POST /api/projects/{id}/start

POST /api/projects/{id}/complete

GET /api/projects/{id}/tasks

POST /api/tasks

POST /api/tasks/{id}/complete

POST /api/tasks/{id}/assign

POST /api/tasks/{id}/block

POST /api/tasks/{id}/comments

POST /api/projects/{id}/updates

POST /api/projects/{id}/decisions

POST /api/projects/{id}/risks
```

Business actions should have explicit command endpoints where meaningful.

---

# 224. CORE DATA MODEL

```text
PROJECT

project
project_member
project_role
project_status
project_health
project_field
project_field_value

TASK

task
task_status
task_type
task_assignee
task_dependency
task_checklist
task_checklist_item
task_context
task_link

PORTFOLIO

portfolio
portfolio_project
programme
goal
goal_project

PLANNING

milestone
project_baseline
project_change_request

COLLABORATION

comment
comment_thread
mention

note
document
document_version

project_update

decision

WORK MANAGEMENT

saved_view
view_filter
view_group
view_sort

INBOX

user_inbox_item

WORKLOAD

work_estimate
resource_capacity
resource_allocation
time_entry
timesheet

RISK

project_risk
project_issue
project_assumption

APPROVAL

approval
approval_step
approval_response

REQUESTS

request
request_form
request_submission

AUTOMATION

automation_rule
automation_trigger
automation_condition
automation_action
automation_execution

FINANCE

project_budget
project_budget_line
project_cost_assignment

RELATIONSHIPS

work_object_link
work_relationship
```

---

# 225. DO NOT USE ONE GIANT PROJECT TABLE

Separate:

```text
core project identity

membership

budget

risk

custom properties

workflow
```

into relevant structures.

Avoid hundreds of nullable project columns.

---

# 226. SEARCH INDEX

Index:

```text
projects

tasks

notes

documents

comments

decisions

updates
```

with permission-aware search.

---

# 227. PERMISSION SECURITY

Search must not leak:

```text
private project title

private task description

private note text
```

through search snippets.

Security filtering occurs before results are returned.

---

# 228. SERVICE BOUNDARIES

Logical services:

```text
ProjectService

TaskService

PortfolioService

ProjectPlanningService

NotesService

DocumentService

CollaborationService

WorkloadService

TimeService

ApprovalService

RequestService

AutomationService

ProjectFinanceService

ProjectSignalService
```

Initially keep as modules inside the Atlas modular monolith.

Do not create needless network microservices.

---

# 229. IMPLEMENTATION PHASE 1

Build:

```text
Projects

Tasks

Subtasks

Checklists

Status

Assignment

Dates

Comments

Permissions
```

Views:

```text
List
Board
My Work
```

Make this exceptional before adding everything else.

---

# 230. IMPLEMENTATION PHASE 2

Add:

```text
Notes

Docs

Mentions

Attachments

Activity

Quick Capture

Inbox
```

---

# 231. IMPLEMENTATION PHASE 3

Add planning:

```text
Milestones

Dependencies

Timeline

Gantt

Calendar

Baselines
```

---

# 232. IMPLEMENTATION PHASE 4

Add:

```text
Workload

Capacity

Time estimates

Time tracking

Timesheets
```

---

# 233. IMPLEMENTATION PHASE 5

Add:

```text
Portfolio

Programmes

Goals

Project updates

Risks

Issues

Decisions
```

---

# 234. IMPLEMENTATION PHASE 6

Add:

```text
Automations

Requests

Forms

Approvals

Templates
```

---

# 235. IMPLEMENTATION PHASE 7

Integrate deeply with:

```text
CRM

Sales

Customers

Procurement

Inventory

Manufacturing

Logistics

Finance
```

via:

```text
Work Graph
```

and events.

---

# 236. IMPLEMENTATION PHASE 8

Add project financials:

```text
Budget

Committed cost

Actual cost

Forecast

Variance
```

---

# 237. IMPLEMENTATION PHASE 9

Add:

```text
Project Signals

Brief Me

Change Since Last View

Draft Updates

Ask Atlas
```

Only once deterministic project data is reliable.

---

# 238. IMPLEMENTATION PHASE 10

Add advanced:

```text
External collaboration

Capacity forecasting

Skill planning

Cross-project forecasting

Programme management
```

---

# 239. TEST: PRIVATE PROJECT

Michael creates:

```text
PRIVATE PROJECT
```

Donna searches project name.

Expected:

```text
No result.
```

Unless specifically invited.

---

# 240. TEST: TASK PERMISSIONS

Project is company-visible.

Task contains link to restricted Finance object.

User lacking Finance permission sees:

```text
Restricted record
```

not financial details.

---

# 241. TEST: DEPENDENCY

```text
Task A
due Monday

blocks

Task B
due Tuesday
```

Task A moves to Wednesday.

Atlas must identify Task B as schedule conflict.

Do not silently claim project remains on schedule.

---

# 242. TEST: MULTIPLE VIEWS

Task OPS-882 appears in:

```text
Board

List

My Work

Calendar
```

Updating status in Board must immediately update all other views.

One canonical Task.

---

# 243. TEST: PRIVATE WORKLOAD

User has:

```text
20h visible project work

10h private project work
```

Manager lacks private project permission.

Manager sees:

```text
30h total capacity used

10h Private Work
```

without project details.

---

# 244. TEST: ERP LINK

Task linked to:

```text
PO-882
```

PO status changes:

```text
Approved
→
Received
```

Project reflects current status without duplicating or manually synchronising data.

---

# 245. TEST: AUTOMATION

Rule:

```text
WHEN linked shipment delivered

THEN complete task
```

Carrier sends duplicate delivery event.

Task must complete only once.

---

# 246. TEST: BUDGET

Project:

```text
Budget £100,000
```

PO:

```text
£30,000
```

Invoice against PO:

```text
£10,000
```

Atlas must distinguish:

```text
Committed

Actual

Remaining commitment
```

without double counting PO and invoice.

---

# 247. TEST: PROJECT UPDATE

Project expected weekly update.

No update for required period.

Show:

```text
UPDATE OVERDUE
```

without changing project status itself.

---

# 248. TEST: DOCUMENT TASK

User highlights text in meeting note:

```text
Michael to issue PO by Friday
```

Creates Task.

Task links back to exact note.

Completing task updates live reference in note.

---

# 249. NON-NEGOTIABLE RULES FOR CODEX

Do not:

- make Project merely a board
- make Board the source of task status
- create separate Task engines for personal and project tasks
- duplicate Tasks between views
- let project sharing bypass ERP permissions
- let private work leak through workload descriptions
- force every user to use Gantt
- force every project to have milestones
- require custom fields for basic work
- make colour the primary project language
- create giant forms
- bury My Work
- bury notes in attachments
- treat comments as project knowledge
- overwrite decisions
- overwrite published updates
- make AI the source of project truth
- create project budget values disconnected from Finance
- replicate Sales/Finance/Manufacturing records as task fields
- send notifications for every trivial change
- make every Task require ten fields
- require a Project for every personal Task
- let project management become an administrator-only configuration exercise

---

# 250. ATLAS PROJECTS PHILOSOPHY

The system should be able to answer:

### Me

What should I work on today?

### Manager

What is my team working on?

### Project Manager

What is behind?

### Executive

Which projects are at risk?

### Finance

What are we spending?

### Team Member

What am I waiting for?

### Project Owner

What changed?

### New Joiner

Why did we make this decision?

### Customer Manager

What work is happening for this customer?

### Operations

Which projects depend on this production order?

### Everyone

What needs attention?

---

# 251. EXAMPLE PERSONAL EXPERIENCE

Michael opens Atlas.

Instead of navigating into seven projects:

```text
MY DAY

FOCUS

Approve racking supplier
Due 11:00

Review logistics specification
Due today

────────────────

WAITING ON

Donna
Budget approval
Expected today

Supplier ABC
Technical drawing
Expected tomorrow

────────────────

APPROVALS

2 awaiting you

────────────────

MENTIONS

3 new
```

One coherent work surface.

---

# 252. EXAMPLE TEAM EXPERIENCE

Operations Manager opens:

```text
OPERATIONS

TEAM CAPACITY
82%

AT RISK
2 people overloaded

PROJECTS
12 Active
2 At Risk

TODAY

18 tasks due
3 blocked
2 approvals
```

Click anything to drill into the actual work.

---

# 253. EXAMPLE PROJECT EXPERIENCE

Warehouse Expansion:

```text
WAREHOUSE EXPANSION

AT RISK

62%

Target
18 December

Forecast
22 December

────────────────

WHY AT RISK?

Electrical installation
4 days late

↓

Racking installation
Cannot start

↓

Testing window reduced
from 8 days to 4

────────────────

ATTENTION

3 blockers

£18k forecast overspend

1 decision required
```

This is dramatically more useful than simply showing a red project status.

---

# 254. EXAMPLE EXECUTIVE EXPERIENCE

```text
STRATEGIC PROJECTS

24 Active

17 On Track

4 Watch

2 At Risk

1 Off Track

────────────────

£6.8m Portfolio Budget

£4.2m Committed

£3.6m Actual

────────────────

NEXT 30 DAYS

8 Key Milestones

2 At Risk
```

Click:

```text
2 At Risk
```

and immediately understand why.

---

# 255. FINAL ARCHITECTURE

```text
                        COMPANY GOALS
                             │
                             ▼
                         PORTFOLIOS
                             │
                             ▼
                          PROJECTS
                             │
          ┌──────────────────┼───────────────────┐
          │                  │                   │
          ▼                  ▼                   ▼
       TASKS               DOCS                RISKS
          │                  │                   │
          ▼                  ▼                   ▼
     ASSIGNMENTS           NOTES              ISSUES
          │                  │                   │
          └──────────────────┼───────────────────┘
                             │
                             ▼
                         WORK GRAPH
                             │
       ┌──────────┬──────────┼──────────┬────────────┐
       ▼          ▼          ▼          ▼            ▼
      CRM       SALES    PROCUREMENT  MFG        LOGISTICS
       │          │          │          │            │
       └──────────┴──────────┼──────────┴────────────┘
                             │
                             ▼
                          FINANCE
                             │
                             ▼
                        ANALYTICS
```

Projects becomes the human work layer sitting across Atlas.

ERP modules answer:

> What is happening in the business?

Projects answers:

> What are people doing about it?

---

# 256. DEFINITION OF SUCCESS

Atlas Projects succeeds when somebody can use it for:

```text
a private to-do list
```

without feeling like they opened enterprise project-management software.

But the same product can run:

```text
a £10m multi-department transformation programme
```

without reaching the limits of the architecture.

A user should be able to:

> Make a note.

Highlight an action.

Turn it into a task.

Assign Donna.

Put it into the Warehouse Expansion project.

Link the supplier quotation.

Set Friday as the deadline.

See that Donna is overloaded.

Move it to Monday.

See that Monday affects a milestone.

Understand that the milestone affects go-live.

Open the supplier PO.

Later see that the PO has been received.

Complete the task.

Publish the weekly update.

See the actual project cost.

All without copying the same information between five different systems.

That is the target for Atlas Projects.