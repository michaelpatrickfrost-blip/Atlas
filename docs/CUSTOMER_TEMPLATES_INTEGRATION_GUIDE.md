# Customer Templates — Complete Integration Guide

**Everything tied together: flexible modules, beautiful documents, e-signature contracts, branded customer portal.**

## What You've Built

A system where **every customer sees a completely different app**, configured from templates:

### Layer 1: Module Features (What customers can do)
- Sales: require PO, enable call-offs, approve orders, set payment terms
- Logistics: auto-confirm delivery, require signature, enable transfers, track serials
- Finance: require approval over limit, auto-post on delivery, enable credit limits
- CRM: control pipeline visibility, forecast frequency, activity tracking
- Manufacturing: require BOM, auto-release work orders, quality gates per step
- ... and every other module

### Layer 2: Documents (How customers receive information)
- Invoices: detailed with cost breakdown, or simple summary
- Quotes: auto-expire, require signature, show availability
- Proformas: for export, include commodity codes and Incoterms
- Delivery notes: simple or with signature, damage checklist, GPS
- Packing slips: customer-facing or internal-only
- Contracts: auto-generate from templates, customized per customer

### Layer 3: E-Signatures (How customers sign)
- Send contract via link (no login required)
- Collect signature digitally
- Chain of signers (CEO signs, then Director)
- Auto-trigger workflows (signing → unlock orders → send welcome email)
- Track every signature: who, when, where, device

### Layer 4: Portal (How customers experience Atlas)
- Beautiful, branded interface (their colors, logo, domain)
- One-click contract signing (like Blocwrite)
- Download invoices and documents
- Track orders and shipments
- Collaborate with shareable links
- Message support
- API access (optional)

## Example: New Customer Journey

### 1. Customer Signs Up

Company admin adds customer in Atlas:
- Name: Acme Manufacturing Ltd
- Industry: Manufacturing
- Assign template: INDUSTRIAL_MANUFACTURING

### 2. Template Takes Effect

Instantly, for this customer:
- Sales orders: require BOM, min order £5000, NET60 payment terms
- Manufacturing: auto-release work orders, quality gates per step, cost by job
- Logistics: require proof of delivery, signature required, location-based inventory
- Finance: orders over £50k require CFO approval, auto-post invoices
- Documents: invoices show cost breakdown, proformas include commodity codes
- Contracts: MSA + Quality Agreement auto-sent
- Portal: branded as Acme, shows contracts, invoices, quality certs, order tracking

### 3. Contract Signing Workflow

1. **System auto-sends MSA + Quality Agreement**
   - Email: "Acme, please sign to get started"
   - Link: contracts.acme-mfg.com/sign/abc123
   - No login required

2. **CEO clicks link → beautiful signing page**
   - Acme Manufacturing logo at top
   - Acme's brand colors
   - "Please sign below. Takes 30 seconds."

3. **CEO signs**
   - Draws signature on pad
   - Timestamp captured
   - ✓ Signed

4. **Quality Manager also needs to sign**
   - System emails: "Please sign the Quality Agreement"
   - Quality Manager clicks link, signs
   - ✓ Signed

5. **Both contracts executed**
   - Signed copies sent to Acme (PDF)
   - Signed copies in portal
   - Automatic actions trigger:
     - Unlock order creation
     - Send welcome email to account manager
     - Create task: "Call Acme to confirm setup"
     - Enable API access
     - Add to CRM

### 4. First Order

Acme sales team creates order in their own CRM/system (or logs into Atlas):

