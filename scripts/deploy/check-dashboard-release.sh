#!/usr/bin/env bash
# Called by the pinned deployer while it owns both release locks; never re-lock here.
set -euo pipefail
DASHBOARD_URL="${1:?url required}"; DASHBOARD_PHASE="${2:?phase required}"; DASHBOARD_REV="${3:?revision required}"
[[ "$(uname -s)" = Linux && "$DASHBOARD_REV" =~ ^[a-f0-9]{40}$ ]]
[[ "$DASHBOARD_PHASE" = candidate || "$DASHBOARD_PHASE" = public ]]
[[ "$DASHBOARD_URL" = http://127.0.0.1:3011 || "$DASHBOARD_URL" = https://atlassystem.online ]]
cd "$(dirname "$0")/../.."
set -a
. .env.local
. /etc/atlas/guardian.env
set +a
export NODE_ENV=production PLAYWRIGHT_BROWSERS_PATH=/home/administrator/.cache/ms-playwright
check_revision() {
  curl --max-time 20 -fsS "$DASHBOARD_URL/api/health/release" | /usr/bin/node -e 'let b="";process.stdin.on("data",v=>b+=v);process.stdin.on("end",()=>{if(JSON.parse(b).revision!==process.argv[1])process.exit(1)})' "$DASHBOARD_REV"
  echo "PASS $DASHBOARD_PHASE release revision $DASHBOARD_REV"
}
check_revision
ATLAS_DASHBOARD_CHECK=1 ATLAS_DASHBOARD_URL="$DASHBOARD_URL" timeout 180s /usr/bin/node --env-file=.env.local --import tsx scripts/check-dashboards.ts
ATLAS_HOME_MENU_CHECK=1 ATLAS_HOME_MENU_URL="$DASHBOARD_URL" timeout 180s /usr/bin/node --env-file=.env.local --import tsx scripts/check-home-menu.ts
ATLAS_REPORTS_CHECK=1 ATLAS_REPORTS_URL="$DASHBOARD_URL" timeout 180s /usr/bin/node --env-file=.env.local --import tsx scripts/check-reports.ts
ATLAS_TYPOGRAPHY_CHECK=1 ATLAS_TYPOGRAPHY_URL="$DASHBOARD_URL" timeout 180s /usr/bin/node --env-file=.env.local --import tsx scripts/check-typography.ts
ATLAS_MESSAGES_CHECK=1 ATLAS_MESSAGES_URL="$DASHBOARD_URL" timeout 180s /usr/bin/node --env-file=.env.local --import tsx scripts/check-messages.ts
check_revision
