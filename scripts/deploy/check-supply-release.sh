#!/usr/bin/env bash
# Candidate check on loopback with central backup and isolated Test fixtures.
set -euo pipefail
ROOT="${1:?control checkout}"; SHA="${2:?prepared revision}"
[[ "${ATLAS_SUPPLY_CHECK:-}" = 1 && "$SHA" =~ ^[a-f0-9]{40}$ ]] || exit 1
exec 9>/tmp/atlas-vps-deploy.lock; flock -w 600 9
exec 8>/run/lock/atlas-vps-deploy.lock; flock -w 600 8
CANDIDATE="${ROOT}-releases/$SHA"; [[ "$(cat "$CANDIDATE/.atlas-ready")" = "$SHA" ]]
UNIT=atlas-supply-staging.service; RUN=$(mktemp -d /tmp/atlas-supply-staging-XXXXXX); chmod 700 "$RUN"
[[ ! -e "/run/systemd/system/$UNIT" ]] || exit 1
PRODUCTION=$(readlink -f "${ROOT}-current"); INSTALLED=0
cleanup(){ local result=$?; if [[ "$INSTALLED" = 1 ]]; then sudo systemctl stop "$UNIT"; sudo systemctl reset-failed "$UNIT" 2>/dev/null || true; sudo rm -f "/run/systemd/system/$UNIT"; sudo systemctl daemon-reload; fi; [[ "$(readlink -f "${ROOT}-current")" = "$PRODUCTION" ]] || result=1; echo "Private supply evidence retained: $RUN"; exit "$result"; }
trap cleanup EXIT
cat > "$RUN/unit" <<SERVICE
[Service]
User=administrator
WorkingDirectory=$CANDIDATE
EnvironmentFile=$ROOT/.env.local
EnvironmentFile=-$CANDIDATE/.release.env
ExecStart=/usr/bin/node node_modules/next/dist/bin/next start --hostname 127.0.0.1 --port 3014
KillMode=mixed
SuccessExitStatus=130 143
TimeoutStopSec=30
SERVICE
sudo install -m 644 "$RUN/unit" "/run/systemd/system/$UNIT"; INSTALLED=1; sudo systemctl daemon-reload; sudo systemctl start "$UNIT"
for i in $(seq 1 30); do curl -fsS --max-time 2 http://127.0.0.1:3014/login -o /dev/null 2>/dev/null && break; sleep 1; done
curl -fsS --max-time 3 http://127.0.0.1:3014/api/health/release | node -e 'let b="";process.stdin.on("data",v=>b+=v);process.stdin.on("end",()=>{if(JSON.parse(b).revision!==process.argv[1])process.exit(1)})' "$SHA"
umask 077; set -a; . "$ROOT/.env.local"; . /etc/atlas/guardian.env; set +a
BACKUP="$HOME/backups/atlas-pre-supply-test-$(date +%Y%m%d-%H%M%S)"
pg_dump "${DATABASE_URL%%\?*}" -Fc -f "$BACKUP.dump"
if [[ -n "${ATLAS_SERVICE_FILE_ROOT:-}" && -d "$ATLAS_SERVICE_FILE_ROOT" ]]; then tar -C "$ATLAS_SERVICE_FILE_ROOT" -czf "$BACKUP-service-files.tar.gz" .; fi
(cd "$CANDIDATE"; ATLAS_SUPPLY_URL=http://127.0.0.1:3014 ATLAS_SUPPLY_OUTPUT="$RUN" node --env-file=.env.local --import tsx "${ATLAS_SUPPLY_CHECKER:-scripts/check-manufacturing-supply.ts}") > "$RUN/browser.log" 2>&1
cat "$RUN/browser.log"
