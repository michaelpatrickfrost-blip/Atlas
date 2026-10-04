# Audit and Echo

Audit is the manager view of recorded changes. Echo is the conversation on a customer, order, quotation or call-off.

## What is mapped

Every `AuditEntry.action` is placed on a system in `src/core/audit/systems.ts`. Customers, Sales, CRM, Pricing, Products, Inventory, HR, Scheduling, Planning, Manufacturing, Logistics, Finance, Projects, Customer service, Marketing, Goals, Chat, Echo and Company each have a prefix list. An action that matches none of them stays in **Not yet classified** and is still shown. Add a prefix there when a new system starts writing audit rows.

The activity page reads the existing audit rows. It does not copy them into another store.

## Who sees activity

- `core.audit.read` sees the whole company and can narrow to a team, a person or an area.
- `audit.team.read` sees the signed-in person, employees who report directly to them, and members of work teams they manage.
- Company administration → Audit access assigns a person to one or more areas (Sales, Finance, and the other systems on the map). That person sees recorded changes in those areas. Several areas can be ticked for the same person.
- The same page has a company switch, **People can see their own activity**. When it is on, each person can open Audit and see only the changes they recorded. It does not show other people's changes.
- Turning Audit off for the company removes area grants and own activity as well as the other audit permissions.
- Project-restricted audit rows still follow the existing project visibility rules.

The activity page searches people, changes and areas. Download report saves the current search and filters as a CSV. The file has when, person, area, change and a short summary. Bank, token and password fields are not included. Open Echo follows the record when the entity has a known page.

## Echo

Echo opens from the customer, sales order, quotation and call-off. A note stays on that record. Tagging a colleague creates a mention. Home shows it while the Audit app is enabled and the person can open that kind of record. The Echo tab lists those pointers. The bell beside chat lists unseen tags, and anything assigned, and each one can be opened or cleared.

`echo.read` opens the panel and the inbox. `echo.write` posts a note. The note body is not copied into the audit payload; the audit row records that a note was added and how many people were tagged.

## Activation

The app id is `audit`. Enabling it does not grant Echo or team audit to every profile. New companies receive the capabilities on the standard manager and sales roles. An existing company administrator is granted them only by an explicit activation of that membership.
