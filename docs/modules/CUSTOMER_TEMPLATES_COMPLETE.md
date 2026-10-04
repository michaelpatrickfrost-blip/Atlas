# Customer Templates — Complete Reference

**The system that makes Atlas infinitely flexible per customer.**

One codebase, unlimited business configurations. Different customers see completely different apps—different fields, workflows, approval chains, document types, delivery processes, financial rules—all configured per template, no code changes.

## Vision

Michael's requirement: "Atlas needs to be flexible so we can set up customer templates. It needs to be easy to use but also make the system very flexible and modular."

This system delivers:
- **Easy**: toggle features, assign customers, done
- **Flexible**: any module can expose any configuration; supports every business type
- **Modular**: modules own their features; Core assembles templates; no coupling

## How It Works

### Three Layers

**1. Feature Registry (Module → Core)**
Each module declares what's configurable. Sales declares PO requirements. Logistics declares auto-delivery. Finance declares approval limits. All independently.

**2. Template Configuration (Business Admin)**
Admin creates templates and toggles features. "Retail" template has call-offs disabled, PO optional. "Wholesale" has both enabled, PO required.

**3. Runtime Adaptation (App Code)**
At every point where behavior differs, app checks the customer's template. "Is PO required?" Yes → validate. "Allow call-offs?" No → hide UI.

## Supported Business Types

Each has a starter template + examples. Customizable infinitely.

### Manufacturing
**Starter template: INDUSTRIAL**
- Order types: STANDARD, PROJECT, BLANKET, CALL_OFF
- Delivery: location-based (dock, yard, line-side), pallet quantities
- Finance: job costing, cost rollup by BOM, approval by order value
- Production: MRP feed, capacity constraints, work order tracking
- Quality: incoming/in-process/final inspection gates
- Logistics: internal moves, receiving with inspection, WIP tracking

Features:
- `manufacturing.require_bom` - BOM must exist before order
- `manufacturing.auto_release_on_confirm` - confirm order → auto-release work orders
- `manufacturing.require_quality_sign_off` - quality must approve before shipment
- `manufacturing.capacity_constrained` - respect finite capacity
- `manufacturing.cost_method` - STANDARD | ACTUAL | ABSORPTION
- `manufacturing.report_production_hours` - required for payroll
- `manufacturing.lot_tracking` - trace materials through production
- `manufacturing.serial_number_required` - per-unit tracking

### Retail / Direct-to-Consumer
**Starter template: RETAIL_DTC**
- Order types: STANDARD only
- Delivery: address-based, next-day/2-day options, customer self-serve
- Finance: simple (no approval), COD/card payment, auto-invoice on dispatch
- Inventory: stock level checks, auto back-order when short
- Customer: minimal setup, one address, one contact

Features:
- `sales.require_customer_po` - FALSE
- `sales.require_delivery_date` - FALSE (default next day)
- `sales.enable_call_offs` - FALSE
- `sales.approval_required` - FALSE
- `sales.auto_confirm_on_payment` - TRUE
- `logistics.auto_confirm_delivery` - TRUE (on dispatch)
- `finance.auto_post_on_delivery` - TRUE
- `finance.require_approval` - FALSE
- `inventory.auto_backorder` - TRUE

### B2B Wholesale
**Starter template: B2B_WHOLESALE**
- Order types: STANDARD, CALL_OFF, BLANKET, PROJECT
- Delivery: multiple locations, scheduled, loading instructions
- Finance: approval by amount, payment terms (NET30/60/90), credit limits
- Customer: hierarchy (group, divisions), multiple invoicing accounts
- Contacts: multiple roles per account, escalation paths

Features:
- `sales.require_customer_po` - TRUE
- `sales.require_delivery_date` - TRUE
- `sales.enable_call_offs` - TRUE
- `sales.approval_required` - TRUE
- `sales.approval_limit` - 50000
- `logistics.require_delivery_window` - TRUE
- `logistics.allow_part_delivery` - FALSE (ship complete only)
- `finance.require_approval` - TRUE
- `finance.approval_limit` - 50000
- `finance.payment_terms_required` - TRUE
- `customer.require_hierarchy` - TRUE
- `customer.multiple_invoicing_accounts` - TRUE

### Export / International
**Starter template: EXPORT_INTL**
- Order types: STANDARD, PROJECT
- Delivery: shipping agents, Incoterms, customs documentation
- Finance: pro-forma invoice first, payment upfront, letters of credit, insurance
- Documents: commercial invoice, packing list, certificate of origin, proforma
- Compliance: commodity codes, export licenses, restricted countries check

