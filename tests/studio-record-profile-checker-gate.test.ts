import { afterEach, beforeEach, expect, it, vi } from "vitest";
const m = vi.hoisted(() => ({ evidence: vi.fn(), pair: vi.fn(), database: vi.fn() }));
vi.mock("@/core/db/client", () => ({ db: new Proxy({}, { get: () => new Proxy({}, { get: () => m.database }) }) }));
vi.mock("@/core/studio/runtime-features", () => ({ STUDIO_PROFILE_FEATURE: "recordProfiles.v1", readStudioRuntimeFeatureEvidence: m.evidence }));
vi.mock("../scripts/studio/runtime-feature-probe", () => ({ verifyStudioRuntimeFeaturePair: m.pair }));
import { checkRecordProfiles } from "../scripts/studio/check-record-profiles";
const platform = Object.getOwnPropertyDescriptor(process, "platform")!;
beforeEach(() => {
  vi.clearAllMocks(); Object.defineProperty(process, "platform", { ...platform, value: "linux" });
  vi.stubEnv("ATLAS_STUDIO_LIVE_TEST", "1"); vi.stubEnv("ATLAS_RELEASE_REVISION", "a".repeat(40));
  m.database.mockImplementation(() => { throw new Error("No central fixture access permitted in a disabled checker gate."); });
});
afterEach(() => { Object.defineProperty(process, "platform", platform); vi.unstubAllEnvs(); vi.restoreAllMocks(); });
it.each([null, { features: [] }])("defers a genuinely unsupported sealed feature before any fixture/database or compatibility-pair work", async evidence => {
  m.evidence.mockReturnValue(evidence); const output = vi.spyOn(console, "log").mockImplementation(() => undefined), cleanup: string[] = [];
  await checkRecordProfiles("http://127.0.0.1:3210", "manager", "creator", cleanup);
  expect(output).toHaveBeenCalledWith(expect.stringMatching(/^DEFERRED record-profile acceptance:/));
  expect(m.database).not.toHaveBeenCalled(); expect(m.pair).not.toHaveBeenCalled(); expect(cleanup).toEqual([]);
});
it("does not disguise malformed evidence or unsafe invocation as a deferred/pass result", async () => {
  m.evidence.mockImplementation(() => { throw new Error("STUDIO_RUNTIME_FEATURE_INVALID"); });
  await expect(checkRecordProfiles("https://atlassystem.online", "manager", "creator", [])).rejects.toThrow("FEATURE_INVALID");
  m.evidence.mockClear();
  await expect(checkRecordProfiles("https://other.example.test", "manager", "creator", [])).rejects.toThrow();
  expect(m.evidence).not.toHaveBeenCalled();
  vi.stubEnv("ATLAS_STUDIO_LIVE_TEST", "0");
  await expect(checkRecordProfiles("https://atlassystem.online", "manager", "creator", [])).rejects.toThrow();
  expect(m.database).not.toHaveBeenCalled();
});
