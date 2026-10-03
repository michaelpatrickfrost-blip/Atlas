# Module memory map

The authoritative runtime catalogue is src/core/modules/registry.ts. Registered
foundations: CRM, Sales, Projects, Stock (Inventory), KPIs, Products and Pricing.
Customer Master belongs to Core. Registered foundations are not complete ERP apps.

Planned/stub apps include Logistics, Scheduling & Hours, Quality, Health & Safety,
Finance, Purchasing, HR, Payroll, Production Planning, Customer Service, Fleet and
Marketing. Read src/modules/stubs.ts for actual IDs/dependencies and check the
registry for which stubs are replaced by implemented manifests.

- [Module roadmap](../docs/MODULE_ROADMAP.md): boundaries and dependencies.
- [Delivery checklist](../docs/IMPLEMENTATION_PLAN.md): broad acceptance gaps.
- [Sales delivery map](../docs/modules/SALES_ORDER_PROCESSING.md): current commercial batch.
- [Sales specification](../docs/modules/SALES_FUNCTIONAL_SPEC.md): full target scope.
- [CRM specification](../docs/modules/CRM_FUNCTIONAL_SPEC.md): full target scope.

A specification is a target, not evidence of delivery. Before building a module read
docs/MODULE_SPEC.md, inspect the existing services, and reuse shared data/contracts.
