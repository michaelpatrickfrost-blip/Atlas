# Atlas project memory

Atlas is a modular ERP/business operating system. The repository is the shared
memory for Claude Code, Codex and Cursor; chat history is not required to continue.
This file is the canonical context entry point. Detailed topic truth stays in the
linked docs and implementation, rather than being copied into multiple handbooks.

## Product principles

- Complexity underneath, simplicity on screen; connected workflows over isolated features.
- Shared identities and business logic; never duplicate customers or products per module.
- Premium, calm enterprise UI with clear hierarchy and useful reporting.
- Configurable dashboards; desktop, tablet and phone are supported targets.
- A catalogue entry, schema or navigation link is not a completed business workflow.

## Read next

- [Current state](CURRENT_STATE.md): handoff, evidence, gaps and next priorities.
- [Decisions](DECISIONS.md): lasting constraints and their reasons.
- [Architecture](ARCHITECTURE.md): ownership, security and technical documentation map.
- [Modules](MODULES.md): registered foundations, planned apps and delivery sources.
- [Design](DESIGN_SYSTEM.md): current direction and implementation references.
- [Agent instructions](../AGENTS.md): commands, repository rules and update protocol.

## Keeping memory useful

Keep stable product context here, current handoff facts in CURRENT_STATE.md,
and decisions with rationale in DECISIONS.md. Detailed acceptance checklists belong
in docs/IMPLEMENTATION_PLAN.md and module delivery maps. Inspect code before relying
on a status claim; record check dates and failures honestly. Resolve contradictions
in the relevant source document rather than adding competing copies of the same fact.

Every task that changes project files must pass the mandatory memory update gate
in AGENTS.md before handoff, commit or PR, including minor fixes and documentation.
Update CURRENT_STATE.md each time; update decisions/topic docs when affected.
Read-only work records newly confirmed issues or corrected facts. Memory updates
are agent responsibilities, not a background service that observes arbitrary edits.
