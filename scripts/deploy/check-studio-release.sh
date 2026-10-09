#!/usr/bin/env bash
# Called only by the pinned deployer while its original release locks remain held.
set -euo pipefail
STUDIO_URL="${1:?candidate or public URL}"
STUDIO_PHASE="${2:?candidate or public phase}"
STUDIO_REV="${3:?pinned revision}"
STUDIO_EVIDENCE="${4:?private evidence directory}"
[[ "$STUDIO_REV" =~ ^[a-f0-9]{40}$ && "$STUDIO_PHASE" =~ ^(candidate|public)$ ]]
[[ ( "$STUDIO_PHASE" = candidate && "$STUDIO_URL" = http://127.0.0.1:3011 ) || ( "$STUDIO_PHASE" = public && "$STUDIO_URL" = https://atlassystem.online ) ]]
[[ -d "$STUDIO_EVIDENCE" && "$(cat .atlas-ready)" = "$STUDIO_REV" ]]
set -a; . .env.local; . /etc/atlas/guardian.env; . .release.env; set +a
export PLAYWRIGHT_BROWSERS_PATH=/home/administrator/.cache/ms-playwright
verify_revision() {
  curl --max-time 20 -fsS "$STUDIO_URL/api/health/release" | node -e 'let b="";process.stdin.on("data",v=>b+=v);process.stdin.on("end",()=>{if(JSON.parse(b).revision!==process.argv[1])process.exit(1)})' "$STUDIO_REV"
}
verify_revision
ATLAS_DASHBOARD_CHECK=1 ATLAS_DASHBOARD_URL="$STUDIO_URL" node --env-file=.env.local --import tsx scripts/check-dashboards.ts > "$STUDIO_EVIDENCE/dashboards.log" 2>&1 || { cat "$STUDIO_EVIDENCE/dashboards.log"; exit 1; }
cat "$STUDIO_EVIDENCE/dashboards.log"
ATLAS_STUDIO_LIVE_TEST=1 ATLAS_STUDIO_TEST_URL="$STUDIO_URL" node --env-file=.env.local --import tsx scripts/studio/check-metadata.ts > "$STUDIO_EVIDENCE/acceptance.log" 2>&1 || { cat "$STUDIO_EVIDENCE/acceptance.log"; exit 1; }
cat "$STUDIO_EVIDENCE/acceptance.log"
ATLAS_HOME_MENU_CHECK=1 ATLAS_HOME_MENU_URL="$STUDIO_URL" node --env-file=.env.local --import tsx scripts/check-home-menu.ts > "$STUDIO_EVIDENCE/home-acceptance.log" 2>&1 || { cat "$STUDIO_EVIDENCE/home-acceptance.log"; exit 1; }
cat "$STUDIO_EVIDENCE/home-acceptance.log"

ATLAS_REPORTS_CHECK=1 ATLAS_REPORTS_URL="$STUDIO_URL" node --env-file=.env.local --import tsx scripts/check-reports.ts > "$STUDIO_EVIDENCE/reports.log" 2>&1 || { cat "$STUDIO_EVIDENCE/reports.log"; exit 1; }
cat "$STUDIO_EVIDENCE/reports.log"

pg_dump "${DATABASE_URL%%\?*}" -Fc -f "$STUDIO_EVIDENCE/pre-mrp.dump"
ATLAS_GUARDIAN_MRP_TEST=1 ATLAS_MRP_TEST_URL="$STUDIO_URL" ATLAS_MRP_TEST_REVISION="$STUDIO_REV" node --env-file=.env.local --import tsx scripts/guardian/check-mrp-access.ts > "$STUDIO_EVIDENCE/mrp.log" 2>&1 || { cat "$STUDIO_EVIDENCE/mrp.log"; exit 1; }
cat "$STUDIO_EVIDENCE/mrp.log"

ATLAS_MESSAGES_CHECK=1 ATLAS_MESSAGES_URL="$STUDIO_URL" node --env-file=.env.local --import tsx scripts/check-messages.ts > "$STUDIO_EVIDENCE/messages.log" 2>&1 || { cat "$STUDIO_EVIDENCE/messages.log"; exit 1; }
cat "$STUDIO_EVIDENCE/messages.log"
ATLAS_PRIVATE_ADMIN_TEST=1 ATLAS_PRIVATE_ADMIN_TEST_URL="$STUDIO_URL" ATLAS_PRIVATE_ADMIN_EVIDENCE="$STUDIO_EVIDENCE/private-admin" node --env-file=.env.local --import tsx scripts/check-private-admin-login.ts > "$STUDIO_EVIDENCE/private-admin.log" 2>&1 || { cat "$STUDIO_EVIDENCE/private-admin.log"; exit 1; }
cat "$STUDIO_EVIDENCE/private-admin.log"
pg_dump "${DATABASE_URL%%\?*}" -Fc -f "$STUDIO_EVIDENCE/pre-supply.dump"
ATLAS_SUPPLY_CHECK=1 ATLAS_SUPPLY_URL="$STUDIO_URL" ATLAS_SUPPLY_OUTPUT="$STUDIO_EVIDENCE/supply" node --env-file=.env.local --import tsx scripts/check-manufacturing-supply.ts > "$STUDIO_EVIDENCE/supply.log" 2>&1 || { cat "$STUDIO_EVIDENCE/supply.log"; exit 1; }
cat "$STUDIO_EVIDENCE/supply.log"
pg_dump "${DATABASE_URL%%\?*}" -Fc -f "$STUDIO_EVIDENCE/pre-commercial.dump"
ATLAS_COMMERCIAL_CHECK=1 ATLAS_COMMERCIAL_URL="$STUDIO_URL" ATLAS_TEST_REVISION="$STUDIO_REV" node --env-file=.env.local --import tsx scripts/check-commercial-workspaces.ts > "$STUDIO_EVIDENCE/commercial.log" 2>&1 || { cat "$STUDIO_EVIDENCE/commercial.log"; exit 1; }
cat "$STUDIO_EVIDENCE/commercial.log"
pg_dump "${DATABASE_URL%%\?*}" -Fc -f "$STUDIO_EVIDENCE/pre-people.dump"
ATLAS_PEOPLE_TEST=1 ATLAS_PEOPLE_TEST_URL="$STUDIO_URL" ATLAS_PEOPLE_EVIDENCE="$STUDIO_EVIDENCE/people" node --env-file=.env.local --import tsx scripts/check-people-workspaces.ts > "$STUDIO_EVIDENCE/people.log" 2>&1 || { cat "$STUDIO_EVIDENCE/people.log"; exit 1; }
cat "$STUDIO_EVIDENCE/people.log"
printf 'ALL COMBINED ACCEPTANCE CHECKS PASSED: %s\n' "$STUDIO_REV"

verify_revision
