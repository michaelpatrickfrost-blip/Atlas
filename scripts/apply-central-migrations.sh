#!/bin/bash
# Apply any Prisma migrations the central/remote database (the one
# scripts/check-release-schema.mjs checks against) is missing, so that gate
# passes before a desktop release. See docs/DEPLOY.md for the full procedure
# and why this is a separate, deliberate step rather than something the
# release script does automatically.
#
# Usage: scripts/apply-central-migrations.sh [ssh-host]
# ssh-host defaults to $ATLAS_SCHEMA_CHECK_HOST or root@217.154.51.15 (same
# default check-release-schema.mjs uses).
set -euo pipefail
cd "$(dirname "$0")/.."
host="${1:-${ATLAS_SCHEMA_CHECK_HOST:-root@217.154.51.15}}"
local_port=15543
remote_env=/etc/atlas-test/migration.env

echo "== 1. Reading remote connection details from $host:$remote_env =="
remote_url="$(ssh -o BatchMode=yes -o ConnectTimeout=10 "$host" "grep ^DATABASE_URL= $remote_env | cut -d= -f2-")"
remote_port="$(echo "$remote_url" | sed -n 's#.*@[^:]*:\([0-9]*\)/.*#\1#p')"
[ -n "$remote_port" ] || { echo "Could not parse the remote DB port out of DATABASE_URL"; exit 1; }

echo "== 2. Taking a pre-migration backup on $host =="
stamp="$(date -u +%Y%m%dT%H%M%SZ)"
ssh -o BatchMode=yes -o ConnectTimeout=10 "$host" ". $remote_env; out=/opt/atlas-test/backups/pre-migration-$stamp.sql.gz; pg_dump \"\$DATABASE_URL\" | gzip > \"\$out\" && echo \"backup: \$out\""

echo "== 3. Checking what's pending (dry run, nothing applied yet) =="
pkill -f "$local_port:127.0.0.1:$remote_port" 2>/dev/null || true
ssh -o BatchMode=yes -o ConnectTimeout=10 -fN -L "$local_port:127.0.0.1:$remote_port" "$host"
trap 'pkill -f "'"$local_port"':127.0.0.1:'"$remote_port"'" 2>/dev/null || true' EXIT
sleep 1
tunnel_url="$(echo "$remote_url" | sed -E "s#@[^:]*:[0-9]*/#@127.0.0.1:$local_port/#")"
DATABASE_URL="$tunnel_url" npx prisma migrate status || true

read -r -p "Review the pending migrations above (and their .sql files in prisma/migrations/) for DROP/TRUNCATE/data-loss before continuing. Apply them to the LIVE shared database now? [y/N] " confirm
[ "$confirm" = "y" ] || [ "$confirm" = "Y" ] || { echo "Aborted, nothing applied."; exit 1; }

echo "== 4. Applying =="
DATABASE_URL="$tunnel_url" npx prisma migrate deploy

echo "== 5. Re-checking the release schema gate =="
node scripts/check-release-schema.mjs
