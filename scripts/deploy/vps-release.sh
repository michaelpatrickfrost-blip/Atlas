#!/usr/bin/env bash
# Linux server implementation; invoked from the reviewed local release, never downloaded.
set -euo pipefail
ROOT="${1:?checkout required}"; REV="${2:?pinned revision required}"; MODE="${3:-activate}"
SOURCE_BRANCH="${4:-main}"
ACCEPTANCE="${5:-none}"
[[ "$ACCEPTANCE" = none || "$ACCEPTANCE" = people || "$ACCEPTANCE" = supply ]] || { echo 'Unknown release acceptance workflow.' >&2; exit 1; }
[[ "$SOURCE_BRANCH" = main || "$SOURCE_BRANCH" =~ ^codex/[a-zA-Z0-9._/-]+$ ]] || { echo 'Invalid release source branch.' >&2; exit 1; }
git check-ref-format "refs/heads/$SOURCE_BRANCH"
[[ "$REV" =~ ^[a-f0-9]{40}$ ]] || { echo 'Full pinned revision required.' >&2; exit 1; }
[[ "$MODE" = prepare || "$MODE" = activate ]] || exit 1
cd "$ROOT"
umask 077
# Keep compatibility with existing acceptance callers using /tmp. Guardian's
# PrivateTmp service also takes the global /run/lock lock, which is not namespaced.
exec 9>/tmp/atlas-vps-deploy.lock; flock -w 600 9
exec 8>/run/lock/atlas-vps-deploy.lock; chmod 600 /run/lock/atlas-vps-deploy.lock; flock -w 600 8
for i in $(seq 1 300); do
  pgrep -f '[n]ext build' >/dev/null || break
  sleep 2
