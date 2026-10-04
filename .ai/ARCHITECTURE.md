# Architecture memory map

Desktop software, server data: the Mac app is the Atlas runtime. The server
stores shared data only and must not host Atlas software.

## Required deployment boundary — 3 October 2026

User requirement: Atlas software, UI and application runtime belong on the user's
Desktop/Mac. The remote server stores shared user/business data; it must not host
the Atlas UI or full Atlas application. Apply this to every module, including HR,
CRM, Sales and Manufacturing. A desktop wrapper displaying a remotely hosted Atlas
application does not satisfy this requirement.

Persist user/business records, attachments and backups on the server only. Do not
introduce a local business database, offline record store or persistent business-data
cache. Local software files and minimal connection/session settings are separate
from business records; review browser caches/logs/exports against this boundary.
Transient data needed to display a record is not an authoritative local datastore.

A minimal authenticated data-access service may be needed to protect the remote
database and enforce tenant/capability checks; it must not grow into a hosted Atlas
application. Do not put shared database credentials into the desktop package or
remove server-enforced access controls. The precise data-service/runtime split is
an implementation task, not a claim that the current build already meets the target.

Older hosted-web-app/private-SSH thin-client plans are superseded as target
architecture. Preserve historical deployment evidence, clearly labelled, and inspect
actual runtime/package/network/storage behaviour before claiming compliance.
Do not deploy the Atlas application to the remote server. Any retirement of an
existing remote application must preserve all user data and backups.

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
