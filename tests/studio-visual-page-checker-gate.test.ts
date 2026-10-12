import { mkdtempSync, mkdirSync, realpathSync, rmSync, symlinkSync, writeFileSync, chmodSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import type { Browser } from "@playwright/test";

// These tests prove only pre-fixture denial/defer ordering. Actual owner, SQL,
// browser publication and runtime acceptance belong to the original central gate.
const m = vi.hoisted(() => ({ evidence: vi.fn(), pair: vi.fn(), database: vi.fn(), browser: vi.fn() }));
vi.mock("@/core/db/client", () => ({ db: new Proxy({}, { get: () => new Proxy({}, { get: () => m.database }) }) }));
vi.mock("@/core/studio/runtime-features", () => ({ STUDIO_PAGE_FEATURE: "structuredPages.v1", readStudioRuntimeFeatureEvidence: m.evidence }));
vi.mock("../scripts/studio/runtime-feature-probe", () => ({ verifyStudioRuntimeFeaturePair: m.pair }));
vi.mock("@/core/studio/authoring/context", () => ({ withStudioAuthoringAuthority: vi.fn() }));
vi.mock("@/core/studio/authoring/pages", () => ({ savePageDraftInTransaction: vi.fn(), publishPageDraftInTransaction: vi.fn(), createPageDraftInTransaction: vi.fn() }));
import { checkVisualPages } from "../scripts/studio/check-visual-pages";

const platform = Object.getOwnPropertyDescriptor(process, "platform")!;
const release = "a".repeat(40), rollback = "b".repeat(40);
const browser = { newContext: m.browser } as unknown as Browser;
let fixture: string, root: string, rollbackRoot: string, current: string, output: string;
const sealed = () => ({ schemaVersion: 1, releaseRevision: release, rollbackRevision: rollback, features: ["structuredPages.v1"] });

beforeEach(() => {
  vi.clearAllMocks(); Object.defineProperty(process, "platform", { ...platform, value: "linux" });
  vi.stubEnv("ATLAS_STUDIO_LIVE_TEST", "1"); vi.stubEnv("ATLAS_RELEASE_REVISION", release);
  vi.stubEnv("SESSION_SECRET", ""); vi.stubEnv("ATLAS_STUDIO_EVIDENCE", "");
  fixture = realpathSync(mkdtempSync(join(tmpdir(), "studio-visual-gate-")));
  root = join(fixture, "atlas-releases", release); rollbackRoot = join(fixture, "atlas-releases", rollback);
  output = join(fixture, "evidence", "original-random-candidate"); current = join(fixture, "atlas-current");
  for (const path of [root, rollbackRoot, output]) mkdirSync(path, { recursive: true });
  writeFileSync(join(output, ".atlas-release-revision"), `${release}\n`, { mode: 0o600 });
  symlinkSync(rollbackRoot, current); vi.spyOn(process, "cwd").mockReturnValue(root);
  m.database.mockImplementation(() => { throw new Error("Central fixture access is forbidden in local gate tests."); });
  m.browser.mockImplementation(() => { throw new Error("No actual browser permitted in local gate tests."); });
  m.evidence.mockReturnValue(sealed()); m.pair.mockImplementation(() => sealed());
  vi.stubGlobal("fetch", vi.fn(async (url: string) => url.endsWith("/design-studio")
    ? new Response(null, { status: 307, headers: { location: "/login" } }) : Response.json({ revision: release })));
});
afterEach(() => {
  Object.defineProperty(process, "platform", platform); vi.unstubAllEnvs(); vi.unstubAllGlobals(); vi.restoreAllMocks();
  rmSync(fixture, { recursive: true, force: true });
});
function untouched(cleanup: string[] = []) {
  expect(m.database).not.toHaveBeenCalled(); expect(m.browser).not.toHaveBeenCalled(); expect(cleanup).toEqual([]);
}

it.each([null, { features: [] }, { features: ["literalFieldDefaults.v1"] }])("defers unsupported Pages before pair/health/secrets/evidence/browser or any fixture access: %j", async evidence => {
  m.evidence.mockReturnValue(evidence); const log = vi.spyOn(console, "log").mockImplementation(() => undefined), cleanup: string[] = [];
  await checkVisualPages("http://127.0.0.1:3210", browser, "manager", cleanup);
  expect(log).toHaveBeenCalledWith(expect.stringMatching(/^DEFERRED visual Page acceptance:/));
  expect(log).not.toHaveBeenCalledWith(expect.stringMatching(/^PASS/));
  expect(m.pair).not.toHaveBeenCalled(); expect(fetch).not.toHaveBeenCalled(); untouched(cleanup);
});
it("does not hide malformed sealed evidence as deferred or accepted", async () => {
  m.evidence.mockImplementation(() => { throw new Error("STUDIO_RUNTIME_FEATURE_INVALID"); });
  await expect(checkVisualPages("http://127.0.0.1:3210", browser, "manager", [])).rejects.toThrow("FEATURE_INVALID");
  expect(m.pair).not.toHaveBeenCalled(); expect(fetch).not.toHaveBeenCalled(); untouched();
});
it.each(["https://other.example.test", "http://localhost:3210", "https://atlassystem.online/path"])('rejects unsafe target %s before feature or fixture access', async base => {
  await expect(checkVisualPages(base, browser, "manager", [])).rejects.toThrow();
  expect(m.evidence).not.toHaveBeenCalled(); untouched();
});
it.each(["ATLAS_STUDIO_LIVE_TEST", "ATLAS_RELEASE_REVISION"])("requires original-driver opt-in/full revision: %s", async name => {
  vi.stubEnv(name, "0");
  await expect(checkVisualPages("http://127.0.0.1:3210", browser, "manager", [])).rejects.toThrow();
  expect(m.evidence).not.toHaveBeenCalled(); untouched();
});
it("requires the actual original candidate rollback pointer before pair probing", async () => {
  rmSync(current); symlinkSync(root, current);
  await expect(checkVisualPages("http://127.0.0.1:3210", browser, "manager", [])).rejects.toThrow();
  expect(m.pair).not.toHaveBeenCalled(); expect(fetch).not.toHaveBeenCalled(); untouched();
});
it("requires the public pointer to identify this exact release", async () => {
  await expect(checkVisualPages("https://atlassystem.online", browser, "manager", [])).rejects.toThrow();
  expect(m.pair).not.toHaveBeenCalled(); expect(fetch).not.toHaveBeenCalled(); untouched();
});
it("a failing actual-own-loader pair cannot reach HTTP or fixtures", async () => {
  m.pair.mockImplementation(() => { throw new Error("Rollback reader is unsafe."); });
  await expect(checkVisualPages("http://127.0.0.1:3210", browser, "manager", [])).rejects.toThrow("unsafe");
  expect(m.pair).toHaveBeenCalledExactlyOnceWith(root, rollbackRoot, release);
  expect(fetch).not.toHaveBeenCalled(); untouched();
});
it("rejects pair evidence drift before target/fixture access", async () => {
  m.pair.mockReturnValue({ ...sealed(), features: [] });
  await expect(checkVisualPages("http://127.0.0.1:3210", browser, "manager", [])).rejects.toThrow();
  expect(fetch).not.toHaveBeenCalled(); untouched();
});
it("checks the actual HTTP revision before fixture access", async () => {
  vi.stubGlobal("fetch", vi.fn(async () => Response.json({ revision: rollback })));
  await expect(checkVisualPages("http://127.0.0.1:3210", browser, "manager", [])).rejects.toThrow("exact sealed compatible release");
  expect(m.pair).toHaveBeenCalledExactlyOnceWith(root, rollbackRoot, release);
  expect(fetch).toHaveBeenCalledExactlyOnceWith("http://127.0.0.1:3210/api/health/release"); untouched();
});
it("requires the existing authentication secret before fixture access", async () => {
  await expect(checkVisualPages("http://127.0.0.1:3210", browser, "manager", [])).rejects.toThrow();
  expect(fetch).toHaveBeenCalled(); untouched();
});
it("rejects a server-error entry or an unexpected sign-in destination before fixture access", async () => {
  for (const response of [new Response(null, { status: 500 }), new Response(null, { status: 307, headers: { location: "/home" } })]) {
    vi.stubGlobal("fetch", vi.fn(async (url: string) => url.endsWith("/design-studio") ? response : Response.json({ revision: release })));
    await expect(checkVisualPages("http://127.0.0.1:3210", browser, "manager", [])).rejects.toThrow();
    untouched();
  }
});
it.each(["", "relative/evidence", "other-release"])("requires the original private release evidence directory: %s", async path => {
  vi.stubEnv("SESSION_SECRET", "s".repeat(32));
  const directory = path === "other-release" ? fixture : path; vi.stubEnv("ATLAS_STUDIO_EVIDENCE", directory);
  await expect(checkVisualPages("http://127.0.0.1:3210", browser, "manager", [])).rejects.toThrow(); untouched();
});
it.each(["missing", "wrong", "malformed", "symlink", "public"])("rejects an unbound evidence marker before fixtures: %s", async kind => {
  vi.stubEnv("SESSION_SECRET", "s".repeat(32)); vi.stubEnv("ATLAS_STUDIO_EVIDENCE", output);
  const marker = join(output, ".atlas-release-revision");
  if (kind === "missing") rmSync(marker);
  if (kind === "wrong") writeFileSync(marker, `${rollback}\n`);
  if (kind === "malformed") writeFileSync(marker, release);
  if (kind === "public") chmodSync(marker, 0o644);
  if (kind === "symlink") { rmSync(marker); const target = join(fixture, "copied-marker"); writeFileSync(target, `${release}\n`, { mode: 0o600 }); symlinkSync(target, marker); }
  await expect(checkVisualPages("http://127.0.0.1:3210", browser, "manager", [])).rejects.toThrow(); untouched();
});
it("a valid prefix reaches only the deliberately denied original identity query, never a browser or a pass", async () => {
  vi.stubEnv("SESSION_SECRET", "s".repeat(32)); vi.stubEnv("ATLAS_STUDIO_EVIDENCE", output);
  const log = vi.spyOn(console, "log").mockImplementation(() => undefined), cleanup: string[] = [];
  await expect(checkVisualPages("http://127.0.0.1:3210", browser, "manager", cleanup)).rejects.toThrow("fixture access is forbidden");
  expect(m.database).toHaveBeenCalledExactlyOnceWith({ where: { id: "manager", platformAdmin: null,
    email: { startsWith: "studio-check-", endsWith: "@example.test" } }, select: { id: true, name: true, email: true, authVersion: true, createdAt: true, updatedAt: true } });
  expect(m.browser).not.toHaveBeenCalled(); expect(log).not.toHaveBeenCalled(); expect(cleanup).toEqual([]);
});
