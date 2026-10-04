---
name: system-connection-plan
description: Technical plan to connect all Atlas modules and fix data flow
metadata:
  type: project
---

# Atlas System Connection Plan — Complete Wiring and Live Integration — 4 October 2026

## Executive Summary

Atlas is **architecturally sound but missing the final connection pass**. The modules exist, the schemas are written, the providers are declared—but integrations are incomplete, schemas aren't deployed centrally, and critical handoffs are untested.

This plan prioritizes **three integration tiers**:
1. **Fix immediate blockers** (schema, data-service registration)
2. **Wire existing connections** (test and verify declared providers)
3. **Complete missing integrations** (outbox dispatcher, events bus, cross-module handoffs)

**Timeline**: 2-3 weeks to full live integration, verified end-to-end.

---

## Part 1: Blocker Assessment — What's Blocking Live Integration

### 1.1 Central Database Schema Not Applied ❌ CRITICAL

**Status**: Migrations written but not deployed to shared Postgres.

**Impact**: Every new entity table missing from production → read-policy denies it → installed app cannot access it.

| Migration | Table/Models | Deployed? | Impact |
|---|---|---|---|
| `20261004100000_customer_templates` | `customer_templates`, `customer_template_modules`, `customer_template_changes`, `customer_template_assignments` | ❌ NO | Customer Template system entirely unavailable |
| `20261004200000_sales_projects` | `sales_projects`, `sales_project_organisations`, `sales_project_stakeholders` | ❌ NO | SalesProject routes 404 / capability gated |
| `20261004090000_payroll_module_foundation` | Payroll schema + role capability rename | ✅ PARTIAL | Desktop build includes it; server may not have Role `payroll.*` capability rename |
| Scheduling/Plan/Manufacturing migrations | Various | ❓ UNKNOWN | Source inspection cannot verify central application |

**Fix required:**
```bash
# On central server with Postgres access
cd /opt/atlas-production (or test, staging)
npx prisma migrate deploy  # Apply all pending migrations
psql -d atlas_db -c "SELECT * FROM _prisma_migrations LIMIT 5"  # Verify
```

**Owner**: Operator with server DB access. Does NOT require desktop rebuild.

---

### 1.2 Data-Service Read Policy Missing for New Models ❌ CRITICAL

**Status**: New models written to schema but not registered in read-policy allowlist.

**Location**: `src/server/data-api/read-policy.ts`

**Impact**: Desktop queries for new models fail `FORBIDDEN: missing data capability` even with correct session capability.

**Confirmed gaps**:
- Teams: Planner* models not registered (FIXED in earlier session, but pattern repeats)
- Customer Templates: `customer_templates`, `customer_template_modules`, etc. not added
- SalesProject: 3 new models not mapped to capability
- Manufacturing: MRP models if not registered

**Example from Teams fix** (shows the pattern):
```typescript
// src/server/data-api/read-policy.ts — ADD THIS for each new model:
export const readPolicy = {
  // ... existing ...
  customer_templates: {
    capability: 'core.modules.manage',  // or appropriate module capability
    modelScope: (model, context) => ({ organisationId: context.org })
  },
  customer_template_modules: {
    capability: 'core.modules.manage',
    modelScope: (model, context) => ({ organisationId: context.org })
  },
  sales_projects: {
    capability: 'sales.opportunityManage',
    modelScope: (model, context) => ({ organisationId: context.org })
  },
  // ... etc
};
```

**Fix required:**
1. For EACH new table in pending migrations:
   - Map to appropriate capability (see `src/core/permissions/capabilities.ts`)
   - Add `modelScope` for tenant isolation
2. Regenerate `src/server/data-api/model-metadata.ts`:
   ```bash
   npx prisma generate
   node scripts/generate-data-api.mjs
   ```
3. Rebuild central data service and restart

**Owner**: Operator or Claude with server access. Requires central rebuild.

---

### 1.3 Module Enablement Not Set on Server ❌ BLOCKING

