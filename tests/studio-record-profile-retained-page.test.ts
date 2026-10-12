import { beforeEach, expect, it, vi } from "vitest";
import { z } from "zod";
import type { Prisma } from "@/generated/prisma/client";
const m = vi.hoisted(() => ({ member: vi.fn(), version: vi.fn(), protected: vi.fn() }));
vi.mock("@/core/db/client", () => ({ db: { membership: { findUnique: m.member } } }));
import { sessionForUser, sessionAuthorityStamp, type Session } from "@/core/auth/session";
import { CapabilityRegistry } from "@/core/studio/registry/registry";
import { checksum, declarative, entity, query } from "@/core/studio/registry/contracts";
import { pageSource } from "@/core/studio/registry/page-contracts";
import type { PageSourcePolicy } from "@/core/studio/pages/owner-contract";
import type { FieldRuntimeAuthority } from "@/core/studio/fields/runtime-authority";
import type { SealedConfigurationVersion } from "@/core/studio/configuration/pins";
import { compileStructuredPage, compileRetainedStructuredPage } from "@/core/studio/pages/definition-compiler";
import { compileRecordProfile } from "@/core/studio/record-types/compiler";
import type { ConfigurationReference } from "@/core/studio/record-types/schema";
type PageReference = Extract<ConfigurationReference, { kind: "page" }>;

// Genuine opaque auth issuance and real registered-source/approval/Page/profile
// compilers. Membership and tenant immutable-version SQL storage are explicit
// mocks; no native owning read/provider, SQL, release or live claim follows.
const id = (n: number) => `81000000-0000-4000-8000-${String(n).padStart(12, "0")}`;
const grant = "example.work.read", owner = { label: "Work", capability: grant, lifecycle: "active" as const, classification: "confidential" as const };
const forms = ["desktop", "tablet", "phone"] as const;
let session: Session, registry: CapabilityRegistry, authority: FieldRuntimeAuthority, page: SealedConfigurationVersion;
let pin: PageReference;
const rows = new Map<string, SealedConfigurationVersion>();
const membership = (grantedCapabilities = [grant]) => ({ id: "member", userId: "actor", organisationId: "company", active: true,
  sessionVersion: 2, grantedCapabilities, deniedCapabilities: [], roles: [],
  user: { name: "Author", email: "author@example.test", authVersion: 3, platformAdmin: null },
  organisation: { id: "company", name: "Company", kind: "CUSTOMER", status: "ACTIVE", archivedAt: null, auditAccess: null, restrictedAccessAreas: [] } });
const tx = { studioDefinitionVersion: { findFirst: m.version } } as unknown as Prisma.TransactionClient;
const exact = (logicalId: string, version: number) => { const contract = registry.describe(logicalId, version); return {
  id: contract.id, version: contract.version, schemaHash: contract.schemaHash, contractHash: contract.contractHash }; };
