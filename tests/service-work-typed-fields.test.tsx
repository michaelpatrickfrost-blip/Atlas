// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { TicketTypedFields } from "@/components/service-work/typed-fields";
import { ActionForm } from "@/components/ui/action-form";
import { parseFieldFormPacketJson, type FieldFormPacket } from "@/core/studio/fields/form-packet";
import { fieldStorageSchema, type FieldValue } from "@/core/studio/fields/schema";
import type { TicketFieldFormControl, TicketFieldFormManifest } from "@/core/service-work/field-form-contract";

// DOM/transport evidence only. Manifests and search are explicit server fixtures;
// no server permissions, discovery, domain operation or persistence is exercised.
afterEach(cleanup);
const uuid = (n: number) => `00000000-0000-4000-8000-${n.toString(16).padStart(12, "0")}`;
const reference = { id: "core.customer", version: 1, schemaHash: "a".repeat(64), contractHash: "b".repeat(64) };
const field = (storage: unknown = { type: "string" }, value: FieldValue | null = null, index = 0): TicketFieldFormControl => ({
  definitionId: uuid(index + 10), operationId: uuid(index + 100), versionId: uuid(index + 200), generationId: uuid(index + 300),
  definitionRevision: 4, slotRevision: value ? 2 : null, valueRevision: value ? 2 : null,
  label: "Business detail", help: "Useful guidance for your business.", storage: fieldStorageSchema.parse(storage), required: false, conditionalRequired: false, value,
});
const manifest = (fields = [field()], operation: "create" | "update" = "update"): TicketFieldFormManifest => ({ schemaVersion: 1, operation, operationId: uuid(1),
  manifestChecksum: "a".repeat(64), recordRevision: operation === "create" ? null : 7, extensionRevision: operation === "create" ? null : 3, fields });
function packet(container: HTMLElement): FieldFormPacket {
  const hidden = container.querySelector<HTMLInputElement>('input[name="studioFields"]');
  if (!hidden) throw new Error("Missing packet");
  return parseFieldFormPacketJson(hidden.value, 100);
}
const change = (label: string, value: string) => fireEvent.change(screen.getByLabelText(label), { target: { value } });

