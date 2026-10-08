# Connections

Connections is the Atlas-staff-only onboarding app at `/atlas/connections`, linked
from Apps and Atlas Admin. It uses independent `atlas.companies.manage` permission;
company roles cannot grant platform access. Select an unarchived customer company,
download a CSV template, replace its example, upload, validate, review, acknowledge
and attach. Search selects a destination without switching or impersonating its users.

The 13 working sections are customer hierarchy, contacts, customer trading setup,
products/services, price lists, prices, warehouses, locations, people, work centres,
and machines/resources, plus Sales orders and quotes. Required fields, dependency
order and update semantics are visible per section. App entitlement/enablement and
company customer/product creation policies are enforced server-side. This is a
bounded onboarding catalogue, not a claim that every Atlas table can be imported.
Invoices, payments, opening inventory balances, recipes and production execution
remain in their owning workflows; Connections does not post or confirm them.

Uploads accept CSV only, up to 500 records and 2 MB. Validation reads current
company records; each attach revalidates and commits all rows plus audit in one
serializable transaction. Customer codes create records; existing ones are rejected.
Other master-data sections update documented matching keys. Existing active status,
production history, recipes and stock remain intact. Hierarchy validation includes
existing location/manager links so a reparent cannot introduce a hidden cycle.
Machines match exact work-centre code and resource name; ambiguous saved matches
are rejected. Blank optional capacity settings keep saved values.

Sales-owned `connection-import.ts` creates new drafts only, rejects existing
references and inconsistent multi-line headers, retains canonical Party/Product
links, resolves customer pricing/discounts and checks currencies. UK sale tax uses
the existing Sales VAT engine and the customer's saved default delivery country.
Amounts/dates/quantities are bounded and checked. Drafts require ordinary Sales
review/confirmation before any downstream fulfilment or accounting.

A 15-minute HMAC review binds the exact file content, destination, section and
staff identity. Changed files/companies/sections require validation again. Fields
are disabled while submitting; changing sections/company clears the old review and
file. A company row lock and content-digest audit key prevent duplicate successful
attachments, including retries of auto-numbered Sales files. Failed imports do not
consume their key. Corrected content can be validated and imported. Identical
intentional repeat files must be changed and reviewed as a new import.

The original CSV is not retained as a document; its filename, section, row count,
actor and timestamp are retained centrally in audit. Latest 30 successful imports
are displayed for the selected company. No local database/cache, user provisioning,
new profile grant or schema migration is introduced. The existing older company
setup/Sales CSV import paths are distinct from this reviewed Connections workflow.

Checks: `tests/connections.test.ts`, existing setup tests, production build, types
and focused lint. `scripts/check-connections.ts` is explicit Linux-only acceptance
with `ATLAS_CONNECTIONS_LIVE_TEST=1`, central configuration and existing authorised
Guardian staff variables. It creates two synthetic Test companies, exercises all
13 browser upload flows, verifies canonical records/totals/isolation/history,
rejects duplicate/invalid files and disabled apps, checks mobile overflow, then
suspends those exact companies while retaining audited records. Existing QA staff
and customer permissions remain unchanged. Deployment evidence belongs in shared
CURRENT_STATE and `docs/evidence/`.
