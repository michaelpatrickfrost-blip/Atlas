# Atlas domain map

Source inspection, 8 October 2026. Each row identifies existing ownership rather
than proposing replacement entities. Services live under `src/modules/<id>/services`
unless Core is named. Layouts/routes use the same module paths under `src/app/(app)`.

| Domain | Canonical entities | Existing lifecycle / computation / relationships |
| --- | --- | --- |
| Identity/organisation | User, Membership, Organisation, Site, module states | Signed sessions, scoped capabilities, Atlas staff/company setup and offboarding |
| Customer Core | Party, contacts, addresses, hierarchy | Canonical identity; historical scrub; module overview contributions |
| CRM | Opportunity, SalesProject, activities | Owner-scoped pipeline, probabilities, commercial project stakeholders; shared pricing agreements/contracts |
| Sales | Quote/revisions, SalesOrder/Line, call-offs | Confirmation/approval/cancel/amend, pricing/tax, fulfilment/Finance contracts; structured customer PO |
| Product | Product, ProductDefinition, BOM lines, operations | Versioned definitions, activation/restore; one catalogue across Sales/Inventory/Manufacturing |
| Inventory (`stock`) | InventoryMovement/Balance, StockPosition/Reservation/Lot/Serial | Ledger + physical/location projections, receive/ship/reserve/transfer, forecast |
| Production Planning (`planning`) | Saved product plans, demand projections | Physical demand coverage; consumes shared identities, does not own orders |
| Manufacturing | ManufacturingOrder/WorkOrder, planning runs/suggestions, resources/shifts | Multi-level MRP, firming, finite conflict preview, shop floor and backflush |
| Procurement (Finance commercial, Logistics receiving) | Finance purchase orders/lines, Receipt/Line | Approval, ordered/received/invoiced match, Inventory provider receipt |
| Quality | Inspection/specification/measurement, QualityHold, NonConformance | Inspection evaluates measurements, holds and dispositions; release Stock movement |
| Logistics | FulfilmentRequirement/Line, Shipment/Line, returns, handling units | Allocation, picking/packing, dispatch, delivery, return provider and invoice handoff |
| Finance | FinanceDocument/Line, journals/ledger, allocations, bank records, periods | Immutable balanced posting, AR/AP, FX, match/reconcile, independent approvals |
| Service | ServiceCase; Core ServiceWorkItem for tickets/queries | Security-scoped clocks, purchase context, credit/replacement/return/Quality/CSAT providers |
| Projects | Project, workstreams/tasks/dependencies | Internal delivery work; distinct from SalesProject; permission-scoped views |
| Plan/S&OP | BusinessPlan/inputs/cells, SopCycle/Version | Private sharing, versioned consensus, approved controlled Manufacturing publication |
| Marketing/Email/CSAT/Automations | Campaign/audience/message, event/action records | Shared Party identities; consent/channel workflows; durable event-driven work |
| HR/Scheduling/Payroll | Employee, leave/rota/skills, payroll runs | Sensitive scopes and self/team reads; calculation separated from statutory submission |
| Safety | Incidents, assessments, controls/holds | Versioned risk context, manufacturing availability connection; no statutory submission |
| Platform | Approvals, audit/activity, templates/contracts, Guardian | Reuse providers; Guardian detects/reproduces defects, does not certify whole workflows |

Full model/route relationships are in [System wiring](SYSTEM_WIRING.md) and
[Data model](DATA_MODEL.md). Remaining ownership breaches are tracked in
[technical debt](atlas-known-technical-debt.md), not silently accepted as architecture.
