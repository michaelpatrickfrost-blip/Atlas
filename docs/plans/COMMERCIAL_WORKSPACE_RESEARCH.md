# Customers, Sales, CRM and Marketing workspace refinement

Research reviewed 9 October 2026. These patterns guide the implemented refinement;
they do not imply complete feature parity or an external integration.

| Primary source | Useful pattern | Atlas implementation |
| --- | --- | --- |
| [Pipedrive activity calendar](https://www.pipedrive.com/en/features/activity-calendar) | Calendar and agenda, activities linked to commercial records, preparation and completion | CRM Appointments: weekly diary/agenda, customer/prospect/deal links, owner, location, preparation, reschedule, completion outcome and retained cancellation |
| [HubSpot record timeline](https://knowledge.hubspot.com/records/filter-activities-on-a-record-timeline?subtype=page_templates) | Account context and notes alongside record activity | CRM Accounts uses canonical Customer Master notes and contacts; Customers presents notes beside its cross-app activity timeline |
| [Salesforce multistep journeys](https://help.salesforce.com/s/articleView?id=sf.mc_jb_create_multistep_journey.htm&language=en_US&type=5) and [split activities](https://help.salesforce.com/s/articleView?id=mc_jb_split_join_activities.htm&language=en_US&type=5) | Connected steps and explicit alternative paths | Customer journey mapper with connected stages, named branch/return paths, stage inspector and touchpoints; automation editor with explicit matched/unmatched destinations |
| [Customer.io true/false branches](https://docs.customer.io/journeys/true-false/) | Conditions represented as two understandable destinations | Event-based forward branch inputs and previews using Atlas's existing validated, immutable journey versions |
| [Miro customer journey maps](https://miro.com/customer-journey-map/) and [journey template](https://miro.com/templates/customer-journey-map-4/) | Intent, emotions, pain points and touchpoints across stages | Flow view plus experience lanes for customer intent/feeling, touchpoints, friction, improvements and success measures |

## Information structure

Customers opens on a searchable account list. Hierarchy starts with one selected
customer and displays that corporate family and its people; unrelated accounts
are available as linking choices, not chart nodes. CRM Today links into a focused
Appointments diary, canonical Accounts, Prospects and Pipeline. Pipeline search
and missing-next-action filtering help prioritise follow-up. Sales has separate
Orders, Quotations and All sales destinations with existing filters and actions.
Marketing opens on the campaign desk and groups content/channels, people/
permissions and customer journeys into understandable navigation.

## Persistence and safeguards

All work remains in the central server database. Notes share existing Party/Note
identities, restricted-note read rights remain independent of manage rights, and
note/audit writes are atomic. Appointments extend SalesActivity additively with
duration, location, cancellation, version and idempotent request key. Tenant and
CRM owner restrictions, active owners, linked-record permissions, time/overlap
validation and stale-update checks run on the server. London time inputs handle
daylight-saving transitions explicitly. Journey edits are bound to the selected
map and its timestamp, audited and transactionally reject stale or foreign paths.
Historical definitions continue to parse; new experience fields have defaults.

## Integration limits

The visual experience map is a planning tool. Publishing an automation version
uses the existing event/wait/branch/goal/end engine and does not send a message.
Provider choices remain blank per the existing user decision. External calendar
sync, email/SMS delivery, social/advertising execution, public hosted forms and a
background journey worker are separate integration work. Financial results retain
their existing source permissions and currency separation. Planned budgets are
not actual spend. The complete CRM/Marketing source briefs remain partially
implemented; this refinement does not relabel every checkpoint as delivered.

## Acceptance

`scripts/check-commercial-workspaces.ts` exercises actual forms using isolated
central Test companies, blocked external calls/background writes, manager/read/
rep profiles, hierarchy isolation, shared/private notes, appointment lifecycle,
journey details/touchpoints/branch/reorder, automation publication and responsive
layouts. Its exact fixture access is revoked and its records/audit retained.
`scripts/deploy/check-commercial-workspaces.sh` backs up central data, runs that
check against a sealed loopback candidate under both release locks and preserves
the production pointer. Final release and public verification evidence belongs
in `.ai/CURRENT_STATE.md`.
