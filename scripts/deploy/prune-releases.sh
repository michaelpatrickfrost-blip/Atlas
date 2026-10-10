#!/usr/bin/env bash
# Michael authorised obsolete development/release-output cleanup 10 October 2026.
# Never remove current/previous/process-pinned runtimes or data/backups/source.
set -euo pipefail
trap 'printf "Retirement stopped safely at guard line %s\n" "$LINENO" >&2' ERR
exec 9</tmp/atlas-vps-deploy.lock
flock -n 9
exec 8</run/lock/atlas-vps-deploy.lock
flock -n 8
exec node "$(dirname "$0")/prune-releases.mjs" "${1:-audit}"