Features:
- `sales.require_incoterms` - TRUE
- `sales.require_commodity_codes` - TRUE
- `sales.require_export_license` - TRUE
- `sales.proforma_required` - TRUE
- `sales.proforma_before_shipment` - TRUE
- `logistics.require_customs_declaration` - TRUE
- `logistics.require_origin_country` - TRUE
- `logistics.require_weights_volumes` - TRUE
- `finance.payment_upfront` - TRUE
- `finance.letter_of_credit_accepted` - TRUE
- `finance.require_export_insurance` - FALSE
- `compliance.country_risk_check` - TRUE

### Services / Professional Services
**Starter template: SERVICES_PSA**
- Document: Statement of Work instead of Order
- Delivery: time & materials, fixed price, milestone-based
- Finance: monthly invoicing, retainers, usage tracking
- Tracking: billable hours per person, project phases, approval per phase
- Contracts: statement of work, service level agreement, approval chain

Features:
- `sales.order_type` - SERVICES_STATEMENT_OF_WORK
- `sales.fixed_price_allowed` - TRUE
- `sales.time_and_materials_allowed` - TRUE
- `sales.milestone_based_allowed` - TRUE
- `finance.invoice_frequency` - MONTHLY | MILESTONE | COMPLETION
- `finance.require_sow_sign_off` - TRUE
- `billing.hourly_rate_card` - TRUE
- `billing.require_timesheet` - TRUE
- `billing.require_approval_per_timesheet` - TRUE
- `contracts.require_sow` - TRUE
- `contracts.require_sla` - TRUE

### Construction / Project-Based
**Starter template: CONSTRUCTION_PROJECT**
- Document: Project-linked order with progress invoicing
- Delivery: staged (foundation, frame, finish), on-site delivery, inspection per stage
- Finance: progress invoicing (% complete, milestone), hold-backs, retention
- Tracking: sub-contractor management, material tracking, site diary
- Quality: inspection gates per stage, defect tracking, punch list

Features:
- `sales.order_type` - PROJECT
- `sales.project_required` - TRUE
- `sales.progress_invoicing` - TRUE
- `sales.holdback_percent` - 10
- `sales.staged_delivery` - TRUE
- `logistics.on_site_delivery` - TRUE
- `logistics.require_inspection` - TRUE per stage
- `logistics.require_site_checklist` - TRUE
- `finance.invoice_on_milestone` - TRUE
- `finance.holdback_release_period` - 30 days
- `finance.require_retention` - TRUE
- `quality.defect_tracking` - TRUE
- `quality.punch_list_required` - TRUE

### Distribution / Logistics-Heavy
**Starter template: DISTRIBUTION_LOGISTICS**
- Order types: STANDARD, BLANKET, CALL_OFF
- Delivery: multiple warehouses, cross-dock, consolidation, carrier selection
- Inventory: location-based, transfer between sites, replenishment rules
- Tracking: shipment tracking, proof of delivery, returns processing
- Finance: landed cost, freight allocation, damage claims

Features:
- `logistics.multiple_warehouses` - TRUE
- `logistics.enable_cross_dock` - TRUE
- `logistics.enable_consolidation` - TRUE
- `logistics.carrier_selection_required` - TRUE
- `logistics.require_tracking_number` - TRUE
- `logistics.require_proof_of_delivery` - TRUE
- `inventory.transfer_between_sites` - TRUE
- `inventory.enable_replenishment_rules` - TRUE
- `finance.landed_cost` - TRUE
- `finance.freight_allocation` - TRUE
- `finance.damage_claim_support` - TRUE

### Healthcare / Regulated
**Starter template: HEALTHCARE_REGULATED**
- Compliance: batch/lot tracking, expiry dates, regulatory approval
- Delivery: temperature controlled, specialized packaging, chain of custody
- Finance: compliance auditing, traceability reporting, regulatory holds
- Quality: GxP compliance, audit trail, electronic signatures

Features:
- `quality.batch_tracking_required` - TRUE
- `quality.expiry_date_tracking` - TRUE
- `quality.gxp_compliance` - TRUE
- `quality.electronic_signatures` - TRUE
- `logistics.temperature_controlled` - TRUE
- `logistics.chain_of_custody` - TRUE
- `logistics.specialized_packaging` - TRUE
- `finance.compliance_audit_trail` - TRUE
- `audit.full_change_history` - TRUE
- `audit.immutable_records` - TRUE

## Feature Categories (All Modules)

### Sales Module

