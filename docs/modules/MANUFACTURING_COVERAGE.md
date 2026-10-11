# Manufacturing coverage — 11 October 2026

All 173 sections of [the source brief](MANUFACTURING_SOURCE_REQUIREMENTS.md) remain
in scope. This replaces stale Phase 1-only claims; historical wording is in Git.
Read [Manufacturing & Supply](MANUFACTURING.md) for the researched benchmark,
current workflows, ownership and remaining programme. A partial row stays open.
The [kiln/forecast research checkpoint](../plans/MANUFACTURING_KILN_RESEARCH.md)
distinguishes implemented machinery constraints from full process manufacturing.
Current live validation is recorded separately in
[acceptance](MANUFACTURING_SUPPLY_ACCEPTANCE.md) and `.ai/CURRENT_STATE.md`.

| Sections | Topic | Confirmed implementation and open scope |
| --- | --- | --- |
| 1–8 | Purpose, workflow, ownership, navigation | Connected Manufacturing & Supply console, demand workbench and role views; business owners/data identities remain separate. Full bidirectional supply genealogy remains partial. |
| 9–16 | Product/BOM profile and versions | Canonical Product, independent sales eligibility, active recipe versions, multi-level components, make/buy/WIP, yield/scrap/batch and cost estimates. Open: effective alternates, substitution, variants and complete engineering-to-production governance. |
| 17–20 | Routing/operations/dependencies | Ordered recipe operations with actual work-centre/machine references, shared per-unit/load-cycle/cooling/wait timings, release snapshots and ordered execution. Open: separate effective routing versions, parallel/overlapping dependencies and alternative routings. |
| 21–27 | Resources/calendars/capacity | Generic Plant & machines with optional specialist process types, approved profile/alternative resources, machine-timezone shifts/continuous calendars, downtime and capacity. New compatible mixed-product load capacity/footprint model is implemented with pending native acceptance. Open: skilled resource matching, full exception calendars and efficiency rules. |
| 28 | Bottlenecks | Load/capacity and overlap conflicts exist. Open: complete constraint attribution and optimization. |
| 29–43 | MPS/MRP/forecasts/pegging/suggestions | Sales-history forecast review (seasonal/recent baselines, holdout error/bias), editable last-year percentage/additive/fixed targets, protected S&OP publications, gross-booking forecast consumption, recursive BOM netting, usable stock/holds/reservations, batch sizing, saved rich run/pegging/cost/hour output, shortages, atomic Make conversion and Buy-to-Finance draft. Open: MPS period grid, dated site-specific purchase/transfer supply, action-message taxonomy, time fences, CTP and scenario publication. |
| 44–56 | Finite scheduling/Gantt/cascade/locks | Finite eligible-machine release and Gantt moves using shifts/downtime; reviewed atomic cascades, locked work and stale fingerprints; forced overlaps refused. Open: backward and multi-constraint finite scheduling, setup-family optimization, material/skill/tool gates and fine drag precision. |
| 57–60 | Production orders/lifecycle/readiness | Guarded production lifecycle and release-generated routing work. Open: complete materials/capacity/tool/document readiness review. |
| 61–65 | Staging/reservation/issues/consumption | Six-decimal measured stock, physical FEFO/expiry/hold eligibility, protected reservations, actual lot/serial material issues and cumulative final-operation backflush are implemented. Actual stock/value/report transaction guards and native checks are being accepted. Open: dedicated production staging/pick task workbench and governed substitutions. |
| 66–68 | Work orders/status/concurrency | Work orders, times, good/scrap counts, optimistic version and request keys. Open: broader exception/reversal acceptance. |
| 69–77 | Floor/partial/backorders/split/merge | Atomic immutable incremental good/scrap reports, finish-short reasons, prior-operation input caps, linked replacement orders and unstarted split orders are implemented; native fractional acceptance pending. Open: controlled merge/reversal, full operator scanning/documents. |
| 78–83 | Lots/serials/genealogy/output/put-away | Actual stock allocation evidence, component-to-output report genealogy and traceability drill-through, serial identity, blocked production holding and partial physical collection are implemented. Historical missing allocation evidence is disclosed. Open: full recursive recall/customer workbench and scan-led put-away. |
| 84–90 | Scrap/yield/rework/co-products/process | Good/scrap capture and recipe yield/scrap calculations. Open: reason taxonomy, rework orders, co/by-product allocation and full batch/formula manufacturing. |
| 91–94 | Subcontract | Recipe supply/cost concept exists. Open: executable vendor operation, shipped components, receipt and actual allocation. |
| 95–99 | Quality/maintenance | Quality/Maintenance owners and machine downtime gates remain. Fractional inspection/holds, atomic inspection quarantine/hold release, conservative overlapping holds and protected collection/transfer/issue are implemented. Open: complete mandatory production inspection gates, all disposition workflows and breakdown-driven calendar replanning. |
| 100–102 | People/labour/tooling | Crew and estimated labour, shared People/rota and planning teams exist. Open: finite skilled labour, attendance actuals and tool reservations. |
| 103–108 | Cost/Finance/WIP | Finance-owned weighted carrying values, reviewed warehouse books/accounts/recipe rates/openings, actual material/time/energy WIP, partial/final output/scrap, transfer value and dispatch COGS are implemented. Estimates use reviewed carrying value/approved purchasing; missing basis is incomplete. Native exact postings acceptance pending. Open: governed standard-cost variances, landed/subcontract/co-product allocations and accounting reversals. |
| 109–117 | Sales/CRM/Inventory/Procurement/Logistics/CTP | Canonical demand/products/stock, Sales handoffs, transactional production output and Buy-to-purchase source link. Open: complete dated supply/change/cancellation reconciliation, transfer/subcontract conversion and protected CTP. |
| 118–127 | Workspace/documents/scanning/progress/alerts | Connected console, Production Today, orders, floor, schedule and progress; source providers/attention. Open: scanning, contextual operator documents and comprehensive delay/schedule notifications. |
| 128–143 | Reporting/saved views | Customer risk, load/capacity, basic production analytics and supplier spend; bookmarkable role/shortcut views. Open: OEE/downtime/yield/material-cost variance/adherence/throughput/WIP/subcontract/genealogy suites and persisted shared reporting views. |
| 144–147 | Attention/activity/commands/events | Registered attention/search/activity, guarded actions and domain events. Open: full durable event/reconciliation coverage. |
| 148–150 | Providers/idempotency/concurrency | Shared Stock contracts, owner module providers, Finance spend/Buy proposal contracts; serializable conversion and version/CAS/duplicate keys. Open: comprehensive cross-module lifecycle contracts and retries/reconciliation. |
| 151–154 | Permissions/audit/reversals | Tenant/capability/module gates, transactional conversion audits, existing execution controls. Open: controlled production material/cost reversals and full exception permissions acceptance. |
| 155–158 | Performance/run/explainability/AI | Identified completed runs, saved explanatory input/output and guarded source access. Open: scale/parallel-run input consistency and deeper performance acceptance; AI remains optional. |
| 159–162 | Design/mobile/demo | New responsive console/report/help follow current Atlas visual direction; synthetic Test scenario. Existing workspaces retained. Open: full detailed-workbench visual consolidation and richer realistic demo packs. |
| 163–166 | Automated/cross-module checks | Current full local suite PASS: 306 files/2,241 tests; 3 files/22 tests skipped. Exact empty central-schema DDL rehearsal and rollback probes pass. Expanded actual candidate/public fractional/partial/mixed/trace/WIP/dispatch acceptance is pending; tests do not close unbuilt engines. |
| 167 | Visual review | Console/report/guides reviewed at desktop/tablet/phone during release acceptance; see exact evidence. Further detailed workspace reviews remain open. |
| 168 | Documentation | Central library grouped by accessible apps and setup/daily/troubleshooting hubs. Canonical Manufacturing working guides include quantities, partial output, mixed loads, traceability, actual costs and blockers; detailed Field Service and handoff instructions. Live guide/layout acceptance pending. |
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

The kiln/forecast upgrade is live on b661051 (11 October): additive timing/resource/
downtime schema applied centrally, exact candidate/public supply acceptance PASS,
including actual routing UI saving, finite execution/stock, flexible forecast saving
and active production/routing/configuration at three widths. See the acceptance
record for full SHA, backups and evidence. This confirms machinery-constrained
forward scheduling and reviewed baseline forecasts; the open process/unit/material/
quality/WIP/CTP requirements above remain binding.

## Next work

Follow the complete seven-part programme in [Manufacturing & Supply](MANUFACTURING.md).
Start with canonical dated site/warehouse/unit/supply inputs; those are prerequisites
for dependable purchase/transfer netting, constraint scheduling and customer promises.
Production cost/WIP is a Finance integration programme, not a renamed spend total.
