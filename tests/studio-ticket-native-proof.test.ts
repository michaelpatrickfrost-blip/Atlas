import { beforeEach, expect, it, vi } from "vitest";
import type { Prisma, ServiceWorkItem } from "@/generated/prisma/client";
const m = vi.hoisted(() => ({ member: vi.fn(), raw: vi.fn(), company: vi.fn(), modules: vi.fn(), enabled: vi.fn(), field: vi.fn(), window: vi.fn(),
  row: vi.fn(), rows: vi.fn(), update: vi.fn(), create: vi.fn(), transaction: vi.fn() }));
vi.mock("@/core/db/client", () => ({ db: { membership: { findUnique: m.member }, $transaction: m.transaction } }));
vi.mock("@/core/studio/registry/runtime", async () => {
  const { CapabilityRegistry } = await import("@/core/studio/registry/registry");
  return { buildRegistry: (available: ConstructorParameters<typeof CapabilityRegistry>[0]) => new CapabilityRegistry(available) };
});
import { ticketStudioContract } from "@/core/service-work/studio";
import { sessionForUser } from "@/core/auth/session";
import { withTicketFieldMutation, authoriseTicketNativeValidation, insertWorkWithFieldReceipt, updateWorkWithFieldReceipt,
  incrementWorkParentWithFieldReceipt, reparentCaseWorkWithFieldReceipts, type TicketFieldOperation } from "@/core/service-work/studio-native";

// Genuine signed-session stamps and actual private receipt/proof implementation;
// native SQL/storage are explicit in-memory collaborators. This proves scope,
// actual helper ordering and error propagation, not database rollback or SSI.
type Work = { id: string; organisationId: string; kind: string; version: number; parentId: string | null; parentCaseId: string | null; status: string; priority: string; watcherIds: string[] };
const fixture = () => ({ id: "member", userId: "actor", organisationId: "company", sessionVersion: 2, active: true,
  grantedCapabilities: ["tickets.ticket.watch", "tickets.ticket.create", "service.ticket.update", "service.case.assign"], deniedCapabilities: [] as string[], roles: [],
  user: { name: "Actor", email: "actor@example.invalid", authVersion: 3, platformAdmin: null as { role: string; active: boolean } | null },
  organisation: { id: "company", name: "Company", kind: "CUSTOMER", status: "ACTIVE", archivedAt: null, auditAccess: null, restrictedAccessAreas: [] } });
let member: ReturnType<typeof fixture>, store: Map<string, Work>;
const work = (id: string, kind = "TICKET", overrides: Partial<Work> = {}): Work => ({ id, kind, organisationId: "company", version: 1,
  parentId: null, parentCaseId: null, status: "NEW", priority: "NORMAL", watcherIds: ["actor"], ...overrides });
const tx = { membership: { findUnique: m.member }, $queryRaw: m.raw, organisation: { findFirst: m.company }, moduleState: { findMany: m.modules, findFirst: m.enabled },
  studioDefinition: { findFirst: m.field }, studioFieldMigrationPublication: { findFirst: m.window },
  serviceWorkItem: { findFirst: m.row, findMany: m.rows, updateMany: m.update, create: m.create } } as unknown as Prisma.TransactionClient;
function matches(row: Work, where: { organisationId?: string; parentCaseId?: string; version?: number; status?: { notIn: string[] }; id?: string | { in?: string[]; gt?: string } }) {
  return (!where.organisationId || row.organisationId === where.organisationId) && (!where.parentCaseId || row.parentCaseId === where.parentCaseId)
    && (where.version === undefined || row.version === where.version) && (!where.status || !where.status.notIn.includes(row.status))
    && (!where.id || (typeof where.id === "string" ? row.id === where.id : (!where.id.in || where.id.in.includes(row.id)) && (!where.id.gt || row.id > where.id.gt)));
}
beforeEach(() => {
  vi.resetAllMocks(); member = fixture(); store = new Map([["native", work("native")]]);
  m.member.mockImplementation(async () => structuredClone(member));
  m.raw.mockImplementation(async strings => strings.join("") === "SHOW transaction_isolation" ? [{ transaction_isolation: "serializable" }] : []);
  m.company.mockImplementation(async () => member.organisation.kind === "CUSTOMER" ? { id: "company" } : null);
  m.modules.mockResolvedValue([{ moduleId: "tickets", enabled: true, entitled: true }, { moduleId: "service", enabled: true, entitled: true }]);
  m.enabled.mockResolvedValue({ id: "enabled" }); m.field.mockResolvedValue({ id: "field" }); m.window.mockResolvedValue(null);
  m.row.mockImplementation(async ({ where }) => { const row = store.get(where.id); return row && matches(row, where) ? { ...row } : null; });
  m.rows.mockImplementation(async ({ where, take }) => [...store.values()].filter(row => matches(row, where)).sort((a, b) => a.id < b.id ? -1 : 1).slice(0, take).map(row => ({ ...row })));
  m.update.mockImplementation(async ({ where, data }) => {
    let count = 0;
    for (const row of store.values()) if (matches(row, where)) {
      Object.assign(row, data, { version: typeof data.version === "object" ? row.version + data.version.increment : row.version }); count++;
    }
    return { count };
  });
  m.create.mockImplementation(async ({ data }) => {
    const row = work(data.id ?? "created", data.kind, { ...data, version: data.version ?? 1 }); store.set(row.id, row); return { ...row };
  });
});
async function actor() { const session = await sessionForUser("company", "actor"); if (!session) throw new Error("Missing fixture actor."); return session; }
const input = (recordId = "native", expectedRevision = 2) => ({ recordId, expectedRevision });

