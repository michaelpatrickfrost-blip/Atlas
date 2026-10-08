# Atlas system map

Inspected 8 October 2026 against live source `5741196`, then the changes recorded
in `.ai/CURRENT_STATE.md`. This is a source assessment, not certification of every
workflow. Full supplied requirements: [master brief](requirements/ATLAS_MASTER_SYSTEM.md).
Michael requests continuous implementation and deployment, without phase sign-offs.

| Concern | Existing authority / implementation | Confirmed limits |
| --- | --- | --- |
| Frontend | Next 16.3.8 App Router, React 19, TypeScript, Tailwind; `src/app/`, `src/components/ui/` | Large compressed record pages; inconsistent contextual navigation |
| Application/backend | Server actions; `src/modules/*/services`; registry contracts in `src/core/modules/types.ts` | Several cross-module ORM reads and Core-to-module dynamic imports |
| Persistence | PostgreSQL, Prisma 7.10 adapter singleton; `prisma/schema.prisma`, additive migrations | Source schema is not proof that a workflow is implemented |
| Remote desktop | `src/server/data-api`, `src/core/desktop`, generated action/model contracts | Preserve browser and central service compatibility |
| Auth/security | Signed httpOnly session, tenant-scoped queries, capability strings, company app entitlements | Read models need field-level checks as well as page checks |
| Events/jobs | `core/events/bus.ts`, `sink.ts`, `core/scheduler/tick.ts`, Automations event log; Sales DomainOutbox | Automation event log and Sales outbox are different paths; atomic business delivery needs review |
| Audit/activity | `core/audit`, `core/activity`, Echo; immutable Finance evidence | Business activity and audit remain distinct |
| Documents | Core Templates/contracts, record documents and private Service evidence; domain attachments | Storage/access paths are not yet one shared document service |
| Work/approvals | Core approvals; Projects tasks; ServiceWorkItem; attention aggregation; profile My work | No universal typed task/approval/exception/notification queue |
| Search | `core/search/aggregate.ts`, module providers, Cmd/Ctrl K | Global slice of 20 can starve later groups; not all entity types searchable |
| Imports/exports | Customer/Sales CSV, setup import, Finance bank import, company handover | Validation and preview UX differ; keep filter/permission semantics |
| Reporting | Analytics providers/catalogue, Studio, module reports, Plan/S&OP | Repeated quantity and metric definitions need convergence |
| Operations | VPS `/opt/atlas`, systemd Atlas and Guardian, HTTPS `atlassystem.online` | In-place builds can interrupt requests; release locking exists |
| Testing | Vitest, domain/security suites, server-only synthetic acceptance, Chromium | Integration skips and module delivery gaps are explicit |

Domain ownership: [domain map](atlas-domain-map.md). Evidence and ranked findings:
[technical debt](atlas-known-technical-debt.md). Existing detailed inventory remains
[System wiring](SYSTEM_WIRING.md); do not maintain competing schema lists by hand.
