// @vitest-environment jsdom
import React from "react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { BusinessViewDraft, PublishedBusinessView } from "@/modules/analytics/services/business-view-contract";
const m = vi.hoisted(() => ({ refresh: vi.fn(), review: vi.fn(), publish: vi.fn(), restore: vi.fn(), save: vi.fn(),
  metrics: vi.fn(), slice: vi.fn(), current: vi.fn(), studio: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: m.refresh }) }));
vi.mock("@/app/(studio)/design-studio/dashboards/actions", () => ({ saveBusinessDashboard: m.save,
  reviewBusinessDashboard: m.review, publishBusinessDashboard: m.publish, restoreBusinessDashboard: m.restore,
  loadBusinessDashboardMetrics: m.metrics, loadBusinessDashboardSlice: m.slice }));
vi.mock("@/app/(app)/business-dashboards/actions", () => ({ refreshPublishedBusinessDashboard: m.current }));
vi.mock("@/modules/analytics/components/studio", () => ({ Studio: (props: { businessDraft: { onDirtyChange(value: boolean): void } }) => {
  m.studio(props); return <button onClick={() => props.businessDraft.onDirtyChange(true)}>Change design</button>;
} }));
vi.mock("@/modules/analytics/components/business-view-charts", () => ({ BusinessViewCharts: ({ view }: { view: PublishedBusinessView }) => <p>Charts for {view.name}</p> }));
import { BusinessDashboardEditor } from "@/app/(studio)/design-studio/dashboards/[definitionId]/editor";
import { PublishedBusinessDashboard } from "@/app/(app)/business-dashboards/[definitionId]/dashboard";
const id = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa", version = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb", hash = "a".repeat(64);
const content: BusinessViewDraft["content"] = { name: "Overview", period: "90", refreshSeconds: 0, filters: { from: "", to: "", search: "" },
  widgets: [{ id: "orders", metricId: "sales.orders", visual: "bar" as const, wide: true }] };
const draft: BusinessViewDraft = { definitionId: id, name: "Overview", updatedAt: "2026-10-12T00:00:00.000Z", revision: 3,
  definitionRevision: 2, activeVersionId: version, content, warnings: [], versions: [{ id: version, version: 1, publishedAt: "2026-10-12T00:00:00.000Z" }] };
const live: PublishedBusinessView = { definitionId: id, name: "Overview", definitionRevision: 2, content,
  view: { versionId: version, version: 1, checksum: hash }, dataByWidget: {} };
beforeEach(() => { vi.resetAllMocks(); m.review.mockResolvedValue({ warnings: [] }); m.current.mockResolvedValue(live); });
afterEach(cleanup);
it("binds all native loaders and draft saving to the selected business and refuses record-data fallback", async () => {
  render(<BusinessDashboardEditor draft={draft} metrics={[]} company="Selected business" business="selected" canEdit canPublish/>);
  const props = m.studio.mock.calls.at(-1)![0];
  await props.serverActions.loadMetricsAction("all"); await props.serverActions.loadSliceAction({ metricId: "sales.orders", period: "90" });
  expect(m.metrics).toHaveBeenCalledWith("selected", "all"); expect(m.slice).toHaveBeenCalledWith("selected", expect.any(Object));
  await expect(props.serverActions.loadDataAction({ widgets: [], filters: { from: "", to: "", search: "" } })).resolves.toEqual({});
  await expect(props.serverActions.loadDataAction({ widgets: [{ data: { dataset: "finance" } }], filters: { from: "", to: "", search: "" } })).rejects.toThrow("registered");
  await props.businessDraft.saveDraft({ name: "Changed", revision: 3, definitionId: "other" });
  expect(m.save).toHaveBeenCalledWith("selected", expect.objectContaining({ definitionId: id, revision: 3 }));
  expect(screen.queryByRole("link", { name: "Open live dashboard" })).toBeNull();
});
it("blocks publication until the saved exact revision is reviewed and dirty edits invalidate that review", async () => {
  render(<BusinessDashboardEditor draft={draft} metrics={[]} company="Business" canEdit canPublish/>);
  const publish = screen.getByRole("button", { name: "Go live for this business" }); expect(publish.hasAttribute("disabled")).toBe(true);
  fireEvent.click(screen.getByRole("button", { name: "Review saved design" }));
  await waitFor(() => expect(publish.hasAttribute("disabled")).toBe(false));
  expect(m.review).toHaveBeenCalledWith(undefined, { definitionId: id, revision: 3 });
  fireEvent.click(screen.getByRole("button", { name: "Change design" }));
  expect(publish.hasAttribute("disabled")).toBe(true); expect(screen.getByRole("button", { name: "Review saved design" }).hasAttribute("disabled")).toBe(true);
  fireEvent.click(publish); expect(m.publish).not.toHaveBeenCalled();
});
it("requires explicit warning acknowledgment and restore confirmation, keeping a failed publish for correction", async () => {
  m.review.mockResolvedValue({ warnings: ["Check the period"] }); m.publish.mockRejectedValue(new Error("CONFLICT"));
  render(<BusinessDashboardEditor draft={draft} metrics={[]} company="Business" business="selected" canEdit canPublish/>);
  fireEvent.click(screen.getByRole("button", { name: "Review saved design" })); await screen.findByText("Check the period");
  const publish = screen.getByRole("button", { name: "Go live for this business" }); expect(publish.hasAttribute("disabled")).toBe(true);
  fireEvent.click(screen.getByRole("checkbox", { name: "I have reviewed these notes." })); fireEvent.click(publish);
  await screen.findByText(/Someone else saved/); expect(m.publish).toHaveBeenCalledWith("selected", { definitionId: id, revision: 3, acknowledgeWarnings: true }); expect(m.refresh).not.toHaveBeenCalled();
  fireEvent.change(screen.getByRole("combobox", { name: "Choose a design" }), { target: { value: version } });
  expect(screen.getByRole("button", { name: "Restore selected design" }).hasAttribute("disabled")).toBe(true);
  fireEvent.click(screen.getByRole("checkbox", { name: "Make this previous design live for the business." })); fireEvent.click(screen.getByRole("button", { name: "Restore selected design" }));
  await waitFor(() => expect(m.restore).toHaveBeenCalledWith("selected", { definitionId: id, versionId: version, definitionRevision: 2 }));
});
it.each(["denial", "different head"])("clears displayed customer figures after %s on explicit fresh read", async reason => {
  render(<PublishedBusinessDashboard initial={live}/>); expect(screen.getByText("Charts for Overview")).toBeTruthy(); expect(m.current).not.toHaveBeenCalled();
  if (reason === "denial") m.current.mockRejectedValue(new Error("FORBIDDEN")); else m.current.mockResolvedValue({ ...live, definitionRevision: 3 });
  fireEvent.click(screen.getByRole("button", { name: "Refresh figures" })); await screen.findByRole("alert");
  expect(screen.queryByText("Charts for Overview")).toBeNull();
  expect(m.current).toHaveBeenCalledWith({ definitionId: id, expectedHead: { versionId: version, definitionRevision: 2, checksum: hash } });
});
