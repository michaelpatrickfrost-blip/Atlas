# Atlas decisions

These initial entries capture existing repository constraints, not new architectural
changes. Add dated entries with decision, reason, sources and consequences when a
lasting choice changes; explicitly supersede an old entry rather than hiding it.

## 3 October 2026 — Repository-owned shared memory

Use .ai/ as a compact context/handoff layer, with AGENTS.md, CLAUDE.md and a Cursor
rule pointing to it. Keep detailed architecture/specifications in docs/ and verify
status against code. This prevents tool-specific histories and duplicated handbooks
from becoming competing sources of truth. Memory changes travel with Git changes.

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
