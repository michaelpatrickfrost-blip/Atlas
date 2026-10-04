# Atlas Finance requirement coverage

Captured: 3 October 2026. [Exact supplied brief](FINANCE_SOURCE_REQUIREMENTS.md).

All 80 sections remain required. This is an acceptance map, not implementation
or proof of full live delivery. Finance is a registered runtime foundation and
replaces the separate Purchasing stub. Partial implementation is documented in
[the workspace delivery record](FINANCE_WORKSPACE.md). Every row remains OPEN
until all its specified acceptance evidence exists; partial workflows do not close it.
No delivery phases or reduced MVP have been agreed.

All checks also require server-enforced tenant/capability scope, relevant legal
entity/source access, central-only business persistence and compatible installed
Mac/data-service release. Example amounts are acceptance fixtures, not live data.

| Section | Requirement | Owning boundary | Required evidence | Status |
| --- | --- | --- | --- | --- |
| 1 | FINANCE HOME | Finance / Analytics | Every position reconciles to authorised source records; each metric drills into the exact contributing set, with currency/entity/as-of context. | OPEN |
| 2 | FINANCE WORKSPACES | Finance UI | All eleven supplied workspaces are reachable with capability-filtered navigation and readable desktop/mobile layouts. | OPEN |
| 3 | PURCHASE-TO-PAY | Finance purchasing / Core approvals | Create, submit and revise a request with all supplied fields; remaining budget, quotation requirement and route derive from current policy. | OPEN |
| 4 | APPROVAL ENGINE | Core approvals | Sequential/parallel routes, conditional rules, dated delegation, escalation, information requests and original/delegate audit pass concurrency and self-approval checks. | OPEN |
| 5 | PURCHASE ORDERS | Finance purchasing | Approved request generates one PO; partial dates, terms, deposits, freight, dimensions and amendments preserve approval and lineage. | OPEN |
| 6 | GOODS RECEIVING | Logistics / Inventory / Finance | Ordered, received, damaged, accepted and outstanding quantities reconcile per line; GRNI and commitments reconcile to valuation without warehouse journal entry. | OPEN |
| 7 | SUPPLIER INVOICE CAPTURE | Finance capture / connectors | Each supplied capture channel retains server-side original evidence; extracted supplier, line, tax and bank fields require confidence/validation and duplicate checks. | OPEN |
| 8 | THREE-WAY MATCHING | Finance AP | Cumulative PO/accepted receipt/invoice matching handles partials, credits and reversals; £2.50 versus £2.72 returns +£220 / 8.8% and blocks under 2% tolerance. | OPEN |
| 9 | TOUCHLESS ACCOUNTS PAYABLE | Finance AP / Core approvals | Touchless route posts only when every supplied gate passes under authorised policy; any missing gate creates a specific exception. | OPEN |
| 10 | SUPPLIER MANAGEMENT | Core Party / Finance suppliers | Supplier extension reuses Party; onboarding verification gates activation and all supplied financial/performance fields have authorised provenance. | OPEN |
| 11 | BANK DETAIL CHANGE CONTROL | Finance controls | Bank change preserves previous verified version, evidence and actors; independent verification blocks payments until complete, including concurrent changes. | OPEN |
| 12 | DUPLICATE PAYMENT PREVENTION | Finance controls | Exact/near duplicate numbers, amounts, dates, bank and document fingerprints produce explainable warnings and prevent repeat settlement. | OPEN |
| 13 | EXPENSE MANAGEMENT | HR / Finance expenses | Existing employee expense identity is retained; receipt capture, category suggestion, submission and central document reads round-trip. | OPEN |
| 14 | EXPENSE POLICY ENGINE | Finance policy / Core approvals | All supplied expense conditions resolve to explainable allow/warn/approval/block decisions; £34 hotel overage is visible. | OPEN |
| 15 | COMPANY CARDS | Finance cards / connectors | Authorised feed transactions map to cardholder, receipt and category; missing receipt queue and department analysis reconcile. | OPEN |
| 16 | ACCOUNTS PAYABLE | Finance AP | All supplied AP states and filters reconcile to open invoices/credits/runs without including paid or disputed amounts incorrectly. | OPEN |
| 17 | PAYMENT RUNS | Finance payments / forecasting | Proposal considers all supplied conditions; deferrals, discounts and forecast headroom are recalculated from current data. | OPEN |
| 18 | PAYMENT APPROVAL | Finance payments / Core approvals | Creator/reviewer/authoriser separation is enforced on server; changed runs invalidate approval and release cannot execute twice. | OPEN |
| 19 | BANKING | Finance banking / connectors | All supplied account types/imports are supported; ledger/bank/unreconciled totals reconcile and explain differences. | OPEN |
| 20 | SMART BANK RECONCILIATION | Finance banking | Multi-invoice £14,820 allocation reconciles exactly; confidence and policy govern automation; duplicate reconciliation and over-allocation fail. | OPEN |
| 21 | ACCOUNTS RECEIVABLE | Sales / Logistics / Finance AR | Eligible dispatch creates one sourced invoice, balanced revenue/VAT/AR posting and settlement; retries cannot duplicate. | OPEN |
| 22 | CUSTOMER FINANCIAL PROFILE | Core Party / Sales / Finance credit | Invoice and open-order exposure do not double count; £173,000 versus £150,000 gives £23,000 warning and controlled override request. | OPEN |
| 23 | CREDIT CONTROL | Finance collections | Age buckets, calls/emails, promises, disputes, plans, holds and outcomes retain customer scope and auditable history. | OPEN |
| 24 | SMART COLLECTIONS | Finance collections | Priority explanations use actual due dates, payment history and disputes, with links to the contributing invoices. | OPEN |
| 25 | CUSTOMER DISPUTES | Customer Service / Sales / Finance | Dispute links case, order, delivery, product and credit; unrelated case/ledger access remains denied. | OPEN |
| 26 | CREDIT NOTES & REFUNDS | Sales / Customer Service / Finance | Reason/value approval gates credits/refunds; allocation and posting cannot exceed original eligible balances. | OPEN |
| 27 | PRODUCT PROFITABILITY | Products / Inventory / Finance | All supplied product economics reconcile to cost/valuation/rebate/transport sources with estimated versus actual context. | OPEN |
| 28 | INVENTORY ACCOUNTING | Inventory / Manufacturing / Finance | Standard/average/FIFO and movement/variance/revaluation policies reconcile quantity and valuation ledgers, including backdates and reversals. | OPEN |
| 29 | LANDED COST | Finance valuation / Inventory | £80,000 + £7,500 + £2,100 + £900 allocates £90,500 exactly under each supplied method, with rounding remainder and source links. | OPEN |
| 30 | GENERAL LEDGER | Finance ledger | All supplied ledger capabilities preserve balanced, immutable postings; reversals, FX, allocations and consolidation reconcile to subledgers. | OPEN |
| 31 | DIMENSIONS | Finance dimensions / Core identities | Dimensions use stable shared references; posting validation and reporting respect entity/department/project/source permissions. | OPEN |
| 32 | AUTOMATIC ACCRUALS | Finance accounting | GRNI/services/accrual/prepayment/deferred schedules generate reviewed, idempotent postings and linked next-period reversals. | OPEN |
| 33 | FIXED ASSETS | Finance assets | Register retains all supplied attributes and server evidence; depreciation reconciles to cost/residual/life and posted journals. | OPEN |
| 34 | ASSET LIFECYCLE | Finance assets / purchasing | Capex provenance survives asset creation, transfer, impairment/revaluation/disposal/sale/write-off with correct immutable journals. | OPEN |
| 35 | BUDGETING | Finance budgets | All supplied budget dimensions/periods are versioned; actual plus remaining commitments is reconciled without invoice/PO double counting. | OPEN |
| 36 | BUDGET CONTROL | Finance budgets / Core approvals | £50k − £31k − £14k gives £5k available and £9k request gives £4k overage; warn/approval/block survive simultaneous requests. | OPEN |
| 37 | FORECASTING | Finance forecasts / operational providers | All supplied sources contribute dated assumptions with provenance; missing integrations remain explicit. | OPEN |
| 38 | CASH FLOW FORECASTING | Finance cash planning | All supplied horizons and flows reconcile; due/expected dates, FX, scenarios and uncertainty remain distinct from posted cash. | OPEN |
| 39 | SCENARIO PLANNING | Finance scenarios | Base/downside/growth recalculate every supplied outcome without changing live accounting; assumptions and comparison versions persist centrally. | OPEN |
| 40 | VAT AND TAX | Finance tax / UK localisation | All supplied VAT treatments and transaction drill-through pass verified localisation tests; HMRC/MTD acceptance is separate from draft return generation. | OPEN |
| 41 | FOREIGN CURRENCY | Finance FX | Transaction/base/settlement rates are retained; realised/unrealised gains and revaluation reconcile with immutable rate provenance. | OPEN |
| 42 | MULTI-COMPANY | Finance entities / consolidation | Each entity retains independent books, VAT/banks/currency/tax; authorised group view eliminates intercompany without tenant leakage. | OPEN |
| 43 | INTERCOMPANY | Finance intercompany | Both sides commit atomically with matched identities, FX/tax policy and reconciliation; one-sided transaction cannot survive failure. | OPEN |
| 44 | MONTH-END CONTROL CENTRE | Finance close | Each supplied close step has owner/deadline/evidence; progress derives from state and prerequisites rather than a decorative percentage. | OPEN |
| 45 | CLOSE ASSISTANT | Finance close / providers | All supplied unusual conditions produce source-linked exceptions at the exact close cutoff. | OPEN |
| 46 | AUDIT TRAIL | Finance / Core audit | Every significant transition captures actor, before/after, reason and approval; posted records cannot be overwritten or deleted through any write path. | OPEN |
| 47 | SEGREGATION OF DUTIES | Core permissions / Finance controls | All supplied conflicting capabilities and transaction actors are checked without hardcoded role names; denied actions leave auditable outcomes. | OPEN |
| 48 | FINANCIAL EXCEPTION CENTRE | Finance exceptions / Core attention | Every supplied exception source has deduplicated, assigned, actionable entries; closure requires source resolution. | OPEN |
| 49 | FINANCIAL REPORTING | Finance reports | All eighteen supplied reports reconcile to posted/operational sources at defined cutoffs and expose contributing transactions. | OPEN |
| 50 | DRILL ANY NUMBER | Finance reports / source access | Account to warehouse to carrier to invoice to original document retains exact totals and independent source permissions. | OPEN |
| 51 | CUSTOM FINANCIAL REPORT BUILDER | Analytics / Finance | Measures, dimensions, periods, comparisons and filters use typed authorised providers; saved/shared/published reports and Excel export are separately verified. | OPEN |
| 52 | MANAGEMENT PACKS | Finance reporting / Analytics | Recurring pack retains versioned figures, reviewed commentary and publication history; unpublished source permissions persist. | OPEN |
| 53 | SMART VARIANCE EXPLANATIONS | Finance analysis | Explanations reconcile to transaction deltas and reproducible classifications; reviewer can inspect each attributed amount. | OPEN |
| 54 | ASK ATLAS FINANCE | Finance query / Analytics | Natural language resolves only authorised supported queries and cites actual contributing records; unavailable answers are explicit. | OPEN |
| 55 | ANOMALY DETECTION | Finance controls | Every supplied pattern produces explainable warnings with source evidence, no accusation or automatic approval. | OPEN |
| 56 | PURCHASE INTELLIGENCE | Finance purchasing analysis | Spend categories and all supplied opportunities derive from actual contracts, supplier identities and price/volume history. | OPEN |
| 57 | CONTRACT AND RENEWAL CONTROL | Finance contracts / Core attention | Renewal and cancellation notice deadlines derive from contract dates/timezone and persist centrally with owner and commitment links. | OPEN |
| 58 | RECURRING EXPENDITURE | Finance recurring spend | Recurring pattern/price/contract warnings use retained source transactions; proposed schedules do not silently post. | OPEN |
| 59 | EXPENDITURE COMMITMENTS | Finance commitments | Uninvoiced PO/capex commitments, AP and cash remain distinct; transitions release commitments exactly once. | OPEN |
| 60 | PROJECT FINANCE | Projects / Finance | Budget/commitments/actual/paid/forecast reconcile by authorised project; £1.52m forecast versus £1.4m budget shows £120k overrun. | OPEN |
| 61 | SALES + FINANCE CONNECTION | Sales / Finance providers | Both teams receive only authorised balances/holds/disputes/pipeline/order/margin projections; read providers and durable processing are verified. | OPEN |
| 62 | PRODUCT + FINANCE CONNECTION | Products / Inventory / Manufacturing / Finance | Bidirectional valuation/cost/variance/scrap/pricing/ageing projections reconcile and respect source capabilities. | OPEN |
| 63 | LOGISTICS + FINANCE CONNECTION | Logistics / Finance | Shipment/customer/order/product/route/carrier costs allocate once; £2,000 − £1,080 − £310 yields £610 contribution. | OPEN |
| 64 | CUSTOMER SERVICE + FINANCE CONNECTION | Customer Service / Finance | Case-origin credit/refund/replacement/write-off requests retain case provenance and guarded financial status without ledger access grant. | OPEN |
| 65 | FINANCE DATA MODEL | Finance schema / Core approvals | All supplied objects have stable tenant/entity-scoped IDs, relationships, migrations, central persistence and complete audit. | OPEN |
| 66 | DOCUMENT GRAPH | Finance / cross-module contracts | Both supplied payment lineage chains are navigable with exact line/revision provenance and independent source gates. | OPEN |
| 67 | UNIVERSAL FINANCIAL TIMELINE | Finance / Core audit | Capture/match/approval/post/payment timeline renders actual ordered events and actors; retry attempts remain distinguishable. | OPEN |
| 68 | ROLE-BASED EXPERIENCES | Finance / Core permissions | All six supplied audiences see only permitted actions and data; employee self-service is independently scoped. | OPEN |
| 69 | SEARCH | Finance / Core search | Reference/party/product/bank/amount searches return authorised actual transactions, with currency and exact/partial matching context. | OPEN |
| 70 | FINANCE NOTIFICATIONS | Finance / Core attention | Requires-you/exception/risk/deadline/insight notifications are deduplicated and policy-directed with authorised source links. | OPEN |
| 71 | PERIOD LOCKING | Finance periods / Core approvals | Open/soft-closed/closed/locked rules differ by ledger/source where configured; reopen requires independent approval and permanent audit. | OPEN |
| 72 | DATA IMPORT & MIGRATION | Finance import | Every supplied format/object supports mapping, validation preview, duplicate checks, opening-balance reconciliation and idempotent posting. | OPEN |
| 73 | INTEGRATIONS | Finance connectors | All supplied integrations have authenticated contracts, secret isolation, retries and reconciliation; credentials/availability are separately verified. | OPEN |
| 74 | API | Finance secured data service | Every supplied object/event has tenant/entity/capability checks, schema validation, durable delivery and tested replay/idempotency. | OPEN |
| 75 | ATLAS FINANCIAL CONTROL GRAPH | Core identities / Finance control graph | Shared-bank, conflicting-actor and eleven £4,900 purchases below £5,000 patterns use evidence-based graph links and independent review. | OPEN |
| 76 | ATLAS FINANCE DESIGN PRINCIPLE | Finance UI | Money In/Out/Held/Planned summarise authorised records while technical ledger remains accessible to permitted accountants. | OPEN |
| 77 | WHAT ATLAS SHOULD AUTOMATE | Finance automation | Every supplied automation is separately tested with policy, provenance, retry, exception and reconciliation evidence. | OPEN |
| 78 | WHAT ATLAS MUST NEVER AUTOMATE BLINDLY | Finance controls / Core approvals | All seven forbidden blind actions require explicit authorised human/policy gates; AI cannot approve its own recommendation. | OPEN |
| 79 | THE CORE DIFFERENCE | Finance end-to-end acceptance | Users can inspect what/why/next/action/actor/financial consequence through actual connected records. | OPEN |
| 80 | TARGET EXPERIENCE | Finance installed desktop release | 08:30 position/close/attention screen reconciles to real authorised central data and opens exact records in installed Mac runtime. | OPEN |
