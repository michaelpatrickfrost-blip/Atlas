#!/usr/bin/env bash
# Loopback-only staging: actual immutable runtime switch AND rollback, no business writes.
set -euo pipefail
ROOT="${1:?checkout required}"; REV="${2:?prepared revision required}"
[[ "${ATLAS_GUARDIAN_RELEASE_TEST:-}" = 1 && "$REV" =~ ^[a-f0-9]{40}$ ]] || exit 1
exec 9>/tmp/atlas-vps-deploy.lock; flock -w 600 9
exec 8>/run/lock/atlas-vps-deploy.lock; flock -w 600 8
NEW="${ROOT}-releases/$REV"; OLD="$(readlink -f "${ROOT}-current" 2>/dev/null || true)"
if [[ ! -f "$OLD/.next/BUILD_ID" ]]; then OLD="${ROOT}-releases/bootstrap-$(git -C "$ROOT" rev-parse HEAD)"; fi
[[ -f "$OLD/.next/BUILD_ID" && "$(cat "$NEW/.atlas-ready")" = "$REV" ]]
UNIT=/run/systemd/system/atlas-release-staging.service
[[ ! -e "$UNIT" ]] || { echo 'Staging unit already exists; inspect it.' >&2; exit 1; }
! ss -ltn | grep -Eq ':301[01] ' || { echo 'Staging port busy.' >&2; exit 1; }
RUN=$(mktemp -d /tmp/atlas-release-switch-XXXXXX); chmod 700 "$RUN"
POINTER="$RUN/current"; CADDY_PID=''; WATCH_PID=''; INSTALLED=0
cleanup() {
  local result=$?
  touch "$RUN/stop"
  if [[ -n "$WATCH_PID" ]]; then wait "$WATCH_PID" || result=1; fi
  if [[ -n "$CADDY_PID" ]]; then kill -TERM "$CADDY_PID" 2>/dev/null || true; wait "$CADDY_PID" 2>/dev/null || true; fi
  if [[ "$INSTALLED" = 1 ]]; then sudo systemctl stop atlas-release-staging; sudo systemctl reset-failed atlas-release-staging 2>/dev/null || true; sudo rm -f "$UNIT"; sudo systemctl daemon-reload; fi
  echo "Private staging logs retained: $RUN"
  exit "$result"
}
trap cleanup EXIT
node "$NEW/scripts/deploy/release-files.mjs" link "$OLD" "$POINTER"
write_unit() {
cat > "$RUN/unit" <<SERVICE
[Unit]
Description=Disposable Atlas immutable release staging
[Service]
User=administrator
WorkingDirectory=$POINTER
EnvironmentFile=$ROOT/.env.local
EnvironmentFile=-$POINTER/.release.env
ExecStart=$1
KillMode=$2
SuccessExitStatus=130 143
TimeoutStopSec=30
SERVICE
sudo install -m 644 "$RUN/unit" "$UNIT"; INSTALLED=1; sudo systemctl daemon-reload
}
# Exercise the first legacy npm-parent transition as well as direct Node rollback.
write_unit '/usr/bin/npm run start -- --hostname 127.0.0.1 --port 3011' mixed
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
healthy() { curl -fsS --max-time 2 http://127.0.0.1:3011/login -o /dev/null 2>/dev/null; }
start() {
  sudo systemctl restart atlas-release-staging
  for i in $(seq 1 30); do healthy && break; sleep 1; done
  healthy
  [[ "$(readlink -f "/proc/$(systemctl show atlas-release-staging -p MainPID --value)/cwd")" = "$1" ]]
}
start "$OLD"
set -a; . /etc/atlas/guardian.env; set +a
(cd "$NEW"; ATLAS_RELEASE_TEST_URL=http://127.0.0.1:3010 ATLAS_RELEASE_TEST_READY="$RUN/ready" ATLAS_RELEASE_TEST_STOP="$RUN/stop" node --env-file=.env.local --import tsx scripts/guardian/check-release-pages.ts) > "$RUN/browser.log" 2>&1 & WATCH_PID=$!
advance() {
  local before=0
  [[ ! -f "$RUN/ready" ]] || before=$(cat "$RUN/ready")
  for i in $(seq 1 90); do
    kill -0 "$WATCH_PID" 2>/dev/null || { cat "$RUN/browser.log"; return 1; }
    if [[ -f "$RUN/ready" && "$(cat "$RUN/ready")" -gt "$before" ]]; then return 0; fi
    sleep 1
  done
  return 1
}
advance
node "$NEW/scripts/deploy/release-files.mjs" link "$NEW" "$POINTER"
write_unit '/usr/bin/node node_modules/next/dist/bin/next start --hostname 127.0.0.1 --port 3011' control-group
start "$NEW"
if ! (cd "$NEW"; ATLAS_RELEASE_TEST_URL=http://127.0.0.1:3010 ATLAS_GUARDIAN_RELEASE_TEST=1 node --env-file=.env.local --import tsx scripts/guardian/check-app-launcher.ts) > "$RUN/staff-launcher.log" 2>&1; then
  cat "$RUN/staff-launcher.log"
  exit 1
fi
write_unit '/usr/bin/node node_modules/next/dist/bin/next start --hostname 127.0.0.1 --port 3011' mixed
curl -fsS http://127.0.0.1:3011/api/health/release | node -e 'let b="";process.stdin.on("data",v=>b+=v);process.stdin.on("end",()=>{if(JSON.parse(b).revision!==process.argv[1])process.exit(1)})' "$REV"
advance
node "$NEW/scripts/deploy/release-files.mjs" link "$OLD" "$POINTER"; start "$OLD"
advance
touch "$RUN/stop"; wait "$WATCH_PID"; WATCH_PID=''; cat "$RUN/browser.log"
[[ ! -w "$NEW/.next/server/app-paths-manifest.json" && ! -w "$OLD/.next/server/app-paths-manifest.json" ]]
echo 'PASS real loopback legacy npm transition, candidate activation and direct-Node rollback; both releases immutable, production pointer unchanged.'
