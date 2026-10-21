import { beforeEach, expect, it, vi } from "vitest";
import type { Session } from "@/core/auth/session";
import { ticketRecordTypeSelection, reassignTicketRecordType, parseTicketRecordTypeForm } from "@/core/service-work/record-types";
const m = vi.hoisted(() => ({ withAuthority: vi.fn(), catalogue: vi.fn(), reassign: vi.fn(), module: vi.fn(), describe: vi.fn() }));
vi.mock("@/core/studio/fields/runtime-authority", () => ({ withFieldRuntimeAuthority: m.withAuthority }));
vi.mock("@/core/studio/record-types/selection", () => ({ readRecordTypeSelectionInTransaction: m.catalogue, reassignRecordTypeInTransaction: m.reassign }));
const uuid = (n: number) => `60000000-0000-4000-8000-${String(n).padStart(12, "0")}`;
const session: Session = { userId: "actor", userName: "Actor", userEmail: "actor@example.test", organisationId: "company",
  organisationName: "Company", membershipId: "member", capabilities: new Set(["tickets.ticket.read", "tickets.ticket.manage"]) };
const entity = { id: "tickets.ticket", version: 9, schemaHash: "a".repeat(64), contractHash: "b".repeat(64) };
const transaction = { moduleState: { findFirst: m.module } };
const authority = { session, transaction, registry: { describe: m.describe } };
const request = { operationId: uuid(90), recordId: "native", recordRevision: 7, extensionRevision: 4, definitionId: uuid(3) };
beforeEach(() => {
  vi.clearAllMocks(); m.withAuthority.mockImplementation(async (_, operation) => operation(authority));
  m.module.mockResolvedValue({ id: "tickets" }); m.describe.mockReturnValue({ ...entity, label: "Ticket", details: { private: "server metadata" } });
  m.catalogue.mockResolvedValue({ choices: [] }); m.reassign.mockResolvedValue({ replayed: false });
});
it("uses the server canonical Ticket contract and genuine current transaction, excluding raw owner metadata", async () => {
  await ticketRecordTypeSelection(session, "native", 7);
  expect(m.catalogue).toHaveBeenCalledWith(session, transaction, entity, { recordId: "native", recordRevision: 7 });
  expect(m.module.mock.calls[0][0]).toMatchObject({ where: { organisationId: "company", moduleId: "tickets", enabled: true, entitled: true } });
  await reassignTicketRecordType(session, request);
  expect(m.reassign).toHaveBeenCalledWith(session, transaction, entity, request);
});
it("leaves the optional control absent for explicit native grant/module unavailability", async () => {
  const readOnly = { ...session, capabilities: new Set(["tickets.ticket.read"]) };
  expect(await ticketRecordTypeSelection(readOnly, "native", 7)).toBeNull(); expect(m.withAuthority).not.toHaveBeenCalled();
  m.module.mockResolvedValue(null); expect(await ticketRecordTypeSelection(session, "native", 7)).toBeNull(); expect(m.catalogue).not.toHaveBeenCalled();
});
it("never masks a corrupt/current-denied association or bypasses fresh native grants on mutation", async () => {
  m.catalogue.mockRejectedValue(new Error("RECORD_PROFILE_INVALID: broken association"));
  await expect(ticketRecordTypeSelection(session, "native", 7)).rejects.toThrow("broken association");
  m.withAuthority.mockImplementation(async (_, operation) => operation({ ...authority, session: { ...session, capabilities: new Set(["tickets.ticket.read"]) } }));
  await expect(reassignTicketRecordType(session, request)).rejects.toThrow("FORBIDDEN"); expect(m.reassign).not.toHaveBeenCalled();
});
function form() {
  const data = new FormData(); for (const [key, value] of Object.entries(request)) data.set(key, String(value)); return data;
}
it("keeps explicit standard/null selection and zero extension revision without coercion", () => {
  const data = form(); data.set("definitionId", ""); data.set("extensionRevision", "0");
  expect(parseTicketRecordTypeForm(data)).toEqual({ ...request, definitionId: null, extensionRevision: 0 });
  data.set("extensionRevision", ""); expect(parseTicketRecordTypeForm(data).extensionRevision).toBeNull();
});
it.each(["duplicate", "organisation", "pin", "unsafe", "coercion", "absent", "file"])("rejects %s transport", mode => {
  const data = form();
  if (mode === "duplicate") data.append("definitionId", uuid(3));
  if (mode === "organisation") data.set("organisationId", "foreign");
  if (mode === "pin") data.set("versionId", uuid(103));
  if (mode === "unsafe") data.set("recordRevision", "9007199254740992");
  if (mode === "coercion") data.set("recordRevision", "0x7");
  if (mode === "absent") data.delete("extensionRevision");
  if (mode === "file") data.set("definitionId", new Blob(["private"]), "file.txt");
  expect(() => parseTicketRecordTypeForm(data)).toThrow();
});
