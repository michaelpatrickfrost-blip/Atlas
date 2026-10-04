# ATLAS MARKETING

## Campaign Management, Customer Journeys, Audiences, Content, Email, Social, Advertising, Lead Generation and Attribution

# 1. PRODUCT VISION

Build Marketing as a complete Atlas business domain.

It must support the full marketing lifecycle:

```text
PLAN
↓
AUDIENCE
↓
CREATE
↓
APPROVE
↓
LAUNCH
↓
ENGAGE
↓
CAPTURE
↓
NURTURE
↓
QUALIFY
↓
HAND TO SALES
↓
CONVERT
↓
ATTRIBUTE
↓
LEARN
```

The system must support:

- campaign planning
- campaign calendars
- marketing budgets
- audiences
- segmentation
- customer profiles
- prospects
- lead capture
- forms
- landing pages
- websites and tracking
- email
- SMS
- push
- social
- advertising
- webinars/events
- journeys
- lead nurturing
- behavioural automation
- lifecycle marketing
- account-based marketing
- lead scoring
- content creation
- content approvals
- digital assets
- consent
- preference centres
- suppression
- frequency controls
- experimentation
- conversion tracking
- attribution
- marketing ROI
- Sales hand-off
- Customer Service exclusion/suppression
- Analytics
- AI assistance

Atlas should support both:

```text
B2B MARKETING
```

and:

```text
B2C / HIGH-VOLUME MARKETING
```

using the same foundation.

---

# 2. PRODUCT PRINCIPLE

Atlas Marketing should combine:

```text
HUBSPOT
Campaign + CRM integration

MARKETO
B2B audience and programme depth

BRAZE
Real-time journey orchestration

KLAVIYO
Behavioural segmentation

CUSTOMER.IO
Event-driven automation

ITERABLE
Experimentation and lifecycle journeys

MAILCHIMP
Accessible campaign planning

ATLAS
Native ERP and commercial intelligence
```

The product must have enterprise capability without exposing enterprise complexity to every user.

---

# 3. CORE DIFFERENTIATOR

Standalone marketing systems know:

```text
Contact
Email
Click
Form
Campaign
```

Atlas knows:

```text
Contact
Company
Customer
Prospect
Opportunity
Quote
Sales Order
Product
Purchase
Invoice
Shipment
Return
Customer Service Case
Project
Finance
```

Therefore Marketing can create audiences such as:

> Customers who purchased Product Family A more than six months ago, have no open complaints, have spent more than £20,000 in the last year, and have not bought Product B.

That is significantly more powerful than basic contact-list marketing.

---

# 4. DOMAIN STRUCTURE

Create:

```text
MARKETING
│
├── Marketing Home
├── Campaigns
├── Calendar
├── Audiences
├── Journeys
├── Email
├── SMS
├── Social
├── Advertising
├── Forms
├── Landing Pages
├── Events
├── Content
├── Assets
├── Leads
├── Lead Scoring
├── Account Marketing
├── Consent & Preferences
├── Experiments
├── Attribution
├── Budgets
├── Marketing Analytics
├── Templates
├── Automations
└── Administration
```

Normal marketers should not see technical administration unless authorised.

---

# 5. CORE OBJECT SEPARATION

Codex must not confuse these concepts.

## Campaign

Business marketing initiative.

Example:

```text
2027 Product Launch
```

Contains:

```text
budget
goal
audience
assets
emails
ads
social
landing pages
events
results
```

---

## Audience

Who qualifies for marketing.

Example:

```text
UK customers
who purchased Product A
but not Product B
```

Audience exists independently of any Campaign.

---

## Journey

Automated customer progression.

Example:

```text
Download Guide
↓
Welcome Email
↓
Wait
↓
Clicked?
├── YES → Product Email
└── NO → Reminder
```

---

## Message

Individual communication.

Examples:

```text
Email
SMS
Push
```

---

## Content

Reusable material.

Examples:

```text
email block
image
copy
PDF
video
article
CTA
```

---

## Marketing Event

Something the contact did.

Examples:

```text
EMAIL_CLICKED
FORM_SUBMITTED
PAGE_VIEWED
PRODUCT_PURCHASED
EVENT_ATTENDED
```

---

# 6. CAMPAIGN

Campaign is the strategic container.

Suggested entity:

```text
marketing_campaign

id
campaign_code

name
description

campaign_type

status

owner_user_id
team_id

start_date
end_date

budget

currency

primary_goal_id

target_audience_id

parent_campaign_id

created_at
created_by
updated_at
```

---

# 7. CAMPAIGN TYPES

Defaults:

```text
PRODUCT_LAUNCH

LEAD_GENERATION

CUSTOMER_ACQUISITION

CUSTOMER_RETENTION

UPSELL

CROSS_SELL

REACTIVATION

EVENT

WEBINAR

BRAND

CONTENT

SOCIAL

PAID_MEDIA

ACCOUNT_BASED

CUSTOM
```

Allow configuration.

---

# 8. CAMPAIGN STATUS

Use:

```text
IDEA

PLANNING

CONTENT

APPROVAL

SCHEDULED

LIVE

PAUSED

COMPLETED

CANCELLED

ARCHIVED
```

Do not use free-text status.

---

# 9. CAMPAIGN WORKSPACE

Opening a Campaign:

```text
2027 PRODUCT LAUNCH

LIVE

Owner
Michael

Period
1 Feb – 31 Mar

Budget
£80,000

Spent
£32,410

Revenue influenced
£412,000

────────────────────

GOAL

Generate 500 qualified leads

Current
318

────────────────────

AUDIENCE

12,481 contacts

────────────────────

CHANNELS

Email
Social
Paid Search
LinkedIn
Events

────────────────────

NEXT

Product Email 3
Tomorrow 10:00
```

Tabs:

```text
Overview

Plan

Audience

Journey

Content

Channels

Calendar

Budget

Leads

Attribution

Analytics

Activity
```

---

# 10. CAMPAIGN HIERARCHY

Support:

```text
GLOBAL CAMPAIGN
│
├── UK Campaign
├── France Campaign
└── Germany Campaign
```

or:

```text
PRODUCT LAUNCH
│
├── Awareness
├── Lead Generation
├── Launch Event
└── Retention
```

HubSpot similarly treats a campaign as a container for multiple assets, goals and budget information.

---

# 11. MARKETING CALENDAR

Create a first-class calendar.

Mailchimp uses its marketing calendar to combine scheduled email, SMS, social and advertising activity in one place. Atlas should expand this into a complete planning tool.

Views:

```text
Month

Week

Quarter

Campaign

Channel

Team
```

Display:

```text
Email

Social Post

Paid Campaign

Event

Webinar

Landing Page Launch

Content Release

Campaign Start

Campaign End
```

---

# 12. CALENDAR DRAG AND DROP

Move:

```text
Email
Tuesday
→
Thursday
```

Atlas updates schedule after confirmation.

It must then check:

```text
journey impact

frequency conflict

campaign sequencing

approval status
```

before accepting.

---

# 13. CAMPAIGN CONFLICT DETECTION

Example:

Customer segment would receive:

```text
Monday
Product Newsletter

Tuesday
Promotion

Wednesday
Event Email

Thursday
Account Campaign
```

Atlas should warn:

> This audience may receive four marketing messages in four days.

Allow:

```text
reschedule
prioritise
override
```

according to permission.

---

# 14. AUDIENCE ENGINE

Audiences are one of the most important parts of Marketing.

Use:

```text
marketing_audience
```

Types:

```text
DYNAMIC

STATIC

SNAPSHOT

IMPORTED
```

---

# 15. DYNAMIC AUDIENCES

A dynamic audience continuously recalculates.

Braze and Klaviyo both support audiences where users automatically enter and leave as underlying attributes and behaviours change.

Example:

```text
Customers

WHERE

Revenue last 12 months > £25,000

AND

Purchased Product Family = Drainage

AND

Last purchase > 90 days

AND

Marketing Email = Allowed
```

Membership changes automatically.

---

# 16. STATIC AUDIENCE

A frozen list.

Useful for:

```text
Trade show attendees

Purchased event list

Historical mailing

One-off account list
```

Membership changes only manually/import.

---

# 17. SNAPSHOT AUDIENCE

Take dynamic audience:

```text
12,441 people
```

and freeze membership at launch.

Useful where experiment integrity requires fixed participants.

---

# 18. SEGMENT BUILDER

Interface:

```text
BUILD AUDIENCE

People where:

[ Customer Status ] [ is ] [ Active ]

AND

[ Revenue 12M ] [ greater than ] [ £25,000 ]

AND

[ Purchased Product ] [ contains ] [ SP1 ]

AND

[ Last Purchase ] [ before ] [ 90 days ago ]
```

---

# 19. NESTED LOGIC

Support:

```text
AND
OR
NOT
```

and groups.

Example:

```text
(
   Country = UK
   OR Country = Ireland
)

AND

(
   Product A purchased
   OR Product B purchased
)

AND NOT

Open Complaint exists
```

---

# 20. EVENT SEGMENTATION

Iterable, Customer.io and Braze all support segmentation based not only on profile attributes but events and behaviours.

