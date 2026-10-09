# Atlas Studio Phase 1 completion report

9 October 2026. Gate: **PASS** for the metadata kernel and prerequisite contract
hardening. This is not completion of the whole Studio specification. The source
Section 27 sequence and Michael's follow-ups are recorded in the implementation
ledger; no Phase 2–9 engines were built.

Later 9 October Admin-entry update supersedes the historical `/atlas/login`
address below: staff use `/19811171adminlogin`; anonymous console requests are
not found. The original Phase 1 acceptance evidence is retained.

## Completed

- Typed capability registry: stable owner/IDs/versions, schema and contract hashes,
  lifecycle/deprecation, validated invocation, tenant/module/capability boundaries
  and active-dependency release scans. Existing CRM/Sales/Projects/Service template
  providers are adapted; their renderer and owner services remain authoritative.
- Tenant metadata kernel: UUID/stable key identities, revision-controlled drafts,
  server validation and compilation, immutable checksummed published versions,
  sealed dependencies, separate activation, retained-history rollback and atomic
  audit. Conflicting browser edits preserve unsaved input and show structural diffs.
- First metadata-only `capabilitySet` compiler accepts approved read references and
  rejects unknown kinds and executable commands/integrations. This scoped compiler
  is documented in DECISIONS; it does not pretend to implement later builders.
- Separate Atlas Admin login/setup at `/atlas/login` and `/atlas/studio`, selected-
  company administration, customer Studio at `/studio`, and business-specific login
  and recovery at `/business/<company-slug>/login` and `/reset-password` beneath
  that business address. URLs bind eligible membership on the server. Existing
  identities and single-company generic login compatibility are preserved.
- Independent `atlas.business_users.create` permission for Atlas OWNER/ADMIN,
  excluded from EMPLOYEE and customer roles, following Michael's explicit reply.
  Legacy Settings creation is customer scoped; Atlas staff creation remains
  Michael-only. Staff configuration does not impersonate a customer identity.

## Verification

- Focused suite: **15 files / 64 assertions passed**; strict TypeScript, scoped
  ESLint, Prisma generation/validation, diff checks and production build passed.
- Full suite: **1003 passed / 85 failed / 22 skipped**, 170 files. The exact 85
  failures reproduce on the unchanged baseline, primarily stale module-availability
  mocks. Full lint retains the baseline **9 errors / 21 warnings**. Neither whole-
  repository check is reported as green; changed-source checks pass.
- Real central PostgreSQL acceptance: create/validate/publish/activate; publication
  without automatic activation; concurrent draft CAS; retained versions/rollback;
  immutable SQL update/delete guards; sealed edge injection rejection; cross-tenant
  pointer foreign keys; missing source/publication permission; disabled source;
  compatibility scan; transactional audit.
- Real browser acceptance passed on the prepared candidate and public HTTPS:
  Admin creation/save/validate/publish/activate, two-editor structural conflict
  diff, mobile overflow, administrator business-user provisioning, wrong-company
  recovery without consuming the setup code, correct-company recovery/login,
  wrong-company login without a session, customer Studio and denied Admin access.
  Existing Atlas, Sales, Manufacturing and Templates pages loaded; zero staff
  browser/asset errors were observed.
- Read-only Home checks passed on candidate and public HTTPS for desktop/tablet/
  phone, authorised app cards, utility navigation, loaded branding, search and
  existing Apps menu. The first Home runner could not overwrite root-owned test
  screenshots; rerunning that read-only check with its matching test environment
  passed. This was test-output ownership, not an application failure.
- Activated exact tested source **c46bbefa737c81280daf38d62e87a4511420ffa5** at
  `https://atlassystem.online`; public release identity matched before and after
  acceptance. Previous immutable Home runtime 329b60a remains retained.
- Private server evidence: candidate Studio `/tmp/atlas-studio-acceptance-lx8iao`,
  candidate Home `/tmp/atlas-studio-acceptance-Pqqj0O`, public Studio/Home
  `/tmp/atlas-studio-public-kJpeTa`. Acceptance uses isolated central Test companies;
  exact fixtures were suspended afterward, history/audit retained, no existing
  QA identity or grants changed. Credentials are excluded from this report.

## Database Changes

Four additive tables/models: `StudioDefinition`, `StudioDraft`,
`StudioDefinitionVersion`, `StudioDependency`, with tenant indexes/composite
foreign keys and identity/history constraints. Central migration
`20261009210000_studio_metadata_kernel` applied on 9 October. Initial backup prefix
`/home/administrator/backups/atlas-pre-deploy-20261009-184707`; final prepare and
activation backups `atlas-pre-deploy-20261009-193301` and
`atlas-pre-deploy-20261009-193700` in the same directory. Database and private-file
backups retained. No destructive reset, existing business-table replacement or
local business datastore. Release rollback changes runtime pointer, not schema.

## Compatibility

Preserved Core/module ownership, canonical Customer Master, source domain services,
capability permissions, central tenant data, existing Templates renderer,
Automations engine and event infrastructure. Current live Home source/evidence was
merged before Studio release. Active metadata dependency scan passed at preparation
and immediately before activation. Domain writes are not exposed by this compiler.

## Known Issues

The reproduced full-suite/lint baseline failures above remain unresolved; Phase 1
introduced no new failure names. They require their own regression-maintenance
workstream. No unresolved Phase 1 acceptance failure remains. Phase 1 does not
provide arbitrary page/field/process/flow authoring.

## Deferred by Design

Section 27 Phases 2–9: extension fields, record types and structured pages;
decisions/approvals; durable events; Flow runtime; Automations migration; processes;
packages/environments; broad adoption. No duplicate workflow, permission or template
engine was introduced. Business URLs use paths on the existing site; no custom
DNS/subdomains were configured.

## Gate Result

**PASS** — all scoped Phase 1 requirements and prerequisite contract checks have
implementation, automated and central/public runtime evidence. Whole-system
Section 29 acceptance remains pending the later ordered phases.
