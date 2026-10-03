# Architecture memory map

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
