// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { BusinessScreenRecordChooser } from "@/app/(app)/screens/[definitionId]/record-chooser";
const m = vi.hoisted(() => ({ load: vi.fn() }));
vi.mock("@/app/(app)/screens/actions", () => ({ loadBusinessScreenRecords: m.load }));
const first = { definitionId: "80000000-0000-4000-8000-000000000001", definitionRevision: 7,
  versionId: "80000000-0000-4000-8000-000000000002", name: "Our orders", scope: "record" as const,
  records: [{ id: "first", label: "First order" }], hasMore: true, nextCursor: { afterId: "first" } };
beforeEach(() => vi.clearAllMocks()); afterEach(cleanup);
it("passes exact saved screen assertions with owner cursors and can return to first records", async () => {
  m.load.mockResolvedValueOnce({ ...first, records: [{ id: "later", label: "Later order" }], hasMore: false, nextCursor: null }).mockResolvedValueOnce(first);
  render(<BusinessScreenRecordChooser initial={first}/>);
  fireEvent.click(screen.getByRole("button", { name: "Next records" }));
  await waitFor(() => expect(screen.getByRole("link", { name: "Later order" })).toBeTruthy());
  expect(m.load).toHaveBeenLastCalledWith({ definitionId: first.definitionId, cursor: first.nextCursor,
    expectedVersionId: first.versionId, expectedDefinitionRevision: first.definitionRevision });
  expect(screen.queryByRole("link", { name: "First order" })).toBeNull();
  fireEvent.click(screen.getByRole("button", { name: "Back to first records" }));
  await waitFor(() => expect(screen.getByRole("link", { name: "First order" })).toBeTruthy());
  expect(m.load).toHaveBeenLastCalledWith({ definitionId: first.definitionId, cursor: null,
    expectedVersionId: first.versionId, expectedDefinitionRevision: first.definitionRevision });
  expect(screen.queryByRole("button", { name: "Back to first records" })).toBeNull();
});
it("retains current records when the server rejects changed access or a changed publication", async () => {
  m.load.mockRejectedValue(new Error("FORBIDDEN: fresh access required"));
  render(<BusinessScreenRecordChooser initial={first}/>);
  fireEvent.click(screen.getByRole("button", { name: "Next records" }));
  await waitFor(() => expect(screen.getByRole("alert").textContent).toContain("Your current choices are kept"));
  expect(screen.getByRole("link", { name: "First order" }).getAttribute("href")).toBe(`/screens/${first.definitionId}?record=first`);
  expect(screen.queryByRole("button", { name: "Back to first records" })).toBeNull();
});
