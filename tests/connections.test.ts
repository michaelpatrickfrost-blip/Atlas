import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { CONNECTION_TEMPLATES } from "@/modules/connections/domain/catalogue";
import { importFingerprint, signReview, verifyReview } from "@/modules/connections/domain/review";
import { parentLoopIssue } from "@/core/setup/validate";
import { parseCsv, csvText } from "@/core/shared/csv";
const mocks = vi.hoisted(() => ({ session: vi.fn(), company: vi.fn(), importer: vi.fn(), revalidate: vi.fn() }));
vi.mock("@/core/auth/session", () => ({ requireSession: mocks.session }));
vi.mock("@/core/db/client", () => ({ db: { organisation: { findFirst: mocks.company } } }));
vi.mock("@/modules/connections/services/import", () => ({ runConnectionImport: mocks.importer }));
vi.mock("next/cache", () => ({ revalidatePath: mocks.revalidate }));
import { attachConnection } from "@/app/(admin)/atlas/connections/actions";
import { importDay, salesGroupIssue } from "@/modules/sales/services/connection-import";
const empty = { error: "", message: "", token: "", preview: [] };
function form(mode = "preview", content = "code,name,kind,price,currency,taxCategory\nA,Widget,PRODUCT,1.00,GBP,STANDARD") {
  const data = new FormData(); data.set("organisationId", "company-a"); data.set("entity", "products"); data.set("mode", mode);
  data.set("file", new File([content], "products.csv", { type: "text/csv" })); return data;
}
beforeEach(() => { vi.stubEnv("SESSION_SECRET", "connections-test-secret-at-least-32-characters"); mocks.session.mockResolvedValue({ userId: "staff-1", capabilities: new Set(["atlas.companies.manage"]) }); mocks.company.mockResolvedValue({ id: "company-a", name: "Company A" }); mocks.importer.mockResolvedValue({ preview: [{ code: "A", name: "Widget" }] }); });
afterEach(() => { vi.clearAllMocks(); vi.unstubAllEnvs(); });
describe("Connections review boundary", () => {
  it("gives every downloadable template parseable examples and required columns", () => {
    for (const template of CONNECTION_TEMPLATES) { const rows = parseCsv(csvText([template.columns, template.example])); expect(rows).toHaveLength(1); for (const key of template.required) expect(rows[0][key]).toBeTruthy(); }
    expect(CONNECTION_TEMPLATES.map(template => template.id)).toContain("machines");
  });
  it("binds review to company, section, exact file, actor and expiry", () => {
    const fingerprint = importFingerprint("a", "products", "a,b\n1,2"), token = signReview(fingerprint, "staff", 1000);
    expect(() => verifyReview(token, fingerprint, "staff", 2000)).not.toThrow();
    for (const changed of [importFingerprint("b", "products", "a,b\n1,2"), importFingerprint("a", "machines", "a,b\n1,2"), importFingerprint("a", "products", "a,b\n1,3")]) expect(() => verifyReview(token, changed, "staff", 2000)).toThrow();
    expect(() => verifyReview(token, fingerprint, "other", 2000)).toThrow(); expect(() => verifyReview(token, fingerprint, "staff", 901001)).toThrow(); expect(() => verifyReview("bad", fingerprint, "staff")).toThrow();
  });
  it("rejects customer-only access before reading a target company", async () => {
    mocks.session.mockResolvedValue({ userId: "customer", capabilities: new Set(["customers.create"]) });
    await expect(attachConnection(empty, form())).rejects.toThrow("FORBIDDEN"); expect(mocks.company).not.toHaveBeenCalled(); expect(mocks.importer).not.toHaveBeenCalled();
  });
  it("validates first, then imports the identical reviewed file only with acknowledgement", async () => {
    const review = await attachConnection(empty, form()); expect(review.token).toBeTruthy(); expect(mocks.importer.mock.calls[0][0].applying).toBe(false);
    const applying = form("apply"); applying.set("token", review.token);
    expect((await attachConnection(empty, applying)).error).toMatch(/Confirm/);
    applying.set("acknowledge", "yes"); expect((await attachConnection(empty, applying)).message).toMatch(/Attached 1 rows to Company A/);
    expect(mocks.importer.mock.calls.at(-1)?.[0]).toMatchObject({ applying: true, organisationId: "company-a", actorUserId: "staff-1" });
  });
  it("rejects a company switch or tampered file after validation", async () => {
    const review = await attachConnection(empty, form()); mocks.importer.mockClear();
    const switched = form("apply"); switched.set("organisationId", "company-b"); switched.set("token", review.token); switched.set("acknowledge", "yes");
    expect((await attachConnection(empty, switched)).error).toMatch(/Validate/);
    const changed = form("apply", "code,name\nB,Changed"); changed.set("token", review.token); changed.set("acknowledge", "yes"); expect((await attachConnection(empty, changed)).error).toMatch(/Validate/); expect(mocks.importer).not.toHaveBeenCalled();
  });
  it("rejects archived/missing companies, empty files and malformed CSV without importing", async () => {
    mocks.company.mockResolvedValueOnce(null); expect((await attachConnection(empty, form())).error).toMatch(/unavailable/);
    expect((await attachConnection(empty, form("preview", ""))).error).toMatch(/CSV/);
    expect((await attachConnection(empty, form("preview", "code,name\nA"))).error).toMatch(/expected 2 columns/); expect(mocks.importer).not.toHaveBeenCalled();
  });
  it("keeps file failures recoverable and gives no successful review", async () => {
    mocks.importer.mockRejectedValueOnce(new Error("Row 3: missing parent")); const result = await attachConnection(empty, form()); expect(result).toMatchObject({ token: "", preview: [], error: "Row 3: missing parent" });
  });
});
describe("Sales import validation", () => {
  it("rejects inconsistent multi-line customer/date/notes groups", () => {
    expect(salesGroupIssue([{ reference: "SO1", customerCode: "A" }, { reference: "SO1", customerCode: "B" }])).toMatch(/same customer/);
    expect(salesGroupIssue([{ reference: "SO1", customerCode: "A", notes: "One" }, { reference: "SO1", customerCode: "A", notes: "Two" }])).toMatch(/same customer/);
    expect(salesGroupIssue([{ reference: "SO1", customerCode: "A" }, { reference: "SO1", customerCode: "A" }])).toBeNull();
  });
  it("rejects rollover dates rather than silently changing delivery dates", () => {
    expect(() => importDay("2026-02-31", 0)).toThrow(/real date/); expect(importDay("2028-02-29", 0).toISOString()).toBe("2028-02-29T00:00:00.000Z");
  });
});

describe("Existing hierarchy updates", () => {
  it("detects a cycle through a saved parent outside the uploaded file", () => {
    const saved = new Map([["A", ""], ["B", "A"]]);
    expect(parentLoopIssue([{ code: "A", parent: "B" }], new Set(["A", "B"]), new Map([["A", 0]]), saved)).toMatch(/circular/);
    expect(parentLoopIssue([{ code: "B", parent: "A" }], new Set(["A", "B"]), new Map([["B", 0]]), saved)).toBeNull();
  });
});
