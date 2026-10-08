# Marketing workspace live evidence — 8 October 2026

Application releases `76ecde5` and `d77e7c4` deploy the researched campaign information
and connected content improvements. Research and source links are in
[the platform comparison](../plans/MARKETING_WORKSPACE_RESEARCH.md).

Delivered: 14 optional detailed planning fields, campaign brand, up to 20 custom
named values and 20 resource links, readback in Overview/Brief/Content and links,
contextual draft-content creation, multiline activity notes and navigation to the
existing audience/content/messages/profile/consent/analytics tools. Existing campaign
metadata is reused; no migration or provider configuration. Links remain references.

Campaign creation validates money, dates and allocation before atomic campaign,
budget-line, launch-plan and audit persistence. Brief updates are version checked.
Both Marketing clients retain rejected drafts. Expected validation failures return
safe structured outcomes; arbitrary auth/database exceptions remain protected.
Lead/message/content rows require their respective read capabilities. Pipeline
amounts stay in campaign currency; confirmed net order influence is labelled
separately from invoiced revenue.

Validation passed: full compatible Vitest suite 750 tests, 22 integration skips;
production build; separate strict TypeScript; changed-file lint; diff check.
Canonical primary integration: 52 focused Marketing tests in seven files passed.
No live database outage/child-write failure was deliberately induced; transaction
failure propagation is covered by unit tests, with live creation/prevalidation below.

Both VPS builds/restarts passed, all 96 migrations current, HTTPS login 200. Backups
retained under `/home/administrator/backups/`:

- `atlas-pre-deploy-20261008-121810.dump` and matching `-service-files.tar.gz`.
- `atlas-pre-deploy-20261008-122647.dump` and matching `-service-files.tar.gz`.

Final `ATLAS_MARKETING_TEST=1 npx tsx scripts/check-marketing-workspace.ts` on the
live server passed all 12 assertions using ordinary sign-in and actual browser forms:

- Rejected allocation retains draft and creates no partial campaign.
- Brand, extended brief, custom fields and resource links persist centrally.
- Budget line and generated launch activities accompany the new campaign.
- Resource opens from the campaign Content and links panel.
- Draft content retains correct campaign/brand without granting approval.
- Saved custom information and brand reappear during editing.
- Two-tab stale save retains draft and protects the newer central campaign.
- Brief fits a 390px phone viewport; zero browser runtime errors.
- Read-only and other-company detail boundaries preserve access permissions.
- Direct action request cannot bypass the manage capability.

The first live run exposed production React error 441 masking expected validation
text; this was repaired in `d77e7c4`. A later harness needed a textarea selector
correction after the stored text changed its implicit label. Initial attempts were
not counted as full acceptance. All synthetic test companies were suspended and
credentials/sessions revoked after each run; central audit/history retained.

This verifies the delivered workspace workflows, not full platform parity, separate
physical company servers or all 275 original Marketing requirements. Provider-backed
sending/social publishing, richer audience/content authoring and advanced automation
remain incomplete. No emails, social posts or adverts were externally sent.
