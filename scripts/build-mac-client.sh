#!/bin/bash
set -euo pipefail
cd "$(dirname "$0")/.."
output="${1:-build/Atlas.app}"
# All standard builds share staging paths: reject simultaneous builders.
lock="build/.desktop-release-lock"
mkdir -p build
if ! mkdir "$lock" 2>/dev/null; then
  echo "Another desktop release owns $lock. Wait for it to finish." >&2
  exit 1
fi
release_stage="$(mktemp -d /tmp/atlas-package.XXXXXX)"
trap 'rm -rf "$release_stage"; rmdir "$lock"' EXIT
node scripts/check-release-schema.mjs
requested_output="$output"
output="$release_stage/Atlas.app"
if [ "${ATLAS_REUSE_DESKTOP_BUILD:-0}" != "1" ]; then
  node scripts/build-desktop-runtime.mjs
fi
[ -f build/desktop-runtime/build/desktop-source/server.js ]
mkdir -p "$output/Contents/MacOS" "$output/Contents/Resources"
xcrun swiftc desktop/macos/Atlas.swift -o "$output/Contents/MacOS/Atlas" -framework AppKit -framework WebKit -O
rm -rf "$output/Contents/Resources/runtime"
cp -R build/desktop-runtime "$output/Contents/Resources/runtime"
iconset="build/Atlas.iconset"
mkdir -p "$iconset"
xcrun swift desktop/macos/MakeIcon.swift "$iconset"
for size in 16 32 128 256 512; do
  cp "$iconset/size_${size}.png" "$iconset/icon_${size}x${size}.png"
  double=$((size * 2))
  cp "$iconset/size_${double}.png" "$iconset/icon_${size}x${size}@2x.png"
done
rm "$iconset"/size_*.png
iconutil -c icns "$iconset" -o "$output/Contents/Resources/Atlas.icns"
cp desktop/macos/Info.plist "$output/Contents/Info.plist"
xattr -cr "$output"
xattr -d com.apple.FinderInfo "$output" 2>/dev/null || true
codesign --force --sign - "$output"
codesign --verify --strict "$output"
[ -x "$output/Contents/Resources/runtime/node" ]
[ -f "$output/Contents/Resources/runtime/build/desktop-source/.next/BUILD_ID" ]
# Publish only a complete package; preserve the preceding output for recovery.
mkdir -p "$(dirname "$requested_output")"
if [ -e "$requested_output" ]; then
  mv "$requested_output" "${requested_output}.previous.$(date +%s)"
fi
mv "$output" "$requested_output"
printf 'Built verified package %s\n' "$requested_output"
