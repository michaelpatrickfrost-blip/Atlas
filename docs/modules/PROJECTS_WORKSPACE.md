# Atlas Projects workspace

Michael requested the entire attached Projects brief as one scope on 3 October
2026: **“no phases just do it all.”** All 256 sections remain the target. The
numbered phases in the preserved source describe its original proposal; they are
not user-approved delivery gates or a reason to drop advanced requirements.

The implementation below is substantial but does **not** fulfil all 256 sections.
Source: [complete brief](PROJECTS_SOURCE_REQUIREMENTS.md). Requirement-by-requirement
acceptance: [coverage](PROJECTS_COVERAGE.md). Do not describe an available route,
model, command or screenshot as full acceptance of the requirement.

## Current implementation

- Extends existing `Project` and `ProjectTask` records; IDs and existing quotations,
  meetings and tasks survive. Customer/supplier Party links are optional. There is
  one task engine for personal and project work; subtasks are canonical tasks.
- Project ownership, invited roles, company/private/team visibility, project types,
  separate lifecycle/health, dates, tags, progress by task count/weight/effort/manual,
  update cadence and completed/cancelled archive. Shared WorkTeam identity is reused.
- Project overview plus Tasks, Plan, Docs, Notes, Decisions, Risks, Updates, People,
  Approvals, Requests, Budget, Activity, Automations, Templates, Files and Properties.
  Module navigation includes My Work, My Day, Inbox, workload and time reporting.
- Canonical List/Board/agenda Calendar/read-only Timeline; board grouping by status,
  owner, project or priority. Search/status/owner filters and personal saved views.
  Board is a projection; it does not own task status.
- Tasks support description/type/priority/owner/contributors, start/due/waiting dates,
  recurrence, estimates/weights, subtasks, checklists and four dependency types with
  lag/lead. Completion checks checklists/subtasks/prerequisites. Serialised dependency
  creation rejects cycles. Completion generates the next supported recurrence.
- Calendar-day schedule propagation, critical work/slack and conflict explanations;
  forecasts report missing dates and never silently reschedule. Milestone task links
  and completion, immutable baselines of dates/estimates/scope/milestones/budget.
- Private Notes and project Docs use text content, optimistic edits and immutable
  revisions; restoring creates another version. Selected text can become a task with
  document/version/character-range provenance and a permission-checked live link.
  This is not a block editor or simultaneous collaborative document editing.
- Comments, explicit selected-person mentions, resolve/reopen and source-gated Inbox.
  Personal day plans do not change project deadlines; Inbox snooze/dismiss does not
  change underlying work. Published updates retain health/summary/next/risks/decisions.
- Decisions record reason/alternatives, proposal/approval/rejection and supersession
  without rewriting their reason. RAID entries distinguish risks/issues/assumptions,
  probability/impact and mitigation. Approvals record approver/response/time/project
  version; project edits invalidate pending approval. Requests remain intake until
  accepted into a canonical task.
- Manual time entries and one server-stored timer per user. Workload distributes
  estimates over working days and includes inaccessible work only as private hours.
  Contracted capacity is read through the existing capability-limited roster provider;
  it is a baseline, not net capacity after leave/bank holidays/site closures.
- Planned budget categories/currencies only; no fabricated actual/commitment/forecast
  costs. Live links currently resolve Party/Product/Quote/SalesOrder/task/document,
  with target permissions independent of project access. Missing/restricted targets
  show “Restricted Atlas record.” Other ERP owners need real providers.
- Private project-structure templates shift dates and recreate tasks/checklists,
  subtasks and milestones. Internal rules run on task completed/blocked, optionally
  match task type, then notify project owner/create follow-up. Creator permissions
  are rechecked; unique execution keys, a 20-rule cap and no recursive dispatch
  prevent duplicate execution/loops. There is no unattended date/event scheduler.
- Project task properties support text/number/percentage/date/select/checkbox/URL.
  File uploads (PDF/PNG/JPEG/text, maximum 2 MB) persist bytes on the server and offer
  in-app preview. Each upload is a separate record; file version replacement is open.
