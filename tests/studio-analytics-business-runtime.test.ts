import { beforeEach, expect, it, vi } from "vitest";
import type { Session, SessionAuthorityStamp } from "@/core/auth/session";
import type { Prisma } from "@/generated/prisma/client";
import type { FieldRuntimeAuthority } from "@/core/studio/fields/runtime-authority";
import { CapabilityRegistry } from "@/core/studio/registry/registry";
import { checksum } from "@/core/studio/registry/contracts";
import { compileRegisteredView } from "@/core/studio/views/definition-compiler";
import { readPublishedViewInTransaction, inspectSealedViewForReadInTransaction, readSealedViewInTransaction } from "@/core/studio/views/runtime";
import { analyticsBusinessViewContract } from "@/modules/analytics/services/studio-view";
import { salesAnalyticsStudioContract } from "@/modules/sales/services/studio-analytics";
import { productsAnalyticsStudioContract } from "@/modules/products/services/studio-analytics";
import { createBusinessViewDraftInTransaction, saveBusinessViewDraftInTransaction, loadBusinessViewMetricsInTransaction,
  loadBusinessViewSliceInTransaction, readPublishedAnalyticsViewInTransaction, listPublishedBusinessViewsInTransaction, listPublishedBusinessViews } from "@/modules/analytics/services/studio-business-view";
import { businessViewCreateSchema, businessViewSaveSchema } from "@/modules/analytics/services/business-view-contract";
const m = vi.hoisted(() => ({ stamp: vi.fn(), bridge: vi.fn(), definition: vi.fn(), version: vi.fn(), draft: vi.fn(), create: vi.fn(), update: vi.fn(), audit: vi.fn(),
  modules: vi.fn(), catalogue: vi.fn(), queries: vi.fn(), list: vi.fn(), tx: vi.fn(), native: vi.fn(), customer: vi.fn() }));
vi.mock("@/core/auth/session", () => ({ sessionAuthorityStamp: m.stamp, requireSession: vi.fn(), getSession: vi.fn(), sessionForUser: vi.fn() }));
vi.mock("@/core/db/client", () => ({ db: { $transaction: m.tx } }));
vi.mock("@/core/studio/fields/runtime-authority", () => ({ fieldRuntimeAuthorityInTransaction: m.bridge, nativeFieldMutationSessionInTransaction: m.native }));
vi.mock("@/core/modules/runtime", () => ({ getEnabledModuleIds: vi.fn(), enabledModulesForSession: vi.fn() }));
vi.mock("@/core/analytics/catalogue", () => ({ getAnalyticsMetrics: m.catalogue }));
const id = (n: number) => `90000000-0000-4000-8000-${String(n).padStart(12, "0")}`;
const stamp: SessionAuthorityStamp = { organisationId: "a", userId: "actor", membershipId: "member", authVersion: 1, sessionVersion: 1 };
const transaction = { organisation: { findFirst: m.customer }, studioDefinition: { findFirst: m.definition, findMany: m.list, create: m.create, updateMany: m.update }, studioDefinitionVersion: { findFirst: m.version }, studioDraft: { findFirst: m.draft, updateMany: m.update },
  moduleState: { findFirst: m.modules }, auditEntry: { create: m.audit } } as unknown as Prisma.TransactionClient;
let authority: FieldRuntimeAuthority, session: Session, fresh: Session, registry: CapabilityRegistry, issued: WeakMap<Session, SessionAuthorityStamp>, enabled: Set<string>;
let saved: Awaited<ReturnType<typeof compileRegisteredView>>, row: ReturnType<typeof versionRow>;
const widgets = [{ id: "orders", metricId: "sales.orders", visual: "bar", wide: false }, { id: "products", metricId: "products.catalogue", visual: "kpi", wide: false }];
const content = () => businessViewCreateSchema.parse({ name: "Business <overview>", widgets });
const payload = () => { const owner = registry.describe("analytics.dashboard.view", 1); return { schemaVersion: 1, sourceView: { id: owner.id, version: 1, schemaHash: owner.schemaHash, contractHash: owner.contractHash }, content: content() }; };
function versionRow() { return { id: id(2), definitionId: id(1), organisationId: "a", version: 1, schemaVersion: 1,
  payload: saved.payload, compiledPlan: saved.plan, checksum: saved.checksum, definition: { kind: "view", retiredAt: null as Date | null }, configurationDependencies: [] }; }
