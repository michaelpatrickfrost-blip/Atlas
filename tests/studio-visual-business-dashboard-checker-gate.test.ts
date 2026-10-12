import { mkdtempSync, mkdirSync, realpathSync, rmSync, symlinkSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import type { Page } from "@playwright/test";
import { STUDIO_CAPABILITIES } from "@/core/studio/permissions";
const m = vi.hoisted(() => ({ evidence: vi.fn(), pair: vi.fn(), database: vi.fn(), browser: vi.fn(), session: vi.fn() }));
vi.mock("@/core/db/client", () => ({ db: new Proxy({}, { get: () => new Proxy({}, { get: () => m.database }) }) }));
vi.mock("@/core/studio/runtime-features", () => ({ STUDIO_ANALYTICS_VIEW_FEATURE: "analyticsBusinessViews.v1", readStudioRuntimeFeatureEvidence: m.evidence }));
vi.mock("../scripts/studio/runtime-feature-probe", () => ({ verifyStudioRuntimeFeaturePair: m.pair }));
import { checkVisualBusinessDashboards, type VisualBusinessDashboardFixture } from "../scripts/studio/check-visual-business-dashboards";
const platform = Object.getOwnPropertyDescriptor(process, "platform")!;
const release = "a".repeat(40), rollback = "b".repeat(40), sealed = () => ({ schemaVersion: 1, releaseRevision: release,
  rollbackRevision: rollback, features: ["analyticsBusinessViews.v1"] });
const page = new Proxy({}, { get: () => m.browser }) as Page;
const fixture: VisualBusinessDashboardFixture = { organisationId: "company", slug: "studio-check-visual-owned", userId: "actor", membershipId: "member",
  foreignOrganisationId: "other-company", grantedCapabilities: ["analytics.dashboard.read", "analytics.dashboard.manage", "sales.order.read",
    STUDIO_CAPABILITIES.read, STUDIO_CAPABILITIES.edit, STUDIO_CAPABILITIES.publish], freshSession: m.session };
let directory: string, root: string, current: string;
// Boundary tests do NOT prove browser/SQL/permission/publication acceptance.
// Even the valid prefix deliberately fails before fixture access can continue.
beforeEach(() => {
  vi.clearAllMocks(); Object.defineProperty(process, "platform", { ...platform, value: "linux" });
  vi.stubEnv("ATLAS_STUDIO_LIVE_TEST", "1"); vi.stubEnv("ATLAS_RELEASE_REVISION", release);
  directory = realpathSync(mkdtempSync(join(tmpdir(), "studio-business-view-gate-")));
  root = join(directory, "atlas-releases", release); const previous = join(directory, "atlas-releases", rollback); current = join(directory, "atlas-current");
  mkdirSync(root, { recursive: true }); mkdirSync(previous, { recursive: true }); symlinkSync(previous, current);
  vi.spyOn(process, "cwd").mockReturnValue(root); m.evidence.mockReturnValue(sealed()); m.pair.mockReturnValue(sealed());
  vi.stubGlobal("fetch", vi.fn(async () => Response.json({ revision: release })));
  m.database.mockImplementation(() => { throw new Error("No central fixture permitted in local gate tests."); });
});
afterEach(() => { Object.defineProperty(process, "platform", platform); vi.unstubAllEnvs(); vi.unstubAllGlobals(); vi.restoreAllMocks(); rmSync(directory, { recursive: true, force: true }); });
const untouched = () => { expect(m.database).not.toHaveBeenCalled(); expect(m.browser).not.toHaveBeenCalled(); expect(m.session).not.toHaveBeenCalled(); };
it.each([null, { features: [] }, { features: ["structuredPages.v1"] }])("defers absent viewer pair before all fixture/browser/session access: %j", async evidence => {
  m.evidence.mockReturnValue(evidence); const log = vi.spyOn(console, "log").mockImplementation(() => undefined);
  expect(await checkVisualBusinessDashboards("http://127.0.0.1:3210", page, fixture)).toBeNull();
  expect(log).toHaveBeenCalledWith(expect.stringMatching(/^DEFERRED visual business dashboards:/));
  expect(m.pair).not.toHaveBeenCalled(); expect(fetch).not.toHaveBeenCalled(); untouched();
});
it.each(["https://other.example.test", "http://localhost:3210", "https://atlassystem.online/path"])("rejects unsafe target %s before compatibility lookup", async base => {
  await expect(checkVisualBusinessDashboards(base, page, fixture)).rejects.toThrow(); expect(m.evidence).not.toHaveBeenCalled(); untouched();
});
it.each(["ATLAS_STUDIO_LIVE_TEST", "ATLAS_RELEASE_REVISION"])("requires original driver/revision: %s", async key => {
  vi.stubEnv(key, "0"); await expect(checkVisualBusinessDashboards("http://127.0.0.1:3210", page, fixture)).rejects.toThrow();
  expect(m.evidence).not.toHaveBeenCalled(); untouched();
});
it("never turns malformed evidence into deferred or PASS", async () => {
  m.evidence.mockImplementation(() => { throw new Error("Malformed immutable marker"); });
  await expect(checkVisualBusinessDashboards("http://127.0.0.1:3210", page, fixture)).rejects.toThrow("Malformed"); untouched();
});
it("requires candidate pointer to exact declared rollback", async () => {
  rmSync(current); symlinkSync(root, current);
  await expect(checkVisualBusinessDashboards("http://127.0.0.1:3210", page, fixture)).rejects.toThrow(); expect(m.pair).not.toHaveBeenCalled(); untouched();
});
it("requires exact public pointer", async () => {
  await expect(checkVisualBusinessDashboards("https://atlassystem.online", page, fixture)).rejects.toThrow(); expect(m.pair).not.toHaveBeenCalled(); untouched();
});
it.each(["failure", "drift"])("rejects actual pair %s before HTTP/fixture access", async mode => {
  if (mode === "failure") m.pair.mockImplementation(() => { throw new Error("Unsafe predecessor"); }); else m.pair.mockReturnValue({ ...sealed(), features: [] });
  await expect(checkVisualBusinessDashboards("http://127.0.0.1:3210", page, fixture)).rejects.toThrow(); expect(fetch).not.toHaveBeenCalled(); untouched();
});
it.each(["wrong-revision", "http-error"])("checks actual HTTP %s before fixture access", async mode => {
  vi.stubGlobal("fetch", vi.fn(async () => Response.json({ revision: mode === "wrong-revision" ? rollback : release }, { status: mode === "http-error" ? 503 : 200 })));
  await expect(checkVisualBusinessDashboards("http://127.0.0.1:3210", page, fixture)).rejects.toThrow(); untouched();
});
it.each(["same-tenant", "not-Test-prefix", "missing-source", "missing-manage"])("rejects unsafe fixture %s before database/browser access", async mode => {
  const supplied = { ...fixture, grantedCapabilities: [...fixture.grantedCapabilities] };
  if (mode === "same-tenant") supplied.foreignOrganisationId = fixture.organisationId;
  if (mode === "not-Test-prefix") supplied.slug = "real-business";
  if (mode === "missing-source") supplied.grantedCapabilities = supplied.grantedCapabilities.filter(cap => cap !== "sales.order.read");
  if (mode === "missing-manage") supplied.grantedCapabilities = supplied.grantedCapabilities.filter(cap => cap !== "analytics.dashboard.manage");
  await expect(checkVisualBusinessDashboards("http://127.0.0.1:3210", page, supplied)).rejects.toThrow(); untouched();
});
it("a valid prefix reaches only denied actual Test-company validation and cannot claim PASS", async () => {
  const log = vi.spyOn(console, "log").mockImplementation(() => undefined);
  await expect(checkVisualBusinessDashboards("http://127.0.0.1:3210", page, fixture)).rejects.toThrow("No central fixture");
  expect(m.database).toHaveBeenCalledExactlyOnceWith({ where: { id: "company", slug: fixture.slug, kind: "CUSTOMER", status: "ACTIVE", archivedAt: null, isTest: true } });
  expect(m.browser).not.toHaveBeenCalled(); expect(m.session).not.toHaveBeenCalled(); expect(log).not.toHaveBeenCalled();
});
