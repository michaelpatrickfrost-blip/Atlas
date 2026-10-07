# Atlas decisions

## 7 October 2026 — S&OP deploys to the live server

Michael explicitly resolved this chat’s release-target conflict: “deploy to server
when done”. S&OP must ship to `https://atlassystem.online` with central records,
backups, existing capability/tenant checks and live workflow verification. This
supersedes the pasted Mac-only target for this task; no repeated target permission
is required. The four departmental Plan modules remain behind S&OP.

## 7 October 2026 — Department plans feed a separate S&OP cycle

Plan owns flexible, reasoned inputs referencing canonical Sales/CRM projects,
quotations, products and HR employees. S&OP is a first-class module that consumes
explicitly selected accessible plans and module-owned projections through Core
contracts. Orders consume the baseline; attributed orders consume weighted project
contributions once. Unconstrained demand is preserved beside dated supply gaps.
Approved immutable S&OP totals publish to Manufacturing; working forecasts never
silently drive MRP. Publication retains its version reference, and MRP consumes
firm orders dynamically. This avoids duplicate business entities and duplicated
order demand while making the user's sales planning workflow editable.

## 7 October 2026 — Extend Finance accounting without replacing connected modules

Michael explicitly requires existing Approvals, S&OP, Manufacturing and other
connections to be preserved and enhanced. The 223-section Finance brief extends
the existing foundation. Finance remains the monetary owner; canonical operational
identities/providers and Core approvals remain authoritative. Cost-profile labels
alone are configuration, not evidence of a working WIP/COGS/consolidation workflow.
Unknown legacy FX/date provenance stays unknown. Future base-currency settlements
retain carrying values and realised FX rather than rewriting original invoices.
Full server deployment/live acceptance is required; complete-scope gaps stay explicit.
See `docs/modules/FINANCE_ERP_DELIVERY.md`.


## 6 October 2026 — Delete scrubs identities but preserves linked transaction history

When a customer or contact is referenced by historical records, Delete must not silently
degrade to a visible CLOSED/INACTIVE record or make every retry fail. It first asks for
confirmation, physically deletes when possible, and otherwise irreversibly scrubs
identifying/profile data and hides the scrubbed identity while retaining sales and audit
history required for traceability. Scrubbed identities cannot be restored. This is the
safe interpretation of “delete and scrub”: remove identifying details without breaking
historical business records. Source: `src/core/customers/commands.ts`,
`src/core/customers/queries.ts`, `prisma/schema.prisma`.

## 4 October 2026 — No sidebar; the home screen is the launcher

Michael rejected the home screen and shell as oversized and dated ("a bit Windows 98"), asked whether a sidebar is needed, and asked for no rows of apps and no cheesy wording. The permanent sidebar is removed from every page. Home lists the apps a person can open as short named columns by area; the top bar has an Apps menu with the same list. No app tiles, descriptions, greeting or marketing copy on home, sign-in, Manage apps or the Atlas console. Area grouping is presentation only (`src/core/modules/areas.ts`) and grants nothing. Supersedes the sidebar parts of "Polished glass chrome". Source: `src/components/shell/{app-directory,app-menu,topbar,shell-chrome}.tsx`, `src/app/(app)/home/page.tsx`.

## 4 October 2026 — Companies are created only by Atlas, in the app

Michael: a user or company is set up by Atlas only, in the app. Public sign-up (`/signup` and its action) is removed. An Atlas owner creates the company in the console; that creates its own organisation, roles, enabled apps and first administrator, who sets a password with a one-time setup code. Redeeming a code now signs the person in. Source: `src/app/(app)/atlas/actions.ts`, `src/core/auth/security-actions.ts`, `src/app/api/desktop/action/route.ts`.

## 4 October 2026 — A Desktop button opens Atlas in the browser

Michael asked for a Desktop button that starts the server and opens Atlas in the web browser, saying "this will be a browser app". `Atlas in Browser.app` starts the installed local runtime and opens it in the default browser. This keeps the software on the Mac and the records on the server. It does not move Atlas to a hosted web app; that would reverse the deployment boundary and needs Michael's explicit decision first. A normal browser keeps its own cookies and cache, unlike the app's non-persistent web view; pages are served no-store. Source: `scripts/install-browser-launcher.sh`, `docs/DEPLOY.md`.

## 4 October 2026 — Contacts get their own tab; clicking a contact opens it straight into edit, not a read-then-edit two-step

Customer Master's contacts moved out of the combined "People & Places" tab into their own
"Contacts" tab (addresses kept the old tab, renamed "Addresses"). For a user who can manage
contacts, clicking a contact card expands directly into the full editable form — initially
built as a read-only detail panel with a separate nested "Edit" toggle, but Michael asked
mid-task for one click to go straight to editing. Read-only viewers (no `contactsManage`)
still get the old read-only detail view, since they have nothing to submit. Source:
`src/app/(app)/customers/[partyId]/contacts.tsx`, `tabs.tsx`.

## 4 October 2026 — Payroll is its own module, and it does not file with HMRC

Payroll was a feature embedded in HR (`src/app/(app)/people/payroll/`), itself already more
than the "coming soon" stub `src/modules/stubs.ts` still carried for it. Michael asked for
Payroll fully scoped out of HR as a real UK statutory engine, linked into rota hours, sickness
and holiday. It is now `src/modules/payroll/` (dependencies `["people","scheduling"]`),
replacing the embedded feature, with PAYE/NI/pension/SSP/SMP calculated against versioned HMRC
rate tables. Reason: HR's own code explicitly flagged its payroll as "not a statutory tax
engine... enter them as manual deductions until a real UK payroll tax engine is integrated" —
this is that engine, scoped as its own module per the repo's module-boundary convention
(scheduling→people via `staffRosterProvider` is the existing precedent) rather than grown
further inside HR.

**Explicit scope boundary, matching Safety's existing one:** this calculates PAYE, NI, pension
and statutory pay, and produces P45/P60-style documents for export. It does not submit
anything to HMRC — no RTI, no Government Gateway, no FPS/EPS filing. Atlas calculates; the
business still files. See `docs/modules/PAYROLL.md`.

`people.payroll.read`/`people.payroll.manage` are retired in favour of a `payroll.*` namespace
(`run.read`, `run.manage`, `employee.manage`, `settings.manage`, `payslip.self`), migrated for
existing roles by `prisma/migrations/20261004090000_payroll_module_foundation`. Sensitive pay
fields (tax code, NI number, bank details) are gated by `payroll.employee.manage`, separate
from HR's `people.employee.manage`, so editing someone's job title does not also expose their
bank details.

## 4 October 2026 — CRM visibility: reps see their own, managers see everyone, scoped to CRM only