Atlas should support:

```text
Did

Did not

Did X times

Did within period

Did before

Did after

Did in sequence
```

Example:

```text
Opened campaign

AND

Clicked Product A

BUT

Did not request quote

within 14 days
```

---

# 21. SEQUENTIAL BEHAVIOUR

Advanced segment:

```text
Visited Product Page
THEN
Downloaded Specification
THEN
Visited Pricing Page
BUT
Did not create enquiry
```

within:

```text
14 days
```

---

# 22. AUDIENCE PREVIEW

Always show:

```text
Estimated audience
12,481

Marketing eligible
11,902

Suppressed
579
```

Then explain exclusions.

---

# 23. AUDIENCE EXCLUSION REASONS

Example:

```text
Global opt-out                  188

Email opt-out                   201

No valid email                   84

Hard bounce                      28

Frequency cap                    41

Customer exclusion               37
```

This is critical.

---

# 24. TEST CONTACT

Marketer should be able to select:

```text
John Smith
```

and ask:

> Does John qualify?

Atlas responds:

```text
YES

Matched:

Active Customer ✓
UK ✓
Revenue > £25k ✓
Product A purchased ✓
```

or:

```text
NO

Failed:

Last purchase <90 days
```

Braze offers comparable segment membership testing. Atlas should make the explanation central to the user experience.

---

# 25. CUSTOMER PROFILE

Marketing profile is not a duplicate CRM Contact.

Use the Atlas Contact identity.

Add marketing-specific state around it:

```text
marketing_profile

contact_id

lifecycle_stage

engagement_state

marketing_status

lead_score

fit_score

engagement_score

first_touch

latest_touch

acquisition_source
```

---

# 26. IDENTITY RESOLUTION

Contacts may arrive through:

```text
form

event

website

import

CRM

order

social

API

advertising
```

Atlas must attempt to resolve them to an existing identity.

Keys may include:

```text
contact_id

email

phone

external platform ID

customer ID
```

Never merge contacts purely because two people share a surname/company.

---

# 27. PROFILE EVENTS

Create append-only:

```text
marketing_event
```

Examples:

```text
PAGE_VIEWED

FORM_VIEWED

FORM_SUBMITTED

EMAIL_SENT

EMAIL_DELIVERED

EMAIL_OPENED

EMAIL_CLICKED

EMAIL_BOUNCED

EMAIL_UNSUBSCRIBED

SMS_SENT

SMS_CLICKED

AD_CLICKED

LANDING_PAGE_VIEWED

CONTENT_DOWNLOADED

WEBINAR_REGISTERED

WEBINAR_ATTENDED

QUOTE_REQUESTED

SALES_ORDER_CREATED

PURCHASE_COMPLETED

CASE_OPENED
```

---

# 28. EVENT SCHEMA

```text
marketing_event

id

event_type

contact_id

company_id

occurred_at

source

campaign_id

journey_id

message_id

properties_json

correlation_id

idempotency_key
```

Event payloads must be versionable.

---

# 29. EVENT IMMUTABILITY

Marketing behaviour events are historical facts.

Do not update:

```text
EMAIL_CLICKED
```

into another event.

Append subsequent events.

---

# 30. REAL-TIME EVENT PROCESSING

Architecture:

```text
EVENT OCCURS
↓
Event Bus
↓
Profile Update
↓
Audience Recalculation
↓
Journey Evaluation
↓
Scoring Update
↓
Analytics
```

Do not run every journey using giant scheduled database scans.

---

# 31. EVENT IDEMPOTENCY

Duplicate webhook:

```text
EMAIL_DELIVERED
```

must not count twice.

All external marketing events need:

```text
provider_event_id
```

or another idempotency key.

---

# 32. CONSENT ENGINE

This must be foundational.

UK ICO guidance requires marketers to respect direct-marketing objections and opt-outs, and recommends suppression lists so people are not accidentally re-marketed to. Consent records should also capture what the individual agreed to, and when/how that agreement was obtained.

Create:

```text
marketing_permission
```

---

# 33. PERMISSION DIMENSIONS

Permission can vary by:

```text
Contact

Channel

Purpose

Brand

Country

Legal entity
```

Example:

```text
Michael

Email
Newsletter
SUBSCRIBED

Email
Product Promotions
UNSUBSCRIBED

SMS
Promotions
NO CONSENT
```

---

# 34. CHANNEL STATES

Possible:

```text
UNKNOWN

OPTED_IN

SUBSCRIBED

UNSUBSCRIBED

OBJECTED

SUPPRESSED

BOUNCED

INVALID
```

Do not overload one boolean:

```text
marketing_allowed
```

---

# 35. PURPOSE / SUBSCRIPTION GROUPS

Braze distinguishes global channel eligibility from specific subscription groups, such as newsletters versus promotions. Atlas should implement the same broader concept.

Example:

```text
EMAIL

Company News
Product Updates
Special Offers
Events
Research
```

---

# 36. CONSENT EVIDENCE

Store:

```text
source

timestamp

IP where appropriate

form

consent text version

privacy notice version

channel

purpose

lawful basis / applicable rule

evidence reference
```

Never simply store:

```text
consent = true
```

---

# 37. CONSENT HISTORY

Consent is event-sourced.

Example:

```text
10 Jan
Opted into email

4 Mar
Opted out of promotions

8 Apr
Updated preference centre
```

Preserve history.

---

# 38. SUPPRESSION

Create:

```text
marketing_suppression
```

Reasons:

```text
UNSUBSCRIBED

OBJECTED

HARD_BOUNCE

SPAM_COMPLAINT

LEGAL_BLOCK

ADMIN_BLOCK

DECEASED

INVALID_ADDRESS
```

Suppression wins over Campaign targeting.

---

# 39. GLOBAL SUPPRESSION

If someone objects to all direct marketing:

```text
GLOBAL SUPPRESSION
```

must prevent sending regardless of which audience includes them.

ICO guidance explicitly says marketers should stop direct marketing following an objection and maintain appropriate suppression/do-not-contact controls.

---

# 40. PREFERENCE CENTRE

Customer-facing:

```text
YOUR PREFERENCES

☑ Product updates

☐ Offers & promotions

☑ Events

☐ Research

Email
On

SMS
Off
```

Braze similarly exposes category-level preferences through subscription groups and preference centres.

---

# 41. TRANSACTIONAL VS MARKETING

This distinction is critical.

Example:

```text
Order Confirmation
TRANSACTIONAL

Product Promotion
MARKETING
```

Do not let marketers disguise marketing material as transactional messaging.

ICO guidance specifically distinguishes genuine service messages from direct marketing, and adding promotional material can cause a message to be treated as marketing.

---

# 42. COMMUNICATION ELIGIBILITY SERVICE

Create central:

```text
MarketingEligibilityService
```

Before every send:

```text
Is contact permitted?

Is channel permitted?

Is purpose permitted?

Is contact suppressed?

Has frequency cap been reached?

Is quiet time active?

Is audience valid?

Is campaign approved?
```

Every outbound provider must use this service.

No exceptions.

---

# 43. JOURNEY BUILDER

Journeys are automated customer experiences.

Iterable defines journeys as automated sequences where messages, waits and branching respond to attributes and behaviours. Atlas should provide this capability but integrate business events from the ERP.

Visual builder:

```text
TRIGGER
   │
   ▼
SEND EMAIL
   │
   ▼
WAIT 3 DAYS
   │
   ▼
CLICKED?
  / \
YES  NO
 │    │
 ▼    ▼
TASK  EMAIL
```

---

# 44. JOURNEY TRIGGERS

Examples:

```text
Audience Entered

Audience Exited

Form Submitted

Event Occurred

Order Created

Order Delivered

Product Purchased

Quote Created

Opportunity Stage Changed

Birthday

Contract Anniversary

Date Reached

API Trigger

Manual Enrolment
```

---

# 45. ERP JOURNEY TRIGGERS

Atlas's major advantage:

```text
Sales Order delivered
↓
Wait 7 days
↓
Send product-care email
```

or:

```text
Customer purchases Product A
↓
Wait 90 days
↓
Recommend consumable B
```

or:

```text
Customer Service Case closed
↓
Wait 14 days
↓
Retention communication
```

subject to marketing eligibility.

---

# 46. JOURNEY ENTRY RULE

Example:

```text
ENTER WHEN

Contact submits
"Drainage Specification Download"
```

AND:

```text
Marketing Email eligible
```

---

# 47. RE-ENTRY

Klaviyo explicitly supports configuring whether and how often profiles can re-enter certain flows. Atlas needs the same control.

Options:

```text
Never

Once

After X days

Every time event occurs

Maximum N times
```

---

# 48. EXIT RULES

Example:

```text
EXIT JOURNEY WHEN

Becomes customer
```

or:

```text
Opportunity closes
```

or:

```text
Unsubscribes
```

Eligibility changes must remove or suppress future marketing steps immediately.

---

# 49. JOURNEY STEPS

Support:

```text
Send Email

Send SMS

Push

Wait

Wait Until

Decision

Audience Split

Experiment

Update Profile

Change Score

Create Sales Task

Create CRM Lead

Add to Audience

Remove from Audience

Webhook

Atlas Automation

Goal

End
```

