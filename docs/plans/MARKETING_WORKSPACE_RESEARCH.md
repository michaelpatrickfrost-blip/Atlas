# Marketing workspace research — 8 October 2026

Michael requests a stronger Marketing app with enough room to capture the information
needed to run campaigns, while preserving simplicity and company security.

## Platform patterns

- HubSpot groups goals, audience, owner, dates, brand, notes, budgets and associated
  assets into one campaign record. Its guided creation remains editable later.
  Atlas already has the main record and planning model; extend it with optional
  detailed information and contextual content rather than another campaign entity.
  [Official campaign guide](https://knowledge.hubspot.com/campaigns/create-campaigns).
- Mailchimp recommends a primary audience organised by tags/segments and supports
  contact fields and targeted segments. Atlas retains canonical Contact/Party and
  existing marketing profiles/audience rules; expose those tools in navigation.
  Custom campaign fields describe campaigns, not replacement contact identities.
  [Official audience guide](https://mailchimp.com/help/create-audience/).
- Brevo makes recipients, sender, subject, content, preview and scheduling explicit.
  Atlas must distinguish campaign planning from actual delivery, and expose its
  existing Messages workspace. Configuring a provider remains a separate unresolved
  dependency; no sending or publishing is claimed by planning status.
  [Official campaign setup](https://help.brevo.com/hc/en-us/articles/4413566705298-Create-and-send-an-email-campaign).

## Implementation choices

Use the existing campaign `brief.workspace` metadata for optional insight, exclusions,
competitors, proof points, tone, deliverables, approval requirements, measurement,
sales handoff, follow-up, lessons and notes. Preserve unrelated metadata. Add up to
20 custom named values and 20 named http/https resources without silently cutting
entered data. Existing campaign brand remains separate and editable.

Keep extra information behind named disclosures and retain the guided builder.
Render copy as text; resource links open their original location and cannot contain
executable schemes or embedded credentials. Links are references, not file uploads
or hosted landing pages. Approval notes and audience exclusions are planning guidance;
they do not replace permission, approval or delivery eligibility controls.

Create campaign/budget/plan/audit in one transaction; reject overallocated budgets,
invalid money and impossible dates before writing. Version-check brief updates and
retain rejected drafts. Campaign content uses the existing content-create capability
and independent approval. Personal lead and message rows require their own read
capabilities even inside a campaign workspace. Physical tenant server isolation and
external provider execution are not implemented by this change.

This is a researched improvement to the existing Marketing workspace, not a claim
of parity with every feature of these platforms. Audience authoring, email studio,
provider delivery, automated attribution and the full original brief need further work.
