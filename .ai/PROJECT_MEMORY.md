# Atlas project memory

Atlas is a modular ERP/business operating system. The repository is the shared
memory for Claude Code, Codex and Cursor; chat history is not required to continue.
This file is the canonical context entry point. Detailed topic truth stays in the
linked docs and implementation, rather than being copied into multiple handbooks.

## Standing deployment requirement — 7 October 2026

Michael explicitly requires Atlas and every finished app change to be deployed to
its live server at https://atlassystem.online (85.190.118.218). Server deployment
and live feature verification are required before completed handoff, not optional
follow-ups. This supersedes the earlier Desktop/Mac-only and data-only-server
deployment instructions, including the earlier 7 October restoration. A Mac-only
installation does not satisfy this requirement. Use docs/DEPLOY.md.

Preserve central records/backups, existing tenant and capability checks, secrets
and profile permissions. Build and verify the compatible release; report concrete
blockers honestly. Do not deploy unrelated unfinished edits or create local
business databases/caches. Preserve historical deployment evidence.

## Product principles

- Complexity underneath, simplicity on screen; connected workflows over isolated features.
- Shared identities and business logic; never duplicate customers or products per module.
- Premium, calm enterprise UI with clear hierarchy and useful reporting.
- Configurable dashboards; desktop, tablet and phone are supported targets.
- A catalogue entry, schema or navigation link is not a completed business workflow.

## Read next

- [Current state](CURRENT_STATE.md): handoff, evidence, gaps and next priorities.
- [Decisions](DECISIONS.md): lasting constraints and their reasons.
- [Architecture](ARCHITECTURE.md): ownership, security and technical documentation map.
- [Modules](MODULES.md): registered foundations, planned apps and delivery sources.
- [Design](DESIGN_SYSTEM.md): current direction and implementation references.
- [Dashboards](../docs/modules/ANALYTICS_STUDIO.md): personal canvas and authorised data views.
- [Messages](../docs/MESSAGES.md): private pop-out chat, record attachments and history.
- [Agent instructions](../AGENTS.md): commands, repository rules and update protocol.

## Keeping memory useful

Keep stable product context here, current handoff facts in CURRENT_STATE.md,
and decisions with rationale in DECISIONS.md. Detailed acceptance checklists belong
in docs/IMPLEMENTATION_PLAN.md and module delivery maps. Inspect code before relying
on a status claim; record check dates and failures honestly. Resolve contradictions
in the relevant source document rather than adding competing copies of the same fact.

Every task that changes project files must pass the mandatory memory update gate
in AGENTS.md before handoff, commit or PR, including minor fixes and documentation.
Update CURRENT_STATE.md each time; update decisions/topic docs when affected.
Read-only work records newly confirmed issues or corrected facts. Memory updates
are agent responsibilities, not a background service that observes arbitrary edits.

## One editable project and one shared save location

Claude Code, Codex and Cursor must edit this same Atlas repository and save shared
context in its .ai/ directory. On Michael's Mac the working project is
`/Users/michael/Desktop/RP SYSTEM`. Resolve the root from this repository's AGENTS.md
when opened elsewhere. Do not create separate Claude/Cursor/Codex copies of Atlas,
parallel handbooks or external source-file folders. Explicit Git worktrees are the
exception for parallel work; merge their code and memory back into this repository.
Generated build/ staging/package files are disposable outputs, never editable masters.
Atlas modules share the same central server data store via the secured data service;
never create per-module/local business databases or silently fall back to local storage.

## Plan and Production Planning — 3 October 2026

Plan at `/plan` is where the business sets targets, forecasts and scenarios across sales, operations, people and the other apps. A new plan is private to its owner until it is shared. Production Planning at `/planning` remains the product-demand workbench. Plan reads live actuals and does not keep a second copy of orders, stock or payroll. See [Plan](../docs/modules/PLAN.md).

## Explicit CSV export exception — 3 October 2026

The user requested CSV downloads. User-chosen CSV exports from Planning, Inventory,
Sales and the Logistics courier file may be saved locally. This supersedes earlier blanket statements that
all native business-data downloads are disabled; shared authoritative records,
attachments and backups still remain server-side. Do not introduce automatic
business-data caching or an offline/local business database. The 9 October Reports
request extends this exception to explicit user-chosen XLSX exports; see
`docs/modules/REPORTS.md`.

- Historical, superseded 7 October: Michael explicitly instructed “always deploy”. Finish Atlas changes by building, installing the Mac client and deploying the compatible private data API when changed, then verify the installed app and live service. UI/software stays on Mac; server holds secure data API and records. Preserve Blocwrite.

## My work — 3 October 2026

Each person’s profile at `/profile` is My work: time off, rota, assigned tasks and meetings, goals, performance plans, and the phone, address and emergency contact that save onto the HR employee record.

## Atlas Admin — 7 October 2026

