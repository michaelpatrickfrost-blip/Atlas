// @vitest-environment jsdom
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
const m = vi.hoisted(() => ({ native: vi.fn() }));
vi.mock("@/app/(app)/templates/actions", () => ({ saveTemplate: m.native }));
import { TemplateEditor } from "@/modules/templates/components/editor";
afterEach(cleanup);
beforeEach(() => { vi.clearAllMocks(); m.native.mockResolvedValue(undefined); });

// Existing editor/ActionForm/domain sample preview are real. Actions are explicit
// collaborators; no server persistence, native permission or browser pixels proven.
it("preserves the original native library and save when no Studio props are supplied", async () => {
  render(<TemplateEditor />);
  expect(screen.getByRole("link", { name: "← Template library" }).getAttribute("href")).toBe("/templates");
  fireEvent.change(screen.getByLabelText("Template name"), { target: { value: "Supply agreement" } });
  fireEvent.submit(screen.getByRole("button", { name: "Save template" }).closest("form")!);
  await waitFor(() => expect(m.native).toHaveBeenCalledOnce());
  const data = m.native.mock.calls[0][0] as FormData;
  expect(data.get("name")).toBe("Supply agreement"); expect(data.get("status")).toBe("DRAFT");
  expect(JSON.parse(String(data.get("blocks")))).toHaveLength(3);
});
it("uses the supplied Studio save/library and keeps the entered draft after a rejected save", async () => {
  const save = vi.fn().mockResolvedValue({ error: "Another editor saved first. Compare the saved template." });
  render(<TemplateEditor saveAction={save} libraryHref="/design-studio/documents" />);
  expect(screen.getByRole("link", { name: "← Template library" }).getAttribute("href")).toBe("/design-studio/documents");
  fireEvent.change(screen.getByLabelText("Template name"), { target: { value: "Our business document" } });
  fireEvent.change(screen.getByLabelText("Section 2 text"), { target: { value: "Our unsaved terms" } });
  fireEvent.submit(screen.getByRole("button", { name: "Save template" }).closest("form")!);
  await waitFor(() => expect(screen.getByRole("alert").textContent).toContain("Another editor"));
  expect(m.native).not.toHaveBeenCalled();
  expect((screen.getByLabelText("Template name") as HTMLInputElement).value).toBe("Our business document");
  expect((screen.getByLabelText("Section 2 text") as HTMLTextAreaElement).value).toBe("Our unsaved terms");
  expect(JSON.parse(String((save.mock.calls[0][0] as FormData).get("blocks")))[1].text).toBe("Our unsaved terms");
});
it("plain-language detail choices retain exact merge values and update the existing sample preview", () => {
  render(<TemplateEditor />);
  const choice = screen.getByLabelText("Choose a detail") as HTMLSelectElement;
  expect(screen.getByRole("option", { name: "Customer name" }).getAttribute("value")).toBe("customer.name");
  expect(screen.getByRole("option", { name: "Record number" }).getAttribute("value")).toBe("record.reference");
  fireEvent.focus(screen.getByLabelText("Section 1 text"));
  fireEvent.change(choice, { target: { value: "customer.code" } });
  fireEvent.click(screen.getByRole("button", { name: "Insert in selected section" }));
  expect((screen.getByLabelText("Section 1 text") as HTMLTextAreaElement).value).toBe("Agreement{{customer.code}}");
  expect(screen.getByRole("heading", { name: "AgreementCUS-001" })).toBeTruthy();
  const advanced = screen.getByText("Advanced formatting").closest("details")!;
  expect(advanced.open).toBe(false); expect(advanced.textContent).toContain("custom.your_field");
});
