# Templates in CRM — Customer Self-Service Configuration

**View, change, and manage templates right from the customer record in CRM.**

Customers see which template they're on, what that means for their orders/invoices/workflows, and can request changes.

## Customer Record Template Section

### In CRM → Customer Detail Page

**New "Configuration" Tab**

Shows:
- **Current Template:** WHOLESALE (with icon/badge)
- **Template Description:** "For B2B wholesale customers. NET30 payment terms, approval required for orders over £50k, call-offs enabled."
- **Active Since:** Oct 4, 2026
- **Next Review:** Oct 4, 2027

**What This Template Means:**

Section per module:
```
SALES
├─ Orders: approval required over £50,000
├─ Payment: NET30 (Net 30 days)
├─ PO: required
├─ Call-offs: allowed
└─ Discounts: allowed up to 5%

LOGISTICS
├─ Delivery: requires time window
├─ Signature: required
├─ Tracking: required
└─ Auto-confirm: disabled

FINANCE
├─ Approval: required over £50,000
├─ Auto-post: disabled
├─ Credit limit: £500,000
└─ Payment methods: bank transfer, LOC

INVENTORY
├─ Backorder: not allowed
└─ Cycle count: weekly
```

Each feature is clearly explained:
- Name: "Approval required over £50,000"
- What it means: "Orders this size need finance manager sign-off"
- Impact: "May take 1-2 business days for approval"

### Change Template

**Button: "Change Template"**

Opens dialog:
- Current: WHOLESALE
- Available templates:
  - RETAIL_DTC (different configuration)
  - EXPORT_INTL (different configuration)
  - SERVICES_PSA (different configuration)
  - PREMIUM (everything enabled)
  - RESTRICTED (minimal features)

**On change:**
- Shows comparison: what changes
- "Changing to EXPORT_INTL will:
  - ✓ Enable proforma invoices
  - ✓ Require commodity codes
  - ✓ Add Incoterms field
  - ✗ Disable call-offs
  - ✗ Require export license on file"

- Requires confirmation: "Yes, change to EXPORT_INTL"
- Sends notification to company admin
- Audit trail: who changed, when, from/to

### Request Changes

**Button: "Request Different Configuration"**

Opens form:
- "Your current template works for: __"
- "You need: __"
- Message to company: "What changes would you like?"

Example:
```
Your current template works for: standard wholesale orders with NET30 terms
You need: we also do consignment stock, so we need backorder capability
Message: Can we get temporary backorder enabled for SKU-12345 class only?
```

**Workflow:**
- Creates task for company admin
- Email: "Customer request: change template"
- Admin reviews, decides:
  - Grant (create customer override)
  - Deny (reply with reason)
  - Escalate (to management)

### Customer Overrides

**Section: "Your Custom Settings"**

Shows anything unique to this customer (on top of template):
- ✓ Backorder enabled (WHOLESALE + override)
- ✓ Approval limit raised to £100k (vs £50k default)
- ✓ Early payment discount 3/10 NET30 (added)

**Edit Overrides:**
- Company admin can grant customer-specific exceptions
- Customer can request in "Request Changes" form
- Each override shows: who set it, when, expiry date (optional)

Example override:
```
Override: Consignment Stock Enabled
Reason: Trial period for customer X
Set by: Sarah (Account Manager)
Date: Oct 4, 2026
Expires: Dec 4, 2026 (2 months)
```

## CRM Reporting

### Dashboard: Template Distribution

**Chart: Customer by Template**
- RETAIL: 45 customers (60%)
- WHOLESALE: 25 customers (33%)
- EXPORT: 5 customers (7%)

**Chart: Pending Request Changes**
- 3 customers waiting
- 1 change approved, awaiting implementation

**Table: Template Changes This Month**
- Oct 2: Acme → EXPORT_INTL (approval required)
- Oct 4: Smith Corp → WHOLESALE
- Oct 8: Chen Ltd → PREMIUM (on hold, needs CFO approval)

### Template Compliance Report

**Audit question: "Are all customers on appropriate templates?"**

Identifies mismatches:
- ⚠️ Retail customer on PREMIUM template (overpowered)
- ⚠️ Manufacturing customer on RETAIL template (lacks features)
- ⚠️ Export customer on WHOLESALE template (missing compliance features)

