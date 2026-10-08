# Atlas continuous unification work

Michael requests no phases or phase sign-offs. This is a rolling dependency-ordered
work list, not an approval plan. Ship and verify completed compatible changes
continuously. Preserve the [full requirements](requirements/ATLAS_MASTER_SYSTEM.md).

| Work | State on 8 October 2026 | Completion evidence required |
| --- | --- | --- |
| Correct shared active-line availability and Finance chain access | Live `29316a8`, 10 authenticated assertions passed | Regressions plus authenticated live source/permission assertions |
| Shared record relationship panel and owning-module providers | Live `58ee4f3`; 26 authenticated assertions passed | Source/target access, tenant isolation, actual record links, browser proof |
| Consistent Inventory restrictions across all projections | Open | Explicit hold/position provenance; quality hold + allocation scenarios |
| Atomic manufacturing consumption/output/progress | Implemented; build/live acceptance pending; repeated partial output remains open | Multi-material failure rollback, retries and partial output reconciliation |
| Time-phased Supply Lens and pegging | Open | Stock/reservations/known demand/firm supply, dates and source provenance |
| MRP purchased supply and executable BUY/transfer | Open | Exact golden scenario, multi-level dates, traceable firming, approvals |
| Operational Home/My Work and progressively disclosed records | Home live `77252b4`; 34 assertions passed; deeper per-record disclosure remains open | Real authorised queues, responsive/actionable views, no new duplicate tasks |
| Operational Finance costing/WIP/COGS | Open | Owner contracts and physical/subledger/GL reconciliation |
| Remaining master brief and hardening | Open | Requirement-by-requirement workflow/security/performance evidence |

A live release is completion of its recorded scope only. It does not certify all
251 requirements. Keep investigating and implementing beyond these entries.