done
! pgrep -f '[n]ext build' >/dev/null || { echo 'Existing build still active; running release unchanged.' >&2; exit 1; }
[[ -z "$(git status --porcelain --untracked-files=no)" ]] || { echo 'Server checkout has unfinished tracked changes.' >&2; exit 1; }
git fetch -q origin
[[ "$(git rev-parse "refs/remotes/origin/$SOURCE_BRANCH")" = "$REV" ]] || { echo 'Release branch moved; review its new revision first.' >&2; exit 1; }
git merge-base --is-ancestor HEAD "$REV"
PREVIOUS_REV=$(git rev-parse HEAD)
RELEASES="${ROOT}-releases"; CURRENT="${ROOT}-current"; CANDIDATE="$RELEASES/$REV"
sudo install -d -o administrator -g administrator -m 755 "$RELEASES" "${ROOT}-maintenance-backups"
mkdir -p "$HOME/backups"
set -a; . "$ROOT/.env.local"; set +a
# Preserve the existing absolute private evidence location. A dedicated shared
# directory in the control checkout is persistent; no release copies/moves it.
if [[ -n "${ATLAS_SERVICE_FILE_ROOT:-}" ]]; then
  [[ "$ATLAS_SERVICE_FILE_ROOT" = /* ]] || { echo 'Private storage must use an absolute path.' >&2; exit 1; }
  case "$(realpath "$ATLAS_SERVICE_FILE_ROOT")/" in
    "$RELEASES/"*) echo 'Private storage must be external to releases.' >&2; exit 1;;
    "$ROOT/shared/"*) ;;
    "$ROOT/"*) echo 'Private storage must use the dedicated shared directory or an external path.' >&2; exit 1;;
  esac
fi
BACKUP="$HOME/backups/atlas-pre-deploy-$(date +%Y%m%d-%H%M%S)"
pg_dump "${DATABASE_URL%%\?*}" -Fc -f "$BACKUP.dump"
if [[ -n "${ATLAS_SERVICE_FILE_ROOT:-}" && -d "$ATLAS_SERVICE_FILE_ROOT" ]]; then tar -C "$ATLAS_SERVICE_FILE_ROOT" -czf "$BACKUP-service-files.tar.gz" .; fi
echo "Private database/evidence backup: $BACKUP"

seal() {
  # Never follow shared environment/storage symlinks. Protect running code from a
  # stale in-place deploy; only Next's disposable cache remains runtime writable.
  sudo chown -R -P root:administrator "$1"
  sudo find "$1" -type d -exec chmod 755 {} +
  sudo find "$1" -type f -exec chmod u=rwX,go=rX {} +
  sudo chown -R administrator:administrator "$1/.next/cache"
  sudo chmod -R u+rwX "$1/.next/cache"
}
snapshot_legacy() {
  local snapshot="$RELEASES/bootstrap-$PREVIOUS_REV"
  if [[ ! -f "$snapshot/.atlas-ready" ]]; then
    [[ ! -e "$snapshot" ]] || { echo 'Incomplete legacy snapshot; inspect it before retrying.' >&2; exit 1; }
    mkdir "$snapshot"
    git archive "$PREVIOUS_REV" | tar -x -C "$snapshot"
    ln -s "$ROOT/.env.local" "$snapshot/.env.local"
    rsync -a "$ROOT/node_modules/" "$snapshot/node_modules/"
    rsync -a --exclude=/cache "$ROOT/.next/" "$snapshot/.next/"
    mkdir -p "$snapshot/.next/cache" "$snapshot/src/generated"
    rsync -a "$ROOT/src/generated/prisma/" "$snapshot/src/generated/prisma/"
    printf 'ATLAS_RELEASE_REVISION=%s\n' "$PREVIOUS_REV" > "$snapshot/.release.env"
    printf '%s\n' "$PREVIOUS_REV" > "$snapshot/.atlas-ready"
    seal "$snapshot"
  fi
  printf '%s\n' "$snapshot"
}
if [[ -L "$CURRENT" ]]; then PREVIOUS=$(readlink -f "$CURRENT"); else PREVIOUS=$(snapshot_legacy); fi
[[ -f "$PREVIOUS/.next/BUILD_ID" && -d "$PREVIOUS/node_modules" ]] || exit 1

if [[ ! -f "$CANDIDATE/.atlas-ready" ]]; then
  [[ ! -e "$CANDIDATE" ]] || { echo 'Incomplete candidate retained; inspect it before retrying.' >&2; exit 1; }
  mkdir "$CANDIDATE"
  git archive "$REV" | tar -x -C "$CANDIDATE"
  ln -s "$ROOT/.env.local" "$CANDIDATE/.env.local"
  # Caller reviews additive migration compatibility; there is no schema rollback.
  # Use an independent shell so this failure handler cannot disable stage errexit.
  bash "$CANDIDATE/scripts/deploy/build-release.sh" "$CANDIDATE" "$PREVIOUS" "$BACKUP" "$REV" || { echo "Candidate failed; running release unchanged. Private logs: $BACKUP-*" >&2; exit 1; }
  mkdir -p "$CANDIDATE/.next/cache"
  seal "$CANDIDATE"
fi
[[ "$(cat "$CANDIDATE/.atlas-ready")" = "$REV" ]] || exit 1
[[ -s "$CANDIDATE/.next/BUILD_ID" && -f "$CANDIDATE/.next/server/app-paths-manifest.json" ]] || { echo 'Candidate build outputs are incomplete; running release unchanged.' >&2; exit 1; }
[[ ! -w "$CANDIDATE/.next/server/app-paths-manifest.json" ]] || { echo 'Candidate code is not immutable.' >&2; exit 1; }

PROBE_PID=''; SWITCHED=0; TIMER_WAS_ACTIVE=0
healthy() { curl --max-time 2 -fsS "http://127.0.0.1:$1/login" -o /dev/null 2>/dev/null; }
cleanup() {
  local result=$?
  if [[ -n "$PROBE_PID" ]]; then kill -TERM "$PROBE_PID" 2>/dev/null || true; wait "$PROBE_PID" 2>/dev/null || true; fi
  if [[ "$result" != 0 && "$SWITCHED" = 1 ]]; then
    sudo /usr/bin/node "$CANDIDATE/scripts/deploy/release-files.mjs" link "$PREVIOUS" "$CURRENT"
    sudo systemctl restart atlas
    for i in $(seq 1 30); do healthy 3000 && break; sleep 1; done
    healthy 3000 && echo 'Previous immutable runtime restored; database was not rolled back.' >&2
  fi
  if [[ "$TIMER_WAS_ACTIVE" = 1 ]]; then sudo systemctl start atlas-guardian.timer; fi
  exit "$result"
}
trap cleanup EXIT
feature_acceptance() {
  [[ "$ACCEPTANCE" != none ]] || return 0
  local url="$1" phase="$2" evidence
  evidence=$(mktemp -d "/tmp/atlas-$ACCEPTANCE-$phase-XXXXXX"); chmod 700 "$evidence"
  echo "$ACCEPTANCE $phase acceptance; private evidence: $evidence"
  if [[ "$ACCEPTANCE" = supply ]]; then
    local fixture_backup="$HOME/backups/atlas-pre-supply-$phase-$(date +%Y%m%d-%H%M%S)"
    pg_dump "${DATABASE_URL%%\?*}" -Fc -f "$fixture_backup.dump"
    if [[ -n "${ATLAS_SERVICE_FILE_ROOT:-}" && -d "$ATLAS_SERVICE_FILE_ROOT" ]]; then tar -C "$ATLAS_SERVICE_FILE_ROOT" -czf "$fixture_backup-service-files.tar.gz" .; fi
    echo "Supply $phase fixture backup: $fixture_backup"
  fi
  (
    cd "$CANDIDATE"; set -a; . /etc/atlas/guardian.env; set +a
    if [[ "$ACCEPTANCE" = people ]]; then
      NODE_ENV=production ATLAS_PEOPLE_TEST=1 ATLAS_PEOPLE_TEST_URL="$url" ATLAS_PEOPLE_EVIDENCE="$evidence" node --env-file=.env.local --import tsx scripts/check-people-workspaces.ts
    else
      NODE_ENV=production ATLAS_SUPPLY_CHECK=1 ATLAS_SUPPLY_URL="$url" ATLAS_SUPPLY_OUTPUT="$evidence" node --env-file=.env.local --import tsx scripts/check-manufacturing-supply.ts
    fi
  ) > "$evidence/browser.log" 2>&1 || { cat "$evidence/browser.log"; return 1; }
  cat "$evidence/browser.log"
  if [[ "$ACCEPTANCE" = supply ]]; then
    if [[ "$phase" = candidate ]]; then
      [[ "$(readlink -f "$CURRENT")" = "$PREVIOUS" ]] || return 1
    else
      [[ "$(readlink -f "$CURRENT")" = "$CANDIDATE" ]] || return 1
    fi
    curl --max-time 10 -fsS "$url/api/health/release" | /usr/bin/node -e 'let b="";process.stdin.on("data",v=>b+=v);process.stdin.on("end",()=>{if(JSON.parse(b).revision!==process.argv[1])process.exit(1)})' "$REV"
  fi
}
# Smoke the exact sealed candidate before touching the production pointer/unit.
! ss -ltn | grep -q ':3011 ' || { echo 'Release smoke port 3011 is busy.' >&2; exit 1; }
(
  cd "$CANDIDATE"; set -a; . ./.release.env; set +a
  exec /usr/bin/node node_modules/next/dist/bin/next start --hostname 127.0.0.1 --port 3011
) > "$BACKUP-smoke.log" 2>&1 & PROBE_PID=$!
for i in $(seq 1 30); do healthy 3011 && break; sleep 1; done
healthy 3011
curl --max-time 3 -fsS http://127.0.0.1:3011/api/health/release | /usr/bin/node -e 'let b="";process.stdin.on("data",v=>b+=v);process.stdin.on("end",()=>{if(JSON.parse(b).revision!==process.argv[1])process.exit(1)})' "$REV"
feature_acceptance http://127.0.0.1:3011 candidate
kill -TERM "$PROBE_PID"; wait "$PROBE_PID" || true; PROBE_PID=''
echo "Prepared and smoke-verified immutable release: $CANDIDATE"
echo "Previous immutable runtime: $PREVIOUS"
[[ "$MODE" = activate ]] || exit 0
# Re-scan a prepared candidate: active metadata may have changed since preparation.
(cd "$CANDIDATE" && node --env-file=.env.local --import tsx scripts/studio/check-compatibility.ts)
if systemctl is-active --quiet atlas-guardian.timer; then TIMER_WAS_ACTIVE=1; sudo systemctl stop atlas-guardian.timer; fi
for i in $(seq 1 300); do systemctl is-active --quiet atlas-guardian.service || break; sleep 1; done
! systemctl is-active --quiet atlas-guardian.service || { echo 'Guardian still active; activation deferred.' >&2; exit 1; }

# Preserve all server configuration. Only the known existing upstream is adapted.
sudo cp -a /etc/caddy/Caddyfile "$BACKUP-Caddyfile"
if ! sudo grep -q 'lb_try_duration 5s' /etc/caddy/Caddyfile; then
  sudo python3 - "$BACKUP-Caddyfile" "$BACKUP-Caddyfile.next" <<'PY'
import pathlib, sys
source=pathlib.Path(sys.argv[1]).read_text()
old='reverse_proxy localhost:3000'
if source.count(old)!=1 or old+' {' in source: raise SystemExit('Unknown Caddy upstream; preserve and review configuration')
pathlib.Path(sys.argv[2]).write_text(source.replace(old, old+' {\n        lb_try_duration 5s\n        lb_try_interval 250ms\n    }'))
PY
  sudo caddy validate --config "$BACKUP-Caddyfile.next" --adapter caddyfile > "$BACKUP-caddy.log" 2>&1
  sudo install -m 644 "$BACKUP-Caddyfile.next" /etc/caddy/Caddyfile
  sudo systemctl reload caddy
fi
sudo mkdir -p /etc/systemd/system/atlas.service.d
if [[ -f /etc/systemd/system/atlas.service.d/release.conf ]]; then sudo cp -a /etc/systemd/system/atlas.service.d/release.conf "$BACKUP-release.conf"; fi
KILL_MODE=mixed
# The legacy npm parent can exit before its Next child drains. Signal the entire
# old group on the first transition; subsequent direct-Node releases use mixed.
if systemctl show atlas -p ExecStart --value | grep -q /usr/bin/npm; then KILL_MODE=control-group; fi
cat > "$BACKUP-release.conf.next" <<UNIT
[Service]
WorkingDirectory=$CURRENT
EnvironmentFile=-$CURRENT/.release.env
ExecStart=
ExecStart=/usr/bin/node node_modules/next/dist/bin/next start --hostname 127.0.0.1 --port 3000
KillSignal=SIGTERM
KillMode=$KILL_MODE
SuccessExitStatus=130 143
TimeoutStopSec=30
UNIT
sudo /usr/bin/node "$CANDIDATE/scripts/deploy/release-files.mjs" link "$PREVIOUS" "$CURRENT"
sudo install -m 644 "$BACKUP-release.conf.next" /etc/systemd/system/atlas.service.d/release.conf
sudo mkdir -p /etc/systemd/system/atlas-guardian.service.d
if [[ -f /etc/systemd/system/atlas-guardian.service.d/release.conf ]]; then sudo cp -a /etc/systemd/system/atlas-guardian.service.d/release.conf "$BACKUP-guardian-release.conf"; fi
cat > "$BACKUP-guardian-release.conf.next" <<UNIT
[Service]
ExecStart=
ExecStart=/usr/bin/flock --shared --nonblock --conflict-exit-code 75 /run/lock/atlas-vps-deploy.lock /usr/bin/node --env-file=.env.local --import tsx scripts/guardian/worker.ts
SuccessExitStatus=75
UNIT
sudo install -m 644 "$BACKUP-guardian-release.conf.next" /etc/systemd/system/atlas-guardian.service.d/release.conf
sudo systemctl daemon-reload
SWITCHED=1
sudo /usr/bin/node "$CANDIDATE/scripts/deploy/release-files.mjs" link "$CANDIDATE" "$CURRENT"
sudo systemctl restart atlas
for i in $(seq 1 30); do healthy 3000 && break; sleep 1; done
healthy 3000
curl --max-time 3 -fsS http://127.0.0.1:3000/api/health/release | /usr/bin/node -e 'let b="";process.stdin.on("data",v=>b+=v);process.stdin.on("end",()=>{if(JSON.parse(b).revision!==process.argv[1])process.exit(1)})' "$REV"
curl --max-time 20 -fsS https://atlassystem.online/login -o /dev/null
feature_acceptance https://atlassystem.online public
if [[ "$KILL_MODE" = control-group ]]; then
  sed -i 's/^KillMode=control-group$/KillMode=mixed/' "$BACKUP-release.conf.next"
  sudo install -m 644 "$BACKUP-release.conf.next" /etc/systemd/system/atlas.service.d/release.conf
  sudo systemctl daemon-reload
fi

# The control checkout remains the shared operator/Guardian entrypoint. Dependencies,
# build and generated client point to the active immutable runtime. Preserve old dirs.
git merge --ff-only "$REV"
MAINTENANCE="${ROOT}-maintenance-backups/$(date +%Y%m%d-%H%M%S)"; mkdir -p "$MAINTENANCE"
for relative in node_modules .next src/generated/prisma; do
  link="$ROOT/$relative"
  if [[ -e "$link" && ! -L "$link" ]]; then mv "$link" "$MAINTENANCE/$(basename "$relative")"; fi
  node "$CANDIDATE/scripts/deploy/release-files.mjs" link "$CURRENT/$relative" "$link"
done
sudo /usr/bin/node "$CANDIDATE/scripts/deploy/release-files.mjs" link "$PREVIOUS" "${ROOT}-previous"
SWITCHED=0
echo "Activated immutable runtime $REV; previous release retained at $PREVIOUS"
