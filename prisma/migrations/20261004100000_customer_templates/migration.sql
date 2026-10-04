-- Customer Templates: flexible per-customer configuration
-- Allows businesses to customize module behaviour without code changes

-- Template definition
CREATE TABLE customer_templates (
  id TEXT PRIMARY KEY,
  organisation_id TEXT NOT NULL,
  code TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,

  -- Version for tracking changes
  version INT NOT NULL DEFAULT 1,
  status TEXT NOT NULL DEFAULT 'ACTIVE',

  -- Audit
  created_by TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_by TEXT,
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),

  -- Constraint: code must be unique per organisation
  CONSTRAINT fk_customer_templates_org
    FOREIGN KEY (organisation_id)
    REFERENCES organisations(id) ON DELETE CASCADE,
  CONSTRAINT uq_customer_templates_code_per_org
    UNIQUE(organisation_id, code)
);

-- Create index on org and code for lookups
CREATE INDEX idx_customer_templates_org ON customer_templates(organisation_id);

-- Per-module configuration within a template
CREATE TABLE customer_template_modules (
  id TEXT PRIMARY KEY,
  template_id TEXT NOT NULL,
  module TEXT NOT NULL,

  -- JSON configuration: { featureCode: value, ... }
  configuration JSONB NOT NULL DEFAULT '{}',

  -- Version within template
  version INT NOT NULL DEFAULT 1,

  -- Audit
  changed_by TEXT,
  changed_at TIMESTAMP NOT NULL DEFAULT NOW(),

  CONSTRAINT fk_customer_template_modules_template
    FOREIGN KEY (template_id)
    REFERENCES customer_templates(id) ON DELETE CASCADE,
  CONSTRAINT uq_customer_template_module
    UNIQUE(template_id, module)
);

CREATE INDEX idx_customer_template_modules_template
  ON customer_template_modules(template_id);
CREATE INDEX idx_customer_template_modules_module
  ON customer_template_modules(template_id, module);

-- Audit trail of changes
CREATE TABLE customer_template_changes (
  id TEXT PRIMARY KEY,
  template_id TEXT NOT NULL,
  template_module_id TEXT,

  -- What changed
  change_type TEXT NOT NULL,  -- FEATURE_ENABLED, FEATURE_DISABLED, VALUE_CHANGED, TEMPLATE_CREATED
  feature_code TEXT,

  -- Before/after
  old_value JSONB,
  new_value JSONB,

  -- Audit
  changed_by TEXT,
  changed_at TIMESTAMP NOT NULL DEFAULT NOW(),

  CONSTRAINT fk_customer_template_changes_template
    FOREIGN KEY (template_id)
    REFERENCES customer_templates(id) ON DELETE CASCADE,
  CONSTRAINT fk_customer_template_changes_module
    FOREIGN KEY (template_module_id)
    REFERENCES customer_template_modules(id) ON DELETE SET NULL
);

CREATE INDEX idx_customer_template_changes_template
  ON customer_template_changes(template_id);
CREATE INDEX idx_customer_template_changes_when
  ON customer_template_changes(changed_at DESC);

-- Link customers (Party) to templates
-- Optional: if null, use organisation default template
ALTER TABLE parties ADD COLUMN template_code TEXT;
ALTER TABLE parties ADD COLUMN template_overrides JSONB DEFAULT '{}';

-- Index for template lookups
CREATE INDEX idx_parties_template
  ON parties("organisationId", template_code);

-- Template assignment tracking (optional: for auditing which customers use which template)
CREATE TABLE customer_template_assignments (
  id TEXT PRIMARY KEY,
  template_id TEXT NOT NULL,
  party_id TEXT NOT NULL,

  -- Audit
  assigned_by TEXT,
  assigned_at TIMESTAMP NOT NULL DEFAULT NOW(),
  removed_at TIMESTAMP,

  CONSTRAINT fk_customer_template_assignments_template
    FOREIGN KEY (template_id)
    REFERENCES customer_templates(id) ON DELETE CASCADE,
  CONSTRAINT fk_customer_template_assignments_party
    FOREIGN KEY (party_id)
    REFERENCES parties(id) ON DELETE CASCADE
);

CREATE INDEX idx_customer_template_assignments_template
  ON customer_template_assignments(template_id);
CREATE INDEX idx_customer_template_assignments_party
  ON customer_template_assignments(party_id);

-- Set default template for existing organisations (migrating)
-- This will be done in a data migration step after schema applies
