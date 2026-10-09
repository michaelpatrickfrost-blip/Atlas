import { beforeEach, describe, expect, it, vi } from "vitest";
const state = vi.hoisted(() => ({ session: { userId: "staff", organisationId: "internal", capabilities: new Set<string>() }, user: vi.fn(), wipe: vi.fn(), retry: vi.fn() }));
vi.mock("@/core/auth/session", () => ({ requireSession: async () => state.session }));
vi.mock("@/core/db/client", () => ({ db: { user: { findUniqueOrThrow: state.user } } }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("bcryptjs", () => ({ default: { compare: async (password: string) => password === "correct-password" } }));
vi.mock("@/core/admin/wipe-company", () => ({ wipeTestCompanies: state.wipe, finishCompanyFileCleanup: state.retry }));
import { cleanupConfirmation, readCleanupSelection, CleanupValidationError } from "@/core/admin/cleanup-input";
import { deleteSelectedTestCompanies, retryCompanyFileCleanup } from "@/app/(admin)/atlas/cleanup/actions";
const selection = [{ id: "test-a", name: "Test A", updatedAt: "2026-10-08T10:00:00.000Z" }, { id: "test-b", name: "Test B", updatedAt: "2026-10-08T10:00:00.000Z" }];
function form(extra: Record<string, string> = {}) { const result = new FormData(); for (const [key, value] of Object.entries({ selectedCompanies: JSON.stringify(selection), confirmation: cleanupConfirmation(2), acknowledge: "on", currentPassword: "correct-password", ...extra })) result.set(key, value); return result; }
beforeEach(() => { vi.clearAllMocks(); state.session.capabilities = new Set(["atlas.companies.archive"]); state.user.mockResolvedValue({ passwordHash: "hash" }); state.wipe.mockResolvedValue({ id: "run-a", remainingFileKeys: [] }); });
describe("bulk company cleanup boundary", () => {
  it("rejects customer permissions before any database access", async () => { state.session.capabilities = new Set(["core.users.manage"]); await expect(deleteSelectedTestCompanies(form())).rejects.toThrow("FORBIDDEN"); await expect(retryCompanyFileCleanup(form({ runId: "run-a" }))).rejects.toThrow("FORBIDDEN"); expect(state.user).not.toHaveBeenCalled(); expect(state.wipe).not.toHaveBeenCalled(); });
  it("rejects malformed, duplicate and empty selections", () => { for (const raw of ["bad", "[]", JSON.stringify([selection[0], selection[0]]), JSON.stringify([{ ...selection[0], id: 'bad";DROP' }])]) expect(() => readCleanupSelection(raw)).toThrow(CleanupValidationError); });
  it("requires the exact phrase and explicit acknowledgement", async () => { expect(await deleteSelectedTestCompanies(form({ confirmation: "DELETE EVERYTHING" }))).toMatchObject({ error: expect.stringContaining("confirmation") }); expect(await deleteSelectedTestCompanies(form({ acknowledge: "" }))).toHaveProperty("error"); expect(state.wipe).not.toHaveBeenCalled(); });
  it("rejects the wrong administrator password without deleting anything", async () => { expect(await deleteSelectedTestCompanies(form({ currentPassword: "wrong" }))).toMatchObject({ error: expect.stringContaining("password was not recognised") }); expect(state.wipe).not.toHaveBeenCalled(); });
  it("passes only the reviewed selection and signed identity to one atomic sweep", async () => { expect(await deleteSelectedTestCompanies(form())).toEqual({ runId: "run-a", deleted: 2, filesPending: 0 }); expect(state.wipe).toHaveBeenCalledExactlyOnceWith(["test-a", "test-b"], { actorUserId: "staff", currentOrganisationId: "internal", selection }); });
  it("returns stale-selection errors without masking their explanation", async () => { state.wipe.mockRejectedValueOnce(new CleanupValidationError("The company list changed.")); expect(await deleteSelectedTestCompanies(form())).toEqual({ error: "The company list changed." }); });
  it("reports pending attachments rather than claiming complete cleanup", async () => { state.wipe.mockResolvedValueOnce({ id: "run-a", remainingFileKeys: ["key"] }); expect(await deleteSelectedTestCompanies(form())).toEqual({ runId: "run-a", deleted: 2, filesPending: 1 }); });
});
