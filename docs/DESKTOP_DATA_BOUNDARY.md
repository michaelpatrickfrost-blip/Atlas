# Desktop software and central data

User requirement: Atlas software and screens run on the Mac. User/business records
remain in one central server PostgreSQL database. Every module uses that same data
boundary. A minimal secured data service executes authorised persistence operations;
it serves no Atlas UI pages. The former remotely hosted Atlas app is superseded.

## Source and package ownership

The editable source is this repository (`/Users/michael/Desktop/RP SYSTEM` on this
Mac). Claude, Codex and Cursor update the same .ai/ memory. Build workspaces under
build/ are generated snapshots, ignored by Git and never edited as project copies.

- `npm run desktop:build`: generate a desktop source snapshot, forward exported
  server actions through one data connection, build/typecheck the local application,
  bundle its standalone runtime and Node.js, compile/sign the native Mac launcher.
- Package preparation regenerates Prisma Client and query metadata from the same
  source snapshot, keeping relationship definitions consistent with access predicates.
- `npm run data:build`: generate an API-only snapshot and build the data service.
  It removes all .tsx UI source and page/layout/template entries. It retains only
  desktop session/query/action endpoints, working-draft persistence and JSON health.
- Desktop queries use the shared db client's ATLAS_RUNTIME=desktop branch. Local
  transactions/raw SQL are blocked; mutations go through allowlisted server actions.
  New actions/modules are discovered from current source at build time, rather than
  being implemented as separate local persistence paths.
- Data service enforces sessions, capabilities and organisation scoping. Desktop
  binaries contain no database credentials or server session-signing secret.

## Runtime and persistence

The Mac launcher starts its bundled application on loopback 13200 and displays that
local UI. The private SSH test connection forwards loopback 13100 to the central
server data endpoint. Connection settings choose a data-service URL, never a remote
UI. Session/browser state is ephemeral; quitting signs out. HTTP data reads use
no-store. Staged runtimes disable Next incremental disk caching. All packaged
dependencies resolve within the app bundle; no workspace symlink is required.
Read actions do not invalidate rendering; mutations refresh the local layout.
The Mac app has no page-reload control. Reloading the window drops the desktop
workspace. While a page is open it keeps reading the latest server records, and
each save uploads immediately.
Required to-one query projections use a separate server scope check rather than
an invalid nested Prisma `where`, excluding foreign linked parents. User-requested CSV exports from Planning, Inventory, Sales, Logistics and Audit use a native save
panel. Other native downloads remain blocked; in-app document preview is available.
Authoritative business records, uploads and backups must stay server-side;
explicit user-chosen CSV export files are permitted. Development synthetic
fixtures are separate from real user data and must not become a local production store.

Internet/data-service failure must show an error rather than write to a local database.
Frontend software updates require rebuilding/reinstalling the desktop package.
Schema/data-command changes require a compatible data-service release and reviewed
server migrations. Module UI updates must not be deployed as remote Atlas pages.

## Verification before activation

Back up central data; build desktop and data-service snapshots from compatible source.
Verify login/session forwarding, module page reads, an isolated central write/read,
unauthenticated rejection, foreign-tenant isolation and blocked generic mutations.
Check data-service route manifests contain no Atlas pages. Preserve active unsaved
forms before restarting an installed client or retiring its old server UI.
Inspect .ai/CURRENT_STATE.md for the actual activation status; packaging success alone
is not evidence that the installed desktop icon and live server have been switched.


## Release safeguards — 4 October 2026

Use `scripts/build-mac-client.sh` for packaging and `scripts/install-mac-client.sh /path/to/Atlas.app` for installation. Both require the central schema compatibility check; missing tables/columns stop release rather than leaving enabled apps with runtime query errors. Reviewed migrations require a central backup, restore verification and rehearsal (`deploy/repair-loading-schema.mjs` is the explicit October 4 repair list, not a generic apply-all command). Credentials remain on the server.

The standard builder and installer each hold an exclusive lock. Installation consumes an already complete isolated package, so it can proceed while a separate future package builds. Packaging and signing occur in a unique `/tmp` directory outside iCloud Desktop, and output is published only after complete runtime/signature checks. Installation stages and verifies the entire package before moving the previous installed app into a recoverable backup. It refuses to replace a running Atlas: preserve unsaved work and quit through the app first. Do not bypass these steps with concurrent in-place copies. `scripts/check-installed-pages.mjs` performs read-only authenticated smoke checks using the existing verification profile, with its short-lived session held only in memory.

Topbar must not acquire a backdrop filter or transform: fixed chat/search overlays inside it must remain relative to the viewport. Logistics forms use `ActionForm` so expected validation failures are displayed beside the form, while redirect errors remain redirects.
