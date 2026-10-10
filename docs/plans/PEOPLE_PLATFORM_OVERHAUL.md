# People applications — 9 October 2026

Michael requested four substantial, independent applications with an integrated
employee and operational data model: Goals & KPIs, HR, People planner and Team
planner. Payroll scope is UK first, confirmed during this task.

## Research and design choices

Reviewed primary product/help documentation on 9 October 2026. There is no single
best platform for every company; the useful comparison is the workflow each
specialist product supports. Vendor promotional rankings and percentage claims
are not acceptance evidence for Atlas.

| Reference | Useful pattern | Atlas implementation |
| --- | --- | --- |
| [Personio Core HR](https://www.personio.com/product/core-hr-software/) | Shared employee identity, lifecycle workflows, time/absence and connected payroll | Evolve existing recruitment, onboarding/offboarding, reviews, learning, documents and employee records; add organisation/skills and a Pay & time workspace. |
| [HiBob UK Payroll](https://www.hibob.com/platform/payroll/uk/) | Employee changes and payroll preparation together | Employee pay setup, approved actual time, explicit opening-pay review and draft input snapshots. Atlas has no RTI filing or banking connector. |
| [Planday scheduling](https://www.planday.com/how-it-works/scheduling) and [open-shift approvals](https://help.planday.com/en/articles/30399-open-shifts-shift-requests-and-shift-swaps-for-schedule-managers) | Reusable patterns, availability, department/skill eligibility and manager-approved open shifts | Existing month patterns retained; open shifts/request decisions, availability, conflict checks and central publication added. |
| [NiCE intraday workforce management](https://www.nice.com/resources/get-the-most-out-of-cxone-wfm-intraday-management-software) | Interval coverage, breaks and changes in staffing demand | Department/skill/role intervals with volume, handling time, occupancy, shrinkage and minimum staffing; timed work/training/meeting/offline activities and breaks. |
| [Float capacity planning](https://www.float.com/product/capacity-planning) | Workload against working patterns, time off and availability | Weekly team capacity, estimated effort/date allocations, overload visibility, reassignment and a delivery board linked to company goals. |

The common UX is a clear workspace header, meaningful operational totals, explicit
views, and progressive forms. Each application keeps its own main workflow;
integration uses canonical records and module provider contracts. No new local
business database, copied employee directory, task ledger or payroll cache.

## Delivered scope and boundaries

**Goals:** existing dated live source measurements remain authoritative. New
company-only strategy scorecards weight target attainment, cap each result at
100%, and stay unscored if any selected goal/source is inaccessible or lacks a
reading. `kpis.attainment` is a dashboard measure, not a source for another goal
(prevents recursive scoring). Personal development/PIP audiences remain separate.

**HR:** the platform home brings existing lifecycle decisions together; organisation
and skills use canonical employee/manager records. Pay & time obtains readiness
through the Payroll manifest provider, without importing Payroll services into HR.
Payroll permissions remain separate from employee-directory access.

**People planner:** month patterns publish through existing central rotas. A
dedicated intraday/open-shift workspace adds department and skill requirements,
staff availability, timed breaks and activity segments. Open-shift approval checks
current employment, department, every recorded required skill, absence,
availability and overlap, then creates one published canonical shift atomically.
Activity changes are audited and overlapping/out-of-shift activities rejected.
Coverage is conservative: a person must cover the entire interval; untimed breaks
and offline/training/meeting activity cannot promise capacity. Role/activity filters
separate queues; unfiltered overlapping requirements share the department pool.

**Team planner:** the new work/capacity view uses existing PlannerTeam/PlannerTask,
employee hours, approved absence, published rotas, non-work activities and
availability. Timed breaks/activities are unioned to avoid double deductions. Estimated
effort spreads over recorded working days; a deadline on a non-working day remains
visible demand. Inaccessible teams' tasks are excluded from workload; displayed
totals therefore describe visible work, not unrestricted company utilisation.
Updates/reassignment bind task versions and validate team membership and goal
audience. Calendar, places, moments, cover and handovers remain accessible.

**UK payroll:** preparation uses approved daily timesheet entries for actual hours,
never planned rota hours. Weekly/monthly salaried and hourly contracts, loan plans
1/2/4/5 and a concurrent postgraduate loan are supported. NI uses the recorded
supported category and HMRC periodic thresholds; unsupported tax codes fail closed.
Cumulative PAYE uses reviewed opening pay/tax and previously finalised Atlas pay.
Salary starter/leaver proration uses recorded working days; unpaid absence is
working-day based. Statutory pay and hourly holiday pay require verified eligibility,
earnings/reference-period and replacement amounts from a human payroll reviewer.
The application does not infer statutory entitlement from an absence type.

Draft creation/refresh binds a digest of the reviewed inputs, preserves manual net
deductions on refresh and leaves YTD unchanged. Finalisation rechecks inputs and
updates YTD in the same serializable transaction; payment is a guarded
FINALISED→PAID transition. Existing finalised/paid records are not recalculated.
Employee setup is versioned by its existing updatedAt; opening balances lock after
first finalisation. No existing user/company rights are broadened.

Rates verified against [HMRC 2026–27 rates and thresholds](https://www.gov.uk/guidance/rates-and-thresholds-for-employers-2026-to-2027),
[NI tables](https://www.gov.uk/government/publications/rates-and-allowances-national-insurance-contributions/rates-and-allowances-national-insurance-contributions)
and [student-loan deduction tables](https://www.gov.uk/government/publications/sl3-student-loan-deduction-tables/2026-to-2027-student-and-postgraduate-loan-deduction-tables).
The former table labelled 2026–27 used older employer NI/SSP/SMP/loan values;
new calculations use the corrected table. Historical payslip figures are retained.

External/incomplete scope remains explicit: HMRC RTI submission and bank transfers,
Scottish/special tax codes, director NI and week 53; telephony/ACD ingestion,
Erlang/service-level optimisation, real-time adherence, automatic notifications,
mutual shift swaps and multi-timezone sites; e-signature and benefit-provider
integrations; arbitrary goal formulae and historical scorecard snapshots. These
are not implied by the new UI or claimed as working integrations.

## Acceptance

Domain/permission tests cover weights and missing sources, role/skill/whole-interval
coverage, timed/unknown breaks and offline activities, working-day distribution,
2026–27 NI, cumulative and explicit M1 PAYE, whole-pound loan deductions, hourly
overtime, preparation access, approval-only actuals, opening history, input binding,
unpaid weekends, proration and statutory review. Existing HR/goal/rota tests are
included. Production build and strict types PASS; 18 focused files/125 assertions
PASS, followed by 4-file/35 Commercial and 7-file/59 Studio merge regressions.
The final candidate and public HTTPS acceptance both PASS with real saved
dashboard updates, payroll state/YTD transitions, open-shift decisions, team
allocation/reloads, negative tenant/privacy/concurrency cases and seven workspaces
at 1440/390 widths. Four public screenshots visually inspected; zero browser/asset
errors. No whole-suite success is claimed. Synthetic central Test access revoked.

Accepted live runtime: `36d0d2de7e64340a5faf130a69b3bcf21db3a2fc`.
Deployment evidence and actual check outcomes are recorded in `.ai/CURRENT_STATE.md`
and [People release evidence](../evidence/2026-10-10-people-platform.md).
