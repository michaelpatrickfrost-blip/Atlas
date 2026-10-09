#!/usr/bin/env bash
# Invoked by the pinned deployer with both locks already held.
set -euo pipefail
SETTINGS_URL="${1:?url}"; SETTINGS_PHASE="${2:?phase}"; SETTINGS_REV="${3:?revision}"; SETTINGS_EVIDENCE="${4:?evidence}"
[[ "$(uname -s)" = Linux && "$SETTINGS_REV" =~ ^[a-f0-9]{40}$ ]]
[[ "$SETTINGS_PHASE" = candidate || "$SETTINGS_PHASE" = public ]]
[[ "$SETTINGS_URL" = http://127.0.0.1:3011 || "$SETTINGS_URL" = https://atlassystem.online ]]
cd "$(dirname "$0")/../.."
set -a
. .env.local
. /etc/atlas/guardian.env
set +a
export NODE_ENV=production PLAYWRIGHT_BROWSERS_PATH=/home/administrator/.cache/ms-playwright
check_revision(){
 curl --max-time 20 -fsS "$SETTINGS_URL/api/health/release" | /usr/bin/node -e 'let b="";process.stdin.on("data",v=>b+=v);process.stdin.on("end",()=>{if(JSON.parse(b).revision!==process.argv[1])process.exit(1)})' "$SETTINGS_REV"
 echo "PASS $SETTINGS_PHASE release revision $SETTINGS_REV"
}
check_revision
ATLAS_SETTINGS_CHECK=1 ATLAS_SETTINGS_URL="$SETTINGS_URL" ATLAS_SETTINGS_EVIDENCE="$SETTINGS_EVIDENCE" timeout 240s /usr/bin/node --env-file=.env.local --import tsx scripts/check-company-settings.ts
ATLAS_HOME_MENU_CHECK=1 ATLAS_HOME_MENU_URL="$SETTINGS_URL" timeout 180s /usr/bin/node --env-file=.env.local --import tsx scripts/check-home-menu.ts
check_revision
