// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { RequestForm } from "@/components/service-work/request-form";
import type { TicketFieldFormManifest } from "@/core/service-work/field-form-contract";
const m = vi.hoisted(() => ({ create: vi.fn() }));
vi.mock("@/core/service-work/actions", () => ({ createWork: m.create }));
vi.mock("@/core/service-work/field-form-actions", () => ({ searchTicketFieldReferences: vi.fn() }));
const uuid = (n: number) => `80000000-0000-4000-8000-${String(n).padStart(12, "0")}`;
const manifest: TicketFieldFormManifest = { schemaVersion: 1, operation: "create", recordRevision: null, extensionRevision: null,
  manifestChecksum: "a".repeat(64), operationId: uuid(1), fields: [], recordTypes: { schemaVersion: 1, manifestChecksum: "b".repeat(64),
    choices: [{ definitionId: uuid(2), label: "Customer complaint", help: "Resolve an issue for your customer", requiredFields: [{ definitionId: uuid(3), label: "Customer reference" }] }] } };
const props = { queues: [{ id: "team", name: "Support", services: [] }] };
beforeEach(() => vi.clearAllMocks()); afterEach(cleanup);
it("keeps exact accessible team and service labels independent of option text", () => {
  render(<RequestForm {...props}/>);
  expect(screen.getByRole("combobox", { name: "Receiving team" })).toBe(screen.getByLabelText("Receiving team", { exact: true }));
  expect(screen.getByRole("combobox", { name: "Service / request" })).toBe(screen.getByLabelText("Service / request", { exact: true }));
});
it("uses familiar names, preserves explicit standard selection and includes a complete empty owning packet", () => {
  const { container } = render(<RequestForm {...props} fieldManifest={manifest}/>);
  expect(container.querySelectorAll("form")).toHaveLength(1);
  const form = new FormData(container.querySelector("form")!);
  expect(JSON.parse(String(form.get("studioRecordType")))).toEqual({ schemaVersion: 1, manifestChecksum: "b".repeat(64), definitionId: null });
  expect(JSON.parse(String(form.get("studioFields")))).toEqual({ schemaVersion: 1, operationId: uuid(1), manifestChecksum: "a".repeat(64), extensionRevision: null, fields: [] });
  fireEvent.change(screen.getByRole("combobox", { name: "Business type" }), { target: { value: uuid(2) } });
  expect(container.textContent).toContain("Resolve an issue for your customer"); expect(container.textContent).toContain("Required information: Customer reference");
  expect(container.textContent).not.toContain(uuid(2)); expect(container.textContent).not.toMatch(/stable key|checksum|revision/i);
});
it("retains selected type and unsaved native inputs when the owning save reports a conflict", async () => {
  m.create.mockResolvedValue({ error: "The business setup changed. Refresh before saving." });
  render(<RequestForm {...props} fieldManifest={manifest}/>);
  const type = screen.getByRole("combobox", { name: "Business type" }) as HTMLSelectElement;
  fireEvent.change(type, { target: { value: uuid(2) } }); fireEvent.change(screen.getByLabelText("Subject"), { target: { value: "Unsaved request" } });
  fireEvent.submit(screen.getByRole("button", { name: "Create ticket" }).closest("form")!);
  await waitFor(() => expect(screen.getByRole("alert").textContent).toContain("business setup changed"));
  expect(type.value).toBe(uuid(2)); expect((screen.getByLabelText("Subject") as HTMLInputElement).value).toBe("Unsaved request");
  expect(JSON.parse(String((m.create.mock.calls[0][0] as FormData).get("studioRecordType"))).definitionId).toBe(uuid(2));
});
it("leaves legacy no-config and Query forms untouched without creation selectors", () => {
  const { container, rerender } = render(<RequestForm {...props}/>);
  expect(container.querySelector('[name="studioRecordType"]')).toBeNull(); expect(container.querySelector('[name="studioFields"]')).toBeNull();
  rerender(<RequestForm {...props} kind="QUERY" fieldManifest={manifest}/>);
  expect(container.querySelector('[name="studioRecordType"]')).toBeNull(); expect(container.querySelector('[name="studioFields"]')).toBeNull();
});
