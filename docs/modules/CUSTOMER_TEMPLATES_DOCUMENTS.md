# Customer Templates — Document Configuration

**Complete document and terms customization per customer template.**

Different customers need completely different documents. Retail prints simple receipts. B2B prints detailed invoices with cost breakdowns. Export includes proformas, commodity codes, certificates of origin. Manufacturing includes job costing details.

This system lets every customer template configure:
- Which documents are generated
- What goes on each document
- Which signatures are needed
- Payment and legal terms
- Document language and currency
- Approvals and holds

## Document Types

### Sales Documents

**Order Acknowledgement**
- Confirms receipt of customer order
- Sent to customer immediately after order creation
- May include picking info (internal) or only order summary (customer-facing)

Features:
- `sales_order_ack.enabled` (BOOLEAN) - send acknowledgements
- `sales_order_ack.auto_send` (BOOLEAN) - auto-send on order create
- `sales_order_ack.require_signature` (BOOLEAN) - customer must acknowledge
- `sales_order_ack.include_terms_conditions` (BOOLEAN) - attach T&Cs
- `sales_order_ack.include_delivery_instructions` (BOOLEAN) - delivery details
- `sales_order_ack.include_pricing` (BOOLEAN) - show prices (some customers hidden)
- `sales_order_ack.include_cost_breakdown` (BOOLEAN) - materials/labor/overhead
- `sales_order_ack.include_internal_notes` (BOOLEAN) - internal-only fields
- `sales_order_ack.language` (ENUM) - EN | FR | DE | ES | etc.
- `sales_order_ack.currency_display` (BOOLEAN) - show currency

**Quotation**
- Offer to customer before order
- May require sign-off from customer
- May auto-expire after N days

Features:
- `sales_quotation.enabled` (BOOLEAN)
- `sales_quotation.require_signature` (BOOLEAN)
- `sales_quotation.auto_expire_days` (NUMBER) - expire after N days
- `sales_quotation.require_customer_acceptance` (BOOLEAN) - customer must accept
- `sales_quotation.email_to_customer` (BOOLEAN) - auto-email on create
- `sales_quotation.include_terms_conditions` (BOOLEAN)
- `sales_quotation.include_pricing_detail` (BOOLEAN)
- `sales_quotation.include_delivery_date` (BOOLEAN)
- `sales_quotation.show_availability` (BOOLEAN) - stock status per line
- `sales_quotation.show_lead_time` (BOOLEAN) - delivery date per item

**Proforma Invoice**
- Used for exports, advance payment verification, customs clearance
- May be required before shipment
- May require payment before shipment

Features:
- `sales_proforma.enabled` (BOOLEAN)
- `sales_proforma.required_for_exports` (BOOLEAN) - mandatory for export orders
- `sales_proforma.require_before_shipment` (BOOLEAN)
- `sales_proforma.require_payment_before_shipment` (BOOLEAN)
- `sales_proforma.email_to_customer` (BOOLEAN)
- `sales_proforma.include_weight_volume` (BOOLEAN) - for customs
- `sales_proforma.include_commodity_codes` (BOOLEAN)
- `sales_proforma.include_hs_codes` (BOOLEAN)
- `sales_proforma.include_origin_country` (BOOLEAN)
- `sales_proforma.include_incoterms` (BOOLEAN)
- `sales_proforma.include_harmonized_tariff` (BOOLEAN)
- `sales_proforma.signature_required` (BOOLEAN) - shipper/exporter sign-off

### Finance Documents

**Invoice**
- Main billing document
- Layout, content, approvals highly variable

