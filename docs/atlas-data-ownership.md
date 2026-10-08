# Atlas data ownership

8 October 2026. Extend the existing [domain map](atlas-domain-map.md) and
[Customer Master](CUSTOMER_MASTER.md); do not create replacement customer/item stores.

| Truth | Owner | Consumers / permitted projection |
| --- | --- | --- |
| Customer/supplier identity | Core Party | Modules reference Party IDs; legal document snapshots are deliberate history |
| Product and released recipe | Products | Manufacturing snapshots/references the released definition |
| Physical movements and reservations | Inventory | Logistics and Manufacturing request provider operations; balance/position are projections |
| Commercial order and accepted quote revision | Sales | Logistics/Planning/Finance reference the exact source line |
| Production execution | Manufacturing | Inventory owns its stock consequences; Finance owns monetary postings |
| Delivery | Logistics | Sales fulfilment and Finance delivered invoicing use its projection/handoff |
| Credit/debt/postings | Finance | Sales/Service receive authorised outputs; no raw invoice metadata without Finance read |
| Complaints/internal work | Service / Core ServiceWorkItem | Credit, replacement, return and NCR retain owning-module IDs |
| Forecast intentions | Plan/S&OP, approved Manufacturing forecast | Incoming expectations remain separate from on-hand inventory |

Availability repair: match fulfilment to the same active, base-unit sales line;
clamp per line; remove shipped demand once inventory has left; count outstanding
receipts only as expected supply. Invoice chain metadata requires Finance read
and the enabled Finance app. These changes do not rewrite historical records.

Unresolved: aggregate plan/open-production max is a duplicate-avoidance heuristic,
not source pegging. QualityHold and quarantine overlap lack an explicit shared
identity. See technical debt before changing either calculation.
