import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Session, SessionAuthorityStamp } from "@/core/auth/session";
import { CapabilityRegistry } from "@/core/studio/registry/registry";
import { registeredMetricContributions, registeredMetricSourceSchema, registeredReportContributions, registeredReportSourceSchema } from "@/core/studio/registry/analytics-sources";
import { salesAnalyticsStudioContract } from "@/modules/sales/services/studio-analytics";
import { productsAnalyticsStudioContract } from "@/modules/products/services/studio-analytics";
import { salesStudioContract } from "@/modules/sales/services/studio";
import { salesAnalytics } from "@/modules/sales/services/analytics";
import { reports } from "@/modules/sales/services/reports";
import { productsAnalytics } from "@/modules/products/services/analytics";
import { templateProviderAdapter } from "@/core/studio/registry/adapters";
import { salesTemplateContext } from "@/modules/sales/services/template-context";
import type { ModuleManifest } from "@/core/modules/types";
const m = vi.hoisted(() => ({ stamp: vi.fn(), refresh: vi.fn(), enabled: vi.fn(), orderGroups: vi.fn(), quoteGroups: vi.fn(), productGroups: vi.fn(),
  orders: vi.fn(), quotes: vi.fn(), products: vi.fn(), orderCount: vi.fn(), quoteCount: vi.fn(), productCount: vi.fn() }));
vi.mock("@/core/auth/session", () => ({ sessionAuthorityStamp: m.stamp, sessionForUser: m.refresh, requireSession: vi.fn(), getSession: vi.fn() }));
vi.mock("@/core/modules/runtime", () => ({ getEnabledModuleIds: m.enabled, enabledModulesForSession: m.enabled, isModuleEnabled: vi.fn() }));
vi.mock("@/core/modules/access", () => ({ assertModuleEnabled: vi.fn() }));
vi.mock("@/core/db/client", () => ({ db: { salesOrder: { groupBy: m.orderGroups, findMany: m.orders, count: m.orderCount },
  quote: { groupBy: m.quoteGroups, findMany: m.quotes, count: m.quoteCount }, product: { groupBy: m.productGroups, findMany: m.products, count: m.productCount } } }));
const stamp: SessionAuthorityStamp = { userId: "reader", organisationId: "a", membershipId: "member", authVersion: 2, sessionVersion: 3 };
const caps = ["sales.order.read", "sales.quote.read", "core.products.read"];
let authenticated: Session, current: Session, issued: WeakMap<Session, SessionAuthorityStamp>, registry: CapabilityRegistry;
const actor = (organisationId = "a", capabilities = caps): Session => ({ userId: "reader", membershipId: "member", userName: "Reader", userEmail: "reader@example.test",
  organisationId, organisationName: organisationId, capabilities: new Set(capabilities) });
