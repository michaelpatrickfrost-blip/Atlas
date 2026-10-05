# Marketing & ERP Integration — Implementation Roadmap

**Date:** 5 October 2026  
**Target:** Complete implementation of all phases, deployed live to VPS  
**Execution:** No questions, all work in detail, everything works end-to-end

## Phase Execution Order

### Phase 1: Sales & CRM Email Outbound (E)
**What:** Email/contract buttons on Sales and CRM pages  
**Files to create/edit:**
- `src/modules/sales/components/email-dialog.tsx` — Email this dialog (sender account selection, subject/body edit, PDF attachment)
- `src/modules/sales/components/send-email-button.tsx` — Reusable button component
- `src/app/(app)/sales/quotes/[quoteId]/page.tsx` — Add Email button
- `src/app/(app)/sales/orders/[orderId]/page.tsx` — Add Email button
- `src/app/(app)/finance/invoices/[invoiceId]/page.tsx` — Add Email button
- `src/app/(app)/customers/[partyId]/page.tsx` — Add Email button on Customer Master
- `src/app/(app)/crm/prospect/[prospectId]/page.tsx` — Add Email button
- `src/modules/sales/components/email-thread-panel.tsx` — Show sent messages history
- `src/app/(app)/sales/actions.ts` (new or update) — Server action `sendEmailAction()` that calls `sendEmail()` core service
- Wiring in pages and route actions

**Deliverable:** Email buttons work; sent messages logged; users can email quotes/orders/invoices

### Phase 2: Automations App UI (D)
**What:** Visual "When → If → Then" builder, template gallery, test & history  
**Files to create/edit:**
- `src/app/(app)/automations/page.tsx` — List of automation rules (name, status, trigger, enabled)
- `src/app/(app)/automations/new/page.tsx` — Create rule form
- `src/app/(app)/automations/[ruleId]/page.tsx` — Edit rule (visual builder in sections)
- `src/app/(app)/automations/[ruleId]/test/page.tsx` — Test run on past event
- `src/app/(app)/automations/[ruleId]/runs/page.tsx` — Run history
- `src/components/automations/builder.tsx` — Main visual builder (When/If/Then cards)
- `src/components/automations/trigger-picker.tsx` — Trigger selection
- `src/components/automations/condition-builder.tsx` — Build conditions
- `src/components/automations/action-picker.tsx` — Add actions
- `src/components/automations/template-gallery.tsx` — Pre-built templates
- `src/modules/automations/services/templates.ts` — Template definitions (order shipped → invoice, quote accepted → order, MQL → notify sales)
- `src/app/(app)/automations/actions.ts` — Server actions: create/update/test/run

**Deliverable:** Automations visual builder works; templates available; test mode works; history shows per-step results

### Phase 3: Marketing UI Rebuild (C)
**Sub-phase C1: Today, Campaigns, Budget**
- `src/app/(app)/marketing/today/page.tsx` — Marketing command centre
- `src/app/(app)/marketing/campaigns/page.tsx` — Campaign list with type templates
- `src/app/(app)/marketing/campaigns/new/page.tsx` — Create campaign (brief-first)
- `src/app/(app)/marketing/campaigns/[campaignId]/page.tsx` — Campaign workspace with tabs

**Sub-phase C2: Audience, Segmentation, ABM**
- `src/app/(app)/marketing/audience/page.tsx` — Audience list
- `src/app/(app)/marketing/audience/segments/page.tsx` — Segment builder
- `src/app/(app)/marketing/audience/target-accounts/page.tsx` — ABM target accounts
- `src/app/(app)/marketing/audience/consent/page.tsx` — Marketing permissions & suppression
- `src/components/marketing/segment-builder.tsx` — Governed segment builder (rules engine)

**Sub-phase C3: Content & Product Marketing**
- `src/app/(app)/marketing/content/page.tsx` — Content library with status pipeline
- `src/app/(app)/marketing/content/new/page.tsx` — Create content
- `src/app/(app)/marketing/launches/page.tsx` — Product launch readiness
- `src/app/(app)/marketing/brand/page.tsx` — Brand kit management

**Sub-phase C4: Growth (Forms, Landing Pages, Social, Experiments)**
- `src/app/(app)/marketing/growth/forms/page.tsx` — Form builder & list
- `src/app/(app)/marketing/growth/pages/page.tsx` — Landing page builder & list
- `src/app/(app)/marketing/growth/utm/page.tsx` — UTM manager
- `src/app/(app)/marketing/growth/social/page.tsx` — Social scheduler (calendar view)
- `src/app/(app)/marketing/growth/experiments/page.tsx` — Experiment list and builder

**Sub-phase C5: Insights & Attribution**
- `src/app/(app)/marketing/insights/page.tsx` — Executive dashboard (spend, pipeline, revenue, CAC, ROMI)
- `src/app/(app)/marketing/insights/channel/page.tsx` — Channel performance
- `src/app/(app)/marketing/insights/attribution/page.tsx` — Attribution model selection & analysis
- `src/app/(app)/marketing/insights/funnel/page.tsx` — Funnel visualization
- `src/app/(app)/marketing/insights/reports/page.tsx` — Report library

**Deliverable:** All six Marketing navigation areas work; campaigns have briefs; audience building works; content tracked; insights show real revenue

### Phase 4: ERP Chain & Automations Engine
**What:** End-to-end integration test + actual automation execution  
**Files to create/edit:**
- `scripts/check-erp-chain.ts` — Test script: product+BOM → order → logistics → MRP → manufacturing → stock → delivery → invoice
- `src/modules/automations/engine/run.ts` — Actual rule execution (trigger → conditions → actions)
- `src/core/events/automation-sink.ts` — Event handler that feeds Automations
- Add missing event emits (invoice.posted, shipment.delivered, mfg.completed, lead.created)

**Deliverable:** End-to-end order flow works; automations actually execute on events; no broken handoffs

### Phase 5: Release & Live Deployment (G)
**What:** Migrate, build, deploy, verify  
**Steps:**
1. `npx prisma migrate deploy` (all schema changes)
2. `npx tsc --noEmit` (full typecheck)
3. `npm run build` (production build)
4. `npm run deploy:vps` (push to VPS)
5. Verify routes live: `/marketing`, `/automations`, `/settings/it/email`, `/sign/[token]`
6. Enable Marketing & Automations modules for Michael's org
7. Update `.ai/CURRENT_STATE.md` and `.ai/DECISIONS.md`

**Deliverable:** All code live on VPS, modules enabled, verified working

### Phase 6: Additional Requirements (H)
**What:** CRM projects, Sales form 2-col, Finance nav, Price list, Exports
- CRM projects: add/remove orgs & quotes on the project
- Sales form: 2-column layout, better UX
- Finance nav: restore missing links
- Price list: auto-fill from product
- Exports: Excel + CSV with column chooser

**Deliverable:** All H items working end-to-end

## Start Now

Beginning with Phase 1 (Sales email outbound) immediately.