- Manifest providers contribute permission-filtered search, attention, Customer
  Overview and Analytics status/health/overdue/effort metrics. All future project
  analytics belong in Analytics Studio, rather than a separate dashboard engine.
- Read API `/api/projects` and versioned start/complete command endpoints. Desktop
  packaging forwards exported server actions to the minimal data service; no local
  database/cache/offline business record store or remote UI deployment was added.

## Security and persistence

`src/core/permissions/work-access.ts` supplies shared tenant/record predicates for
pages, providers, Sales pickers/validation and the secured data gateway. Project
roles do not bypass capabilities or grant access to linked ERP objects. Generic
reads filter nested relations and nested counts; private documents remain owner-only
unless explicitly project-shared. Related audit records carry source references;
general audit access is filtered by source visibility. The migration backfills
legacy task creators and existing Project/ProjectTask audit references.

Commands authenticate, check capabilities/module access, validate tenant references
and use transactional audit/outbox writes for major mutations. Structured edits
use expected versions; published updates/revisions/baselines are append-only through
these commands. Outbox creation is evidence of pending events, **not** dispatch.
Some settings/simple preferences/checklist changes do not have optimistic tokens;
budget upserts and read-before-write approval checks still need stronger concurrent
integration testing. Do not claim comprehensive concurrency acceptance.

Offline notes in source section 217 are superseded by AGENTS.md's server-only
business-data boundary. Unsaved editor text is transient in memory; there is no
persistent browser draft/cache. No user/business data was migrated locally. The
synthetic check uses a temporary isolated cluster, synthetic rows only, and removes
it on exit. It is a verification fixture, not an Atlas storage option.

## Verification on 3 October 2026

- Prisma schema validation/client generation and an additive schema-diff migration.
- Earlier root production build, desktop runtime packaging and API-only data-service build passed; the latter lists
  `/`, `/_not-found`, desktop action/query/session and Sales draft only, no Atlas pages.
- Latest whole-repository typecheck is blocked by concurrent Marketing work: missing
  `marketing/manifest` and an unsupported `DomainOutbox.entityType` write. The latest
  root build attempt therefore did not run. Earlier typechecking and scoped ESLint
  passed after regenerating the concurrently changed
  schema/client. Vitest discovery now targets `tests/**/*.test.ts` to exclude copied
  dependency tests inside generated build snapshots.
- Atlas suite: 178 passed, 16 skipped. Five Projects database tests were separately
  enabled and passed against the disposable synthetic cluster. The new additive
  migration was applied successfully to its synthetic pre-change baseline.
- Synthetic browser acceptance: sign-in/Home/project overview, new personal task
  creation, task completion and overview progress 33% → 67%. Screenshot:
  `docs/screenshots/projects-overview-synthetic.png`. This does not verify every tab,
  multi-user collaboration, every source acceptance scenario or installed Mac use.

No central migration, real tenant write, deployment, installed desktop update or
app restart was performed. Compatible desktop/data packages, server backup/reviewed
migration and end-to-end remote-data acceptance are still required before activation.
Preserve any active unsaved Atlas forms. The full scope remains unfinished.

## Outstanding full-scope work

Configurable workflows/roles/statuses, department/external-guest access and secure
external forms; block editor, simultaneous editing/presence/cursors; rich threads,
replies/reactions/attachments and universal mentions; drag/reschedule/bulk/dense-table
editing, nested/shared views, multi-context task memberships; working calendars,
leave-aware finite capacity/manual allocation/skills/resource forecasts/cycles;
full nested goals/programmes/portfolio management; multi-stage approval evidence
and formal change/closure controls; versioned files, template variables and complete
structure cloning; unattended date/ERP rules, dispatcher/retry/reconciliation,
notification bundling/follow/mute policies and email/webhook integrations; full
Finance cost assignments/commitments/actuals/billing/capitalisation, Procurement,
Manufacturing, Logistics and Service live orchestration; complete Analytics data
views/drill-through/KPIs; smart return/history comparisons, deterministic briefing
and grounded Ask Atlas; all ten supplied scenario tests and desktop/server activation.
