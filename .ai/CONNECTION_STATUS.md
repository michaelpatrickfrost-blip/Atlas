---
name: connection-status
description: Current connection status between all Atlas modules
metadata:
  type: project
---

# Atlas Data Flow Status — 4 October 2026

## Visual: Current State vs. Target State

```
CURRENT STATE (Partially Working)
═════════════════════════════════════════════════════════════════

┌─────────────┐
│   PARTY     │  ✅ Live (Customer Master)
│  (Shared)   │
└──────┬──────┘
       │
       ├──→ CRM ────────→ Sales ✅ (working)
       │     (prospects)  (orders, quotes)
       │
       ├──→ Service ────→ Finance (partial)
       │     (cases)      (credits)
       │
       └──→ Marketing    (no handoff yet)


┌─────────────┐     ┌──────────────┐
│  SALES      │────→│ LOGISTICS    │ ⚠️ Works but untested end-to-end
│ (confirmed) │  ✅ │ (demand)     │   - No live verification of full workflow
└─────────────┘     └──────┬───────┘   - Double-confirm idempotency unknown
                           │
                           ├──→ STOCK ⚠️ Partially wired
                           │    - Reserve/move works
                           │    - Replenishment unclear
                           │
                           ├──→ FINANCE ⚠️ Untested
                                (draft invoice)
                                - Delivery → Invoice
                                - No idempotency test


┌─────────────┐     ┌──────────────┐
│  HR         │────→│ SCHEDULING   │ ⚠️ Code exists, no test data
│ (Employee)  │  ✅ │ (rota)       │   - Demo org has ZERO employees
└──────┬──────┘     └──────┬───────┘   - Payroll has nobody to pay
       │                   │
       ├──────────────────→ PAYROLL ⚠️ Built, not yet enabled
       │                   - Calculation code complete
       │                   - Server module not enabled
       │                   - No role capability sync
       │
       └──→ SAFETY (optional)
            - Provider declared but not implemented


┌────────────┐     ┌──────────────┐
│  PRODUCTS  │────→│ PRICING      │ ✅ Wired
│ (shared)   │  ✅ │ (lists)      │
└──────┬─────┘     └──────────────┘
       │
       ├──→ MANUFACTURING ❌ Foundation only
       │    - Recipe schema exists
       │    - MRP calc written
       │    - NOT connected to Planning demand
       │    - Completion outbox NOT dispatched
       │
       ├──→ PLANNING ⚠️ Demand source partially wired
       │    - Reads Sales + Inventory
       │    - No end-to-end test
       │    - Manufacturing input missing
       │
       └──→ SALES ✅ (working)


SCHEMAS WRITTEN BUT NOT DEPLOYED:
════════════════════════════════
❌ customer_templates (3 tables)
❌ sales_projects (3 tables)
⚠️ payroll (foundation applied locally; server status unknown)
❌ Manufacturing models (if new)
❌ Planning models (if new)


DATA-SERVICE READ-POLICY GAPS:
═════════════════════════════
❌ customer_templates* (3 models missing)
❌ sales_project* (3 models missing)
⚠️ All Planner* models (fixed in one session, but pattern repeats)
❌ Manufacturing models (not registered)
❌ Planning models (not registered)

Result: Desktop queries return FORBIDDEN for new models even with correct capability


MODULE ENABLEMENT STATUS:
═════════════════════════
org_northbridge (Michael's org):
- Payroll ❌ enabled=false (build complete, waiting activation)
- Manufacturing ❓ unknown (build status unknown)
- Planning ❓ unknown
- Others ✅ verified working or ❌ known blocked

───────────────────────────────────────────────────────────────

TARGET STATE (Fully Connected)
═════════════════════════════════════════════════════════════════

[CUSTOMER] → [CRM] → [SALES] → [LOGISTICS] → [FINANCE]
   ↓          ↓        ↓          ↓            ↓
[Hierarchy] [Oppty]  [Order]    [Demand]   [Invoice
[Contacts]  [Activity] [Quote]    [Pick]     [Payment]
            [Pipeline] [Call-off] [Pack]     [Posting]
                                  [Ship]
                                    ↓
                                  [STOCK]
                                    ↑
                                  [MFG]
                                  [Produce]


[PRODUCTS] → [PRICING] → [MANUFACTURING] → [PLANNING] → [SALES]
   ↓           ↓            ↓                  ↓           ↓
[Recipe]   [Lists]      [Recipe]         [Demand]    [Cost]
[Plant]    [Discount]   [WO]             [MPS]       [Forecast]
[BOM]      [Currency]   [Schedule]       [MRP]
                        [Costing]        [Coverage]

[HR] → [SCHEDULING] → [PAYROLL]
 ↓       ↓              ↓
[Emp]  [Rota]        [Payslip]
[Leave] [Tasks]       [Tax]
       [Cover]        [NI]
       [Handover]     [Pension]

[HR] → [TEAM PLANNER]
       (real employee roster)

[CUSTOMER] → [SERVICE] → [FINANCE]
[Contact]    [Case]      [Credit]

[MARKETING] ← [CRM]
[Lead] ← [Oppty conversion]
[Campaigns] [Pipeline]

```

---

## Connection Verification Matrix

