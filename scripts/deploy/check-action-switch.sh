#!/usr/bin/env bash
# Actual loopback runtime switch with explicitly authorised disposable Test writes.
set -euo pipefail
ROOT="${1:?checkout required}"; FIRST="${2:?initial prepared revision}"; SECOND="${3:?other prepared revision}"
[[ "${ATLAS_GUARDIAN_ACTION_TEST:-}" = 1 && "$FIRST" =~ ^[a-f0-9]{40}$ && "$SECOND" =~ ^[a-f0-9]{40}$ && "$FIRST" != "$SECOND" ]] || exit 1
exec 9>/tmp/atlas-vps-deploy.lock; flock -w 600 9
exec 8>/run/lock/atlas-vps-deploy.lock; flock -w 600 8
INITIAL="${ROOT}-releases/$FIRST"; OTHER="${ROOT}-releases/$SECOND"
[[ "$(cat "$INITIAL/.atlas-ready")" = "$FIRST" && "$(cat "$OTHER/.atlas-ready")" = "$SECOND" ]]
UNIT=/run/systemd/system/atlas-release-staging.service
[[ ! -e "$UNIT" ]] || { echo 'Staging unit exists; inspect it.' >&2; exit 1; }
! ss -ltn | grep -Eq ':301[01] ' || { echo 'Staging ports busy.' >&2; exit 1; }
RUN=$(mktemp -d /tmp/atlas-action-switch-XXXXXX); chmod 700 "$RUN"
PRODUCTION=$(readlink -f "${ROOT}-current"); CADDY_PID=''; WATCH_PID=''; INSTALLED=0
cleanup() {
  local result=$?
  if [[ -n "$WATCH_PID" ]]; then kill -TERM "$WATCH_PID" 2>/dev/null || true; wait "$WATCH_PID" 2>/dev/null || true; fi
  if [[ -n "$CADDY_PID" ]]; then kill -TERM "$CADDY_PID" 2>/dev/null || true; wait "$CADDY_PID" 2>/dev/null || true; fi
  if [[ "$INSTALLED" = 1 ]]; then sudo systemctl stop atlas-release-staging; sudo systemctl reset-failed atlas-release-staging 2>/dev/null || true; sudo rm -f "$UNIT"; sudo systemctl daemon-reload; fi
  [[ "$(readlink -f "${ROOT}-current")" = "$PRODUCTION" ]] || result=1
  echo "Private action staging logs retained: $RUN"
  exit "$result"
}
trap cleanup EXIT
node "$INITIAL/scripts/deploy/release-files.mjs" link "$INITIAL" "$RUN/current"
cat > "$RUN/unit" <<SERVICE
[Unit]
Description=Disposable Atlas action recovery staging
[Service]
User=administrator
WorkingDirectory=$RUN/current
EnvironmentFile=$ROOT/.env.local
EnvironmentFile=-$RUN/current/.release.env
ExecStart=/usr/bin/node node_modules/next/dist/bin/next start --hostname 127.0.0.1 --port 3011
KillMode=mixed
SuccessExitStatus=130 143
TimeoutStopSec=30
SERVICE
sudo install -m 644 "$RUN/unit" "$UNIT"; INSTALLED=1; sudo systemctl daemon-reload
cat > "$RUN/Caddyfile" <<'CADDY'
{
  admin off
}
http://127.0.0.1:3010 {
  reverse_proxy 127.0.0.1:3011 {
    lb_try_duration 5s
    lb_try_interval 250ms
  }
}
CADDY
caddy validate --config "$RUN/Caddyfile" --adapter caddyfile > "$RUN/caddy-validate.log" 2>&1
XDG_CONFIG_HOME="$RUN/config" XDG_DATA_HOME="$RUN/data" caddy run --config "$RUN/Caddyfile" --adapter caddyfile > "$RUN/caddy.log" 2>&1 & CADDY_PID=$!
start() {
  sudo systemctl restart atlas-release-staging
  for i in $(seq 1 30); do curl -fsS --max-time 2 http://127.0.0.1:3011/login -o /dev/null 2>/dev/null && break; sleep 1; done
  [[ "$(readlink -f "/proc/$(systemctl show atlas-release-staging -p MainPID --value)/cwd")" = "$1" ]]
  curl -fsS --max-time 3 http://127.0.0.1:3011/api/health/release | node -e 'let b="";process.stdin.on("data",v=>b+=v);process.stdin.on("end",()=>{if(JSON.parse(b).revision!==process.argv[1])process.exit(1)})' "$2"
}
start "$INITIAL" "$FIRST"
# Before fixture writes, retain a private central backup. Do not print env values.
umask 077; set -a; . "$ROOT/.env.local"; . /etc/atlas/guardian.env; set +a
BACKUP="$HOME/backups/atlas-pre-action-test-$(date +%Y%m%d-%H%M%S)"
pg_dump "${DATABASE_URL%%\?*}" -Fc -f "$BACKUP.dump"
if [[ -n "${ATLAS_SERVICE_FILE_ROOT:-}" && -d "$ATLAS_SERVICE_FILE_ROOT" ]]; then tar -C "$ATLAS_SERVICE_FILE_ROOT" -czf "$BACKUP-service-files.tar.gz" .; fi
echo "Private fixture backup: $BACKUP"
CHECKER="${ATLAS_ACTION_CHECKER:-$INITIAL/scripts/guardian/check-action-recovery.ts}"
(cd "$ROOT"; ATLAS_ACTION_TEST_URL=http://127.0.0.1:3010 ATLAS_ACTION_TEST_READY="$RUN/ready" ATLAS_ACTION_TEST_SWITCHED="$RUN/switched" ATLAS_ACTION_TEST_FAILED="$RUN/failed" ATLAS_ACTION_TEST_RESTORED="$RUN/restored" node --env-file=.env.local --import tsx "$CHECKER" "${ATLAS_ACTION_TEST_MODE:-}") > "$RUN/browser.log" 2>&1 & WATCH_PID=$!
signal() {
  for i in $(seq 1 120); do
    [[ ! -f "$RUN/$1" ]] || return 0
    kill -0 "$WATCH_PID" 2>/dev/null || { cat "$RUN/browser.log"; return 1; }
    sleep 1
  done
  return 1
}
signal ready
node "$INITIAL/scripts/deploy/release-files.mjs" link "$OTHER" "$RUN/current"; start "$OTHER" "$SECOND"; touch "$RUN/switched"
signal failed
node "$INITIAL/scripts/deploy/release-files.mjs" link "$INITIAL" "$RUN/current"; start "$INITIAL" "$FIRST"; touch "$RUN/restored"
wait "$WATCH_PID"; WATCH_PID=''; cat "$RUN/browser.log"
[[ ! -w "$INITIAL/.next/server/app-paths-manifest.json" && ! -w "$OTHER/.next/server/app-paths-manifest.json" ]]
echo 'PASS actual isolated action switch and restoration; sealed releases and production pointer unchanged.'
