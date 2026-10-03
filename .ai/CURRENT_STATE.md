# Atlas current state

Updated: 3 October 2026. Initial shared-memory baseline from repository inspection.

## Implementation observed

- Next.js 16.3.8 / React 19 / TypeScript, Prisma 7 with PostgreSQL driver adapter
  (package.json and src/core/db/client.ts).
- Registry contains CRM, Sales, Projects, Stock, KPIs, Products and Pricing
  manifests, plus future-module stubs (src/core/modules/registry.ts).
- Separate CRM and Sales services/routes exist. Commercial documents have pricing,
  checks, revisions, saved views and working-draft service files. File presence does
  not prove complete acceptance of these workflows.
- The tree already contains substantial uncommitted application, schema, migration,
  deployment and documentation work. Preserve it; inspect the current diff before edits.

## Evidence and limits

Existing delivery documents report previous tests/builds and private test hosting.
Those claims were not independently reverified while initializing memory. Do not
reuse an older test count as the current result. See the Sales delivery map for
specific delivered checkpoints and explicit limits, including no outbox dispatcher.
No deployment, database migration or end-to-end acceptance was performed for this
memory setup.

Shared-memory setup verification on 3 October 2026:
- All local Markdown links in .ai/ resolve; git diff --check passed.
- npm run build compiled successfully but failed TypeScript checking at
  src/modules/sales/services/order-checks.ts:13:15: Cannot find name 'showCredit'.
  This existing application file was not changed by the memory setup. The production
  build gate remains blocked until that error is resolved and the build is rerun.
- No application tests or visual acceptance were run for these documentation changes.

## Latest change — 3 October 2026: HR (People) module built

Added a full HR module at module id `people` (route `/people`), following
MODULE_SPEC.md exactly (manifest, capabilities, queries/commands co-located with
routes, attention provider). Covers: employee directory/record, onboarding and
offboarding checklists (auto-created from templates in
`src/modules/people/domain/task-templates.ts`), appraisals, one-to-ones,
absence/sickness with a live Bradford Factor calculation
(`src/modules/people/domain/bradford-factor.ts`, S² × D over a rolling 12 months,
never stored), rotas (shift scheduling), and a payroll run → payslip workflow
(gross from `Employee.annualSalaryMinorUnits`, editable deductions, finalise/pay
states). An employee record can optionally link to an existing `User`/`Membership`
login (`Employee.userId`); when linked, `/profile` shows that person's own HR
summary — one identity, not a duplicate "staff" login concept.

Paths: schema in `prisma/schema.prisma` (`Employee`, `EmployeeTask`, `Appraisal`,
`OneToOne`, `AbsenceRecord`, `RotaShift`, `PayrollRun`, `Payslip`, all `hr_`-prefixed
tables); capabilities `HR_CAPABILITIES` in `src/core/permissions/capabilities.ts`
plus a new `hr_manager` standard role; manifest/domain/attention in
`src/modules/people/`; routes and actions under `src/app/(app)/people/**`; the
desktop read-API allowlist updated in `src/server/data-api/read-policy.ts` (new
models were missing from `capabilities` there — TypeScript caught it).

Checks actually run: `npx tsc --noEmit` clean (module code only — pre-existing
`.next/dev/types` LayoutRoutes noise is unrelated staleness), `npx eslint` clean
on all touched paths, `npm run build` succeeds and lists every new `/people/*`
route, `npm test` 84 passed/7 skipped (one test updated for the new module id in
the implemented-modules list). A direct create/read/delete round-trip against the
real local Postgres (`Employee` → `EmployeeTask`/`AbsenceRecord` → Bradford calc)
was run manually and passed.

Not run / known blocker: `npm run db:seed` fails on this machine's local dev
Postgres **before reaching the new HR seed section**, on pre-existing drift
unrelated to this change — `sales_quotes.pricingPartyId` is missing even though
`prisma/schema.prisma` and a migration for it exist on disk
(`20261003290000_customer_trading_sales_handoff`); `prisma migrate status` shows
that migration still pending, and replaying it against the shadow DB fails with
`relation "domain_outbox" does not exist`, implying an ordering problem earlier in
the existing migration history. This predates the HR work (CURRENT_STATE already
flagged a related sales build blocker) — do not attribute it to the HR module.
Demo HR seed rows (`EMP-00000001..3` etc., added to `prisma/seed.ts`) are untested
end-to-end via the seed script for this reason; they were sanity-checked by a
disposable manual script instead. The local demo org was left deleted (cleanly)
after this investigation rather than half-seeded — re-run `npm run db:seed` once
the sales migration drift is fixed.

Next step: resolve the pre-existing sales migration ordering issue, then run
`npm run db:seed` fresh to get the demo employees/absence/rota/payroll fixtures in
place. Possible HR follow-ups raised in conversation but not built this pass:
rota shift templates/patterns, overtime pay on payslips, an expenses workflow, and
a wellness section — flagged as scoped future work, not started, to avoid
shipping half-finished pieces.

## Next handoff

The Sales delivery map queues CRM after the Sales verification/deployment gate;
the broader plan also retains visual acceptance and the connected commercial journey.
Confirm that gate's current evidence before choosing the next implementation task.
Read [Sales delivery](../docs/modules/SALES_ORDER_PROCESSING.md),
[delivery checklist](../docs/IMPLEMENTATION_PLAN.md) and
[module roadmap](../docs/MODULE_ROADMAP.md).

Known documentation drift: older architecture/design sections describe Sales-only
module ownership and a permanent sidebar. Use the separate CRM/Sales ownership and
launcher/top-menu direction in the current roadmap/delivery plan; inspect the shell
before changing it. Reconcile remaining old topic examples when working in that area.

## Handoff update format

Replace stale facts rather than endlessly appending logs. For every task that changes project files,
record date, changed behaviour/source paths, checks actually run and their results,
remaining issues and the next concrete step. Keep historical rationale in DECISIONS.md.

## Latest shared-memory change — 3 October 2026

Strengthened AGENTS.md, CLAUDE.md and .cursor/rules/atlas-memory.mdc to require a
memory update for every changed task before handoff/commit/PR. PROJECT_MEMORY.md
and DECISIONS.md document the gate and its scope. Updates must include changed
paths, actual verification, blockers and next step, and reconcile affected docs.
This is instruction-based; external/manual edits are not automatically summarized.
Verification: git diff --check passed for this documentation-only change. No new
application build or tests were run; the previous build failure above remains the
last recorded result, not a fresh assertion about the current application tree.
Next step: follow this gate on the next project change and recheck the build blocker
before treating the application baseline as verified.