Atlas Admin at /atlas replaces the owner console: company setup/profile/settings,
users, granular access, recovery, separate Atlas staff, audit, archive and full
company handover. Michael currently requires every active Atlas administrator and
employee to have full platform and selected-company permissions. On 9 October,
Michael authorised OWNER/ADMIN Atlas administrators to create business users;
EMPLOYEE cannot. Atlas staff creation remains Michael-only (`kickablur@icloud.com`).
Atlas Admin is a standalone administration-only layout with the modern UI; it
does not mount the business launcher/search/chat/notices/My work. Staff sign in
at `/19811171adminlogin` and sign out there; businesses use `/business/<slug>/login`, which
selects their own active membership server-side. Studio setup is under
`/atlas/studio`, while customer Studio is `/studio`. New Atlas staff
can sign in with the password Michael sets directly. Customer roles
cannot create staff access and their permissions remain separately controlled.
Staff open a customer workspace explicitly under their own audited identity.
Archives preserve records, revoke sessions/codes and restore to suspended. Exports
include stored documents and linked records while excluding credentials; no local
business database/cache is introduced. See docs/ATLAS_ADMIN.md and CURRENT_STATE.

## Atlas Guardian — 7 October 2026

Atlas Guardian at `/atlas/guardian` is the Atlas-staff-only quality inbox and AI
repair handoff area. Central detectors record private diagnostic metadata; a
recurring repair agent must reproduce, deploy and verify fixes before closing
reports. Unresolved items retain exact blockers and next actions. Inventory and
HTTP success are not complete workflow verification. See `docs/GUARDIAN.md`.

## Price lists and agreements — 7 October 2026

Price lists are a Sales workspace (`/sales/price-lists`), with no separate launcher app. Commercial agreements and service promises live in CRM (`/crm/agreements`), alongside contracts/approvals. The internal pricing entitlement, shared pricing engine and existing capabilities remain. See [Pricing](../docs/modules/PRICING.md).


## Business document templates — 7 October 2026

Templates is a separate app for reusable business documents. CRM Deals owns contract work; Core stores immutable shared PDFs, template snapshots and customer responses. Customers receive private Atlas share pages and may sign online or return a signed PDF for staff review. Source apps supply authorised template fields through the module registry. See [Contracts and Templates](../docs/plans/CONTRACTS_TEMPLATES.md).

## Customer Service, Tickets and Queries — 7 October 2026

Customer cases (`/service`, CS) stay with Customer Service and canonical Party.
Tickets (`/tickets`, TKT) are internal service work; Queries (QRY) request another
team's help while retaining the originating case/ticket and its owner. Shared Core
infrastructure owns clocks, queues, history, evidence and approval connections;
source modules own Finance credits, Sales replacements/recovery, Logistics returns,
Inventory quarantine and Quality NCRs. Finance independently approves/posts credits.
Evidence and authoritative records remain on the server. See
[connected service desk](../docs/modules/SERVICE_WORK_DESK.md) and
[live acceptance](../docs/modules/SERVICE_WORK_ACCEPTANCE.md); advanced and native
extensions remain explicit delivery gaps.

## S&OP and departmental planning priority — 7 October 2026

S&OP is a separate planning-cycle module (`/sop`) consuming explicit accessible
Plan inputs and canonical module-owned projections. Only approved immutable
consensus publishes total monthly demand to Manufacturing; MRP consumes firm
orders once. Source implementation and release/coverage limits are in
[Sales & Operations Planning](../docs/modules/SOP.md).
Michael explicitly prioritised finishing S&OP before the four detailed Sales,
Customer Service, Marketing and HR Plan workspaces. Their researched scope is
[departmental planning](../docs/plans/DEPARTMENT_PLANNING_RESEARCH.md); the shared
builder alone does not fulfil those four modules.

## Connected ERP and ease of use — 8 October 2026

Michael supplied the full [ERP/MRP master brief](../docs/requirements/ATLAS_MASTER_SYSTEM.md)
and requests continuous implementation and live deployment without phase sign-offs.
Ease of use is vital: expose context, exceptions and useful next actions; keep the
technical complexity behind owning-domain engines and contextual detail. The later
8 October app-launcher request places polished app icons first on Home after login,
with operational attention and goals below.
The 9 October reference adds a modern grouped-card Home and a separate light
utility rail; it does not repeat business apps. Tablet/phone use labelled utility
controls, while other apps retain their existing top menus.
[System map](../docs/atlas-system-map.md) and the other `atlas-*.md` guides index
existing owners, evidence, gaps and continuous work; they do not replace `.ai/`
shared memory or the detailed module delivery guides.

## Bulk Test cleanup — 8 October 2026

Atlas Admin `/atlas/cleanup` provides reviewed multi-company deletion while testing.
Only companies created as Test are eligible; ordinary accounts use archive/export.
Current/internal workspaces and shared staff/users are protected. Database deletion
is atomic across the selection; durable history and retryable Service-file cleanup
survive deletion. Posted Test records can be wiped only through this explicit path;
ordinary financial guards remain. See docs/ATLAS_ADMIN.md and CURRENT_STATE.md.

## Connections — 8 October 2026

Atlas staff use `/atlas/connections` for company-selected, reviewed CSV onboarding across 13 canonical master-data and Sales draft sections, including machines/work centres. Staff access, company app availability and creation controls apply. File-bound review and transactional audit prevent duplicate retries; the original CSV is transient. See [Connections](../docs/CONNECTIONS.md) for supported sections and acceptance limits.

## Reports workspace (9 October 2026)

Reports (`/reports`) is a built-in utility distinct from Dashboards (`/analytics`).
Read `docs/modules/REPORTS.md` for source-owned dataset registration, filtering,
permissions, Finance scope and workbook format. User-requested Excel downloads
extend the explicit CSV exception: user-chosen files are permitted; local business
databases, offline stores and automatic caches remain prohibited.