---

# 50. DECISION SPLIT

Example:

```text
Has purchased?
```

Paths:

```text
YES
NO
```

---

# 51. MULTI-PATH SPLIT

Example:

```text
Customer Tier

Gold
Silver
Bronze
Other
```

Salesforce Journey Builder similarly supports split paths based on engagement/score categories.

---

# 52. ACTION SPLIT

Example:

```text
Did contact click Product A link within 5 days?
```

If:

```text
YES
→ Product A follow-up

NO
→ General follow-up
```

---

# 53. WAIT

Support:

```text
Duration

Specific date

Specific time

Until condition

Until event

Business hours
```

---

# 54. LOCAL TIME

Messages can send according to:

```text
recipient timezone
```

Example:

```text
Send at 09:00 recipient local time
```

Fallback policy for unknown timezone.

---

# 55. QUIET HOURS

Marketing Administrator defines:

```text
22:00–08:00
```

by:

```text
country

channel
```

Journey waits until permitted time.

---

# 56. JOURNEY ATTRIBUTES

Customer.io supports temporary journey attributes that exist only within an automation rather than permanently polluting a customer profile. Atlas should use the same architectural principle.

Example:

```text
journey.discount_code

journey.selected_product

journey.webinar_date
```

Destroyed/expired after journey exits unless deliberately persisted.

---

# 57. WEBHOOK STEP

Journey can call approved integrations.

Customer.io supports reusable webhooks with secured configuration and reusable credentials. Atlas should implement managed Connectors rather than exposing secrets in journeys.

---

# 58. JOURNEY VERSIONING

Never edit live journey execution underneath active participants.

Use:

```text
DRAFT V2

LIVE V1
```

Publish V2.

New entrants use V2.

Existing entrants follow configured migration policy.

---

# 59. JOURNEY STATES

```text
DRAFT

VALIDATION

SCHEDULED

LIVE

PAUSED

STOPPED

ARCHIVED
```

---

# 60. JOURNEY VALIDATION

Before publish check:

```text
Missing content

Missing audience

Invalid branch

No exit

Consent configuration

Frequency policy

Broken link

Inactive sender

Unapproved content

Missing webhook

Circular journey
```

---

# 61. JOURNEY SIMULATION

User can choose a test contact.

Atlas visually walks through:

```text
Contact enters

Passes audience check

Email eligible

Would receive Email 1

Decision: Product Purchased = No

Would follow Path B
```

This could be excellent.

---

# 62. JOURNEY GOALS

Each journey can define:

```text
PRIMARY CONVERSION

SECONDARY CONVERSION
```

Examples:

```text
Form submitted

Quote created

Order placed

Opportunity created

Event registered
```

Braze similarly supports campaign/Canvas conversion events measured within defined conversion windows.

---

# 63. GOAL EXIT

Optional:

```text
When Primary Conversion occurs

EXIT JOURNEY
```

Example:

Once a prospect requests a quote, stop sending nurture emails.

---

# 64. EMAIL STUDIO

Build professional email creation directly inside Atlas.

Modes:

```text
Visual Builder

Template

HTML Advanced
```

Normal marketers use Visual Builder.

---

# 65. EMAIL BLOCKS

Support:

```text
Text

Heading

Image

Button

Columns

Divider

Product

Event

Article

Video thumbnail

Social

Footer

Preference Link

Unsubscribe
```

---

# 66. DESIGN SYSTEM

Company brand:

```text
Logo

Fonts

Colours

Buttons

Spacing

Email width

Footer

Social icons
```

stored as Brand Theme.

Marketing users build within approved visual tokens.

---

# 67. MULTI-BRAND

Support:

```text
Brand A

Brand B

Brand C
```

Each can have:

```text
domain

sender

logo

theme

preference centre

consent purposes

templates
```

---

# 68. PERSONALISATION

Use semantic tokens:

```text
{{ contact.first_name }}

{{ company.name }}

{{ account_manager.first_name }}

{{ order.last_order_date }}
```

Do not expose raw database columns.

---

# 69. CONDITIONAL CONTENT

Example:

```text
IF customer.tier = GOLD

show VIP offer

ELSE

show standard offer
```

---

# 70. PRODUCT CONTENT

Because Atlas knows Products:

```text
Insert Product
```

can render:

```text
Product image

Name

Description

Price where appropriate

CTA
```

from Product master.

---

# 71. LIVE COMMERCIAL DATA

Use carefully.

Example:

```text
Your account manager:
Michael
```

or:

```text
Your current contract renews:
31 March
```

Do not embed volatile stock/pricing data unless the source and caching policy are explicit.

---

# 72. EMAIL TEMPLATE TYPES

```text
Newsletter

Announcement

Product Launch

Event

Lead Nurture

Customer Retention

Win Back

Account-Based

Plain Personal

Transactional
```

---

# 73. TEMPLATE GOVERNANCE

Template lifecycle:

```text
DRAFT

REVIEW

APPROVED

PUBLISHED

ARCHIVED
```

Company-approved templates cannot be silently overwritten.

---

# 74. EMAIL PREVIEW

Preview:

```text
Desktop

Mobile

Plain Text
```

and:

```text
Preview as Contact
```

HubSpot similarly allows test messages to be rendered as a specific contact.

---

# 75. TEST SEND

Allow:

```text
Send test
```

to approved internal addresses.

Test messages must never alter marketing campaign metrics as live sends.

---

# 76. SEED LIST

Campaign may have:

```text
Internal Test Group
```

for final pre-launch checks.

---

# 77. LINK VALIDATION

Before launch:

```text
Test every URL

Detect broken links

Detect missing UTM

Detect invalid unsubscribe

Detect insecure links
```

---

# 78. EMAIL DELIVERABILITY

Track:

```text
Sent

Delivered

Soft Bounce

Hard Bounce

Blocked

Spam Complaint

Opened

Clicked

Unsubscribed
```

Open metrics should not be treated as perfectly reliable due to privacy technology.

Clicks and downstream conversions are generally stronger engagement signals.

---

# 79. HARD BOUNCE

Hard bounce can automatically:

```text
Suppress address
```

according to policy.

Do not repeatedly send to permanently invalid addresses.

---

# 80. SOFT BOUNCE

Maintain:

```text
soft_bounce_count
```

After configured threshold:

```text
temporarily suppress
```

or:

```text
mark unreachable
```

---

# 81. SENDER INFRASTRUCTURE

Abstract sending providers.

Create:

```text
marketing_channel_provider
```

Possible providers:

```text
SES

SendGrid

Mailgun

Twilio

Other
```

Atlas business logic must not be built directly around one provider.

---

# 82. SENDING DOMAIN

Track:

```text
domain

DKIM status

SPF status

DMARC status

verification

reputation status
```

The platform should provide setup diagnostics.

---

# 83. SEND PIPELINE

```text
Campaign
↓
Audience
↓
Eligibility Check
↓
Message Render
↓
Provider Queue
↓
Send
↓
Provider Events
↓
Marketing Event Store
↓
Analytics
```

---

# 84. SEND JOB

Large Campaign sends should use:

```text
marketing_send_job
```

States:

```text
QUEUED

PREPARING

SENDING

COMPLETED

PAUSED

FAILED

CANCELLED
```

---

# 85. SEND SNAPSHOT

At send time preserve:

```text
campaign version

message version

audience definition

eligible audience snapshot

content

sender

subject

configuration
```

Historical campaign results must remain reproducible.

---

# 86. FREQUENCY CAPS

Example:

```text
Maximum

3 marketing emails
per 7 days
```

or:

```text
1 SMS
per 24 hours
```

Braze uses frequency controls and message prioritisation to avoid lower-priority messages consuming a user's available communication capacity before higher-priority messaging. Atlas should support the same general principle.

---

# 87. MESSAGE PRIORITY

Campaign:

```text
CRITICAL

HIGH

NORMAL

LOW
```

Example:

```text
Major Product Launch
HIGH

Weekly Newsletter
NORMAL
```

If cap reached:

```text
High priority message can take precedence
```

according to configured policy.

---

# 88. CONTACT PRESSURE

Customer profile should show:

```text
MARKETING PRESSURE

Last 7 days

Emails       3
SMS          1
Ads          Active

Engagement   High
```

Useful for marketers.

---

# 89. FATIGUE SIGNAL

Potential deterministic signal:

```text
10 messages

0 clicks

2 unsubscribed categories

low engagement
```

Atlas may suggest reducing frequency.

Do not automatically infer emotion.

---

# 90. A/B TESTING

HubSpot and Iterable both support A/B experimentation for campaigns/messages. Atlas should implement experiments as a first-class object rather than bolting a second email onto the Campaign.

Experiment:

```text
Control

Variant A

Variant B
```

---

# 91. TEST VARIABLES

Support testing:

```text
Subject

Sender

Content

CTA

Offer

Send Time

Channel

Journey Path
```

---

# 92. SAMPLE ALLOCATION

Example:

```text
Control   45%

Variant   45%

Holdout   10%
```

---

# 93. WINNER CRITERIA

Choose:

