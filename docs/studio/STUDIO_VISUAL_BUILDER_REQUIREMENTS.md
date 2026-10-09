# Visual builders and easy setup

Michael's 9 October follow-up makes visual preview and simple setup a Phase 2
acceptance requirement. This supplements the supplied specification's structured,
responsive Page Studio; it does not move later engines into the current phase.

His subsequent clarification: Studio is a design studio for bespoke business
screens and document templates, including Sales. Never require customers to type
internal identifiers or understand registry terminology. Generate stable keys
server-side and preserve them when display names change. The present capability-set
form is foundation tooling, not acceptance of the intended design experience.
Both record-screen design and business-document design need clear choices and
visual preview; they retain their owning domain/renderer rather than becoming a
second Sales app or document engine. Add supported Sales contracts as an explicit
owner integration workstream; do not present the Tickets slice as Sales support.

Customers should choose an available owning app/record, select a suitable page or
template layout, configure clearly labelled sections, and see the resulting screen
before publication. Use the modern Atlas blue/white ribbon, typography, cards and
controls. Start with useful presets rather than an empty technical configuration.
Sales orders are Michael's example; each actual entity still needs owner-approved
contracts before it can be configured. Do not imply unsupported entities work.

The draft preview must use the same structured rendering rules as the published
page and support desktop, tablet and phone. It should show the selected configuration,
explain required-field/visibility problems in plain language, and preserve unsaved
work. An authorised existing record may supply preview data; clearly labelled sample
content may illustrate an empty layout without being stored as business records.
Preview cannot execute commands, grant permission or reveal inaccessible fields.

Keep field labels/help/ordering distinct from stored additional fields and protected
native business fields. Atlas staff configure companies from the standalone Admin
console; customers use their own Studio workspace and business login URL. Preserve
the existing Templates renderer; its later Studio interface should preview through
that renderer rather than introducing a second template engine.

Workstream 2E verification must include real selection/configuration, draft preview,
publication and resulting runtime, plus desktop/tablet/phone screenshots and checks
for permissions, hidden queries, required fields and saved/unsaved state. A screenshot
or preset selector alone is not a completed builder. Status: requirements recorded;
visual builder NOT STARTED until 2B–2D dependencies pass their checkpoints.
