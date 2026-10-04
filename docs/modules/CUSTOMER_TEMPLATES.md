# Customer Templates

Customer templates let businesses configure how their apps work for different customer types—without code changes. A business creates templates (e.g., "Retail", "B2B Wholesale", "Export"), sets up what each template needs, and assigns customers to them. The app adapts to the customer's template at runtime.

## Why Templates

- **Flexible**: Different customers have different requirements (PO required vs. optional, delivery methods, approval workflows, document types).
- **Modular**: Each module declares its own configurable features; no central coupling.
- **No code changes**: Business admins adjust templates in the console; developers don't touch the app.
- **Audit trail**: Track who changed what, when, and roll back if needed.
- **Scalable**: One business can run 10+ customer templates with completely different behaviours.

## Concepts

### Template
A named set of configurations, per organisation.
- Code: `RETAIL`, `WHOLESALE`, `EXPORT` (unique per org)
- Name: "Retail Direct", "B2B Wholesale", "Export Customers"
- Description: "For small walk-in retail accounts"
- Status: `ACTIVE`, `DRAFT`, `ARCHIVED`
- Version: incremented each time the template is changed
- Audit: who created/changed, when

### Module Feature
A configurable aspect of a module, defined by that module.
- Feature code: `sales.require_po`, `sales.enable_call_offs`, `logistics.auto_confirm_delivery`
- Display name: "Customer PO required"
- Type: `BOOLEAN`, `ENUM`, `STRING`, `JSON`
- Default value: sensible default for new templates
- Module: "sales", "logistics", "finance", etc.

### Template Configuration
The settings for a module within a template.
- Template + Module = one configuration
- Enabled features
- Custom values (e.g., `default_warehouse_code`, `approval_limit`)
- JSON for complex settings

### Customer → Template
Customers link to a template by code.
- When a customer is accessed, their template is loaded
- If no template is linked, use org's default template
- Templates can be per-customer or per-customer-group

## How It Works

### 1. Module Declares Features

In a module's manifest or a features file, declare what's configurable:

```typescript
// src/modules/sales/domain/template-features.ts
export const SALES_TEMPLATE_FEATURES = [
  {
    code: 'require_customer_po',
    name: 'Customer PO required',
    description: 'Reject orders without a customer PO number',
    type: 'BOOLEAN' as const,
    default: false,
    module: 'sales',
  },
  {
    code: 'enable_call_offs',
    name: 'Enable call-off orders',
    description: 'Allow creating and delivering call-off agreements',
    type: 'BOOLEAN' as const,
    default: false,
    module: 'sales',
  },
  {
    code: 'require_delivery_date',
    name: 'Delivery date required',
    description: 'Reject orders without a promised delivery date',
    type: 'BOOLEAN' as const,
    default: false,
    module: 'sales',
  },
  {
    code: 'order_types',
    name: 'Allowed order types',
    description: 'Which order types this template can create',
    type: 'ENUM' as const,
    values: ['STANDARD', 'CALL_OFF', 'PROJECT', 'BLANKET', 'SAMPLE', 'REPLACEMENT', 'INTERNAL'],
    default: ['STANDARD'],
    module: 'sales',
  },
] as const;
```

### 2. Module Reads Template at Runtime

When handling a request:

```typescript
// In a server action or query
const session = await requireSession();
const template = await getCustomerTemplate(session.organisationId, partyId);

// Check if feature is enabled
if (template.sales.require_customer_po && !order.customerPoNumber) {
  throw new Error('Customer PO is required for this customer');
}

// Check an enum config
if (!template.sales.order_types.includes(orderType)) {
  throw new Error(`Order type ${orderType} not allowed for this customer`);
}
```

### 3. UI Adapts to Template

Conditional rendering based on template:

```typescript
// In a React component
const config = await getCustomerTemplate(partyId);

return (
  <form>
    {/* PO field always shown, but marked required based on template */}
    <input
      name="customerPo"
      required={config.sales.require_customer_po}
    />
    
    {/* Delivery date shown only if enabled */}
    {config.sales.require_delivery_date && (
      <DatePicker name="deliveryDate" required />
    )}
    
    {/* Call-offs only if this template allows them */}
    {config.sales.enable_call_offs && (
      <select>
        {['STANDARD', 'CALL_OFF'].map(type => (
          <option key={type}>{type}</option>
        ))}
      </select>
    )}
  </form>
);
```

### 4. Business Admin Sets Up Templates

In the console (Console → Module Setup):
1. "Create template" → pick a name ("Retail Direct")
2. For each enabled module, toggle features on/off and set values
3. "Assign customers" → pick customers/customer groups to apply this template
4. Changes are versioned; admins can see change history and roll back

## Schema

