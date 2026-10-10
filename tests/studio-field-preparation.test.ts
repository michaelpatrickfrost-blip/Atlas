import { beforeEach, expect, it, vi } from "vitest";
import type { Session } from "@/core/auth/session";
import type { FieldMigrationPrincipal } from "@/core/studio/fields/principal-contract";
import { Prisma } from "@/generated/prisma/client";
const m = vi.hoisted(() => ({ transaction: vi.fn(), resolve: vi.fn(), enabled: vi.fn(), raw: vi.fn(), member: vi.fn(), module: vi.fn(), company: vi.fn(), definition: vi.fn(),
  generation: vi.fn(), existing: vi.fn(), create: vi.fn(), audit: vi.fn(), unavailable: vi.fn(), count: vi.fn() }));
vi.mock("@/core/db/client", () => ({ db: { $transaction: m.transaction } }));
vi.mock("@/core/studio/fields/principal", () => ({ resolveFieldMigrationPrincipal: m.resolve }));
vi.mock("@/core/modules/access", () => ({ assertModuleEnabled: m.enabled }));
vi.mock("@/core/studio/registry/runtime", () => ({ studioRegistry: () => registry }));
import { CapabilityRegistry } from "@/core/studio/registry/registry";
import { ticketStudioContract } from "@/core/service-work/studio";
import { compileCustomField } from "@/core/studio/compiler/fields";
import { customFieldPayloadSchema } from "@/core/studio/fields/schema";
import { startFieldMigrationPreparation } from "@/core/studio/fields/migrations/preparation";
const registry = new CapabilityRegistry(async () => true); registry.register("tickets", ticketStudioContract);
const uuid = (value: number) => `00000000-0000-4000-8000-${value.toString().padStart(12, "0")}`;
const session: Session = { userId: "user", userName: "User", userEmail: "user@example.invalid", membershipId: "member", organisationId: "company", organisationName: "Company",
  capabilities: new Set(["studio.definition.publish", "tickets.ticket.read", "tickets.ticket.manage"]) };
const principal: FieldMigrationPrincipal = { organisationId: "company", userId: "user", membershipId: "member", sessionVersion: 2, authVersion: 3, authority: "customer" };
const ref = (version: number) => { const metadata = registry.describe("tickets.ticket", version); return { id: metadata.id, version, schemaHash: metadata.schemaHash, contractHash: metadata.contractHash }; };
const source = customFieldPayloadSchema.parse({ schemaVersion: 1, entity: ref(2), storageGeneration: uuid(1), field: { key: "extra", label: "Extra", classification: "confidential", storage: { type: "integer" } } });
const target = customFieldPayloadSchema.parse({ ...source, entity: ref(3), storageGeneration: uuid(2), field: { ...source.field, storage: { type: "decimal" } } });
const request = { operationId: uuid(3), definitionId: uuid(4), definitionRevision: 7, draftRevision: 9, conversion: { kind: "integer_to_decimal" } };
const tx = { $queryRaw: m.raw, membership: { findFirst: m.member }, moduleState: { findFirst: m.module }, organisation: { findFirst: m.company }, studioDefinition: { findFirst: m.definition },
  studioFieldGeneration: { findFirst: m.generation }, studioFieldMigrationPreparation: { findFirst: m.existing, create: m.create }, auditEntry: { create: m.audit },
  serviceWorkItem: { findFirst: m.unavailable, count: m.count } };
let definition: { id: string; revision: number; draft: { id: string; revision: number; payload: unknown }; activeVersion: { id: string; checksum: string; payload: unknown; compiledPlan: unknown } };
beforeEach(async () => {
  vi.clearAllMocks(); m.transaction.mockImplementation(async (run: (client: typeof tx) => Promise<unknown>) => run(tx));
  m.resolve.mockResolvedValue(session); m.enabled.mockResolvedValue(undefined);
  m.raw.mockImplementation(async (strings: TemplateStringsArray) => strings.join("?").includes("SHOW transaction_isolation") ? [{ transaction_isolation: "serializable" }] : []);
  m.member.mockResolvedValue({ id: "member", sessionVersion: 2, user: { authVersion: 3 } }); m.module.mockResolvedValue({ id: "enabled" });
  m.company.mockResolvedValue({ id: "company", kind: "CUSTOMER", status: "ACTIVE", archivedAt: null, isTest: true });
  const compiled = await compileCustomField(session, source, registry);
  definition = { id: uuid(4), revision: 7, draft: { id: uuid(5), revision: 9, payload: structuredClone(target) }, activeVersion: { id: uuid(6), checksum: compiled.checksum, payload: structuredClone(source), compiledPlan: compiled.plan } };
  m.definition.mockResolvedValue(definition); m.generation.mockResolvedValue({ id: uuid(1) }); m.existing.mockResolvedValue(null);
  m.create.mockResolvedValue({ id: uuid(3), revision: 0, state: "PREPARING" }); m.audit.mockResolvedValue({ id: "audit" }); m.unavailable.mockResolvedValue(null); m.count.mockResolvedValue(5);
});

