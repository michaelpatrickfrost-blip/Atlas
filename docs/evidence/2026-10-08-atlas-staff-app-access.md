# Atlas staff app access — 8 October 2026

## Delivered

Active Atlas staff can open every implemented app allowed by their capabilities
in the selected workspace, regardless of that company's app enabled/entitled
switches. This applies to the launcher and server-side module gates, including
Audit, Marketing, Plan, Safety and Customer Service. Staff use does not change
company settings. Tenant scoping and capabilities remain enforced; customer app
gates and cross-app data/integration availability remain unchanged.

## Checks

- Four focused module entitlement tests passed; scoped ESLint, `npx tsc --noEmit`,
  production build and `git diff --check` passed.
- An initial staging attempt found that the Guardian QA company already had all
  its accessible apps enabled, so it could not test the bypass. It stopped before
  switching runtimes. Acceptance was corrected to use the same authorised Atlas
  staff identity in the internal workspace, where app switches are off by default.
- The candidate passed the isolated old → new → old VPS runtime switch and
  rollback check. It rendered 30 authorised pages and 30 Apps menu toggles with
  zero browser/chunk failures and all business writes blocked. The additional
  internal-workspace acceptance verified all 30 app links/icons and opened a
  disabled app without an app-disabled response.
- Cross-release action safety passed with a disposable Test fixture: rejected
  drafts were retained, explicit corrected submission behaved as expected, no
  automatic POST replay occurred, and the fixture was retired. Existing QA staff
  access and real companies were unchanged.
- Deployed immutable release
  `1a031c9cf48349edb297d1faedf0829a67118bba`. Public release health reports the
  exact SHA and `/login` returns 200. Live internal-workspace launcher acceptance
  passed at 1440, 768 and 390 pixels, including opening a disabled app, My work
  navigation and Apps switching, with zero browser/chunk errors and all writes
  blocked. Previous release
  `aa7a3906a030f585c00334b151cf0a2fb6d1e319` remains available for rollback.
- Private backups retained:
  `atlas-pre-deploy-20261008-205407`,
  `atlas-pre-deploy-20261008-205710`,
  `atlas-pre-action-test-20261008-205644`.

No schema migration was required.
