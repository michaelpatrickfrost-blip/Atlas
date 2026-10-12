import { expect, it } from "vitest";
import { probeStudioRuntimeFeatures } from "../scripts/studio/runtime-feature-probe";
import { execFileSync } from "node:child_process";
import { copyFileSync, existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";

it("the actual own-loader verifies defaults, strict page/profile engines and forged-principal denial without records", () => {
  // Uses this actual worktree's own tsx loader. No database, SQL or marker writes.
  expect(probeStudioRuntimeFeatures(process.cwd())).toEqual(["literalFieldDefaults.v1", "structuredPages.v1", "ticketRecordPanels.v1", "salesPageMetrics.v1", "recordProfiles.v1", "recordTypeForms.v1", "analyticsBusinessViews.v1", "pageEmbeddedAnalytics.v1"]);
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

// Negative compatibility fixtures retain actual source modules and share only
// disposable dependency symlinks. Omitted/corrupt reader files model unsupported
// or unsafe runtime trees; they do not assert an authenticated business read.
function withReaderTree(overrides: Record<string, string | null>, check: (root: string) => void) {
  if (!Object.keys(overrides).some(path => path.includes("views/runtime") || path.includes("business-view")))
    overrides = { "src/core/studio/views/runtime.ts": "export const unsupported = true;", ...overrides };
  const root = mkdtempSync(join(tmpdir(), "atlas-reader-compatibility-"));
  try {
    const paths = Object.keys(overrides);
    function mirror(relative: string) {
      const source = join(process.cwd(), relative), destination = join(root, relative);
      if (Object.hasOwn(overrides, relative)) {
        if (overrides[relative] !== null) { mkdirSync(dirname(destination), { recursive: true }); writeFileSync(destination, overrides[relative]); }
      } else if (paths.some(path => path.startsWith(`${relative}/`))) {
        mkdirSync(destination, { recursive: true });
        for (const name of readdirSync(source)) mirror(`${relative}/${name}`);
      } else { symlinkSync(source, destination); }
    }
    mirror("src");
    symlinkSync(join(process.cwd(), "node_modules"), join(root, "node_modules"));
    copyFileSync(join(process.cwd(), "tsconfig.json"), join(root, "tsconfig.json"));
    check(root);
  } finally { rmSync(root, { recursive: true, force: true }); }
}
const pageReader = "src/core/studio/pages/runtime.ts", profileReader = "src/core/studio/record-types/runtime-profile.ts";
it("a literal-default bridge without either new reader remains unsupported for pages and profiles", () => {
  withReaderTree({ [pageReader]: null, [profileReader]: null }, root => {
    expect(probeStudioRuntimeFeatures(root)).toEqual(["literalFieldDefaults.v1"]);
  });
}, 20000);
it("supports each reader independently without treating an absent sibling as a positive result", () => {
  withReaderTree({ [pageReader]: null }, root => expect(probeStudioRuntimeFeatures(root)).toEqual(["literalFieldDefaults.v1", "recordProfiles.v1", "recordTypeForms.v1"]));
  withReaderTree({ [profileReader]: null }, root => expect(probeStudioRuntimeFeatures(root)).toEqual(["literalFieldDefaults.v1", "structuredPages.v1", "ticketRecordPanels.v1", "salesPageMetrics.v1"]));
}, 30000);
it("reader file presence with no actual published entry point is unsupported", () => {
  withReaderTree({ [pageReader]: "export const unsupported = true;" }, root => {
    expect(probeStudioRuntimeFeatures(root)).toEqual(["literalFieldDefaults.v1", "recordProfiles.v1", "recordTypeForms.v1"]);
  });
}, 20000);
it("a present reader that accepts a forged principal fails the probe rather than declaring support", () => {
  withReaderTree({ [pageReader]: "export async function readPublishedPageInTransaction() { return {}; }" }, root => {
    expect(() => probeStudioRuntimeFeatures(root)).toThrow("Studio runtime readiness probe failed");
  });
  withReaderTree({ [profileReader]: "export async function resolveRecordProfileInTransaction() { return {}; }" }, root => {
    expect(() => probeStudioRuntimeFeatures(root)).toThrow("Studio runtime readiness probe failed");
  });
}, 30000);
it("a broken present reader import is a release-blocking error", () => {
  withReaderTree({ [pageReader]: "throw new Error('broken actual reader');" }, root => {
    expect(() => probeStudioRuntimeFeatures(root)).toThrow("Studio runtime readiness probe failed");
  });
}, 20000);

it("a reader touching transaction metadata before denying forged authority fails without a database", () => {
  withReaderTree({ [pageReader]: "export async function readPublishedPageInTransaction(authority) { void authority.transaction.studioDefinition; throw new Error('DEPENDENCY_BROKEN'); }" }, root => {
    expect(() => probeStudioRuntimeFeatures(root)).toThrow("Studio runtime readiness probe failed");
  });
  withReaderTree({ [profileReader]: "export async function resolveRecordProfileInTransaction(authority) { void authority.transaction.studioDefinition; throw new Error('FORBIDDEN: genuine current record design authority'); }" }, root => {
    expect(() => probeStudioRuntimeFeatures(root)).toThrow("Studio runtime readiness probe failed");
  });
}, 30000);

it("a real receipt1 predecessor cannot claim creation selection support even when newer helper files exist", () => {
  const receipt = "src/core/service-work/form-receipt-contract.ts";
  const old = execFileSync("git", ["show", "38a1113b:" + receipt], { cwd: process.cwd(), encoding: "utf8" });
  withReaderTree({ [receipt]: old }, root => expect(probeStudioRuntimeFeatures(root)).toEqual(["literalFieldDefaults.v1", "structuredPages.v1", "ticketRecordPanels.v1", "salesPageMetrics.v1", "recordProfiles.v1"]));
}, 20000);
it("a creation receipt inspector accepting forged authority cannot claim compatibility", () => {
  const actual = JSON.stringify(join(process.cwd(), "src/core/service-work/record-type-creation.ts"));
  withReaderTree({ "src/core/service-work/record-type-creation.ts": `export { ticketCreationTypeOperationId } from ${actual}; export async function inspectTicketCreationTypeReceipt() { return {}; }` }, root => {
    expect(() => probeStudioRuntimeFeatures(root)).toThrow("Studio runtime readiness probe failed");
  });
}, 20000);

it("business view support requires the actual reader and renderer, not the metadata bridge alone", () => {
  expect(probeStudioRuntimeFeatures(process.cwd())).toContain("analyticsBusinessViews.v1");
  withReaderTree({ ["src/core/studio/views/runtime.ts"]: "export const unsupported = true;" }, root => {
    expect(probeStudioRuntimeFeatures(root)).not.toContain("analyticsBusinessViews.v1");
  });
  withReaderTree({ ["src/modules/analytics/components/business-view-charts.tsx"]: null }, root => {
    expect(probeStudioRuntimeFeatures(root)).not.toContain("analyticsBusinessViews.v1");
  });
}, 30000);
it("business view forged-principal acceptance or early transaction access blocks readiness", () => {
  withReaderTree({ ["src/core/studio/views/runtime.ts"]: "export async function readPublishedViewInTransaction() { return {}; }" }, root => {
    expect(() => probeStudioRuntimeFeatures(root)).toThrow("Studio runtime readiness probe failed");
  });
  withReaderTree({ ["src/core/studio/views/runtime.ts"]: "export async function readPublishedViewInTransaction(authority) { void authority.transaction.studioDefinition; throw new Error('FORBIDDEN'); }" }, root => {
    expect(() => probeStudioRuntimeFeatures(root)).toThrow("Studio runtime readiness probe failed");
  });
}, 30000);

it("immutable embedding requires actual strict components, both owner opt-ins and retained readers", () => {
  expect(probeStudioRuntimeFeatures(process.cwd())).toContain("pageEmbeddedAnalytics.v1");
  const owner = "src/core/service-work/studio-pages.ts";
  const old = execFileSync("git", ["show", "1fb756b2:" + owner], { cwd: process.cwd(), encoding: "utf8" });
  withReaderTree({ [owner]: old, "src/core/studio/views/runtime.ts": readFileSync(join(process.cwd(), "src/core/studio/views/runtime.ts"), "utf8") }, root => {
    expect(probeStudioRuntimeFeatures(root)).not.toContain("pageEmbeddedAnalytics.v1");
    expect(probeStudioRuntimeFeatures(root)).toContain("analyticsBusinessViews.v1");
  });
  withReaderTree({ "src/modules/analytics/components/embedded-business-view.tsx": null, "src/core/studio/views/runtime.ts": readFileSync(join(process.cwd(), "src/core/studio/views/runtime.ts"), "utf8") }, root => expect(probeStudioRuntimeFeatures(root)).not.toContain("pageEmbeddedAnalytics.v1"));
}, 30000);
it("immutable reader acceptance or early metadata access for a forged principal blocks embedding readiness", () => {
  const reader = "src/core/studio/views/runtime.ts", actual = JSON.stringify(join(process.cwd(), reader));
  for (const body of ["return {};", "void authority.transaction.studioDefinition; throw new Error('FORBIDDEN');"])
    withReaderTree({ [reader]: `export { readPublishedViewInTransaction, readPublishedViewMetadataInTransaction } from ${actual}; export { inspectSealedViewForReadInTransaction } from ${actual}; export async function readSealedViewInTransaction(authority) { ${body} }` }, root => {
      expect(() => probeStudioRuntimeFeatures(root)).toThrow("Studio runtime readiness probe failed");
    });
}, 30000);
