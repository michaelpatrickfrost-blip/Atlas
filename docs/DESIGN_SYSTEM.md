# Atlas Design System

## Philosophy

Precise, bold, quiet, premium, fast. Atlas should feel like a finished product:
a light utility rail on Home, a luminous workspace, icon-led navigation and soft elevated
surfaces. Dense screens stay calm. Company logos live on the organisation and
appear in the shell. Do not invent a second visual language per module.

## Foundation (tokens — `src/app/globals.css`)

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
- **EmptyState** (`empty-state.tsx`) — dashed border, title + optional
  description/action. Used for "no data yet", permission-denied and
  not-found states (see `src/app/(app)/error.tsx`).

## Shell (`src/components/shell/`)

- **Home** — modern blue-and-white launcher based on Michael's 9 October reference.
  A branded search header, light utility rail and grouped app cards with larger
  blue icons and concise purpose descriptions (manifest fallback) replace the compact Home link grid.
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
  Workspace controls use a larger Apps pill and search field. On phone search
  moves onto its own header row so utility controls remain reachable.
  `public/brand/atlas-mark.png` is a crop of Michael's supplied artwork.
- **Messages** — compact blue/white right-hand drawer, with conversation list and
  chat shown one pane at a time; full-page Chat retains its desktop split view.
  Quiet date separators and structured record cards retain their behavior.
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
motion. The shade is light and unblurred so the current workspace remains visible.
Dashboard and Settings keep their existing page/menu destinations.

## Whole-app consistency and control coverage — 10 October 2026

Business screens inherit the shared blue/white surface, ink and interaction tokens.
Operational headings and Finance overview use the same pale-blue rounded headers;
status colours remain meaningful. Grouped app navigation supports arrow keys,
Home/End and Escape with trigger-focus return; dropdowns fit the viewport.
Read-only UI coverage distinguishes layouts, pointer reachability, menu/dialog
behavior and route restrictions from synthetic mutation workflow acceptance.
A counted button or an HTTP200 alone is not a working-button claim.
