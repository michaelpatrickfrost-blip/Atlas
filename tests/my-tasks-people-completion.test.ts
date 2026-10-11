import { beforeEach, expect, it, vi } from "vitest";
import type { Session } from "@/core/auth/session";
import { HR_CAPABILITIES as HR } from "@/core/permissions/capabilities";
const mocks = vi.hoisted(() => ({ find: vi.fn(), update: vi.fn(), audit: vi.fn(), transaction: vi.fn() }));
vi.mock("@/core/db/client", () => ({ db: { $transaction: mocks.transaction } }));
import { completeAssignedEmployeeTask } from "@/modules/people/services/assigned-tasks";
const session = { organisationId: "our-company", userId: "me", capabilities: new Set([HR.onboardingManage]) } as unknown as Session;
beforeEach(() => {
  vi.clearAllMocks(); mocks.find.mockResolvedValue({ id: "mine", phase: "ONBOARDING", completedAt: null }); mocks.update.mockResolvedValue({ count: 1 }); mocks.audit.mockResolvedValue({});
  mocks.transaction.mockImplementation(async (callback) => callback({ employeeTask: { findFirst: mocks.find, updateMany: mocks.update }, auditEntry: { create: mocks.audit } }));
});
it("completes only the current user's still-open assignment and records audit in the same serializable transaction", async () => {
  await completeAssignedEmployeeTask(session, "mine");
  expect(mocks.find.mock.calls[0][0].where).toEqual({ id: "mine", organisationId: "our-company", assignedToUserId: "me" });
  expect(mocks.update.mock.calls[0][0].where).toEqual({ id: "mine", organisationId: "our-company", assignedToUserId: "me", completedAt: null });
  expect(mocks.audit).toHaveBeenCalledOnce(); expect(mocks.transaction.mock.calls[0][1]).toEqual({ isolationLevel: "Serializable" });
});
it("requires the correct source phase capability even when the task is assigned", async () => {
  mocks.find.mockResolvedValue({ id: "mine", phase: "OFFBOARDING", completedAt: null });
  await expect(completeAssignedEmployeeTask(session, "mine")).rejects.toThrow(); expect(mocks.update).not.toHaveBeenCalled(); expect(mocks.audit).not.toHaveBeenCalled();
});
it("rejects reassigned or concurrently completed tasks without creating a false audit", async () => {
  mocks.update.mockResolvedValue({ count: 0 });
  await expect(completeAssignedEmployeeTask(session, "mine")).rejects.toThrow("changed"); expect(mocks.audit).not.toHaveBeenCalled();
  mocks.find.mockResolvedValue(null); await expect(completeAssignedEmployeeTask(session, "mine")).rejects.toThrow("no longer available");
});
