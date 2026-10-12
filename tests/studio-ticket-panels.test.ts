import { analyticsBusinessViewContract } from "@/modules/analytics/services/studio-view";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Prisma } from "@/generated/prisma/client";
const mock = vi.hoisted(() => ({ membership: vi.fn(), refresh: vi.fn() }));
vi.mock("@/core/db/client", () => ({ db: { membership: { findUnique: mock.membership } } }));
vi.mock("@/core/studio/fields/runtime-authority", () => ({ nativeFieldMutationSessionInTransaction: mock.refresh }));
import { sessionForUser, type Session } from "@/core/auth/session";
import { CapabilityRegistry } from "@/core/studio/registry/registry";
import { ticketStudioContract } from "@/core/service-work/studio";
import { ticketPageContract, ticketPagePolicy, ticketPageSurfacePolicy } from "@/core/service-work/studio-pages";
import { ticketPanelQuery, ticketPanelSurface, ticketPanelKinds, ticketPanelColumns } from "@/core/service-work/page-panel-contract";
import { readTicketPanel } from "@/core/service-work/studio-page-surfaces";
import { workScope } from "@/core/service-work/access";
import { checksum } from "@/core/studio/registry/contracts";

// Genuine issued Session, actual registry/source callbacks/closed schemas/native
// scopes. Current authority and database rows are mocked collaborators; this does
// not prove real private SQL, projection atomicity, SSI or browser behavior.
const date = new Date("2026-10-12T12:00:00Z");
const grants = ["tickets.ticket.read"];
const affiliation = (capabilities: string[]) => ({ id: "member", userId: "actor", organisationId: "company", sessionVersion: 1, active: true,
  grantedCapabilities: capabilities, deniedCapabilities: [], roles: [], user: { name: "Actor", email: "a@example.invalid", authVersion: 1, platformAdmin: null },
  organisation: { id: "company", name: "Company", kind: "CUSTOMER", status: "ACTIVE", archivedAt: null, auditAccess: null, restrictedAccessAreas: [] } });
async function actor(capabilities = grants) { mock.membership.mockResolvedValueOnce(affiliation(capabilities)); const session = await sessionForUser("company", "actor"); if (!session) throw new Error("No session"); return session; }
const head = () => ({ id: "ticket", organisationId: "company", kind: "TICKET", version: 4, updatedAt: date, queueId: "queue", queue: { organisationId: "company", restricted: true },
  parentId: "parent", parentCaseId: null, mergedIntoId: null, approvalId: "approval", status: "NEW", ownerUserId: null, reopenCount: 0,
  firstResponseDueAt: null, firstResponseAt: null, resolutionDueAt: date, pausedAt: date, resolvedAt: null });
const file = () => ({ id: "file", organisationId: "company", workId: "ticket", visibility: "REQUESTER", name: "Public evidence.pdf", size: 0, mime: "application/pdf", createdAt: date, storageKey: "SECRET" });
const entry = () => ({ id: "entry", organisationId: "company", workId: "ticket", visibility: "REQUESTER", kind: "REPLY", body: "Authorised reply", actorUserId: "colleague", createdAt: date });
function fixture() {
  const storage = { moduleState: { findFirst: vi.fn().mockResolvedValue({ id: "enabled" }) }, serviceWorkItem: { findFirst: vi.fn().mockResolvedValue(head()), findMany: vi.fn().mockResolvedValue([]) },
    serviceQueueMember: { findFirst: vi.fn().mockResolvedValue(null) }, serviceFile: { findMany: vi.fn().mockResolvedValue([file()]) },
    serviceWorkEntry: { findMany: vi.fn().mockResolvedValue([entry()]) }, membership: { findMany: vi.fn().mockResolvedValue([]) }, serviceCase: { findFirst: vi.fn().mockResolvedValue(null) },
    approvalInstance: { findFirst: vi.fn().mockResolvedValue({ id: "approval", organisationId: "company", subjectType: "SERVICE_TICKET", subjectId: "ticket", status: "PENDING" }) }, approvalStep: { findMany: vi.fn().mockResolvedValue([]) } };
  const transaction = storage as unknown as Prisma.TransactionClient, registry = new CapabilityRegistry(async () => true);
  registry.register("analytics", analyticsBusinessViewContract);
  registry.register("tickets", { contributions: [...ticketStudioContract.contributions, ...ticketPageContract.contributions] });
  return { storage, transaction, registry, source: registry.describe("tickets.ticket.page", 2) };
}
const input = { recordId: "ticket", expectedRevision: 4, expectedUpdatedAt: date.toISOString(), pageSize: 50 };
const request = (kind: typeof ticketPanelKinds[number], size = 50) => ({ query: ticketPanelQuery(kind), pageSize: size, cursor: null });
beforeEach(() => { vi.resetAllMocks(); mock.refresh.mockImplementation(async (session: Session) => ({ session })); });

