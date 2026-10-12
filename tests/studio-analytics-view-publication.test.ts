import { beforeEach, expect, it, vi } from "vitest";
import type { Session, SessionAuthorityStamp } from "@/core/auth/session";
import type { Prisma } from "@/generated/prisma/client";
import type { FieldRuntimeAuthority } from "@/core/studio/fields/runtime-authority";
import { CapabilityRegistry } from "@/core/studio/registry/registry";
import { checksum } from "@/core/studio/registry/contracts";
import { compileRegisteredView } from "@/core/studio/views/definition-compiler";
import { inspectPublishedViewInTransaction, inspectViewVersionPin, inspectRetainedViewVersionPin } from "@/core/studio/views/seal";
import { configurationReferenceSchema } from "@/core/studio/record-types/schema";
import { analyticsBusinessViewContract } from "@/modules/analytics/services/studio-view";
import { salesAnalyticsStudioContract } from "@/modules/sales/services/studio-analytics";
import { productsAnalyticsStudioContract } from "@/modules/products/services/studio-analytics";
const m = vi.hoisted(() => ({ stamp: vi.fn(), refresh: vi.fn(), bridge: vi.fn(), module: vi.fn(), available: vi.fn(), business: vi.fn(),
  definition: vi.fn(), draft: vi.fn(), version: vi.fn(), createDefinition: vi.fn(), updateDefinition: vi.fn(),
  updateDraft: vi.fn(), createVersion: vi.fn(), audit: vi.fn(), feature: vi.fn(), legacyTx: vi.fn(), currentModules: vi.fn() }));
vi.mock("@/core/auth/session", () => ({ sessionAuthorityStamp: m.stamp, requireSession: vi.fn(), getSession: vi.fn(), sessionForUser: vi.fn() }));
vi.mock("@/core/db/client", () => ({ db: { studioDefinition: { findFirst: m.definition }, studioDraft: { findFirst: m.draft },
  studioDefinitionVersion: { findFirst: m.version }, $transaction: m.legacyTx } }));
vi.mock("@/core/modules/access", () => ({ assertModuleEnabled: m.available }));
vi.mock("@/core/modules/runtime", () => ({ getEnabledModuleIds: vi.fn(), enabledModulesForSession: vi.fn(), isModuleEnabled: vi.fn() }));
vi.mock("@/core/studio/fields/runtime-authority", () => ({ withFieldRuntimeAuthority: m.refresh, fieldRuntimeAuthorityInTransaction: m.bridge }));
vi.mock("@/core/studio/registry/runtime", () => ({ studioRegistry: () => { throw new Error("No legacy compiler for explicit views."); } }));
vi.mock("@/core/studio/runtime-features", async original => ({ ...await original<object>(), assertStudioRuntimeFeatureEnabled: m.feature }));
import { createDraft, updateDraft, validateDraft, publishDraft, activateVersion, activeDefinition } from "@/core/studio/definitions/service";
import { publishCompiledDefinitionInTransaction, type PublicationDraft } from "@/core/studio/definitions/publication";
import { activateCompiledVersionInTransaction } from "@/core/studio/definitions/activation";
// Actual owner schemas, registry/compiler, original service/publisher/activation
// and shared seals. Identity issuance/refresh, SQL, module storage and Audit are
// collaborators. This suite makes no SQL, native-result, browser or release claim.
const id = (n: number) => `70000000-0000-4000-8000-${String(n).padStart(12, "0")}`;
const caps = ["studio.definition.read", "studio.definition.edit", "studio.definition.publish", "analytics.dashboard.read", "analytics.dashboard.manage", "sales.order.read"];
const actor = (): Session => ({ userId: "user", membershipId: "member", organisationId: "company", userName: "User", userEmail: "user@example.test", organisationName: "Company", capabilities: new Set(caps) });
const stamp: SessionAuthorityStamp = { userId: "user", membershipId: "member", organisationId: "company", authVersion: 1, sessionVersion: 1 };
let session: Session, current: Session, issued: WeakMap<Session, SessionAuthorityStamp>, registry: CapabilityRegistry, authority: FieldRuntimeAuthority;
let enabled: Set<string>;
const transaction = { moduleState: { findFirst: m.module, count: m.currentModules }, studioDefinition: { findFirst: m.definition, create: m.createDefinition, updateMany: m.updateDefinition },
  studioDraft: { findFirst: m.draft, updateMany: m.updateDraft }, studioDefinitionVersion: { findFirst: m.version, create: m.createVersion }, auditEntry: { create: m.audit } } as unknown as Prisma.TransactionClient;