```text
Click Rate

Conversion

Revenue

Lead Generation

Custom Metric
```

Avoid defaulting to opens.

---

# 94. STATISTICAL SAFETY

Do not declare a winner based on tiny samples.

Experiment engine should show:

```text
Sample size

Confidence

Difference

Conversion window
```

and warn when evidence is insufficient.

---

# 95. HOLDOUT GROUPS

Support persistent holdout audiences.

Example:

```text
5% receive no marketing campaign
```

Measure true incremental lift.

This is especially important for proving marketing impact.

---

# 96. FORM BUILDER

Forms should live inside Marketing.

Types:

```text
Lead Form

Newsletter

Contact

Event Registration

Download

Quote Request

Survey

Custom
```

---

# 97. FORM FIELDS

Can map to:

```text
Contact

Company

Lead

Custom fields
```

Examples:

```text
Name

Email

Phone

Company

Role

Product Interest

Marketing Preferences
```

---

# 98. PROGRESSIVE PROFILING

Do not repeatedly ask for information Atlas already has.

Example:

First visit:

```text
Email
Name
```

Second form:

```text
Company
Role
```

Third:

```text
Product Interest
```

---

# 99. FORM CONDITIONAL LOGIC

Example:

```text
Country = UK
```

show UK-specific question.

Or:

```text
Interest = Export
```

show:

```text
Export markets
```

---

# 100. HIDDEN ATTRIBUTION FIELDS

Capture:

```text
UTM source

UTM medium

UTM campaign

UTM content

UTM term

landing page

referrer

first page

campaign
```

Do not depend on marketers remembering to type these later.

---

# 101. SPAM CONTROL

Support:

```text
Honeypot

CAPTCHA provider

Rate limiting

Duplicate protection

Disposable email checking where available
```

---

# 102. FORM SUBMISSION

Flow:

```text
Form
↓
Validation
↓
Consent capture
↓
Identity resolution
↓
Profile update
↓
Marketing event
↓
Journey
↓
Lead score
↓
Sales if qualified
```

---

# 103. LANDING PAGE BUILDER

Mailchimp demonstrates how landing pages can directly collect subscribers and feed campaign targeting. Atlas should tightly link pages, forms and Campaigns.

Create visually:

```text
Hero

Text

Image

Product

Form

CTA

FAQ

Testimonial

Video

Columns
```

---

# 104. LANDING PAGE VERSIONING

Lifecycle:

```text
DRAFT

REVIEW

PUBLISHED

UNPUBLISHED

ARCHIVED
```

---

# 105. PAGE EXPERIMENT

A/B:

```text
Landing Page A

Landing Page B
```

Measure:

```text
conversion
```

---

# 106. DOMAIN MANAGEMENT

Marketing pages can use:

```text
marketing.company.com
```

or configured public domains.

Track:

```text
SSL

DNS status

domain verification
```

---

# 107. WEBSITE TRACKING

Atlas tracking library can collect permitted events such as:

```text
page view

CTA click

form interaction

download
```

subject to privacy and cookie configuration.

---

# 108. ANONYMOUS VISITOR

Before identity known:

```text
anonymous_visitor_id
```

stores permitted anonymous behavioural context.

After Form submission:

```text
resolve appropriate historical events
```

subject to legal/privacy configuration.

---

# 109. FIRST-PARTY EVENT PIPELINE

Avoid making Marketing analytics dependent entirely on advertising platforms.

Track first-party:

```text
website
forms
CRM
orders
quotes
campaigns
```

inside Atlas.

---

# 110. LEAD

Marketing Leads should integrate with CRM.

Lifecycle:

```text
VISITOR

SUBSCRIBER

LEAD

MQL

SAL

SQL

OPPORTUNITY

CUSTOMER
```

Stages must be configurable.

---

# 111. LEAD SOURCE

Track separately:

```text
Original Source

Latest Source

Lead Source

Campaign

Channel
```

Example:

```text
Original:
Google Organic

Latest:
Email

Lead source:
Webinar

Opportunity source:
Product Launch Campaign
```

Do not overwrite history.

---

# 112. FIRST TOUCH

Immutable marketing attribution event:

```text
First recognised acquisition touch
```

---

# 113. LATEST TOUCH

Continuously updated:

```text
most recent recognised marketing touch
```

---

# 114. LEAD SCORING

HubSpot separates lead scoring into fit, engagement and combined scoring. That is a strong model for Atlas.

Use:

```text
FIT SCORE

ENGAGEMENT SCORE

INTENT SCORE

COMBINED SCORE
```

---

# 115. FIT SCORE

Answers:

> Are they the sort of organisation/person we want?

Rules:

```text
Industry = Construction
+20

Revenue > £10m
+20

Target Country
+10

Company Size
+15
```

---

# 116. ENGAGEMENT SCORE

Answers:

> How engaged are they?

Example:

```text
Email click
+3

Specification download
+8

Webinar attended
+15

Pricing page
+10
```

---

# 117. NEGATIVE SCORE

Examples:

```text
No activity 90 days
-10

Unsubscribed
-50

Student email
-20
```

---

# 118. TIME DECAY

Engagement should decay.

Example:

```text
Pricing page yesterday
+10

Pricing page 180 days ago
+2
```

Do not let a click from five years ago permanently make someone a hot lead.

---

# 119. SCORE CAP

Prevent activity spam:

```text
Email clicks:
maximum +20
```

Otherwise somebody clicking fifty links creates nonsense.

---

# 120. SCORE EXPLANATION

CRM should show:

```text
SCORE
82

WHY?

Target Industry      +20

Company Size         +15

Product Page         +10

Webinar              +15

Email Clicks         +12

Recent Quote Request +20

Inactivity           -10
```

No black box.

---

# 121. MQL

Example:

```text
Combined score >= 70

AND

Fit score >= 30

→ MQL
```

---

# 122. SALES HANDOFF

When MQL threshold met:

```text
Create/Update Lead
↓
Assign Salesperson
↓
Create Sales task
↓
Notify rep
↓
Add context
```

Context:

```text
Campaign

content downloaded

products viewed

journey

score reasons

company

latest activity
```

---

# 123. SALES FEEDBACK

Sales rep should be able to mark:

```text
GOOD LEAD

NOT READY

BAD FIT

DUPLICATE

EXISTING CUSTOMER

NO INTEREST
```

Marketing needs this feedback to improve scoring.

---

# 124. RECYCLE

Lead:

```text
Not Ready
```

can re-enter:

```text
Nurture Journey
```

instead of disappearing.

---

# 125. ACCOUNT-BASED MARKETING

For B2B, Marketing must work at Company level as well as Contact.

Marketo supports account and person-level profiles, while HubSpot supports scoring both contacts and companies.

Create:

```text
target_account
```

---

# 126. ACCOUNT SCORE

Company:

```text
Strategic Fit

Engagement

Open Opportunities

Revenue

Product Penetration

Marketing Engagement
```

---

# 127. BUYING GROUP

Account may contain:

```text
Economic Buyer

Technical Decision Maker

User

Influencer

Procurement

Unknown
```

Marketing can target missing roles.

---

# 128. ACCOUNT ENGAGEMENT

Example:

```text
ABC LTD

12 contacts

7 active

4 campaign engagements

2 specification downloads

1 event attendee

Opportunity
£180k
```

---

# 129. ACCOUNT JOURNEY

Example:

```text
Target Account identified
↓
Multiple contacts engaged
↓
Account score rises
↓
Create Sales alert
```

---

# 130. SOCIAL MODULE

Marketing should include a social planning layer.

Support:

```text
Content Calendar

Post Drafts

Approvals

Scheduling

Publishing

Engagement Import

Campaign Linking
```

Connected networks depend on APIs/connectors.

---

# 131. SOCIAL POST

Entity:

```text
social_post

campaign_id

channel

account

content

media

scheduled_at

status

published_at

external_id
```

---

# 132. SOCIAL CALENDAR

Mailchimp similarly includes scheduled social posts in its campaign calendar. Atlas should combine them with all other Marketing activity.

---

# 133. CHANNEL-SPECIFIC CONTENT

One master content concept.

Variants:

```text
LinkedIn

Facebook

Instagram

Other
```

Do not assume identical text is right everywhere.

---

# 134. APPROVAL

Social workflow:

```text
DRAFT
↓
REVIEW
↓
APPROVED
↓
SCHEDULED
↓
PUBLISHED
```

---

# 135. SOCIAL ENGAGEMENT

Where provider APIs permit, ingest:

```text
impressions

reactions

comments

shares

clicks

followers
```

as campaign analytics.

HubSpot currently exposes social interaction data for segmentation and scoring, demonstrating the usefulness of tying social engagement back to customer/contact activity.

---

# 136. ADVERTISING MODULE

Do not attempt to recreate Google Ads or Meta Ads.

Atlas acts as:

```text
Campaign Planner

Audience Manager

Attribution Layer

Budget View

Performance Hub
```

Connect:

```text
Google Ads

Meta

LinkedIn

Other supported networks
```

---

# 137. AD CAMPAIGN LINK

External:

```text
Google Campaign 8827
```

maps to:

```text
Atlas Campaign
2027 Product Launch
```

---

