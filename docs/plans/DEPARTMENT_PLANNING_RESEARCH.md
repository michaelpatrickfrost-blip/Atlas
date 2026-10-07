# Departmental planning — research and accepted scope

7 October 2026. Michael requested detailed Sales, Customer Service, Marketing and
HR planning, each treated as a distinct planning module with meaningful Atlas
relationships. He then explicitly prioritised completing S&OP first. The current
shared Plan builder is a foundation, not completion of these four workspaces.

## References reviewed

- [Salesforce Sales Planning](https://www.salesforce.com/sales/sales-planning/):
  connected sales planning, territory allocation, quota setting and alignment to
  commercial forecasts. Atlas's Sales plan should explain its target through
  named accounts/territories, team ownership, products, projects/opportunities,
  timing, probability, pricing and actions. Firm orders must consume the relevant
  demand rather than duplicate it.
- [Zendesk WFM documentation](https://support.zendesk.com/hc/en-us/articles/6457209788442-Zendesk-Workforce-management-WFM-resources):
  workload forecasting, staffing/scheduling, workstreams, agent participation and
  performance reporting. Atlas Customer Service planning should connect demand
  volumes, handling effort, team capacity, coverage, service targets, training and
  improvement work to canonical cases/tickets, teams and HR availability.
- [Asana campaign management](https://asana.com/templates/campaign-management):
  campaign briefs, goals, audiences, budgets, channels, milestones, ownership,
  dependencies and multiple execution views. Atlas Marketing planning should
  model the campaign portfolio, detailed delivery calendar, spend and funnel
  assumptions; links to CRM must identify attribution explicitly and avoid
  counting marketing-sourced pipeline again as sales demand.
- [Workday Workforce Planning](https://www.workday.com/en-us/products/human-capital-management/workforce-planning.html/):
  headcount, compensation, skills, talent, organisation design and scenario
  planning. Atlas HR planning should connect current employee capacity to role/FTE
  demand, hiring/backfills, transfers, attrition assumptions, skills/training,
  timing and authorised workforce-cost assumptions, with HR-sensitive access.

## Implementation boundary for the next work

Use one shared Plan foundation for private sharing, versions, periods, targets,
reviews and audit. Give each of the four modes its own typed domain, detailed
workspace, row types, calculations and source integrations; changing a title or
starting template is insufficient. Reuse Party, Product, employees and source
projects. Add explicit actions for creating/editing meaningful planning rows and
link every derived number to its assumptions. Departmental plans feed S&OP through
approved, permission-checked contracts; they do not create duplicate source records
or automatically change execution orders, payroll or campaign sends.

Detailed four-module implementation follows S&OP release and live verification.
