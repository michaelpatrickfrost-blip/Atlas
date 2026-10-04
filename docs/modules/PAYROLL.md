# Payroll

Payroll is its own module (`src/modules/payroll/`, routes under `/payroll`), split out of HR
(`people`). It depends on `people` (employee records, absence, tax/bank fields on `Employee`)
and `scheduling` (confirmed rota hours). HR keeps employee records, holidays, conduct and
policies; Payroll owns the pay run and the statutory calculation.

## Scope — what this is, and what it is not

Payroll calculates UK PAYE, National Insurance, pension (auto-enrolment qualifying earnings)
and statutory pay (SSP/SMP) against HMRC's published rates for the organisation's current tax
year (`src/modules/payroll/domain/tax-tables.ts`). It produces payslips and P45/P60-style
documents for export.

**It is not an RTI/HMRC submission.** There is no Government Gateway integration, no FPS/EPS
filing, and no live reporting to HMRC. Figures are calculated for the organisation to use, the
same boundary Safety already draws for regulator submission (see DECISIONS.md, "Safety assists
decisions and does not store them on the Mac") — Atlas calculates and records; the business
still files.

NI category A is the only category the engine calculates correctly; any other category is
still computed (at the category A rate) with no silent substitution, so a payroll manager
always sees a figure, never a blank, but should treat a non-A category payslip as needing
manual review. SSP/SMP qualifying-day and average-weekly-earnings rules are simplified (see
`domain/statutory-pay.ts`) — a payroll manager confirms eligibility before finalising a run.

## How a pay run is built

`createPayrollRun` (`services/commands.ts`) reads, per active employee, for the chosen period:

- **Rota hours** — confirmed `RotaShift`s (scheduling's shared table), for overtime beyond
  prorated contracted/standard weekly hours.
- **Approved sickness/maternity-paternity absence** — becomes a `StatutoryPayRecord` (SSP/SMP)
  linked to the `AbsenceRecord`, included in that payslip's gross.
- **Approved unpaid absence** — a daily-rate deduction (unchanged from the HR-embedded feature
  this module replaces).
- **Approved holiday** — paid as normal salary (no deduction); HR's leave-balance accounting is
  unaffected by payroll.

Gross then runs through PAYE, NI, pension and student-loan calculators to net pay. Each
employee's `EmployeeTaxYearToDate` accumulates for correct period-over-period calculation and
for the eventual P45/P60.

## Sensitive data

`Employee.taxCode`, `niNumber`, `bankAccountName/sortCode/accountNumber` are gated by
`payroll.employee.manage`, not by `people.employee.manage` — a person who can edit someone's
job title cannot see their tax code or bank details. `payroll.payslip.self` lets a person read
their own payslips/P45/P60 on their profile without any run-level capability.

## Capabilities

`payroll.run.read`, `payroll.run.manage`, `payroll.employee.manage`, `payroll.settings.manage`,
`payroll.payslip.self`. These replace the retired `people.payroll.read`/`people.payroll.manage`
— existing roles are migrated by `prisma/migrations/20261004090000_payroll_module_foundation`.

## Activation

Enabling Payroll for an organisation needs `prisma/migrations/20261004090000_payroll_module_foundation`
applied on the shared database and `deploy/enable-payroll.mjs <slug> <admin-email>` run on the
central server (grants the new capabilities to that organisation's `admin` role and turns the
module on). Both are operator-run on the server, not from a desktop session.