# 138. AD METRICS

Ingest:

```text
Spend

Impressions

Clicks

Conversions

CPC

CPM

Platform ROAS
```

Then combine with Atlas commercial truth:

```text
Leads

Opportunities

Orders

Revenue

Margin
```

---

# 139. AD AUDIENCES

Where supported:

```text
Atlas Audience
↓
Provider Audience
```

Examples:

```text
Customer exclusion

Lookalike seed

Reactivation group
```

Only profiles eligible under applicable privacy/consent rules should be activated.

---

# 140. SUPPRESSION SYNC

If person objects to direct marketing:

```text
suppression
```

must propagate to applicable audience activation processes.

---

# 141. EVENTS AND WEBINARS

Create:

```text
marketing_event_program
```

Examples:

```text
Trade Show

Webinar

Conference

Customer Event

Open Day
```

---

# 142. EVENT WORKFLOW

```text
Event Created
↓
Registration Page
↓
Invitation Campaign
↓
Registration
↓
Reminder
↓
Attendance
↓
Follow-up
↓
Sales Handoff
```

---

# 143. EVENT ATTENDANCE

States:

```text
INVITED

REGISTERED

ATTENDED

NO_SHOW

CANCELLED
```

Marketing event:

```text
WEBINAR_ATTENDED
```

feeds scoring/journeys.

---

# 144. QR CHECK-IN

Optional:

```text
registration QR
```

scan at event.

Immediately:

```text
ATTENDED
```

---

# 145. EVENT FOLLOW-UP

Different journeys:

```text
Attended
→ Thank you + resources

No Show
→ Recording

High Score
→ Sales follow-up
```

---

# 146. CONTENT LIBRARY

Marketing needs:

```text
Content
```

separate from Campaign.

Types:

```text
Article

Email Block

Image

Video

PDF

Guide

Case Study

Whitepaper

Product Sheet

CTA

Social Copy

Landing Page Section
```

---

# 147. DIGITAL ASSET MANAGEMENT

Asset entity:

```text
marketing_asset

name

asset_type

file

brand

owner

campaigns

usage_rights

expiry_date

tags

version
```

---

# 148. ASSET SEARCH

Search:

```text
SP1 product image
```

filter:

```text
Brand

Product

Campaign

Format

Orientation

Approved
```

---

# 149. RIGHTS MANAGEMENT

Store optional:

```text
licence

expiry

territory

usage
```

Prevent expired assets being reused accidentally.

---

# 150. ASSET APPROVAL

States:

```text
DRAFT

REVIEW

APPROVED

EXPIRED

ARCHIVED
```

---

# 151. CONTENT BRIEF

Create:

```text
Content Brief
```

with:

```text
Audience

Purpose

Campaign

Channel

Key Message

CTA

Deadline

Owner
```

Can become Atlas Project task.

---

# 152. MARKETING PROJECTS INTEGRATION

A Campaign can have:

```text
Project
```

for operational delivery.

Example:

```text
Campaign:
Product Launch

Project:
2027 Product Launch Delivery
```

Tasks:

```text
Photography

Landing Page

Copy

Legal Review

Sales Briefing
```

Do not build another marketing task engine.

Use Atlas Projects.

---

# 153. CONTENT APPROVAL

Use Atlas approvals.

Example:

```text
Marketing
↓
Product
↓
Legal
↓
Director
```

Only then:

```text
APPROVED
```

---

# 154. CONTENT VERSIONING

Preserve:

```text
V1

V2

V3
```

Campaign must record which version actually sent.

---

# 155. CAMPAIGN BUDGET

Campaign stores:

```text
Planned Budget

Committed

Actual

Forecast
```

---

# 156. BUDGET CATEGORIES

Examples:

```text
Advertising

Agency

Print

Events

Sponsorship

Content

Photography

Email

Travel

Other
```

---

# 157. FINANCE INTEGRATION

Marketing Project/Campaign can receive actual cost from:

```text
Purchase Orders

Supplier Invoices

Expenses

Finance Journals

Advertising Imports
```

Do not manually duplicate financial spend.

---

# 158. COMMITTED MARKETING SPEND

PO:

```text
Agency
£20,000
```

Campaign displays:

```text
Committed:
£20,000
```

---

# 159. ACTUAL MARKETING SPEND

Invoice posted:

```text
£8,000
```

Then:

```text
Actual       £8,000

Remaining commitment
£12,000
```

No double counting.

---

# 160. BUDGET ALERT

Example:

```text
Campaign forecast
£84,000

Budget
£80,000

Forecast overspend
£4,000
```

HubSpot supports budget information at Campaign level and workflow actions using campaign budget/revenue attributes. Atlas should integrate this directly with Finance.

---

# 161. CAMPAIGN GOALS

Support:

```text
Leads

MQLs

Opportunities

Revenue

Orders

Event registrations

Content downloads

Product adoption

Retention

Custom metric
```

Use Atlas Analytics certified metrics where possible.

---

# 162. ATTRIBUTION

This must be first-class.

Marketo distinguishes first-touch from multi-touch attribution, reflecting the reality that acquisition and influence are different business questions.

Atlas should support several models.

---

# 163. ATTRIBUTION MODELS

```text
FIRST TOUCH

LAST TOUCH

LINEAR

U-SHAPED

W-SHAPED

TIME DECAY

CUSTOM
```

---

# 164. FIRST TOUCH

Question:

> Which channel acquired this contact?

---

# 165. LAST TOUCH

Question:

> Which recognised marketing touch immediately preceded conversion?

---

# 166. MULTI-TOUCH

Example:

```text
Google Ads
25%

Webinar
25%

Email
25%

Product Guide
25%
```

---

# 167. ATTRIBUTION OBJECT

```text
marketing_attribution_touch

contact_id

company_id

campaign_id

asset_id

channel

occurred_at

touch_type

conversion_id
```

---

# 168. CONVERSION TYPES

Examples:

```text
Lead Created

MQL

Opportunity

Quote

Order

Revenue

Renewal
```

---

# 169. REVENUE ATTRIBUTION

Because Atlas knows Sales Orders and Finance:

```text
Campaign
→ Opportunity
→ Sales Order
→ Invoice
→ Revenue
```

This is far stronger than merely counting form fills.

---

# 170. MARGIN ATTRIBUTION

Atlas can go further:

```text
Attributed Revenue

Attributed COGS

Attributed Gross Margin
```

This allows:

> Which Campaign generated profitable business?

Not merely:

> Which Campaign generated clicks?

---

# 171. ATTRIBUTION WINDOW

Configure:

```text
7 days

30 days

90 days

180 days

Custom
```

depending on conversion/business cycle.

---

# 172. UTM MANAGEMENT

Create central:

```text
UTM Builder
```

Fields:

```text
source

medium

campaign

content

term
```

Campaign automatically generates consistent UTMs.

---

# 173. SHORT LINKS

Optional:

```text
Atlas tracked URL
```

redirects to destination.

Captures:

```text
click

campaign

content

source
```

---

# 174. QR CODES

Campaign can generate tracking QR:

```text
Event poster
→ Landing Page
```

Attribution source:

```text
Trade Show Poster
```

---

# 175. CAMPAIGN ROI

Calculate:

```text
Attributed Margin
-
Marketing Cost
```

and:

```text
ROI %
```

Allow Revenue ROI too.

Clearly state attribution model.

---

# 176. FUNNEL

Example:

```text
VISITORS       80,000

LEADS           4,800

MQL             1,200

OPPORTUNITIES     380

ORDERS            124

REVENUE          £1.8m
```

---

# 177. FUNNEL SEGMENTATION

Klaviyo lets users turn funnel drop-off cohorts directly into segments. Atlas should do the same.

Example:

```text
Viewed pricing

but

Did not request quote
```

button:

```text
Create Audience
```

---

# 178. LIFECYCLE ANALYTICS

Track movement:

```text
Lead
→ MQL
→ SQL
→ Opportunity
→ Customer
```

Measure:

```text
Conversion rate

Time in stage

Campaign influence

Source
```

---

# 179. CUSTOMER LIFECYCLE MARKETING

Marketing is not only acquisition.

Support:

```text
Onboarding

Cross-sell

Upsell

Retention

Renewal

Win-back

Advocacy
```

---

# 180. POST-PURCHASE JOURNEY

Example:

```text
Order delivered
↓
Wait 7 days
↓
Useful Product Guide
↓
Wait 30 days
↓
Related Product
```

Not every purchase should automatically trigger marketing.

Eligibility applies.

---

# 181. WIN-BACK

Audience:

```text
Customer

No order in 12 months

Historically >£5k spend

Marketing eligible
```

Journey:

```text
Re-engagement email
↓
Engagement?
↓
Sales task if high-value
```

---

# 182. CUSTOMER SERVICE INTEGRATION

Marketing should be sensitive to service experience.

Example:

```text
Open severe complaint
```

can suppress:

```text
promotional campaign
```

for configurable period.

Do not send:

> We love having you as a customer!

while a major unresolved complaint is open.

---

# 183. SERVICE EXCLUSION POLICY

Example:

```text
SEV1 Complaint
→ Suppress promotional marketing

until:
Case closed + 7 days
```

