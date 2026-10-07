import { beforeEach, describe, expect, it, vi } from "vitest";
const state = vi.hoisted(() => ({ upsert: vi.fn(), update: vi.fn(), transaction: vi.fn(), lock: vi.fn(), find: vi.fn(), create: vi.fn() }));
vi.mock("@/core/db/client", () => ({ db: { guardianIssue: { upsert: state.upsert, updateMany: state.update }, $transaction: state.transaction } }));
import { recordFinding, queueSweep } from "@/core/guardian/store";
const finding = { key: "page:/sales", title: "Page failure", kind: "PAGE_FAILURE", severity: "HIGH" as const, route: "/sales", expected: "Workspace", actual: "500", steps: ["Open Sales"], evidence: ["500"] };
beforeEach(() => { vi.clearAllMocks(); state.upsert.mockResolvedValue({ id: "issue", status: "OPEN" }); state.transaction.mockImplementation(fn => fn({ $executeRawUnsafe: state.lock, guardianRun: { findFirst: state.find, create: state.create } })); });
describe("Guardian persistence", () => {
  it("deduplicates occurrences without resetting triage and reopens verified failures on recurrence", async () => {
    await recordFinding(finding, "abc"); expect(state.upsert.mock.calls[0][0].update).not.toHaveProperty("status"); expect(state.update).not.toHaveBeenCalled();
    state.upsert.mockResolvedValue({ id: "issue", status: "FIXED" }); await recordFinding(finding, "def");
    expect(state.update).toHaveBeenCalledWith({ where: { id: "issue", status: "FIXED" }, data: { status: "OPEN", resolution: "Failure observed again after verification." } });
  });
  it("serializes repeated sweep clicks and reuses a pending run", async () => {
    state.find.mockResolvedValue({ id: "pending" }); expect(await queueSweep("staff")).toBe("pending"); expect(state.lock).toHaveBeenCalled(); expect(state.create).not.toHaveBeenCalled();
  });
});
