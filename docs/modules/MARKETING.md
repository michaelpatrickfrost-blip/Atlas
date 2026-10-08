# Atlas Marketing

Marketing is a module around Core Contact/Party identities, with separate campaign,
audience, message, content and journey objects. Shared records remain on central
PostgreSQL; finished changes deploy to the live web server at atlassystem.online. See [the exact brief](MARKETING_SOURCE_REQUIREMENTS.md)
and [all 275 coverage checkpoints](MARKETING_COVERAGE.md). This is a foundation,
not acceptance of the complete brief.

## Delivered source

- Profiles reference existing contacts; composite identity and tenant keys prevent
  cross-company links. No separate contact database or automatic local data cache.
- Permission facts carry channel/purpose/brand/country/legal entity, evidence,
  source, notice/text version and applicable basis. Latest exact-dimension state
  controls promotional eligibility; suppression always wins. Runtime cannot update
  or delete permission, suppression, event, touch, journey-version or assignment facts.
- Audience rules support AND/OR/NOT, basic profile conditions and event windows;
  static/imported lists reference known profiles and require provenance. Preview
  separates matched, eligible and excluded with reasons. Limits fail explicitly
  above 5,000 profiles/members, or truncated event histories; no incremental engine yet.
- Campaign plans include hierarchy, dates, goals, planned budget, approval stages
  and optimistic version checks. Finance actual/committed spend is unavailable.
- Content drafts and independent approvals; copy/templates and server asset
  references. No complete asset upload/storage or visual email studio yet.
- Promotional email/SMS drafts freeze audience and content into LOCKED jobs.
  They cannot send or claim delivery. Cancel affects pending recipients only.
- Events have tenant idempotency keys; scoring is capped at 0–100, records each
  delta and creates an MQL/outbox entry once at threshold 70. Opens add no score.
  This initial fixed scoring policy is not configurable fit/intent/time-decay scoring.
- CRM owns explicit prospect handoff and follow-up task creation; existing linked
  identities are preserved. Feedback records acceptance/rejection/recycling.
- Journey versions are immutable. Recorded events enrol into the published version;
  authorised processing persists waits/forward branches/goals/purchase exit/end,
  with participants pinned to their original version. No background worker or
  message/webhook journey actions activated; no complete visual branch builder.
- Experiments freeze mutually exclusive control/variant/holdout assignments.
  No statistically supported winner or experiment delivery yet.
- Forms/pages/social/ads/events retain production briefs only; no publishing or
  capture/attendance provider execution. Account page shows linked profiles only.
- First/last/linear attribution uses original touches and confirmed Sales net order
  values with a 90-day window. Labelled order value, not invoiced revenue/margin;
  currencies remain separate. Marketing counts register with Analytics Studio.

## Provider options

User said to leave provider options blank. No email/SMS, social, advertising,
AI provider or sender domain is selected. No credentials embedded in the Mac.
Outbound sending, public form hosting, tracking, registration and social publishing
remain unavailable. Connecting a provider must include verified sender configuration,
webhook authenticity, durable retries/idempotency and final suppression/consent/
complaint/frequency checks immediately before delivery. Current draft-only release
has no outbound delivery path and cannot bypass those checks.

## Verification and activation

Run `npm run build`, strict TypeScript, scoped lint and Marketing tests, then deploy
the reviewed compatible release with `docs/DEPLOY.md`. Verify changed features on
https://atlassystem.online using normal sign-in and real forms; record release,
backup and workflow evidence in `.ai/CURRENT_STATE.md`. Mac packaging is optional
additional delivery. Never create local business databases or use HTTP success
alone as feature verification.

### Campaign workspace information — 8 October 2026

Creation and editing retain the guided brief and add brand, detailed customer insight,
creative requirements, proof points, exclusions, measurement, sales handoff, follow-up,
lessons and notes. Optional sections also support 20 custom named fields and 20 named
resource links. These live in existing campaign metadata; no schema migration.
Overview displays populated details; Content and links opens resources and supports
campaign-linked draft content using existing content permissions/independent approval.
Activity notes accept multiline briefs. Links reference original files/pages; they do
not upload assets or host public pages. Approval/exclusion notes do not execute policy.

Audiences, Content, Messages, Profiles, Consent and Analytics are visible according
to their existing capabilities. Campaign lead and message reads respect their own
capabilities. Builder and Marketing action forms preserve rejected input; brief saves
use optimistic version checks and return safe validation messages in production.
Unexpected database/authentication errors remain protected. Exact money/date/allocation validation precedes atomic
campaign/budget/launch-plan/audit creation. No delivery provider was selected or enabled.
Research and remaining scope: [platform comparison](../plans/MARKETING_WORKSPACE_RESEARCH.md).

### Campaign desk — 3 October 2026
Marketing opens on campaigns, a calendar, budgets, the customer journey and
leads. The long tab strip and the marketing plan screen are gone. Budget
lines assign an amount to a place (a market, channel account, event or
supplier). Sending a place to Finance creates a spend request and asks
Finance to approve it. Planned amounts are not posted spend. A journey map
names who it is for and lays out stages with the touchpoints on each stage.
It is a plan of the path, stored as MarketingProgram rows. It does not enrol
contacts or send messages. The older automation journey stays off the main
menu. A live send still waits for a delivery connection.

### Live delivery evidence
The installed Mac package was updated and its strict signature check passed.
Native Atlas opened the redesigned Marketing home; its bundled loopback runtime
saved and re-read a disposable strategy centrally with exact decimal targets.
The central data-only release `marketing-portal-20261003-2014` passed Marketing
and Chat isolation/behaviour acceptance on the live 3100 service. Synthetic
fixtures were removed. Only the existing Northbridge administrator received
Marketing grants; source permissions and explicit denials were preserved.
External delivery, automatic scheduling and Finance reconciliation remain pending.
