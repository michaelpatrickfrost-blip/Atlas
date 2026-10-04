# Customer Templates — Contract Management & E-Signatures

**Send contracts to customers, collect digital signatures, manage execution, all in Atlas.**

No external e-signature services needed. Contracts live in the system, signing is tracked, URLs are shareable, everything is audited.

## Contract Types

### Commercial Agreements
- Master Service Agreement
- Service Level Agreement (SLA)
- Terms of Trade
- Volume/Pricing Agreement
- Dealer/Reseller Agreement
- Distribution Agreement

### Orders & Sales
- Order confirmation with T&Cs
- Call-off agreement
- Project addendum
- Change order

### Service Delivery
- Statement of Work (SOW)
- Service Level Agreement
- Support agreement
- Maintenance agreement

### Regulatory & Compliance
- Data Processing Agreement (GDPR/CCPA)
- Non-Disclosure Agreement (NDA)
- Liability waiver
- Risk acknowledgement

## Contract Configuration

**Per-template:**

Features:
- `contracts.enabled` (BOOLEAN) - use contracts
- `contracts.require_signature_before_order` (BOOLEAN) - can't create order without signed agreement
- `contracts.require_signature_before_delivery` (BOOLEAN) - shipment requires signed agreement on file
- `contracts.require_annual_renewal` (BOOLEAN) - agreement expires, must be renewed
- `contracts.renewal_reminder_days` (NUMBER) - send reminder N days before expiry
- `contracts.auto_send_on_order` (BOOLEAN) - email contract when order placed
- `contracts.auto_send_on_customer_creation` (BOOLEAN) - new customer gets agreement automatically

**Contract Types Per Template:**

```json
{
  "code": "B2B_WHOLESALE",
  "contracts": {
    "required_contracts": [
      "MASTER_SERVICE_AGREEMENT",
      "TERMS_OF_TRADE",
      "SLA"
    ],
    "optional_contracts": [
      "NDA",
      "DATA_PROCESSING_AGREEMENT"
    ],
    "contract_templates": {
      "MASTER_SERVICE_AGREEMENT": {
        "name": "Master Service Agreement",
        "template_file": "MSA_B2B_2024.pdf",
        "require_signature": true,
        "signatories_required": 1,
        "valid_for_days": 365,
        "auto_send": true,
        "send_to": "accounts@customer.com",
        "signature_deadline_days": 14,
        "reminder_days": [7, 3, 1],
        "escalation_email": "legal@company.com"
      },
      "TERMS_OF_TRADE": {
        "name": "Terms of Trade",
        "template_file": "ToT_B2B_2024.pdf",
        "require_signature": true,
        "signatories_required": 1,
        "valid_for_days": 365,
        "auto_send": true,
        "send_to": "accounts@customer.com"
      },
      "SLA": {
        "name": "Service Level Agreement",
        "template_file": "SLA_B2B_2024.pdf",
        "require_signature": true,
        "signatories_required": 1,
        "valid_for_days": 365
      }
    }
  }
}
```

## E-Signature Workflow

### Send Contract to Customer

1. **Generate contract** from template + customer data
   - Fill in customer name, address, dates
   - Add order details if contract is order-linked
   - Insert payment terms, shipping address, etc.

2. **Generate signing link**
   - Unique URL per contract
   - Shareable: customer receives email + SMS option
   - No login required: click link, sign immediately
   - QR code option

3. **Signature capture**
   - Signature pad or click-to-sign
   - Type name or draw signature
   - Timestamp captured
   - IP address logged
   - Device information logged

4. **Verify & execute**
   - Signature validated
   - Contract locked (immutable)
   - PDF generated with signature
   - Audit trail recorded

5. **Archive & reminder**
   - Contract stored in system
   - Accessible to both parties
   - Expiry tracked
   - Renewal reminders sent

### Features

