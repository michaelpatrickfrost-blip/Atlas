import { beforeEach, describe, expect, it, vi } from "vitest";
const m = vi.hoisted(() => ({
  session: vi.fn(),
  cap: vi.fn(),
  enabled: vi.fn(),
  metrics: vi.fn(),
  sources: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  remove: vi.fn(),
}));
vi.mock("@/core/auth/session", () => ({ requireSession: m.session }));
vi.mock("@/core/permissions/check", () => ({ assertCapability: m.cap }));
vi.mock("@/core/modules/access", () => ({ assertModuleEnabled: m.enabled }));
vi.mock("@/core/analytics/catalogue", () => ({
  getAnalyticsMetrics: m.metrics,
}));
vi.mock("@/core/reports/catalogue", () => ({ reportDatasets: m.sources }));
vi.mock("@/core/db/client", () => ({
  db: {
    dashboard: { create: m.create, updateMany: m.update, deleteMany: m.remove },
  },
}));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/modules/kpis/services/workspace", () => ({
  loadGoalMarkers: vi.fn(),
}));
import {
  saveAnalyticsDashboard,
  deleteAnalyticsDashboard,
} from "@/app/(app)/analytics/actions";
const s = { organisationId: "company", userId: "owner" },
  input = {
    name: "Renamed",
    id: "board",
    expectedUpdatedAt: "2026-10-09T12:00:00.000Z",
    widgets: [{ id: "w", metricId: "orders", visual: "bar", wide: true }],
  };
beforeEach(() => {
  vi.clearAllMocks();
  m.session.mockResolvedValue(s);
  m.cap.mockReturnValue(undefined);
  m.enabled.mockResolvedValue(undefined);
  m.metrics.mockResolvedValue([
    { id: "orders", breakdowns: [{ id: "status" }] },
  ]);
  m.sources.mockResolvedValue([]);
  m.update.mockResolvedValue({ count: 1 });
  m.create.mockResolvedValue({ id: "new" });
});
describe("Personal dashboard mutation boundaries", () => {
  it("updates the selected owner/tenant board atomically and requires its revision", async () => {
    expect(await saveAnalyticsDashboard(input)).toBe("board");
    expect(m.update.mock.calls[0][0]).toMatchObject({
      where: {
        id: "board",
        organisationId: "company",
        userId: "owner",
        updatedAt: new Date(input.expectedUpdatedAt),
      },
      data: { name: "Analytics · Renamed" },
    });
    expect(m.create).not.toHaveBeenCalled();
    await expect(
      saveAnalyticsDashboard({ ...input, expectedUpdatedAt: undefined }),
    ).rejects.toThrow("Reload");
  });
  it("does not fall back to another board when a foreign, revoked or stale row matches none", async () => {
    m.update.mockResolvedValue({ count: 0 });
    await expect(saveAnalyticsDashboard(input)).rejects.toThrow(
      "changed elsewhere",
    );
    expect(m.create).not.toHaveBeenCalled();
  });
  it("creates copies without upserting over a same-name board and preserves unique-name errors", async () => {
    expect(await saveAnalyticsDashboard({ ...input, id: undefined })).toBe(
      "new",
    );
    m.create.mockRejectedValue(new Error("Unique constraint"));
    await expect(
      saveAnalyticsDashboard({ ...input, id: undefined }),
    ).rejects.toThrow("Unique constraint");
    expect(m.update).not.toHaveBeenCalled();
  });
  it("rejects revoked measures, forged breakdowns, invalid dates and unlicensed raw data before writes", async () => {
    for (const changed of [
      { ...input, widgets: [{ ...input.widgets[0], metricId: "private" }] },
      { ...input, widgets: [{ ...input.widgets[0], breakdown: "secret" }] },
      { ...input, filters: { from: "2026-02-31", to: "", search: "" } },
      {
        ...input,
        widgets: [{ ...input.widgets[0], data: { dataset: "private" } }],
      },
    ])
      await expect(saveAnalyticsDashboard(changed)).rejects.toThrow();
    expect(m.create).not.toHaveBeenCalled();
    expect(m.update).not.toHaveBeenCalled();
  });
  it("requires manage before writes and scopes deletion to personal Analytics boards", async () => {
    m.cap.mockImplementation(() => {
      throw new Error("Denied");
    });
    await expect(saveAnalyticsDashboard(input)).rejects.toThrow("Denied");
    expect(m.update).not.toHaveBeenCalled();
    m.cap.mockReturnValue(undefined);
    await deleteAnalyticsDashboard("board");
    expect(m.remove).toHaveBeenCalledWith({
      where: {
        id: "board",
        organisationId: "company",
        userId: "owner",
        name: { startsWith: "Analytics · " },
      },
    });
  });
});
