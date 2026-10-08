# S&OP usability research — 8 October 2026

Michael: “S&op - I dont even know how to use this - research a good s&OP”.
The existing planning engines remain authoritative; the problem is finding the
right work, understanding the numbers and making an explicit business decision.

## Primary references

- [SAP: what is S&OP](https://www.sap.com/products/scm/integrated-business-planning/what-is-supply-chain-planning/sop-sales-operations.html): an organised sequence of preparation, demand, supply, reconciliation and executive release; shared ERP inputs and comparison against the plan.
- [Oracle: S&OP product tour](https://www.oracle.com/webfolder/s/quicktours/scm/gqt-scm-scp-sop/index.html?goal=scale-support): guided issue resolution and balancing alternatives against business/financial objectives.
- [Kinaxis: S&OP](https://www.kinaxis.com/en/solutions/sales-and-operations-planning): cross-functional discussion and what-if comparison when demand or supply changes.

These are workflow references, not claims Atlas implements their full engines.
No vendor purchase or external data submission is required.

## Confirmed Atlas usability problems

The original overview was blank before a version existed. A new cycle returned
there, while generation landed on an eleven-column demand grid. Setup, seven
unexplained approval rows and all risks/actions/decisions shared one long screen.
Advanced model parameters competed with basic product/plan choices. There was no
first-use explanation, monthly meeting focus, glossary or version-aware next action.

## Implemented response

- Start here: explain purpose, real next action based on cycle/version state,
  four work areas, connected input count, exact-version review progress and follow-up.
- One selected monthly decision brief: forecast/target/gap/assumed margin, quantities
  grouped by unit, uncovered demand and direct evidence/decision links. Whole-horizon
  charts remain behind an explicit expandable detail section.
- Guided Setup: connect accessible plans, choose product codes, optional one-plan
  revenue target, save then generate. Advanced controls keep persisted defaults but
  begin collapsed. Explain refresh, snapshot history and review reset before writing.
- Review questions, evidence links, checklists, owners/due dates and seven real
  version-bound review records. Opening a screen does not approve it. Explicit
  approval and subsequent Manufacturing release remain separate guarded actions.
- Separate Decisions & actions; preserve entry history and completion. Grouped
  navigation, old cycle URL compatibility, honest missing-source recovery.
- How-to guide available without forecast source access, an unsaved numeric example,
  glossary and simple sequence. No hidden example business data or onboarding cache.

## Important boundaries

A source snapshot is not live actuals; matching cycle input revision does not prove
all external sources unchanged. Existing server checks revalidate source access,
Plan signatures and version lineage at approval/publication. Unconstrained demand
is not replaced by supply-covered demand. Unlike units are not summed together.
Unknown supply/margin/targets stay unavailable. Spending budgets are not revenue
targets. Current supply is stock cover, not finite material/machine/labour feasibility.
Stage owner labels describe responsibility and do not grant permissions.

No schema, capability grants, business calculation or publication contract changed.
Only creation/generation/scenario-promotion redirects route to the guided workflow.
The 99-section master brief remains open in SOP.md. Required release is the live
server, with central backups and real workflow verification, not a design-only handoff.