Features:
- `finance_invoice.layout` (ENUM) - DETAILED | SUMMARY | CUSTOM
- `finance_invoice.include_line_detail` (BOOLEAN) - each line item full detail
- `finance_invoice.include_cost_breakdown` (BOOLEAN) - materials, labor, overhead
- `finance_invoice.include_job_costing` (BOOLEAN) - costed by project/job
- `finance_invoice.include_tax_breakdown` (BOOLEAN) - VAT/sales tax detail
- `finance_invoice.include_discount_detail` (BOOLEAN) - show what discount was applied
- `finance_invoice.include_shipping_charges` (BOOLEAN) - show freight
- `finance_invoice.include_bank_details` (BOOLEAN) - company bank account
- `finance_invoice.include_iban_swift` (BOOLEAN) - IBAN/SWIFT codes
- `finance_invoice.include_payment_terms` (STRING) - NET30, NET60, etc.
- `finance_invoice.include_early_payment_discount` (BOOLEAN) - 2/10 NET30
- `finance_invoice.include_due_date` (BOOLEAN) - payment due
- `finance_invoice.include_late_payment_fee` (BOOLEAN) - consequences of late payment
- `finance_invoice.include_po_number` (BOOLEAN) - reference customer's PO
- `finance_invoice.include_shipping_address` (BOOLEAN)
- `finance_invoice.include_delivery_date` (BOOLEAN) - when it was delivered
- `finance_invoice.require_signature` (BOOLEAN)
- `finance_invoice.require_approval` (BOOLEAN) - CFO/finance manager approval
- `finance_invoice.approval_required_if_over` (NUMBER) - e.g., 10000
- `finance_invoice.email_to_customer` (BOOLEAN)
- `finance_invoice.email_bcc_list` (ARRAY) - internal distribution
- `finance_invoice.language` (ENUM) - EN | FR | DE | ES | etc.
- `finance_invoice.currency` (STRING) - GBP | EUR | USD | etc.
- `finance_invoice.retain_days` (NUMBER) - archive after N days
- `finance_invoice.sign_digitally` (BOOLEAN) - e-signature required

**Credit Note**
- Refund or adjustment
- May require approval
- May need to reference original invoice

Features:
- `finance_credit_note.enabled` (BOOLEAN)
- `finance_credit_note.require_approval` (BOOLEAN)
- `finance_credit_note.approval_limit` (NUMBER)
- `finance_credit_note.require_reason` (BOOLEAN) - reason mandatory
- `finance_credit_note.include_original_invoice_ref` (BOOLEAN)
- `finance_credit_note.require_original_invoice` (BOOLEAN) - must exist
- `finance_credit_note.email_to_customer` (BOOLEAN)
- `finance_credit_note.offset_against_receivable` (BOOLEAN) - auto-apply to customer balance

**Debit Note**
- Additional charge (e.g., freight not included, handling fee)

Features:
- `finance_debit_note.enabled` (BOOLEAN)
- `finance_debit_note.require_approval` (BOOLEAN)
- `finance_debit_note.approval_limit` (NUMBER)
- `finance_debit_note.email_to_customer` (BOOLEAN)

**Statement**
- Periodic accounting statement (monthly/quarterly)

Features:
- `finance_statement.enabled` (BOOLEAN)
- `finance_statement.frequency` (ENUM) - MONTHLY | QUARTERLY | ANNUALLY
- `finance_statement.include_aging` (BOOLEAN) - age debt
- `finance_statement.include_payment_history` (BOOLEAN)
- `finance_statement.email_to_customer` (BOOLEAN)
- `finance_statement.email_frequency` (ENUM) - AUTO | ON_REQUEST

### Logistics Documents

**Packing Slip**
- What's in each box/pallet
- May be internal-only or customer-facing

Features:
- `logistics_packing_slip.enabled` (BOOLEAN)
- `logistics_packing_slip.customer_facing` (BOOLEAN) - goes in shipment
- `logistics_packing_slip.internal_only` (BOOLEAN) - warehouse use only
- `logistics_packing_slip.include_lot_numbers` (BOOLEAN)
- `logistics_packing_slip.include_serial_numbers` (BOOLEAN)
- `logistics_packing_slip.include_weights` (BOOLEAN)
- `logistics_packing_slip.include_dimensions` (BOOLEAN)
- `logistics_packing_slip.include_handling_unit_id` (BOOLEAN) - pallet/carton ID
- `logistics_packing_slip.barcode_per_item` (BOOLEAN)
- `logistics_packing_slip.print_automatically` (BOOLEAN)
- `logistics_packing_slip.barcode_format` (ENUM) - CODE128 | QR | EAN

**Delivery Note**
- Proof of delivery, signed by recipient
- Attached to shipment

Features:
- `logistics_delivery_note.enabled` (BOOLEAN)
- `logistics_delivery_note.include_line_items` (BOOLEAN)
- `logistics_delivery_note.include_quantities` (BOOLEAN)
- `logistics_delivery_note.signature_field` (BOOLEAN)
- `logistics_delivery_note.timestamp_field` (BOOLEAN)
- `logistics_delivery_note.recipient_name_field` (BOOLEAN)
- `logistics_delivery_note.damage_checklist` (BOOLEAN) - check for damage
- `logistics_delivery_note.photographic_evidence` (BOOLEAN) - photo of delivery
- `logistics_delivery_note.gps_verification` (BOOLEAN) - GPS location on delivery
- `logistics_delivery_note.digital_signature` (BOOLEAN) - e-signature