let compiled: Awaited<ReturnType<typeof compileRegisteredView>>, row: ReturnType<typeof savedRow>, draft: PublicationDraft;
function savedRow() { return { id: id(2), organisationId: "company", definitionId: id(1), version: 1, schemaVersion: 1,
  payload: compiled.payload, compiledPlan: compiled.plan, checksum: compiled.checksum,
  definition: { kind: "view", retiredAt: null as Date | null }, configurationDependencies: [] }; }
const pin = () => ({ kind: "view", definitionId: id(1), versionId: id(2), schemaVersion: 1, checksum: row.checksum });
const input = () => ({ definitionId: id(1), revision: 0, payload: compiled.payload });
beforeEach(async () => {
  vi.clearAllMocks(); session = actor(); current = actor(); issued = new WeakMap([[session, stamp], [current, stamp]]);
  m.stamp.mockImplementation(value => issued.get(value)); enabled = new Set(["analytics", "sales", "products"]);
  registry = new CapabilityRegistry(async (value, module) => value.organisationId === "company" && enabled.has(module));
  registry.register("analytics", analyticsBusinessViewContract); registry.register("sales", salesAnalyticsStudioContract); registry.register("products", productsAnalyticsStudioContract);
  authority = { session: current, stamp, registry, transaction };
  const refresh = (value: Session) => { if (!issued.has(value) || !issued.has(current)) throw new Error("FORBIDDEN: current identity revoked"); return authority; };
  m.refresh.mockImplementation(async (value, callback) => callback(refresh(value))); m.bridge.mockImplementation(async value => refresh(value));
  m.module.mockResolvedValue({ id: "studio" }); m.currentModules.mockImplementation(async ({ where }) => where.moduleId.in.filter((value: string) => enabled.has(value)).length);
  const source = registry.describe("analytics.dashboard.view", 1);
  compiled = await compileRegisteredView(authority, { schemaVersion: 1, sourceView: { id: source.id, version: 1, schemaHash: source.schemaHash, contractHash: source.contractHash },
    content: { name: "Orders", widgets: [{ id: "orders", metricId: "sales.orders", visual: "bar", wide: false }] } });
  row = savedRow(); draft = { id: id(3), organisationId: "company", definitionId: id(1), revision: 0, payload: compiled.payload,
    definition: { id: id(1), organisationId: "company", key: "orders", kind: "view", name: "Orders", revision: 0, latestVersion: 0, activeVersionId: null, retiredAt: null }, baseVersion: null } as unknown as PublicationDraft;
  m.definition.mockResolvedValue({ ...draft.definition, activeVersionId: row.id }); m.draft.mockResolvedValue(draft); m.version.mockResolvedValue(row);
  m.createDefinition.mockResolvedValue({ id: id(1) }); m.updateDraft.mockResolvedValue({ count: 1 }); m.updateDefinition.mockResolvedValue({ count: 1 });
  m.createVersion.mockResolvedValue(row); m.audit.mockResolvedValue({ id: "audit" }); m.feature.mockImplementation(() => { throw new Error("STUDIO_RUNTIME_FEATURE_UNAVAILABLE"); });
});
it("creates, saves and validates explicit views using current original authoring transaction, normalized metadata and Audit", async () => {
  expect(await createDraft(session, { key: "orders", name: "Orders", kind: "view", payload: compiled.payload })).toEqual({ id: id(1) });
  expect(m.createDefinition.mock.calls[0][0].data).toMatchObject({ organisationId: "company", createdBy: "user", kind: "view", draft: { create: { payload: compiled.payload } } });
  expect(await updateDraft(session, input())).toEqual({ revision: 1 });
  expect(await validateDraft(session, id(1), 0)).toEqual({ checksum: compiled.checksum, warnings: [] });
  expect(m.audit.mock.calls.map(([value]) => value.data.action)).toEqual(["studio.draft.created", "studio.draft.updated"]);
  expect(m.legacyTx).not.toHaveBeenCalled(); expect(m.business).not.toHaveBeenCalled();
});
it.each(["studio.definition.edit", "analytics.dashboard.manage", "analytics.dashboard.read", "sales.order.read"])("fresh current %s denial prevents original view draft effects", async capability => {
  current.capabilities.delete(capability);
  await expect(createDraft(session, { key: "orders", name: "Orders", kind: "view", payload: compiled.payload })).rejects.toThrow("FORBIDDEN");
  expect(m.createDefinition).not.toHaveBeenCalled(); expect(m.audit).not.toHaveBeenCalled();
});
it("rejects copied identity and native-owner module loss before draft effects", async () => {
  await expect(createDraft({ ...session }, { key: "orders", name: "Orders", kind: "view", payload: compiled.payload })).rejects.toThrow("FORBIDDEN");
  enabled.delete("sales"); await expect(updateDraft(session, input())).rejects.toThrow("DEPENDENCY_BROKEN");
  expect(m.updateDraft).not.toHaveBeenCalled(); expect(m.audit).not.toHaveBeenCalled();
});
it("stale save cannot write or Audit and owner changes cannot overwrite a valid draft", async () => {
  m.updateDraft.mockResolvedValueOnce({ count: 0 }); await expect(updateDraft(session, input())).rejects.toThrow("CONFLICT");
  expect(m.audit).not.toHaveBeenCalled(); m.updateDraft.mockClear();
  m.draft.mockResolvedValue({ ...draft, payload: { ...compiled.payload, sourceView: { ...compiled.payload.sourceView, id: "analytics.other.view" } } });
  await expect(updateDraft(session, input())).rejects.toThrow("original owning source"); expect(m.updateDraft).not.toHaveBeenCalled();
});
it.each(["publish", "activate"])("Stage3 %s is release-closed before CAS/version/Audit, including original public service", async operation => {
  if (operation === "publish") await expect(publishDraft(session, { definitionId: id(1), revision: 0, acknowledgeWarnings: false })).rejects.toThrow("UNAVAILABLE");
  else await expect(activateVersion(session, { definitionId: id(1), versionId: row.id, revision: 0 })).rejects.toThrow("UNAVAILABLE");
  expect(m.feature).toHaveBeenCalledWith("analyticsBusinessViews.v1"); expect(m.updateDefinition).not.toHaveBeenCalled(); expect(m.createVersion).not.toHaveBeenCalled(); expect(m.audit).not.toHaveBeenCalled();
});
it("existing publisher persists exact owner dependencies, immutable compiled envelope and original paired Audit when trusted feature evidence permits", async () => {
  m.feature.mockReturnValue(undefined);
  const published = await publishCompiledDefinitionInTransaction(transaction, current, draft, 0, compiled);
  expect(published).toMatchObject({ versionNumber: 1, draftRevision: 1 });
  const data = m.createVersion.mock.calls[0][0].data;
  expect(data).toMatchObject({ organisationId: "company", definitionId: id(1), schemaVersion: 1, payload: compiled.payload, checksum: compiled.checksum, configurationDependencies: { create: [] } });
  expect(data.dependencies.create.map((value: { contractId: string }) => value.contractId)).toEqual(["analytics.dashboard.view", "sales.orders.metric", "sales.orders.metric.read"]);
  expect(m.audit.mock.calls[0][0].data.action).toBe("studio.definition.published");
  expect(await activateCompiledVersionInTransaction(transaction, current, id(1), 0, row, compiled)).toEqual({ revision: 1 });
  expect(m.updateDefinition.mock.calls.at(-1)![0].where).toMatchObject({ organisationId: "company", retiredAt: null, revision: 0 });
});
it.each(["draft", "origin", "origin-seal", "origin-tenant", "stale"])("publisher rejects %s mismatch before immutable insertion or Audit", async mode => {
  m.feature.mockReturnValue(undefined);
  if (mode === "draft") draft.payload = { ...compiled.payload, sourceView: { ...compiled.payload.sourceView, id: "analytics.other.view" } };
  if (mode.startsWith("origin")) {
    draft.definition.latestVersion = 1; draft.baseVersion = { version: 1 };
    if (mode === "origin") { row.payload = { ...compiled.payload, sourceView: { ...compiled.payload.sourceView, id: "analytics.other.view" } }; row.compiledPlan = { ...compiled.plan, payload: row.payload }; row.checksum = checksum(row.compiledPlan); }
    if (mode === "origin-seal") row.checksum = "f".repeat(64);
    if (mode === "origin-tenant") row.organisationId = "foreign";
  }
  if (mode === "stale") m.updateDefinition.mockResolvedValue({ count: 0 });
  await expect(publishCompiledDefinitionInTransaction(transaction, current, draft, 0, compiled)).rejects.toThrow();
  expect(m.createVersion).not.toHaveBeenCalled(); expect(m.audit).not.toHaveBeenCalled();
});
it("original activeDefinition reconstructs sealed metadata under genuine Studio Read without author/native grants or provider queries", async () => {
  current.capabilities = new Set(["studio.definition.read"]);
  expect(await activeDefinition(session, id(1))).toEqual({ versionId: row.id, version: 1, plan: compiled.plan });
  expect(m.legacyTx).not.toHaveBeenCalled(); expect(m.audit).not.toHaveBeenCalled(); expect(m.feature).not.toHaveBeenCalled();
});
it.each(["tenant", "kind", "payload", "hash", "edge", "recompiled", "module", "revoked", "read"])("active metadata rejects %s before returning incompatible plan", async mode => {
  current.capabilities = new Set(["studio.definition.read"]);
  if (mode === "tenant") row.organisationId = "foreign";
  if (mode === "kind") row.definition.kind = "page";
  if (mode === "payload") row.payload = { ...compiled.payload, content: {} };
  if (mode === "hash") row.checksum = "f".repeat(64);
  if (mode === "edge") row.configurationDependencies = [{}] as never;
  if (mode === "recompiled") { row.compiledPlan = { ...compiled.plan, requests: [] }; row.checksum = checksum(row.compiledPlan); }
  if (mode === "module") enabled.delete("sales");
  if (mode === "revoked") issued.delete(current);
  if (mode === "read") current.capabilities.clear();
  await expect(activeDefinition(session, id(1))).rejects.toThrow(); expect(m.audit).not.toHaveBeenCalled();
});
it("view pin does not widen configuration references; current retirement rejects while retained seal remains historical metadata only", () => {
  expect(configurationReferenceSchema.safeParse(pin()).success).toBe(false);
  row.definition.retiredAt = new Date(); const snapshot = structuredClone(row);
  expect(() => inspectViewVersionPin("company", pin(), row)).toThrow("DEPENDENCY_BROKEN");
  expect(inspectRetainedViewVersionPin("company", pin(), row).reference).toEqual(pin()); expect(row).toEqual(snapshot);
});
it("forged metadata authority is denied before querying even immutable metadata", async () => {
  m.version.mockClear(); await expect(inspectPublishedViewInTransaction({ ...authority, session: { ...current } }, pin())).rejects.toThrow("FORBIDDEN");
  expect(m.version).not.toHaveBeenCalled();
});

it("view activation checks exact stored payload/plan mirror before pointer or Audit even when normalization would recreate the original plan", async () => {
  m.feature.mockReturnValue(undefined);
  const raw = { ...compiled.payload, content: { name: "Orders", widgets: [{ id: "orders", metricId: "sales.orders", visual: "bar", wide: false }] } };
  row.payload = raw;
  // Strict owner normalization would produce compiled.checksum, but the persisted
  // raw payload is not the published normalized plan payload. No false acceptance.
  expect((await compileRegisteredView(authority, raw)).checksum).toBe(compiled.checksum);
  await expect(activateCompiledVersionInTransaction(transaction, current, id(1), 0, row, compiled)).rejects.toThrow("DEPENDENCY_BROKEN");
  expect(m.updateDefinition).not.toHaveBeenCalled(); expect(m.audit).not.toHaveBeenCalled();
});
