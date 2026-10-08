# Design memory map

Current direction (8 October 2026): no sidebar. After sign-in, Home leads with
labelled app icons in a responsive grid, grouped by area, with soft colour and
clear keyboard focus. Attention and goals follow the launcher. The top bar's Apps
menu keeps a compact list using the same permission-filtered directory. White
workspaces, blue accents, separate app top menus, small type, hairline borders
and consistent spacing remain. No greetings, slogans or marketing panels.
Desktop, tablet and phone layouts require visual acceptance.

Use [the delivery plan](../docs/IMPLEMENTATION_PLAN.md#design-direction) for the
current direction and [design system](../docs/DESIGN_SYSTEM.md) for primitives,
typography, accessibility and tokens. Inspect src/app/globals.css,
src/components/ui/ and src/components/shell/ before creating another design pattern.
The older design document's Sidebar section describes a previous shell; it must not
be used to reintroduce a permanent sidebar over the current launcher/top-menu design.
