import { existsSync, readFileSync, realpathSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { studioRuntimeFeatureEvidenceSchema, STUDIO_RUNTIME_FEATURE_FILE } from "../../src/core/studio/runtime-features";
import { probeStudioRuntimeFeatures } from "./runtime-feature-probe";

/** Original BOTH-lock build pipeline only, before sealing. No database mutation,
 * marker overwrite or enabling from environment/client flags. */
export function prepareStudioRuntimeFeatureEvidence(candidate: string, previous: string, revision: string) {
  const root = realpathSync(candidate), rollback = realpathSync(previous);
  if (root === rollback || existsSync(join(root, ".atlas-ready"))) throw new Error("Feature evidence requires a distinct unsealed candidate.");
  const rollbackRevision = readFileSync(join(rollback, ".atlas-ready"), "utf8").trim();
  const candidateFeatures = probeStudioRuntimeFeatures(root), rollbackFeatures = probeStudioRuntimeFeatures(rollback);
  const oldMarker = join(rollback, STUDIO_RUNTIME_FEATURE_FILE);
  if (existsSync(oldMarker)) {
    const prior = studioRuntimeFeatureEvidenceSchema.parse(JSON.parse(readFileSync(oldMarker, "utf8")));
    if (prior.releaseRevision !== rollbackRevision || prior.features.some(feature => !candidateFeatures.includes(feature)))
      throw new Error("Cannot remove an enabled Studio runtime reader from the candidate.");
  }
  const evidence = studioRuntimeFeatureEvidenceSchema.parse({ schemaVersion: 1, releaseRevision: revision, rollbackRevision,
    features: candidateFeatures.filter(feature => rollbackFeatures.includes(feature)) });
  writeFileSync(join(root, STUDIO_RUNTIME_FEATURE_FILE), JSON.stringify(evidence) + "\n", { flag: "wx", mode: 0o600 });
  return evidence;
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const [candidate, previous, revision] = process.argv.slice(2);
  if (!candidate || !previous || !revision) throw new Error("Candidate, actual rollback and full revision are required.");
  process.stdout.write(JSON.stringify(prepareStudioRuntimeFeatureEvidence(candidate, previous, revision)) + "\n");
}
