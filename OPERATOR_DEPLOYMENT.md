# Atlas Central Server Deployment — Operator Guide

**Status:** Desktop app deployed. Central server activation required (4-6 hours).

---

## Quick Start (Copy & Paste)

```bash
cd /opt/atlas-test  # or your Atlas source directory
export DATABASE_URL="postgresql://your_user:your_pass@localhost:5432/atlas"

bash scripts/deploy-operator-complete.sh "$DATABASE_URL" northbridge michaelpatrickfrost@googlemail.com
```

That's it. The script handles all 4 steps.

---

## What This Does

| Step | Time | Action |
|---|---|---|
| 1 | 30 min | Apply pending Prisma schema migrations (new tables for Payroll, Planning, etc.) |
| 2 | 2-4 hrs | Regenerate data-service metadata and rebuild |
| 3 | 30 min | Enable Payroll, Planning, Manufacturing modules for the organisation |
| 4 | 1-2 hrs | Grant role capabilities so staff/team_manager roles can access new modules |

---

## Manual Steps (if script fails)

### Step 1: Migrations
```bash
export DATABASE_URL="postgresql://user:pass@host:5432/atlas"
cd /opt/atlas-test
npx prisma migrate deploy
```

### Step 2: Data API
```bash
npx prisma generate
node scripts/generate-data-api.mjs
npm run build
systemctl restart atlas-data-service
```

### Step 3: Module Enablement
```bash
node deploy/enable-payroll.mjs northbridge michaelpatrickfrost@googlemail.com
node deploy/enable-planning.mjs northbridge michaelpatrickfrost@googlemail.com
node deploy/enable-manufacturing.mjs northbridge michaelpatrickfrost@googlemail.com
```

### Step 4: Role Capabilities (SQL)
```bash
psql -U atlas_user -d atlas -h localhost << 'EOF'
UPDATE roles 
SET capabilities = array_append(array_remove(capabilities, 'people.payroll.read'), 'payroll.run.read')
WHERE organisation_id = (SELECT id FROM organisations WHERE slug = 'northbridge')
  AND code IN ('staff', 'team_manager');

UPDATE roles 
SET capabilities = array_append(array_remove(capabilities, 'people.payroll.manage'), 'payroll.run.manage')
WHERE organisation_id = (SELECT id FROM organisations WHERE slug = 'northbridge')
  AND code IN ('staff', 'team_manager');

UPDATE roles 
SET capabilities = array_append(capabilities, 'planning.read')
WHERE organisation_id = (SELECT id FROM organisations WHERE slug = 'northbridge')
  AND code IN ('admin', 'staff', 'team_manager');
EOF
```

---

## Verify Deployment

```bash
# Check schema is current
node scripts/check-release-schema.mjs

# Restart service
systemctl restart atlas-data-service

# Test app (from user's Mac)
open /Users/michael/Applications/Atlas.app
# Sign in, navigate to Payroll or Planning — should load without 403 errors
```

---

## Troubleshooting

| Error | Fix |
|---|---|
| `Can't reach database server` | Check DATABASE_URL is correct, Postgres is running |
| `Prisma schema not found` | Run from `/opt/atlas-test` or your Atlas source directory |
| `Module not found` (deploy/enable-*.mjs) | Ensure you're in the Atlas repo root |
| `Permission denied` on SQL | Verify psql user has ALTER ROLE permissions |

---

## Questions?

See `.ai/SYSTEM_CONNECTION_PLAN.md` Part 1 for detailed architecture and troubleshooting.

Contact: michaelpatrickfrost@googlemail.com

---

**Time estimate:** 4-6 hours total. Most is waiting for builds.
