# Plan — Marketing rebuild, Automations, Company email/social (IT), ERP links

Written 4 Oct 2026. Decisions are made here, not asked. Deploy target: VPS (`npm run deploy:vps`).

## 0. Findings that shape the plan

- Marketing today is ~1.3k lines: a campaign list, a calendar, a budget board, a journey map and a leads board over a
  schema (`Marketing*` tables) that already has Profile, Permission, Suppression, Event, Audience, Campaign, Content,
  Message, SendJob, Delivery, Journey, Lead, Program (JSON plans), Touch, Experiment. Nothing measures revenue.
- The domain event bus (`src/core/events/bus.ts`) is in-memory; handlers are never registered, so `emit` does nothing.
  A durable, DB-backed event log is the prerequisite for Automations.
- No outbound email exists (no nodemailer). No contract/signature flow exists. No scheduler tick exists.
- Reference code for social scheduling and SMTP is on the Desktop (`CODEX/lib/social-scheduler`, `smtp-nodemailer`,
  `mailbox-service`). It is ported and rebranded as Atlas, using the central DB instead of local JSON config.
- Connection docs list Sales→Logistics→Finance and Manufacturing→Stock as unverified. Commits c878584/4dc6629 added
  enforced links; this plan adds a scripted end-to-end chain check and fixes what it finds.

## 1. Workstreams (all in this task)

### A. Platform foundation (first; everything depends on it)
1. Durable events: `AutomationEvent` table. `emit()` persists the event (org-scoped) and calls the automation runner.
   Add missing emits: invoice posted, shipment delivered (already named), manufacturing order completed, lead created.
2. Scheduler tick: `src/instrumentation.ts` starts a 60 s in-process tick (Node runtime only, single-flight, DB lease)
   that runs: due social posts, due scheduled emails, delayed automation runs, journey steps, recurring automations.
   Also `/api/cron/tick` guarded by `CRON_SECRET` for external triggers/testing.
3. Secrets: AES-256-GCM helper (`src/core/security/secrets.ts`) keyed from `SESSION_SECRET`; used for mailbox and social
   credentials. Credentials are never returned to the client.

### B. Company → IT (Settings): Email accounts and Social accounts
1. `EmailAccount` (org-scoped; scope COMPANY or PERSONAL with owner user; SMTP host/port/security/user/encrypted pass,
   from name/address, reply-to, signature, daily limit, default flag, IMAP optional for reply sync, verified status).
   Multiple per company and per user. "Send test", verify on save, choose default per user/company.
2. `EmailMessage` outbox/log (to, cc, subject, html, text, status QUEUED/SENT/FAILED, provider id, links to
   party/contact/quote/order/campaign/automation, scheduledAt, error). Central `sendEmail()` service: resolves sender
   (explicit → user personal default → company default), checks marketing suppression for marketing class, renders
   brand footer + unsubscribe link, records the message, writes an audit entry.
3. `SocialAccount` (platform, label, encrypted credentials JSON, status, last checked). Platforms: Bluesky, Mastodon,
   Telegram, Discord, Tumblr (API); Facebook/Instagram/Threads need Meta tokens (stored, publish through Graph);
   X/LinkedIn/TikTok/Reddit as copy-only (open-intent) like the reference.
4. New Settings group **IT** with pages: Email accounts, Social accounts, Connections overview. Capabilities
   `core.it.manage` (admin) and `email.account.personal` (own mailbox). Added to settings menu and role sync.

### C. Marketing rebuild (six areas only: Today, Campaigns, Audience, Content, Growth, Insights)
Schema additions (additive, keep existing tables, migrate old campaign rows):
- Campaign gains brief fields (objective, businessGoal, targetMarket, persona, product, positioning, message, offer,
  cta, channels[], targetPipelineMinor, targetRevenueMinor, targetCustomers, risks, dependencies, brand, region,
  language, utmCampaign, programmeId (via parentId), brief JSON).
