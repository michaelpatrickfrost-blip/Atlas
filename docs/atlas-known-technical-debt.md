# Atlas known technical debt and initial assessment

8 October 2026; inspected live-source baseline `5741196`, primary diff and the named
implementations. Ranked candidate risks are source findings; only entries explicitly
reproduced by tests are confirmed runtime defects. No claim of a full code audit.

## Ten architectural fragmentation problems

| Finding | Evidence / implication |
| --- | --- |
| Repeated stock truth calculations | `stock/services/{provider,availability,business-planning}.ts`, `manufacturing/services/mrp-calculation.ts` use different restrictions. |
| Cross-domain read aggregation | `stock/services/availability.ts` queries Sales, Logistics, Finance and Manufacturing directly; converge through owner contracts. |
| Core imports module implementations | `core/events/sink.ts`, `core/scheduler/tick.ts` dynamically import module engines, contrary to registry-only wiring. |
| Two durable event paths | `AutomationEvent` sink/scheduler and Sales `DomainOutbox` are separate; inspect delivery semantics before consolidation. |
| Split attachment architecture | Finance attachments, Projects documents, Core templates/contracts and Service evidence use different APIs/access paths. |
| Overlapping quality state | QualityHold and QUARANTINE StockPosition have no explicit common hold identity for safe deduplication. |
| Aggregate plan/execution overlap | `availability/picture.ts` uses max(plan, production), without item-date-source pegging. |
| Non-atomic manufacturing boundary | `manufacturing/services/stock.ts` loops separate provider transactions before completion state persists. |
| Scattered contextual navigation | Sales commercial links, service panels and Finance sources were bespoke; shared relationships now implemented on five root types; remaining roots open. |
| Release checkout fragmentation | Primary main is older with extensive concurrent edits; live main is newer. Pinned clean release prevents unrelated deployment. |

## Ten workflow problems

| Finding | Evidence / implication |
| --- | --- |
| Historical delivery hides current shortage | Shared availability subtracts historical product deliveries from active product orders; reproduced by regression before repair. |
| Shipped demand counted twice | Inventory already decreased at dispatch, but availability formerly removed demand only at delivery; reproduced before repair. |
| Invoice metadata crosses read boundary | `readOrderChain` formerly queries/returns invoice references without Finance read; regression reproduced. |
| Receipt supply missing from projection | Arrivals contain receipts but aggregate incoming formerly omitted them; regression reproduced. |
| Arrival truncation affects promise | `incomingArrivals` formerly slices inputs at 12; a later covering arrival is ignored. |
| Incomplete quality propagation | MRP reads QualityHold; Sales availability reads restricted positions; safe shared identity/atomicity unresolved. |
| Partial manufacturing failure | Backflush can commit earlier materials before a later issue fails; not yet proven with a live failure fixture. |
| Procurement suggestion stops short | Manufacturing delivery guide records executable BUY/transfer handoffs as open. |
| Customer delay explanation incomplete | One sourceSalesOrderLine relationship and JSON suggestion pegging cannot yet explain the entire supply chain. |
| Missing precise delivery receipt | S&OP acceptance marks partial received quantities unavailable; do not infer a delivery receipt from allocation. |

## Ten UX complexity problems

| Finding | Evidence / implication |
| --- | --- |
| Home gives navigation before work | `home/page.tsx` places the app directory before its existing attention/goals; supplied brief now requires operational attention/My Work first. |
| Large sales record rendering | Sales order page composes many inline actions and panels; use tabs/context without losing workflows. |
| Technical JSON in history | Sales History renders revision snapshots with JSON.stringify rather than meaningful field changes. |
| Projected stock labelled Available | Order chain mixes future supply/open demand with an available label; corrected to Projected stock. |
| Stale connection guidance | Sales Connections had obsolete awaiting-connection guidance; replaced alongside real relationship navigation. |
| Weak direct fulfilment link | Order fulfilment reference formerly pointed to queue; corrected to canonical record ID. |
| Shared table overflow | Order chain lacked a local horizontal-scroll wrapper; corrected alongside the stock label. |
| Configuration before product context | Stock item places locations/planning/production controls before ProductView summary. |
| Search groups can disappear | `core/search/aggregate.ts` globally slices first 20; earlier providers/navigation can crowd out business matches. |
| Different import/document experiences | Domain-specific imports and attachment UIs require users to learn repeated patterns. |

## Highest-risk duplicate truth and weak relationships

InventoryBalance versus StockPosition is an intended projection, not automatically
a duplicate ledger; reconciliation is required. QualityHold/quarantine overlap,
plan/open-production overlap and duplicated availability readers are the dangerous
ambiguities. Source-line fulfilment and supplier/material/MO/customer pegging are
weaker than canonical Party/Product references. Do not replace those strong IDs.

Business logic duplicates quantity netting in `availability/picture.ts`,
`planning/domain/netting.ts`, Manufacturing MRP and Stock forecast/business planning.
OTIF/customer versus promise bases must remain explicit; one label is not one formula.

## Avoidable manual work, configuration and under-modelling

Users re-find records through queues instead of direct links, inspect raw history,
and reconstruct purchasing/production/customer consequences. Inventory product
controls precede context; simplify default presentation before adding configuration.
Missing purchased-supply firming, hold provenance, full received quantities, costed
manufacturing/WIP and time-phased protected ATP are under-modelled. Detailed delivery
maps preserve other gaps; no invented quantities/dates/costs should fill them.

## Preserve and refactor safely

Keep Customer Master, one Product, versioned recipes, scoped auth/capabilities,
Core approvals, Inventory provider/retry keys, immutable Finance records, accepted
quote revisions, private Plan/S&OP publication and Service purchase/recovery links.
Start with reproduced availability/access defects, then shared relationship
contracts, consistent stock restrictions, atomic execution and source-aware supply.
Each change requires tests, compatible build, backup, deployment and actual live
feature verification. Continue without phase approval gates.