**Shipping Label / Manifest**
- Carrier label for package
- Manifest for bulk shipments to carrier

Features:
- `logistics_shipping_label.enabled` (BOOLEAN)
- `logistics_shipping_label.barcode_type` (ENUM) - CODE128 | QR | SSCC
- `logistics_shipping_label.include_weight` (BOOLEAN)
- `logistics_shipping_label.include_dimensions` (BOOLEAN)
- `logistics_shipping_label.include_tracking_number` (BOOLEAN)
- `logistics_shipping_label.include_reference_numbers` (BOOLEAN)
- `logistics_shipping_label.carrier_manifest_enabled` (BOOLEAN)
- `logistics_shipping_label.manifest_format` (ENUM) - CSV | XML | EDI | PDF
- `logistics_shipping_label.auto_generate` (BOOLEAN)

**Return Authorization**
- Authorizes customer returns
- May require reason, authorization number

Features:
- `logistics_return_authorization.enabled` (BOOLEAN)
- `logistics_return_authorization.require_reason` (BOOLEAN)
- `logistics_return_authorization.include_return_address` (BOOLEAN)
- `logistics_return_authorization.include_ra_number` (BOOLEAN)
- `logistics_return_authorization.email_to_customer` (BOOLEAN)
- `logistics_return_authorization.include_restocking_fee` (BOOLEAN)

### Quality Documents

**Inspection Report**
- Product or material inspection results

Features:
- `quality_inspection_report.enabled` (BOOLEAN)
- `quality_inspection_report.include_pass_fail` (BOOLEAN)
- `quality_inspection_report.include_measurements` (BOOLEAN)
- `quality_inspection_report.include_defects` (BOOLEAN)
- `quality_inspection_report.require_signature` (BOOLEAN)
- `quality_inspection_report.send_to_customer` (BOOLEAN)
- `quality_inspection_report.customer_facing_version` (BOOLEAN) - sanitized, without internal notes

**Certificate of Analysis**
- Lab/test results
- Usually sent to customer

Features:
- `quality_certificate_of_analysis.enabled` (BOOLEAN)
- `quality_certificate_of_analysis.required_for_regulated_products` (BOOLEAN)
- `quality_certificate_of_analysis.send_to_customer` (BOOLEAN)
- `quality_certificate_of_analysis.include_test_methods` (BOOLEAN)
- `quality_certificate_of_analysis.include_tolerance_ranges` (BOOLEAN)
- `quality_certificate_of_analysis.lab_signature_required` (BOOLEAN)

### Export/Customs Documents

**Certificate of Origin**
- Proves product origin for tariff purposes

Features:
- `customs_certificate_of_origin.enabled` (BOOLEAN)
- `customs_certificate_of_origin.required_for_exports` (BOOLEAN)
- `customs_certificate_of_origin.form_type` (ENUM) - EUR1 | EUR.MED | FORM_A | CUSTOM
- `customs_certificate_of_origin.include_commodity_codes` (BOOLEAN)
- `customs_certificate_of_origin.include_harmonized_tariff` (BOOLEAN)
- `customs_certificate_of_origin.chamber_of_commerce_stamp` (BOOLEAN)
- `customs_certificate_of_origin.signature_required` (BOOLEAN)

**Customs Declaration**
- Details for customs clearance

Features:
- `customs_declaration.enabled` (BOOLEAN)
- `customs_declaration.required_for_exports` (BOOLEAN)
- `customs_declaration.include_commodity_codes` (BOOLEAN)
- `customs_declaration.include_hs_codes` (BOOLEAN)
- `customs_declaration.include_weights` (BOOLEAN)
- `customs_declaration.include_values` (BOOLEAN)
- `customs_declaration.include_incoterms` (BOOLEAN)
- `customs_declaration.include_shipper_details` (BOOLEAN)
- `customs_declaration.include_consignee_details` (BOOLEAN)
- `customs_declaration.electronic_filing` (BOOLEAN) - auto-file with customs

## Terms & Conditions

Template-level T&Cs that appear on documents.

