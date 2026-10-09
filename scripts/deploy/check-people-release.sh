#!/usr/bin/env bash
# Backed-up central Test acceptance of a sealed candidate or its exact public runtime.
set -euo pipefail
ROOT="${1:?control checkout}"; SHA="${2:?prepared revision}"; MODE="${3:-candidate}"
[[ "${ATLAS_PEOPLE_TEST:-}" = 1 && "$SHA" =~ ^[a-f0-9]{40}$ && "$MODE" =~ ^(candidate|public)$ ]] || exit 1
exec 9>/tmp/atlas-vps-deploy.lock; flock -w 600 9
exec 8>/run/lock/atlas-vps-deploy.lock; flock -w 600 8
CANDIDATE="${ROOT}-releases/$SHA"; [[ "$(cat "$CANDIDATE/.atlas-ready")" = "$SHA" ]]
PRODUCTION=$(readlink -f "${ROOT}-current"); RUN=$(mktemp -d "/tmp/atlas-people-$MODE-XXXXXX"); chmod 700 "$RUN"
PID=''
cleanup(){ local result=$?; if [[ -n "$PID" ]]; then kill -TERM "$PID" 2>/dev/null || true; wait "$PID" 2>/dev/null || true; fi; [[ "$(readlink -f "${ROOT}-current")" = "$PRODUCTION" ]] || result=1; echo "Private People evidence retained: $RUN"; exit "$result"; }
trap cleanup EXIT
umask 077; set -a; . "$ROOT/.env.local"; . /etc/atlas/guardian.env; . "$CANDIDATE/.release.env"; set +a
BACKUP="$HOME/backups/atlas-pre-people-test-$(date +%Y%m%d-%H%M%S)"
pg_dump "${DATABASE_URL%%\?*}" -Fc -f "$BACKUP.dump"
echo "Central acceptance backup: $(basename "$BACKUP")"
if [[ "$MODE" = candidate ]]; then
  ! ss -ltn | grep -Eq ':3015 ' || { echo 'People candidate port busy.' >&2; exit 1; }
  (cd "$CANDIDATE"; NODE_ENV=production ATLAS_PRIVATE_TUNNEL=1 node node_modules/next/dist/bin/next start --hostname 127.0.0.1 --port 3015) > "$RUN/server.log" 2>&1 & PID=$!
  for i in $(seq 1 30); do curl -fsS --max-time 2 http://127.0.0.1:3015/login -o /dev/null 2>/dev/null && break; sleep 1; done
  URL=http://127.0.0.1:3015
else
  [[ "$PRODUCTION" = "$CANDIDATE" ]] || { echo 'Public runtime must match accepted source.' >&2; exit 1; }
  URL=https://atlassystem.online
fi
curl -fsS --max-time 5 "$URL/api/health/release" | node -e 'let b="";process.stdin.on("data",v=>b+=v);process.stdin.on("end",()=>{if(JSON.parse(b).revision!==process.argv[1])process.exit(1)})' "$SHA"
(cd "$CANDIDATE"; NODE_ENV=production ATLAS_PEOPLE_TEST_URL="$URL" ATLAS_PEOPLE_EVIDENCE="$RUN" node --env-file=.env.local --import tsx scripts/check-people-workspaces.ts) > "$RUN/browser.log" 2>&1 || { cat "$RUN/browser.log"; exit 1; }
cat "$RUN/browser.log"
