import { afterEach, expect, it } from 'vitest';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { planRetirement, retirePlannedOutputs } from '../scripts/deploy/prune-releases.mjs';
const roots: string[] = [];
afterEach(() => { for (const root of roots.splice(0)) fs.rmSync(root, { recursive: true, force: true }); });
function fixture() {
  const base = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'atlas-retirement-test-'))); roots.push(base);
  const root = path.join(base, 'releases'); fs.mkdirSync(root);
  const dirs = [1, 2, 3, 4].map(n => path.join(root, String(n).repeat(40)));
  for (const dir of dirs) {
    fs.mkdirSync(path.join(dir, 'node_modules'), { recursive: true }); fs.writeFileSync(path.join(dir, 'node_modules/package'), 'duplicate dependency');
    fs.mkdirSync(path.join(dir, '.next/server'), { recursive: true }); fs.writeFileSync(path.join(dir, '.next/server/output'), 'compiled');
    fs.mkdirSync(path.join(dir, '.next/static'), { recursive: true }); fs.writeFileSync(path.join(dir, '.next/static/old-tab.js'), 'browser asset');
    fs.writeFileSync(path.join(dir, '.atlas-ready'), path.basename(dir)); fs.writeFileSync(path.join(dir, 'source.ts'), 'source history');
  }
  const pointers = ['current', 'previous'].map((name, n) => { const link = path.join(base, name); fs.symlinkSync(dirs[n], link); return link; });
  const business = path.join(base, 'business'); fs.mkdirSync(business); fs.writeFileSync(path.join(business, 'record'), 'private data');
  fs.symlinkSync(business, path.join(dirs[3], '.env-data'));
  return { base, root, dirs, pointers, business };
}
it('keeps current, rollback and process-pinned runtime while distinguishing directory boundaries', () => {
  const f = fixture(), plan = planRetirement(f.root, f.pointers, [path.join(f.dirs[2], 'server.js'), `${f.dirs[3]}-different`]);
  expect(plan.kept).toEqual(f.dirs.slice(0, 3)); expect(plan.candidates.map(c => c.directory)).toEqual([f.dirs[3]]);
});
it('retires duplicate outputs while retaining source, browser assets and external business data', () => {
  const f = fixture(), plan = planRetirement(f.root, f.pointers, [f.dirs[2]]);
  retirePlannedOutputs(plan);
  expect(fs.existsSync(path.join(f.dirs[3], 'node_modules'))).toBe(false); expect(fs.existsSync(path.join(f.dirs[3], '.next/server'))).toBe(false);
  expect(fs.readFileSync(path.join(f.dirs[3], '.next/static/old-tab.js'), 'utf8')).toBe('browser asset');
  expect(fs.readFileSync(path.join(f.dirs[3], 'source.ts'), 'utf8')).toBe('source history');
  expect(fs.readFileSync(path.join(f.business, 'record'), 'utf8')).toBe('private data');
  expect(fs.existsSync(path.join(f.dirs[3], '.atlas-ready'))).toBe(false);
  expect(fs.readdirSync(f.dirs[3]).some(name => name.startsWith('.atlas-ready.retired-'))).toBe(true);
  for (const dir of f.dirs.slice(0, 3)) expect(fs.existsSync(path.join(dir, 'node_modules/package'))).toBe(true);
  expect(planRetirement(f.root, f.pointers, [f.dirs[2]]).candidates).toEqual([]);
});
it('rejects a symlinked release root, foreign pointers and ordinary pointer directories', () => {
  const f = fixture(), alias = path.join(f.base, 'alias'); fs.symlinkSync(f.root, alias);
  expect(() => planRetirement(alias, f.pointers)).toThrow('real directory');
  const foreign = path.join(f.base, 'foreign'); fs.symlinkSync(f.business, foreign);
  expect(() => planRetirement(f.root, [foreign, f.pointers[1]])).toThrow('leaves');
  expect(() => planRetirement(f.root, [f.business, f.pointers[1]])).toThrow('symlinks');
});
it('ignores unrelated/symlinked folders and never follows an output link into business data', () => {
  const f = fixture(); fs.mkdirSync(path.join(f.root, 'unrelated')); fs.symlinkSync(f.business, path.join(f.root, '5'.repeat(40)));
  fs.rmSync(path.join(f.dirs[3], 'node_modules'), { recursive: true }); fs.symlinkSync(f.business, path.join(f.dirs[3], 'node_modules'));
  const plan = planRetirement(f.root, f.pointers, [f.dirs[2]]);
  expect(plan.candidates.map(c => c.directory)).toEqual([f.dirs[3]]);
  expect(plan.candidates[0].outputs).not.toContain(path.join(f.dirs[3], 'node_modules'));
  retirePlannedOutputs(plan); expect(fs.readFileSync(path.join(f.business, 'record'), 'utf8')).toBe('private data');
});
it('rejects attempts to remove retained static assets or source files', () => {
  const f = fixture();
  for (const output of [path.join(f.dirs[3], '.next/static'), path.join(f.dirs[3], 'source.ts'), f.business])
    expect(() => retirePlannedOutputs({ candidates: [{ directory: f.dirs[3], outputs: [output] }] })).toThrow('Only duplicate');
  expect(fs.readFileSync(path.join(f.dirs[3], 'source.ts'), 'utf8')).toBe('source history');
  expect(fs.existsSync(path.join(f.dirs[3], '.atlas-ready'))).toBe(true);
});
it('rejects a build parent replaced with an external link after planning, without changing readiness', () => {
  const f = fixture(), plan = planRetirement(f.root, f.pointers, [f.dirs[2]]);
  fs.rmSync(path.join(f.dirs[3], '.next'), { recursive: true }); fs.symlinkSync(f.business, path.join(f.dirs[3], '.next'));
  expect(() => retirePlannedOutputs(plan)).toThrow('parent changed');
  expect(fs.existsSync(path.join(f.dirs[3], '.atlas-ready'))).toBe(true);
  expect(fs.existsSync(path.join(f.dirs[3], 'node_modules/package'))).toBe(true);
  expect(fs.readFileSync(path.join(f.business, 'record'), 'utf8')).toBe('private data');
});