Features:
- `terms_conditions.payment_terms` (STRING) - e.g., "Payment due within 30 days of invoice"
- `terms_conditions.payment_instructions` (STRING) - bank details, payment methods
- `terms_conditions.warranty_statement` (STRING) - product warranty
- `terms_conditions.liability_limitation` (STRING) - liability cap
- `terms_conditions.return_policy` (STRING) - returns allowed within 30 days
- `terms_conditions.dispute_resolution` (STRING) - escalation process
- `terms_conditions.governing_law` (STRING) - jurisdiction
- `terms_conditions.early_payment_discount` (STRING) - 2/10 NET30
- `terms_conditions.late_payment_interest` (STRING) - interest rate on overdue amounts
- `terms_conditions.currency_fluctuation` (STRING) - how exchange rate changes are handled
- `terms_conditions.force_majeure` (STRING) - unforeseen circumstances clause
- `terms_conditions.confidentiality` (STRING) - NDA terms
- `terms_conditions.sla` (STRING) - Service Level Agreement details
- `terms_conditions.support_hours` (STRING) - availability
- `terms_conditions.custom_terms_1_through_5` (STRING) - custom clauses per customer

Example template T&Cs:
```json
{
  "terms_conditions": {
    "payment_terms": "Payment due NET30 from date of invoice",
    "payment_instructions": "Bank Transfer: Sort Code 12-34-56, Account 12345678, IBAN GB12 ABCD 1234 5678 90",
    "warranty_statement": "Products warranted for 12 months from delivery against defects in materials and workmanship",
    "liability_limitation": "Liability capped at invoice value",
    "return_policy": "Returns accepted within 30 days of delivery in original condition",
    "dispute_resolution": "Disputes resolved through mediation, then binding arbitration under ICC rules",
    "governing_law": "Governed by English law",
    "early_payment_discount": "2% discount if paid within 10 days",
    "late_payment_interest": "8% per annum on overdue invoices",
    "custom_terms_1": "All goods remain property of seller until payment received in full"
  }
}
```

## Branding & Layout

**Company Branding**
- Logo on documents
- Colors, fonts
- Company details (address, VAT, company registration)

Features:
- `branding.logo_url` (STRING) - company logo image
- `branding.logo_position` (ENUM) - TOP_LEFT | TOP_CENTER | TOP_RIGHT | NONE
- `branding.company_name` (STRING)
- `branding.company_address` (STRING)
- `branding.company_phone` (STRING)
- `branding.company_email` (STRING)
- `branding.company_website` (STRING)
- `branding.vat_registration` (STRING)
- `branding.company_registration_number` (STRING)
- `branding.tax_id` (STRING)
- `branding.primary_color` (STRING) - hex color
- `branding.secondary_color` (STRING)
- `branding.font_family` (STRING) - Arial, Helvetica, etc.
- `branding.footer_text` (STRING) - "Thank you for your business"
- `branding.document_header` (STRING) - letterhead text

**Customer-Specific Branding**
- Some customers want their own logo on documents (co-branded)
- Some customers want their terms instead of ours

Features:
- `branding.customer_logo_allowed` (BOOLEAN) - customer can upload logo
- `branding.customer_logo_position` (ENUM) - alongside company logo
- `branding.customer_terms_override` (BOOLEAN) - use customer's terms instead
- `branding.customer_letterhead` (BOOLEAN) - customer can provide letterhead

## Document Approval Workflows

**Who must approve which documents?**

Features:
- `approval.invoice_requires_approval` (BOOLEAN)
- `approval.invoice_approval_limit` (NUMBER) - invoices > this amount need approval
- `approval.invoice_approvers` (ARRAY) - user IDs who can approve
- `approval.credit_note_requires_approval` (BOOLEAN)
- `approval.credit_note_approval_limit` (NUMBER)
- `approval.quote_requires_approval` (BOOLEAN)
- `approval.quote_approvers` (ARRAY)
- `approval.export_documents_require_approval` (BOOLEAN)
- `approval.approval_sla_hours` (NUMBER) - must approve within N hours
- `approval.escalation_after_hours` (NUMBER) - escalate to manager if not approved after N hours

**Signatures**

