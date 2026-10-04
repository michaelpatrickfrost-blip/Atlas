# Atlas project memory

Atlas is a modular ERP/business operating system. The repository is the shared
memory for Claude Code, Codex and Cursor; chat history is not required to continue.
This file is the canonical context entry point. Detailed topic truth stays in the
linked docs and implementation, rather than being copied into multiple handbooks.

## Every prompt — desktop software, server data

Deploy Atlas to the Desktop/Mac. The remote server stores shared data only and
must not run Atlas software. Finished work goes live in the installed Mac app.
Cursor loads `.cursor/rules/desktop-data-boundary.mdc` on every prompt; Claude
and Codex follow this file and AGENTS.md.

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

## Product principles

- Complexity underneath, simplicity on screen; connected workflows over isolated features.
- Shared identities and business logic; never duplicate customers or products per module.
- Premium, calm enterprise UI with clear hierarchy and useful reporting.
- Configurable dashboards; desktop, tablet and phone are supported targets.
- A catalogue entry, schema or navigation link is not a completed business workflow.

## Live completion requirement — 3 October 2026

Michael expects completed apps and app changes to be live in the installed Atlas
app. Every app worked on from now onwards, including current work and subsequent
fixes, must include deployment and live verification before completed handoff;
do not leave release as an optional follow-up. This is standing authorization for
compatible release and activation within
the Desktop/Mac software and central server-data boundary. Source/build/preview
delivery alone is incomplete. Verify installed use and authorised central-data
behaviour, preserve profile access and unsaved work, and report concrete activation
blockers honestly. Deployment includes enabling the completed module for Michael’s
organisation and checking its Apps/navigation entry for authorised profiles;
Production and Marketing must be turned on when complete. Preserve profile/data
permissions. Follow the live completion gate in AGENTS.md.

## Read next

- [Current state](CURRENT_STATE.md): handoff, evidence, gaps and next priorities.
- [Decisions](DECISIONS.md): lasting constraints and their reasons.
- [Architecture](ARCHITECTURE.md): ownership, security and technical documentation map.
- [Modules](MODULES.md): registered foundations, planned apps and delivery sources.
- [Design](DESIGN_SYSTEM.md): current direction and implementation references.
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
business-data caching or an offline/local business database.

- 2026-10-03: Michael explicitly instructed “always deploy”. Finish Atlas changes by building, installing the Mac client and deploying the compatible private data API when changed, then verify the installed app and live service. UI/software stays on Mac; server holds secure data API and records. Preserve Blocwrite.

## My work — 3 October 2026

Each person’s profile at `/profile` is My work: time off, rota, assigned tasks and meetings, goals, performance plans, and the phone, address and emergency contact that save onto the HR employee record.

## Owner company setup — 3 October 2026

Atlas owners set up a business from the console: company account, user setup codes, and CSV templates for customers and hierarchy, contacts, commercial settings, products, price lists, prices, warehouses, locations and employees. That portal stays owner-only. Company administrators keep the smaller customers, products and prices import. Registered company identity is separate from customer accounts. See docs/COMPANY_ADMINISTRATION.md.
