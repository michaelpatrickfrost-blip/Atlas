import { beforeEach, expect, it, vi } from "vitest";
import type { Prisma, ServiceWorkItem } from "@/generated/prisma/client";
const m = vi.hoisted(() => ({ member: vi.fn(), raw: vi.fn(), company: vi.fn(), modules: vi.fn(), enabled: vi.fn(), field: vi.fn(), window: vi.fn(),
  row: vi.fn(), update: vi.fn(), create: vi.fn(), entry: vi.fn(), audit: vi.fn(), outbox: vi.fn(), caseEntry: vi.fn(), caseUpdate: vi.fn(), transaction: vi.fn() }));
vi.mock("@/core/db/client", () => ({ db: { membership: { findUnique: m.member }, $transaction: m.transaction } }));
vi.mock("@/core/studio/registry/runtime", async () => {
  const { CapabilityRegistry } = await import("@/core/studio/registry/registry");
  const { ticketStudioContract } = await import("@/core/service-work/studio");
  return { buildRegistry: (available: ConstructorParameters<typeof CapabilityRegistry>[0]) => { const registry = new CapabilityRegistry(available); registry.register("tickets", ticketStudioContract); return registry; } };
});
import { sessionForUser } from "@/core/auth/session";
import { lockWork, workEvent } from "@/core/service-work/engine";
import { createTicketWithFieldInitialisation, authoriseNewTicketFields } from "@/core/service-work/studio-create";
import { withTicketFieldMutation, authoriseTicketNativeValidation } from "@/core/service-work/studio-native";

// Actual engine/creation/outer scope, registered owner queries and opaque genuine
// Session/proofs; database, events and persistence are explicit unit collaborators.
// Assertions prove receipts/lifetimes/ordering/failure propagation, not SQL rollback
// or SSI. Domain actions and all-active required/window validators remain unwired.
const fixture = () => ({ id: "member", userId: "actor", organisationId: "company", sessionVersion: 2, active: true,
  grantedCapabilities: ["tickets.ticket.create", "tickets.ticket.manage", "tickets.ticket.reply", "service.ticket.update"], deniedCapabilities: [] as string[], roles: [],
  user: { name: "Actor", email: "actor@example.invalid", authVersion: 3, platformAdmin: null },
  organisation: { id: "company", name: "Company", kind: "CUSTOMER", status: "ACTIVE", archivedAt: null, auditAccess: null, restrictedAccessAreas: [] } });
const work = (id: string, overrides: Partial<ServiceWorkItem> = {}) => ({ id, organisationId: "company", kind: "TICKET", version: 1, status: "NEW", priority: "NORMAL",
  parentId: null, parentCaseId: null, requesterUserId: "actor", queueId: "queue", number: `TKT-${id}`, subject: "Created", mergedIntoId: null, ...overrides }) as ServiceWorkItem;
let store: Map<string, ServiceWorkItem>;
const tx = { membership: { findUnique: m.member }, $queryRaw: m.raw, organisation: { findFirst: m.company }, moduleState: { findMany: m.modules, findFirst: m.enabled },
  studioDefinition: { findFirst: m.field }, studioFieldMigrationPublication: { findFirst: m.window },
  serviceWorkItem: { findFirst: m.row, updateMany: m.update, create: m.create }, serviceWorkEntry: { create: m.entry }, auditEntry: { create: m.audit }, domainOutbox: { create: m.outbox },
  serviceEntry: { create: m.caseEntry }, serviceCase: { updateMany: m.caseUpdate } } as unknown as Prisma.TransactionClient;