**Core Order Configuration**
- `sales.enable_quotations` (BOOLEAN) - can create quotations
- `sales.quotation_requires_approval` (BOOLEAN) - quotations need manager sign-off
- `sales.auto_convert_quote_to_order` (BOOLEAN) - quote acceptance auto-creates order
- `sales.order_types` (ENUM: STANDARD | CALL_OFF | PROJECT | BLANKET | SAMPLE | REPLACEMENT | INTERNAL) - allowed types
- `sales.require_customer_po` (BOOLEAN) - PO mandatory on orders
- `sales.require_delivery_date` (BOOLEAN) - promised delivery date required
- `sales.require_delivery_address` (BOOLEAN) - explicit delivery address
- `sales.allow_partial_delivery` (BOOLEAN) - can ship incomplete quantity
- `sales.ship_complete_default` (BOOLEAN) - default to "ship all or nothing"

**Pricing & Discounts**
- `sales.discount_allowed` (BOOLEAN) - reps can apply discounts
- `sales.discount_requires_approval` (BOOLEAN) - discounts need manager sign-off
- `sales.max_discount_percent` (NUMBER) - maximum discount allowed
- `sales.minimum_order_value` (NUMBER) - minimum order amount (0 = no limit)
- `sales.price_protection_days` (NUMBER) - how many days prices are locked
- `sales.enable_volume_discounts` (BOOLEAN) - tiered discounts per quantity
- `sales.enable_custom_pricing` (BOOLEAN) - sales can set custom per-customer prices

**Call-Off & Agreements**
- `sales.enable_call_offs` (BOOLEAN) - allow call-off agreements
- `sales.call_off_requires_approval` (BOOLEAN) - call-offs need sign-off
- `sales.call_off_auto_confirm` (BOOLEAN) - call-off auto-confirms on PO receipt
- `sales.blanket_agreement_allowed` (BOOLEAN) - blanket orders enabled
- `sales.blanket_duration_months` (NUMBER) - how long blanket stays open

**Export & International**
- `sales.enable_export_orders` (BOOLEAN) - can create export orders
- `sales.require_incoterms` (BOOLEAN) - Incoterms mandatory on exports
- `sales.require_commodity_codes` (BOOLEAN) - commodity codes for export items
- `sales.require_export_license` (BOOLEAN) - export license must be on file
- `sales.require_origin_country` (BOOLEAN) - country of origin required
- `sales.proforma_required` (BOOLEAN) - proforma invoice before shipment
- `sales.proforma_payment_upfront` (BOOLEAN) - payment required before shipment

**Approval Workflows**
- `sales.approval_required` (BOOLEAN) - orders need approval
- `sales.approval_limit` (NUMBER) - approval limit in order currency
- `sales.approval_limit_currency` (STRING) - currency for limit
- `sales.require_manager_sign_off` (BOOLEAN) - manager must approve
- `sales.multi_level_approval` (BOOLEAN) - multiple approval levels
- `sales.approval_sla_hours` (NUMBER) - approval must happen within N hours
- `sales.auto_approve_under_limit` (BOOLEAN) - auto-approve if under limit

**Document & Communication**
- `sales.order_acknowledgement_required` (BOOLEAN) - must acknowledge order
- `sales.send_order_confirmation` (BOOLEAN) - send confirmation to customer
- `sales.include_terms_conditions` (BOOLEAN) - attach terms to order
- `sales.require_signature` (BOOLEAN) - signature required on order
- `sales.default_language` (STRING) - document language
- `sales.brand_on_documents` (BOOLEAN) - company branding on docs

**Payment & Terms**
- `sales.payment_terms_required` (BOOLEAN) - payment terms must be set
- `sales.default_payment_terms` (STRING) - e.g., NET30, NET60, COD
- `sales.allowed_payment_methods` (ENUM) - BANK_TRANSFER | CARD | CASH | CREDIT | LETTER_OF_CREDIT
- `sales.require_deposit` (BOOLEAN) - deposit required upfront
- `sales.deposit_percent` (NUMBER) - % of order upfront

### Logistics Module

**Fulfillment & Delivery**
- `logistics.auto_confirm_delivery` (BOOLEAN) - dispatch = auto-delivered
- `logistics.require_delivery_window` (BOOLEAN) - customer must provide time window
- `logistics.allow_part_delivery` (BOOLEAN) - can ship partial quantities
- `logistics.allow_backorder` (BOOLEAN) - can backorder short items
- `logistics.ready_to_ship_requires_approval` (BOOLEAN) - approval before release
- `logistics.require_quality_sign_off` (BOOLEAN) - QA must approve before shipment
- `logistics.multiple_warehouse_support` (BOOLEAN) - can ship from multiple locations
- `logistics.consolidation_enabled` (BOOLEAN) - allow multiple shipments to consolidate

