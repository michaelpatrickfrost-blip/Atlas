# Atlas business processes

8 October 2026. Existing workflows to preserve, with concrete open boundaries.

| Business flow | Working source connections | Gap requiring proof/implementation |
| --- | --- | --- |
| Quote → order | Revisions, accepted source, defaults/pricing, confirmation checks | Universal relationship navigation and reliable outbox processing |
| Order → fulfilment → invoice | Logistics demand/allocation/dispatch/delivery; Finance handoff | Full shipment-level received quantities, universal links and accounting cost |
| Demand → MRP → MO | Forecast consumption, inventory netting, multi-level definitions, firming | Dated purchased supply, BUY/transfer execution, richer pegging |
| MO → shop floor → stock | Work orders, produced/scrap quantities, Inventory backflush | Atomic multi-material completion, cost/WIP and partial-output correctness audit |
| Purchase → receive → AP | Approval, receipt provider, matching/accrual validation | Supplier acknowledgement/date-impact chain and complete procurement workbench |
| Complaint → return/credit | Purchase picker, ServiceWork, owner providers, independent approval | Extended lot genealogy, disposition/cost reconciliation |
| Plan → S&OP → forecast | Private inputs, immutable scenarios, exact-version approvals/publication | Finite feasibility and actual cost/FX governed metrics |
| Quality → stock hold | Inspection, hold, quarantine movement/release | Hold/position linkage and transaction consistency across all readers |

Acceptance must include permissions, tenant denial, retries, failure behaviour and
source relationships, not just page HTTP status. Current release evidence lives in
`.ai/CURRENT_STATE.md`; scope remains [master brief](requirements/ATLAS_MASTER_SYSTEM.md).