Suggests corrections:
- Move [Acme Retail] from PREMIUM → RETAIL (save on features)
- Move [Smith Mfg] from RETAIL → INDUSTRIAL (add needed capabilities)

## Sales Process

### New Opportunity → Template

When creating a new opportunity for a customer:

**Auto-fill:** 
- Order type: allowed types from their template
- Payment terms: template default
- Approval limit: template limit
- Available features: call-offs yes/no, etc.

**Show template context:**
- "This customer is on WHOLESALE template"
- "Orders over £50k need approval (yours is £45k ✓)"
- "NET30 is standard, but they can change for this order"

### Opportunity to Order

When converting opportunity to order:

**Validation:**
- "PO required for this customer" — ensure PO is filled
- "Approval needed for this £65k order" — flag it for approval queue
- "This customer allows call-offs" — show call-off option
- "No backorder allowed for this customer" — set allocation to full

## Templates in Service/Customer Success

### Onboarding Checklist

**New customer → assigned template → onboarding flow**

When customer assigned to WHOLESALE template:

**Day 1:** Send welcome package
- Contract (MSA + Terms)
- Portal setup (contracts.yourcompany.com/start)
- Invoice example ("Here's what your invoices look like")
- Order form template ("Order like this")

**Day 3:** Account manager call
- "Let me show you what your template means"
- Show: approval process, payment terms, call-off ordering
- Ask: "Need any changes?"

**Day 7:** Training
- Portal walkthrough (sign contracts, download invoices)
- Order-to-delivery flow
- Questions answered

### Customer Success Metrics Per Template

**Compare customers on same template:**
- Average order size: WHOLESALE £8,500, RETAIL £250
- Approval time: WHOLESALE 12 hrs (auto if under limit), RETAIL 0 hrs
- Payment term adoption: WHOLESALE 45 days (NET30), RETAIL COD
- Support tickets per customer: WHOLESALE 2/mo, RETAIL 0.5/mo
- Portal adoption: WHOLESALE 80%, RETAIL 20%

**Insights:**
- RETAIL customers don't use portal → reduce access
- WHOLESALE customers need faster approvals → add VP approval tier
- EXPORT customers have high compliance questions → add FAQ to portal

## Account Manager Dashboard

**Per-customer template section:**

Shows:
- Current template + when assigned
- Recent changes/requests
- Overrides granted
- Customer satisfaction with template (survey)
- Suggestions: "Switch to X template to reduce approval time"

**Template health:**
- "This customer's order pattern matches WHOLESALE well"
- "Consider: would EXPORT template better fit if they start shipping internationally?"
- "Override expires in 30 days: override: early payment discount"

## Finance Operations

### Template-Based Billing

**Invoice processing differs per template:**

RETAIL:
- Auto-post on delivery
- No approval
- Simple layout

WHOLESALE:
- Requires approval if over limit
- Detailed layout
- Aging reports monthly

EXPORT:
- Requires CFO approval
- Detailed cost breakdown
- Compliance documentation attached

**Finance dashboard:**
- "5 invoices awaiting approval (all WHOLESALE, all >£50k)"
- "2 overdue customers (both WHOLESALE, overdue >30 days)"
- "3 export invoices ready for import duty allocation"

## Sales Operations

### Territory & Template Alignment

**Territory rule:**
- North America: assign to EXPORT_INTL (they ship internationally)
- EU: assign to WHOLESALE (domestic, NET30)
- UK: assign to RETAIL_DTC (e-commerce)

**Auto-assign on region selection:**
- Sales rep creates customer → selects region "North America" → template auto-set to EXPORT_INTL

**Exception workflow:**
- "This customer is in EU but wants EXPORT template" → requires approval → sales director approves

## Contract Attachment

### Contracts in Customer Record

**New "Contracts" tab**

Shows:
- Master Service Agreement (signed Oct 4, expires Oct 4, 2027)
- Terms of Trade (signed Oct 4, expires Oct 4, 2027)
- SLA (signed Oct 4, expires Oct 4, 2027)
- NDA (signed Sept 1, expires Sept 1, 2028)

**Actions:**
- Download (PDF of signed contract)
- Renew (send renewal reminder email)
- Revise (create new version, send for re-sign)
- History (see all versions)

