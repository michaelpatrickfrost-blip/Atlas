import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Session, SessionAuthorityStamp } from "@/core/auth/session";
import type { Prisma } from "@/generated/prisma/client";
import { CapabilityRegistry } from "@/core/studio/registry/registry";
import { checksum, declarative } from "@/core/studio/registry/contracts";
import { compileDefinition, compileDefinitionInTransaction, parseDefinitionPayload } from "@/core/studio/compiler";
import { viewPayloadSchema } from "@/core/studio/views/schema";
import { viewSourcePolicySchema } from "@/core/studio/views/owner-contract";
import { viewSource } from "@/core/studio/registry/view-contracts";
import { analyticsBusinessViewContract, analyticsBusinessViewContentSchema } from "@/modules/analytics/services/studio-view";
import { salesAnalyticsStudioContract } from "@/modules/sales/services/studio-analytics";
import { productsAnalyticsStudioContract } from "@/modules/products/services/studio-analytics";
import { dashboardSchema } from "@/modules/analytics/definition";
import type { FieldRuntimeAuthority } from "@/core/studio/fields/runtime-authority";
import type { Contribution } from "@/core/studio/registry/types";
import { z } from "zod";
const m = vi.hoisted(() => ({ stamp: vi.fn(), bridge: vi.fn(), businessRead: vi.fn() }));
vi.mock("@/core/auth/session", () => ({ sessionAuthorityStamp: m.stamp, requireSession: vi.fn(), getSession: vi.fn(), sessionForUser: vi.fn() }));
vi.mock("@/core/db/client", () => ({ db: new Proxy({}, { get: () => ({ findMany: m.businessRead, groupBy: m.businessRead, count: m.businessRead }) }) }));
vi.mock("@/core/studio/fields/runtime-authority", () => ({ fieldRuntimeAuthorityInTransaction: m.bridge }));
vi.mock("@/core/modules/runtime", () => ({ getEnabledModuleIds: vi.fn(), enabledModulesForSession: vi.fn(), isModuleEnabled: vi.fn() }));
vi.mock("@/core/modules/access", () => ({ assertModuleEnabled: vi.fn() }));
let registry: CapabilityRegistry, authenticated: Session, current: Session, authority: FieldRuntimeAuthority, issued: WeakMap<Session, SessionAuthorityStamp>, enabled: Set<string>;
const stamp: SessionAuthorityStamp = { organisationId: "a", userId: "author", membershipId: "member", authVersion: 2, sessionVersion: 3 };
const capabilities = ["analytics.dashboard.read", "analytics.dashboard.manage", "sales.order.read", "sales.quote.read", "core.products.read"];
const actor = (): Session => ({ organisationId: "a", userId: "author", membershipId: "member", userName: "Author", userEmail: "author@example.test", organisationName: "A", capabilities: new Set(capabilities) });
const transaction = {} as Prisma.TransactionClient;
const exact = (id: string, version = 1) => { const value = registry.describe(id, version); return { id, version, schemaHash: value.schemaHash, contractHash: value.contractHash }; };
const widget = (metricId = "sales.orders", id = "orders") => ({ id, metricId, visual: "bar", wide: false });
const payload = (widgets: Array<ReturnType<typeof widget> & Record<string, unknown>> = [widget()]) => ({ schemaVersion: 1, sourceView: exact("analytics.dashboard.view"), content: { name: "Sales overview", widgets } });
const compile = (input: unknown = payload()) => compileDefinitionInTransaction(authority, "definition", "view", input);
// Real owner schemas/callbacks, original closed compiler dispatch, registration,
// metadata hash/current-source/input validation run. Current authority issuance,
// refresh/locks and native storage are bounded collaborators; no SQL/live claim.
beforeEach(() => {
  vi.clearAllMocks(); issued = new WeakMap(); authenticated = actor(); current = actor(); issued.set(authenticated, stamp); issued.set(current, stamp);
  m.stamp.mockImplementation(session => issued.get(session) ?? null);
  enabled = new Set(["analytics", "sales", "products"]); registry = new CapabilityRegistry(async (session, owner) => session.organisationId === "a" && enabled.has(owner));
  registry.register("analytics", analyticsBusinessViewContract); registry.register("sales", salesAnalyticsStudioContract); registry.register("products", productsAnalyticsStudioContract);
  authority = { session: authenticated, transaction, registry, stamp };
  m.bridge.mockImplementation(async (session, tx) => {
    if (!issued.has(session) || !tx || session.organisationId !== stamp.organisationId || session.userId !== stamp.userId || session.membershipId !== stamp.membershipId
      || !issued.has(current) || checksum(issued.get(current)) !== checksum(stamp)) throw new Error("FORBIDDEN: current authenticated company access is required.");
    return { session: current, stamp, transaction: tx, registry };
  });
});
describe("explicit module-owned Analytics view compiler", () => {
  it("compiles genuine current metadata, exact source/query dependencies and native display controls without data reads", async () => {
    const input = payload([widget(), widget("products.catalogue", "products")]), result = await compile(input);
    expect(m.bridge).toHaveBeenCalledWith(authenticated, transaction); expect(m.businessRead).not.toHaveBeenCalled();
    expect(result.plan).toMatchObject({ kind: "view", schemaVersion: 1, configurationDependencies: [], warnings: [],
      requests: [{ widgetId: "orders", query: exact("sales.orders.metric.read"), input: { period: "90", dimension: "status" } },
        { widgetId: "products", query: exact("products.catalogue.metric.read"), input: { period: "all", dimension: "default" } }] });
    expect(result.plan.dependencies.map(dependency => dependency.id)).toEqual(["analytics.dashboard.view", "products.catalogue.metric", "products.catalogue.metric.read", "sales.orders.metric", "sales.orders.metric.read"]);
    expect(result.payload.content).toMatchObject({ name: "Sales overview", period: "90", refreshSeconds: 30, filters: { from: "", to: "", search: "" } });
    expect(result.checksum).toBe(checksum(result.plan)); expect(await compile(result.payload)).toEqual(result);
  });
  it("retains the previously registered finite source input/output schema hashes", () => {
    expect(registry.describe("sales.orders.metric.read", 1).schemaHash).toBe("29a23b5eb9614c404e6be2bdfd3339b917762d51048a71aace4e531e6f1ac306");
    expect(registry.describe("products.catalogue.metric.read", 1).schemaHash).toBe("4c0138f80524a0e49959bdf8027fda05379ba0f4f920975bc160bb390d0d3715");
  });
  it("retains widget order and native zero/false style controls and deduplicates repeated exact dependencies", async () => {
    const input = payload([{ ...widget("sales.orders", "second"), minimum: 0, borderless: false, span: 4, category: "", categories: [], breakdown: "" }, { ...widget("sales.orders", "first"), breakdown: "type" }]);
    const result = await compile(input); expect(result.plan.requests.map(request => request.widgetId)).toEqual(["second", "first"]);
    expect(result.plan.dependencies).toHaveLength(3); expect(result.payload.content).toMatchObject({ widgets: [{ id: "second", minimum: 0, borderless: false }, { id: "first" }] });
  });
  it.each(["copied", "tenant", "revoked", "authVersion", "sessionVersion", "no-transaction"])("denies %s principal before owner metadata compilation", async mode => {
    if (mode === "copied") authority.session = { ...authenticated };
    if (mode === "tenant") authenticated.organisationId = "foreign";
    if (mode === "revoked") issued.delete(current);
    if (mode === "authVersion" || mode === "sessionVersion") issued.set(current, { ...stamp, [mode]: 4 });
    if (mode === "no-transaction") authority.transaction = undefined as never;
    await expect(compile()).rejects.toThrow("FORBIDDEN"); expect(m.businessRead).not.toHaveBeenCalled();
  });
  it.each(["analytics.dashboard.read", "analytics.dashboard.manage", "sales.order.read", "core.products.read"])("checks CURRENT independent %s grant", async cap => {
    current.capabilities.delete(cap); await expect(compile(payload([widget(), widget("products.catalogue", "products")]))).rejects.toThrow("FORBIDDEN");
    expect(authenticated.capabilities.has(cap)).toBe(true); expect(m.businessRead).not.toHaveBeenCalled();
  });
  it.each(["analytics", "sales", "products"])("checks CURRENT enabled and entitled %s module", async module => {
    enabled.delete(module); await expect(compile(payload([widget(), widget("products.catalogue", "products")]))).rejects.toThrow("DEPENDENCY_BROKEN");
    expect(m.businessRead).not.toHaveBeenCalled();
  });
  it("does not require unrelated source permissions", async () => {
    current.capabilities.delete("sales.quote.read"); current.capabilities.delete("core.products.read"); enabled.delete("products");
    await expect(compile()).resolves.toMatchObject({ plan: { kind: "view" } });
  });
  it.each(["hash", "query-reference", "personal-id", "personal-cas", "tenant", "permission", "result", "unknown-widget", "duplicate", "oversize", "data", "filters", "dimension", "category", "unsupported"])("rejects %s metadata without executing providers", async mode => {
    const input = payload();
    if (mode === "hash") input.sourceView.contractHash = "0".repeat(64);
    if (mode === "query-reference") input.sourceView = exact("sales.orders.metric.read");
    if (["personal-id", "personal-cas", "tenant", "permission", "result"].includes(mode)) Object.assign(input.content, { [({ "personal-id": "id", "personal-cas": "expectedUpdatedAt", tenant: "organisationId", permission: "capabilities", result: "points" } as Record<string, string>)[mode]]: "untrusted" });
    if (mode === "unknown-widget") Object.assign(input.content.widgets[0], { script: "run" });
    if (mode === "duplicate") input.content.widgets.push(input.content.widgets[0]);
    if (mode === "oversize") input.content.widgets = Array.from({ length: 9 }, (_, index) => widget("sales.orders", String(index)));
    if (mode === "data") Object.assign(input.content.widgets[0], { data: { dataset: "sales.orders", aggregation: "sum" } });
    if (mode === "filters") Object.assign(input.content, { filters: { from: "", to: "", search: "hidden search" } });
    if (mode === "dimension") Object.assign(input.content.widgets[0], { breakdown: "customer" });
    if (mode === "category") Object.assign(input.content.widgets[0], { categories: ["Private customer"] });
    if (mode === "unsupported") input.content.widgets[0].metricId = "finance.documents.status";
    await expect(compile(input)).rejects.toThrow(); expect(m.businessRead).not.toHaveBeenCalled();
  });
  it("keeps existing native personal dashboards and broader native data schema unchanged", () => {
    expect(dashboardSchema.parse({ name: "Personal", id: "mine", expectedUpdatedAt: "2026-10-01T00:00:00Z", widgets: [{ ...widget(), data: { dataset: "sales.orders", group: "customer", measure: "total", aggregation: "sum", currency: "GBP" } }] })).toMatchObject({ id: "mine", widgets: [{ data: { aggregation: "sum" } }] });
    expect(analyticsBusinessViewContentSchema.safeParse({ name: "Business", id: "mine", widgets: [widget()] }).success).toBe(false);
  });
  it("preserves original kernel dispatch/checksums and rejects old unsupported raw view data in both entries", async () => {
    const input = { schemaVersion: 1, description: "References", references: [exact("sales.orders.metric")] };
    const original = await compileDefinition(current, "capabilitySet", input, registry);
    expect(await compileDefinitionInTransaction(authority, "definition", "capabilitySet", input)).toEqual(original);
    expect(() => parseDefinitionPayload("view", { name: "Raw old personal board", widgets: [widget()] })).toThrow("No Studio compiler");
    await expect(compileDefinition(current, "view", payload(), registry)).rejects.toThrow("No Studio compiler");
    await expect(compile({ name: "Raw old personal board", widgets: [widget()] })).rejects.toThrow("No Studio compiler");
  });
  it("does not expose compiler callbacks to generic invocation", async () => {
    await expect(registry.invoke(current, exact("analytics.dashboard.view"), {})).rejects.toThrow(); expect(m.businessRead).not.toHaveBeenCalled();
  });
  it.each(["owner-optout", "source-optout", "query-change", "expired-source", "expired-owner"])("denies %s rather than historical fallback", async mode => {
    if (mode === "owner-optout") registry.register("analytics", { contributions: [declarative({ id: "analytics.dashboard.view", version: 2, label: "Unavailable", capability: "analytics.dashboard.read", lifecycle: "active", classification: "confidential", kind: "surface", schema: z.strictObject({}), references: [] })] });
    if (mode === "source-optout") registry.register("sales", { contributions: [declarative({ id: "sales.orders.metric", version: 2, label: "Unavailable", capability: "sales.order.read", lifecycle: "active", classification: "confidential", kind: "metric", schema: z.array(z.number()), references: [] })] });
    if (mode === "query-change") { const query = salesAnalyticsStudioContract.contributions.find(item => item.metadata.id === "sales.orders.metric.read")!; registry.register("sales", { contributions: [{ ...query, metadata: { ...query.metadata, version: 2, capability: "sales.order.manage" } }] }); }
    if (mode.startsWith("expired")) {
      const bundle = mode === "expired-owner" ? analyticsBusinessViewContract : salesAnalyticsStudioContract;
      const item = bundle.contributions.find(item => item.metadata.id === (mode === "expired-owner" ? "analytics.dashboard.view" : "sales.orders.metric"))!;
      registry.register(mode === "expired-owner" ? "analytics" : "sales", { contributions: [{ ...item, metadata: { ...item.metadata, version: 2, lifecycle: "deprecated", supportedUntil: "2026-01-01T00:00:00Z" } }] });
    }
    await expect(compile()).rejects.toThrow("DEPENDENCY_BROKEN"); expect(m.businessRead).not.toHaveBeenCalled();
  });
  it("allows current label/version-only owner releases while preserving original exact envelope", async () => {
    const item = analyticsBusinessViewContract.contributions[0]; registry.register("analytics", { contributions: [{ ...item, metadata: { ...item.metadata, version: 2, label: "Renamed board" } }] });
    const result = await compile(); expect(result.payload.sourceView.version).toBe(1); expect(result.plan.dependencies.find(dep => dep.id === "analytics.dashboard.view")?.version).toBe(1);
  });
  it("validates callback/policy/hash pairing atomically without changing previous contracts", () => {
    const old = registry.describe("analytics.dashboard.view", 1);
    const item = analyticsBusinessViewContract.contributions[0];
    for (const broken of [{ ...item, viewSource: undefined }, { ...item, metadata: { ...item.metadata, schemaHash: "0".repeat(64) } },
      { ...item, metadata: { ...item.metadata, kind: "metric" as const } }])
      expect(() => new CapabilityRegistry(async () => true).register("analytics", { contributions: [broken] })).toThrow();
    expect(registry.describe("analytics.dashboard.view", 1)).toEqual(old);
  });
  it("rejects owner-produced query/ref/input/cost mutations before any execution", async () => {
    const original = analyticsBusinessViewContract.contributions[0], callbacks = original.viewSource!;
    for (const corrupt of ["query", "input", "unused", "cost", "duplicate"] as const) {
      const alternate = new CapabilityRegistry(async () => true);
      const contribution: Contribution = { ...original, viewSource: { prepare: callbacks.prepare, compile(content, approvals) {
        const result = callbacks.compile(content, approvals);
        if (corrupt === "query") result.requests[0].query.contractHash = "0".repeat(64);
        if (corrupt === "input") Object.assign(result.requests[0].input as object, { organisationId: "foreign" });
        if (corrupt === "unused") result.requests[0].query = approvals[0].query;
        if (corrupt === "cost") result.requests = Array.from({ length: 9 }, (_, index) => ({ ...result.requests[0], widgetId: String(index) }));
        if (corrupt === "duplicate") result.requests.push(result.requests[0]);
        return result;
      } } };
      alternate.register("analytics", { contributions: [contribution] }); alternate.register("sales", salesAnalyticsStudioContract); alternate.register("products", productsAnalyticsStudioContract);
      registry = alternate; await expect(compile(payload([widget(), widget("products.catalogue", "products")]))).rejects.toThrow();
    }
    expect(m.businessRead).not.toHaveBeenCalled();
  });
  it("owner factory revalidates its closed prepared and compiled content schema", async () => {
    const original = analyticsBusinessViewContract.contributions[0], owner = original.viewSource!;
    for (const stage of ["prepare", "compile"] as const) {
      const alternate = new CapabilityRegistry(async () => true);
      const changed = viewSource({ id: "analytics.dashboard.view", version: 1, label: "Board", capability: "analytics.dashboard.read",
        lifecycle: "active", classification: "confidential", contentSchema: analyticsBusinessViewContentSchema,
        policy: viewSourcePolicySchema.parse(original.metadata.details.viewSource), callbacks: {
          prepare(content) { const result = owner.prepare(content); return stage === "prepare" ? { ...result, content: { ...result.content as object, privateResult: "hidden" } } : result; },
          compile(content, approvals) { const result = owner.compile(content, approvals); return stage === "compile" ? { ...result, content: { ...result.content as object, privateResult: "hidden" } } : result; },
        } });
      alternate.register("analytics", { contributions: [changed] }); alternate.register("sales", salesAnalyticsStudioContract); registry = alternate;
      await expect(compile()).rejects.toThrow();
    }
    expect(m.businessRead).not.toHaveBeenCalled();
  });
  it("bounds JSON envelope and rejects metadata-only or function transport", () => {
    expect(viewPayloadSchema.safeParse({ ...payload(), content: { bad: () => 1 } }).success).toBe(false);
    let nested: unknown = null; for (let i = 0; i < 15; i++) nested = { next: nested };
    expect(viewPayloadSchema.safeParse({ ...payload(), content: nested }).success).toBe(false);
    expect(viewPayloadSchema.safeParse({ ...payload(), organisationId: "foreign" }).success).toBe(false);
  });
});
