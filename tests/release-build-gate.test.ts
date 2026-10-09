import { afterEach, describe, expect, it } from 'vitest';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
const roots: string[] = [];
const helper = path.resolve('scripts/deploy/build-release.sh');
afterEach(() => { for (const dir of roots.splice(0)) fs.rmSync(dir, { recursive: true, force: true }); });
function run(fail: string) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'atlas-build-gate-')); roots.push(dir);
  const bin = path.join(dir, 'bin'), candidate = path.join(dir, 'candidate'); fs.mkdirSync(bin); fs.mkdirSync(candidate);
  const stub = '#!/bin/bash\nset -eu\nname=$(basename "$0")\necho "$name $*" >> "$STAGES"\ncase "$name $*" in\n "npm ci"*) stage=install;;\n "npx prisma generate"*) stage=generate;;\n "npx prisma migrate"*) stage=migrate;;\n "npm run build"*) stage=build;;\n "node --env-file"*) stage=compatibility;;\n *) stage=assets;;\nesac\nif [[ "$FAIL_STAGE" = "$stage" ]]; then echo "intentional stage failure"; exit 73; fi\nif [[ "$stage" = build ]]; then mkdir -p .next/server; echo verified > .next/BUILD_ID; echo "{}" > .next/server/app-paths-manifest.json; fi\n';
  for (const command of ['npm', 'npx', 'node']) fs.writeFileSync(path.join(bin, command), stub, { mode: 0o755 });
  const stages = path.join(dir, 'stages');
  // Reproduce the old failure context: the parent invokes preparation inside OR.
  const result = spawnSync('bash', ['-c', 'bash "$1" "$2" "$3" "$4" "$5" || exit 17', 'gate', helper, candidate, path.join(dir, 'previous'), path.join(dir, 'backup'), 'a'.repeat(40)], { env: { ...process.env, PATH: `${bin}:${process.env.PATH}`, FAIL_STAGE: fail, STAGES: stages }, encoding: 'utf8' });
  return { result, candidate, stages: fs.readFileSync(stages, 'utf8') };
}
describe('release preparation failure gate', () => {
  for (const stage of ['install', 'generate', 'migrate', 'build', 'compatibility', 'assets']) it(`never marks a candidate ready after ${stage} fails`, () => {
    const check = run(stage); expect(check.result.status).toBe(17);
    expect(fs.existsSync(path.join(check.candidate, '.atlas-ready'))).toBe(false);
    if (['install', 'generate', 'migrate', 'build'].includes(stage)) expect(check.stages).not.toContain('check-compatibility');
  });
  it('writes the exact revision only after every stage succeeds', () => {
    const check = run('none'); expect(check.result.status).toBe(0);
    expect(fs.readFileSync(path.join(check.candidate, '.atlas-ready'), 'utf8')).toBe('a'.repeat(40) + '\n');
    expect(check.stages).toContain('check-compatibility'); expect(check.stages).toContain('release-files.mjs assets');
  });
});