it("pins actual server source/draft/owner identities and audits inside the same Serializable transaction without values or native writes", async () => {
  expect(await startFieldMigrationPreparation(session, principal, request)).toEqual({ id: uuid(3), revision: 0, state: "PREPARING" });
  expect(m.transaction).toHaveBeenCalledWith(expect.any(Function), { isolationLevel: "Serializable" }); expect(m.resolve).toHaveBeenCalledTimes(2);
  expect(m.definition).toHaveBeenCalledWith({ where: { id: uuid(4), organisationId: "company", kind: "customField", retiredAt: null, revision: 7 }, include: { draft: true, activeVersion: true } });
  const data = m.create.mock.calls[0][0].data;
  expect(data.intent).toMatchObject({ id: uuid(3), definitionRevision: 7, principal, source: { versionId: uuid(6), payload: source }, target: { draftId: uuid(5), draftRevision: 9, payload: target },
    ownerQuery: { id: "tickets.ticket.field_migration", version: 1 } });
  expect(data).not.toHaveProperty("observations"); expect(data).not.toHaveProperty("values");
  expect(m.count.mock.invocationCallOrder[0]).toBeLessThan(m.create.mock.invocationCallOrder[0]);
  expect(m.audit).toHaveBeenCalledWith({ data: expect.objectContaining({ organisationId: "company", actorUserId: "user", action: "studio.field.migration.prepared", entityId: uuid(3) }) });
  expect(m.generation).toHaveBeenCalledWith(expect.objectContaining({ where: expect.objectContaining({ id: uuid(1), organisationId: "company", definitionId: uuid(4) }) }));
});

it("replays only identical fresh intent without another creation or audit", async () => {
  await startFieldMigrationPreparation(session, principal, request);
  const data = m.create.mock.calls[0][0].data; m.existing.mockResolvedValue({ ...data, revision: 2, state: "PREPARING" }); m.create.mockClear(); m.audit.mockClear();
  expect(await startFieldMigrationPreparation(session, principal, request)).toEqual({ id: uuid(3), revision: 2, state: "PREPARING" });
  expect(m.create).not.toHaveBeenCalled(); expect(m.audit).not.toHaveBeenCalled();
  for (const changed of [{ ...data, intentChecksum: "f".repeat(64) }, { ...data, intent: { ...data.intent, definitionRevision: 8 } }, { ...data, state: "CANCELLED" }]) {
    m.existing.mockResolvedValue(changed); await expect(startFieldMigrationPreparation(session, principal, request)).rejects.toThrow("stale or has changed");
  }
});

it("rejects client authority/payloads and mismatched or revoked server principal before persistence", async () => {
  for (const input of [{ ...request, organisationId: "other" }, { ...request, principal }, { ...request, payload: target }, { ...request, ownerQuery: {} }])
    await expect(startFieldMigrationPreparation(session, principal, input)).rejects.toThrow();
  await expect(startFieldMigrationPreparation(session, { ...principal, organisationId: "other" }, request)).rejects.toThrow("FORBIDDEN");
  m.resolve.mockRejectedValue(new Error("FORBIDDEN: revoked")); await expect(startFieldMigrationPreparation(session, principal, request)).rejects.toThrow("revoked");
  expect(m.transaction).not.toHaveBeenCalled(); expect(m.create).not.toHaveBeenCalled();
});

it("rechecks live identity/module/company/field/native policy under locks", async () => {
  m.member.mockResolvedValue({ sessionVersion: 3, user: { authVersion: 3 } }); await expect(startFieldMigrationPreparation(session, principal, request)).rejects.toThrow("authority changed");
  m.member.mockResolvedValue({ sessionVersion: 2, user: { authVersion: 3 } }); m.module.mockResolvedValue(null);
  await expect(startFieldMigrationPreparation(session, principal, request)).rejects.toThrow("Studio is unavailable"); m.module.mockResolvedValue({ id: "enabled" });
  m.company.mockResolvedValue({ id: "company", kind: "CUSTOMER", status: "ACTIVE", archivedAt: null, isTest: false });
  await expect(startFieldMigrationPreparation(session, principal, request)).rejects.toThrow("studio.test.live_data");
  m.company.mockResolvedValue({ id: "company", kind: "CUSTOMER", status: "ACTIVE", archivedAt: null, isTest: true });
  m.unavailable.mockResolvedValue({ id: "private" }); await expect(startFieldMigrationPreparation(session, principal, request)).rejects.toThrow("MIGRATION_ACCESS_REQUIRED");
  expect(m.create).not.toHaveBeenCalled();
});

it("rejects stale drafts, missing bindings, corrupted source plans and missing owner opt-in", async () => {
  m.definition.mockResolvedValue(null); await expect(startFieldMigrationPreparation(session, principal, request)).rejects.toThrow("stale or has changed"); m.definition.mockResolvedValue(definition);
  definition.draft.revision++; await expect(startFieldMigrationPreparation(session, principal, request)).rejects.toThrow("stale or has changed"); definition.draft.revision--;
  const checksum = definition.activeVersion.checksum; definition.activeVersion.checksum = "f".repeat(64);
  await expect(startFieldMigrationPreparation(session, principal, request)).rejects.toThrow("stale or has changed"); definition.activeVersion.checksum = checksum;
  m.generation.mockResolvedValue(null); await expect(startFieldMigrationPreparation(session, principal, request)).rejects.toThrow("storage generation"); m.generation.mockResolvedValue({ id: uuid(1) });
  definition.draft.payload = { ...target, entity: source.entity }; await expect(startFieldMigrationPreparation(session, principal, request)).rejects.toThrow("MIGRATION_OWNER_REQUIRED");
  expect(m.create).not.toHaveBeenCalled();
});

it("propagates audit failure and translates serialization/foreign operation ID collision to a safe refresh conflict", async () => {
  m.audit.mockRejectedValue(new Error("Audit unavailable")); await expect(startFieldMigrationPreparation(session, principal, request)).rejects.toThrow("Audit unavailable");
  for (const code of ["P2034", "P2002"]) {
    m.transaction.mockRejectedValue(new Prisma.PrismaClientKnownRequestError("Database conflict", { code, clientVersion: "test" }));
    await expect(startFieldMigrationPreparation(session, principal, request)).rejects.toThrow("stale or has changed");
  }
});