const request = () => ({ definitionId: id(1), expectedHead: { versionId: id(2), definitionRevision: 3, checksum: row.checksum } });
const nativeMetric = (id: string) => ({ id, name: id, subject: "Sales", definition: "Complete count", grain: "Record", capability: "sales.order.read", snapshot: false,
  href: "/sales/orders", unit: "count", query: m.queries });
// Real owner registration, read-mode compiler, immutable seals, generic runtime
// and module adapters. Issued principal/storage/native provider callbacks are
// explicitly bounded collaborators; no actual SQL/atomic native snapshot claim.
beforeEach(async () => {
  vi.clearAllMocks(); session = { userId: "actor", membershipId: "member", organisationId: "a", userName: "Actor", userEmail: "actor@example.test", organisationName: "A",
    capabilities: new Set(["analytics.dashboard.read", "analytics.dashboard.manage", "sales.order.read", "core.products.read", "studio.definition.edit"]) };
  fresh = { ...session, capabilities: new Set(session.capabilities) }; issued = new WeakMap([[session, stamp], [fresh, stamp]]);
  m.stamp.mockImplementation(value => issued.get(value)); enabled = new Set(["analytics", "sales", "products"]);
  registry = new CapabilityRegistry(async (value, module) => value.organisationId === "a" && enabled.has(module));
  registry.register("analytics", analyticsBusinessViewContract);
  for (const [owner, bundle] of [["sales", salesAnalyticsStudioContract], ["products", productsAnalyticsStudioContract]] as const)
    registry.register(owner, { contributions: bundle.contributions.map(item => item.metadata.kind === "query" ? { ...item, run: async (_context, input) => {
      m.queries(item.metadata.id, input); return [{ label: item.metadata.id.startsWith("products") ? "PRODUCT" : "DRAFT", value: 0 }]; } } : item) });
  authority = { session, stamp, transaction, registry };
  m.bridge.mockImplementation(async (value, tx) => {
    if (!issued.has(value) || !issued.has(fresh) || value.organisationId !== stamp.organisationId || !tx) throw new Error("FORBIDDEN: genuine current authority required");
    return { session: fresh, stamp, transaction: tx, registry };
  });
  m.tx.mockImplementation(async callback => callback(transaction));
  m.native.mockImplementation(async (value, tx) => {
    if (!issued.has(value) || !issued.has(fresh) || tx !== transaction) throw new Error("FORBIDDEN: genuine native identity required");
    return { session: fresh, stamp };
  });
  m.customer.mockResolvedValue({ id: "a" });
  saved = await compileRegisteredView(authority, payload()); row = versionRow();
  m.list.mockResolvedValue([{ id: id(1) }]); m.definition.mockResolvedValue({ id: id(1), name: "Overview", revision: 3, activeVersionId: id(2) }); m.version.mockImplementation(async ({ select }) => select.version ? { ...row } : { ...row });
  m.draft.mockResolvedValue({ id: id(3), definitionId: id(1), payload: saved.payload, definition: { retiredAt: null, name: content().name, revision: 3 }, updatedAt: new Date("2026-10-12T00:00:00Z"), revision: 0 });
  m.modules.mockResolvedValue({ id: "studio" }); m.create.mockResolvedValue({ id: id(1) }); m.update.mockResolvedValue({ count: 1 }); m.audit.mockResolvedValue({ id: "audit" });
  m.catalogue.mockResolvedValue([nativeMetric("sales.orders"), { ...nativeMetric("products.catalogue"), snapshot: true, capability: "core.products.read" }]);
  fresh.capabilities.delete("analytics.dashboard.manage"); fresh.capabilities.delete("studio.definition.edit");
});
it("current ordinary readers need no Studio/Manage grants, preserve zero values and use only sealed requests", async () => {
  const read = await readPublishedAnalyticsViewInTransaction(authority, request());
  expect(read).toMatchObject({ definitionId: id(1), definitionRevision: 3, content: { widgets: [{ wide: false }, { wide: false }] },
    dataByWidget: { orders: { points: [{ value: 0 }] }, products: { points: [{ value: 0 }] } } });
  expect(m.queries.mock.calls).toEqual([["sales.orders.metric.read", { period: "90", dimension: "status" }], ["products.catalogue.metric.read", { period: "all", dimension: "default" }]]);
  expect(m.audit).not.toHaveBeenCalled(); expect(m.update).not.toHaveBeenCalled();
});
it.each(["analytics.dashboard.read", "sales.order.read", "core.products.read"])("current %s denial preflights the entire view before FIRST provider", async capability => {
  fresh.capabilities.delete(capability);
  await expect(readPublishedAnalyticsViewInTransaction(authority, request())).rejects.toThrow("FORBIDDEN"); expect(m.queries).not.toHaveBeenCalled();
});
it.each(["analytics", "sales", "products"])("current %s module denial precedes provider access", async module => {
  enabled.delete(module); await expect(readPublishedAnalyticsViewInTransaction(authority, request())).rejects.toThrow("DEPENDENCY_BROKEN"); expect(m.queries).not.toHaveBeenCalled();
});
it.each(["forged", "revoked", "foreign", "seal", "payload", "retired", "pointer", "revision", "unknown", "owner"])("denies %s without business queries", async mode => {
  let input: unknown = request();
  if (mode === "forged") authority.session = { ...session };
  if (mode === "revoked") issued.delete(fresh);
  if (mode === "foreign") row.organisationId = "foreign";
  if (mode === "seal") row.checksum = "f".repeat(64);
  if (mode === "payload") row.payload = { ...row.payload, content: { name: "corrupt" } };
  if (mode === "retired") row.definition.retiredAt = new Date();
  if (mode === "pointer") m.definition.mockResolvedValue({ id: id(1), revision: 3, activeVersionId: id(4) });
  if (mode === "revision") input = { ...request(), expectedHead: { ...request().expectedHead, definitionRevision: 2 } };
  if (mode === "unknown") input = { ...request(), organisationId: "foreign" };
  if (mode === "owner") { await expect(readPublishedViewInTransaction(authority, request(), "analytics.other.view")).rejects.toThrow("different"); }
  else await expect(readPublishedAnalyticsViewInTransaction(authority, input)).rejects.toThrow();
  expect(m.queries).not.toHaveBeenCalled();
});
it("genuine author create/save delegates metadata CAS/Audit and keeps stale failures before effects", async () => {
  fresh.capabilities.add("analytics.dashboard.manage"); fresh.capabilities.add("studio.definition.edit");
  expect(await createBusinessViewDraftInTransaction(authority, content())).toEqual({ definitionId: id(1), revision: 0 });
  expect(await saveBusinessViewDraftInTransaction(authority, { definitionId: id(1), revision: 0, ...content() })).toEqual({ definitionId: id(1), revision: 1 });
  expect(m.audit.mock.calls.map(([entry]) => entry.data.action)).toEqual(["studio.draft.created", "studio.draft.updated"]);
  expect(m.queries).not.toHaveBeenCalled(); m.audit.mockClear(); m.update.mockResolvedValue({ count: 0 });
  await expect(saveBusinessViewDraftInTransaction(authority, { definitionId: id(1), revision: 0, ...content() })).rejects.toThrow("CONFLICT"); expect(m.audit).not.toHaveBeenCalled();
});
it("strict friendly inputs exclude security pins/data and preserve native false/zero", () => {
  expect(businessViewSaveSchema.parse({ definitionId: id(1), revision: 0, ...content() }).widgets[0].wide).toBe(false);
  expect(() => businessViewSaveSchema.parse({ definitionId: id(1), revision: 0, ...content(), sourceView: {} })).toThrow();
});
it("library/slice use approved registry queries, omit unavailable unused sources and reject unsupported dimensions", async () => {
  m.catalogue.mockResolvedValue([nativeMetric("sales.orders")]); fresh.capabilities.delete("core.products.read");
  expect(await loadBusinessViewMetricsInTransaction(authority, "30")).toMatchObject([{ id: "sales.orders", points: [{ value: 0 }] }]);
  expect(await loadBusinessViewSliceInTransaction(authority, { metricId: "sales.orders", period: "all", breakdown: "type" })).toMatchObject({ shape: "breakdown" });
  m.queries.mockClear(); await expect(loadBusinessViewSliceInTransaction(authority, { metricId: "sales.orders", period: "30", breakdown: "customer" })).rejects.toThrow("approved");
  expect(m.queries).not.toHaveBeenCalled();
});
it("normalized equivalent raw corruption is still rejected by immutable payload-plan mirror", async () => {
  row.payload = JSON.parse(JSON.stringify(saved.payload)); Reflect.deleteProperty((row.payload as { content: object }).content, "refreshSeconds");
  // This deliberately changes persisted raw JSON rather than recompiling it.
  expect(checksum(row.payload)).not.toBe(checksum(saved.payload));
  await expect(readPublishedAnalyticsViewInTransaction(authority, request())).rejects.toThrow(); expect(m.queries).not.toHaveBeenCalled();
});

