import { spawnSync } from "node:child_process";
import { existsSync, readFileSync, realpathSync } from "node:fs";
import { join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { z } from "zod";
import { studioRuntimeFeatureSchema, studioRuntimeFeatureEvidenceSchema, STUDIO_RUNTIME_FEATURE_FILE } from "../../src/core/studio/runtime-features";

const resultSchema = z.strictObject({ schemaVersion: z.literal(1), features: z.array(studioRuntimeFeatureSchema).max(20) });
/** Bounded read-only probe of actual source through that release's own loader.
 * The evaluator comes from the proposed release, never a caller-supplied script. */
export function probeStudioRuntimeFeatures(root: string) {
  const actual = realpathSync(root), loader = join(actual, "node_modules/tsx/dist/loader.mjs");
  if (!existsSync(loader)) throw new Error("Studio readiness probe requires the actual runtime's tsx loader.");
  const evaluator = fileURLToPath(new URL("./evaluate-runtime-features.ts", import.meta.url));
  const child = spawnSync(process.execPath, ["--import", pathToFileURL(loader).href, evaluator, actual],
    { cwd: actual, encoding: "utf8", timeout: 15000, maxBuffer: 16384, env: { ...process.env, TSX_TSCONFIG_PATH: join(actual, "tsconfig.json") } });
  if (child.error || child.status !== 0) throw new Error("Studio runtime readiness probe failed; preserve the running release.");
  return resultSchema.parse(JSON.parse(child.stdout)).features;
}
/** Revalidate sealed candidate/rollback pairing before activation or feature QA.
 * Historical bridge evidence may have no features even though its readers work. */
export function verifyStudioRuntimeFeaturePair(candidate: string, previous: string, revision: string) {
  const root = realpathSync(candidate), rollback = realpathSync(previous);
  const evidence = studioRuntimeFeatureEvidenceSchema.parse(JSON.parse(readFileSync(join(root, STUDIO_RUNTIME_FEATURE_FILE), "utf8")));
  if (evidence.releaseRevision !== revision || readFileSync(join(root, ".atlas-ready"), "utf8").trim() !== revision
    || readFileSync(join(rollback, ".atlas-ready"), "utf8").trim() !== evidence.rollbackRevision)
    throw new Error("Studio runtime feature evidence no longer matches the candidate/rollback pair.");
  const currentFeatures = probeStudioRuntimeFeatures(root), rollbackFeatures = probeStudioRuntimeFeatures(rollback);
  if (evidence.features.some(feature => !currentFeatures.includes(feature) || !rollbackFeatures.includes(feature)))
    throw new Error("Studio runtime feature readers are unavailable in the actual candidate/rollback pair.");
  return evidence;
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const [candidate, previous, revision] = process.argv.slice(2);
  if (!candidate || !previous || !revision) throw new Error("Candidate, actual rollback and full revision are required.");
  process.stdout.write(JSON.stringify(verifyStudioRuntimeFeaturePair(candidate, previous, revision)) + "\n");
}
