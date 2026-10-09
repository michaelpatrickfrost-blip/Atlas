# People planner and HR self-service

3 October 2026. The planner is a month view for someone running a team. Work
patterns cover office hours, production shifts and contact-centre waves, and a
company can add its own. A day can require man-hours directly, or traffic
(calls, orders, units) times minutes each, with shrinkage. Sales-order delivery
counts and the manufacturing forecast are shown as context when the planner is
allowed to read them; they do not overwrite the team’s own demand.

Approved sickness or holiday on a planned shift opens a cover list. Replan moves
that shift to a teammate who is in, free that day, and has contracted time left.
A busy period can cap how many people are off, or close holiday requests, for a
team or department. Sickness is not refused. Publishing a shift puts it on that
person’s profile, My HR and employee record.

The weekly hours budget remains. Older week-board behaviour is superseded by this
month plan.

## Ownership and connection

`/scheduling` is its own app (`scheduling`), dependent on HR (`people`). It replaces
the catalogue's Scheduling & Hours stub. Manufacturing `/planning` remains separate.
The existing Employee identity is reused: no staff copies, local store or separate
staff login. HR owns employment, leave, confidential notes and actual timesheets.
Scheduling owns the month people plan, shift assignments, unpaid breaks,
publishing and staff-visible shift tasks. Existing `hr_rota_shifts` remain the one
rota table; `/people/rotas` and older actions remain compatible during transition.

HR provides `ModuleManifest.staffRosterProvider`, a narrow authenticated employee
roster contract accessed through Core's module registry. Scheduling does not import
HR services or confidential records. Staff see their own published shifts. Team
managers need `people.team.manage` plus `scheduling.manage`; their roster contains
only staff allowed by their reporting and department-management scope. HR employee/rota managers can plan company-wide staff.
The app can show the first 100 matching staff; search/department filters narrow it.
Budget totals cover the whole authorised department/team, including staff beyond
that display limit. Shifts count towards the week in which they start.

## Implemented workflows

- Weekly employee-by-day board with sticky staff/day headers, prior/next week,
  search and department filters. Click an empty cell to add shifts or a card to edit.
  The dialog has staff checkboxes, day chips, shift presets and optional tasks/details.
  Publish filtered weekly drafts together; edits preserve existing task history.
- Scheduling has its own Timesheets, Time off and My team routes, including
  confidential team-member notes. Shared HR components/actions keep one source
  of truth without navigating out to HR for these everyday workflows.
- Manager-owned weekly hours budgets for the whole managed team or selected
  department; planned hours, remaining/overage, contracted hours and approved
  timesheet actuals. Search does not shrink budget totals. Over-budget plans are
  warnings, not publishing blocks. Budgets are private to the manager and saved
  centrally; no wage rates or payroll costing are exposed.
- Contracted versus planned paid hours, subtracting unpaid breaks; overtime target
  warning. This is a planning aid, not a wage, rest-time or statutory compliance engine.
- Bulk staff/day selection: up to 100 shifts per atomic serializable batch, including
  overnight work. Approved absence, overlapping live shifts and leavers block saves.
- Explicit Europe/London wall times, DST gap rejection and first-occurrence handling
  for the repeated autumn hour. No multi-timezone/sites configuration yet.
- Draft and published shifts; staff only see published shifts. Individual publish
  rechecks approved absence; cancel preserves the shift record. Public instructions
  and up to 20 tasks per shift; assigned staff can mark their tasks complete.
- `/profile` (My work): the person’s holidays, rota, assigned tasks, goals, performance plans and the phone, address and emergency contact that save onto the HR employee record. `/people/me` remains the HR self-service view of the same holiday and contact actions.
- `/people/me`: self-service holiday request/history/cancellation, contacts and links
  to personal shifts and hours. Working-day entitlement is reserved by pending and
  approved requests. Overlaps/over-entitlement are rejected in serializable request
  transactions. Cross-year requests must be split. Full-day requests only; holiday
  years are calendar years; public holidays/carry-over are not modelled.
