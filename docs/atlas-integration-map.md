# Atlas integration map

8 October 2026. [System wiring](SYSTEM_WIRING.md) is the existing detailed contract
inventory. This map records convergence concerns without replacing that inventory.

| Boundary | Existing mechanism | Next correction |
| --- | --- | --- |
| Module contributions | `core/modules/types.ts`, registry, enabled/capability filters | Use the same pattern for permission-aware record relationships |
| Sales → Logistics | Sales handoff and `salesLogisticsConsumer` | Keep idempotent canonical line IDs and expose direct record links |
| Logistics → Finance | Delivery invoice consumer | Retain quantity/date/replay controls and Finance visibility |
| Finance → Inventory | Transaction-aware receipt consumer | Preserve atomic receipt and existing ledger evidence |
| Manufacturing → Inventory | Stock provider calls from completion | Review all movements + work-order state as one transaction |
| Sales/Inventory → Planning | Demand/inventory providers | Converge usable stock restrictions and correct source-line netting |
| Plan/S&OP → Manufacturing | Business planning projections / publication consumer | Keep approved immutable version provenance |
| Service → Finance/Sales/Logistics/Quality/CSAT | Registry providers | Preserve independent approval, ownership and original purchase context |
| Events → automation | AutomationEvent, sink and scheduler | Do not confuse log delivery with atomic Sales DomainOutbox dispatch |
| External email/social/bank | Existing adapters/imports/scheduler | Stable scoped interfaces, no arbitrary external table writes |
| Browser/desktop → central data | Server actions / data API generated contracts | Update generated action registry when exported signatures change |

Known Core dynamic imports of module implementations in `core/events/sink.ts` and
`core/scheduler/tick.ts` violate the stated one-wiring-point rule. Preserve behaviour
until moved behind a deliberate registry contract; documentation is not permission
to expand that pattern.
