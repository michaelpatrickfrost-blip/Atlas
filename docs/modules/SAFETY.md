# Atlas Safety

Safety is the operating record for workplace risk. It answers what could hurt someone, whether the controls are in place, what needs attention, who may do the work, what happened, and what was done afterwards. It does not make an organisation compliant. That remains with the employer, the responsible person, the competent person or the dutyholder.

The module is registered as `safety` at `/safety`. Navigation is Today, Risk, Incidents, Control, Assurance and Reports. COSHH, permits, PUWER, LOLER, DSE, fire, first aid and the rest are reached from those six areas.

## Domain ownership

Safety owns risk, assessments, controls, actions, incidents, investigations, inspections, audits, permits, isolations, safety holds, statutory examinations, substances, competence requirements, safety documents, obligations and workplace records.

People owns the employee. Manufacturing owns the production order and the resource. Logistics owns the warehouse task. Stock owns quantity and location. Safety links to those records. It does not copy them.

A workplace profile (`OFFICE`, `WAREHOUSE`, `MANUFACTURING` or `FIELD`) chooses which deeper features appear. An office does not start with permits and chemical approval.

## Risk

A risk register entry keeps its identity. Each assessment is a revision. Approving a revision supersedes the previous one and leaves it readable. The author, reviewer, approver, change reason and effective dates stay on the revision.

The assessment records the hazard, who might be harmed, how, existing controls, initial risk, additional controls, residual risk, the responsible person, the target date, the review date and evidence.

Matrices are configurable: 3×3, 4×4, 5×5, or qualitative. The rating stores the explanation (`likelihood label × severity label = score`). A score is not proof that the risk is controlled.

Controls are classified as eliminate, substitute, engineering, administrative or PPE.

Reviews can be requested because of a schedule, an incident, a near miss, a process or equipment change, a new chemical or location, a change in people, legislation, an audit finding or a control failure.

## Incidents

Anyone with `safety.incident.report` can send a short report: what, where, when, who, and whether anyone is still in danger. Investigation, causes and corrective action are a later step.

Actual consequence and potential consequence are separate. A near miss can have no injury and a fatal potential.

Investigation methods are optional: simple notes, 5 Whys, fishbone, ICAM-style notes or barrier notes. Depth follows severity and potential. Cause categories describe the system. They are not a finding that a worker is to blame.

Actions are shared. A formal CAPA can move from finding, through correction, root cause, corrective action, preventive action, verification and an effectiveness check, to close. Sources include incidents, assessments, inspections, audits, examinations and meetings.

Injury and ill-health reports are confidential. The accident book is not shown to someone who only has permission to report.

## RIDDOR

UK RIDDOR support is versioned localisation (`GB-RIDDOR-2013-atlas-1`), not a determination and not a submission to the Health and Safety Executive. Assistance can suggest a category such as a specified injury or an over-seven-day incapacitation, and it can show the review window. A responsible person marks the event reportable or not, with a reason. The decision, date, method, reference and guidance version are kept. Atlas does not claim to have filed the report.

## Assurance

Inspections are built from questions. A no or a fail can create an action, a maintenance request, a risk review or a safety hold. The answer is not stored as a silent fail.

Audits are separate from inspections. Findings use configurable kinds. An approved audit is not edited in place.

Statutory checks cover LOLER, PUWER and other configured examinations. A serious defect places a safety hold. PUWER results roll up to safe for use, restricted, or unsafe for use. LOLER can store the safe working load, the examiner, the scheme and the next examination.

## Equipment, permits and isolation

A safety hold is the operational stop. It names the target (manufacturing resource, logistics equipment, asset or area), the reason, and the return-to-service checks: repair, inspection, and safety verification. Maintenance completion does not clear the hold. An override records who, why, scope, approval and an expiry.

Manufacturing will not start a work order on a resource with an active hold, and it blocks open work orders on that resource. Sales shows a delivery risk when a linked production order is held. Logistics will not assign handling equipment that Safety has stopped, and it will not assign it to someone whose required competence is missing or expired. Competence is never inferred from a job title.

Permits move from request, through risk review, controls, isolation where required, authorisation, work, suspension or extension, completion, inspection, handback and close. A permit past its expiry is shown as expired and cannot be advanced as if it were still valid. Hot work beside line opening or confined-space work raises an additional conflict check. That check is not a guarantee.

Isolation records the asset, the energy types, the locks and who applied, verified and removed them. The isolation cannot be cleared while a lock is still on.

