#!/bin/bash
# Build and install the desktop app, then relaunch it. Usage: scripts/deploy-mac-client.sh <short-name>
# build-mac-client.sh owns the release lock, the schema check and signing (in /tmp, because this folder is
# under iCloud Desktop sync, which keeps re-adding com.apple.FinderInfo). We publish into ~/Applications,
# which is not synced, then swap it in place of the app the Desktop link opens.
set -euo pipefail
cd "$(dirname "$0")/.."
name="${1:-release}"
stamp="$(date +%Y%m%d-%H%M%S)"
installed="$HOME/Applications/Atlas.app"
incoming="$HOME/Applications/Atlas-incoming.app"

rm -rf "$incoming" "$incoming".previous.*
until bash scripts/build-mac-client.sh "$incoming"; do
  if [ -d build/.desktop-release-lock ]; then echo "another desktop release is running; retrying in 20s"; sleep 20; else echo "build failed"; exit 1; fi
done
codesign --verify --deep --strict "$incoming"

osascript -e 'tell application "Atlas" to quit' >/dev/null 2>&1 || true
for _ in 1 2 3 4 5 6 7 8 9 10; do pgrep -f "Applications/Atlas.app/Contents/MacOS/Atlas" >/dev/null || break; sleep 1; done
pkill -f "Applications/Atlas.app/Contents/MacOS/Atlas" 2>/dev/null || true
pkill -f "Atlas.app/Contents/Resources/runtime" 2>/dev/null || true

if [ -d "$installed" ]; then
  backup="$HOME/Applications/Atlas-before-$name-$stamp.app"
  mv "$installed" "$backup"
fi
mv "$incoming" "$installed"
rm -rf "$incoming".previous.*
codesign --verify --deep --strict "$installed"
open "$installed"
for _ in $(seq 1 20); do
  code="$(curl -s -o /dev/null -w '%{http_code}' http://127.0.0.1:13200/login || true)"
  [ "$code" = "200" ] && break
  sleep 1
done
pgrep -fl "Applications/Atlas.app/Contents/MacOS/Atlas" || { echo "Atlas did not start"; exit 1; }
echo "workspace /login: ${code:-none}"
echo "Deployed $installed (previous build kept as Atlas-before-$name-$stamp.app)"
