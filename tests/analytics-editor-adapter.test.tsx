// @vitest-environment jsdom
import React from "react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
const m = vi.hoisted(() => ({ push: vi.fn(), refresh: vi.fn(), nativeSave: vi.fn(), nativeDelete: vi.fn(), nativeData: vi.fn(),
  nativeMetrics: vi.fn(), nativeSlice: vi.fn(), goalsHook: vi.fn(), save: vi.fn(), remove: vi.fn(), data: vi.fn(), metrics: vi.fn(), slice: vi.fn(), goals: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: m.push, refresh: m.refresh }) }));
vi.mock("@/app/(app)/analytics/actions", () => ({ saveAnalyticsDashboard: m.nativeSave, deleteAnalyticsDashboard: m.nativeDelete,
  loadDashboardData: m.nativeData, loadLiveMetrics: m.nativeMetrics, loadMetricSlice: m.nativeSlice }));
vi.mock("@/modules/kpis/components/use-live-goals", () => ({ useLiveGoals: m.goalsHook }));
vi.mock("@/modules/kpis/components/goal-compare", () => ({ GoalCompare: () => null }));
import { Studio, type AnalyticsStudioActions } from "@/modules/analytics/components/studio";
const metric = { id: "orders", name: "Orders", subject: "Sales", definition: "Current authorised orders", grain: "Order", href: "/sales", snapshot: true,
  breakdowns: [{ id: "status", label: "Status" }, { id: "customer", label: "Customer" }], points: [{ label: "Open", value: 0 }] };
const board = { id: "owned", name: "Operations", updatedAt: "2026-10-09T12:00:00.000Z", updatedLabel: "9 Oct", refreshSeconds: 0,
  widgets: [{ id: "one", metricId: "orders", visual: "bar" as const, wide: true, breakdown: "customer" }] };
const actions: AnalyticsStudioActions = { saveAction: m.save, deleteAction: m.remove, loadMetricsAction: m.metrics,
  loadDataAction: m.data, loadSliceAction: m.slice, loadGoalsAction: m.goals };
const props = { metrics: [metric], dashboards: [board], period: "90", company: "Selected business", canManage: true };
beforeEach(() => {
  vi.resetAllMocks(); m.goalsHook.mockReturnValue([]); m.save.mockResolvedValue("selected-saved"); m.data.mockResolvedValue({});
  m.slice.mockResolvedValue({ points: [] }); m.metrics.mockResolvedValue([metric]); m.goals.mockResolvedValue([]);
  m.nativeSave.mockResolvedValue("native-saved"); m.nativeData.mockResolvedValue({}); m.nativeSlice.mockResolvedValue({ points: [] });
  m.nativeMetrics.mockResolvedValue([metric]);
  Object.defineProperty(document, "hidden", { configurable: true, value: false });
});
afterEach(() => { cleanup(); vi.restoreAllMocks(); });
it("uses supplied selected-business save and fixed workspace URL, retaining failed edits without a native-action fallback", async () => {
  m.save.mockRejectedValueOnce(new Error("Current target changed"));
  render(<Studio {...props} selectedId="owned" startEditing serverActions={actions} workspaceHref="/design-studio/boards" monitorHref="/design-studio/boards/monitor"/>);
  fireEvent.change(screen.getByRole("textbox", { name: "Dashboard name" }), { target: { value: "Changed" } });
  fireEvent.click(screen.getByRole("button", { name: "Save" }));
  await screen.findByText("Current target changed");
  expect(screen.getByRole("textbox", { name: "Dashboard name" })).toHaveProperty("value", "Changed"); expect(m.push).not.toHaveBeenCalled();
  fireEvent.click(await screen.findByRole("button", { name: "Save" }));
  await waitFor(() => expect(m.push).toHaveBeenCalledWith("/design-studio/boards?dashboard=selected-saved&period=90"));
  expect(m.save.mock.calls[0][0]).toMatchObject({ id: "owned", expectedUpdatedAt: board.updatedAt, name: "Changed" });
  expect(m.nativeSave).not.toHaveBeenCalled(); expect(m.goalsHook.mock.calls[0][3]).toBe(actions.loadGoalsAction);
});
it("routes native data/breakdown/metric refresh and Goal callbacks entirely through the supplied complete adapter", async () => {
  render(<Studio {...props} selectedId="owned" startEditing serverActions={actions}/>);
  await waitFor(() => expect(m.data).toHaveBeenCalled()); await waitFor(() => expect(m.slice).toHaveBeenCalledWith({ metricId: "orders", breakdown: "customer", period: "90" }));
  fireEvent.change(screen.getByRole("combobox", { name: "Measure period" }), { target: { value: "30" } });
  await waitFor(() => expect(m.metrics).toHaveBeenCalledWith("30"));
  expect(m.nativeData).not.toHaveBeenCalled(); expect(m.nativeSlice).not.toHaveBeenCalled(); expect(m.nativeMetrics).not.toHaveBeenCalled();
});
it("selected gallery delete and monitor use the adapter/internal routes while preserving original controls", async () => {
  vi.spyOn(window, "confirm").mockReturnValue(true); const open = vi.spyOn(window, "open").mockReturnValue({} as Window);
  const view = render(<Studio {...props} serverActions={actions} workspaceHref="/design-studio/boards" monitorHref="/design-studio/boards/monitor"/>);
  fireEvent.click(screen.getByRole("button", { name: "Delete Operations" }));
  await waitFor(() => expect(m.remove).toHaveBeenCalledWith("owned")); expect(m.nativeDelete).not.toHaveBeenCalled();
  view.unmount(); render(<Studio {...props} selectedId="owned" serverActions={actions} workspaceHref="/design-studio/boards" monitorHref="/design-studio/boards/monitor"/>);
  fireEvent.click(screen.getByRole("button", { name: "Monitor" }));
  expect(open).toHaveBeenCalledWith("/design-studio/boards/monitor?dashboard=owned&period=90", "atlas-board-owned", "popup,width=1680,height=980");
});
it("omitting adapters preserves native save/routes/loaders exactly", async () => {
  render(<Studio {...props} selectedId="owned" startEditing/>); fireEvent.click(screen.getByRole("button", { name: "Save" }));
  await waitFor(() => expect(m.push).toHaveBeenCalledWith("/analytics?dashboard=native-saved&period=90"));
  expect(m.save).not.toHaveBeenCalled(); expect(m.goalsHook.mock.calls[0][3]).toBeUndefined();
});
it("refuses incomplete selected adapters and external/query-bearing workspace overrides instead of native fallbacks", () => {
  expect(() => render(<Studio {...props} serverActions={{ ...actions, loadGoalsAction: undefined } as unknown as AnalyticsStudioActions}/>)).toThrow("incomplete");
  for (const href of ["https://other.invalid", "//other.invalid", "/analytics?tenant=other", "/analytics#other"])
    expect(() => render(<Studio {...props} workspaceHref={href}/>)).toThrow("internal dashboard");
  expect(m.nativeData).not.toHaveBeenCalled(); expect(m.nativeSave).not.toHaveBeenCalled();
});