it("keeps untouched edit values omitted and supports explicit Clear and Undo without technical jargon", () => {
  const input = manifest([field({ type: "integer" }, { type: "integer", value: 0 })]);
  const { container } = render(<form><TicketTypedFields manifest={input}/></form>);
  expect((screen.getByLabelText("Business detail") as HTMLInputElement).value).toBe("0");
  expect(packet(container).fields).toEqual([]);
  expect(container.textContent).not.toMatch(/00000000|stable key|definitionId|schemaVersion/);
  fireEvent.click(screen.getByRole("button", { name: "Clear Business detail" }));
  expect(packet(container).fields[0].value).toBeNull();
  fireEvent.click(screen.getByRole("button", { name: "Undo changes to Business detail" }));
  expect(packet(container).fields).toEqual([]);
  expect((screen.getByLabelText("Business detail") as HTMLInputElement).value).toBe("0");
  change("Business detail", "2");
  expect(packet(container).fields[0]).toEqual({ operationId: input.fields[0].operationId, definitionId: input.fields[0].definitionId,
    definitionRevision: 4, versionId: input.fields[0].versionId, generationId: input.fields[0].generationId, slotRevision: 2, valueRevision: 2, value: { type: "integer", value: 2 } });
  change("Business detail", "0"); expect(packet(container).fields).toEqual([]);
  expect([...new FormData(container.querySelector("form")!).keys()]).toEqual(["studioFields"]);
});
it("distinguishes missing boolean from false and submits entered create fields only", () => {
  const { container } = render(<form><TicketTypedFields manifest={manifest([field({ type: "boolean" })], "create")}/></form>);
  expect(packet(container).fields).toEqual([]);
  change("Business detail", "no"); expect(packet(container).fields[0].value).toEqual({ type: "boolean", value: false });
  change("Business detail", "yes"); expect(packet(container).fields[0].value).toEqual({ type: "boolean", value: true });
  change("Business detail", ""); expect(packet(container).fields[0].value).toBeNull();
});
it.each([
  ["string", { type: "string", multiline: true }, "hello\nworld", { type: "string", value: "hello\nworld" }],
  ["integer", { type: "integer" }, "0", { type: "integer", value: 0 }],
  ["decimal", { type: "decimal" }, "0.0100", { type: "decimal", value: "0.0100" }],
  ["date", { type: "date" }, "2024-02-29", { type: "date", value: "2024-02-29" }],
  ["datetime", { type: "datetime", timezone: "UTC" }, "2026-10-11T12:30:00.123", { type: "datetime", value: "2026-10-11T12:30:00.123Z" }],
  ["duration", { type: "duration", unit: "seconds" }, "0", { type: "duration", value: 0 }],
  ["email", { type: "email" }, "User@example.invalid", { type: "email", value: "User@example.invalid" }],
  ["url", { type: "url" }, "https://example.invalid/path", { type: "url", value: "https://example.invalid/path" }],
  ["phone", { type: "phone", format: "E164" }, "+441234567890", { type: "phone", value: "+441234567890" }],
] as const)("enters the approved %s control and preserves its typed value", (_type, storage, text, expected) => {
  const { container } = render(<form><TicketTypedFields manifest={manifest([field(storage)], "create")}/></form>);
  change("Business detail", text);
  expect(packet(container).fields[0].value).toEqual(expected);
  if (storage.type === "datetime") expect(screen.getByText("Date and time in UTC.")).toBeTruthy();
});
it("edits money with a controlled currency and preserves decimal formatting", () => {
  const { container } = render(<form><TicketTypedFields manifest={manifest([field({ type: "money", currencies: ["GBP", "EUR"] }, { type: "money", value: { amount: "0.00", currency: "GBP" } })])}/></form>);
  change("Business detail amount", "1.2500"); change("Business detail currency", "EUR");
  expect(packet(container).fields[0].value).toEqual({ type: "money", value: { amount: "1.2500", currency: "EUR" } });
});
it("uses approved option labels, preserves existing retired choices and supports multiple selections", () => {
  const options = [{ id: "one", label: "First choice" }, { id: "two", label: "Second choice" }, { id: "old", label: "Former choice", retired: true }];
  const { container } = render(<form><TicketTypedFields manifest={manifest([field({ type: "enum", valueSetVersion: 1, options }, { type: "enum", value: "old" }),
    { ...field({ type: "multi_enum", valueSetVersion: 1, options }, null, 1), label: "Preferences" }])}/></form>);
  expect((screen.getByRole("option", { name: "Former choice (no longer available)" }) as HTMLOptionElement).disabled).toBe(true);
  change("Business detail", "two"); fireEvent.click(screen.getByLabelText("First choice")); fireEvent.click(screen.getByLabelText("Second choice"));
  expect(packet(container).fields.map(entry => entry.value)).toEqual([{ type: "enum", value: "two" }, { type: "multi_enum", value: ["one", "two"] }]);
});
it("builds a complete explicit address and rejects a partially entered address without dropping it silently", () => {
  const action = vi.fn().mockResolvedValue(undefined);
  const { container } = render(<ActionForm action={action} label="Save"><TicketTypedFields manifest={manifest([field({ type: "address", countries: ["GB", "FR"] })])}/></ActionForm>);
  change("Business detail street address", "1 Main Street"); fireEvent.submit(container.querySelector("form")!);
  expect(action).not.toHaveBeenCalled(); expect(screen.getByRole("alert").textContent).toContain("Complete the street");
  expect((screen.getByLabelText("Business detail street address") as HTMLInputElement).value).toBe("1 Main Street");
  change("Business detail city", "Paris"); change("Business detail country", "FR");
  expect(packet(container).fields[0].value).toEqual({ type: "address", value: { line1: "1 Main Street", line2: "", city: "Paris", region: "", postalCode: "", country: "FR" } });
});
it("selects references only through the supplied authenticated search and never renders raw saved IDs", async () => {
  const search = vi.fn().mockResolvedValue([{ id: "party-approved", label: "Northbridge" }]);
  const saved = "private-technical-record-id";
  const { container } = render(<form><TicketTypedFields manifest={manifest([field({ type: "reference", entity: reference }, { type: "reference", value: saved })])} searchReferences={search}/></form>);
  expect(screen.getByText("Current selection")).toBeTruthy(); expect(container.textContent).not.toContain(saved);
  change("Search Business detail", "North"); expect(packet(container).fields).toEqual([]);
  fireEvent.click(screen.getByRole("button", { name: "Search" }));
  await waitFor(() => expect(screen.getByRole("button", { name: "Choose Northbridge" })).toBeTruthy());
  expect(search).toHaveBeenCalledWith(uuid(10), "North");
  fireEvent.click(screen.getByRole("button", { name: "Choose Northbridge" }));
  expect(packet(container).fields[0].value).toEqual({ type: "reference", value: "party-approved" });
  expect(screen.getByText("Northbridge", { selector: "p" })).toBeTruthy();
});
it("does not offer arbitrary reference entry without a search provider", () => {
  render(<form><TicketTypedFields manifest={manifest([field({ type: "reference", entity: reference })])}/></form>);
  expect(screen.queryByRole("textbox")).toBeNull(); expect(screen.getByText("Selection is unavailable in this form.")).toBeTruthy();
});
it("ignores stale search responses and shows safe retry guidance on search failure", async () => {
  let finish: (value: { id: string; label: string }[]) => void = () => {};
  const search = vi.fn().mockImplementationOnce(() => new Promise(resolve => { finish = resolve; })).mockRejectedValueOnce(new Error("private details"));
  render(<form><TicketTypedFields manifest={manifest([field({ type: "reference", entity: reference })])} searchReferences={search}/></form>);
  change("Search Business detail", "Old"); fireEvent.click(screen.getByRole("button", { name: "Search" }));
  change("Search Business detail", "New"); finish([{ id: "old", label: "Stale result" }]);
  await waitFor(() => expect(screen.getByRole("button", { name: "Search" })).toBeTruthy()); expect(screen.queryByText("Stale result")).toBeNull();
  fireEvent.click(screen.getByRole("button", { name: "Search" })); await waitFor(() => expect(screen.getByRole("alert").textContent).toContain("Search is unavailable"));
  expect(document.body.textContent).not.toContain("private details");
});
it("blocks malformed numeric input, preserves it for correction and resumes with zero", () => {
  const action = vi.fn().mockResolvedValue(undefined);
  const { container } = render(<ActionForm action={action} label="Save"><TicketTypedFields manifest={manifest([field({ type: "decimal" })])}/></ActionForm>);
  change("Business detail", "1e3"); fireEvent.submit(container.querySelector("form")!);
  expect(action).not.toHaveBeenCalled(); expect((screen.getByLabelText("Business detail") as HTMLInputElement).value).toBe("1e3");
  change("Business detail", "0"); expect(packet(container).fields[0].value).toEqual({ type: "decimal", value: "0" });
  expect((screen.getByLabelText("Business detail") as HTMLInputElement).validationMessage).toBe("");
});
it("retains unsaved controlled values and the same operation after ActionForm failure; pending disables controls", async () => {
  let finish: (value: { error: string }) => void = () => {};
  const action = vi.fn().mockImplementation(() => new Promise(resolve => { finish = resolve; }));
  const { container } = render(<ActionForm action={action} label="Save"><TicketTypedFields manifest={manifest()}/></ActionForm>);
  change("Business detail", "Unsaved work"); fireEvent.submit(container.querySelector("form")!);
  await waitFor(() => expect((container.querySelector("fieldset") as HTMLFieldSetElement).disabled).toBe(true));
  finish({ error: "Another person saved first. Your entries are kept." });
  await waitFor(() => expect(screen.getByRole("alert").textContent).toContain("Another person"));
  expect((screen.getByLabelText("Business detail") as HTMLInputElement).value).toBe("Unsaved work");
  expect(packet(container).operationId).toBe(uuid(1)); expect(packet(container).fields[0].value).toEqual({ type: "string", value: "Unsaved work" });
});
it("keeps original observed metadata and local edits when a refreshed manifest arrives", () => {
  const original = manifest(), { container, rerender } = render(<form><TicketTypedFields manifest={original}/></form>);
  change("Business detail", "Unsaved work");
  rerender(<form><TicketTypedFields manifest={{ ...original, manifestChecksum: "b".repeat(64), fields: [{ ...original.fields[0], value: { type: "string", value: "Other save" }, definitionRevision: 5 }] }}/></form>);
  expect(screen.getByRole("status").textContent).toContain("Your entries are kept");
  expect((screen.getByLabelText("Business detail") as HTMLInputElement).value).toBe("Unsaved work");
  expect(packet(container).manifestChecksum).toBe(original.manifestChecksum); expect(packet(container).fields[0].definitionRevision).toBe(4);
});
it("shows plain required/conditional guidance and preserves no-config forms", () => {
  const { container, rerender } = render(<form><TicketTypedFields manifest={manifest([{ ...field(), required: true, conditionalRequired: true }])}/></form>);
  expect(screen.getByText("Required")).toBeTruthy(); expect(screen.getByText("Required in some situations.")).toBeTruthy();
  expect((screen.getByRole("textbox", { name: /Business detail/ }) as HTMLInputElement).required).toBe(true);
  rerender(<form><TicketTypedFields key="empty" manifest={manifest([])}/></form>); expect(container.querySelector('input[name="studioFields"]')).toBeNull();
});
