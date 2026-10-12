import { beforeEach, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import type { Prisma } from "@/generated/prisma/client";
const m = vi.hoisted(() => ({ membership: vi.fn(), refresh: vi.fn(), usage: vi.fn(), version: vi.fn(), definition: vi.fn(), generation: vi.fn(), list: vi.fn(), provider: vi.fn() }));
vi.mock("@/core/db/client", () => ({ db: { membership: { findUnique: m.membership } } }));
vi.mock("@/core/studio/fields/runtime-authority", () => ({ fieldRuntimeAuthorityInTransaction: m.refresh }));
vi.mock("@/core/studio/configuration/usage", () => ({ whereUsedConfigurationInTransaction: m.usage }));
import { sessionForUser, sessionAuthorityStamp } from "@/core/auth/session";
import type { FieldRuntimeAuthority } from "@/core/studio/fields/runtime-authority";
import { retainedCutoverFixture, cutoverUuid as id } from "./fixtures/studio-field-cutover";
import { compileCustomField } from "@/core/studio/compiler/fields";
import { checksum } from "@/core/studio/registry/contracts";
import { readDesignReferenceUsageInTransaction, readDesignReferenceMetadataInTransaction } from "@/core/studio/authoring/reference-navigation";
import { designReferenceLinks } from "@/core/studio/authoring/reference-links";
import { ReferenceUsagePanel } from "@/components/studio/reference-usage";
import { materialiseCompiledView } from "@/core/studio/views/definition-compiler";
import { ticketPageContract } from "@/core/service-work/studio-pages";
import { reconstructPageApprovalsInTransaction } from "@/core/studio/pages/server-approvals";
import { compilePage } from "@/core/studio/pages/compiler";
import { pagePayloadSchema } from "@/core/studio/pages/schema";
import { pageEditorCatalogInTransaction } from "@/core/studio/authoring/catalog";
import type { ConfigurationDependencyReference } from "@/core/studio/configuration/dependency-reference";
import type { SealedConfigurationVersion } from "@/core/studio/configuration/pins";

// Actual private Session issuance, registry contracts, field compiler, retained
// seals and rendered panel. Current issuance refresh/SQL/usage traversal/native
// View compiler are explicit collaborators; original usage engine has its own
// retained/cycle/cursor suite. No actual SQL/browser/private-record proof implied.
let authority: FieldRuntimeAuthority, pin: Extract<ConfigurationDependencyReference, { kind: "customField" }>, rows: Map<string, SealedConfigurationVersion>;
let fixture: Awaited<ReturnType<typeof retainedCutoverFixture>>;
const tx = { studioDefinitionVersion: { findFirst: m.version }, studioDefinition: { findFirst: m.definition, findMany: m.list }, studioFieldGeneration: { findFirst: m.generation }, studioProfileBinding: { findMany: async () => [] } } as unknown as Prisma.TransactionClient;
function saved(row: typeof fixture.source | typeof fixture.target): SealedConfigurationVersion {
  return { ...row, schemaVersion: 1, definition: { kind: "customField", retiredAt: null }, configurationDependencies: [] };
}
function edge(reference: ConfigurationDependencyReference, definitionId: string, versionId: string) {
  return { organisationId: "company", definitionId, versionId, targetDefinitionId: reference.definitionId,
    targetVersionId: reference.versionId, targetKind: reference.kind, targetSchemaVersion: reference.schemaVersion, targetChecksum: reference.checksum };
}
beforeEach(async () => {
  vi.clearAllMocks(); fixture = await retainedCutoverFixture();
  m.membership.mockResolvedValue({ id: "member", userId: "actor", organisationId: "company", active: true, sessionVersion: 4,
    grantedCapabilities: ["studio.definition.read", "tickets.ticket.read"], deniedCapabilities: [], roles: [],
    user: { name: "Actor", email: "actor@example.test", authVersion: 3, platformAdmin: null },
    organisation: { name: "Company", kind: "CUSTOMER", status: "ACTIVE", auditAccess: null, restrictedAccessAreas: [] } });
  const session = (await sessionForUser("company", "actor"))!;
  authority = { session, stamp: sessionAuthorityStamp(session)!, registry: fixture.registry, transaction: tx };
  m.refresh.mockImplementation(async authenticated => {
    if (!sessionAuthorityStamp(authenticated)) throw new Error("FORBIDDEN: genuine current access required");
    return authority;
  });
  rows = new Map([[fixture.source.id, saved(fixture.source)], [fixture.target.id, saved(fixture.target)]]);
  pin = { kind: "customField", definitionId: fixture.source.definitionId, versionId: fixture.source.id, schemaVersion: 1, checksum: fixture.source.checksum };
  m.version.mockImplementation(async ({ where }) => {
    const row = rows.get(where.id); return row && row.organisationId === where.organisationId && row.definitionId === where.definitionId ? row : null;
  });
  m.definition.mockImplementation(async ({ where, select }) => {
    if (where.organisationId !== "company") return null;
    return select.activeVersionId ? { id: pin.definitionId, organisationId: "company", key: "tickets.ticket.extra", activeVersionId: fixture.target.id, retiredAt: null, activeVersion: rows.get(fixture.target.id) }
      : { id: where.id, organisationId: "company", name: "Delivery score", retiredAt: rows.get(pin.versionId)!.definition.retiredAt };
  });
  m.generation.mockResolvedValue({ id: fixture.source.payload.storageGeneration }); m.usage.mockResolvedValue({ usages: [], next: null });
});
it("generates exact pinned navigation and carries only explicitly selected business context", () => {
  const links = designReferenceLinks(pin); expect(links.sourceHref).toBe(`/design-studio/setup/${pin.definitionId}`);
  const url = new URL(links.whereUsedHref, "https://atlas.test"); expect(Object.fromEntries(url.searchParams)).toEqual({ kind: "customField", version: pin.versionId, schema: "1", checksum: pin.checksum });
  const business = "company / another?", chosen = designReferenceLinks(pin, { business });
  expect(new URL(chosen.whereUsedHref, "https://atlas.test").searchParams.get("business")).toBe(business);
  expect(chosen.sourceHref).toContain(encodeURIComponent(business));
  expect(() => designReferenceLinks({ ...pin, organisationId: "foreign" })).toThrow();
});
it("checks current genuine authority and original exact usage before returning friendly metadata only", async () => {
  const result = await readDesignReferenceUsageInTransaction(authority, { reference: pin });
  expect(result).toMatchObject({ name: "Delivery score", retired: false, usages: [], nextHref: null });
  expect(m.refresh.mock.invocationCallOrder[0]).toBeLessThan(m.version.mock.invocationCallOrder[0]);
  expect(m.usage).toHaveBeenCalledWith(authority.session, tx, { definitionId: pin.definitionId, versionId: pin.versionId, limit: 25 });
  expect(result.sourceHref).toBeNull();
  expect(result).not.toHaveProperty("reference"); expect(result).not.toHaveProperty("payload"); expect(result).not.toHaveProperty("defaultValue"); expect(m.provider).not.toHaveBeenCalled();
});
it.each(["studio.definition.read", "tickets.ticket.read"])("denies current %s before names/usage", async capability => {
  authority.session.capabilities.delete(capability);
  await expect(readDesignReferenceUsageInTransaction(authority, { reference: pin })).rejects.toThrow("FORBIDDEN");
  expect(m.usage).not.toHaveBeenCalled();
});
it("rejects cloned authority before any metadata access", async () => {
  expect(sessionAuthorityStamp({ ...authority.session })).toBeNull();
  await expect(readDesignReferenceUsageInTransaction({ ...authority, session: { ...authority.session } }, { reference: pin })).rejects.toThrow("FORBIDDEN");
  expect(m.version).not.toHaveBeenCalled(); expect(m.definition).not.toHaveBeenCalled();
});
it.each(["written", "current"])("requires the %s field Read policy without asking for field Write", async mode => {
  const original = mode === "written" ? fixture.source : fixture.target;
  const compiled = await compileCustomField({ ...fixture.session, capabilities: new Set([...fixture.session.capabilities, "tickets.field.secret", "tickets.field.edit"]) },
    { ...original.payload, field: { ...original.payload.field, readCapability: "tickets.field.secret", writeCapability: "tickets.field.edit" } }, fixture.registry);
  const row = { ...saved(original), payload: compiled.payload, compiledPlan: compiled.plan, checksum: compiled.checksum };
  rows.set(row.id, row); if (mode === "written") pin = { ...pin, checksum: row.checksum };
  await expect(readDesignReferenceUsageInTransaction(authority, { reference: pin })).rejects.toThrow("FORBIDDEN"); expect(m.usage).not.toHaveBeenCalled();
  authority.session.capabilities.add("tickets.field.secret");
  await expect(readDesignReferenceUsageInTransaction(authority, { reference: pin })).resolves.toMatchObject({ name: "Delivery score" });
});
it.each(["foreign", "seal", "payload", "schema", "binding"])("rejects %s metadata without usage/name disclosure", async mode => {
  const row = rows.get(pin.versionId)!;
  if (mode === "foreign") row.organisationId = "foreign";
  if (mode === "seal") row.checksum = "f".repeat(64);
  if (mode === "payload") row.payload = {};
  if (mode === "schema") row.schemaVersion = 3;
  if (mode === "binding") m.generation.mockResolvedValue(null);
  await expect(readDesignReferenceUsageInTransaction(authority, { reference: pin })).rejects.toThrow(); expect(m.usage).not.toHaveBeenCalled();
});
it("retains retired source metadata without changing its retirement/pointer or invoking a provider", async () => {
  authority.session.capabilities.add("studio.definition.edit");
  rows.get(pin.versionId)!.definition.retiredAt = new Date();
  m.definition.mockImplementation(async ({ where, select }) => select.activeVersionId
    ? { id: pin.definitionId, organisationId: "company", key: "tickets.ticket.extra", activeVersionId: null, activeVersion: null, retiredAt: new Date() }
    : { id: where.id, organisationId: "company", name: "Retired score", retiredAt: new Date() });
  expect(await readDesignReferenceUsageInTransaction(authority, { reference: pin })).toMatchObject({ name: "Retired score", retired: true, sourceHref: null });
  expect(rows.get(pin.versionId)!.definition.retiredAt).toBeInstanceOf(Date); expect(m.provider).not.toHaveBeenCalled();
});
it("authorises every incoming design before disclosing its label and omits only independent FORBIDDEN choices", async () => {
  authority.session.capabilities.add("studio.definition.edit");
  const source = fixture.registry.describe("tickets.ticket", 1), entity = { id: source.id, version: source.version, schemaHash: source.schemaHash, contractHash: source.contractHash };
  const profilePayload = { schemaVersion: 1, entity, profile: { page: null, requiredFields: [pin], allowedProcesses: [], defaultDecisions: [] } };
  const plan = { kind: "entityProfile", schemaVersion: 1, payload: profilePayload, resolvedProfile: profilePayload.profile,
    dependencies: [source, ...fixture.source.compiledPlan.dependencies].map(value => ({ id: value.id, version: value.version, schemaHash: value.schemaHash, contractHash: value.contractHash, ownerModuleId: value.ownerModuleId, kind: value.kind, classification: value.classification })).sort((a,b) => a.id < b.id ? -1 : a.id > b.id ? 1 : a.version-b.version), configurationDependencies: [pin] };
  const ref = { kind: "entityProfile" as const, definitionId: id(30), versionId: id(31), schemaVersion: 1 as const, checksum: checksum(plan) };
  rows.set(ref.versionId, { id: ref.versionId, definitionId: ref.definitionId, organisationId: "company", schemaVersion: 1,
    payload: profilePayload, compiledPlan: plan, checksum: ref.checksum, definition: { kind: ref.kind, retiredAt: new Date() }, configurationDependencies: [edge(pin, ref.definitionId, ref.versionId)] });
  m.usage.mockResolvedValue({ usages: [{ ...ref, name: "Retired delivery setup", active: false, retiredAt: new Date().toISOString(), depth: 1 }], next: null });
  const result = await readDesignReferenceUsageInTransaction(authority, { reference: pin }); expect(result.usages).toMatchObject([{ name: "Retired delivery setup", status: "Retired", kind: "Business setup", href: null }]);
  const actualResolve = authority.registry.resolve.bind(authority.registry);
  const resolve = vi.spyOn(authority.registry, "resolve").mockImplementation(async (session, reference) => {
    if (reference.id === entity.id && reference.version === 1) throw new Error("FORBIDDEN: incoming native source revoked");
    return actualResolve(session, reference);
  });
  expect((await readDesignReferenceUsageInTransaction(authority, { reference: pin })).usages).toEqual([]);
  resolve.mockRestore();
  rows.get(ref.versionId)!.compiledPlan = { ...plan, resolvedProfile: {} };
  await expect(readDesignReferenceUsageInTransaction(authority, { reference: pin })).rejects.toThrow("DEPENDENCY_BROKEN");
});
it("keeps the original usage cursor/checksum and propagates stale/corrupt graph failures", async () => {
  const cursor = { after: `${id(30)}@${id(31)}`, checksum: "a".repeat(64) }; m.usage.mockResolvedValue({ usages: [], next: cursor });
  const result = await readDesignReferenceUsageInTransaction(authority, { reference: pin, cursor }, { business: "chosen" });
  const url = new URL(result.nextHref!, "https://atlas.test"); expect(url.searchParams.get("version")).toBe(pin.versionId); expect(url.searchParams.get("after")).toBe(cursor.after); expect(url.searchParams.get("cursorChecksum")).toBe(cursor.checksum);
  m.usage.mockRejectedValue(new Error("CONFLICT: configuration usage changed"));
  await expect(readDesignReferenceUsageInTransaction(authority, { reference: pin, cursor })).rejects.toThrow("CONFLICT");
});
it("shows retired labels without unusable open links, escapes names, and avoids technical keys/values", () => {
  const html = renderToStaticMarkup(<ReferenceUsagePanel workspaceHref="/design-studio" model={{ name: "<Private score>", retired: true, sourceHref: "/design-studio/setup/old", nextHref: null,
    usages: [{ name: "<Retired screen>", kind: "Screen", status: "Retired", direct: false, href: "/design-studio/old" }] }}/>);
  expect(html).toContain("&lt;Private score&gt;"); expect(html).toContain("&lt;Retired screen&gt;"); expect(html).not.toContain("Go to source"); expect(html).not.toContain("Open design"); expect(html).not.toContain(pin.definitionId);
});
it("strictly rejects missing/unknown pin and cursor identity rather than selecting an active version", async () => {
  for (const input of [{ reference: { ...pin, versionId: undefined } }, { reference: { ...pin, checksum: "wrong" } }, { reference: pin, organisationId: "foreign" },
    { reference: pin, cursor: { after: `${id(30)}@${id(31)}` } }]) await expect(readDesignReferenceUsageInTransaction(authority, input)).rejects.toThrow();
  expect(m.version).not.toHaveBeenCalled();
});
it("reconstructs a retired immutable dashboard using the original read compiler without a current-head read/provider", async () => {
  const payload = { schemaVersion: 1 as const, sourceView: { id: "analytics.dashboard.view", version: 1, schemaHash: "a".repeat(64), contractHash: "b".repeat(64) }, content: { title: "Score overview" } };
  const compiled = { content: payload.content, requests: [], dependencies: [] };
  const materialised = materialiseCompiledView(payload, compiled);
  const reference = { kind: "view" as const, definitionId: id(40), versionId: id(41), schemaVersion: 1 as const, checksum: materialised.checksum };
  rows.set(reference.versionId, { id: reference.versionId, definitionId: reference.definitionId, organisationId: "company", schemaVersion: 1,
    payload, compiledPlan: materialised.plan, checksum: reference.checksum, configurationDependencies: [], definition: { kind: "view", retiredAt: new Date() } });
  m.definition.mockResolvedValue({ id: reference.definitionId, organisationId: "company", name: "Score overview", retiredAt: rows.get(reference.versionId)!.definition.retiredAt });
  const readCompiler = vi.spyOn(authority.registry, "authoriseViewReadInTransaction").mockResolvedValue(compiled);
  await expect(readDesignReferenceUsageInTransaction(authority, { reference })).resolves.toMatchObject({ name: "Score overview" });
  expect(readCompiler).toHaveBeenCalledWith({ session: authority.session, transaction: tx }, payload.sourceView, payload.content);
  expect(m.definition.mock.calls.every(call => !call[0].select.activeVersionId)).toBe(true);
  readCompiler.mockRejectedValue(new Error("FORBIDDEN: Sales current Read revoked"));
  await expect(readDesignReferenceUsageInTransaction(authority, { reference })).rejects.toThrow("FORBIDDEN"); expect(m.provider).not.toHaveBeenCalled();
});

it("reconstructs an exact retired screen with old field storage using current owner/query/field rights before names", async () => {
  fixture.registry.register("tickets", { contributions: ticketPageContract.contributions.filter(item => item.metadata.id !== "tickets.ticket.page" || item.metadata.version === 1) });
  const source = fixture.registry.describe("tickets.ticket.page", 1), sourcePage = { id: source.id, version: source.version, schemaHash: source.schemaHash, contractHash: source.contractHash };
  const approved = await reconstructPageApprovalsInTransaction(authority, { sourcePage, customFields: [] });
  const entity = fixture.registry.describe(fixture.source.payload.entity.id, fixture.source.payload.entity.version);
  approved.contracts.push({ ...fixture.source.payload.entity, ownerModuleId: entity.ownerModuleId, kind: "entity", capability: entity.capability, classification: entity.classification });
  approved.customFields.push({ reference: pin, entity: fixture.source.payload.entity, classification: "confidential", editable: false, required: false });
  const forms = ["desktop", "tablet", "phone"];
  const plan = compilePage({ schemaVersion: 1, entity: { id: approved.entity.id, version: approved.entity.version, schemaHash: approved.entity.schemaHash, contractHash: approved.entity.contractHash }, formFactors: forms, sections: [{ id: "main", label: "Work details", formFactors: forms,
    columns: { desktop: 2, tablet: 1, phone: 1 }, components: [{ id: "details", type: "fields", fields: [
      { source: "native", fieldId: "subject", mode: "read" }, { source: "extension", reference: pin, mode: "read" }], formFactors: forms }] }] }, approved);
  const ref = { kind: "page" as const, definitionId: id(50), versionId: id(51), schemaVersion: 1, checksum: checksum(plan) };
  rows.set(ref.versionId, { id: ref.versionId, definitionId: ref.definitionId, organisationId: "company", schemaVersion: 1, payload: plan.payload,
    compiledPlan: plan, checksum: ref.checksum, definition: { kind: "page", retiredAt: new Date() }, configurationDependencies: [edge(pin, ref.definitionId, ref.versionId)] });
  m.usage.mockResolvedValue({ usages: [{ ...ref, name: "Previous work screen", active: false, retiredAt: new Date().toISOString(), depth: 1 }], next: null });
  expect((await readDesignReferenceUsageInTransaction(authority, { reference: pin })).usages).toMatchObject([{ name: "Previous work screen", status: "Retired" }]);
  const resolve = authority.registry.resolve.bind(authority.registry);
  vi.spyOn(authority.registry, "resolve").mockImplementation(async (session, reference) => {
    if (reference.id === "tickets.ticket.page.header") throw new Error("FORBIDDEN: current header Read denied");
    return resolve(session, reference);
  });
  expect((await readDesignReferenceUsageInTransaction(authority, { reference: pin })).usages).toEqual([]);
  expect(m.provider).not.toHaveBeenCalled();
});

it("supplies real catalogue navigation for an approved field and forwards the same exact pin to its palette", async () => {
  fixture.registry.register("tickets", { contributions: ticketPageContract.contributions.filter(item => item.metadata.id !== "tickets.ticket.page" || item.metadata.version === 1) });
  const active = rows.get(fixture.source.id)!;
  const definition = { id: pin.definitionId, organisationId: "company", kind: "customField", name: "Delivery score", key: "tickets.ticket.extra", activeVersionId: active.id, activeVersion: active, retiredAt: null };
  m.list.mockResolvedValue([definition]); m.definition.mockResolvedValue(definition);
  m.version.mockImplementation(async ({ where }) => where.id === active.id && where.organisationId === "company" ? { ...active, definition: { ...active.definition, name: definition.name } } : null);
  const source = fixture.registry.describe("tickets.ticket", 9);
  const page = { schemaVersion: 1, entity: { id: source.id, version: source.version, schemaHash: source.schemaHash, contractHash: source.contractHash },
    formFactors: ["desktop", "tablet", "phone"], sections: [{ id: "main", label: "Work", formFactors: ["desktop", "tablet", "phone"],
      columns: { desktop: 1, tablet: 1, phone: 1 }, components: [{ id: "help", type: "instructions", text: "Help", formFactors: ["desktop", "tablet", "phone"] }] }], variants: [] };
  const catalog = await pageEditorCatalogInTransaction(authority, pagePayloadSchema.parse(page), { business: "selected" });
  const choice = catalog.fields.find(field => field.field.source === "extension")!;
  expect(choice.label).toBe("Delivery score"); expect(choice).toMatchObject(designReferenceLinks(pin, { business: "selected" }));
  expect(catalog.palette.find(item => item.key === choice.key)).toMatchObject(designReferenceLinks(pin, { business: "selected" }));
  expect(m.provider).not.toHaveBeenCalled();
});

it.each(['page', 'entityProfile', 'recordType'] as const)('supports exact retained %s links without admitting future configuration kinds', kind => {
  const reference = { ...pin, kind, schemaVersion: 1 };
  const links = designReferenceLinks(reference, { business: 'selected' });
  expect(links.sourceHref).toBe(`/design-studio/${kind === 'page' ? '' : 'setup/'}${pin.definitionId}?business=selected`);
  const url = new URL(links.whereUsedHref, 'https://atlas.test');
  expect(url.searchParams.get('version')).toBe(pin.versionId);
  expect(url.searchParams.get('kind')).toBe(kind);
  expect(() => designReferenceLinks({ ...reference, kind: 'process' })).toThrow();
  expect(() => designReferenceLinks({ ...reference, organisationId: 'foreign' })).toThrow();
});
it('uses the same retained/current authority for metadata links without counting usage or reading business values', async () => {
  const result = await readDesignReferenceMetadataInTransaction(authority, pin);
  expect(result.name).toBe('Delivery score'); expect(result.whereUsedHref).toContain(`version=${pin.versionId}`);
  expect(result.sourceHref).toBeNull(); expect(m.usage).not.toHaveBeenCalled(); expect(m.provider).not.toHaveBeenCalled();
  authority.session.capabilities.delete('tickets.ticket.read');
  await expect(readDesignReferenceMetadataInTransaction(authority, pin)).rejects.toThrow('FORBIDDEN');
});

it.each(['entityProfile', 'recordType'] as const)('authorises exact retained %s metadata with original pure seals before links, without counting usage', async kind => {
  const { entityProfilePayloadSchema, recordTypePayloadSchema } = await import('@/core/studio/record-types/schema');
  const { resolveEntityProfile, resolveRecordTypeProfile, normaliseConfigurationReferences } = await import('@/core/studio/record-types/resolver');
  const owner = authority.registry.describe('tickets.ticket', 9);
  const entity = { id: owner.id, version: owner.version, schemaHash: owner.schemaHash, contractHash: owner.contractHash };
  const dependency = { ...entity, ownerModuleId: owner.ownerModuleId, kind: owner.kind, classification: owner.classification };
  const basePayload = entityProfilePayloadSchema.parse({ schemaVersion: 1, entity, profile: {} });
  const basePlan = { kind: 'entityProfile', schemaVersion: 1, payload: basePayload, resolvedProfile: resolveEntityProfile(basePayload)!.profile,
    dependencies: [dependency], configurationDependencies: [] };
  const base = { ...fixture.source, schemaVersion: 1, id: id(71), definitionId: id(70), payload: basePayload, compiledPlan: basePlan, checksum: checksum(basePlan),
    definition: { kind: 'entityProfile', retiredAt: null }, configurationDependencies: [] };
  const basePin = { kind: 'entityProfile' as const, definitionId: base.definitionId, versionId: base.id, schemaVersion: 1 as const, checksum: base.checksum };
  rows.set(base.id, base);
  let selected: SealedConfigurationVersion = base;
  if (kind === 'recordType') {
    const payload = recordTypePayloadSchema.parse({ schemaVersion: 1, entity, baseProfile: basePin, label: 'Workshop', overlay: {} });
    const resolved = resolveRecordTypeProfile({ reference: basePin, payload: basePayload }, payload, id(72));
    const plan = { kind, schemaVersion: 1, payload, resolvedProfile: resolved.profile, dependencies: [dependency],
      configurationDependencies: normaliseConfigurationReferences(resolved.configurationDependencies, id(72)) };
    selected = { ...fixture.source, schemaVersion: 1, id: id(73), definitionId: id(72), payload, compiledPlan: plan, checksum: checksum(plan),
      definition: { kind, retiredAt: null }, configurationDependencies: plan.configurationDependencies.map(reference => edge(reference, id(72), id(73))) };
    rows.set(selected.id, selected);
  }
  const reference = { kind, definitionId: selected.definitionId, versionId: selected.id, schemaVersion: 1, checksum: selected.checksum };
  m.definition.mockResolvedValue({ id: selected.definitionId, organisationId: 'company', name: 'Saved setup', retiredAt: null });
  const metadata = await readDesignReferenceMetadataInTransaction(authority, reference);
  expect(metadata.name).toBe('Saved setup'); expect(metadata.whereUsedHref).toContain(`version=${selected.id}`);
  expect(m.usage).not.toHaveBeenCalled(); expect(m.provider).not.toHaveBeenCalled();
  selected.checksum = 'b'.repeat(64);
  await expect(readDesignReferenceMetadataInTransaction(authority, reference)).rejects.toThrow('DEPENDENCY_BROKEN');
});