Transactional communications continue.

---

# 184. SALES EXCLUSION

Salesperson may temporarily mark:

```text
Marketing Pause
```

Example:

```text
Active sensitive negotiation
```

with:

```text
reason

expiry

approved by
```

Avoid permanent forgotten exclusions.

---

# 185. PRODUCT AVAILABILITY

Atlas Marketing can know:

```text
Product discontinued

Product restricted

Product out of stock

Product region availability
```

Campaign validation should warn before promoting unavailable products.

---

# 186. PRODUCT CAMPAIGN

Link Campaign:

```text
Product SP1
```

Then Analytics can show:

```text
Campaign Engagement

Leads

Quotes

Orders

Revenue

Margin
```

for that Product.

---

# 187. PERSONALISATION RULE

Example:

```text
Customer owns Product A

→ Content B

Customer owns A+B

→ Content C
```

---

# 188. RECOMMENDATION ENGINE

Future:

```text
Related Product

Likely Next Purchase

Similar Content
```

But recommendation engine must expose:

```text
reason

source

confidence
```

AI recommendations must not become uncontrolled marketing decisions.

---

# 189. MARKETING AUTOMATION

Separate from Journey where appropriate.

Journey:

```text
customer-facing lifecycle orchestration
```

Automation:

```text
internal marketing operations
```

Example:

```text
WHEN Campaign budget > 90%

THEN notify Marketing Director
```

---

# 190. AUTOMATION EXAMPLES

```text
WHEN
Campaign completed

THEN
Create performance review task
```

or:

```text
WHEN
Lead Score > 70

THEN
Create Sales Lead
```

---

# 191. MARKETING REQUESTS

Use Atlas Projects request engine.

Examples:

```text
Social post request

Email request

Event request

Campaign request

Design request
```

Marketing team gets structured intake.

---

# 192. CAMPAIGN BRIEF

Template:

```text
Objective

Audience

Problem

Offer

Message

Channels

Budget

Dates

KPIs

Owner
```

---

# 193. CAMPAIGN APPROVAL

Potential:

```text
Marketing Manager
↓
Commercial
↓
Finance if budget
↓
Legal if required
```

Configurable.

---

# 194. SEND APPROVAL

Large Campaign may require approval.

Rules:

```text
Audience > 100,000

OR

Campaign Cost > £20k

OR

Restricted brand
```

---

# 195. MARKETING CONTROL TOWER

Main dashboard:

```text
MARKETING

ACTIVE CAMPAIGNS            12

CAMPAIGN SPEND          £188k

PIPELINE INFLUENCED     £2.8m

ATTRIBUTED REVENUE      £1.4m

ATTRIBUTED MARGIN        £420k

────────────────────

LEADS

New                      882

MQL                      188

Sent to Sales             82

────────────────────

ENGAGEMENT

Email CTR                4.8%

Form Conversion          8.2%

Landing Conversion      12.1%

────────────────────

ATTENTION

2 campaigns over budget

1 audience fatigue warning

3 emails awaiting approval

42 high-score leads unassigned
```

Everything clickable.

---

# 196. CAMPAIGN PERFORMANCE

Example:

```text
2027 PRODUCT LAUNCH

Spend             £42,180

Leads                 481

MQL                   172

Opportunities          62

Orders                 21

Revenue            £412k

Margin             £118k
```

---

# 197. CHANNEL ANALYTICS

Compare:

```text
Email

Paid Search

Social

Events

Organic

Partner
```

Metrics:

```text
Spend

Leads

MQL

Opportunity

Revenue

Margin

CAC

ROI
```

---

# 198. EMAIL ANALYTICS

Show:

```text
Delivered

Clicks

Unique clicks

Click rate

Conversions

Unsubscribes

Bounces

Spam complaints

Revenue

Margin
```

Opens can be displayed but should not dominate campaign evaluation.

---

# 199. JOURNEY ANALYTICS

Visual overlay:

```text
ENTER
12,000
  │
  ▼
EMAIL 1
11,200 delivered
  │
  ▼
CLICKED?
  │
  ├── YES 2,100
  │
  └── NO 9,100
```

Each node shows:

```text
entered

exited

failed

converted
```

---

# 200. LEAD ANALYTICS

```text
MQLs generated

MQL→SQL

MQL→Opportunity

MQL→Customer

Time to Sales response

Lead rejection reason
```

---

# 201. SALES FOLLOW-UP SLA

Example:

```text
MQL assigned

Sales response due
4 working hours
```

Marketing can see:

```text
Sales accepted

Contacted

Rejected

Expired
```

This creates genuine Marketing/Sales alignment.

---

# 202. CAMPAIGN CONTRIBUTION

Do not report only:

```text
Attributed Revenue
```

Also:

```text
Sourced Pipeline

Influenced Pipeline

Sourced Orders

Influenced Orders
```

Clearly label attribution logic.

---

# 203. CONTENT ANALYTICS

By asset:

```text
Views

Downloads

Leads

MQLs

Opportunity influence

Revenue influence
```

Find:

> Which case studies actually generate business?

---

# 204. CAMPAIGN COMPARISON

Select:

```text
Campaign A
Campaign B
Campaign C
```

Compare:

```text
Spend

Audience

Leads

Cost per lead

Opportunities

Revenue

Margin

ROI
```

---

# 205. CERTIFIED METRICS

All key Marketing KPIs belong in Atlas Analytics semantic layer.

Examples:

```text
Marketing Spend ✓

MQL ✓

Cost per Lead ✓

Attributed Revenue ✓

Attributed Margin ✓

Campaign ROI ✓
```

One definition across the company.

---

# 206. DASHBOARD BUILDER

Marketing users get full Atlas Analytics Studio.

Can create:

```text
Campaign Dashboard

Lead Dashboard

Content Dashboard

Executive Marketing

Channel Performance

Customer Retention
```

No separate marketing reporting framework.

---

# 207. EXPORT

All Analytics behaviour applies:

```text
Excel

CSV

PDF

Connected Excel
```

with permission controls.

---

# 208. AI CAMPAIGN ASSISTANT

Use AI as an assistant.

Possible:

> Build a Campaign plan for launching Product X into the UK construction market.

Atlas proposes:

```text
Audience

Channels

Journey

Content plan

Timeline

KPIs
```

User approves.

---

# 209. AI COPY

Can draft:

```text
Email

Subject lines

Landing copy

Social posts

Ad copy
```

using:

```text
brand voice

Campaign brief

Product information
```

Never invent:

```text
price

stock

offer

legal claims

availability
```

If Atlas cannot validate it.

---

# 210. AI CONTENT VARIATIONS

Example:

```text
Create three subject lines
```

Then marketer chooses.

Do not automatically launch AI content.

---

# 211. AI AUDIENCE BUILDER

User:

> Customers who bought SP1 last year but haven't bought in six months.

Atlas translates into:

```text
Customer = Yes

Product Purchased = SP1

Purchase Date within last 12 months

AND

No Purchase within last 6 months
```

Show definition before saving.

---

# 212. AI JOURNEY BUILDER

User:

> Build a lead nurture for people downloading our drainage guide.

Atlas proposes visual Journey.

Must display:

```text
trigger

waits

messages

exit goal

audience rules
```

before activation.

---

# 213. AI CAMPAIGN BRIEFING

Button:

```text
Brief me
```

Output:

```text
Campaign performance

what changed

largest positive driver

largest negative driver

budget

conversions

Sales outcomes
```

Every figure tied to governed Analytics metrics.

---

# 214. AI WHY ANALYSIS

User:

> Why did Campaign A perform worse?

Atlas can analyse deterministic dimensions:

```text
Audience

Channel

Conversion rate

Lead quality

Product

Spend

Sales follow-up
```

and cite the underlying data.

---

# 215. AI CANNOT OVERRIDE CONSENT

Absolutely non-negotiable.

AI must never:

```text
send to suppressed contact

change consent

invent consent

override frequency policy
```

---

# 216. MULTI-REGION

Marketing policies may differ by:

```text
Country

Legal entity

Brand

Channel
```

Architecture must support policy packs.

Do not hard-code UK regulation into generic engine.

The UK implementation can use UK-specific PECR/UK GDPR rules. ICO guidance notes that electronic marketing rules differ between individual and corporate recipients and that direct marketing also needs to comply with data-protection obligations.

---

# 217. POLICY ENGINE

Create:

```text
MarketingPolicyEngine
```

Determines:

```text
eligibility

consent requirement

suppression

channel rules

quiet hours

required footer

preference link

retention
```

by jurisdiction/configuration.

---

# 218. DATA RETENTION

Marketing Administrator can configure:

```text
event retention

anonymous data retention

unused lead retention

consent evidence retention
```

according to company policy/legal requirements.

---

# 219. DATA SUBJECT RIGHTS

Marketing data must participate in Atlas privacy tooling.

Potential:

```text
Access

Correction

Deletion

Restriction

Objection
```

Suppression evidence may need to remain even where other marketing profile data is removed, subject to company legal policy.

---

# 220. IMPORTED LISTS

Import wizard must ask:

```text
Source

Purpose

Permission basis

Acquisition date

Supplier where applicable
```

