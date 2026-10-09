#!/usr/bin/env bash
# Explicit central Test fixture acceptance of a sealed commercial candidate.
set -euo pipefail
ROOT="${1:?control checkout required}"; REVISION="${2:?prepared revision required}"
[[ "${ATLAS_COMMERCIAL_CHECK:-}" = 1 && "$REVISION" =~ ^[a-f0-9]{40}$ ]] || exit 1
exec 9>/tmp/atlas-vps-deploy.lock; flock -w 600 9
exec 8>/run/lock/atlas-vps-deploy.lock; flock -w 600 8
RELEASE="${ROOT}-releases/$REVISION"
[[ "$(cat "$RELEASE/.atlas-ready")" = "$REVISION" ]]
UNIT=/run/systemd/system/atlas-commercial-staging.service
[[ ! -e "$UNIT" ]] || { echo 'Commercial staging unit exists; inspect it.' >&2; exit 1; }
! ss -ltn | grep -Eq ':3011 ' || { echo 'Staging port busy.' >&2; exit 1; }
RUN=$(mktemp -d /tmp/atlas-commercial-staging-XXXXXX); chmod 700 "$RUN"
PRODUCTION=$(readlink -f "${ROOT}-current"); INSTALLED=0
cleanup() {
 local result=$?
 if [[ "$INSTALLED" = 1 ]]; then sudo systemctl stop atlas-commercial-staging; sudo systemctl reset-failed atlas-commercial-staging 2>/dev/null || true; sudo rm -f "$UNIT"; sudo systemctl daemon-reload; fi
 [[ "$(readlink -f "${ROOT}-current")" = "$PRODUCTION" ]] || result=1
 echo "Private commercial staging logs retained: $RUN"
 exit "$result"
}
trap cleanup EXIT
cat > "$RUN/unit" <<SERVICE
[Unit]
Description=Disposable Atlas commercial acceptance staging
[Service]
User=administrator
WorkingDirectory=$RELEASE
EnvironmentFile=$ROOT/.env.local
EnvironmentFile=-$RELEASE/.release.env
ExecStart=/usr/bin/node node_modules/next/dist/bin/next start --hostname 127.0.0.1 --port 3011
KillMode=mixed
SuccessExitStatus=130 143
TimeoutStopSec=30
SERVICE
sudo install -m 644 "$RUN/unit" "$UNIT"; INSTALLED=1; sudo systemctl daemon-reload; sudo systemctl start atlas-commercial-staging
for i in $(seq 1 30); do curl -fsS --max-time 2 http://127.0.0.1:3011/login -o /dev/null 2>/dev/null && break; sleep 1; done
[[ "$(readlink -f "/proc/$(systemctl show atlas-commercial-staging -p MainPID --value)/cwd")" = "$RELEASE" ]]
umask 077; set -a; . "$ROOT/.env.local"; set +a
BACKUP="$HOME/backups/atlas-pre-commercial-test-$(date +%Y%m%d-%H%M%S)"
pg_dump "${DATABASE_URL%%\?*}" -Fc -f "$BACKUP.dump"
if [[ -n "${ATLAS_SERVICE_FILE_ROOT:-}" && -d "$ATLAS_SERVICE_FILE_ROOT" ]]; then tar -C "$ATLAS_SERVICE_FILE_ROOT" -czf "$BACKUP-service-files.tar.gz" .; fi
echo "Private fixture backup: $BACKUP"
CHECKER="${ATLAS_COMMERCIAL_CHECKER:-$RELEASE/scripts/check-commercial-workspaces.ts}"
(cd "$RELEASE"; ATLAS_COMMERCIAL_URL=http://127.0.0.1:3011 ATLAS_TEST_REVISION="$REVISION" node --env-file=.env.local --import tsx "$CHECKER") > "$RUN/browser.log" 2>&1 || { cat "$RUN/browser.log"; exit 1; }
cat "$RUN/browser.log"
[[ ! -w "$RELEASE/.next/server/app-paths-manifest.json" ]]
echo 'PASS commercial candidate acceptance; sealed runtime and production pointer unchanged.'