it("customer discovery checks current sealed grants before names without executing providers", async () => {
  expect(await listPublishedBusinessViewsInTransaction(authority)).toEqual([{ definitionId: id(1), name: content().name, definitionRevision: 3,
    view: { versionId: id(2), version: 1, checksum: row.checksum } }]);
  expect(m.list.mock.calls[0][0]).toMatchObject({ where: { organisationId: "a", kind: "view", retiredAt: null,
    activeVersion: { payload: { path: ["sourceView", "id"], equals: "analytics.dashboard.view" } } }, take: 101 });
  expect(m.queries).not.toHaveBeenCalled();
  fresh.capabilities.delete("core.products.read"); expect(await listPublishedBusinessViewsInTransaction(authority)).toEqual([]);
  expect(m.queries).not.toHaveBeenCalled();
});
it("catalogue corrupt metadata and overflow are not hidden as permission omissions", async () => {
  row.checksum = "f".repeat(64); await expect(listPublishedBusinessViewsInTransaction(authority)).rejects.toThrow();
  m.list.mockResolvedValue(Array.from({ length: 101 }, (_, index) => ({ id: id(index + 1) })));
  await expect(listPublishedBusinessViewsInTransaction(authority)).rejects.toThrow("bound"); expect(m.queries).not.toHaveBeenCalled();
});

