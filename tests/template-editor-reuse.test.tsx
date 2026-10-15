// @vitest-environment jsdom
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
const m = vi.hoisted(() => ({ native: vi.fn() }));
vi.mock("@/app/(app)/templates/actions", () => ({ saveTemplate: m.native }));
import { TemplateEditor } from "@/modules/templates/components/editor";
afterEach(cleanup);
beforeEach(() => { vi.clearAllMocks(); m.native.mockResolvedValue(undefined); });

it("keeps saved publication context distinct from an unsaved status choice", () => {
  render(<TemplateEditor initial={{ version: 4, name: "Business terms", description: "", category: "Contract", status: "DRAFT", targetModules: ["sales"], titleTemplate: "Terms", blocks: [{ id: "body", type: "text", text: "Terms" }] }} />);
  fireEvent.change(screen.getByLabelText("Status"), { target: { value: "PUBLISHED" } });
  expect(screen.getByLabelText("Saved template context").textContent).toContain("Version 4 · Currently draft");
  expect(screen.getByLabelText("Saved template context").textContent).toContain("Edits apply only after Save template");
  expect(m.native).not.toHaveBeenCalled();
});

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
  expect(JSON.parse(String((save.mock.calls[0][0] as FormData).get("blocks")))[1].text).toContain("Our unsaved terms");
  expect(JSON.parse(String((save.mock.calls[0][0] as FormData).get("blocks")))[1].text).toContain("{{company.name}}");
});
it("plain-language detail choices retain exact merge values and update the existing sample preview", () => {
  render(<TemplateEditor />);
  const choice = screen.getByLabelText("Choose a detail") as HTMLSelectElement;
  expect(screen.getByRole("option", { name: "Customer name" }).getAttribute("value")).toBe("customer.name");
  expect(screen.getByRole("option", { name: "Record number" }).getAttribute("value")).toBe("record.reference");
  (screen.getByLabelText("Section 1 text") as HTMLTextAreaElement).setSelectionRange(9,9);
  fireEvent.focus(screen.getByLabelText("Section 1 text"));
  fireEvent.change(choice, { target: { value: "customer.code" } });
  fireEvent.click(screen.getByRole("button", { name: "Insert in selected section" }));
  expect((screen.getByLabelText("Section 1 text") as HTMLTextAreaElement).value).toBe("Agreement");
  expect(screen.getByLabelText("Business detail: Customer number")).toBeTruthy();
  expect(JSON.parse(String((screen.getByRole("button", { name: "Save template" }).closest("form")!.elements.namedItem("blocks") as HTMLInputElement).value))[0].text).toBe("Agreement{{customer.code}}");
  expect(screen.getByRole("heading", { name: "AgreementCUS-001" })).toBeTruthy();
  expect(screen.queryByText("custom.your_field")).toBeNull();
  expect(screen.getByLabelText("Custom detail name")).toBeTruthy();
});

