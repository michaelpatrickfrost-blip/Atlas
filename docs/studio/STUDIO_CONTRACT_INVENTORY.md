# Studio contract baseline

Inspected 9 October 2026 at starting revision af030b0. This inventories existing
contracts for progressive migration; it does not certify domain completeness.

`src/core/modules/types.ts` retains all provider contracts. New `studio` bundles
are additive. Only template providers are adapted in the first workstream.

| Existing manifest surface | Owning Core contract | Migration state |
| --- | --- | --- |
| attentionProvider, searchProvider, customerOverviewProvider, staffRosterProvider | modules/types | Retained |
| recordContextProvider, recordRelationshipProvider | relationships/types | Retained |
| templateContextProvider | templates/types | Adapted to typed template/list/get descriptors |
| analyticsProvider | analytics/types | Retained |
| businessPlanningProvider, planningPublicationConsumer | planning/business and manifest signature | Retained |
| planningDemandProvider, planningInventoryProvider | planning/types | Retained |
| stockProvider, stockReplenishedConsumer, fulfilmentProjectionProvider, salesLogisticsConsumer | logistics/types and manifest signature | Retained |
| salesInvoiceQuantitiesProvider, salesInvoiceChainProvider, salesFinanceSourceProvider, salesFinanceProjectionProvider, financeReceiptConsumer | finance/connections and manifest signatures | Retained |
| salesInvoiceGenerator, salesCancellationGuard, deliveryInvoiceConsumer | manifest and finance/handoff | Retained |
| expensePostingSourceProvider | finance/expense-source | Retained |
| serviceOrderProjectionProvider, serviceCreditProvider, serviceOperationProvider, serviceSurveyConsumer | service-work/connections and manifest signatures | Retained |
| safetyProvider | safety/types | Retained |
| widget | modules/types | Retained optional UI extension |

Canonical event names are `DOMAIN_EVENTS` in `src/core/events/bus.ts`. Existing
AutomationEvent persistence and the registered event sink feed the current
Automations engine; DomainOutbox separately retains transactional business events.
No durable event-schema registry, dispatcher migration or workflow engine is
introduced during contract hardening. These belong to later phases. This inventory
must not turn legacy events into a claim of reliable transactional delivery.

Adapter IDs are `<owner>.template.<source>`, plus `.list` and `.get`, version 1.
CRM, Sales, Projects and Customer Service remain owners of their record visibility
and merge-field whitelist. General template fields are confidential. No bank/HR
reveal fields or protected mutations are exposed by this adapter. Existing template
sources cap lists at 200; the adapter validates that bound and internal record links.

Hash/reference compatibility is conservative: labels may change; schemas, owner,
capability, classification and execution policy changes require retaining the old
version or republishing compatible dependent definitions. Later metadata provides
the active dependency scan; no active Studio definitions exist at this checkpoint.
