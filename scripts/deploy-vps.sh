#!/usr/bin/env bash
# One-command deploy of Atlas to the VPS (https://atlassystem.online).
# Auth is SSH key only (no password in this repo). One-time setup on a new Mac:
#   ssh-copy-id -i ~/.ssh/id_ed25519.pub administrator@85.190.118.218
set -euo pipefail

HOST="${ATLAS_VPS_HOST:-administrator@85.190.118.218}"
DIR="${ATLAS_VPS_DIR:-/opt/atlas}"
URL="${ATLAS_VPS_URL:-https://atlassystem.online}"
SSH=(ssh -o BatchMode=yes -o ConnectTimeout=15 "$HOST")

cd "$(dirname "$0")/.."

if [ -n "$(git status --porcelain --untracked-files=no)" ]; then
  echo "Uncommitted changes. Commit first; the VPS deploys what is on GitHub." >&2
  exit 1
fi

BRANCH="$(git rev-parse --abbrev-ref HEAD)"
COMMIT=$(git rev-parse HEAD)
if [ "$BRANCH" != "main" ]; then
  [ "$BRANCH" = "HEAD" ] && [ "${ATLAS_RELEASE_COMMIT:-}" = "$COMMIT" ] && [ "$(git rev-parse origin/main)" = "$COMMIT" ] || { echo "Deploy from main, or a clean detached release pinned to origin/main." >&2; exit 1; }
fi

echo "==> Pushing main"
git push -q origin HEAD:main

echo "==> Checking SSH key login to $HOST"
"${SSH[@]}" true 2>/dev/null || {
  echo "SSH key login failed. Run once: ssh-copy-id -i ~/.ssh/id_ed25519.pub $HOST" >&2
  exit 1
}

echo "==> Deploying on the VPS"
"${SSH[@]}" bash -s "$DIR" "$COMMIT" <<'REMOTE'
set -euo pipefail
cd "$1"
umask 077
exec 9>/tmp/atlas-vps-deploy.lock
flock -w 600 9 || { echo "Another Atlas deployment still owns the release lock." >&2; exit 1; }
for i in $(seq 1 300); do
  pgrep -f '[n]ext build' >/dev/null || break
  [ "$i" != "1" ] || echo "Waiting for the existing Next build before changing the checkout."
  sleep 2
done
if pgrep -f '[n]ext build' >/dev/null; then
  echo "Existing Next build did not finish; checkout left unchanged." >&2
  exit 1
fi
set -a; . ./.env.local; set +a
DB="${DATABASE_URL%%\?*}"

mkdir -p ~/backups
B=~/backups/atlas-pre-deploy-$(date +%Y%m%d-%H%M%S).dump
pg_dump "$DB" -Fc -f "$B"
chmod 600 "$B"
echo "backup: $B"
if [ -n "${ATLAS_SERVICE_FILE_ROOT:-}" ] && [ -d "$ATLAS_SERVICE_FILE_ROOT" ]; then
  F="${B%.dump}-service-files.tar.gz"
  tar -C "$ATLAS_SERVICE_FILE_ROOT" -czf "$F" .
  chmod 600 "$F"
  echo "private evidence backup: $F"
fi
# Preserve existing deployment backups; retention is an explicit operational task.

PREV=$(git rev-parse --short HEAD)
git pull -q --ff-only
[ "$(git rev-parse HEAD)" = "$2" ] || { echo "Remote main changed during deployment; review the new commit before continuing." >&2; exit 1; }
echo "commit: $PREV -> $(git rev-parse --short HEAD)"

npm ci --no-audit --no-fund >/dev/null
npx prisma generate --config prisma7.config.ts >/dev/null
npx prisma migrate deploy --config prisma7.config.ts 2>&1 | tail -5
NODE_OPTIONS=--max-old-space-size=6144 npm run build >/tmp/atlas-build.log 2>&1 || { tail -30 /tmp/atlas-build.log; echo "BUILD FAILED; running service left on the previous process" >&2; exit 1; }

sudo systemctl restart atlas
for i in $(seq 1 20); do
  code=$(curl -s -o /dev/null -w '%{http_code}' http://localhost:3000/login || true)
  [ "$code" = "200" ] && break
  sleep 2
done
[ "$code" = "200" ] || { journalctl -u atlas -n 30 --no-pager; echo "Atlas did not come back (http $code)" >&2; exit 1; }
echo "service healthy"
REMOTE

echo "==> Public check"
code=$(curl -s -o /dev/null -w '%{http_code}' --max-time 20 "$URL/login" || true)
echo "$URL/login -> $code"
[ "$code" = "200" ] || echo "Note: if this is 000, your Mac may have a stale DNS cache; the VPS itself reported healthy."
echo "Deployed."