it("issues a validation-only proof after the actual unwatch CAS and revokes it afterwards", async () => {
  const session = await actor(); let retained: object | undefined;
  const result = await withTicketFieldMutation({ session, transaction: tx }, "tickets.ticket.watch", async current => {
    expect(current).not.toBe(session);
    await updateWorkWithFieldReceipt(tx, current, "native", 1, { watcherIds: [] }); return "saved";
  }, async (authority, records, operation, proof) => {
    retained = proof;
    expect(records).toEqual([{ recordId: "native", organisationId: "company", revision: 2 }]);
    expect(Object.isFrozen(records)).toBe(true); expect(Object.isFrozen(records[0])).toBe(true);
    expect(authority.session.capabilities.has("tickets.ticket.read")).toBe(false);
    expect(authority.session.capabilities.has("tickets.ticket.manage")).toBe(false);
    expect(await authoriseTicketNativeValidation({ session: authority.session, transaction: tx }, input(), operation, proof)).toEqual(records[0]);
  });
  expect(result).toBe("saved"); expect(store.get("native")!.watcherIds).toEqual([]);
  await expect(authoriseTicketNativeValidation({ session, transaction: tx }, input(), "tickets.ticket.watch", retained!)).rejects.toThrow("FORBIDDEN");
  expect(m.transaction).not.toHaveBeenCalled();
});

it("rejects copied/creation-like/foreign tokens, sessions, transactions, operation and record/revision scope while live", async () => {
  const session = await actor();
  await withTicketFieldMutation({ session, transaction: tx }, "tickets.ticket.watch", current => updateWorkWithFieldReceipt(tx, current, "native", 1, {}), async (authority, _records, operation, proof) => {
    const context = { session: authority.session, transaction: tx };
    for (const token of [{}, { ...proof }, JSON.parse(JSON.stringify(proof))]) await expect(authoriseTicketNativeValidation(context, input(), operation, token)).rejects.toThrow("FORBIDDEN");
    await expect(authoriseTicketNativeValidation({ ...context, session: { ...authority.session } }, input(), operation, proof)).rejects.toThrow("FORBIDDEN");
    await expect(authoriseTicketNativeValidation({ ...context, transaction: {} as Prisma.TransactionClient }, input(), operation, proof)).rejects.toThrow("FORBIDDEN");
    await expect(authoriseTicketNativeValidation(context, input("unaffected"), operation, proof)).rejects.toThrow("FORBIDDEN");
    await expect(authoriseTicketNativeValidation(context, input("native", 1), operation, proof)).rejects.toThrow("FORBIDDEN");
    await expect(authoriseTicketNativeValidation(context, input(), "tickets.ticket.create", proof)).rejects.toThrow("FORBIDDEN");
    authority.session.organisationId = "foreign";
    await expect(authoriseTicketNativeValidation(context, input(), operation, proof)).rejects.toThrow("FORBIDDEN");
  });
});