Features:
- `signatures.invoice_signature_required` (BOOLEAN) - CFO/finance signature
- `signatures.quote_signature_required` (BOOLEAN) - sales manager signature
- `signatures.proforma_signature_required` (BOOLEAN) - CFO signature on proforma
- `signatures.delivery_note_signature_required` (BOOLEAN) - customer signature on delivery
- `signatures.digital_signature_required` (BOOLEAN) - e-signature (not just printed)
- `signatures.timestamp_signature` (BOOLEAN) - include timestamp
- `signatures.gps_signature` (BOOLEAN) - include location (for delivery)
- `signatures.wet_signature_only` (BOOLEAN) - must be handwritten, not digital

## Document Access & Distribution

**Who sees which documents?**

Features:
- `access.customer_can_view_invoice` (BOOLEAN)
- `access.customer_can_download_invoice` (BOOLEAN)
- `access.customer_can_print_invoice` (BOOLEAN)
- `access.customer_can_email_invoice` (BOOLEAN)
- `access.hide_internal_notes` (BOOLEAN) - internal fields not shown to customer
- `access.hide_cost_breakdown` (BOOLEAN) - don't show material/labor breakdown
- `access.hide_discount_detail` (BOOLEAN) - don't show what discount was applied
- `access.customer_portal_enabled` (BOOLEAN) - customer self-service access
- `access.customer_api_enabled` (BOOLEAN) - API access for documents
- `access.email_distribution_list` (ARRAY) - email addresses for auto-distribution

Example:
```json
{
  "access": {
    "customer_can_view_invoice": true,
    "customer_can_download_invoice": true,
    "customer_can_print_invoice": false,
    "hide_cost_breakdown": true,
    "hide_discount_detail": false,
    "email_distribution_list": ["accounts@customer.com", "finance@customer.com"]
  }
}
```

## Document Archival

**Long-term storage and compliance**

Features:
- `archival.retain_days` (NUMBER) - keep in system for N days
- `archival.archive_to_cold_storage` (BOOLEAN) - move to archive after retain period
- `archival.immutable` (BOOLEAN) - documents cannot be edited after creation
- `archival.audit_trail` (BOOLEAN) - track every access
- `archival.compliance_hold` (BOOLEAN) - cannot delete (legal hold)
- `archival.retention_policy` (STRING) - GDPR, SOX, HIPAA, CUSTOM
- `archival.electronic_signature_validation` (BOOLEAN) - validate e-signatures periodically

## Language & Localization

**Multi-language documents**

Features:
- `language.default_language` (ENUM) - EN | FR | DE | ES | IT | NL | JA | ZH | etc.
- `language.document_language` (ENUM) - which language for which document type
- `language.currency_display` (STRING) - GBP, EUR, USD
- `language.date_format` (ENUM) - DD/MM/YYYY | MM/DD/YYYY | YYYY-MM-DD
- `language.decimal_separator` (ENUM) - . | ,
- `language.thousands_separator` (ENUM) - , | . | space
- `language.rtl_languages` (BOOLEAN) - right-to-left support
- `language.customer_preferred_language` (BOOLEAN) - use customer's language if set

## Template Examples

### Retail Customer (Simple Documents)
```json
{
  "code": "RETAIL_SIMPLE",
  "documents": {
    "sales_order_ack": {
      "enabled": true,
      "auto_send": true,
      "include_pricing": true,
      "include_terms_conditions": false,
      "include_delivery_instructions": true
    },
    "finance_invoice": {
      "enabled": true,
      "layout": "SUMMARY",
      "include_line_detail": false,
      "include_tax_breakdown": true,
      "include_bank_details": false,
      "include_po_number": false,
      "require_approval": false,
      "email_to_customer": true
    },
    "logistics_delivery_note": {
      "enabled": true,
      "include_line_items": false,
      "signature_field": false,
      "damage_checklist": false
    },
    "access": {
      "customer_can_view_invoice": true,
      "customer_can_download_invoice": true,
      "hide_cost_breakdown": true
    },
    "terms_conditions": {
      "payment_terms": "Payment on delivery",
      "warranty_statement": "30-day returns accepted"
    }
  }
}
```