**Tracking & Tracing**
- `logistics.require_tracking_number` (BOOLEAN) - carrier tracking mandatory
- `logistics.require_proof_of_delivery` (BOOLEAN) - POD required
- `logistics.require_signature` (BOOLEAN) - signature on delivery
- `logistics.enable_returns` (BOOLEAN) - customer can return items
- `logistics.require_return_authorization` (BOOLEAN) - RA number required for returns
- `logistics.track_serial_numbers` (BOOLEAN) - track individual units
- `logistics.track_batch_numbers` (BOOLEAN) - track batches/lots
- `logistics.track_expiry_dates` (BOOLEAN) - monitor expiration

**Locations & Storage**
- `logistics.location_based_inventory` (BOOLEAN) - manage by location within warehouse
- `logistics.enable_quarantine_location` (BOOLEAN) - QA hold area
- `logistics.enable_damaged_location` (BOOLEAN) - damage/returns area
- `logistics.require_pallet_quantity` (BOOLEAN) - pallet qty must match product
- `logistics.cross_dock_enabled` (BOOLEAN) - immediate pass-through
- `logistics.enable_transfers` (BOOLEAN) - internal stock transfers

**Packaging & Handling**
- `logistics.require_handling_unit` (BOOLEAN) - items must be packed
- `logistics.require_weight` (BOOLEAN) - weight must be entered
- `logistics.require_dimensions` (BOOLEAN) - dimensions required
- `logistics.require_package_count` (BOOLEAN) - number of packages
- `logistics.special_handling_codes` (ENUM) - FRAGILE | HAZMAT | TEMPERATURE_CONTROLLED | LIQUID | OTHER

**Carriers & Shipping**
- `logistics.carrier_selection_required` (BOOLEAN) - must choose carrier
- `logistics.allowed_carriers` (ENUM) - DPD | DHL | FEDEX | UPS | USPS | ROYAL_MAIL | CUSTOM
- `logistics.auto_create_shipping_label` (BOOLEAN) - auto-generate label on release
- `logistics.require_customs_declaration` (BOOLEAN) - for international
- `logistics.enable_courier_file` (BOOLEAN) - can download carrier manifest
- `logistics.courier_file_format` (STRING) - format: CSV | XML | EDI

**Safety & Compliance**
- `logistics.require_inspection` (BOOLEAN) - incoming/outgoing inspection
- `logistics.enable_quality_holds` (BOOLEAN) - QA can hold shipment
- `logistics.temperature_controlled` (BOOLEAN) - cold chain required
- `logistics.chain_of_custody` (BOOLEAN) - document transfer of custody
- `logistics.hazmat_shipments` (BOOLEAN) - can handle hazardous materials
- `logistics.require_permits` (BOOLEAN) - transport permits required

### Finance Module

**Invoicing**
- `finance.auto_post_on_delivery` (BOOLEAN) - delivery auto-posts invoice
- `finance.require_approval` (BOOLEAN) - invoices need approval
- `finance.approval_limit` (NUMBER) - approval limit in currency
- `finance.approval_limit_currency` (STRING)
- `finance.invoice_on_shipment` (BOOLEAN) - invoice on dispatch (not delivery)
- `finance.invoice_frequency` (ENUM) - ON_DELIVERY | MONTHLY | WEEKLY | MILESTONE
- `finance.progress_invoicing` (BOOLEAN) - % complete invoicing
- `finance.require_invoice_signature` (BOOLEAN) - signature on invoice
- `finance.invoice_requires_po_number` (BOOLEAN) - PO on invoice

**Credit & Deductions**
- `finance.credit_note_allowed` (BOOLEAN) - can issue credit notes
- `finance.require_credit_approval` (BOOLEAN) - credits need approval
- `finance.credit_hold_percentage` (NUMBER) - withhold this % for disputes
- `finance.allow_credit_against_current_invoices` (BOOLEAN) - can offset same invoice
- `finance.dispute_period_days` (NUMBER) - customer has N days to dispute

**Payment & Collections**
- `finance.payment_upfront` (BOOLEAN) - payment before shipment
- `finance.payment_terms_required` (BOOLEAN) - terms must be set
- `finance.allowed_payment_methods` (ENUM) - BANK_TRANSFER | CARD | CASH | CREDIT | LETTER_OF_CREDIT
- `finance.require_deposit` (BOOLEAN) - deposit required
- `finance.deposit_percent` (NUMBER)
- `finance.credit_limit` (NUMBER) - credit line limit
- `finance.auto_hold_over_limit` (BOOLEAN) - hold orders over limit
- `finance.dunning_enabled` (BOOLEAN) - payment reminders/escalation
- `finance.dunning_days` (NUMBER) - days past due before dunning starts
- `finance.dunning_fee_percent` (NUMBER) - late fee %

