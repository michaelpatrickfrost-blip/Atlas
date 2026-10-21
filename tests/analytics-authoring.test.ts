import { beforeEach, expect, it, vi } from "vitest";
import type { Session } from "@/core/auth/session";
import { Prisma } from "@/generated/prisma/client";
const m = vi.hoisted(() => ({ stamps: new WeakMap<object, object>(), refresh: vi.fn(), transaction: vi.fn(), module: vi.fn(),
  metrics: vi.fn(), datasets: vi.fn(), query: vi.fn(), create: vi.fn(), update: vi.fn(), audit: vi.fn() }));
vi.mock("@/core/auth/session", () => ({ sessionAuthorityStamp: (session: object) => m.stamps.get(session) }));
vi.mock("@/core/studio/fields/runtime-authority", () => ({ nativeFieldMutationSessionInTransaction: m.refresh }));
vi.mock("@/core/db/client", () => ({ db: { $transaction: m.transaction } }));
vi.mock("@/core/analytics/catalogue", () => ({ getAnalyticsMetrics: m.metrics }));
vi.mock("@/core/reports/catalogue", () => ({ reportDatasets: m.datasets }));
vi.mock("@/core/audit/log", () => ({ writeAudit: m.audit }));
import { saveAnalyticsDashboardForSession, saveAnalyticsDashboardInTransaction } from "@/modules/analytics/services/authoring";

// Real dashboard/data-view validators and native capability assertion. Fresh
// identity/Serializable SQL, catalogues/storage/Audit are explicit collaborators;
// no central transaction rollback or genuine membership proof inferred here.
const session: Session = { userId: "actor", organisationId: "company", membershipId: "member", userName: "Actor",
  userEmail: "actor@example.test", organisationName: "Company", capabilities: new Set(["analytics.dashboard.manage", "sales.order.read"]) };