const ref = (id: string) => { const source = registry.describe(id, 1); return { id, version: 1, schemaHash: source.schemaHash, contractHash: source.contractHash }; };
const metricPolicy = () => registeredMetricSourceSchema.parse(registry.describe("sales.orders.metric", 1).details.analyticsSource);
const reportPolicy = () => registeredReportSourceSchema.parse(registry.describe("sales.orders.report", 1).details.analyticsSource);
// Original providers, validators, registry schema/output enforcement and pure
// metadata factories run. Genuine auth issuance/current membership and native
// storage are bounded mocks; no SQL snapshot/live completeness proof is claimed.
beforeEach(() => {
  vi.clearAllMocks(); issued = new WeakMap(); authenticated = actor(); current = actor(); issued.set(authenticated, stamp); issued.set(current, stamp);
  m.stamp.mockImplementation(value => issued.get(value) ?? null); m.refresh.mockResolvedValue(current); m.enabled.mockResolvedValue(new Set(["sales", "products"]));
  m.orderGroups.mockResolvedValue([{ commercialStatus: "DRAFT", _count: { _all: 0 } }]);
  m.quoteGroups.mockResolvedValue([{ status: "ACCEPTED", _count: { _all: 2 } }]); m.productGroups.mockResolvedValue([{ kind: "PRODUCT", _count: { _all: 3 } }]);
  m.orders.mockResolvedValue([{ reference: "SO-1", party: { name: "Customer" }, commercialStatus: "DRAFT", currency: "GBP", netAmount: 0n,
    taxAmount: 0n, grossAmount: 100000000000000099n, orderDate: new Date("2026-10-01T00:00:00Z"), requestedDeliveryDate: null, createdAt: new Date("2026-09-30T00:00:00Z") }]);
  m.orderCount.mockResolvedValue(1); m.quoteCount.mockResolvedValue(0); m.productCount.mockResolvedValue(1);
  m.products.mockResolvedValue([{ code: "P1", name: "Shared product", categoryCode: null, kind: "PRODUCT", unitOfMeasure: "EA", active: false, createdAt: new Date("2026-10-01T00:00:00Z") }]);
  registry = new CapabilityRegistry(async () => true);
  registry.register("sales", salesAnalyticsStudioContract); registry.register("products", productsAnalyticsStudioContract);
});
describe("explicit existing Analytics owner sources", () => {
  it("registers only deliberate finite metrics and paged reports, preserving logical provider IDs", () => {
    expect(metricPolicy()).toMatchObject({ providerId: "sales.orders", unit: "count", complete: true, requiredCapabilities: ["sales.order.read"], requiredModules: ["sales"],
      dimensions: [{ id: "status" }, { id: "type" }], maxCardinality: 7, costClass: "high" });
    expect(reportPolicy()).toMatchObject({ providerId: "sales.orders", pagination: "page", pageSize: 100, maxCardinality: 100,
      moneyRepresentation: "major_decimal_number_or_exact_text" });
    expect(registry.describe("products.catalogue.metric", 1).kind).toBe("metric");
    for (const id of ["sales.orders.trend.metric", "finance.documents.status.metric", "summary.sales.orders.report", "customers.lifecycle.metric"])
      expect(() => registry.describe(id, 1)).toThrow("missing");
  });
  it("keeps every pre-existing Sales/native-template metadata hash and original provider object unchanged", () => {
    const old = new CapabilityRegistry(async () => true), expanded = new CapabilityRegistry(async () => true);
    const templates = templateProviderAdapter({ id: "sales", templateContextProvider: salesTemplateContext } as ModuleManifest);
    old.register("sales", { contributions: [...salesStudioContract.contributions, ...templates] });
    expanded.register("sales", { contributions: [...salesStudioContract.contributions, ...templates, ...salesAnalyticsStudioContract.contributions] });
    for (const item of [...salesStudioContract.contributions, ...templates])
      expect(expanded.describe(item.metadata.id, item.metadata.version)).toEqual(old.describe(item.metadata.id, item.metadata.version));
    expect(salesAnalytics.find(source => source.id === "sales.orders")?.breakdowns?.map(value => value.id)).toContain("customer");
    expect(reports.find(source => source.id === "sales.orders")?.read).toBeTypeOf("function");
  });
  it("runs original tenant-scoped complete count queries with current authentic Session and zero preserved", async () => {
    expect(await registry.invoke(authenticated, ref("sales.orders.metric.read"), { period: "30", dimension: "status" })).toEqual([{ label: "DRAFT", value: 0 }]);
    expect(m.refresh).toHaveBeenCalledWith("a", "reader", undefined);
    expect(m.orderGroups).toHaveBeenCalledWith(expect.objectContaining({ by: ["commercialStatus"], where: { organisationId: "a", orderDate: { gte: expect.any(Date) } } }));
    m.orderGroups.mockResolvedValue([{ orderType: "CALL_OFF", _count: { _all: 1 } }]);
    expect(await registry.invoke(authenticated, ref("sales.orders.metric.read"), { period: "all", dimension: "type" })).toEqual([{ label: "CALL OFF", value: 1 }]);
    expect(await registry.invoke(authenticated, ref("sales.quotes.metric.read"), { period: "all" })).toEqual([{ label: "ACCEPTED", value: 2 }]);
    expect(await registry.invoke(authenticated, ref("products.catalogue.metric.read"), { period: "all" })).toEqual([{ label: "PRODUCT", value: 3 }]);
  });
  it.each(["copied", "changed-identity", "revoked", "session-version", "auth-version", "missing-cap", "module"])("denies %s before native source reads", async mode => {
    if (mode === "copied") authenticated = { ...authenticated };
    if (mode === "changed-identity") authenticated.organisationId = "forged";
    if (mode === "revoked") m.refresh.mockResolvedValue(null);
    if (mode === "session-version" || mode === "auth-version") issued.set(current, { ...stamp, ...(mode === "session-version" ? { sessionVersion: 4 } : { authVersion: 3 }) });
    if (mode === "missing-cap") current.capabilities.clear();
    if (mode === "module") m.enabled.mockResolvedValue(new Set(["products"]));
    await expect(registry.invoke(authenticated, ref("sales.orders.metric.read"), { period: "all" })).rejects.toThrow();
    expect(m.orderGroups).not.toHaveBeenCalled(); expect(m.orders).not.toHaveBeenCalled();
  });
  it("retains exact tenant ownership on a distinct issued reader", async () => {
    authenticated = actor("b"); current = actor("b"); issued.set(authenticated, { ...stamp, organisationId: "b" }); issued.set(current, { ...stamp, organisationId: "b" }); m.refresh.mockResolvedValue(current);
    await registry.invoke(authenticated, ref("products.catalogue.metric.read"), { period: "all" });
    expect(m.productGroups).toHaveBeenCalledWith(expect.objectContaining({ where: { organisationId: "b", active: true } }));
  });
  it.each([{ period: "all", dimension: "customer" }, { period: "all", dimension: "time" }, { period: "7", dimension: "status" },
    { period: "all", organisationId: "foreign" }, { period: "all", sql: "select secret" }])("rejects unapproved native dimension/transport %j before provider reads", async input => {
    await expect(registry.invoke(authenticated, ref("sales.orders.metric.read"), input)).rejects.toThrow(); expect(m.orderGroups).not.toHaveBeenCalled();
  });
  it.each([[{ commercialStatus: "PRIVATE", _count: { _all: 1 } }], [{ commercialStatus: "DRAFT", _count: { _all: -1 } }],
    [{ commercialStatus: "DRAFT", _count: { _all: 1.5 } }], [{ commercialStatus: "DRAFT", _count: { _all: 1 } }, { commercialStatus: "DRAFT", _count: { _all: 2 } }]].map(rows => ({ rows })))("fails closed for invalid/duplicate/unsafe count results", async ({ rows }) => {
    m.orderGroups.mockResolvedValue(rows); await expect(registry.invoke(authenticated, ref("sales.orders.metric.read"), { period: "all" })).rejects.toThrow();
  });
  it("freezes owner policy and fails closed if native source metadata or function changes after registration", async () => {
    const contribution = salesAnalyticsStudioContract.contributions.find(item => item.metadata.id === "sales.orders.metric")!;
    const policy = registeredMetricSourceSchema.parse(contribution.metadata.details.analyticsSource);
    expect(Object.isFrozen(contribution.metadata.details.analyticsSource)).toBe(true);
    const source = salesAnalytics.find(metric => metric.id === policy.providerId)!;
    const original = source.query;
    try {
      source.query = async () => [{ label: "DRAFT", value: 99 }];
      await expect(registry.invoke(authenticated, ref("sales.orders.metric.read"), { period: "all" })).rejects.toThrow("DEPENDENCY_BROKEN");
      expect(m.orderGroups).not.toHaveBeenCalled();
    } finally { source.query = original; }
  });
  it("does not accept period filters for current snapshot metrics", async () => {
    await expect(registry.invoke(authenticated, ref("products.catalogue.metric.read"), { period: "30" })).rejects.toThrow(); expect(m.productGroups).not.toHaveBeenCalled();
  });
  it("returns original selected report projection only, exact large amounts and automatic currency companion", async () => {
    const output = await registry.invoke(authenticated, ref("sales.orders.report.read"), { columns: ["total", "requestedDeliveryDate"], page: 2 });
    expect(output).toEqual({ rows: [{ total: "1000000000000000.99", requestedDeliveryDate: null, currency: "GBP" }], total: 1,
      columns: ["total", "requestedDeliveryDate", "currency"], page: 2 });
    expect(m.orders).toHaveBeenCalledWith(expect.objectContaining({ where: { AND: [{ organisationId: "a" }, {}] }, take: 100, skip: 100 }));
    const selection = m.orders.mock.calls[0][0].select;
    expect(selection).not.toHaveProperty("financeDocuments"); expect(selection.party.select).toEqual({ name: true });
    expect(output).not.toHaveProperty("customer"); expect(output).not.toHaveProperty("bank");
  });
  it("preserves zero/false/null/dates through original report mapping", async () => {
    expect(await registry.invoke(authenticated, ref("sales.orders.report.read"), { columns: ["net", "orderDate"] })).toMatchObject({ rows: [{ net: 0, orderDate: "2026-10-01T00:00:00.000Z", currency: "GBP" }] });
    expect(await registry.invoke(authenticated, ref("products.catalogue.report.read"), { columns: ["active", "categoryCode"] })).toMatchObject({ rows: [{ active: false, categoryCode: null }] });
  });
  it("reuses native allowlisted typed calendar/filter rules before any report query", async () => {
    await registry.invoke(authenticated, ref("products.catalogue.report.read"), { filters: [{ field: "active", operator: "equals", value: "false" }] });
    expect(m.products).toHaveBeenCalledWith(expect.objectContaining({ where: { AND: [{ organisationId: "a" }, { AND: [{ active: { equals: false } }] }] } }));
    m.orders.mockClear();
    for (const input of [{ from: "2026-02-30" }, { filters: [{ field: "status", operator: "equals", value: "SECRET" }] },
      { filters: [{ field: "net", operator: "gte", value: "1" }] }, { columns: ["bank"] }, { columns: ["net", "net"] },
      { exporting: true }, { page: 0 }, { pageSize: 10000 }, { organisationId: "other" }, { from: "2026-10-10", to: "2026-10-01" }])
      await expect(registry.invoke(authenticated, ref("sales.orders.report.read"), input)).rejects.toThrow();
    expect(m.orders).not.toHaveBeenCalled();
  });
  it("denies owner/source permissions and provider overflow without slicing or falling back to exports", async () => {
    current.capabilities.delete("core.products.read"); await expect(registry.invoke(authenticated, ref("products.catalogue.report.read"), {})).rejects.toThrow("FORBIDDEN");
    expect(m.products).not.toHaveBeenCalled(); current.capabilities.add("core.products.read");
    m.products.mockResolvedValue(Array.from({ length: 101 }, () => ({ code: "P1", name: "Product", categoryCode: null, kind: "PRODUCT", unitOfMeasure: "EA", active: false, createdAt: new Date() })));
    m.productCount.mockResolvedValue(101); await expect(registry.invoke(authenticated, ref("products.catalogue.report.read"), {})).rejects.toThrow("DEPENDENCY_BROKEN");
    expect(m.products.mock.calls.at(-1)?.[0].take).toBe(100);
  });
  it("rejects unapproved unit/money/summary/source metadata instead of implicitly adapting all providers", () => {
    const source = salesAnalytics.find(metric => metric.id === "sales.orders")!;
    expect(() => registeredMetricContributions("sales", { ...source, unit: "money" }, metricPolicy())).toThrow("DEPENDENCY_BROKEN");
    expect(() => registeredMetricContributions("sales", source, { ...metricPolicy(), query: { id: "sales.orders.metric.read", version: 2 } })).toThrow("DEPENDENCY_BROKEN");
    const dataset = reports.find(report => report.id === "sales.orders")!;
    expect(() => registeredReportContributions("sales", { ...dataset, summary: true }, reportPolicy())).toThrow("DEPENDENCY_BROKEN");
    expect(() => registeredReportContributions("sales", dataset, { ...reportPolicy(), columns: reportPolicy().columns.filter(column => column.id !== "currency") })).toThrow("DEPENDENCY_BROKEN");
    expect(productsAnalytics).toHaveLength(1);
  });
});
