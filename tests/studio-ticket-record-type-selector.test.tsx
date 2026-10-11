// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { TicketProgressForm } from "@/components/service-work/ticket-progress-form";
import type { RecordTypeSelection } from "@/core/studio/record-types/selection-contract";
const m = vi.hoisted(() => ({ change: vi.fn(), update: vi.fn() }));
vi.mock("@/core/service-work/actions", () => ({ updateWork: m.update }));
vi.mock("@/core/service-work/record-type-actions", () => ({ changeTicketBusinessType: m.change }));
vi.mock("@/core/service-work/field-form-actions", () => ({ searchTicketFieldReferences: vi.fn() }));
const uuid = (n: number) => `70000000-0000-4000-8000-${String(n).padStart(12, "0")}`;
const selection: RecordTypeSelection = { operationId: uuid(90), recordId: "native", recordRevision: 7, extensionRevision: 0,
  currentDefinitionId: null, choices: [{ definitionId: uuid(3), label: "Customer complaint", help: "Use for customer complaints" }] };
const props = { work: { id: "native", version: 7, status: "NEW", ownerUserId: null }, owners: [], fieldManifest: null };
beforeEach(() => vi.clearAllMocks()); afterEach(cleanup);
it("renders familiar labels as separate owning forms and hides technical identities", () => {
  const { container } = render(<TicketProgressForm {...props} recordTypeSelection={selection}/>);
  expect(container.querySelectorAll("form")).toHaveLength(2); expect(container.querySelector("form form")).toBeNull();
  expect(screen.getByRole("combobox", { name: "Business type" })).toBeTruthy();
  fireEvent.change(screen.getByRole("combobox", { name: "Business type" }), { target: { value: uuid(3) } });
  expect(container.textContent).toContain("Use for customer complaints"); expect(container.textContent).not.toContain(uuid(3));
  expect(container.textContent).not.toMatch(/stable key|checksum|revision/i);
  expect(screen.getByRole("combobox", { name: "Status" })).toBeTruthy();
});
it("submits exact type CAS only, keeping selected type and native unsaved values when save fails", async () => {
  m.change.mockResolvedValue({ error: "The ticket changed. Refresh before saving." });
  render(<TicketProgressForm {...props} recordTypeSelection={selection}/>);
  const type = screen.getByRole("combobox", { name: "Business type" }) as HTMLSelectElement;
  fireEvent.change(type, { target: { value: uuid(3) } });
  fireEvent.change(screen.getByLabelText("Resolution / reason"), { target: { value: "Unsaved work" } });
  fireEvent.submit(screen.getByRole("button", { name: "Apply business type" }).closest("form")!);
  await waitFor(() => expect(screen.getByRole("alert").textContent).toContain("ticket changed"));
  const form = m.change.mock.calls[0][0] as FormData;
  expect([...form.entries()]).toEqual([["operationId", uuid(90)], ["recordId", "native"], ["recordRevision", "7"],
    ["extensionRevision", "0"], ["definitionId", uuid(3)]]);
  expect(type.value).toBe(uuid(3)); expect((screen.getByLabelText("Resolution / reason") as HTMLTextAreaElement).value).toBe("Unsaved work");
  expect(m.update).not.toHaveBeenCalled();
});
it("preserves the native form when optional selection is absent and rejects mismatched server manifests", () => {
  const { container } = render(<TicketProgressForm {...props}/>); expect(container.querySelectorAll("form")).toHaveLength(1);
  expect(() => TicketProgressForm({ ...props, recordTypeSelection: { ...selection, recordRevision: 8 } })).toThrow("CONFLICT");
});
