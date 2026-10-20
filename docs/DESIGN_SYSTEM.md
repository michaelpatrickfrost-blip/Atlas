# Atlas Design System

> **20 October 2026 — superseding direction:** Atlas uses the Macro-inspired
> system in `src/app/macro.css` (warm paper, hairlines, ink controls, monochrome
> line icons, Newsreader titles + Inter UI, desktop icon rail). Where this document
> describes pearl/sapphire/Nunito styling, macro.css wins. See .ai/DECISIONS.md.


## Philosophy

Precise, bold, quiet, premium, fast. Atlas should feel like a finished product:
a light utility rail on Home, a luminous workspace, icon-led navigation and soft elevated
surfaces. Dense screens stay calm. Company logos live on the organisation and
appear in the shell. Do not invent a second visual language per module.

## 14 October 2026 — Premium platform overhaul

`src/app/premium.css`, imported after `globals.css`, owns the refreshed shared
appearance across business apps, Admin, Studio and authentication. Michael
clarified a bold, posh Apple-like feel: luminous pill buttons and restrained detail. Pearl backgrounds
and navy hierarchy support sapphire glass-like actions, muted coloured app tiles,
fine borders, restrained shadows and consistent control states. `app-appearance.ts`
is a presentation-only map used by the directory, app header and workspace shell.
Home uses numbered groups and individual app cards rather than nested white panels.
The existing registered destinations and capability filtering remain authoritative.
Workspace banners use this same light foundation: Finance and Customer Service
use WorkspaceHeading; Manufacturing, Guides and People share its surface hook.
Avoid isolated dark command-centre banners. Finance entity navigation keeps its
active state in the same light segmented style as record tabs.

`PageMotion` uses Next's bundled React ViewTransition for coordinated content
crossfades and streamed arrivals (260ms), keeping shell chrome anchored. It never
keys or remounts layouts/forms. Unsupported browsers use a 240ms arrival fallback.
Record tabs retain mounted input while their content crossfades. Menus use discrete
display transitions for opening/closing and immediately become inert when closed.
No persistent transform/filter traps fixed overlays after motion completes.
Cards lift only with a fine pointer. Reduced motion disables movement and snapshot
animations; increased contrast strengthens
control boundaries. Status tones retain their meaning independently of app colours.

## Foundation (tokens — `src/app/globals.css` and `src/app/premium.css`)

| Token | Purpose |
|---|---|
| `--color-app-bg` | Near-white page background |
| `--color-surface` | Card/table/panel background |
| `--color-surface-sunken` | Subtle recessed surface (table headers, hover) |
| `--color-border` / `--color-border-strong` | Hairline separators |
| `--color-ink` / `--color-ink-muted` / `--color-ink-faint` | Text hierarchy (deep ink, never pure black) |
| `--color-atlas-blue` | The one interactive/brand colour |
| `--color-status-success/warning/danger/neutral` (+ `-soft`) | Status colour, used meaningfully |
| `--radius-atlas-sm` / `--radius-atlas-md` | Restrained corner radii |

## Typography

Nunito is the shared rounded sans-serif, following Michael's 9 October request
for a modern rounded font in the style of Rensol Rounded. Its normal and italic
variable files are bundled with their SIL OFL licence and loaded through
`next/font/local` in the root layout. `--font-atlas-sans` supplies the Tailwind
sans token and inherited body/control text across business apps, sign-in and
Atlas Admin. Keep existing size/weight hierarchy and Geist Mono for code and
technical identifiers. No runtime external font service is required.

The user-supplied blue ribbon identity (9 October 2026) uses
`public/brand/atlas-logo.png` for the full logo with “Plan. Make. Deliver.” on
sign-in, and `public/brand/atlas-wordmark.png` for compact wordmark placements.
`public/brand/atlas-icon.png` supplies shell branding; `src/app/favicon.ico`,
`src/app/icon.png` and `src/app/apple-icon.png` supply browser/home-screen icons.
The Mac packaging master is `desktop/macos/icon/atlas-icon-1024.png`.
Keep the supplied artwork's proportions; do not squeeze the full lockup into a
small wordmark slot. Page titles are confident (`text-2xl font-semibold
tracking-tight`), body copy readable at `text-sm`, tabular data uses
`font-feature-settings: "tnum"` (set globally on `body`) for aligned numerals.

## Components (`src/components/ui/`)

- **Button** (`button.tsx`) — variants `primary` / `secondary` / `ghost` /
  `danger`. `primary` is reserved for the one primary action on a screen.
