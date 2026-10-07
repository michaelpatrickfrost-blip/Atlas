# Tickets

The implemented multi-department Tickets application is registered at `/tickets`. Customer cases remain in Customer Service; cross-team Queries retain their originating case or ticket. The previous Ticket/TicketQueue design in this document described a disabled prototype and is superseded by the shared `ServiceWorkItem` / `ServiceQueue` implementation.

See [Connected service desk](SERVICE_WORK_DESK.md) for current routes, capabilities, ownership, data model, workflows, limits and migration details, and the preserved [source specification](../plans/CUSTOMER_SERVICE_TICKETS_QUERIES_SPEC.md) for the requested full scope.

Routes: `/tickets`, `/tickets/create`, `/tickets/[ticketId]`, `/tickets/catalogue`, `/tickets/queues`, `/tickets/knowledge`, `/tickets/reports`. Company entitlement/enablement and `tickets.*` capabilities are required. Queues, member assignment, service forms, independent approvals and restricted access must be configured for the company. Configuration never grants a user unrelated business permissions.
