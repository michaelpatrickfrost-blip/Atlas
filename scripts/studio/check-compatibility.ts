import { db } from "../../src/core/db/client";
import { studioRegistry } from "../../src/core/studio/registry/runtime";
import { scanActiveStudioDependencies } from "../../src/core/studio/registry/compatibility";
import { scanStudioRuntimeFeatureCompatibility } from "../../src/core/studio/registry/runtime-compatibility";
import { probeStudioRuntimeFeatures } from "./runtime-feature-probe";
async function main() {
  const issues=await scanActiveStudioDependencies(db,studioRegistry());
  issues.push(...await scanStudioRuntimeFeatureCompatibility(db, probeStudioRuntimeFeatures(process.cwd())));
  if(issues.length) throw new Error(`Studio release compatibility failed:\n${issues.join("\n")}`);
  console.log("Studio active dependency compatibility: PASS");
}
main().catch(error=>{console.error(error instanceof Error?error.message:"Studio compatibility failed");process.exitCode=1;}).finally(()=>db.$disconnect());