| From | To | Mechanism | Verified? | Live Test |
|---|---|---|---|---|
| **Sales** | **Logistics** | `salesLogisticsConsumer` provider | ⚠️ Source only | ❌ PENDING |
| Logistics | Finance | `deliveryInvoiceConsumer` provider | ⚠️ Source only | ❌ PENDING |
| Logistics | Stock | `stockProvider` + `stockReplenishedConsumer` | ⚠️ Partial | ❌ PENDING |
| **HR** | **Scheduling** | Shared Employee, RotaShift | ✅ Source | ❌ No test data |
| HR | Payroll | Employee, RotaShift reads | ✅ Source | ❌ Module not enabled |
| Scheduling | Payroll | Confirmed RotaShift input | ✅ Source | ❌ Module not enabled |
| **Sales** | **Planning** | `planningDemandProvider` | ✅ Source | ❌ PENDING |
| Stock | Planning | `planningInventoryProvider` | ✅ Source | ❌ PENDING |
| **Products** | **Manufacturing** | Shared Product + recipe | ✅ Source | ❌ Not wired to Planning |
| Manufacturing | Stock | ❌ Outbox not dispatched | ❌ Missing | ❌ PENDING |
| Manufacturing | Planning | ❌ Not implemented | ❌ Missing | ❌ PENDING |
| **CRM** | **Sales** | Prospect → Opportunity → Order | ✅ Source | ⚠️ Manual conversion |
| CRM | Customer | Party identity | ✅ Source | ✅ Working |
| Marketing | CRM | `marketingHandoff` provider | ✅ Source | ❌ PENDING |
| **Products** | **Sales** | `ProductSelector` + pricing | ✅ Source | ✅ Working |
| Pricing | Sales | Agreement + price list | ✅ Source | ⚠️ Not tested |
| **Service** | **Finance** | Credit handoff | ✅ Source | ❌ PENDING |
| **HR** | **Goals** | Employee scope | ✅ Source | ✅ Working |
| Teams | HR | Shared Employee | ✅ Source | ⚠️ No test data |

---

## Blocker Priority (Fix in This Order)

### 🔴 CRITICAL — Blocks All New Features

1. **Schema not deployed to central Postgres** (Part 1.1)
   - Customer Templates cannot work
   - SalesProject cannot work
   - All new module tables invisible to app
   - **Fix time**: 30 min (operator only)

2. **Read-policy missing for new models** (Part 1.2)
   - Even if schema deployed, queries fail FORBIDDEN
   - Must add entry for EVERY new table
   - **Fix time**: 2-4 hours (generate + rebuild data-service)

3. **Modules not enabled on server** (Part 1.3)
   - Payroll: code built, app installed, user gets 403
   - Manufacturing: unknown status
   - **Fix time**: 30 min per module (script runs)

4. **Role capabilities not granted** (Part 1.4)
   - Even enabled modules fail for non-admin roles
   - Manual SQL or script required
   - **Fix time**: 1-2 hours

### 🟡 HIGH — Blocks Verification & Test Data

5. **HR employees not seeded on server** (Part 2.4)
   - Team planner shows empty roster
   - Payroll has nobody to calculate
   - **Fix time**: 30 min (SQL insert)

6. **Integration tests not built** (Part 3)
   - No automated verification that handoffs work
   - Everything manually tested; easy to break
   - **Fix time**: 2-3 days

### 🟢 MEDIUM — Not Blocking but Incomplete

7. **Manufacturing → Stock outbox not dispatched** (Part 4.1)
   - Production completion not posted to inventory
   - Manual workaround: hand-post receipts
   - **Fix time**: 1 day

8. **Events bus not wired** (Part 4.2)
   - All integrations currently synchronous
   - Can add later without breaking existing
   - **Fix time**: 2-3 days (deferred)

9. **Customer Templates not activated** (Part 5)
   - System built, just not turned on
   - Schema deployed but app code not checking features
   - **Fix time**: 4-6 hours

---

## What Works Right Now ✅

- **Customer Master**: Full customer/contact/address CRUD
- **Sales**: Quote/order creation, basic workflow
- **CRM**: Prospect/opportunity pipeline
- **Pricing**: Price lists, discounts
- **Stock**: Basic inventory (limited by no Logistics)
- **Products**: Product catalogue
- **Finance**: Books, GL (limited by no incoming documents)
- **People**: Employee records, org chart
- **Audit**: Change tracking
- **Analytics**: Dashboards (limited by metrics)

---

## What's Partially Working ⚠️

- **Logistics**: Demand created from orders but warehouse operations limited
- **Payroll**: Calculation engine built but not enabled
- **Team Planner**: Looks work but no employee data to show
- **Planning**: Can create plans but no live demand/stock data
- **Manufacturing**: Recipes exist but not connected to planning

---

## What's Not Working ❌

- **Full commercial workflow**: Order → Delivery → Invoice (untested)
- **Stock balancing**: Receipt doesn't auto-release pending orders
- **Payroll**: Module not enabled; user sees 403
- **Manufacturing**: Completion doesn't post to stock
- **Customer Templates**: Disabled at runtime
- **Events/Outbox**: No dispatcher; async integrations don't work

---

## Next 3 Steps (Start Here)

1. **Today (30 min)**: Operator applies pending schema migrations to central Postgres
2. **Today (2 hrs)**: Operator adds read-policy entries + regenerates data-service
3. **Tomorrow (1 hr)**: Run connection test matrix to find what breaks; fix issues found

See `.ai/SYSTEM_CONNECTION_PLAN.md` for the complete 3-week implementation plan.