A sales rep sees only the prospects, opportunities, pipeline, forecast and reports they own; a
sales manager sees everyone's. Implemented by reusing the existing `sales_rep`/`sales_manager`
role split — managers already carry `SALES_CAPABILITIES.pipelineManage`, reps don't — as the
"sees own vs. sees all" gate (`src/modules/crm/services/visibility.ts`'s `ownerRestriction`),
rather than adding a new capability. Deliberately scoped to CRM's own pages only, not the shared
Customer Master `/customers` list — Michael confirmed this choice explicitly (asked directly
because other modules, e.g. Service and Finance, read that same account list and a blanket
restriction there would have hidden accounts from roles that were never meant to be scoped by
ownership). If this needs to extend to `/customers` itself later, that is a deliberate, separate
decision, not an oversight. Source: `src/modules/crm/services/visibility.ts`, `crm/pipeline`,
`crm/prospect`, `crm/forecast`, `crm/reports`.

## 4 October 2026 — A confirmed order with no lines never opens a warehouse requirement

`consumeSalesOrder` (`src/modules/logistics/services/demand.ts`) now refuses to create a *new* `FulfilmentRequirement` for a sales order that has no active lines, regardless of why the order has none (seed/import data bypassing `confirmOrder`, or any future path that sets `commercialStatus: "CONFIRMED"` directly). This is the actual root cause of FF-00001/FF-00002: `prisma/seed.ts` creates `SO-1842`/`SO-1850` as already-`CONFIRMED` with zero lines, and the `syncMissingDemand` backfill job then opens a requirement for any confirmed order lacking one. `confirmOrder`'s own `validateConfirmation` already prevents a *real* confirm with zero lines, so the gap was specifically in the demand-layer backfill trusting order state it didn't create. Chose to fix at the demand layer rather than editing `prisma/seed.ts` to add lines to those two orders — lower risk of disturbing other sessions' seed/demo assumptions, and the already-live UI treatment (readiness exclusion, disabled Allocate/Release) plus this guard both leave the two existing empty requirements inert without deleting any record. Source: `src/modules/logistics/services/demand.ts`.

## 3 October 2026 — Hashtags, purchase orders, sales pointers, and winding a sale back

Hashtags are their own area on a customer and on a sale. A customer purchase order stays a separate number. Company administration → Sales rules has three pointers — to complete a sale, to complete a delivery, and this may still be done — and each one can be switched off for the whole company. A cancelled order can be put back to the position saved before the cancellation, unless goods have already left or Finance already has a document. A cancelled delivery opens again once that sale is live. An order that has not shipped and is not a call-off can return to a draft quotation, and the order is cancelled when it was still live. Reason: tags were being treated like a purchase order, and a mistaken cancel or a sale that should still be a quotation had no way back. Source: `src/core/shared/hashtags.ts`, `src/modules/sales/domain/pointers.ts`, `src/modules/sales/services/rewind.ts`, `src/modules/logistics/domain/operations.ts`.

## 3 October 2026 — A plan is private until it is shared

A new plan belongs to its owner. Other people see it only when the owner shares it with them, or with everyone who can open Plan. A view share can read it. An edit share, or a company share, can change it when the person also has plan edit. Plans that already existed stay shared with the company so they do not disappear. Sensitive plans still need the sensitive read. Reason: people were able to open each other’s plans. Source: `src/modules/plan/domain/access.ts`, `docs/modules/PLAN.md`.

## 3 October 2026 — A product has its own class

Each product stores a class: finished goods, materials, work in progress, packaging, services or other. Category remains the group that price rules match. Choosing a category fills the product's class from that category, and the product can keep a different class. A new product with no class chosen takes the category's class, or Other when there is no category. Existing products took the class of their category. Reason: class says what the product is, and that can differ from the catalogue group used for pricing.

## 3 October 2026 — A quotation shows when a line is out of stock, and when it is forecast to return

While a quotation or sales order is being written, each product line shows the free quantity. Above that, the line says out of stock. Hovering it shows the date dated supply covers the quoted quantity: expected receipts, then the larger of the open production orders and the production plan. The line can still be saved. “Add to confirmation. Deliver and invoice when back in stock” keeps that promise on the quotation and the order. When Logistics is on, stock coming back raises the delivery and the invoice follows that delivery. Reason: the person quoting has to see the shortage and the forecast date, and can still confirm the line. Source: `src/core/availability/stock-promise.ts`, `src/modules/sales/components/quote-availability.tsx`.

## 3 October 2026 — An out-of-stock order stays as a balance until stock returns

Confirming an order does not fail because the warehouse is short. The unallocated quantity is the balance. When stock comes back — a receipt, an adjustment, a purchase receipt or a transfer that has arrived — Atlas raises a delivery for the quantity now covered, issues that stock, and then raises the draft invoice from that delivery. The earliest promised order is served first. An order set to ship complete waits until every line can go. Quantity already on a pick stays with the warehouse. Finance still posts the invoice.

Reason: a sale placed without stock has to remain open, and the delivery has to exist before the invoice. Source: `src/modules/logistics/domain/stock-balance.ts`, `src/modules/logistics/services/stock-balance.ts`, `src/core/stock/replenishment.ts`.

## 3 October 2026 — A customer map shows the group, the invoice customer and who reports to whom

Customers → Map, and Who's who on the customer, draw the ownership tree: group, business, branch. Move up lifts an account to its grandparent. Move down nests it under the account drawn above it. The group control sets the parent. The invoice customer is that account's trading link; choosing this account means it is invoiced itself. A person can report to another person in the same group, and they sit under that manager on the map. Reason: the hierarchy has to be movable on the screen, and the picture has to show companies, branches and managers together. Source: `src/components/customers/account-map.tsx`, `src/core/customers/hierarchy.ts`.

## 3 October 2026 — One availability figure, and the delivery dates the invoice

Available stock is on hand, less quality holds, plus incoming production, less the greater of confirmed demand still to deliver and active reservations. Incoming production is the larger of the open production plan and open production orders, so the same make is not counted twice. Sales, Inventory, the product, Production Planning and Manufacturing MRP read that figure. They do not keep a second stock balance.

Confirming a delivery raises a draft sales invoice for the quantity delivered, dated on the delivery, and linked to the sales order and the shipment. Finance still posts it. Units already invoiced are not invoiced again. If Finance or the currency books are missing, the delivery still completes.

Reason: the sale, the warehouse, the invoice date and planned production have to be one chain. Source: `src/core/availability/picture.ts`, `src/modules/stock/services/availability.ts`, `src/modules/finance/services/delivery-invoice.ts`.

## 3 October 2026 — Customer paperwork carries the company’s brand

Invoices, credit notes, debit notes, quotations, order acknowledgements and proformas print the company’s logo, colour, letterhead, payment details and terms. Company administration → Brand is where those are uploaded and written. PNG and JPG logos print on the document. WEBP and GIF stay in the workspace. A near-white colour is refused so the title stays readable. The brand text lives in the existing company profile, so saving Workspace keeps it. Reason: a customer should receive the company’s document. Source: `src/core/documents/company-brand.ts`, `src/app/(app)/settings/brand-panel.tsx`.

## 3 October 2026 — My work lives on the person’s profile

Holidays, the rota, assigned tasks, meetings, reviews, goals, performance plans and the phone, address and emergency contact sit on `/profile`. Saving contact details updates the HR employee record. Password and company access stay on that same page. Reason: a person should open one place for everything that belongs to them, and HR remains the record those contact details write. Source: `src/app/(app)/profile/page.tsx`.

## 3 October 2026 — UK sales carry VAT; exports do not

A sales order or quotation for a UK delivery address, or one with no country chosen yet, adds VAT at 20% unless the product is zero-rated or exempt. A delivery address in another country is an export and is charged with no VAT. An overall discount can be applied or removed at the end of the sale, and it is taken off before VAT. Reason: UK customers are charged VAT on every UK sale, and goods sent to an address outside the UK are not. Source: `src/modules/sales/domain/uk-sale.ts`.

## 3 October 2026 — Export proformas are raised with the sale

An export sale raises a proforma when the sale is saved, and issues it when the sale is confirmed. The proforma is a sales document for the customer and for export paperwork. It is not a tax invoice, and it does not post to Finance. The customer account holds the invoice template: which addresses to print, and, for exports, weight, volume, commodity code, origin, Incoterms, ports, packages, marks and EORI or VAT numbers. The consignee attached on that account is used on the sale even when the address is stored as a billing address. Weight and volume come from the product and are multiplied by the quantity. Missing facts stay blank and block confirmation. Reason: exporters ask for the proforma at the point of sale, and each customer’s paperwork is different. Source: `src/modules/sales/domain/invoice-templates.ts`, `docs/modules/SALES_ORDER_PROCESSING.md`.

## 3 October 2026 — Sites hold warehouses and yards, and products sit in locations

A site is a company place. A warehouse or a yard belongs to a site. Locations inside that place are named and can be added or retired once stock has moved off them. A product quantity is placed in a location. Moving inside one site arrives immediately. Moving to another site leaves the source and stays in transit until the destination receives it. Reason: internal stock has to move between real places, including a yard, without pretending it has already arrived at another site.

## 3 October 2026 — SKU and pallet quantity live on the product

The SKU is the product code. How many of that SKU go on a pallet is the product’s pack count: units in a pack, packs on a layer and layers on a pallet. Entering only the pallet quantity fills that breakdown. Logistics reads it when packing and refuses a pallet that holds more than the product allows. The courier file can include the SKU and that pallet quantity. Reason: packing and the carrier file need the same product facts, not a second warehouse-only number.

## 3 October 2026 — A price list sets the sales currency, and a category can carry one discount

The currency on a price list is the currency of quotes and orders that use that list. A product row is a set price plus an optional discount taken off that price. A category row is one overall percent for products in that category. A product’s own set price replaces the category discount. Discounts do not stack. Reason: Michael asked for product search, discounts on set prices, a currency that becomes the sales currency, and product categories as a selectable overall discount.

## 3 October 2026 — Handling units are packed packages, and order dates are company switches

A handling unit is a logistics package with a company type, size, weight and optional parent. The starter catalogue is pallet, carton, box, crate, stillage, IBC, roll cage and container. A company can add a type, retire it, or delete it only when nothing has been packed onto it. Packing writes the unit before a shipment exists. Completing the pack creates the shipment from the packed quantity. A courier CSV is a chosen download: the person picks the shipments and the columns, including items, size, address, customer PO and delivery date. Customer PO, requested delivery and promised delivery stay on the sales order and can be switched off in Sales rules. Switching a field off hides it. It does not delete values already stored. Reason: the warehouse needs real units to hand to a carrier, and not every company uses a customer PO or a promised date.

## 3 October 2026 — Personal and performance-plan goals stay off shared dashboards

A department or team target may name a catalogue measure. That target is company-visible and can appear under the matching dashboard chart. A personal goal, a development plan and a performance-improvement plan are private: the person, the plan owner, the line manager and company HR with employee-record access can read them. They appear in Goals and on that person's profile. The department figure linked from a private goal is context only and is not that person's score. Disciplinary allegations stay in HR and are not copied onto the scorecard. Reason: a performance plan is about one person, and a company chart must not reveal it. Source: `src/modules/kpis/services/access.ts`, `src/server/data-api/read-policy.ts`.

## 3 October 2026 — Project reads may nest 24 filters

The data service rejected Projects with “Filter nesting limit exceeded” at depth 10. Company, team, owner and member visibility is one filter, and the home screen nests that inside tasks, documents and the inbox. Depth 24 allows those reads. The check still refuses deeper filters. Source: `src/server/data-api/read-query.ts`.

## HR access is sliced — 3 October 2026

Holidays, policies, employee records, reviews, absence, rotas, pay, and conduct
are separate permission groups. A person can read company policy PDFs and book
their own holidays without payroll or another person's disciplinary record.
Performance plans and disciplinary cases stay on the server as structured forms.
Policy files are PDFs only, and the generic read API never returns the file bytes.
Managers see conduct for their team. Company-wide conduct needs an employee-record
capability as well. A person cannot run a conduct process about themselves.

## 3 October 2026 — Safety assists decisions and does not store them on the Mac

Safety holds, permits, competence and statutory defects are operational gates for Manufacturing, Logistics and Sales. A score, a template or a RIDDOR category is an explanation for a person to review. Atlas does not decide that an event is reportable, does not submit it to a regulator, and does not declare equipment safe from a calculation. Clinical records, emergency-service dispatch and a monitored lone-worker service stay outside the module. Field capture is committed only when the server has stored it. A persistent safety queue on the Mac would be a second business database, so it is not built. Reason: responsibility stays with the dutyholder, and business records stay on the server. Source: `docs/modules/SAFETY.md`.

These initial entries capture existing repository constraints, not new architectural
changes. Add dated entries with decision, reason, sources and consequences when a
lasting choice changes; explicitly supersede an old entry rather than hiding it.

## 3 October 2026 — Manager level is a company switch

CRM, Finance and Customer Service can require a manager without a new role name. A company administrator turns the switch on in Company administration. CRM then requires `sales.pipeline.manage` to push a prospect or deal, and `sales.prospect.assign` to assign the prospect or a task. Finance requires `finance.approval.decide` on the route at or above the company limit, and the requester cannot approve their own document. Customer Service requires `service.case.approve` to resolve or close a complaint or a high-value linked query. The switch adds no permission by itself. Reason: sales managers already assign and push work; finance and service need the same idea for sign-off, and the company chooses when that bar applies.

## 3 October 2026 — Audit areas are assigned, and own activity is a company switch

A company administrator assigns each person to one or more Audit areas in Audit → Access. Those areas are the systems already mapped in `src/core/audit/systems.ts`. The same page turns on own activity for the whole company: each person then sees only the changes they recorded. Company-wide `core.audit.read` and team `audit.team.read` stay as they are. The grants and the switch live on `Organisation.auditAccess`, not in a second history. The activity CSV is an explicit download of that same view, with secret-looking fields left out. Reason: managers need to open one area or several without handing over the whole company, and a person should be able to see their own trail only when the company asks for it.

## 3 October 2026 — Team audit and Echo stay on the existing trail

Managers read the audit rows the apps already write. Actions are mapped to a system by prefix in `src/core/audit/systems.ts`; an unmapped action stays visible as unclassified. Company-wide history remains `core.audit.read`. `audit.team.read` is limited to the viewer, their direct reports and the work teams they manage. Echo notes live on the customer, order, quotation or call-off. Tagging someone creates a mention back to that record. The note text is not copied into the audit payload. Reason: a second history store would drift from the trails already recorded, and a salesperson should be able to point a colleague at a record without opening the whole company audit.

## 3 October 2026 — A chart opens a menu

Clicking a dashboard chart, or one of its slices, opens a menu. The menu chooses a named view, the chart, a related measure from the same app, one group, the size and the colour. Orders offer status, order type, product, category, customer and time. Product and category count lines. These are declared breakdowns on the measure, not a free query. Pipeline amounts stay split by currency. The figures stay in the page for display. Reason: the dropdowns on each tile were the wrong control for choosing what a chart shows.

## 3 October 2026 — Repository-owned shared memory

Use .ai/ as a compact context/handoff layer, with AGENTS.md, CLAUDE.md and a Cursor
rule pointing to it. Keep detailed architecture/specifications in docs/ and verify
status against code. This prevents tool-specific histories and duplicated handbooks
from becoming competing sources of truth. Memory changes travel with Git changes.

## 3 October 2026 — No page reload in the Mac app

The View menu does not offer Reload, and the desktop web view ignores reload.
A window reload drops the running workspace and leaves the connect panel up.
Saves upload to the server as they are made. While a page is open and nobody is
typing in a field, the shell reads the latest server records about every 8
seconds. That refresh is not a window reload. Source: `desktop/macos/Atlas.swift`,
`src/components/shell/refresh.tsx`, `docs/DESKTOP_DATA_BOUNDARY.md`.

## 3 October 2026 — Desktop software, server data, on every prompt

Atlas software ships in the installed Mac app. The remote server stores shared
data only and must not host Atlas software. Michael required this sentence in
every agent prompt. Cursor loads `.cursor/rules/desktop-data-boundary.mdc`
with `alwaysApply: true`. The same lead is in AGENTS.md, CLAUDE.md and
`.ai/PROJECT_MEMORY.md`. A Mac window that only displays a remote Atlas app
does not qualify. Source: `docs/DESKTOP_DATA_BOUNDARY.md`.

## 3 October 2026 — CRM industries are a company list

Industries such as drainage or house bricks are records on the company (`CrmIndustry`), not free text on each prospect. Tags stay a short list of labels on the prospect and are copied onto the opportunity and customer when a prospect is converted. Reports filter that grouping and can download it. A board is created in the Dashboards app, not as a CRM section. Source: `prisma/schema.prisma`, `src/app/(app)/crm/prospect/page.tsx`, `src/app/(app)/crm/reports/page.tsx`.

## 3 October 2026 — An app does not host another app’s section

Apps may link to each other’s records. A navigation title that names another app belongs in that app. CRM no longer has a Dashboards tab (`/crm/dashboards` redirects to `/analytics`). Sales no longer tabs Customers, Products or Pricing. HR no longer tabs Staff Scheduling. Inventory no longer tabs the product catalogue. Customers and Products headers no longer tab Pricing, Sales or Inventory. Staff Scheduling keeps the weekly rota and links out to HR for timesheets, time off and the team. Finance budgets are labelled Budgets so they are not the Planning app.

## 3 October 2026 — Polished glass chrome

Supersedes the same-day paper-and-ink chrome. Michael rejected that pass as too grey and flat, and asked for a slick, rounded, translucent finish in the manner of Apple’s interface, without childish colour. The shell uses frosted white surfaces, pill controls, and a single blue (`#0071e3`). Rainbow app tiles, gradient marks and the beige paper ground are not the direction. Source: `src/app/globals.css`, `src/app/(app)/home/page.tsx`, `src/components/shell/sidebar.tsx`.

## Existing — Core + Modules, shared identities

Party is the canonical customer identity. Modules contribute business records and
customer overview providers; they do not invent customer masters. Shared products
and pricing must also be reused. See docs/ARCHITECTURE.md and docs/CUSTOMER_MASTER.md.

## Existing — CRM and Sales are separate apps

CRM owns prospects/opportunities/relationships; Sales owns commercial documents.
Legacy CRM capability strings remain sales.prospect.* / sales.opportunity.* for
stored-role compatibility. Renaming requires an explicit permission migration.
Source: docs/MODULE_ROADMAP.md and the module registry.

## Existing — Server-enforced access

Use session-derived organisationId and capability checks, plus module access controls.
Client input and company roles must not grant platform-operator access. Follow
AGENTS.md, docs/PERMISSIONS.md and existing auth/module-access implementations.

## Existing — Durable records do not imply delivered integrations

Sales revision/outbox writes preserve commercial history transactionally. Pending
outbox records do not prove inventory, logistics or finance processing occurred.
A dispatcher, idempotent consumers and reconciliation remain integration work.
Source: docs/modules/SALES_ORDER_PROCESSING.md.

## 3 October 2026 — HR is one module (`people`), not split people/payroll/scheduling

The stub catalogue had separate `people`, `payroll` and `scheduling` stubs. Built
HR as a single module instead (`src/modules/people/`) covering employee records,
onboarding/offboarding, appraisals, one-to-ones, absence (Bradford Factor),
rotas and payroll together, per explicit product direction ("everything built
in"). Reason: payroll and rotas both read directly off `Employee` (salary,
status) with no cross-module event/API needed, and the user wanted one coherent
HR experience rather than three apps to enable separately. The `payroll` and
`scheduling` stub ids remain in `src/modules/stubs.ts` as coming_soon for now;
if they're ever built for real, retire them explicitly rather than colliding
with `people`'s own payroll/rota screens. Employee links to `User`/`Membership`
by optional `userId` rather than inventing a separate "staff account" concept,
matching Customer Master's one-identity rule. Source: src/modules/people/*,
docs/MODULE_SPEC.md.

## 3 October 2026 — Memory updates are part of every change

Require a CURRENT_STATE.md update before every changed task's handoff, commit or
PR, including small fixes, configuration and documentation. Reconcile affected
topic docs and record lasting decisions when applicable. This replaces the earlier
"significant work" threshold so small changes cannot silently accumulate context
drift. All three tool entry points explicitly repeat the gate. It is an agent
instruction; no background watcher or Git enforcement hook is installed.

## 3 October 2026 — Plan is the connected planning layer, not Production Planning

Plan (`plan`, `/plan`) holds what the business intends, what it now expects, and the gap. Production Planning (`planning`, `/planning`) keeps product demand, stock coverage and saved product targets. They stay separate so a sales or company plan does not become another MRP screen, and so manufacturing scheduling is not rebuilt inside Plan.

Actuals are read from the owning module when that module is enabled and the user can read it. They are not copied into the plan. A snapshot is a separate, explicit copy. Scenarios change a copy of the forecast. Promoting a scenario writes the working forecast and leaves the approved baseline version unchanged. Cross-module effects run only along connections someone has kept on that plan. Rates such as margin and OTIF are not summed. Sensitive plans are hidden unless the user has `plan.sensitive.read`.

## 3 October 2026 — Dedicated manufacturing Planning, shared records

Planning owns demand/MPS/MRP/capacity/finite production scheduling; Manufacturing
owns execution/MES/WIP. This separates planner and operator workflows while
retaining every supplied manufacturing requirement. Shared Product/Party/UOM/site
identities and owner commands/providers prevent duplicated masters; snapshots and
ledger projections retain provenance. Production scheduling is distinct from HR
rotas. Target and acceptance gates: docs/modules/MANUFACTURING_PLANNING.md.
Runtime packaging has not changed. The later complete attachment supersedes the
section-60 cutoff and the initial delivery order: follow its seven phases (125–131),
including costing before MRP. Deterministic services precede UI/optimisation (124, 129,
139, 141); separate quantity and valuation ledgers with Finance-owned posting rules
(75–77, 90). All 143 sections are tracked in MANUFACTURING_COVERAGE.md.

## Required deployment boundary — 3 October 2026

User requirement: Atlas software, UI and application runtime belong on the user's
Desktop/Mac. The remote server stores shared user/business data; it must not host
the Atlas UI or full Atlas application. Apply this to every module, including HR,
CRM, Sales and Manufacturing. A desktop wrapper displaying a remotely hosted Atlas
application does not satisfy this requirement.

Persist user/business records, attachments and backups on the server only. Do not
introduce a local business database, offline record store or persistent business-data
cache. Local software files and minimal connection/session settings are separate
from business records; review browser caches/logs/exports against this boundary.
Transient data needed to display a record is not an authoritative local datastore.

A minimal authenticated data-access service may be needed to protect the remote
database and enforce tenant/capability checks; it must not grow into a hosted Atlas
application. Do not put shared database credentials into the desktop package or
remove server-enforced access controls. The precise data-service/runtime split is
an implementation task, not a claim that the current build already meets the target.

Older hosted-web-app/private-SSH thin-client plans are superseded as target
architecture. Preserve historical deployment evidence, clearly labelled, and inspect
actual runtime/package/network/storage behaviour before claiming compliance.
Do not deploy the Atlas application to the remote server. Any retirement of an
existing remote application must preserve all user data and backups.

## 3 October 2026 — One project, generated desktop/data build snapshots

Claude/Codex/Cursor edit the same repo and memory. Build snapshots under ignored
build/ are generated outputs. Desktop runtime bundles its UI and forwards exported
server actions to one secured data service; the remote package strips Atlas UI
routes/source. This retains server-enforced tenancy/capabilities without remote
Atlas screens or a local business database. Ephemeral native browser state and
no-store reads prevent an intentional persistent record cache; local native
business-data downloads are disabled. Activation must preserve active unsaved forms.
See docs/DESKTOP_DATA_BOUNDARY.md and scripts/prepare-runtime.mjs.

## 3 October 2026 — Dashboard builder is dropdowns on the chart

The card catalogue and thumbnail chart picker made a board hard to build. Measures, breakdowns and chart types stay available, chosen from dropdowns on the board and on each chart. Width, colour, title, focus and drag order stay behind Arrange so the chart itself stays usable. Orders keep their existing views (status, type, product, category, customer, time). No new query surface: still curated measures only.

## 3 October 2026 — Analytics contributions and private Studio foundation

Analytics uses a typed manifest provider so modules own metric definitions, grain,
source permissions and tenant-scoped aggregation; Core assembles approved metrics.
No arbitrary SQL/joins or duplicated business logic in dashboard widgets. Initial
private definitions reuse the server Dashboard model under an Analytics namespace;
sharing/publication requires an explicit versioned model in a later phase. Preserve
all 195 source sections and track full acceptance separately from the v0.1 foundation.

## 3 October 2026 — HR action triggers and explicit transition gates

Keep initial checklist/review creation and recurring review scheduling inside
secured server commands, using transactions for employee creation and recurring
review completion. Due work is projected on the HR workspace; this does not imply
an unattended scheduler or email delivery. Checklist completion gates activation
and departure; payroll capability owns salary writes. Existing HR records are
preserved and no local business store is introduced. Details and limits:
`docs/modules/HR_WORKFLOWS.md`.

## 3 October 2026 — Logistics owns execution, not stock or finance

The operational module keeps four owners. Sales owns the commercial promise.
Stock owns quantities, locations, lots, serials and the ledger. Logistics owns
fulfilment requirements, warehouse work, packages, shipments, loads, receipts
and returns, and asks Stock to reserve or move. Finance owns invoices, credit
and journals. Carrier, purchasing, fleet, quality, route and 3PL behaviour sit
behind providers so missing modules are not reimplemented inside Logistics.
The earlier 222-section source brief stays preserved and its coverage stays open.

## 3 October 2026 — Logistics must connect to Sales and Finance

Michael explicitly requires both integrations. Sales owns commercial demand;
Logistics owns physical fulfilment; Finance owns accounting treatment and journals.
Shared Party/Product identities, tenant-scoped providers, transactional events and
idempotent consumers connect them. A navigation link or pending outbox is not
delivery. Preserve all 222 source sections and follow phases 198–207, designing
Sales/Finance contracts at foundation stage. The desktop/server-data boundary
supersedes source suggestions for persistent local offline task data.
See docs/modules/LOGISTICS_INTEGRATION.md and LOGISTICS_COVERAGE.md.

## 3 October 2026 — Flexible saved product plans and explicit CSV exports

Register `planning` independently from the `manufacturing` execution stub. Shared
Sales/Inventory providers supply minimal demand/stock projections; target work
retains canonical Product references. Shared WorkTeam references existing Membership
identities. Saved plan windows/granularity are separate from executable production,
material/capacity booking and WIP; do not fabricate those missing integrations.
Primary vendor research and full acceptance: docs/modules/PLANNING_RESEARCH.md.

User explicitly requested CSV downloads. Permit user-chosen native CSV exports from
Planning, Inventory and Sales, superseding the earlier blanket local-download block.
This is an export exception, not permission for local databases, offline stores or
background business-data caches. CSV is capability/tenant scoped, no-store and
protects textual cells against spreadsheet formulas.

## 3 October 2026 — Manufacturing definitions drive both Products and Planning

Michael explicitly requires BOMs/intermediate WIP, eligible machines, operation
times and complete labour/logistics/machine/material costs on Products, feeding
annual-to-weekly Planning. Reuse canonical Product and resource/team records;
version definitions/rates and snapshot released orders. Actual WIP belongs to
execution, distinct from intermediate Product identity. Show auditable estimated
cost separately from actuals; include rate components once. Detailed acceptance
is in docs/modules/MANUFACTURING_PLANNING.md. This is required scope, not a claim
that manufacturing engineering, scheduling or costing engines are implemented.

## 3 October 2026 — A pack and a product it needs are links, not the bill

How many of a product go in a box, pack or carton stays on that product, with the
name of the pack. When the pack is its own product, a CONTAINS link says how many
of another product are inside one of it. A REQUIRES link says this product needs
that other product before it can be used. The manufacturing bill stays the list
of what is consumed to make it. A pack cannot contain a chain that returns to
itself.

## 3 October 2026 — Product categories and plant machines are one catalogue

A product category is a company record (code, name, class, optional parent).
The product still stores `categoryCode`, and price rules keep matching that code.
The product also stores its own class; see "A product has its own class".
Renaming a category code updates products and category price rules together.
Classes are finished goods, materials, work in progress, packaging, services and
other — names are the company's, not an industry template.

A recipe step stores the manufacturing work centre and machine it runs on.
Manufacturing → Plant is where those records are created. Releasing a production
order copies that machine onto the work order. An older step that only typed a
work-centre name still matches by name. The link does not book a calendar or
create shop-floor progress by itself.

## 3 October 2026 — A product recipe is versioned on the product

The first product-engineering slice stores one active make, buy or WIP recipe on
the shared Product, with components, yield, scrap, batch size and operation rates.
Older versions are retired, not rewritten. Standard cost rolls materials and
spreads setup across the batch; costing a quantity starts a new setup per batch.
Machine rates can already include the operator so labour is not counted twice.
Confirmed sales demand and plan targets are shown separately. Work in progress is
an intermediate product that can sit in stock. Sent-out work is a subcontract
fee plus any parts you still supply. A step can name its work centre without
booking a machine calendar. The product page shows the multi-level structure,
where the product is used, and cost split into materials, machine, labour,
overhead, subcontract and logistics. Each product also stores the weight, size,
volume, pack, pallet and customs facts a later logistics load will add up. This does not add shop-floor progress, finite scheduling, reservations or a finance journal.

## 3 October 2026 — Separate Staff Scheduling linked to HR

Supersedes the earlier single-People-app scheduling decision at the user's explicit
request for a detailed staff planning app linked to HR. Register `scheduling` with
`people` dependency; reuse Employee and the existing RotaShift table. HR owns leave,
private notes and actual timesheets; Scheduling owns weekly planning/public shifts
and work tasks. A typed `staffRosterProvider` on the manifest provides only scoped
roster fields through Core registry. Manufacturing Planning remains separate.

Team management is a capability plus the current employee-manager relationship,
not company-wide employeeRead. Staff self-service resolves their linked login.
Confidential notes are append-only with MANAGER_HR / HR_ONLY audiences and have no
generic-query allowlist. Actual hours require explicit review and do not implicitly
become payroll. See docs/modules/STAFF_SCHEDULING.md for release and policy limits.

## 3 October 2026 — Studio design preview and curated source expansion

Use the same Studio UI for live dashboards and a clearly labelled synthetic preview
so design can be reviewed without new tenant entitlements or access grants. Preview
never reads tenant records or offers saves. Colour is configurable through bounded
palettes; persisted visual settings are validated. Existing app providers own their
metric definitions and read gates; Core supplies Customer Master independently.
Count metrics are not labelled revenue/valuation, and category inspection is not
claimed as transaction drill-through. Exclude disposable build/ snapshots from root
typechecking to keep the one editable source tree authoritative.

## 3 October 2026 — Completed apps must be live

Michael explicitly instructed that apps must always be made live when done.
He reaffirmed that this covers every app worked on now and going forward, including
updates/fixes. Deployment must be a required task step, not an optional follow-up.
Completion includes compatible release, installation/activation and verification
in the installed Atlas app, rather than stopping at a source change or preview.
This is standing authorization within the existing desktop/server-data boundary;
it does not expand profile data access or permit losing unsaved work. Concrete
activation blockers must be recorded and reported with the remaining step.

## Customer Service case versus departmental work — 3 October 2026

The supplied 241-section brief defines one case engine for complaints/queries and
distinct department tickets under the case. Customer Service retains ownership
through internal investigation; ticket completion cannot resolve/close the case.
Use Core Party/Contact and typed ERP references, not copied customer/order records.
Queue membership does not bypass restricted case access. Communication logs are
not email delivery, agreed response deadlines are not SLA/OLA engines, and no second
generic task engine is introduced. Full nine-phase scope/acceptance remains in
docs/modules/CUSTOMER_SERVICE*.md. UI/runtime follow the Desktop/server-data boundary;
activation and central migrations are separate verified release steps.

## 3 October 2026 — Projects is one full work-management scope

Michael explicitly rejected delivery phases: “no phases just do it all.” Preserve
all 256 source requirements in PROJECTS_SOURCE_REQUIREMENTS.md, track acceptance
in PROJECTS_COVERAGE.md and implementation/evidence/limits in PROJECTS_WORKSPACE.md.
Extend existing Project/ProjectTask rather than introduce another engine. Shared
Party/WorkTeam/User identities and independent ERP target permissions are retained.
Private source access applies to search, Analytics, nested data reads/counts and
related audit entries. Published updates/document revisions/baselines retain history.
Source offline-note suggestions do not override server-only persistent business
storage. Finance owns actual costs/billing/capitalisation; unavailable integrations
must be displayed as unavailable, not fabricated. The current broad implementation
is unfinished against the full brief and is not installed/deployed by source edits.

## 3 October 2026 — Customer identity survives module summary failures

Customer overview providers fail independently. An unavailable module contributes
an explicit unavailable message, no invented zero and no actions; working module
contributions and Core customer/hierarchy access remain available. A live Projects
provider rejected by the older server read metadata demonstrated why unrelated
module summary failure must not take down the canonical customer record. Existing
provider capability/tenant gates remain in force. See docs/CUSTOMER_MASTER.md.

## 3 October 2026 — Generate persistence contracts per package snapshot

Regenerate Prisma Client and the data-query metadata during desktop/data package
preparation from that exact snapshot. Copying a previously generated client can
omit new relationships used by access predicates and break installed home reads.
Required to-one projections use scoped server ID validation before returning data,
since Prisma rejects nested `where` on these relationships. Preserve tenant and
record visibility checks; do not remove them to make projections compile.

## 3 October 2026 — Chat stays in the top bar and creates real work

Direct messages and chats with several people live in the top bar, with unread
notices, rather than as a separate launcher app. A conversation can create a note,
a personal Project task, follow-up or request, or a meeting. Those records stay in
Projects, visible to the people involved, and are not a second task system.
Messages stay with the participants, who can be colleagues or customer contacts
in this company. A contact chat is stored in Atlas and is not emailed or sent
out of the company. A message can attach an order, quotation, customer, project
or product the sender is allowed to read; someone who cannot read that record
sees that an attachment exists and cannot open it. Company-wide messages are
not sent. Generic chat reads cannot cross the participant boundary.
History search remains open. See the chat dock and `docs/MODULE_ROADMAP.md`.

## 3 October 2026 — Enable finished apps at deployment

Michael explicitly requires finished apps, including Production and Marketing,
to be turned on when deployed. Release includes organisation module enablement
and installed Apps/navigation/workflow verification for authorised profiles.
Preserve existing capability and record visibility rules; enabling a module does
not grant every profile access. This records the standing requirement, not a
claim that these modules are complete or currently enabled.

## 3 October 2026 — Holiday requests are decided in HR

A person asks for holiday on their profile. The working days are counted from
their pattern and the request waits in HR → Holidays for their manager. HR can
change that day count before approving, in half days, and can change the year’s
allowance for each person. The allowance stays a whole number. Sickness and the
people planner do not own this decision. Reason: Michael asked for profile
requests to go to a manager, with the days calculated and the allowance editable,
and for that to sit in HR.

## 3 October 2026 — People planner is a month team plan

Staff scheduling stays its own app, linked to HR. The planning surface is the
month, grouped by team. Named work patterns (office, production, contact centre,
or a pattern the company adds) are the hours that get placed. Daily demand is
either man-hours or traffic × handle time, with shrinkage, because a call centre
and a production team describe load differently. Live sales-order counts and the
manufacturing forecast are context for someone allowed to read them; the team’s
saved demand is the number the plan is short against.

Approved sickness or holiday does not silently rewrite the plan. It opens a
cover suggestion, and the manager applies the replan. A busy period can limit
how many people are off, or close new holiday requests, without changing
entitlement. Sickness is always recorded. Published shifts are what a person
sees on their profile. Reason: Michael asked for a team time planner that works
across a month, different kinds of work, man-hours from department traffic or a
forecast, and a replan when people are off.

## Scheduling workspace continuity — 3 October 2026

Daily rota, actual hours, holiday booking and team notes stay under Scheduling
routes. Shared HR view components and scoped actions retain HR ownership of
employees, leave, hours and confidential notes, avoiding duplicate records and
app switching. Scheduling edits and week publication recheck approved absence,
overlap, tenant and current staff eligibility in serializable transactions.

## 3 October 2026 — Marketing is a campaign desk

The marketing plan screen is removed. Marketing opens on campaigns, a month
calendar, budgets, the customer journey and leads. The tile menu is gone.
Saved plan documents stay in the server store and are no longer edited in the
app. `/marketing/plans` and `/marketing/campaigns` open Campaigns. A budget
line names the place the money is for. Sending it to Finance creates a spend
request and submits that request for approval. The planned amount is not
posted spend and does not pay a supplier. A customer journey is a
MarketingProgram map (`JOURNEY_MAP`, `JOURNEY_STAGE`, `JOURNEY_TOUCH`) with
named stages and touchpoints. It is not the automation journey
(WAIT/BRANCH/GOAL/END) and it does not send anything. Reason: Michael asked
for campaigns, a calendar, spend assigned to places, Finance approval, the
customer journey and its touchpoints, and for the half menus and scoring note
to go. Source: `src/modules/marketing/manifest.ts`,
`src/modules/marketing/services/commands.ts`,
`src/modules/marketing/components/journey-map.tsx`,
`src/app/(app)/marketing/`.

### 3 October 2026 — Marketing planning ownership
Marketing strategy, channel delivery activities and budget allocations are stored
as strictly validated MarketingProgram definitions in the shared server store.
This extends the existing module without creating a separate customer, task or
financial ledger. Planned cost and forecast remain estimates; Finance owns actual
spend. Sales outcomes read existing CRM records with original source permissions
and module activation checks. Decimal budget inputs are converted exactly to minor
units and currencies are never summed together. External providers remain blank
until Michael chooses them; planning does not imply outbound activation.

## 3 October 2026 — Finance owns purchasing; approvals remain Core

Michael authorised building and refining the full 80-section Finance brief. Finance
owns the eleven supplied workspaces, including purchase requests, POs, receipts
and AP. Retire Purchasing's competing catalogue stub; retain its historical source
export rather than build a second procurement engine. Core ApprovalPolicy/Instance/
Step/Delegation are reusable owner-command infrastructure. Finance financial records
extend shared Party/Product/Project identities; HR claims remain the expense source
through a typed manifest provider, with Finance adding coding/posting rather than
a second employee claim engine. Bank payment execution and statutory submission
require separately verified provider/localisation acceptance. Full scope retained
in FINANCE_SOURCE_REQUIREMENTS.md and FINANCE_COVERAGE.md.

Weekly Scheduling hours budgets belong to the signed-in manager, calendar week
and department scope; they are private planning targets, not payroll costs or
company-wide financial approvals. Whole-scope planned totals ignore staff search
and the 100-row board limit. Approved timesheets supply actual hours. Overages
warn without blocking publication; a hard approval policy was not requested.

## 3 October 2026 — CRM uses quiet workspace chrome

CRM navigation is an underline row on the page, not the boxed icon header used by
other modules. Reason: the boxed header plus a second page title made CRM look
like a generic admin template, and the pipeline’s per-card stage menu made every
deal look like a form. Other modules keep the existing panel chrome. Client
contracts and the service promise were added later the same day in Pricing;
see “Pricing owns the customer contract and service promise”.

## 3 October 2026 — Administrators can create the books a call-off invoice needs

Administrator and Finance Manager can create the first set of books and open a sales invoice (`finance.configure`, `finance.receivables.read`). Reason: those roles could open Finance but could not create books, so a call-off delivery had nowhere to put the draft invoice. Existing companies receive the grant in `20261003830000_finance_books_for_invoicing`.

## 3 October 2026 — One project and one call-off order across CRM and Sales

CRM, quotations and sales orders attach the same Projects record. They do not
keep a private copy of the project. A call-off order is the big order
(customer, dates, agreed price, full quantity). Add it in Sales → Call-offs, or
accept a blanket quotation to open it. The unreleased balance is not a
fulfilment order and it is not planning demand. Deliver and invoice a quantity
from that order each time: the release is a confirmed call-off at the agreed
price, and Finance gets a draft invoice for those items only once books exist in
the order currency. A confirmed delivery with no invoice can raise it afterwards.
Live drafts count
against the remaining quantity so two deliveries cannot take the same goods;
cancelling the release puts the quantity back. Recurring contracts are still open.
Source: docs/modules/SALES_ORDER_PROCESSING.md. Michael asked for one big order
that can be delivered and invoiced a quantity at a time.

## 3 October 2026 — Pricing owns the customer contract and service promise

Supersedes the same-day note that client contracts and SLA signup were unbuilt.
Price lists stay a spreadsheet of product prices, with CSV download and upload,
assigned directly to customers. A commercial agreement on the same customer holds
the contract dates, the price list, any special prices, payment terms and one
service promise (coverage, response, resolution). While it is active, a special
price beats a price stored on the customer product, then the agreement's list
beats the customer's usual list, then the catalogue price. A quote or order can
still name a list, or skip lists. Drafts do not change prices. Sales call-off
agreements stay the blanket quantity commitment and are not this record.
Reason: the previous screen led with scope, method, priority and exchange rates,
which is the part people almost never need first.

## 3 October 2026 — Dispatch can record the delivery

Company administration → Logistics holds one switch: when an order is dispatched, mark it delivered. Off, the shipment stays dispatched until someone confirms delivery. On, dispatch records the delivered quantity, marks a fully delivered order delivered, and Finance receives a draft invoice dated that day. Existing companies start off, so a courier or signature step is unchanged until an administrator turns it on. Only `core.modules.manage` can change it. Reason: Michael asked for dispatched orders to move to delivery automatically, and for that choice to live in company settings.

## 3 October 2026 — Company settings belong to company administrators

Company identity, logo, currency and fiscal year, which apps are switched on, sales approval limits, and HR company defaults (cadence, standard hours, overtime) change only with `core.modules.manage`. User accounts, roles, imports and HR templates stay on their own permissions. Company administration uses a grouped menu (Company, People, Records, Account) instead of one long tab row, and the sidebar entry is hidden when a person has nothing to administer. Reason: Michael asked that only administrators change company settings, and that the settings menu be easier to use.

## 3 October 2026 — Atlas owners set up a company from templates

The Atlas console is the place to create a company, issue setup codes and load the opening records. CSV setup is owner-only (`atlas.companies.manage`). Company administrators keep a smaller customers, products and prices import. The owner catalogue is customers and hierarchy, contacts, commercial settings, products, price lists, prices, warehouses, locations and employees. Supplier bank details, orders and invoices are not imported, so verification and document workflows stay in their apps. A registered company profile (legal identity, currency, fiscal year, locale) lives on the organisation and is separate from customer accounts. Workspace access can switch each implemented area off without deleting records. Reason: Michael asked for one clear owner portal to stand a business up, and for company settings to cover the real operating defaults.

## 3 October 2026 — Finance source links and operational receiving

Use typed Core registry contracts for Sales revision sources, Finance generation/
projections and Inventory receipt consumers. Preserve canonical Party/Product and
source order/revision/line IDs, exact saved monetary totals and idempotent keys.
Generate only explicitly reviewed order-based drafts until dispatch evidence exists;
never relabel an acknowledgement as an invoice or imply stock dispatch. Inventory
owns physical movements and requires separate permission; its accepted whole-unit
receipt commits with purchasing valuation. Notes are sourced financial adjustments,
not proof of goods return or refund execution. Keep active financial documents as
Sales cancellation blockers and retain voided draft history. Reason: prevent
duplicate bills, guessed fulfilment and inconsistent inventory/financial histories.


## 4 October 2026 — Fail incompatible releases before package activation

Installed app failures were caused by 33 missing central schema objects/columns across Products, Plan, Scheduling and other areas. Standard desktop packaging/installation now fails closed on missing schema fields, serializes release work, stages/signs outside iCloud, verifies complete runtime files and preserves the previous package. Reconcile reviewed additive migrations with a backup/restore rehearsal before activation. This prevents the observed mismatched-schema and incomplete-copy failures without changing profile permissions or storing business records locally. Keep fixed overlays outside CSS containing-block effects; expected Logistics form validation must not replace the page with an error boundary.

## 4 October 2026 — One shared, docked module nav; group instead of scroll

Every module's secondary nav (the row under its title — Overview/Trading/Banking/...)
is one shared component, `ModuleSpace` → `FloatingModuleNav`
(`src/components/shell/{module-space,floating-module-nav}.tsx`), not something each
module builds itself. It renders as a reveal-on-hover bar docked in real document
flow (`#atlas-module-nav-slot` in `ShellChrome`, between the topbar and `<main>`),
collapsed to zero height by default and pushing the page down when open — never an
overlay. An overlay (even portaled to the true viewport, even left-aligned to the
content column) cannot be placed near the top of the page without risking covering
the sidebar or the module's own icon/title; docked, pushed-content flow makes overlap
structurally impossible instead of something to keep re-tuning. A module with more
than ~6 nav items should group related ones with a shared `group: "Label"` string on
each `ModuleNavItem` (`src/core/modules/types.ts`) rather than letting the row grow
or scroll — see Finance's and HR's manifests. Documented as the required pattern in
`docs/MODULE_SPEC.md` so new modules inherit it instead of hand-rolling a tab row.
Reason: Michael asked for a slimmer, grouped, "premium" nav that never scrolls or
overlaps the sidebar/app chrome, and for it to apply to every app going forward.

## 2026-10-04 — Atlas app hosted on VPS 85.190.118.218
Michael asked in chat for the full app on the new VPS ("I want it all to run on this new VPS"). This supersedes the data-only server boundary for this host. Rationale: user's explicit requirement. Review before treating it as the permanent architecture.

## 5 October 2026 — Automations, company email/social and CSAT are their own modules; social code is rewritten, not copied

Michael asked for an automations app ("if order is done auto invoice"), company-level email/social
setup usable by Automations, CSAT with its own section, and contracts with a working sign URL — "no
questions, just do it". Built as three new Core-adjacent modules (`automations`, `csat`) plus
platform services (`core/email/*`, `core/social/publish.ts`, `core/contracts/*`, `core/scheduler/tick.ts`)
rather than folding any of it into Marketing, because Automations must act on Sales/Logistics/Finance/
Production events that have nothing to do with Marketing, and CSAT needed its own section per explicit
instruction. The HelloPort/Blocwrite social-scheduler and SMTP code on the Desktop was used as a
reference for which free platform APIs work (Bluesky AT Protocol, Mastodon, Telegram, Discord webhook,
Facebook Graph) but every line was rewritten against Atlas's `SocialAccount`/`EmailAccount` schema,
session/capability model and encrypted-secret store (`core/security/secrets.ts`) — no file was copied
in as-is, and nothing from Blocwrite's own product (novel-writing, admin, billing) came with it.
Domain events are now durable (`AutomationEvent` table; `emit()` persists before notifying in-process
handlers) specifically so Automations has something reliable to trigger from — the prior in-memory
bus was fire-and-forget to listeners that were never even registered. See
`docs/plans/MARKETING_AUTOMATION_EMAIL_PLAN.md` for the full plan and what is still open.

## 5 October 2026 — One stock forecast, shared with production

Inventory's forecast is calculated, not stored: usage from the movement ledger, overridden by the
product's expected monthly usage, overridden by the planner's production forecast for the month. Safety
stock, lead time and expected usage live on `Product` and are the same figures MRP plans with. Reason:
Michael requires the stock forecast to be tied into production; a separate forecast table would be a
second, disagreeing source. New pages must never be added as fixed routes over an existing dynamic
route, and an existing screen is never replaced with a placeholder to get a build through.

## 5 October 2026 — Administrators hold every Finance capability

The admin role had four Finance capabilities, which hid most of the Finance menu from the company owner.
Admin now holds all `finance.*`, as it does for every other app. Finance's own controls still apply: a
requester cannot approve their own document, and payment runs need a separate approval step.


## 7 October 2026 — CRM owns contracts and customer approvals

Michael requires Contracts & approvals in CRM; Sales is order processing. Move the
workspace/navigation with legacy redirects, retaining Core contract capabilities
and existing signing/quotation links.


## 7 October 2026 — Always deploy to the live server

Michael explicitly requires every finished change deployed and verified at
atlassystem.online. This supersedes earlier Desktop-only/data-only server
restrictions. Preserve data, permissions and backups. Mac-only release is
insufficient. AGENTS, shared memory, Claude/Cursor rules and DEPLOY agree.


## 7 October 2026 — Price lists belong to Sales; agreements belong to CRM

Michael requires Price lists as a dropdown within Sales, with compact searchable
lists and flexible setup. Commercial agreements, contracts and service promises
belong to CRM. This supersedes the 3 October ownership/navigation decisions for
Pricing and the earlier rule excluding Price lists from Sales navigation. Keep the
existing shared pricing engine, company entitlement/enablement, capabilities and
customer inheritance; relocation must not grant access or copy business records.
Same-currency list copies preserve prices/rules, and populated list currency changes
are blocked to prevent silently reinterpreting monetary values.

## 7 October 2026 — Atlas Admin separates staff and customer permissions

Michael requested a proper Atlas Admin portal, offboarding/export, and user,
password, profile and access administration. He explicitly requires all Atlas
admins and employees to see/do everything for now. Independent active Owner,
Administrator and Employee grants therefore give full platform and selected-company
capabilities. Customer roles cannot create staff access and their restrictions are
retained. Staff enter a company with an audited signed-session switch under their
own identity; business tenant scoping is preserved. An internal workspace makes
staff sign-in independent from customer lifecycle. Classifications are retained
for a future narrower policy; current classifications all receive full access.

Archive retains records and revokes sessions/codes. Restoring stays suspended until
access is reopened. Full company exports are consistent, credential-redacted
NDJSON/gzip handovers including linked records and stored documents. External URLs
stay references and oversized exports fail without partial files. Production
accounts cannot be relabelled as wipeable tests. See docs/ATLAS_ADMIN.md.


## 7 October 2026 — Shared Templates app and CRM deal contracts

Business document templates live in a separate Templates app, backed by Core.
Modules expose authorised source fields through the registry's template context
provider, preserving CRM owner, Project visibility and Service security scopes.
Generated contracts snapshot the template version and exact PDF; shared terms are
frozen. A customer PDF return awaits human review instead of counting as an online
signature. Private Atlas share pages follow Blocwrite's focused reading/submission
pattern without importing its storage or authentication. One signer and the existing
contract/email capabilities are retained; no profile permissions are widened.
See docs/plans/CONTRACTS_TEMPLATES.md.

## 7 October 2026 — Guardian separates detection from proven repairs

Quality diagnostics are platform-only and cannot be granted by customer roles.
A server sweep inventories connections and probes authorised pages/explicit safe
controls without business writes. Recurring coding work reproduces and verifies
repairs in an isolated release; unresolved failures become actionable AI briefs.
Probe evidence is buffered and discarded if the checkout/build changes mid-sweep;
a release interruption is a monitor/deployment condition, never proof that all
affected product pages are broken. Operator pagination preserves access to older
blocked reports. Copied/downloaded briefs include current triage notes.
Corrected probe diagnostics are FIXED with verification notes so real recurrences
reopen them; IGNORED is reserved for proven expected/non-defect cases. Deleted-
customer URL explanations use same-tenant id-only metadata after authorisation
and count as unavailable coverage, without exposing or restoring deleted identity.
HTTP success, control inventory and source heuristics are not blanket workflow
verification. Never hide a broken page or auto-close a report after an unrelated
passing check. See docs/GUARDIAN.md.

## 7 October 2026 — Cases, Tickets and Queries keep separate ownership

Customer cases stay in `ServiceCase`; new internal tickets and cross-team queries share Core `ServiceWorkItem` with an explicit kind and origin. Historical departmental tickets remain readable dependencies. This avoids duplicating customer identity and preserves historical records while sharing clocks, queues, approvals and evidence. Query completion records safe parent history without transferring the customer case or copying private receiving-team content.

Service credits remain canonical Finance draft documents with readable CR requests and CN references; Service cannot approve or post them. Recovery benefits require independent Core approval and explicit draft-order redemption through Sales pricing/tax calculations. Return receipt joins the Inventory provider transaction to prevent duplicate counters or stock on retries. Browser server deployment is required; a clean detached release may deploy only when pinned to the exact pushed main SHA, preserving concurrent unfinished edits.


## 7 October 2026 — Preserve immutable live acceptance evidence

Live service acceptance uses an isolated synthetic company and explicit test profiles. Cleanup suspends that company, revokes its memberships and deletes temporary credential state. Posted journals, financial timelines and audit records are retained under the existing database guards rather than weakening those guards for test deletion.


## 7 October 2026 — Serialize live server releases

A shared server deployment lock and existing-build wait prevent parallel agents from changing the checkout or installing dependencies during another release build. The pinned SHA is rechecked after the wait/pull. A ten-minute timeout leaves the checkout unchanged. Private service evidence is backed up alongside database metadata.
