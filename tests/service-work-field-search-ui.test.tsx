// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { TicketAdditionalDetailSearch } from "@/components/service-work/field-search";
import { readFieldSearchFilter } from "@/components/service-work/field-search-value";
import { fieldStorageSchema } from "@/core/studio/fields/schema";
import type { TicketSearchField } from "@/core/service-work/field-search-contract";
// Pure transport/DOM evidence, server callbacks explicitly mocked. Not engine,
// private policy, PostgreSQL or deployed browser acceptance evidence.
afterEach(cleanup);
const uuid = (n: number) => `00000000-0000-4000-8000-${String(n).padStart(12, "0")}`;
const field = (storage: unknown = { type: "integer" }): TicketSearchField => ({ definitionId: uuid(1), versionId: uuid(2), generationId: uuid(3),
  definitionRevision: 4, label: "Visit count", help: "Recorded by your team", storage: fieldStorageSchema.parse(storage) });
const empty = { records: [], next: null };
function mount(storage: unknown = { type: "integer" }, search = vi.fn(async (_request: import("@/core/studio/fields/search-contract").FieldSearchRequest) => { void _request; return empty; }), references = vi.fn(async (_request: unknown) => { void _request; return [{ id: "hidden-id", label: "TKT-20 · Customer visit" }]; })) {
  return { search, references, ...render(<TicketAdditionalDetailSearch fields={[field(storage)]} search={search} searchReferences={references}/>) };
}
it.each([[{ type: "integer" }, "0", { type: "integer", value: 0 }], [{ type: "boolean" }, "no", { type: "boolean", value: false }]])("preserves meaningful zero/false for %j", async (storage, text, value) => {
  const { search, container } = mount(storage); fireEvent.change(screen.getByLabelText("Search value"), { target: { value: text } });
  fireEvent.click(screen.getByRole("button", { name: "Find tickets" })); await waitFor(() => expect(search).toHaveBeenCalledOnce());
  expect(search.mock.calls[0]).toEqual([{ definitionId: uuid(1), definitionRevision: 4, versionId: uuid(2), generationId: uuid(3), filter: { operator: "equals", value }, limit: 25 }]);
  expect(container.textContent).not.toMatch(/schemaVersion|stable key|00000000|fieldWrite/);
});
it("does not turn an absent search into null; cleared value is explicit", async () => {
  const { search } = mount(); fireEvent.click(screen.getByRole("button", { name: "Find tickets" })); expect((await screen.findByRole("alert")).textContent).toContain("Enter a value"); expect(search).not.toHaveBeenCalled();
  fireEvent.change(screen.getByLabelText("Comparison"), { target: { value: "null" } }); fireEvent.click(screen.getByRole("button", { name: "Find tickets" }));
  await waitFor(() => expect(search).toHaveBeenCalledOnce()); expect(search.mock.calls[0]).toMatchObject([{ filter: { operator: "equals", value: null } }]);
});
it("continues a scanned window even when its matches are empty, then renders authorised native labels", async () => {
  const cursor = { after: "native-a", checksum: "a".repeat(64) };
  const search = vi.fn().mockResolvedValueOnce({ records: [], next: cursor }).mockResolvedValueOnce({ records: [{ id: "native-b", revision: 3, href: "/tickets/native-b", fields: { number: "TKT-2", subject: "Visit", status: "NEW", priority: "NORMAL", type: "TASK", created_at: new Date(0).toISOString(), updated_at: new Date(0).toISOString() } }], next: null });
  mount({ type: "integer" }, search); fireEvent.change(screen.getByLabelText("Search value"), { target: { value: "0" } }); fireEvent.click(screen.getByRole("button", { name: "Find tickets" }));
  fireEvent.click(await screen.findByRole("button", { name: "Continue search" })); await screen.findByRole("link", { name: /TKT-2/ }); expect(search.mock.calls[1][0].cursor).toEqual(cursor);
  expect(screen.queryByRole("button", { name: "Continue search" })).toBeNull();
});
it("keeps entered data after stale/permission failure and does not leak internal errors", async () => {
  const search = vi.fn().mockRejectedValueOnce(new Error("CONFLICT: old private checksum")).mockRejectedValueOnce(new Error("private SQL details"));
  mount({ type: "integer" }, search); fireEvent.change(screen.getByLabelText("Search value"), { target: { value: "0" } }); fireEvent.click(screen.getByRole("button", { name: "Find tickets" }));
  expect((await screen.findByRole("alert")).textContent).toContain("refresh"); expect((screen.getByLabelText("Search value") as HTMLInputElement).value).toBe("0");
  fireEvent.click(screen.getByRole("button", { name: "Find tickets" })); await waitFor(() => expect(screen.getByRole("alert").textContent).toContain("Search is unavailable")); expect(screen.getByRole("alert").textContent).not.toContain("private");
});
it("selects a reference only from the authenticated callback and never asks for its ID", async () => {
  const { search, references, container } = mount({ type: "reference", entity: { id: "tickets.ticket", version: 9, schemaHash: "a".repeat(64), contractHash: "b".repeat(64) } });
  fireEvent.change(screen.getByLabelText("Find linked ticket"), { target: { value: "Customer" } }); fireEvent.click(screen.getByRole("button", { name: "Find records" }));
  fireEvent.click(await screen.findByRole("button", { name: "TKT-20 · Customer visit" })); fireEvent.click(screen.getByRole("button", { name: "Find tickets" }));
  await waitFor(() => expect(search).toHaveBeenCalledOnce()); expect(references.mock.calls[0]).toMatchObject([{ definitionId: uuid(1), definitionRevision: 4, versionId: uuid(2), generationId: uuid(3), search: "Customer" }]);
  expect(search.mock.calls[0]).toMatchObject([{ filter: { value: { type: "reference", value: "hidden-id" } } }]); expect(container.textContent).not.toContain("hidden-id");
});
it("preserves money currency and explicit UTC/duration/enum range contracts", () => {
  expect(readFieldSearchFilter(field({ type: "money", currencies: ["GBP", "EUR"] }), { operator: "gte", text: "0.00", currency: "EUR" })).toEqual({ operator: "gte", value: { type: "money", value: { amount: "0.00", currency: "EUR" } } });
  expect(readFieldSearchFilter(field({ type: "datetime", timezone: "UTC" }), { operator: "lte", text: "2026-10-12T12:34:56", currency: "" }).value).toEqual({ type: "datetime", value: "2026-10-12T12:34:56Z" });
  expect(() => readFieldSearchFilter(field({ type: "boolean" }), { operator: "gte", text: "no", currency: "" })).toThrow("comparison");
  expect(() => readFieldSearchFilter(field(), { operator: "equals", text: "9007199254740992", currency: "" })).toThrow("format");
  expect(() => readFieldSearchFilter(field(), { operator: "equals", text: "1.5", currency: "" })).toThrow("format");
});
it("renders no search when no readable indexed fields are configured", () => {
  const { container } = render(<TicketAdditionalDetailSearch fields={[]} search={vi.fn()} searchReferences={vi.fn()}/>); expect(container.innerHTML).toBe("");
});

it("ignores an obsolete result after the user changes a filter", async () => {
  let resolve!: (result: typeof empty) => void; const search = vi.fn(() => new Promise<typeof empty>(done => { resolve = done; }));
  mount({ type: "integer" }, search); fireEvent.change(screen.getByLabelText("Search value"), { target: { value: "0" } }); fireEvent.click(screen.getByRole("button", { name: "Find tickets" }));
  await waitFor(() => expect(search).toHaveBeenCalledOnce()); fireEvent.change(screen.getByLabelText("Search value"), { target: { value: "1" } });
  resolve(empty); await waitFor(() => expect(screen.queryByText("Search complete. Only tickets you can currently read are shown.")).toBeNull());
  expect((screen.getByLabelText("Search value") as HTMLInputElement).value).toBe("1");
});