it("keeps retained token spelling hidden and inserts a per-document detail without coding", async () => {
  const save = vi.fn().mockResolvedValue({ error: "Keep this draft" });
  render(<TemplateEditor saveAction={save} initial={{ name: "Business", description: "", category: "", status: "DRAFT", targetModules: ["sales"], titleTemplate: "For {{ customer.name }}", blocks: [{ id: "body", type: "text", text: "Deliver to {{customer.address}}." }] }} />);
  expect(screen.getByLabelText("Business detail: Customer name").textContent).toContain("Customer name");
  expect((screen.getByLabelText("Document title") as HTMLTextAreaElement).value).toBe("For ");
  fireEvent.focus(screen.getByLabelText("Section 1 text"));
  fireEvent.change(screen.getByLabelText("Custom detail name"), { target: { value: "Delivery note" } });
  fireEvent.click(screen.getByRole("button", { name: "Add document detail" }));
  fireEvent.change(screen.getByLabelText("Example Delivery note"), { target: { value: "At the rear door" } });
  expect(screen.getByLabelText("Document preview").textContent).toContain("At the rear door");
  fireEvent.submit(screen.getByRole("button", { name: "Save template" }).closest("form")!);
  await waitFor(() => expect(save).toHaveBeenCalledOnce());
  const form = save.mock.calls[0][0] as FormData;
  expect(form.get("titleTemplate")).toBe("For {{ customer.name }}");
  expect(JSON.parse(String(form.get("blocks")))[0].text).toContain("{{custom.delivery_note}}");
  expect(JSON.parse(String(form.get("blocks")))[0].text).toContain("{{customer.address}}");
});
it("edits table cells through the original table format and renders actual rows", async () => {
  const save = vi.fn().mockResolvedValue({ error: "Keep this draft" });
  render(<TemplateEditor saveAction={save} />);
  fireEvent.change(screen.getByLabelText("Section 1 type"), { target: { value: "table" } });
  fireEvent.change(screen.getByLabelText("Section 1 row 1 column 1"), { target: { value: "Item" } });
  fireEvent.click(screen.getByRole("button", { name: "Add table column" }));
  fireEvent.change(screen.getByLabelText("Section 1 row 1 column 2"), { target: { value: "Terms" } });
  fireEvent.click(screen.getByRole("button", { name: "Add table row" }));
  fireEvent.change(screen.getByLabelText("Section 1 row 2 column 1"), { target: { value: "Delivery" } });
  fireEvent.change(screen.getByLabelText("Section 1 row 2 column 2"), { target: { value: "Monday" } });
  expect(screen.getByLabelText("Document preview").querySelectorAll("tr")).toHaveLength(2);
  fireEvent.submit(screen.getByRole("button", { name: "Save template" }).closest("form")!);
  await waitFor(() => expect(save).toHaveBeenCalledOnce());
  expect(JSON.parse(String((save.mock.calls[0][0] as FormData).get("blocks")))[0].text).toBe("Item|Terms\nDelivery|Monday");
});
it("clears old authorised values before refresh and keeps them absent when current access fails", async () => {
  const list = vi.fn().mockResolvedValue([{ module: "sales", type: "order", id: "order", label: "Order" }]);
  const read = vi.fn().mockResolvedValueOnce({ fields: { "customer.name": "Actual business customer" }, sourceLabel: "Order", companyName: "Business" })
    .mockResolvedValueOnce({ error: "Current source access denied" });
  render(<TemplateEditor listPreviewRecords={list} previewRecord={read} />);
  fireEvent.change(screen.getByLabelText("Preview content"), { target: { value: "record" } });
  await waitFor(() => expect(screen.getByRole("option", { name: "Order" })).toBeTruthy());
  fireEvent.change(screen.getByLabelText("Preview record"), { target: { value: "sales/order/order" } });
  await waitFor(() => expect(screen.getByLabelText("Document preview").textContent).toContain("Actual business customer"));
  const refresh = screen.getByRole("button", { name: "Refresh business preview" }) as HTMLButtonElement;
  await waitFor(() => expect(refresh.disabled).toBe(false));
  fireEvent.click(refresh);
  await waitFor(() => expect(screen.getByRole("alert").textContent).toContain("Current source access denied"));
  expect(screen.queryByLabelText("Document preview")).toBeNull();
  expect(read.mock.calls[0][0]).toMatchObject({ sourceModule: "sales", sourceType: "order", sourceId: "order" });
  expect(m.native).not.toHaveBeenCalled();
});

it("removing a named detail keeps the next protected detail intact when inserting again", async () => {
  const save = vi.fn().mockResolvedValue({ error: "Kept" });
  render(<TemplateEditor saveAction={save} initial={{ name: "Business", description: "", category: "", status: "DRAFT", targetModules: ["sales"], titleTemplate: "Business", blocks: [{ id: "body", type: "text", text: "Hi {{customer.name}} - {{record.reference}} end" }] }} />);
  const middle = screen.getByLabelText("Section 1 text wording 2") as HTMLTextAreaElement;
  middle.setSelectionRange(3,3); fireEvent.focus(middle);
  fireEvent.click(screen.getByRole("button", { name: "Remove Customer name detail" }));
  fireEvent.change(screen.getByLabelText("Choose a detail"), { target: { value: "customer.code" } });
  fireEvent.click(screen.getByRole("button", { name: "Insert in selected section" }));
  fireEvent.submit(screen.getByRole("button", { name: "Save template" }).closest("form")!);
  await waitFor(() => expect(save).toHaveBeenCalledOnce());
  const text = JSON.parse(String((save.mock.calls[0][0] as FormData).get("blocks")))[0].text;
  expect(text).toBe("Hi {{customer.code}} - {{record.reference}} end");
});
it("removing a selected table row clears its insertion target and preserves other cells", () => {
  render(<TemplateEditor initial={{ name: "Business", description: "", category: "", status: "DRAFT", targetModules: ["sales"], titleTemplate: "Business", blocks: [{ id: "body", type: "table", text: "Item|{{record.reference}}\nDelivery|Monday" }] }} />);
  fireEvent.focus(screen.getByLabelText("Section 1 row 2 column 2"));
  fireEvent.click(screen.getByRole("button", { name: "Remove table row 2" }));
  fireEvent.click(screen.getByRole("button", { name: "Remove row" }));
  fireEvent.click(screen.getByRole("button", { name: "Insert in selected section" }));
  expect(screen.getByLabelText("Business detail: Record number")).toBeTruthy();
  expect(screen.queryByLabelText("Section 1 row 2 column 2")).toBeNull();
  expect(screen.getByLabelText("Document preview").querySelectorAll("tr")).toHaveLength(1);
});