- **Card** (`card.tsx`) — use only where grouping genuinely improves
  comprehension (e.g. a module tile on Apps). Not a default page wrapper.
- **DataTable** (`table.tsx`) — the standard table: sunken header row,
  hairline row separators, first-column row link, built-in empty state. Don't
  build bespoke tables per module.
- **StatusPill** (`status-pill.tsx`) — concise label + one of four tones.
  `danger` is reserved for genuine problems — never decorate a neutral status
  in red.
- **EmptyState** (`empty-state.tsx`) — quiet layered surface, title + optional
  description/action. Used for "no data yet", permission-denied and
  not-found states (see `src/app/(app)/error.tsx`).

## Shell (`src/components/shell/`)

- **Home** — premium pearl launcher following Michael's 14 October overhaul request.
  A branded search header, light utility rail and grouped app cards with larger
  muted coloured glass icon tiles and concise purpose descriptions (manifest fallback) replace the compact Home link grid.
  The utility rail contains Home, Reports (built-in data workspace), My tasks,
  Messages (chat permission) and Settings (company-admin access). It does not
  repeat the apps. Tablet/phone use a compact utility bar. This supersedes the
  older no-sidebar rule on Home, Reports and Messages.
  `AppDirectory` still uses `getNavigableModules` for both the launcher and workspace
  Apps menu; counts reflect authorised entries. App labels/descriptions wrap and
  keyboard focus remains visible. Attention/goals stay below the app directory.
- **Workspace Apps menu** — Michael's 10 October correction uses a compact,
  wider popup with every authorised app visible without internal scrolling.
  Up to 900px wide, it uses four desktop columns, three tablet columns and three
  phone columns with compact labels/icons. Phones place it below the full header.
  The workspace header is 60px on desktop, with restrained 36–40px controls;
  phone search stays on a second row within a 96px header. Escape returns focus to Apps; outside clicks,
  chosen links and route changes close it. All entries retain server permission
  and app-availability filtering. Atlas Admin/Console and Connections are absent
  from both business directories, including staff support workspaces.
- **Atlas Admin** — separate blue/white platform console using the same ribbon,
  wordmark, font and blue interaction colour. A light Admin navigation rail becomes
  a scrollable, labelled bar on tablet/phone. Active sections and selected-company
  setup tabs remain explicit. Business launcher/search/chat/notices/My work are
  absent; staff identity and sign-out remain. Routes use their own `(admin)` group.
- **Topbar** — Home, Reports and Messages use the Atlas ribbon mark, wordmark/tagline, search, notices, chat,
  company identity/date, profile and sign-out. Other workspaces retain home,
  Apps, back, search, new window, notices, chat, profile and sign-out.
  Company identity has no Admin badge or platform-console return link.
  Workspace controls use a compact glass Apps button and inset search field. On phone search
  moves onto its own header row so utility controls remain reachable.
  `public/brand/atlas-mark.png` is a crop of Michael's supplied artwork.
- **Messages** — compact native right-hand drawer with a list/detail Back flow,
  one pane at a time on phone, quiet date separators and structured record cards.
  A horizontal composer groups attachments/work actions; conversation details
  contain participants and records in the displayed messages. Full `/chat` uses
  the Home utility shell. See [Messages](MESSAGES.md).
- **CommandPalette** — ⌘K / Ctrl+K. Debounced query against `/api/search`,
  which aggregates navigation matches and each module's `searchProvider`.

## Tables

Comfortable density, sortable-ready column model, row click via first
column, a single place for per-row actions (avoid permanent action buttons on
every row — add an overflow menu when a module needs more than a row link).

## Status language

Use existing words: Draft, Sent, Approved, Paid, Overdue, Active, Blocked.
Pick `tone` deliberately per `StatusPill` usage — see `STATUS_TONE` maps in
the Sales quotes/orders pages for the pattern.

## Motion & accessibility

Dropdown menu panels use an opaque white background with a subtle border and
shadow. Page text must not show through open menus; do not rely on backdrop blur
for readability. The shared `.atlas-float-dropdown` style applies to app navigation
groups, including Manufacturing & Supply's Demand and Materials menus.
On phones/tablets, app-navigation menus span the available width below the complete
navigation bar with 16px side insets. At 1024px and above they align to their own
trigger. Verify the menu panel itself stays inside the viewport.

Opaque white cards must not apply backdrop filters: these create stacking contexts
that can trap descendant dropdowns underneath later cards. Reserve backdrop blur
for intentionally translucent surfaces with explicit overlay layering. Customer
record menus align left on phones and right on wider screens; verify their entire
bounds within the viewport as well as item hit-testing above page content.

