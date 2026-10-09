# UK payroll

Updated 9 October 2026. Payroll remains an independent module dependent on HR and
Scheduling. HR gets a limited readiness summary through the Payroll manifest
provider. No duplicate employee ledger/local cache. See
[research and delivery scope](../plans/PEOPLE_PLATFORM_OVERHAUL.md).

## Workspaces

- `/payroll/employees`: hourly/salaried pay, frequency, tax/NI/loans, pension
  opt-out, bank details, contracted hours and reviewed opening pay history.
- `/payroll/prepare`: weekly/monthly period, approved actual time, employee issues,
  estimated pay and verified statutory/holiday/additional inputs.
- `/payroll`: draft/finalised/paid register; `/payroll/[runId]` reviews payslips,
  net deductions and source refresh before finalisation.
- `/people/pay`: HR links these steps; readiness needs Payroll reading and enablement.

## Calculation and human review

2026–27 UK salaried/hourly weekly/monthly GBP contracts, supported tax codes,
recorded NI categories and qualifying-earnings pension. Rates checked against
[HMRC](https://www.gov.uk/guidance/rates-and-thresholds-for-employers-2026-to-2027).
The former table labelled 2026–27 contained older employer NI/statutory/loan
values. New calculations use current values; finalised records retain their figures.

Hours are APPROVED daily TimesheetEntry minutes in the inclusive pay period.
Entered unapproved time blocks preparation; missing salaried time needs explicit
review and adds no overtime. Hourly pay requires approved actual time. Base hourly
pay includes all approved hours; only the extra overtime premium is added above
the prorated contracted threshold. Rota hours never substitute for actual time.
Salaried starters/leavers prorate on employed working days. Approved unpaid absence
deducts working days using the recorded pattern's daily rate.

Supported ordinary tax codes use reviewed opening pay/tax and finalised prior Atlas
pay; explicit W1/M1/X uses non-cumulative PAYE. Opening balances, including zero,
need a recorded review and lock after first finalisation. NI applies the recorded
supported category and published periodic thresholds. Loan plans 1/2/4/5 and
concurrent postgraduate repayment use whole-pound deductions.

Absence type does not establish statutory entitlement. Payroll staff verify
eligibility, actual earnings, qualifying days, payment kind and salary replacement
with authoritative records/calculators. Hourly holiday similarly needs verified
reference-period pay. Reviewed amounts and evidence reference are stored per
employee/period; additional gross pay can include verified holiday/other pay.
Explicit salary reduction avoids adding replacement pay on top of full salary.

RTI/FPS/EPS, bank transfers, Scottish/special tax codes, director NI, week 53,
automatic pension-enrolment eligibility and statutory entitlement decisions remain
external. This is a controlled calculation/review workflow, not certified filing.

## Drafts and finalisation

Create/refresh binds reviewed inputs to current employee pay, time, absence,
adjustments, settings and finalised prior pay. Rejects blocking issues, stale review
and overlapping employee periods. Refresh changes only a draft, preserving manual
net deductions and rejecting negative pay. Drafts do not advance YTD.

Finalisation rechecks current inputs/payslips, rejects out-of-sequence earlier pay
after a later finalisation, and atomically changes DRAFT→FINALISED and recomputes
YTD from opening plus finalised records. Changed inputs or a legacy draft need a
reviewed refresh. FINALISED→PAID is guarded/audited and records status only.
Mutations use tenant scope, serializable transactions and atomic audit entries.

Employee pay setup binds existing updatedAt; pay runs/tasks use versions.
P45/P60-style records check same-company employee and use stored year totals;
they remain exports. Historical payroll records are retained.

## Permissions and deployment

Existing payroll.run.read/manage, payroll.employee.manage, payroll.settings.manage
and payroll.payslip.self apply. Directory/HR editing does not grant tax/bank/payroll
access. Preparation returns necessary pay inputs; bank/NI-number setup requires
separate employee-pay management. Own payslips remain on the profile.

Migration 20261010010000_people_workspaces is additive. Named authenticated central
reads support desktop; new models stay closed in the generic gateway. Existing
grants/module states are preserved. Evidence is in .ai/CURRENT_STATE.md.