**Status**: Module exists in source; not `enabled` on server for Michael's organisation.

**Confirmed issues**:
- **Payroll**: Build complete, deployed to Mac, but server has `module_states.enabled=false` for Payroll/Northbridge Group
  - User cannot reach `/payroll` (403 Forbidden)
  - Fix: Run `deploy/enable-payroll.mjs northbridge demo@atlas.app` (operator only)
- **Teams**: Fixed in earlier session (now `enabled=true`)
- **Manufacturing**: Unknown status

**Fix required:**
For EACH not-yet-enabled module:
```bash
# On central server (operator only)
node deploy/enable-MODULE.mjs ORGANIZATION_SLUG ADMIN_EMAIL
# Example:
node deploy/enable-payroll.mjs northbridge michaelpatrickfrost@googlemail.com
node deploy/enable-manufacturing.mjs northbridge michaelpatrickfrost@googlemail.com
node deploy/enable-planning.mjs northbridge michaelpatrickfrost@googlemail.com
```

This:
1. Sets `module_states.enabled=true, entitled=true`
2. Grants `MODULE.*` capabilities to admin role
3. Runs STANDARD_ROLES sync for staff/team_manager/etc.

**Owner**: Operator with server DB access.

---

### 1.4 Role Capability Mismatches ❌ BLOCKING

**Status**: Some roles missing capabilities for modules that are enabled.

**Confirmed issues**:
- **Teams**: `staff` and `team_manager` roles missing `teams.read`/`teams.manage` (had to be manually added via SQL)
- **Payroll**: Any non-admin role trying to see Payroll gets 403
- **New capabilities**: When a module gets its own namespace (e.g., `sales_rep` → `SALES_CAPABILITIES`), existing role DB records still have old capability names

**Example from Payroll**:
- Code: `assertCapability(session, PAYROLL_CAPABILITIES.runManage)` ✅
- DB: Role still has `people.payroll.manage` ❌
- User sees 403

**Fix required:**
When deploying a new module or capability namespace:
1. Run the module's `enable-MODULE.mjs` script (it handles STANDARD_ROLES sync)
2. If manual SQL grants were needed (Teams case), document them
3. Verify live: sign in as each role type → try to navigate to module → should work

**Owner**: Operator + desktop verification.

---

## Part 2: Connection Tier 1 — Wire Existing Providers and Handoffs

### 2.1 Sales → Logistics Integration ⚠️ PARTIALLY WORKING

**Current state**:
- ✅ Provider exists: `salesLogisticsConsumer` in Sales manifest
- ✅ Handoff code: `src/core/logistics/handoff.ts` → `consumeSalesOrder()`
- ✅ Called on order confirm: `src/modules/sales/services/commands.ts`
- ❌ **Not verified end-to-end**: no live test of full workflow
- ❌ **Retry/idempotency**: unclear if double-confirm creates duplicate requirements

**Test required** (Part 3):
```
1. Create Sales order for product with stock
2. Confirm order → should create FulfilmentRequirement
3. Reopen order → reconfirm → requirement should NOT duplicate
4. Check line quantities match in both Sales and Logistics
5. Move requirement through warehouse (pick/pack/dispatch)
6. Verify order status reflects logistics progress
```

**Known issue**: Empty confirmed orders (seed data) open requirements with no lines → warehouse operation fails. FIXED at demand layer; verify it doesn't regress.

---

### 2.2 Logistics → Finance Integration ⚠️ PARTIALLY WORKING

**Current state**:
- ✅ Provider: `deliveryInvoiceConsumer` in Logistics manifest
- ✅ Handoff: `src/core/finance/handoff.ts` → `deliveryInvoiceConsumer()`
- ✅ Called on delivery complete: `src/modules/logistics/services/commands.ts`
- ❌ **Not verified**: no live test
- ❌ **Idempotency**: if Finance is disabled, delivery still marks complete; rescanning delivery after Finance is enabled should NOT create duplicate invoice

