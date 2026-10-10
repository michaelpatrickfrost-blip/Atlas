import { beforeEach, expect, it, vi } from "vitest";
import type { Session } from "@/core/auth/session";
import type { Prisma } from "@/generated/prisma/client";
const m = vi.hoisted(() => ({ enabled: vi.fn(), row: vi.fn(), raw: vi.fn() }));
vi.mock("@/core/db/client", () => ({ db: {} }));
import { ticketStudioContract } from "@/core/service-work/studio";
import { CapabilityRegistry } from "@/core/studio/registry/registry";
import { entityDetailsSchema } from "@/core/studio/registry/entities";
import { checksum } from "@/core/studio/registry/contracts";
import { registeredRequiredFactMetadata } from "@/core/studio/fields/required-owner";
import { compileRequiredCondition } from "@/core/studio/fields/required-compiler";
import { cutoverUuid as uuid } from "./fixtures/studio-field-cutover";
const session: Session = { userId: "actor", userName: "Actor", userEmail: "actor@example.invalid", membershipId: "member", organisationId: "company", organisationName: "Company", capabilities: new Set(["tickets.ticket.read"]) };
const tx = { moduleState: { findFirst: m.enabled }, serviceWorkItem: { findFirst: m.row }, $queryRaw: m.raw } as unknown as Prisma.TransactionClient;
const row = { id: "ticket", organisationId: "company", version: 3, status: "RESOLVED", priority: "HIGH", mergedIntoId: null, queueId: "queue", queue: { restricted: true } };
function setup(available = true) { const registry = new CapabilityRegistry(async () => available); registry.register("tickets", ticketStudioContract); return registry; }
beforeEach(() => { vi.clearAllMocks(); m.enabled.mockResolvedValue({ id: "enabled" }); m.row.mockResolvedValue(row);
  m.raw.mockImplementation(async strings => strings.join("") === "SHOW transaction_isolation" ? [{ transaction_isolation: "serializable" }] : []); });