**Order has:**
- BOM required (auto-enforced: can't save without it)
- £8,000 total (allowed: over £5000 minimum)
- NET60 payment terms (auto-filled from template)
- 5 line items with quality gates per step

**System behavior:**
- Immediately confirms order (under £50k, no CFO approval needed)
- Auto-releases work orders to production
- Quality approval required between each step
- Finance sees it and auto-generates invoice on delivery
- Delivery note requires signature

### 5. Fulfillment

Manufacturing team receives work order:
- Quality gates enforced
- Can't move to next step without QA sign-off
- Labor hours tracked for payroll
- Cost accumulated by job

Logistics team receives demand:
- Generates packing slip
- Creates shipping label
- Requires proof of delivery signature
- Generates delivery note

Finance auto-generates invoice:
- Shows cost breakdown (materials, labor, overhead)
- Includes payment terms (NET60)
- Requires no approval (under limit)
- Automatically posted
- Sent to Acme

### 6. Acme Portal

Acme's team sees portal at contracts.acme-mfg.com:

**Header:** Acme Manufacturing logo, brand colors

**Home tab:**
- Welcome: "You have 0 contracts pending signature"
- Recent: Invoice INV-001234 (£8000), Order SO-001 (shipped)
- Quick links: View all invoices, track orders

**Contracts tab:**
- ✓ Master Service Agreement (signed Oct 4)
- ✓ Quality Agreement (signed Oct 4)
- Next renewal: Oct 3, 2027

**Invoices tab:**
- INV-001234 (£8,000) - Due Nov 4 - PAID ✓
- INV-001235 (£12,400) - Due Dec 4 - UNPAID
- Download, print, email options

**Orders tab:**
- SO-001 (£8,000) - DELIVERED - View invoice - Track shipment
- SO-002 (£12,400) - IN_PRODUCTION - Next step: quality approval

**Files tab:**
- Shared files: CAD drawings, specs, templates
- Upload files: POs, artwork, feedback
- Share links with team (Blocwrite-style)

**Messages tab:**
- Chat with account manager
- Support tickets
- Order updates

## System Components

### Core (Already Built)
✅ Template registry (modules declare features)
✅ Template commands (create, update, assign)
✅ Template queries (runtime reading)
✅ Audit trail (track all changes)
✅ Feature validation (type checking, dependencies)

### Documents (Need to Build)
- Document template definitions (PDF layout, fields)
- Field mapping (customer name → Party.name)
- Auto-generation on order/invoice/delivery
- Signature fields in PDF
- S3 storage for PDFs
- Email delivery with branding

### Contracts (Need to Build)
- Contract template files (PDFs with placeholders)
- E-signature capture (signature pad, digital)
- Signer management (who signs, order, deadline)
- Signing link generation (unique URLs)
- Workflow triggers (on signature: unlock orders, send emails, etc.)
- Email delivery and reminders

### Portal (Need to Build)
- Customer-facing Next.js app (separate from admin)
- Auth: unique URLs, no login, email verification optional
- Pages: home, contracts, invoices, orders, files, messages
- Branding: per-customer logo, colors, domain
- File sharing: Blocwrite-style links
- Mobile responsive

## Implementation Roadmap

### Phase 1: Core Templates (Now)
- ✅ Schema migrations
- ✅ Registry, commands, queries
- ✅ 100+ features documented
- ✅ 8 industry templates
- ⏳ Modules call `registerTemplateFeatures()`
- ⏳ App code checks `isFeatureEnabled()`
- ⏳ Console UI: create/edit/assign templates

**Deliverable:** Templates configured, modules obey rules

### Phase 2: Document Management (Next)
- ⏳ Document template format (PDF + field mapping)
- ⏳ Field population (auto-fill customer name, dates, amounts)
- ⏳ Signature fields in PDFs
- ⏳ Auto-generation on events (order created → acknowledgement, delivery confirmed → invoice)
- ⏳ Email delivery with company branding
- ⏳ PDF storage and archival

**Deliverable:** Documents auto-generated, branded, sent to customers

### Phase 3: E-Signature Contracts (Phase 2+)
- ⏳ Contract template files (PDFs with placeholder)
- ⏳ Signing link generation (unique URLs, no login)
- ⏳ Signature capture (pad, type, click)
- ⏳ Multi-signer workflows (sequential/parallel)
- ⏳ Reminders and escalation
- ⏳ Webhook triggers (signing → unlock features)
- ⏳ Email delivery with reminders

**Deliverable:** Customers click link, sign, get executed copy, system takes action

### Phase 4: Customer Portal (Phase 3+)
- ⏳ Portal app (separate Next.js frontend)
- ⏳ Auth: email links, no password login
- ⏳ Pages: contracts, invoices, orders, files, messages
- ⏳ Branding: per-customer logo, colors, domain
- ⏳ File sharing: upload/download with expiry
- ⏳ Mobile responsive
- ⏳ API access (read-only option)

**Deliverable:** Customers have beautiful self-service portal, can sign contracts, download docs

### Phase 5: Advanced Features (After Phase 4)
- ⏳ Document version control (track changes)
- ⏳ Approval workflows (CFO must approve before sending)
- ⏳ Electronic signatures (legally binding, timestamp, IP logged)
- ⏳ Audit reports (who downloaded what, when)
- ⏳ Webhooks (notify external systems of signatures)
- ⏳ Native mobile apps (iOS/Android)
- ⏳ Advanced reporting (portal analytics)

## Key Integration Points

### Module Integration Checklist

**When adding features to a module:**

1. **Define features** in `src/modules/[module]/domain/template-features.ts`
   ```typescript
   export const MODULE_FEATURES = [
     { code: 'feature_code', name: 'Display name', type: 'BOOLEAN', default: false }
   ];
   ```

2. **Register in manifest** in `src/modules/[module]/manifest.ts`
   ```typescript
   export const manifest = {
     // ... manifest properties
     init: () => {
       registerTemplateFeatures(MODULE_FEATURES);
     },
   };
   ```

3. **Check at runtime** in services/actions
   ```typescript
   const enabled = await isFeatureEnabled(org, customer, 'module.feature_code');
   if (!enabled) throw new Error('Not available for this customer');
   ```

4. **Adapt UI** in components
   ```typescript
   const config = await getCustomerTemplate(org, customer);
   if (config.module.feature_code) {
     // Show/enable feature
   }
   ```

5. **Document** in the relevant template guide (e.g., CUSTOMER_TEMPLATES_DOCUMENTS.md)

## Template Activation Checklist

When deploying a template:

- [ ] Create template in console
- [ ] Configure all modules (toggle features)
- [ ] Set default payment terms, approval limits, etc.
- [ ] Assign customers to template
- [ ] Test: create order, verify rules enforced
- [ ] Test: generate documents (invoice, delivery note)
- [ ] Test: send contract, sign, verify triggered actions
- [ ] Deploy to production

## What Each Business Type Sees

### Retail
- Simple orders (no approval)
- Auto-invoice on delivery
- No PO field
- No contract required
- Self-service portal: view invoices only

### B2B Wholesale
- Orders require approval if over limit
- NET30/60 payment terms
- Call-offs allowed
- Contracts required before first order
- Portal: contracts, invoices, orders, payment tracking

### Manufacturing
- Orders require BOM
- Work orders auto-release on confirm
- Quality gates enforced
- Cost tracking by job
- Portal: contracts, quality certs, orders, delivery tracking

### Export
- Proforma required before shipment
- Commodity codes mandatory
- Incoterms required
- Customs documentation auto-generated
- Portal: contracts, proformas, customs docs, export compliance checklist

### Services
- Statements of Work instead of orders
- Milestone-based invoicing
- Hourly timesheet tracking
- Portal: contracts, SOW, invoices, project tracking

## Success Metrics

By template time, measure:
- ✅ Customers configure templates for their business type
- ✅ Orders respect configured rules (PO enforced, approval limits work)
- ✅ Documents auto-generated correctly per customer
- ✅ Contracts signed without friction (>90% same-day sign rate)
- ✅ Portal adoption (>70% of customers using it)
- ✅ Support reduction (self-service docs reduce calls)
- ✅ Contract execution speed (<48 hours from send to signature)

## Cost/Benefit

**Benefits:**
- Same codebase serves unlimited business types
- No custom development per customer
- Faster onboarding (template → ready)
- Higher customer satisfaction (tailored app)
- Reduced support (self-service portal)
- Better margins (less custom work)

**Implementation cost:**
- Phase 1 (templates core): ~80 hours
- Phase 2 (documents): ~120 hours
- Phase 3 (contracts): ~100 hours
- Phase 4 (portal): ~150 hours
- Total: ~450 hours (fully done)

**ROI:**
- After 10 customers on templates: saves 100+ hours custom dev
- After 50 customers: saves 500+ hours
- Recurring benefit: every new customer is instant template application

## Questions & Answers

**Q: Can I change a template after customers are assigned?**
A: Yes. Changes take effect immediately. All customers using that template see the new rules. Useful for mid-stream adjustments.

**Q: What if a customer needs a custom rule?**
A: Templates support customer-specific overrides. E.g., "RETAIL template, but this customer needs PO requirement." Configured in customer record.

**Q: Can I create templates from scratch or do I start with defaults?**
A: Both. STANDARD/PREMIUM/RESTRICTED templates auto-created. You can clone, modify, or create new.

**Q: How many templates should I have?**
A: Usually 3-5 (RETAIL, WHOLESALE, EXPORT, MANUFACTURING, SERVICES). Some businesses have 10+ for different markets/channels.

**Q: Do modules get slower with all this checking?**
A: No. Templates are cached per-request. One DB query per customer per request, then cached in memory.

**Q: Can I A/B test templates?**
A: Yes. Assign template A to 50% of customers, template B to the rest. Compare metrics (order value, approval time, etc.).

**Q: What about existing customers?**
A: Migrate them to STANDARD template (safe defaults). They see no change. Then optionally customize each.

## Conclusion

This system makes Atlas the **most flexible ERP ever built**:
- Same code, infinite configurations
- No custom development per customer
- Beautiful documents and contracts auto-generated
- E-signature without friction
- Branded customer portal with self-service
- Complete audit trail
- Enterprise-ready security

Different customers literally see different apps—all from one codebase, all configured by admin (not engineers).

That's the power of templates.