**Test required** (Part 3):
```
1. Confirm and deliver an order
2. Check Finance has draft invoice for delivered quantity
3. Invoice date = delivery date (not order date)
4. Quantity on invoice = delivered quantity (not ordered quantity)
5. Delivery line tracks "invoiced" flag correctly
6. Disable Finance module → redeliver same order → no second invoice
7. Re-enable Finance → old delivery should NOT re-invoice (idempotency)
```

---

### 2.3 Inventory ↔ Logistics Stock Provider ⚠️ NEEDS LIVE VERIFICATION

**Current state**:
- ✅ Provider: `stockProvider` in Stock manifest (gives Logistics the reserve/move functions)
- ✅ Consumer: `stockReplenishedConsumer` (when stock comes in, release pending delivery)
- ⚠️ **Partially tested**: seed data works locally; not verified on central server with real multi-warehouse scenario

**Test required** (Part 3):
```
1. Order 100 units; only 30 in stock → deliver 30, hold 70
2. Receive purchase receipt for 50 units
3. Logistics should auto-release delivery for remaining 70 (if stock arrives: 30 + 50 = 80, so 70 can ship)
4. Verify no race condition between receipt and order confirmation
```

---

### 2.4 HR ↔ Scheduling ↔ Payroll Integration ⚠️ NEEDS DATA SEEDING

**Current state**:
- ✅ Schema: Employee, RotaShift, PaySlip all exist
- ✅ Code: Payroll reads confirmed RotaShift + approved absence
- ❌ **No test data**: shared `demo` organisation has ZERO HR employees
  - Team planner lists nobody
  - Payroll has nobody to pay

**Fix required**:
```bash
# Seed central server with demo employees (one-time)
psql -d atlas_db -h central-host << EOF
INSERT INTO hr_employees (id, org_id, user_id, name, email, job_title, status) VALUES
  ('emp1', 'org_northbridge', 'user_sophie', 'Sophie Green', 'sophie@northbridge.co', 'Manager', 'ACTIVE'),
  ('emp2', 'org_northbridge', 'user_jordan', 'Jordan Pike', 'jordan@northbridge.co', 'Operator', 'ACTIVE'),
  ('emp3', 'org_northbridge', NULL, 'Alex Chen', 'alex@northbridge.co', 'Staff', 'ACTIVE');
EOF

# Then: create rota, approve leave, run payroll in the app
```

**Test required** (Part 3):
```
1. Create confirmed RotaShift for 10 hours (overtime)
2. Record approved sickness/maternity absence
3. Run payroll → payslip should show overtime + statutory pay
4. View own payslip on /profile (gated by payroll.payslip.self)
```

---

### 2.5 Sales + Inventory → Planning (Demand Source) ⚠️ NEEDS VERIFICATION

**Current state**:
- ✅ Provider: `planningDemandProvider` in Sales; `planningInventoryProvider` in Stock
- ✅ Called by Planning queries
- ❌ **Not verified**: no test of "create plan, see real order/stock in forecast"

**Test required** (Part 3):
```
1. Create and confirm sales order for 50 units
2. Open Planning → create new plan
3. Planning should show demand row for that product
4. Quantity = 50 (from confirmed order)
5. Check it changes if order is cancelled (should remove demand row)
```

---

## Part 3: Connection Tier 2 — End-to-End Test Suite

### Build the Integration Test Matrix

**Each connection gets one live test**. Use a shared test organisation; clean up records after.

**Test environment setup**:
```bash
# Local: npx prisma migrate dev (apply all migrations to test DB)
npm run seed  # Load demo org + test data

# Central (if different): migrate + seed from schema + operator setup

# Then run each test with known org/user/product IDs
npm run test:integration  # (not yet implemented)
```

**Core tests to implement** (in `tests/integration/`):

