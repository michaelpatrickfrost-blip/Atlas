# Quality — 8 October 2026

Quality owns specifications, control points, recorded inspections, quality holds,
nonconformances and corrective actions. It uses canonical products and the existing
Customer Service operation provider; it does not create separate supplier/customer,
stock, training or document stores.

## Issue workspace and corrective action

`/quality/ncr` searches number/title/defect and filters status, severity, owner and
overdue target. `/quality/ncr/new` starts with the failed requirement and containment;
optional disclosures capture site/process, lot/reference, impact, evidence, guided
root cause/five whys and prevention. Canonical product, active company member owner
and target date are explicit. The `workspace` JSON preserves unknown legacy fields;
owner/date are indexed company fields. Existing service-linked party/hold/inspection
identities remain intact when editing.

Every issue/action mutation requires the submitted parent version and active Quality
entitlement, locks that version in a transaction, then writes business change and
metadata audit together. Stale saves retain the browser draft; expected validation
returns safe messages and unexpected/auth/database errors remain protected. Closing
an issue freezes changes until an authorised manager records a reopening reason.

`/quality/actions` is a cross-issue action register with search, assigned-to-me and
overdue filters. Actions have active company owners, dates, effectiveness criteria
and scheduled reviews; unverified details/dates can be corrected. Transitions:
OPEN → DONE → VERIFIED or INEFFECTIVE; DONE can reopen, INEFFECTIVE must reopen before
completion. Verification needs an existing criterion and substantive review evidence.
Verified action evidence cannot be rewritten; add follow-up work instead. All actions
must be VERIFIED before issue closure. Major/critical issues also need a confirmed
root cause and at least one verified corrective action; minor issues do not force a
full RCA. Closure requires its own review evidence and the existing close capability.
These are Atlas operational gates, not a claim of regulatory certification or an
independent approval/e-signature system. Closing an NCR never releases a quality hold.

## Inspection integrity and history

`/quality/checks` uses explicit, independently keyed answers for every configured
characteristic. Missing/duplicate/foreign characteristic sets, missing/nonfinite
measurements, missing pass/fail, invalid quantities, draft specifications or foreign
warehouse/location/product/specification references are rejected. No answer defaults
to pass. Zero numeric limits are respected. A simple manual failed check creates a
measurement, failed inspection, quality hold and NCR in one transaction. Existing
stock quarantine integration is preserved; a recorded hold alone is not proof that
an automatic stock movement succeeded. Receiving failures use INCOMING source.

Latest 50 inspections link to immutable readable results at `/quality/checks/:id`;
linked NCR/hold information is queried only with its respective capability. Historical
names/units come from linked specification characteristics, not a new signed snapshot.
Quality Home queries and displays only accessible entity work.

## Reports and limits

Inspection pass rate is labelled accurately; repeated inspection attempts are not
proven first-pass yield. Issue/source/inspection activity covers 90 days; open ageing
and unresolved action/review counts cover all dates, including issues older than 90
days and ineffective actions. Registers cap at 200 and explicitly ask users to narrow
filters when more work exists. Evidence fields hold notes/document references; file
uploads, electronic signatures, supplier scoring, scheduled external notifications,
calibration and full audit/change-control programmes are not added by this change.

See [research mapping](../plans/QUALITY_WORKSPACE_RESEARCH.md), project current state
and deployment evidence for checks actually run and live acceptance.
