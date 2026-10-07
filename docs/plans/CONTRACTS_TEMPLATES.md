# Contracts and reusable business templates

Scope applied 7 October 2026. CRM owns contract work; Core owns the shared document,
public sharing and template engine. Templates is a separate registered app.

## Delivered workflow

- Deal records have **Build contract** and a list of attached contracts. A contract
  may use an existing PDF, typed terms, or a published template. The customer is
  resolved from the deal on the server. CRM representatives remain restricted to
  their own deals; managers retain pipeline visibility.
- `/crm/contracts` tracks drafts, customer responses, returns needing review and
  completion. Each document has its own review page, PDF, timeline and sharing tools.
  Draft title/message/signing options and PDF/terms can be revised before sharing.
  Shared content is frozen; changed terms require a new document.
- Staff create a private `/share/<random-token>` link with 7/14/30/60/90-day response
  expiry, or send it through an existing authorised email account. Only a hash of
  the token is stored. Reissuing cancels old links; revocation preserves history.
  Legacy `/sign/<token>` links continue working.
- The customer receives an Atlas-branded reading page with company branding,
  context, PDF preview/download, response steps and confirmation. No account is
  needed. This follows Blocwrite's focused share-reader interaction, implemented
  within Atlas rather than copying its storage/authentication or product code.
- Online signing requires full name and explicit server-checked consent. Drawing
  is optional. The exact PDF hash, time, network address and user agent are recorded.
  Quotes retain approval semantics; signing a deal contract does not win a deal,
  place an order, accept an unrelated quotation or post an invoice.
- The customer may instead upload a complete signed PDF (up to 10 MB). This creates
  an append-only return and `RETURNED` state. A contract manager reads it and accepts
  it, or rejects it with a reason visible on the customer page. Acceptance completes
  the contract. Rejected files remain in history. Only unsent drafts can be deleted.
- Completed documents can be downloaded with an appended completion record. Original
  and returned PDFs stay separate and untouched in the central database. The combined
  copy is not a cryptographically certified PDF; a signature embedded in a returned
  PDF should be checked in its untouched original, available to staff.

## Templates app

`/templates` provides a library, starter layouts, drafts/publishing, version checks,
archiving, a section builder and live sample preview. Sections: heading, paragraphs,
bullets, tables (up to six columns), signature lines, dividers and page breaks.
Merge fields cover company, customer, primary contact and source record; custom
`{{custom.field_name}}` values are requested per document. Unknown/missing fields
block generation. Raw HTML is escaped. A generated document stores its template
ID/version and resolved section snapshot; later template edits do not change it.
Draft revisions retain that origin and record the new document hash in the audit.

Templates can target CRM deals, Sales quotations/orders, Projects and Customer
Service cases. The generator lists authorised source records in these apps and
attaches generated documents using source module/type/ID. Each module supplies its
own capability/scoped context through `templateContextProvider` on the manifest.
Core never imports a module implementation outside the registry. Contract views,
files, link creation and return reviews re-check source access. Projects preserve
project membership/visibility; service preserves restricted-case access.

For existing CRM companies the additive migration provisions a companion Templates
module state from the CRM entitlement/enabled state. New accounts can licence/enable
Templates through the existing app controls. No user grants or profile permissions
are widened: the tool uses the existing `core.contract.manage`; emailing also needs
`core.email.send`. The generic desktop query API denies the new models by default;
this release targets the live server, not a separately rebuilt Mac client.

## Boundaries and future extensions

One signer per document. The invitation link is the recipient's credential; email
ownership/identity is not independently verified. Online signatures are a recorded
consent workflow, not a qualified trust-provider service. No claims of legal
suitability are made. No automatic customer onboarding, identity creation, order
creation, multi-party countersigning, signing-field coordinates, qualified signature
provider, DOCX import or arbitrary visual page designer is included. Starter wording
requires the business's review. Email delivery requires a configured sending account.
Completion updates Atlas and emits existing contract events; owner email notification
is not automatic unless configured in Automations.

Response expiry blocks reading the body/PDF and all new actions. A completed link
remains a read-only completion record. Customer returns after expiry require staff
to reject the pending return and issue a fresh link if corrections are needed.
Generated PDFs use standard embedded PDF fonts for UK/Western text; unsupported
characters block generation with an explicit error. Uploaded PDFs retain their own
fonts. Source pickers show up to 200 recent authorised records; the contract list
shows up to 200 recent documents and counts that displayed scope.

## Verification

Acceptance includes real HTTP requests to the deployed application using temporary
server-only Test companies: template publication/generation, deal attachment,
customer sharing without login, online completion and PDF certificate, signed return,
review/rejection, invalid/expired/replaced tokens, repeat signing and cross-company /
record access. No real customer is contacted or modified for verification. Exact
checks, deployment commit and backup evidence are recorded in `.ai/CURRENT_STATE.md`.
