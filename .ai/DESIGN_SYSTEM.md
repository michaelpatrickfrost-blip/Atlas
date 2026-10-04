# Design memory map

Current direction (4 October 2026): no sidebar. The home screen is the launcher —
apps as short named columns by area, not tiles or rows of cards — and the top bar's
Apps menu shows the same list everywhere else. Plain wording: no greetings, slogans
or marketing panels. White workspaces, blue accents, separate app top menus, small
type, hairline borders, consistent spacing and clear active states. Dense
business information should remain calm; avoid excessive cards and decorative icons.
Desktop, tablet and phone layouts require visual acceptance.

Use [the delivery plan](../docs/IMPLEMENTATION_PLAN.md#design-direction) for the
current direction and [design system](../docs/DESIGN_SYSTEM.md) for primitives,
typography, accessibility and tokens. Inspect src/app/globals.css,
src/components/ui/ and src/components/shell/ before creating another design pattern.
The older design document's Sidebar section describes a previous shell; it must not
be used to reintroduce a permanent sidebar over the current launcher/top-menu design.
