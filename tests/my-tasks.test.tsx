// @vitest-environment jsdom
import React from "react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
const mocks = vi.hoisted(() => ({ list: vi.fn(), detail: vi.fn(), save: vi.fn() }));
vi.mock("next/navigation", () => ({ usePathname: () => "/home" }));
vi.mock("@/app/(app)/profile/task-actions", () => ({ loadMyTasks: mocks.list, loadMyTask: mocks.detail, updateMyTaskStatus: mocks.save }));
import { MyTasksPanel } from "@/components/shell/my-tasks";
const task = { id: "mine", source: "projects", title: "Review installation", context: "Customer delivery", kind: "task", status: "TODO", priority: "NORMAL", dueAt: null, hasAttachments: true };
const detail = { ...task, description: "Read the customer notes", version: 2, editable: true, href: "/projects/tasks/mine", statuses: ["TODO", "DONE"], notes: [], attachments: [{ key: "order", title: "Order 23", detail: "Sales order", href: "/sales/orders/23" }], checklist: [] };
beforeEach(() => {
  Object.defineProperty(HTMLDialogElement.prototype, "showModal", { configurable: true, value() { this.open = true; } });
  Object.defineProperty(HTMLDialogElement.prototype, "close", { configurable: true, value() { this.open = false; } });
  mocks.list.mockResolvedValue({ items: [task], openCount: 1, completedCount: 0, hasMore: false }); mocks.detail.mockResolvedValue(detail);
});
afterEach(() => { cleanup(); vi.clearAllMocks(); });
async function open() { render(<MyTasksPanel />); await waitFor(() => expect(document.querySelector("dialog")).not.toBeNull()); fireEvent(window, new CustomEvent("atlas:open-tasks")); await screen.findByRole("button", { name: /Review installation/ }); }
it("opens assigned notes and linked records, then saves status with the source version", async () => {
  mocks.save.mockResolvedValue({ saved: true, detail: { ...detail, status: "DONE", version: 3 } });
  await open(); fireEvent.click(screen.getByRole("button", { name: /Review installation/ }));
  await screen.findByText("Read the customer notes"); expect(screen.getByRole("link", { name: /Order 23/ }).getAttribute("href")).toBe("/sales/orders/23");
  fireEvent.change(screen.getByRole("combobox", { name: "Task status" }), { target: { value: "DONE" } });
  await screen.findByText("Status saved."); expect(mocks.save).toHaveBeenCalledWith({ source: "projects", id: "mine", version: 2, status: "DONE" });
});
it("keeps the confirmed status when the server refuses completion", async () => {
  mocks.save.mockResolvedValue({ saved: false, error: "Finish the checklist first." }); await open(); fireEvent.click(screen.getByRole("button", { name: /Review installation/ })); await screen.findByText("Read the customer notes");
  fireEvent.change(screen.getByRole("combobox", { name: "Task status" }), { target: { value: "DONE" } });
  await screen.findByRole("alert"); expect((screen.getByRole("combobox") as HTMLSelectElement).value).toBe("TODO"); expect(screen.queryByText("Status saved.")).toBeNull();
});
it("shows read-only assignments without a status mutation control", async () => {
  mocks.detail.mockResolvedValue({ ...detail, editable: false }); await open(); fireEvent.click(screen.getByRole("button", { name: /Review installation/ })); await screen.findByText("Read the customer notes"); expect(screen.queryByRole("combobox")).toBeNull(); expect(mocks.save).not.toHaveBeenCalled();
});