async function run(registry = setup(), actor = session, input: unknown = { recordId: "ticket", expectedRevision: 3 }) {
  return registry.invokeQueryInTransaction({ session: actor, transaction: tx }, registry.describe("tickets.ticket.required_facts", 1), input);
}
it("declares only approved hashed v6 facts and leaves v1–5 owner metadata intact", () => {
  const registry = setup();
  for (const version of [1, 2, 3, 4, 5]) expect(entityDetailsSchema.parse(registry.describe("tickets.ticket", version).details).record).not.toHaveProperty("requiredFacts");
  expect(entityDetailsSchema.parse(registry.describe("tickets.ticket", 6).details).record?.requiredFacts).toMatchObject({ query: { id: "tickets.ticket.required_facts", version: 1 },
    facts: [{ fieldId: "status", type: "enum" }, { fieldId: "priority", type: "enum" }] });
});
it("reads exact resulting canonical facts through read/private policy, including final records, without native mutation", async () => {
  expect(await run()).toEqual({ recordId: "ticket", organisationId: "company", revision: 3, fields: { status: "RESOLVED", priority: "HIGH" } });
  expect(m.row.mock.calls[0][0].where.AND[0]).toMatchObject({ organisationId: "company" });
  expect(m.row.mock.calls[1][0]).toEqual({ where: { id: "ticket", organisationId: "company", kind: "TICKET", version: 3 }, select: { id: true, organisationId: true, version: true, status: true, priority: true } });
  expect(m.raw.mock.calls.some(([strings]) => strings.join("").includes("FOR SHARE"))).toBe(true);
});
it("rejects no-transaction/nonserializable, stale/foreign/private native records and untrusted input", async () => {
  const registry = setup(), ref = registry.describe("tickets.ticket.required_facts", 1);
  await expect(registry.invoke(session, ref, { recordId: "ticket", expectedRevision: 3 })).rejects.toThrow("shared server transaction");
  m.raw.mockResolvedValue([{ transaction_isolation: "read committed" }]); await expect(run()).rejects.toThrow("serializable"); expect(m.row).not.toHaveBeenCalled();
  m.raw.mockResolvedValue([{ transaction_isolation: "serializable" }]);
  await expect(run(registry, session, { recordId: "ticket", expectedRevision: 2 })).rejects.toThrow("changed");
  await expect(run(registry, session, { recordId: "ticket", expectedRevision: 3, organisationId: "foreign" })).rejects.toThrow();
  m.row.mockResolvedValue(null); await expect(run()).rejects.toThrow("unavailable");
  m.row.mockResolvedValueOnce(row).mockResolvedValueOnce({ ...row, organisationId: "foreign" }); await expect(run()).rejects.toThrow("unavailable");
});
it("enforces native read/source enablement and rejects malformed canonical codes", async () => {
  await expect(run(setup(), { ...session, capabilities: new Set(["studio.definition.publish"]) })).rejects.toThrow("FORBIDDEN");
  await expect(run(setup(false))).rejects.toThrow("unavailable");
  m.enabled.mockResolvedValue(null); await expect(run()).rejects.toThrow("unavailable"); expect(m.row).not.toHaveBeenCalled();
  m.enabled.mockResolvedValue({ id: "enabled" }); m.row.mockResolvedValue({ ...row, status: "EXECUTE_SQL" }); await expect(run()).rejects.toThrow();
});
it("resolves condition metadata only from registered owner declarations, never readable fields or caller facts", async () => {
  const registry = setup(), ref = registry.describe("tickets.ticket", 6);
  const metadata = await registeredRequiredFactMetadata(session, registry, ref, "status");
  expect(metadata).toMatchObject({ kind: "native", organisationId: "company", entity: { id: ref.id, version: ref.version, schemaHash: ref.schemaHash, contractHash: ref.contractHash }, fieldId: "status", storage: { type: "enum", codes: expect.arrayContaining(["RESOLVED"]) } });
  await expect(registeredRequiredFactMetadata(session, registry, ref, "subject")).rejects.toThrow("not approved");
  await expect(registeredRequiredFactMetadata(session, registry, registry.describe("tickets.ticket", 5), "status")).rejects.toThrow("not approved");
  await expect(registeredRequiredFactMetadata({ ...session, capabilities: new Set() }, registry, ref, "status")).rejects.toThrow("FORBIDDEN");
  const { id, version, schemaHash, contractHash } = ref;
  const compiled = await compileRequiredCondition({ session, registry, definitionId: uuid(90), approvedNativeFacts: new Set(["status", "priority"]),
    resolveMetadata: async source => source.kind === "native" ? registeredRequiredFactMetadata(session, registry, ref, source.fieldId) : null },
  { schemaVersion: 2, entity: { id, version, schemaHash, contractHash }, storageGeneration: uuid(91), field: { key: "resolution_code", label: "Resolution code", classification: "confidential", storage: { type: "string" } },
    requiredIf: { match: "all", predicates: [{ source: { kind: "native", fieldId: "status" }, operator: "equals", value: { type: "enum", value: "RESOLVED" } }] } });
  expect(compiled.plan.facts).toHaveLength(1); expect(m.row).not.toHaveBeenCalled();
});
it("rejects invalid/duplicate native declarations and a missing or unsafe fact query atomically", () => {
  const owner = ticketStudioContract.contributions.find(c => c.metadata.id === "tickets.ticket" && c.metadata.version === 6)!;
  const details = entityDetailsSchema.parse(owner.metadata.details), policy = details.record!.requiredFacts!;
  for (const facts of [[...policy.facts, policy.facts[0]], [{ ...policy.facts[0], fieldId: "subject" }],
    [{ ...policy.facts[0], classification: "public_internal" }], [{ ...policy.facts[0], codes: ["NEW", "NEW"] }]])
    expect(() => entityDetailsSchema.parse({ ...details, record: { ...details.record!, requiredFacts: { ...policy, facts } } })).toThrow();
  const changed = { ...details, record: { ...details.record!, requiredFacts: { ...policy, query: { id: "tickets.ticket.get", version: 1 } } } };
  const registry = new CapabilityRegistry(async () => true);
  expect(() => registry.register("tickets", { contributions: ticketStudioContract.contributions.map(c => c === owner ? { ...owner, metadata: { ...owner.metadata, details: changed, schemaHash: checksum(changed) } } : c) })).toThrow("Required facts");
  expect(() => registry.describe("tickets.ticket", 1)).toThrow("missing");
});
