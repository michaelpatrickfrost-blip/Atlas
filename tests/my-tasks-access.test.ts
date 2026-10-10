import { expect, it, vi, beforeEach } from "vitest";
import type { Session } from "@/core/auth/session";
const mocks = vi.hoisted(() => ({ task: vi.fn(), employee: vi.fn(), users: vi.fn().mockResolvedValue([]), transaction: vi.fn() }));
vi.mock("@/core/db/client", () => ({ db: { projectTask: { findFirst: mocks.task }, employeeTask: { findFirst: mocks.employee }, user: { findMany: mocks.users }, $transaction: mocks.transaction } }));
import { assignedProjectTask, assignedTaskScope } from "@/modules/projects/services/assigned-tasks";
import { assignedEmployeeTask } from "@/modules/people/services/assigned-tasks";
import { taskScope } from "@/core/permissions/work-access";
const session = { organisationId: "our-company", userId: "me", capabilities: new Set(["projects.read"]), teamIds: [] } as unknown as Session;
beforeEach(() => vi.clearAllMocks());
it("intersects assignment with native tenant/project visibility rather than treating assignment as access", () => {
  expect(assignedTaskScope(session)).toEqual({ AND: [taskScope(session), { OR: [{ assigneeUserId: "me" }, { contributorUserIds: { has: "me" } }] }] });
});
it("refuses task details when native visibility has been revoked", async () => {
  mocks.task.mockResolvedValue(null);
  await expect(assignedProjectTask(session, "restricted", new Set(["projects"]))).rejects.toThrow("no longer available");
  expect(mocks.task.mock.calls[0][0].where).toEqual({ AND: [assignedTaskScope(session), { id: "restricted" }] });
});
it("keeps project assignments read-only without the native manage capability", async () => {
  mocks.task.mockResolvedValue({ id: "mine", title: "Mine", project: null, taskType: "TASK", creatorUserId: "me", assigneeUserId: "me", status: "TODO", priority: "NORMAL", dueAt: null, description: "notes", version: 1, comments: [], checklist: [], workLinks: [] });
  expect((await assignedProjectTask(session, "mine", new Set(["projects"]))).editable).toBe(false);
});
it("scopes employee assignments to both the signed-in user and company", async () => {
  mocks.employee.mockResolvedValue(null);
  await expect(assignedEmployeeTask(session, "other-company-task")).rejects.toThrow("no longer available");
  expect(mocks.employee.mock.calls[0][0].where).toEqual({ id: "other-company-task", organisationId: "our-company", assignedToUserId: "me" });
});
