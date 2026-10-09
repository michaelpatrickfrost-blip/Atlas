#!/usr/bin/env bash
# Independent shell: a caller's conditional must not disable errexit inside builds.
set -euo pipefail
CANDIDATE="${1:?candidate}"; PREVIOUS="${2:?previous}"; BACKUP="${3:?backup}"; REV="${4:?revision}"
cd "$CANDIDATE"
[[ ! -f .atlas-ready && "$REV" =~ ^[a-f0-9]{40}$ ]]
export ATLAS_RELEASE_REVISION="$REV" NEXT_DEPLOYMENT_ID="$REV"
npm ci --no-audit --no-fund > "$BACKUP-install.log" 2>&1
npx prisma generate --config prisma7.config.ts > "$BACKUP-generate.log" 2>&1
npx prisma migrate deploy --config prisma7.config.ts > "$BACKUP-migrate.log" 2>&1
NODE_OPTIONS=--max-old-space-size=6144 npm run build > "$BACKUP-build.log" 2>&1
[[ -s .next/BUILD_ID && -f .next/server/app-paths-manifest.json ]]
node --env-file=.env.local --import tsx scripts/studio/check-compatibility.ts > "$BACKUP-studio-compatibility.log" 2>&1
node scripts/deploy/release-files.mjs assets "$PREVIOUS/.next/static" .next/static
printf 'ATLAS_RELEASE_REVISION=%s\nNEXT_DEPLOYMENT_ID=%s\n' "$REV" "$REV" > .release.env
printf '%s\n' "$REV" > .atlas-ready