**Letters of Credit & Insurance**
- `finance.letter_of_credit_accepted` (BOOLEAN) - LC payment method
- `finance.require_lc_review` (BOOLEAN) - LC must be reviewed/approved
- `finance.export_insurance_accepted` (BOOLEAN) - accept export insurance
- `finance.require_insurance_certificate` (BOOLEAN)

**Cost & Allocation**
- `finance.landed_cost_enabled` (BOOLEAN) - track delivered cost
- `finance.freight_allocation` (BOOLEAN) - allocate freight to invoice
- `finance.duty_allocation` (BOOLEAN) - allocate import duties
- `finance.cost_method` (ENUM) - STANDARD | ACTUAL | ABSORPTION
- `finance.job_costing` (BOOLEAN) - cost roll-up by project/job
- `finance.cost_center_required` (BOOLEAN) - cost center must be set

**Reconciliation**
- `finance.auto_reconcile` (BOOLEAN) - auto-match payments to invoices
- `finance.reconciliation_tolerance` (NUMBER) - penny rounding tolerance
- `finance.require_reconciliation` (BOOLEAN) - must reconcile before reporting
- `finance.aging_report_frequency` (ENUM) - DAILY | WEEKLY | MONTHLY

### Customer Master

**Visibility & Access**
- `customer.public_profile` (BOOLEAN) - visible to other customers
- `customer.restricted_access` (BOOLEAN) - limited read access
- `customer.require_hierarchy` (BOOLEAN) - must set parent company
- `customer.multiple_invoicing_accounts` (BOOLEAN) - can have multiple invoice addresses
- `customer.multiple_contacts_required` (BOOLEAN) - must have >1 contact
- `customer.contact_approval_required` (BOOLEAN) - new contacts need approval

**Data Requirements**
- `customer.require_tax_id` (BOOLEAN) - tax registration required
- `customer.require_payment_terms` (BOOLEAN) - payment terms must be set
- `customer.require_credit_limit` (BOOLEAN) - credit limit must be set
- `customer.require_addresses` (BOOLEAN) - must have billing + delivery address
- `customer.require_contact_email` (BOOLEAN) - at least one email contact

**Commercial Settings**
- `customer.price_list_required` (BOOLEAN) - must assign price list
- `customer.custom_pricing_allowed` (BOOLEAN) - can set customer-specific prices
- `customer.territory_assignment_required` (BOOLEAN) - assign to sales territory
- `customer.account_manager_required` (BOOLEAN) - must assign AM

**Activity & Engagement**
- `customer.activity_tracking_required` (BOOLEAN) - log all interactions
- `customer.require_account_review_frequency` (STRING) - e.g., QUARTERLY
- `customer.enable_customer_portal` (BOOLEAN) - self-service portal access
- `customer.enable_api_access` (BOOLEAN) - API tokens allowed

### Inventory / Stock Module

**Stock Control**
- `inventory.track_by_location` (BOOLEAN) - location-level inventory
- `inventory.track_by_batch` (BOOLEAN) - batch/lot tracking
- `inventory.track_by_serial` (BOOLEAN) - serial number tracking
- `inventory.track_expiry_dates` (BOOLEAN) - expiration tracking
- `inventory.first_in_first_out` (BOOLEAN) - FIFO rotation required
- `inventory.enable_quality_holds` (BOOLEAN) - QA can hold stock
- `inventory.enable_cycle_counts` (BOOLEAN) - regular inventory counts
- `inventory.cycle_count_frequency` (ENUM) - DAILY | WEEKLY | MONTHLY | QUARTERLY
- `inventory.full_physical_audit_frequency` (ENUM)

**Replenishment**
- `inventory.auto_backorder` (BOOLEAN) - auto-backorder when short
- `inventory.enable_safety_stock` (BOOLEAN) - maintain minimum stock levels
- `inventory.auto_replenish` (BOOLEAN) - auto-trigger purchase orders
- `inventory.replenishment_rules_required` (BOOLEAN) - rules must be defined
- `inventory.enable_dropship` (BOOLEAN) - can drop-ship from supplier
- `inventory.supplier_lead_time_required` (BOOLEAN) - lead times defined