it("retains the no-configuration internal native path without field authority or extra native reads", async () => {
  member.organisation.kind = "INTERNAL"; member.user.platformAdmin = { role: "EMPLOYEE", active: true }; m.field.mockResolvedValue(null); m.window.mockResolvedValue(null);
  const session = await actor(), validate = vi.fn();
  await withTicketFieldMutation({ session, transaction: tx }, "tickets.ticket.watch", current => updateWorkWithFieldReceipt(tx, current, "native", 1, {}), validate);
  expect(validate).not.toHaveBeenCalled(); expect(m.company).not.toHaveBeenCalled(); expect(m.modules).not.toHaveBeenCalled(); expect(m.row).not.toHaveBeenCalled();
  expect(m.raw.mock.calls[0][0].join("")).toBe("SHOW transaction_isolation");
  const entityLock = m.raw.mock.calls.findIndex(([strings]) => strings.join("").includes("pg_advisory_xact_lock"));
  expect(entityLock).toBeGreaterThan(0);
  expect(m.member.mock.invocationCallOrder[1]).toBeLessThan(m.raw.mock.invocationCallOrder[entityLock]);
  expect(m.raw.mock.invocationCallOrder[entityLock]).toBeLessThan(m.field.mock.invocationCallOrder[0]);
});

it("does not require Ticket availability or field authority for actual QUERY-only effects", async () => {
  store.set("query", work("query", "QUERY"));
  m.modules.mockResolvedValue([{ moduleId: "service", enabled: true, entitled: true }]);
  const session = await actor(), validate = vi.fn();
  await withTicketFieldMutation({ session, transaction: tx }, "service.ticket.update", current => updateWorkWithFieldReceipt(tx, current, "query", 1, {}), validate);
  expect(validate).not.toHaveBeenCalled(); expect(m.company).not.toHaveBeenCalled();
  expect(m.enabled).toHaveBeenCalledWith(expect.objectContaining({ where: expect.objectContaining({ moduleId: "service" }) }));
});

it("captures final repeated actual Ticket-parent effects from a QUERY without granting parent Read", async () => {
  store.set("query", work("query", "QUERY", { parentId: "native" }));
  const session = await actor();
  await withTicketFieldMutation({ session, transaction: tx }, "service.ticket.update", async current => {
    await updateWorkWithFieldReceipt(tx, current, "query", 1, {});
    await incrementWorkParentWithFieldReceipt(tx, current, store.get("query")! as unknown as ServiceWorkItem);
    await incrementWorkParentWithFieldReceipt(tx, current, store.get("query")! as unknown as ServiceWorkItem);
  }, async (authority, records, operation, proof) => {
    expect(records).toEqual([{ recordId: "native", organisationId: "company", revision: 3 }]);
    await expect(authoriseTicketNativeValidation({ session: authority.session, transaction: tx }, input("native", 3), operation, proof)).resolves.toEqual(records[0]);
    await expect(authoriseTicketNativeValidation({ session: authority.session, transaction: tx }, input("query", 2), operation, proof)).rejects.toThrow("FORBIDDEN");
  });
});

it("rejects a supplied parent that differs from the stored originating relation before its UPDATE", async () => {
  store.set("query", work("query", "QUERY", { parentId: "native" })); store.set("other", work("other"));
  const session = await actor(), validate = vi.fn();
  await expect(withTicketFieldMutation({ session, transaction: tx }, "service.ticket.update", current =>
    incrementWorkParentWithFieldReceipt(tx, current, { ...store.get("query"), parentId: "other" } as unknown as ServiceWorkItem), validate)).rejects.toThrow("linked work");
  expect(m.update).not.toHaveBeenCalled(); expect(validate).not.toHaveBeenCalled();
});

it("captures verified actual creation and also captures an open window when no active field exists", async () => {
  m.field.mockResolvedValue(null); m.window.mockResolvedValue({ preparationId: "window" });
  const session = await actor();
  await withTicketFieldMutation({ session, transaction: tx }, "tickets.ticket.create", current => insertWorkWithFieldReceipt(tx, current,
    { organisationId: "company", kind: "TICKET", requesterUserId: "actor", queueId: "queue", number: "TKT-1", subject: "Created" }), async (authority, records, operation, proof) => {
    expect(records).toEqual([{ recordId: "created", organisationId: "company", revision: 1 }]);
    await expect(authoriseTicketNativeValidation({ session: authority.session, transaction: tx }, input("created", 1), operation, proof)).resolves.toEqual(records[0]);
  });
});

