import { beforeEach, expect, it, vi } from "vitest";
import type { Prisma, ServiceWorkItem } from "@/generated/prisma/client";
const m = vi.hoisted(() => ({ member: vi.fn(), raw: vi.fn(), company: vi.fn(), states: vi.fn(), enabled: vi.fn(), create: vi.fn(), row: vi.fn(), transaction: vi.fn() }));
vi.mock("@/core/db/client", () => ({ db: { membership: { findUnique: m.member }, $transaction: m.transaction } }));
vi.mock("@/core/studio/registry/runtime", async () => {
  const { CapabilityRegistry } = await import("@/core/studio/registry/registry");
  const { ticketStudioContract } = await import("@/core/service-work/studio");
  return { buildRegistry: (available: ConstructorParameters<typeof CapabilityRegistry>[0]) => { const registry = new CapabilityRegistry(available); registry.register("tickets", ticketStudioContract); return registry; } };
});
import { sessionForUser } from "@/core/auth/session";
import { createTicketWithFieldInitialisation, authoriseNewTicketFields } from "@/core/service-work/studio-create";
import { compileCustomField, compileCustomFieldForInitialisation } from "@/core/studio/compiler/fields";
import { entityDetailsSchema } from "@/core/studio/registry/entities";
import { checksum } from "@/core/studio/registry/contracts";
import { ticketStudioContract } from "@/core/service-work/studio";
import { cutoverUuid as uuid } from "./fixtures/studio-field-cutover";
const tx = { membership: { findUnique: m.member }, $queryRaw: m.raw, organisation: { findFirst: m.company },
  moduleState: { findMany: m.states, findFirst: m.enabled }, serviceWorkItem: { create: m.create, findFirst: m.row } } as unknown as Prisma.TransactionClient;
const data: Prisma.ServiceWorkItemUncheckedCreateInput = { organisationId: "company", kind: "TICKET", requesterUserId: "actor", queueId: "queue", number: "TKT-1", subject: "Created" };
const work = { ...data, id: "new", version: 1, status: "NEW", mergedIntoId: null } as unknown as ServiceWorkItem;
const fixture = () => ({ id: "member", userId: "actor", organisationId: "company", sessionVersion: 2, active: true,
  grantedCapabilities: ["tickets.ticket.create"], deniedCapabilities: [] as string[], roles: [],
  user: { name: "Actor", email: "actor@example.invalid", authVersion: 3, platformAdmin: null },
  organisation: { id: "company", name: "Company", kind: "CUSTOMER", status: "ACTIVE", archivedAt: null, auditAccess: null, restrictedAccessAreas: [] } });
