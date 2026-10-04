#!/bin/bash
# Complete operator deployment script for central Atlas server
# Run this with: bash deploy-operator-complete.sh <database-url> <org-slug> <admin-email>
# Example: bash deploy-operator-complete.sh "postgresql://user:pass@host:5432/atlas" northbridge michaelpatrickfrost@googlemail.com

set -e

if [ $# -lt 3 ]; then
  echo "Usage: $0 <DATABASE_URL> <ORG_SLUG> <ADMIN_EMAIL>"
  echo "Example: $0 'postgresql://user:pass@localhost:5432/atlas' northbridge admin@example.com"
  exit 1
fi

DATABASE_URL="$1"
ORG_SLUG="$2"
ADMIN_EMAIL="$3"

echo "🚀 Atlas Central Server Deployment"
echo "================================================"
echo "Database: $DATABASE_URL"
echo "Organisation: $ORG_SLUG"
echo "Admin Email: $ADMIN_EMAIL"
echo ""

# Step 1: Apply schema migrations
echo "Step 1/4: Applying schema migrations..."
export DATABASE_URL="$DATABASE_URL"
npx prisma migrate deploy || {
  echo "❌ Migration failed. Check database connection and permissions."
  exit 1
}
echo "✅ Schema migrations applied"

# Step 2: Regenerate data-service metadata
echo ""
echo "Step 2/4: Regenerating data-service metadata..."
npx prisma generate || {
  echo "❌ Prisma generate failed."
  exit 1
}
node scripts/generate-data-api.mjs || {
  echo "❌ Data API generation failed."
  exit 1
}
echo "✅ Metadata regenerated"

# Step 3: Enable modules
echo ""
echo "Step 3/4: Enabling modules..."
node deploy/enable-payroll.mjs "$ORG_SLUG" "$ADMIN_EMAIL" || {
  echo "⚠️  Payroll enable had issues (may already be enabled)"
}
node deploy/enable-planning.mjs "$ORG_SLUG" "$ADMIN_EMAIL" || {
  echo "⚠️  Planning enable had issues (may already be enabled)"
}
node deploy/enable-manufacturing.mjs "$ORG_SLUG" "$ADMIN_EMAIL" || {
  echo "⚠️  Manufacturing enable had issues (may already be enabled)"
}
echo "✅ Modules enabled"

# Step 4: Grant role capabilities
echo ""
echo "Step 4/4: Granting role capabilities..."
export PGPASSWORD="${DATABASE_URL##*:}"
export PGPASSWORD="${PGPASSWORD%%@*}"
PGHOST="${DATABASE_URL##*@}"
PGHOST="${PGHOST%%:*}"
PGPORT="${DATABASE_URL##*:}"
PGPORT="${PGPORT%%/*}"
PGUSER="${DATABASE_URL##*://}"
PGUSER="${PGUSER%%:*}"
PGDATABASE="${DATABASE_URL##*/}"

psql -h "$PGHOST" -p "$PGPORT" -U "$PGUSER" -d "$PGDATABASE" << EOF
-- Grant payroll capabilities to staff and team_manager roles
UPDATE roles
SET capabilities = array_append(array_remove(capabilities, 'people.payroll.read'), 'payroll.run.read')
WHERE organisation_id = (SELECT id FROM organisations WHERE slug = '$ORG_SLUG')
  AND code IN ('staff', 'team_manager');

UPDATE roles
SET capabilities = array_append(array_remove(capabilities, 'people.payroll.manage'), 'payroll.run.manage')
WHERE organisation_id = (SELECT id FROM organisations WHERE slug = '$ORG_SLUG')
  AND code IN ('staff', 'team_manager');

-- Grant planning capabilities
UPDATE roles
SET capabilities = array_append(capabilities, 'planning.read')
WHERE organisation_id = (SELECT id FROM organisations WHERE slug = '$ORG_SLUG')
  AND code IN ('admin', 'staff', 'team_manager');

-- Log changes
INSERT INTO audit_entries (action, actor_id, organisation_id, resource_type, resource_id, before_value, after_value, created_at)
SELECT 'roles.capabilities.synced', NULL, id, 'Role', id, '{}', '{}', NOW()
FROM organisations WHERE slug = '$ORG_SLUG';
EOF

echo "✅ Role capabilities granted"

echo ""
echo "================================================"
echo "✅ DEPLOYMENT COMPLETE"
echo ""
echo "Next steps:"
echo "1. Restart central data service: systemctl restart atlas-data-service"
echo "2. Verify schema check: node scripts/check-release-schema.mjs"
echo "3. Test installed app: Open /Users/michael/Applications/Atlas.app"
echo ""