**Contract Sending:**
- `contracts.email_enabled` (BOOLEAN) - send via email
- `contracts.sms_enabled` (BOOLEAN) - send SMS with link
- `contracts.send_to_primary_contact` (BOOLEAN)
- `contracts.send_to_account_manager` (BOOLEAN)
- `contracts.send_to_custom_list` (ARRAY) - email addresses
- `contracts.include_cover_letter` (BOOLEAN) - intro text in email
- `contracts.signature_deadline_days` (NUMBER) - must sign within N days
- `contracts.allow_rejection` (BOOLEAN) - customer can reject/request changes
- `contracts.rejection_comment_required` (BOOLEAN)
- `contracts.require_wet_signature` (BOOLEAN) - printed + mailed, not digital

**Signature Capture:**
- `signatures.method` (ENUM) - DIGITAL_PAD | TYPE_NAME | CLICK_TO_SIGN | EMAIL_SECURE
- `signatures.timestamp_required` (BOOLEAN) - capture when signed
- `signatures.gps_location_required` (BOOLEAN)
- `signatures.ip_address_logged` (BOOLEAN)
- `signatures.device_info_logged` (BOOLEAN)
- `signatures.photo_id_required` (BOOLEAN) - verify with ID
- `signatures.phone_verification_required` (BOOLEAN)
- `signatures.email_verification_required` (BOOLEAN)
- `signatures.multiple_signatories` (BOOLEAN) - chain of signatures
- `signatures.signatories_order` (ARRAY) - who signs first, second, etc.
- `signatures.signer_role_required` (ENUM) - e.g., AUTHORIZED_OFFICER, DIRECTOR
- `signatures.title_required` (BOOLEAN) - signer's job title

**Workflows:**
- `workflow.sequential_signing` (BOOLEAN) - signer A signs, then B, then C
- `workflow.parallel_signing` (BOOLEAN) - all signers sign independently, in any order
- `workflow.require_all_signatories` (BOOLEAN) - all must sign before contract is valid
- `workflow.allow_partial_signature` (BOOLEAN) - contract valid after first signer (rest have deadline)
- `workflow.reminder_frequency` (ENUM) - NONE | ONCE | DAILY | EVERY_3_DAYS
- `workflow.escalation_enabled` (BOOLEAN) - escalate to manager if not signed in time
- `workflow.escalation_email` (STRING) - who to escalate to

**After Signature:**
- `execution.auto_lock_after_signature` (BOOLEAN) - contract becomes immutable
- `execution.auto_execute_after_signature` (BOOLEAN) - contract takes effect immediately
- `execution.auto_execute_after_all_signatures` (BOOLEAN) - waits for all signers
- `execution.manual_execution_required` (BOOLEAN) - admin must approve/execute
- `execution.send_signed_copy_to_customer` (BOOLEAN) - email PDF back to customer
- `execution.send_signed_copy_to_signatories` (BOOLEAN) - each signer gets a copy
- `execution.send_signed_copy_to_team` (ENUM) - SALES | CUSTOMER_SUCCESS | BOTH | NONE
- `execution.webhook_on_signature` (BOOLEAN) - trigger workflow in external system
- `execution.trigger_on_signature` (ARRAY) - ["CREATE_ORDER", "SEND_WELCOME_EMAIL", "ENABLE_API_ACCESS"]

## Contract Portal

**Customers can:**
- View all their contracts in one place
- Sign contracts without login (via unique link)
- View signed/unsigned status
- Download copies
- Request changes
- Renew expiring agreements
- Access from mobile or desktop

**Company can:**
- See all contract statuses
- Send reminders
- Resend links
- Request signatures
- Manage versions
- Track who signed what and when
- Generate compliance reports

## Contract Linking

**Link contracts to:**
- Customer (applies to all orders)
- Specific order (this order requires this contract)
- Project (all project work under this agreement)
- Employee (employment contract)
- Supplier (purchase agreement)