it("retained pin preflight never follows active pointer and counts EACH approved descriptor in original Page cost units", async () => {
  const pin = { kind: "view", definitionId: id(1), versionId: id(2), schemaVersion: 1, checksum: row.checksum };
  m.definition.mockResolvedValue({ id: id(1), revision: 8, activeVersionId: id(9) }); m.definition.mockClear();
  const inspected = await inspectSealedViewForReadInTransaction(authority, pin);
  expect(inspected).toMatchObject({ pin, queryCount: 2, queryCost: 16, plan: { kind: "view" } });
  expect(m.definition).not.toHaveBeenCalled(); expect(m.queries).not.toHaveBeenCalled();
  expect(await readSealedViewInTransaction(authority, pin)).toMatchObject({ pin, dataByWidget: { orders: [{ value: 0 }] } });
  expect(m.queries).toHaveBeenCalledTimes(2);
  m.queries.mockClear(); fresh.capabilities.delete("core.products.read");
  await expect(inspectSealedViewForReadInTransaction(authority, pin)).rejects.toThrow("FORBIDDEN");
  await expect(readSealedViewInTransaction(authority, pin)).rejects.toThrow("FORBIDDEN"); expect(m.queries).not.toHaveBeenCalled();
});

it.each(["module", "read"])("Home discovery omits currently unavailable Analytics %s before definition metadata while direct reads stay strict", async cause => {
  // Shell staff navigation can advertise every implemented app; the actual
  // current business registry must still follow genuine entitlement + Read.
  session.capabilities.add("atlas.staff"); fresh.capabilities.add("atlas.staff");
  if (cause === "module") enabled.delete("analytics"); else fresh.capabilities.delete("analytics.dashboard.read");
  m.list.mockClear();
  expect(await listPublishedBusinessViewsInTransaction(authority)).toEqual([]);
  expect(m.list).not.toHaveBeenCalled(); expect(m.definition).not.toHaveBeenCalled(); expect(m.version).not.toHaveBeenCalled(); expect(m.queries).not.toHaveBeenCalled();
  await expect(readPublishedAnalyticsViewInTransaction(authority, request())).rejects.toThrow(cause === "module" ? "DEPENDENCY_BROKEN" : "FORBIDDEN");
  expect(m.queries).not.toHaveBeenCalled();
});
it.each(["forged", "revoked"])("Home discovery keeps %s genuine current identity failures hard, never treating them as unavailable owners", async cause => {
  if (cause === "forged") authority.session = { ...session }; else issued.delete(fresh);
  m.list.mockClear(); await expect(listPublishedBusinessViewsInTransaction(authority)).rejects.toThrow("FORBIDDEN");
  expect(m.list).not.toHaveBeenCalled(); expect(m.queries).not.toHaveBeenCalled();
});

