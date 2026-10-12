import { afterEach, beforeEach, expect, it, vi } from "vitest";
import type { Page } from "@playwright/test";
import type { Session } from "@/core/auth/session";
const m = vi.hoisted(() => ({ evidence: vi.fn(), database: vi.fn(), browser: vi.fn(), session: vi.fn(), stamp: vi.fn() }));
vi.mock("@/core/db/client", () => ({ db: new Proxy({}, { get: () => new Proxy({}, { get: () => m.database }) }) }));
vi.mock("@/core/auth/session", () => ({ sessionAuthorityStamp: m.stamp }));
vi.mock("@/core/studio/runtime-features", () => ({ STUDIO_PAGE_FEATURE: "structuredPages.v1", readStudioRuntimeFeatureEvidence: m.evidence }));
vi.mock("@/core/templates/authoring", () => ({ saveTemplateForSession: vi.fn() }));
vi.mock("@/core/templates/service", () => ({ renderTemplate: vi.fn() }));
import { checkVisualDocuments, type VisualDocumentFixture } from "../scripts/studio/check-visual-documents";
const platform = Object.getOwnPropertyDescriptor(process, "platform")!;
const page = new Proxy({}, { get: () => m.browser }) as Page;
const fixture: VisualDocumentFixture = { organisationId: "company", foreignOrganisationId: "foreign", orderId: "order", orderReference: "ORD-1",
  customerName: "Exact synthetic customer", membershipId: "member", grantedCapabilities: ["core.contract.manage", "sales.order.read"], freshSession: m.session };
const session = () => ({ userId: "actor", organisationId: "company", membershipId: "member", capabilities: new Set(fixture.grantedCapabilities) } as Session);
// Prefix tests intentionally stop before any positive browser/SQL acceptance.
beforeEach(() => { vi.clearAllMocks(); Object.defineProperty(process, "platform", { ...platform, value: "linux" });
  vi.stubEnv("ATLAS_STUDIO_LIVE_TEST", "1"); vi.stubEnv("ATLAS_RELEASE_REVISION", "a".repeat(40));
  m.evidence.mockReturnValue({ features: ["structuredPages.v1"] }); m.stamp.mockReturnValue({}); m.session.mockResolvedValue(session());
  m.database.mockImplementation(() => { throw new Error("No central fixture in prefix tests."); }); });
afterEach(() => { Object.defineProperty(process, "platform", platform); vi.unstubAllEnvs(); vi.restoreAllMocks(); });
it.each([null, { features: [] }, { features: ["literalFieldDefaults.v1"] }])("disabled original visual pair defers before fixture/session/browser %j", async evidence => {
  m.evidence.mockReturnValue(evidence); const output = vi.spyOn(console, "log").mockImplementation(() => undefined);
  await checkVisualDocuments("http://127.0.0.1:3210", page, fixture);
  expect(output).toHaveBeenCalledWith(expect.stringMatching(/^DEFERRED document visual journey:/));
  expect(m.database).not.toHaveBeenCalled(); expect(m.session).not.toHaveBeenCalled(); expect(m.browser).not.toHaveBeenCalled();
});
it.each(["https://other.test", "https://atlassystem.online/path", "http://localhost:3210"])("unsafe target %s fails before any fixture", async base => {
  await expect(checkVisualDocuments(base, page, fixture)).rejects.toThrow(); expect(m.evidence).not.toHaveBeenCalled(); expect(m.database).not.toHaveBeenCalled();
});
it.each(["ATLAS_STUDIO_LIVE_TEST", "ATLAS_RELEASE_REVISION"])("original explicit gate %s mandatory", async key => {
  vi.stubEnv(key, "0"); await expect(checkVisualDocuments("http://127.0.0.1:3210", page, fixture)).rejects.toThrow();
  expect(m.evidence).not.toHaveBeenCalled(); expect(m.database).not.toHaveBeenCalled();
});
it.each(["same-tenant", "forged", "foreign-session", "platform-staff", "missing-manage", "missing-source"])("unsafe fixture %s fails before protected data", async mode => {
  const supplied = { ...fixture }, current = session();
  if (mode === "same-tenant") supplied.foreignOrganisationId = supplied.organisationId;
  if (mode === "forged") m.stamp.mockReturnValue(null);
  if (mode === "foreign-session") current.organisationId = "foreign";
  if (mode === "platform-staff") current.capabilities.add("atlas.staff");
  if (mode === "missing-manage") current.capabilities.delete("core.contract.manage");
  if (mode === "missing-source") current.capabilities.delete("sales.order.read");
  m.session.mockResolvedValue(current); await expect(checkVisualDocuments("http://127.0.0.1:3210", page, supplied)).rejects.toThrow();
  expect(m.database).not.toHaveBeenCalled(); expect(m.browser).not.toHaveBeenCalled();
});
it("valid prefix reaches only actual Test-company check then stops, never fabricates PASS", async () => {
  const output = vi.spyOn(console, "log").mockImplementation(() => undefined);
  await expect(checkVisualDocuments("http://127.0.0.1:3210", page, fixture)).rejects.toThrow("No central fixture");
  expect(m.database).toHaveBeenCalledExactlyOnceWith({ where: { id: "company", kind: "CUSTOMER", isTest: true, status: "ACTIVE", archivedAt: null, slug: { startsWith: "studio-check-visual-" } }, select: { id: true } });
  expect(m.browser).not.toHaveBeenCalled(); expect(output).not.toHaveBeenCalled();
});
