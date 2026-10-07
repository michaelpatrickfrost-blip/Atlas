# Architecture memory map

## Standing deployment requirement — 7 October 2026

Michael explicitly requires Atlas and every finished app change to be deployed to
its live server at https://atlassystem.online (85.190.118.218). Server deployment
and live feature verification are required before completed handoff, not optional
follow-ups. This supersedes the earlier Desktop/Mac-only and data-only-server
deployment instructions, including the earlier 7 October restoration. A Mac-only
installation does not satisfy this requirement. Use docs/DEPLOY.md.

Preserve central records/backups, existing tenant and capability checks, secrets
and profile permissions. Build and verify the compatible release; report concrete
blockers honestly. Do not deploy unrelated unfinished edits or create local
business databases/caches. Preserve historical deployment evidence.

Canonical detailed sources:

- [Architecture](../docs/ARCHITECTURE.md): Core + Modules and request flow.
- [Module specification](../docs/MODULE_SPEC.md): registration/provider contracts.
- [Customer Master](../docs/CUSTOMER_MASTER.md) and [data model](../docs/DATA_MODEL.md).
- [Permissions](../docs/PERMISSIONS.md): capabilities and tenant boundaries.
- [Local development](../docs/LOCAL_DEVELOPMENT.md): runtime and database commands.

Core owns platform concerns and canonical Party/customer identity. Modules own
business capabilities and relate records to shared identities. Products and Pricing
are business-wide apps backed by shared catalogue/pricing services. CRM owns
relationship/pipeline work; Sales owns quotations and commercial orders.

Core must not import module internals; src/core/modules/registry.ts is the wiring
exception. Integrate through declared providers/events. Tenant scope and capabilities
are enforced server-side. Follow AGENTS.md before writing mutations, and read the
installed Next.js guides before application code changes. Use the generated Prisma
client path and explicit adapter already established in this repository.

Read schema/services for current behaviour. Documentation disagreement is a prompt
to investigate, not permission to redesign established architecture.

Implementation/build contract: [desktop software and central data](../docs/DESKTOP_DATA_BOUNDARY.md).
Read CURRENT_STATE.md for live activation status; installed bundle and server cutover
are separate checkpoints while an unsaved original Atlas window remains open.

- [System wiring and gaps](../docs/SYSTEM_WIRING.md): inspected runtime/module connections, source route and schema-relation inventories, and installed acceptance checklist (4 October 2026).