it("Home wrapper refreshes native identity and CUSTOMER scope before field authority in one Serializable transaction", async () => {
  m.bridge.mockClear();
  expect(await listPublishedBusinessViews(session)).toMatchObject([{ name: content().name }]);
  expect(m.tx).toHaveBeenCalledWith(expect.any(Function), { isolationLevel: "Serializable" });
  expect(m.native).toHaveBeenCalledWith(session, transaction);
  expect(m.customer).toHaveBeenCalledWith({ where: { id: fresh.organisationId, kind: "CUSTOMER", status: "ACTIVE", archivedAt: null }, select: { id: true } });
  expect(m.native.mock.invocationCallOrder[0]).toBeLessThan(m.customer.mock.invocationCallOrder[0]);
  expect(m.customer.mock.invocationCallOrder[0]).toBeLessThan(m.bridge.mock.invocationCallOrder[0]);
  expect(m.bridge.mock.calls.every(([value, tx]) => value === fresh && tx === transaction)).toBe(true);
  expect(m.queries).not.toHaveBeenCalled(); expect(m.audit).not.toHaveBeenCalled(); expect(m.update).not.toHaveBeenCalled();
});
it.each(["INTERNAL", "suspended CUSTOMER", "archived CUSTOMER"])("Home wrapper returns no customer names for actual %s before field authority", async () => {
  m.customer.mockResolvedValue(null); m.bridge.mockClear();
  fresh.capabilities.add("atlas.staff");
  expect(await listPublishedBusinessViews(session)).toEqual([]);
  expect(m.native).toHaveBeenCalledWith(session, transaction);
  expect(m.bridge).not.toHaveBeenCalled(); expect(m.list).not.toHaveBeenCalled(); expect(m.definition).not.toHaveBeenCalled();
  expect(m.version).not.toHaveBeenCalled(); expect(m.queries).not.toHaveBeenCalled();
});
it.each(["forged", "revoked"])("Home wrapper retains %s identity failure before CUSTOMER/field lookup", async mode => {
  const supplied = mode === "forged" ? { ...session } : session;
  if (mode === "revoked") issued.delete(fresh);
  m.bridge.mockClear();
  await expect(listPublishedBusinessViews(supplied)).rejects.toThrow("FORBIDDEN");
  expect(m.customer).not.toHaveBeenCalled(); expect(m.bridge).not.toHaveBeenCalled(); expect(m.list).not.toHaveBeenCalled(); expect(m.queries).not.toHaveBeenCalled();
});
it("Home wrapper uses refreshed tenant identity and never converts customer authority failure into empty discovery", async () => {
  m.bridge.mockClear(); m.bridge.mockRejectedValue(new Error("FORBIDDEN: customer membership revoked"));
  await expect(listPublishedBusinessViews(session)).rejects.toThrow("customer membership revoked");
  expect(m.list).not.toHaveBeenCalled(); expect(m.definition).not.toHaveBeenCalled(); expect(m.queries).not.toHaveBeenCalled();
});
