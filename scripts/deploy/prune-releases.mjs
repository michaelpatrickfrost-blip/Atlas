import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const releaseName = /^(?:bootstrap-)?[a-f0-9]{40}$/;
const within = (root, candidate) => candidate === root || candidate.startsWith(`${root}${path.sep}`);

/** Keep source/history/static assets. Only inactive duplicated runtime outputs
 * retire; production data/configuration lives outside these paths. */
export function planRetirement(root, pointers, inUse = []) {
  const resolved = fs.realpathSync(root);
  if (resolved !== path.resolve(root) || fs.lstatSync(root).isSymbolicLink()) throw new Error('Release root must be a real directory.');
  const protectedPaths = pointers.map(pointer => {
    if (!fs.lstatSync(pointer).isSymbolicLink()) throw new Error('Current/previous pointers must be symlinks.');
    const target = fs.realpathSync(pointer);
    if (path.dirname(target) !== resolved || !releaseName.test(path.basename(target))) throw new Error('Runtime pointer leaves the release root.');
    return target;
  });
  const candidates = [], kept = [];
  for (const entry of fs.readdirSync(resolved, { withFileTypes: true })) {
    if (!entry.isDirectory() || !releaseName.test(entry.name)) continue;
    const directory = path.join(resolved, entry.name);
    if (protectedPaths.includes(directory) || inUse.some(active => within(directory, active))) { kept.push(directory); continue; }
    const outputs = [];
    const dependencies = path.join(directory, 'node_modules');
    if (fs.existsSync(dependencies) && !fs.lstatSync(dependencies).isSymbolicLink()) outputs.push(dependencies);
    const next = path.join(directory, '.next');
    if (fs.existsSync(next) && !fs.lstatSync(next).isSymbolicLink()) {
      for (const child of fs.readdirSync(next)) if (child !== 'static') outputs.push(path.join(next, child));
    }
    if (outputs.length) candidates.push({ directory, outputs });
  }
  return { protectedPaths, kept, candidates };
}

/** No command lines or customer data are returned/logged. Pin processes using a
 * runtime or a full SHA (including an in-progress release waiting on a lock). */
function processPins(root) {
  const pins = [];
  for (const pid of fs.readdirSync('/proc').filter(name => /^\d+$/.test(name))) {
    try {
      for (const field of ['cwd', 'exe']) {
        try { const target = fs.realpathSync(`/proc/${pid}/${field}`); if (within(root, target)) pins.push(target); }
        catch (error) { if (!['ENOENT', 'ESRCH', 'EINVAL'].includes(error.code)) throw error; }
      }
      const args = fs.readFileSync(`/proc/${pid}/cmdline`, 'utf8').split('\0');
      for (const arg of args) {
        if (releaseName.test(arg)) pins.push(path.join(root, arg));
        const expression = new RegExp(`${root.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}/((?:bootstrap-)?[a-f0-9]{40})(?:/|$|\\s)`, 'g');
        for (const match of arg.matchAll(expression)) pins.push(path.join(root, match[1]));
      }
    } catch (error) { if (!['ENOENT', 'ESRCH'].includes(error.code)) throw error; }
  }
  return pins;
}

export function retirePlannedOutputs(plan, log = () => {}) {
  // Validate the complete plan before changing markers or removing anything.
  // Recheck parent links immediately before use; rm must never traverse a
  // replaced .next parent into external storage.
  for (const candidate of plan.candidates) {
    if (!releaseName.test(path.basename(candidate.directory)) || fs.lstatSync(candidate.directory).isSymbolicLink()) throw new Error('Release directory must remain real.');
    for (const output of candidate.outputs) {
      const directDependencies = output === path.join(candidate.directory, 'node_modules');
      const directBuildOutput = path.dirname(output) === path.join(candidate.directory, '.next') && path.basename(output) !== 'static';
      if (!directDependencies && !directBuildOutput) throw new Error('Only duplicate dependencies/build outputs may retire.');
      const parent = directDependencies ? candidate.directory : path.join(candidate.directory, '.next');
      if (fs.realpathSync(parent) !== path.resolve(parent)) throw new Error('Output parent changed to a link.');
    }
  }
  for (const candidate of plan.candidates) {
    // Rename readiness before removing outputs: this source is retained history,
    // no longer a runnable rollback candidate. No sources/config/static are moved.
    const ready = path.join(candidate.directory, '.atlas-ready');
    if (fs.existsSync(ready)) fs.renameSync(ready, `${ready}.retired-${Date.now()}`);
    for (const output of candidate.outputs) {
      fs.rmSync(output, { recursive: true, force: true });
    }
    log(candidate.directory);
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  const [mode] = process.argv.slice(2);
  if (!['audit', 'prune'].includes(mode) || process.platform !== 'linux' || process.getuid() !== 0) throw new Error('Root Linux maintenance only; audit or prune.');
  // The checked-in shell wrapper acquires BOTH original release locks. A direct
  // prune also requires inherited open lock descriptors, so callers cannot omit
  // them accidentally. This is an operator utility, never a web endpoint.
  if (mode === 'prune') {
    for (const descriptor of [8, 9]) {
      const target = fs.readlinkSync(`/proc/self/fd/${descriptor}`);
      if (target !== (descriptor === 8 ? '/run/lock/atlas-vps-deploy.lock' : '/tmp/atlas-vps-deploy.lock')) throw new Error('Original release lock descriptor missing.');
    }
  }
  const root = '/opt/atlas-releases';
  const plan = planRetirement(root, ['/opt/atlas-current', '/opt/atlas-previous'], processPins(root));
  console.log(JSON.stringify({ mode, kept: plan.kept, retiredRuntimeCandidates: plan.candidates.length }));
  if (mode === 'prune') retirePlannedOutputs(plan, directory => console.log(`Retired duplicate runtime only: ${directory}`));
}
