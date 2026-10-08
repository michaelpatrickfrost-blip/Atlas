# App launcher — 8 October 2026

Michael requests a polished, professional, modern app icon landing screen after
login. This supersedes the older list-only and operational-first Home preferences.

## Delivered

Home leads with a responsive grid of labelled Lucide app icons, compact blue
marks, keyboard focus and area grouping. Operational attention/goals remain below.
Successful company and Atlas staff sign-ins redirect to Home. Existing workspace
selection and explicit Atlas Admin access remain intact. The same server-filtered
AppDirectory supplies the compact topbar menu; no entitlement, capability, tenant,
schema or business-data storage changes were made.

## Checks actually run

- Isolated production build passed; strict TypeScript, focused ESLint and
  whitespace checks passed. Eight sign-in/registry tests passed, including
  company/staff landing and rejected-password behavior.
- Clean npm ci restored missing Playwright from the initial dependency clone;
  subsequent strict typecheck passed. No dependency manifest changes.
- Standard backed-up immutable VPS deployment built and smoke-tested the exact
  candidate, then activated runtime `dd66039772fc57daa77dc1189ab53af3d4e5569d`.
  Public release health returned that exact SHA; login HTTP 200; Atlas service
  and Guardian timer active. Previous runtime `2d25bd2` retained.
- Existing authorised Guardian QA session, with all non-GET/HEAD requests blocked:
  30 accessible module links/icons matched `getNavigableModules`; root redirected
  to Home; launcher preceded attention; 1440, 768 and 390 widths had no horizontal
  overflow; My work click and compact Apps menu selection worked at every width.
  Zero page errors/chunk failures. Desktop/phone screenshots visually reviewed.
- The browser check uses existing QA access; it does not exercise a real password
  submission or grant an account. Sign-in redirect is covered by unit tests.
- Mobile toggle acceptance uses the existing `data-guardian-safe` marker because
  its compact text is hidden. No product behavior was changed for that selector.

## Visual refinement — 8 October 2026

The original larger pastel icon tiles were replaced with compact, consistently
aligned rows: 36px blue icon marks, 19px glyphs and a responsive three-column
maximum grid. The compact topbar app menu is unchanged. Candidate and live
acceptance checks assert the icon and mark dimensions at desktop, tablet and
phone widths.

### Refinement delivery

The refinement passed seven focused login/entitlement tests, scoped ESLint,
strict TypeScript, production build and whitespace checks. VPS candidate
staging passed; 30 authorised app links/icons, blocked writes and responsive
dimensions were verified. The live browser check also passed all 30 app links at
desktop/tablet/phone sizes, plus root-to-Home, My work and Apps navigation with
zero browser/chunk errors and no business writes. Desktop and phone layouts were
visually reviewed.

Deployed immutable runtime `f89b48aedb919267c129d5d52afe07a346f370c0`.
Public release health returned the exact SHA; `/login` returned HTTP 200.
Previous runtime `1a031c9cf48349edb297d1faedf0829a67118bba` and private
pre-deployment backup `atlas-pre-deploy-20261008-210443` were retained. No
schema migration was needed.

Private server evidence: `/home/administrator/atlas-launcher-acceptance-20261008/`.
Database/file backup prefix:
`/home/administrator/backups/atlas-pre-deploy-20261008-171940`.
No credentials, tokens or business records are copied into this evidence document.
