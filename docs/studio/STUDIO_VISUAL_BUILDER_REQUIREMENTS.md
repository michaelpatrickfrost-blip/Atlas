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
visual builder was NOT STARTED at that checkpoint; the 12 October source status below supersedes it.

Michael also requires published designs to reach each business's live dashboards
and screens, with configurable buttons. The editor must offer clear choices,
useful starting templates, immediate preview and an understandable reviewed
publication/activation outcome. Saving a draft must not change the live business.
Acceptance includes seeing the activated version on the intended business's
dashboard/screen, a different business retaining its own layout, and rollback.

Use the existing Dashboards app, its chart/preset/rendering components and the
Core analytics providers. Current saved Dashboard records are organisation/user
scoped personal boards: company Studio publication must preserve those personal
boards. Define an explicit published company-layout adapter and precedence in 2E;
do not create a second analytics engine or silently overwrite personal layouts.
Preserve Home's Apps directory, attention and goals when integrating live layouts.

Custom buttons may have business-specific labels, icons and supported placements.
Their behaviour must be selected from registered, owner-approved Atlas actions or
permitted navigation. Preview never invokes them. Runtime checks the authenticated
tenant, source availability, native capability and owning domain rules on every
invocation. Configuration cannot grant privileges or supply arbitrary executable
scripts. Verify permitted invocation, denied users, disabled sources, tenant
isolation and native business outcomes. Later Flow actions remain later-phase work.

10 October: Michael rejects naming configurations in a library as the primary
journey. Studio starts from the selected business and the software area to tailor,
then useful layout presets, visual editing/preview and reviewed business publication.
Capability-reference records are optional advanced foundation tooling. Current UI
must state the designer is unfinished instead of presenting technical setup as its
replacement. Preserve existing definitions and separate Admin/business authority.

Michael explicitly says he is not a coder: version comparison and setup must be
visual, modular and very easy to use. Screen/template comparisons will show actual
layouts and clear additions/removals/changes. Foundation reference-set comparison
must explain descriptions and selected references in plain language, not JSON,
checksums or hashes. Draft check results also need readable readiness/review states.
Technical integrity still runs on the server and never substitutes for design preview.

11 October: Michael wants the visual Studio to open entirely as its own app-sized
workspace. Workstream2E must deliver a dedicated full-screen Studio route/shell,
its own task-focused navigation and enough room for a component library, large
shared live-preview canvas, properties panel and preview/publication controls.
Keep ordinary ERP app navigation out of that editing canvas; provide a clear way
back to the business workspace. The separate private Atlas Admin console retains
platform/company administration. This is a distinct workspace inside the same
Atlas platform, canonical records, authenticated tenant and capabilities, not a
new ERP or duplicate rendering/permission system. Current native typed controls
are a dependency for shared preview; they do not satisfy this designer requirement.

11 October: Michael also requires Atlas administrators to build for any business
account they are authorised to administer. The visual workspace needs a clear
selected-business entry from the separate Admin console and a persistent business
context in the editor/preview/publication flow. Server derives that authorised
context through existing audited support/company access; never a client tenant ID
or a configuration-granted privilege. Customer Studio remains limited to its own
business. Publication must affect only the selected business and its approved
page/audience rules; verify another business and private data remain isolated.

12 October source checkpoint: the standalone shared-renderer designer, original
draft/review/live actions and Sales/Ticket presets are IMPLEMENTED. The fact-panel
/table properties slice exposes only permission-filtered approved read-only facts
and exact query columns/row bounds; labels, field ordering, instructions, buttons,
preview devices and native Ticket form reuse remain intact. Saved table columns
and order are preserved; unavailable saved choices remain explicit/read-only.
These are source/local checks, not whole Phase 2 or live acceptance. Activity,
documents, relationships, approvals/tasks, existing-stage display and embedded
metric/chart families still require actual owner adapters. Reuse existing owning
services and Analytics rendering; no new Process/Approval/Flow engine. Friendly
type/capability condition choices and visual prior-design comparison remain
bounded editor work. Root's original candidate/public visual gate owns runtime
proof, including the new native record-layout journey.

12 October root: previous/current designs render labelled inert side-by-side
previews from original sealed versions; draft input/live pointers are preserved.
The additional-field change link opens friendly settings and explicit choice
matching with save and bounded before/after preview. It deliberately labels page
counts and preview-only status. Complete reviewed migration controls and compatible
live browser verification remain required before Phase2 completion. Shared business
dashboard owner compiler exists, but no live shared dashboard claim.
