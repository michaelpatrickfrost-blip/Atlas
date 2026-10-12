import { afterEach, beforeEach, expect, it, vi } from "vitest";
import type { Browser } from "@playwright/test";
const m = vi.hoisted(() => ({ evidence: vi.fn(), pair: vi.fn(), database: vi.fn() }));
vi.mock("@/core/db/client", () => ({ db: new Proxy({}, { get: () => new Proxy({}, { get: () => m.database }) }) }));
vi.mock("@/core/studio/runtime-features", async original => ({ ...(await original<typeof import("@/core/studio/runtime-features")>()), readStudioRuntimeFeatureEvidence: m.evidence }));
vi.mock("../scripts/studio/runtime-feature-probe", () => ({ verifyStudioRuntimeFeaturePair: m.pair }));
import { checkConditionalProduction } from "../scripts/studio/check-conditional-production";
const platform = Object.getOwnPropertyDescriptor(process, "platform")!;
beforeEach(() => { vi.clearAllMocks(); Object.defineProperty(process, "platform", { ...platform, value: "linux" });
  vi.stubEnv("ATLAS_STUDIO_LIVE_TEST", "1"); vi.stubEnv("ATLAS_RELEASE_REVISION", "a".repeat(40));
  m.database.mockImplementation(() => { throw new Error("Disabled checker cannot inspect fixtures."); }); });
afterEach(() => { Object.defineProperty(process, "platform", platform); vi.restoreAllMocks(); vi.unstubAllEnvs(); });
it.each([null, { features: [] }, { features: ["structuredPages.v1"] }])("missing exact conditional feature defers before database/browser/fixture writes", async evidence => {
  m.evidence.mockReturnValue(evidence); const output = vi.spyOn(console, "log").mockImplementation(() => undefined), cleanup: string[] = [];
  await checkConditionalProduction("http://127.0.0.1:3210", {} as Browser, "existing-synthetic", cleanup);
  expect(output).toHaveBeenCalledWith(expect.stringMatching(/^DEFERRED production conditional acceptance:/));
  expect(m.database).not.toHaveBeenCalled(); expect(m.pair).not.toHaveBeenCalled(); expect(cleanup).toEqual([]);
});
it("invalid evidence or unsafe host/unguarded invocation fails rather than declaring deferred success", async () => {
  m.evidence.mockImplementation(() => { throw new Error("STUDIO_RUNTIME_FEATURE_INVALID"); });
  await expect(checkConditionalProduction("https://atlassystem.online", {} as Browser, "user", [])).rejects.toThrow("INVALID");
  m.evidence.mockClear(); await expect(checkConditionalProduction("https://other.example.test", {} as Browser, "user", [])).rejects.toThrow();
  expect(m.evidence).not.toHaveBeenCalled(); vi.stubEnv("ATLAS_STUDIO_LIVE_TEST", "0");
  await expect(checkConditionalProduction("https://atlassystem.online", {} as Browser, "user", [])).rejects.toThrow(); expect(m.database).not.toHaveBeenCalled();
});
