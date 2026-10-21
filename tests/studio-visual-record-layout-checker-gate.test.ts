import { mkdtempSync, mkdirSync, realpathSync, rmSync, symlinkSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import type { Page } from "@playwright/test";
import { STUDIO_CAPABILITIES } from "@/core/studio/permissions";
const m = vi.hoisted(() => ({ evidence: vi.fn(), pair: vi.fn(), database: vi.fn(), browser: vi.fn(), session: vi.fn(), call: vi.fn() }));
vi.mock("@/core/db/client", () => ({ db: new Proxy({}, { get: () => new Proxy({}, { get: () => m.database }) }) }));
vi.mock("@/core/studio/runtime-features", () => ({ STUDIO_PAGE_FEATURE: "structuredPages.v1", STUDIO_PROFILE_FEATURE: "recordProfiles.v1",
  STUDIO_RECORD_TYPE_FORM_FEATURE: "recordTypeForms.v1", readStudioRuntimeFeatureEvidence: m.evidence }));
vi.mock("../scripts/studio/runtime-feature-probe", () => ({ verifyStudioRuntimeFeaturePair: m.pair }));
vi.mock("@/core/studio/pages/record-default", () => ({ readRecordDefaultCustomerPage: vi.fn() }));
import { checkVisualRecordLayouts, type VisualRecordLayoutFixture } from "../scripts/studio/check-visual-record-layouts";
const platform = Object.getOwnPropertyDescriptor(process, "platform")!, release = "a".repeat(40), rollback = "b".repeat(40);
const features = ["structuredPages.v1", "recordProfiles.v1", "recordTypeForms.v1"];
const sealed = () => ({ schemaVersion: 1, releaseRevision: release, rollbackRevision: rollback, features });
const page = new Proxy({}, { get: () => m.browser }) as Page;
const fixture: VisualRecordLayoutFixture = { organisationId: "company", slug: "studio-check-visual-owned", userId: "actor", membershipId: "member",
  foreignOrganisationId: "other-company", grantedCapabilities: ["tickets.ticket.read", "tickets.ticket.manage", "tickets.ticket.create", "tickets.queue.manage",
    STUDIO_CAPABILITIES.read, STUDIO_CAPABILITIES.edit, STUDIO_CAPABILITIES.publish], freshSession: m.session, call: m.call };
let directory: string, root: string, previous: string, current: string;
// These cases prove pre-fixture deny/defer ordering only; NO real browser,
// Session, SQL, record type, receipt or published layout acceptance is inferred.
beforeEach(() => {
  vi.clearAllMocks(); Object.defineProperty(process, "platform", { ...platform, value: "linux" });
  vi.stubEnv("ATLAS_STUDIO_LIVE_TEST", "1"); vi.stubEnv("ATLAS_RELEASE_REVISION", release);
  directory = realpathSync(mkdtempSync(join(tmpdir(), "studio-layout-gate-")));
  root = join(directory, "atlas-releases", release); previous = join(directory, "atlas-releases", rollback); current = join(directory, "atlas-current");
  mkdirSync(root, { recursive: true }); mkdirSync(previous, { recursive: true }); symlinkSync(previous, current);
  vi.spyOn(process, "cwd").mockReturnValue(root); m.evidence.mockReturnValue(sealed()); m.pair.mockReturnValue(sealed());
  vi.stubGlobal("fetch", vi.fn(async () => Response.json({ revision: release })));
  m.database.mockImplementation(() => { throw new Error("No central fixture permitted in local gate tests."); });
});
afterEach(() => { Object.defineProperty(process, "platform", platform); vi.unstubAllEnvs(); vi.unstubAllGlobals(); vi.restoreAllMocks(); rmSync(directory, { recursive: true, force: true }); });
const untouched = () => { expect(m.database).not.toHaveBeenCalled(); expect(m.browser).not.toHaveBeenCalled(); expect(m.session).not.toHaveBeenCalled(); expect(m.call).not.toHaveBeenCalled(); };
it.each([null, { features: [] }, { features: ["structuredPages.v1"] }, { features: ["structuredPages.v1", "recordProfiles.v1"] },
  { features: ["recordProfiles.v1", "recordTypeForms.v1"] }])("defers incomplete actual compatibility before all fixture/browser/session access: %j", async evidence => {
  m.evidence.mockReturnValue(evidence); const log = vi.spyOn(console, "log").mockImplementation(() => undefined);
  expect(await checkVisualRecordLayouts("http://127.0.0.1:3210", page, fixture)).toBeNull();
  expect(log).toHaveBeenCalledWith(expect.stringMatching(/^DEFERRED visual record layouts:/));
  expect(m.pair).not.toHaveBeenCalled(); expect(fetch).not.toHaveBeenCalled(); untouched();
});
it.each(["https://other.example.test", "http://localhost:3210", "https://atlassystem.online/path"])("rejects unsafe target %s before even compatibility lookup", async base => {
  await expect(checkVisualRecordLayouts(base, page, fixture)).rejects.toThrow(); expect(m.evidence).not.toHaveBeenCalled(); untouched();
});
it.each(["ATLAS_STUDIO_LIVE_TEST", "ATLAS_RELEASE_REVISION"])("requires original driver/revision: %s", async key => {
  vi.stubEnv(key, "0"); await expect(checkVisualRecordLayouts("http://127.0.0.1:3210", page, fixture)).rejects.toThrow();
  expect(m.evidence).not.toHaveBeenCalled(); untouched();
});
it("does not turn malformed evidence into a deferred or passing outcome", async () => {
  m.evidence.mockImplementation(() => { throw new Error("Malformed immutable marker"); });
  await expect(checkVisualRecordLayouts("http://127.0.0.1:3210", page, fixture)).rejects.toThrow("Malformed"); untouched();
});
it("requires candidate current-pointer to identify its exact proposed rollback", async () => {
  rmSync(current); symlinkSync(root, current);
  await expect(checkVisualRecordLayouts("http://127.0.0.1:3210", page, fixture)).rejects.toThrow(); expect(m.pair).not.toHaveBeenCalled(); untouched();
});
it("requires exact public pointer before fixture access", async () => {
  await expect(checkVisualRecordLayouts("https://atlassystem.online", page, fixture)).rejects.toThrow(); expect(m.pair).not.toHaveBeenCalled(); untouched();
});
it.each(["failure", "drift"])("rejects actual pair %s before HTTP/fixture access", async mode => {
  if (mode === "failure") m.pair.mockImplementation(() => { throw new Error("Unsafe predecessor"); });
  else m.pair.mockReturnValue({ ...sealed(), features: ["structuredPages.v1"] });
  await expect(checkVisualRecordLayouts("http://127.0.0.1:3210", page, fixture)).rejects.toThrow(); expect(fetch).not.toHaveBeenCalled(); untouched();
});
it("checks actual HTTP revision before fixture access", async () => {
  vi.stubGlobal("fetch", vi.fn(async () => Response.json({ revision: rollback })));
  await expect(checkVisualRecordLayouts("http://127.0.0.1:3210", page, fixture)).rejects.toThrow("exact sealed compatible release"); untouched();
});
it.each(["same-tenant", "not-Test-prefix", "missing-create", "missing-queue"])("rejects unsafe fixture %s before database/browser access", async mode => {
  const supplied = { ...fixture, grantedCapabilities: [...fixture.grantedCapabilities] };
  if (mode === "same-tenant") supplied.foreignOrganisationId = fixture.organisationId;
  if (mode === "not-Test-prefix") supplied.slug = "customer-business";
  if (mode === "missing-create") supplied.grantedCapabilities = supplied.grantedCapabilities.filter(cap => cap !== "tickets.ticket.create");
  if (mode === "missing-queue") supplied.grantedCapabilities = supplied.grantedCapabilities.filter(cap => cap !== "tickets.queue.manage");
  await expect(checkVisualRecordLayouts("http://127.0.0.1:3210", page, supplied)).rejects.toThrow(); untouched();
});
it("a valid prefix reaches only deliberately denied actual Test-company validation and cannot claim PASS", async () => {
  const log = vi.spyOn(console, "log").mockImplementation(() => undefined);
  await expect(checkVisualRecordLayouts("http://127.0.0.1:3210", page, fixture)).rejects.toThrow("No central fixture");
  expect(m.database).toHaveBeenCalledExactlyOnceWith({ where: { id: "company", slug: fixture.slug, kind: "CUSTOMER", status: "ACTIVE", archivedAt: null, isTest: true } });
  expect(m.browser).not.toHaveBeenCalled(); expect(m.session).not.toHaveBeenCalled(); expect(m.call).not.toHaveBeenCalled(); expect(log).not.toHaveBeenCalled();
});