let member: ReturnType<typeof fixture>;
beforeEach(() => {
  vi.resetAllMocks(); member = fixture(); m.member.mockImplementation(async () => structuredClone(member));
  m.raw.mockImplementation(async strings => strings.join("") === "SHOW transaction_isolation" ? [{ transaction_isolation: "serializable" }] : []);
  m.company.mockResolvedValue({ id: "company" }); m.states.mockResolvedValue([{ moduleId: "tickets", enabled: true, entitled: true }]);
  m.enabled.mockResolvedValue({ id: "enabled" }); m.create.mockResolvedValue(work);
  m.row.mockResolvedValue({ ...work, priority: "HIGH" });
});
async function actor() { const session = await sessionForUser("company", "actor"); if (!session) throw new Error("Missing test principal."); return session; }
it("initialises only the actual freshly inserted record for create-only authority, with no read/manage grants", async () => {
  const session = await actor(); let retained: object | undefined;
  const result = await createTicketWithFieldInitialisation({ session, transaction: tx }, data, async (authority, created, proof) => {
    retained = proof; expect(created).toBe(work); expect(m.create).toHaveBeenCalledExactlyOnceWith({ data });
    expect(authority.session.capabilities.has("tickets.ticket.read")).toBe(false); expect(authority.session.capabilities.has("tickets.ticket.manage")).toBe(false);
    const ref = authority.registry.describe("tickets.ticket", 6), context = { session: authority.session, transaction: tx };
    await expect(authority.registry.resolve(authority.session, ref)).rejects.toThrow("FORBIDDEN");
    await expect(authority.registry.authoriseRecord(context, ref, { recordId: "existing", intent: "extend", expectedRevision: 1 })).rejects.toThrow("FORBIDDEN");
    expect(await authority.registry.authoriseRecordInitialisation(context, ref, proof)).toEqual({ recordId: "new", organisationId: "company", revision: 1 });
    return "initialised";
  });
  expect(result).toEqual({ work, result: "initialised" }); expect(m.transaction).not.toHaveBeenCalled();
  await expect(authoriseNewTicketFields({ session, transaction: tx }, retained!)).rejects.toThrow("FORBIDDEN");
});
it("rejects invented/copied/foreign transaction/principal/tenant proofs during the valid callback", async () => {
  const session = await actor();
  await createTicketWithFieldInitialisation({ session, transaction: tx }, data, async (authority, _work, proof) => {
    const context = { session: authority.session, transaction: tx };
    for (const invalid of [{}, { ...proof }, JSON.parse(JSON.stringify(proof))]) await expect(authoriseNewTicketFields(context, invalid)).rejects.toThrow("FORBIDDEN");
    await expect(authoriseNewTicketFields({ ...context, transaction: {} as Prisma.TransactionClient }, proof)).rejects.toThrow("FORBIDDEN");
    await expect(authoriseNewTicketFields({ ...context, session: { ...authority.session } }, proof)).rejects.toThrow("FORBIDDEN");
    authority.session.organisationId = "foreign"; await expect(authoriseNewTicketFields(context, proof)).rejects.toThrow("FORBIDDEN");
  });
});
it("revokes the creation proof on initializer failure and leaves rollback to the owning transaction", async () => {
  const session = await actor(), failure = new Error("Field validation failed"); let retained: object | undefined;
  await expect(createTicketWithFieldInitialisation({ session, transaction: tx }, data, async (_authority, _work, proof) => { retained = proof; throw failure; })).rejects.toBe(failure);
  await expect(authoriseNewTicketFields({ session, transaction: tx }, retained!)).rejects.toThrow("FORBIDDEN");
  expect(m.transaction).not.toHaveBeenCalled();
});
it("rejects revoked creator/source, foreign/native-final/query scope and stale authentication before INSERT", async () => {
  const session = await actor(), initialise = vi.fn();
  member.deniedCapabilities = ["tickets.ticket.create"];
  await expect(createTicketWithFieldInitialisation({ session, transaction: tx }, data, initialise)).rejects.toThrow("FORBIDDEN"); member.deniedCapabilities = [];
  member.user.authVersion++; await expect(createTicketWithFieldInitialisation({ session, transaction: tx }, data, initialise)).rejects.toThrow("FORBIDDEN"); member.user.authVersion--;
  m.enabled.mockResolvedValueOnce(null); await expect(createTicketWithFieldInitialisation({ session, transaction: tx }, data, initialise)).rejects.toThrow("unavailable");
  for (const invalid of [{ ...data, organisationId: "foreign" }, { ...data, kind: "QUERY" }, { ...data, requesterUserId: "other" },
    { ...data, status: "RESOLVED" }, { ...data, version: 2 }, { ...data, mergedIntoId: "existing" }])
    await expect(createTicketWithFieldInitialisation({ session, transaction: tx }, invalid, initialise)).rejects.toThrow("scope");
  await expect(createTicketWithFieldInitialisation({ session }, data, initialise)).rejects.toThrow("transaction");
  await expect(createTicketWithFieldInitialisation({ session: { ...session }, transaction: tx }, data, initialise)).rejects.toThrow("FORBIDDEN");
  expect(m.create).not.toHaveBeenCalled(); expect(initialise).not.toHaveBeenCalled();
});
it("rejects unsupported old contracts and unavailable owner initialisation without exposing existing record operations", async () => {
  const session = await actor();
  await createTicketWithFieldInitialisation({ session, transaction: tx }, data, async (authority, _work, proof) => {
    await expect(authority.registry.authoriseRecordInitialisation({ session: authority.session, transaction: tx }, authority.registry.describe("tickets.ticket", 5), proof)).rejects.toThrow("no new-record");
    await expect(authority.registry.authoriseRecordInitialisation({ session: authority.session }, authority.registry.describe("tickets.ticket", 6), proof)).rejects.toThrow("transaction");
    await expect(authority.registry.resolveForRecordInitialisation(authority.session, { ...authority.registry.describe("tickets.ticket", 6), contractHash: "e".repeat(64) })).rejects.toThrow("changed");
  });
});
it("uses explicit current v7 coverage and proof-bound facts for legacy fields with create-only authority", async () => {
  const session = await actor(); let retained: object | undefined;
  await createTicketWithFieldInitialisation({ session, transaction: tx }, data, async (authority, _created, proof) => {
    retained = proof;
    const source = authority.registry.describe("tickets.ticket", 2), context = { session: authority.session, transaction: tx };
    const current = await authority.registry.resolveCurrentFieldInitialisation(authority.session, source);
    expect(current.owner.version).toBe(7); expect(current.source.version).toBe(2);
    expect(await authority.registry.authoriseCurrentFieldInitialisation(context, source, proof)).toMatchObject({ recordId: "new", revision: 1 });
    expect(await authority.registry.invokeInitialRecordFacts(context, source, proof)).toEqual({ recordId: "new", organisationId: "company", revision: 1, fields: { status: "NEW", priority: "HIGH" } });
    expect(m.row).toHaveBeenCalledWith({ where: { id: "new", organisationId: "company", kind: "TICKET", version: 1 },
      select: { id: true, organisationId: true, kind: true, requesterUserId: true, version: true, status: true, priority: true, mergedIntoId: true } });
    await expect(authority.registry.invokeInitialRecordFacts(context, source, { ...proof })).rejects.toThrow("FORBIDDEN");
    const generic = { ...context, initialisationProof: proof };
    await expect(authority.registry.invokeQueryInTransaction(generic, authority.registry.describe("tickets.ticket.initial_required_facts", 1), { recordId: "new", expectedRevision: 1 })).rejects.toThrow("owning creation proof");
    expect(m.row).toHaveBeenCalledTimes(1);
    expect(authority.session.capabilities).toEqual(session.capabilities);
  });
  const registry = (await import("@/core/studio/registry/runtime")).buildRegistry(async () => true);
  await expect(registry.invokeInitialRecordFacts({ session, transaction: tx }, registry.describe("tickets.ticket", 2), retained!)).rejects.toThrow("FORBIDDEN");
});
it("compiles new-record legacy field policies without native read/manage while retaining explicit field/reference rights", async () => {
  const session = await actor();
  await createTicketWithFieldInitialisation({ session, transaction: tx }, data, async (authority, _work, proof) => {
    const source = authority.registry.describe("tickets.ticket", 2), { id, version, schemaHash, contractHash } = source;
    const payload = { schemaVersion: 1, entity: { id, version, schemaHash, contractHash }, storageGeneration: uuid(90),
      field: { key: "extra", label: "Additional detail", classification: "confidential", storage: { type: "boolean" } } };
    const compiled = await compileCustomFieldForInitialisation(authority.session, payload, authority.registry, "write");
    expect(compiled.payload.field.storage.type).toBe("boolean");
    await expect(compileCustomField(authority.session, payload, authority.registry)).rejects.toThrow("FORBIDDEN");
    await expect(compileCustomFieldForInitialisation(authority.session, { ...payload, field: { ...payload.field, readCapability: "tickets.field.secret" } }, authority.registry, "read")).rejects.toThrow("FORBIDDEN");
    await expect(compileCustomFieldForInitialisation(authority.session, { ...payload, field: { ...payload.field, writeCapability: "tickets.field.edit" } }, authority.registry, "write")).rejects.toThrow("FORBIDDEN");
    await expect(compileCustomFieldForInitialisation(authority.session, { ...payload, field: { ...payload.field, storage: { type: "reference", entity: payload.entity } } }, authority.registry, "read")).rejects.toThrow("FORBIDDEN");
    expect(await authority.registry.authoriseCurrentFieldInitialisation({ session: authority.session, transaction: tx }, source, proof)).toMatchObject({ recordId: "new" });
  });
});
it("fails closed for unsupported latest coverage, exact source hashes and changed created-record scope", async () => {
  const session = await actor();
  await createTicketWithFieldInitialisation({ session, transaction: tx }, data, async (authority, _work, proof) => {
    const source = authority.registry.describe("tickets.ticket", 2), context = { session: authority.session, transaction: tx };
    await expect(authority.registry.resolveCurrentFieldInitialisation(authority.session, { ...source, contractHash: "f".repeat(64) })).rejects.toThrow("source changed");
    for (const changed of [{ ...work, priority: "HIGH", organisationId: "foreign" }, { ...work, priority: "HIGH", requesterUserId: "other" },
      { ...work, priority: "HIGH", version: 2 }, { ...work, priority: "HIGH", status: "RESOLVED" }]) {
      m.row.mockResolvedValue(changed);
      await expect(authority.registry.invokeInitialRecordFacts(context, source, proof)).rejects.toThrow("unavailable or changed");
    }
    const contribution = ticketStudioContract.contributions.find(c => c.metadata.id === "tickets.ticket" && c.metadata.version === 7)!;
    const details = entityDetailsSchema.parse(contribution.metadata.details);
    const changed = { ...details, record: { ...details.record!, initialisation: { ...details.record!.initialisation!, acceptedFieldVersions: [7] } } };
    authority.registry.register("tickets", { contributions: [{ ...contribution, metadata: { ...contribution.metadata, version: 8, details: changed, schemaHash: checksum(changed) } }] });
    await expect(authority.registry.resolveCurrentFieldInitialisation(authority.session, source)).rejects.toThrow("current owner does not approve");
  });
});
