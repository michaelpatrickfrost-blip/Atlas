#!/bin/bash
# Installs "Atlas in Browser": one Desktop button that starts the installed Atlas
# server (the same local runtime and data connection Atlas.app uses) and opens it
# in the default web browser. The software still runs on this Mac; records stay on
# the server. Usage: scripts/install-browser-launcher.sh
set -euo pipefail
app="$HOME/Applications/Atlas in Browser.app"
link="$HOME/Desktop/Atlas in Browser.app"
src="$(mktemp -t atlas-browser).applescript"
cat > "$src" <<'SCRIPT'
on serverUp()
	try
		return (do shell script "/usr/bin/curl -s -o /dev/null -m 2 -w '%{http_code}' http://127.0.0.1:13200/login") is "200"
	on error
		return false
	end try
end serverUp

if not serverUp() then
	do shell script "/usr/bin/open -gj " & quoted form of (POSIX path of (path to home folder) & "Applications/Atlas.app")
	repeat 60 times
		if serverUp() then exit repeat
		delay 1
	end repeat
end if
if serverUp() then
	open location "http://127.0.0.1:13200/home"
else
	display dialog "Atlas did not start. Open Atlas from the Desktop to see why, then try again." buttons {"OK"} default button 1 with title "Atlas in Browser"
end if
SCRIPT
rm -rf "$app"
/usr/bin/osacompile -o "$app" "$src"
rm -f "$src"
icon="$HOME/Applications/Atlas.app/Contents/Resources/Atlas.icns"
if [ -f "$icon" ]; then cp "$icon" "$app/Contents/Resources/applet.icns"; /usr/bin/codesign --force -s - "$app" >/dev/null 2>&1 || true; touch "$app"; fi
# The Desktop is iCloud-synced, so keep the app in ~/Applications and link to it, as Atlas.app does.
ln -sfn "$app" "$link"
echo "Installed $app (Desktop link: $link)"