**Transfers**
- `inventory.enable_internal_transfers` (BOOLEAN) - move between locations/warehouses
- `inventory.transfer_approval_required` (BOOLEAN) - transfers need sign-off
- `inventory.transfer_sla_days` (NUMBER) - transfer must complete in N days
- `inventory.enable_consignment` (BOOLEAN) - consignment inventory

**Reporting & Valuation**
- `inventory.valuation_method` (ENUM) - FIFO | LIFO | WEIGHTED_AVERAGE | SPECIFIC_ID
- `inventory.variance_tolerance_percent` (NUMBER) - acceptable count variance
- `inventory.require_variance_investigation` (NUMBER) - variance > this triggers investigation
- `inventory.generate_aging_report` (BOOLEAN) - report on aged stock
- `inventory.slow_moving_threshold_days` (NUMBER) - stock older than this = slow-moving

### CRM Module

**Lead Management**
- `crm.prospect_creation_self_serve` (BOOLEAN) - reps create prospects
- `crm.require_prospect_approval` (BOOLEAN) - prospects need qualification
- `crm.require_industry_classification` (BOOLEAN)
- `crm.require_company_size` (BOOLEAN)
- `crm.require_budget` (BOOLEAN) - budget estimate required
- `crm.require_timeline` (BOOLEAN) - decision timeline

**Pipeline & Opportunity**
- `crm.auto_create_opportunity_on_qualify` (BOOLEAN)
- `crm.opportunity_requires_approval` (BOOLEAN) - opps need sign-off
- `crm.require_next_action` (BOOLEAN) - next action mandatory
- `crm.require_action_date` (BOOLEAN) - action due date required
- `crm.pipeline_visibility` (ENUM) - SELF_ONLY | TEAM | MANAGER | ORG
- `crm.probability_required` (BOOLEAN) - win probability
- `crm.require_forecast_category` (BOOLEAN) - pipeline | forecast | best case | worst case

**Forecasting & Reporting**
- `crm.forecast_frequency` (ENUM) - MONTHLY | QUARTERLY | PIPELINE_ONLY
- `crm.manager_forecast_review` (BOOLEAN) - manager must review forecasts
- `crm.require_deal_review_meeting` (BOOLEAN) - periodic deal reviews
- `crm.deal_review_frequency` (ENUM) - WEEKLY | BIWEEKLY | MONTHLY

**Activities & Engagement**
- `crm.activity_tracking_required` (BOOLEAN) - log calls, emails, meetings
- `crm.activity_next_action_enforcement` (BOOLEAN) - can't move without logged activity
- `crm.require_call_notes` (BOOLEAN) - call summary mandatory
- `crm.require_meeting_attendees` (BOOLEAN) - meeting must have attendees
- `crm.enable_task_creation_from_activity` (BOOLEAN) - activity → task workflow

### People / HR Module

**Employee Setup**
- `people.require_tax_code` (BOOLEAN) - tax code must be entered
- `people.require_bank_details` (BOOLEAN) - bank account on file
- `people.require_emergency_contact` (BOOLEAN)
- `people.require_signed_contract` (BOOLEAN)
- `people.contract_signing_eform_required` (BOOLEAN)

**Time Tracking**
- `people.timesheet_required` (BOOLEAN) - timesheets mandatory
- `people.timesheet_approval_required` (BOOLEAN) - manager approves
- `people.timesheet_frequency` (ENUM) - DAILY | WEEKLY | BIWEEKLY | MONTHLY
- `people.overtime_tracking` (BOOLEAN) - track hours over standard
- `people.require_time_codes` (BOOLEAN) - code work by project/task
- `people.require_billable_flag` (BOOLEAN) - mark time as billable/non-billable

**Leave & Absence**
- `people.leave_request_self_service` (BOOLEAN) - employees request time off
- `people.leave_approval_required` (BOOLEAN) - manager approves
- `people.leave_allowance_tracking` (BOOLEAN) - track days used
- `people.sick_leave_policy_days` (NUMBER)
- `people.require_medical_certificate` (BOOLEAN) - note needed after N days
- `people.medical_certificate_after_days` (NUMBER)

**Performance & Development**
- `people.annual_appraisal_required` (BOOLEAN)
- `people.quarterly_check_ins` (BOOLEAN) - 1:1s required
- `people.goal_setting_required` (BOOLEAN)
- `people.require_development_plan` (BOOLEAN)
- `people.require_performance_rating` (BOOLEAN)
- `people.performance_improvement_plan_available` (BOOLEAN)

