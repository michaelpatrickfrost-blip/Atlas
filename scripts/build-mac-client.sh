#!/bin/bash
set -euo pipefail
cd "$(dirname "$0")/.."
output="${1:-build/Atlas.app}"
mkdir -p "$output/Contents/MacOS" "$output/Contents/Resources"
xcrun swiftc desktop/macos/Atlas.swift -o "$output/Contents/MacOS/Atlas" -framework AppKit -framework WebKit -O
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
codesign --force --sign - "$output"
printf 'Built %s\n' "$output"
