# Meetings, Maintenance, Engineering, Fleet and Field Service

8 October 2026. Michael requested these five distinct apps. This document records
deployed scope and real remaining integration boundaries. All 62 live synthetic
acceptance assertions pass; see [release evidence](../evidence/2026-10-08-operational-apps.md).

## Meetings — /meetings

Extends canonical Meeting records used by Projects. Shared monthly calendar and
agenda, private organiser/attendee audience, explicit start/end/timezone, project
link, company attendees, agenda and room/Teams URL. Append-only notes, decisions
and owned/due actions with completion history. Organiser edits/close, attendees
contribute; private meetings stay private in Projects and the generic data gateway.
Project visibility remains an independent requirement. Old project meetings keep
legacy default company audience/end-optional behaviour.

Microsoft OAuth confidential app uses state bound to signed-in company/user, ten-
minute expiry, one-use hash and PKCE. Tokens encrypted server-side, never projected
or available through generic model reads. Connect/select editable calendar/manual
import (last 30 / next 90 days, bounded at 100 with no partial import)/disconnect.
Explicit confirmed invitation sends create/update Outlook events, optional Teams,
and include the Atlas notes URL. Stable transactionId guards repeated creation.
Only Atlas-managed invitations can be updated in Atlas: imported invitations retain
Outlook attendee ownership and default to private. Imported schedule refresh leaves
Atlas notes/actions untouched. No automatic webhook/delta/recurrence engine is claimed.
Manual Outlook compose link provides a draft for review; it is not a sent event.
Atlas outcome/cancellation does not cancel a Microsoft invitation automatically.

Microsoft configuration is not present on the live server as inspected this date.
A Microsoft 365 app registration must set server-only ATLAS_MICROSOFT_CLIENT_ID,
ATLAS_MICROSOFT_CLIENT_SECRET, optional ATLAS_MICROSOFT_TENANT_ID; register callback
https://atlassystem.online/meetings/microsoft/callback. Delegated scope:
openid offline_access User.Read Calendars.ReadWrite Calendars.ReadWrite.Shared.
Users then consent through Connections. No credentials in documentation or memory.
Primary API guidance: [Microsoft create event](https://learn.microsoft.com/en-us/graph/api/calendar-post-events?view=graph-rest-1.0),
[calendar change tracking](https://learn.microsoft.com/en-us/graph/delta-query-events).
External provider delivery requires configured credentials/consent and a separate
provider verification; mocks or an Outlook draft are not proof of Microsoft delivery.

## Maintenance — /maintenance

Operational equipment register with code, serial, location, criticality, condition,
service due/interval and notes. Breakdown/preventive/inspection/repair work orders
link exactly one equipment item or Fleet vehicle. Owner/priority/due date, explicit
start/wait/completion/cancellation transitions, findings/resolution, labour and
ongoing/closed downtime. Completed work can set the next service date; changing a
vehicle service date additionally requires Fleet management. Product-linked spare
part record includes quantity and purpose; it does not issue stock or post cost.
Stock withdrawal remains a separate Inventory operation. No unattended service
order generation, sensor feeds, production downtime blocking or predictive engine.

## Fleet — /fleet

Vehicle register, registration/VIN, make/model/fuel, assigned active company driver,
odometer, MOT/insurance/service due dates. Append-only inspection/fuel/service/
repair/trip logs with dated odometer, quantity, currency-specific operational cost
and notes. Odometer cannot decrease. Unsafe inspection sets OFF_ROAD atomically;
return to active is an explicit controlled vehicle edit. Same Maintenance work
orders/service dates appear on vehicle records, guarded by independent app access.
No DVLA/telematics/fuel-card integration or posted Finance cost claimed.

## Engineering / PLM — /engineering

Canonical Product-linked draft design revision, change reason and specification,
private PDF/PNG/JPEG drawing evidence (8 MB maximum; server opaque storage/hash),
independent review/approval and explicit release. Author and last editor cannot
approve their own design. Release supersedes the previously released revision for
the same product under a serializable transaction and partial unique DB index.
Database update guard freezes released content; draft-only drawing insertion and
immutable attachment metadata. Source/product access remains required. No automatic
BOM/routing replacement, CAD authoring/preview, e-signature certification, complex
multi-stage change board, supplier collaboration or production effectivity engine.

## Field Service — /fieldservice

Canonical Party customer and company engineer links, installation/repair/service/
inspection visit, timezone/site/contact/instructions, scheduled window and my-visits
filter. Serializably checked engineer double booking. Mobile job sheet with notes,
travel/on-site/wait/completion/cancellation, findings/outcome/actual labour and
retained history. Completion requires a recorded outcome. Customer overview links
to that customer's service visits. Canonical customer erasure clears copied site,
contact, notes and outcomes and cancels visits; scrubbed sources are not shown.
No customer message, automatic invoice, offline cache, route optimisation, customer
signature or automatic parts-stock issue is claimed by recording a job.

## Architecture and verification

One additive migration, central business records and tenant composite FKs for
record/product/customer dependencies. New namespaces/capabilities registered only
through the module catalogue and standard administrator definitions; app activation
is separate and existing personal grants/denials/customer roles are not rewritten.
Every action requires session/capability/enabled module; versioned guarded writes,
atomic audit plus durable operational-record event. Source access for Products,
Customers, Projects and Fleet remains additional. Shared look/feel uses ModuleSpace,
ActionForm and accessible forms; records remain available through direct links when
bounded list display limits are reached. Generic new model reads remain denied by
default; web workflows use scoped server reads, native/Rust expansion is future.

Tests and exact release/acceptance evidence are recorded in CURRENT_STATE.md.