**Auto-reminders:**
- 90 days before expiry: "Renewal reminder for [Customer], SLA expires in 90 days"
- 30 days: second reminder
- 7 days: escalation to account manager
- On expiry: "SLA expired for [Customer], orders now blocked until renewed"

### Customer Can Edit Contracts

**Customer-facing contract page (in portal):**

Shows:
- All signed contracts
- Expiry dates + renewal countdown
- "Request changes" button

**Workflow:**
- Customer: "Our payment terms should be NET45, not NET30"
- Portal: sends change request
- Company: reviews, creates new MSA with NET45, sends for re-sign
- Customer: signs updated MSA
- System: tracks old vs new version

**Audit trail:**
- Original MSA (Oct 4, signed by CEO)
- Revision 1 (Oct 15, payment terms NET45, signed by CEO + Director)
- Current: Revision 1

## Configuration & Permissions

### Who Can Change Templates?

**Admin:**
- Can change any customer's template
- Can create overrides
- Can create new templates

**Account Manager (optional):**
- Can request template change for their customers
- Cannot approve (goes to admin)
- Can see template + suggest to customer

**Customer (optional, per template):**
- Can request changes
- Can see what their template means
- Cannot directly change (request goes to admin)

Features:
- `template.customer_can_view` (BOOLEAN) - customer sees their template
- `template.customer_can_request_changes` (BOOLEAN) - customer can request changes
- `template.customer_can_override_features` (BOOLEAN) - customer can self-enable features (risky)
- `template.account_manager_can_change` (BOOLEAN) - AM can change without approval
- `template.approval_required_on_change` (BOOLEAN) - any change needs approval

### Template Change Approval

When customer/AM requests change:

Approval required from:
- `template.approval_roles` (ARRAY) - ["sales_director", "vp_sales"]
- Or auto-approve if:
  - Under £50k impact (e.g., slightly higher discount limit)
  - Covered by existing feature set (same capabilities)

## Examples

### Example 1: Retail to Wholesale Upgrade

Situation:
- Customer on RETAIL template (simple)
- Grows to wholesale scale
- Needs call-offs, approvals, NET30 terms

Process:
1. Account manager: "Time to upgrade. See your template options?"
2. Customer clicks in portal: "Request different configuration"
3. Fills form: "We're growing, need NET30 and call-off capability"
4. Company admin: reviews, approves upgrade to WHOLESALE
5. System: sends change notification
6. Customer: sees updated rules in portal
7. Next order: shows call-off option, payment terms changed

### Example 2: Export Customer Adds Domestic

Situation:
- Customer on EXPORT template (Incoterms, commodity codes, etc.)
- Also doing domestic UK sales
- Doesn't need export docs for UK

Process:
1. Account manager: "Your UK orders don't need export docs. Let's add a domestic override."
2. Creates override: "Domestic UK orders use WHOLESALE rules, export orders use EXPORT"
3. System: on order creation, asks "Domestic or export?"
4. If domestic: uses WHOLESALE rules (no Incoterms, no commodity codes)
5. If export: uses EXPORT rules

### Example 3: Customer Self-Service Request

Situation:
- Customer on WHOLESALE template
- Wants early payment discount enabled

Process:
1. Customer in portal: sees "Early payment discount: not available in WHOLESALE"
2. Clicks: "Request this feature"
3. Form: "Why you need it: We pay early if we get discount"
4. Company: receives request in dashboard
5. Decision: approve (add 2/10 NET30 override)
6. Customer notified: "Your request approved! Early payment discount enabled."
7. Next invoice: shows "2% discount if paid within 10 days"

## Benefits

✅ **Transparency:** customers see what their template means  
✅ **Flexibility:** can request changes without calling support  
✅ **Alignment:** features match customer needs  
✅ **Growth:** easy to upgrade template as customer grows  
✅ **Self-service:** reduces support calls  
✅ **Audit trail:** all changes tracked  
✅ **Sales efficiency:** template shown in opportunity flow  
✅ **Contract management:** all contracts in customer record  

**Customer experience:**
- "I can see exactly what I can do on this template"
- "I can request changes in the portal"
- "My account manager proactively suggests improvements"
- "No surprise limitations"
