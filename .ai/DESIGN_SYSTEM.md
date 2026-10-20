# Design memory map

**Current direction (20 October 2026): Macro-inspired.** Warm paper background
(#f3f0e9) with a left icon rail and one hairline-bordered workspace panel
(#eeebe4); cards #faf9f6 with #dfdbd2 hairlines and almost no shadow; ink
#1b1a17 primary buttons (9px radius), bronze #94693d for links/highlights;
monochrome 1.5px line icons; Newsreader serif for page titles, Inter for UI;
small grey sentence-case labels instead of uppercase eyebrows; underline record
tabs. Tokens and overrides live in src/app/macro.css (loaded last). The older
"no sidebar" and pearl/sapphire notes below are superseded.


Current direction (14 October 2026): a consistent premium light interface across
all apps. Pearl backgrounds, navy hierarchy, sapphire glass-like action buttons,
muted coloured icon tiles and fine borders/shadows. Home has an editorial heading,
numbered app groups and individual luminous cards; the light utility rail stays
separate from business apps. Tablet/phone retain labelled utility controls. The
compact Apps popup remains up to900px, with every authorised app visible without
internal scrolling. Menus are solid white. Workspace headers remain60px desktop/
96px phone. Shared `src/app/premium.css` layers over foundational globals; use
`app-appearance.ts` for consistent app icons and `PageMotion` for240ms navigation
without resetting mounted drafts. Reduced-motion preferences take priority.
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
