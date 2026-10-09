# Manufacturing coverage — 9 October 2026

All 173 sections of [the source brief](MANUFACTURING_SOURCE_REQUIREMENTS.md) remain
in scope. This replaces stale Phase 1-only claims; historical wording is in Git.
Read [Manufacturing & Supply](MANUFACTURING.md) for the researched benchmark,
current workflows, ownership and remaining programme. A partial row stays open.
Current live validation is recorded separately in
[acceptance](MANUFACTURING_SUPPLY_ACCEPTANCE.md) and `.ai/CURRENT_STATE.md`.

| Sections | Topic | Confirmed implementation and open scope |
| --- | --- | --- |
| 1–8 | Purpose, workflow, ownership, navigation | Connected Manufacturing & Supply console, demand workbench and role views; business owners/data identities remain separate. Full bidirectional supply genealogy remains partial. |
| 9–16 | Product/BOM profile and versions | Canonical Product, independent sales eligibility, active recipe versions, multi-level components, make/buy/WIP, yield/scrap/batch and cost estimates. Open: effective alternates, substitution, variants and complete engineering-to-production governance. |
| 17–20 | Routing/operations/dependencies | Ordered recipe operations with actual work-centre/machine references, release-generated work orders and ordered execution. Open: separate effective routing versions, parallel/overlapping dependencies and alternative routings. |
| 21–27 | Resources/calendars/capacity | Plant resources and weekly centre/machine shifts with man-hour capacity. Open: capability matching, alternate resources, complete exception calendars and efficiency rules. |
| 28 | Bottlenecks | Load/capacity and overlap conflicts exist. Open: complete constraint attribution and optimization. |
| 29–43 | MPS/MRP/forecasts/pegging/suggestions | Recursive BOM netting, consumed forecasts, usable stock/holds/reservations, batch sizing, saved rich run/pegging/cost/hour output, shortages, atomic Make conversion and Buy-to-Finance draft. Open: MPS period grid, dated site-specific purchase/transfer supply, action-message taxonomy, time fences, CTP and scenario publication. |
| 44–56 | Finite scheduling/Gantt/cascade/locks | Machine Gantt, conflict/next-slot/cascade preview, force/lock controls, shifts. Open: backward and multi-constraint finite scheduling, setup-family optimization, material/skill/tool gates and fine drag precision. |
| 57–60 | Production orders/lifecycle/readiness | Guarded production lifecycle and release-generated routing work. Open: complete materials/capacity/tool/document readiness review. |
| 61–65 | Staging/reservation/issues/consumption | Inventory reservation/issue owner contracts and final-operation transactional component backflush exist. Open: complete production-specific stage/pick/actual-issue/overconsumption flow and decimal stock execution. |
| 66–68 | Work orders/status/concurrency | Work orders, times, good/scrap counts, optimistic version and request keys. Open: broader exception/reversal acceptance. |
| 69–77 | Floor/partial/backorders/split/merge | Start/pause/complete UI, recorded reasons, repeat-safe completion and preceding-operation gates. Open: controlled production split/merge/backorders and full operator scanning/documents. |
| 78–83 | Lots/serials/genealogy/output/put-away | Stock lot/serial foundations, output movements linked to production/work order and shared warehouse. Open: complete component-to-output genealogy and scan-led put-away. |
| 84–90 | Scrap/yield/rework/co-products/process | Good/scrap capture and recipe yield/scrap calculations. Open: reason taxonomy, rework orders, co/by-product allocation and full batch/formula manufacturing. |
| 91–94 | Subcontract | Recipe supply/cost concept exists. Open: executable vendor operation, shipped components, receipt and actual allocation. |
| 95–99 | Quality/maintenance | Quality and Maintenance owners exist; active quality holds reduce usable MRP stock. Open: full production inspection gates, disposition/genealogy and breakdown-calendar replanning. |
| 100–102 | People/labour/tooling | Crew and estimated labour, shared People/rota and planning teams exist. Open: finite skilled labour, attendance actuals and tool reservations. |
| 103–108 | Cost/Finance/WIP | Recipe/planned cost estimates; Finance owns purchasing/receiving/posting/matching; new source-currency supplier spend report. Open: approved production cost versions, actual labour/overheads, WIP/variance/COGS and inventory valuation reconciliation. |
| 109–117 | Sales/CRM/Inventory/Procurement/Logistics/CTP | Canonical demand/products/stock, Sales handoffs, transactional production output and Buy-to-purchase source link. Open: complete dated supply/change/cancellation reconciliation, transfer/subcontract conversion and protected CTP. |
| 118–127 | Workspace/documents/scanning/progress/alerts | Connected console, Production Today, orders, floor, schedule and progress; source providers/attention. Open: scanning, contextual operator documents and comprehensive delay/schedule notifications. |
| 128–143 | Reporting/saved views | Customer risk, load/capacity, basic production analytics and supplier spend; bookmarkable role/shortcut views. Open: OEE/downtime/yield/material-cost variance/adherence/throughput/WIP/subcontract/genealogy suites and persisted shared reporting views. |
| 144–147 | Attention/activity/commands/events | Registered attention/search/activity, guarded actions and domain events. Open: full durable event/reconciliation coverage. |
| 148–150 | Providers/idempotency/concurrency | Shared Stock contracts, owner module providers, Finance spend/Buy proposal contracts; serializable conversion and version/CAS/duplicate keys. Open: comprehensive cross-module lifecycle contracts and retries/reconciliation. |
| 151–154 | Permissions/audit/reversals | Tenant/capability/module gates, transactional conversion audits, existing execution controls. Open: controlled production material/cost reversals and full exception permissions acceptance. |
| 155–158 | Performance/run/explainability/AI | Identified completed runs, saved explanatory input/output and guarded source access. Open: scale/parallel-run input consistency and deeper performance acceptance; AI remains optional. |
| 159–162 | Design/mobile/demo | New responsive console/report/help follow current Atlas visual direction; synthetic Test scenario. Existing workspaces retained. Open: full detailed-workbench visual consolidation and richer realistic demo packs. |
| 163–166 | Automated/cross-module checks | Actual domain/owner tests cover recipes, schedules, MRP/S&OP, stock completion, product eligibility, reports and source conversion. Full-suite baseline still has unrelated failures; see acceptance. Remaining engines need acceptance, not merely test names. |
| 167 | Visual review | Console/report/guides reviewed at desktop/tablet/phone during release acceptance; see exact evidence. Further detailed workspace reviews remain open. |
| 168 | Documentation | Consolidated researched Manufacturing guide, full coverage and nine illustrated working guides. Further features must add instructions and acceptance. |
| 169–173 | Scope/build/done/final experience | Process requirements remain binding. Current release acceptance is distinct from complete brief acceptance. No row is closed merely by navigation, docs or schema. |

## Data and release truth

Manufacturing's earlier foundation, shift and execution migrations are deployed on
the central server. The earlier local shadow-database replay issue is historical;
Atlas must not create a local business database to resolve it. Additive production
migrations use the reviewed release procedure and central backup. The sales
eligibility migration `20261009210000_product_sales_eligibility` and tenant-bound
purchase link `20261009220000_mrp_purchase_link` are applied centrally. The connected
console passed candidate and public acceptance on 2690c26; exact backups and
limits belong in the acceptance record. Preserve all prior release evidence.

## Next work

Follow the complete seven-part programme in [Manufacturing & Supply](MANUFACTURING.md).
Start with canonical dated site/warehouse/unit/supply inputs; those are prerequisites
for dependable purchase/transfer netting, constraint scheduling and customer promises.
Production cost/WIP is a Finance integration programme, not a renamed spend total.
