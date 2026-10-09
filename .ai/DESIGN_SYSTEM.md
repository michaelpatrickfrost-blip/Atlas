# Design memory map

Current direction (9 October 2026): Home follows Michael's supplied modern
blue-and-white reference. A branded search header sits above grouped app cards
with blue icons and short descriptions. A slim separate utility rail contains
Home, authorised Reports, My tasks, authorised Messages and Settings; it does
not repeat the business apps. On tablet/phone it becomes a compact utility bar.
This supersedes the older no-sidebar rule for Home only. Other workspaces retain
their existing top menus and Apps switcher. Attention/goals follow the launcher.
Desktop, tablet and phone layouts require visual acceptance.

Use [the delivery plan](../docs/IMPLEMENTATION_PLAN.md#design-direction) for the
current direction and [design system](../docs/DESIGN_SYSTEM.md) for primitives,
typography, accessibility and tokens. Inspect src/app/globals.css,
src/components/ui/ and src/components/shell/ before creating another design pattern.
Business-app navigation stays in the main directory and existing app menus;
the Home rail is reserved for workspace utilities.
