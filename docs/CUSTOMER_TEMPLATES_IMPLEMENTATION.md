# Customer Templates Implementation Guide

Complete reference for the customer template system in Atlas.

## What It Does

Allows businesses to configure how Atlas modules behave for different customer types—without code changes. Create templates (Retail, Wholesale, Export, etc.), define what features each template needs, assign customers to templates, and the app adapts automatically.

## Architecture

### Components

1. **Registry** (`src/core/templates/registry.ts`)
   - Module features are declared here
   - Validation of configurations
   - Default values

2. **Commands** (`src/core/templates/commands.ts`)
   - Create templates
   - Update module configurations
   - Assign/unassign customers
   - Delete templates

3. **Queries** (`src/core/templates/queries.ts`)
   - Get customer's template configuration
   - Check if feature is enabled
   - Get feature values
   - List templates, change history

4. **Data Model** (`prisma/schema.prisma`)
   - `CustomerTemplate` - template definition
   - `CustomerTemplateModule` - per-module config
   - `CustomerTemplateChange` - audit trail
   - `CustomerTemplateAssignment` - links customers to templates
   - `Party.templateCode` - customer's assigned template

5. **Console UI** (`src/app/(app)/console/templates/`)
   - Manage templates
   - Configure modules
   - Assign customers

## How to Use

### For Applications: Reading Template Config

In a server action or page:

```typescript
import { isFeatureEnabled, getFeatureValue, getCustomerTemplate } from '@/core/templates';
import { requireSession } from '@/core/auth/session';

// Check if a feature is enabled
const poRequired = await isFeatureEnabled(
  organisationId,
  partyId, // customer ID
  'sales.require_customer_po'
);

if (poRequired && !order.customerPo) {
  throw new Error('Customer PO is required');
}

// Get a feature's value
const minOrderValue = await getFeatureValue(
  organisationId,
  partyId,
  'sales.minimum_order_value'
);

if (orderTotal < minOrderValue) {
  throw new Error(`Minimum order value is £${minOrderValue}`);
}

// Get entire template configuration
const template = await getCustomerTemplate(organisationId, partyId);
// { sales: { require_customer_po: true, ... }, logistics: { ... } }

// Use in UI: hide/show fields based on template
if (template.sales.enable_call_offs) {
  // Show call-off option
}
```

### For Modules: Declaring Features

1. **Create a feature file** in your module:

```typescript
// src/modules/shipping/domain/template-features.ts
import type { TemplateFeature } from '@/core/templates/registry';

export const SHIPPING_TEMPLATE_FEATURES: TemplateFeature[] = [
  {
    code: 'require_signature',
    module: 'shipping',
    name: 'Signature required',
    description: 'Deliveries must be signed by recipient',
    type: 'BOOLEAN',
    default: false,
    uiHint: 'toggle',
  },
  {
    code: 'allowed_carriers',
    module: 'shipping',
    name: 'Allowed shipping carriers',
    description: 'Which carriers can ship to this customer',
    type: 'ENUM',
    values: ['DPD', 'DHL', 'FEDEX', 'UPS', 'USPS'],
    default: ['DPD', 'DHL'],
    uiHint: 'multi-select',
  },
];
```

2. **Register features** in your module's init/manifest:

```typescript
// src/modules/shipping/manifest.ts
import { registerTemplateFeatures } from '@/core/templates/registry';
import { SHIPPING_TEMPLATE_FEATURES } from './domain/template-features';

export const shippingManifest = {
  // ... manifest properties
  init: () => {
    registerTemplateFeatures(SHIPPING_TEMPLATE_FEATURES);
  },
};
```

3. **Use in your module**:

```typescript
// src/modules/shipping/services/carrier-selection.ts
import { isFeatureEnabled, getFeatureValue } from '@/core/templates';

export async function selectCarrier(partyId: string, proposedCarrier: string) {
  const allowedCarriers = await getFeatureValue(
    session.organisationId,
    partyId,
    'shipping.allowed_carriers'
  );

  if (!allowedCarriers.includes(proposedCarrier)) {
    throw new Error(`${proposedCarrier} not allowed for this customer`);
  }

  return proposedCarrier;
}
```

## Feature Types

### BOOLEAN
Simple on/off flag.
```typescript
{
  type: 'BOOLEAN',
  default: false,
  uiHint: 'toggle',
}
```

### STRING
Text value.
```typescript
{
  type: 'STRING',
  default: 'NET30',
  uiHint: 'text',
}
```

### NUMBER
Numeric value (int or float).
```typescript
{
  type: 'NUMBER',
  default: 0,
  uiHint: 'number',
}
```

### ENUM
Choice from a list. Value can be a single choice or an array (for multi-select).
```typescript
{
  type: 'ENUM',
  values: ['STANDARD', 'CALL_OFF', 'PROJECT'],
  default: ['STANDARD'],
  uiHint: 'multi-select',
}
```

### JSON
Complex/flexible configuration.
```typescript
{
  type: 'JSON',
  default: {},
  uiHint: undefined,
}
```

## Database

### Tables