`globals.css` honours `prefers-reduced-motion`. All interactive primitives
have visible focus rings (`focus-visible:outline-2 outline-[var(--color-atlas-blue)]`).
Dialogs (command palette) use `role="dialog"` + `aria-modal`. Keep animation
restrained and functional (drawer/modal transitions), never decorative.

## Record page pattern

See `src/app/(app)/customers/[partyId]/page.tsx` (the Customer Master record
— `docs/CUSTOMER_MASTER.md`): a persistent header (identity, status pill,
module-contributed quick actions), a small set of top-level tabs
(Overview/People & Places/Commercial/Finance & Tax/Activity — never more
without a genuine need), and within Overview a metrics row built from
whatever modules contribute. Only sections with actual data (and capability)
render — this is the template any future record view should follow for
shared entities.

## Reports workspace

Reports extends the Atlas logo palette with a pale blue backdrop, white rounded
filter/preview panels, blue outline icons and a single primary blue action.
Source/dataset/search controls sit above dates, field filters and columns. Pending
changes disable downloads until applied. Tables scroll inside their panel on
small screens; field filters stack and retain accessible labels. Home and Reports
share the utility rail with correct active-page indication. Dashboards remains
separate. See `docs/modules/REPORTS.md`.

## 9 October 2026 — Dashboards follows the Atlas ribbon workspace

Dashboards uses the pale-blue/white Home utility shell and existing logo mark,
with a personal-board gallery, searchable widget library, spacious canvas and
responsive inspector. Editing tools belong in the inspector; view mode keeps
figures clear. Width/height, title, palette/tone, borderless style and ordering are
configurable. The utility rail groups Dashboards separately from Reports and
business-app cards, without changing Analytics entitlement. See
[Dashboards](modules/ANALYTICS_STUDIO.md) for actual query and persistence limits.

## People application workspaces — 9 October 2026

Goals, HR, Scheduling, Payroll and Team planner share people-workspace.tsx: blue/
white contextual headers, responsive totals, explicit views and progressive forms.
Each retains its workflow/permissions. Dense rota/capacity grids scroll within
panels; page-wide overflow is not intended.

## Company and personal Settings — 10 October 2026

Settings uses the Atlas blue/white shell and utility rail, rounded company header,
searchable overview cards and section navigation (collapsed browser on smaller
screens). Company access profiles have a searchable selector and one mounted
editor; each app expands into source sections with RWA and fine-grained controls.
Personal Settings is a separate own-account page without company controls.

Tasks and Messages use a shared native right-hand drawer, opened directly from their header icons or
utility rail. Header/rail badges show open assignments; Messages badges show
unread chats. Task detail uses progressive disclosure for notes, linked records,
checklist and status. Native dialog top-layer positioning prevents card overlap;
all drawer widths use a list/detail Back flow, with Escape and focus restoration.
Drawers are at most560px wide, animate entry/exit over240ms and honor reduced
motion. The shade is light with a subtle3px blur, keeping the current workspace recognisable.
Dashboard and Settings keep their existing page/menu destinations.

## 11 October 2026 — website and working guidance

The private-access introduction at `/` uses a crisp white editorial composition,
Nunito with a restrained serif accent, muted teal/lilac detail and Atlas blue for
primary actions. Real ERP illustrations explain Plan → Make → Deliver. There is
no signup, checkout or public company data. Product scenes, scroll reveals, charts
and connection paths provide purposeful motion; Pause and reduced-motion support
stop it. Floating messages retain their own layout space and never cover controls.
The app stays task-focused: shared Guides, restrained operational headers, clear
queues, bounded paging and native guarded actions. Instructions name preparation,
steps, outcomes, terminology and common blockers; authorised source links stay
beside the explanation. Use accessible 44px controls and verify 320px layouts.

## 11 October 2026 — Dashboard canvas and exploration

Dashboards uses the shared Nunito/Atlas shell with a decorative gallery canvas,
compact period/filter shelf, spacious chart cards and a three-section inspector
(Data, Design, Focus). Four coordinated themes and three layout presets apply to
existing widgets and support undo. Keep advanced record filters disclosed and
view mode uncluttered. A centered native chart explorer has chart/aggregate-value
views, keyboard dismissal and focus restoration. Phone headers stack controls
below the complete board title; all supported viewports keep overflow within chart
panels. Inspect geometry and text wrapping visually, not only scroll widths.
