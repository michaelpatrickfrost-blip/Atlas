import { beforeEach, describe, expect, it, vi } from "vitest";
const state = vi.hoisted(() => ({ session: { userId: "staff", capabilities: new Set<string>() }, update: vi.fn(), find: vi.fn(), queue: vi.fn() }));
vi.mock("@/core/auth/session", () => ({ requireSession: async () => state.session, getSession: async () => state.session }));
vi.mock("@/core/db/client", () => ({ db: { guardianIssue: { update: state.update, findUnique: state.find } } }));
vi.mock("@/core/guardian/store", () => ({ queueSweep: state.queue }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("next/navigation", () => ({ redirect: vi.fn() }));
import { updateGuardianIssue, requestGuardianSweep } from "@/app/(app)/atlas/guardian/actions";
import { GET } from "@/app/api/atlas/guardian/[issueId]/brief/route";
function form(status = "FIXED") { const f = new FormData(); for (const [key, value] of Object.entries({ id: "issue", status, resolution: "", verifiedRevision: "" })) f.set(key, value); return f; }
beforeEach(() => { vi.clearAllMocks(); state.session.capabilities = new Set(); });
describe("Atlas-only Guardian", () => {
  it("rejects a customer administrator before any report read or mutation", async () => {
    state.session.capabilities.add("core.users.manage");
    await expect(requestGuardianSweep()).rejects.toThrow("FORBIDDEN");
    await expect(updateGuardianIssue(form())).rejects.toThrow("FORBIDDEN");
    expect((await GET(new Request("https://atlas.test/"), { params: Promise.resolve({ issueId: "issue" }) })).status).toBe(403);
    expect(state.find).not.toHaveBeenCalled(); expect(state.update).not.toHaveBeenCalled(); expect(state.queue).not.toHaveBeenCalled();
  });
  it("requires evidence and a deployed revision before marking fixed", async () => {
    state.session.capabilities.add("atlas.companies.manage");
    await expect(updateGuardianIssue(form())).rejects.toThrow("deployed revision");
    expect(state.update).not.toHaveBeenCalled();
  });
  it("requires actionable context before requesting AI repair", async () => {
    state.session.capabilities.add("atlas.companies.manage");
    await expect(updateGuardianIssue(form("NEEDS_AI"))).rejects.toThrow("blocker and next action");
    expect(state.update).not.toHaveBeenCalled();
  });
  it("writes verified repair progress for staff", async () => {
    state.session.capabilities.add("atlas.companies.manage");
    const f = form(); f.set("resolution", "Original reproduction passed live."); f.set("verifiedRevision", "abc123");
    await updateGuardianIssue(f);
    expect(state.update).toHaveBeenCalledWith({ where: { id: "issue" }, data: { status: "FIXED", resolution: "Original reproduction passed live.", verifiedRevision: "abc123", reviewedBy: "staff" } });
  });
  it("downloads only private uncached briefs", async () => {
    state.session.capabilities.add("atlas.companies.manage"); state.find.mockResolvedValue({ brief: "Repair instructions", status: "NEEDS_AI", resolution: "Missing authorised fixture. Next: build a disposable central QA company.", verifiedRevision: null });
    const result = await GET(new Request("https://atlas.test/"), { params: Promise.resolve({ issueId: "issue" }) });
    expect(result.status).toBe(200); expect(result.headers.get("Cache-Control")).toBe("private, no-store"); const brief = await result.text(); expect(brief).toContain("Repair instructions"); expect(brief).toContain("Status: NEEDS_AI"); expect(brief).toContain("Next: build a disposable central QA company.");
  });
});
