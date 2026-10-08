# HR platform workspace

Updated 8 October 2026. Extends the existing `people` module and canonical Employee;
Payroll and Staff Scheduling retain their own modules, data and permission groups.

## Everyday work

- `/people` and `/people/workspace`: HR home with current workforce, onboarding,
  offboarding, leave/expense decisions, overdue learning, upcoming renewals, reviews,
  owned lifecycle tasks and links into the complete HR workspace. Staff without
  employee-record reading open My HR. Filtered legacy `/people?...` URLs retain the
  employee directory meaning through `/people/directory`.
- `/people/directory`: existing employee creation/search, linked logins, managers,
  contacts and skills. Creation still triggers existing checklists and first reviews.
- `/people/recruitment`: owned vacancies, role requirements, department/location,
  employment type, target start and open/hold/closed state. Applicants hold contact,
  source, evidence reference, decision notes and an interview date. Applied →
  screening/interview/offer → hired/rejected/withdrawn. Closed applications are retained
  and locked. Interview requires a date; rejection/withdrawal requires a reason.
- Accepted offers link to an existing same-company ONBOARDING Employee with matching
  email, created through the normal employee form. This explicitly starts existing
  HR checklists without copying identities, creating logins or granting access.
  One employee cannot be handed over twice; recording Hired additionally requires
  onboarding management. Vacancies can cover several hires and are closed explicitly.
- `/people/training`: assign required/optional training or qualifications with provider,
  due date, actual completion, expiry, evidence reference and notes. Completion requires
  a real non-future date; expiry cannot precede it. Overdue and renewal filters link
  directly from HR home. Updating a record can correct HR evidence; no external
  awarding-body verification, examination or automatic certification is implied.
- `/people/my-learning`: a linked employee sees their own learning and renewal dates,
  without employee-directory access or another employee's records. HR records completion.
- `/people/documents`: existing EmployeeDocument metadata with issue/expiry, current/
  archived states, category, notes and approved-storage links. Existing rows stay current
  without invented dates. Archive retains the record. These are document references,
  not new uploads, signatures or automated right-to-work decisions.
- Employee pages link the employee-filtered learning/document registers. Existing
  holidays, leave, performance/conduct, policy PDFs, expenses, hours and My Team remain.
- `/people/reports`: current workforce by department, saved lifecycle states and open
  HR work. Current workforce means ACTIVE, ON_LEAVE or OFFBOARDING, already started;
  onboarding and historical leavers excluded. Counts measure records, not compliance.

## Security and persistence

Every new page checks its capability and active HR entitlement before business reads;
known restricted/disabled views explain recovery. Actions require session then employee
management, plus active HR. Recruitment requires employee management even for reads;
employee reading alone cannot expose applicants. No existing profile grants change.
Training/documents use employee reading; self learning resolves the linked login.

New vacancies/applications/training use tenant-qualified foreign keys. Server reference
checks reject foreign employees, vacancies and inactive vacancy owners. Serializable
transactions and submitted integer versions protect updates; stale/failed writes cannot
create success audits. Handover and all new writes retain central audit. Validation
errors retain entered browser fields; unexpected errors expose a protected message.
New creation forms clear only after a successful save. HTTP(S) evidence links reject
executable schemes and embedded credentials; Atlas does not fetch them.

Generic data reads apply the same applicant restrictions and own-training scopes,
including module entitlement. New scalar personal data is not included in Home counts
or workforce reports. Pay/medical/conduct permissions remain separate. Central records
and private pre-deploy backups remain authoritative; no local business DB/cache added.

Additive migration: `20261008160000_hr_platform`. Existing document records, employees,
roles, payroll facts and onboarding history are preserved. Release/live evidence lives
in `.ai/CURRENT_STATE.md` and `docs/evidence/2026-10-08-hr-platform.md`.

## Remaining boundaries

Recruitment is an internal applicant register, not a public careers site, job-board
publisher, CV parser or email/interview invitation sender. Hire is an explicit reviewed
handover, not automatic employee/account provisioning. No separate ATS permission roles
were granted: current company employee managers own confidential recruitment.
Learning is a record register, not course content/LMS or enforced scheduling competence.
No bulk enrolment, recurring-course engine, document file upload, signed contracts,
benefit administration, succession planning or unattended renewal notifications is
claimed. Reports are current operational counts, not historical FTE/turnover or pay-gap
analytics. Personal notes/conduct, health and payroll retain their existing owners.
