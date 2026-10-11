import { beforeEach, expect, it, vi } from "vitest";
import type { Session } from "@/core/auth/session";
import type { Prisma } from "@/generated/prisma/client";
const m = vi.hoisted(() => ({ globalModules: vi.fn(), currentModules: vi.fn(), query: vi.fn() }));
vi.mock("@/core/db/client", () => ({ db: { moduleState: { findMany: m.globalModules } } }));
vi.mock("@/core/modules/registry", () => ({ getImplementedModules: () => [
  { id: "analytics" }, { id: "sales", analyticsProvider: [{ id: "sales.orders", capability: "sales.order.read", query: m.query }],
    reportProvider: [{ id: "sales.orders", anyOf: ["sales.order.read"], read: m.query }] },
  { id: "finance", analyticsProvider: [{ id: "finance.private", capability: "finance.document.read", query: m.query }],
    reportProvider: [{ id: "finance.private", anyOf: ["finance.document.read"], read: m.query }] },
], getModule: vi.fn(), MODULE_CATALOGUE: [] }));
vi.mock("@/core/permissions/role-sync", () => ({ syncAdminCapabilities: vi.fn() }));
import { enabledModulesForSession, getEnabledModuleIds } from "@/core/modules/runtime";
import { getAnalyticsMetrics } from "@/core/analytics/catalogue";
import { reportDatasets } from "@/core/reports/catalogue";
const session = { userId: "actor", organisationId: "company", capabilities: new Set(["sales.order.read", "finance.document.read"]) } as Session;
const tx = { moduleState: { findMany: m.currentModules } } as unknown as Prisma.TransactionClient;
beforeEach(() => {
  vi.clearAllMocks(); m.currentModules.mockResolvedValue([{ moduleId: "sales", enabled: true, entitled: true }, { moduleId: "finance", enabled: false, entitled: true }]);
  m.globalModules.mockResolvedValue([{ moduleId: "sales", enabled: false, entitled: true }, { moduleId: "finance", enabled: true, entitled: true }]);
});
it("same owning transaction controls metric/report licence metadata without global fallback or business queries", async () => {
  expect([...await getEnabledModuleIds("company", tx)]).toEqual(["sales"]);
  expect([...await enabledModulesForSession(session, tx)]).toEqual(["sales"]);
  expect((await getAnalyticsMetrics(session, tx)).map(value => value.id)).toEqual(["sales.orders"]);
  expect((await reportDatasets(session, tx)).map(value => value.id)).toEqual(["sales.orders"]);
  expect(m.currentModules).toHaveBeenCalledWith({ where: { organisationId: "company" } });
  expect(m.globalModules).not.toHaveBeenCalled(); expect(m.query).not.toHaveBeenCalled();
});
it("existing callers retain their original default module reader and current source permission filtering", async () => {
  expect((await getAnalyticsMetrics(session)).map(value => value.id)).toEqual(["finance.private"]);
  expect((await reportDatasets(session)).map(value => value.id)).toEqual(["finance.private"]);
  expect(await getAnalyticsMetrics({ ...session, capabilities: new Set(["analytics.dashboard.read"]) }, tx)).toEqual([]);
  expect(m.globalModules).toHaveBeenCalled(); expect(m.query).not.toHaveBeenCalled();
});
