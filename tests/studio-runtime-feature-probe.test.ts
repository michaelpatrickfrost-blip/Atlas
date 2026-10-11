import { expect, it } from "vitest";
import { probeStudioRuntimeFeatures } from "../scripts/studio/runtime-feature-probe";
import { execFileSync } from "node:child_process";
import { copyFileSync, existsSync, mkdirSync, mkdtempSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

it("the actual integrated source reads valid schema1/schema2 defaults and retained default receipts", () => {
  // Uses this actual worktree's own tsx loader. No database, SQL or marker writes.
  expect(probeStudioRuntimeFeatures(process.cwd())).toEqual(["literalFieldDefaults.v1"]);
}, 20000);

it("a genuine legacy strict field parser returns unsupported before absent newer receipt modules", () => {
  const root = mkdtempSync(join(tmpdir(), "atlas-legacy-reader-"));
  try {
    mkdirSync(join(root, "src/core/studio/fields"), { recursive: true });
    mkdirSync(join(root, "src/core/studio/compiler"), { recursive: true });
    symlinkSync(join(process.cwd(), "node_modules"), join(root, "node_modules"));
    copyFileSync(join(process.cwd(), "tsconfig.json"), join(root, "tsconfig.json"));
    // Actual retained source from before literal defaults, with its unchanged
    // reference parser. Deliberately NO receipt, required-contract or validation
    // modules: importing them before the unsupported check was a bridge blocker.
    const schema = execFileSync("git", ["show", "56b0ab9d02380d00e4ba0f9417b933bb2517474e:src/core/studio/fields/schema.ts"], { cwd: process.cwd(), encoding: "utf8" });
    writeFileSync(join(root, "src/core/studio/fields/schema.ts"), schema);
    copyFileSync(join(process.cwd(), "src/core/studio/compiler/reference.ts"), join(root, "src/core/studio/compiler/reference.ts"));
    expect(existsSync(join(root, "src/core/service-work/form-receipt-contract.ts"))).toBe(false);
    expect(probeStudioRuntimeFeatures(root)).toEqual([]);
  } finally { rmSync(root, { recursive: true, force: true }); }
}, 20000);