it("captures every actually reparented Ticket over bounded pages without capturing existing target or final children", async () => {
  store.clear();
  for (let index = 0; index < 52; index++) { const id = `child_${String(index).padStart(3, "0")}`; store.set(id, work(id, index === 51 ? "QUERY" : "TICKET", { parentCaseId: "source" })); }
  store.set("target_old", work("target_old", "TICKET", { parentCaseId: "target" })); store.set("final", work("final", "TICKET", { parentCaseId: "source", status: "CLOSED" }));
  const session = await actor();
  await withTicketFieldMutation({ session, transaction: tx }, "service.case.assign", current => reparentCaseWorkWithFieldReceipts(tx, current, "source", "target"), async (authority, records, operation, proof) => {
    expect(records).toHaveLength(51); expect(records.every(record => record.revision === 2)).toBe(true);
    for (const record of records) await expect(authoriseTicketNativeValidation({ session: authority.session, transaction: tx }, input(record.recordId, 2), operation, proof)).resolves.toEqual(record);
    for (const id of ["target_old", "final", "child_051"]) await expect(authoriseTicketNativeValidation({ session: authority.session, transaction: tx }, input(id, store.get(id)!.version), operation, proof)).rejects.toThrow("FORBIDDEN");
  });
  expect(m.rows).toHaveBeenCalledTimes(3); expect(m.rows.mock.calls.every(([args]) => args.take === 50)).toBe(true);
  expect(store.get("target_old")!.version).toBe(1); expect(store.get("final")!.parentCaseId).toBe("source");
});

it("fails before the domain callback for unsafe identity, isolation, source capability or owning module", async () => {
  const session = await actor(), callback = vi.fn(), validate = vi.fn();
  await expect(withTicketFieldMutation({ session: { ...session }, transaction: tx }, "tickets.ticket.watch", callback, validate)).rejects.toThrow("FORBIDDEN");
  expect(m.raw).not.toHaveBeenCalled();
  m.raw.mockResolvedValueOnce([{ transaction_isolation: "read committed" }]);
  await expect(withTicketFieldMutation({ session, transaction: tx }, "tickets.ticket.watch", callback, validate)).rejects.toThrow("serializable");
  member.deniedCapabilities = ["tickets.ticket.watch"];
  await expect(withTicketFieldMutation({ session, transaction: tx }, "tickets.ticket.watch", callback, validate)).rejects.toThrow("FORBIDDEN");
  member.deniedCapabilities = []; m.enabled.mockResolvedValueOnce(null);
  await expect(withTicketFieldMutation({ session, transaction: tx }, "tickets.ticket.watch", callback, validate)).rejects.toThrow("unavailable");
  expect(callback).not.toHaveBeenCalled(); expect(validate).not.toHaveBeenCalled();
});

it("propagates domain/final-validator failures, revokes proofs and clears scopes for the next owning transaction", async () => {
  const session = await actor(), domainFailure = new Error("Domain validation failed"), validateFailure = new Error("Required field failed");
  const validate = vi.fn();
  await expect(withTicketFieldMutation({ session, transaction: tx }, "tickets.ticket.watch", async current => {
    await updateWorkWithFieldReceipt(tx, current, "native", 1, {}); throw domainFailure;
  }, validate)).rejects.toBe(domainFailure); expect(validate).not.toHaveBeenCalled();
  let retained: object | undefined;
  await expect(withTicketFieldMutation({ session, transaction: tx }, "tickets.ticket.watch", current => updateWorkWithFieldReceipt(tx, current, "native", 2, {}),
    async (_authority, _records, _operation, proof) => { retained = proof; throw validateFailure; })).rejects.toBe(validateFailure);
  await expect(authoriseTicketNativeValidation({ session, transaction: tx }, input("native", 3), "tickets.ticket.watch", retained!)).rejects.toThrow("FORBIDDEN");
  await expect(withTicketFieldMutation({ session, transaction: tx }, "tickets.ticket.watch", current => updateWorkWithFieldReceipt(tx, current, "native", 3, {}), async () => {})).resolves.toBeUndefined();
});

it("refuses nested scopes, native changes during final validation, failed CAS and mismatched actual revisions", async () => {
  const session = await actor(), validate = vi.fn();
  await expect(withTicketFieldMutation({ session, transaction: tx }, "tickets.ticket.watch", current =>
    withTicketFieldMutation({ session: current, transaction: tx }, "tickets.ticket.watch", async () => {}, validate), validate)).rejects.toThrow("Nested");
  m.update.mockResolvedValueOnce({ count: 0 });
  await expect(withTicketFieldMutation({ session, transaction: tx }, "tickets.ticket.watch", current => updateWorkWithFieldReceipt(tx, current, "native", 1, {}), validate)).rejects.toThrow("changed");
  m.row.mockResolvedValueOnce(work("native", "TICKET", { version: 99 }));
  await expect(withTicketFieldMutation({ session, transaction: tx }, "tickets.ticket.watch", current => updateWorkWithFieldReceipt(tx, current, "native", 1, {}), validate)).rejects.toThrow("changed");
  expect(validate).not.toHaveBeenCalled();
  await withTicketFieldMutation({ session, transaction: tx }, "tickets.ticket.watch", current => updateWorkWithFieldReceipt(tx, current, "native", 2, {}), async authority => {
    await expect(updateWorkWithFieldReceipt(tx, authority.session, "native", 3, {})).rejects.toThrow("FORBIDDEN");
  });
});

