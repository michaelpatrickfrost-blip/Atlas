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
[ "$BRANCH" = "main" ] || { echo "Deploy from main (currently on $BRANCH)." >&2; exit 1; }

echo "==> Pushing main"
git push -q origin main

echo "==> Checking SSH key login to $HOST"
"${SSH[@]}" true 2>/dev/null || {
  echo "SSH key login failed. Run once: ssh-copy-id -i ~/.ssh/id_ed25519.pub $HOST" >&2
  exit 1
}

echo "==> Deploying on the VPS"
"${SSH[@]}" bash -s "$DIR" <<'REMOTE'
set -euo pipefail
cd "$1"
set -a; . ./.env.local; set +a
DB="${DATABASE_URL%%\?*}"

mkdir -p ~/backups
B=~/backups/atlas-pre-deploy-$(date +%Y%m%d-%H%M%S).dump
pg_dump "$DB" -Fc -f "$B"
echo "backup: $B"
ls -1t ~/backups/atlas-pre-deploy-*.dump | tail -n +11 | xargs -r rm -f

PREV=$(git rev-parse --short HEAD)
git pull -q --ff-only
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
