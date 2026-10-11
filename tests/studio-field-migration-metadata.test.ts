import { beforeEach, expect, it, vi } from "vitest";
import type { Prisma } from "@/generated/prisma/client";
const m = vi.hoisted(() => ({ provider: vi.fn(), resolve: vi.fn(), raw: vi.fn() }));
vi.mock("@/core/studio/fields/required-source", () => ({ createRequiredMetadataProvider: m.provider }));
import { retainedCutoverFixture, cutoverUuid as uuid } from "./fixtures/studio-field-cutover";
import { compileFieldMigrationMetadata } from "@/core/studio/fields/migrations/metadata";
import { assertFieldMigrationPolicies, assertVersionedFieldMigrationPolicies } from "@/core/studio/fields/migrations/access";
import { conditionalFieldPlanSchema } from "@/core/studio/fields/conditional-compiler";
import { compileCustomField } from "@/core/studio/compiler/fields";
import { compileDefinition } from "@/core/studio/compiler";
import { conditionalFieldPayloadSchema } from "@/core/studio/fields/required-contract";
import { registeredRequiredFactMetadata } from "@/core/studio/fields/required-owner";
import { STUDIO_DATA_CAPABILITIES } from "@/core/studio/permissions";
import { checksum } from "@/core/studio/registry/contracts";
let f: Awaited<ReturnType<typeof retainedCutoverFixture>>;
const tx = { $queryRaw: m.raw } as unknown as Prisma.TransactionClient;
const company = { id: "company", kind: "CUSTOMER" as const, status: "ACTIVE" as const, archivedAt: null, isTest: true };
const root = uuid(90);
function payload() {
  const entity = f.registry.describe("tickets.ticket", 6);
  return conditionalFieldPayloadSchema.parse({ ...f.source.payload, schemaVersion: 2,
    entity: { id: entity.id, version: entity.version, schemaHash: entity.schemaHash, contractHash: entity.contractHash },
    requiredIf: { match: "all", predicates: [{ source: { kind: "native", fieldId: "status" }, operator: "equals", value: { type: "enum", value: "RESOLVED" } }] } });
}
const compile = (input: unknown, selectedCompany = company) => compileFieldMigrationMetadata({ session: f.session, transaction: tx }, f.registry, selectedCompany, root, input);
beforeEach(async () => {
  vi.resetAllMocks(); f = await retainedCutoverFixture();
  m.resolve.mockImplementation(async source => registeredRequiredFactMetadata(f.session, f.registry, payload().entity, source.fieldId));
  m.provider.mockImplementation(async () => ({ authority: { session: f.session, registry: f.registry, transaction: tx }, resolveMetadata: m.resolve }));
});
it("preserves exact v1 compilation/policy and keeps conditional metadata outside legacy parsers/authoring", async () => {
  expect(await compile(f.source.payload)).toEqual(await compileCustomField(f.session, f.source.payload, f.registry));
  expect(m.provider).not.toHaveBeenCalled();
  expect(() => assertFieldMigrationPolicies(f.session, company, payload())).toThrow();
  await expect(compileDefinition(f.session, "customField", payload(), f.registry)).rejects.toThrow();
});
it("uses the genuine locked provider registry and full conditional plan even without any record rows", async () => {
  const query = vi.spyOn(f.registry, "invokeQueryInTransaction"), records = vi.spyOn(f.registry, "authoriseRecord");
  // An unrelated caller registry must never supply conditional fact/owner meaning.
  const { CapabilityRegistry } = await import("@/core/studio/registry/registry");
  const compiled = await compileFieldMigrationMetadata({ session: f.session, transaction: tx }, new CapabilityRegistry(async () => false), company, root, payload());
  expect(m.provider).toHaveBeenCalledWith(f.session, tx, root, payload().entity);
  expect(m.resolve).toHaveBeenCalledWith({ kind: "native", fieldId: "status" });
  expect(compiled.plan.schemaVersion).toBe(2); expect(compiled.checksum).toBe(checksum(compiled.plan));
  expect(compiled.plan.dependencies.map(d => d.id)).toEqual(["tickets.ticket", "tickets.ticket.required_facts"]);
  expect(query).not.toHaveBeenCalled(); expect(records).not.toHaveBeenCalled(); expect(m.raw).not.toHaveBeenCalled();
});
it("rejects copied metadata-only sessions through the actual provider before transaction queries", async () => {
  const actual = await vi.importActual<typeof import("@/core/studio/fields/required-source")>("@/core/studio/fields/required-source");
  m.provider.mockImplementation(actual.createRequiredMetadataProvider);
  await expect(compile(payload())).rejects.toThrow("authenticated company access");
  expect(m.raw).not.toHaveBeenCalled();
});
it("rechecks refreshed publication and actual field access before compiling dependencies", async () => {
  m.provider.mockResolvedValue({ authority: { session: { ...f.session, capabilities: new Set(["tickets.ticket.read"]) }, registry: f.registry, transaction: tx }, resolveMetadata: m.resolve });
  await expect(compile(payload())).rejects.toThrow("studio.definition.publish"); expect(m.resolve).not.toHaveBeenCalled();
  m.provider.mockClear();
  await expect(compile({ ...payload(), field: { ...payload().field, writeCapability: "tickets.field.edit" } })).rejects.toThrow("tickets.field.edit");
  expect(m.provider).not.toHaveBeenCalled();
});
it("inspects every pinned field input, rejecting changed pins, cycles and missing independent read access", async () => {
  const source = { kind: "field" as const, definitionId: uuid(91), versionId: uuid(92), checksum: "e".repeat(64) };
  const metadata = { ...source, organisationId: "company", entity: payload().entity, generationId: uuid(93), dependencyClosure: [] as string[],
    field: { ...f.source.payload.field, key: "source_field", readCapability: "tickets.field.secret" } };
  const input = { ...payload(), requiredIf: { match: "all", predicates: [{ source, operator: "present" }] } };
  m.resolve.mockResolvedValue(metadata);
  await expect(compile(input)).rejects.toThrow("tickets.field.secret");
  f.session.capabilities.add("tickets.field.secret");
  const compiled = await compile(input);
  expect(conditionalFieldPlanSchema.parse(compiled.plan).fieldDependencies).toEqual([{ definitionId: source.definitionId, versionId: source.versionId, checksum: source.checksum }]);
  m.resolve.mockResolvedValue({ ...metadata, checksum: "f".repeat(64) }); await expect(compile(input)).rejects.toThrow("pin changed");
  m.resolve.mockResolvedValue({ ...metadata, dependencyClosure: [root] }); await expect(compile(input)).rejects.toThrow("Cyclic");
});
it("retains production preview and current/written identity protections without reading business values", async () => {
  await expect(compile(payload(), { ...company, isTest: false })).rejects.toThrow(STUDIO_DATA_CAPABILITIES.liveTest); expect(m.provider).not.toHaveBeenCalled();
  expect(() => assertVersionedFieldMigrationPolicies(f.session, company, payload(), { ...payload(), field: { ...payload().field, key: "foreign" } })).toThrow("FORBIDDEN");
  expect(() => assertVersionedFieldMigrationPolicies(f.session, { ...company, id: "foreign" }, payload())).toThrow("FORBIDDEN");
  expect(m.raw).not.toHaveBeenCalled();
});
