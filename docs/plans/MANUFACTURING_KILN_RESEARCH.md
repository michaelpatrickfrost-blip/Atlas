# Manufacturing and kiln planning — 11 October 2026

Michael requests a complete, flexible manufacturing/MRP product suitable for clay
production, including different eligible kilns, machinery, stock execution, Sales
orders, future forecasts and Sales/S&OP plans. No research into Hepworth Clay was
undertaken. The intended price/quality ambition does not establish commercial
readiness or close the existing 173-section acceptance programme.

## Primary research and resulting requirements

| Source | Requirement applied to Atlas |
| --- | --- |
| [Microsoft finite capacity](https://learn.microsoft.com/en-us/dynamics365/supply-chain/master-planning/planning-optimization/finite-capacity) | Capacity has to constrain executable dates. An infinite routing estimate cannot be represented as a feasible customer promise. |
| [Microsoft forecast reduction](https://learn.microsoft.com/en-us/dynamics365/supply-chain/master-planning/reduction-keys) | Explain how orders consume forecasts. Atlas uses monthly total demand less gross bookings, then adds outstanding firm demand; shipped bookings remain consumed. |
| [Microsoft capability-based scheduling](https://learn.microsoft.com/en-us/dynamics365/supply-chain/master-planning/planning-optimization/capability-based-scheduling) | Eligible equipment must be explicit. Atlas now supports approved per-operation machine alternatives with one common cycle/timing contract. Generic capability scoring remains open. |
| [Microsoft job scheduling](https://learn.microsoft.com/en-us/dynamics365/supply-chain/production-control/job-scheduling) and [operations resources](https://learn.microsoft.com/en-us/dynamics365/supply-chain/production-control/operations-resources) | Sequence, capacity reservations and resource calendars are different facts. Preserve dependencies and fixed work, validate the whole move and commit it atomically. Skilled labour/tool constraints need their own owner facts. |
| [Odoo work centres](https://www.odoo.com/documentation/19.0/applications/inventory_and_mrp/manufacturing/advanced_configuration/using_work_centers.html) and [manufacturing](https://www.odoo.com/documentation/19.0/applications/inventory_and_mrp/manufacturing.html) | Work-centre setup, alternatives, calendars, shop-floor execution and planning are connected workflows. Merely adding equipment labels is insufficient. |
| [European Commission ceramic manufacturing reference](https://bureau-industrial-transformation.jrc.ec.europa.eu/reference/ceramic-manufacturing-industry) | Clay preparation, forming, drying and firing need distinct process areas and routings. Kiln cycle/cooling and product compatibility matter. This research reads the reference page, not the linked BREF PDFs, and makes no claim of plant-specific parameters or environmental compliance. |

## This implementation checkpoint

- One shared operation-time function serves recipes/costs, MRP and release.
  Per-unit throughput and batch/load cycles are explicit. A partial load reserves
  a full cycle, cooling occupies the equipment and transfer wait delays the next
  operation. Zero crew supports unmanned cycles. Each approved alternative uses
  these same product timings; machine-specific alternative timings are not built.
- Plant configuration distinguishes batch/continuous kilns, dryers, forming and
  packing. Equipment uses configured weekly shifts or explicit 24/7 operation,
  with an IANA timezone and audited maintenance/downtime exclusions. Existing
  machines retain continuous calendars for compatibility; new UI entries default
  to shifts. Overnight shifts and UK daylight-saving transitions are handled.
- Release selects the earliest-finishing eligible machine and reserves complete
  elapsed spans. Batch work is uninterrupted; per-unit work can span shifts while
  retaining the machine booking. This is conservative serial forward scheduling,
  not parallel mixed-product kiln-load packing or a global optimization solver.
- Schedule review rechecks calendars, downtime, all affected operations and other
  reservations inside serializable isolation. Fingerprints reject stale reviews;
  fixed/running/completed work cannot be displaced. Force-overlap is removed.
  Seven-day machine capacity cards distinguish calendar, booked and downtime
  hours and expose existing downtime conflicts. Adding downtime preserves already
  booked work for deliberate review, rather than silently changing production.
- Sales-owned requested-demand history feeds a reviewed six-month workbench.
  Recent 3/6-month averages and same-month-last-year compete on the same recent
  holdout months. WAPE, signed bias, sparse/short-history warnings and source-date
  warnings stay visible. This is transparent baseline forecasting, not a claim of
  probabilistic ML, causal promotion/weather modelling or calibrated confidence.
- Planners can choose last year's same month plus 10%, any valid percentage,
  add/subtract a quantity, a recent average, saved forecast or fixed monthly
  target, then override individual months. Formula: max(0, base × (1 + %/100)
  + addition). Zero is a valid target; missing history stays missing. Save records
  assumptions and final reviewed quantities. A refreshed source is required when
  Sales/forecasts change. Approved S&OP rows must be revised by S&OP.
- Both MRP entry points and expected-usage fallback consume gross monthly orders,
  including shipped units, once. Existing Make/Buy proposal review, procurement
  drafts and final-operation transactional stock posting remain in their owners.
  Out-of-sequence starts, current downtime, unavailable machines and another
  running operation are rejected. Fractional component consumption is rejected
  under the existing whole-unit stock contract rather than silently rounded.

## Remaining operational gates

| Area | Required next implementation and acceptance |
| --- | --- |
| Canonical quantity/supply | Decimal stock and Sales execution, dimension-safe entered/base unit conversion, dated warehouse/site receipts, transfers and subcontract supply; cancellation/reschedule reconciliation. Current aggregated supply cannot support dependable CTP. |
| Process manufacturing | Formula/mass balance, moisture/shrinkage, machine-specific cycle/temperature profiles, mixed-product kiln/car loading, campaign/setup-family sequencing, co/by-products, rework and drying/firing intermediates. |
| Readiness/execution | Production-specific stage/pick/reserve and actual material issue, partial output, split/merge/backorders, controlled overconsumption, reversals and scanner flows. Current backflush is one final stock transaction. |
| Quality/traceability | Inspection release gates, sampling/test records, accepted/rejected output disposition and full raw-material → kiln load → finished-lot genealogy. |
| Finite planning | Dated materials, skilled People capacity, simultaneous tooling/labour reservations, energy/car constraints, backward scheduling, frozen fences and isolated scenarios. Current release constrains machinery calendars only. |
| Cost/Finance | Approved effective cost versions, actual labour/energy/overhead capture, WIP/variance/COGS/valuation reconciliation. Supplier spend does not establish production cost. |
| Forecast/S&OP | Families/site/customer segments, hierarchy reconciliation, configurable forecast horizons/consumption windows, approved scenarios, promotion overlays, uncertainty/backtests at scale and Sales plan input publication. Existing approved S&OP publication remains separate from manual forecast saving. |
| Equipment/integrations | Machine telemetry/PLC connections, breakdown events and owner-controlled Maintenance/Quality/People contracts. Manual downtime does not establish an equipment integration. |
| Product delivery | Full detailed-workspace design consolidation, realistic configured plant acceptance, performance/load evidence, restore rehearsals and support/operations readiness. No customer-specific setup or production data is invented. |

Keep [coverage](../modules/MANUFACTURING_COVERAGE.md),
[module guide](../modules/MANUFACTURING.md) and shared current state aligned.
Actual checks, migration/deployment and browser evidence are recorded there;
implemented source alone is not a live acceptance result.
