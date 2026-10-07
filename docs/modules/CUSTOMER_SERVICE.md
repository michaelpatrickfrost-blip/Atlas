# Customer Service delivery

## Current release — 7 October 2026

The connected Case / Tickets / Queries release is documented in
[SERVICE_WORK_DESK.md](SERVICE_WORK_DESK.md) and is deployed to the live Atlas
server as required on 7 October 2026. See [live acceptance](SERVICE_WORK_ACCEPTANCE.md)
and CURRENT_STATE for actual checks and remaining extensions. Native-client reads
and evidence transport remain outstanding. The historical runtime wording below
is superseded for the current release.

## Historical foundation — 3 October 2026

3 October 2026. Module id `service`, local application routes `/service/**`.
The [241-section source](CUSTOMER_SERVICE_SOURCE_REQUIREMENTS.md) is preserved
verbatim. [Coverage](CUSTOMER_SERVICE_COVERAGE.md) retains every requirement;
source implementation is not live acceptance or completion of the full brief.

## Ownership and architecture

One case engine handles queries, complaints and other incident types. A case
references Core Party and an optional existing Contact. Priority and severity
remain separate; category and investigative root cause remain separate. Customer
Service owns the customer case; each department owns a distinct child investigation
ticket. Creating or completing a department ticket never transfers case ownership,
resolves the case or silently abandons other dependencies.

Software/UI run in the Mac runtime; persistence runs in the secured central data
service. No local business database, browser storage or offline cache was added.
Generated API allowlists forward commands and secure reads. Tenant-scoped composite
foreign keys protect parent/child/queue/customer relationships. Membership/user
soft references are checked against active company memberships in commands.

## Source foundation delivered

- Service Home, My Work and filterable Cases, Queries and Complaints views. The
  list shows up to 100 newest records; filters narrow the result.
- Quick create with customer and subject; optional intake channel, classification,
  description and contact when starting from a customer. Shared customer search;
  no second customer database. The default type catalogue follows the source.
- Case workspace: Customer Master link, explicit internal/customer communication
  labels, append-only timeline, independent priority/severity, category, root cause,
  customer-update promise, ownership and resolution controls.
- Standard versus restricted cases. Restricted case capability is additional to
  case access; queue membership never bypasses it. Company/entitlement/enablement
  gates apply to commands and service-record read scopes.
- Department queues and members, readable numbering (`CASE`, configurable queue
  prefix), queued/assigned/in-progress/waiting-information/complete/rejected/cancelled
  tickets, separate owners and manually agreed response deadlines. Department-only
  responders see their permitted queue work, investigation brief and parent case
  number, without gaining the case conversation or Customer Master access.
- Department completion requires an outcome; customer-safe summary is separate
  from internal detail. The parent receives response-ready timeline evidence and
  deterministic next action. Rejected tickets remain unfinished dependencies;
  automatic rerouting is not implemented.
- Resolved versus closed; close requires prior resolution and acceptance/reason.
  Formal complaints require root cause before closure. Open department work blocks
  resolution, closure and cancellation until explicitly completed/cancelled.
  Reopening requires a reason; a recorded customer contact after resolution reopens
  the case and increments the count. Closed cases must be explicitly reopened.
- Order and Product links retain identifiers and read current permitted source
  records. Order link validation checks the same customer; source permissions
  gate linking/display. The picker shows 30 recent customer orders/100 products.
  Invoice/Shipment/Returns/Finance links await their owning modules.
- Shared Customer Master overview contribution, permission-aware case search,
  overdue customer-promise attention and an Analytics catalogue metric for cases
  opened, grouped by current type, with tenant/security scope.
- Version checks reject stale case/ticket changes. Resolution/dependency commands
  use serializable transactions. Audit, safe customer activity and append-only
  events are committed with mutations. Durable DomainOutbox events contain IDs,
  not complaint content. No background dispatcher/consumer is installed.

Communication forms log customer contact, internal notes or updates already made
outside Atlas. They do not send emails, deliver portal messages or claim receipt.
The next-action signal uses logged updates, completed department responses,
customer promises and internal due dates. Deadlines entered as UTC are displayed
in Europe/London; they are not business-hours SLA or OLA policies.

## Remaining source phases

1. Finish Case core: server-only attachments, drafts/autosave, multiple contacts,
   typed source links, communication delivery with immutable recipient/channel
   audit and inbound email/API idempotency. No generic task engine is duplicated.
2. Finish departmental work: ticket types/forms, membership removal/rerouting,
   validated source context, OLA policies/calendars and response attachments.
3. Routing, configurable milestone SLA engine, pause/resume calendars, warning/
   breach events, escalations, capacity and supervisor views.
4. Configurable complaint workflows, formal resolution policies, corrective-action
   links, authorised Returns/Finance/Quality integrations and recovery approval.
5. Knowledge versions, approved response templates/macros and audited automations.
6. CSAT/surveys, invitations/delivery/response rate and negative-feedback recovery.
7. Certified time/ratio/cost metrics, OLA analysis, control tower and service health.
8. Customer portal, self-service, proactive work, major incidents and mass updates.
9. Source-transparent assistive AI with validated ERP facts and human review.

These phases preserve the order in sections 221–229. They are not hidden behind
placeholder navigation or presented as operational integrations.

## Activation and evidence

Live foundation activated on 3 October 2026. Installed Mac package:
`/Users/michael/Applications/Atlas.app`; synchronized private data release:
`/opt/atlas-test/data-releases/service-core-r3-20261003`. The remote service exposes
health and secured data APIs; `/service` and `/service/cases` return 404 remotely.
Native inspection verified signed-in Service Home, Queues and New Case on local
port 13200. No native form write is claimed from that inspection.

Server-only backup: `/var/backups/atlas-test/pre-service-core-20261003`, including
actual-schema.dump and previous release evidence. Migration deploy found Service
already applied by concurrent work; this task verified it and applied runtime
privileges, including SELECT/INSERT-only Service history. Operator activation
`deploy/enable-service.mjs demo demo@atlas.app` enabled and entitled the existing
workspace and added Service capabilities only to its single existing admin role.
Existing customer/source permissions were preserved; other users need deliberate
grants and queue membership.

`deploy/check-service.mjs` passed against private preview and live port 3100:
synthetic central case and two tickets, owner retention, incomplete-dependency
resolution rejection, response-ready history, logged update, resolution/reopening,
stale-version rejection, department/foreign-tenant/restricted access isolation,
query mutation rejection, durable outbox and remote UI absence. Synthetic fixtures
were removed on the server. Native packaging/signature verification and synchronized
production builds passed; detailed check counts and limits are in CURRENT_STATE.
Communication delivery and full complaint-closure acceptance remain unverified.

The packaged snapshot preserves other modules present at capture time; later
concurrent changes are not certified by this release. Finish phases 1–2 and their
remaining acceptance before claiming the complete source brief is delivered.