const data: Prisma.ServiceWorkItemUncheckedCreateInput = { organisationId: "company", kind: "TICKET", requesterUserId: "actor", queueId: "queue", number: "TKT-new", subject: "Created" };
beforeEach(() => {
  vi.resetAllMocks(); store = new Map([["ticket", work("ticket")]]);
  m.member.mockImplementation(async () => structuredClone(fixture()));
  m.raw.mockImplementation(async strings => strings.join("") === "SHOW transaction_isolation" ? [{ transaction_isolation: "serializable" }] : []);
  m.company.mockResolvedValue({ id: "company" }); m.modules.mockResolvedValue([{ moduleId: "tickets", enabled: true, entitled: true }, { moduleId: "service", enabled: true, entitled: true }]);
  m.enabled.mockResolvedValue({ id: "enabled" }); m.field.mockResolvedValue({ id: "field" }); m.window.mockResolvedValue(null);
  m.row.mockImplementation(async ({ where }) => { const row = store.get(where.id); return row && row.organisationId === where.organisationId && (where.version === undefined || row.version === where.version) ? { ...row } : null; });
  m.update.mockImplementation(async ({ where, data: values }) => {
    const row = store.get(where.id);
    if (!row || row.organisationId !== where.organisationId || (where.version !== undefined && row.version !== where.version)) return { count: 0 };
    const version = typeof values.version === "object" ? row.version + values.version.increment : row.version;
    store.set(row.id, { ...row, ...values, version }); return { count: 1 };
  });
  m.create.mockImplementation(async ({ data: values }) => { const row = work("new", values); store.set(row.id, row); return row; });
  m.entry.mockImplementation(async () => ({ id: `entry-${m.entry.mock.calls.length}` }));
  m.audit.mockResolvedValue({ id: "audit" }); m.outbox.mockResolvedValue({ id: "outbox" }); m.caseEntry.mockResolvedValue({ id: "case-entry" }); m.caseUpdate.mockResolvedValue({ count: 1 });
});
async function actor() { const session = await sessionForUser("company", "actor"); if (!session) throw new Error("Missing fixture actor."); return session; }
it("captures the actual engine CAS and final repeated linked Ticket revision under the narrow Query operation", async () => {
  const session = await actor(), child = work("query", { kind: "QUERY", parentId: "ticket" }); store.set(child.id, child);
  await withTicketFieldMutation({ session, transaction: tx }, "service.ticket.update", async current => {
    await lockWork(tx, current, child.id, 1, { status: "IN_PROGRESS" });
    await workEvent(tx, current, child, "STATUS_CHANGED", "Progress", "REQUESTER");
    await workEvent(tx, current, child, "SLA_PAUSED", "Paused");
  }, async (authority, records, operation, proof) => {
    expect(records).toEqual([{ recordId: "ticket", organisationId: "company", revision: 3 }]);
    expect(store.get("query")?.version).toBe(2); expect(store.get("ticket")?.version).toBe(3);
    expect(await authoriseTicketNativeValidation({ session: authority.session, transaction: tx }, { recordId: "ticket", expectedRevision: 3 }, operation, proof)).toEqual(records[0]);
    await expect(authoriseTicketNativeValidation({ session: authority.session, transaction: tx }, { recordId: "ticket", expectedRevision: 2 }, operation, proof)).rejects.toThrow("FORBIDDEN");
    await expect(authoriseTicketNativeValidation({ session: authority.session, transaction: tx }, { recordId: "query", expectedRevision: 2 }, operation, proof)).rejects.toThrow("FORBIDDEN");
    expect(authority.session.capabilities.has("tickets.ticket.read")).toBe(false);
    expect(m.update).toHaveBeenNthCalledWith(1, { where: { id: "query", organisationId: "company", version: 1 }, data: { status: "IN_PROGRESS", version: { increment: 1 } } });
  });
  expect(m.entry).toHaveBeenCalledTimes(4); expect(m.audit).toHaveBeenCalledTimes(2); expect(m.outbox).toHaveBeenCalledTimes(2);
  expect(m.outbox.mock.calls[0][0].data).toMatchObject({ eventName: "query.status_changed", payload: { workId: "query", parentId: "ticket" } });
});
it("preserves Work entry, Audit, Outbox and Case effects with the native receipt", async () => {
  const session = await actor(), row = work("ticket", { parentCaseId: "case" }); store.set(row.id, row);
  await withTicketFieldMutation({ session, transaction: tx }, "tickets.ticket.reply", async current => {
    await lockWork(tx, current, row.id, 1, {}); await workEvent(tx, current, row, "COMMENT", "Reply", "REQUESTER");
  }, async (_authority, records) => { expect(records).toEqual([{ recordId: "ticket", organisationId: "company", revision: 2 }]); });
  expect(m.entry).toHaveBeenCalledExactlyOnceWith({ data: { organisationId: "company", workId: "ticket", kind: "COMMENT", body: "Reply", visibility: "REQUESTER", actorUserId: "actor" } });
  expect(m.audit.mock.calls[0][0].data).toMatchObject({ action: "service.work.comment", entityType: "ServiceWorkItem", entityId: "ticket", after: { entryId: "entry-1", kind: "COMMENT" } });
  expect(m.outbox.mock.calls[0][0].data).toMatchObject({ eventKey: "service-work:entry-1", eventName: "ticket.comment", payload: { workId: "ticket", entryId: "entry-1", parentCaseId: "case", parentId: null } });
  expect(m.caseEntry.mock.calls[0][0].data).toMatchObject({ organisationId: "company", caseId: "case", kind: "LINKED_TICKET_COMMENT", visibility: "INTERNAL", authorUserId: "actor" });
  expect(m.caseUpdate).toHaveBeenCalledExactlyOnceWith({ where: { id: "case", organisationId: "company" }, data: { version: { increment: 1 } } });
});
it("retains original unscoped SQL and no-config fast paths without receipt reads or validation", async () => {
  const session = await actor(), parent = work("query", { kind: "QUERY", parentId: "ticket" }); store.set(parent.id, parent);
  await lockWork(tx, session, "ticket", 1, {}); await workEvent(tx, session, parent, "COMMENT", "Reply");
  expect(m.row).not.toHaveBeenCalled(); expect(m.field).not.toHaveBeenCalled(); expect(m.raw).not.toHaveBeenCalled();
  const validate = vi.fn(); m.field.mockResolvedValue(null);
  await withTicketFieldMutation({ session, transaction: tx }, "tickets.ticket.reply", async current => {
    await lockWork(tx, current, "ticket", 3, {}); await workEvent(tx, current, parent, "COMMENT", "Again");
  }, validate);
  expect(m.row).not.toHaveBeenCalled(); expect(validate).not.toHaveBeenCalled(); expect(m.company).not.toHaveBeenCalled();
  expect(store.get("ticket")?.version).toBe(5);
});
it("retains invalid/stale CAS denials before event append and exposes no native proof", async () => {
  const session = await actor(), validate = vi.fn();
  for (const version of [0, 1.5, Number.NaN]) await expect(lockWork(tx, session, "ticket", version, {})).rejects.toThrow("Refresh");
  expect(m.update).not.toHaveBeenCalled();
  await expect(withTicketFieldMutation({ session, transaction: tx }, "tickets.ticket.reply", async current => {
    await lockWork(tx, current, "ticket", 99, {}); await workEvent(tx, current, work("ticket"), "COMMENT", "Unsafe");
  }, validate)).rejects.toThrow("record changed");
  expect(m.entry).not.toHaveBeenCalled(); expect(validate).not.toHaveBeenCalled();
});
it("rejects a changed stored parent relation before the parent UPDATE and final validation", async () => {
  const session = await actor(), stale = work("query", { kind: "QUERY", parentId: "ticket" }); store.set(stale.id, { ...stale, parentId: "other" });
  const validate = vi.fn();
  await expect(withTicketFieldMutation({ session, transaction: tx }, "service.ticket.update", current => workEvent(tx, current, stale, "COMMENT", "Reply"), validate)).rejects.toThrow("linked work changed");
  expect(m.update).not.toHaveBeenCalled(); expect(validate).not.toHaveBeenCalled();
  expect(m.entry).toHaveBeenCalledTimes(1); // Staged entry/Audit/Outbox are rolled back by the real caller, not this unit stub.
});
it("propagates missing actual parent/update failures and later entry/Audit/Outbox/Case failures to the owning transaction", async () => {
  const session = await actor(), validate = vi.fn(), child = work("query", { kind: "QUERY", parentId: "ticket" }); store.set(child.id, child);
  const failure = new Error("Owning storage failed");
  m.update.mockRejectedValueOnce(failure);
  await expect(withTicketFieldMutation({ session, transaction: tx }, "service.ticket.update", current => workEvent(tx, current, child, "COMMENT", "Reply"), validate)).rejects.toBe(failure);
  expect(validate).not.toHaveBeenCalled();
  for (const collaborator of [m.entry, m.audit, m.outbox, m.caseEntry, m.caseUpdate]) {
    collaborator.mockRejectedValueOnce(failure);
    await expect(withTicketFieldMutation({ session, transaction: tx }, "tickets.ticket.reply", current => workEvent(tx, current, work("ticket", { parentCaseId: "case" }), "COMMENT", "Reply"), validate)).rejects.toBe(failure);
  }
  expect(validate).not.toHaveBeenCalled();
  store.delete("ticket");
  await expect(withTicketFieldMutation({ session, transaction: tx }, "service.ticket.update", current => workEvent(tx, current, child, "COMMENT", "Reply"), validate)).rejects.toThrow("linked work changed");
});
it("collects the same owning INSERT while creation and final native proof lifetimes stay distinct", async () => {
  const session = await actor(); let creation: object | undefined, native: object | undefined;
  const result = await withTicketFieldMutation({ session, transaction: tx }, "tickets.ticket.create", async current => {
    return createTicketWithFieldInitialisation({ session: current, transaction: tx }, data, async (authority, created, proof) => {
      creation = proof; expect(created.id).toBe("new");
      expect(await authoriseNewTicketFields({ session: authority.session, transaction: tx }, proof)).toEqual({ recordId: "new", organisationId: "company", revision: 1 });
      await expect(authoriseTicketNativeValidation({ session: authority.session, transaction: tx }, { recordId: "new", expectedRevision: 1 }, "tickets.ticket.create", proof)).rejects.toThrow("FORBIDDEN");
      return "staged";
    });
  }, async (authority, records, operation, proof) => {
    native = proof; expect(proof).not.toBe(creation); expect(records).toEqual([{ recordId: "new", organisationId: "company", revision: 1 }]);
    const context = { session: authority.session, transaction: tx };
    await expect(authoriseNewTicketFields(context, creation!)).rejects.toThrow("FORBIDDEN");
    await expect(authoriseNewTicketFields(context, proof)).rejects.toThrow("FORBIDDEN");
    expect(await authoriseTicketNativeValidation(context, { recordId: "new", expectedRevision: 1 }, operation, proof)).toEqual(records[0]);
    expect(await authority.registry.invokeNativeValidationFacts(context, authority.registry.describe("tickets.ticket", 9), { recordId: "new", expectedRevision: 1 }, operation, proof))
      .toEqual({ recordId: "new", organisationId: "company", revision: 1, fields: { status: "NEW", priority: "NORMAL" } });
  });
  expect(result.result).toBe("staged"); expect(m.create).toHaveBeenCalledExactlyOnceWith({ data }); expect(m.transaction).not.toHaveBeenCalled();
  await expect(authoriseNewTicketFields({ session, transaction: tx }, creation!)).rejects.toThrow("FORBIDDEN");
  await expect(authoriseTicketNativeValidation({ session, transaction: tx }, { recordId: "new", expectedRevision: 1 }, "tickets.ticket.create", native!)).rejects.toThrow("FORBIDDEN");
});
it("preserves requester/NEW/version1/unmerged creation checks and denies an unsafe INSERT before any callback", async () => {
  const session = await actor(), initialise = vi.fn(), validate = vi.fn();
  for (const change of [{ requesterUserId: "other" }, { kind: "QUERY" }, { version: 2 }, { status: "RESOLVED" }, { mergedIntoId: "ticket" }, { organisationId: "foreign" }])
    await expect(withTicketFieldMutation({ session, transaction: tx }, "tickets.ticket.create", current => createTicketWithFieldInitialisation({ session: current, transaction: tx }, { ...data, ...change }, initialise), validate)).rejects.toThrow("scope");
  expect(m.create).not.toHaveBeenCalled(); expect(initialise).not.toHaveBeenCalled(); expect(validate).not.toHaveBeenCalled();
  for (const change of [{ requesterUserId: "other" }, { version: 2 }, { status: "RESOLVED" }, { mergedIntoId: "ticket" }]) {
    m.create.mockResolvedValueOnce(work("new", change));
    await expect(withTicketFieldMutation({ session, transaction: tx }, "tickets.ticket.create", current => createTicketWithFieldInitialisation({ session: current, transaction: tx }, data, initialise), validate)).rejects.toThrow(/scope|created work/);
  }
  expect(initialise).not.toHaveBeenCalled(); expect(validate).not.toHaveBeenCalled();
});
it("revokes creation on staging failure, skips final proof, and releases the outer scope for the next owning operation", async () => {
  const session = await actor(), failure = new Error("Initial fields failed"), validate = vi.fn(); let retained: object | undefined;
  await expect(withTicketFieldMutation({ session, transaction: tx }, "tickets.ticket.create", current => createTicketWithFieldInitialisation({ session: current, transaction: tx }, data,
    async (_authority, _created, proof) => { retained = proof; throw failure; }), validate)).rejects.toBe(failure);
  await expect(authoriseNewTicketFields({ session, transaction: tx }, retained!)).rejects.toThrow("FORBIDDEN"); expect(validate).not.toHaveBeenCalled();
  await withTicketFieldMutation({ session, transaction: tx }, "tickets.ticket.reply", current => lockWork(tx, current, "ticket", 1, {}), async (_authority, records) => {
    expect(records).toEqual([{ recordId: "ticket", organisationId: "company", revision: 2 }]);
  });
});
it("propagates final validation failure after the actual INSERT and revokes both proof types", async () => {
  const session = await actor(), failure = new Error("Final resulting-state failed"); let creation: object | undefined, native: object | undefined;
  await expect(withTicketFieldMutation({ session, transaction: tx }, "tickets.ticket.create", current => createTicketWithFieldInitialisation({ session: current, transaction: tx }, data,
    async (_authority, _created, proof) => { creation = proof; }), async (_authority, _records, _operation, proof) => { native = proof; throw failure; })).rejects.toBe(failure);
  expect(m.create).toHaveBeenCalledTimes(1);
  await expect(authoriseNewTicketFields({ session, transaction: tx }, creation!)).rejects.toThrow("FORBIDDEN");
  await expect(authoriseTicketNativeValidation({ session, transaction: tx }, { recordId: "new", expectedRevision: 1 }, "tickets.ticket.create", native!)).rejects.toThrow("FORBIDDEN");
  expect(m.transaction).not.toHaveBeenCalled();
});
