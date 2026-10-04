# Sales and customer networks

## Delivery checklist

- [x] Create invoice/delivery addresses inside the sale editor and select the canonical customer address immediately.
- [x] Compact order header: account/pricing row, destination/date row, expandable references and linked records.
- [x] CSV/Excel exports inside the Filters panel.
- [x] One compact search field with an expandable Filters panel; multi-selection, advanced rules, personal saved views and column choices remain available.
- [x] Compact module header; Customers included in Sales navigation; configuration removed from the everyday Sales menu.
- [x] Quotation templates removed from Sales screens. Existing historical template records are retained.
- [x] Customer creation supports independent accounts and optional parent, level and customer type. Contact details can be completed later.
- [x] Customer record shows its complete ownership tree, current-account highlight, links to connected records and an Add linked account shortcut.
- [x] Separate optional trading links: an account can buy through one or several businesses without changing its ownership tree.
- [x] Explicit invoice and pricing accounts on quotation/order entry. Only a tenant-owned, active trading link authorises a different pricing account.
- [x] Negotiated product prices and selected pricelist are resolved for the pricing account. Credit, customer PO obligations and tax remain associated with the invoice account.
- [x] Delivery can use an address from either account's ownership tree; billing addresses must come from the invoice account's tree.
- [x] Customer-facing notes, delivery instructions and internal finance instructions saved separately, recovered by autosave, and retained on quotation conversion.
- [x] Sales analysis by invoice account, pricing account, ownership group, customer type, salesperson and status; drill into matching orders; CSV/Excel export uses the same calculations.
- [x] Consistent shell Back control and direct record/list links.
- [x] Confirmation emits a versioned handoff with billing/pricing identities, address snapshots, delivery dates, partial delivery choice and separate instructions.
- [ ] Install this local Sales/Customers build in the final Mac/data-API architecture. Current private test app still uses the earlier release.
- [ ] Implement Logistics/Finance consumers, delivery/invoice projections and an outbox dispatcher. No invoice or dispatch is created by this work.

## Flexible customer structure

Every account remains a Core Party. Parent links are optional; level labels and customer types do not force a fixed group/business/branch pattern. Any depth is supported. A tenant can use a flat list, groups, branches, individuals, trading relationships, or a combination. Parent changes are checked for cycles in a serializable transaction and audited together with the change.

Ownership and trading are different relationships. For example, account A has a negotiated deal and orders through merchant M. A keeps its own customer record, contacts, sites and pricing. The order's invoice account is M and its pricing account is A. M receives the credit check and financial exposure. The trading link must be created by a user with commercial-management capability; it does not follow automatically from a shared parent or category. Removing the link preserves history and prevents further confirmation under that relationship. Price selection remains explicit; arbitrary unrelated accounts cannot contribute pricing.

Customer type is company-defined text, optional, searchable and reportable. Account levels are labels rather than permission or price inheritance rules. There is no implicit inherited pricelist, consolidated group credit or automatic rebilling.

## Delivery and invoice handoff

1. Draft: select invoice account, optional linked pricing account, terms, addresses, products, PO, references, delivery date and instructions.
2. Quotation: save, preview/download, mark sent and accept. Acceptance preserves agreed lines/prices and notes into a draft order, excluding optional products.
3. Confirm: validate addresses, current trading link, required references, credit, tax and revision-specific commercial approval. Persist a commercial revision and outbox event in one transaction.
4. Logistics consumer, when built: reserve/replenish stock, allocate, pick, plan shipments, dispatch, confirm delivery and manage returns. Sales displays its fulfilment projection; Sales does not alter warehouse stock directly.
5. Finance consumer, when built: choose the applicable billing policy (ordered quantity, dispatched quantity, milestone, deposit or manual review), generate an invoice draft against the billing account, validate/post it, and report settlement to Sales. This release marks invoice policy REVIEW_REQUIRED; it does not assume every business invoices at dispatch.
6. Amend/cancel: retain original confirmed revisions; consumers must reconcile changes by order ID and revision, respecting shipments, posted invoices and credits already recorded. Those downstream reconciliation rules remain implementation work.

Event schema is defined in `src/modules/sales/services/handoff.ts`. Delivery instructions belong to the logistics envelope and finance instructions to the finance envelope. Internal finance text is not included in customer PDFs. Consumers must be tenant-scoped, use immutable order revisions, process event keys idempotently, retry failures and publish actual status back to Sales. A pending handoff is not an invoice or a delivery.

## Validation

Local migration 20261003290000_customer_trading_sales_handoff applied. Database journey checks cover negotiated pricing through a merchant, conversion preserving billing/pricing accounts and both instruction fields, archived-link confirmation rejection, foreign/unrelated account rejection, out-of-order autosaves and draft ownership. Unit checks cover flat/deep/cyclic trees, identical-name account report separation, ownership rollup, beneficiary filters and handoff payloads.


Latest verification: 102 tests passed with database journeys enabled; production build succeeded; scoped Sales/Customers lint passed. Browser checks verified inline address creation, combined account filters, Excel download with numeric totals, autosave recovery after navigation, and a 390px viewport without page overflow. Development preview: http://localhost:13400/sales/orders (local demo database). The installed private server app has not been changed by this batch.

## Company and user access (3 October 2026)

- [x] Company settings can disable the Customers workspace, Pricelists workspace, or Audit history for all company roles. These restrictions are applied to capabilities at session resolution, so direct routes and commands enforce them as well as navigation. Administrators retain access administration so areas can be restored.
- [x] Role grants and membership roles in company settings decide individual user access. Profiles show assigned roles and effective access, including company restrictions. These controls do not disable audit recording or remove commercial document customer/price snapshots.
- [x] Sales Reporting has been removed from Sales navigation; its former route redirects to Orders. CSV and Excel exports remain within list Filters. A standalone Reporting module remains future work.
- [x] Delivery address dropdown includes “Add delivery address…” with account attachment, immediate selection after saving, and reusable creation without leaving the draft.

Validation: 105 tests passed including database journeys and session permission restrictions; production build and scoped lint passed. Changes remain in the local preview, not the installed remote-backed Mac app.

Preview verification: company settings and profile access statuses were inspected in the browser. Delivery dropdown creation selected its saved address; reopening cleared the form and allowed another address. The production preview runs from an isolated build at `/tmp/atlas-sales-access-preview` to avoid another active development server replacing the repository's `.next` output.
