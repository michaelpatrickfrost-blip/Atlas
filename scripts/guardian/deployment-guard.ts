import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

export const DEPLOYMENT_CHANGED = "Deployment changed during the sweep; finish deployment and rerun against a stable release.";
/** A changing checkout/build invalidates browser evidence; never publish it as product failures. */
export function deploymentGuard(root: string, revision: string, readRevision = () => execFileSync("git", ["rev-parse", "--short", "HEAD"], { cwd: root, encoding: "utf8" }).trim()) {
  const buildFile = path.join(root, ".next/BUILD_ID");
  const build = fs.existsSync(buildFile) ? fs.readFileSync(buildFile, "utf8") : null;
  return () => {
    if (fs.existsSync(path.join(root, ".next/lock")) || !fs.existsSync(buildFile) || fs.readFileSync(buildFile, "utf8") !== build || readRevision() !== revision) throw new Error(DEPLOYMENT_CHANGED);
  };
}
