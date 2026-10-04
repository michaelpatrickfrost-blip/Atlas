# Atlas Design System

## Philosophy

Precise, bold, quiet, premium, fast. Atlas should feel like a finished product:
a dark company rail, a luminous workspace, icon-led navigation and soft elevated
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

Plus Jakarta Sans. The Atlas wordmark is `public/brand/atlas-logo.png`. Page titles are confident (`text-2xl font-semibold
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

- **No sidebar.** The home screen is the launcher. `AppDirectory` lists the apps a
  person can open as short named columns by area (Customers, Operations, People,
  Business, Company) from `getNavigableModules`; areas are set in
  `src/core/modules/areas.ts` and an unlisted app falls under More. No app tiles,
  no descriptions.
- **Topbar** — home, an Apps menu (`AppMenu`, the same `AppDirectory` in a panel,
  hidden on the home screen), back, search, new window, notices, chat, profile and
  sign-out on a plain white bar.
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