const context = () => ({ session, transaction: tx, registry, definitionId: id(20) });
const profile = () => ({ schemaVersion: 1, entity: exact("example.work", 1), profile: { page: pin } });
function policy(version: number): PageSourcePolicy {
  return { schemaVersion: 1, entity: { id: "example.work", version: 1 }, accessMode: "ordinary_read", variants: false,
    fieldSourceVersions: [], nativeFields: [], queries: [], facts: [], commands: [], metrics: [],
    surfaces: Array.from({ length: version - 1 }, (_, index) => ({ surface: { id: `example.work.panel_${index + 1}`, version: 1 },
      family: "module" as const, queries: [], formFactors: [...forms] })), maxQueryCost: version === 1 ? 12 : 24 };
}
function registerSource(version: number) {
  registry.register("example", { contributions: [
    ...(version > 1 ? [declarative({ ...owner, id: `example.work.panel_${version - 1}`, version: 1, kind: "surface", schema: z.strictObject({}), references: [] })] : []),
    pageSource({ ...owner, id: "example.work.page", version, policy: policy(version),
      callbacks: { authoriseRead: m.protected, bindQueryInput: m.protected, projectQueryOutput: m.protected } }),
  ] });
}
function sealed(definitionId: string, versionId: string, compiled: { payload: object; plan: object; checksum: string }, kind: "page" | "entityProfile"): SealedConfigurationVersion {
  const dependencies = (compiled.plan as { configurationDependencies: { kind: string; definitionId: string; versionId: string; schemaVersion: number; checksum: string }[] }).configurationDependencies;
  return { id: versionId, definitionId, organisationId: "company", schemaVersion: 1, payload: compiled.payload as Prisma.JsonValue, compiledPlan: compiled.plan as Prisma.JsonValue,
    checksum: compiled.checksum, definition: { kind, retiredAt: null }, configurationDependencies: dependencies.map(ref => ({ organisationId: "company", definitionId, versionId,
      targetDefinitionId: ref.definitionId, targetVersionId: ref.versionId, targetKind: ref.kind, targetSchemaVersion: ref.schemaVersion, targetChecksum: ref.checksum })) };
}
beforeEach(async () => {
  vi.resetAllMocks(); rows.clear(); m.member.mockResolvedValue(membership());
  const issued = await sessionForUser("company", "actor"); if (!issued) throw Error("Missing genuine issuer fixture."); session = issued;
  const stamp = sessionAuthorityStamp(session); if (!stamp) throw Error("No genuine private authority stamp.");
  registry = new CapabilityRegistry(async () => true);
  registry.register("example", { contributions: [
    ...["list", "get"].map(suffix => query({ ...owner, id: `example.work.${suffix}`, version: 1, kind: "query", input: z.strictObject({}), output: z.string(),
      pagination: "none", maxCardinality: 1, costClass: "low", execute: m.protected })),
    entity({ ...owner, id: "example.work", version: 1, kind: "entity", key: "string", fields: [{ id: "subject", type: "string", nullable: false,
      classification: "confidential", filterable: false, sortable: false, decision: false, template: false }],
      extensionPolicy: { customFields: false, recordTypes: true, pageVariants: false }, record: { writeCapability: "example.work.manage", detailRoute: "/work/{recordId}",
        labelField: "subject", listQuery: { id: "example.work.list", version: 1 }, getQuery: { id: "example.work.get", version: 1 }, authorise: m.protected } }),
  ] }); registerSource(1);
  authority = { session, transaction: tx, registry, stamp };
  m.version.mockImplementation(async ({ where }) => {
    const row = rows.get(where.id); return row && row.organisationId === where.organisationId && row.definitionId === where.definitionId ? row : null;
  });
  const compiled = await compileStructuredPage(authority, { schemaVersion: 1, entity: exact("example.work", 1), formFactors: [...forms],
    sections: [{ id: "main", label: "Work", help: "", columns: { desktop: 1, tablet: 1, phone: 1 }, formFactors: [...forms],
      components: [{ id: "help", type: "instructions", text: "Your retained layout", formFactors: [...forms] }] }], variants: [] });
  page = sealed(id(1), id(2), compiled, "page"); rows.set(page.id, page);
  pin = { kind: "page", definitionId: page.definitionId, versionId: page.id, schemaVersion: 1, checksum: page.checksum };
});
it.each([2, 3])("new profile preserves sealed Page source@1 after authoring source@%i upgrade", async version => {
  registerSource(2); if (version === 3) registerSource(3);
  const latest = await compileStructuredPage(authority, page.payload);
  expect(latest.plan.approvals.sourcePage.version).toBe(version); expect(latest.checksum).not.toBe(page.checksum);
  const retained = await compileRetainedStructuredPage(authority, page);
  expect(retained.checksum).toBe(page.checksum); expect(retained.plan.approvals.sourcePage.version).toBe(1);
  const result = await compileRecordProfile(context(), "entityProfile", profile());
  expect(result.plan.resolvedProfile.page).toEqual(pin); expect(result.plan.configurationDependencies).toEqual([pin]);
  expect(result.plan.dependencies.filter(dep => dep.id === "example.work.page").map(dep => dep.version)).toEqual([1]);
  expect(m.version.mock.calls.every(([query]) => query.where.organisationId === "company" && query.where.definitionId && query.where.id)).toBe(true);
  expect(m.protected).not.toHaveBeenCalled();
});
it("new type reconstructs its sealed base and historical Page without silently repinning either", async () => {
  const compiled = await compileRecordProfile(context(), "entityProfile", profile()), base = sealed(id(20), id(21), compiled, "entityProfile"); rows.set(base.id, base);
  registerSource(2); registerSource(3);
  const basePin = { kind: "entityProfile", definitionId: base.definitionId, versionId: base.id, schemaVersion: 1, checksum: base.checksum };
  const result = await compileRecordProfile({ ...context(), definitionId: id(30) }, "recordType", { schemaVersion: 1,
    entity: exact("example.work", 1), baseProfile: basePin, label: "Customer issue", overlay: {} });
  expect(result.plan.resolvedProfile.page).toEqual(pin); expect(result.plan.configurationDependencies).toEqual([pin, basePin]);
  expect(result.plan.dependencies.filter(dep => dep.id === "example.work.page").map(dep => dep.version)).toEqual([1]);
  expect(m.protected).not.toHaveBeenCalled();
});
it("a genuinely issued current principal without native Read cannot author a profile using the retained Page", async () => {
  registerSource(2); registerSource(3); m.member.mockResolvedValue(membership([]));
  const denied = await sessionForUser("company", "actor"); expect(denied && sessionAuthorityStamp(denied)).toBeTruthy();
  await expect(compileRecordProfile({ ...context(), session: denied! }, "entityProfile", profile())).rejects.toThrow("FORBIDDEN");
  expect(m.protected).not.toHaveBeenCalled();
});
it.each(["source-hash", "source-id", "unknown-version"])("rejects self-consistent corrupted stored %s rather than upgrading to the latest source", async mode => {
  registerSource(2); registerSource(3);
  const corrupted = structuredClone(page.compiledPlan) as { approvals: { sourcePage: { id: string; version: number; schemaHash: string } } };
  if (mode === "source-hash") corrupted.approvals.sourcePage.schemaHash = "f".repeat(64);
  if (mode === "source-id") corrupted.approvals.sourcePage.id = "example.missing.page";
  if (mode === "unknown-version") corrupted.approvals.sourcePage.version = 99;
  page.compiledPlan = corrupted; page.checksum = checksum(corrupted); pin = { ...pin, checksum: page.checksum };
  await expect(compileRecordProfile(context(), "entityProfile", profile())).rejects.toThrow();
  expect(m.protected).not.toHaveBeenCalled();
});
