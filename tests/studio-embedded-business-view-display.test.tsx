// @vitest-environment jsdom
import React from "react";
import { afterEach, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import type { EmbeddedViewOutput } from "@/core/studio/pages/embedded-views";
import { embeddedBusinessViewDisplay, EmbeddedBusinessView } from "@/modules/analytics/components/embedded-business-view";
import { PageRenderer } from "@/components/studio/page-renderer";
const output: EmbeddedViewOutput = { view: { kind: "view", definitionId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
  versionId: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb", schemaVersion: 1, checksum: "a".repeat(64) },
  sourceView: { id: "analytics.dashboard.view", version: 1, schemaHash: "b".repeat(64), contractHash: "c".repeat(64) },
  content: { name: "Overview", period: "all", filters: { from: "", to: "", search: "" }, refreshSeconds: 0,
    widgets: [{ id: "orders", metricId: "sales.orders", title: "Orders <today>", visual: "kpi", wide: true }] },
  dataByWidget: { orders: [{ label: "NEW", value: 0 }] } };
afterEach(cleanup);
it("displays authorised zero counts through the original charts, with escaped labels and no navigation/forms", () => {
  render(<EmbeddedBusinessView output={output}/>);
  expect(screen.getByRole("heading", { name: "Orders <today>" })).toBeTruthy();
  expect(screen.getByText("0", { exact: true })).toBeTruthy();
  expect(document.querySelector("form,a,script")).toBeNull();
});
it.each(["extra widget", "invalid count", "unknown source", "foreign measure"])("rejects %s rather than falling back to another provider", reason => {
  const broken = structuredClone(output);
  if (reason === "extra widget") broken.dataByWidget.foreign = [];
  else if (reason === "invalid count") broken.dataByWidget.orders = [{ label: "NEW", value: -1 }];
  else if (reason === "unknown source") broken.sourceView.version = 2;
  else broken.content = { ...output.content as object, widgets: [{ id: "orders", metricId: "finance.balance", visual: "kpi", wide: true }] };
  expect(() => embeddedBusinessViewDisplay(broken)).toThrow();
  render(<EmbeddedBusinessView output={broken}/>); expect(screen.getByRole("status").textContent).toContain("cannot be displayed");
  expect(screen.queryByText("0", { exact: true })).toBeNull();
});
it("passes supplied actual-preview figures to charts while keeping design actions disabled", () => {
  const action = vi.fn();
  render(<PageRenderer interaction="design_only" onAction={action} model={{ formFactor: "desktop", variantId: null,
    sections: [{ id: "overview", label: "Overview", help: "", columns: 1, components: [{ id: "board", label: "Saved dashboard", help: "", type: "analyticsView", output },
      { id: "send", label: "Send", help: "", type: "action", command: { id: "sales.order.send", version: 1, schemaHash: "a".repeat(64), contractHash: "a".repeat(64) }, confirm: true, preview: false }] }] }}
    renderAnalyticsView={component => <EmbeddedBusinessView output={component.output}/>}/>);
  expect(screen.getByText("0", { exact: true })).toBeTruthy(); expect(screen.getByRole("button", { name: "Send" }).hasAttribute("disabled")).toBe(true);
  expect(action).not.toHaveBeenCalled();
});