### B2B Wholesale (Detailed Documents)
```json
{
  "code": "B2B_WHOLESALE",
  "documents": {
    "sales_quotation": {
      "enabled": true,
      "require_signature": false,
      "auto_expire_days": 30,
      "email_to_customer": true,
      "include_delivery_date": true,
      "show_availability": true
    },
    "sales_order_ack": {
      "enabled": true,
      "auto_send": true,
      "include_pricing": true,
      "include_terms_conditions": true,
      "include_delivery_instructions": true,
      "include_internal_notes": false
    },
    "finance_invoice": {
      "enabled": true,
      "layout": "DETAILED",
      "include_line_detail": true,
      "include_cost_breakdown": false,
      "include_tax_breakdown": true,
      "include_bank_details": true,
      "include_payment_terms": true,
      "include_po_number": true,
      "require_approval": true,
      "approval_required_if_over": 50000,
      "email_to_customer": true,
      "email_bcc_list": ["finance@company.com"]
    },
    "finance_statement": {
      "enabled": true,
      "frequency": "MONTHLY",
      "include_aging": true,
      "email_to_customer": true
    },
    "logistics_packing_slip": {
      "enabled": true,
      "customer_facing": true,
      "include_lot_numbers": false,
      "include_weights": true,
      "barcode_per_item": true
    },
    "logistics_delivery_note": {
      "enabled": true,
      "include_line_items": true,
      "signature_field": true,
      "damage_checklist": true,
      "gps_verification": true
    },
    "approval": {
      "invoice_requires_approval": true,
      "invoice_approval_limit": 50000,
      "credit_note_requires_approval": true
    },
    "signatures": {
      "invoice_signature_required": true,
      "digital_signature_required": true
    },
    "access": {
      "customer_can_view_invoice": true,
      "customer_can_download_invoice": true,
      "customer_can_email_invoice": true,
      "hide_cost_breakdown": true,
      "email_distribution_list": ["accounts@customer.com", "finance@customer.com"]
    },
    "branding": {
      "company_logo": true,
      "customer_logo_allowed": true,
      "footer_text": "Thank you for your business"
    },
    "terms_conditions": {
      "payment_terms": "NET30",
      "early_payment_discount": "2/10 NET30",
      "warranty_statement": "12-month warranty",
      "return_policy": "Returns within 30 days",
      "late_payment_interest": "8% per annum",
      "liability_limitation": "Liability capped at invoice value"
    }
  }
}
```

### Export Customer (Compliance Documents)
```json
{
  "code": "EXPORT_COMPLIANCE",
  "documents": {
    "sales_proforma": {
      "enabled": true,
      "required_for_exports": true,
      "require_before_shipment": true,
      "require_payment_before_shipment": false,
      "include_weight_volume": true,
      "include_commodity_codes": true,
      "include_hs_codes": true,
      "include_origin_country": true,
      "include_incoterms": true,
      "signature_required": true
    },
    "finance_invoice": {
      "enabled": true,
      "layout": "DETAILED",
      "include_line_detail": true,
      "include_tax_breakdown": false,
      "include_bank_details": true,
      "include_iban_swift": true,
      "require_approval": true
    },
    "customs_certificate_of_origin": {
      "enabled": true,
      "required_for_exports": true,
      "form_type": "EUR1",
      "include_commodity_codes": true,
      "chamber_of_commerce_stamp": true,
      "signature_required": true
    },
    "customs_declaration": {
      "enabled": true,
      "required_for_exports": true,
      "include_commodity_codes": true,
      "include_hs_codes": true,
      "include_weights": true,
      "include_values": true,
      "electronic_filing": true
    },
    "logistics_shipping_label": {
      "enabled": true,
      "include_tracking_number": true,
      "include_reference_numbers": true
    },
    "logistics_delivery_note": {
      "enabled": true,
      "include_line_items": true,
      "signature_field": true,
      "photographic_evidence": true
    },
    "approval": {
      "export_documents_require_approval": true
    },
    "language": {
      "default_language": "EN",
      "currency_display": "USD",
      "date_format": "MM/DD/YYYY"
    },
    "terms_conditions": {
      "payment_terms": "Letter of Credit or payment in advance",
      "payment_instructions": "Wire transfer to our bank account",
      "governing_law": "English law",
      "incoterms": "CIF"
    }
  }
}
```

## What This Enables

✅ **Complete document flexibility** - every aspect configurable  
✅ **Compliance** - audit trails, signatures, immutable records  
✅ **Brand consistency** - company branding + customer branding  
✅ **Workflow automation** - approvals, signatures, distribution  
✅ **Multi-language** - documents in any language  
✅ **Export-ready** - proformas, customs docs, certificates of origin  
✅ **Simple-to-complex** - retail gets simple receipts, manufacturers get detailed invoices with cost breakdowns  

Every customer sees their configured document layout and process. Same app, completely different outputs.
