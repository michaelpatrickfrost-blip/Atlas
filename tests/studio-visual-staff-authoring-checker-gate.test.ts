import { mkdtempSync, mkdirSync, realpathSync, rmSync, symlinkSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import type { Page } from "@playwright/test";
import type { Session } from "@/core/auth/session";

const m = vi.hoisted(() => ({ evidence: vi.fn(), pair: vi.fn(), database: vi.fn(), browser: vi.fn(), session: vi.fn(), stamp: vi.fn() }));
vi.mock("@/core/db/client", () => ({ db: new Proxy({}, { get: () => new Proxy({}, { get: () => m.database }) }) }));
vi.mock("@/core/auth/session", () => ({ sessionForUser: m.session, sessionAuthorityStamp: m.stamp }));
vi.mock("@/core/studio/runtime-features", () => ({ STUDIO_PAGE_FEATURE: "structuredPages.v1", STUDIO_ANALYTICS_VIEW_FEATURE: "analyticsBusinessViews.v1", readStudioRuntimeFeatureEvidence: m.evidence }));
vi.mock("../scripts/studio/runtime-feature-probe", () => ({ verifyStudioRuntimeFeaturePair: m.pair }));
import { checkVisualStaffAuthoring, type VisualStaffAuthoringFixture } from "../scripts/studio/check-visual-staff-authoring";

const platform = Object.getOwnPropertyDescriptor(process, "platform")!;
const release = "a".repeat(40), rollback = "b".repeat(40);
const sealed = () => ({ schemaVersion: 1, releaseRevision: release, rollbackRevision: rollback, features: ["structuredPages.v1", "analyticsBusinessViews.v1"] });
const page = new Proxy({}, { get: () => m.browser }) as Page;
// No fake Session is accepted as positive evidence. All locally valid prefixes
// deliberately stop at the actual-company guard, before principal resolution.
const fixture: VisualStaffAuthoringFixture = { staffActor: {} as Session, organisationId: "company", foreignOrganisationId: "other-company",
  slug: "studio-check-visual-owned", pageDefinitionId: "11111111-1111-4111-8111-111111111111",
  dashboardDefinitionId: "22222222-2222-4222-8222-222222222222", templateId: "existing-template", orderId: "existing-order",
  orderReference: "SO-00001", customerName: "Existing synthetic customer", freshCustomerSession: m.session };
let directory: string, root: string, current: string;
beforeEach(() => {
  vi.clearAllMocks(); Object.defineProperty(process, "platform", { ...platform, value: "linux" });
  vi.stubEnv("ATLAS_STUDIO_LIVE_TEST", "1"); vi.stubEnv("ATLAS_RELEASE_REVISION", release);
  directory = realpathSync(mkdtempSync(join(tmpdir(), "studio-staff-visual-gate-")));
  root = join(directory, "atlas-releases", release); const previous = join(directory, "atlas-releases", rollback); current = join(directory, "atlas-current");
  mkdirSync(root, { recursive: true }); mkdirSync(previous, { recursive: true }); symlinkSync(previous, current);
  vi.spyOn(process, "cwd").mockReturnValue(root); m.evidence.mockReturnValue(sealed()); m.pair.mockReturnValue(sealed());
  vi.stubGlobal("fetch", vi.fn(async () => Response.json({ revision: release })));
  m.database.mockImplementation(() => { throw new Error("No central fixture permitted in local gate tests."); });
});
afterEach(() => { Object.defineProperty(process, "platform", platform); vi.unstubAllEnvs(); vi.unstubAllGlobals(); vi.restoreAllMocks(); rmSync(directory, { recursive: true, force: true }); });
const untouched = () => { expect(m.database).not.toHaveBeenCalled(); expect(m.browser).not.toHaveBeenCalled(); expect(m.session).not.toHaveBeenCalled(); expect(m.stamp).not.toHaveBeenCalled(); };
it.each([null, { features: [] }, { features: ["structuredPages.v1"] }, { features: ["analyticsBusinessViews.v1"] }])("defers incomplete exact families before all collaborators: %j", async evidence => {
  m.evidence.mockReturnValue(evidence); const log = vi.spyOn(console, "log").mockImplementation(() => undefined);
  expect(await checkVisualStaffAuthoring("http://127.0.0.1:3210", page, page, fixture)).toBeNull();
  expect(log).toHaveBeenCalledWith(expect.stringMatching(/^DEFERRED staff visual authoring:/));
  expect(m.pair).not.toHaveBeenCalled(); expect(fetch).not.toHaveBeenCalled(); untouched();
});
it.each(["https://other.example.test", "http://localhost:3210", "https://atlassystem.online/path"])("rejects wrong target before evidence: %s", async base => {
  await expect(checkVisualStaffAuthoring(base, page, page, fixture)).rejects.toThrow(); expect(m.evidence).not.toHaveBeenCalled(); untouched();
});
it.each(["ATLAS_STUDIO_LIVE_TEST", "ATLAS_RELEASE_REVISION"])("requires original explicit driver and exact revision: %s", async key => {
  vi.stubEnv(key, "0"); await expect(checkVisualStaffAuthoring("http://127.0.0.1:3210", page, page, fixture)).rejects.toThrow();
  expect(m.evidence).not.toHaveBeenCalled(); untouched();
});
it("does not treat corrupt immutable evidence as defer or PASS", async () => {
  m.evidence.mockImplementation(() => { throw new Error("Corrupt immutable evidence"); });
  await expect(checkVisualStaffAuthoring("http://127.0.0.1:3210", page, page, fixture)).rejects.toThrow("Corrupt"); untouched();
});
it("rejects wrong candidate predecessor before pair/HTTP", async () => {
  rmSync(current); symlinkSync(root, current);
  await expect(checkVisualStaffAuthoring("http://127.0.0.1:3210", page, page, fixture)).rejects.toThrow(); expect(m.pair).not.toHaveBeenCalled(); expect(fetch).not.toHaveBeenCalled(); untouched();
});
it("rejects wrong public current pointer", async () => {
  await expect(checkVisualStaffAuthoring("https://atlassystem.online", page, page, fixture)).rejects.toThrow(); expect(m.pair).not.toHaveBeenCalled(); untouched();
});
it.each(["denied", "changed-families"])("requires independently verified exact family pair: %s", async mode => {
  if (mode === "denied") m.pair.mockImplementation(() => { throw new Error("Unsafe pair"); }); else m.pair.mockReturnValue({ ...sealed(), features: ["structuredPages.v1"] });
  await expect(checkVisualStaffAuthoring("http://127.0.0.1:3210", page, page, fixture)).rejects.toThrow(); expect(fetch).not.toHaveBeenCalled(); untouched();
});
it.each(["wrong-revision", "unhealthy"])("requires real exact HTTP health: %s", async mode => {
  vi.stubGlobal("fetch", vi.fn(async () => Response.json({ revision: mode === "wrong-revision" ? rollback : release }, { status: mode === "unhealthy" ? 503 : 200 })));
  await expect(checkVisualStaffAuthoring("http://127.0.0.1:3210", page, page, fixture)).rejects.toThrow(); untouched();
});
it.each(["same-tenant", "not-Test-prefix", "wrong-page-id", "wrong-dashboard-id", "missing-template", "missing-order"])("rejects unsafe original fixture before data: %s", async mode => {
  const supplied = { ...fixture };
  if (mode === "same-tenant") supplied.foreignOrganisationId = fixture.organisationId;
  if (mode === "not-Test-prefix") supplied.slug = "real-company";
  if (mode === "wrong-page-id") supplied.pageDefinitionId = "unknown";
  if (mode === "wrong-dashboard-id") supplied.dashboardDefinitionId = "unknown";
  if (mode === "missing-template") supplied.templateId = "";
  if (mode === "missing-order") supplied.orderId = "";
  await expect(checkVisualStaffAuthoring("http://127.0.0.1:3210", page, page, supplied)).rejects.toThrow(); untouched();
});
it("valid prefix reaches only actual Test-company guard, never local positive acceptance", async () => {
  const log = vi.spyOn(console, "log").mockImplementation(() => undefined);
  await expect(checkVisualStaffAuthoring("http://127.0.0.1:3210", page, page, fixture)).rejects.toThrow("No central fixture");
  expect(m.database).toHaveBeenCalledExactlyOnceWith({ where: { id: "company", slug: fixture.slug, kind: "CUSTOMER", status: "ACTIVE", archivedAt: null, isTest: true } });
  expect(m.browser).not.toHaveBeenCalled(); expect(m.session).not.toHaveBeenCalled(); expect(m.stamp).not.toHaveBeenCalled(); expect(log).not.toHaveBeenCalled();
});
it("a copied staff object without genuine authority stops after company metadata and before affiliation/browser access", async () => {
  m.database.mockResolvedValueOnce({ id: fixture.organisationId }).mockResolvedValueOnce({ id: fixture.foreignOrganisationId });
  m.stamp.mockReturnValue(undefined);
  await expect(checkVisualStaffAuthoring("http://127.0.0.1:3210", page, page, fixture)).rejects.toThrow("genuine original QA");
  expect(m.database).toHaveBeenCalledTimes(2); expect(m.stamp).toHaveBeenCalledExactlyOnceWith(fixture.staffActor);
  expect(m.session).not.toHaveBeenCalled(); expect(m.browser).not.toHaveBeenCalled();
});
it("a supplied genuine stamp still requires a current independent staff session before affiliations/browser access", async () => {
  m.database.mockResolvedValueOnce({ id: fixture.organisationId }).mockResolvedValueOnce({ id: fixture.foreignOrganisationId });
  const supplied = { ...fixture, staffActor: { userId: "qa", organisationId: "original-company" } as Session };
  m.stamp.mockReturnValue({ userId: "qa", organisationId: "original-company", membershipId: "original-member", authVersion: 1, sessionVersion: 1 });
  m.session.mockResolvedValue(null);
  await expect(checkVisualStaffAuthoring("http://127.0.0.1:3210", page, page, supplied)).rejects.toThrow();
  expect(m.database).toHaveBeenCalledTimes(2); expect(m.session).toHaveBeenCalledExactlyOnceWith("original-company", "qa");
  expect(m.browser).not.toHaveBeenCalled();
});
