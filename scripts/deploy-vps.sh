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
SOURCE_BRANCH="${ATLAS_RELEASE_BRANCH:-main}"
if [ "$SOURCE_BRANCH" != main ]; then
  [[ "$SOURCE_BRANCH" =~ ^codex/[a-zA-Z0-9._/-]+$ ]] && git check-ref-format "refs/heads/$SOURCE_BRANCH" || { echo "Scoped releases require a valid codex/ branch." >&2; exit 1; }
  [ "$BRANCH" = "$SOURCE_BRANCH" ] || { echo "Check out the scoped release branch before deploying." >&2; exit 1; }
  [ "${ATLAS_RELEASE_COMMIT:-}" = "$COMMIT" ] || { echo "Pin the exact scoped release commit." >&2; exit 1; }
elif [ "$BRANCH" != "main" ]; then
  [ "$BRANCH" = "HEAD" ] && [ "${ATLAS_RELEASE_COMMIT:-}" = "$COMMIT" ] && [ "$(git rev-parse origin/main)" = "$COMMIT" ] || { echo "Deploy from main, or a clean detached release pinned to origin/main." >&2; exit 1; }
fi

echo "==> Pushing $SOURCE_BRANCH"
git push -q origin "HEAD:refs/heads/$SOURCE_BRANCH"

echo "==> Checking SSH key login to $HOST"
"${SSH[@]}" true 2>/dev/null || {
  echo "SSH key login failed. Run once: ssh-copy-id -i ~/.ssh/id_ed25519.pub $HOST" >&2
  exit 1
}

echo "==> Deploying on the VPS"
"${SSH[@]}" bash -s "$DIR" "$COMMIT" "${ATLAS_RELEASE_MODE:-activate}" "$SOURCE_BRANCH" "${ATLAS_RELEASE_ACCEPTANCE:-none}" < scripts/deploy/vps-release.sh
if [ "${ATLAS_RELEASE_MODE:-activate}" = prepare ]; then
  echo "Prepared candidate; live pointer unchanged."
  exit 0
fi

echo "==> Public check"
code=$(curl -s -o /dev/null -w '%{http_code}' --max-time 20 "$URL/login" || true)
echo "$URL/login -> $code"
[ "$code" = "200" ] || echo "Note: if this is 000, your Mac may have a stale DNS cache; the VPS itself reported healthy."
echo "Deployed."