it("never manufactures a proof for unscoped SQL helpers and rejects unsupported operation identifiers", async () => {
  const session = await actor(); await updateWorkWithFieldReceipt(tx, session, "native", 1, {});
  await expect(authoriseTicketNativeValidation({ session, transaction: tx }, input(), "tickets.ticket.watch", {})).rejects.toThrow("FORBIDDEN");
  await expect(withTicketFieldMutation({ session, transaction: tx }, "tickets.unknown" as TicketFieldOperation, async () => {}, async () => {})).rejects.toThrow();
  expect(m.field).not.toHaveBeenCalled();
});


it("projects actual unwatch resulting facts only through the proof-bound registry gateway", async () => {
  const session = await actor();
  await withTicketFieldMutation({ session, transaction: tx }, "tickets.ticket.watch",
    current => updateWorkWithFieldReceipt(tx, current, "native", 1, { watcherIds: [] }), async (authority, _records, operation, proof) => {
      authority.registry.register("tickets", ticketStudioContract);
      const source = authority.registry.describe("tickets.ticket", 9), context = { session: authority.session, transaction: tx };
      const scope = await authority.registry.resolveNativeValidationFieldPolicy(context, source, input(), operation, proof);
      expect(scope.query.id).toBe("tickets.ticket.native_validation_watch");
      expect(scope.anchor).toEqual({ recordId: "native", organisationId: "company", revision: 2 });
      m.row.mockClear(); m.raw.mockClear();
      expect(await authority.registry.invokeNativeValidationFacts(context, source, input(), operation, proof)).toEqual({
        recordId: "native", organisationId: "company", revision: 2, fields: { status: "NEW", priority: "NORMAL" } });
      expect(m.row).toHaveBeenCalledWith({ where: { id: "native", organisationId: "company", kind: "TICKET", version: 2 },
        select: { id: true, organisationId: true, kind: true, version: true, status: true, priority: true } });
      expect(authority.session.capabilities.has("tickets.ticket.read")).toBe(false);
      m.row.mockClear(); m.raw.mockClear();
      await expect(authority.registry.invokeNativeValidationFacts(context, source, input(), operation, {})).rejects.toThrow("FORBIDDEN");
      expect(m.row).not.toHaveBeenCalled(); expect(m.raw).not.toHaveBeenCalled();
      const genericContext = { ...context, nativeValidationProof: proof };
      await expect(authority.registry.invokeQueryInTransaction(genericContext, scope.query, input())).rejects.toThrow("owning mutation proof");
      expect(m.row).not.toHaveBeenCalled(); expect(m.raw).not.toHaveBeenCalled();
    });
});

it("registers all seven exact operation policies without modifying old entity descriptors", async () => {
  const session = await actor();
  await withTicketFieldMutation({ session, transaction: tx }, "tickets.ticket.watch",
    current => updateWorkWithFieldReceipt(tx, current, "native", 1, {}), async (authority, _records, operation, proof) => {
      authority.registry.register("tickets", ticketStudioContract);
      const policies = ["create", "manage", "reply", "watch", "query_create", "query_update", "case_merge"]
        .map(suffix => authority.registry.describe(`tickets.ticket.native_validation_${suffix}`, 1));
      expect(policies).toHaveLength(7);
      for (const policy of policies) expect(policy).toMatchObject({ version: 1, ownerModuleId: "tickets", kind: "query", details: {
        transaction: "required", nativeValidation: { entityId: "tickets.ticket", operation: policy.capability, fieldVersions: [2, 3, 4, 5, 6, 7, 8, 9] } } });
      for (const version of [2, 3, 4, 5, 6, 7, 8, 9]) {
        const source = authority.registry.describe("tickets.ticket", version);
        expect(source.details.nativeValidation).toBeUndefined();
        await expect(authority.registry.resolveNativeValidationFieldPolicy({ session: authority.session, transaction: tx }, source, input(), operation, proof))
          .resolves.toMatchObject({ query: { id: "tickets.ticket.native_validation_watch" } });
      }
      m.row.mockResolvedValueOnce(null);
      await expect(authority.registry.invokeNativeValidationFacts({ session: authority.session, transaction: tx }, authority.registry.describe("tickets.ticket", 9), input(), operation, proof))
        .rejects.toThrow("Ticket unavailable or changed");
    });
});
