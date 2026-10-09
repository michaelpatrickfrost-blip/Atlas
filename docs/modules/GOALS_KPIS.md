# Connected Goals & KPIs — 8 October 2026

Goals retains shared department/team targets and private personal/development/PIP
records. Business records remain with their source apps; Goals stores targets and
notes, reads authorised actuals on demand, and does not create a second ledger,
customer record or business cache. Personal live links remain department context,
not an assertion of an employee's individual attributable performance.

## Connected results

| Result | Owning records and calculation |
| --- | --- |
| Confirmed sales value | Sales net order amounts excluding tax, by confirmation date; confirmed/on-hold/closed, cancelled/draft excluded; separate currencies |
| Posted revenue | Finance posted revenue account credits less debits, by accounting date, including reversals |
| Posted profit | Finance posted revenue less all posted expenses; entity base currencies remain separate; authorised journals only, not sales margin or forecast profit |
| Customer satisfaction | Valid five-point responses scoring 4/5 divided by all valid responses, by response date |
| Customer-service CSAT | Same calculation, restricted to ServiceCase-linked responses whose cases this profile can read, including queue/security scope |
| Cases resolved | Visible cases currently resolved/closed, by resolution date; reopened cases excluded |
| Production orders completed | Completed/closed production orders by actual finish; one order, never a sum of routing-step quantities |
| Production completed on time | Eligible completed orders meeting required UTC calendar date divided by completed orders with a required date |
| Shipments dispatched | Dispatched/delivered shipment count by actual dispatch date; planned/cancelled excluded |

Finance uses the ledger's document/project boundaries, posted base values and safe
BigInt-to-number conversion. It never derives profit from orders or assumes a cost
profile is an actual posted expense. Missing/unposted expenses remain unposted.
CSAT excludes invalidated responses and non-five-point surveys; it does not average
survey averages. No eligible denominator means no reading. Production on-time
calculation refuses more than 10,000 eligible orders rather than silently truncating.

## Period, judgement and source access

The optional analytics `goalQuery` contract reads the goal's inclusive UTC dates
using an exclusive next-day upper bound, capped at now. Sales/Finance/CSAT/Service/
Manufacturing/Logistics implement it in their owning module, registered through
`analyticsProvider`; Core does not import their implementations. Old flow metrics
without a bounded contract show an explicit unavailable reading and can be reconnected.
Existing snapshots remain current positions, not historical end-of-period snapshots.

Rates and current positions compare directly with the full target; accumulating
counts/amounts retain straight-line pace. Missing source, missing currency, read
failure and empty ratio denominator never become zero/manual fallback. Source
capabilities, active entitlements and company scopes apply independently of Goals
read/manage. Service CSAT requires both Service and CSAT access. Sources with no
readings can still have a target set; a percentage must be 0–100 and money requires
an explicit three-letter currency. Targets are nonnegative.

Existing shared goals can change source/target without changing identity, owner,
period or history. Submitted connection state (metric/group/unit/target) and an
atomic conditional update reject stale/raced source changes; connection audit is
in the same transaction. This is not a version lock on every legacy goal operation.
Optional personal-plan workflows retain their existing access and manual progress.

Live-goal history displays notes rather than reinterpreting old numerical updates
under a new source's currency/unit. Numerical history remains central; generic data
API projections exclude updates of shared source-linked goals so Goals access
alone cannot expose captured source readings. Private/manual histories keep their
existing scope. Live notes cannot fabricate a reading when the source is unavailable.

## User journeys and limits

Scorecards offers guided connected-target starters. New-goal forms preselect the
source; optional department/team can assign a Finance profit measure to Sales while
its accounting meaning remains company scope. Recent 90-day reference figures are
explicitly distinct from the saved goal's actual period. Detail shows definitions,
sample count, source link, actual/target and a way to connect existing shared goals.
Sales documents, Finance ledger, CSAT, Service and Manufacturing expose matching
shared targets with source permissions; page filters do not silently rescope goals.
Matching dashboard charts and monitors use independently scored goal actuals and
refresh those scores alongside chart refreshes; server query functions are stripped
from client metadata. Source changes do not write copied business actuals into Goals.

No arbitrary formula editor, employee attribution, recurring goal
scheduler, historical snapshot archive, automated notification or compensation link
is claimed. Operational metrics use current record statuses and retained dates;
reopening/cancelling/repricing may change a historical period's reading. Financial
posting/reversal semantics remain Finance-owned. Evidence and exact checks are in
`.ai/CURRENT_STATE.md` and `docs/evidence/2026-10-08-connected-goals.md`.

## 9 October 2026 — Strategy scorecards

/kpis/scorecards groups active company goals with positive weights, normalises
AT_LEAST/AT_MOST attainment capped at 100%, and leaves the aggregate unscored if
any goal/source is missing or inaccessible. Private goals/PIPs are excluded.
kpis.attainment feeds dashboards but cannot become a goal source (no recursion).
Membership/weights and audit save atomically with same-tenant composite goal FKs.
This supersedes the weighted-rollup gap for strategy scorecards; arbitrary formulae,
employee attribution and historical snapshots remain open. See
[People overhaul](../plans/PEOPLE_PLATFORM_OVERHAUL.md).
