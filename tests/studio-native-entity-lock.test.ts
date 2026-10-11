import { beforeEach, expect, it, vi } from "vitest";
const m = vi.hoisted(() => ({ session: { organisationId: "company", userId: "actor", capabilities: new Set<string>() }, raw: vi.fn(), transaction: vi.fn(),
  work: vi.fn(), queue: vi.fn(), case: vi.fn(), workUpdate: vi.fn(), caseUpdate: vi.fn(), ticketUpdate: vi.fn(), entry: vi.fn(), audit: vi.fn(),
  outbox: vi.fn(), caseDirect: vi.fn(), activity: vi.fn(), queueMember: vi.fn(), approval: vi.fn() }));
vi.mock("@/core/auth/session", () => ({ requireSession: async () => m.session }));
vi.mock("@/core/db/client", () => ({ db: { $transaction: m.transaction } }));
vi.mock("@/core/modules/runtime", () => ({ isModuleEnabled: async () => true }));
vi.mock("@/core/approvals/service", () => ({ createApproval: m.approval, decideApproval: m.approval }));
vi.mock("@/modules/service/services/queries", () => ({ requireService: async () => {}, configuredCaseTypes: async () => [] }));
vi.mock("@/core/service-work/connections", () => ({ prepareServiceCredit: vi.fn(), prepareServiceOperation: vi.fn(), triggerCaseSurvey: vi.fn() }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("next/navigation", () => ({ redirect: vi.fn() }));
import { createWork, updateWork, commentWork, watchWork, mergeWork, requestWorkApproval, decideWorkApproval, saveDeskQueue, changeDeskMember } from "@/core/service-work/actions";
import { mergeCases } from "@/modules/service/services/commands";
const tx = { $queryRaw: m.raw, serviceWorkItem: { findFirst: m.work, updateMany: m.workUpdate }, serviceQueue: { findFirst: m.queue, findFirstOrThrow: m.queue },
  serviceCase: { findFirst: m.case, updateMany: m.caseUpdate, update: m.caseDirect }, serviceTicket: { updateMany: m.ticketUpdate },
  serviceQueueMember: { findFirst: m.queueMember }, serviceWorkEntry: { create: m.entry }, serviceEntry: { create: m.entry }, auditEntry: { create: m.audit }, domainOutbox: { create: m.outbox }, activity: { create: m.activity } };
const form = (values: Record<string, string> = {}) => { const f = new FormData(); for (const [key, value] of Object.entries({ workId: "work", version: "1", kind: "TICKET", queueId: "queue", userId: "other", name: "Queue", department: "Team", ...values })) f.set(key, value); return f; };
beforeEach(() => {
  vi.resetAllMocks(); m.session.capabilities = new Set(["core.profile.self", "tickets.ticket.read", "tickets.ticket.create", "tickets.ticket.manage", "tickets.ticket.reply", "tickets.ticket.watch", "tickets.queue.manage", "service.ticket.read", "service.ticket.create", "service.ticket.update", "service.case.assign"]);
  m.transaction.mockImplementation(async operation => operation(tx)); m.raw.mockResolvedValue([]);
});
function assertLockBefore(operation: ReturnType<typeof vi.fn>) {
  expect(m.raw).toHaveBeenCalledExactlyOnceWith(expect.any(Array), JSON.stringify(["company", "tickets.ticket"]));
  expect((m.raw.mock.calls[0][0] as TemplateStringsArray).join("")).toContain("pg_advisory_xact_lock(hashtextextended(");
  expect(m.raw.mock.invocationCallOrder[0]).toBeLessThan(operation.mock.invocationCallOrder[0]);
}
// Real SQL helper and native action entry points; fixture DB methods stop before
// business mutation. This establishes ordering, not actual PostgreSQL concurrency.
it.each([
  ["create Ticket", createWork, m.queue, { kind: "TICKET" }], ["create Query", createWork, m.queue, { kind: "QUERY" }],
  ["watch", watchWork, m.work, {}], ["merge work", mergeWork, m.work, {}], ["request approval", requestWorkApproval, m.work, {}],
  ["decide approval", decideWorkApproval, m.work, {}], ["save queue", saveDeskQueue, m.queue, {}], ["change queue member", changeDeskMember, m.queue, {}],
] as const)("locks before the first protected %s operation, including Query paths affecting Ticket parents", async (_name, action, stop, input) => {
  stop.mockRejectedValue(new Error("Reached protected operation")); await expect(action(form(input))).rejects.toThrow("Reached protected operation");
  assertLockBefore(stop); expect(m.workUpdate).not.toHaveBeenCalled();
});
it.each(["TICKET", "QUERY"] as const)("checks accessible %s owner permission before locking and locks before private/receiving-team checks", async kind => {
  const work = { id: "work", organisationId: "company", kind, queueId: "queue", mergedIntoId: null };
  m.work.mockResolvedValue(work); m.queueMember.mockRejectedValue(new Error("Private team check"));
  for (const action of [updateWork, commentWork]) {
    m.raw.mockClear(); m.work.mockClear(); m.queueMember.mockClear();
    await expect(action(form())).rejects.toThrow("Private team check"); assertLockBefore(m.queueMember);
    expect(m.work.mock.invocationCallOrder[0]).toBeLessThan(m.raw.mock.invocationCallOrder[0]);
  }
  m.session.capabilities.delete(kind === "TICKET" ? "tickets.ticket.manage" : "service.ticket.update"); m.raw.mockClear();
  await expect(updateWork(form())).rejects.toThrow("FORBIDDEN"); expect(m.raw).not.toHaveBeenCalled();
});
it.each([commentWork, watchWork, requestWorkApproval])("uses Serializable for native comment/watch/approval transactions", async action => {
  m.work.mockRejectedValue(new Error("Stop after transaction entry")); await expect(action(form())).rejects.toThrow("Stop after transaction entry");
  expect(m.transaction).toHaveBeenCalledWith(expect.any(Function), { isolationLevel: "Serializable" });
});
it.each(["TICKET", "QUERY"] as const)("keeps %s public replies and parent notifications working with narrow domain grants, without Studio or Ticket Manage grants", async kind => {
  m.session.capabilities = new Set(["core.profile.self", ...(kind === "TICKET" ? ["tickets.ticket.read", "tickets.ticket.reply"] : ["service.ticket.read", "service.ticket.update"])]);
  m.work.mockResolvedValue({ id: "work", organisationId: "company", number: "TKT-1", kind, queueId: "queue", version: 1, status: "IN_PROGRESS", parentId: "parent", parentCaseId: null });
  m.queueMember.mockResolvedValue(null); m.workUpdate.mockResolvedValue({ count: 1 }); m.entry.mockResolvedValue({ id: "entry" });
  await commentWork(form({ body: "Requester reply", visibility: "REQUESTER", organisationId: "untrusted-foreign-company" })); assertLockBefore(m.workUpdate);
  expect(m.workUpdate).toHaveBeenCalledWith({ where: { id: "parent", organisationId: "company" }, data: { version: { increment: 1 } } });
  expect(m.audit).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ action: "service.work.comment", organisationId: "company" }) }));
  expect(m.outbox).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ eventName: `${kind.toLowerCase()}.comment` }) }));
});
it("locks before case lookup and preserves same-customer/security merge, bulk Ticket parent changes, paired history and narrow case grants", async () => {
  m.session.capabilities = new Set(["service.case.assign", "service.case.read"]);
  const source = { id: "source", number: "CASE-1", partyId: "party", security: "STANDARD", mergedIntoId: null }, target = { ...source, id: "target", number: "CASE-2" };
  m.case.mockResolvedValueOnce(source).mockResolvedValueOnce(target); m.caseUpdate.mockResolvedValue({ count: 1 }); m.entry.mockResolvedValue({ id: "entry" });
  await mergeCases(form({ caseId: "source", targetNumber: "CASE-2", reason: "Duplicate" })); assertLockBefore(m.case);
  expect(m.workUpdate).toHaveBeenCalledWith({ where: { organisationId: "company", parentCaseId: "source", status: { notIn: ["RESOLVED", "CLOSED", "CANCELLED"] } }, data: { parentCaseId: "target", version: { increment: 1 } } });
  expect(m.audit).toHaveBeenCalledTimes(2); expect(m.outbox).toHaveBeenCalledTimes(2);
  expect(m.transaction).toHaveBeenCalledWith(expect.any(Function), { isolationLevel: "Serializable" });
});
it("a failed entity lock or missing owner grant cannot reach native/case writes", async () => {
  m.raw.mockRejectedValue(new Error("Coordination unavailable")); await expect(mergeCases(form())).rejects.toThrow("Coordination unavailable");
  expect(m.case).not.toHaveBeenCalled(); expect(m.workUpdate).not.toHaveBeenCalled();
  m.session.capabilities.delete("service.case.assign"); m.raw.mockClear(); await expect(mergeCases(form())).rejects.toThrow("FORBIDDEN"); expect(m.raw).not.toHaveBeenCalled();
});
it.each([{ partyId: "other-party" }, { security: "RESTRICTED" }])("retains case-merge customer/security restrictions after coordination: %j", async patch => {
  const source = { id: "source", partyId: "party", security: "STANDARD", mergedIntoId: null };
  m.case.mockResolvedValueOnce(source).mockResolvedValueOnce({ ...source, id: "target", ...patch });
  await expect(mergeCases(form({ caseId: "source", targetNumber: "CASE-2", reason: "Duplicate" }))).rejects.toThrow("same customer and security");
  assertLockBefore(m.case); expect(m.caseUpdate).not.toHaveBeenCalled(); expect(m.workUpdate).not.toHaveBeenCalled(); expect(m.audit).not.toHaveBeenCalled();
});