```sql
-- Template itself
table CustomerTemplate {
  id            String  @id
  organisationId String
  code          String  @unique per org
  name          String
  description   String?
  version       Int     @default(1)
  status        String  @default("ACTIVE") -- ACTIVE, DRAFT, ARCHIVED
  createdBy     String  -- User ID
  createdAt     DateTime
  updatedBy     String?
  updatedAt     DateTime
}

-- Per-module config within a template
table CustomerTemplateModule {
  id              String @id
  templateId      String
  module          String -- "sales", "logistics", "finance"
  configuration   Json   -- all module features + custom settings
  version         Int
  changedAt       DateTime
  changedBy       String -- User ID
}

-- Audit trail of changes
table CustomerTemplateChange {
  id            String @id
  templateId    String
  templateModuleId String?
  changeType    String -- "FEATURE_ENABLED", "FEATURE_DISABLED", "VALUE_CHANGED"
  featureCode   String
  oldValue      Json?
  newValue      Json
  changedBy     String -- User ID
  changedAt     DateTime
}

-- Link customer to template
ALTER TABLE Party ADD templateCode String?;
ALTER TABLE Party ADD templateOverrides Json? -- customer-specific overrides
```

## API

### Get template for customer
```typescript
const template = await getCustomerTemplate(organisationId, partyId);
// Returns: { sales: {...}, logistics: {...}, finance: {...} }

// Or get organization default
const defaultTemplate = await getOrganisationDefaultTemplate(organisationId);
```

### Check a feature
```typescript
const enabled = await isFeatureEnabled(
  organisationId,
  partyId, 
  'sales.require_customer_po'
);

const value = await getTemplateValue(
  organisationId,
  partyId,
  'sales.require_delivery_date'
);
```

### Get all templates (for console)
```typescript
const templates = await listTemplates(organisationId);
const template = await getTemplate(organisationId, code);
```

### Create/update templates (console operations)
```typescript
await createTemplate(organisationId, {
  code: 'RETAIL',
  name: 'Retail Direct',
  modules: {
    sales: { require_customer_po: false, enable_call_offs: false },
    logistics: { auto_confirm_delivery: false },
  },
});

await updateTemplate(organisationId, 'RETAIL', {
  modules: { 
    sales: { require_customer_po: true } 
  },
});

// Assign to customers
await assignTemplate(organisationId, 'RETAIL', ['CUST001', 'CUST002']);
```

## Module Integration Checklist

When adding a module or feature to templates:

1. **Define features** in `src/modules/[module]/domain/template-features.ts`
2. **Register features** in `src/core/templates/registry.ts`
3. **Read template at runtime** in services/actions that need it
4. **Adapt UI** in components that render fields/workflows
5. **Validate** against template in server actions (e.g., reject PO-less orders if required)
6. **Document** what features do and why they matter in CUSTOMER_TEMPLATES.md

## Examples

### Example 1: Retail template
```json
{
  "code": "RETAIL",
  "name": "Retail Direct",
  "modules": {
    "sales": {
      "require_customer_po": false,
      "enable_call_offs": false,
      "order_types": ["STANDARD"],
      "require_delivery_date": false
    },
    "logistics": {
      "auto_confirm_delivery": true,
      "require_signature": false
    },
    "finance": {
      "approval_required": false
    }
  }
}
```
When this template is applied, orders don't require a PO, call-offs are hidden, only STANDARD orders can be created, and delivery is auto-confirmed.

### Example 2: B2B Wholesale template
```json
{
  "code": "WHOLESALE",
  "name": "B2B Wholesale",
  "modules": {
    "sales": {
      "require_customer_po": true,
      "enable_call_offs": true,
      "order_types": ["STANDARD", "CALL_OFF", "PROJECT"],
      "require_delivery_date": true
    },
    "logistics": {
      "auto_confirm_delivery": false,
      "require_signature": true
    },
    "finance": {
      "approval_required": true,
      "approval_limit": 10000.00
    }
  }
}
```
Orders must have PO, delivery date, and call-offs are available. Deliveries require signature confirmation. Finance approvals required for orders over £10k.

### Example 3: Export template
```json
{
  "code": "EXPORT",
  "name": "Export Customers",
  "modules": {
    "sales": {
      "require_customer_po": true,
      "enable_call_offs": false,
      "order_types": ["STANDARD"],
      "require_delivery_date": true,
      "require_incoterms": true,
      "require_commodity_codes": true
    },
    "logistics": {
      "auto_confirm_delivery": false,
      "require_signature": false,
      "require_tracking": true
    },
    "finance": {
      "approval_required": true,
      "approval_limit": 50000.00
    }
  }
}
```
Strict export requirements: Incoterms, commodity codes, tracking required.

## Inheritance & Defaults

When a business is created:
1. Three default templates are created: STANDARD, PREMIUM, RESTRICTED
2. New customers are assigned to STANDARD by default
3. Customers inherit all features from their template
4. Individual customers can be given template overrides (edit individual customer's config)
5. If a feature is added to the module later, all templates automatically get the default value for that feature

## Rollback & History

Changes to a template are tracked:
- Who changed what feature, when
- Previous value and new value
- Ability to revert a specific change or to a specific version
- Audit log visible in console
- Reverting a template version resets all customers using that template

## Deployment Notes

- Templates are organisation-scoped (tenant isolation)
- Template changes take effect immediately for all customers
- No schema migration needed for template changes (it's JSON)
- Performance: templates cached per-request (avoid repeated lookups)
- Backward compatibility: if a template doesn't have a feature, use the module default