Do not simply accept:

```text
CSV with 100,000 emails
```

and start sending.

---

# 221. IMPORT VALIDATION

Detect:

```text
duplicates

invalid addresses

suppressed contacts

existing contacts

missing consent evidence
```

Show before import completion.

---

# 222. LIST PROVENANCE

Store:

```text
list_source

imported_by

imported_at

campaign

evidence
```

---

# 223. EXPORT OF CONTACT DATA

Permission-controlled.

Audit:

```text
user

audience

records

reason

time
```

---

# 224. MARKETING SECURITY

Roles:

```text
Marketing Viewer

Marketer

Campaign Manager

Content Creator

Content Approver

Marketing Analyst

Marketing Administrator
```

---

# 225. PERMISSIONS

Examples:

```text
marketing.campaign.create

marketing.campaign.publish

marketing.email.send

marketing.audience.create

marketing.audience.export

marketing.consent.view

marketing.consent.manage

marketing.suppression.override

marketing.template.approve

marketing.budget.manage
```

---

# 226. HIGH-RISK PERMISSIONS

Extremely restricted:

```text
marketing.suppression.override

marketing.import.unverified

marketing.send.large

marketing.consent.correct
```

---

# 227. AUDIT

Record:

```text
Campaign created

Audience changed

Campaign approved

Send scheduled

Send cancelled

Consent changed

Suppression added

Suppression removed

List imported

Data exported

Journey published
```

---

# 228. LIVE CAMPAIGN EDIT

Once Campaign has sent:

```text
message content
```

cannot be retrospectively changed in historical send record.

Future scheduled content may have a new version.

---

# 229. DATA MODEL

Core logical entities:

```text
CAMPAIGNS

marketing_campaign
marketing_campaign_goal
marketing_campaign_asset
marketing_campaign_channel
marketing_campaign_budget

AUDIENCE

marketing_audience
marketing_audience_rule
marketing_audience_snapshot
marketing_audience_member

PROFILE

marketing_profile
marketing_event

PERMISSION

marketing_permission
marketing_permission_event
marketing_subscription_group
marketing_suppression
marketing_preference_center

JOURNEYS

marketing_journey
marketing_journey_version
marketing_journey_node
marketing_journey_edge
marketing_journey_enrolment
marketing_journey_state

MESSAGING

marketing_message
marketing_message_version
marketing_send_job
marketing_delivery
marketing_provider_event

EMAIL

email_template
email_template_version
email_sender
sending_domain

CONTENT

marketing_content
marketing_asset
marketing_asset_version
marketing_brand

FORMS

marketing_form
marketing_form_version
form_submission

LANDING PAGES

landing_page
landing_page_version

LEADS

marketing_lead
lead_score_model
lead_score_rule
lead_score_result

EXPERIMENTS

marketing_experiment
marketing_experiment_variant
marketing_experiment_assignment
marketing_experiment_result

ATTRIBUTION

marketing_touch
marketing_conversion
marketing_attribution_result

SOCIAL

social_account
social_post
social_post_metric

ADVERTISING

advertising_account
advertising_campaign_link
advertising_metric

EVENTS

marketing_event_program
event_registration
event_attendance
```

---

# 230. SERVICE BOUNDARIES

Recommended modules:

```text
CampaignService

AudienceService

MarketingProfileService

MarketingEventService

ConsentService

EligibilityService

JourneyService

MessagingService

EmailService

ContentService

FormService

LandingPageService

LeadScoringService

AttributionService

ExperimentService

MarketingAnalyticsService
```

Keep within modular Atlas architecture initially.

---

# 231. QUERY VS TRANSACTION

Marketing analytics may process huge volumes of events.

Do not make every dashboard aggregate directly over transactional profile tables.

Use:

```text
event store

analytical projections

aggregated facts
```

through Atlas Analytics.

---

# 232. EVENT SCALE

Partition:

```text
marketing_event
```

by suitable time/key strategy.

Index for:

```text
contact

event type

time

campaign

journey
```

---

# 233. AUDIENCE MATERIALISATION

Complex dynamic audiences should not execute enormous SQL every time a marketer opens the screen.

Use:

```text
Incremental Audience Engine
```

to maintain membership.

---

# 234. MEMBERSHIP EVENTS

When Contact enters:

```text
AUDIENCE_ENTERED
```

When leaves:

```text
AUDIENCE_EXITED
```

These can themselves trigger Journeys.

---

# 235. SCORING ENGINE

Scores should update from event stream.

Do not recalculate the entire database after every click.

Architecture:

```text
Marketing Event
↓
Relevant score rules
↓
Delta
↓
Score state
↓
Threshold event
```

---

# 236. THRESHOLD EVENT

Example:

```text
Lead Score
69 → 72
```

crosses:

```text
MQL threshold 70
```

emit:

```text
LEAD_BECAME_MQL
```

---

# 237. JOURNEY EXECUTION ENGINE

Needs durable execution.

Do not hold delayed Journeys in application memory.

Store:

```text
current_node

next_execution_at

state

journey_version
```

---

# 238. JOURNEY WORKER

Workers query:

```text
next_execution_at <= now
```

and process queued steps.

Use reliable scheduling/queue infrastructure.

---

# 239. EXACTLY-ONCE BUSINESS OUTCOME

Message provider may retry.

Journey step must not accidentally send twice.

Use:

```text
journey_step_execution
```

with idempotency key.

---

# 240. CAMPAIGN SEND SAFETY

Large send flow:

```text
DRAFT

VALIDATED

APPROVED

LOCKED

AUDIENCE SNAPSHOT

QUEUED

SENDING

COMPLETE
```

Lock critical configuration before execution.

---

# 241. CANCEL SEND

Allow:

```text
Cancel unsent portion
```

where technically possible.

Already delivered messages cannot be recalled.

---

# 242. API

Examples:

```text
POST /api/marketing/campaigns

GET /api/marketing/campaigns/{id}

POST /api/marketing/audiences

POST /api/marketing/audiences/{id}/preview

POST /api/marketing/journeys

POST /api/marketing/journeys/{id}/publish

POST /api/marketing/emails

POST /api/marketing/emails/{id}/test

POST /api/marketing/campaigns/{id}/launch

POST /api/marketing/forms

POST /api/marketing/events

GET /api/marketing/profiles/{id}

POST /api/marketing/preferences
```

---

# 243. EVENT INGESTION API

```text
POST /api/marketing/events
```

Requires:

```text
event_id

type

identity

timestamp

properties
```

Idempotency mandatory.

---

# 244. PROVIDER ABSTRACTION

Interfaces:

```text
EmailProvider

SMSProvider

SocialProvider

AdvertisingProvider
```

Business logic calls interfaces.

Vendor implementation stays isolated.

---

# 245. MARKETING HOME

Example:

```text
MARKETING

GOOD MORNING

────────────────────

TODAY

2 Campaigns launch

4 Social posts scheduled

1 Email awaiting approval

7 new MQLs

────────────────────

PERFORMANCE

Pipeline Influenced     £2.8m

Revenue Attributed      £1.2m

Campaign Spend          £188k

Marketing ROI             6.4x

────────────────────

ATTENTION

Campaign A over budget

42 leads waiting Sales

Email reputation warning

3 Campaigns need approvals
```

---

# 246. MY WORK

Use Atlas Projects engine.

Marketing Home can surface:

```text
Content approvals

Campaign approvals

Tasks

Lead handoffs

Budget exceptions

Journey failures
```

---

# 247. CAMPAIGN LIBRARY

Views:

```text
My Campaigns

Active

Planning

Completed

At Risk

By Team

By Product

By Region
```

---

# 248. CAMPAIGN HEALTH

Possible:

```text
ON_TRACK

WATCH

AT_RISK
```

Based on:

```text
goal

budget

delivery

timeline

conversion
```

Show the reasons.

---

# 249. EXAMPLE CAMPAIGN

```text
AUTUMN PRODUCT CAMPAIGN

GOAL
£500k attributed pipeline

Current
£312k

AUDIENCE
8,882 eligible contacts

SPEND
£22k / £40k

CHANNELS
Email
LinkedIn
Landing Page
Sales Follow-up

JOURNEY
62% complete

LEADS
288

MQL
92

OPPORTUNITIES
21
```

---

# 250. IMPLEMENTATION PHASE 1

Build foundation:

```text
Marketing Profile

Marketing Events

Consent

Suppression

Subscription groups

Audiences
```

Do this before Campaign sending.

---

# 251. IMPLEMENTATION PHASE 2

Build Campaign core:

```text
Campaigns

Goals

Calendar

Content linkage

Budget

Projects integration
```

---

# 252. IMPLEMENTATION PHASE 3

Build Email:

```text
Templates

Visual builder

Provider integration

Eligibility

Send jobs

Delivery events

Unsubscribe

Bounce management
```

---

# 253. IMPLEMENTATION PHASE 4

Build:

```text
Forms

Landing Pages

Tracking

Lead capture

Source/UTM
```

---

# 254. IMPLEMENTATION PHASE 5

Build:

```text
Lead scoring

MQL

Sales handoff

Sales feedback
```

---