- `MarketingCampaignSpend` (budget lines by category: planned/committed/actual with source: MANUAL/PO/INVOICE/EXPENSE).
- `MarketingActivity` (campaign plan items: channel, kind, dueAt, status, owner, linked content/message/social post/event).
- `MarketingSegment` rules builder over Party/Contact data + ERP transactions (last order, 12-month sales, product bought /
  not bought, country, lifecycle, consent) with live count; dynamic / static / snapshot; `MarketingSegmentSnapshot`.
- `MarketingTargetAccount` (ABM tiers, engagement, buying-group coverage from CRM contacts).
- `MarketingAsset`/content gains type, persona, journey stage, product, language, review/expiry, rights, parent
  (repurposing), technical approval flag; `MarketingBrandKit` (logo, colours, tone, boilerplate, do/don't).
- `MarketingForm` (+ submissions → Prospect via CRM duplicate check), `MarketingLandingPage` (block JSON, public
  `/p/[slug]` route, tracked), `MarketingUtm` (governed source/medium naming + link builder + short redirect `/r/[code]`).
- `MarketingEventRecord` (events/webinars: capacity, registrations, attendance, cost) via Program rows → proper table
  `MarketingEventPlan` + `MarketingEventAttendee`.
- `MarketingSocialPost`/`Target` (scheduler), `MarketingPlaybook`: competitors, personas, positioning, research (one
  `MarketingKnowledge` table with `kind`).
- `MarketingAttributionModel` (versioned rules) and `MarketingCampaignSnapshot` (frozen performance).
- `MarketingSocial` etc. all org-scoped with composite unique keys like the existing models.

Logic (pure, unit-tested):
- Attribution: first touch, last touch, linear, position-based, time-decay over `MarketingTouch` per person and per
  account; sourced vs influenced; opportunity pipeline, order revenue and margin read from CRM/Sales/Finance, never
  invented. Missing modules omit values.
- Funnel: audience → engaged → lead → MQL → SQL → opportunity → won, stage conversion; velocity; lead quality.
- Budget: committed/spent/forecast/remaining, pacing vs elapsed, over-pacing alert; actuals pulled from Finance
  documents/expenses tagged to the campaign when Finance is enabled.
- Scoring: separate fit / engagement (time-decayed) / intent / recency, explainable; MQL rule evaluator with
  explanations; handoff creates CRM Prospect, SLA timers, recycle reasons.
- Experiments: two-proportion z-test; no winner under minimum sample.
- Compliance: UK PECR-aware policy provider (corporate vs individual), pluggable by country; frequency caps.
- Launch readiness check (audience, consent, content, landing page, tracking, budget, sales briefing).
- Campaign health = listed risk reasons, no mystery score.

UI: Today (needs attention, today's schedule, month numbers), Campaigns (list → workspace with Overview / Audience /
Plan / Content / Performance; brief editor with objective-first creation; type templates; programmes), Audience
(segments builder, profiles, target accounts, consent & suppression, imports), Content (pipeline, library, brand,
product marketing & launches, competitors/personas), Growth (forms, landing pages, UTM, social scheduler, email
sends, events, paid-media connectors + spend import, experiments, referrals), Insights (executive report, channel,
campaign ROI, attribution with model shown, funnel, content-to-pipeline, budget, data quality, report library).

### D. Automations app (new module `automations`)
- Rules: trigger (event name from a catalogue covering sales/logistics/finance/manufacturing/CRM/marketing/HR/service
  + schedule + manual) → conditions (field/operator/value on event payload and loaded record) → steps.
- Actions (executed by deterministic handlers): send email (template + sender account), create CRM task, create
  sales draft invoice from order (via existing finance handoff), notify user (notice), create service case,
  add/remove marketing audience member, tag, update status where safe, webhook POST, wait (delay), create
  manufacturing order from order line shortage suggestion, post to social queue.
- Visual builder: three-column "When → If → Then" cards with plain-English summary, template gallery
  ("Order shipped → invoice customer", "Quote accepted → create order", "MQL → notify sales"), enable toggle, test
  run on a past event (dry-run showing what would happen), run history with per-step results, retry.
- Safety: per-rule loop guard (depth + idempotency key `ruleId:eventId`), max actions per run, capability check of
  the rule owner at run time, full audit, kill switch per rule and per company.
- Capabilities `automations.rule.read|manage|run`, read-policy entries, module enabled for Michael's org.

### D2. Branded template maker, CSAT and calendar invites (added on request)
- `EmailTemplate`: block-based template maker (header/logo, heading, text, image, button, divider, columns-lite, quote
  summary, CSAT rating row, footer/legal) that always renders through the company brand kit (logo, colour, font, footer
  address, invoice terms) so every email, survey, contract and invite looks like the company. Live preview, merge
  fields (`{{customer.name}}`, `{{order.reference}}` ...), plain-text fallback, per-brand variants, used by Sales, CRM,
  Marketing and Automations.
- CSAT: `CsatSurvey` (question, scale, thank-you text) + `CsatResponse` (token per send, score 1-5, comment, linked to
  case/order/shipment/party). Rating buttons in the email hit public `/csat/[token]?score=n`; follow-up comment page.
  Automation actions "Send CSAT survey" (triggers: service case closed, shipment delivered, order closed) and results
  show on Customer 360 and Marketing Insights (voice of customer) without exposing case detail.
- Calendar invites: automation/sales action "Send calendar invite" builds a branded invite with `.ics` attachment
  (METHOD:REQUEST, organiser = chosen sending account, attendees, location/link, reminder) and logs it; also used
  for webinars/events and meeting follow-ups.

### E. Sales & CRM outbound: email, quotes, contracts, e-sign
- `ContractDocument` (title, body/template, party, contact, quote/order link, status DRAFT/SENT/VIEWED/SIGNED/
  DECLINED/EXPIRED, public token hash, expiry, signer name/typed signature, IP, timestamps, signed PDF hash).
- Public route `/sign/[token]` (no login): read, type name, tick agreement, sign → audit + event
  `contract.signed` / `sales.quote.accepted`. Quote acceptance link works the same way for quotes.
- "Email this" dialog on quotes, orders, invoices, customer and CRM prospect pages: choose sender account, edit
  subject/body, attach the existing PDF (quote/proforma/invoice), insert sign link; sends through `sendEmail()`.
- Email thread panel on customer/prospect/opportunity showing sent messages.
- Inbound: IMAP reply sync is configured per account but polling is a later add; the automation trigger
  `email.received` is defined and fed by sync when enabled (documented as provider-dependent).

### F. ERP chain integrity (Production → Manufacturing → Sales → Logistics → Finance)
- Script `scripts/check-erp-chain.ts` drives, on a throw-away org: product+BOM → sales order confirmed → logistics
  demand → MRP planned order firmed → production order completed (stock in, components out) → allocation → pick/pack/
  ship → delivery → draft invoice → events recorded. Fix any broken link found (idempotency, status hand-offs).
- Add missing event emits so Automations can hook every transition; add vitest coverage for pure logic.
- Marketing consumes: orders/invoices for revenue and margin, stock for launch readiness, manufacturing for
  production readiness.

### G. Release
- Prisma migration SQL (additive, idempotent), read-policy + action registry regeneration, capability sync to roles,
  module enable for Michael's org, `npx tsc`, `eslint`, `vitest`, `next build`, commit, `npm run deploy:vps`, live
  checks of /marketing, /automations, /settings/it/*, /sign/<token>, tick endpoint. Update `.ai/CURRENT_STATE.md`,
  `DECISIONS.md`, module docs.

## 2. Order of execution
A → B → E(send) → D → C (domain + UI in sub-steps: C1 campaigns/budget/today, C2 audience/ABM/consent, C3 content/
product, C4 growth: forms/pages/UTM/social/events/experiments, C5 attribution/insights) → F → G.
Each step compiles before the next starts; migrations accumulate in one folder per workstream.

## 3. Explicitly specialist / provider-dependent (architecture present, vendor connector not live)
Ad platform spend APIs (Google/Meta/LinkedIn/Microsoft) — provider interface + CSV/manual spend import live;
SMS, webinar hosting, listening, SEO rank data, website analytics ingestion beyond the first-party `/r` and `/p`
tracking — provider interfaces and settings records, no vendor SDKs. IMAP polling — configured, trigger defined.