**customer_templates**
- `id` - unique
- `organisation_id` - tenant isolation
- `code` - e.g., "RETAIL", "WHOLESALE" (unique per org)
- `name` - display name
- `description` - help text
- `version` - incremented on any change
- `status` - ACTIVE, DRAFT, ARCHIVED
- `created_by`, `created_at`, `updated_by`, `updated_at`

**customer_template_modules**
- `id` - unique
- `template_id` - FK to template
- `module` - e.g., "sales", "logistics"
- `configuration` - JSON { featureCode: value, ... }
- `version` - incremented per module change
- `changed_by`, `changed_at`

**customer_template_changes**
- `id` - unique
- `template_id` - FK to template
- `template_module_id` - FK to module config (optional)
- `change_type` - FEATURE_ENABLED, VALUE_CHANGED, etc.
- `feature_code` - which feature changed
- `old_value`, `new_value` - before/after
- `changed_by`, `changed_at`

**customer_template_assignments**
- `id` - unique
- `template_id` - FK to template
- `party_id` - FK to customer
- `assigned_by`, `assigned_at`, `removed_at`

**parties** (Customer Master)
- `template_code` - links to CustomerTemplate.code
- `template_overrides` - JSON for customer-specific overrides

## Lifecycle

### Creating a Template

```typescript
import { createTemplate } from '@/core/templates';

await createTemplate({
  code: 'RETAIL',
  name: 'Retail Direct',
  description: 'For small walk-in retail accounts',
  modules: {
    sales: {
      require_customer_po: false,
      order_types: ['STANDARD'],
      enable_call_offs: false,
    },
    logistics: {
      auto_confirm_delivery: true,
    },
  },
});
```

### Updating a Template

```typescript
import { updateTemplateModule } from '@/core/templates';

await updateTemplateModule({
  templateCode: 'RETAIL',
  module: 'sales',
  config: {
    require_customer_po: true, // changed
    order_types: ['STANDARD', 'CALL_OFF'], // changed
    enable_call_offs: true, // changed
  },
});
```

All customers using this template immediately see the changes.

### Assigning Customers

```typescript
import { assignTemplateToCustomers } from '@/core/templates';

await assignTemplateToCustomers({
  templateCode: 'RETAIL',
  customerIds: ['CUST001', 'CUST002', 'CUST003'],
});
```

### Checking at Runtime

```typescript
const template = await getCustomerTemplate(organisationId, partyId);

// template.sales = { require_customer_po: true, ... }
// template.logistics = { auto_confirm_delivery: true, ... }

if (template.sales.require_customer_po && !order.po) {
  throw new Error('PO required');
}
```

## Default Templates

When an organisation is created, three templates are automatically created:

1. **STANDARD**
   - All features at their registry defaults
   - Good starting point for most customers

2. **PREMIUM**
   - All boolean features enabled
   - All enum features set to all values
   - Featureful template

3. **RESTRICTED**
   - All boolean features disabled
   - Minimal/safe defaults
   - For limited customers

## Validation

Template configurations are validated:
- Unknown features are rejected
- Enum values must be in the declared list
- Type mismatches are caught
- Required features can't be unset

```typescript
import { validateModuleConfiguration } from '@/core/templates/registry';

const result = validateModuleConfiguration('sales', {
  require_customer_po: true,
  minimum_order_value: 'not a number', // ❌ wrong type
  unknown_feature: true, // ❌ not declared
});

if (!result.valid) {
  console.error(result.errors);
}
```

## Audit Trail

Every template change is recorded:

```typescript
import { getTemplateChangeHistory } from '@/core/templates';

const changes = await getTemplateChangeHistory(organisationId, 'RETAIL');
// [
//   { templateId, changeType, featureCode, oldValue, newValue, changedBy, changedAt },
//   ...
// ]
```

Changes can be reviewed in the console, and (in future) specific changes can be rolled back.

## Caching

Template configurations are cached per request to avoid repeated DB lookups:

```typescript
// Later calls in the same request use the cached value
const template1 = await getCustomerTemplate(org, party, requestContext);
const template2 = await getCustomerTemplate(org, party, requestContext); // cache hit
```

Pass the same `cacheContext` (often the request object) to enable caching.

## Fallbacks

- If a customer has no template assigned → use org's STANDARD template
- If a template is deleted → customer reverts to STANDARD
- If a feature is missing from a template → use feature's registry default
- If a feature is unknown → ignore it (graceful degradation)

## Performance

- Templates are cached per request
- Org default is cached
- Single DB query per customer+org combo
- Subsequent checks in same request are memory-only

## Security

- Templates are organisation-scoped (tenant isolation)
- Require `core.modules.manage` to create/edit/assign
- Configurations are validated server-side
- Customer overrides are sandboxed per customer

## Future Enhancements

- [ ] Customer-specific overrides (customer A's template + custom settings)
- [ ] Template versioning (rollback to previous version)
- [ ] Template inheritance (Premium extends Standard)
- [ ] Approval workflow for template changes
- [ ] A/B testing (deploy template to % of customers)
- [ ] Analytics (track which features most used)
- [ ] Import/export templates between orgs (managed multi-tenant)