| Test | File | Steps | Expected | Pass? |
|---|---|---|---|---|
| Sales → Logistics | `sales-logistics-handoff.test.ts` | Create order, confirm, check requirement | FulfilmentRequirement exists with correct lines | ⏳ |
| Logistics → Finance | `delivery-invoice-handoff.test.ts` | Deliver, check invoice | Invoice exists, date=delivery, qty=delivered | ⏳ |
| Fulfillment → Order status | `fulfillment-projection.test.ts` | Move through warehouse, check order status | Order shows allocated/shipped/delivered | ⏳ |
| Stock replenishment | `stock-release-on-receipt.test.ts` | Receipt + pending delivery | Delivery auto-releases | ⏳ |
| Payroll with timesheets | `payroll-timesheet-integration.test.ts` | Shift + sick + holiday → payslip | Lines reconcile, amount correct | ⏳ |
| Planning demand | `planning-live-demand.test.ts` | Create plan + confirmed order | Demand shows in forecast | ⏳ |
| Manufacturing → Stock | `manufacturing-stock-posting.test.ts` | Produce and receipt | Stock moves to finished goods | ⏳ |
| CRM visibility | `crm-sales-rep-visibility.test.ts` | Rep sees own, manager sees all | Visibility enforced | ⏳ |
| Customer Template features | `customer-templates-runtime.test.ts` | Assign template, check feature gate | Order requires/blocks PO correctly | ⏳ |

---

## Part 4: Connection Tier 3 — Incomplete Integrations and Outbox

### 4.1 Manufacturing → Planning → Inventory ⚠️ FOUNDATION ONLY

**Current state**:
- ✅ Product recipe exists (components, work centre, rates)
- ✅ MRP calculation code written
- ❌ **Not wired to Planning demand**: Production Planning does not read Manufacturing requirements
- ❌ **Outbox not dispatched**: Manufacturing creates `DomainOutbox` records for production completion but no consumer reads them

**What's missing**:
1. Manufacturing `outboxProductionCompletionConsumer` → Stock module to post inventory
2. Planning reads Production orders to adjust supply forecast (currently reads only Firm Orders, not make-to-order)

**Not in scope for this pass** (too large):
- Finite scheduling
- Work order dispatch and scanning
- Shop-floor WIP tracking

**Needed for this pass**:
```typescript
// src/modules/manufacturing/domain/outbox-completion-consumer.ts
export async function consumeProductionCompletion(
  org: Organisation,
  workOrder: WorkOrder
) {
  if (!workOrder.actualQty) return; // Nothing to post
  
  // Move WIP inventory to finished goods
  await stock.receiveManufacturedGoods({
    product: workOrder.product,
    quantity: workOrder.actualQty,
    warehouse: workOrder.plant.warehouse,
    workOrderId: workOrder.id
  });
}
```

Register in manifest:
```typescript
outboxProductionCompletionConsumer: consumeProductionCompletion
```

---

### 4.2 Events Bus — Named Subscriptions Not Implemented ⚠️ ARCHITECTURAL

**Current state**:
- ✅ Event emitter exists: `src/core/events/bus.ts`
- ❌ **No subscriptions**: searches for `on(EVENTS.*)` or `subscribe()` return nothing
- ❌ **No dispatcher**: transactional outbox is written but nothing reads it

**Impact**: Async integrations between modules are entirely synchronous (provider handoffs only).

**Not critical for v1** (can be synchronous):
- Sales confirmation → Logistics requirement: already synchronous
- Delivery → Finance: already synchronous
- Production completion → Stock: can be synchronous

**Future (not this pass)**:
- Build outbox dispatcher (`src/core/outbox/dispatcher.ts`)
- Implement event consumers (e.g., Marketing lead qualification → CRM)
- Decouple modules via event subscriptions

**For now**: Verify existing provider/handoff chains are truly synchronous and retryable.

---

### 4.3 Optional Providers Not Implemented ⚠️ GRACEFUL DEGRADATION

**These are declared but empty**:
- Safety → Manufacturing/Logistics/Sales restrictions (safety permits/restrictions not enforced)
- Analytics hooks in Payroll/Teams/Manufacturing (metrics not available)

