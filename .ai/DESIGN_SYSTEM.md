# Design memory map

Current direction (9 October 2026): Home follows Michael's supplied modern
blue-and-white reference. A branded search header sits above grouped app cards
with blue icons and short descriptions. A slim separate utility rail contains
Home, Reports, My tasks, authorised Messages and Settings; it does
not repeat the business apps. On tablet/phone it becomes a compact utility bar.
This supersedes the older no-sidebar rule for Home and Reports. Other workspaces retain
their top menus and the wide Apps switcher from Michael's second 9 October
reference: four desktop columns, More/Company below, grey outline icons and
larger labels; responsive columns, wrapped labels and scrolling on smaller screens.
Workspace Apps/search controls are larger, with phone search on a separate row.
Business navigation contains no Atlas Console/Admin, Connections or platform
return links, including staff support workspaces. The header shows company identity.
Company admin and Manage apps remain permission-filtered business tools.
Attention/goals follow the launcher.
Desktop, tablet and phone layouts require visual acceptance.

Shared typography is Nunito, a rounded modern sans-serif inspired by Michael's
Rensol Rounded reference. Bundled normal/italic variable fonts apply through the
root layout to business apps, sign-in and Admin; Geist Mono remains for code.
See the design system and src/app/fonts/README.md for tokens and licensed sources.

Use [the delivery plan](../docs/IMPLEMENTATION_PLAN.md#design-direction) for the
current direction and [design system](../docs/DESIGN_SYSTEM.md) for primitives,
typography, accessibility and tokens. Inspect src/app/globals.css,
src/components/ui/ and src/components/shell/ before creating another design pattern.
Business-app navigation stays in the main directory and existing app menus;
the Home rail is reserved for workspace utilities.

## Reports (9 October 2026)

Reports is a modern utility workspace at `/reports`, separate from Dashboards.
Use the Atlas blue/pale-blue palette, rounded white panels and responsive top
filters. Keep export disabled for unapplied edits. Native Excel downloads are
explicit user-chosen files; never add business-data caches. See
`docs/modules/REPORTS.md` and `docs/DESIGN_SYSTEM.md`.