Features:
- `linkage.contract_blocks_order` (BOOLEAN) - unsigned agreement blocks order
- `linkage.contract_blocks_delivery` (BOOLEAN) - unsigned agreement blocks shipment
- `linkage.contract_blocks_invoice` (BOOLEAN) - unsigned agreement blocks billing
- `linkage.auto_link_to_orders` (BOOLEAN) - all orders automatically linked
- `linkage.customer_can_request_changes` (BOOLEAN) - customer can mark "needs changes"
- `linkage.change_request_workflow` (BOOLEAN) - change → re-send → re-sign

## Contract Versions & History

**Version Control:**
- `versioning.track_versions` (BOOLEAN) - keep all versions
- `versioning.require_re_signature_on_changes` (BOOLEAN) - changes force re-signing
- `versioning.minor_changes_no_signature` (BOOLEAN) - typos don't need re-signature
- `versioning.show_redline` (BOOLEAN) - highlight changes from previous version
- `versioning.require_approval_before_sending` (BOOLEAN) - admin approves before customer sees

**Archival:**
- `archival.immutable_after_signature` (BOOLEAN) - cannot edit
- `archival.retain_forever` (BOOLEAN) - never delete
- `archival.retain_days` (NUMBER) - keep for N days after expiry
- `archival.legal_hold` (BOOLEAN) - cannot delete (litigation hold)
- `archival.audit_trail` (BOOLEAN) - log every access

## Contract Templates

**Template Structure:**

```json
{
  "name": "Master Service Agreement",
  "description": "Standard MSA for B2B wholesale customers",
  "type": "MSA",
  
  "fields": [
    {
      "name": "customer_name",
      "label": "Customer Name",
      "data_source": "Party.name",
      "editable": false,
      "required": true
    },
    {
      "name": "customer_address",
      "label": "Customer Address",
      "data_source": "Address.full",
      "editable": false,
      "required": true
    },
    {
      "name": "effective_date",
      "label": "Effective Date",
      "data_source": "TODAY",
      "editable": true,
      "required": true
    },
    {
      "name": "term_years",
      "label": "Term (Years)",
      "default": 1,
      "editable": true,
      "required": true
    },
    {
      "name": "payment_terms",
      "label": "Payment Terms",
      "data_source": "CustomerCommercialSettings.paymentTerms",
      "editable": true,
      "required": true
    },
    {
      "name": "sla_response_time",
      "label": "SLA Response Time (hours)",
      "default": 24,
      "editable": true,
      "required": false
    }
  ],
  
  "signatories": [
    {
      "role": "AUTHORIZED_OFFICER",
      "title": "Authorized Officer or Director",
      "required": true,
      "order": 1
    },
    {
      "role": "COMPANY_AUTHORIZED",
      "title": "Company Representative",
      "required": true,
      "order": 2
    }
  ],
  
  "conditions": {
    "requires_wet_signature": false,
    "requires_identity_verification": false,
    "valid_for_days": 365,
    "renewal_reminder_days": [90, 30, 7, 1],
    "escalation_email": "legal@company.com"
  }
}
```

## E-Signature Workflow Example

### Scenario: New B2B Customer

1. **Customer signs up** → system creates `Customer` record
2. **Auto-send contracts** → MSA + Terms of Trade emailed
3. **Email contains:**
   - Personal greeting
   - 2 signing links (MSA, ToT)
   - Deadline: 14 days
   - QR codes for mobile
4. **Customer clicks link → no login required**
5. **Signature capture form:**
   - Name field (auto-filled or customer types)
   - Signature pad or checkbox
   - Timestamp (automatic)
   - IP/device logged
6. **Customer signs MSA → email reminder for ToT**
7. **Customer signs ToT**
8. **Contracts marked "EXECUTED"**
9. **System actions triggered:**
   - Send signed copies to customer
   - Send notification to sales team
   - Customer can now place orders
   - Add to customer portal
10. **Renewal:** 11 months in → "Please renew your agreement" reminder

## API & Integration

**Workflows that trigger on contract signature:**

