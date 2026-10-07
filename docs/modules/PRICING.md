# Sales price lists and CRM commercial agreements

Price lists are reached through Sales → Price lists. Commercial agreements live
in CRM → Contracts & agreements, alongside signed contracts/quotation approvals.
Old `/pricing` and `/pricing/agreements` URLs redirect, retaining query strings.
The internal `pricing` module remains registered for analytics and the existing
company entitlement/enablement gate. It is hidden from the launcher; Manage apps
presents its switch as a Sales feature. Sales and CRM also require their own enabled
module. `core.pricing.read` reads, `core.pricing.manage` edits; relocation grants no
capabilities. Signing retains the existing Core contract permission.

## Price-list workflow

- Search names or assigned customer names/codes; filter currency or assignment use.
  Lists and CRM agreements page in groups of 30.
- Create a blank list, copy all rules from a same-currency list, or load active
  catalogue products in the selected currency/category with a set-price discount.
  Copies keep dates, thresholds, inactive state, priority and exchange basis;
  assignments and agreements stay on the original list. Creation and optional
  initial assignment are one audited transaction.
- Product prices search/sort/filter by current, scheduled, expired or inactive.
  Quantity-break edits update the original row; a collision with another break is
  rejected. Deactivation preserves history and restoration is available. Discounts
  and quantity breaks retain the existing Sales pricing semantics.
- Import/export remains CSV with preview, unknown-product/error validation and an
  atomic apply. Blank prices and omitted products are unchanged.
- Customer search supports batch assignment and shows which existing usual list
  will be replaced. Only same-company active, non-scrubbed customer candidates can
  be assigned. Removing an assignment permits the existing ancestor inheritance.
- Rename and catalogue exchange-rate settings are separate. A populated list cannot
  change currency. Same-currency exchange rates must be 1; fixed amounts are never
  converted by an exchange-rate update.

## Sales and customer connections

The checker calls `resolvePrice`, the same function Sales uses. Choose automatic
customer pricing or explicitly select the current list, a quantity and date. It
returns the source, currency, set price, discount, net unit and validity; it makes
no quotation/order and excludes tax. Existing document prices remain saved snapshots.

Precedence stays agreement special price → saved customer product price → selected/
agreement/customer/inherited price-list rule → catalogue. Product rules beat category
rules, then whole-list rules; discounts do not stack. Nearest-ancestor inheritance
applies only when an account has no own agreement/usual list. A document's explicit
list selection does not bypass special customer prices.

Commercial agreements retain the shared Party, price list, dates, payment terms,
special prices and service promise. Active/date-effective agreements affect new
sales; drafts do not. Signed contract documents/quotation approvals are the existing
Core signing records, linked separately in CRM. Quantity call-offs remain Sales
commitments, not commercial agreements.

## Verification

`tests/pricing-workspace.test.ts` covers setup scoping/currency restrictions, copies,
assignment tenant checks, capabilities, break edits/collisions and read-only Sales
price checking. Existing pricing-rule/CSV/customer-pricing tests cover resolution.
Deployment and live verification evidence is recorded in `.ai/CURRENT_STATE.md`.