**Payroll**
- `payroll.auto_calculate` (BOOLEAN) - auto-calculate from timesheet
- `payroll.require_approval` (BOOLEAN) - payroll needs sign-off
- `payroll.require_director_sign_off` (BOOLEAN) - director approval
- `payroll.auto_post_to_finance` (BOOLEAN) - post payroll journal automatically
- `payroll.allow_manual_adjustments` (BOOLEAN) - can add manual deductions/bonuses
- `payroll.require_payslip_download` (BOOLEAN) - employee must download

### Manufacturing Module

**BOM & Production**
- `manufacturing.require_bom` (BOOLEAN) - BOM must exist for production
- `manufacturing.auto_generate_bom_from_template` (BOOLEAN)
- `manufacturing.bom_version_control` (BOOLEAN) - track BOM revisions
- `manufacturing.require_work_center` (BOOLEAN) - routing required
- `manufacturing.finite_capacity_planning` (BOOLEAN) - respect machine capacity

**Work Orders**
- `manufacturing.auto_release_on_confirm` (BOOLEAN) - confirm order → release work orders
- `manufacturing.auto_reserve_materials` (BOOLEAN) - confirm → reserve materials
- `manufacturing.work_order_requires_approval` (BOOLEAN)
- `manufacturing.require_quality_sign_off` (BOOLEAN) - QA before move to next step
- `manufacturing.require_completion_sign_off` (BOOLEAN) - operator/supervisor confirms done

**Quality & Compliance**
- `manufacturing.quality_gates_at_completion` (BOOLEAN) - inspection at end
- `manufacturing.quality_gates_per_step` (BOOLEAN) - inspection after each step
- `manufacturing.require_first_piece_inspection` (BOOLEAN) - FPI on first lot
- `manufacturing.scrap_tracking` (BOOLEAN) - record scrap/yield loss
- `manufacturing.cost_method` (ENUM) - STANDARD | ACTUAL | ABSORPTION
- `manufacturing.lot_tracking_required` (BOOLEAN) - batch tracking mandatory
- `manufacturing.serial_tracking_required` (BOOLEAN) - serial number mandatory

**Scheduling & MRP**
- `manufacturing.auto_run_mrp` (BOOLEAN) - automatic MRP runs
- `manufacturing.mrp_frequency` (ENUM) - DAILY | WEEKLY | ON_DEMAND
- `manufacturing.capacity_constrained_planning` (BOOLEAN)
- `manufacturing.allow_split_runs` (BOOLEAN) - can split batch for earlier delivery
- `manufacturing.require_capacity_approval` (BOOLEAN)

**Reporting**
- `manufacturing.production_hour_reporting` (BOOLEAN) - report hours to payroll
- `manufacturing.yield_reporting` (BOOLEAN) - track yield/scrap
- `manufacturing.variance_reporting` (BOOLEAN) - standard vs. actual analysis
- `manufacturing.cost_rollup` (BOOLEAN) - roll material/labor/overhead costs

## Feature Dependencies

Some features require others. Enforce in UI + validation:

- `sales.enable_call_offs` requires `logistics.multiple_warehouse_support` or `inventory.enable_backorder`
- `sales.progress_invoicing` requires `sales.order_types` includes PROJECT
- `sales.proforma_required` requires `sales.enable_export_orders`
- `manufacturing.require_quality_sign_off` requires `quality.module_enabled`
- `finance.job_costing` requires `sales.order_types` includes PROJECT
- `inventory.auto_backorder` requires `sales.allow_backorder`
- `logistics.require_proof_of_delivery` requires `logistics.carrier_selection_required`

## Template Examples

### Small Retail
```json
{
  "code": "RETAIL_SMALL",
  "name": "Small Retail",
  "description": "Walk-in retail or small online orders",
  "modules": {
    "sales": {
      "order_types": ["STANDARD"],
      "require_customer_po": false,
      "require_delivery_date": false,
      "enable_call_offs": false,
      "approval_required": false,
      "discount_allowed": true,
      "max_discount_percent": 10,
      "auto_confirm_on_payment": true,
      "payment_terms_required": false,
      "allow_partial_delivery": true
    },
    "logistics": {
      "auto_confirm_delivery": true,
      "require_delivery_window": false,
      "allow_part_delivery": true,
      "require_proof_of_delivery": false
    },
    "finance": {
      "auto_post_on_delivery": true,
      "require_approval": false,
      "invoice_on_shipment": false,
      "payment_upfront": false,
      "auto_reconcile": true
    },
    "inventory": {
      "auto_backorder": true,
      "track_by_location": false,
      "cycle_count_frequency": "MONTHLY"
    },
    "customer": {
      "require_hierarchy": false,
      "require_tax_id": false,
      "require_payment_terms": false
    }
  }
}
```

