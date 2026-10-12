import { afterEach, expect, it, vi } from "vitest";
import { mkdtempSync, writeFileSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import type { PrismaClient } from "@/generated/prisma/client";
import { assertConditionalFieldActivationReady } from "@/core/studio/fields/conditional-readiness";
import { STUDIO_CONDITIONAL_FIELD_FEATURE as FEATURE, studioRuntimeFeaturesForPayload } from "@/core/studio/runtime-features";
import { scanStudioRuntimeFeatureCompatibility } from "@/core/studio/registry/runtime-compatibility";
import { probeConditionalFieldReaders } from "../scripts/studio/probe-conditional-readiness";
vi.mock("@/core/db/client", () => ({ db: {} }));
const roots: string[] = [];
afterEach(() => { vi.restoreAllMocks(); vi.unstubAllEnvs(); roots.splice(0).forEach(root => rmSync(root, { recursive: true, force: true })); });
function marker(features: string[] = []) {
  const root = mkdtempSync(join(tmpdir(), "atlas-conditional-feature-")); roots.push(root);
  const revision = "a".repeat(40); writeFileSync(join(root, ".atlas-ready"), revision);
  writeFileSync(join(root, ".studio-runtime-features.json"), JSON.stringify({ schemaVersion: 1, releaseRevision: revision, rollbackRevision: "b".repeat(40), features }));
  vi.spyOn(process, "cwd").mockReturnValue(root); vi.stubEnv("ATLAS_RELEASE_REVISION", revision); return root;
}
it("Test operations remain available in the first bridge while production activation stays closed", () => {
  marker(); vi.stubEnv("ATLAS_STUDIO_CONDITIONAL_FIELDS", "1");
  expect(() => assertConditionalFieldActivationReady({ isTest: true })).not.toThrow();
  expect(() => assertConditionalFieldActivationReady({ isTest: false })).toThrow("UNAVAILABLE");
  expect(studioRuntimeFeaturesForPayload("customField", { schemaVersion: 2, field: {} })).toEqual([]);
});
it("production activation requires exact sealed paired evidence, not an environment flag or stale revision", () => {
  const root = marker([FEATURE]); expect(() => assertConditionalFieldActivationReady({ isTest: false })).not.toThrow();
  writeFileSync(join(root, ".atlas-ready"), "c".repeat(40)); expect(() => assertConditionalFieldActivationReady({ isTest: false })).toThrow("INVALID");
});
it("the actual compiler/evaluator/native boundary probe exercises semantics and rejects forged authority without data", async () => {
  expect(await probeConditionalFieldReaders(process.cwd())).toBe(true);
});
it("a predecessor without the production boundary is unsupported, not a positive feature from existing schema files", async () => {
  const root = mkdtempSync(join(tmpdir(), "atlas-conditional-predecessor-")); roots.push(root);
  expect(await probeConditionalFieldReaders(root)).toBe(false);
});
it.each(["ACTIVE", "SUSPENDED"]) ("retained non-Test %s conditional metadata requires actual supported readers even after pointers change", async status => {
  const rows = [{ id: "version", definitionId: "definition", payload: { schemaVersion: 2 }, compiledPlan: {},
    definition: { kind: "customField", organisation: { isTest: false, status } } }];
  const findMany = vi.fn().mockResolvedValueOnce(rows).mockResolvedValueOnce([]);
  const client = { studioDefinitionVersion: { findMany } } as unknown as PrismaClient;
  expect(await scanStudioRuntimeFeatureCompatibility(client, [])).toEqual([`definition@version: unsupported Studio metadata feature ${FEATURE}`]);
  expect(findMany.mock.calls[0][0].select).not.toHaveProperty("studioFieldValue");
  findMany.mockResolvedValueOnce(rows).mockResolvedValueOnce([]); expect(await scanStudioRuntimeFeatureCompatibility(client, [FEATURE])).toEqual([]);
});
it.each(["ACTIVE", "SUSPENDED"]) ("existing %s Test histories retain the old compatibility policy", async status => {
  const findMany = vi.fn().mockResolvedValueOnce([{ id: "version", definitionId: "definition", payload: { schemaVersion: 2 }, compiledPlan: {},
    definition: { kind: "customField", organisation: { isTest: true, status } } }]).mockResolvedValueOnce([]);
  expect(await scanStudioRuntimeFeatureCompatibility({ studioDefinitionVersion: { findMany } } as unknown as PrismaClient, [])).toEqual([]);
});