**Not required for data flow**; modules work without them. Document what's unavailable:
- "Safety module not yet integrated" → no permit gates
- "Manufacturing analytics not available" → no dashboard metrics

---

## Part 5: Customer Templates — Last Remaining Activation

### 5.1 Schema Applied But System Not Activated ⚠️ READY

**Status**:
- ✅ Migration written: `20261004100000_customer_templates`
- ✅ Core services written: `src/core/templates/registry.ts`, `commands.ts`, `queries.ts`
- ✅ Features documented for every module
- ❌ **Not yet active**: schema not deployed, modules not calling `registerTemplateFeatures()`, app code not checking `isFeatureEnabled()`

**Activation checklist**:

1. **Apply migration** (Part 1 blocker)
   ```bash
   npx prisma migrate deploy  # Central server
   ```

2. **Modules register features** (each manifest):
   ```typescript
   // src/modules/sales/manifest.ts
   export const salesManifest = {
     // ...
     commands: async (registry) => {
       // Register template features
       registry.registerModuleFeatures('sales', SALES_TEMPLATE_FEATURES);
     }
   }
   ```

3. **App code checks features** (at decision points):
   ```typescript
   // src/modules/sales/components/order-form.tsx
   const poRequired = await isFeatureEnabled(org, customerId, 'sales.require_customer_po');
   if (poRequired && !order.po) throw new Error('PO required');
   ```

4. **Console UI built** (create/edit/assign templates)
   ```bash
   # Already stubbed; implement pages under:
   # src/app/(app)/console/templates/
   ```

5. **Test end-to-end**:
   ```
   1. Create template "RETAIL" with require_customer_po=false
   2. Create template "WHOLESALE" with require_customer_po=true
   3. Assign Customer A to RETAIL
   4. Create order for Customer A without PO → should succeed
   5. Assign Customer B to WHOLESALE
   6. Create order for Customer B without PO → should fail with "PO required"
   ```

---

## Part 6: Deployment Sequence (Live Integration)

**This is the exact order to deploy** (dependencies first):

### Phase 1: Infrastructure (Operator, 1 day)
1. ✅ Backup central Postgres
2. ⏳ Apply all pending migrations: `npx prisma migrate deploy`
3. ⏳ Regenerate data-service metadata: `npx prisma generate && node scripts/generate-data-api.mjs`
4. ⏳ Add read-policy entries for ALL new models (see Part 1.2)
5. ⏳ Restart central data service
6. ⏳ Verify schema check passes: `node scripts/check-release-schema.mjs`

### Phase 2: Module Enablement (Operator, 2 hours)
1. ⏳ Enable Payroll: `node deploy/enable-payroll.mjs northbridge michaelpatrickfrost@googlemail.com`
2. ⏳ Enable Manufacturing: `node deploy/enable-manufacturing.mjs northbridge michaelpatrickfrost@googlemail.com`
3. ⏳ Enable Planning: `node deploy/enable-planning.mjs northbridge michaelpatrickfrost@googlemail.com`
4. ⏳ Verify capabilities granted: check `roles` table for `payroll.*`, `manufacturing.*`, etc.
5. ⏳ Seed HR employees (so Team planner, Payroll have test data)

### Phase 3: Data Seeding (Operator, 1 hour)
1. ⏳ Seed demo HR employees (see Part 2.4)
2. ⏳ Create sample products with recipes (manufacturing test data)
3. ⏳ Create sample price lists and customer templates

### Phase 4: Build & Install Desktop (Claude Code, 1 hour)
1. ⏳ Desktop build: `npm run desktop:build`
2. ⏳ Install: `scripts/install-mac-client.sh build/Atlas.app`
3. ⏳ Verify: launch installed app, check all routes accessible

### Phase 5: Integration Testing (Claude Code + Operator, 3-5 days)
Run the test matrix from Part 3. For each test:
1. Set up known test data
2. Execute workflow end-to-end
3. Verify results at each step
4. Document any failures or workarounds
5. Record pass/fail

