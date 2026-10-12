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
it("saves a business draft with its exact revision, retaining failed edits and avoiding personal persistence", async () => {
  const saveDraft = vi.fn().mockRejectedValueOnce(new Error("The saved draft changed"))
    .mockResolvedValueOnce({ definitionId: "owned", revision: 4 });
  const dirty = vi.fn();
  render(<Studio {...props} selectedId="owned" startEditing serverActions={actions}
    workspaceHref="/design-studio/dashboards" businessDraft={{ definitionId: "owned", revision: 3,
      maxWidgets: 8, business: "selected business", saveDraft, onDirtyChange: dirty }}/>);
  expect(screen.queryByRole("button", { name: "Monitor" })).toBeNull();
  expect(screen.queryByRole("button", { name: "Save a copy" })).toBeNull();
  expect(screen.queryByRole("link", { name: "Open source for widget 1" })).toBeNull();
  fireEvent.change(screen.getByRole("textbox", { name: "Dashboard name" }), { target: { value: "Business overview" } });
  await waitFor(() => expect(dirty).toHaveBeenLastCalledWith(true));
  fireEvent.click(screen.getByRole("button", { name: "Save draft" }));
  await screen.findByText("The saved draft changed");
  expect(screen.getByRole("textbox", { name: "Dashboard name" })).toHaveProperty("value", "Business overview");
  expect(m.refresh).not.toHaveBeenCalled();
  fireEvent.click(await screen.findByRole("button", { name: "Save draft" }));
  await screen.findByText("Draft saved. Review it before making it live for your business.");
  expect(saveDraft).toHaveBeenLastCalledWith(expect.objectContaining({ revision: 3, name: "Business overview", widgets: board.widgets }));
  expect(m.refresh).toHaveBeenCalledOnce(); expect(m.save).not.toHaveBeenCalled(); expect(m.nativeSave).not.toHaveBeenCalled();
  await waitFor(() => expect(dirty).toHaveBeenLastCalledWith(false));
  fireEvent.click(screen.getByRole("button", { name: /Business dashboards/ }));
  expect(m.push).toHaveBeenCalledWith("/design-studio/dashboards?business=selected%20business");
});
it("does not accept a mismatched business save receipt or silently fall back to a personal dashboard", async () => {
  const saveDraft = vi.fn().mockResolvedValue({ definitionId: "another", revision: 4 });
  render(<Studio {...props} selectedId="owned" startEditing serverActions={actions}
    businessDraft={{ definitionId: "owned", revision: 3, maxWidgets: 8, saveDraft }}/>);
  fireEvent.change(screen.getByRole("textbox", { name: "Dashboard name" }), { target: { value: "Keep these changes" } });
  fireEvent.click(screen.getByRole("button", { name: "Save draft" }));
  await screen.findByText("This saved draft changed. Your entries are still here; reopen it to compare.");
  expect(screen.getByRole("textbox", { name: "Dashboard name" })).toHaveProperty("value", "Keep these changes");
  expect(m.refresh).not.toHaveBeenCalled(); expect(m.save).not.toHaveBeenCalled(); expect(m.nativeSave).not.toHaveBeenCalled();
});
it("requires the complete saved business adapter and respects the approved widget bound", () => {
  const businessDraft = { definitionId: "owned", revision: 3, maxWidgets: 1, saveDraft: vi.fn() };
  expect(() => render(<Studio {...props} selectedId="owned" businessDraft={businessDraft}/>)).toThrow("complete saved-draft adapter");
  render(<Studio {...props} selectedId="owned" startEditing serverActions={actions} businessDraft={businessDraft}/>);
  expect(screen.getByRole("button", { name: "Add widget" }).hasAttribute("disabled")).toBe(true);
  expect(screen.getByText("1/1 widgets")).toBeTruthy();
});

it.each(["same", "newer"])("business comparison against %s head deliberately preserves local input and later saves exact adopted revision", async headMode => {
  const actualRevision = headMode === "same" ? 3 : 4, actualDefinitionRevision = headMode === "same" ? 5 : 7;
  const inspect = vi.fn().mockImplementation(async input => ({ definitionId: "owned", revision: input.revision, definitionRevision: input.definitionRevision, content: input.content, warnings: [], measures: [] }));
  const compare = vi.fn().mockImplementation(async input => ({ definitionId: "owned", revision: actualRevision, definitionRevision: actualDefinitionRevision, activeVersionId: null,
    local: input.content, saved: { ...input.content, name: "Saved overview" }, warnings: [], changes: ["The dashboard name differs."], measures: [] }));
  const saveDraft = vi.fn().mockResolvedValue({ definitionId: "owned", revision: actualRevision + 1 }), head = vi.fn();
  render(<Studio {...props} selectedId="owned" startEditing serverActions={actions}
    businessDraft={{ definitionId: "owned", revision: 3, definitionRevision: 5, maxWidgets: 8, saveDraft,
      inspect, compareSavedDraft: compare, onSavedHeadChange: head,
      measureReferences: [{ id: "orders", name: "Orders", sourceHref: "/design-studio/capabilities/orders", whereUsedHref: "/design-studio/capabilities/orders?view=usage" }] }}/>);
  fireEvent.change(screen.getByRole("textbox", { name: "Dashboard name" }), { target: { value: "My local dashboard" } });
  fireEvent.click(screen.getByRole("button", { name: "Compare saved draft" })); await screen.findByRole("dialog");
  fireEvent.click(screen.getByRole("button", { name: "Keep my changes against this saved draft" }));
  expect(screen.getByRole("textbox", { name: "Dashboard name" })).toHaveProperty("value", "My local dashboard");
  expect(head).toHaveBeenCalledWith({ revision: actualRevision, definitionRevision: actualDefinitionRevision, activeVersionId: null });
  expect(saveDraft).not.toHaveBeenCalled(); expect(m.refresh).not.toHaveBeenCalled();
  await waitFor(() => expect(screen.getByRole("button", { name: "Save draft" }).hasAttribute("disabled")).toBe(false));
  fireEvent.click(screen.getByRole("button", { name: "Save draft" }));
  await waitFor(() => expect(saveDraft).toHaveBeenCalledWith(expect.objectContaining({ revision: actualRevision, name: "My local dashboard" })));
  expect(m.nativeSave).not.toHaveBeenCalled(); expect(m.save).not.toHaveBeenCalled();
});