- `/people/my-team`: direct-report leave/expense decisions, review due dates, submitted
  hours and private-note links. Approved shifts overlapping requested leave are flagged;
  approving leave does not silently cancel shifts. The manager must resolve coverage.
- `/people/timesheets`: weekly daily hours in quarter-hour increments with work
  descriptions, own or managed-staff entry, save draft/submit, inspection/approval/
  return with correction reason. Submitted/approved sheets lock; returned sheets can
  be edited and resubmitted. Approved actual hours feed Payroll preparation;
  creating and finalising a reviewed payroll run remains explicit.
- `/people/my-team/[employeeId]`: append-only MANAGER_HR and HR_ONLY notes. Only the
  current direct manager with team capability and HR management can read manager
  notes; HR-only notes require HR employee management. Staff (including authors on
  their own record) cannot view these notes. HR can set contracted working weekdays.

## Data security and release

Dedicated authenticated read/actions resolve organisation/user from session and
validate employee/reporting scope. Private EmployeeNote, Timesheet, TimesheetEntry
and ShiftTask models are deliberately absent from the generic desktop read allowlist.
Private note bodies are not copied to audit/activity; audit stores action/entity only.
Legacy Employee.notes and AbsenceRecord.notes require HR management on generic reads;
salary scalars require payroll access. Profile now calls the same safe self-service
read so staff do not need company-wide employeeRead to view their own HR summary.
No new business data is persisted on the Mac.

Additive migrations: `20261003320000_hr_self_service_workforce` and
`20261003410000_scheduling_hours_budgets` (manager/week/department budgets). It adds notes,
timesheets/entries/tasks, workingDays, bookedDays, breakMinutes and CANCELLED leave.
It was applied to the live data server after a protected backup and restore check.
Existing records are preserved;
new leave quantities are saved, older quantities use the configured working pattern.
Changing working days does not change a stored bookedDays value.

Scheduling is enabled for the existing demo organisation with HR enabled. Existing
admin/HR roles received the Scheduling and team capabilities; the unassigned Team
Manager role is available for deliberate account assignment. No reseeding occurred.
Managers and logins must be linked to employees; access remains server-enforced.

Central synthetic-tenant acceptance passed for team/tenant scope, private-note
visibility, staff-safe reads, leave reservation/approval/cancellation, rota conflict
checks, shift editing, week publication, task completion, timesheet approval/locks,
protected generic reads and unauthenticated rejection. Fixtures were removed.
The remote data service returns 404 for UI routes. Timesheet hours are not project
costing/payroll postings; leave conflicts with existing shifts require manager action.
Open shifts, shift swaps, drag and drop, skill rules, clocking, multi-site
timezones, public holidays, half-days and notification delivery remain open.
Demand, cover after absence, and busy-period holiday limits are in the month
planner. This supersedes the old decision that HR scheduling must remain only
inside one People app.

## 9 October 2026 — Intraday and open shifts

/scheduling/workforce adds department/skill/role intervals, workload estimates,
occupancy/shrinkage, conservative eligible cover, timed breaks and work/training/
meeting/offline activities. Unfiltered intervals share the department pool; role/
activity filters separate queues. No ACD/service-level/live adherence is implied.

Staff mark unavailable time and request shifts. Managers fill/review within their
HR roster scope. Atomic assignment rechecks employment, department, skills,
absence, availability and overlap, creates one published shift, closes competing
requests and retains history. Legacy placement/edit/publication respects unavailable
time. Activities reject boundary/overlap conflicts; untimed breaks cannot promise
cover. Month patterns fill drafts for explicit later publication. Named central
reads preserve desktop boundaries; no private HR/payroll facts in workforce payloads.
See [People overhaul](../plans/PEOPLE_PLATFORM_OVERHAUL.md).