### Phase 6: Production Activation (Operator, 1 day)
1. ⏳ Repeat integration tests against production data (with real records in test org)
2. ⏳ Document any "known limitations" or unavailable features
3. ⏳ Create runbook for support (e.g., "Module X has feature Y unavailable because Z")

---

## Part 7: Known Limitations and Deferments

### Deferred (Not Critical for Integration)

| Item | Why | When |
|---|---|---|
| Outbox dispatcher and event bus | Synchronous provider handoffs work; async can be added later | v2 |
| Manufacturing finite scheduling | Recipe→WO works; optimized scheduling deferred | v2 |
| Analytics metrics for new modules | Providers declared but not filling dashboards | v2 |
| Safety permit gates | Safety module exists but integration hooks not implemented | v2 |
| Full Projects costing | Project costing deferred per source brief | v2 |

### Expected Known Issues

| Issue | Workaround | Owner |
|---|---|---|
| Empty team roster | Operator must seed HR employees | Operator |
| Payroll not yet submitted to HMRC | Manual filing required; Atlas calculates only | Finance |
| Double-confirm creates duplicate requirement? | **To be tested**; known fix at demand layer | Cloud |
| Manufacturing WIP not tracked shop-floor | Execution workbench deferred | Product |

---

## Part 8: Acceptance Criteria

### Before Marking Complete

- [ ] All pending migrations applied to central Postgres
- [ ] Read-policy entries added for all new models
- [ ] Data-service metadata regenerated and tested
- [ ] All modules enabled for test organisation
- [ ] Sales → Logistics handoff tested end-to-end: order → requirement → delivery
- [ ] Logistics → Finance handoff tested: delivery → invoice
- [ ] Inventory stock provider tested: receipt releases pending demand
- [ ] HR + Payroll tested: shift + absence → payslip with correct amounts
- [ ] Planning reads live sales demand
- [ ] Manufacturing production posts to stock
- [ ] Team planner shows actual employees
- [ ] CRM visibility enforced (rep sees own only)
- [ ] Customer templates active (feature gates working)
- [ ] Installed app loads all modules without errors
- [ ] All integration test suite tests passing (Part 3)
- [ ] No new build warnings or lint errors
- [ ] Operator has runbook for future deployments

---

## Part 9: Files to Create / Modify

### New Test Files
```
tests/integration/sales-logistics-handoff.test.ts
tests/integration/delivery-invoice-handoff.test.ts
tests/integration/fulfillment-projection.test.ts
tests/integration/stock-release-on-receipt.test.ts
tests/integration/payroll-timesheet-integration.test.ts
tests/integration/planning-live-demand.test.ts
tests/integration/manufacturing-stock-posting.test.ts
tests/integration/crm-sales-rep-visibility.test.ts
tests/integration/customer-templates-runtime.test.ts
```

### New Server Code (Central Data Service)
```
src/server/data-api/read-policy.ts — ADD entries for:
  - customer_templates, customer_template_modules, etc.
  - sales_projects, sales_project_organisations, etc.
  - (plus any Manufacturing/Planning/other new models)
```

### Console UI (Not Blocking Data Flow, Deferred)
```
src/app/(app)/console/templates/page.tsx
src/app/(app)/console/templates/create.tsx
src/app/(app)/console/templates/edit.tsx
src/app/(app)/console/templates/assign.tsx
```

### Documentation
```
docs/INTEGRATION_RUNBOOK.md — step-by-step to deploy and verify
docs/TROUBLESHOOTING.md — what to do if a connection fails
```

---

## Summary: The Path Forward

**Weeks 1-2:** Fix blockers (schema, read-policy, module enablement, data seeding)

**Weeks 2-3:** Build and run integration test suite; fix issues found

**Week 3:** Production activation; write runbook

**Result**: End-to-end data flow from Customer → Order → Warehouse → Invoice, with all modules talking to each other, verified live in the installed app.

---

*This plan is actionable and specific. Each section names the exact file, function, and test needed. Following this sequentially will result in a fully connected, live-verified system.*