# 255. IMPLEMENTATION PHASE 6

Build Journeys:

```text
Triggers

Waits

Branches

Email

Goals

Exit rules

Re-entry
```

Then expand to other channels.

---

# 256. IMPLEMENTATION PHASE 7

Build:

```text
A/B tests

Holdouts

Attribution

Revenue

Margin attribution
```

---

# 257. IMPLEMENTATION PHASE 8

Build:

```text
Social

Paid advertising

Events/Webinars
```

through provider connectors.

---

# 258. IMPLEMENTATION PHASE 9

Build:

```text
Account-based marketing

Buying groups

Account scoring

Account journeys
```

---

# 259. IMPLEMENTATION PHASE 10

Add:

```text
AI planning

AI copy

AI audiences

AI journey drafts

AI Campaign insights
```

after deterministic Marketing logic is trusted.

---

# 260. TEST 1: CONSENT

Contact:

```text
Email Promotions
UNSUBSCRIBED
```

Dynamic Audience includes them.

Campaign executes.

Expected:

```text
Audience matched
YES

Send eligibility
NO

Reason
Promotion subscription unavailable
```

No message sent.

---

# 261. TEST 2: GLOBAL OBJECTION

Contact appears in:

```text
3 Campaign audiences
```

User objects to all direct marketing.

Expected:

```text
All future marketing blocked immediately.

Existing scheduled sends re-check eligibility.

Suppression preserved.
```

---

# 262. TEST 3: DYNAMIC AUDIENCE

Rule:

```text
Customers with no order 180 days
```

Contact reaches day 180.

Expected:

```text
Automatically enters Audience.
```

Places Order next day.

Expected:

```text
Automatically leaves Audience.
```

---

# 263. TEST 4: JOURNEY EXIT

Contact enters nurture.

After Email 1:

```text
Sales Order placed.
```

Journey exit condition:

```text
Customer Purchased
```

Expected:

```text
No further nurture emails.
```

---

# 264. TEST 5: MQL

Score:

```text
68
```

Contact downloads specification:

```text
+10
```

Score:

```text
78
```

Threshold:

```text
70
```

Expected:

```text
LEAD_BECAME_MQL

Sales Lead created/updated once.

Sales owner notified.

Score explanation recorded.
```

---

# 265. TEST 6: DUPLICATE EVENT

Provider delivers same:

```text
EMAIL_CLICKED
```

webhook twice.

Expected:

```text
One marketing event.

One score increment.
```

---

# 266. TEST 7: FREQUENCY CAP

Policy:

```text
3 emails / 7 days
```

Contact already received 3.

Newsletter attempts send.

Expected:

```text
Suppressed by frequency policy.
```

Critical Campaign according to configured prioritisation may behave differently only if policy explicitly permits it.

---

# 267. TEST 8: CUSTOMER SERVICE SUPPRESSION

Customer has:

```text
Severe Complaint OPEN
```

Marketing policy:

```text
Suppress promotional marketing
```

Expected:

```text
Transactional email allowed.

Promotion blocked.
```

---

# 268. TEST 9: CAMPAIGN COST

Campaign PO:

```text
£10,000
```

Supplier invoice:

```text
£4,000
```

Expected:

```text
Committed £10,000

Actual £4,000

Remaining commitment £6,000
```

No £14,000 double count.

---

# 269. TEST 10: ATTRIBUTION

Contact:

```text
First touch:
Google Ad

Second:
Webinar

Third:
Email

Conversion:
£20k Order
```

First-touch model:

```text
Google gets credit
```

Linear model:

```text
credit split
```

Historical touch record unchanged.

---

# 270. TEST 11: EXPERIMENT

Audience:

```text
10,000
```

Allocation:

```text
45% Control

45% Variant

10% Holdout
```

Expected total:

```text
10,000
```

One participant belongs to exactly one group for that experiment.

---

# 271. TEST 12: LIVE JOURNEY VERSION

100 people active on Journey V1.

Publish V2.

Expected:

```text
existing participants:
policy-defined version behaviour

new participants:
V2
```

No silent corruption of active paths.

---

# 272. NON-NEGOTIABLE RULES FOR CODEX

Do not:

- build Marketing as merely an email sender
- store consent as one boolean
- let Campaign audience override suppression
- let AI override consent
- delete unsubscribe evidence
- mix transactional and promotional messaging without classification
- treat Campaign and Journey as the same object
- treat Audience and Campaign as the same object
- make every segment static
- copy CRM contacts into a separate Marketing database without identity linkage
- let a duplicate webhook increase score twice
- treat email opens as the only engagement signal
- let Marketing redefine Sales Orders
- let Marketing maintain duplicate revenue
- calculate Campaign spend separately from Finance where Atlas already owns the cost
- overwrite source history
- overwrite attribution touches
- overwrite Campaign content after it has been sent
- edit live Journey versions without version control
- send messages without final eligibility checks
- let Social/Ad integrations dictate Atlas's core data model
- directly embed provider API assumptions into Campaign logic
- create separate Marketing tasks instead of Atlas Projects
- create separate Marketing analytics instead of Analytics Studio
- create a Lead database disconnected from CRM
- allow MQL handoff without Sales feedback
- allow imported lists to bypass provenance/compliance checks
- hide why a contact was excluded from sending
- hide why a Lead received its score

---

# 273. ATLAS MARKETING PHILOSOPHY

The system must answer:

### Campaign Manager

What are we running?

### Content Manager

What needs producing?

### Marketing Director

What are we spending?

### Sales Director

What Pipeline did Marketing create?

### Finance

What has Marketing actually cost?

### Marketer

Who should receive this?

### Compliance

Are they allowed to receive it?

### Salesperson

Why was this Lead sent to me?

### Product Manager

Which campaigns are driving Product demand?

### Managing Director

Is Marketing generating profitable growth?

---

# 274. EXAMPLE END-TO-END EXPERIENCE

Marketing launches:

```text
SP1 PRODUCT CAMPAIGN
```

Goal:

```text
Generate £500k qualified pipeline
```

Audience:

```text
UK active customers

Purchased drainage products

Not purchased SP1

No severe open complaint

Email marketing eligible
```

Atlas calculates:

```text
Matched
14,822

Eligible
13,918

Suppressed
904
```

Campaign contains:

```text
Landing Page

Guide

Email Journey

LinkedIn Campaign

Sales Follow-up
```

Journey:

```text
Campaign enters audience
↓
Email 1
↓
Wait 3 days
↓
Clicked?
├── NO
│   ↓
│ Reminder
│
└── YES
    ↓
    Product Guide
    ↓
    Pricing Page Visit?
       ├── NO
       │   ↓
       │ Continue nurture
       │
       └── YES
           ↓
           +15 Intent Score
```

Contact reaches:

```text
Lead Score 76
```

MQL threshold:

```text
70
```

Atlas creates Sales handoff:

```text
MQL

ABC Ltd

Why qualified?

Target customer                  +20

SP1 guide downloaded             +10

Pricing page visited             +15

Email engagement                 +11

Company fit                      +20
```

Salesperson receives:

```text
Follow up ABC Ltd

Due in 4 hours
```

Sales creates:

```text
Opportunity
£80,000
```

then:

```text
Sales Order
£72,000
```

Marketing Campaign automatically sees:

```text
Attributed Revenue

Attributed Margin

Pipeline

Cost

ROI
```

No Marketing manager manually updates a spreadsheet.

No Sales person manually tells Marketing an order came in.

No Campaign report ends at:

```text
14,000 emails
742 clicks
```

Atlas follows the journey all the way into real commercial performance.

---

# 275. FINAL ARCHITECTURE

```text
                       ATLAS CUSTOMER GRAPH
                                │
                ┌───────────────┼──────────────┐
                ▼               ▼              ▼
             CONTACT         COMPANY        CUSTOMER
                │
                ▼
          MARKETING PROFILE
                │
       ┌────────┼───────────┐
       ▼        ▼           ▼
   CONSENT   EVENTS      AUDIENCES
       │        │           │
       └────────┼───────────┘
                ▼
             CAMPAIGN
                │
        ┌───────┼────────────┐
        ▼       ▼            ▼
     CONTENT  JOURNEY      CHANNELS
                │
       ┌────────┼─────────┐
       ▼        ▼         ▼
     EMAIL     SMS       SOCIAL
       │        │         │
       └────────┼─────────┘
                ▼
            ENGAGEMENT
                │
                ▼
           LEAD SCORING
                │
                ▼
               MQL
                │
                ▼
               CRM
                │
                ▼
          OPPORTUNITY
                │
                ▼
            SALES ORDER
                │
                ▼
             REVENUE
                │
                ▼
             MARGIN
                │
                ▼
           ATTRIBUTION
                │
                ▼
            ANALYTICS
```

Marketing no longer ends at:

> Someone clicked an email.

It ends at:

> This Campaign generated £412,000 revenue, £118,000 gross margin, 62 opportunities and 21 orders from £42,180 of Marketing expenditure.

And because it sits inside Atlas, every number can be traced back to the Campaign, Customer, Contact, Opportunity, Order and financial transaction that created it.

That is the required Atlas Marketing architecture.