describe("Ticket read-only owner panels", () => {
  it("registers new source@2 and six closed bounded panels without altering retained source@1/native hashes", () => {
    const f = fixture(), old = f.registry.describe("tickets.ticket.page", 1);
    expect(old.schemaHash).toBe(checksum(ticketPagePolicy));
    expect(f.source.schemaHash).toBe(checksum(ticketPageSurfacePolicy));
    expect(ticketPagePolicy.surfaces.map(value => value.surface.id)).toEqual(["tickets.ticket.progress_form"]);
    for (const kind of ticketPanelKinds) {
      expect(f.registry.describe(ticketPanelQuery(kind).id, 1)).toMatchObject({ kind: "query", details: { transaction: "required", maxCardinality: kind === "status" ? 1 : 50 } });
      expect(f.registry.describe(ticketPanelSurface(kind).id, 1).capability).toBe(kind === "approval" ? "tickets.ticket.manage" : "tickets.ticket.read");
      expect(ticketPanelColumns[kind].every(value => value.classification === "confidential")).toBe(true);
    }
    const before = new CapabilityRegistry(async () => true); before.register("tickets", ticketStudioContract);
    for (const contribution of ticketStudioContract.contributions) expect(f.registry.describe(contribution.metadata.id, contribution.metadata.version)).toEqual(before.describe(contribution.metadata.id, contribution.metadata.version));
    expect(mock.refresh).not.toHaveBeenCalled();
  });
  it("uses exact current private/native anchor before status/name projection; zero and paused targets survive", async () => {
    const session = await actor(), f = fixture();
    const result = await f.registry.invokePageRead({ session, transaction: f.transaction }, f.source, { kind: "record", recordId: "ticket" }, request("status"));
    expect(result.output.rows[0].values).toMatchObject({ status: "NEW", owner: "Unassigned", reopen_count: 0, resolution_state: "PAUSED", first_response_state: "UNSET" });
    expect(f.storage.serviceWorkItem.findFirst.mock.calls.find(([args]) => args.select.status)?.[0]).toMatchObject({ where: { AND: [{ AND: [workScope(session), { id: "ticket", kind: "TICKET", queue: { organisationId: "company" } }] }, { version: 4, updatedAt: date }] } });
  });
  it("filters INTERNAL entry bodies/actor names before projection and permits them only for current receiving-team membership", async () => {
    const session = await actor(), f = fixture();
    const result = await readTicketPanel({ session, transaction: f.transaction }, "activity", input);
    expect(result.rows[0].values).toMatchObject({ actor: "Colleague", visibility: "REQUESTER", body: "Authorised reply" });
    expect(f.storage.serviceWorkEntry.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: { organisationId: "company", workId: "ticket", visibility: "REQUESTER" }, take: 50 }));
    expect(f.storage.membership.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: { organisationId: "company", active: true, userId: { in: ["colleague"] } }, select: { organisationId: true, userId: true, user: { select: { name: true } } } }));
    f.storage.serviceWorkEntry.findMany.mockResolvedValueOnce([{ ...entry(), visibility: "INTERNAL" }]);
    await expect(readTicketPanel({ session, transaction: f.transaction }, "activity", input)).rejects.toThrow("unavailable");
    expect(f.storage.membership.findMany).toHaveBeenCalledTimes(1);
    f.storage.serviceQueueMember.findFirst.mockResolvedValueOnce({ id: "agent" });
    f.storage.serviceWorkEntry.findMany.mockResolvedValueOnce([{ ...entry(), visibility: "INTERNAL" }]);
    expect((await readTicketPanel({ session, transaction: f.transaction }, "activity", input)).rows[0].values.visibility).toBe("INTERNAL");
  });
  it("filters INTERNAL filenames before output, emits no storage keys and bounds evidence to approved page size", async () => {
    const session = await actor(), f = fixture();
    const result = await f.registry.invokePageRead({ session, transaction: f.transaction }, f.source, { kind: "record", recordId: "ticket" }, request("documents", 3));
    expect(result.output.rows[0].values).toEqual({ name: "Public evidence.pdf", size: 0, mime: "application/pdf", created_at: date.toISOString() });
    expect(JSON.stringify(result)).not.toContain("SECRET");
    expect(f.storage.serviceFile.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: { organisationId: "company", workId: "ticket", visibility: "REQUESTER" }, take: 3,
      select: { id: true, organisationId: true, workId: true, visibility: true, name: true, size: true, mime: true, createdAt: true } }));
    f.storage.serviceFile.findMany.mockResolvedValueOnce([{ ...file(), visibility: "INTERNAL", name: "Forbidden filename" }]);
    await expect(readTicketPanel({ session, transaction: f.transaction }, "documents", input)).rejects.toThrow("unavailable");
  });
  it.each(["activity", "documents", "relationships", "approval", "status"] as const)("%s denies stale/foreign/private current owner before panel fields", async kind => {
    const session = await actor([...grants, "tickets.ticket.manage"]);
    for (const result of [null, { ...head(), organisationId: "foreign" }, { ...head(), queue: { organisationId: "foreign", restricted: false } }, { ...head(), version: 5 }]) {
      const f = fixture(); f.storage.serviceWorkItem.findFirst.mockResolvedValueOnce(result);
      await expect(readTicketPanel({ session, transaction: f.transaction }, kind, input)).rejects.toThrow();
      expect(f.storage.serviceFile.findMany).not.toHaveBeenCalled(); expect(f.storage.serviceWorkEntry.findMany).not.toHaveBeenCalled(); expect(f.storage.approvalInstance.findFirst).not.toHaveBeenCalled();
      expect(f.storage.serviceWorkItem.findFirst).toHaveBeenCalledTimes(1);
    }
  });
  it("denies stale current grants/module/missing transaction and invalid request before any panel projection", async () => {
    const session = await actor(), f = fixture(), revoked = await actor([]);
    mock.refresh.mockResolvedValueOnce({ session: revoked });
    await expect(readTicketPanel({ session, transaction: f.transaction }, "documents", input)).rejects.toThrow("FORBIDDEN");
    f.storage.moduleState.findFirst.mockResolvedValueOnce(null);
    await expect(readTicketPanel({ session, transaction: f.transaction }, "documents", input)).rejects.toThrow("unavailable");
    await expect(readTicketPanel({ session }, "documents", input)).rejects.toThrow("transaction");
    for (const request of [{ ...input, organisationId: "foreign" }, { ...input, pageSize: 51 }, { ...input, expectedRevision: -1 }])
      await expect(readTicketPanel({ session, transaction: f.transaction }, "documents", request)).rejects.toThrow();
    expect(f.storage.serviceWorkItem.findFirst).not.toHaveBeenCalled();
  });
  it("requires native Manage plus current receiving-team access for approval before status/steps/names", async () => {
    const session = await actor(), f = fixture();
    await expect(readTicketPanel({ session, transaction: f.transaction }, "approval", input)).rejects.toThrow("FORBIDDEN");
    expect(f.storage.serviceWorkItem.findFirst).not.toHaveBeenCalled();
    const manager = await actor([...grants, "tickets.ticket.manage"]);
    await expect(readTicketPanel({ session: manager, transaction: f.transaction }, "approval", input)).rejects.toThrow("receiving-team");
    expect(f.storage.approvalInstance.findFirst).not.toHaveBeenCalled();
    f.storage.serviceQueueMember.findFirst.mockResolvedValue({ id: "agent" });
    f.storage.approvalStep.findMany.mockResolvedValue([{ id: "step", organisationId: "company", instanceId: "approval", stage: 0, approverUserId: "approver", status: "PENDING", reason: null, dueAt: date }]);
    const result = await readTicketPanel({ session: manager, transaction: f.transaction }, "approval", input);
    expect(result.rows).toHaveLength(2); expect(result.rows[1].values).toMatchObject({ stage: 0, approver: "Approver", status: "PENDING" });
    expect(f.storage.approvalInstance.findFirst).toHaveBeenCalledWith(expect.objectContaining({ where: { id: "approval", organisationId: "company", subjectType: "SERVICE_TICKET", subjectId: "ticket" } }));
    f.storage.approvalInstance.findFirst.mockResolvedValueOnce({ id: "approval", organisationId: "company", subjectType: "SALES_ORDER", subjectId: "ticket", status: "PENDING" });
    await expect(readTicketPanel({ session: manager, transaction: f.transaction }, "approval", input)).rejects.toThrow("unavailable");
  });
  it("queries every linked record through independent workScope, filters disabled query app and never invents tasks", async () => {
    const session = await actor(), f = fixture();
    f.storage.serviceWorkItem.findMany.mockResolvedValue([{ id: "child", organisationId: "company", kind: "TICKET", number: "TK-2", subject: "Child", status: "NEW", parentId: "ticket", mergedIntoId: null }]);
    const result = await readTicketPanel({ session, transaction: f.transaction }, "outstanding_work", input);
    expect(result.rows[0].values).toMatchObject({ destination: "ticket", relationship: "Child work", status: "NEW" });
    expect(f.storage.serviceWorkItem.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: { AND: [workScope(session), { queue: { organisationId: "company" }, kind: { in: ["TICKET"] }, parentId: "ticket", status: { notIn: expect.any(Array) } }] }, take: 50 }));
    f.storage.serviceWorkItem.findMany.mockResolvedValueOnce([{ id: "foreign", organisationId: "other", kind: "TICKET" }]);
    await expect(readTicketPanel({ session, transaction: f.transaction }, "relationships", input)).rejects.toThrow("unavailable");
    expect(f.storage.serviceCase.findFirst).not.toHaveBeenCalled();
  });
  it("requires independent Service case module/Read/private policy before an originating case name or link", async () => {
    const session = await actor([...grants, "service.case.read"]), f = fixture();
    f.storage.serviceWorkItem.findFirst.mockResolvedValue({ ...head(), parentCaseId: "case" });
    f.storage.serviceCase.findFirst.mockResolvedValue({ id: "case", organisationId: "company", number: "CASE-1", subject: "Authorised case", status: "OPEN" });
    const result = await readTicketPanel({ session, transaction: f.transaction }, "relationships", input);
    expect(result.rows[0].values.destination).toBe("case");
    expect(f.storage.serviceCase.findFirst.mock.calls[0][0].where.AND[0]).toMatchObject({ organisationId: "company", security: "STANDARD" });
    f.storage.serviceCase.findFirst.mockResolvedValueOnce(null);
    expect((await readTicketPanel({ session, transaction: f.transaction }, "relationships", input)).rows).toEqual([]);
  });
  it("refuses list scope, client cursor/query injection and unapproved/foreign status outputs", async () => {
    const session = await actor(), f = fixture();
    await expect(f.registry.invokePageRead({ session, transaction: f.transaction }, f.source, { kind: "list" }, request("activity"))).rejects.toThrow("scope");
    await expect(f.registry.invokePageRead({ session, transaction: f.transaction }, f.source, { kind: "record", recordId: "ticket" }, { ...request("activity"), cursor: { id: "foreign" } })).rejects.toThrow("scope");
    const callbacks = ticketPageContract.contributions.at(-1)!.pageSource!;
    await expect(callbacks.projectQueryOutput({ session, transaction: f.transaction }, { kind: "record", organisationId: "company", recordId: "ticket", nativeRevision: 4, revision: `4@${date.toISOString()}` }, request("status"),
      { rows: [{ id: "other", values: { status: "NEW" } }], nextCursor: null })).rejects.toThrow();
    expect(f.storage.serviceWorkEntry.findMany).not.toHaveBeenCalled();
  });
  it("denies forged/copy Page principal, bounded overflow and foreign approval/name rows before those projections leave", async () => {
    const session = await actor([...grants, "tickets.ticket.manage"]), f = fixture();
    await expect(f.registry.invokePageRead({ session: { ...session }, transaction: f.transaction }, f.source, { kind: "record", recordId: "ticket" }, request("documents"))).rejects.toThrow("genuine");
    expect(f.storage.serviceFile.findMany).not.toHaveBeenCalled();
    f.storage.serviceQueueMember.findFirst.mockResolvedValue({ id: "agent" });
    f.storage.approvalStep.findMany.mockResolvedValueOnce(Array.from({ length: 50 }, (_, i) => ({ id: `step${i}`, organisationId: "company", instanceId: "approval", stage: 0, approverUserId: "approver", status: "PENDING", reason: null, dueAt: date })));
    await expect(readTicketPanel({ session, transaction: f.transaction }, "approval", input)).rejects.toThrow("unavailable");
    expect(f.storage.membership.findMany).not.toHaveBeenCalled();
    f.storage.serviceWorkEntry.findMany.mockResolvedValueOnce([entry()]);
    f.storage.membership.findMany.mockResolvedValueOnce([{ organisationId: "foreign", userId: "colleague", user: { name: "Private colleague" } }]);
    await expect(readTicketPanel({ session, transaction: f.transaction }, "activity", input)).rejects.toThrow("unavailable");
  });

});