### Enterprise B2B
```json
{
  "code": "B2B_ENTERPRISE",
  "name": "Enterprise B2B",
  "description": "Large B2B customers with complex needs",
  "modules": {
    "sales": {
      "order_types": ["STANDARD", "CALL_OFF", "PROJECT", "BLANKET"],
      "require_customer_po": true,
      "require_delivery_date": true,
      "enable_call_offs": true,
      "approval_required": true,
      "approval_limit": 100000,
      "discount_allowed": true,
      "max_discount_percent": 5,
      "discount_requires_approval": true,
      "payment_terms_required": true,
      "allow_partial_delivery": false,
      "ship_complete_default": true,
      "enable_volume_discounts": true
    },
    "logistics": {
      "auto_confirm_delivery": false,
      "require_delivery_window": true,
      "allow_part_delivery": false,
      "require_proof_of_delivery": true,
      "require_signature": true,
      "multiple_warehouse_support": true,
      "carrier_selection_required": true,
      "require_tracking_number": true,
      "location_based_inventory": true
    },
    "finance": {
      "auto_post_on_delivery": false,
      "require_approval": true,
      "approval_limit": 100000,
      "invoice_on_shipment": false,
      "payment_terms_required": true,
      "allowed_payment_methods": ["BANK_TRANSFER", "LETTER_OF_CREDIT"],
      "credit_limit": 500000,
      "auto_hold_over_limit": true,
      "landed_cost_enabled": true,
      "freight_allocation": true
    },
    "inventory": {
      "auto_backorder": false,
      "track_by_location": true,
      "track_by_batch": true,
      "cycle_count_frequency": "WEEKLY",
      "enable_internal_transfers": true
    },
    "customer": {
      "require_hierarchy": true,
      "multiple_invoicing_accounts": true,
      "require_payment_terms": true,
      "price_list_required": true,
      "account_manager_required": true
    },
    "crm": {
      "pipeline_visibility": "ORG",
      "forecast_frequency": "MONTHLY",
      "manager_forecast_review": true,
      "activity_tracking_required": true
    }
  }
}
```

### Manufacturing Plant
```json
{
  "code": "MANUFACTURING_PLANT",
  "name": "Manufacturing Plant",
  "description": "Internal manufacturing operation",
  "modules": {
    "sales": {
      "order_types": ["STANDARD", "PROJECT", "CALL_OFF"],
      "require_delivery_date": true,
      "approval_required": true,
      "approval_limit": 50000
    },
    "manufacturing": {
      "require_bom": true,
      "auto_release_on_confirm": true,
      "auto_reserve_materials": true,
      "require_quality_sign_off": true,
      "quality_gates_per_step": true,
      "cost_method": "STANDARD",
      "lot_tracking_required": true,
      "auto_run_mrp": true,
      "mrp_frequency": "DAILY",
      "capacity_constrained_planning": true,
      "production_hour_reporting": true
    },
    "inventory": {
      "track_by_location": true,
      "track_by_batch": true,
      "first_in_first_out": true,
      "enable_quality_holds": true,
      "enable_internal_transfers": true,
      "transfer_approval_required": false,
      "valuation_method": "WEIGHTED_AVERAGE"
    },
    "logistics": {
      "require_quality_sign_off": true,
      "location_based_inventory": true
    },
    "finance": {
      "job_costing": true,
      "cost_method": "ACTUAL",
      "auto_post_on_delivery": true
    },
    "people": {
      "timesheet_required": true,
      "timesheet_approval_required": true,
      "overtime_tracking": true,
      "require_time_codes": true,
      "require_billable_flag": true
    }
  }
}
```

## What This Delivers

✅ **Infinite flexibility** - any business type, any workflow, any configuration  
✅ **No code changes** - business admin configures, app adapts  
✅ **Full module integration** - Sales → Logistics → Finance as one coherent workflow  
✅ **Cross-module dependencies** - features enforce logical combinations  
✅ **Industry starters** - templates for Manufacturing, Retail, Services, Export, etc.  
✅ **Easy extensibility** - new modules add their own features automatically  
✅ **Audit trail** - every change tracked  
✅ **Per-customer customization** - each customer can have unique config  

## Next Steps for Full Implementation

1. **Complete module feature declarations** - every module lists its configurable aspects
2. **Implement feature dependencies** - UI prevents invalid combinations
3. **Build console UI** - create/edit/assign/history pages
4. **Wire app logic** - every feature checked at runtime
5. **Test cross-module** - Sales → Logistics → Finance workflows
6. **Deploy starter templates** - offer pre-built templates per industry
7. **Customer onboarding flow** - wizard to set up template on signup
