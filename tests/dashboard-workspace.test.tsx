// @vitest-environment jsdom
import React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
const mock = vi.hoisted(() => ({
  push: vi.fn(),
  save: vi.fn(),
  load: vi.fn().mockResolvedValue({}),
}));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mock.push, refresh: vi.fn() }),
}));
vi.mock("@/app/(app)/analytics/actions", () => ({
  saveAnalyticsDashboard: mock.save,
  deleteAnalyticsDashboard: vi.fn(),
  loadLiveMetrics: vi.fn().mockResolvedValue([]),
  loadMetricSlice: vi.fn(),
  loadDashboardData: mock.load,
}));
vi.mock("@/modules/kpis/components/use-live-goals", () => ({
  useLiveGoals: () => [],
}));
vi.mock("@/modules/kpis/components/goal-compare", () => ({
  GoalCompare: () => null,
}));
import { Studio } from "@/modules/analytics/components/studio";
const metric = {
  id: "sales",
  name: "Orders",
  subject: "Sales",
  definition: "Authorised orders",
  grain: "Order",
  href: "/sales",
  snapshot: true,
  points: [{ label: "Open", value: 4 }],
};
const board = {
  id: "owned",
  name: "My dashboard",
  updatedAt: "2026-10-09T12:00:00.000Z",
  updatedLabel: "9 Oct",
  refreshSeconds: 0,
  widgets: [
    { id: "one", metricId: "sales", visual: "bar" as const, wide: true },
  ],
};
afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});
describe("Dashboard canvas editing and persistence", () => {
  it("preserves changes when changing the local reporting period and supports undo/redo and duplication", () => {
    render(
      <Studio
        metrics={[metric]}
        dashboards={[board]}
        selectedId="owned"
        period="90"
        canManage
        company="Atlas"
        startEditing
      />,
    );
    fireEvent.change(screen.getByRole("textbox", { name: "Dashboard name" }), {
      target: { value: "Changed board" },
    });
    fireEvent.change(screen.getByRole("combobox", { name: "Measure period" }), {
      target: { value: "30" },
    });
    expect(
      (
        screen.getByRole("textbox", {
          name: "Dashboard name",
        }) as HTMLInputElement
      ).value,
    ).toBe("Changed board");
    expect(mock.push).not.toHaveBeenCalled();
    fireEvent.click(
      screen.getByRole("button", { name: "Undo dashboard change" }),
    );
    expect(
      (
        screen.getByRole("textbox", {
          name: "Dashboard name",
        }) as HTMLInputElement
      ).value,
    ).toBe("My dashboard");
    fireEvent.click(
      screen.getByRole("button", { name: "Redo dashboard change" }),
    );
    fireEvent.click(screen.getByRole("button", { name: "Configure widget 1" }));
    fireEvent.click(screen.getByRole("button", { name: "Duplicate" }));
    expect(document.querySelectorAll("[data-widget-id]").length).toBe(2);
  });
  it("saves a rename to the same owned board with its expected revision and preserves failed edits", async () => {
    mock.save.mockRejectedValue(new Error("Changed elsewhere"));
    render(
      <Studio
        metrics={[metric]}
        dashboards={[board]}
        selectedId="owned"
        period="90"
        canManage
        company="Atlas"
        startEditing
      />,
    );
    fireEvent.change(screen.getByRole("textbox", { name: "Dashboard name" }), {
      target: { value: "Renamed" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Save" }));
    await waitFor(() => expect(mock.save).toHaveBeenCalled());
    expect(mock.save.mock.calls[0][0]).toMatchObject({
      id: "owned",
      expectedUpdatedAt: board.updatedAt,
      name: "Renamed",
    });
    expect(await screen.findByRole("status")).toHaveProperty(
      "textContent",
      "Changed elsewhere",
    );
    expect(
      (
        screen.getByRole("textbox", {
          name: "Dashboard name",
        }) as HTMLInputElement
      ).value,
    ).toBe("Renamed");
  });
  it("can build a widget from accessible record fields without mutating source records", async () => {
    const dataset = {
      id: "customers.records",
      name: "Directory",
      source: "Customers",
      description: "Directory",
      columns: [
        { key: "status", label: "Status", path: "status", values: ["ACTIVE"] },
      ],
    };
    render(
      <Studio
        metrics={[metric]}
        datasets={[dataset]}
        dashboards={[]}
        period="90"
        canManage
        company="Atlas"
        createNew
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Build from records" }));
    fireEvent.click(screen.getByRole("button", { name: /Directory/ }));
    expect(screen.getByRole("combobox", { name: "Group by" })).toHaveProperty(
      "value",
      "status",
    );
    fireEvent.change(screen.getByRole("combobox", { name: "Widget width" }), {
      target: { value: "12" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Table visual" }));
    await waitFor(() =>
      expect(mock.load).toHaveBeenCalledWith(
        expect.objectContaining({
          widgets: expect.arrayContaining([
            expect.objectContaining({
              data: expect.objectContaining({ dataset: "customers.records" }),
            }),
          ]),
        }),
      ),
    );
  });
  it("read-only profiles have no board or widget write controls", () => {
    render(
      <Studio
        metrics={[metric]}
        dashboards={[board]}
        selectedId="owned"
        period="90"
        canManage={false}
        company="Atlas"
      />,
    );
    expect(screen.queryByRole("button", { name: "Save" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Edit dashboard" })).toBeNull();
    expect(
      screen.queryByRole("button", { name: "Configure widget 1" }),
    ).toBeNull();
  });
});