const tx = { dashboard: { create: m.create, updateMany: m.update }, moduleState: { findFirst: m.module } } as unknown as Prisma.TransactionClient;
const widget = { id: "one", metricId: "orders", visual: "bar", wide: false, minimum: 0, borderless: false };
const input = { name: "Operations", widgets: [widget] };
const updated = { ...input, id: "board", expectedUpdatedAt: "2026-10-09T12:00:00.000Z" };
beforeEach(() => {
  vi.resetAllMocks(); m.stamps.set(session, {}); m.refresh.mockResolvedValue({ session });
  m.transaction.mockImplementation(async callback => callback(tx)); m.module.mockResolvedValue({ id: "analytics" });
  m.metrics.mockResolvedValue([{ id: "orders", breakdowns: [{ id: "status" }], query: m.query }]);
  m.datasets.mockResolvedValue([]); m.create.mockResolvedValue({ id: "server-board" }); m.update.mockResolvedValue({ count: 1 });
});
it("reuses one Serializable owning transaction, fresh actor and existing personal representation with paired Audit", async () => {
  expect(await saveAnalyticsDashboardForSession(session, input)).toBe("server-board");
  expect(m.transaction).toHaveBeenCalledWith(expect.any(Function), { isolationLevel: "Serializable" });
  expect(m.refresh).toHaveBeenCalledWith(session, tx); expect(m.metrics).toHaveBeenCalledWith(session, tx); expect(m.datasets).toHaveBeenCalledWith(session, tx);
  expect(m.refresh.mock.invocationCallOrder[0]).toBeLessThan(m.module.mock.invocationCallOrder[0]);
  const row = m.create.mock.calls[0][0].data;
  expect(row).toMatchObject({ organisationId: "company", userId: "actor", name: "Analytics · Operations" });
  expect(JSON.parse(row.widgets[0])).toMatchObject({ kind: "atlas-board", period: "90", refreshSeconds: 30 });
  expect(JSON.parse(row.widgets[1])).toMatchObject(widget);
  expect(m.audit).toHaveBeenCalledWith({ organisationId: "company", actorUserId: "actor", action: "analytics.dashboard.saved",
    entityType: "Dashboard", entityId: "server-board", after: { name: "Operations", widgetCount: 1 } }, tx);
  expect(m.create.mock.invocationCallOrder[0]).toBeLessThan(m.audit.mock.invocationCallOrder[0]); expect(m.query).not.toHaveBeenCalled();
});
it("existing selected-business transaction needs no nested engine and CAS remains exact tenant/user/timestamp/name prefix", async () => {
  expect(await saveAnalyticsDashboardInTransaction(session, tx, updated)).toBe("board");
  expect(m.transaction).not.toHaveBeenCalled(); expect(m.update).toHaveBeenCalledWith(expect.objectContaining({ where: {
    id: "board", organisationId: "company", userId: "actor", name: { startsWith: "Analytics · " }, updatedAt: new Date(updated.expectedUpdatedAt) } }));
  expect(m.create).not.toHaveBeenCalled(); expect(m.audit).toHaveBeenCalledWith(expect.objectContaining({ entityId: "board" }), tx);
});
it.each(["copied", "stale", "manage", "module"])("denies %s access before source metadata or writes", async kind => {
  if (kind === "copied") await expect(saveAnalyticsDashboardForSession({ ...session }, input)).rejects.toThrow("FORBIDDEN");
  else {
    if (kind === "stale") m.refresh.mockRejectedValueOnce(new Error("FORBIDDEN: stale session"));
    if (kind === "manage") m.refresh.mockResolvedValueOnce({ session: { ...session, capabilities: new Set(["sales.order.read"]) } });
    if (kind === "module") m.module.mockResolvedValueOnce(null);
    await expect(saveAnalyticsDashboardForSession(session, input)).rejects.toThrow(kind === "module" ? "disabled" : "FORBIDDEN");
  }
  expect(m.metrics).not.toHaveBeenCalled(); expect(m.datasets).not.toHaveBeenCalled(); expect(m.create).not.toHaveBeenCalled(); expect(m.audit).not.toHaveBeenCalled();
});
it("preserves genuine native Atlas staff module exception without assigning staff or borrowing source capabilities", async () => {
  m.refresh.mockResolvedValue({ session: { ...session, capabilities: new Set([...session.capabilities, "atlas.staff.manage"]) } });
  m.module.mockResolvedValue(null);
  expect(await saveAnalyticsDashboardForSession(session, input)).toBe("server-board"); expect(m.module).not.toHaveBeenCalled();
  m.metrics.mockResolvedValueOnce([]);
  await expect(saveAnalyticsDashboardForSession(session, input)).rejects.toThrow("measure");
});
it.each(["stale", "foreign", "nonAnalytics"])("zero-row %s CAS never creates another board or Audit", async () => {
  m.update.mockResolvedValueOnce({ count: 0 });
  await expect(saveAnalyticsDashboardInTransaction(session, tx, updated)).rejects.toThrow("changed elsewhere");
  expect(m.create).not.toHaveBeenCalled(); expect(m.audit).not.toHaveBeenCalled();
});
it("requires explicit revision and retains unique-name or Audit failure without automatic write retry", async () => {
  await expect(saveAnalyticsDashboardInTransaction(session, tx, { ...updated, expectedUpdatedAt: undefined })).rejects.toThrow("Reload");
  expect(m.update).not.toHaveBeenCalled();
  m.create.mockRejectedValueOnce(new Error("Unique constraint"));
  await expect(saveAnalyticsDashboardForSession(session, input)).rejects.toThrow("Unique constraint");
  m.audit.mockRejectedValueOnce(new Error("Audit unavailable"));
  await expect(saveAnalyticsDashboardForSession(session, input)).rejects.toThrow("Audit unavailable");
  expect(m.transaction).toHaveBeenCalledTimes(2); expect(m.audit).toHaveBeenCalledTimes(1);
});
it("maps actual serialization error to a fresh conflict without replaying writes", async () => {
  m.transaction.mockRejectedValueOnce(new Prisma.PrismaClientKnownRequestError("Retry", { code: "P2034", clientVersion: "7" }));
  await expect(saveAnalyticsDashboardForSession(session, input)).rejects.toThrow("CONFLICT");
  expect(m.transaction).toHaveBeenCalledOnce(); expect(m.refresh).not.toHaveBeenCalled();
});
it("validates source-owned data view fields/currency/operators and refuses private source IDs before writes without reading business records", async () => {
  const dataset = { id: "orders", summary: false, name: "Orders", source: "Sales", anyOf: ["sales.order.read"],
    columns: [{ key: "amount", type: "money", path: "amount", currencyKey: "currency" }, { key: "currency", type: "text", path: "currency" }], read: m.query };
  m.datasets.mockResolvedValue([dataset]);
  const dataWidget = { ...widget, metricId: "", data: { dataset: "orders", aggregation: "sum", measure: "amount", currency: "GBP" } };
  // Existing metric ID contract remains mandatory even for record-backed widgets.
  await expect(saveAnalyticsDashboardInTransaction(session, tx, { ...input, widgets: [dataWidget] })).rejects.toThrow();
  dataWidget.metricId = "orders";
  expect(await saveAnalyticsDashboardInTransaction(session, tx, { ...input, widgets: [dataWidget] })).toBe("server-board");
  m.create.mockClear(); m.audit.mockClear();
  for (const data of [{ ...dataWidget.data, dataset: "private" }, { ...dataWidget.data, currency: "" },
    { ...dataWidget.data, group: "secret" }, { ...dataWidget.data, filters: [{ field: "secret", operator: "equals", value: "x" }] }])
    await expect(saveAnalyticsDashboardInTransaction(session, tx, { ...input, widgets: [{ ...widget, data }] })).rejects.toThrow();
  expect(m.query).not.toHaveBeenCalled(); expect(m.create).not.toHaveBeenCalled(); expect(m.audit).not.toHaveBeenCalled();
});
