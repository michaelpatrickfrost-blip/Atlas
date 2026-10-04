#!/bin/bash
set -euo pipefail
cd "$(dirname "$0")/.."
source_bundle="${1:?Usage: install-mac-client.sh /path/to/Atlas.app}"
node scripts/check-release-schema.mjs
lock="build/.desktop-install-lock"
if ! mkdir "$lock" 2>/dev/null; then echo 'Another desktop release is still running.' >&2; exit 1; fi
stage="$(mktemp -d /Users/michael/Applications/.atlas-install.XXXXXX)"
trap 'rm -rf "$stage"; rmdir "$lock"' EXIT
cp -cR "$source_bundle" "$stage/Atlas.app"
[ -x "$stage/Atlas.app/Contents/Resources/runtime/node" ]
[ -f "$stage/Atlas.app/Contents/Resources/runtime/build/desktop-source/server.js" ]
[ -f "$stage/Atlas.app/Contents/Resources/runtime/build/desktop-source/.next/BUILD_ID" ]
xattr -cr "$stage/Atlas.app"
if ! codesign --verify --strict "$stage/Atlas.app"; then
 codesign --force --sign - "$stage/Atlas.app"
 codesign --verify --strict "$stage/Atlas.app"
fi
"$stage/Atlas.app/Contents/Resources/runtime/node" -v
# Never delete an app while its package is being copied or while a user is editing.
if pgrep -f '^/Users/michael/Applications/Atlas.app/Contents/MacOS/Atlas' >/dev/null; then
 echo 'Atlas is running. Preserve unsaved work and quit it before installation.' >&2; exit 1
fi
installed=/Users/michael/Applications/Atlas.app
previous="/Users/michael/Applications/Atlas-before-release-$(date +%Y%m%d-%H%M%S).app"
[ ! -e "$installed" ] || mv "$installed" "$previous"
if ! mv "$stage/Atlas.app" "$installed"; then
 [ ! -e "$previous" ] || mv "$previous" "$installed"
 exit 1
fi
codesign --verify --strict "$installed"
echo "Installed verified package; previous app preserved at $previous"