## Substances, PPE and occupational risk

A substance has a trade name, classification, storage, PPE, emergency instructions and approval status. Safety data sheets keep history. A new sheet can require the COSHH assessment to be reviewed. Approval needs a current sheet and an assessment, including whether the substance can be eliminated or substituted.

Stock quantity is read from Inventory when a substance is linked to a product. Safety does not invent the quantity. Storage clashes are shown only when a company has configured the classifications. Atlas does not guess chemistry.

Workplace records cover method statements, lifting plans, PPE, DSE, fire, drills, emergency plans, personal emergency evacuation (operational detail only), first aid, toolbox talks, briefings, inductions, contractors, lone work, noise, vibration, exposure, manual handling, work at height, asbestos and legionella. Asbestos with no record is not described as asbestos-free. Lone-worker records do not replace a monitored alarm service. Health surveillance stores the requirement, the due date and the work-relevant outcome. It does not store a clinical record.

## People, training and gating

Competence is stored against the People employee, with an expiry. Today shows certificates due this month. Where the rota is readable, Friday afternoon first-aider coverage is compared with people who hold current first-aid competence. If the rota is not available, Atlas does not pretend the coverage figure is complete.

Acknowledgement of a document is not competence.

## Permissions, privacy and audit

Capabilities are strings such as `safety.risk.approve`, `safety.incident.investigate`, `safety.riddor.manage`, `safety.permit.authorise`, `safety.isolation.remove`, `safety.hold.manage` and `safety.sensitive_incident.read`. Roles bundle them. Code does not check a role name.

Confidential incidents and sensitive workplace records are excluded from the data API unless the session may see them. Significant decisions write an audit entry: risk approval, RIDDOR review, permit changes, isolation, holds, overrides, substance approval, competence and audit approval.

Domain events include `safety.incident.reported`, `safety.risk.approved`, `safety.equipment.hold_added`, `safety.equipment.hold_removed`, `safety.permit.authorised` and `safety.isolation.applied`.

## Reporting

Reports separate leading signals (reviews, inspections, actions, competence) from lagging signals (injuries and high-potential events). There is no combined safety score. A rate per hours is shown only when an exposure denominator exists. Counts are described as counts, not as a cause.

## What this module does not do

It is not a medical-record system, an occupational-health clinic, an emergency service, a legal adviser, a COMAH or nuclear process-safety platform, a PLC, a door-access system, or a lone-worker monitoring centre. It does not keep a local copy of safety records on the Mac. A record is committed only after the server has stored it.

## Workplace register — 8 October 2026

`/safety/workplace` exposes all 29 existing record types, independent of profile
feature presets. Search title/reference and filter by type, overdue, upcoming
30-day review or completion. Lists are capped at 200 with an explicit narrowing
notice, not an assertion that the whole company has only 200 records.

Guided prompts cover fire, emergency/evacuation, DSE, first aid, lifting/method
statements, contractors/induction/toolbox talks, lone working, manual handling,
height, noise/vibration, asbestos and legionella; remaining types use operational
prompts. Every record supports location, responsible person/team (a recorded
contact, not a new employee identity or automatic assignment), findings,
follow-up, evidence references and a review date. No document upload or monitored
emergency/check-in service is implied. Operational completion requires a note;
it does not approve a risk assessment, remove an equipment hold or certify safety.

Create/edit requires `safety.risk.create`, active Safety entitlement and signed
tenant scope. Register/detail requires `safety.risk.read`. Restricted record
creation/editing additionally requires health-surveillance access. Existing
sensitive read policy is preserved (sensitive-incident/health access or owner on
the detail route); list filters never expose restricted records to normal readers.
Writes use an expected `updatedAt` condition, preserve unknown legacy JSON, and
record metadata-only audit in the same transaction. Explicit expected validation
errors return safe results and retain entered work in production. Unexpected
server errors remain protected. Safety Today shows overdue workplace reviews and
excludes completed records from upcoming work.

Design references, consulted 8 October 2026:
- [HSE risk assessment steps](https://www.hse.gov.uk/simple-health-safety/risk/steps-needed-to-manage-risk.htm): findings, controls, responsibility, further work and review.
- [HSE managing health and safety](https://www.hse.gov.uk/managing/introduction/how-to-manage.htm): ongoing planning, implementation, monitoring and review.
These inform record organisation; the prompts are not HSE-approved templates or
an automated legal assessment.
