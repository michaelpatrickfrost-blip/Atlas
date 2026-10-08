# HR workflows

Updated 8 October 2026. Source: `src/modules/people/` and `src/app/(app)/people/`.

The connected HR home, recruitment, training and document-renewal expansion is
documented in [HR platform](HR_PLATFORM.md); the existing workflows below remain.

## Delivered in the workflow overhaul

- `/people/workspace`: capability-filtered headcount, joiner/leaver counts, leave
  and expense approval counts, a 50-task work queue and reviews due within 14 days
  (including overdue). Existing employee directory supports name/email/role/number,
  status and department filters.
- Employee creation collects optional preferred name, contacts, emergency contact,
  address, skills and contracted hours. Contact editing includes leave entitlement.
  Zero entitlement is valid; financial/hour/cadence values are bounded server-side.
  Salary writes require payroll management; omitted salary fields preserve salary.
- Employee creation transactionally creates onboarding tasks and initial reviews.
  Checklist deadlines use the employee start date: preparation one day before,
  induction on start, training at seven days, probation scheduling at thirty days.
  Owners default to the linked manager, or the creating user. These defaults are
  task planning aids, not certified compliance policy.
- Task owners, deadlines and notes can be edited on the employee record. Existing
  undated tasks are retained and can be assigned manually; no bulk backfill occurs.
- Offboarding generates one default checklist, owned by the initiating user and
  due on initiation day. Leaving requires completed tasks, a non-future leaving
  date on/after joining and a reason. Activation from onboarding requires a complete
  checklist. LEFT is terminal in this workflow; rehire is not implemented.
- Appraisal/one-to-one completion and creation of the next cycle share a transaction.
  Only scheduled reviews can be completed, preventing duplicate next-cycle creation
  on repeat submissions. Manager changes reassign scheduled reviews when the new
  manager has a linked login. Reporting cycles are rejected.
- Leave approvals/rejections only change pending requests; rejection needs a reason.
- Rota creation rejects leavers, overlapping live shifts and approved absence.
- Employee record related reads and attention queries respect capability checks;
  cancelled shifts are hidden. Leave/Bradford summaries use all available absence
  rows instead of a truncated recent list. Document links allow HTTP/HTTPS only.

## Runtime and acceptance limits

Triggers above run during authenticated server actions. Due items are calculated
when pages/providers load. No unattended scheduler, email sender, configurable
condition/action engine or external payroll integration is claimed. Data stays in
shared server storage through the existing secured data service; no local business
store/cache was added. New contact/task actions are in the generated data allowlist.

The additive workforce migration and secured data workflows are live. Synthetic
server-tenant round trips passed for holidays, private notes, rota editing/publishing
and timesheet approval/locking. The revised desktop planner, in-app staff workflows and manager hours budgets
are installed and live; release evidence is tracked in CURRENT_STATE. Build/typecheck and scoped test evidence is recorded there.
Existing migration drift
is outside this change. Rota preflight checks are not database exclusion constraints:
concurrent scheduling can still race. Status/checklist/profile checks are not a
fully transactional policy engine. Internal recruitment, document expiry and training/qualifications now have their
own HR registers; public recruitment, file uploads, configurable probation policy
and unattended notifications remain open. Payroll is a separate module with its
own statutory calculation and filing boundaries.
Performance plans and disciplinary cases are recorded in HR. They are structured
forms with team or company scope. They are not a tribunal file, a statutory
dismissal workflow, or an automated legal process.

## Policies, performance plans and disciplinary cases — 3 October 2026

`/people/policies` stores company policy PDFs on the server. A policy has a title,
category, audience and dates; the document itself is the PDF. Everyone, managers,
or HR can be the audience. Archived policies stay with HR.

`/people/conduct` holds performance plans and disciplinary cases. A plan has a
reason, support, dated objectives, reviews and the employee's comment. A case
moves from an informal conversation through investigation, hearing, warning,
outcome and appeal. Private case notes are hidden from the employee unless shared.
Confidential HR notes need employee management. A person cannot open a case about
themselves. Managers with conduct access see their team. Employee-record readers
with conduct access see the company.

Company administration splits HR into holidays, policies, records, reviews,
absence, rotas, pay, and conduct. Read on policies does not open payroll. The
Staff role grants own holidays and published policies. Existing roles gain own
holidays and policy reading when migration `20261003720000_hr_conduct_policies`
is applied. Conduct management is added to Administrator, HR Manager and Team
Manager only.

## Staff and manager workflows — 3 October 2026

HR now has dedicated My HR, My Team, confidential employee notes and actual
timesheets. Staff Scheduling is a separate dependent app over the existing
employees/rota table. Working-day holiday requests start on the person's profile and wait in HR →
Holidays. The counted days can be changed before approval, and HR can edit the
year's allowance there. Pending requests reserve entitlement;
submitted/approved hours lock; notes are protected by scoped server actions.
See [Staff Scheduling](STAFF_SCHEDULING.md) for ownership, access, migration,
release prerequisites and remaining scope. The older limitation above about
rota preflight races applies to legacy HR rota actions; the new Scheduling batch
uses serializable transactions. Scheduling is enabled for the existing organisation. Its own timesheet, time-off
and team routes reuse these HR records and actions; staff need not leave Scheduling.
