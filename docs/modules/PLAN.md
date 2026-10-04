# Plan

3 October 2026. Plan is the connected planning layer at `/plan`. Production Planning at `/planning` remains the product-demand and stock-coverage workbench.

## What a plan holds

A plan has a purpose, owner, period, measures, a working forecast and, once approved, a baseline that later forecast edits do not change. People can add assumptions, drivers, goals, initiatives, actions, risks, dependencies, decisions, notes, reviews and scenarios.

Measures use the governed catalogue in `src/modules/plan/domain/catalogue.ts`. A search that matches more than one measure asks for a choice. Plans do not invent a second definition of revenue.

## Actuals

Actuals are read when the source app is enabled and the user can read it. Sales orders, pipeline, service cases, employees, shipments, stock and manufacturing orders supply the figures they actually store. CSAT, cash and labour cost stay as figures entered on the plan. A live production comparison is not copied unless someone imports rows or enters them.

## Scenarios and connections

A scenario starts as a private copy. A percentage change scales another measure only when that plan has a kept connection, and only by the share on that connection. A loop is refused. Two different results for one measure are shown as a conflict, not averaged. Promote writes the working forecast. The approved baseline stays as it was.

## Who can see a plan

A new plan is private to the person who created it. They can share it with named people, as view or edit, or with everyone who can open Plan. People do not see another person's plan unless it is shared with them or shared with the company. Plans that already existed when sharing was added stay visible to the company. Sensitive plans still need `plan.sensitive.read`. Share a plan with the approver before submitting it.

Sales plans carry the revenue number plus the territory, product, account, new-business, price and activity detail, quotations, and pipeline coverage: open pipeline divided by the revenue still to reach the plan. Marketing plans start with a brief and dated actions for the brief, the spend, the launch and the review. Goals, phases and actions with dates draw on a timeline. Notes and updates sit on the plan. A phase can be opened as a project; a private plan opens a private project.

## Permissions

`plan.read`, `plan.create`, `plan.edit`, `plan.submit`, `plan.review`, `plan.approve`, `plan.lock`, `plan.scenario.create`, `plan.scenario.share`, `plan.metric.manage`, `plan.model.manage`, `plan.sensitive.read`. Sensitive plans are omitted from reads without `plan.sensitive.read`. Private scenarios are visible to their owner, and to people who can share or approve scenarios. A view share can read, submit, review and approve. Editing the plan needs the owner, a company share, or an edit share, plus `plan.edit`.

## Not in this version

Natural-language creation, a formula language, cell-by-cell write permissions, automatic rolling periods, currency conversion, alerts, and generative changes to an approved plan. Plan does not post to Finance, change a manufacturing schedule, or create a second task system. Detailed execution opens an Atlas project.