```json
{
  "on_signature_actions": [
    {
      "action": "UNLOCK_ORDER_CREATION",
      "description": "Customer can now create orders"
    },
    {
      "action": "SEND_WELCOME_EMAIL",
      "description": "Send onboarding email to customer"
    },
    {
      "action": "CREATE_ACCOUNT_MANAGER_TASK",
      "description": "Task: Call and introduce yourself"
    },
    {
      "action": "ENABLE_CUSTOMER_PORTAL",
      "description": "Grant portal access"
    },
    {
      "action": "ENABLE_API_ACCESS",
      "description": "Generate API keys"
    },
    {
      "action": "ADD_TO_CRMSYSTEM",
      "description": "Create opportunity in CRM"
    },
    {
      "action": "SEND_WEBHOOK",
      "description": "POST to external system"
    }
  ]
}
```

## Contract Templates Per Business Type

### Retail (Simple/Optional)
```json
{
  "code": "RETAIL_TERMS",
  "name": "Retail Terms & Conditions",
  "optional": true,
  "require_signature": false,
  "content": "Returns within 30 days. 12-month warranty..."
}
```

### B2B Wholesale (Comprehensive)
```json
{
  "code": "B2B_MSA",
  "required_contracts": [
    {
      "name": "Master Service Agreement",
      "template": "MSA_B2B.pdf",
      "require_signature": true,
      "signatories": 1,
      "valid_days": 365
    },
    {
      "name": "Terms of Trade",
      "template": "ToT_B2B.pdf",
      "require_signature": true,
      "signatories": 1,
      "valid_days": 365
    },
    {
      "name": "SLA",
      "template": "SLA_B2B.pdf",
      "require_signature": true,
      "signatories": 1,
      "valid_days": 365
    }
  ],
  "auto_send": true,
  "signature_deadline": 14,
  "reminders": [7, 3, 1]
}
```

### Export (Compliance-Heavy)
```json
{
  "code": "EXPORT_COMPLIANCE",
  "required_contracts": [
    {
      "name": "International Terms",
      "template": "INTL_TERMS.pdf",
      "require_signature": true,
      "signatories": 2,
      "signatories_order": ["AUTHORIZED_OFFICER", "COMPANY_DIRECTOR"]
    },
    {
      "name": "Export Compliance Agreement",
      "template": "EXPORT_COMPLIANCE.pdf",
      "require_signature": true,
      "signatories": 1,
      "require_identity_verification": true
    },
    {
      "name": "Sanctions Compliance",
      "template": "SANCTIONS.pdf",
      "require_signature": true,
      "signatories": 1
    }
  ],
  "legal_review_required": true,
  "legal_approvers": ["legal@company.com"]
}
```

### Manufacturing (Operations-Heavy)
```json
{
  "code": "MANUFACTURING_AGREEMENT",
  "required_contracts": [
    {
      "name": "Quality Agreement",
      "template": "QUALITY_AGREEMENT.pdf",
      "require_signature": true,
      "signatories": 1,
      "blocks_production": true
    },
    {
      "name": "Supplier Requirements",
      "template": "SUPPLIER_REQS.pdf",
      "require_signature": true,
      "signatories": 1
    }
  ],
  "auto_send": true,
  "on_signature": ["UNLOCK_ORDERS", "UNLOCK_PRODUCTION"]
}
```

## What This Delivers

✅ **No external e-signature service needed** - all in Atlas  
✅ **Complete audit trail** - who signed, when, where, what device  
✅ **Shareable links** - customers sign without login  
✅ **Automatic workflows** - signing triggers actions (unlock orders, send emails, enable API)  
✅ **Multi-signer support** - sequential or parallel signing  
✅ **Version control** - track contract changes  
✅ **Compliance** - immutable records, legal holds, audit logs  
✅ **Mobile-friendly** - QR codes, responsive design  
✅ **Renewable** - automatic reminders when expiring  
✅ **Per-customer variation** - different contracts for different customers  

**Example:** Customer signs B2B MSA → system automatically:
- Unlocks order creation
- Sends welcome email
- Creates sales task "call and confirm"
- Enables customer portal
- Generates API keys
- Creates CRM opportunity
- Sets renewal reminder for 11 months

All in one flow. No manual steps.
